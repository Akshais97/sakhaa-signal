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
  const hasWords = transcript.words.length > 0;
  const firstWordStartMs = hasWords ? transcript.words[0].startMs : undefined;
  const audioHookScore = firstWordStartMs !== undefined 
    ? (firstWordStartMs <= 600 ? 95 : firstWordStartMs <= 1200 ? 80 : 50)
    : 0;

  // Keyframes / visual activity in 0-3s
  const hookKeyframesCount = inspection.keyframes.filter((kf) => kf.timestampMs <= 3000).length;
  // Score visual hook based on keyframe presence and shot cuts without artificial multiplier boost
  const visualHookScore = hookKeyframesCount > 0 ? (intelligence.shotCuts.length > 0 ? 85 : 50) : 0;
  const hookScoreValue = Math.round(audioHookScore * 0.5 + visualHookScore * 0.5);

  // 2. Copy Clarity Score (Weight: 20%)
  const wordCount = transcript.words.length;
  let copyScoreValue = 0;
  if (wordCount > 0) {
    const wpm = (wordCount / Math.max(1, inspection.durationMs / 1000)) * 60;
    copyScoreValue = (wpm >= 110 && wpm <= 180) ? 90 : (wpm >= 80 && wpm <= 220) ? 75 : 50;
    if (intelligence.textAnnotations.length > 0) copyScoreValue = Math.min(100, copyScoreValue + 10);
  } else if (intelligence.textAnnotations.length > 0) {
    copyScoreValue = 65; // On-screen text without voiceover
  }

  // 3. Branding Score (Weight: 20%)
  const hasLogos = intelligence.logos.length > 0;
  const firstLogoMs = hasLogos ? intelligence.logos[0].startMs : undefined;
  let brandingScoreValue = 0;
  if (firstLogoMs !== undefined) {
    if (firstLogoMs <= 3000) brandingScoreValue = 95;
    else if (firstLogoMs <= 7000) brandingScoreValue = 75;
    else brandingScoreValue = 50;
  }

  // 4. Pacing Score (Weight: 15%)
  const shotCutCount = intelligence.shotCuts.length;
  let pacingScoreValue = 0;
  if (shotCutCount > 0) {
    const avgShotDurationMs = inspection.durationMs / shotCutCount;
    if (avgShotDurationMs >= 1200 && avgShotDurationMs <= 4500) pacingScoreValue = 90;
    else if (avgShotDurationMs < 1200) pacingScoreValue = 75; // Very rapid cuts
    else pacingScoreValue = 60; // Static scene holds
  }

  // 5. Audio Quality Score (Weight: 10%)
  let audioScoreValue = 0;
  if (inspection.hasAudio && audio.silenceRatio < 0.9) {
    audioScoreValue = (audio.speechRatio >= 0.3 && audio.speechRatio <= 0.85) ? 90 : 65;
  }

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
        keyFactor: firstWordStartMs !== undefined
          ? (firstWordStartMs <= 600 ? "Voiceover starts within 600ms of playback." : "Delayed audio entry reduces opening hook rate.")
          : "No voiceover detected in opening sequence.",
      },
      copyClarity: {
        score: copyScoreValue,
        label: "Copy & Voiceover Clarity",
        weight: 0.2,
        status: getScoreStatus(copyScoreValue),
        keyFactor: wordCount > 0
          ? `${Math.round((wordCount / Math.max(1, inspection.durationMs / 1000)) * 60)} WPM pace with voiceover.`
          : (intelligence.textAnnotations.length > 0 ? "On-screen text present without voiceover transcript." : "No copy or voiceover detected."),
      },
      branding: {
        score: brandingScoreValue,
        label: "Brand Integration",
        weight: 0.2,
        status: getScoreStatus(brandingScoreValue),
        keyFactor: firstLogoMs !== undefined
          ? (firstLogoMs <= 3000 ? "Brand logo appears in opening 3-second window." : "Logo reveal occurs after initial 3-second hook window.")
          : "No verified brand logo detected.",
      },
      pacing: {
        score: pacingScoreValue,
        label: "Shot Cut Pacing",
        weight: 0.15,
        status: getScoreStatus(pacingScoreValue),
        keyFactor: shotCutCount > 0
          ? `${shotCutCount} shot cuts with ${Math.round((inspection.durationMs / shotCutCount) / 1000 * 10) / 10}s average scene hold.`
          : "Continuous single-shot video without hard cuts.",
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
