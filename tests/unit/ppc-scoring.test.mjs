import { test } from "node:test";
import assert from "node:assert/strict";
import { TemporalEvidenceGraph } from "../../packages/engines/dist/evidence/temporal-graph.js";
import { computePPCScoring } from "../../packages/engines/dist/scoring/ppc-scoring-engine.js";
import { runBrainOrchestration } from "../../packages/engines/dist/openai/brain-orchestrator.js";

test("computePPCScoring produces 8-category score breakdown for active evidence graph", () => {
  const graph = new TemporalEvidenceGraph(15000);

  graph.addObservation({
    id: "obs_01",
    timestampMs: 400,
    endMs: 800,
    role: "TRANSCRIPT_WORD",
    value: "Stop",
    confidence: 0.95,
    provider: "WHISPER_CPP_CPU",
  });

  graph.addObservation({
    id: "obs_ocr_01",
    timestampMs: 500,
    endMs: 3000,
    role: "TEXT_OVERLAY",
    value: "50% OFF TODAY",
    confidence: 0.98,
    provider: "PADDLE_OCR_CPU",
  });

  graph.addObservation({
    id: "obs_brand_01",
    timestampMs: 1200,
    endMs: 3500,
    role: "BRAND_LOGO",
    value: "Brand Mark",
    confidence: 0.94,
    provider: "REFERENCE_MATCH",
  });

  const scoring = computePPCScoring(graph);
  assert.equal(scoring.categories.hookRetention.score, 100);
  assert.equal(scoring.categories.brandProductIntegration.score, 95);
  assert.equal(scoring.tier, "AVERAGE");
  assert.ok(scoring.overallCreativeScore >= 60);
});

test("runBrainOrchestration handles missing OpenAI API key safely", async () => {
  const graph = new TemporalEvidenceGraph(15000);
  const result = await runBrainOrchestration(graph, { brandName: "TestBrand" });
  assert.ok(result.executiveSummary.includes("unavailable"));
  assert.equal(result.findings.length, 0);
});
