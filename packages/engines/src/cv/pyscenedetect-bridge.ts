import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";

const execFileAsync = promisify(execFile);

export interface ShotCut {
  startMs: number;
  endMs: number;
  durationMs: number;
  sceneNumber: number;
}

export interface SceneDetectionResult {
  shotCuts: ShotCut[];
  provider: "PYSCENEDETECT_CPU" | "OPENCV_DIFF" | "NOT_DETECTED";
}

export async function detectVideoShots(videoPath: string, durationMs: number): Promise<SceneDetectionResult> {
  if (!fs.existsSync(videoPath)) {
    return { shotCuts: [], provider: "NOT_DETECTED" };
  }

  // Attempt PySceneDetect via Python subprocess
  try {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "scenedetect-"));
    const csvPath = path.join(tempDir, "scenes.csv");

    await execFileAsync("scenedetect", [
      "-i",
      videoPath,
      "detect-content",
      "-t",
      "27.0",
      "list-scenes",
      "-o",
      tempDir,
    ]);

    if (fs.existsSync(csvPath)) {
      const csvContent = fs.readFileSync(csvPath, "utf-8");
      const lines = csvContent.split("\n").filter((l) => l.trim() && !l.startsWith("Scene Number"));
      const shotCuts: ShotCut[] = [];

      lines.forEach((line, idx) => {
        const parts = line.split(",");
        if (parts.length >= 4) {
          const startSec = parseFloat(parts[1] || "0");
          const endSec = parseFloat(parts[2] || "0");
          const startMs = Math.round(startSec * 1000);
          const endMs = Math.round(endSec * 1000);
          shotCuts.push({
            sceneNumber: idx + 1,
            startMs,
            endMs,
            durationMs: Math.max(100, endMs - startMs),
          });
        }
      });

      fs.rmSync(tempDir, { recursive: true, force: true });
      return { shotCuts, provider: "PYSCENEDETECT_CPU" };
    }
  } catch (err) {
    console.log("[PYSCENEDETECT_BRIDGE] Local scenedetect binary not installed or failed. Returning empty shot list.");
  }

  return { shotCuts: [], provider: "NOT_DETECTED" };
}
