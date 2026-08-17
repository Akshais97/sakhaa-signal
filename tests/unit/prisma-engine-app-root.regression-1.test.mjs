import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Regression: WORKSPACE-VERCEL-002 — authenticated production uploads returned
// WORKSPACE_RESOLUTION_FAILED because Vercel omitted Prisma's Linux engine.
// Found by /investigate and /qa on 2026-08-17.
// Report: .gstack/qa-reports/qa-report-sakhaa-signal-vercel-app-2026-08-17.md

const source = (file) => readFileSync(file, "utf8");

test("web build stages Prisma's Linux engine inside the Vercel app root", () => {
  const packageJson = JSON.parse(source("apps/web/package.json"));
  const nextConfig = source("apps/web/next.config.ts");
  const verifier = source("scripts/verify-vercel-prisma-engine.mjs");

  assert.match(packageJson.scripts.build, /verify-vercel-prisma-engine\.mjs --stage/);
  assert.ok(
    packageJson.scripts.build.indexOf("--stage") < packageJson.scripts.build.indexOf("next build"),
    "the engine must be staged before Next traces the application",
  );
  assert.match(nextConfig, /\.\/generated\/client\/libquery_engine-\*\.so\.node/);
  assert.match(verifier, /copyFileSync/);
  assert.match(verifier, /apps["'],\s*["']web["'],\s*["']generated["'],\s*["']client/);
  assert.match(verifier, /PRISMA_ENGINE_STAGED/);
  assert.match(verifier, /PRISMA_ENGINE_APP_TRACE_OK/);
});
