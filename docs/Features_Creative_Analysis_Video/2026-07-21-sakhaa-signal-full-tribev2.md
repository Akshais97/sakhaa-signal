Sakhaa Signal V1 Full Video with TribeV2 Implementation Plan

For agentic workers: REQUIRED SUB-SKILL: Use superpowers (recommended) or superpowers to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

Goal: Deliver the third customer journey: a user explicitly requests Full analysis, the verified real TribeV2 pipeline runs as an isolated Vast GPU stage, and the report adds four qualified deterministic model indicators plus a Full Overall Creative Score—or publishes an honest Standard partial result when TribeV2 fails.

Architecture: Treat the existing ignored TribeV2 build as untrusted deployment input until it passes an evidence/reproducibility gate. Package code and non-secret manifests in a versioned GPU image, keep licensed/large assets in a controlled build source, and make the Vast worker claim only TRIBE_INFERENCE tasks via outbound HTTPS. Store raw artifacts privately; the Signal CPU worker normalizes results, calculates indicators and publishes the final report.

Tech Stack: Previous plans plus Python/PyTorch CUDA image, existing TribeV2/neuralset stack, FastAPI client libraries only where useful for a local worker process, B2 signed URLs, Vast.ai non-interruptible instance, pytest, Docker and NVIDIA container runtime.

Global Constraints

Complete Foundation and Video Standard exit gates first.

No production execution until the real local build, weights, mappings, reference data and golden fixture are inventoried and checksummed.

Never commit model weights, customer media, secrets or licensed data merely to make Docker build.

Delete every random/mock prediction, embedding, fused tensor and report fallback from production paths.

TribeV2 failure cannot be converted into a plausible result; no fallback model is permitted.

Full has four qualified model indicators: Engagement Potential, Virality Potential, Conversion Strength and Brand Recall Indicator. They are model outputs/proxies, not measured human outcomes.

Final indicator and Full Overall numbers are deterministic/versioned application calculations; GPT cannot set them.

A Full request can end COMPLETED, COMPLETED_PARTIAL, FAILED or CANCELLED according to the approved stage policy.

In COMPLETED_PARTIAL, show the eligible Standard Overall only; all four Tribe indicators and Full Overall are unavailable with real failure metadata.

Vast worker uses outbound HTTPS, an opaque short-lived task lease and exact short-lived B2 URLs; no broad B2 credentials and no inbound public API are required.

Initial production target is one paid, non-interruptible Vast instance. Serverless is evaluated only after measured cold-start/image/asset timings.

Dependency and Output Contract

Consumes video-preprocess.v1, source/canonical hashes, transcript/audio artifacts, frame packet and Standard evidence. Produces tribe-input.v1, verified raw predictions/HCP/cluster artifacts, four indicator components, video-full.v1 score, Full report version and partial-completion semantics.

Task 1: Capture the authoritative TribeV2 provenance manifest

Files:

Create: scripts/tribe/inventory.py

Create: scripts/tribe/verify_manifest.py

Create: config/tribev2/source-manifest.v1.json

Create: config/tribev2/required-assets.v1.json

Create: docs/tribev2/provenance.md

Create: tests/tribe/test_manifest.py

Step 1: Write a failing manifest-completeness test

def test_manifest_has_no_unresolved_runtime_inputs():
    manifest = json.loads(Path("config/tribev2/source-manifest.v1.json").read_text())
    assert manifest["version"] == "tribev2-source.v1"
    assert manifest["git_commit"]
    assert all(item["sha256"] and item["bytes"] > 0 for item in manifest["assets"])
    assert set(manifest["required_roles"]) <= {item["role"] for item in manifest["assets"]}

Step 2: Prove it fails

Run: python -m pytest tests/tribe/test_manifest.py -q

Expected: FAIL because no tracked provenance manifest exists.

Step 3: Inventory the ignored build without tracking binaries

The script accepts an explicit --source-root, resolves code package version/commit if present, enumerates model checkpoints, .npy mapping files, reference CSVs, HCP annotations, feature encoders and configuration, calculates SHA-256/size and writes only the manifest. required-assets.v1.json declares semantic roles and controlled delivery locations, not local absolute paths.

