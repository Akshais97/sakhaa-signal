# Sakhaa Signal V1 Launch Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove that all three vertical slices are safe, truthful, recoverable, observable and economically bounded on Railway, Supabase, B2 and Vast before opening V1 to real users.

**Architecture:** Harden cross-cutting controls without turning them into a separate user product. Enforce claim policy at report publication, tenant isolation at data/object boundaries, retention through durable deletion tasks, service health through explicit signals, reliability through fault tests, and release through evidence-backed staging gates. Keep Platform Owner UI deferred to Phase 1 V2.

**Tech Stack:** Complete slice stack plus OpenTelemetry, structured JSON logging, provider usage/cost meters, dependency monitoring, Vitest/Playwright/pytest, Railway paid services, Supabase, Backblaze B2 and Vast.ai on-demand instances.

## Global Constraints

- Complete all three slice exit gates before production launch; hardening tasks may begin earlier when their consumed interface is stable.
- No V1 admin dashboard, customer mutation console, user suspension or cross-workspace browser. `SUPER_ADMIN` compatibility cannot broaden normal API paths.
- Super-admin cross-workspace reads require a separate audited service function, reason and immutable audit event; no implicit Prisma bypass.
- Do not log media, transcripts, prompts containing user content, signed URLs, provider secrets or raw report bodies.
- Reports remain evidence-backed pre-flight diagnoses. Disallowed performance/biometric/neuroscience claims block publication.
- Originals and heavy intermediates expire at 30 days by default; minimal immutable report evidence may live with the report; immediate user deletion is durable and idempotent.
- Railway deploy healthchecks are deployment gates, not continuous monitoring; configure separate continuous monitoring.
- Railway services use ephemeral disk only for bounded scratch space; durable state/artifacts live in Supabase/B2.
- Vast V1 uses on-demand/non-interruptible capacity by omitting bid price; no launch dependency on interruptible capacity.
- Every launch assertion must point to a test, dashboard query, runbook or signed release record.

## Current Provider Feasibility Evidence

- Railway supports monorepo services with per-package commands/watch paths and root/service config-as-code: https://docs.railway.com/deployments/monorepo
- Railway private networking provides per-environment `railway.internal` DNS for private CPU/maintenance services: https://docs.railway.com/private-networking
- Railway deployment healthchecks switch traffic only after HTTP 200 but are not continuous monitoring: https://docs.railway.com/deployments/healthchecks
- Railway paid-service disk is ephemeral and must not be the artifact system of record: https://docs.railway.com/services
- Vast on-demand instances are selected by omitting bid price; bid instances are interruptible: https://docs.vast.ai/api-reference/creating-instances-with-api
- Backblaze application keys can be bucket-, prefix-, capability- and time-restricted: https://www.backblaze.com/docs/cloud-storage-application-keys

## Dependency and Output Contract

Consumes all Foundation/Static/Video/Tribe contracts. Produces enforced claims, deletion/reconciliation, operational signals, reliability/security/evaluation evidence, cost limits, production infrastructure definitions, release checklist and Phase 1 V2 admin boundary record.

### Task 1: Enforce the public claim and terminology policy

**Files:**

- Modify: `packages/analysis/src/claims/policy.ts`
- Create: `config/claims/public-language.v1.json`
- Create: `packages/analysis/src/claims/scan.ts`
- Create: `scripts/scan-claims.mjs`
- Create: `tests/unit/claim-policy.test.ts`
- Create: `tests/golden/prohibited-claims.json`
- Modify: `scripts/verify.mjs`

- [ ] **Step 1: Write prohibited/qualified-language tests**

Block unqualified CTR, CVR, CPA, ROAS, sales, virality, conversion prediction, measured recall, eye tracking, gaze, attention measurement, brain activation and neurological response. Allow qualified phrases such as `Engagement Potential model indicator` and `pre-flight heuristic`.

- [ ] **Step 2: Prove gaps fail**

Run: `pnpm vitest run tests/unit/claim-policy.test.ts && node scripts/scan-claims.mjs`

Expected: FAIL on current Tribe UI phrases including neurological/brain assertions.

- [ ] **Step 3: Implement publication and tracked-source scanning**

