import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeVideoWithIntelligence } from "../../packages/engines/dist/cv/google-video-intelligence.js";
import { transcribeAudioWithGroq } from "../../packages/engines/dist/audio/groq-whisper.js";
import { classifyAudioWithYAMNet } from "../../packages/engines/dist/audio/yamnet-classifier.js";
import { scoreVideoCreative } from "../../packages/engines/dist/scoring/video-scorer.js";

test("Gate 0: Google Video Intelligence returns empty annotations without fake fallback text", async () => {
  const result = await analyzeVideoWithIntelligence(Buffer.from([]), 15000);
  assert.equal(result.textAnnotations.length, 0);
  assert.equal(result.shotCuts.length, 0);
  assert.equal(result.logos.length, 0);
  assert.equal(result.provider, "FALLBACK_ENGINE");
});

test("Gate 0: Groq Whisper returns empty transcript without fake speech words", async () => {
  const result = await transcribeAudioWithGroq(undefined, 15000);
  assert.equal(result.fullTranscript, "");
  assert.equal(result.words.length, 0);
  assert.equal(result.provider, "FALLBACK_WHISPER");
});

test("Gate 0: Audio Classifier returns silence for empty audio buffer", async () => {
  const result = await classifyAudioWithYAMNet(undefined, 15000);
  assert.equal(result.speechRatio, 0);
  assert.equal(result.musicRatio, 0);
  assert.equal(result.silenceRatio, 1.0);
});

test("Gate 0: Black silent video produces zero unearned scores", async () => {
  const inspection = {
    durationMs: 15000,
    width: 1080,
    height: 1920,
    aspectRatioLabel: "9:16",
    hasAudio: false,
    keyframes: [],
  };
  const intelligence = { textAnnotations: [], shotCuts: [], logos: [], provider: "FALLBACK_ENGINE" };
  const transcript = { fullTranscript: "", words: [], language: "en", durationMs: 15000, provider: "FALLBACK_WHISPER" };
  const audio = { timeline: [], speechRatio: 0, musicRatio: 0, silenceRatio: 1.0, provider: "FALLBACK_AUDIO_CLASSIFIER" };

  const scoring = scoreVideoCreative(inspection, intelligence, transcript, audio);
  assert.equal(scoring.categoryScores.hook.score, 0);
  assert.equal(scoring.categoryScores.branding.score, 0);
  assert.equal(scoring.categoryScores.copyClarity.score, 0);
  assert.equal(scoring.overallScore, 0);
  assert.equal(scoring.tier, "UNDERPERFORMING");
});
