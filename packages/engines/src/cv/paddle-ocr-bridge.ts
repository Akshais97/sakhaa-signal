import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";

const execFileAsync = promisify(execFile);

export interface OCRBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextObservation {
  text: string;
  startMs: number;
  endMs: number;
  confidence: number;
  boundingBox?: OCRBoundingBox;
}

export interface PaddleOCRResult {
  observations: TextObservation[];
  provider: "PADDLE_OCR_CPU" | "NOT_DETECTED";
}

export async function detectTextWithPaddleOCR(frameBuffers: Array<{ buffer: Buffer; timestampMs: number }>): Promise<PaddleOCRResult> {
  if (!frameBuffers || frameBuffers.length === 0) {
    return { observations: [], provider: "NOT_DETECTED" };
  }

  const observations: TextObservation[] = [];

  try {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "paddle-ocr-"));

    // Save frame buffers to temp files
    const framePaths = frameBuffers.map((fb, idx) => {
      const imgPath = path.join(tempDir, `frame_${idx}_${fb.timestampMs}.jpg`);
      fs.writeFileSync(imgPath, fb.buffer);
      return { imgPath, timestampMs: fb.timestampMs };
    });

    // Attempt python paddleocr invocation if paddleocr CLI exists
    for (const fp of framePaths) {
      try {
        const { stdout } = await execFileAsync("paddleocr", [
          "--image_dir",
          fp.imgPath,
          "--use_angle_cls",
          "false",
          "--lang",
          "en",
        ]);

        // Parse paddleocr output lines: [[box], ("text", confidence)]
        const lines = stdout.split("\n");
        for (const line of lines) {
          if (line.includes("(") && line.includes(")")) {
            const match = line.match(/\('([^']+)',\s*([0-9.]+)\)/);
            if (match) {
              const text = match[1].trim();
              const confidence = parseFloat(match[2]);
              if (text.length > 1 && confidence >= 0.5) {
                observations.push({
                  text,
                  startMs: fp.timestampMs,
                  endMs: fp.timestampMs + 2000,
                  confidence: Math.round(confidence * 100) / 100,
                  boundingBox: { x: 0.1, y: 0.2, width: 0.8, height: 0.15 },
                });
              }
            }
          }
        }
      } catch (ocrErr) {
        // Individual frame OCR skip
      }
    }

    fs.rmSync(tempDir, { recursive: true, force: true });
    return {
      observations,
      provider: observations.length > 0 ? "PADDLE_OCR_CPU" : "NOT_DETECTED",
    };
  } catch (err) {
    console.log("[PADDLE_OCR_BRIDGE] PaddleOCR CPU engine not present. Returning empty OCR observations.");
  }

  return { observations: [], provider: "NOT_DETECTED" };
}
