import { test } from "node:test";
import assert from "node:assert/strict";
import { TemporalEvidenceGraph } from "../../packages/engines/dist/evidence/temporal-graph.js";
import { detectSpeechIntervalsWithSileroVAD } from "../../packages/engines/dist/audio/silero-vad-bridge.js";

test("TemporalEvidenceGraph stores and clusters timeline tracks by role", () => {
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
    id: "obs_02",
    timestampMs: 800,
    endMs: 1200,
    role: "TRANSCRIPT_WORD",
    value: "Scrolling",
    confidence: 0.92,
    provider: "WHISPER_CPP_CPU",
  });

  graph.addObservation({
    id: "obs_ocr_01",
    timestampMs: 0,
    endMs: 3000,
    role: "TEXT_OVERLAY",
    value: "50% OFF TODAY",
    confidence: 0.98,
    provider: "PADDLE_OCR_CPU",
  });

  const exported = graph.exportGraphJSON();
  assert.equal(exported.trackCount, 3);
  assert.equal(exported.totalDurationMs, 15000);

  const wordTracks = graph.getTracksByRole("TRANSCRIPT_WORD");
  assert.equal(wordTracks.length, 2);
  assert.equal(wordTracks[0].summaryValue, "Stop");

  const intervalObs = graph.getObservationsInInterval(0, 500);
  assert.equal(intervalObs.length, 2); // obs_ocr_01 and obs_01
});

test("Silero VAD detects empty intervals for non-speech audio", async () => {
  const vadResult = await detectSpeechIntervalsWithSileroVAD(undefined, 15000);
  assert.equal(vadResult.speechIntervals.length, 0);
  assert.equal(vadResult.speechDurationMs, 0);
  assert.equal(vadResult.speechRatio, 0);
  assert.equal(vadResult.provider, "NOT_DETECTED");
});
