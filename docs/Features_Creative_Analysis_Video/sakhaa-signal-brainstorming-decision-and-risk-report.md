# Sakhaa Signal — Brainstorming Decision and Risk Report

**Status:** Working document  
**Started:** 20 July 2026  
**Repository reviewed:** `Akshais97/sakhaa-signal`  
**Primary product source:** `creative-intelligence-product-and-system-design (1).md`

## Purpose

This report records the complete pre-development brainstorming process for Sakhaa Signal. It will retain:

- Each product and system question
- The selected answer and rejected alternatives
- Repository evidence that affected the decision
- Product, technical, operational and commercial failure points
- Agreed mitigations and scope boundaries
- The final recommended product and system design

This is a working decision record. Later sections will be added as the brainstorming process continues.

---

## Decision 1 — Product and repository boundary

### Question

Which product structure should Sakhaa Signal use?

1. **Independent Creative Intelligence product:** Separate Forge generation concepts and retain only reusable authentication, job, storage and TribeV2 components.
2. **Combined monorepo:** Keep Forge and Signal in one repository as explicitly separated applications and domains.
3. **Signal inside Forge:** Treat analysis, generation and publishing as one continuous product journey.

### User answer

**Option 1: Sakhaa Signal must be an independent Creative Intelligence product.**

### Decision

Sakhaa Signal will be designed as an independent pre-flight creative diagnostic platform. Sakhaa Forge generation, publishing, viral discovery, creator operations, payment and production-blueprint concerns are outside the Signal product boundary.

The Signal implementation may reuse proven infrastructure patterns or isolated components, but it must not inherit Forge-specific product entities merely because they already exist in the repository.

### Evidence behind the decision

The current repository contains conflicting identities:

- The root README describes Sakhaa Forge, a generation and publishing system.
- `AGENTS.md` describes a TribeV2 Ad Scorer.
- The uploaded product blueprint describes an evidence-backed Creative Intelligence analysis platform.
- The Prisma schema is dominated by Forge-oriented brand crawling, viral discovery, blueprint and generation entities.
- The Docker and GPU code follow an older TribeV2 scorer architecture.

Keeping these responsibilities mixed would create unclear ownership, unnecessary database coupling, conflicting lifecycle states and misleading implementation status.

### Immediate consequence

Before full development, the repository must receive one authoritative Signal product boundary and a Signal-specific data model. Existing code must be classified as one of:

- Reusable after verification
- Prototype/simulator only
- Forge-specific and out of scope
- Incorrect or unsafe and requiring replacement

---

## Confirmed early risks

These findings were identified during repository exploration and will be expanded and prioritized later:

1. Product identity and documentation conflict across the repository.
2. Several documentation links point to files that are not present.
3. The GPU Dockerfile references a local TribeV2 package that is not present.
4. Required HCP mapping and cluster-reference assets are missing.
5. The pipeline can replace failed inference with random synthetic predictions.
6. Mock embedding files are written as though they were real model artifacts.
7. The results UI can replace failed data retrieval with polished demo scores.
8. Existing EP/VP/CS/BR scores are based heavily on whole-video and within-creative proxies rather than calibrated, event-aligned measurements.
9. Existing job processing is in-memory and is lost when the GPU worker restarts.
10. The default and feature branches contain incompatible or incomplete production architectures.

---

## Decision 2 — V1 customer promise and claim boundary

### Question

What should Sakhaa Signal be allowed to claim in V1?

1. **Evidence-backed pre-flight diagnosis:** Report measurable creative construction, rule compliance and TribeV2 modelled cognitive indicators without presenting them as predicted advertising outcomes.
2. **Heuristic performance potential:** Present engagement, virality, conversion-support and brand-recall-potential scores as unvalidated estimates.
3. **Actual performance prediction:** Predict CTR, CVR, CPA, ROAS or campaign winners before connecting and validating real advertising-performance data.

### User answer

**Option 1: Evidence-backed pre-flight diagnosis.**

All features defined in `creative-intelligence-product-and-system-design (1).md` remain intended product capabilities. Their findings and scores must remain part of the evidence-backed pre-flight diagnosis rather than being represented as observed or guaranteed campaign performance.

### Decision

Sakhaa Signal V1 will diagnose how a creative is constructed before media spend begins. It may explain strengths, weaknesses, rule violations, modelled cognitive patterns and recommended edits, provided every conclusion is traceable to stored evidence and correctly labels the producing method.

The product will implement the blueprint's planned features under the following output taxonomy:

| Output class | Permitted V1 claim |
|---|---|
| Model detection | A named model or provider detected an observable element with recorded confidence. |
| Direct measurement | A value was read directly from the media or detection output. |
| Derived measurement | Versioned application code calculated a value from stored evidence. |
| Rule result | A versioned configured condition passed, failed or could not be evaluated. |
| Semantic judgment | GPT-5.6 Sol interpreted supplied evidence using a defined rubric. |
| Score | A visible, versioned combination of eligible measurements, rules and rubric results. |
| TribeV2 output | A modelled cognitive indicator generated by the versioned TribeV2 pipeline. |

EP, VP, CS and BR may remain as internal or user-facing model indicators only if their names and explanations do not imply measured campaign outcomes. They must not be described as predicted engagement, virality, conversion volume, sales or actual human recall without later outcome validation.

### Capabilities that may be claimed when implemented and verified

- Media metadata and technical-quality inspection
- OCR, transcript and timestamped copy extraction
- Detected logos, people, faces, objects, scenes and audio events
- CTA, copy, visual, brand, pacing, audio and compliance measurements
- Versioned platform and brand-rule evaluation
- Evidence-backed semantic findings and recommendations
- TribeV2's supported 17-cluster modelled cognitive indicators for video
- Transparent category scores with visible inputs, weighting, confidence and missing-data behaviour
- Static and video reports that expose unsupported or unavailable dimensions
- Evidence timeline, comparison and authorized report/artifact exports when those phases are implemented

### Claims prohibited in V1

- Guaranteed creative or campaign improvement
- Predicted or guaranteed CTR, CVR, CPA, ROAS, sales or campaign winner
- Actual eye-tracking, gaze share or percentage-seen claims
- Actual measurement of a specific viewer's brain activity, attention, emotion or memory
- Scientifically proven recall or persuasion outcomes from the current scores
- Legal approval of claims or disclaimers
- Unsupported static TribeV2 temporal or audio dimensions
- Treating a missing, failed or low-confidence engine result as a valid zero

### Product-language consequence

Reports and interfaces must use terms such as `detected`, `measured`, `derived`, `rule result`, `semantic assessment`, `modelled cognitive indicator`, `confidence` and `unavailable`. Language such as `will convert`, `will go viral`, `viewers definitely felt`, `proved recall` or `guaranteed winner` is prohibited.

---

## Open decisions

The following subjects will be resolved one question at a time:

- V1 customer promise and acceptable scientific/marketing claims
- Functional MVP boundary versus the complete long-term blueprint
- TribeV2’s role and score presentation
- Static versus video scope
- Evidence, measurement, rules and semantic-judgment separation
- CPU and GPU worker topology
- Job durability, retries and partial completion
- Provider selection and fallback behaviour
- Confidence, missing-data and failure-state handling
- Tenant isolation, media privacy and retention
- Cost ceiling and latency target per analysis
- Report structure, comparison and feedback
- Release gates and validation dataset

---

## Decision 3 — First release boundary and phased delivery

### Question

When the blueprint says that all planned features will be implemented, which capabilities must exist before the first real customer release?

1. **Phased roadmap:** Launch after the Phase 1 functional analysis MVP is trustworthy; deliver later blueprint phases incrementally.
2. **Phase 1 and Phase 2 before launch:** Require the complete evidence-rich workspace before accepting customers.
3. **All four blueprint phases before launch:** Require performance integrations, outcome models, generation and experimentation before release.

### User answer

**Option 1: Use the phased roadmap. Phase 1 is the first-release target.**

### Decision

The first customer release will be the blueprint's **Phase 1: Functional Analysis MVP**. All other features remain part of the intended product roadmap, but they will not block validation or release of the core diagnostic system.

### Phase 1 release scope

- Authentication and workspace authorization
- Direct private Backblaze B2 upload
- Analysis-job creation and progress polling
- Durable worker claim, lease and heartbeat lifecycle
- Shared FFmpeg/ffprobe preprocessing
- Static and video OCR/computer-vision evidence
- Timestamped transcription when audio exists
- Basic audio-event analysis when audio exists
- GPT-5.6 Sol structured evidence interpretation
- TribeV2 analysis for supported video inputs
- Reproducible basic measurements
- Versioned initial platform and brand rules
- Transparent initial category scoring
- Evidence-backed findings and recommendations
- Web report and structured JSON export
- Explicit partial-failure, unavailable and low-confidence states

### Deferred without being abandoned

The following capabilities remain planned but do not block the first release:

- Fully synchronized evidence timeline
- Configurable brand profiles and richer rule authoring
- Mature, versioned score-profile management
- Creative-version comparison
- PDF reports and complete analysis bundles
- User corrections and structured feedback workflows
- Revocable shareable reports
- Advertising-platform performance integrations
- Performance joins, benchmarks, fatigue and validated outcome models
- Creative generation, controlled variants and experimentation workflows

### Delivery consequence

Phase 1 must be implemented as one trustworthy end-to-end vertical product, not as disconnected mock screens or provider demos. Later-phase data needs may influence stable identifiers and evidence schemas, but later features must not be prematurely built into the Phase 1 runtime.

---

## Decision 4 — Phase 1 media scope

### Question

Which media types must the Phase 1 customer release support?

1. **Static and video:** Support both through separate media-specific engine applicability profiles.
2. **Video only:** Complete the video and TribeV2 pathway before adding static analysis.
3. **Static first:** Validate the lower-cost evidence pathway before adding video and TribeV2.

### User answer

**Option 1: Phase 1 must support both static creatives and videos.**

### Decision

Static and video inputs will share the same top-level job, evidence, finding, recommendation, rule and score contracts where their semantics are genuinely common. Each media type will have an explicit capability matrix defining required, conditional, unsupported and not-applicable engines.

The implementation must not force both media types through one fake universal pipeline.

### Static analysis profile

Required or supported:

- File metadata, dimensions, aspect ratio, file size and format validation
- Image-quality, sharpness, contrast and colour measurements
- OCR text, bounding boxes, confidence, hierarchy and readability measurements
- Logo, object, person, face and scene/label detections where supported
- Product, CTA, brand and visual-prominence measurements
- Composition, hierarchy, clutter and messaging interpretation
- Platform safe-zone and brand-rule evaluation
- Evidence-backed semantic findings and recommendations

Explicitly `NOT_APPLICABLE` unless a separately validated static calibration is introduced:

- Speech transcription
- Music and audio-event analysis
- Shot, cut, pacing and motion analysis
- Audio-visual binding
- Temporal reveal and end-card measurements
- Full video-trained TribeV2 output

### Video analysis profile

Required or supported:

- Media inspection and technical validation
- Dense opening-frame sampling and shot-aware representative frames
- OCR tracking and text visibility intervals
- Timestamped transcript when speech exists
- Audio-event, loudness and silence measurements when audio exists
- Logo, object, person, face and scene tracking where supported
- Product, brand and CTA reveal timing
- Pacing, motion, caption, end-card and sound-off analysis
- Full supported TribeV2 video analysis and 17-cluster output
- Synchronized evidence references for every finding

### Shared applicability states

Every engine and metric must return one of the following rather than fabricating a value:

- `AVAILABLE`
- `NOT_REQUESTED`
- `NOT_APPLICABLE`
- `NOT_DETECTED`
- `UNAVAILABLE`
- `LOW_CONFIDENCE`
- `FAILED`

### Failure prevented

This boundary prevents the product from supplying a static image with zeroed audio or invented temporal values to a video-trained pipeline and then presenting the resulting dimensions as meaningful analysis.

---

## Decision 5 — Repository refoundation strategy

### Question

How should the current `sakhaa-signal` repository be treated?

1. **Refound the existing repository:** Preserve its Git history and URL, treat current code as a prototype, and deliberately rearchitect it as Signal V1 while porting only verified components.
2. **Create a new repository:** Archive the current repository and build Signal from a separate clean foundation.
3. **Continue patching the current feature branch:** Retain the existing Forge-oriented schema and worker architecture while adding the blueprint features.

### User answer

**Option 1: Refound the existing repository.**

The existing TribeV2 configuration and Dockerization are important work that should be preserved and reused rather than discarded.

### Decision

The repository identity and Git history will be retained. Signal V1 will be developed through a deliberate rearchitecture boundary rather than by incrementally layering new features onto the existing mixed product model.

The current code will be treated as a prototype and evidence source. Existing components will enter the new Signal architecture only after they pass an explicit classification and verification process.

### Component classification gate

Each existing component must be classified as:

1. **Verified reusable:** Behaviour is real, dependencies are present, tests exercise the real path and outputs are reproducible.
2. **Reusable after repair:** The design is useful, but production gaps or missing contracts must be corrected.
3. **Simulator/prototype only:** Useful for UI or contract demonstrations but prohibited from real customer analysis.
4. **Forge-specific:** Remove from the Signal runtime and data model.
5. **Unsafe or misleading:** Replace before any production use.

### TribeV2 preservation rule

The known working TribeV2 pipeline, model assets, HCP mapping, cluster definitions, Docker build context and runtime configuration must be captured as one reproducible versioned unit before repository cleanup begins. No mock or synthetic fallback may be mistaken for the preserved real implementation.

### Current reproducibility gap

The current GitHub checkout does not independently reproduce the claimed Dockerized TribeV2 runtime:

- `apps/gpu-worker/Dockerfile` copies `tribev2-main/tribev2-main`, which is absent from the repository.
- `lh_fsaverage5_to_hcp_idx.npy` and `rh_fsaverage5_to_hcp_idx.npy` are referenced but absent.
- The 15-cluster and 17-cluster reference CSV files are referenced but absent.
- The pipeline converts inference failure into synthetic random predictions.
- Embedding and fused-tensor artifact files are currently mock text placeholders.

This does not establish that the earlier local or published Docker image is unusable. It establishes that the current repository is not yet the complete reproducible source of that working image.

### Refoundation approach

- Preserve the current default and feature branches as historical reference.
- Create a dedicated Signal V1 rearchitecture branch when implementation begins.
- Establish the authoritative Signal product documentation and schema before feature implementation.
- Capture and verify the real TribeV2 build inputs before deleting or moving prototype code.
- Remove Forge-only product entities from the Signal runtime rather than carrying them forward for convenience.
- Keep simulator fixtures explicitly isolated from production engine adapters.

---

## Decision 6 — Authoritative TribeV2 build source

### Question

Where is the authoritative TribeV2 build that previously ran successfully?

1. **Complete local build context exists:** The required TribeV2 package, mapping arrays, cluster references and related assets exist locally but were intentionally excluded from Git.
2. **Only the published Docker image is complete:** The source checkout is incomplete, while `akshais97/video-to-marketing-outcome:latest` contains the working runtime.
3. **GitHub was intended to be complete:** Required files were omitted accidentally and must be recovered from another branch or backup.

### User answer

**Option 1: Complete local build context exists.**

The files exist and were intentionally listed in `.gitignore`.

### Decision

The local TribeV2 build context is the authoritative recovery source for the existing integration. The GitHub omissions are intentional distribution omissions, not evidence that the working implementation was lost.

Before repository refoundation changes the worker, the complete local build must be captured as a reproducible release unit without committing restricted or oversized assets to the public repository.

### Reproducibility gate

The preserved TribeV2 unit must include:

- A manifest of every code package, model weight, annotation, mapping array, cluster-reference file and runtime dependency required by the real path.
- Immutable versions and SHA-256 checksums for all excluded artifacts.
- A documented, access-controlled retrieval or build-injection mechanism for Git-ignored artifacts.
- The exact Dockerfile, base image digest, system dependencies, Python lock state, model configuration and runtime command used for the known-good build.
- A clean-machine Docker build test proving that no undeclared local file is required.
- A small, legally usable golden-video fixture with expected structural outputs and tolerances.
- A startup self-check that fails closed when a required real asset is missing or has the wrong checksum.
- Clear separation between licensed/proprietary assets, secrets and redistributable source code.

### Failure prevented

This gate prevents a future developer or deployment environment from producing a superficially healthy container that silently falls back to random predictions because the Git-ignored scientific assets were never provisioned. It also prevents blindly placing large, licensed or sensitive artifacts into the public Git history merely to make the build complete.

---

## Decision 7 — Phase 1 treatment of EP, VP, CS and BR

### Question

How should the existing EP/VP/CS/BR indicators appear in Phase 1?

1. **Provisional model indicators:** Retain them as secondary TribeV2 indicators, clearly label their model-derived nature, expose version/confidence/limitations and never present them as predicted business outcomes.
2. **Internal only:** Capture them for research and calibration, but expose only evidence-backed 17-cluster findings to customers.
3. **Primary scores:** Continue presenting them prominently as the main dashboard scores despite current calibration limitations.

### User answer

**Option 1: Provisional model indicators.**

### Decision

Phase 1 will retain the following as secondary, model-derived pre-flight indicators:

- Engagement Potential (`EP`)
- Virality Potential (`VP`)
- Conversion Strength (`CS`)
- Brand Recall Indicator (`BR`)

These values may contribute to evidence-backed diagnosis, but they are not measured campaign outcomes, causal estimates or forecasts of CTR, CVR, CPA, ROAS, sharing, sales or actual brand recall.

### Customer-facing presentation rules

- Always display **Model Indicator** adjacent to each value; never rely solely on a buried disclaimer.
- Place the indicators below direct measurements and supported diagnostic findings, not above them as the primary verdict.
- Show the TribeV2 model version, indicator-definition version and score-profile version used for the run.
- Provide an evidence explanation describing which supported model signals contributed to the indicator.
- Expose confidence or reliability state separately from indicator magnitude.
- Distinguish `LOW_CONFIDENCE`, `UNAVAILABLE`, `FAILED` and `NOT_APPLICABLE` from a genuine low score.
- Prohibit copy such as “will go viral,” “will convert,” “predicted recall,” or numerical outcome-lift promises.

### Calibration gate

The current implementation's within-creative min-max normalization of the 17 cluster strengths is unsuitable for customer-facing calibrated scores. Because it forces every creative to contain a relative minimum and maximum, it can create strong-looking differences even when absolute evidence is weak and prevents meaningful comparison across creatives.

Before EP/VP/CS/BR are customer-visible, Phase 1 therefore requires:

- A documented formula or deterministic mapping for every indicator.
- A fixed, versioned reference scale rather than per-creative min-max normalization.
- Test fixtures covering flat, weak, extreme, incomplete and failed engine outputs.
- Clear bounds and missing-data behaviour.
- Repeatability tests against the same creative and model version.
- A visible `PROVISIONAL` calibration status until validated against an appropriate reference dataset.
- No percentile, benchmark or comparative-market language unless a real, versioned comparison population exists.

### Failure prevented

This decision preserves TribeV2 as a product differentiator while preventing an internally normalized neural-model output from being mistaken for a validated prediction of real advertising performance.

---

## Decision 8 — Railway CPU orchestration and Vast.ai GPU execution

### Question

Which Phase 1 worker topology should Sakhaa Signal use?

1. **Split CPU and GPU workers:** A durable CPU worker handles orchestration and non-GPU engines; an independently leased GPU worker handles only TribeV2 inference.
2. **One full GPU worker:** Run every engine and third-party API interaction inside the Vast.ai container.
3. **Vercel-driven callbacks:** Coordinate the pipeline through request-bound Next.js routes and callbacks from the GPU worker.

### User answer

Proceed with **Option 1** if it is feasible with a paid Railway deployment and Vast.ai.

### Feasibility finding

**Feasible, with explicit boundaries.**