Step 4: Verify the actual local build

Run: python scripts/tribe/inventory.py --source-root tribev2-main --output /tmp/tribe-manifest.json && python scripts/tribe/verify_manifest.py --expected config/tribev2/source-manifest.v1.json --actual /tmp/tribe-manifest.json

Expected: PASS with zero missing, changed or unexpected required assets. If the authoritative root has a different explicit local name, rerun with that exact name and record it only in the local command history; do not weaken the manifest.

Step 5: Commit

git add scripts/tribe config/tribev2 docs/tribev2/provenance.md tests/tribe/test_manifest.py
git commit -m "chore: capture TribeV2 source provenance"

Task 2: Create a real golden inference gate

Files:

Create: tests/tribe/fixtures/golden-input-manifest.json

Create: tests/tribe/fixtures/golden-expected-summary.json

Create: tests/tribe/test_golden_inference.py

Create: scripts/tribe/run_golden.py

Create: docs/tribev2/golden-validation.md

Step 1: Write the golden test against current production entrypoint

Test deterministic raw-output shape/dtype, finite values, HCP row count, 17 required cluster IDs, stable derived summary tolerance and no fixture/random provenance.

Step 2: Run it and record the real failure

Run: TRIBEV2_SOURCE_ROOT=tribev2-main python -m pytest tests/tribe/test_golden_inference.py -q

Expected: FAIL on at least one current issue: missing runtime asset, mock output provenance, non-determinism or incompatible output contract.

Step 3: Build the golden harness without masking errors

The harness invokes the actual local preprocessing/inference/mapping entrypoint with a rights-cleared compact video fixture stored through the test-asset mechanism, fixed seeds only where the real libraries require them, and deterministic CUDA settings documented. It captures software/CUDA/GPU versions and rejects random, mock, synthetic prediction, fallback, or zero-filled replacements in manifest provenance.

Step 4: Establish and rerun the approved baseline

Run: TRIBEV2_SOURCE_ROOT=tribev2-main python scripts/tribe/run_golden.py --verify

Expected: PASS on the approved GPU class with numerical tolerance documented in golden-validation.md; a second run produces the same summary within tolerance.

Step 5: Commit

git add tests/tribe scripts/tribe/run_golden.py docs/tribev2/golden-validation.md
git commit -m "test: establish real TribeV2 golden inference"

Task 3: Remove fabricated outputs and validate the Tribe artifact contract

Files:

Modify: apps/gpu-worker/app/pipeline.py

Modify: apps/gpu-worker/app/scoring.py

Delete: apps/gpu-worker/app/llm_explanation.py

Create: apps/gpu-worker/app/contracts.py

Create: apps/gpu-worker/app/provenance.py

Create: apps/gpu-worker/tests/test_pipeline_fail_closed.py

Create: apps/gpu-worker/tests/test_artifact_contract.py

Step 1: Write fail-closed tests

Patch real inference to raise and assert the stage fails with TRIBE_INFERENCE_FAILED, creates no prediction/cluster/score artifact and never calls NumPy random. Validate manifest hashes and array/dataframe shape constraints.

Step 2: Prove current code fails the tests

Run: python -m pytest apps/gpu-worker/tests/test_pipeline_fail_closed.py apps/gpu-worker/tests/test_artifact_contract.py -q

Expected: FAIL because current pipeline catches inference errors and generates random/mock artifacts.

Step 3: Make the pipeline fail closed

try:
    predictions = run_real_inference(inputs, assets)
except Exception as exc:
    raise TribeStageError("TRIBE_INFERENCE_FAILED", retryable=classify_retry(exc)) from exc

validate_predictions(predictions, expected_timepoints=inputs.timepoints)

Remove mock embedding/fusion creation, random brain predictions, broad exception substitution and the standalone LLM report. Produce a manifest with source/input/artifact hashes, dimensions, dtype, engine/assets versions and stage timings. Application scoring/report synthesis remains outside the GPU pipeline.

Step 4: Run focused and golden tests

Run: python -m pytest apps/gpu-worker/tests tests/tribe/test_golden_inference.py -q

Expected: all tests PASS and source scan finds no production random/mock output branch.

