# Sakhaa Signal V1 Static Standard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the first complete customer journey: an authenticated user uploads a JPEG, PNG or WebP creative and receives an immutable evidence-first Static Standard report with deterministic measurements, GPT-5.6 Sol visual interpretation, category scores and one Overall Creative Score.

**Architecture:** Extend the Foundation stage graph with static validation, OCR/CV, deterministic measurement, GPT vision, rule evaluation, scoring and report publication. Normalize every engine result into the shared evidence contract. Geometry remains deterministic; GPT interprets visual meaning and cannot author final numbers.

**Tech Stack:** Foundation stack plus Sharp, OpenCV.js or a pinned native OpenCV worker adapter, Google Cloud Vision, OpenAI JavaScript SDK/Responses API, Zod Structured Outputs, Vitest and Playwright.

## Global Constraints

- Complete `2026-07-21-sakhaa-signal-foundation.md` and its exit gate first.
- Accept only verified JPEG, PNG and WebP up to 25 MB; extension and browser MIME are advisory.
- Decode with pixel/dimension/resource bounds before any paid API call.
- Static analyses always use `STATIC_STANDARD`; Tribe and temporal/audio dimensions are `NOT_APPLICABLE`.
- Optional brand references and explicit platform/placement are scoped to this analysis. If absent, brand/platform rules are `NOT_REQUESTED`.
- GPT-5.6 Sol receives the full creative plus bounded overlays/evidence, returns schema-valid semantic observations, and never returns numeric scores.
- Exact position, safe-zone, contrast, pixel, text-area and overlap findings derive from deterministic measurements.
- Every rule, score component, finding and recommendation cites persisted evidence.
- Engine timeouts/retries are stage-local. Report publication requires all mandatory Static Standard stages.

## Dependency and Output Contract

Consumes Foundation `Analysis`, `AnalysisStage`, `Artifact`, `EvidenceItem`, `Measurement`, `RuleResult`, `ScoreResult`, `ReportVersion`, storage and leasing interfaces. Produces a working Static Standard user journey and establishes UI/report patterns reused by both video slices.

### Task 1: Build the static upload and context wizard

**Files:**

- Replace: `apps/web/src/components/JobWizard.tsx`
- Create: `apps/web/src/components/analysis/AnalysisWizard.tsx`
- Create: `apps/web/src/components/analysis/StaticUploadStep.tsx`
- Create: `apps/web/src/components/analysis/OptionalContextStep.tsx`
- Create: `apps/web/src/components/analysis/AnalysisConfirmation.tsx`
- Modify: `apps/web/src/app/page.tsx`
- Create: `tests/unit/static-wizard.test.tsx`

- [ ] **Step 1: Write failing UI contract tests**

Test accepted types/25 MB messaging, optional brand aliases/logo/colors, unselected platform fallback, and confirmation showing `Static Standard` plus `TribeV2: Not applicable`.

- [ ] **Step 2: Prove they fail**

Run: `pnpm vitest run tests/unit/static-wizard.test.tsx`

Expected: FAIL because the current wizard is video/TribeV2-specific.

- [ ] **Step 3: Implement wizard state without hidden defaults**

```ts
type StaticDraft = {
  mediaKind: "STATIC";
  mode: "STATIC_STANDARD";
  file: File | null;
  context: {
    brandName?: string;
    brandAliases: string[];
    expectedColours: string[];
    productNames: string[];
    notes?: string;
    platform?: "INSTAGRAM" | "FACEBOOK" | "LINKEDIN" | "YOUTUBE";
    placement?: string;
  };
};
```

Use one upload transaction: create analysis, receive exact signed URL, upload, complete asset, then navigate to `/analyses/{id}`. Do not show sample scores on API failure.

- [ ] **Step 4: Run UI tests**

Run: `pnpm vitest run tests/unit/static-wizard.test.tsx && pnpm typecheck`

