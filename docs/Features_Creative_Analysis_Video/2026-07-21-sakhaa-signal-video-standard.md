# Sakhaa Signal V1 Video Standard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the second complete customer journey: a user explicitly chooses Standard without TribeV2, uploads a supported video/Reel, and receives an evidence-first report based on real frame, OCR/CV, transcript, audio, temporal, GPT-5.6 Sol and deterministic rule evidence.

**Architecture:** Reuse the Foundation and static evidence/report contracts. Add bounded ffprobe/FFmpeg preprocessing, a deterministic shot/frame packet, provider adapters for video OCR/CV and timestamped transcription, YAMNet audio events, temporal measurements and GPT frame-sequence interpretation. Preserve compatible preprocessing artifacts for an incremental Full upgrade.

**Tech Stack:** Previous plans plus FFmpeg/ffprobe, Google Video Intelligence, Groq Whisper, Python 3.12 with TensorFlow Hub/YAMNet, OpenAI Responses API, Vitest, Pytest and Playwright.

## Global Constraints

- Complete the Foundation and Static Standard exit gates first.
- Accept verified MP4, MOV or WebM up to 500 MB and 180 seconds.
- The mode selector begins unselected. This plan implements only `STANDARD_NO_TRIBEV2`.
- Standard report states for TribeV2, EP, VP, CS and BR are `NOT_REQUESTED`.
- Timestamps are milliseconds from the inspected media timeline; never treat array indices as seconds.
- FFmpeg arguments are arrays, never interpolated shell strings; set time, stream, frame, pixel and output bounds.
- Frame selection is deterministic from source hash and preprocessing version.
- GPT receives still images, not a claimed native video understanding input: hook frames, representative shots, brand/CTA/reveal candidates and end card.
- Audio/transcript/provider absence uses explicit availability states and profile policy, not zeros or fabricated evidence.
- Preprocessing reuse requires exact source, artifact and version fingerprints.

## Dependency and Output Contract

Consumes the Foundation lifecycle and Static evidence/report components. Produces `video-preprocess.v1`, deterministic frame-packet, transcript/audio/temporal evidence, Video Standard score/report and reusable compatible inputs consumed by the Full TribeV2 plan.

### Task 1: Add explicit video-mode selection and capability comparison

**Files:**

- Create: `apps/web/src/components/analysis/VideoModeStep.tsx`
- Create: `apps/web/src/components/analysis/VideoUploadStep.tsx`
- Modify: `apps/web/src/components/analysis/AnalysisWizard.tsx`
- Create: `apps/web/src/lib/analysis/capabilities.ts`
- Create: `tests/unit/video-mode-step.test.tsx`

- [ ] **Step 1: Write the unselected-mode tests**

Assert Continue is disabled until a mode is selected, Standard states TribeV2 is excluded, Full states TribeV2 is included, and measured cost/time fields render as ranges or `Measuring` rather than invented constants.

- [ ] **Step 2: Prove they fail**

Run: `pnpm vitest run tests/unit/video-mode-step.test.tsx`

Expected: FAIL because no explicit mode step exists.

- [ ] **Step 3: Implement selection with no default**

```ts
type VideoMode = "STANDARD_NO_TRIBEV2" | "FULL_WITH_TRIBEV2";
const [mode, setMode] = useState<VideoMode | null>(null);
```

For this slice, selecting Full displays `Coming in the Full Analysis slice` and cannot submit until the Full plan lands. Standard submits its immutable mode and versioned capability quote.

- [ ] **Step 4: Run focused tests**

Run: `pnpm vitest run tests/unit/video-mode-step.test.tsx && pnpm typecheck`

Expected: tests PASS; mode is `null` at initial render.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/analysis apps/web/src/lib/analysis/capabilities.ts tests/unit/video-mode-step.test.tsx
git commit -m "feat: require explicit video analysis mode"
```

### Task 2: Inspect and normalize video safely

**Files:**

- Create: `workers/cpu/src/media/video/probe.ts`
- Create: `workers/cpu/src/media/video/validate.ts`
- Create: `workers/cpu/src/media/video/ffmpeg.ts`
- Create: `workers/cpu/src/media/video/preprocess.ts`
- Create: `workers/cpu/src/stages/video-stage-graph.ts`
- Create: `tests/fixtures/video/valid-6s.mp4`
- Create: `tests/fixtures/video/malformed-container.bin`
- Create: `tests/unit/video-validation.test.ts`

- [ ] **Step 1: Write container/codec/bounds tests**

Cover real container detection, >500 MB, >180 seconds, no video stream, extreme dimensions/frame rate, decoder timeout, malformed file and bounded argument construction.

- [ ] **Step 2: Prove they fail**

Run: `pnpm vitest run tests/unit/video-validation.test.ts`

Expected: FAIL because video validation is not part of the Signal worker.

- [ ] **Step 3: Implement a pinned preprocessing contract**

```ts
export const VIDEO_PREPROCESS_VERSION = "video-preprocess.v1";
export const VIDEO_LIMITS = {
  maxBytes: 500 * 1024 * 1024,
  maxDurationMs: 180_000,
  maxWidth: 4096,
  maxHeight: 4096,
  maxFrameRate: 120,
};
```

Create canonical H.264/AAC MP4, mono 16 kHz WAV, ffprobe JSON, shot-detection metadata and proxy frames. Record exact FFmpeg build/config and command manifest. Reject files before cloud engines on any contract breach.

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run tests/unit/video-validation.test.ts`

