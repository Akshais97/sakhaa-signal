"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface StaticReportProps {
  job: any;
}

// Minimal inline icon set (monochrome, currentColor). No external dependency.
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
const Spinner = ({ className = "" }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export default function StaticReport({ job: initialJob }: StaticReportProps) {
  const [jobData, setJobData] = useState<any>(initialJob);

  // Real-time polling while job is executing
  useEffect(() => {
    if (jobData.status === "SUCCEEDED" || jobData.status === "FAILED") {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/analysis/jobs/${initialJob.id}`);
        if (res.ok) {
          const { job: freshJob } = await res.json();
          if (freshJob) {
            setJobData(freshJob);
          }
        }
      } catch (e) {}
    }, 1500);

    return () => clearInterval(interval);
  }, [initialJob.id, jobData.status]);

  const report = jobData.reports?.[0]?.summaryJson || {};
  const categoryScores = (report.categoryScores && report.categoryScores.length > 0)
    ? report.categoryScores
    : (jobData.categoryScores || []);

  const overallScore = report.overallScore ?? (categoryScores.length > 0
    ? Math.round(categoryScores.reduce((acc: number, c: any) => acc + (c.score || 0), 0) / categoryScores.length)
    : 0);

  const inspection = report.inspection || {};
  const visionSummary = report.visionSummary || {};
  const rules = (report.rules && report.rules.length > 0) ? report.rules : (jobData.ruleResults || []);
  const executiveSummary = report.executiveSummary || "";
  const suggestedActionPlan = report.suggestedActionPlan || [];

  const findings = jobData.findings || [];
  const strengths = findings.filter((f: any) => f.type === "STRENGTH");
  const optimizations = findings.filter(
    (f: any) => f.type === "WEAKNESS" || f.type === "RECOMMENDATION" || f.recommendation
  );

  // Diagnostic score band — semantic status colors, not decorative.
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[#5BD08C] bg-[rgba(91,208,140,0.1)] border-[#5BD08C]/30";
    if (score >= 60) return "text-[#E8B84B] bg-[rgba(232,184,75,0.1)] border-[#E8B84B]/30";
    return "text-[#F2786C] bg-[rgba(242,120,108,0.1)] border-[#F2786C]/30";
  };

  const isProcessing = jobData.status !== "SUCCEEDED" && jobData.status !== "FAILED";

  return (
    <div className="dashboard-canvas min-h-screen text-graphite-primary p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-graphite-subtle">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-iris-primary hover:underline">
                <IconBack className="w-4 h-4" />
                <span>Back to dashboard</span>
              </Link>
              <span className="text-xs px-2.5 py-1 rounded-md bg-iris-primary/10 border border-iris-primary/30 text-iris-primary font-mono">
                STATIC_STANDARD
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
            <p className="text-xs text-graphite-tertiary mt-1 font-mono" suppressHydrationWarning>
              Job ID: {jobData.id} • Created: {jobData.createdAt ? new Date(jobData.createdAt).toISOString().replace("T", " ").substring(0, 19) : ""}
            </p>
          </div>

          <div className="flex items-center gap-5 bg-graphite-sunken p-4 rounded-md border border-graphite-subtle">
            <div className="text-right">
              <p className="text-sm text-graphite-secondary font-medium">Diagnostic score</p>
              <p className="text-xs text-graphite-tertiary font-mono">Pre-flight rating</p>
            </div>
            <div
              className={`w-16 h-16 rounded-md flex items-center justify-center text-xl font-bold border ${getScoreColor(
                overallScore
              )}`}
            >
              {isProcessing ? "..." : overallScore}
            </div>
          </div>
        </div>

        {/* Failed State Alert */}
        {jobData.status === "FAILED" && (
          <div className="p-5 bg-[rgba(242,120,108,0.08)] border border-[#F2786C]/30 rounded-md text-[#F2786C]">
            <h3 className="text-base font-semibold text-[#F2786C] flex items-center gap-2">
              <IconAlert className="w-5 h-5 shrink-0" />
              <span>Analysis execution failed</span>
            </h3>
            <p className="text-sm font-mono mt-2 text-[#F2786C] leading-relaxed">
              {jobData.errorMessage || "An unexpected error occurred during creative stage processing."}
            </p>
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

        {/* Executive Summary */}
        {!isProcessing && (
          <div className="p-6 bg-graphite-sunken border border-iris-primary/20 rounded-md">
            <h2 className="text-base font-semibold text-iris-primary flex items-center gap-2">
              <IconChart className="w-5 h-5" />
              <span>Executive diagnostic summary</span>
            </h2>
            <p className="text-sm text-graphite-secondary mt-3 leading-relaxed">
              {executiveSummary || "Pre-flight diagnosis evaluation completed."}
            </p>
          </div>
        )}

        {/* Main 2-Column Grid */}
        {!isProcessing && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column: Image Spec & Category Scores */}
            <div className="space-y-6">

              {/* Media Metadata Card */}
              <div className="p-6 bg-graphite-sunken border border-graphite-subtle rounded-md">
                <h3 className="text-base font-semibold text-graphite-primary mb-4 flex items-center gap-2">
                  <IconImage className="w-5 h-5 text-iris-primary" />
                  <span>Media technical properties</span>
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm font-mono">
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

              {/* Category Scores */}
              <div className="p-6 bg-graphite-sunken border border-graphite-subtle rounded-md space-y-4">
                <h3 className="text-base font-semibold text-graphite-primary flex items-center gap-2">
                  <IconChart className="w-5 h-5 text-iris-primary" />
                  <span>Category breakdown</span>
                </h3>
                <div className="space-y-3">
                  {categoryScores.map((cat: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-sm font-mono">
                        <span className="text-graphite-secondary font-medium">{cat.category}</span>
                        <span className="text-iris-primary font-semibold">{cat.score}/100</span>
                      </div>
                      <div className="w-full bg-[#121110] rounded-full h-2 overflow-hidden border border-graphite-subtle">
                        <div
                          className="bg-iris-primary h-full rounded-full"
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
                  <span>Platform and brand rule evaluation</span>
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
                        className={`text-xs font-semibold font-mono px-2 py-1 rounded-sm border ${
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

              {/* Strengths & Optimization Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Strengths */}
                <div className="p-6 bg-graphite-sunken border border-[#5BD08C]/20 rounded-md space-y-4">
                  <h3 className="text-base font-semibold text-[#5BD08C] flex items-center gap-2">
                    <IconCheck className="w-5 h-5" />
                    <span>Core strengths ({strengths.length})</span>
                  </h3>
                  <div className="space-y-3">
                    {strengths.map((s: any, idx: number) => (
                      <div key={idx} className="p-3 bg-[#121110] border border-graphite-subtle rounded-md space-y-1">
                        <p className="text-sm font-semibold text-graphite-primary">{s.title}</p>
                        <p className="text-sm text-graphite-secondary leading-relaxed">{s.description}</p>
                      </div>
                    ))}
                    {strengths.length === 0 && (
                      <p className="text-sm text-graphite-tertiary italic">No explicit strengths recorded.</p>
                    )}
                  </div>
                </div>

                {/* Optimization Recommendations */}
                <div className="p-6 bg-graphite-sunken border border-[#E8B84B]/20 rounded-md space-y-4">
                  <h3 className="text-base font-semibold text-[#E8B84B] flex items-center gap-2">
                    <IconBulb className="w-5 h-5" />
                    <span>Areas for optimisation ({optimizations.length})</span>
                  </h3>
                  <div className="space-y-3">
                    {optimizations.map((w: any, idx: number) => (
                      <div key={idx} className="p-3 bg-[#121110] border border-graphite-subtle rounded-md space-y-1">
                        <p className="text-sm font-semibold text-graphite-primary">{w.title}</p>
                        <p className="text-sm text-graphite-secondary leading-relaxed">{w.description}</p>
                        {w.recommendation && (
                          <p className="text-sm text-iris-primary pt-1 font-medium">
                            Edit instruction: {w.recommendation}
                          </p>
                        )}
                      </div>
                    ))}
                    {optimizations.length === 0 && (
                      <p className="text-sm text-graphite-tertiary italic">No explicit optimisation recommendations recorded.</p>
                    )}
                  </div>
                </div>

              </div>

              {/* Action Plan */}
              {suggestedActionPlan.length > 0 && (
                <div className="p-6 bg-graphite-sunken border border-iris-primary/20 rounded-md space-y-3">
                  <h3 className="text-base font-semibold text-iris-primary flex items-center gap-2">
                    <IconWrench className="w-5 h-5" />
                    <span>Performance design action plan</span>
                  </h3>
                  <ul className="space-y-2 text-sm text-graphite-secondary">
                    {suggestedActionPlan.map((step: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="font-mono text-iris-primary font-semibold shrink-0">{idx + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  );
}