Expected: tests PASS and no mock report constant is imported.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components apps/web/src/app/page.tsx tests/unit/static-wizard.test.tsx
git commit -m "feat: add Static Standard analysis wizard"
```

### Task 2: Validate and canonicalize static media

**Files:**

- Create: `workers/cpu/src/media/static/validate.ts`
- Create: `workers/cpu/src/media/static/canonicalize.ts`
- Create: `workers/cpu/src/stages/static-stage-graph.ts`
- Create: `tests/fixtures/static/valid-1080x1350.png`
- Create: `tests/fixtures/static/polyglot-invalid.png.bin`
- Create: `tests/unit/static-validation.test.ts`

- [ ] **Step 1: Write decoder-boundary tests**

Cover valid formats, magic-byte mismatch, >25 MB declared/head size, decompression bomb dimensions, truncated image, unsupported animation and hash mismatch.

- [ ] **Step 2: Prove they fail**

Run: `pnpm vitest run tests/unit/static-validation.test.ts`

Expected: FAIL because no static validator exists.

- [ ] **Step 3: Implement bounded inspection**

```ts
const STATIC_LIMITS = {
  maxBytes: 25 * 1024 * 1024,
  maxPixels: 40_000_000,
  formats: new Set(["jpeg", "png", "webp"]),
};
```

Stream-download the quarantined object, compute SHA-256, inspect magic bytes and Sharp metadata, decode under limits, strip executable metadata, orient pixels and store a lossless canonical PNG plus metadata artifact. Only then mark media `VALIDATED` and enqueue `STATIC_OCR_CV` and `STATIC_MEASURE`.

- [ ] **Step 4: Run validation tests**

Run: `pnpm vitest run tests/unit/static-validation.test.ts`

Expected: valid fixture canonicalizes; all hostile fixtures fail before paid engines.

- [ ] **Step 5: Commit**

```bash
git add workers/cpu/src/media/static workers/cpu/src/stages/static-stage-graph.ts tests/fixtures/static tests/unit/static-validation.test.ts
git commit -m "feat: validate and canonicalize static creatives"
```

### Task 3: Normalize OCR and object evidence

**Files:**

- Create: `packages/engines/package.json`
- Create: `packages/engines/src/ocr/types.ts`
- Create: `packages/engines/src/ocr/google-vision.ts`
- Create: `packages/engines/src/ocr/fixture.ts`
- Create: `packages/engines/src/static-cv/types.ts`
- Create: `packages/engines/src/static-cv/google-vision.ts`
- Create: `packages/engines/src/static-cv/fixture.ts`
- Create: `workers/cpu/src/stages/static-ocr-cv.ts`
- Create: `tests/fixtures/engine/static-google-response.json`
- Create: `tests/unit/static-engine-normalization.test.ts`

- [ ] **Step 1: Write adapter-normalization tests**

Assert normalized text spans carry exact pixel boxes/confidence/source artifact/version, object/logo labels carry boxes, and fixture adapters throw when `APP_ENV=production`.

- [ ] **Step 2: Prove they fail**

Run: `pnpm vitest run tests/unit/static-engine-normalization.test.ts`

Expected: FAIL because adapters are absent.

- [ ] **Step 3: Implement strict adapters and evidence IDs**

```ts
return response.textAnnotations.map((item, index) => ({
  id: stableEvidenceId("google-vision-ocr", inputHash, index),
  kind: "OCR_TEXT_SPAN",
  locator: { mediaKind: "STATIC", box: toNormalizedBox(item.boundingPoly, width, height) },
  value: { text: item.description, confidence: item.confidence ?? null },
  provenance: { engine: "google-vision", engineVersion, inputHash },
}));
```

Persist the raw provider response privately for reproducibility and normalized evidence transactionally. Provider errors must be sanitized and retry classified.

- [ ] **Step 4: Run adapter tests**

Run: `pnpm vitest run tests/unit/static-engine-normalization.test.ts`

Expected: fixture normalizes deterministically and production fixture selection fails.

- [ ] **Step 5: Commit**

```bash
git add packages/engines workers/cpu/src/stages/static-ocr-cv.ts tests/fixtures/engine tests/unit/static-engine-normalization.test.ts
git commit -m "feat: add static OCR and CV evidence adapters"
```

### Task 4: Calculate static geometry and legibility measurements

**Files:**

- Create: `packages/analysis/src/measurements/static.ts`
- Create: `packages/analysis/src/measurements/contrast.ts`
- Create: `packages/analysis/src/measurements/safe-zones.ts`
- Create: `config/platform-rules/instagram-feed.v1.json`
- Create: `config/platform-rules/facebook-feed.v1.json`
- Create: `config/platform-rules/linkedin-feed.v1.json`
- Create: `config/platform-rules/youtube-community.v1.json`
- Create: `tests/unit/static-measurements.test.ts`

- [ ] **Step 1: Write exact measurement tests**

Use a synthetic 1000Ã—1000 fixture with known boxes to test area ratio, edge distance, overlap, normalized position, WCAG contrast approximation, text density and platform safe-zone states.

- [ ] **Step 2: Prove they fail**

Run: `pnpm vitest run tests/unit/static-measurements.test.ts`

Expected: FAIL because calculators are absent.

- [ ] **Step 3: Implement deterministic calculators**

```ts
export function overlapRatio(a: Box, b: Box): number {
  const intersection = area(intersect(a, b));
  return intersection === 0 ? 0 : intersection / Math.min(area(a), area(b));
}
```

Measurements cite OCR/CV evidence and canonical-image hash. Platform measurements emit `NOT_REQUESTED` when no target is supplied; they do not infer platform from aspect ratio.

- [ ] **Step 4: Run measurement tests**

Run: `pnpm vitest run tests/unit/static-measurements.test.ts`

Expected: all numeric tolerances pass and missing targets remain non-numeric.

- [ ] **Step 5: Commit**

```bash
git add packages/analysis/src/measurements config/platform-rules tests/unit/static-measurements.test.ts
git commit -m "feat: calculate static creative measurements"
```

### Task 5: Add GPT-5.6 Sol static visual interpretation

**Files:**

- Modify: `packages/engines/package.json`
- Create: `packages/engines/src/openai/static-vision-schema.ts`
- Create: `packages/engines/src/openai/static-vision-prompt.ts`
- Create: `packages/engines/src/openai/static-vision.ts`
- Create: `workers/cpu/src/stages/static-gpt-vision.ts`
- Create: `tests/fixtures/engine/static-gpt-response.json`
- Create: `tests/unit/static-gpt-vision.test.ts`

- [ ] **Step 1: Write request and refusal tests**

Assert model `gpt-5.6-sol`, Responses API, `input_image`, explicit `detail`, Zod Structured Output, no unsupported outcome claims, refusal handling and no score field in the response schema.

- [ ] **Step 2: Prove they fail**

Run: `pnpm vitest run tests/unit/static-gpt-vision.test.ts`

Expected: FAIL because the Responses adapter does not exist.

- [ ] **Step 3: Implement the official multimodal request shape**

```ts
const response = await openai.responses.parse({
  model: "gpt-5.6-sol",
  reasoning: { effort: "medium" },
  input: [{
    role: "user",
    content: [
      { type: "input_text", text: buildStaticVisionPrompt(context, measurements) },
      { type: "input_image", image_url: canonicalSignedUrl, detail: "high" },
      { type: "input_image", image_url: overlaySignedUrl, detail: "high" },
    ],
  }],
  text: { format: zodTextFormat(StaticVisionOutput, "static_visual_evidence") },
});
```

Use `original` only for selective dense/spatial rechecks and log estimated image-token dimensions before sending. Prompt rules distinguish observation from interpretation, require source evidence IDs and prohibit CTR/CVR/ROAS, eye-tracking, measured-recall and brain-activity claims. Persist request fingerprint, response ID, model and schema/prompt versions, not secrets or expiring URLs.

- [ ] **Step 4: Run adapter and policy tests**

Run: `pnpm vitest run tests/unit/static-gpt-vision.test.ts`

Expected: structured fixture parses; refusal/timeout becomes a stage state; claims or numeric scores are rejected.

- [ ] **Step 5: Commit**

```bash
git add packages/engines workers/cpu/src/stages/static-gpt-vision.ts tests/fixtures/engine/static-gpt-response.json tests/unit/static-gpt-vision.test.ts
git commit -m "feat: interpret static creatives with GPT-5.6 Sol"
```

### Task 6: Evaluate static rules and Standard scores

**Files:**

- Create: `config/rules/static-generic.v1.json`
- Create: `config/rules/static-brand.v1.json`
- Modify: `config/score-profiles/static-standard.v1.json`
- Create: `packages/analysis/src/rules/static.ts`
- Create: `packages/analysis/src/scoring/static-standard.ts`
- Create: `tests/fixtures/scoring/static-complete.json`
- Create: `tests/unit/static-scoring.test.ts`

- [ ] **Step 1: Write reconstruction tests**

Test category scores, overall weighted sum, rule inapplicability, no dynamic weight redistribution, boundary clamping and byte-stable output.

- [ ] **Step 2: Prove they fail**

Run: `pnpm vitest run tests/unit/static-scoring.test.ts`

Expected: FAIL because Static Standard scoring is not implemented.

- [ ] **Step 3: Implement visible versioned profiles**

```json
{
  "id": "static-standard.v1",
  "categories": {
    "attention_clarity": 0.25,
    "message_comprehension": 0.25,
    "brand_presence": 0.20,
    "conversion_readiness": 0.20,
    "platform_fitness": 0.10
  },
  "missingPolicy": "fail_required_or_mark_not_requested"
}
```

Generic category weights sum to 1. Platform/brand subrules affect only declared eligible components and use their explicit availability state. GPT semantic evidence may satisfy declared qualitative rule inputs but cannot set points directly.

- [ ] **Step 4: Run scoring tests**

Run: `pnpm vitest run tests/unit/static-scoring.test.ts`

Expected: Overall and category components reconstruct exactly from persisted rules.

- [ ] **Step 5: Commit**

```bash
git add config/rules config/score-profiles/static-standard.v1.json packages/analysis/src/rules/static.ts packages/analysis/src/scoring/static-standard.ts tests
git commit -m "feat: score Static Standard analyses deterministically"
```

### Task 7: Publish the evidence-first static report

**Files:**

- Create: `apps/web/src/app/analyses/[analysisId]/page.tsx`
- Create: `apps/web/src/app/analyses/[analysisId]/report/page.tsx`
- Create: `apps/web/src/components/report/ScoreSummary.tsx`
- Create: `apps/web/src/components/report/EvidenceFinding.tsx`
- Create: `apps/web/src/components/report/CategoryBreakdown.tsx`
- Create: `apps/web/src/components/report/AvailabilityBadge.tsx`
- Replace: `apps/web/src/app/results/[jobId]/page.tsx`
- Create: `tests/unit/static-report-ui.test.tsx`

- [ ] **Step 1: Write report-state tests**

Cover queued/running/failed/complete states, one Overall score, category scores, cited measurements/rules/findings/recommendations, raw JSON download, and Tribe/video dimensions visibly `NOT_APPLICABLE`.

- [ ] **Step 2: Prove they fail**

Run: `pnpm vitest run tests/unit/static-report-ui.test.tsx`

Expected: FAIL; existing results page substitutes polished mock data.

- [ ] **Step 3: Implement real report rendering**

Fetch only the authorized immutable report endpoint. Poll events while active, stop on terminal state, show sanitized stage failure without replacement data, and render evidence links that highlight boxes on the canonical creative. Remove `MOCK_JOB_DATA`, `MOCK_SCORES`, `MOCK_LLM_REPORT` and all fallback-to-demo logic.

- [ ] **Step 4: Run UI tests and mock scan**

Run: `pnpm vitest run tests/unit/static-report-ui.test.tsx && ! rg -n "MOCK_(JOB|SCORES|LLM)|fallback to demo" apps/web/src`

Expected: tests PASS and scan returns no match.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app apps/web/src/components/report tests/unit/static-report-ui.test.tsx
git commit -m "feat: publish evidence-first static reports"
```

