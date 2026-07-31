import { VisionAnalysisResult } from "../cv/google-vision.js";
import { ImageInspectionResult } from "../preprocessing/image-inspector.js";

export interface StaticRuleResult {
  ruleCode: string;
  status: "PASS" | "FAIL" | "NOT_APPLICABLE" | "UNKNOWN";
  expected: string;
  actual: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  evidenceIds: string[];
}

export function evaluateStaticRules(
  inspection: ImageInspectionResult,
  vision: VisionAnalysisResult,
  campaignContext?: { brandName?: string; creativeGoal?: string }
): StaticRuleResult[] {
  const rules: StaticRuleResult[] = [];

  // 1. Brand Visibility Rule
  const logoObs = vision.observations.filter((o) => o.observationType === "LOGO_DETECTION");
  const brandMentionedInText = campaignContext?.brandName
    ? vision.extractedText.toLowerCase().includes(campaignContext.brandName.toLowerCase())
    : false;
  const isBrandVisible = logoObs.length > 0 || brandMentionedInText;

  rules.push({
    ruleCode: "RULE_BRAND_VISIBLE",
    status: isBrandVisible ? "PASS" : "FAIL",
    expected: "Brand logo or brand text detected on creative",
    actual: isBrandVisible ? `Brand detected (${logoObs.length} logos, text match: ${brandMentionedInText})` : "No logo or brand text detected",
    severity: "HIGH",
    evidenceIds: logoObs.map((l) => l.id),
  });

  // 2. Safe Zone Compliance (Upper 15%, Lower 20%)
  const safeZoneTop = inspection.safeZoneMarginTopPercent / 100;
  const safeZoneBottom = 1 - inspection.safeZoneMarginBottomPercent / 100;
  const overlappingText = vision.observations.filter((o) => {
    if (o.observationType !== "OCR_TEXT" || !o.boundingBox) return false;
    const { y, height } = o.boundingBox;
    const yMax = y + height;
    // Overlaps if top edge is in top safe zone or bottom edge is in bottom safe zone
    return y < safeZoneTop || yMax > safeZoneBottom;
  });

  const safeZonePass = overlappingText.length === 0;
  rules.push({
    ruleCode: "RULE_SAFE_ZONE_COMPLIANCE",
    status: safeZonePass ? "PASS" : "FAIL",
    expected: "No text overlays in upper 15% or lower 20% UI safe zones",
    actual: safeZonePass ? "All text within safe margins" : `${overlappingText.length} text elements overlap UI safe zones`,
    severity: "MEDIUM",
    evidenceIds: overlappingText.map((t) => t.id),
  });

  // 3. Text Density Rule (< 20%)
  const textDensityPass = vision.textCoveragePercent <= 25;
  rules.push({
    ruleCode: "RULE_TEXT_DENSITY",
    status: textDensityPass ? "PASS" : "FAIL",
    expected: "Text coverage <= 25% of image area",
    actual: `Text coverage is ${vision.textCoveragePercent}%`,
    severity: "MEDIUM",
    evidenceIds: vision.observations.filter((o) => o.observationType === "OCR_TEXT").map((t) => t.id),
  });

  // 4. CTA Presence Rule
  const ctaRegex = /\b(shop|buy|order|get|claim|learn|start|try|sign up|download|subscribe|book|register)\b/i;
  const hasCta = ctaRegex.test(vision.extractedText);
  const ctaObs = vision.observations.filter((o) => o.observationType === "OCR_TEXT" && ctaRegex.test(o.label));

  rules.push({
    ruleCode: "RULE_CTA_PRESENT",
    status: hasCta ? "PASS" : "FAIL",
    expected: "Clear call-to-action text detected",
    actual: hasCta ? `CTA detected in text ("${ctaObs[0]?.label || "Action verb"}")` : "No explicit call-to-action detected",
    severity: "HIGH",
    evidenceIds: ctaObs.map((c) => c.id),
  });

  // 5. Image Sharpness & Contrast Rule
  const contrastPass = inspection.contrast >= 35 && !inspection.isBlurry;
  rules.push({
    ruleCode: "RULE_IMAGE_QUALITY",
    status: contrastPass ? "PASS" : "FAIL",
    expected: "High contrast (>=35) and sharp focus (blur score >= 12)",
    actual: `Contrast: ${inspection.contrast}, Blur score: ${inspection.blurScore}`,
    severity: "LOW",
    evidenceIds: [],
  });

  return rules;
}
