export interface WhisperWord {
  word: string;
  startMs: number;
  endMs: number;
}

export interface GroqWhisperResult {
  fullTranscript: string;
  words: WhisperWord[];
  language: string;
  durationMs: number;
  provider: "GROQ_WHISPER" | "FALLBACK_WHISPER";
}

export async function transcribeAudioWithGroq(
  audioWavBuffer?: Buffer,
  videoDurationMs: number = 15000
): Promise<GroqWhisperResult> {
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!groqApiKey || !audioWavBuffer || audioWavBuffer.byteLength === 0) {
    console.log("[GROQ_WHISPER] Groq API key or audio buffer not present. Returning empty transcript.");
    return getEmptyGroqWhisperResult(videoDurationMs);
  }

  try {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(audioWavBuffer)], { type: "audio/wav" });
    formData.append("file", blob, "audio.wav");
    formData.append("model", "whisper-large-v3");
    formData.append("response_format", "verbose_json");
    formData.append("timestamp_granularities[]", "word");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API transcription HTTP ${response.status}: ${errText}`);
    }

    const data: any = await response.json();
    const fullTranscript = data.text || "";

    const words: WhisperWord[] = (data.words || []).map((w: any) => ({
      word: w.word || "",
      startMs: Math.round((w.start || 0) * 1000),
      endMs: Math.round((w.end || 0) * 1000),
    }));

    return {
      fullTranscript,
      words,
      language: data.language || "en",
      durationMs: Math.round((data.duration || videoDurationMs / 1000) * 1000),
      provider: "GROQ_WHISPER",
    };
  } catch (err: any) {
    console.warn("[GROQ_WHISPER_ERROR]", err);
    return getEmptyGroqWhisperResult(videoDurationMs);
  }
}

function getEmptyGroqWhisperResult(durationMs: number): GroqWhisperResult {
  return {
    fullTranscript: "",
    words: [],
    language: "en",
    durationMs,
    provider: "FALLBACK_WHISPER",
  };
}
