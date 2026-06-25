import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
// Quote path for Windows shell execution if it has spaces
const pythonExe = `"${path.join(rootDir, "env details", "conda_envs", "tribev2", "python.exe")}"`;

console.log(`Starting GPU worker with python from: ${pythonExe}`);

const child = spawn(
  pythonExe,
  ["-m", "uvicorn", "app.main:app", "--app-dir", "apps/gpu-worker", "--port", "8000", "--reload"],
  {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      PYTHONPATH: path.join(rootDir, "apps", "gpu-worker")
    }
  }
);

child.on("exit", (code) => {
  if (code !== 0 && code !== null) {
    console.error(`GPU worker exited with code ${code}`);
    process.exitCode = code;
  }
});
