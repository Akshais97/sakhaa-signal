import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getServerlessDatabaseUrl } from "../../apps/web/src/lib/database-url.ts";

const source = (path) => readFileSync(path, "utf8");

test("Vercel Prisma URL keeps Supavisor transaction mode and a one-connection local pool", () => {
  const configured = getServerlessDatabaseUrl(
    "postgresql://postgres.project:secret@aws-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10",
  );
  const url = new URL(configured);

  assert.equal(url.port, "6543");
  assert.equal(url.searchParams.get("pgbouncer"), "true");
  assert.equal(url.searchParams.get("connection_limit"), "1");
  assert.equal(url.searchParams.get("pool_timeout"), "20");
  assert.equal(url.searchParams.get("connect_timeout"), "10");
});

test("analysis APIs never manufacture jobs or a RUNNING 20 percent response", () => {
  const paths = [
    "apps/web/src/app/api/analysis/jobs/route.ts",
    "apps/web/src/app/api/analysis/jobs/[jobId]/route.ts",
    "apps/web/src/app/api/analysis/jobs/[jobId]/status/route.ts",
    "apps/web/src/app/api/analysis/jobs/[jobId]/report/route.ts",
    "apps/web/src/lib/analysis-access.ts",
    "apps/web/src/app/analysis/[jobId]/page.tsx",
  ];

  for (const path of paths) {
    const text = source(path);
    assert.doesNotMatch(text, /fallbackJob|fallback workspace|Graceful fallback/i, path);
  }

  const statusRoute = source("apps/web/src/app/api/analysis/jobs/[jobId]/status/route.ts");
  assert.match(statusRoute, /JOB_STATUS_UNAVAILABLE/);
  assert.doesNotMatch(statusRoute, /status:\s*"RUNNING"[\s\S]{0,120}progressPercent:\s*20/);
});

test("authenticated sessions never fall back to another tenant or an invented workspace", () => {
  const auth = source("apps/web/src/lib/auth.ts");
  const access = source("apps/web/src/lib/analysis-access.ts");

  assert.doesNotMatch(auth, /AUTH WORKSPACE CREATION FALLBACK|Guarantee non-null fallback workspace/);
  assert.doesNotMatch(auth, /id:\s*`ws-\$\{user\.id/);
  assert.match(access, /workspaceId: job\.workspaceId, userId: user\.id, status: "ACTIVE"/);
});

test("upload completion proves the B2 object exists before marking the artifact clean", () => {
  const presignRoute = source("apps/web/src/app/api/uploads/presign/route.ts");
  const completeRoute = source("apps/web/src/app/api/uploads/complete/route.ts");

  assert.doesNotMatch(presignRoute, /PRESIGN DB ARTIFACT WARNING/);
  assert.match(completeRoute, /HeadObjectCommand/);
  assert.match(completeRoute, /ContentLength/);
  assert.doesNotMatch(completeRoute, /Always return clean success|default-ws/);
});

test("CPU execution stays on the durable lease poller and B2 downloads have a deadline", () => {
  const worker = source("workers/cpu/src/index.ts");
  const storage = source("workers/cpu/src/storage/b2-adapter.ts");

  assert.doesNotMatch(worker, /api\/cpu\/jobs\/run|Direct HTTP dispatch trigger/);
  assert.doesNotMatch(worker, /Access-Control-Allow-Origin/);
  assert.match(worker, /workerLoop\(\)/);
  assert.match(worker, /OBJECT_STORAGE_PROVIDER must be b2 or s3/);
  assert.match(storage, /STORAGE_DOWNLOAD_TIMEOUT_MS/);
  assert.match(storage, /abortSignal/);
  assert.doesNotMatch(storage, /fallbackPng|Generating valid fallback media/);
});

test("report polling surfaces repeated control-plane failures", () => {
  for (const path of [
    "apps/web/src/app/analysis/[jobId]/static-report.tsx",
    "apps/web/src/app/analysis/[jobId]/video-report.tsx",
  ]) {
    const text = source(path);
    assert.match(text, /POLL_FAILURE_LIMIT/, path);
    assert.match(text, /pollError/, path);
    assert.doesNotMatch(text, /if \(!response\.ok\) return;/, path);
  }
});
