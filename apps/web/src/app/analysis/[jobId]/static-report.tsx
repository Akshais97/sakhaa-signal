"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface StaticReportProps {
  job: any;
}

const POLL_FAILURE_LIMIT = 3;

// Icon Set
type IconProps = React.SVGProps<SVGSVGElement>;
const IconBack = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 4 6 10l6 6" /></svg>
);
const IconAlert = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M10 3 1.5 17.5h17L10 3Z" /><path d="M10 8v4M10 15h.01" /></svg>
);
const IconChart = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 3v14h14" /><path d="M6.5 13l3-4 3 2 3.5-5.5" /></svg>
);
const IconImage = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2.5" y="3.5" width="15" height="13" rx="2" /><circle cx="7" cy="8" r="1.5" /><path d="m3 14 4-4 3 2.5 3-3 4 4.5" /></svg>
);
const IconList = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M7 5h10M7 10h10M7 15h10" /><path d="M3.5 5h.01M3.5 10h.01M3.5 15h.01" /></svg>
);
const IconCheck = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m4 10.5 4 4 8-9" /></svg>
);
const IconBulb = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M10 2.5a5 5 0 0 0-3 9c.7.6 1 1.2 1 2h4c0-.8.3-1.4 1-2a5 5 0 0 0-3-9Z" /><path d="M8 17h4M9 19h2" /></svg>
);
const IconWrench = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14 3a3.5 3.5 0 0 0-4.5 4.4L3 13.9 6.1 17l6.5-6.5A3.5 3.5 0 0 0 17 6l-2.4 2.4-2-2L14 3Z" /></svg>
);
const IconZap = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M11 1.5 3 10.5h6L8 18.5 17 9.5h-6l1-8Z" /></svg>
);
const IconClose = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" {...p}><path d="m5 5 10 10M15 5 5 15" /></svg>
);
const IconCopy = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="6.5" y="6.5" width="10" height="10" rx="1.5" /><path d="M4.5 13.5H3.5a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 3.5 2.5h8a1.5 1.5 0 0 1 1.5 1.5v1" /></svg>
);