Expected: valid fixture produces deterministic artifact hashes; hostile fixtures fail closed.

- [ ] **Step 5: Commit**

```bash
git add workers/cpu/src/media/video workers/cpu/src/stages/video-stage-graph.ts tests/fixtures/video tests/unit/video-validation.test.ts
git commit -m "feat: validate and preprocess video creatives"
```

### Task 3: Build deterministic shots and frame packets

**Files:**

- Create: `packages/analysis/src/video/shots.ts`
- Create: `packages/analysis/src/video/frame-packet.ts`
- Create: `packages/analysis/src/video/frame-overlay.ts`
- Create: `tests/fixtures/video/valid-6s-shots.json`
- Create: `tests/unit/frame-packet.test.ts`

- [ ] **Step 1: Write deterministic selection tests**

Test hook coverage, each qualifying shot, deduplication by perceptual hash, brand/CTA/reveal candidates, end card and maximum packet/image-byte caps.

- [ ] **Step 2: Prove they fail**

Run: `pnpm vitest run tests/unit/frame-packet.test.ts`

Expected: FAIL because the packet builder is absent.

- [ ] **Step 3: Implement versioned selection**

```ts
export type FrameRole = "HOOK" | "SHOT" | "BRAND_CANDIDATE" | "CTA_CANDIDATE" | "REVEAL" | "END_CARD";
export type FramePacketItem = {
  frameId: string;
  timestampMs: number;
  role: FrameRole;
  artifactId: string;
  perceptualHash: string;
};
```

Select 0, 500, 1000, 2000 and 3000 ms hook frames when within duration, shot midpoints, evidence-triggered candidates and final stable end-card frame. Deduplicate without discarding required roles. Store packet JSON and contact-sheet overlay.

- [ ] **Step 4: Run selection tests**

Run: `pnpm vitest run tests/unit/frame-packet.test.ts`

Expected: identical inputs produce identical ordered packet and hash.

- [ ] **Step 5: Commit**

```bash
git add packages/analysis/src/video tests/fixtures/video/valid-6s-shots.json tests/unit/frame-packet.test.ts
git commit -m "feat: build deterministic video frame packets"
```

### Task 4: Add video OCR/CV and timestamped transcription

**Files:**

- Create: `packages/engines/src/video/google-video.ts`
- Create: `packages/engines/src/video/types.ts`
- Create: `packages/engines/src/transcript/groq-whisper.ts`
- Create: `packages/engines/src/transcript/types.ts`
- Create: `workers/cpu/src/stages/video-ocr-cv.ts`
- Create: `workers/cpu/src/stages/video-transcript.ts`
- Create: `tests/fixtures/engine/video-google-response.json`
- Create: `tests/fixtures/engine/groq-whisper-response.json`
- Create: `tests/unit/video-provider-normalization.test.ts`

- [ ] **Step 1: Write timestamp normalization tests**

Assert OCR segments, object/logo detections, shot annotations and transcript words map to millisecond ranges, normalized boxes and provider/version/input provenance.

- [ ] **Step 2: Prove they fail**

Run: `pnpm vitest run tests/unit/video-provider-normalization.test.ts`

Expected: FAIL because provider adapters are absent.

- [ ] **Step 3: Implement polling/retry adapters**

Google long-running operations store provider operation ID and resume polling after worker restart. Groq Whisper stores word/segment timestamps. Both sanitize provider errors, persist raw responses privately, normalize stable evidence IDs and reject timestamps outside probed duration.

- [ ] **Step 4: Run provider tests**

Run: `pnpm vitest run tests/unit/video-provider-normalization.test.ts`

Expected: normalized evidence is deterministic and out-of-range timestamps fail validation.

- [ ] **Step 5: Commit**

```bash
git add packages/engines/src/video packages/engines/src/transcript workers/cpu/src/stages tests/fixtures/engine tests/unit/video-provider-normalization.test.ts
git commit -m "feat: extract video vision and transcript evidence"
```

### Task 5: Analyze audio events with YAMNet

**Files:**

