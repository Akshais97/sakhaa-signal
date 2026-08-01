import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  inspectImage,
  analyzeStaticImageWithVision,
  evaluateStaticRules,
  computeStaticCategoryScores,
} from "../../packages/engines/dist/index.js";

test("Static Standard Analysis — Preprocessing on Social_Media_creative_sample.png", async () => {
  const samplePath = path.resolve(process.cwd(), "samples", "Social_Media_creative_sample.png");
  const buffer = await readFile(samplePath);
  assert.ok(buffer.byteLength > 0, "Sample file buffer must not be empty");

  const inspection = await inspectImage(buffer);
  assert.ok(inspection.width > 0, "Image width must be positive");
  assert.ok(inspection.height > 0, "Image height must be positive");
  assert.ok(inspection.aspectRatio > 0, "Aspect ratio must be positive");
  assert.ok(typeof inspection.aspectRatioLabel === "string", "Aspect ratio label must be a string");
  assert.ok(typeof inspection.contrast === "number", "Contrast must be a number");
  assert.ok(typeof inspection.blurScore === "number", "Blur score must be a number");
  assert.equal(inspection.safeZoneMarginTopPercent, 15);
  assert.equal(inspection.safeZoneMarginBottomPercent, 20);
});

test("Static Standard Analysis — Computer Vision Extraction", async () => {
  const samplePath = path.resolve(process.cwd(), "samples", "Social_Media_creative_sample.png");
  const buffer = await readFile(samplePath);
  const inspection = await inspectImage(buffer);

  const vision = await analyzeStaticImageWithVision(buffer, inspection.width, inspection.height);
  assert.ok(Array.isArray(vision.observations), "Observations must be an array");
  assert.ok(typeof vision.extractedText === "string", "Extracted text must be a string");
  assert.ok(typeof vision.textCoveragePercent === "number", "Text coverage must be a number");
  assert.ok(Array.isArray(vision.dominantColors), "Dominant colors must be an array");
});

test("Static Standard Analysis — Rule Evaluation", async () => {
  const samplePath = path.resolve(process.cwd(), "samples", "Social_Media_creative_sample.png");
  const buffer = await readFile(samplePath);
  const inspection = await inspectImage(buffer);
  const vision = await analyzeStaticImageWithVision(buffer, inspection.width, inspection.height);

  const rules = evaluateStaticRules(inspection, vision, { brandName: "SampleBrand" });
  assert.ok(Array.isArray(rules), "Rules output must be an array");
  assert.ok(rules.length >= 4, "Must evaluate at least 4 core static rules");

  const ruleCodes = rules.map((r) => r.ruleCode);
  assert.ok(ruleCodes.includes("RULE_BRAND_VISIBLE"), "Must include RULE_BRAND_VISIBLE");
  assert.ok(ruleCodes.includes("RULE_SAFE_ZONE_COMPLIANCE"), "Must include RULE_SAFE_ZONE_COMPLIANCE");
  assert.ok(ruleCodes.includes("RULE_TEXT_DENSITY"), "Must include RULE_TEXT_DENSITY");
  assert.ok(ruleCodes.includes("RULE_CTA_PRESENT"), "Must include RULE_CTA_PRESENT");

  rules.forEach((rule) => {
    assert.ok(["PASS", "FAIL", "NOT_APPLICABLE", "UNKNOWN"].includes(rule.status));
    assert.ok(["HIGH", "MEDIUM", "LOW"].includes(rule.severity));
  });
});

test("Static Standard Analysis — Deterministic Category Scoring", async () => {
  const samplePath = path.resolve(process.cwd(), "samples", "Social_Media_creative_sample.png");
  const buffer = await readFile(samplePath);
  const inspection = await inspectImage(buffer);
  const vision = await analyzeStaticImageWithVision(buffer, inspection.width, inspection.height);
  const rules = evaluateStaticRules(inspection, vision, { brandName: "SampleBrand" });

  const scoring = computeStaticCategoryScores(inspection, vision, rules);
  assert.ok(scoring.overallScore >= 0 && scoring.overallScore <= 100, "Overall score must be 0-100");
  assert.equal(scoring.categoryScores.length, 6, "Must compute exactly 6 category scores");

  const categories = scoring.categoryScores.map((c) => c.category);
  assert.ok(categories.includes("HOOK"));
  assert.ok(categories.includes("COPY_CLARITY"));
  assert.ok(categories.includes("CTA"));
  assert.ok(categories.includes("VISUAL_CONSTRUCTION"));
  assert.ok(categories.includes("BRANDING"));
  assert.ok(categories.includes("COMPLIANCE"));

  scoring.categoryScores.forEach((cat) => {
    assert.ok(cat.score >= 0 && cat.score <= 100);
    assert.ok(cat.weight > 0);
  });
});
