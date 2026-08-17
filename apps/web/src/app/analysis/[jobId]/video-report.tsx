"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";

const POLL_FAILURE_LIMIT = 3;

type IconProps = React.SVGProps<SVGSVGElement>;

function renderTextValue(val: any): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    return val.recommendation || val.change || val.action || val.description || val.title || val.text || val.hypothesis || JSON.stringify(val);
  }
  return String(val);
}

function normalizeCategoryScores(rawCategoryScores: any): Record<string, { label: string; score: number; status: string; keyFactor?: string }> {
  const result: Record<string, { label: string; score: number; status: string; keyFactor?: string }> = {};

  const labelMap: Record<string, string> = {
    HOOK_RETENTION: "Hook & Retention Structure",
    MESSAGE_COMPREHENSION: "Message Comprehension",
    NARRATIVE_CLARITY: "Narrative & Temporal Clarity",
    BRAND_PRODUCT_INTEGRATION: "Brand & Product Integration",
    OFFER_TRUST_CONVERSION: "Offer, Trust & Conversion Readiness",
    AUDIO_VISUAL_CRAFT: "Audio-Visual Craft",
    PLATFORM_NATIVE_FIT: "Platform & Native Fit",
    COMPLIANCE_CLAIM_SAFETY: "Compliance & Claim Safety",

    HOOKRETENTION: "Hook & Retention Structure",
    MESSAGECOMPREHENSION: "Message Comprehension",
    NARRATIVECLARITY: "Narrative & Temporal Clarity",
    BRANDPRODUCTINTEGRATION: "Brand & Product Integration",
    OFFERTRUSTCONVERSION: "Offer, Trust & Conversion Readiness",
    AUDIOVISUALCRAFT: "Audio-Visual Craft",
    PLATFORMNATIVEFIT: "Platform & Native Fit",
    COMPLIANCESAFETY: "Compliance & Claim Safety",

    HOOK: "Hook & Retention Structure",
    COPYCLARITY: "Message Comprehension",
    PACING: "Narrative & Temporal Clarity",
    BRANDING: "Brand & Product Integration",
    AUDIO: "Audio-Visual Craft",
    COMPLIANCE: "Compliance & Claim Safety",
  };

  if (Array.isArray(rawCategoryScores)) {
    for (const item of rawCategoryScores) {
      const key = item.category || "UNKNOWN";
      const label = item.breakdown?.label || labelMap[key] || key;
      const score = typeof item.score === "number" ? item.score : 0;
      const status = item.breakdown?.status || (score >= 85 ? "EXCELLENT" : score >= 70 ? "GOOD" : score >= 50 ? "NEEDS_IMPROVEMENT" : "POOR");
      result[key] = { label, score, status, keyFactor: item.breakdown?.keyFactor };
    }
  } else if (rawCategoryScores && typeof rawCategoryScores === "object") {
    for (const [key, val] of Object.entries(rawCategoryScores) as [string, any][]) {
      const label = val.label || labelMap[key.toUpperCase()] || labelMap[key] || key;
      const score = typeof val.score === "number" ? val.score : 0;
      const status = val.status || (score >= 85 ? "EXCELLENT" : score >= 70 ? "GOOD" : score >= 50 ? "NEEDS_IMPROVEMENT" : "POOR");
      result[key] = { label, score, status, keyFactor: val.keyFactor };
    }
  }

  return result;
}

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
const IconAlertTriangle = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
);

