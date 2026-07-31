import OpenAI from "openai";
import { VisionAnalysisResult } from "../cv/google-vision.js";
import { ImageInspectionResult } from "../preprocessing/image-inspector.js";
import { StaticRuleResult } from "../rules/static-rules.js";
import { StaticScoringResult } from "../scoring/static-scorer.js";

export interface SynthesisFinding {
  type: "STRENGTH" | "WEAKNESS" | "RECOMMENDATION";
  category: string;
  title: string;
  description: string;
  recommendation?: string;
  impactPriority: "HIGH" | "MEDIUM" | "LOW";
  evidenceIds: string[];
}

export interface StaticSynthesisReport {
  executiveSummary: string;
  findings: SynthesisFinding[];
  suggestedActionPlan: string[];
}

export const SYSTEM_PROMPT_STATIC_SYNTHESIS = `You are an elite Performance Creative Intelligence Strategist for paid digital advertising.
Analyze the provided evidence (including visual layout, OCR copy, platform safe zones, and rule pass/fail results) for a static ad creative.
Produce a structured JSON report with executiveSummary, findings, and suggestedActionPlan.

Output Schema:
{
  "executiveSummary": "Concise 2-sentence summary of overall performance potential, key visual hook strength, and primary bottleneck.",
  "findings": [
    {
      "type": "STRENGTH" | "WEAKNESS" | "RECOMMENDATION",
      "category": "HOOK" | "COPY_CLARITY" | "CTA" | "VISUAL_CONSTRUCTION" | "BRANDING" | "COMPLIANCE",
      "title": "Short descriptive title",
      "description": "Evidence-backed explanation citing specific visual or text details",
      "recommendation": "Specific design edit instruction (required if type is WEAKNESS or RECOMMENDATION)",
      "impactPriority": "HIGH" | "MEDIUM" | "LOW",
      "evidenceIds": ["obs_text_1", "RULE_SAFE_ZONE_COMPLIANCE"]
    }
  ],
  "suggestedActionPlan": [
    "1-line actionable modification step 1",
    "1-line actionable modification step 2"
  ]
}

Rules:
1. Base all findings strictly on empirical evidence provided in the JSON payload and visual image.
2. ALWAYS include at least 2 RECOMMENDATION findings (type: "RECOMMENDATION") even if the ad score is high (80-100), providing specific contrast tuning, margin buffers, wording tweaks, or font size adjustments for performance design teams.
3. Ensure recommendations provide specific pixel margin shifts, contrast adjustments, or wording edits for performance design teams.`;