- Modify: `workers/python/pyproject.toml`
- Create: `workers/python/signal_audio/__init__.py`
- Create: `workers/python/signal_audio/yamnet.py`
- Create: `workers/python/signal_audio/cli.py`
- Create: `workers/python/tests/test_yamnet.py`
- Create: `workers/cpu/src/stages/video-audio-events.ts`

- [ ] **Step 1: Write Python window/timestamp tests**

Use a generated WAV fixture to test silence, top-class thresholding, window timestamps, version manifest and deterministic JSON order.

- [ ] **Step 2: Prove they fail**

Run: `python -m pytest workers/python/tests/test_yamnet.py -q`

Expected: FAIL because `signal_audio` is absent.

- [ ] **Step 3: Implement a bounded CLI contract**

```py
class AudioEvent(TypedDict):
    label: str
    score: float
    start_ms: int
    end_ms: int
```

Pin the YAMNet model checksum/class map. CPU worker invokes the CLI with explicit input/output paths and timeout, validates JSON with Zod, persists raw output and emits audio evidence. No audio stream becomes `NOT_APPLICABLE`; engine failure becomes `FAILED` according to profile policy.

- [ ] **Step 4: Run Python and bridge tests**

Run: `python -m pytest workers/python/tests/test_yamnet.py -q && pnpm vitest run tests/unit/video-provider-normalization.test.ts`

Expected: Python tests PASS and bridge rejects malformed JSON.

- [ ] **Step 5: Commit**

```bash
git add workers/python workers/cpu/src/stages/video-audio-events.ts
git commit -m "feat: extract timestamped video audio events"
```

### Task 6: Calculate temporal, motion and synchronization evidence

**Files:**

- Create: `packages/analysis/src/measurements/video.ts`
- Create: `packages/analysis/src/measurements/motion.ts`
- Create: `packages/analysis/src/measurements/synchronization.ts`
- Create: `tests/unit/video-measurements.test.ts`

- [ ] **Step 1: Write timeline measurement tests**

Test first-brand/CTA/product timestamps, logo exposure duration, text dwell time, cuts per second, shot-duration distribution, hook-window density, silence/speech/music windows and beat/cut alignment confidence.

- [ ] **Step 2: Prove they fail**

Run: `pnpm vitest run tests/unit/video-measurements.test.ts`

Expected: FAIL because video calculators are absent.

- [ ] **Step 3: Implement time-based calculations**

```ts
export function exposureMs(ranges: TimeRange[]): number {
  return mergeRanges(ranges).reduce((total, range) => total + range.endMs - range.startMs, 0);
}
```

All calculations consume millisecond evidence and probed duration. A semantic candidate is labelled candidate unless corroborated by OCR/logo/brand context. Beat alignment is reported with method/confidence, not as neural binding.

- [ ] **Step 4: Run measurement tests**

Run: `pnpm vitest run tests/unit/video-measurements.test.ts`

Expected: exact fixture values pass; no array index is used as elapsed time.

- [ ] **Step 5: Commit**

```bash
git add packages/analysis/src/measurements tests/unit/video-measurements.test.ts
git commit -m "feat: calculate video temporal measurements"
```

### Task 7: Add GPT-5.6 Sol frame-sequence interpretation

**Files:**

- Create: `packages/engines/src/openai/video-vision-schema.ts`
- Create: `packages/engines/src/openai/video-vision-prompt.ts`
- Create: `packages/engines/src/openai/video-vision.ts`
- Create: `workers/cpu/src/stages/video-gpt-vision.ts`
- Create: `tests/fixtures/engine/video-gpt-response.json`
- Create: `tests/unit/video-gpt-vision.test.ts`

- [ ] **Step 1: Write packet/request tests**

Assert ordered timestamps/roles appear in text, each image has a stable frame ID, `high` is default, selective spatial recheck may use `original`, output cites frame/evidence IDs, and schema excludes scores/outcome predictions.

- [ ] **Step 2: Prove they fail**

Run: `pnpm vitest run tests/unit/video-gpt-vision.test.ts`

Expected: FAIL because video GPT adapter is absent.

- [ ] **Step 3: Build a bounded Responses request**

Construct one or more requests under configured image/token limits. The prompt requests hook clarity, hierarchy, narrative progression, offer/CTA clarity, brand integration, semantic audio-visual fit and likely creative friction as model judgments. It explicitly forbids claims of observed attention, virality, conversion, memory, eye movement or brain response.

- [ ] **Step 4: Run adapter tests**

Run: `pnpm vitest run tests/unit/video-gpt-vision.test.ts`

Expected: packet order is preserved; uncited or prohibited outputs fail parsing/policy validation.

- [ ] **Step 5: Commit**