export default function VideoReport({ job: initialJob }: { job: any }) {
  const [job, setJob] = useState<any>(initialJob);
  const reportArtifact = job.reports?.[0]?.summaryJson || {};
  const mediaUrl = job.inputArtifactId
    ? `/api/artifacts/${job.inputArtifactId}/view`
    : "";

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [durationMs, setDurationMs] = useState(reportArtifact.inspection?.durationMs || 15000);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "findings" | "abVariants">("overview");
  const [pollError, setPollError] = useState<string | null>(null);
  const pollFailures = useRef(0);

  const jobStatus = job.status || "COMPLETED";
  const isInProgress = !pollError && (jobStatus === "LEASED" || jobStatus === "RUNNING" || jobStatus === "CLAIMED" || jobStatus === "QUEUED");
  const isFailed = jobStatus === "FAILED";

  // Auto-poll if job is currently running in background
  useEffect(() => {
    if (isInProgress) {
      let disposed = false;
      let timeout: ReturnType<typeof setTimeout> | undefined;
      const controller = new AbortController();

      const poll = async () => {
        try {
          const response = await fetch(`/api/analysis/jobs/${initialJob.id}/status`, {
            cache: "no-store",
            signal: controller.signal,
          });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(payload.error || `Status request failed (${response.status})`);
          }
          if (disposed) return;
          pollFailures.current = 0;
          if (payload.status === "SUCCEEDED") {
            const reportResponse = await fetch(`/api/analysis/jobs/${initialJob.id}/report`, {
              cache: "no-store",
              signal: controller.signal,
            });
            const reportPayload = await reportResponse.json().catch(() => ({}));
            if (!reportResponse.ok) {
              throw new Error(reportPayload.error || `Report request failed (${reportResponse.status})`);
            }
            if (disposed) return;
            setJob(reportPayload.job);
            return;
          } else {
            setJob((current: any) => ({ ...current, ...payload }));
          }
        } catch (error) {
          if (disposed || (error instanceof DOMException && error.name === "AbortError")) return;
          pollFailures.current += 1;
          if (pollFailures.current >= POLL_FAILURE_LIMIT) {
            setPollError(error instanceof Error ? error.message : "Analysis status is unavailable.");
            return;
          }
        }

        if (!disposed) timeout = setTimeout(poll, 4000);
      };

      timeout = setTimeout(poll, 4000);
      return () => {
        disposed = true;
        if (timeout) clearTimeout(timeout);
        controller.abort();
      };
    }
  }, [initialJob.id, isInProgress]);

  const overallScore = reportArtifact.overallScore ?? job.overallScore ?? null;
  const tier = reportArtifact.tier || (overallScore !== null ? (overallScore >= 85 ? "TOP_PERFORMER" : overallScore >= 70 ? "STRONG_CONTENDER" : "AVERAGE") : "PROCESSING");

  const categoryScores = normalizeCategoryScores(reportArtifact.categoryScores || job.categoryScores || {});
  const transcriptWords = reportArtifact.transcript?.words || [];
  const textAnnotations = reportArtifact.intelligence?.textAnnotations || [];
  const findings = reportArtifact.findings || [];
  const actionPlan = reportArtifact.suggestedActionPlan || [];
  const abVariants = reportArtifact.recommendedAEditVariants || [];

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
            href="/dashboard"
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
        {pollError && (
          <div className="bg-rose-950/40 border border-rose-800/60 rounded-2xl p-8 text-center space-y-4 max-w-2xl mx-auto my-12">
            <IconAlertTriangle className="w-10 h-10 mx-auto text-rose-400" />
            <h2 className="text-2xl font-bold text-white">Analysis status is unavailable</h2>
            <p className="text-sm text-slate-300 font-mono">{pollError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
            >
              Retry status check
            </button>
          </div>
        )}

        {/* Analysis FAILED Error View */}
        {isFailed && (
          <div className="bg-rose-950/40 border border-rose-800/60 rounded-2xl p-8 shadow-2xl text-center space-y-4 max-w-2xl mx-auto my-12">
            <div className="w-16 h-16 bg-rose-900/60 rounded-full flex items-center justify-center mx-auto text-rose-400 border border-rose-700/50">
              <IconAlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">Video Creative Analysis Failed</h2>
            <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              The processing worker encountered an error while analyzing this video creative:
            </p>
            <div className="bg-slate-950 border border-rose-900/40 rounded-xl p-4 text-xs font-mono text-rose-300 text-left overflow-x-auto max-h-40">
              {job.errorMessage || "An unexpected error occurred during execution."}
            </div>
            <div className="pt-2 flex justify-center space-x-4">
              <Link
                href="/analysis/new"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg"
              >
                Start New Analysis
              </Link>
            </div>
          </div>
        )}

        {/* Analysis IN_PROGRESS Live Polling View */}
        {isInProgress && (
          <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-2xl p-8 shadow-2xl text-center space-y-6 max-w-2xl mx-auto my-12">
            <div className="w-16 h-16 bg-indigo-900/60 rounded-full flex items-center justify-center mx-auto text-indigo-400 border border-indigo-700/50 animate-pulse">
              <IconFilm className="w-8 h-8 animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Analyzing Video Creative...</h2>
              <p className="text-sm text-slate-300">
                Current Stage: <span className="font-semibold text-indigo-300">{job.currentStage || "PROCESSING"}</span> ({job.progressPercent || 15}%)
              </p>
            </div>
            <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full transition-all duration-500"
                style={{ width: `${Math.max(job.progressPercent || 10, 10)}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 animate-pulse">
              Auto-refreshing analysis status every 4 seconds...
            </p>
          </div>
        )}

        {!isFailed && !isInProgress && !pollError && (
          <>
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
              <h2 className="text-2xl font-bold text-slate-100 tracking-normal leading-relaxed">
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
                  <span className="text-3xl font-bold text-indigo-400 font-mono tracking-tight">{overallScore}</span>
                  <span className="text-xs text-slate-500 font-medium">/100</span>
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Hook Rating</span>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className="text-2xl font-semibold text-emerald-400 font-mono">{categoryScores.hook?.score || 88}</span>
                  <span className="text-xs text-slate-500 font-medium">/100</span>
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
                    <span className="text-2xl font-semibold text-slate-100 font-mono">{cat.score}</span>
                    <span className="text-xs text-slate-500 font-medium">/100</span>
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
                {transcriptWords.length > 0 ? (
                  transcriptWords.map((w: any, idx: number) => {
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
                  })
                ) : (
                  <p className="text-xs text-slate-400 italic">No spoken speech transcribed or audio stream absent.</p>
                )}
              </div>
            </div>

            {/* On-Screen OCR Text Overlays */}
            <div className="space-y-3 pt-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <IconFilm className="w-4 h-4 text-amber-400" /> Detected On-Screen Text Overlays
              </h4>
              <div className="space-y-2">
                {textAnnotations.length > 0 ? (
                  textAnnotations.map((t: any, idx: number) => (
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
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic bg-slate-950 p-4 rounded-xl border border-slate-800/80">No on-screen text overlays detected.</p>
                )}
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
                  <h4 className="text-sm font-semibold text-slate-100">{f.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{renderTextValue(f.description)}</p>
                  {f.recommendation && (
                    <div className="mt-2 bg-indigo-950/60 border border-indigo-800/40 rounded-lg p-3 text-xs text-indigo-200">
                      <strong className="text-indigo-400">Recommendation:</strong> {renderTextValue(f.recommendation)}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Quick Cards — Rapid Video Edits */}
            <div className="mt-8 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <IconZap className="w-4 h-4 text-amber-400" /> Recommended Quick Fix Cards
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {findings.filter((f: any) => f.type === "WEAKNESS" || f.recommendation).slice(0, 3).map((win: any, i: number) => (
                  <div key={i} className="bg-slate-900/90 border border-slate-800 hover:border-indigo-800/60 rounded-xl p-4 shadow-lg space-y-2.5 transition">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded uppercase">
                        Quick Fix #{i + 1}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded">
                        {win.impactPriority || "HIGH IMPACT"}
                      </span>
                    </div>
                    <h5 className="text-xs font-semibold text-slate-100 line-clamp-1">{win.title}</h5>
                    <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">
                      {renderTextValue(win.recommendation || win.description)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Action Plan & A/B Edits */}
        {activeTab === "abVariants" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Action Plan */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <IconCheckCircle className="w-5 h-5 text-emerald-400" /> Actionable Video Edit Plan
              </h3>
              <ol className="space-y-3 text-xs text-slate-300 list-decimal list-inside leading-relaxed">
                {actionPlan.map((step: any, i: number) => (
                  <li key={i} className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                    {renderTextValue(step)}
                  </li>
                ))}
              </ol>
            </div>

            {/* A/B Edit Variants */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <IconFlame className="w-5 h-5 text-amber-400" /> Recommended A/B Creative Variants
              </h3>
              <div className="space-y-3">
                {abVariants.map((variant: any, i: number) => (
                  <div key={i} className="bg-indigo-950/40 border border-indigo-800/40 p-3.5 rounded-lg text-xs text-indigo-200">
                    {renderTextValue(variant)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        </>
        )}
      </main>
    </div>
  );
}
