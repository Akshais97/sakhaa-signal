import OpenAI from "openai";
import { z } from "zod";
import { TemporalEvidenceGraph } from "../evidence/temporal-graph.js";

// Models Registry
export const MODEL_REGISTRY = {
  TERRA: "gpt-5.6-terra",
  SOL: "gpt-5.6-sol",
  MODERATION: "omni-moderation-latest",
} as const;

// Zod Schemas for Structured Outputs
export const SemanticFindingSchema = z.object({
  findingId: z.string(),
  category: z.enum([
    "HOOK_RETENTION",
    "MESSAGE_COMPREHENSION",
    "NARRATIVE_CLARITY",
    "BRAND_PRODUCT_INTEGRATION",
    "OFFER_TRUST_CONVERSION",
    "AUDIO_VISUAL_CRAFT",
    "PLATFORM_NATIVE_FIT",
    "COMPLIANCE_SAFETY",
  ]),
  observation: z.string(),
  evidenceIds: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  severity: z.enum(["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  unknowns: z.array(z.string()),
  recommendation: z.object({
    change: z.string(),
    mechanism: z.string(),
    expectedImprovementArea: z.string(),
    tradeoff: z.string().optional(),
  }).optional(),
  humanReviewRequired: z.boolean(),
});

export const BrainDiagnosisResponseSchema = z.object({
  executiveSummary: z.string(),
  creativeReadinessTier: z.enum(["TOP_PERFORMER", "STRONG_CONTENDER", "AVERAGE", "UNDERPERFORMING"]),
  first3SecImpactSummary: z.string(),
  findings: z.array(SemanticFindingSchema),
  suggestedActionPlan: z.array(z.string()),
  recommendedAEditVariants: z.array(z.string()),
});

export type BrainDiagnosisResponse = z.infer<typeof BrainDiagnosisResponseSchema>;

export async function runBrainOrchestration(
  evidenceGraph: TemporalEvidenceGraph,
  campaignContext?: { brandName?: string; targetPlatform?: string; creativeGoal?: string }
): Promise<BrainDiagnosisResponse> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === "local-openai-placeholder") {
    console.log("[BRAIN_ORCHESTRATOR] OPENAI_API_KEY absent. Returning empty structured diagnosis.");
    return {
      executiveSummary: "Multimodal OpenAI Sol/Terra brain unavailable. Review deterministic timeline evidence below.",
      creativeReadinessTier: "AVERAGE",
      first3SecImpactSummary: "Multimodal semantic synthesis skipped due to unconfigured API key.",
      findings: [],
      suggestedActionPlan: [],
      recommendedAEditVariants: [],
    };
  }

  try {
    const openai = new OpenAI({ apiKey });
    const exportedEvidence = evidenceGraph.exportGraphJSON();

    const promptText = `You are GPT-5.6 Sol, the senior PPC Creative Intelligence Brain.
Analyze the following timestamped evidence graph collected from a video ad creative:

Context: ${JSON.stringify(campaignContext || {})}
Evidence Graph: ${JSON.stringify(exportedEvidence, null, 2)}

Instructions:
1. Every semantic finding MUST cite valid evidence IDs present in the evidence graph.
2. Evaluate 3-second hook retention, proposition clarity, brand integration timing, and CTA visibility.
3. Do NOT invent evidence, transcripts, or logo appearances not present in the graph.
4. Output your analysis strictly matching this JSON schema:

{
  "executiveSummary": "Detailed narrative summary of creative performance",
  "creativeReadinessTier": "TOP_PERFORMER" | "STRONG_CONTENDER" | "AVERAGE" | "UNDERPERFORMING",
  "first3SecImpactSummary": "Evaluation of first 3 seconds",
  "findings": [
    {
      "findingId": "finding_1",
      "category": "HOOK_RETENTION",
      "type": "WEAKNESS",
      "title": "Hook dropoff risk",
      "description": "Explanation of issue",
      "impactPriority": "HIGH",
      "evidenceIds": [],
      "recommendation": {
        "change": "Actionable edit",
        "expectedImpact": "Improvement description",
        "effort": "LOW"
      }
    }
  ],
  "suggestedActionPlan": ["Step 1", "Step 2"],
  "recommendedAEditVariants": [
    {
      "variantName": "Variant A",
      "targetSection": "Opening Hook",
      "hypothesis": "Hypothesis",
      "action": "Edit description"
    }
  ]
}`;

    const targetModel = process.env.OPENAI_MODEL || MODEL_REGISTRY.SOL;
    let response;
    try {
      response = await openai.chat.completions.create({
        model: targetModel,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are an expert video advertising diagnostic system. Return strict JSON matching the requested schema." },
          { role: "user", content: promptText },
        ],
      });
    } catch (modelErr: any) {
      if (modelErr?.status === 404 || modelErr?.status === 400) {
        console.warn(`[BRAIN_ORCHESTRATOR] Target model '${targetModel}' returned ${modelErr.status}. Falling back to 'gpt-4o'.`);
        response = await openai.chat.completions.create({
          model: "gpt-4o",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "You are an expert video advertising diagnostic system. Return strict JSON matching the requested schema." },
            { role: "user", content: promptText },
          ],
        });
      } else {
        throw modelErr;
      }
    }

    const content = response.choices[0]?.message?.content || "";
    const parsed = JSON.parse(content);
    
    // Normalize category aliases and variant structures if returned by AI model
    if (parsed.findings && Array.isArray(parsed.findings)) {
      const categoryMap: Record<string, string> = {
        PROPOSITION_CLARITY: "MESSAGE_COMPREHENSION",
        BRAND_INTEGRATION: "BRAND_PRODUCT_INTEGRATION",
        CTA_VISIBILITY: "OFFER_TRUST_CONVERSION",
        NARRATIVE_TEMPORAL_CLARITY: "NARRATIVE_CLARITY",
        AUDIO_VISUAL: "AUDIO_VISUAL_CRAFT",
        PLATFORM_FIT: "PLATFORM_NATIVE_FIT",
        COMPLIANCE: "COMPLIANCE_CLAIM_SAFETY",
      };
      for (const f of parsed.findings) {
        if (f.category && categoryMap[f.category]) {
          f.category = categoryMap[f.category];
        }
      }
    }

    if (parsed.recommendedAEditVariants && Array.isArray(parsed.recommendedAEditVariants)) {
      parsed.recommendedAEditVariants = parsed.recommendedAEditVariants.map((v: any) =>
        typeof v === "string" ? v : `${v.variantName || 'Variant'}: ${v.action || v.hypothesis || JSON.stringify(v)}`
      );
    }

    // Validate with Zod
    const validated = BrainDiagnosisResponseSchema.safeParse(parsed);
    if (validated.success) {
      return validated.data;
    } else {
      return {
        executiveSummary: parsed.executiveSummary || "Video creative evaluation complete.",
        creativeReadinessTier: parsed.creativeReadinessTier || "AVERAGE",
        first3SecImpactSummary: parsed.first3SecImpactSummary || "Opening 0-3s evaluated from evidence timeline.",
        findings: parsed.findings || [],
        suggestedActionPlan: parsed.suggestedActionPlan || [],
        recommendedAEditVariants: parsed.recommendedAEditVariants || [],
      };
    }
  } catch (err) {
    console.warn("[BRAIN_ORCHESTRATOR_ERROR]", err);
    return {
      executiveSummary: "OpenAI Sol synthesis encountered a transport error.",
      creativeReadinessTier: "AVERAGE",
      first3SecImpactSummary: "Synthesis unavailable.",
      findings: [],
      suggestedActionPlan: [],
      recommendedAEditVariants: [],
    };
  }
}
