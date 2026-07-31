"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface StaticReportProps {
  job: any;
}

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

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 bg-emerald-950/40 border-emerald-800/80";
    if (score >= 60) return "text-amber-400 bg-amber-950/40 border-amber-800/80";
    return "text-rose-400 bg-rose-950/40 border-rose-800/80";
  };

  const isProcessing = jobData.status !== "SUCCEEDED" && jobData.status !== "FAILED";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/" className="text-xs text-indigo-400 hover:underline">
                ← Back to Dashboard
              </Link>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 border border-indigo-700/80 text-indigo-300 font-mono">
                STATIC_STANDARD
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono ${
                jobData.status === "SUCCEEDED" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" :
                jobData.status === "FAILED" ? "bg-rose-950 text-rose-300 border border-rose-800" :
                "bg-amber-950 text-amber-300 border border-amber-800 animate-pulse"
              }`}>
                {jobData.status}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-2 tracking-tight">
              {jobData.title || "Static Creative Analysis Report"}
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-mono" suppressHydrationWarning>
              Job ID: {jobData.id} • Created: {jobData.createdAt ? new Date(jobData.createdAt).toISOString().replace("T", " ").substring(0, 19) : ""}
            </p>
          </div>

          <div className="flex items-center gap-6 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
            <div className="text-right">
              <p className="text-xs text-slate-400 font-medium">Diagnostic Score</p>
              <p className="text-xs text-slate-500 font-mono">Pre-flight Rating</p>
            </div>
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black border shadow-lg ${getScoreColor(
                overallScore
              )}`}
            >
              {isProcessing ? "..." : overallScore}
            </div>
          </div>
        </div>

        {/* Failed State Alert */}
        {jobData.status === "FAILED" && (
          <div className="p-6 bg-rose-950/60 border border-rose-800/80 rounded-2xl text-rose-200">
            <h3 className="text-sm font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
              <span>⚠️</span> Analysis Execution Failed
            </h3>
            <p className="text-xs font-mono mt-2 text-rose-300">
              {jobData.errorMessage || "An unexpected error occurred during creative stage processing."}
            </p>
          </div>
        )}

        {/* Live Processing Screen */}
        {isProcessing && (
          <div className="p-8 bg-slate-900/80 border border-indigo-900/60 rounded-2xl text-center space-y-4 backdrop-blur-md">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-950 border border-indigo-500/40 text-indigo-400 animate-spin text-xl">
              ⚙️
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">⚡ Processing Creative Diagnostics...</h3>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Current Stage: <span className="text-indigo-400 font-bold">{jobData.currentStage || "QUEUED"}</span> ({jobData.progressPercent || 0}%)
              </p>
            </div>
            <div className="max-w-md mx-auto bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
              <div
                className="bg-indigo-500 h-full transition-all duration-500 ease-out"
                style={{ width: `${Math.max(5, jobData.progressPercent || 0)}%` }}
              />
            </div>
          </div>
        )}

        {/* Executive Summary Alert Box */}
        {!isProcessing && (
          <div className="p-6 bg-slate-900/60 border border-indigo-900/40 rounded-2xl backdrop-blur-md relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <span>✨</span> Executive Diagnostic Summary
            </h2>
            <p className="text-sm text-slate-200 mt-2 leading-relaxed">
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
              <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <span>🖼️</span> Media Technical Properties
                </h3>
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <p className="text-slate-400">Dimensions</p>
                    <p className="text-white font-bold mt-1">{inspection.width || "—"} x {inspection.height || "—"}</p>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <p className="text-slate-400">Aspect Ratio</p>
                    <p className="text-white font-bold mt-1">{inspection.aspectRatioLabel || "1:1"}</p>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <p className="text-slate-400">Text Coverage</p>
                    <p className="text-indigo-400 font-bold mt-1">{visionSummary.textCoveragePercent || 0}%</p>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <p className="text-slate-400">Image Contrast</p>
                    <p className="text-emerald-400 font-bold mt-1">{inspection.contrast || 0}</p>
                  </div>
                </div>

                {visionSummary.extractedText && (
                  <div className="mt-4 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">OCR Extracted Text</p>
                    <p className="text-xs text-slate-300 font-mono break-words leading-relaxed">
                      "{visionSummary.extractedText}"
                    </p>
                  </div>
                )}
              </div>

              {/* Category Scores */}
              <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>📊</span> Category Breakdown
                </h3>
                <div className="space-y-3">
                  {categoryScores.map((cat: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-300 font-semibold">{cat.category}</span>
                        <span className="text-indigo-400 font-bold">{cat.score}/100</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                          className="bg-indigo-500 h-full rounded-full"
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
              <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>📋</span> Platform & Brand Rule Evaluation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {rules.map((rule: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{rule.ruleCode}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{rule.actual}</p>
                      </div>
                      <span
                        className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                          rule.status === "PASS"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
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
                <div className="p-6 bg-slate-900/60 border border-emerald-900/30 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                    <span>✅</span> Core Strengths ({strengths.length})
                  </h3>
                  <div className="space-y-3">
                    {strengths.map((s: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl space-y-1">
                        <p className="text-xs font-bold text-white">{s.title}</p>
                        <p className="text-xs text-slate-400 leading-relaxed">{s.description}</p>
                      </div>
                    ))}
                    {strengths.length === 0 && (
                      <p className="text-xs text-slate-500 italic">No explicit strengths recorded.</p>
                    )}
                  </div>
                </div>

                {/* Optimization Recommendations */}
                <div className="p-6 bg-slate-900/60 border border-amber-900/30 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                    <span>💡</span> Areas for Optimization ({optimizations.length})
                  </h3>
                  <div className="space-y-3">
                    {optimizations.map((w: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl space-y-1">
                        <p className="text-xs font-bold text-white">{w.title}</p>
                        <p className="text-xs text-slate-400 leading-relaxed">{w.description}</p>
                        {w.recommendation && (
                          <p className="text-xs text-indigo-300 pt-1 font-medium">👉 Edit Instruction: {w.recommendation}</p>
                        )}
                      </div>
                    ))}
                    {optimizations.length === 0 && (
                      <p className="text-xs text-slate-500 italic">No explicit optimization recommendations recorded.</p>
                    )}
                  </div>
                </div>

              </div>

              {/* Action Plan */}
              {suggestedActionPlan.length > 0 && (
                <div className="p-6 bg-slate-900/60 border border-indigo-900/40 rounded-2xl space-y-3">
                  <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
                    <span>🛠️</span> Performance Design Action Plan
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {suggestedActionPlan.map((step: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="font-mono text-indigo-400 font-bold">{idx + 1}.</span>
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
