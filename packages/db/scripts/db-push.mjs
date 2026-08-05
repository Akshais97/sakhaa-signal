import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// Manually parse .env from workspace root or current directory
const envCandidates = [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "apps/web/.env"),
  resolve(process.cwd(), "../../.env"),
  resolve(process.cwd(), "../.env"),
];

for (const envPath of envCandidates) {
  if (existsSync(envPath)) {
    try {
      const content = readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    } catch (e) {}
  }
}

if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

const command = process.execPath;
const schemaPath = existsSync(resolve("prisma/schema.prisma"))
  ? resolve("prisma/schema.prisma")
  : resolve("packages/db/prisma/schema.prisma");

const args = [
  resolvePrismaEntrypoint(),
  "db",
  "push",
  "--schema",
  schemaPath,
  "--accept-data-loss"
];

const result = spawnSync(command, args, {
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);

function resolvePrismaEntrypoint() {
  const local = resolve("packages/db/node_modules/prisma/build/index.js");
  if (existsSync(local)) {
    return local;
  }
  const rootPrisma = resolve("node_modules/prisma/build/index.js");
  if (existsSync(rootPrisma)) {
    return rootPrisma;
  }
  throw new Error("Prisma CLI entrypoint not found. Run pnpm install before db:generate.");
}
