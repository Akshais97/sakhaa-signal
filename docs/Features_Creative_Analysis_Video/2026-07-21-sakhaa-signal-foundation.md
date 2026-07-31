# Sakhaa Signal V1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refound the tracked Forge scaffold into a secure, durable Sakhaa Signal control plane that can accept an authenticated private upload, validate it, create a leased analysis job, and publish only schema-valid evidence/report artifacts.

**Architecture:** Keep Next.js as `signal-web`, Supabase Auth/Postgres as identity and state, Backblaze B2 behind a storage adapter, and a private Node CPU worker that claims Postgres stages. Establish versioned contracts before adding analysis engines. Production adapters fail closed; explicit fixture adapters remain test-only.

**Tech Stack:** Node.js 24.15, pnpm 11, Next.js 16, React 19, TypeScript 5, Prisma 6/PostgreSQL, Supabase SSR, AWS SDK v3 S3 client for B2, Zod, Vitest, Playwright, Docker, Railway.

## Global Constraints

- Preserve Git history; replace Forge runtime concepts rather than creating a new repository.
- V1 is user-facing and single-member-workspace. Persist `USER` and `SUPER_ADMIN`, but expose no admin product surface.
- Production code must never select simulator/fixture behavior implicitly.
- All tenant reads include `workspaceId`; inaccessible resources return the same 404 envelope as missing resources.
- Object keys are server-generated as `workspaces/{workspaceId}/analyses/{analysisId}/{managedArtifactPath}`; clients never submit arbitrary keys.
- Long-running work never executes in a Next.js request or `BackgroundTasks`.
- Jobs, stages, attempts, leases, heartbeats, events, artifacts, evidence, rules, scores and report versions are durable.
- Model/rule/prompt/engine versions and input hashes are persisted before execution.
- Missing, failed, not-requested and not-applicable are distinct states and never collapse to numeric zero.
- Run each task's focused tests before its commit and run `pnpm verify` before the final foundation commit.

## Dependency and Output Contract

This plan has no implementation-plan prerequisite. It consumes the approved design at `docs/superpowers/specs/2026-07-21-sakhaa-signal-v1-design.md` and produces the database, API, storage, worker and report contracts consumed by the Static, Video and TribeV2 plans.

### Task 1: Refound repository identity and verification tooling

**Files:**

- Modify: `package.json`
- Modify: `pnpm-workspace.yaml`
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `.env.example`
- Modify: `scripts/verify.mjs`
- Create: `vitest.config.ts`
- Create: `tests/unit/product-identity.test.mjs`