```ts
export function assertPublishableClaims(report: Report): void {
  for (const text of reportTextFields(report)) {
    const violations = claimPolicy.scan(text);
    if (violations.length) throw new ReportPolicyError("PROHIBITED_CLAIM", violations);
  }
}
```

Run policy after report construction and before immutable publication. Source scan covers customer-facing JSX, prompts, rule descriptions and fixtures. Each permitted Tribe term requires adjacent qualification in the same report component.

- [ ] **Step 4: Run policy verification**

Run: `pnpm vitest run tests/unit/claim-policy.test.ts && node scripts/scan-claims.mjs`

Expected: tests PASS and tracked production/customer strings have zero violation.

- [ ] **Step 5: Commit**

```bash
git add packages/analysis/src/claims config/claims scripts/scan-claims.mjs scripts/verify.mjs tests
git commit -m "fix: enforce evidence-backed product claims"
```

### Task 2: Complete retention, immediate deletion and orphan cleanup

**Files:**

- Create: `packages/analysis/src/retention/policy.ts`
- Create: `workers/maintenance/src/retention.ts`
- Create: `workers/maintenance/src/orphans.ts`
- Create: `workers/maintenance/src/reconcile.ts`
- Modify: `apps/web/src/app/api/signal/analyses/[analysisId]/route.ts`
- Create: `apps/web/src/components/analysis/DeleteAnalysisButton.tsx`
- Create: `tests/integration/retention-deletion.test.ts`
- Create: `tests/integration/orphan-reconciliation.test.ts`

- [ ] **Step 1: Write lifecycle tests**

Cover 30-day original/heavy expiry, report-minimal evidence retention, immediate delete tombstone, signed-URL revocation, version deletion, repeated delete, failed object deletion retry and orphan multipart cleanup.

- [ ] **Step 2: Prove they fail**

Run: `pnpm vitest run tests/integration/retention-deletion.test.ts tests/integration/orphan-reconciliation.test.ts`

Expected: FAIL because cleanup/reconciliation is not complete.

- [ ] **Step 3: Implement durable deletion tasks**

```ts
await prisma.$transaction(async (tx) => {
  await tx.analysis.update({ where: scopedAnalysis, data: { status: "DELETION_PENDING", deletedAt: now } });
  await tx.deletionTask.createMany({ data: artifacts.map(toDeletionTask), skipDuplicates: true });
  await tx.auditEvent.create({ data: deletionRequestedEvent(context, analysisId) });
});
```

Maintenance deletes exact object versions where available, records attempts, verifies absence and finally redacts content-bearing database rows while retaining minimal audit/billing facts. Reconciliation compares managed DB keys and B2 prefixes without exposing objects cross-workspace.

- [ ] **Step 4: Run lifecycle tests**

Run: `pnpm vitest run tests/integration/retention-deletion.test.ts tests/integration/orphan-reconciliation.test.ts`

Expected: deletion is idempotent, retryable and leaves no retrievable signed URL.

- [ ] **Step 5: Commit**

```bash
git add packages/analysis/src/retention workers/maintenance apps/web/src/app/api/signal/analyses apps/web/src/components/analysis tests/integration
git commit -m "feat: enforce media retention and deletion"
```

### Task 3: Harden tenant isolation, worker identity and super-admin boundary

**Files:**

- Create: `packages/db/src/scoped.ts`
- Create: `apps/web/src/lib/auth/super-admin.ts`
- Create: `docs/adr/0001-super-admin-read-boundary.md`
- Create: `tests/rls/signal-isolation.test.mjs`
- Create: `tests/integration/object-access-isolation.test.ts`
- Create: `tests/integration/super-admin-audit.test.ts`
- Create: `tests/security/worker-auth.test.ts`

- [ ] **Step 1: Write negative-access tests**

Generate two workspaces and test every analysis/report/artifact/event/delete/upgrade path, object-key substitution, expired URL, stale worker token, incorrect audience and super-admin read without reason.

- [ ] **Step 2: Prove at least one boundary fails**

Run: `pnpm vitest run tests/integration/object-access-isolation.test.ts tests/integration/super-admin-audit.test.ts tests/security/worker-auth.test.ts && node --test tests/rls/signal-isolation.test.mjs`

Expected: FAIL until all routes use the scoped repository and audited admin boundary.