```bash
git add packages/engines/src/openai workers/cpu/src/stages/video-gpt-vision.ts tests/fixtures/engine/video-gpt-response.json tests/unit/video-gpt-vision.test.ts
git commit -m "feat: interpret video frame packets with GPT-5.6 Sol"
```

### Task 8: Score and publish Video Standard reports

**Files:**

- Create: `config/rules/video-generic.v1.json`
- Create: `config/rules/video-brand.v1.json`
- Modify: `config/score-profiles/video-standard.v1.json`
- Create: `packages/analysis/src/rules/video.ts`
- Create: `packages/analysis/src/scoring/video-standard.ts`
- Modify: `apps/web/src/components/report/ScoreSummary.tsx`
- Create: `apps/web/src/components/report/TimelineEvidence.tsx`
- Create: `tests/unit/video-standard-scoring.test.ts`
- Create: `tests/unit/video-report-ui.test.tsx`

- [ ] **Step 1: Write score and report-state tests**

Assert one Video Standard Overall, category detail, timeline evidence links, and EP/VP/CS/BR/Tribe `NOT_REQUESTED`. Missing optional audio does not become zero or trigger silent weight redistribution.

- [ ] **Step 2: Prove they fail**

Run: `pnpm vitest run tests/unit/video-standard-scoring.test.ts tests/unit/video-report-ui.test.tsx`

Expected: FAIL because Video Standard scoring/reporting is absent.

- [ ] **Step 3: Implement the Standard profile and UI**

Categories cover hook/attention structure, message comprehension, narrative/temporal clarity, brand presence, conversion readiness, audio-visual craft and platform fitness. The report labels all model judgments, shows raw measurements/rule outcomes and renders a frame strip/timeline rather than pseudo-neural visualizations.

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run tests/unit/video-standard-scoring.test.ts tests/unit/video-report-ui.test.tsx`

Expected: scores reconstruct and all Tribe-only fields render `Not requested`.

- [ ] **Step 5: Commit**

```bash
git add config/rules config/score-profiles/video-standard.v1.json packages/analysis apps/web/src/components/report tests/unit
git commit -m "feat: score and report Video Standard analyses"
```

### Task 9: Preserve upgrade-compatible artifacts and verify the slice

**Files:**

- Create: `packages/analysis/src/video/upgrade-compatibility.ts`
- Create: `apps/web/src/app/api/signal/analyses/[analysisId]/upgrade-quote/route.ts`
- Create: `tests/unit/video-upgrade-compatibility.test.ts`
- Create: `tests/e2e/video-standard.spec.ts`
- Create: `tests/e2e/video-standard-failure.spec.ts`
- Create: `tests/golden/video-standard.expected.json`
- Create: `docs/runbooks/video-standard.md`

- [ ] **Step 1: Write compatibility and E2E tests**

Compatibility requires matching source SHA-256, canonical-video SHA-256, preprocess version, FFmpeg manifest and Tribe input-contract version. E2E covers success, no-audio, provider retry, foreign access, cancellation and report immutability.

- [ ] **Step 2: Prove they fail**

Run: `pnpm vitest run tests/unit/video-upgrade-compatibility.test.ts && pnpm playwright test tests/e2e/video-standard.spec.ts`

Expected: FAIL until compatibility manifest and full stage graph are wired.

- [ ] **Step 3: Register the Video Standard graph**

Required order: validate -> preprocess -> parallel OCR/CV, transcript, audio and frame packet -> measurements -> GPT vision -> rules -> Standard score -> report validate/publish. Persist reusable artifacts with their 30-day expiry and return an upgrade quote only while all fingerprints remain compatible.

- [ ] **Step 4: Run slice verification**

Run: `pnpm verify && pnpm playwright test tests/e2e/video-standard.spec.ts tests/e2e/video-standard-failure.spec.ts`

Expected: all checks PASS and golden report contains no Tribe result or fabricated fallback.

- [ ] **Step 5: Commit**

```bash
git add packages/analysis/src/video apps/web/src/app/api/signal tests tests/golden docs/runbooks/video-standard.md workers/cpu/src/stages
git commit -m "feat: complete Video Standard vertical slice"
```

## Video Standard Exit Gate

- A real supported video completes on Railway staging without TribeV2 or GPU access.
- Media validation and FFmpeg resource bounds fail before provider spend.
- Frame-packet order and hashes reproduce across retries.
- OCR/CV, transcript, audio and GPT evidence retain millisecond/frame locators and provider versions.
- Standard Overall/category scores reconstruct deterministically; EP/VP/CS/BR are `NOT_REQUESTED`.
- Report failure never substitutes static, demo or Tribe data.
- Compatible artifacts can quote an incremental Full upgrade; any fingerprint mismatch requires fresh preprocessing.
- Original and heavy artifacts carry a 30-day expiry and immediate deletion remains available.