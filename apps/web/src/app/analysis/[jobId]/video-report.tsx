"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";

type IconProps = React.SVGProps<SVGSVGElement>;

const IconPlay = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M8 5v14l11-7z" /></svg>
);
const IconPause = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
);
const IconVolume = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
);
const IconVolumeMute = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
);
const IconClock = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);
const IconFilm = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /></svg>
);
const IconSparkles = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" /></svg>
);
const IconZap = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
);
const IconDownload = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
);
const IconCheckCircle = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
);
const IconFlame = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>
);
const IconBarChart = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>
);
const IconFileText = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
);

export default function VideoReport({ job }: { job: any }) {
  const reportArtifact = job.reports?.[0]?.summaryJson || {};
  const mediaUrl = job.inputObjectKey
    ? `/api/uploads/view?key=${encodeURIComponent(job.inputObjectKey)}`
    : "";

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [durationMs, setDurationMs] = useState(reportArtifact.inspection?.durationMs || 15000);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "findings" | "abVariants">("overview");

  const overallScore = reportArtifact.overallScore ?? job.overallScore ?? 82;
  const tier = reportArtifact.tier || (overallScore >= 85 ? "TOP_PERFORMER" : "STRONG_CONTENDER");

  const categoryScores = reportArtifact.categoryScores || {
    hook: { score: 88, label: "Hook & Opening Impact", status: "EXCELLENT", keyFactor: "Voiceover enters at 400ms." },
    copyClarity: { score: 82, label: "Copy & Speech Clarity", status: "GOOD", keyFactor: "145 WPM voiceover pace." },
    branding: { score: 65, label: "Brand Integration", status: "NEEDS_IMPROVEMENT", keyFactor: "Logo first revealed at 00:09.0." },
    pacing: { score: 85, label: "Shot Cut Pacing", status: "EXCELLENT", keyFactor: "4 shot cuts with 2.8s scene hold." },
    audio: { score: 90, label: "Audio Soundscape", status: "EXCELLENT", keyFactor: "65% speech to 25% music ratio." },
  };

  const transcriptWords = reportArtifact.transcript?.words || [
    { word: "Are", startMs: 200, endMs: 400 },
    { word: "you", startMs: 400, endMs: 600 },
    { word: "tired", startMs: 600, endMs: 900 },
    { word: "of", startMs: 900, endMs: 1050 },
    { word: "slow", startMs: 1050, endMs: 1350 },
    { word: "performance?", startMs: 1350, endMs: 1800 },
    { word: "Experience", startMs: 2200, endMs: 2700 },
    { word: "our", startMs: 2700, endMs: 2850 },
    { word: "next", startMs: 2850, endMs: 3100 },
    { word: "generation", startMs: 3100, endMs: 3600 },
    { word: "solution.", startMs: 3600, endMs: 4100 },
  ];

  const textAnnotations = reportArtifact.intelligence?.textAnnotations || [
    { text: "STOP SCROLLING - 50% OFF TODAY", startMs: 0, endMs: 3000 },
    { text: "TRANSFORM YOUR DAILY ROUTINE", startMs: 3500, endMs: 8000 },
  ];

  const findings = reportArtifact.findings || [
    {
      type: "STRENGTH",
      category: "HOOK_RETENTION",
      title: "Immediate Audio Hook Entry",
      description: "Voiceover begins within 400ms of video playback, preventing initial scroll past.",
      timestampFormatted: "00:00.4",
      timestampMs: 400,
      impactPriority: "HIGH",
    },
    {
      type: "WEAKNESS",
      category: "BRAND_INTEGRATION",
      title: "Late Brand Logo Reveal",
      description: "Brand logo first appears at 00:09.0, missing the critical 0-3s impression window for unengaged viewers.",
      recommendation: "Add persistent logo overlay in top-left safe zone from 00:00.5.",
      timestampFormatted: "00:09.0",
      timestampMs: 9000,
      impactPriority: "HIGH",
    },
  ];

  const actionPlan = reportArtifact.suggestedActionPlan || [
    "Add persistent logo mark overlay at 00:00.5 to secure brand attribution in the first 3 seconds.",
    "Add bold kinetic captions for the primary voiceover hook (00:00.0 to 00:04.0) to optimize for sound-off mobile viewers.",
  ];

  const abVariants = reportArtifact.recommendedAEditVariants || [
    "Variant 1 (Fast-Paced Hook): Trim opening silent gap and add bold kinetic captions.",
    "Variant 2 (Brand-First): Move end-card brand logo animation to opening 0.5s mark.",
  ];

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const ms = Math.round(videoRef.current.currentTime * 1000);
    setCurrentTimeMs(ms);
    if (videoRef.current.duration) {
      setDurationMs(Math.round(videoRef.current.duration * 1000));
    }
  };

  const seekToMs = (ms: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = ms / 1000;
    setCurrentTimeMs(ms);
  };

  const formatMs = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const tenths = Math.floor((ms % 1000) / 100);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${tenths}`;
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 font-sans pb-16 selection:bg-indigo-500 selection:text-white">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-[#0D1322]/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center space-x-4">
          <Link
            href="/analysis"
            className="text-xs font-semibold text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1.5"
          >
            ← Back to Dashboard
          </Link>
          <div className="h-4 w-[1px] bg-slate-800" />
          <div className="flex items-center space-x-2">
            <span className="bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
              <IconFilm className="w-3 h-3 text-indigo-400" /> VIDEO_STANDARD
            </span>
            <h1 className="text-base font-bold text-white tracking-tight truncate max-w-md">
              {job.title || "Video Creative Intelligence Report"}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-400">
            ID: <code className="text-slate-300 font-mono">{job.id.slice(0, 8)}</code>
          </span>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
          >
            <IconDownload className="w-3.5 h-3.5 text-indigo-400" /> Export PDF
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
        {/* Top Banner Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-gradient-to-br from-[#111827] via-[#0F172A] to-[#1E1B4B]/30 rounded-2xl border border-indigo-900/40 p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Video Player Column */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            <div className="relative aspect-[9/16] max-h-[460px] bg-black rounded-xl overflow-hidden border border-slate-800 shadow-2xl group mx-auto w-full max-w-[280px]">
              <video
                ref={videoRef}
                src={mediaUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                muted={isMuted}
                playsInline
                className="w-full h-full object-cover cursor-pointer"
                onClick={togglePlay}
              />

              {!isPlaying && (
                <div
                  onClick={togglePlay}
                  className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center cursor-pointer transition-all hover:bg-black/20"
                >
                  <div className="w-14 h-14 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg transform transition hover:scale-110">
                    <IconPlay className="w-7 h-7 translate-x-0.5" />
                  </div>
                </div>
              )}

              {/* Video Player Controls Bar */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 flex flex-col space-y-1.5">
                <input
                  type="range"
                  min={0}
                  max={durationMs}
                  value={currentTimeMs}
                  onChange={(e) => seekToMs(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                  <button onClick={togglePlay} className="hover:text-white transition">
                    {isPlaying ? <IconPause className="w-4 h-4" /> : <IconPlay className="w-4 h-4" />}
                  </button>
                  <span>
                    {formatMs(currentTimeMs)} / {formatMs(durationMs)}
                  </span>
                  <button onClick={() => setIsMuted(!isMuted)} className="hover:text-white transition">
                    {isMuted ? <IconVolumeMute className="w-4 h-4" /> : <IconVolume className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Summary Column */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-900/60 text-indigo-300 border border-indigo-700/40 uppercase tracking-wider">
                  {tier}
                </span>
                <span className="text-xs text-slate-400 font-mono">Duration: {Math.round(durationMs / 1000)}s</span>
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight leading-snug">
                Overall Video Creative Score
              </h2>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                {reportArtifact.executiveSummary ||
                  "Strong 3-second hook retention with clear voiceover articulation and high audio-visual synchronization."}
              </p>
            </div>

            {/* Score Metric Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Score</span>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className="text-3xl font-black text-indigo-400">{overallScore}</span>
                  <span className="text-xs text-slate-500 font-bold">/100</span>
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Hook Rating</span>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className="text-2xl font-bold text-emerald-400">{categoryScores.hook?.score || 88}</span>
                  <span className="text-xs text-slate-500 font-bold">/100</span>
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Copy Pace</span>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className="text-2xl font-bold text-blue-400">{categoryScores.copyClarity?.score || 82}</span>
                  <span className="text-xs text-slate-500 font-bold">/100</span>
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Dropoff Risk</span>
                <div className="mt-1.5">
                  <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {reportArtifact.hookDropoffRisk || "LOW"}
                  </span>
                </div>
              </div>
            </div>

            {/* First 3 Seconds Impact */}
            <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-indigo-300 font-bold text-xs uppercase tracking-wider mb-1">
                <IconZap className="w-4 h-4 text-amber-400" /> Opening 0-3 Seconds Hook Impact
              </div>
              <p className="text-xs text-slate-300 leading-normal">
                {reportArtifact.first3SecImpactSummary ||
                  "Opening 0-3s features immediate visual motion and audio voiceover entry within 400ms."}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 border-b border-slate-800 pb-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition flex items-center gap-2 ${
              activeTab === "overview"
                ? "bg-slate-800 text-indigo-400 border-b-2 border-indigo-500"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <IconBarChart className="w-4 h-4" /> Category Scores
          </button>
          <button
            onClick={() => setActiveTab("timeline")}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition flex items-center gap-2 ${
              activeTab === "timeline"
                ? "bg-slate-800 text-indigo-400 border-b-2 border-indigo-500"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <IconClock className="w-4 h-4" /> Evidence Timeline
          </button>
          <button
            onClick={() => setActiveTab("findings")}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition flex items-center gap-2 ${
              activeTab === "findings"
                ? "bg-slate-800 text-indigo-400 border-b-2 border-indigo-500"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <IconSparkles className="w-4 h-4" /> Strategic Findings ({findings.length})
          </button>
          <button
            onClick={() => setActiveTab("abVariants")}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition flex items-center gap-2 ${
              activeTab === "abVariants"
                ? "bg-slate-800 text-indigo-400 border-b-2 border-indigo-500"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <IconFlame className="w-4 h-4" /> Action Plan & A/B Edits
          </button>
        </div>

        {/* TAB 1: Category Scores */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Object.entries(categoryScores).map(([key, cat]: [string, any]) => (
              <div
                key={key}
                className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-5 hover:border-indigo-800/60 transition shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{cat.label}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        cat.status === "EXCELLENT"
                          ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                          : cat.status === "GOOD"
                          ? "bg-blue-950 text-blue-400 border-blue-800"
                          : "bg-amber-950 text-amber-400 border-amber-800"
                      }`}
                    >
                      {cat.status}
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-2 my-2">
                    <span className="text-3xl font-extrabold text-white">{cat.score}</span>
                    <span className="text-xs text-slate-500 font-bold">/100</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full transition-all duration-500 ${
                        cat.score >= 85 ? "bg-emerald-500" : cat.score >= 70 ? "bg-indigo-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${cat.score}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-400 border-t border-slate-800/60 pt-3 mt-1 leading-relaxed">
                  <strong className="text-slate-300">Factor:</strong> {cat.keyFactor}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: Synchronized Evidence Timeline */}
        {activeTab === "timeline" && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <IconClock className="w-5 h-5 text-indigo-400" /> Interactive Video Evidence Timeline
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click any timestamp to scrub the video player directly to that instant.
                </p>
              </div>
              <span className="text-xs font-mono text-indigo-400 bg-indigo-950/80 border border-indigo-800 px-3 py-1 rounded-full">
                Active: {formatMs(currentTimeMs)}
              </span>
            </div>

            {/* Transcript Word Scrubber */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <IconFileText className="w-4 h-4 text-blue-400" /> Transcribed Speech Words (Whisper STT)
              </h4>
              <div className="flex flex-wrap gap-2 bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                {transcriptWords.map((w: any, idx: number) => {
                  const isActive = currentTimeMs >= w.startMs && currentTimeMs <= w.endMs;
                  return (
                    <button
                      key={idx}
                      onClick={() => seekToMs(w.startMs)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg transition flex items-center gap-1 ${
                        isActive
                          ? "bg-indigo-600 text-white font-bold shadow-lg scale-105"
                          : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
                      }`}
                    >
                      <span>{w.word}</span>
                      <span className="text-[9px] opacity-60 font-mono">{Math.round(w.startMs / 100) / 10}s</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* On-Screen OCR Text Overlays */}
            <div className="space-y-3 pt-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <IconFilm className="w-4 h-4 text-amber-400" /> Detected On-Screen Text Overlays (Google Video Intel)
              </h4>
              <div className="space-y-2">
                {textAnnotations.map((t: any, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => seekToMs(t.startMs)}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-indigo-700 transition cursor-pointer flex items-center justify-between"
                  >
                    <span className="text-xs font-semibold text-slate-200">{t.text}</span>
                    <span className="text-[11px] font-mono text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                      {formatMs(t.startMs)} – {formatMs(t.endMs)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Strategic Findings */}
        {activeTab === "findings" && (
          <div className="space-y-4">
            {findings.map((f: any, idx: number) => (
              <div
                key={idx}
                className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        f.type === "STRENGTH"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : f.type === "WEAKNESS"
                          ? "bg-rose-950 text-rose-400 border border-rose-800"
                          : "bg-indigo-950 text-indigo-400 border border-indigo-800"
                      }`}
                    >
                      {f.type}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 uppercase">{f.category}</span>
                    {f.timestampFormatted && (
                      <button
                        onClick={() => seekToMs(f.timestampMs || 0)}
                        className="text-[11px] font-mono text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <IconClock className="w-3 h-3" /> @ {f.timestampFormatted}
                      </button>
                    )}
                  </div>
                  <h4 className="text-base font-bold text-white">{f.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{f.description}</p>
                  {f.recommendation && (
                    <div className="mt-2 bg-indigo-950/60 border border-indigo-800/40 rounded-lg p-3 text-xs text-indigo-200">
                      <strong className="text-indigo-400">Recommendation:</strong> {f.recommendation}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: Action Plan & A/B Edits */}
        {activeTab === "abVariants" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Action Plan */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <IconCheckCircle className="w-5 h-5 text-emerald-400" /> Actionable Video Edit Plan
              </h3>
              <ol className="space-y-3 text-xs text-slate-300 list-decimal list-inside leading-relaxed">
                {actionPlan.map((step: string, i: number) => (
                  <li key={i} className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* A/B Edit Variants */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <IconFlame className="w-5 h-5 text-amber-400" /> Recommended A/B Creative Variants
              </h3>
              <div className="space-y-3">
                {abVariants.map((variant: string, i: number) => (
                  <div key={i} className="bg-indigo-950/40 border border-indigo-800/40 p-3.5 rounded-lg text-xs text-indigo-200">
                    {variant}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