- [ ] **Step 3: Centralize scoped access**

```ts
export function analysisWhere(ctx: WorkspaceContext, id: string) {
  return { id, workspaceId: ctx.workspaceId, deletedAt: null } as const;
}
```

Normal routes cannot import an unscoped Prisma client. Super-admin read function requires `reason`, target workspace/resource, writes audit before returning data and is not exposed through V1 navigation. Worker tokens are secret-derived, scoped, expiring and have no development default in production.

- [ ] **Step 4: Run the security matrix**

Run: `pnpm vitest run tests/integration/object-access-isolation.test.ts tests/integration/super-admin-audit.test.ts tests/security/worker-auth.test.ts && node --test tests/rls/signal-isolation.test.mjs`

Expected: all negative cases return indistinguishable 404/401/403 envelopes as specified and admin reads create immutable audits.

- [ ] **Step 5: Commit**

```bash
git add packages/db/src apps/web/src/lib/auth docs/adr tests/rls tests/integration tests/security
git commit -m "fix: harden tenant and worker authorization"
```

### Task 4: Add structured observability and continuous service checks

**Files:**

- Create: `packages/observability/package.json`
- Create: `packages/observability/src/logger.ts`
- Create: `packages/observability/src/metrics.ts`
- Create: `packages/observability/src/tracing.ts`
- Create: `packages/observability/src/redaction.ts`
- Modify: `apps/web/src/app/api/health/route.ts`
- Create: `apps/web/src/app/api/ready/route.ts`
- Create: `workers/cpu/src/telemetry.ts`
- Create: `apps/gpu-worker/app/telemetry.py`
- Create: `config/alerts/v1.json`
- Create: `tests/unit/log-redaction.test.ts`
- Create: `tests/integration/readiness.test.ts`

- [ ] **Step 1: Write redaction/readiness tests**

Assert logs omit emails, media names, signed URL query strings, transcript text, prompts, API keys and authorization headers. Readiness distinguishes DB/B2/control-plane/worker capability without leaking secrets.

- [ ] **Step 2: Prove they fail**

Run: `pnpm vitest run tests/unit/log-redaction.test.ts tests/integration/readiness.test.ts`

Expected: FAIL because current logs and health checks are not governed by one redaction/readiness contract.

- [ ] **Step 3: Instrument useful service/stage signals**

Emit correlation IDs, analysis/stage IDs, workspace hash, attempt/lease age, durations, queue depth, stale leases, retries, terminal failures, provider latency/usage, deletion backlog and Tribe readiness. Configure continuous external checks separately because Railway healthchecks run only during deployment.

- [ ] **Step 4: Run observability tests**

Run: `pnpm vitest run tests/unit/log-redaction.test.ts tests/integration/readiness.test.ts`

Expected: fixtures redact content/secrets and readiness changes correctly when a dependency is unavailable.

- [ ] **Step 5: Commit**

```bash
git add packages/observability apps/web/src/app/api workers/cpu/src/telemetry.ts apps/gpu-worker/app/telemetry.py config/alerts tests
git commit -m "feat: add privacy-safe Signal observability"
```

### Task 5: Prove failure recovery with fault-injection tests

**Files:**

- Create: `tests/reliability/stage-crash.test.ts`
- Create: `tests/reliability/provider-timeout.test.ts`
- Create: `tests/reliability/b2-failure.test.ts`
- Create: `tests/reliability/tribe-disconnect.test.ts`
- Create: `tests/reliability/deploy-restart.test.ts`
- Create: `tests/reliability/cancellation-race.test.ts`
- Create: `scripts/run-reliability-suite.mjs`
- Create: `docs/runbooks/reliability.md`

- [ ] **Step 1: Encode the fault matrix**

For each stage inject process death before/after side effect, network timeout, duplicate completion, stale lease, B2 upload truncation, OpenAI refusal, provider rate limit, Vast disconnect and cancellation race.

- [ ] **Step 2: Run the matrix and capture failures**

Run: `node scripts/run-reliability-suite.mjs`

Expected: FAIL until handlers consistently checkpoint and classify retry/terminal states.

- [ ] **Step 3: Fix only failures revealed by the matrix**