Step 5: Commit

git add apps/gpu-worker tests/tribe/test_golden_inference.py
git commit -m "fix: make TribeV2 inference fail closed"

Task 4: Package a reproducible GPU image

Files:

Modify: apps/gpu-worker/Dockerfile

Modify: apps/gpu-worker/requirements.txt

Create: apps/gpu-worker/requirements.lock

Create: apps/gpu-worker/app/assets.py

Create: apps/gpu-worker/app/health.py

Create: scripts/tribe/build_image.sh

Create: scripts/tribe/smoke_image.sh

Create: .dockerignore

Create: tests/tribe/test_container_manifest.py

Step 1: Write image-manifest tests

Assert base image digest, dependency lock hash, source manifest, model asset manifest and FFmpeg/CUDA/PyTorch versions are present; missing or wrong assets make readiness false.

Step 2: Prove they fail

Run: python -m pytest tests/tribe/test_container_manifest.py -q

Expected: FAIL because Dockerfile copies a missing ignored directory and dependencies are not locked.

Step 3: Implement controlled build inputs

Build context receives a verified source bundle and controlled asset directory prepared by verify_manifest.py; Dockerfile never assumes tribev2-main/tribev2-main. Pin the CUDA/PyTorch base by digest and Python dependencies by hashes. At startup, verify required asset SHA-256 values before advertising ready.

Step 4: Build and smoke-test on a GPU host

Run: bash scripts/tribe/build_image.sh sakhaa-signal-tribev2:source-v1 && bash scripts/tribe/smoke_image.sh sakhaa-signal-tribev2:source-v1

Expected: container readiness reports verified GPU/assets and golden inference PASS. CPU-only hosts may run manifest/unit tests but cannot satisfy this exit gate.

Step 5: Commit

git add apps/gpu-worker scripts/tribe .dockerignore tests/tribe/test_container_manifest.py
git commit -m "build: package reproducible TribeV2 GPU worker"

Task 5: Replace inbound/in-memory GPU jobs with leased outbound tasks

Files:

Replace: apps/gpu-worker/app/main.py

Create: apps/gpu-worker/app/control_client.py

Create: apps/gpu-worker/app/object_transfer.py

Create: apps/gpu-worker/app/runner.py

Create: apps/gpu-worker/app/settings.py

Create: apps/gpu-worker/tests/test_control_client.py

Create: apps/gpu-worker/tests/test_runner_leases.py

Create: apps/web/src/app/api/internal/tribe/tasks/claim/route.ts

Create: apps/web/src/app/api/internal/tribe/tasks/[taskId]/heartbeat/route.ts

Create: apps/web/src/app/api/internal/tribe/tasks/[taskId]/complete/route.ts

Create: apps/web/src/app/api/internal/tribe/tasks/[taskId]/fail/route.ts

Create: apps/web/src/lib/internal/worker-auth.ts

Create: tests/integration/tribe-task-api.test.ts

Step 1: Write authentication/lease tests

Cover missing worker secret, default/fallback token forbidden, scope/audience/expiry, one claim, heartbeat, stale completion, exact signed keys and idempotent completion.

Step 2: Prove they fail

Run: pnpm vitest run tests/integration/tribe-task-api.test.ts && python -m pytest apps/gpu-worker/tests/test_control_client.py apps/gpu-worker/tests/test_runner_leases.py -q

Expected: FAIL because current FastAPI stores jobs in memory and permits a development fallback token.

Step 3: Implement outbound worker loop

while True:
    task = control.claim(capabilities=verified_capabilities())
    if task is None:
        wait_with_jitter()
        continue
    with heartbeat_loop(task):
        result = runner.run(download_exact_inputs(task), cancellation=task.cancellation)
        control.complete(task.id, task.lease_token, upload_exact_outputs(task, result))

Worker auth secret is mandatory and rotated through Railway/Vast secrets. API authorizes only Tribe task routes, returns 60-minute input GET and output PUT URLs for server-generated keys, and rejects stale lease tokens. Remove BackgroundTasks, jobs_db, status polling and public /api/gpu/jobs/run.

Step 4: Run contract tests