### Task 8: Verify the complete Static Standard slice

**Files:**

- Create: `tests/e2e/static-standard.spec.ts`
- Create: `tests/e2e/static-standard-failure.spec.ts`
- Create: `tests/golden/static-standard.expected.json`
- Create: `docs/runbooks/static-standard.md`

- [ ] **Step 1: Write success and failure E2E tests**

Success asserts upload through immutable report. Failure asserts invalid media stops before providers, GPT refusal does not fabricate a report, retry is durable, other workspace gets 404 and delete revokes object access.

- [ ] **Step 2: Prove the E2E test fails before full wiring**

Run: `pnpm playwright test tests/e2e/static-standard.spec.ts tests/e2e/static-standard-failure.spec.ts`

Expected: at least one stage/report assertion fails until all handlers are registered.

- [ ] **Step 3: Register the complete stage graph**

Required order: `MEDIA_VALIDATE` -> parallel `STATIC_OCR_CV` and `STATIC_MEASURE_BASE` -> `STATIC_MEASURE_ENRICHED` -> `STATIC_GPT_VISION` -> `STATIC_RULES` -> `STATIC_SCORE` -> `REPORT_BUILD` -> `REPORT_VALIDATE` -> `REPORT_PUBLISH`. Each stage consumes explicit artifact/evidence hashes.

- [ ] **Step 4: Run slice verification**

Run: `pnpm verify && pnpm playwright test tests/e2e/static-standard.spec.ts tests/e2e/static-standard-failure.spec.ts`

Expected: all checks PASS; golden report matches after removing IDs/timestamps; no unavailable field is numeric zero.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e tests/golden docs/runbooks/static-standard.md workers/cpu/src/stages
git commit -m "feat: complete Static Standard vertical slice"
```

## Static Slice Exit Gate

- A real static creative completes end to end with production adapters in a staging environment.
- Invalid/hostile media is rejected before any provider spend.
- Every visible finding and recommendation opens at least one real evidence locator.
- Overall and category scores reconstruct from the exported score profile and rule results.
- Tribe, audio and temporal fields are `NOT_APPLICABLE`, never omitted or zero-filled.
- GPT-5.6 Sol request uses Responses API image input and Structured Outputs; refusal and timeout paths are tested.
- No demo/mock result can appear for a real analysis ID.
- Original/canonical assets obey the shared 30-day retention and immediate-delete contracts.