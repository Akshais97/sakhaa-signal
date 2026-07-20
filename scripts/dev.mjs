import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

// Ensure path is quoted for Windows shell execution if it contains spaces
const devGpuScript = `"${path.join(rootDir, "scripts", "dev-gpu.mjs")}"`;

const services = [
  ["web", "pnpm", ["--filter", "web", "dev"], { PORT: process.env.PORT || "3000" }],
  ["gpu-worker", "node", [devGpuScript], {}]
];

for (const [name, command, args, env] of services) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      ...env
    }
  });
  child.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.error(`${name} exited with code ${code}`);
      process.exitCode = code;
    }
  });
}