- [ ] **Step 1: Write the failing identity test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("tracked product metadata is Sakhaa Signal and pins one runtime", async () => {
  const pkg = JSON.parse(await readFile("package.json", "utf8"));
  const readme = await readFile("README.md", "utf8");
  assert.equal(pkg.name, "sakhaa-signal");
  assert.equal(pkg.engines.node, "24.15.0");
  assert.match(readme, /^# Sakhaa Signal/m);
  assert.doesNotMatch(readme, /Sakhaa Forge/);
});
```

- [ ] **Step 2: Prove it fails**

Run: `node --test tests/unit/product-identity.test.mjs`

Expected: FAIL because `package.json` is named `sakhaa-forge`.

- [ ] **Step 3: Rename packages/scripts and make verification explicit**

Set root name to `sakhaa-signal`, package names to `@sakhaa-signal/*`, keep Node `24.15.0`, retain pinned pnpm, add `test:vitest`, `test:python`, and update `verify` to run contract generation, Prisma validation, lint, typecheck, Node tests, Vitest, Python tests and the production-fixture scan. Replace README/AGENTS guidance with the approved Signal boundary and exact local commands.

- [ ] **Step 4: Prove the focused test passes**

Run: `node --test tests/unit/product-identity.test.mjs`

Expected: PASS, 1 test.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-workspace.yaml README.md AGENTS.md .env.example scripts/verify.mjs vitest.config.ts tests/unit/product-identity.test.mjs
git commit -m "chore: refound repository as Sakhaa Signal"
```

### Task 2: Establish canonical Signal contracts

**Files:**

- Create: `packages/contracts/src/signal.ts`
- Create: `packages/contracts/src/evidence.ts`
- Create: `packages/contracts/src/report.ts`
- Create: `packages/contracts/src/http.ts`
- Create: `packages/contracts/src/index.ts`
- Create: `packages/contracts/src/openapi.signal.json`
- Modify: `packages/contracts/package.json`
- Modify: `scripts/generate-contracts.mjs`
- Create: `tests/contract/signal-contracts.test.ts`
- Delete: `packages/contracts/src/openapi.v0.json`
- Delete: `packages/contracts/generated/openapi.v0.json`
- Delete: `packages/contracts/generated/v0-client.mjs`

**Produces:** `AnalysisMode`, `AnalysisStatus`, `AvailabilityState`, evidence/report Zod schemas, API envelopes and generated OpenAPI client.

- [ ] **Step 1: Write failing contract tests**

```ts
import { describe, expect, it } from "vitest";
import { AnalysisRequestSchema, AvailabilityStateSchema } from "@sakhaa-signal/contracts";

describe("Signal contracts", () => {
  it("requires an explicit video mode", () => {
    expect(() => AnalysisRequestSchema.parse({ mediaKind: "VIDEO" })).toThrow();
  });
  it("does not represent unavailable evidence as zero", () => {
    expect(AvailabilityStateSchema.parse("NOT_REQUESTED")).toBe("NOT_REQUESTED");
    expect(() => AvailabilityStateSchema.parse(0)).toThrow();
  });
});
```

- [ ] **Step 2: Prove they fail**

Run: `pnpm vitest run tests/contract/signal-contracts.test.ts`

Expected: FAIL because `@sakhaa-signal/contracts` is not exported.

- [ ] **Step 3: Implement strict versioned schemas**

```ts
export const AnalysisModeSchema = z.enum([
  "STATIC_STANDARD",
  "STANDARD_NO_TRIBEV2",
  "FULL_WITH_TRIBEV2",
]);
export const AvailabilityStateSchema = z.enum([
  "AVAILABLE",
  "NOT_REQUESTED",
  "NOT_APPLICABLE",
  "FAILED",
]);
export const AnalysisRequestSchema = z.discriminatedUnion("mediaKind", [
  z.object({ mediaKind: z.literal("STATIC"), mode: z.literal("STATIC_STANDARD") }),
  z.object({
    mediaKind: z.literal("VIDEO"),
    mode: z.enum(["STANDARD_NO_TRIBEV2", "FULL_WITH_TRIBEV2"]),
  }),
]);
```

Add `schemaVersion`, immutable engine-version maps, evidence locators, score components, claim class and report validation. Generate `packages/contracts/generated/signal-client.mjs` from `openapi.signal.json`.

- [ ] **Step 4: Run contracts and generation**

Run: `pnpm generate && pnpm vitest run tests/contract/signal-contracts.test.ts`

Expected: generated client contains `createAnalysis`, `completeUpload`, `getAnalysis`, `getReport` and `deleteAnalysis`; tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/contracts scripts/generate-contracts.mjs tests/contract/signal-contracts.test.ts
git commit -m "feat: define Signal analysis and evidence contracts"
```

### Task 3: Replace the Forge persistence model with Signal state

**Files:**

- Modify: `packages/db/prisma/schema.prisma`
- Create: `packages/db/prisma/migrations/0016_signal_v1_refoundation/migration.sql`
- Create: `packages/db/prisma/seed.ts`
- Create: `tests/unit/signal-db-schema.test.mjs`
- Create: `tests/integration/signal-workspace-isolation.test.mjs`

**Consumes:** Task 2 enums and JSON schemas. **Produces:** canonical relational identity, analysis, stage, artifact, evidence, scoring and report records.

- [ ] **Step 1: Write schema assertions before changing Prisma**

```js
test("Signal schema contains durable analysis stages and excludes Forge domains", async () => {
  const schema = await readFile("packages/db/prisma/schema.prisma", "utf8");
  for (const model of ["Analysis", "AnalysisStage", "StageAttempt", "EvidenceItem", "ReportVersion"]) {
    assert.match(schema, new RegExp(`model ${model} \\{`));
  }
  assert.doesNotMatch(schema, /model (BrandCrawlRun|ViralCandidate|BlueprintRequest) /);
});
```

- [ ] **Step 2: Prove the schema test fails**

Run: `node --test tests/unit/signal-db-schema.test.mjs`

Expected: FAIL because Signal models do not exist and Forge models do.

- [ ] **Step 3: Implement the refounded schema and migration**

Use enums `GlobalRole { USER SUPER_ADMIN }`, `MediaKind`, `AnalysisMode`, `AnalysisStatus`, `StageStatus`, `AvailabilityState`, and models `User`, `Workspace`, `Membership`, `Analysis`, `AnalysisContext`, `MediaAsset`, `AnalysisStage`, `StageAttempt`, `Artifact`, `EvidenceItem`, `Measurement`, `RuleResult`, `ScoreProfile`, `ScoreResult`, `Finding`, `ReportVersion`, `AuditEvent`, `IdempotencyRecord`, and `DeletionTask`.

```prisma
model AnalysisStage {
  id          String      @id @default(uuid()) @db.Uuid
  workspaceId String      @map("workspace_id") @db.Uuid
  analysisId  String      @map("analysis_id") @db.Uuid
  kind        String      @db.VarChar(80)
  status      StageStatus @default(PENDING)
  inputHash   String      @map("input_hash") @db.Char(64)
  leaseOwner  String?     @map("lease_owner") @db.VarChar(160)
  leaseToken  String?     @map("lease_token") @db.Uuid
  leaseUntil  DateTime?   @map("lease_until") @db.Timestamptz(6)
  heartbeatAt DateTime?   @map("heartbeat_at") @db.Timestamptz(6)
  attempts    StageAttempt[]
  @@unique([analysisId, kind, inputHash])
  @@index([status, leaseUntil])
  @@index([workspaceId, analysisId])
}
```

Migration must explicitly drop Forge tables only after copying `users`, `workspaces`, memberships, audits and reusable job audit history to Signal equivalents. Add RLS policies keyed by authenticated `sub` and membership; service-role access remains separate.

- [ ] **Step 4: Validate schema and isolation**

Run: `pnpm db:generate && pnpm db:validate && node --test tests/unit/signal-db-schema.test.mjs`

Expected: Prisma validation succeeds and unit test PASS. With local Postgres/Supabase available, run `node --test tests/integration/signal-workspace-isolation.test.mjs`; cross-workspace reads return 404.

- [ ] **Step 5: Commit**

```bash
git add packages/db/prisma packages/db/prisma/seed.ts tests/unit/signal-db-schema.test.mjs tests/integration/signal-workspace-isolation.test.mjs
git commit -m "feat: refound persistence around Signal analyses"
```

### Task 4: Implement authenticated workspace resolution

**Files:**

- Modify: `apps/web/package.json`
- Create: `apps/web/src/lib/supabase/server.ts`
- Create: `apps/web/src/lib/auth/session.ts`
- Create: `apps/web/src/lib/auth/workspace.ts`
- Create: `apps/web/src/lib/http/errors.ts`
- Create: `apps/web/src/proxy.ts`
- Create: `apps/web/src/app/auth/callback/route.ts`
- Create: `apps/web/src/app/login/page.tsx`
- Create: `tests/unit/workspace-auth.test.ts`

- [ ] **Step 1: Write authorization tests**

Cover missing session -> 401, own workspace -> context, foreign workspace -> indistinguishable 404, and `SUPER_ADMIN` -> audited read context only.

- [ ] **Step 2: Prove they fail**

Run: `pnpm vitest run tests/unit/workspace-auth.test.ts`

Expected: FAIL because workspace authorization modules do not exist.

- [ ] **Step 3: Implement one authorization boundary**

```ts
export async function requireWorkspace(requestedId?: string): Promise<WorkspaceContext> {
  const user = await requireUser();
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, status: "ACTIVE", ...(requestedId ? { workspaceId: requestedId } : {}) },
  });
  if (!membership) throw notFound("RESOURCE_NOT_FOUND");
  return { userId: user.id, workspaceId: membership.workspaceId, role: user.globalRole };
}
```

Next.js 16 Proxy refreshes Supabase cookies and protects app pages but allows `/auth/callback`. Route handlers still enforce authorization at the data boundary. Do not auto-seed demo users or select the first global workspace.

- [ ] **Step 4: Run tests and typecheck**

Run: `pnpm vitest run tests/unit/workspace-auth.test.ts && pnpm typecheck`

Expected: authorization tests PASS; callback route remains reachable.

- [ ] **Step 5: Commit**

```bash
git add apps/web tests/unit/workspace-auth.test.ts
git commit -m "feat: enforce Supabase workspace authorization"
```

### Task 5: Add private B2 upload and media-validation boundaries

**Files:**

- Create: `packages/storage/package.json`
- Create: `packages/storage/src/object-store.ts`
- Create: `packages/storage/src/b2-store.ts`
- Create: `packages/storage/src/local-store.ts`
- Create: `packages/storage/src/keys.ts`
- Create: `apps/web/src/app/api/signal/uploads/route.ts`
- Create: `apps/web/src/app/api/signal/uploads/[assetId]/complete/route.ts`
- Create: `workers/cpu/src/media/sniff.ts`
- Create: `tests/unit/storage-keys.test.ts`
- Create: `tests/integration/upload-authorization.test.ts`
- Delete: `apps/web/src/app/api/storage/upload/route.ts`
- Delete: `apps/web/src/app/api/storage/download/route.ts`

- [ ] **Step 1: Write path and tenant tests**

```ts
expect(buildOriginalKey({ workspaceId: ws, analysisId, assetId, extension: "png" }))
  .toBe(`workspaces/${ws}/analyses/${analysisId}/original/${assetId}.png`);
expect(() => assertManagedKey(ws, "../../secrets")).toThrow();
```

- [ ] **Step 2: Prove they fail**

Run: `pnpm vitest run tests/unit/storage-keys.test.ts tests/integration/upload-authorization.test.ts`

Expected: FAIL because managed-key and signed-upload adapters are absent.

- [ ] **Step 3: Implement server-generated signed operations**

The web API creates the analysis and quarantined `MediaAsset` first, signs only `PutObject` for its exact key with 15-minute expiry and content-length constraint, and completes only after a server-side `HeadObject`. Local storage is selected only by `OBJECT_STORAGE_PROVIDER=local` outside production. Completion creates `MEDIA_VALIDATE` as the first stage.

- [ ] **Step 4: Run focused tests**

Run: `pnpm vitest run tests/unit/storage-keys.test.ts tests/integration/upload-authorization.test.ts`

Expected: cross-workspace completion and arbitrary keys return 404/422; correct asset becomes `UPLOADED_QUARANTINED`.

- [ ] **Step 5: Commit**

```bash
git add packages/storage apps/web/src/app/api/signal workers/cpu/src/media tests
git rm apps/web/src/app/api/storage/upload/route.ts apps/web/src/app/api/storage/download/route.ts
git commit -m "feat: add tenant-scoped private media uploads"
```

### Task 6: Implement durable stage leasing and the CPU worker

**Files:**

- Modify: `workers/queue/package.json`
- Replace: `workers/queue/src/processor.mjs`
- Create: `workers/cpu/package.json`
- Create: `workers/cpu/src/index.ts`
- Create: `workers/cpu/src/stages/claim.ts`
- Create: `workers/cpu/src/stages/heartbeat.ts`
- Create: `workers/cpu/src/stages/complete.ts`
- Create: `workers/cpu/src/stages/fail.ts`
- Create: `workers/cpu/src/stages/handlers.ts`
- Create: `tests/integration/stage-leases.test.ts`

- [ ] **Step 1: Write lease-concurrency tests**

Test two claimers racing, stale completion rejection, heartbeat extension, retry backoff, max-attempt dead letter and cancellation at stage boundaries.

- [ ] **Step 2: Prove they fail**

Run: `pnpm vitest run tests/integration/stage-leases.test.ts`

Expected: FAIL because current queue worker only prints heartbeats.

- [ ] **Step 3: Implement transactional claim semantics**

```sql
WITH candidate AS (
  SELECT id FROM analysis_stages
  WHERE status IN ('PENDING','RETRY_WAIT')
    AND (next_run_at IS NULL OR next_run_at <= now())
  ORDER BY priority DESC, created_at
  FOR UPDATE SKIP LOCKED LIMIT 1
)
UPDATE analysis_stages s
SET status='LEASED', lease_owner=$1, lease_token=$2,
    lease_until=now() + interval '90 seconds', heartbeat_at=now()
FROM candidate WHERE s.id=candidate.id
RETURNING s.*;
```

The worker polls Postgres, dispatches a registered handler, heartbeats at 30 seconds, and completes/fails using the opaque lease token. Delete the fake queue package after all scripts and workspace references point to `workers/cpu`.

- [ ] **Step 4: Prove crash recovery**

Run: `pnpm vitest run tests/integration/stage-leases.test.ts`

Expected: exactly one active lease, stale tokens rejected, expired lease retried, final attempt dead-lettered.

- [ ] **Step 5: Commit**

```bash
git add workers/cpu workers/queue tests/integration/stage-leases.test.ts pnpm-workspace.yaml package.json
git commit -m "feat: add durable Postgres analysis stages"
```

### Task 7: Add evidence, deterministic score and immutable report services

**Files:**

- Create: `packages/analysis/package.json`
- Create: `packages/analysis/src/evidence/normalize.ts`
- Create: `packages/analysis/src/rules/evaluate.ts`
- Create: `packages/analysis/src/scoring/calculate.ts`
- Create: `packages/analysis/src/report/build.ts`
- Create: `packages/analysis/src/report/validate.ts`
- Create: `packages/analysis/src/claims/policy.ts`
- Create: `packages/analysis/src/index.ts`
- Create: `config/score-profiles/static-standard.v1.json`
- Create: `config/score-profiles/video-standard.v1.json`
- Create: `config/score-profiles/video-full.v1.json`
- Create: `tests/unit/score-availability.test.ts`
- Create: `tests/unit/report-evidence.test.ts`

- [ ] **Step 1: Write missing-state and citation tests**

```ts
expect(calculateScore(profile, [{ state: "NOT_APPLICABLE" }])).toMatchObject({ state: "NOT_APPLICABLE" });
expect(() => validateReport({ findings: [{ evidenceIds: ["missing"] }], evidence: [] })).toThrow();
```

- [ ] **Step 2: Prove they fail**

Run: `pnpm vitest run tests/unit/score-availability.test.ts tests/unit/report-evidence.test.ts`

Expected: FAIL because analysis services are absent.

- [ ] **Step 3: Implement fail-closed deterministic services**

Scores accept only eligible `AVAILABLE` components declared by a versioned profile. No per-creative min/max normalization is permitted. Report validation checks every finding/recommendation citation, source locator, version fingerprint, claim class, score reconstruction and availability state before one transaction creates `ReportVersion` and marks the analysis publishable.

- [ ] **Step 4: Prove deterministic reconstruction**

Run: `pnpm vitest run tests/unit/score-availability.test.ts tests/unit/report-evidence.test.ts`

Expected: repeated input produces byte-stable score components; an uncited finding fails publication.

- [ ] **Step 5: Commit**

```bash
git add packages/analysis config/score-profiles tests/unit
git commit -m "feat: establish evidence-first report services"
```

### Task 8: Provide the foundation API, local stack and Railway services

**Files:**

- Create: `apps/web/src/app/api/signal/analyses/[analysisId]/route.ts`
- Create: `apps/web/src/app/api/signal/analyses/[analysisId]/events/route.ts`
- Create: `apps/web/src/app/api/signal/analyses/[analysisId]/report/route.ts`
- Create: `apps/web/src/app/api/health/route.ts`
- Create: `apps/web/src/app/api/ready/route.ts`
- Modify: `apps/web/Dockerfile`
- Create: `workers/cpu/Dockerfile`
- Create: `workers/maintenance/package.json`
- Create: `workers/maintenance/src/index.ts`
- Create: `workers/maintenance/Dockerfile`
- Modify: `infra/docker/docker-compose.local.yml`
- Create: `railway.toml`
- Create: `docs/runbooks/foundation-local.md`
- Create: `tests/e2e/foundation-lifecycle.spec.ts`

- [ ] **Step 1: Write the lifecycle acceptance test**

The test signs in, requests a static upload, uploads a fixture, completes it, observes durable validation progress, verifies a foreign user gets 404, and deletes the analysis.

- [ ] **Step 2: Prove it fails**

Run: `pnpm playwright test tests/e2e/foundation-lifecycle.spec.ts`

Expected: FAIL because the Signal lifecycle routes are incomplete.

- [ ] **Step 3: Wire service entrypoints and health/readiness**

`signal-web` exposes `/api/health` and dependency-aware `/api/ready`; `signal-cpu-worker` and `signal-maintenance` run as separate Railway services from the same repository. Local compose starts Postgres, a B2-compatible test store, web, CPU worker and maintenance without Redis. Readiness must fail when DB or object storage is unavailable.

- [ ] **Step 4: Run foundation verification**

Run: `pnpm verify && pnpm playwright test tests/e2e/foundation-lifecycle.spec.ts`

Expected: all checks PASS; no customer report exists until its required stages and report validator succeed.

- [ ] **Step 5: Commit**

```bash
git add apps/web workers infra railway.toml docs/runbooks tests/e2e
git commit -m "feat: complete Signal foundation lifecycle"
```

## Foundation Exit Gate

- `pnpm verify` passes on Node 24.15 and pnpm 11.
- A fresh database migrates from the tracked baseline and a rollback rehearsal is documented.
- Two workers cannot execute the same stage concurrently.
- Cross-workspace API and object access are denied without resource disclosure.
- Production boot fails if B2, Supabase service credentials or worker identity are absent.
- Generated OpenAPI, TypeScript schemas and Prisma availability enums agree.
- `rg -n "Sakhaa Forge|MOCK_|Math\.random|simulator" apps workers packages --glob '!**/*.test.*'` has no production-path match except explicit rejected-mode guards.
- The Static Standard plan can consume the upload, stage, evidence, scoring and report interfaces without changing their semantics.