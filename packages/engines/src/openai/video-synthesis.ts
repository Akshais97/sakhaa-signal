import OpenAI from "openai";
import { VideoInspectionResult } from "../preprocessing/video-inspector.js";
import { VideoIntelligenceResult } from "../cv/google-video-intelligence.js";
import { GroqWhisperResult } from "../audio/groq-whisper.js";
import { YAMNetClassificationResult } from "../audio/yamnet-classifier.js";
import { VideoScoringResult } from "../scoring/video-scorer.js";

export interface VideoTimelineFinding {
  type: "STRENGTH" | "WEAKNESS" | "RECOMMENDATION";
  category: "HOOK_RETENTION" | "BRAND_INTEGRATION" | "COPY_AUDIO_SYNC" | "PACING_VISUAL" | "AUDIO_QUALITY";
  title: string;
  description: string;
  recommendation?: string;
  timestampMs?: number;
  timestampFormatted?: string; // e.g. "00:02.5"
  impactPriority: "HIGH" | "MEDIUM" | "LOW";
  evidenceIds: string[];
}

export interface VideoSynthesisReport {
  executiveSummary: string;
  hookDropoffRisk: "LOW" | "MODERATE" | "HIGH";
  first3SecImpactSummary: string;
  findings: VideoTimelineFinding[];
  suggestedActionPlan: string[];
  recommendedAEditVariants?: string[];
}

export const SYSTEM_PROMPT_VIDEO_SYNTHESIS = `You are an elite Video Performance Creative Strategist specializing in TikTok, Instagram Reels, YouTube Shorts, and Meta video ads.
Analyze the provided multi-modal video evidence (including extracted keyframes, timestamped transcript words, YAMNet sound timeline, and OCR text overlays).
Produce a structured JSON report evaluating the 3-second hook retention, brand placement timing, voiceover-text synergy, shot cut pacing, and call-to-action impact.

Output Schema:
{
  "executiveSummary": "Concise 2-sentence summary of video creative performance, opening hook strength, and primary retention dropoff risk.",
  "hookDropoffRisk": "LOW" | "MODERATE" | "HIGH",
  "first3SecImpactSummary": "Detailed assessment of the first 0-3 seconds visual and audio hook impact.",
  "findings": [
    {
      "type": "STRENGTH" | "WEAKNESS" | "RECOMMENDATION",
      "category": "HOOK_RETENTION" | "BRAND_INTEGRATION" | "COPY_AUDIO_SYNC" | "PACING_VISUAL" | "AUDIO_QUALITY",
      "title": "Short descriptive title",
      "description": "Evidence-backed explanation citing specific timestamps or visual/audio features",
      "recommendation": "Specific video edit instruction (e.g., speed up shot cut at 00:02.0, increase contrast on logo at 00:01.5)",
      "timestampMs": 1500,
      "timestampFormatted": "00:01.5",
      "impactPriority": "HIGH" | "MEDIUM" | "LOW",
      "evidenceIds": ["obs_hook_0s", "word_tired_600ms"]
    }
  ],
  "suggestedActionPlan": [
    "1-line actionable video edit step 1",
    "1-line actionable video edit step 2"
  ]
}`;

export async function generateVideoSynthesis(
  inspection: VideoInspectionResult,
  intelligence: VideoIntelligenceResult,
  transcript: GroqWhisperResult,
  audio: YAMNetClassificationResult,
  scoring: VideoScoringResult,
  campaignContext?: { brandName?: string; targetPlatform?: string; creativeGoal?: string }
): Promise<VideoSynthesisReport> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === "local-openai-placeholder") {
    console.log("[OPENAI_VIDEO_SYNTHESIS] API Key not present. Returning unavailable synthesis report.");
    return getEmptyVideoSynthesisReport();
  }

  try {
    const openai = new OpenAI({ apiKey });

    // Format Keyframes as base64 images for GPT-5.6 Sol / GPT-4o multimodal inspection
    const imageContentParts = inspection.keyframes.slice(0, 5).map((kf) => ({
      type: "image_url" as const,
      image_url: {
        url: `data:image/jpeg;base64,${kf.buffer.toString("base64")}`,
        detail: "low" as const,
      },
    }));

    const textPayload = {
      videoMetadata: {
        durationMs: inspection.durationMs,
        resolution: `${inspection.width}x${inspection.height}`,
        aspectRatio: inspection.aspectRatioLabel,
        hasAudio: inspection.hasAudio,
      },
      campaignContext,
      scores: scoring.categoryScores,
      transcriptSummary: transcript.fullTranscript,
      transcriptWords: transcript.words.slice(0, 30),
      ocrTextOverlays: intelligence.textAnnotations,
      shotCuts: intelligence.shotCuts,
      audioSoundscape: audio.timeline.slice(0, 15),
    };

    const userMessageContent = [
      {
        type: "text" as const,
        text: `Analyze this video ad creative payload:\n${JSON.stringify(textPayload, null, 2)}`,
      },
      ...imageContentParts,
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Uses vision multimodal capability for keyframe analysis
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT_VIDEO_SYNTHESIS },
        { role: "user", content: userMessageContent as any },
      ],
    });

    const content = response.choices[0]?.message?.content || "";
    const parsed = JSON.parse(content);

    return {
      executiveSummary: parsed.executiveSummary || "Video creative evaluation complete.",
      hookDropoffRisk: parsed.hookDropoffRisk || (scoring.categoryScores.hook.score < 60 ? "HIGH" : "LOW"),
      first3SecImpactSummary: parsed.first3SecImpactSummary || "Opening 0-3s evaluation based on observed media evidence.",
      findings: parsed.findings || [],
      suggestedActionPlan: parsed.suggestedActionPlan || [],
      recommendedAEditVariants: parsed.recommendedAEditVariants || [],
    };
  } catch (err: any) {
    console.warn("[OPENAI_VIDEO_SYNTHESIS_ERROR]", err);
    return getEmptyVideoSynthesisReport();
  }
}

function getEmptyVideoSynthesisReport(): VideoSynthesisReport {
  return {
    executiveSummary: "OpenAI semantic synthesis engine unavailable. Technical deterministic measurements only.",
    hookDropoffRisk: "MODERATE",
    first3SecImpactSummary: "Multimodal semantic synthesis unavailable; review raw timeline observations below.",
    findings: [],
    suggestedActionPlan: [],
    recommendedAEditVariants: [],
  };
}