Run: pnpm vitest run tests/integration/tribe-task-api.test.ts && python -m pytest apps/gpu-worker/tests/test_control_client.py apps/gpu-worker/tests/test_runner_leases.py -q

Expected: all tests PASS; restart resumes durable task state and duplicate completion is idempotent.

Step 5: Commit

git add apps/gpu-worker apps/web/src/app/api/internal/tribe apps/web/src/lib/internal tests/integration/tribe-task-api.test.ts
git commit -m "feat: run TribeV2 through outbound leased tasks"

Task 6: Normalize Tribe evidence and calculate four indicators

Files:

Create: config/tribev2/hcp-clusters.v1.json

Create: config/tribev2/indicator-profile.v1.json

Create: packages/analysis/src/tribe/artifacts.ts

Create: packages/analysis/src/tribe/clusters.ts

Create: packages/analysis/src/tribe/indicators.ts

Create: tests/fixtures/tribe/verified-output-manifest.json

Create: tests/unit/tribe-indicators.test.ts

Step 1: Write deterministic indicator tests

Test all 17 cluster keys, HCP mapping provenance, fixed transforms/weights, monotonic boundaries, no per-creative min/max, missing artifact failure and exact EP/VP/CS/BR reconstruction.

Step 2: Prove they fail

Run: pnpm vitest run tests/unit/tribe-indicators.test.ts

Expected: FAIL because current Python scoring min-max normalizes each creative and lacks the Signal evidence contract.

Step 3: Implement versioned application scoring

export type TribeIndicators = {
  engagementPotential: ScoreComponent;
  viralityPotential: ScoreComponent;
  conversionStrength: ScoreComponent;
  brandRecallIndicator: ScoreComponent;
};

The profile declares cluster inputs, transforms, penalties and fixed weights for each indicator. Persist raw cluster values, transformed components and explanatory qualified labels. Never label raw or derived values as actual neurological activation or observed user response.

Step 4: Run score reconstruction tests

Run: pnpm vitest run tests/unit/tribe-indicators.test.ts

Expected: verified fixture produces exact four indicators and changed profile version changes the fingerprint.

Step 5: Commit

git add config/tribev2 packages/analysis/src/tribe tests/fixtures/tribe tests/unit/tribe-indicators.test.ts
git commit -m "feat: calculate qualified TribeV2 indicators"

Task 7: Integrate Full, partial and incremental-upgrade orchestration

Files:

Create: workers/cpu/src/stages/tribe-dispatch.ts

Create: workers/cpu/src/stages/tribe-normalize.ts

Create: workers/cpu/src/stages/full-score.ts

Modify: workers/cpu/src/stages/video-stage-graph.ts

Create: apps/web/src/app/api/signal/analyses/[analysisId]/upgrade/route.ts

Create: packages/analysis/src/scoring/video-full.ts

Modify: config/score-profiles/video-full.v1.json

Create: tests/integration/full-stage-graph.test.ts

Create: tests/integration/tribe-upgrade.test.ts

Step 1: Write terminal-state tests

Cover Full success, Tribe transient retry, permanent failure -> COMPLETED_PARTIAL, Standard prerequisite failure -> FAILED, cancellation, late completion rejection, compatible upgrade reuse and incompatible upgrade reprocessing.

Step 2: Prove they fail

Run: pnpm vitest run tests/integration/full-stage-graph.test.ts tests/integration/tribe-upgrade.test.ts

Expected: FAIL because Full orchestration is absent.

Step 3: Implement explicit policy transitions

if (tribe.status === "SUCCEEDED") return publishFull();
if (tribe.terminalFailure && standardReport.status === "PUBLISHED") {
  return publishPartial({
    overall: standardReport.overall,
    fullOverall: { state: "FAILED" },
    tribeIndicators: failedIndicatorStates(tribe.errorCode),
  });
}
return failAnalysis();

An upgrade creates a new analysis/report version linked to the original, never mutates the Standard report, and reuses only artifacts passing the compatibility contract.

Step 4: Run orchestration tests

Run: pnpm vitest run tests/integration/full-stage-graph.test.ts tests/integration/tribe-upgrade.test.ts

