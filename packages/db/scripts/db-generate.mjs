import { spawnSync } from "node:child_process";
import { loadEnvFile } from "node:process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

try {
  loadEnvFile("apps/api/.env");
} catch (error) {
  if (error?.code !== "ENOENT") {
    throw error;
  }
}

const command = process.execPath;
const schemaPath = existsSync(resolve("prisma/schema.prisma"))
  ? resolve("prisma/schema.prisma")
  : resolve("packages/db/prisma/schema.prisma");

const args = [
  resolvePrismaEntrypoint(),
  "generate",
  "--schema",
  schemaPath
];
const result = spawnSync(command, args, {
  stdio: "inherit"
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
