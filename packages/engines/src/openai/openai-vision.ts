import OpenAI from "openai";
import path from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { ImageInspectionResult } from "../preprocessing/image-inspector.js";
import { NormalizedObservation } from "../cv/google-vision.js";
import { SynthesisFinding } from "./static-synthesis.js";
import { SIGNAL_SYSTEM_PROMPT } from "./prompts/signal-system-prompt.js";
import { SIGNAL_SYNTHESIS_PROMPT } from "./prompts/signal-synthesis-prompt.js";

function getFreshOpenAIApiKey(): string | undefined {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, "utf-8");
      for (const line of envContent.split("\n")) {
        const match = line.match(/^\s*OPENAI_API_KEY\s*=\s*(.*)?\s*$/);
        if (match) {
          let val = match[1] || "";
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
          if (val.trim()) {
            const freshKey = val.trim();
            process.env.OPENAI_API_KEY = freshKey;
            return freshKey;
          }
        }
      }
    }
  } catch (e) {}
  return process.env.OPENAI_API_KEY;
}

export interface UnifiedOpenAIVisionResult {
  extractedText: string;
  textCoveragePercent: number;
  hasLogo: boolean;
  logoLabel?: string;
  hasFace: boolean;
  dominantColors: string[];
  observations: NormalizedObservation[];
  executiveSummary: string;
  findings: SynthesisFinding[];
  suggestedActionPlan: string[];
  quickWins?: string[];
  abVariantHypotheses?: Array<{
    hypothesis: string;
    changeVector: string;
    expectedMetricImpact: string;
    testPriority: number;
  }>;
  confidenceInterval?: [number, number];
  rawMetrics?: Record<string, any>;
  modelUsed: string;
}

