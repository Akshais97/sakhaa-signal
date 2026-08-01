import { StaticRuleResult } from "../rules/static-rules.js";
import { VisionAnalysisResult } from "../cv/google-vision.js";
import { ImageInspectionResult } from "../preprocessing/image-inspector.js";
import cesWeights from "./ces-weights.json" with { type: "json" };

export interface CategoryScoreOutput {
  category: "HOOK" | "COPY_CLARITY" | "CTA" | "VISUAL_CONSTRUCTION" | "BRANDING" | "COMPLIANCE";
  score: number; // 0 to 100
  confidence: number;
  weight: number;
  breakdown: Record<string, any>;
}

export interface StaticScoringResult {
  overallScore: number; // Creative Effectiveness Score (CES)
  categoryScores: CategoryScoreOutput[];
  appliedRules: string[];
  confidenceInterval: [number, number];
  vertical?: string;
  objective?: string;
}

export function computeStaticCategoryScores(
  inspection: ImageInspectionResult,
  vision: VisionAnalysisResult,
  rules: StaticRuleResult[],
  campaignContext?: { targetPlatform?: string; brandName?: string; creativeGoal?: string }
): StaticScoringResult {
  const getRule = (code: string) => rules.find((r) => r.ruleCode === code);

  // 1. Hook Score (Visual Prominence & Contrast)
  const contrastScore = Math.min(100, Math.max(20, (inspection.contrast / 70) * 100));
  const blurScore = inspection.isBlurry ? 40 : 95;
  const hookScore = Math.round(contrastScore * 0.6 + blurScore * 0.4);

  // 2. Copy Clarity Score
  const densityPenalty = vision.textCoveragePercent > 25 ? Math.max(0, 100 - (vision.textCoveragePercent - 25) * 4) : 95;
  const safeZoneRule = getRule("RULE_SAFE_ZONE_COMPLIANCE");
  const safeZoneBonus = safeZoneRule?.status === "PASS" ? 100 : 50;
  const copyClarityScore = Math.round(densityPenalty * 0.7 + safeZoneBonus * 0.3);

  // 3. CTA Score
  const ctaRule = getRule("RULE_CTA_PRESENT");
  const ctaScore = ctaRule?.status === "PASS" ? 92 : 35;

  // 4. Visual Construction Score
  const isSquareOrVertical = inspection.aspectRatioLabel.includes("9:16") || inspection.aspectRatioLabel.includes("1:1") || inspection.aspectRatioLabel.includes("4:5");
  const formatBonus = isSquareOrVertical ? 100 : 70;
  const visualConstructionScore = Math.round(contrastScore * 0.5 + formatBonus * 0.5);

  // 5. Branding Score
  const brandRule = getRule("RULE_BRAND_VISIBLE");
  const brandingScore = brandRule?.status === "PASS" ? 90 : 30;

  // 6. Compliance Score
  const passCount = rules.filter((r) => r.status === "PASS").length;
  const complianceScore = Math.round((passCount / Math.max(1, rules.length)) * 100);

  const categoryScores: CategoryScoreOutput[] = [
    { category: "HOOK", score: hookScore, confidence: 0.95, weight: 0.20, breakdown: { contrastScore, blurScore } },
    { category: "COPY_CLARITY", score: copyClarityScore, confidence: 0.90, weight: 0.20, breakdown: { densityPenalty, textCoveragePercent: vision.textCoveragePercent } },
    { category: "CTA", score: ctaScore, confidence: 0.95, weight: 0.20, breakdown: { ctaPresent: ctaRule?.status === "PASS" } },
    { category: "VISUAL_CONSTRUCTION", score: visualConstructionScore, confidence: 0.90, weight: 0.15, breakdown: { aspectRatioLabel: inspection.aspectRatioLabel } },
    { category: "BRANDING", score: brandingScore, confidence: 0.90, weight: 0.15, breakdown: { brandVisible: brandRule?.status === "PASS" } },
    { category: "COMPLIANCE", score: complianceScore, confidence: 0.95, weight: 0.10, breakdown: { passCount, totalRules: rules.length } },
  ];

  // Weighted composite baseline
  const rawWeightedSum = categoryScores.reduce((sum, c) => sum + c.score * c.weight, 0);
  let currentScore = Math.round(rawWeightedSum);

  const appliedRules: string[] = [];

  // Apply Boost Rules
  if (hookScore >= 85) {
    currentScore += 3;
    appliedRules.push("boost:exceptional_hook");
  }
  if (ctaScore >= 90 && brandRule?.status === "PASS") {
    currentScore += 2;
    appliedRules.push("boost:exceptional_brand");
  }

  // Apply Hard Caps
  if (inspection.isBlurry) {
    currentScore = Math.min(currentScore, 60);
    appliedRules.push("cap:low_ocr_confidence");
  }
  if (ctaRule?.status !== "PASS" && campaignContext?.targetPlatform === "STATIC_GOOGLE") {
    currentScore = Math.min(currentScore, 50);
    appliedRules.push("cap:no_cta_on_conversion");
  }
  if (passCount < rules.length / 2) {
    currentScore = Math.min(currentScore, 55);
    appliedRules.push("cap:missing_mandatory_disclosure");
  }

  const finalCES = Math.min(100, Math.max(0, currentScore));
  const confidenceInterval: [number, number] = [
    Math.max(0, finalCES - 6),
    Math.min(100, finalCES + 6)
  ];

  return {
    overallScore: finalCES,
    categoryScores,
    appliedRules,
    confidenceInterval,
    vertical: "generic",
    objective: campaignContext?.targetPlatform || "STATIC_META",
  };
}
