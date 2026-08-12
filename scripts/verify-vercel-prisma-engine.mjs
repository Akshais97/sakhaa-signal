import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const engineName = "libquery_engine-rhel-openssl-3.0.x.so.node";
const enginePath = path.join(repoRoot, "packages", "db", "generated", "client", engineName);

if (!existsSync(enginePath)) {
  throw new Error(`[PRISMA_ENGINE_MISSING] Generated client does not contain ${engineName}`);
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
  const includesEngine = manifest.files?.some((file) => file.endsWith(engineName));
  if (!includesEngine) {
    throw new Error(`[PRISMA_ENGINE_NOT_TRACED] ${relativeManifest} omits ${engineName}`);
  }
}

console.log(`[PRISMA_ENGINE_TRACE_OK] ${engineName} is present in all database route manifests`);