Require idempotent artifact keys, content-hash verification, side-effect receipt before completion, resumable provider operation IDs, lease-token compare-and-set and cancellation checks before every paid or publish side effect.

- [ ] **Step 4: Rerun reliability suite**

Run: `node scripts/run-reliability-suite.mjs`

Expected: all injected failures converge to the specified retry, failed, cancelled or partial state without duplicate provider/customer effects.

- [ ] **Step 5: Commit**

```bash
git add tests/reliability scripts/run-reliability-suite.mjs docs/runbooks/reliability.md apps workers packages
git commit -m "test: prove durable analysis recovery"
```

### Task 6: Establish engine, prompt, rule and score evaluations

**Files:**

- Create: `evals/README.md`
- Create: `evals/manifest.v1.json`
- Create: `evals/static/expectations.json`
- Create: `evals/video/expectations.json`
- Create: `evals/tribe/expectations.json`
- Create: `scripts/run-evals.mjs`
- Create: `tests/evals/eval-manifest.test.ts`
- Create: `docs/runbooks/model-rule-release.md`

- [ ] **Step 1: Write eval-governance tests**

Require rights basis, media hash, expected evidence/rule/category boundaries, reviewer status, exclusions, engine/prompt/rule/score versions and no production customer data.

- [ ] **Step 2: Prove they fail**

Run: `pnpm vitest run tests/evals/eval-manifest.test.ts && node scripts/run-evals.mjs --offline`

Expected: FAIL because no governed eval set exists.

- [ ] **Step 3: Build a small representative release suite**

Include static/video formats, text-heavy/minimal, clear/unclear CTA, early/late brand, silent/spoken/music, platform/no-platform and Full/partial cases. Offline mode replays captured provider outputs; staging mode runs live providers against rights-cleared assets and reports drift without auto-accepting baselines.

- [ ] **Step 4: Run evals**

Run: `node scripts/run-evals.mjs --offline && node scripts/run-evals.mjs --staging`

Expected: schema/claim/citation pass rate 100%; numerical drift within approved per-component tolerances; live semantic differences require recorded review.

- [ ] **Step 5: Commit**

```bash
git add evals scripts/run-evals.mjs tests/evals docs/runbooks/model-rule-release.md
git commit -m "test: govern Signal engine and scoring releases"
```

### Task 7: Enforce usage, cost and abuse limits

**Files:**

- Create: `packages/analysis/src/usage/meter.ts`
- Create: `packages/analysis/src/usage/limits.ts`
- Create: `apps/web/src/lib/http/rate-limit.ts`
- Create: `config/usage/v1.json`
- Create: `tests/integration/usage-limits.test.ts`
- Create: `tests/unit/cost-meter.test.ts`

- [ ] **Step 1: Write budget/rate-limit tests**

Cover per-user concurrent jobs, daily upload bytes, provider-call idempotency, frame/image packet caps, OpenAI token estimates/actuals, GPU minutes and retry budget exhaustion.

- [ ] **Step 2: Prove they fail**

Run: `pnpm vitest run tests/integration/usage-limits.test.ts tests/unit/cost-meter.test.ts`

Expected: FAIL because usage is not enforced through one durable meter.

- [ ] **Step 3: Implement reservation and reconciliation**

Reserve estimated usage transactionally before accepting paid stages, reconcile actual provider/GPU units after completion, release cancelled reservations and block over-budget retries with a user-visible code. Do not invent plan pricing; expose config-backed operational limits until commercial plans are approved.

- [ ] **Step 4: Run usage tests**

Run: `pnpm vitest run tests/integration/usage-limits.test.ts tests/unit/cost-meter.test.ts`

Expected: duplicate attempts do not double-charge meters and over-limit requests fail before provider calls.

- [ ] **Step 5: Commit**

```bash
git add packages/analysis/src/usage apps/web/src/lib/http config/usage tests
git commit -m "feat: bound Signal usage and provider cost"
```

### Task 8: Finalize production deployment and rollback evidence

**Files:**

- Modify: `railway.toml`
- Create: `apps/web/railway.toml`
- Create: `workers/cpu/railway.toml`
- Create: `workers/maintenance/railway.toml`
- Create: `infra/production/service-matrix.md`
- Create: `infra/production/secrets-matrix.md`
- Create: `infra/production/b2-policy.md`
- Create: `infra/production/supabase-policy.sql`
- Create: `docs/runbooks/deploy-rollback.md`
- Create: `tests/deployment/config.test.mjs`

