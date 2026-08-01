import OpenAI from "openai";
import path from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { ImageInspectionResult } from "../preprocessing/image-inspector.js";
import { NormalizedObservation } from "../cv/google-vision.js";
import { SynthesisFinding } from "./static-synthesis.js";

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
  modelUsed: string;
}

export const UNIFIED_STATIC_VISION_PROMPT = `You are an elite Performance Creative Intelligence Strategist and Computer Vision Analyst for paid digital advertising.
Analyze the provided ad creative image along with its technical metadata.
Perform exact OCR text extraction, visual layout/logo/face detection, and diagnostic creative evaluation.

Produce a single, strictly valid JSON response adhering to this schema:
{
  "extractedText": "Exact, complete transcript of all readable text in the image (or empty string if none)",
  "textCoveragePercent": 15, // integer 0 to 100 representing percentage of creative canvas occupied by text
  "hasLogo": true, // boolean
  "logoLabel": "Name of detected brand logo or logotype if visible",
  "hasFace": false, // boolean
  "dominantColors": ["#HEX1", "#HEX2", "#HEX3"], // top 3 dominant hex colors
  "observations": [
    {
      "id": "obs_text_1",
      "observationType": "OCR_TEXT", // OCR_TEXT | LOGO_DETECTION | FACE_DETECTION | OBJECT_DETECTION
      "label": "Text span or element description",
      "confidence": 0.95,
      "boundingBox": { "x": 0.1, "y": 0.2, "width": 0.8, "height": 0.1 } // normalized 0.0 to 1.0 coordinates
    }
  ],
  "executiveSummary": "Concise 2-sentence summary of overall performance potential, key visual hook strength, and primary bottleneck.",
  "findings": [
    {
      "type": "STRENGTH", // STRENGTH | WEAKNESS | RECOMMENDATION
      "category": "HOOK", // HOOK | COPY_CLARITY | CTA | VISUAL_CONSTRUCTION | BRANDING | COMPLIANCE
      "title": "Short descriptive title",
      "description": "Evidence-backed explanation citing specific text or visual details in THIS image",
      "recommendation": "Specific actionable edit instruction for design team (required if WEAKNESS or RECOMMENDATION)",
      "impactPriority": "HIGH", // HIGH | MEDIUM | LOW
      "evidenceIds": ["obs_text_1"]
    }
  ],
  "suggestedActionPlan": [
    "1-line actionable modification step 1",
    "1-line actionable modification step 2",
    "1-line actionable modification step 3"
  ]
}

Rules:
1. "extractedText" MUST contain the ACTUAL text visible in this specific creative image. Do NOT invent or reuse sample copy.
2. Base all findings and recommendations strictly on the empirical image content provided.
3. ALWAYS include at least 2 specific RECOMMENDATION findings with clear edit instructions.
4. Output ONLY valid JSON. No markdown backticks or commentary outside the JSON.`;

export async function analyzeStaticCreativeWithOpenAI(
  imageBuffer: Buffer,
  inspection: ImageInspectionResult,
  campaignContext?: { brandName?: string; targetPlatform?: string; placement?: string; creativeGoal?: string },
  modelName?: string
): Promise<UnifiedOpenAIVisionResult> {
  const apiKey = getFreshOpenAIApiKey();

  if (!apiKey || apiKey.trim() === "" || apiKey === "local-openai-placeholder") {
    throw new Error(
      "[OPENAI_VISION_ERROR] OPENAI_API_KEY is not configured in environment. Real creative analysis requires a valid OpenAI API key."
    );
  }

  const selectedModel = (modelName && modelName.trim()) ? modelName.trim() : (process.env.OPENAI_MODEL || "gpt-4o");
  console.log(`[OPENAI_VISION] Initiating unified creative analysis with model: ${selectedModel}`);

  const openai = new OpenAI({ apiKey });
  const mimeType = inspection.format === "png" ? "image/png" : "image/jpeg";
  const base64Data = imageBuffer.toString("base64");

  const promptPayload = {
    campaignContext: {
      brandName: campaignContext?.brandName || "Unspecified Brand",
      targetPlatform: campaignContext?.targetPlatform || "INSTAGRAM_REELS",
      placement: campaignContext?.placement || "REEL",
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

    const requestOptions: any = {
      model: selectedModel,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: UNIFIED_STATIC_VISION_PROMPT,
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
      requestOptions.temperature = 0.2;
    }

    const response = await openai.chat.completions.create(requestOptions);

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response received from OpenAI API.");

    const parsed = JSON.parse(content);
    const providerName = `OPENAI_${selectedModel.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;

    const rawObservations: any[] = parsed.observations || [];
    const observations: NormalizedObservation[] = rawObservations.map((obs, idx) => ({
      id: obs.id || `obs_${idx + 1}`,
      observationType: obs.observationType || "OCR_TEXT",
      label: obs.label || "",
      confidence: typeof obs.confidence === "number" ? obs.confidence : 0.95,
      boundingBox: obs.boundingBox,
      provider: providerName,
    }));

    return {
      extractedText: parsed.extractedText || "",
      textCoveragePercent: typeof parsed.textCoveragePercent === "number" ? parsed.textCoveragePercent : 0,
      hasLogo: Boolean(parsed.hasLogo),
      logoLabel: parsed.logoLabel || undefined,
      hasFace: Boolean(parsed.hasFace),
      dominantColors: Array.isArray(parsed.dominantColors) ? parsed.dominantColors : ["#1E293B", "#6366F1"],
      observations,
      executiveSummary: parsed.executiveSummary || "Creative analysis completed successfully.",
      findings: Array.isArray(parsed.findings) ? parsed.findings : [],
      suggestedActionPlan: Array.isArray(parsed.suggestedActionPlan) ? parsed.suggestedActionPlan : [],
      modelUsed: selectedModel,
    };
  } catch (err: any) {
    console.error(`[OPENAI_VISION_ERROR] Analysis failed with model ${selectedModel}:`, err);
    throw new Error(`OpenAI Vision Analysis Failed (${selectedModel}): ${err.message}`);
  }
}