Railway officially supports always-on background workers as separate services, including workers without a public domain. Its documentation also warns that a process restart can lose in-progress work unless the application handles graceful shutdown and durable recovery. This matches the proposed database-lease and heartbeat design. Railway Paid provides substantially more CPU, memory and ephemeral-storage headroom than the free tier, with usage-based billing; exact per-service sizing must still be load-tested. Sources: [Railway background workers and queues](https://docs.railway.com/guides/cron-workers-queues), [Railway pricing and plan resources](https://docs.railway.com/pricing/plans).

Vast.ai instances run a chosen Docker image with a custom entrypoint, dedicated GPU access and full outbound internet access. A pull worker therefore does not require a stable public GPU address or inbound callback port. Vast also offers a Serverless system for bursty inference and batch workloads, but adopting its request/worker contract would be a separate integration step rather than a zero-change deployment of the current long-running container. Sources: [Vast.ai instance overview](https://docs.vast.ai/guides/instances/overview), [Vast.ai networking](https://docs.vast.ai/guides/instances/connect/networking), [Vast Serverless](https://docs.vast.ai/guides/serverless).

### Decision

Phase 1 will use split execution:

#### Railway control and CPU plane

- Run the API and a separate always-on CPU orchestration worker as independent Railway services.
- Keep the CPU worker private; it does not need an inbound public domain.
- Let the CPU worker claim the top-level analysis job using an atomic database lease, renew it with heartbeats and resume safely after restart.
- Execute media validation, FFmpeg preprocessing, OCR coordination, transcription, audio/CV processing, measurement, rules, evidence assembly, LLM interpretation and report persistence outside the GPU worker.
- Store durable media and artifacts in Backblaze B2; use Railway local storage only as bounded disposable workspace.

#### Vast.ai GPU plane

- Package the verified TribeV2 runtime as a dedicated versioned GPU image.
- Give the GPU worker only a leased `tribe_inference` stage task, not ownership of the complete analysis job.
- Use outbound HTTPS from Vast to a narrowly scoped Railway worker API for claim, heartbeat and completion operations; do not expose a public callback server on the GPU instance.
- Transfer media through short-lived, task-scoped signed B2 URLs rather than broad storage credentials.
- Return versioned raw/derived TribeV2 artifacts and provenance to durable storage before acknowledging completion.
- Fail closed if the real TribeV2 code or required assets are missing; synthetic fallback is forbidden.

### Initial Vast operating mode

For the first production validation, use a standard non-interruptible Vast instance running the already working Docker entrypoint. This is the lowest-risk route to reuse the verified container.

After real timing, startup and request-volume data exists, evaluate Vast Serverless or API-driven instance provisioning. Scaling to zero is not assumed to be free: it introduces model-loading latency, artifact provisioning, recruitment availability and retry/idempotency requirements.

### Queue and lease rule

Supabase Postgres remains the durable source of truth for jobs and stage attempts. Phase 1 does not require Redis solely to connect Railway and Vast. Atomic claims, lease expiry, attempt numbers, idempotency keys and compare-and-set completion must be implemented at the database/service boundary.

### Required proof before launch

- A Railway restart during CPU processing results in lease recovery, not a stuck or duplicated customer job.
- A Vast worker termination during inference causes the stage lease to expire and retry safely.
- A late result from an earlier GPU attempt cannot overwrite the successful result of a newer attempt.
- Railway-to-Vast operation requires no inbound port on Vast.
- B2 URLs expire and are scoped to one task/object operation.
- Static-image analysis never waits for or pays for a GPU stage.
- CPU concurrency is bounded to avoid memory, disk and FFmpeg contention.
- Cost telemetry separates Railway CPU/RAM/egress, third-party API usage and Vast GPU time per job.

### Failure prevented

The split avoids paying GPU rates while waiting on external APIs, isolates TribeV2 crashes from the rest of the report and removes the current callback race. Durable leases are still mandatory because neither Railway restarts nor Vast instance availability provides exactly-once execution by itself.

---

## Decision 9 — Evidence-preserving partial completion

### Question

What should happen when one analysis engine fails?

1. **Evidence-preserving partial report:** Complete the report from successful engines, identify unavailable sections, omit dependent conclusions and permit stage-level retries. Fail the whole job only when an indispensable integrity stage fails.
2. **All or nothing:** Any individual engine failure fails the complete analysis.
3. **Always return a complete-looking report:** Replace missing evidence with proxies, estimates or LLM-generated assumptions.

### User answer

**Option 1: Evidence-preserving partial report.**

### Decision

Phase 1 will support honest partial completion. An optional or independent engine failure must not discard valid evidence already produced by other engines, but it must remain visible and must suppress every finding or score that depends on the missing evidence.

### Terminal job states

- `COMPLETED`: All requested applicable stages succeeded within confidence requirements.
- `COMPLETED_PARTIAL`: The report contains valid evidence, but one or more requested non-critical stages failed, timed out, remained low-confidence or were unavailable.
- `FAILED`: No trustworthy report can be produced because an indispensable integrity stage failed.
- `CANCELLED`: User- or system-authorized cancellation completed without presenting the job as analysed.

### Indispensable failure conditions

The complete job must fail when any of the following prevents trustworthy interpretation:

- The uploaded object cannot be securely retrieved or its integrity does not match recorded metadata.
- Media type, decoding or technical validation fails and no valid analysis input can be produced.
- Evidence/artifact persistence fails such that findings cannot be traced to their source.
- Job ownership, workspace authorization or requested analysis mode cannot be established.
- Report validation detects unsupported claims, dangling evidence references or schema corruption that cannot be repaired deterministically.

### Partial completion rules

- Each engine and derived metric records its own state, attempt count, error class and provenance.
- A missing engine invalidates only its dependent measurements, rules, findings and scores.
- The LLM may explain available evidence but may not infer or narratively fill an unavailable signal.
- The report header visibly states `Partial analysis` and lists affected sections.
- Retrying a failed stage creates a new attempt and report version; it never mutates provenance in place.
- A late result from an expired attempt is retained only for diagnostics and cannot silently complete the active report.
- Users must not see `0` where the correct state is `FAILED`, `UNAVAILABLE`, `NOT_REQUESTED` or `NOT_APPLICABLE`.

### Failure prevented

This policy avoids throwing away useful evidence because one provider was temporarily unavailable while also preventing a polished report from concealing gaps or substituting invented observations.

---

## Decision 10 — Selectable TribeV2 participation

### User requirement

Users must be able to run an analysis with TribeV2 and also run everything except TribeV2.

### Decision

Phase 1 will expose two explicit analysis modes:

1. **Full analysis with TribeV2** — `FULL_WITH_TRIBEV2`
2. **Standard analysis without TribeV2** — `STANDARD_NO_TRIBEV2`

The selected mode is a first-class, immutable input to a job attempt and must be visible in the job details, report header, exported JSON and audit trail.

### Full analysis with TribeV2

- Executes all applicable standard engines and requests the versioned TribeV2 GPU stage for supported video.
- Includes the supported 17-cluster outputs and provisional EP/VP/CS/BR model indicators when the TribeV2 stage succeeds.
- May finish `COMPLETED_PARTIAL` if TribeV2 was requested but fails and sufficient non-Tribe evidence remains.
- Clearly distinguishes a failed requested TribeV2 stage from a deliberately excluded one.

### Standard analysis without TribeV2

- Executes all applicable non-Tribe engines defined for the media type.
- Never enqueues, starts or waits for a Vast GPU task.
- Records the TribeV2 stage and every strictly dependent indicator as `NOT_REQUESTED`, not zero, failed or not applicable.
- Omits EP/VP/CS/BR values and any Tribe-derived recommendation rather than estimating them from other engines.
- Can still complete normally when all requested non-Tribe stages succeed.

### Applicability distinction

- `NOT_REQUESTED`: The user selected a mode that deliberately excludes the otherwise applicable engine.
- `NOT_APPLICABLE`: The engine does not validly apply to the media, such as the full video-trained TribeV2 path for a static image.
- `UNAVAILABLE` or `FAILED`: The engine was requested and applicable but could not produce a trustworthy result.

### Cost and product integrity rules

- The selected mode must be confirmed before enqueueing the analysis.
- UI and API responses must disclose whether GPU processing will be requested.
- Usage and cost accounting must separate the two modes.
- A no-Tribe report cannot use the same completeness badge or score denominator as a Tribe-enabled report without a visible capability-profile distinction.
- Caches and idempotency keys must include analysis mode, engine versions and score-profile versions.

### Failure prevented

This choice gives customers a lower-cost/faster path while preventing the system from silently charging for GPU work, displaying fabricated Tribe-derived scores or making reports from different capability profiles appear directly equivalent.

---

## Decision 11 — Incremental TribeV2 upgrade

### Question

After completing a supported video analysis without TribeV2, should users be able to add TribeV2 later?

1. **Incremental upgrade:** Run only the TribeV2 stage using compatible retained artifacts and generate a new report version; reprocess only when compatibility checks fail.
2. **Complete rerun:** Permit an upgrade, but rerun every engine from the original media.
3. **No upgrade:** Require a separate manually created analysis job.

### User answer

**Option 1: Incremental upgrade.**

### Decision

A `STANDARD_NO_TRIBEV2` analysis of supported video can later be upgraded to `FULL_WITH_TRIBEV2` without rerunning successful non-Tribe engines when the retained inputs remain verifiably compatible.

The upgrade creates a new immutable job attempt/report version linked to the original analysis. It does not edit the earlier report in place.

### Reuse eligibility gate

Existing preprocessing artifacts may be reused only when all of the following match the TribeV2 stage contract:

- Workspace and creative ownership.
- Original media object identifier, byte length and cryptographic hash.
- Media validation result and canonical media identity.
- Preprocessing pipeline version and parameters.
- Frame rate, resize/crop/pad policy, colour conversion and normalization.
- Audio handling where relevant to the model contract.
- Artifact checksums and storage integrity.
- TribeV2 input-schema version.

If any required field is absent or incompatible, the system must deterministically regenerate the necessary preprocessing stage from the original media. It must not silently feed stale artifacts into the GPU model.

### Versioning and provenance

- The original no-Tribe report remains accessible as its own immutable version.
- The upgraded report records `upgraded_from_job_id` and the specific reused artifact IDs.
- The TribeV2 model, image, asset-manifest, cluster-definition, indicator-definition and score-profile versions are captured.
- Existing non-Tribe evidence retains its original engine versions and timestamps rather than being falsely attributed to the upgrade time.
- The report diff identifies newly added TribeV2 findings and any conclusions whose availability changed.

### Cost and user experience

- Before confirmation, the UI states that the action requests paid GPU processing and shows the applicable usage/cost unit when pricing is introduced.
- Only the incremental GPU stage and required compatibility reprocessing are charged as new computation.
- If source media or required artifacts have expired, the user is told whether re-upload or full preprocessing is necessary before confirming.
- Static analyses cannot be upgraded through this path while the full TribeV2 model remains video-only.

### Failure prevented

This design avoids unnecessary repeat API/CPU cost while preventing artifact-version drift, hidden modification of historical reports and accidental comparison of outputs produced from different media bytes or preprocessing contracts.

---

## Decision 12 — Default media and artifact retention

### Question

What should the default media-retention policy be?

1. **Privacy-balanced retention:** Keep original media and heavy reusable preprocessing artifacts for 30 days by default; retain the report and its minimal evidence excerpts until report deletion; allow immediate user deletion.
2. **Indefinite retention:** Keep original media, evidence and intermediates until manual deletion.
3. **Immediate cleanup:** Delete original media and reusable intermediates when the report completes.

### User answer

**Option 1: Privacy-balanced retention.**

### Decision

Phase 1 will apply a default 30-day retention period to original uploaded media and heavy reusable preprocessing artifacts. Users may delete these assets earlier. After source media and incompatible reusable artifacts are purged, a later TribeV2 upgrade or reanalysis requires re-upload.

The structured report, provenance metadata and the minimum evidence excerpts necessary to substantiate retained findings remain available until the report is deleted or a workspace-level report policy expires them.

### Retention classes

#### Source media — 30-day default

- Original B2 upload and canonical validated media copy, if distinct.
- Deleted earlier upon an authorized user request.
- Required for reprocessing when an existing intermediate is incompatible.

#### Heavy reusable intermediates — 30-day default

- Decoded or normalized video, audio extraction, frame sets and model-input tensors.
- Automatically deleted when their source retention expires unless a shorter safety limit applies.
- Never retained merely because an orphaned or failed job references them.

#### Minimal report evidence — report lifetime

- Only the frame excerpts, crops, short transcript spans, timestamps, bounded audio features and other compact artifacts necessary to verify displayed findings.
- Stored with explicit links to evidence records and engine provenance.
- Deleted with the report unless a narrowly defined legal/security hold applies.
- Must not quietly become a second full copy of the uploaded creative.

#### Structured metadata and audit tombstones

- Job/report records, model versions, consent/retention selections, deletion events and non-content security audit metadata follow a separately documented metadata-retention schedule.
- A deletion tombstone may prove that deletion occurred but must not contain recoverable creative content.

### Required lifecycle behavior

- Record `retention_expires_at` when the upload is accepted; do not calculate expiry only at cleanup time.
- Show the expiry date and upgrade implications in the UI.
- Use an idempotent cleanup process that covers B2 objects, derived artifacts, database references and cached copies.
- New leases cannot start from media already marked for deletion.
- If deletion races an active job, cancel or safely terminate the job before deleting its inputs.
- A completed cleanup records per-object success/failure and retries transient failures.
- Signed URLs must expire far sooner than the stored object and cannot extend object retention.
- Backups, provider lifecycle rules and logs must be documented so the product does not promise instant physical erasure where a provider retains bounded backups.

### Upgrade implication

An incremental TribeV2 upgrade is available during the retention window when compatible artifacts exist. After expiry, the UI must request the original upload again and must not imply that a report evidence thumbnail is sufficient input for full reanalysis.

### Failure prevented

This policy bounds storage and privacy exposure while retaining a practical upgrade window. It also prevents nominal deletion in the database from leaving forgotten source files, frames or tensors indefinitely in object storage.

---

## Decision 13 — Phase 1 tenancy and platform roles

### Question

Who should be able to share a workspace in Phase 1?

1. **Single-member workspace initially:** Every account receives an isolated workspace; team invitations and workspace collaboration remain Phase 2.
2. **Multi-user teams immediately:** Include invitations and a full workspace-role hierarchy in Phase 1.
3. **No workspace model:** Attach jobs and reports directly to user accounts.

### User answer

**Option 1: Single-member workspace initially**, with two Phase 1 account roles:

- `USER`
- `SUPER_ADMIN`

The super admin receives selected perks and visibility into whether platform services are active.

### Decision

Phase 1 will retain a workspace-first data boundary while limiting each customer workspace to one normal member. This avoids building invitations and collaborative role management in the MVP without sacrificing the ownership boundary needed for later agency/team support.

`SUPER_ADMIN` is a platform-level operator role, not a member role inside every customer workspace. Platform privileges must be implemented as explicit administrative capabilities rather than as an unconditional bypass of workspace authorization.

### Data ownership model

- Every upload, creative, job, stage attempt, artifact, report and usage record belongs to exactly one workspace.
- A normal `USER` can access only the workspace attached to their authenticated membership.
- Every object-storage key and signed URL request is derived from an authorized workspace-owned record; clients cannot submit an arbitrary B2 key for signing.
- Database queries and API handlers enforce workspace scope even when an object ID is globally unique.
- The schema may support multiple memberships structurally, but Phase 1 UI/API rules allow only the single-member lifecycle.

### Platform role model

- Store `USER` and `SUPER_ADMIN` as explicit server-controlled account roles.
- Never derive super-admin status from an email domain, client-supplied claim, URL parameter or frontend-only check.
- Require server-side authorization on every administrative operation.
- Require strong authentication, with MFA mandatory for super admins before production access.
- Record every super-admin action in an append-only audit event containing actor, capability, target, reason, timestamp and result.
- Do not place super-admin credentials or service-role secrets in browser-accessible variables.

### Service-activeness visibility

The super-admin operational view may include:

- Railway API/CPU worker heartbeat and deployment version.
- Vast worker availability, last heartbeat, image/model version and current lease state.
- Queue depth, oldest queued-job age and jobs by terminal/active state.
- Per-engine availability and recent success/error/timeout rates.
- External-provider circuit state and last successful request without exposing provider secrets.
- B2/Supabase connectivity checks, cleanup backlog and failed deletion attempts.
- Aggregate latency and cost/usage telemetry.

A service must not be labelled healthy merely because its process responds. Readiness should include required configuration, asset-manifest validation and a recent successful synthetic or production-safe probe.

### Scope held for the next decision

The precise super-admin perks and whether an operator can ever inspect customer creative content are intentionally not assumed. That access boundary requires an explicit decision and audit model.

### Failure prevented

This separation prevents the current class of ID-only lookups and arbitrary storage-key signing from becoming cross-tenant exposure, while also preventing an operational dashboard from silently granting unrestricted access to every customer's confidential creative assets.

---

## Decision 14 — Super-admin customer-content visibility

### Question

What customer-content access should a super admin have?

1. **Operational access with audited break-glass:** Content hidden by default; temporary access requires a reason, expiry, MFA, audit and normally user approval.
2. **No content access:** Only service telemetry and anonymized job metadata are visible.
3. **Unrestricted access:** Super admins can open any customer upload or report without obtaining case-by-case customer approval.

### User answer

**Option 3: Unrestricted access.**

### Decision

An authenticated `SUPER_ADMIN` may view any customer upload, evidence artifact and report without prior customer approval or a time-limited break-glass grant.

This is a deliberate platform policy and must be disclosed accurately in the privacy notice and relevant customer terms. The product must not claim that customer creative content is inaccessible to platform operators.

The decision grants cross-workspace **read visibility**. It does not implicitly authorize editing reports, changing evidence, deleting content, extending retention, impersonating users, altering billing or starting/cancelling/retrying customer jobs. Those mutation capabilities require explicit separate authorization.

### Mandatory controls despite unrestricted visibility

- Require MFA for every super-admin account.
- Keep the number of super-admin accounts minimal and review the list regularly.
- Use server-side authorization and short-lived authenticated sessions; never expose a reusable storage master key to the browser.
- Generate short-lived signed object URLs only after the server records an authorized admin view event.
- Record each content view with actor, workspace, object/report, timestamp, source session/IP metadata where appropriate and outcome.
- Make admin-view audit events append-only and inaccessible to ordinary client mutation paths.
- Alert on bulk traversal, unusual download volume, new-device access and repeated cross-workspace browsing.
- Prevent bulk export unless a separate, explicit export capability is granted.
- Redact provider secrets, internal tokens and unrelated user authentication data even from the content interface.
- Revoke all active sessions immediately when super-admin status is removed.
- Include this access model in security review, incident response and employee/contractor access policy.

### UI separation

- Use a visually distinct admin surface and persistent `Admin mode` indicator.
- Show the customer workspace identity on every content view.
- Do not let an admin accidentally perform customer-facing actions from the inspection view.
- Keep normal user routes workspace-scoped; do not implement admin access by weakening the ordinary authorization middleware.

### Material risks accepted

- A compromised super-admin account can expose all retained customer creative content.
- Insider misuse has a broader blast radius than a break-glass model.
- Some enterprise customers may reject the platform or require contractual restrictions because operators can access content at will.
- Audit logs detect and investigate misuse but do not prevent an authorized super admin from viewing content.
- The policy increases the importance of retention minimization because every retained artifact is inside the administrative blast radius.

### Failure prevented

Although this decision accepts broad operator visibility, keeping it on a separate audited admin path prevents the implementation from achieving it through insecure ID-only routes or a global bypass that could also be exploited by ordinary users.

---

## Decision 15 — Super-admin capability tier and release boundary

### Question

Which additional super-admin perk tier should Phase 1 include?

1. **Operator and testing perks:** Service dashboard, non-billable admin-workspace analyses, beta features, diagnostic detail and health probes.
2. **Support controls:** Operator/testing perks plus audited retry/cancel actions for customer jobs and failed stages.
3. **Platform-owner controls:** Support controls plus account suspension, credits/plan overrides, retention overrides, feature flags and maintenance controls.

### User answer

**Option 3: Platform-owner controls**, but the immediate build must remain focused on the user experience. The admin product surface should come in a subsequent Phase 1 V2 release; V1 is for users.

### Decision

The Platform Owner capability tier is the intended super-admin destination, but it is explicitly deferred from the first user release.

To avoid confusion with the broader product roadmap phases, the Phase 1 delivery will be divided into:

- **Phase 1 V1 — User MVP:** The customer-facing upload, analysis, progress, evidence and report experience.
- **Phase 1 V2 — Admin Operations:** The dedicated super-admin dashboard and Platform Owner controls.

This release split does not move the uploaded blueprint's Phase 2 product features into Phase 1. Timeline drill-down, brand profiles, score profiles, comparisons, PDF export, sharing and feedback remain in the broader roadmap phase already assigned to them unless separately promoted.

### Phase 1 V1 user scope

- Authentication and single-member workspace creation.
- Secure static/video upload and media validation.
- Selection between full TribeV2 and no-TribeV2 analysis where applicable.
- Durable job progress, partial-completion visibility and clear retry behaviour.
- Evidence-backed findings, measurements, rules, qualified model indicators and report/JSON output.
- Media retention visibility, deletion and eligible incremental TribeV2 upgrade.
- User-facing usage/cost disclosure required by the chosen commercial model.

### Phase 1 V1 admin boundary

- The `SUPER_ADMIN` role may exist in the authorization model for bootstrap and future compatibility.
- No customer-facing milestone may depend on completing the admin dashboard.
- V1 must not ship half-secured customer mutation endpoints merely because a later admin UI will need them.
- Deployment/service health must still be available through Railway, Vast, Supabase, B2 and structured application logs during V1 operations.
- Any minimal emergency operator action used before V2 must be a controlled server-side procedure, not an undocumented public route.

### Phase 1 V2 intended admin scope

- Cross-workspace content inspection under Decision 14's audit controls.
- Service readiness, queue, engine, cleanup, latency, version and cost dashboards.
- Dedicated non-billable admin analyses and health probes.
- Audited retry/cancel/reprocess controls.
- User suspension and access restoration.
- Credits/plan and feature-flag controls.
- Retention overrides with explicit reason and audit history.
- Maintenance controls with safeguards against interrupting leased jobs.

### Mutation safety for V2

- Every privileged mutation requires a capability-specific server authorization check.
- High-impact actions require confirmation, reason capture and idempotency.
- Retention overrides cannot resurrect already deleted content.
- Credit or plan changes cannot rewrite historical usage records.
- Cancelling/retrying a job creates explicit state transitions and attempts rather than editing history.
- Feature and maintenance controls require scoped rollback paths.

### Failure prevented

This sequencing keeps the MVP centred on customer value while preventing the broad Platform Owner feature set from consuming V1 scope or encouraging premature global-bypass endpoints.

---

## Decision 16 — Railway replaces Vercel

### Question

Does Railway replace Vercel for the web application as well as hosting the CPU worker?

1. **Railway for the entire application:** Host Next.js/API and the CPU worker as separate Railway services; keep Supabase, B2 and Vast external.
2. **Vercel plus Railway:** Keep Next.js/API routes on Vercel and use Railway only for the worker.
3. **Split frontend and backend:** Put the Next.js frontend on Vercel and a separate application API/worker on Railway.

### User answer

**Option 1: Railway for the entire application.**

### Decision

Vercel is removed from the Phase 1 deployment architecture. Railway Paid will host both the user-facing Next.js application/API and the durable CPU orchestration worker as separate services. Supabase Auth/Postgres, Backblaze B2, external analysis providers and Vast.ai remain separate managed dependencies.

Railway documents deployment of Next.js applications and long-running private workers as supported patterns. It maps a multi-service application to separate Railway services rather than directly executing Docker Compose. Sources: [Railway Next.js deployment](https://docs.railway.com/guides/nextjs), [Railway workers](https://docs.railway.com/guides/cron-workers-queues), [Railway Docker Compose mapping](https://docs.railway.com/guides/docker-compose).

### Phase 1 service layout

#### `signal-web`

- Public Railway domain.
- Next.js standalone production build and user-facing UI.
- Authentication callbacks, upload authorization/completion, job/report APIs and narrowly scoped GPU-worker coordination endpoints.
- Request handlers enqueue or query durable work; they do not execute the analysis pipeline.

#### `signal-cpu-worker`

- Private always-on Railway service with no public domain.
- Claims and leases analysis jobs from Supabase Postgres.
- Runs FFmpeg/OpenCV and non-GPU engine orchestration with bounded concurrency.
- Persists outputs to B2/Postgres and submits the isolated TribeV2 stage when requested.

#### `signal-maintenance`

- A separately invoked/periodic cleanup and lease-recovery process; it may begin as a scheduled entrypoint rather than a permanently running service.
- Applies retention expiry, orphan cleanup, retry/dead-letter reconciliation and stale-lease recovery.

#### `tribev2-gpu-worker`

- Runs on Vast.ai, not Railway.
- Uses the verified GPU image and communicates outbound with the narrowly scoped Railway coordination API and signed B2 object URLs.

### Repository and deployment implications

- Define independent build roots/Dockerfiles or start commands for web and CPU worker services.
- Pin and align the repository's Node and package-manager versions; the current Node 20 Dockerfile conflicts with the repository's Node 24.15 engine declaration.
- Produce the Next.js standalone server expected by Railway deployment.
- Treat `docker-compose.yml` as a local-development description, not a Railway production deployment unit.
- Configure Supabase authentication redirect URLs for the Railway production and preview domains.
- Keep service/provider secrets in the relevant Railway service only; the browser receives no server secret.
- Use a stable canonical application URL so reports, auth callbacks and signed action links do not depend on ephemeral preview domains.

### Reliability rules

- Web deployment or restart must not invalidate active job leases owned by the CPU/GPU workers.
- CPU-worker restart must recover through the durable lease protocol.
- Database migrations run as a controlled pre-deploy/release step and are backwards compatible with the currently running web and worker versions.
- Health and readiness are distinct: a service is ready only when required configuration and dependencies for its role are valid.
- The UI derives progress from persisted job/stage state, not from an open Railway request.

### Cost and scaling implications

- Web and worker CPU/RAM limits scale independently.
- FFmpeg concurrency must be configured from measured memory, CPU, scratch-space and egress consumption rather than Railway's plan maximums.
- Direct browser-to-B2 uploads remain important so large media does not proxy through Railway and incur unnecessary application bandwidth or request failure risk.
- Per-job telemetry must attribute Railway compute and egress separately from external API and Vast GPU usage.

### Failure prevented

This decision eliminates the serverless callback/time-limit mismatch and reduces deployment fragmentation while preserving process isolation between user requests and long-running analysis work.

---

## Decision 17 — Explicit TribeV2 mode selection

### Question

How should video users choose the TribeV2 analysis mode?

1. **Explicit choice with no preselection:** Require a supported-video user to select Standard or Full with a capability, time and cost comparison.
2. **Full analysis by default:** Preselect TribeV2 while allowing opt-out.
3. **Standard analysis by default:** Preselect the no-Tribe path and present TribeV2 as an upgrade.

### User answer

**Option 1: Explicit choice with no preselection.**

### Decision

For each supported video, the user must explicitly select one of these modes before the analysis job can be created:

- **Standard Analysis** — `STANDARD_NO_TRIBEV2`
- **Full Analysis with TribeV2** — `FULL_WITH_TRIBEV2`

Neither mode is preselected. The browser and server both enforce the choice; omission cannot fall through to a default.

### Choice presentation

The confirmation surface must compare:

- Included and excluded engine families.
- Availability of 17-cluster TribeV2 results and EP/VP/CS/BR model indicators.
- Expected processing-time range, based on measured recent telemetry when available.
- GPU usage and the actual price/credit impact once commercial pricing is defined.
- The ability to add TribeV2 later during the source/artifact retention window.
- The fact that a requested TribeV2 failure may yield an honest partial report.

Marketing language must not describe Standard as inaccurate or Full as predicting real campaign outcomes. The difference is a capability profile, not a guarantee of business performance.

### Media applicability

- The selector appears only when the uploaded media is a supported video and TribeV2 is operationally available for selection.
- Static media does not show a misleading paid GPU choice; its full video-trained TribeV2 state is `NOT_APPLICABLE`.
- Unsupported or invalid video does not reach mode confirmation until validation explains the blocking condition.
- If TribeV2 is temporarily unavailable, the UI may offer Standard immediately and a later upgrade, but cannot accept a Full request it cannot durably queue unless the expected wait is disclosed.

### Job-contract rules

- The confirmed mode is persisted before enqueue and included in the idempotency key.
- It cannot be mutated on an active/completed attempt.
- Changing the choice before execution creates a new idempotent request state; adding TribeV2 after Standard follows Decision 11's versioned upgrade path.
- The API rejects missing, unknown or media-incompatible modes.
- The report and raw JSON identify the selected capability profile prominently.

### Failure prevented

This prevents accidental GPU charges, dark-pattern selection, ambiguous report completeness and a client-side default diverging from what the worker actually executed.

---

## Decision 18 — Evidence-first report hierarchy

### Question

What should users see first when a report opens?

1. **Evidence-first action report:** Lead with status, supported strengths/risks and prioritized changes; follow with category evidence, measurements, rules, qualified model indicators and technical detail.
2. **Score-first dashboard:** Lead with an overall score and EP/VP/CS/BR cards.
3. **Technical evidence explorer:** Lead with raw detections, timestamps, OCR boxes, transcripts and engine outputs.

### User answer

**Option 1: Evidence-first action report.**

### Decision

The Phase 1 V1 report is organized around actions that can be traced to evidence. It must answer, in order:

1. What analysis was actually completed?
2. What is working and what is at risk?
3. What should the marketer change first?
4. What evidence supports each conclusion?
5. What did each measurement, rule and model contribute?

Scores and TribeV2 indicators are supporting diagnostic layers, not the report's opening claim.

### Report order

#### 1. Analysis status and capability profile

- Media identity and type.
- `COMPLETED` or `COMPLETED_PARTIAL` state.
- Standard or Full-with-TribeV2 mode.
- Requested, successful, low-confidence, unavailable, failed, not-requested and not-applicable engines.
- Report, engine, rule, scoring and model versions.

#### 2. Executive diagnosis

- A concise evidence-bounded summary.
- Top supported strengths.
- Top supported risks or failure points.
- Clear acknowledgement of evidence gaps that constrain the diagnosis.

#### 3. Prioritized actions

- Ranked recommendations with priority, confidence and expected diagnostic rationale.
- Specific change direction rather than unsupported promises of performance lift.
- Direct evidence references and affected rules/measurements.
- No recommendation whose required evidence is missing.

#### 4. Category findings

- Hook/opening, clarity, branding, CTA, legibility, platform safety, pacing/structure, audio/sound-off and other applicable categories.
- Each finding distinguishes direct measurement, derived measurement, rule result, model indicator and semantic judgment.
- Evidence excerpts, timestamps/regions and confidence are shown close to the claim.

#### 5. Measurements and rule results

- Expected value, actual value, status, applicability and evidence.
- Rule/profile versions and deterministic calculation detail.
- No hidden normalization or unverifiable threshold.

#### 6. TribeV2 model indicators

- Supported 17-cluster data and provisional EP/VP/CS/BR indicators for successful Full analyses.
- Model/calibration limitations and confidence adjacent to values.
- `NOT_REQUESTED`, `NOT_APPLICABLE`, `UNAVAILABLE` or `FAILED` state in place of invented/zero values.

#### 7. Methodology and raw JSON

- Engine/model/provider versions, evidence provenance and report schema version.
- Machine-readable artifact link authorized to the same workspace.
- Error/partial-completion details sufficient for support without exposing secrets.

### Evidence-reference contract

Every finding and recommendation must reference existing evidence IDs. The report renderer validates that those IDs belong to the same job/report version and are authorized for the current workspace. GPT-generated text with an unknown or incompatible evidence reference is rejected before publication.

### Phase boundary

V1 may show timestamped evidence excerpts and ordered findings, but the blueprint's full synchronized interactive timeline remains Phase 2. The V1 report must not quietly absorb that larger workspace feature.

### Failure prevented

This hierarchy prevents attractive scores or fluent LLM prose from becoming more prominent than analysis completeness, measurable facts and traceable supporting evidence.

---

## Decision 19 — Three-level scoring hierarchy

### Question

Should Phase 1 V1 show one overall creative score?

1. **No overall score:** Use category measurements, rules, findings and qualified model indicators only.
2. **Versioned 0–100 overall score:** Include a decomposable weighted score with visible components, applicability handling and provisional status.
3. **Simple grade:** Show a traffic-light or letter grade.

### User answer

Use:

- One **Overall Creative Score**.
- Four major **Category Tribe Scores** aligned with the four main creative goals.
- The detailed category-level measurements, rule results, findings and other evidence beneath them.

### Decision

Phase 1 V1 will implement a three-level scoring hierarchy:

1. **Overall Creative Score** — one versioned composite summary.
2. **Four Major Goal/Tribe Scores** — the four high-level diagnostic dimensions.
3. **Category Evidence Layer** — category measurements, rule results, findings, recommendations and source evidence.

This hierarchy supplements, but does not replace, Decision 18's evidence-first status and diagnostic presentation. The report must show its completion/capability state beside the score summary so a partial report cannot appear fully comparable to a complete report.

### Overall Creative Score contract

- Use a bounded, versioned scale; the precise range and formula must be explicit in the scoring profile.
- Expose the four major-score contributions and any non-Tribe category components that influence the composite.
- Record component value, weight, applicability, confidence/reliability state and score-profile version.
- Never calculate the score through within-creative min-max normalization.
- Never substitute zero for missing, failed, unavailable, not-requested or not-applicable components.
- Do not claim that the score predicts CTR, CVR, CPA, ROAS, sales or campaign success.
- Label provisional/calibration status adjacent to the score where the reference scale has not been validated.

### Four major-score contract

- Each score must have a stable definition tied to its intended creative goal.
- TribeV2 inputs, direct/derived measurements, rules or semantic findings may contribute only through an explicit versioned mapping.
- A high-level score cannot cite a piece of evidence that its component calculation did not actually use.
- The UI provides a component breakdown from each major score into category evidence.
- A no-Tribe analysis must use a separately defined capability/scoring profile; it cannot silently reuse Tribe-dependent weights or fabricate the absent Tribe contribution.

### Category evidence layer

For each applicable category, show:

- Direct and derived measurements.
- Rule expectation, actual value, status and evidence.
- Supported findings and prioritized recommendations.
- Evidence type, timestamps/regions and confidence.
- Component contribution to a major score and, through it, the overall score where applicable.
- Missing/failed/not-requested/not-applicable state without converting it to a numerical zero.

### Comparability warning

`FULL_WITH_TRIBEV2` and `STANDARD_NO_TRIBEV2` reports have different capability profiles. Until both profiles are separately calibrated onto a justified common scale, the product must not present their Overall Creative Scores as directly equivalent or rank them together without a visible warning.

### Formula gate

No customer-facing Overall or Major Goal score may ship from a placeholder, LLM-generated number or undocumented arithmetic. Each requires a version-controlled deterministic profile, golden fixtures, edge-case tests and a decomposition that exactly reconstructs the displayed value.

### Open definition

The exact names and boundaries of the four Major Goal/Tribe Scores are to be confirmed explicitly. The current likely mapping is Engagement Potential, Virality Potential, Conversion Strength and Brand Recall Indicator, consistent with Decision 7.

### Failure prevented

This structure provides the requested concise decision signal without losing the measurements and evidence necessary to audit why the score exists or whether it is safe to compare.

---

## Decision 20 — Four major score identities

### Question

What are the exact four Major Goal/Tribe Scores?

1. **Existing four:** Engagement Potential, Virality Potential, Conversion Strength and Brand Recall Indicator.
2. **Measurement-oriented four:** Hook/Attention Strength, Message Clarity, Brand Presence and Action Readiness.
3. **User-selected goals:** Allow the user to select four goals for each analysis.

### User answer

**Option 1: Existing four.**

### Decision

The four Phase 1 V1 Major Goal/Tribe Scores are:

1. **Engagement Potential (`EP`)**
2. **Virality Potential (`VP`)**
3. **Conversion Strength (`CS`)**
4. **Brand Recall Indicator (`BR`)**

Each is a model-derived pre-flight indicator and must display `Model Indicator` and the applicable provisional/calibration state adjacent to its value.

### Semantic boundaries

#### Engagement Potential

Summarizes supported model and creative-construction signals associated with capturing and sustaining involvement. It is not observed engagement rate, watch time, click-through rate or a guarantee that viewers will engage.

#### Virality Potential

Summarizes supported model and creative-construction signals relevant to novelty, affective activation and share-oriented creative characteristics. It is not a probability of going viral, a forecast of shares or a benchmark against platform distribution unless separately validated performance data exists.

#### Conversion Strength

Summarizes supported signals relevant to message clarity, offer/action readiness, CTA construction and compatible model dimensions. It is not conversion rate, sales probability, CPA or ROAS prediction.

#### Brand Recall Indicator

Summarizes supported signals relevant to brand presence, timing, prominence, memory-related model dimensions and evidence-backed brand construction. It is not measured aided/unaided recall, neuroscience measurement or a guaranteed memory outcome.

### Display contract

- Show the plain-language name, code, `Model Indicator`, value, confidence/reliability state and version.
- Provide a component breakdown and direct links to supporting evidence.
- Keep the limitation text available at the point of interpretation, not only in general terms.
- Never abbreviate the four codes without an accessible definition.
- Never label BR simply `Brand Recall` in a way that implies an observed human-study result.
- Do not use outcome-prediction language in tooltips, exports, API field descriptions or LLM-generated summaries.

### Scoring profile contract

- Each indicator has its own versioned deterministic definition.
- Indicator definitions record eligible inputs, transforms, missing-data rules, weights, bounds and calibration status.
- A model or component version change that can change values produces a new indicator-definition version.
- The Overall Creative Score references exact EP/VP/CS/BR versions rather than four anonymous numbers.
- Test fixtures prove decomposition, boundary handling and the absence of per-creative min-max normalization.

### Failure prevented

This preserves the chosen product language while preventing the four diagnostic indicators from being presented as observed audience behaviour or validated forecasts of campaign performance.

---

## Decision 21 — Scoring for Standard analyses without TribeV2

### Question

What scoring should a `STANDARD_NO_TRIBEV2` report show?

1. **Separate Standard score profile:** Show an Overall Creative Score derived only from supported non-Tribe evidence; mark EP/VP/CS/BR `NOT_REQUESTED`; do not directly compare Standard and Full scores.
2. **No high-level scores:** Show category evidence only until TribeV2 is added.
3. **Estimate all five scores:** Produce Overall and EP/VP/CS/BR from non-Tribe evidence.

### User answer

**Option 1: Separate Standard score profile.**

### Decision

A Standard analysis will show one **Overall Creative Score — Standard Profile**, calculated exclusively from supported non-Tribe evidence. EP, VP, CS and BR remain visibly `NOT_REQUESTED` and receive no estimated values.

### Standard Profile inputs

Eligible inputs may include, when applicable and available:

- Direct technical and creative measurements.
- OCR/text geometry, visibility and reading-time measurements.
- Brand/logo, object/person/face and scene evidence.
- Shot, motion, pacing, end-card and reveal timing.
- Transcript, speech, sound-off and audio-event measurements.
- Versioned platform and brand-rule results.
- Evidence-constrained semantic findings whose deterministic score mapping is explicitly defined.

The LLM cannot directly invent or choose the numerical score. It may produce schema-valid findings that a deterministic scoring profile maps into defined components.

### Profile separation

- `STANDARD_PROFILE_V…` and `FULL_TRIBEV2_PROFILE_V…` are distinct scoring profiles.
- Each profile declares its eligible components, fixed reference scales, weights, missing-data policy and calibration status.
- The Standard score is not created by taking the Full formula and silently renormalizing away TribeV2 weights.
- Reports, exports and APIs display the profile name/version beside the value.
- Cross-profile ranking, winner badges and score deltas are prohibited until a validated bridge establishes comparability.

### Upgrade behaviour

Adding TribeV2 produces a new Full-profile report version. The UI may show which new evidence and indicators were added, but it must not describe the numerical change from Standard to Full as an improvement or decline because the scoring instruments differ.

### Partial Standard reports

When a requested non-Tribe engine fails, the Standard score follows its profile's explicit missing-data policy. It cannot treat failure as zero. Whether the score remains publishable depends on required-component coverage and confidence thresholds defined in the profile.

### Failure prevented

This gives no-Tribe users a useful high-level summary without relabelling non-Tribe evidence as TribeV2 indicators or creating false numerical comparability between two different analysis instruments.

---

## Decision 22 — Full-analysis scoring when TribeV2 fails

### Question

If TribeV2 fails during a Full analysis, what score should the partial report show?

1. **Downgrade to Standard Profile:** Publish a partial report with the Standard Overall Creative Score; mark EP/VP/CS/BR failed or unavailable; do not calculate a Full score.
2. **Reweighted partial Full score:** Redistribute missing TribeV2 weight across remaining components.
3. **Withhold the overall score:** Preserve evidence/findings but publish no Overall score until TribeV2 succeeds.

### User answer

**Option 1: Downgrade to Standard Profile.**

### Decision

When `FULL_WITH_TRIBEV2` was requested but the TribeV2 stage cannot produce trustworthy output, the job may publish an evidence-preserving `COMPLETED_PARTIAL` report using the **Overall Creative Score — Standard Profile**, provided the Standard profile's own evidence-coverage requirements are satisfied.

It does not calculate, estimate or display the Full Overall Creative Score. EP, VP, CS and BR use the actual requested-stage state such as `FAILED`, `UNAVAILABLE`, `LOW_CONFIDENCE` or timeout-derived failure; they are not `NOT_REQUESTED` because the user did request them.

### Report disclosure

The partial report must state prominently:

- Full Analysis with TribeV2 was requested.
- TribeV2 did not complete successfully and why, using a safe user-facing error category.
- The displayed Overall Creative Score uses the Standard Profile and therefore excludes TribeV2.
- EP/VP/CS/BR are unavailable for this report version.
- The TribeV2 stage can be retried without rerunning compatible successful stages.

### Score publication gate

- The Standard score is published only if its required non-Tribe components and confidence/coverage thresholds are satisfied.
- If Standard-profile requirements are also unmet, the report withholds the Overall score while preserving whatever trustworthy evidence remains.
- Missing Tribe weight is never redistributed inside the Full scoring profile.
- The report API includes `requested_profile`, `published_profile` and `profile_substitution_reason` as separate fields.
- The report card/badge uses `Partial — Standard score shown`, not a Full completion label.

### Retry behaviour

A later successful TribeV2 retry creates a new immutable Full-profile report version with EP/VP/CS/BR and the Full Overall score. The prior partial Standard-profile report remains in history. Any numerical difference is a profile change, not automatically a measured improvement or decline.

### Failure prevented

This preserves a useful score after a GPU/provider failure without disguising the missing TribeV2 contribution or manufacturing a Full score through opportunistic reweighting.

---

## Decision 23 — Optional explicit platform and placement targeting

### Question

How should platform-specific analysis be selected?

1. **Optional explicit targeting:** The user may choose a platform and placement; otherwise run a generic profile and mark platform-specific checks `NOT_REQUESTED`.
2. **Required targeting:** Every analysis requires a platform and placement.
3. **Automatic inference:** Infer platform/placement from aspect ratio, duration, filename or appearance.

### User answer

**Option 1: Optional explicit targeting.**

### Decision

Phase 1 V1 allows a user to explicitly select a supported platform and placement before analysis, but does not require it. When no target is selected, Sakhaa Signal runs a generic creative-analysis profile and does not apply or imply platform-specific rules.

### Targeting contract

- Store `target_platform`, `target_placement` and `platform_rule_profile_version` as explicit job inputs.
- Use stable enum/identifier values rather than accepting arbitrary labels into rule evaluation.
- Validate that the placement belongs to the selected platform and that a versioned rule profile exists.
- Display the selected target in the job and report headers.
- Include the selection in idempotency, caching, score-profile selection and exported JSON.
- Changing the target after completion creates a new report attempt/version rather than mutating historical rules.

### Generic mode

When no platform/placement is selected:

- Run media construction, evidence extraction, general creative measurements and applicable non-platform rules.
- Set platform-specific rules to `NOT_REQUESTED`, not pass, fail or not detected.
- Do not claim compliance with safe zones, duration limits, caption rules or placement-specific requirements.
- Label the report `Generic creative profile`.
- Allow a later platform-specific re-evaluation using compatible retained evidence and a new report version.

### Platform-specific mode

When an explicit supported target is selected:

- Apply only the versioned rules for that exact platform/placement.
- Store expected value, actual value, status, evidence and profile version for each rule.
- Distinguish official platform requirements from Sakhaa best-practice recommendations.
- Record the source URL/reference, effective date and last-reviewed date for time-sensitive rule definitions.
- Treat unknown or outdated rules as `UNAVAILABLE` rather than guessing.

### No automatic inference

Aspect ratio, duration, filename and creative style may be reported as measurements but cannot silently choose a platform. A 9:16 video can target several different placements with different rules.

### Failure prevented

This supports quick generic diagnosis while preventing a report from applying the wrong platform policy or representing unrequested placement checks as completed compliance validation.

---

## Decision 24 — Optional per-analysis brand references

### Question

How much brand context should V1 accept?

1. **Optional per-analysis references:** Accept a brand name, logo/reference images, expected colours, product names and brief notes for the current analysis; defer reusable brand profiles to Phase 2.
2. **Persistent brand profiles now:** Add reusable brand kits and custom rules in V1.
3. **No brand input:** Depend only on known-logo providers and model detection.

### User answer

**Option 1: Optional per-analysis references.**

### Decision

Phase 1 V1 allows optional brand context attached to an individual analysis. It does not introduce reusable brand-profile management, cross-analysis brand libraries or editable workspace-wide brand-rule sets; those remain Phase 2.

### V1 brand-context inputs

- Brand/display name and optional known aliases.
- One or more logo/reference images in supported static formats.
- Optional expected primary/secondary colours as explicit values.
- Optional product/product-line names.
- Short user-supplied context notes, subject to length and content controls.

All fields are optional. Absence of brand context does not block generic analysis, but it limits what the report can confirm about brand identity.

### Detection and evidence states

Brand/logo findings must distinguish:

- `KNOWN_LOGO_API`: A supported known-logo provider returned a match.
- `REFERENCE_MATCH`: The creative matched an uploaded user reference within the documented method/confidence threshold.
- `UNCONFIRMED`: A semantic/visual observation suggests a brand element but neither method confirmed identity.
- `NOT_DETECTED`: The applicable engines found no qualifying brand match.
- `LOW_CONFIDENCE`, `UNAVAILABLE` or `FAILED`: The engine state prevents a confident conclusion.

The LLM cannot promote `UNCONFIRMED` into confirmed brand presence.

### Brand-rule boundary

- V1 may evaluate deterministic rules derived directly from the submitted per-analysis inputs, such as expected brand name occurrence or reference-logo presence.
- V1 does not save those inputs as a reusable brand governance profile by default.
- V1 does not expose a general custom-rule builder.
- The submitted values and any derived per-analysis rules are immutable inputs to that job/report version.

### Security and data handling

- Reference uploads receive the same workspace authorization, media validation, signed-upload and retention controls as creative assets.
- User notes, filenames, OCR text and embedded media metadata are untrusted data, never system instructions for the LLM.
- Reference images are decoded through bounded media tooling; file extensions alone do not establish type.
- Notes have length limits and are stored distinctly from provider prompts and system policies.
- Brand references cannot be retrieved through arbitrary object-key signing.

### Report disclosure

The report identifies whether brand findings used supplied references, a known-logo provider or remained unconfirmed. It also states when no brand context was supplied so absence of a confirmed logo is not overinterpreted.

### Phase 2 migration

When reusable brand profiles arrive, a user may deliberately promote selected per-analysis inputs into a versioned profile. Existing reports continue to reference their original immutable job inputs rather than being retroactively changed.

### Failure prevented

This improves support for new and smaller brands while preventing unverified visual guesses, prompt injection through context fields and an accidental expansion of V1 into full brand-governance infrastructure.

---

## Decision 25 — Phase 1 V1 upload envelope

### Question

What upload envelope should Phase 1 V1 support?

1. **Ad-focused limits:** JPEG/PNG/WebP static files up to 25 MB; MP4/MOV/WebM video up to 500 MB and 3 minutes.
2. **Broader creative limits:** Static up to 50 MB; video up to 2 GB and 10 minutes.
3. **No firm product maximum:** Depend on infrastructure and per-workspace configuration.

### User answer

**Option 1: Ad-focused limits.**

### Decision

Phase 1 V1 accepts:

- **Static:** JPEG, PNG and WebP up to 25 MB.
- **Video:** MP4, MOV and WebM up to 500 MB and 180 seconds.

These are product limits enforced independently of Railway, B2 or provider maximums. A deployment with more available infrastructure does not silently enlarge the supported contract.

### Upload lifecycle

1. An authenticated workspace requests a short-lived B2 upload authorization for an allowed media class and declared size.
2. The object is written to a private workspace/job-specific quarantine key.
3. Upload completion verifies object existence, byte length, expected key ownership and recorded checksum where supported.
4. Bounded media inspection determines actual container/type, dimensions, duration, streams and codecs.
5. The system rejects spoofed, truncated, encrypted, malformed, oversized, over-duration or decoder-unsafe media before paid provider/GPU work.
6. Valid input receives a canonical media record and may be normalized for the applicable engines.

### Enforcement rules

- Filename extension and browser MIME type are hints, not proof of media type.
- Both presign-time declared size and post-upload actual size are enforced.
- Duration comes from media inspection, not client metadata.
- Container and codec support are distinct; an allowed MP4/MOV/WebM container with an unsupported stream is rejected or normalized only through a tested path.
- Pixel dimensions, decoded-pixel counts, stream counts, frame rate and decompression work receive bounded safety caps based on load tests, even when compressed bytes are below the advertised limit.
- Reject variable/corrupt timing that cannot be normalized deterministically.
- Never send invalid/quarantined media to Google, Groq, OpenAI or Vast.

### Normalization and provenance

- Preserve the original media hash and technical metadata.
- Record the FFmpeg/ffprobe version and exact normalization profile.
- Store normalized artifacts under derived keys, never overwrite the source object.
- Hash derived artifacts and link them to the source and preprocessing attempt.
- Reuse follows Decision 11's compatibility gate.

### User experience

- Show supported formats, 500 MB video size and three-minute duration limits before selection/upload.
- Reject known oversize files client-side for immediate feedback while retaining server/object verification as authoritative.
- Use precise error messages for size, duration, unsupported codec, corrupt media and temporary inspection failure.
- Do not consume an analysis credit or start paid engines when validation rejects the upload.

### Operational safeguards

- Set scratch-space and concurrency budgets so multiple near-limit files cannot exhaust the Railway worker.
- Apply timeouts and process limits to ffprobe/FFmpeg without treating timeout as a valid zero-duration asset.
- Clean quarantine and partial-upload objects through the retention/maintenance process.
- Measure size/duration distributions and failure rates before considering a limit increase.

### Failure prevented

This envelope makes cost, test coverage and processing time bounded while preventing polyglot/spoofed files, decompression bombs and unexpectedly long creatives from entering expensive analysis stages.

---

## Decision 26 — Refoundation delivery approach

### Approaches considered

#### Approach A — Evidence-first vertical slices

Refound the repository around Signal contracts and deliver real customer journeys vertically: Static Standard, Video Standard and then Full Video with the isolated TribeV2 stage. Each slice includes UI, durable work, real engines, evidence validation, scoring/report behaviour and failure handling.

#### Approach B — Engine platform first

Build the full evidence schema, orchestration, adapters, scoring system and providers before rebuilding the customer experience.

#### Approach C — User interface first

Build the upload/progress/report interface against fixtures before integrating the real analysis engines.

### User answer

**Approach A: Evidence-first vertical slices.**

### Decision

Approach A governs the detailed design and subsequent implementation plan.

### Vertical-slice order

1. **Foundation contract:** Signal-only product boundary, workspace authorization, media/job/evidence/report schemas, engine-state vocabulary and simulator isolation.
2. **Static Standard slice:** Real static upload, validation, analysis evidence, deterministic rules/scoring and evidence-backed report.
3. **Video Standard slice:** Real preprocessing, OCR/CV/transcript/audio/temporal evidence, Standard scoring and partial completion.
4. **Full Video TribeV2 slice:** Verified GPU artifact/image, isolated leased stage, 17 clusters, EP/VP/CS/BR and Full scoring.
5. **Operational completion:** Incremental Tribe upgrade, retention/deletion, cost telemetry, recovery/chaos tests and launch hardening.

### Definition of a vertical slice

A slice is not complete merely because its UI renders or an engine function runs. It must include:

- An authorized user path from upload to persisted report.
- Real production-mode processing without synthetic fallback.
- Durable stage state, leases, retries and idempotency.
- Evidence/provenance persistence and reference validation.
- Deterministic applicable rules and scoring.
- Honest partial/failure behaviour.
- Contract, integration and user-flow verification.
- Observability and per-stage timing/cost attribution.

### Simulator isolation

- Fixtures and simulators live behind an explicit non-production adapter/configuration.
- Production startup refuses simulator mode.
- Simulator outputs carry an unmistakable marker and cannot be written as customer production reports.
- The results UI never falls back to a successful-looking mock report after a fetch/error state.

### Why selected

This approach validates the user experience and production evidence contract together, preserves early feedback and directly attacks the current repository's highest risk: polished mock output masking missing or failed scientific/analysis execution.

---

## Design review approval 1 — Product boundary and V1 user flow

### Presented design

The proposed V1 customer journey covers authentication and an isolated workspace; direct private B2 upload and bounded media validation; optional per-analysis brand/platform context; explicit Standard versus Full TribeV2 selection for supported video; durable stage progress; an evidence-first report with the chosen score hierarchy; honest partial completion; 30-day source/intermediate retention; and incremental TribeV2 upgrade.

Forge domains and the Phase 1 V2 admin surface remain outside the V1 user release.

### User response

**Approved.**

### Status

Design Section 1 is locked for the design specification unless the user later requests a revision.

---

## Decision 27 — GPT-5.6 Sol as a multimodal visual-analysis engine

### User design correction

GPT-5.6 Sol must analyse the actual static creative or selected video frames, not only interpret OCR/CV text outputs. OCR and conventional CV alone cannot adequately determine composition, visual hierarchy, semantic prominence or whether elements are positioned appropriately for a social-media creative.

### Feasibility verification

OpenAI's official model documentation identifies GPT-5.6 Sol (`gpt-5.6`) as accepting text and image input. The official vision guide supports multiple image inputs in one Responses API request and exposes selectable detail levels. Sources: [GPT-5.6 Sol model](https://developers.openai.com/api/docs/models/gpt-5.6-sol), [OpenAI images and vision guide](https://developers.openai.com/api/docs/guides/images-vision).

### Decision

Phase 1 V1 includes a required **Multimodal Semantic Vision** engine implemented through the OpenAI Responses API with GPT-5.6 Sol. It receives both pixels and the structured evidence context generated by deterministic media/CV/OCR stages.

GPT-5.6 Sol has two distinct responsibilities:

1. **Visual-semantic analysis:** Interpret composition, visual hierarchy, focal emphasis, clutter, coherence, brand/CTA integration and other supported perceptual/marketing relationships visible in the submitted creative/frames.
2. **Evidence synthesis:** Produce schema-constrained findings and recommendations from the complete evidence bundle, including measurements, rules, transcript/audio evidence and TribeV2 when available.

These may be separate versioned calls so a synthesis retry does not necessarily repeat expensive visual input processing.

### Static visual packet

For static media, the engine receives:

- A canonical analysis rendering of the full creative.
- Optional deterministic overlays/crops for OCR boxes, detected brand/CTA candidates and selected platform safe zones.
- Image dimensions and normalized bounding boxes.
- OCR text/confidence, reference-brand context, selected platform/placement and direct pixel measurements.

The unobscured creative remains available alongside overlays so annotations do not alter semantic interpretation.

### Video visual packet

Video is not submitted as an unbounded file. The CPU pipeline creates a deterministic, timestamped frame packet containing:

- Dense opening frames covering the hook interval.
- Representative frames for detected shots.
- Frames around brand, product, CTA and text reveal events.
- End-card/closing frames.
- Additional frames selected for material scene/text/layout changes.

Each frame carries an immutable evidence ID, timestamp, source hash, extraction profile and any linked OCR/CV boxes. A versioned budget controls the maximum images per request. When evidence exceeds the budget, analysis uses deterministic batches plus a constrained aggregation pass; it does not drop frames based on an undocumented LLM choice.

### Detail and cost policy

- Set image `detail` explicitly rather than relying on the GPT-5.6 default, which official documentation states behaves like `original` and can consume more image tokens.
- Use `high` for normal frame interpretation.
- Use `original` selectively for dense spatial/text-sensitive creatives after resizing/pixel-budget safeguards.
- Persist input image dimensions, detail mode, image count and token/cost telemetry per call.
- Deduplicate identical/near-identical frames before submission through a deterministic threshold.

### Supported semantic findings

Subject to evidence and schema definitions, GPT-5.6 Sol may assess:

- Primary focal point and visual hierarchy.
- Whether CTA, offer, product and brand compete or reinforce one another.
- Perceived clutter, balance, grouping, isolation and compositional coherence.
- Semantic prominence and likely reading/viewing order.
- Whether placement appears appropriate within supplied platform overlays and rules.
- Cross-frame narrative/message continuity and reveal logic.
- Creative-message alignment with submitted brand/product context.

### Measurement boundary

GPT visual analysis remains a semantic judgment layer:

- Exact position, size, contrast, duration, safe-zone intersection and timing are calculated from pixels/timestamps by deterministic code.
- GPT may interpret why those measurements matter or identify a candidate relationship requiring validation.
- GPT cannot replace OCR/CV evidence with an unsupported observation, fabricate exact coordinates or convert a visual guess into confirmed logo identity.
- Platform-rule pass/fail status remains deterministic; GPT explains visual impact.

### Structured-output and evidence contract

Every GPT visual finding contains:

- Finding type/category.
- Claim and bounded rationale.
- Referenced frame/image evidence IDs.
- Optional referenced OCR/CV/measurement/rule IDs.
- Confidence and limitation state.
- Recommendation, when supported.

The application rejects unknown evidence IDs, cross-job references, prohibited outcome claims and findings that require a missing engine. GPT never returns the final numerical Overall, EP, VP, CS or BR values; deterministic profiles calculate them.

### Security and privacy

- User notes, OCR text, filenames, metadata and creative text are untrusted content, not instructions.
- Use a fixed versioned system/developer prompt and structured schema.
- Submit only authorized job artifacts through controlled short-lived access or supported vision-file input.
- Record provider request provenance without logging raw signed URLs, secrets or entire sensitive prompts unnecessarily.
- Apply report/media retention policy to any persisted provider-input derivatives.

### Failure behaviour

If GPT visual analysis fails, applicable deterministic evidence remains usable and the job may publish `COMPLETED_PARTIAL` only when the scoring/report profile's coverage gate permits it. The product cannot replace the missing semantic layer with generic marketing prose.

### Failure prevented

This addition closes the semantic gap left by OCR/CV while preventing GPT from becoming an ungrounded all-purpose scorer or claiming exact spatial facts that should be computed deterministically.

---

## Design review approval 2 — Architecture, orchestration and multimodal vision

### Presented design

The proposed architecture uses Railway for the public Next.js application/API, private CPU orchestration worker and maintenance entrypoint; Supabase for durable auth/Postgres state; B2 for private media/evidence; Vast for the isolated TribeV2 GPU stage; and external specialist providers.

Jobs and stages use atomic claims, opaque lease tokens, heartbeats, attempts, idempotency and compare-and-set completion. Requested engines reach terminal states before publication; late results cannot overwrite current attempts.

Following user correction, GPT-5.6 Sol is a required multimodal semantic-vision engine. It receives the static creative or a deterministic timestamped video-frame packet together with OCR/CV/measurement context. Exact geometry/timing remains deterministic, while GPT interprets composition, hierarchy, prominence, coherence and supported marketing implications through evidence-linked structured output.

### User response

**Approved.** Repeated approval messages are treated as a single approval of the same section.

### Status

Design Section 2 is locked for the design specification unless the user later requests a revision.

---

## Design review approval 3 — Evidence, scoring and report integrity

### Presented design

The approved evidence model separates raw observations, deterministic measurements, versioned rule results, GPT-5.6 Sol semantic judgments, score components, findings and recommendations. Every layer carries workspace/job ownership, producer/version, applicability, confidence and evidence provenance.

Full reports calculate category components, four deterministic EP/VP/CS/BR profiles and one visible weighted Overall Creative Score. Standard reports use a distinct non-Tribe Overall profile and leave EP/VP/CS/BR `NOT_REQUESTED`. Missing/failed states never become zero or trigger hidden reweighting.

GPT produces evidence-linked structured rubrics/findings, not final numerical scores. A publication validator verifies evidence ownership, arithmetic reconstruction, profile/capability labels, prohibited claims and simulator exclusion before an immutable report version becomes visible.

### User response

**Approved — proceed.**

### Status

Design Section 3 is locked for the design specification unless the user later requests a revision.

---

## Design review approval 4 — Security, reliability, retention and operations

### Presented design

The approved model enforces workspace ownership on every resource; server-generated B2 keys and scoped signed URLs; isolated worker/provider credentials; fail-closed production configuration; untrusted-content handling for GPT inputs; at-least-once stage execution with idempotent effects; bounded retries/circuit breakers/concurrency; durable 30-day source/intermediate retention and deletion states; traceable cost/health telemetry; and launch-blocking security, chaos and reconstruction tests.

Phase 1 V1 uses provider consoles, structured logs and alerts for operations. The consolidated Platform Owner surface remains Phase 1 V2.

### User response

**Approved.**

### Status

Design Section 4 is locked for the design specification unless the user later requests a revision.

---

## Design Section 5 revision — Approach A remains the governing structure

### User clarification

The selected **Approach A — Evidence-first vertical slices** must remain the governing implementation approach. All subsequently approved design decisions must be included inside that approach rather than becoming a separate or competing delivery plan.

### Revision

Approach A remains unchanged at the top level:

1. Static Standard analysis end to end.
2. Video Standard analysis end to end.
3. Full Video analysis by adding the isolated TribeV2 stage.
4. Scoring, reports, retention and incremental upgrade delivered through those slices.

The foundation and hardening work exist to enable and verify these vertical slices; they are not engine-first phases that postpone real user journeys.

### Cross-cutting completion contract for every slice

Each vertical slice must include, as applicable:

- User-facing upload/configuration/progress/report UI.
- Railway web/API and durable CPU-worker execution.
- Supabase workspace/job/evidence/report persistence.
- Private direct B2 media/artifact handling.
- Real specialist engines with no production simulator fallback.
- GPT-5.6 Sol multimodal visual analysis using the creative or deterministic video-frame packets.
- Evidence normalization, provenance and reference validation.
- Direct/derived measurements and versioned rules.
- The applicable Standard or Full deterministic score profile.
- Evidence-first report and raw JSON.
- Partial/failure/retry behaviour.
- Authorization, retention/deletion, observability and cost attribution.
- Contract, integration, end-to-end, security and failure verification.

### Slice mapping with approved decisions

#### Static Standard vertical slice

- Static limits/validation and direct B2 upload.
- Optional per-analysis brand references and platform/placement targeting.
- OCR, static CV and deterministic spatial/pixel measurements.
- GPT-5.6 Sol full-creative semantic vision with optional evidence overlays.
- Standard category scores and Overall Creative Score — Standard Profile.
- Evidence-first immutable report, partial states, raw JSON and retention/deletion.
- TribeV2 explicitly `NOT_APPLICABLE`.

#### Video Standard vertical slice

- Video limits/validation, FFmpeg normalization and durable orchestration.
- OCR/video CV, shots, motion, transcript, audio, reveal/timing evidence.
- Deterministic GPT-5.6 Sol frame packets and semantic vision/synthesis.
- Standard category scores and Overall Creative Score — Standard Profile.
- Evidence-first report, partial completion, retries, retention and later-upgrade eligibility.
- TribeV2 explicitly `NOT_REQUESTED`.

#### Full Video TribeV2 vertical slice

- Explicit unselected mode choice and Full request contract.
- Verified Vast GPU image, asset manifest and isolated leased inference task.
- Real 17-cluster evidence with no random/synthetic fallback.
- EP, VP, CS, BR and Full Overall Creative Score through versioned deterministic profiles.
- GPT synthesis receives the supported TribeV2 evidence in addition to the video visual/evidence packet.
- Tribe failure publishes the eligible partial Standard-profile fallback.
- Incremental upgrade from Standard creates a new immutable Full report version.

#### Cross-slice launch completion

- 30-day source/intermediate retention, immediate deletion and cleanup reconciliation.
- Cost/latency/engine telemetry and provider circuit breakers.
- Cross-workspace, arbitrary-key, prompt-injection, stale-lease and late-result tests.
- Production fail-closed configuration and simulator isolation.
- Railway deployment/migration/rollback/readiness verification.

### Phase boundary

Phase 1 V1 comprises the completed user-facing vertical slices. Phase 1 V2 adds the approved Platform Owner/admin surface after the V1 launch gates pass. Broader blueprint Phase 2 features remain deferred.

### Failure prevented

This revision prevents foundation, backend-engine or hardening tasks from turning into long horizontal phases that delay usable end-to-end customer journeys, while ensuring none of the approved technical safeguards are omitted from the selected vertical-slice strategy.

---

## Design review approval 5 — Evidence-first vertical-slice delivery

### Presented design

The final clarified delivery design contains three customer-facing vertical slices:

1. Static Standard Analysis.
2. Video Standard Analysis.
3. Full Video Analysis with TribeV2.

Each relevant slice includes UI, Railway/Supabase/B2 orchestration, real engines, GPT-5.6 Sol multimodal visual analysis, evidence normalization, measurements, rules, deterministic scoring, immutable reports, partial/failure behaviour, security, retention, observability and verification. Foundation work is a gate/enabler rather than a long backend-first phase; launch hardening is cross-cutting rather than postponed product value.

### User response

**Approved.**

### Status

Design Section 5 is locked. All five design sections are approved.

---

# Final pre-flight assessment

## Recommendation

**Proceed with the Sakhaa Signal refoundation using the approved evidence-first vertical-slice approach, but do not treat the current repository as production-ready.**

The product concept is feasible with Railway Paid, Supabase, Backblaze B2, external evidence providers, GPT-5.6 Sol and Vast.ai. The current repository contains valuable authentication, storage/job prototypes and TribeV2 work, but production development must first close the fail-open, reproducibility, tenancy, scoring and evidence-integrity gaps identified in this report.

## P0 launch blockers

1. **TribeV2 reproducibility:** Capture the complete Git-ignored local build, assets, mappings, references, versions and checksums; prove a clean build and golden-video run.
2. **Synthetic/mock output removal:** Remove random Tribe predictions, mock embeddings/fused tensors and results-page success fallbacks from production paths.
3. **Durable orchestration:** Replace in-memory jobs, request background tasks and callback races with Postgres-backed atomic leases, heartbeats, attempts and idempotent completion.
4. **Tenant/storage authorization:** Scope every lookup by workspace; eliminate arbitrary B2 key signing and local path traversal; use server-generated object keys.
5. **Evidence contract:** Normalize all engine outputs into owned/versioned evidence records and reject cross-job/dangling references.
6. **GPT visual contract:** Implement deterministic static/video image packets, structured evidence-linked output, prompt-injection separation and bounded cost/detail behaviour.
7. **Deterministic scoring:** Replace per-creative min-max normalization and undocumented proxies with versioned Standard/Full/category/EP/VP/CS/BR profiles and reconstruction tests.
8. **Claim safety:** Keep model-indicator qualifications visible and block outcome, eye-tracking, neuroscience and measured-recall claims unsupported by evidence.
9. **Railway/Vast reliability:** Prove restart, termination, stale lease, late result and partial-report behaviour in production-like tests.
10. **Retention/deletion:** Implement 30-day expiry, immediate user deletion, derived-artifact cleanup and deletion-race reconciliation across B2/database/cache/provider boundaries.

## P1 completion risks

- Provider quotas, latency and cost can make near-limit video analysis unpredictable without concurrency budgets and circuit breakers.
- GPT frame selection can miss important moments if the deterministic packet/batching contract is under-tested.
- OCR/logo providers may miss small/new brands; per-analysis references and explicit confidence states are mandatory.
- Standard and Full scores can be miscompared unless profile names/versions remain visible in UI and exports.
- Platform rules become stale; every rule profile needs source/effective/review dates.
- Broad future super-admin read visibility creates a high-impact compromise/insider blast radius even with audit logs.
- Railway/B2/provider egress and duplicated frame artifacts can dominate cost if telemetry and cleanup arrive late.
- Building Phase 1 V2 administration too early would distract from V1 customer value.

## Required proof points by vertical slice

### Static Standard

- Real supported static upload reaches a reconstructable evidence-first Standard report.
- GPT visual findings cite the submitted creative/overlay evidence and deterministic measurements.
- TribeV2 is `NOT_APPLICABLE`; unsupported dimensions are never fabricated.

### Video Standard

- Real supported video produces timestamped OCR/CV/transcript/audio/temporal evidence and deterministic GPT frame analysis.
- Provider/worker interruption yields recovery or an honest partial report rather than a mock success.
- Standard score components reconstruct exactly from stored evidence.

### Full Video with TribeV2

- Verified Vast image produces real 17-cluster artifacts and deterministic EP/VP/CS/BR/Full scoring.
- Tribe failure downgrades to the eligible partial Standard profile without reweighting.
- Incremental upgrade reuses only hash/version-compatible artifacts and produces a new immutable report.

## Explicitly deferred

- Multi-user workspace invitations and roles.
- Full Platform Owner/admin dashboard and mutations (Phase 1 V2).
- Persistent brand profiles and custom rule builder.
- Full synchronized timeline, comparison, PDF/bundle sharing and feedback/corrections.
- Performance-platform integrations, benchmarks and validated outcome models.
- Creative generation, variants and direct launch.

## Design status

- Clarification decisions: complete.
- Approach selection: complete — Approach A.
- Design sections 1–5: approved.
- Implementation authorization: not implied by this brainstorming session.
- Next Superpowers workflow: produce/review the design specification, then use `writing-plans` for an implementation plan.
