import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const engineName = "libquery_engine-rhel-openssl-3.0.x.so.node";
const enginePath = path.join(repoRoot, "packages", "db", "generated", "client", engineName);
const stagedEnginePath = path.join(
  repoRoot,
  "apps",
  "web",
  "generated",
  "client",
  engineName,
);

if (!existsSync(enginePath)) {
  throw new Error(`[PRISMA_ENGINE_MISSING] Generated client does not contain ${engineName}`);
}

if (process.argv.includes("--stage")) {
  mkdirSync(path.dirname(stagedEnginePath), { recursive: true });
  copyFileSync(enginePath, stagedEnginePath);
  console.log(`[PRISMA_ENGINE_STAGED] ${engineName} copied inside apps/web`);
  process.exit(0);
}

if (!existsSync(stagedEnginePath)) {
  throw new Error(`[PRISMA_ENGINE_APP_COPY_MISSING] apps/web does not contain ${engineName}`);
}

const routeManifests = [
  "apps/web/.next/server/app/api/uploads/presign/route.js.nft.json",
  "apps/web/.next/server/app/api/uploads/complete/route.js.nft.json",
  "apps/web/.next/server/app/api/analysis/jobs/route.js.nft.json",
  "apps/web/.next/server/app/api/workspaces/route.js.nft.json",
];

for (const relativeManifest of routeManifests) {
  const manifestPath = path.join(repoRoot, relativeManifest);
  if (!existsSync(manifestPath)) {
    throw new Error(`[PRISMA_TRACE_MISSING] Next.js did not emit ${relativeManifest}`);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const includesEngine = manifest.files?.some(
    (file) =>
      file.endsWith(engineName) &&
      file.replaceAll("\\", "/").includes("generated/client/"),
  );
  if (!includesEngine) {
    throw new Error(`[PRISMA_ENGINE_NOT_TRACED] ${relativeManifest} omits ${engineName}`);
  }
}

console.log(`[PRISMA_ENGINE_APP_TRACE_OK] ${engineName} is traced from inside apps/web`);