const Spinner = ({ className = "" }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export default function StaticReport({ job: initialJob }: StaticReportProps) {
  const [jobData, setJobData] = useState<any>(initialJob);
  const [selectedFinding, setSelectedFinding] = useState<any | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const pollFailures = useRef(0);

  // Polling while running
  useEffect(() => {
    if (jobData.status === "SUCCEEDED" || jobData.status === "FAILED" || pollError) {
      return;
    }

    let disposed = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();

    const poll = async () => {
      try {
        const res = await fetch(`/api/analysis/jobs/${initialJob.id}/status`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(payload.error || `Status request failed (${res.status})`);
        }
        if (disposed) return;
        pollFailures.current = 0;
        if (payload.status === "SUCCEEDED") {
          const reportRes = await fetch(`/api/analysis/jobs/${initialJob.id}/report`, {
            cache: "no-store",
            signal: controller.signal,
          });
          const reportPayload = await reportRes.json().catch(() => ({}));
          if (!reportRes.ok) {
            throw new Error(reportPayload.error || `Report request failed (${reportRes.status})`);
          }
          if (disposed) return;
          setJobData(reportPayload.job);
          return;
        } else {
          setJobData((current: any) => ({ ...current, ...payload }));
        }
      } catch (error) {
        if (disposed || (error instanceof DOMException && error.name === "AbortError")) return;
        pollFailures.current += 1;
        if (pollFailures.current >= POLL_FAILURE_LIMIT) {
          setPollError(error instanceof Error ? error.message : "Analysis status is unavailable.");
          return;
        }
      }

      if (!disposed) timeout = setTimeout(poll, 1500);
    };

    timeout = setTimeout(poll, 1500);

    return () => {
      disposed = true;
      if (timeout) clearTimeout(timeout);
      controller.abort();
    };
  }, [initialJob.id, jobData.status, pollError]);

  const report = jobData.reports?.[0]?.summaryJson || {};
  const categoryScores = (report.categoryScores && report.categoryScores.length > 0)
    ? report.categoryScores
    : (jobData.categoryScores || []);

  const overallScore = report.overallScore ?? (categoryScores.length > 0
    ? Math.round(categoryScores.reduce((acc: number, c: any) => acc + (c.score || 0), 0) / categoryScores.length)
    : 0);

  const confidenceInterval = report.confidenceInterval || [Math.max(0, overallScore - 6), Math.min(100, overallScore + 6)];
  const appliedRules = report.appliedRules || [];
  const quickWins = report.quickWins || [];
  const abVariantHypotheses = report.abVariantHypotheses || [];
  const rawMetrics = report.rawMetrics || {};

  const inspection = report.inspection || {};
  const visionSummary = report.visionSummary || {};
  const rules = (report.rules && report.rules.length > 0) ? report.rules : (jobData.ruleResults || []);
  const executiveSummary = report.executiveSummary || "";
  const suggestedActionPlan = report.suggestedActionPlan || [];

  const findings = report.findings || jobData.findings || [];
  const strengths = findings.filter((f: any) => f.type === "STRENGTH");
  const optimizations = findings.filter(
    (f: any) => f.type === "WEAKNESS" || f.type === "RECOMMENDATION" || f.recommendation
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[#5BD08C] bg-[rgba(91,208,140,0.1)] border-[#5BD08C]/30";
    if (score >= 60) return "text-[#E8B84B] bg-[rgba(232,184,75,0.1)] border-[#E8B84B]/30";
    return "text-[#F2786C] bg-[rgba(242,120,108,0.1)] border-[#F2786C]/30";
  };

  const getEffortBadge = (effort?: string) => {
    switch (effort) {
      case "LOW":
        return <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#5BD08C]/10 text-[#5BD08C] border border-[#5BD08C]/30">LOW Lift (Ad Manager)</span>;
      case "MEDIUM":
        return <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#E8B84B]/10 text-[#E8B84B] border border-[#E8B84B]/30">MEDIUM Lift (Designer &lt;2h)</span>;
      case "HIGH":
        return <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#F2786C]/10 text-[#F2786C] border border-[#F2786C]/30">HIGH Lift (Reshoot/Redesign)</span>;
      default:
        return null;
    }
  };

  const getStepText = (item: any): string => {
    if (item === null || item === undefined) return "";
    if (typeof item === "string") return item;
    if (typeof item === "object") {
      return item.action || item.recommendation || item.title || item.description || item.text || item.hypothesis || JSON.stringify(item);
    }
    return String(item);
  };

  const handleCopyQuickWin = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const isProcessing = !pollError && jobData.status !== "SUCCEEDED" && jobData.status !== "FAILED";

  return (
    <div className="dashboard-canvas min-h-screen text-graphite-primary p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-graphite-subtle">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-iris-primary hover:underline font-medium">
                <IconBack className="w-4 h-4" />
                <span>Back to dashboard</span>
              </Link>
              <span className="text-xs px-2.5 py-1 rounded-md bg-iris-primary/10 border border-iris-primary/30 text-iris-primary font-mono font-semibold">
                {jobData.targetPlatform || "STATIC_META"}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-md bg-[#1E293B] border border-graphite-subtle text-graphite-secondary font-mono">
                Model: {report.selectedModel || jobData.selectedModel || "gpt-4o"}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-md font-mono border ${
                jobData.status === "SUCCEEDED" ? "text-[#5BD08C] bg-[rgba(91,208,140,0.1)] border-[#5BD08C]/30" :
                jobData.status === "FAILED" ? "text-[#F2786C] bg-[rgba(242,120,108,0.1)] border-[#F2786C]/30" :
                "text-[#5FC6DD] bg-[rgba(95,198,221,0.1)] border-[#5FC6DD]/30"
              }`}>
                {jobData.status}
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-semibold text-graphite-primary mt-3 tracking-tight">
              {jobData.title || "Static creative analysis report"}
            </h1>
            <p className="text-xs text-graphite-tertiary mt-1 font-mono">
              Job ID: {jobData.id} • Created: {jobData.createdAt ? new Date(jobData.createdAt).toISOString().replace("T", " ").substring(0, 19) : ""}
            </p>
          </div>

          <div className="flex items-center gap-5 bg-graphite-sunken p-4 rounded-md border border-graphite-subtle shadow-sm">
            <div className="text-right">
              <p className="text-sm text-graphite-secondary font-medium">Creative Effectiveness (CES)</p>
              <p className="text-xs text-graphite-tertiary font-mono">
                Range: [{confidenceInterval[0]}–{confidenceInterval[1]}]
              </p>
            </div>
            <div
              className={`w-16 h-16 rounded-md flex flex-col items-center justify-center border ${getScoreColor(
                overallScore
              )}`}
            >
              <span className="text-2xl font-bold leading-none">{isProcessing ? "..." : overallScore}</span>
              <span className="text-[10px] opacity-75 font-mono">/ 100</span>
            </div>
          </div>
        </div>

        {/* Applied Rules / Audit Badges */}
        {appliedRules.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            <span className="text-graphite-tertiary">Applied rules:</span>
            {appliedRules.map((rule: string, idx: number) => (
              <span
                key={idx}
                className={`px-2 py-0.5 rounded border ${
                  rule.startsWith("boost")
                    ? "bg-[#5BD08C]/10 text-[#5BD08C] border-[#5BD08C]/30"
                    : "bg-[#F2786C]/10 text-[#F2786C] border-[#F2786C]/30"
                }`}
              >
                {rule}
              </span>
            ))}
          </div>
        )}

        {/* Failed State Alert */}
        {jobData.status === "FAILED" && (
          <div className="p-5 bg-[rgba(242,120,108,0.08)] border border-[#F2786C]/30 rounded-md text-[#F2786C]">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <IconAlert className="w-5 h-5 shrink-0" />
              <span>Analysis execution failed</span>
            </h3>
            <p className="text-sm font-mono mt-2 leading-relaxed">
              {jobData.errorMessage || "An unexpected error occurred during creative stage processing."}
            </p>
          </div>
        )}

        {/* Error State Screen */}
        {jobData.status === "FAILED" && (
          <div className="p-8 bg-[#1A1110] border border-[#F2786C]/40 rounded-md space-y-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#F2786C]/10 border border-[#F2786C]/30 text-[#F2786C]">
              <IconAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#F2786C]">Analysis Execution Encountered an Issue</h3>
              <p className="text-sm text-graphite-secondary mt-1 font-mono max-w-lg mx-auto">
                {jobData.errorMessage || "Diagnostic engine encountered an unhandled exception during visual processing."}
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 text-sm font-medium bg-[#2E2B26] hover:bg-[#3A3630] text-graphite-primary border border-graphite-subtle rounded-md transition-colors"
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        )}

        {pollError && (
          <div className="p-8 bg-[#1A1110] border border-[#F2786C]/40 rounded-md space-y-4 text-center">
            <IconAlert className="h-8 w-8 mx-auto text-[#F2786C]" />
            <h3 className="text-lg font-semibold text-[#F2786C]">Analysis status is unavailable</h3>
            <p className="text-sm text-graphite-secondary font-mono">{pollError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm font-medium bg-[#2E2B26] hover:bg-[#3A3630] border border-graphite-subtle rounded-md"
            >
              Retry status check
            </button>
          </div>
        )}

        {/* Live Processing Screen */}
        {isProcessing && (
          <div className="p-8 bg-graphite-sunken border border-iris-primary/20 rounded-md text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-iris-primary/10 border border-iris-primary/30 text-iris-primary">
              <Spinner className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-graphite-primary">Processing creative diagnostics</h3>
              <p className="text-sm text-graphite-secondary mt-1 font-mono">
                Current stage: <span className="text-iris-primary font-semibold">{jobData.currentStage || "QUEUED"}</span> ({jobData.progressPercent || 0}%)
              </p>
            </div>
            <div className="max-w-md mx-auto bg-[#121110] rounded-full h-2.5 overflow-hidden border border-graphite-subtle">
              <div
                className="bg-iris-primary h-full transition-all duration-500 ease-out"
                style={{ width: `${Math.max(5, jobData.progressPercent || 0)}%` }}
              />
            </div>
          </div>
        )}

        {/* Executive Summary Card */}
        {!isProcessing && !pollError && (
          <div className="p-6 bg-graphite-sunken border border-iris-primary/20 rounded-md shadow-sm">
            <h2 className="text-base font-semibold text-iris-primary flex items-center gap-2">
              <IconChart className="w-5 h-5" />
              <span>Executive diagnostic summary</span>
            </h2>
            <p className="text-sm text-graphite-primary mt-3 leading-relaxed font-normal">
              {executiveSummary || "Pre-flight diagnosis evaluation completed."}
            </p>
          </div>
        )}

        {/* Quick Wins Dedicated Action Card */}
        {!isProcessing && !pollError && quickWins.length > 0 && (
          <div className="p-6 bg-[#1A1816] border border-[#E8B84B]/30 rounded-md space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#E8B84B] flex items-center gap-2">
                <IconZap className="w-5 h-5" />
                <span>Zero-Design-Lift Quick Wins ({quickWins.length})</span>
              </h3>
              <span className="text-xs font-mono text-graphite-tertiary">Ship today in Ad Manager</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {quickWins.map((win: any, idx: number) => {
                const winText = getStepText(win);
                const impact = typeof win === "object" ? win?.expectedImpact : null;
                return (
                  <div key={idx} className="p-3.5 bg-[#121110] border border-graphite-subtle rounded-md flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm text-graphite-secondary leading-relaxed">{winText}</p>
                      {impact && (
                        <p className="text-xs font-mono text-[#5BD08C]">Expected Impact: {impact}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleCopyQuickWin(winText, idx)}
                      className="self-end inline-flex items-center gap-1.5 text-xs text-iris-primary hover:text-iris-primary/80 transition-colors font-mono"
                    >
                      <IconCopy className="w-3.5 h-3.5" />
                      <span>{copiedIndex === idx ? "Copied!" : "Copy"}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main 2-Column Grid */}
        {!isProcessing && !pollError && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column: Media Spec & Category Scores */}
            <div className="space-y-6">

              {/* Media Metadata Card */}
              <div className="p-6 bg-graphite-sunken border border-graphite-subtle rounded-md">
                <h3 className="text-base font-semibold text-graphite-primary mb-4 flex items-center gap-2">
                  <IconImage className="w-5 h-5 text-iris-primary" />
                  <span>Media technical properties</span>
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm font-mono">
                  <div className="p-3 bg-[#121110] rounded-md border border-graphite-subtle">
                    <p className="text-graphite-tertiary text-xs">Dimensions</p>
                    <p className="text-graphite-primary font-semibold mt-1">{inspection.width || "—"} x {inspection.height || "—"}</p>
                  </div>
                  <div className="p-3 bg-[#121110] rounded-md border border-graphite-subtle">
                    <p className="text-graphite-tertiary text-xs">Aspect ratio</p>
                    <p className="text-graphite-primary font-semibold mt-1">{inspection.aspectRatioLabel || "1:1"}</p>
                  </div>
                  <div className="p-3 bg-[#121110] rounded-md border border-graphite-subtle">
                    <p className="text-graphite-tertiary text-xs">Text coverage</p>
                    <p className="text-iris-primary font-semibold mt-1">{visionSummary.textCoveragePercent || 0}%</p>
                  </div>
                  <div className="p-3 bg-[#121110] rounded-md border border-graphite-subtle">
                    <p className="text-graphite-tertiary text-xs">Image contrast</p>
                    <p className="text-[#5BD08C] font-semibold mt-1">{inspection.contrast || 0}</p>
                  </div>
                </div>

                {visionSummary.extractedText && (
                  <div className="mt-4 p-3 bg-[#121110] rounded-md border border-graphite-subtle">
                    <p className="text-xs font-semibold text-graphite-tertiary mb-1.5">OCR extracted text</p>
                    <p className="text-sm text-graphite-secondary font-mono break-words leading-relaxed">
                      &ldquo;{visionSummary.extractedText}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Category Scores (Clickable for Detail Modal) */}
              <div className="p-6 bg-graphite-sunken border border-graphite-subtle rounded-md space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-semibold text-graphite-primary flex items-center gap-2">
                    <IconChart className="w-5 h-5 text-iris-primary" />
                    <span>Category breakdown</span>
                  </h3>
                  <span className="text-xs font-mono text-graphite-tertiary">Click row for evidence</span>
                </div>

                <div className="space-y-3">
                  {categoryScores.map((cat: any, idx: number) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedCategory(cat)}
                      className="p-2.5 bg-[#121110] hover:bg-[#1A1816] border border-graphite-subtle rounded-md cursor-pointer transition-colors space-y-1.5"
                    >
                      <div className="flex justify-between text-sm font-mono">
                        <span className="text-graphite-secondary font-medium">{cat.category}</span>
                        <span className="text-iris-primary font-semibold">{cat.score}/100</span>
                      </div>
                      <div className="w-full bg-[#121110] rounded-full h-2 overflow-hidden border border-graphite-subtle">
                        <div
                          className="bg-iris-primary h-full rounded-full transition-all duration-300"
                          style={{ width: `${cat.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Rules & Findings */}
            <div className="lg:col-span-2 space-y-6">

              {/* Rules Evaluation */}
              <div className="p-6 bg-graphite-sunken border border-graphite-subtle rounded-md space-y-4">
                <h3 className="text-base font-semibold text-graphite-primary flex items-center gap-2">
                  <IconList className="w-5 h-5 text-iris-primary" />
                  <span>Platform & compliance rules</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {rules.map((rule: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#121110] border border-graphite-subtle rounded-md flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-graphite-primary font-mono">{rule.ruleCode}</p>
                        <p className="text-xs text-graphite-tertiary mt-0.5 truncate">{rule.actual}</p>
                      </div>
                      <span
                        className={`text-xs font-semibold font-mono px-2 py-1 rounded-sm border shrink-0 ${
                          rule.status === "PASS"
                            ? "text-[#5BD08C] bg-[rgba(91,208,140,0.1)] border-[#5BD08C]/40"
                            : "text-[#F2786C] bg-[rgba(242,120,108,0.1)] border-[#F2786C]/40"
                        }`}
                      >
                        {rule.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Optimisation Findings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Core Strengths */}
                <div className="p-6 bg-graphite-sunken border border-[#5BD08C]/20 rounded-md space-y-4">
                  <h3 className="text-base font-semibold text-[#5BD08C] flex items-center gap-2">
                    <IconCheck className="w-5 h-5" />
                    <span>Core strengths ({strengths.length})</span>
                  </h3>
                  <div className="space-y-3">
                    {strengths.map((s: any, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedFinding(s)}
                        className="p-3 bg-[#121110] hover:bg-[#1A1816] border border-graphite-subtle rounded-md cursor-pointer transition-colors space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-graphite-primary">{s.title}</p>
                          <span className="text-[10px] font-mono text-[#5BD08C] bg-[#5BD08C]/10 px-1.5 py-0.5 rounded">
                            {s.impactPriority || "STRENGTH"}
                          </span>
                        </div>
                        <p className="text-xs text-graphite-secondary leading-relaxed line-clamp-2">{s.description}</p>
                      </div>
                    ))}
                    {strengths.length === 0 && (
                      <p className="text-xs text-graphite-tertiary italic">No explicit strengths recorded.</p>
                    )}
                  </div>
                </div>

                {/* Areas for Optimisation */}
                <div className="p-6 bg-graphite-sunken border border-[#E8B84B]/20 rounded-md space-y-4">
                  <h3 className="text-base font-semibold text-[#E8B84B] flex items-center gap-2">
                    <IconBulb className="w-5 h-5" />
                    <span>Optimisation opportunities ({optimizations.length})</span>
                  </h3>
                  <div className="space-y-3">
                    {optimizations.map((w: any, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedFinding(w)}
                        className="p-3 bg-[#121110] hover:bg-[#1A1816] border border-graphite-subtle rounded-md cursor-pointer transition-colors space-y-2"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <p className="text-sm font-semibold text-graphite-primary">{w.title}</p>
                          {getEffortBadge(w.effortEstimate)}
                        </div>
                        <p className="text-xs text-graphite-secondary leading-relaxed line-clamp-2">{w.description}</p>
                        {w.recommendation && (
                          <p className="text-xs text-iris-primary font-medium line-clamp-1">
                            Edit: {w.recommendation}
                          </p>
                        )}
                      </div>
                    ))}
                    {optimizations.length === 0 && (
                      <p className="text-xs text-graphite-tertiary italic">No explicit optimisation recommendations recorded.</p>
                    )}
                  </div>
                </div>

              </div>

              {/* A/B Variant Hypotheses */}
              {abVariantHypotheses.length > 0 && (
                <div className="p-6 bg-graphite-sunken border border-graphite-subtle rounded-md space-y-4">
                  <h3 className="text-base font-semibold text-graphite-primary flex items-center gap-2">
                    <IconZap className="w-5 h-5 text-iris-primary" />
                    <span>Single-Variable A/B Test Hypotheses ({abVariantHypotheses.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {abVariantHypotheses.map((item: any, idx: number) => (
                      <div key={idx} className="p-3.5 bg-[#121110] border border-graphite-subtle rounded-md space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-mono font-semibold text-iris-primary bg-iris-primary/10 px-2 py-0.5 rounded">
                            Priority #{item.testPriority || idx + 1}
                          </span>
                          <span className="text-xs font-mono text-[#5BD08C]">{item.expectedMetricImpact}</span>
                        </div>
                        <p className="text-sm font-semibold text-graphite-primary">{item.hypothesis}</p>
                        <p className="text-xs text-graphite-secondary font-mono">
                          Vector: <span className="text-graphite-primary">{item.changeVector}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Plan */}
              {suggestedActionPlan.length > 0 && (
                <div className="p-6 bg-graphite-sunken border border-iris-primary/20 rounded-md space-y-3">
                  <h3 className="text-base font-semibold text-iris-primary flex items-center gap-2">
                    <IconWrench className="w-5 h-5" />
                    <span>Performance design action plan</span>
                  </h3>
                  <ul className="space-y-2 text-sm text-graphite-secondary">
                    {suggestedActionPlan.map((step: any, idx: number) => {
                      const stepText = getStepText(step);
                      const impact = typeof step === "object" ? step?.expectedImpact : null;
                      return (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="font-mono text-iris-primary font-semibold shrink-0 bg-iris-primary/10 px-2 py-0.5 rounded text-xs">
                            {idx + 1}
                          </span>
                          <div className="mt-0.5 space-y-0.5">
                            <span className="text-graphite-secondary">{stepText}</span>
                            {impact && (
                              <p className="text-xs text-graphite-tertiary font-mono">Impact: {impact}</p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

            </div>

          </div>
        )}

        {/* Modal Popup: Finding Detail View */}
        {selectedFinding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-xl bg-[#181715] border border-graphite-subtle rounded-lg p-6 space-y-5 shadow-2xl">
              <button
                onClick={() => setSelectedFinding(null)}
                className="absolute top-4 right-4 text-graphite-tertiary hover:text-graphite-primary"
              >
                <IconClose className="w-5 h-5" />
              </button>

              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded border ${
                    selectedFinding.type === "STRENGTH"
                      ? "text-[#5BD08C] bg-[#5BD08C]/10 border-[#5BD08C]/30"
                      : "text-[#E8B84B] bg-[#E8B84B]/10 border-[#E8B84B]/30"
                  }`}>
                    {selectedFinding.type}
                  </span>
                  <span className="text-xs font-mono text-graphite-tertiary border border-graphite-subtle px-2 py-1 rounded">
                    Category: {selectedFinding.category}
                  </span>
                  {getEffortBadge(selectedFinding.effortEstimate)}
                </div>

                <h3 className="text-lg font-semibold text-graphite-primary mt-1">
                  {selectedFinding.title}
                </h3>
              </div>

              <div className="p-4 bg-[#121110] border border-graphite-subtle rounded-md space-y-2">
                <p className="text-xs font-mono text-graphite-tertiary">Diagnostic Evidence:</p>
                <p className="text-sm text-graphite-secondary leading-relaxed font-sans">
                  {selectedFinding.description}
                </p>
              </div>

              {selectedFinding.recommendation && (
                <div className="p-4 bg-iris-primary/10 border border-iris-primary/30 rounded-md space-y-1.5">
                  <p className="text-xs font-mono font-semibold text-iris-primary">Recommended Edit Instruction:</p>
                  <p className="text-sm font-medium text-graphite-primary">
                    {selectedFinding.recommendation}
                  </p>
                </div>
              )}

              {selectedFinding.expectedLift && (
                <div className="flex justify-between items-center text-xs font-mono p-3 bg-[#121110] rounded border border-graphite-subtle">
                  <span className="text-graphite-tertiary">Expected Impact Lift:</span>
                  <span className="text-[#5BD08C] font-semibold">{selectedFinding.expectedLift}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedFinding(null)}
                  className="px-4 py-2 text-sm bg-iris-primary text-white font-medium rounded-md hover:bg-iris-primary/90 transition-colors"
                >
                  Close Detail
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Popup: Category Score Detail View */}
        {selectedCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-[#181715] border border-graphite-subtle rounded-lg p-6 space-y-5 shadow-2xl">
              <button
                onClick={() => setSelectedCategory(null)}
                className="absolute top-4 right-4 text-graphite-tertiary hover:text-graphite-primary"
              >
                <IconClose className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-between border-b border-graphite-subtle pb-4">
                <div>
                  <h3 className="text-lg font-semibold text-graphite-primary">
                    {selectedCategory.category} Analysis
                  </h3>
                  <p className="text-xs text-graphite-tertiary font-mono">Category Rating & Evidence Breakdown</p>
                </div>
                <div className={`px-3 py-1.5 rounded-md font-mono text-xl font-bold border ${getScoreColor(selectedCategory.score)}`}>
                  {selectedCategory.score}/100
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-[#121110] border border-graphite-subtle rounded-md">
                  <p className="text-xs font-mono text-graphite-tertiary">Confidence score:</p>
                  <p className="text-sm font-semibold text-iris-primary font-mono mt-0.5">
                    {Math.round((selectedCategory.confidence || 0.9) * 100)}% Confidence
                  </p>
                </div>

                <div className="p-3.5 bg-[#121110] border border-graphite-subtle rounded-md space-y-1.5">
                  <p className="text-xs font-mono text-graphite-tertiary">Sub-metric breakdown:</p>
                  <pre className="text-xs font-mono text-graphite-secondary overflow-x-auto p-2 bg-black/40 rounded">
                    {JSON.stringify(selectedCategory.breakdown || {}, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="px-4 py-2 text-sm bg-iris-primary text-white font-medium rounded-md hover:bg-iris-primary/90 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
