import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  getServerlessDatabaseUrl,
  validateDatabaseConfiguration,
} from "../../apps/web/src/lib/database-url.ts";

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

test("Vercel rejects a missing, direct, or cross-project database URL before serving traffic", () => {
  const supabaseUrl = "https://project-a.supabase.co";

  assert.deepEqual(
    validateDatabaseConfiguration({
      databaseUrl: undefined,
      supabaseUrl,
      requireTransactionPooler: true,
    }),
    ["DATABASE_URL_MISSING"],
  );

  assert.deepEqual(
    validateDatabaseConfiguration({
      databaseUrl: "postgresql://postgres:secret@db.project-a.supabase.co:5432/postgres",
      supabaseUrl,
      requireTransactionPooler: true,
    }),
    ["DATABASE_TRANSACTION_PORT_REQUIRED"],
  );

  assert.deepEqual(
    validateDatabaseConfiguration({
      databaseUrl:
        "postgresql://postgres.project-b:secret@aws-1-region.pooler.supabase.com:6543/postgres",
      supabaseUrl,
      requireTransactionPooler: true,
    }),
    ["SUPABASE_DATABASE_PROJECT_MISMATCH"],
  );

  assert.deepEqual(
    validateDatabaseConfiguration({
      databaseUrl:
        "postgresql://postgres.project-a:secret@aws-1-region.pooler.supabase.com:6543/postgres",
      supabaseUrl,
      requireTransactionPooler: true,
    }),
    [],
  );
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

test("presign distinguishes an invalid session from workspace and auth-provider failures", () => {
  const auth = source("apps/web/src/lib/auth.ts");
  const presign = source("apps/web/src/app/api/uploads/presign/route.ts");

  assert.match(auth, /AUTH_SESSION_VALIDATION_ERROR/);
  assert.match(auth, /AUTH_PROVIDER_UNAVAILABLE/);
  assert.match(auth, /WORKSPACE_RESOLUTION_FAILED/);
  assert.doesNotMatch(auth, /placeholder\.supabase\.co|placeholder-anon-key/);
  assert.match(auth, /00000000-0000-4000-8000-000000000001/);
  assert.match(auth, /workspaceId_userId/);

  assert.match(presign, /if \(!user\)/);
  assert.match(presign, /if \(!ws\)/);
  assert.match(presign, /WORKSPACE_RESOLUTION_FAILED/);
  assert.match(presign, /authServiceUnavailable \? 503 : 401/);
  assert.doesNotMatch(presign, /if \(!user \|\| !ws\)/);
});

test("Supabase proxy refreshes API sessions before route authorization", () => {
  const proxy = source("apps/web/src/proxy.ts");
  const authLookup = proxy.indexOf("supabase.auth.getUser()");
  const apiReturn = proxy.indexOf("if (isApiRoute)");

  assert.ok(authLookup >= 0, "proxy must validate or refresh the Supabase session");
  assert.ok(apiReturn > authLookup, "API forwarding must happen after Supabase session refresh");
  assert.match(proxy, /return response;/);
  assert.match(proxy, /AUTH_PROXY_CONFIGURATION_ERROR/);
  assert.match(proxy, /AUTH_PROXY_PROVIDER_ERROR/);
});

test("authenticated upload and job routes establish transaction-local RLS context", () => {
  const context = source("apps/web/src/lib/db-context.ts");
  assert.match(context, /set_config\('app\.current_user_id'/);
  assert.match(context, /set_config\('app\.current_workspace_id'/);
  assert.match(context, /prisma\.\$transaction/);
  assert.match(context, /maxWait:\s*10_000/);
  assert.match(context, /timeout:\s*20_000/);

  for (const path of [
    "apps/web/src/app/api/uploads/presign/route.ts",
    "apps/web/src/app/api/uploads/complete/route.ts",
    "apps/web/src/app/api/analysis/jobs/route.ts",
  ]) {
    assert.match(source(path), /withUserDatabaseContext/, path);
  }

  const migration = source(
    "packages/db/prisma/migrations/0017_server_auth_rls_context/migration.sql",
  );
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.app_current_user_id/);
  assert.match(migration, /CREATE POLICY membership_select_own_workspace/);
  assert.match(migration, /CREATE POLICY artifacts_workspace_isolation/);
  assert.doesNotMatch(migration, /auth\.uid\(\)/);
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
