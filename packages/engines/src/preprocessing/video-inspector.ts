import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";

const execFileAsync = promisify(execFile);

export interface KeyFrameSample {
  timestampMs: number;
  label: "HOOK_0S" | "HOOK_0_5S" | "HOOK_1S" | "HOOK_2S" | "HOOK_3S" | "MID_SHOT" | "END_CARD";
  buffer: Buffer;
  width: number;
  height: number;
}

export interface VideoInspectionResult {
  durationMs: number;
  width: number;
  height: number;
  fps: number;
  aspectRatio: number;
  aspectRatioLabel: string;
  byteSize: number;
  hasAudio: boolean;
  keyframes: KeyFrameSample[];
  audioWavBuffer?: Buffer;
}

export async function inspectVideo(videoBuffer: Buffer, fileName: string = "video.mp4"): Promise<VideoInspectionResult> {
  if (!videoBuffer || videoBuffer.byteLength === 0) {
    throw new Error("Invalid or empty video buffer provided for video creative analysis.");
  }

  // Create temporary workspace directory for bounded FFmpeg execution
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sakhaa-video-"));
  const inputVideoPath = path.join(tempDir, fileName);

  try {
    fs.writeFileSync(inputVideoPath, videoBuffer);

    let probeData: any = null;
    try {
      const { stdout } = await execFileAsync("ffprobe", [
        "-v",
        "quiet",
        "-print_format",
        "json",
        "-show_format",
        "-show_streams",
        inputVideoPath,
      ]);
      probeData = JSON.parse(stdout);
    } catch (probeErr) {
      console.warn("[VIDEO_INSPECTOR] ffprobe execution failed or not installed. Using fallback video probe metadata.", probeErr);
    }

    const videoStream = probeData?.streams?.find((s: any) => s.codec_type === "video");
    const audioStream = probeData?.streams?.find((s: any) => s.codec_type === "audio");

    const durationMs = probeData?.format?.duration
      ? Math.round(parseFloat(probeData.format.duration) * 1000)
      : 15000;
    const width = videoStream?.width ? parseInt(videoStream.width, 10) : 1080;
    const height = videoStream?.height ? parseInt(videoStream.height, 10) : 1920;

    let fps = 30;
    if (videoStream?.r_frame_rate) {
      const parts = videoStream.r_frame_rate.split("/");
      if (parts.length === 2 && parseFloat(parts[1]) > 0) {
        fps = Math.round(parseFloat(parts[0]) / parseFloat(parts[1]));
      }
    }

    const aspectRatio = width / Math.max(1, height);
    let aspectRatioLabel = "CUSTOM";
    if (Math.abs(aspectRatio - 0.5625) < 0.05) aspectRatioLabel = "9:16 (Vertical Reel/Story)";
    else if (Math.abs(aspectRatio - 1.0) < 0.05) aspectRatioLabel = "1:1 (Square Feed)";
    else if (Math.abs(aspectRatio - 0.8) < 0.05) aspectRatioLabel = "4:5 (Portrait Feed)";
    else if (Math.abs(aspectRatio - 1.777) < 0.05) aspectRatioLabel = "16:9 (Landscape)";

    const hasAudio = !!audioStream;

    // Extract Keyframes & Audio via FFmpeg
    const keyframes: KeyFrameSample[] = [];
    let audioWavBuffer: Buffer | undefined = undefined;

    const timestampsToExtract: Array<{ label: KeyFrameSample["label"]; sec: number }> = [
      { label: "HOOK_0S", sec: 0 },
      { label: "HOOK_0_5S", sec: 0.5 },
      { label: "HOOK_1S", sec: 1.0 },
      { label: "HOOK_2S", sec: 2.0 },
      { label: "HOOK_3S", sec: 3.0 },
      { label: "MID_SHOT", sec: Math.min(Math.round(durationMs / 2000), Math.max(4, Math.round((durationMs / 1000) - 2))) },
      { label: "END_CARD", sec: Math.max(0, Math.round((durationMs / 1000) - 1)) },
    ];

    for (let i = 0; i < timestampsToExtract.length; i++) {
      const target = timestampsToExtract[i];
      if (target.sec * 1000 > durationMs) continue;

      const outputPath = path.join(tempDir, `frame_${i}.jpg`);
      try {
        await execFileAsync("ffmpeg", [
          "-y",
          "-ss",
          target.sec.toString(),
          "-i",
          inputVideoPath,
          "-vframes",
          "1",
          "-q:v",
          "2",
          outputPath,
        ]);
        if (fs.existsSync(outputPath)) {
          const frameBuffer = fs.readFileSync(outputPath);
          keyframes.push({
            timestampMs: Math.round(target.sec * 1000),
            label: target.label,
            buffer: frameBuffer,
            width,
            height,
          });
        }
      } catch (frameErr) {
        console.warn(`[VIDEO_INSPECTOR] Could not extract frame at ${target.sec}s:`, frameErr);
      }
    }

    // Extract Audio if present
    if (hasAudio) {
      const audioOutputPath = path.join(tempDir, "extracted_audio.wav");
      try {
        await execFileAsync("ffmpeg", [
          "-y",
          "-i",
          inputVideoPath,
          "-vn",
          "-acodec",
          "pcm_s16le",
          "-ar",
          "16000",
          "-ac",
          "1",
          audioOutputPath,
        ]);
        if (fs.existsSync(audioOutputPath)) {
          audioWavBuffer = fs.readFileSync(audioOutputPath);
        }
      } catch (audioErr) {
        console.warn("[VIDEO_INSPECTOR] Audio extraction failed:", audioErr);
      }
    }

    return {
      durationMs,
      width,
      height,
      fps,
      aspectRatio,
      aspectRatioLabel,
      byteSize: videoBuffer.byteLength,
      hasAudio,
      keyframes,
      audioWavBuffer,
    };
  } finally {
    // Clean up temporary files
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
}