Expected: all terminal/upgrade cases PASS and no failed Tribe weight is redistributed.

Step 5: Commit

git add workers/cpu/src/stages apps/web/src/app/api/signal/analyses packages/analysis/src/scoring config/score-profiles/video-full.v1.json tests/integration
git commit -m "feat: orchestrate Full and partial TribeV2 analyses"

Task 8: Render Full and partial evidence-first reports

Files:

Create: apps/web/src/components/report/TribeIndicatorGrid.tsx

Create: apps/web/src/components/report/TribeEvidence.tsx

Create: apps/web/src/components/report/PartialCompletionNotice.tsx

Modify: apps/web/src/app/analyses/[analysisId]/report/page.tsx

Create: tests/unit/full-report-ui.test.tsx

Step 1: Write semantic/UI tests

Full shows one Full Overall, four indicators, category details and qualified model language. Partial shows Standard Overall, no Full Overall, four failure states, failure reason/retry eligibility and never renders values from absent artifacts.

Step 2: Prove they fail

Run: pnpm vitest run tests/unit/full-report-ui.test.tsx

Expected: FAIL because Full/partial components are absent.

Step 3: Implement honest result states

Use labels model indicator, potential, strength and proxy evidence; avoid actual-brain, measured-memory and outcome-prediction language. Link indicator components to cluster/raw provenance and cross-modal findings to both Tribe and non-Tribe evidence where applicable.

Step 4: Run UI tests

Run: pnpm vitest run tests/unit/full-report-ui.test.tsx

Expected: tests PASS; a partial fixture contains no numeric Full/indicator value.

Step 5: Commit

git add apps/web/src/components/report apps/web/src/app/analyses tests/unit/full-report-ui.test.tsx
git commit -m "feat: render Full and partial TribeV2 reports"

Task 9: Deploy on Vast and verify the Full slice

Files:

Create: infra/vast/README.md

Create: infra/vast/worker.env.example

Create: infra/vast/start-worker.sh

Create: infra/vast/healthcheck.sh

Create: docs/runbooks/tribe-worker.md

Create: docs/runbooks/tribe-failure.md

Create: tests/e2e/video-full.spec.ts

Create: tests/e2e/video-full-partial.spec.ts

Create: tests/golden/video-full.expected.json

Step 1: Write staging acceptance tests

Full E2E asserts real verified worker provenance and four reconstructable indicators. Partial E2E intentionally stops the worker or injects a terminal task failure and asserts Standard-only partial publication.

Step 2: Prove staging is not yet ready

Run: pnpm playwright test tests/e2e/video-full.spec.ts tests/e2e/video-full-partial.spec.ts

Expected: FAIL until a verified Vast worker claims tasks.

Step 3: Provision the initial non-interruptible worker

Select a GPU matching the golden validation class, pull the immutable image digest, mount/download only verified assets, inject worker credential/control URL, run startup manifest/golden smoke and keep the process under restart supervision. Document credential rotation, draining, image rollback and orphan-task recovery.

Step 4: Run Full verification

Run: pnpm verify && pnpm playwright test tests/e2e/video-full.spec.ts tests/e2e/video-full-partial.spec.ts

Expected: both real success and partial-failure paths PASS; report artifacts match golden structure after volatile fields are removed.

Step 5: Commit

git add infra/vast docs/runbooks tests/e2e tests/golden/video-full.expected.json
git commit -m "feat: complete Full TribeV2 vertical slice"

Full TribeV2 Exit Gate

Ignored local assets match a tracked, reviewed provenance/checksum manifest.

Real golden inference passes twice on the production GPU class; no random/mock/fallback output exists.

GPU image is immutable, dependency-locked and fails readiness on an asset mismatch.

Vast reaches Signal via outbound HTTPS and owns only isolated leased Tribe tasks.

Full success produces four reconstructable qualified indicators and a reconstructable Full Overall.

Tribe failure produces COMPLETED_PARTIAL with Standard Overall only and numeric absence for Full/EP/VP/CS/BR.

Incremental upgrade creates a new immutable report and reuses only fingerprint-compatible artifacts.

Production language/evidence never represents proxy outputs as actual brain activity, measured memory or observed marketing performance.