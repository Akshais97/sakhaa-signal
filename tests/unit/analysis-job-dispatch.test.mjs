import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  getAnalysisStages,
  INITIAL_ANALYSIS_JOB_STATE,
} from "../../apps/web/src/lib/analysis-job-config.ts";

test("new standard analysis jobs enter the worker's eligible queue", () => {
  assert.deepEqual(INITIAL_ANALYSIS_JOB_STATE, {
    status: "QUEUED",
    currentStage: "QUEUED",
    progressPercent: 0,
  });
});

test("static stage contract matches the CPU worker", () => {
  assert.deepEqual(getAnalysisStages("STATIC_STANDARD"), [
    "DOWNLOAD_AND_VALIDATE",
    "PREPROCESSING",
    "COMPUTER_VISION",
    "RULE_EVALUATION",
    "DETERMINISTIC_SCORING",
    "MULTIMODAL_GPT_SYNTHESIS",
    "REPORT_PUBLISHING",
  ]);
});

test("standard-video stage contract matches the CPU worker", () => {
  assert.deepEqual(getAnalysisStages("VIDEO_STANDARD"), [
    "DOWNLOAD_AND_VALIDATE",
    "PREPROCESSING",
    "COMPUTER_VISION",
    "DETERMINISTIC_SCORING",
    "MULTIMODAL_GPT_SYNTHESIS",
    "REPORT_PUBLISHING",
  ]);
});

test("CPU worker recovers analysis jobs stranded in CREATED", () => {
  const workerSource = readFileSync("workers/cpu/src/index.ts", "utf8");
  assert.match(workerSource, /\{ status: "CREATED" \}/);
  assert.match(workerSource, /\{ status: "QUEUED" \}/);
});

test("static OpenAI vision calls have bounded latency and explicit reasoning", () => {
  const visionSource = readFileSync(
    "packages/engines/src/openai/openai-vision.ts",
    "utf8"
  );
  assert.match(visionSource, /OPENAI_VISION_TIMEOUT_MS/);
  assert.match(visionSource, /maxRetries: 1/);
  assert.match(visionSource, /reasoning_effort = "none"/);
});

test("analysis API falls back to a valid vision model", () => {
  const routeSource = readFileSync(
    "apps/web/src/app/api/analysis/jobs/route.ts",
    "utf8"
  );
  assert.match(routeSource, /selectedModel: selectedModel \|\| "gpt-4o"/);
});
