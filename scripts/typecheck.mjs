import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

const requiredFiles = [
  "package.json",
  "pnpm-workspace.yaml",
  "turbo.json",
  "apps/web/package.json",
  "workers/cpu/src/index.ts",
  "packages/engines/src/cv/google-video-intelligence.ts",
  "packages/engines/src/audio/groq-whisper.ts",
  "packages/engines/src/scoring/video-scorer.ts",
  "packages/db/prisma/schema.prisma"
];

const missing = requiredFiles.filter((file) => !existsSync(file));
if (missing.length > 0) {
  throw new Error(`Missing required F0 files:\n${missing.join("\n")}`);
}

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
if (!packageJson.packageManager?.startsWith("pnpm@11.")) {
  throw new Error("Root packageManager must pin pnpm release line 11.");
}

console.log("Typecheck placeholder passed: F0 workspace files and toolchain pins are present.");