- [ ] **Step 1: Write config assertions**

Assert three Railway services, private CPU/maintenance exposure, public web only, Node pin, healthcheck path/timeouts, restart policy, bounded scratch disk, distinct B2 capabilities and no GPU inbound port requirement.

- [ ] **Step 2: Prove they fail**

Run: `node --test tests/deployment/config.test.mjs`

Expected: FAIL until production service configs are complete.

- [ ] **Step 3: Configure production topology**

Railway: `signal-web` public, `signal-cpu-worker` private, `signal-maintenance` scheduled/controlled. Supabase migrations run as one release command, not every replica boot. B2 uses separate private bucket/prefix-restricted runtime and deletion keys; browser receives only exact signed operations. Vast pulls one immutable on-demand worker image and needs no mapped public application port.

- [ ] **Step 4: Rehearse deploy and rollback in staging**

Run: `node --test tests/deployment/config.test.mjs && pnpm verify`

Expected: config tests PASS. Then execute `docs/runbooks/deploy-rollback.md`: deploy N+1, verify readiness/smoke, roll web/CPU back to N, drain or roll GPU, and prove leased work completes or retries without report corruption.

- [ ] **Step 5: Commit**

```bash
git add railway.toml apps/web/railway.toml workers/cpu/railway.toml workers/maintenance/railway.toml infra/production docs/runbooks/deploy-rollback.md tests/deployment
git commit -m "ops: define Signal production deployment"
```

### Task 9: Execute the V1 release gate and freeze V2 admin scope

**Files:**

- Create: `docs/releases/v1-release-checklist.md`
- Create: `docs/releases/v1-known-limitations.md`
- Create: `docs/releases/v1-evidence-index.md`
- Create: `docs/roadmap/phase-1-v2-admin.md`
- Create: `scripts/release-gate.mjs`
- Create: `tests/release/release-gate.test.mjs`

- [ ] **Step 1: Write the machine-checkable release gate**

Require clean verification, migration rehearsal, three staging E2Es, partial test, reliability/evals/security/claim scans, deletion proof, backup/restore proof, cost thresholds, operational ownership and no P0/P1 exception without explicit sign-off.

- [ ] **Step 2: Prove it fails before evidence is linked**

Run: `node --test tests/release/release-gate.test.mjs && node scripts/release-gate.mjs`

Expected: FAIL with missing evidence IDs.

- [ ] **Step 3: Link concrete evidence and document limitations**

Known limitations include pre-flight-not-outcome claims, single-member workspaces, static not Tribe-eligible, supported video envelope, 30-day media retention, no comparisons/PDF/public sharing and no V1 admin console. V2 roadmap may use the existing `SUPER_ADMIN` role but cannot be imported by V1 navigation/build entrypoints.

- [ ] **Step 4: Run the complete release gate**

Run: `pnpm verify && node scripts/run-reliability-suite.mjs && node scripts/run-evals.mjs --staging && pnpm playwright test && node scripts/release-gate.mjs`

Expected: PASS with an evidence index containing timestamps, commit/image digests and owners for every gate.

- [ ] **Step 5: Commit**

```bash
git add docs/releases docs/roadmap scripts/release-gate.mjs tests/release
git commit -m "docs: record Sakhaa Signal V1 release evidence"
```

## V1 Launch Exit Gate

- Static Standard, Video Standard and Full/partial journeys pass with real staging adapters.
- Zero unresolved P0/P1 findings remain in security, durability, claim safety, scoring, Tribe reproducibility, retention or deployment.
- Cross-workspace and arbitrary-object tests pass at API, DB and storage boundaries.
- Original/heavy media expires at 30 days and immediate deletion is proven end to end.
- Railway web/CPU/maintenance services and Vast on-demand worker survive deploy/restart/failure drills.
- Continuous monitoring exists independently of Railway deployment healthchecks.
- Provider usage/cost is durable, idempotent and bounded before expensive work.
- All customer reports pass schema, evidence citation, reconstruction and claim-policy validation.
- V1 admin surface remains absent; Phase 1 V2 admin scope is documented separately.