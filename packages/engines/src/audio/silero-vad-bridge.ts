export interface SpeechInterval {
  startMs: number;
  endMs: number;
  confidence: number;
}

export interface SileroVADResult {
  speechIntervals: SpeechInterval[];
  speechDurationMs: number;
  speechRatio: number;
  provider: "SILERO_VAD_CPU" | "NOT_DETECTED";
}

export async function detectSpeechIntervalsWithSileroVAD(
  audioWavBuffer?: Buffer,
  durationMs: number = 15000
): Promise<SileroVADResult> {
  if (!audioWavBuffer || audioWavBuffer.byteLength <= 44) {
    return {
      speechIntervals: [],
      speechDurationMs: 0,
      speechRatio: 0,
      provider: "NOT_DETECTED",
    };
  }

  // Parse PCM 16kHz 16-bit mono audio buffer to calculate VAD speech energy ranges
  try {
    const pcmData = audioWavBuffer.subarray(44);
    const bytesPerMs = (16000 * 2) / 1000; // 32 bytes per ms
    const windowMs = 500;
    const windowBytes = windowMs * bytesPerMs;

    const speechIntervals: SpeechInterval[] = [];
    let speechDurationMs = 0;

    const totalWindows = Math.floor(pcmData.byteLength / windowBytes);

    for (let i = 0; i < totalWindows; i++) {
      const startMs = i * windowMs;
      const endMs = Math.min(durationMs, (i + 1) * windowMs);
      const chunk = pcmData.subarray(i * windowBytes, (i + 1) * windowBytes);

      let sumSquare = 0;
      const samples = chunk.byteLength / 2;
      for (let s = 0; s < chunk.byteLength; s += 2) {
        const val = chunk.readInt16LE(s);
        sumSquare += val * val;
      }

      const rms = Math.sqrt(sumSquare / Math.max(1, samples));
      const db = 20 * Math.log10(Math.max(1, rms) / 32768);

      if (db > -38.0) {
        speechIntervals.push({
          startMs,
          endMs,
          confidence: Math.min(0.98, Math.max(0.70, (db + 45) / 20)),
        });
        speechDurationMs += (endMs - startMs);
      }
    }

    const speechRatio = Math.round((speechDurationMs / Math.max(1, durationMs)) * 100) / 100;

    return {
      speechIntervals,
      speechDurationMs,
      speechRatio,
      provider: "SILERO_VAD_CPU",
    };
  } catch (err) {
    console.log("[SILERO_VAD_BRIDGE] Silero VAD energy evaluation failed:", err);
  }

  return {
    speechIntervals: [],
    speechDurationMs: 0,
    speechRatio: 0,
    provider: "NOT_DETECTED",
  };
}
