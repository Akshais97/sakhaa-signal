import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";

const execFileAsync = promisify(execFile);

export interface WhisperCppWord {
  word: string;
  startMs: number;
  endMs: number;
}

export interface WhisperCppResult {
  fullTranscript: string;
  words: WhisperCppWord[];
  language: string;
  durationMs: number;
  provider: "WHISPER_CPP_CPU" | "NOT_DETECTED";
}

export async function transcribeAudioWithWhisperCpp(
  audioWavBuffer?: Buffer,
  videoDurationMs: number = 15000
): Promise<WhisperCppResult> {
  if (!audioWavBuffer || audioWavBuffer.byteLength === 0) {
    return {
      fullTranscript: "",
      words: [],
      language: "en",
      durationMs: videoDurationMs,
      provider: "NOT_DETECTED",
    };
  }

  try {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "whisper-cpp-"));
    const wavPath = path.join(tempDir, "input_audio.wav");
    const jsonPath = path.join(tempDir, "input_audio.wav.json");

    fs.writeFileSync(wavPath, audioWavBuffer);

    // Run whisper.cpp binary if available
    await execFileAsync("main", [
      "-m",
      "models/ggml-base.bin",
      "-f",
      wavPath,
      "-oj",
      "-l",
      "en",
    ]);

    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      const fullTranscript = data.transcription?.map((s: any) => s.text).join(" ") || "";
      const words: WhisperCppWord[] = [];

      (data.transcription || []).forEach((seg: any) => {
        (seg.tokens || []).forEach((tok: any) => {
          if (tok.text && tok.offsets) {
            words.push({
              word: tok.text.trim(),
              startMs: Math.round((tok.offsets.from || 0)),
              endMs: Math.round((tok.offsets.to || 0)),
            });
          }
        });
      });

      fs.rmSync(tempDir, { recursive: true, force: true });
      return {
        fullTranscript,
        words,
        language: data.result?.language || "en",
        durationMs: videoDurationMs,
        provider: "WHISPER_CPP_CPU",
      };
    }
  } catch (err) {
    console.log("[WHISPER_CPP_BRIDGE] whisper.cpp local binary not present. Returning empty transcript.");
  }

  return {
    fullTranscript: "",
    words: [],
    language: "en",
    durationMs: videoDurationMs,
    provider: "NOT_DETECTED",
  };
}