export async function analyzeStaticCreativeWithOpenAI(
  imageBuffer: Buffer,
  inspection: ImageInspectionResult,
  campaignContext?: { brandName?: string; targetPlatform?: string; placement?: string; creativeGoal?: string },
  modelName?: string
): Promise<UnifiedOpenAIVisionResult> {
  const apiKey = getFreshOpenAIApiKey();

  const rawModel = (modelName && modelName.trim()) ? modelName.trim() : (process.env.OPENAI_MODEL || "gpt-4o");
  const selectedModel =
    process.env.OPENAI_SOL_MODEL && (rawModel.includes("5.6") || rawModel.includes("sol"))
      ? process.env.OPENAI_SOL_MODEL
      : (rawModel.includes("5.6") || rawModel.includes("sol"))
        ? (process.env.OPENAI_MODEL || "gpt-4o")
        : rawModel;
  console.log(`[OPENAI_VISION] Initiating Sakhaa Signal creative extraction with model: ${selectedModel} (requested: ${modelName || "default"})`);

  if (!apiKey || apiKey.trim() === "" || apiKey === "local-openai-placeholder") {
    throw new Error(
      "[OPENAI_VISION_ERROR] OPENAI_API_KEY is not configured. Real creative diagnosis requires a valid OPENAI_API_KEY environment variable."
    );
  }

  const configuredTimeout = Number(process.env.OPENAI_VISION_TIMEOUT_MS || 120_000);
  const timeout = Number.isFinite(configuredTimeout) && configuredTimeout > 0
    ? configuredTimeout
    : 120_000;
  const openai = new OpenAI({ apiKey, timeout, maxRetries: 1 });
  const mimeType = inspection.format === "png" ? "image/png" : "image/jpeg";
  const base64Data = imageBuffer.toString("base64");

  const promptPayload = {
    campaignContext: {
      brandName: campaignContext?.brandName || "Unspecified Brand",
      targetPlatform: campaignContext?.targetPlatform || "STATIC_META",
      placement: campaignContext?.placement || "FEED",
      creativeGoal: campaignContext?.creativeGoal || "Direct Response Conversion",
    },
    inspection: {
      width: inspection.width,
      height: inspection.height,
      aspectRatio: inspection.aspectRatioLabel,
      contrast: inspection.contrast,
      blurScore: inspection.blurScore,
      isBlurry: inspection.isBlurry,
    },
  };

  try {
    const isReasoningModel = /sol|o1|o3/i.test(selectedModel);

    // Call 1: Extraction & Diagnostic Scoring (Temperature 0.15, seed 42)
    const extractionOptions: any = {
      model: selectedModel,
      response_format: { type: "json_object" },
      seed: 42,
      messages: [
        {
          role: "system",
          content: SIGNAL_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this static ad creative image and campaign context payload:\n\n${JSON.stringify(promptPayload, null, 2)}`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Data}`,
                detail: "high",
              },
            },
          ],
        },
      ],
    };

    if (!isReasoningModel) {
      extractionOptions.temperature = 0.15;
    } else {
      // GPT-5.6 defaults to medium reasoning. Static extraction is a
      // latency-sensitive structured-output task, so make the intended
      // no-reasoning behavior explicit.
      extractionOptions.reasoning_effort = "none";
    }

    const response = await openai.chat.completions.create(extractionOptions);
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response received from OpenAI API.");

    const parsedExtraction = JSON.parse(content);
    const providerName = `OPENAI_${selectedModel.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;

    // Call 2: Synthesis Call (Temperature 0.35, seed 42)
    console.log(`[OPENAI_VISION] Running synthesis layer for executive summary, findings & quick wins...`);
    const synthesisOptions: any = {
      model: selectedModel,
      response_format: { type: "json_object" },
      seed: 42,
      messages: [
        {
          role: "system",
          content: SIGNAL_SYNTHESIS_PROMPT,
        },
        {
          role: "user",
          content: JSON.stringify(parsedExtraction),
        },
      ],
    };

    if (!isReasoningModel) {
      synthesisOptions.temperature = 0.35;
    } else {
      synthesisOptions.reasoning_effort = "none";
    }

    let parsedSynthesis = parsedExtraction;
    try {
      const synthesisResp = await openai.chat.completions.create(synthesisOptions);
      const synthContent = synthesisResp.choices[0]?.message?.content;
      if (synthContent) {
        parsedSynthesis = JSON.parse(synthContent);
      }
    } catch (synthErr) {
      console.warn(`[OPENAI_VISION] Synthesis call failed, using extraction output fallback:`, synthErr);
    }

    const rawObservations: any[] = parsedExtraction.observations || [];
    const observations: NormalizedObservation[] = rawObservations.map((obs, idx) => ({
      id: obs.id || `obs_${idx + 1}`,
      observationType: obs.observationType || "OCR_TEXT",
      label: obs.label || "",
      confidence: typeof obs.confidence === "number" ? obs.confidence : 0.95,
      boundingBox: obs.boundingBox,
      provider: providerName,
    }));

    const rawFindings: any[] = parsedSynthesis.findings || parsedExtraction.findings || [];
    const findings: SynthesisFinding[] = rawFindings.map((f) => ({
      type: f.type || "RECOMMENDATION",
      category: f.category || "GENERAL",
      title: f.title || "Observation",
      description: f.description || "",
      recommendation: f.recommendation || "",
      impactPriority: f.impactPriority || "MEDIUM",
      effortEstimate: f.effortEstimate || "LOW",
      expectedLift: f.expectedLift || "",
      verticalBenchmarkDelta: typeof f.verticalBenchmarkDelta === "number" ? f.verticalBenchmarkDelta : undefined,
      evidenceRefs: Array.isArray(f.evidenceRefs) ? f.evidenceRefs : [],
      evidenceIds: Array.isArray(f.evidenceIds) ? f.evidenceIds : [],
    }));

    const normalizeStringOrObject = (item: any): string => {
      if (item === null || item === undefined) return "";
      if (typeof item === "string") return item;
      if (typeof item === "object") {
        return item.action || item.recommendation || item.title || item.description || item.text || item.hypothesis || JSON.stringify(item);
      }
      return String(item);
    };

    return {
      extractedText: parsedExtraction.extractedText || "",
      textCoveragePercent: typeof parsedExtraction.textCoveragePercent === "number" ? parsedExtraction.textCoveragePercent : 0,
      hasLogo: Boolean(parsedExtraction.hasLogo),
      logoLabel: parsedExtraction.logoLabel || undefined,
      hasFace: Boolean(parsedExtraction.hasFace),
      dominantColors: Array.isArray(parsedExtraction.dominantColors) ? parsedExtraction.dominantColors : ["#1E293B", "#6366F1"],
      observations,
      executiveSummary: parsedSynthesis.executiveSummary || parsedExtraction.executiveSummary || "Creative analysis completed.",
      findings,
      suggestedActionPlan: Array.isArray(parsedSynthesis.suggestedActionPlan)
        ? parsedSynthesis.suggestedActionPlan.map(normalizeStringOrObject)
        : [],
      quickWins: Array.isArray(parsedSynthesis.quickWins)
        ? parsedSynthesis.quickWins.map(normalizeStringOrObject)
        : [],
      abVariantHypotheses: Array.isArray(parsedSynthesis.abVariantHypotheses) ? parsedSynthesis.abVariantHypotheses : [],
      confidenceInterval: parsedExtraction.scoring?.confidenceInterval || [60, 75],
      rawMetrics: {
        attention: parsedExtraction.attention,
        hierarchy: parsedExtraction.hierarchy,
        message: parsedExtraction.message,
        brand: parsedExtraction.brand,
        social: parsedExtraction.social,
        ppc: parsedExtraction.ppc,
        compliance: parsedExtraction.compliance,
      },
      modelUsed: selectedModel,
    };
  } catch (err: any) {
    console.error(`[OPENAI_VISION_ERROR] Analysis failed with model ${selectedModel}:`, err);
    throw new Error(`[OPENAI_VISION_ERROR] Real creative diagnosis failed with model (${selectedModel}): ${err.message}`);
  }
}