export async function generateStaticSynthesis(
  inspection: ImageInspectionResult,
  vision: VisionAnalysisResult,
  rules: StaticRuleResult[],
  scoring: StaticScoringResult,
  campaignContext?: { brandName?: string; targetPlatform?: string; creativeGoal?: string },
  imageBuffer?: Buffer
): Promise<StaticSynthesisReport> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === "local-openai-placeholder") {
    console.log("[OPENAI_SYNTHESIS] API Key not set. Using rule-backed synthesis generator.");
    return generateFallbackStaticSynthesis(vision, rules, scoring);
  }

  try {
    const openai = new OpenAI({ apiKey });
    const promptPayload = {
      campaignContext: {
        brandName: campaignContext?.brandName || "Generic Brand",
        targetPlatform: campaignContext?.targetPlatform || "INSTAGRAM_REELS",
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
      extractedText: vision.extractedText,
      textCoveragePercent: vision.textCoveragePercent,
      hasLogo: vision.hasLogo,
      hasFace: vision.hasFace,
      dominantColors: vision.dominantColors,
      ruleResults: rules.map((r) => ({ rule: r.ruleCode, status: r.status, actual: r.actual, evidenceIds: r.evidenceIds })),
      scores: {
        overallScore: scoring.overallScore,
        categoryScores: scoring.categoryScores.map((c) => ({ category: c.category, score: c.score })),
      },
    };

    const userContent: any[] = [
      {
        type: "text",
        text: `Analyze this static ad creative and diagnostic evidence payload:\n\n${JSON.stringify(promptPayload, null, 2)}`,
      },
    ];

    if (imageBuffer) {
      const base64Data = imageBuffer.toString("base64");
      const mimeType = inspection.format === "png" ? "image/png" : "image/jpeg";
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${base64Data}`,
        },
      });
    }

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT_STATIC_SYNTHESIS,
        },
        {
          role: "user",
          content: userContent,
        },
      ],
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from OpenAI API");

    const parsed = JSON.parse(content);
    return {
      executiveSummary: parsed.executiveSummary || "Static ad analysis completed successfully.",
      findings: parsed.findings || [],
      suggestedActionPlan: parsed.suggestedActionPlan || [],
    };
  } catch (err: any) {
    console.error("[OPENAI_SYNTHESIS_ERROR]", err);
    return generateFallbackStaticSynthesis(vision, rules, scoring);
  }
}

function generateFallbackStaticSynthesis(
  vision: VisionAnalysisResult,
  rules: StaticRuleResult[],
  scoring: StaticScoringResult
): StaticSynthesisReport {
  const ctaRule = rules.find((r) => r.ruleCode === "RULE_CTA_PRESENT");
  const brandRule = rules.find((r) => r.ruleCode === "RULE_BRAND_VISIBLE");
  const safeZoneRule = rules.find((r) => r.ruleCode === "RULE_SAFE_ZONE_COMPLIANCE");

  const findings: SynthesisFinding[] = [];

  if (brandRule?.status === "PASS") {
    findings.push({
      type: "STRENGTH",
      category: "BRANDING",
      title: "Strong Brand Logo Prominence",
      description: "The brand logo is clearly visible in the primary viewing quadrant, establishing instant brand attribution.",
      impactPriority: "HIGH",
      evidenceIds: brandRule.evidenceIds,
    });
  } else {
    findings.push({
      type: "WEAKNESS",
      category: "BRANDING",
      title: "Weak or Missing Brand Attribution",
      description: "No prominent logo or brand name text was detected on the creative, risking unbranded ad view waste.",
      recommendation: "Position the brand logo in the top-left or top-center safe zone.",
      impactPriority: "HIGH",
      evidenceIds: [],
    });
  }

  if (ctaRule?.status === "PASS") {
    findings.push({
      type: "STRENGTH",
      category: "CTA",
      title: "Clear Call to Action Wording",
      description: `Action-oriented CTA text ("${vision.extractedText.slice(0, 30)}") provides explicit next steps for viewers.`,
      impactPriority: "HIGH",
      evidenceIds: ctaRule.evidenceIds,
    });
  } else {
    findings.push({
      type: "WEAKNESS",
      category: "CTA",
      title: "Missing Call-to-Action Cue",
      description: "The static creative lacks an explicit action button or prompt telling the user what to do next.",
      recommendation: "Add a high-contrast action button (e.g. 'SHOP NOW' or 'GET 50% OFF').",
      impactPriority: "HIGH",
      evidenceIds: [],
    });
  }

  // Always generate actionable optimization recommendations
  findings.push({
    type: "RECOMMENDATION",
    category: "CTA",
    title: "CTA Visual Urgency Enhancement",
    description: "Increase the visual button container fill contrast against the background to boost mobile feed tap-through rates.",
    recommendation: "Apply a vibrant solid fill (e.g. #6366F1 or #E8B84B) behind the CTA button text.",
    impactPriority: "MEDIUM",
    evidenceIds: ctaRule?.evidenceIds || [],
  });

  findings.push({
    type: "RECOMMENDATION",
    category: "COMPLIANCE",
    title: "Platform Safe Zone Buffer Optimization",
    description: "Maintain a 20% vertical padding buffer from top and bottom canvas edges to avoid caption mask occlusion on Reels and TikTok.",
    recommendation: "Shift top headlines 30px downward and bottom CTA text 40px upward.",
    impactPriority: "MEDIUM",
    evidenceIds: safeZoneRule?.evidenceIds || [],
  });

  return {
    executiveSummary: `Static creative achieved an overall diagnostic score of ${scoring.overallScore}/100. Key strengths include ${brandRule?.status === "PASS" ? "clear logo attribution" : "visual layout"}, with primary optimization opportunities in CTA clarity and safe-zone margin alignment.`,
    findings,
    suggestedActionPlan: [
      "Shift text overlays inward from top and bottom canvas margins.",
      "Ensure CTA button contrast exceeds 4:1 ratio against background.",
      "Maintain text coverage under 20% to avoid visual clutter.",
    ],
  };
}
