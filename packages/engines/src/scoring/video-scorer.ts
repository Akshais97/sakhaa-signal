import { VideoInspectionResult } from "../preprocessing/video-inspector.js";
import { VideoIntelligenceResult } from "../cv/google-video-intelligence.js";
import { GroqWhisperResult } from "../audio/groq-whisper.js";
import { YAMNetClassificationResult } from "../audio/yamnet-classifier.js";

export interface CategoryScoreDetail {
  score: number; // 0 to 100
  label: string;
  weight: number; // 0.0 to 1.0
  status: "EXCELLENT" | "GOOD" | "NEEDS_IMPROVEMENT" | "POOR";
  keyFactor: string;
}

export interface VideoScoringResult {
  overallScore: number; // 0 to 100
  tier: "TOP_PERFORMER" | "STRONG_CONTENDER" | "AVERAGE" | "UNDERPERFORMING";
  categoryScores: {
    hook: CategoryScoreDetail;
    copyClarity: CategoryScoreDetail;
    branding: CategoryScoreDetail;
    pacing: CategoryScoreDetail;
    audio: CategoryScoreDetail;
  };
}

export function scoreVideoCreative(
  inspection: VideoInspectionResult,
  intelligence: VideoIntelligenceResult,
  transcript: GroqWhisperResult,
  audio: YAMNetClassificationResult
): VideoScoringResult {
  // 1. Hook Score (Weight: 35%)
  // First word timestamp <= 800ms gives high audio entry score
  const firstWordStartMs = transcript.words[0]?.startMs ?? 2000;
  const audioHookScore = firstWordStartMs <= 600 ? 95 : firstWordStartMs <= 1200 ? 80 : 50;

  // Keyframes in 0-3s count
  const hookKeyframesCount = inspection.keyframes.filter((kf) => kf.timestampMs <= 3000).length;
  const visualHookScore = Math.min(100, hookKeyframesCount * 22);
  const hookScoreValue = Math.round(audioHookScore * 0.5 + visualHookScore * 0.5);

  // 2. Copy Clarity Score (Weight: 20%)
  const wordCount = transcript.words.length;
  const wpm = (wordCount / (inspection.durationMs / 1000)) * 60;
  // Ideal ad voiceover WPM is 130 - 170
  let copyScoreValue = 85;
  if (wpm < 90 || wpm > 210) copyScoreValue = 65;
  if (intelligence.textAnnotations.length > 0) copyScoreValue += 10;
  copyScoreValue = Math.min(100, copyScoreValue);

  // 3. Branding Score (Weight: 20%)
  const firstLogoMs = intelligence.logos[0]?.startMs ?? 99999;
  let brandingScoreValue = 50;
  if (firstLogoMs <= 3000) brandingScoreValue = 95;
  else if (firstLogoMs <= 7000) brandingScoreValue = 75;

  // 4. Pacing Score (Weight: 15%)
  const shotCutCount = intelligence.shotCuts.length;
  const avgShotDurationMs = inspection.durationMs / Math.max(1, shotCutCount);
  let pacingScoreValue = 80;
  if (avgShotDurationMs < 1500) pacingScoreValue = 90; // Dynamic fast-paced reel
  else if (avgShotDurationMs > 6000) pacingScoreValue = 60; // Static frame risk

  // 5. Audio Quality Score (Weight: 10%)
  let audioScoreValue = 75;
  if (audio.speechRatio >= 0.4 && audio.speechRatio <= 0.85) audioScoreValue = 90;
  if (audio.silenceRatio > 0.25) audioScoreValue -= 20;
  audioScoreValue = Math.max(30, Math.min(100, audioScoreValue));

  // Overall Weighted Score
  const overallScore = Math.round(
    hookScoreValue * 0.35 +
      copyScoreValue * 0.2 +
      brandingScoreValue * 0.2 +
      pacingScoreValue * 0.15 +
      audioScoreValue * 0.1
  );

  let tier: VideoScoringResult["tier"] = "AVERAGE";
  if (overallScore >= 85) tier = "TOP_PERFORMER";
  else if (overallScore >= 72) tier = "STRONG_CONTENDER";
  else if (overallScore < 60) tier = "UNDERPERFORMING";

  return {
    overallScore,
    tier,
    categoryScores: {
      hook: {
        score: hookScoreValue,
        label: "Hook & Opening Impact",
        weight: 0.35,
        status: getScoreStatus(hookScoreValue),
        keyFactor: firstWordStartMs <= 600 ? "Voiceover starts within 600ms of playback." : "Delayed audio entry reduces opening hook rate.",
      },
      copyClarity: {
        score: copyScoreValue,
        label: "Copy & Voiceover Clarity",
        weight: 0.2,
        status: getScoreStatus(copyScoreValue),
        keyFactor: `${Math.round(wpm)} WPM pace with synchronized text overlays.`,
      },
      branding: {
        score: brandingScoreValue,
        label: "Brand Integration",
        weight: 0.2,
        status: getScoreStatus(brandingScoreValue),
        keyFactor: firstLogoMs <= 3000 ? "Brand logo appears in opening 3-second window." : "Logo reveal occurs after initial 3-second hook window.",
      },
      pacing: {
        score: pacingScoreValue,
        label: "Shot Cut Pacing",
        weight: 0.15,
        status: getScoreStatus(pacingScoreValue),
        keyFactor: `${shotCutCount} shot cuts with ${Math.round(avgShotDurationMs / 1000 * 10) / 10}s average scene hold.`,
      },
      audio: {
        score: audioScoreValue,
        label: "Audio Soundscape",
        weight: 0.1,
        status: getScoreStatus(audioScoreValue),
        keyFactor: `${Math.round(audio.speechRatio * 100)}% speech to ${Math.round(audio.musicRatio * 100)}% music soundscape ratio.`,
      },
    },
  };
}

function getScoreStatus(score: number): CategoryScoreDetail["status"] {
  if (score >= 85) return "EXCELLENT";
  if (score >= 70) return "GOOD";
  if (score >= 55) return "NEEDS_IMPROVEMENT";
  return "POOR";
}
