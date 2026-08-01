"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface OutcomeData {
  score_0_100: number;
  rating: string;
  neurological_basis: string;
}

interface ClusterData {
  cluster_name: string;
  strength_0_1: number;
  psychological_proxy: string;
}

interface MarketingScores {
  outcomes: Record<string, OutcomeData>;
  clusters: Record<string, ClusterData>;
  model_version: string;
}

interface ExplanationReport {
  conversion_analysis: string;
  brand_recall_analysis: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

interface Job {
  id: string;
  status: string;
  input: {
    project_name: string;
    video_name: string;
    video_object_key: string;
    cluster_mode: string;
    output_mode: string;
    run_llm_explanation: boolean;
    brand_name?: string;
    campaign_name?: string;
    target_audience?: string;
    creative_objective?: string;
  };
  createdAt: string;
}

// Minimal inline icon set (monochrome, currentColor). No external dependency.
type IconProps = React.SVGProps<SVGSVGElement>;
const IconBack = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 4 6 10l6 6" /></svg>
);
const IconPlay = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="currentColor" {...p}><path d="M6 4.5v11l9-5.5-9-5.5Z" /></svg>
);
const IconDownload = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5M3.5 15.5h13" /></svg>
);
const IconAlert = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M10 3 1.5 17.5h17L10 3Z" /><path d="M10 8v4M10 15h.01" /></svg>
);
const IconClock = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="10" cy="10" r="7.5" /><path d="M10 5.5V10l3 1.5" /></svg>
);
const Spinner = ({ className = "" }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

// ----------------------------------------------------
// Metadata (no decorative emoji; the A–Q letter key carries recognition)
// ----------------------------------------------------

const CLUSTER_METADATA: Record<string, { name: string; proxy: string }> = {
  A: { name: "Visual Processing", proxy: "Occipital activation tracking rapid visual transitions, colors, and motion density." },
  B: { name: "Face/Scene Recognition", proxy: "Fusiform and parahippocampal response to human subjects and styling contexts." },
  C: { name: "Theory of Mind (ToM)", proxy: "Temporoparietal junction mapping empathy, character intent, and narrative connection." },
  D: { name: "Arousal & Salience", proxy: "Subconscious emotional spikes triggered by sudden audio-visual pattern breaks." },
  E: { name: "Episodic Memory", proxy: "Hippocampal pathways responsible for encoding story sequences for long-term recall." },
  F: { name: "Value / Self-Relevance", proxy: "Medial prefrontal cortex (mPFC) evaluating buying intent and personal utility relevance." },
  G: { name: "Language & Semantics", proxy: "Temporal lobe semantic understanding processing spoken voiceovers and text copy." },
  H: { name: "Music & Acoustic Rhythm", proxy: "Auditory cortex synchronization tracking music beat drops and audio resonance." },
  I: { name: "Selective Attention", proxy: "Frontoparietal attention network regulating visual focus on logos, actions, or products." },
  J: { name: "Cognitive Friction", proxy: "Anterior cingulate cortex (ACC) warning of confusing edits, low clarity, or visual gaps." },
  K: { name: "Motor/Embodied Resonance", proxy: "Premotor simulation of physical touch, fabric feeling, or hands-on actions." },
  L: { name: "Creative Surprise", proxy: "Salience network response to unexpected creative hooks, hooks, or humor." },
  M: { name: "Audio-Visual Binding", proxy: "Multimodal integration scoring beat-to-cut alignment." },
  N: { name: "Brand Trust & Credibility", proxy: "Orbitofrontal and insular assessment of brand authority and trust indicators." },
  O: { name: "Aesthetic Appeal", proxy: "Ventral striatum reward pathway response to overall visual elegance and styling." },
  P: { name: "Valence Direction", proxy: "Frontal asymmetry measuring approach motivation (positive interest) vs. avoidance." },
  Q: { name: "Narrative Coherence", proxy: "Storyline structure evaluation ensuring the narrative builds logically over time." },
};

// Demo dataset is only used for the explicit /results/demo route.
const MOCK_JOB_DATA: Job = {
  id: "job_demo_916_scorer",
  status: "COMPLETED",
  input: {
    project_name: "Valencia Summer Linen Collection",
    video_name: "Surya_Valencia",
    video_object_key: "uploads/job_demo_916_scorer/Surya_Valencia.mp4",
    cluster_mode: "both",
    output_mode: "full_export",
    run_llm_explanation: true,
    brand_name: "Valencia Linen",
    campaign_name: "Summer Linen Launch 2026",
    target_audience: "Urban professionals, style-conscious consumers aged 22-38",
    creative_objective: "Drive purchase intent for linen wear and maximize brand recognition via visual loops",
  },
  createdAt: "2026-07-01T10:30:00.000Z",
};

const MOCK_SCORES: MarketingScores = {
  model_version: "TribeV2-TF-v2.0.4",
  outcomes: {
    "Engagement": {
      score_0_100: 33.5,
      rating: "Moderate",
      neurological_basis: "Moderate visual hook (Cluster A: 0.78) and dorsal attention focus (Cluster I: 0.84) are balanced by low narrative coherence (Cluster Q: 0.22) and social mentalizing (Cluster C: 0.00).",
    },
    "Virality": {
      score_0_100: 30.4,
      rating: "Weak",
      neurological_basis: "Strong affective arousal (Cluster D: 0.79) is offset by complete absence of social relatability (Cluster C: 0.00) and low audio-visual binding (Cluster M: 0.22).",
    },
    "Conversion": {
      score_0_100: 27.2,
      rating: "Weak",
      neurological_basis: "Imagined product use (Cluster K: 1.00) is strong, but cognitive load friction (Cluster J: 0.61) and low message clarity (Cluster G: 0.11) block effective persuasion at the CTA.",
    },
    "Brand Recall": {
      score_0_100: 29.5,
      rating: "Weak",
      neurological_basis: "Average episodic memory encoding (Cluster E: 0.57) co-occurs with very low brand familiarity / trust signals (Cluster N: 0.20) and low multisensory binding (Cluster M: 0.22).",
    },
  },
  clusters: {
    "A": { cluster_name: "Visual Processing", strength_0_1: 0.783, psychological_proxy: "Low-level visual capture; motion energy; involuntary attention; thumb-stop hook." },
    "B": { cluster_name: "Face/Scene Recognition", strength_0_1: 0.601, psychological_proxy: "Face presence; person identity; category recognition; scene context." },
    "C": { cluster_name: "Theory of Mind", strength_0_1: 0.000, psychological_proxy: "Social intention reading; empathy hypothesis; human relatability." },
    "D": { cluster_name: "Arousal & Salience", strength_0_1: 0.791, psychological_proxy: "Limbic activation; interoceptive intensity; subconscious arousal." },
    "E": { cluster_name: "Episodic Memory", strength_0_1: 0.571, psychological_proxy: "Event segmentation; episodic encoding; brand-moment memory." },
    "F": { cluster_name: "Value / Self-Relevance", strength_0_1: 0.460, psychological_proxy: "Personal relevance evaluation; buying intent; subjective value." },
    "G": { cluster_name: "Language & Semantics", strength_0_1: 0.114, psychological_proxy: "Semantic integration; copy comprehension; voiceover understanding." },
    "H": { cluster_name: "Music & Acoustic Rhythm", strength_0_1: 0.578, psychological_proxy: "Sonic hook; voice tone; music arousal; rhythmic sync." },
    "I": { cluster_name: "Selective Attention", strength_0_1: 0.844, psychological_proxy: "Where focus is guided; spatial attention; logo/CTA visual priority." },
    "J": { cluster_name: "Cognitive Friction", strength_0_1: 0.613, psychological_proxy: "Cognitive effort; message friction; confusion/decision complexity." },
    "K": { cluster_name: "Motor/Embodied Resonance", strength_0_1: 1.000, psychological_proxy: "Mirror simulation of physical touch; fabric feeling; product demo." },
    "L": { cluster_name: "Creative Surprise", strength_0_1: 0.644, psychological_proxy: "Unexpected hooks; prediction violation; humor/surprise spike." },
    "M": { cluster_name: "Audio-Visual Binding", strength_0_1: 0.216, psychological_proxy: "Audio-visual congruence; beat-to-cut alignment; multisensory fit." },
    "N": { cluster_name: "Brand Trust & Credibility", strength_0_1: 0.197, psychological_proxy: "Brand familiarity; credibility; authority/trust indicators." },
    "O": { cluster_name: "Aesthetic Appeal", strength_0_1: 0.813, psychological_proxy: "Ventral striatum reward pathway response to overall visual elegance." },
    "P": { cluster_name: "Valence Direction", strength_0_1: 0.451, psychological_proxy: "Frontal asymmetry measuring approach motivation vs avoidance." },
    "Q": { cluster_name: "Narrative Coherence", strength_0_1: 0.223, psychological_proxy: "Storyline structure progression; narrative temporal coherence." },
  },
};

const MOCK_LLM_REPORT: ExplanationReport = {
  conversion_analysis: "Conversion Support is low at 27.2/100. This suggests significant executive friction (Cluster J: 0.61) or low subjective value (Cluster F: 0.46) during key CTA frames. The brain mapping highlights that while visual attention is captured, the cognitive networks do not bind the offer to personal relevance, resulting in weak persuasion signals. However, motor simulation of product-use (Cluster K) is exceptionally strong at 1.00, demonstrating high tactile appreciation that could be leveraged.",
  brand_recall_analysis: "Brand Recall Potential is low at 29.5/100. The neural trace for brand familiarity (Cluster N: 0.20) and memory association is weak. This is often caused by a 'pre-brand memory drain' (Cluster E penalty) where the brand is introduced after a cognitive climax, or where logo exposures lack audio-visual binding (Cluster M: 0.22).",
  strengths: [
    "Maximum motor/embodied resonance (100.0% Motor/Embodied activation) showing that viewers strongly simulate fabric contact and product utility.",
    "Very high gaze priority and attention guidance (84.4% Selective Attention activation) keeping viewers focused on the creative action.",
    "Strong aesthetic appeal (81.3% Aesthetic Appeal activation) conveying premium feel and visual polish.",
  ],
  weaknesses: [
    "Extremely low social relatability and theory of mind activation (0.0% Theory of Mind activation).",
    "Weak copy semantics and message clarity (11.4% Language & Semantics activation) causing message dilution.",
    "Low brand trust and symbolic familiarity (19.7% Brand Trust activation) during logo presentation frames.",
  ],
  recommendations: [
    "Simplify the offer and CTA framing. Reduce visual clutter and text density at the end card to lower cognitive load (Cluster J) and raise Conversion Support.",
    "Synchronize audio cues with logo reveals. Ensure the brand name is spoken exactly when the logo is displayed on screen to leverage multisensory binding (Cluster M).",
    "Enhance the emotional hook in the first 3 seconds (Cluster A). Use higher visual contrast and motion energy to capture attention before narrative delivery begins.",
  ],
};

export default function ResultsPage() {
  const params = useParams();
  const jobId = params?.jobId as string;
  const isDemo = !jobId || jobId === "demo";

  const [job, setJob] = useState<Job | null>(null);
  const [scores, setScores] = useState<MarketingScores | null>(null);
  const [report, setReport] = useState<ExplanationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("insights");
  const [checkedRecs, setCheckedRecs] = useState<Record<number, boolean>>({});

  useEffect(() => {
    async function fetchJobResults() {
      // Explicit demo route only.
      if (isDemo) {
        setJob(MOCK_JOB_DATA);
        setScores(MOCK_SCORES);
        setReport(MOCK_LLM_REPORT);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) throw new Error("Job not found");
        const data = await res.json();
        setJob(data.job);

        if (data.job.status === "COMPLETED") {
          const artRes = await fetch(`/api/jobs/${jobId}/artifacts`);
          if (artRes.ok) {
            const artData = await artRes.json();

            const scoreArt = artData.artifacts["marketing_scores.json"];
            if (scoreArt) {
              const scoreRes = await fetch(scoreArt.url);
              if (scoreRes.ok) setScores(await scoreRes.json());
            }

            const llmArt = artData.artifacts["explanation_report.json"];
            if (llmArt) {
              const llmRes = await fetch(llmArt.url);
              if (llmRes.ok) setReport(await llmRes.json());
            }
          }
        }
        // Not completed: leave scores/report null. UI shows an honest "still running" state.
      } catch (err: unknown) {
        console.warn("Failed to fetch job results:", err);
        setFetchError(err instanceof Error ? err.message : "We could not load this report.");
      } finally {
        setLoading(false);
      }
    }

    fetchJobResults();
  }, [jobId, isDemo]);

  const toggleRec = (idx: number) => {
    setCheckedRecs((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleExportResults = () => {
    if (isDemo || !job?.id) {
      const textReport = `====================================================
SAKHAA SIGNAL NEUROMARKETING BRAND SCORER REPORT
====================================================
Job ID: ${job?.id || "Demo_Job"}
Project Name: ${job?.input.project_name}
Model version: ${scores?.model_version || "TribeV2"}
Timestamp: ${new Date().toISOString()}

OUTCOMES SUMMARY:
- Engagement: ${scores?.outcomes["Engagement"]?.score_0_100}% (${scores?.outcomes["Engagement"]?.rating})
- Virality: ${scores?.outcomes["Virality"]?.score_0_100}% (${scores?.outcomes["Virality"]?.rating})
- Conversion: ${scores?.outcomes["Conversion"]?.score_0_100}% (${scores?.outcomes["Conversion"]?.rating})
- Brand Recall: ${scores?.outcomes["Brand Recall"]?.score_0_100}% (${scores?.outcomes["Brand Recall"]?.rating})

CONVERSION ANALYSIS:
${report?.conversion_analysis}

BRAND RECALL ANALYSIS:
${report?.brand_recall_analysis}

KEY RECOMMENDATIONS:
${report?.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}
`;
      const element = document.createElement("a");
      const file = new Blob([textReport], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = `${job?.input.video_name || "report"}_neuromarketing_outcomes.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } else {
      window.location.href = `/api/storage/download?key=exports/${job.id}/exports/full_result_bundle.zip`;
    }
  };

  if (loading) {
    return (
      <div className="dashboard-canvas min-h-screen flex flex-col items-center justify-center text-graphite-primary">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-iris-primary" />
          <span className="font-mono text-sm text-graphite-tertiary tracking-wide">Loading report…</span>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="dashboard-canvas min-h-screen flex items-center justify-center p-6 text-graphite-primary">
        <div className="max-w-md w-full bg-graphite-sunken border border-[#F2786C]/30 rounded-md p-8 flex flex-col gap-4 text-center">
          <div className="flex justify-center">
            <IconAlert className="w-8 h-8 text-[#F2786C]" />
          </div>
          <h1 className="text-lg font-semibold text-[#F2786C]">Report unavailable</h1>
          <p className="text-sm text-graphite-secondary leading-relaxed">{fetchError}</p>
          <Link href="/" className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md bg-iris-primary text-white text-sm font-semibold hover:brightness-110 transition-all w-fit mx-auto">
            <IconBack className="w-4 h-4" />
            <span>Back to dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const isReady = job && job.status === "COMPLETED";

  const epScore = scores?.outcomes["Engagement"]?.score_0_100 || 0;
  const vpScore = scores?.outcomes["Virality"]?.score_0_100 || 0;
  const csScore = scores?.outcomes["Conversion"]?.score_0_100 || 0;
  const brScore = scores?.outcomes["Brand Recall"]?.score_0_100 || 0;

  return (
    <div className="dashboard-canvas min-h-screen text-graphite-primary font-sans flex flex-col">

      {/* Header */}
      <header className="border-b border-graphite-subtle py-3.5 px-6 md:px-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#121110] sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Back to dashboard" className="w-8 h-8 rounded-md border border-graphite-subtle flex items-center justify-center bg-[#121110] hover:border-iris-primary hover:text-iris-primary transition-colors shrink-0">
            <IconBack className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded-sm bg-iris-primary/10 border border-iris-primary/30 text-iris-primary text-xs font-mono tracking-wide">
                Analysis studio
              </span>
              <h1 className="text-base font-semibold text-graphite-primary">Sakhaa Signal</h1>
              <span className="text-xs text-graphite-tertiary font-mono">v2.0</span>
            </div>
            <p className="text-xs text-graphite-tertiary tracking-wide font-mono mt-0.5">
              Report ID: {job?.id ? `${job.id.slice(0, 12)}…` : "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md border border-graphite-subtle bg-[#0C0B02] text-xs text-graphite-secondary font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5BD08C]" />
            <span>MODEL: {scores?.model_version || "—"}</span>
          </div>

          {isReady && (
            <button
              onClick={handleExportResults}
              className="px-4 py-2 text-sm font-semibold rounded-md bg-iris-primary text-white hover:brightness-110 transition-colors flex items-center gap-1.5"
            >
              <IconDownload className="w-4 h-4" />
              <span>Export outcomes</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
        {!isReady ? (
          // Honest "still running" state — no fabricated results.
          <div className="flex flex-col items-center justify-center text-center py-20 px-6 gap-5">
            <div className="flex justify-center">
              <IconClock className="w-10 h-10 text-iris-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-graphite-primary">Analysis still running</h2>
              <p className="text-sm text-graphite-secondary mt-2 max-w-md leading-relaxed">
                This report is not ready yet. The outcome indices and narrative appear here once the pipeline completes. You can track progress from the dashboard.
              </p>
              {job && (
                <p className="text-xs text-graphite-tertiary font-mono mt-3">Current status: {job.status}</p>
              )}
            </div>
            <Link href="/" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-iris-primary text-white text-sm font-semibold hover:brightness-110 transition-all">
              <IconBack className="w-4 h-4" />
              <span>Back to dashboard</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left Column: Asset Info & Scoring Dials */}
            <div className="lg:col-span-7 flex flex-col gap-6">

              {/* Metadata Card */}
              <div className="p-5 flex flex-col md:flex-row gap-5 bg-graphite-sunken border border-graphite-subtle rounded-md">
                <div className="flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono text-graphite-tertiary tracking-wide">Creative asset metadata</span>
                    <h2 className="text-base font-semibold text-graphite-primary mt-1">{job?.input.project_name}</h2>
                    <p className="text-sm text-graphite-secondary font-mono">Asset: {job?.input.video_name}.mp4</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-graphite-subtle/50 pt-4 text-sm">
                    <div>
                      <span className="text-graphite-tertiary block text-xs font-mono">Target audience</span>
                      <span className="text-graphite-primary font-medium block mt-0.5 leading-relaxed">{job?.input.target_audience || "—"}</span>
                    </div>
                    <div>
                      <span className="text-graphite-tertiary block text-xs font-mono">Creative objective</span>
                      <span className="text-graphite-primary font-medium block mt-0.5 leading-relaxed">{job?.input.creative_objective || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Simulated 9:16 Aspect Video Container */}
                <div className="w-full md:w-36 h-56 shrink-0 rounded-md border border-graphite-subtle bg-[#0C0B02] flex flex-col justify-between p-2.5 relative overflow-hidden group">
                  <div className="absolute inset-0 opacity-[0.05] pointer-events-none border border-white m-1.5 border-dashed" />
                  <div className="flex justify-between items-center text-xs font-mono text-graphite-tertiary z-10">
                    <span>9:16</span>
                    <span className="px-1.5 py-0.5 bg-[#2E2B26] rounded-sm text-xs text-graphite-primary">PREVIEW</span>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="w-9 h-9 rounded-full bg-iris-primary/20 border border-iris-primary flex items-center justify-center cursor-pointer">
                      <IconPlay className="w-4 h-4 text-white pl-0.5" />
                    </div>
                  </div>

                  <div className="text-xs font-mono text-graphite-tertiary z-10 flex justify-between">
                    <span className="truncate max-w-[80px]">{job?.input.video_name || "preview"}</span>
                    <span>0:26s</span>
                  </div>
                </div>
              </div>

              {/* Biometric Scores Circular Dials */}
              <div className="bg-graphite-sunken border border-graphite-subtle rounded-md p-5 flex flex-col gap-5">
                <div>
                  <h3 className="text-base font-semibold text-graphite-primary">Predictive biometric outcomes</h3>
                  <p className="text-sm text-graphite-secondary mt-1">Calibrated directly from parcellated EEG and attention trace profiles</p>
                </div>

                {scores ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Engagement Dial */}
                    <div className="p-3 bg-[#0B0A09]/50 border border-graphite-subtle rounded-md flex flex-col items-center justify-center text-center hover:border-iris-primary/40 transition-colors">
                      <div className="relative w-20 h-20">
                        <svg className="w-20 h-20 transform -rotate-90" aria-hidden="true">
                          <circle cx="40" cy="40" r="34" className="stroke-[#2E2B26]" strokeWidth="6" fill="transparent" />
                          <circle cx="40" cy="40" r="34" className="stroke-iris-primary gauge-circle" strokeWidth="6" fill="transparent" strokeDasharray={213.6} strokeDashoffset={213.6 - (213.6 * epScore) / 100} strokeLinecap="round" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-base font-semibold text-graphite-primary font-mono">
                          {epScore.toFixed(1)}%
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-graphite-primary mt-2.5 block">Engagement</span>
                      <span className="text-xs font-mono text-iris-primary tracking-wide px-1.5 py-0.5 rounded-sm bg-iris-primary/10 mt-1">
                        EP index
                      </span>
                    </div>

                    {/* Virality Dial */}
                    <div className="p-3 bg-[#0B0A09]/50 border border-graphite-subtle rounded-md flex flex-col items-center justify-center text-center hover:border-[#5FC6DD]/40 transition-colors">
                      <div className="relative w-20 h-20">
                        <svg className="w-20 h-20 transform -rotate-90" aria-hidden="true">
                          <circle cx="40" cy="40" r="34" className="stroke-[#2E2B26]" strokeWidth="6" fill="transparent" />
                          <circle cx="40" cy="40" r="34" className="stroke-[#5FC6DD] gauge-circle" strokeWidth="6" fill="transparent" strokeDasharray={213.6} strokeDashoffset={213.6 - (213.6 * vpScore) / 100} strokeLinecap="round" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-base font-semibold text-graphite-primary font-mono">
                          {vpScore.toFixed(1)}%
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-graphite-primary mt-2.5 block">Virality</span>
                      <span className="text-xs font-mono text-[#5FC6DD] tracking-wide px-1.5 py-0.5 rounded-sm bg-[#5FC6DD]/10 mt-1">
                        VP index
                      </span>
                    </div>

                    {/* Conversion Dial */}
                    <div className="p-3 bg-[#0B0A09]/50 border border-graphite-subtle rounded-md flex flex-col items-center justify-center text-center hover:border-ember-creative/40 transition-colors">
                      <div className="relative w-20 h-20">
                        <svg className="w-20 h-20 transform -rotate-90" aria-hidden="true">
                          <circle cx="40" cy="40" r="34" className="stroke-[#2E2B26]" strokeWidth="6" fill="transparent" />
                          <circle cx="40" cy="40" r="34" className="stroke-ember-creative gauge-circle" strokeWidth="6" fill="transparent" strokeDasharray={213.6} strokeDashoffset={213.6 - (213.6 * csScore) / 100} strokeLinecap="round" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-base font-semibold text-graphite-primary font-mono">
                          {csScore.toFixed(1)}%
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-graphite-primary mt-2.5 block">Conversion</span>
                      <span className="text-xs font-mono text-ember-creative tracking-wide px-1.5 py-0.5 rounded-sm bg-ember-creative/10 mt-1">
                        CS index
                      </span>
                    </div>

                    {/* Brand Recall Dial */}
                    <div className="p-3 bg-[#0B0A09]/50 border border-graphite-subtle rounded-md flex flex-col items-center justify-center text-center hover:border-[#E8B84B]/40 transition-colors">
                      <div className="relative w-20 h-20">
                        <svg className="w-20 h-20 transform -rotate-90" aria-hidden="true">
                          <circle cx="40" cy="40" r="34" className="stroke-[#2E2B26]" strokeWidth="6" fill="transparent" />
                          <circle cx="40" cy="40" r="34" className="stroke-[#E8B84B] gauge-circle" strokeWidth="6" fill="transparent" strokeDasharray={213.6} strokeDashoffset={213.6 - (213.6 * brScore) / 100} strokeLinecap="round" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-base font-semibold text-graphite-primary font-mono">
                          {brScore.toFixed(1)}%
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-graphite-primary mt-2.5 block">Brand recall</span>
                      <span className="text-xs font-mono text-[#E8B84B] tracking-wide px-1.5 py-0.5 rounded-sm bg-[#E8B84B]/10 mt-1">
                        BR index
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-graphite-tertiary font-mono p-4 border border-graphite-subtle bg-[#121110] rounded-md">
                    Outcome data is not available for this job.
                  </div>
                )}
              </div>

              {/* Time Series Graph */}
              <div className="bg-graphite-sunken border border-graphite-subtle rounded-md p-5 flex flex-col gap-4">
                <div>
                  <h3 className="text-base font-semibold text-graphite-primary">Arousal and attention timeline trace</h3>
                  <p className="text-sm text-graphite-secondary mt-1">Modality alignment peaks plotted over video runtime (seconds)</p>
                </div>

                <div className="relative h-40 w-full bg-[#0C0B02] border border-graphite-subtle rounded-md p-2">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    <line x1="0" y1="25" x2="100" y2="25" stroke="#2E2B26" strokeWidth="0.5" strokeDasharray="2,2" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="#2E2B26" strokeWidth="0.5" strokeDasharray="2,2" />
                    <line x1="0" y1="75" x2="100" y2="75" stroke="#2E2B26" strokeWidth="0.5" strokeDasharray="2,2" />

                    <path d="M 0 100 L 0 70 L 30 32 L 60 48 L 90 9 L 100 100 Z" fill="url(#arousalGrad)" opacity="0.15" />

                    <path d="M 0 55 L 10 40 L 20 60 L 30 28 L 40 38 L 50 21 L 60 18 L 70 30 L 80 40 L 90 38 L 100 60" fill="none" stroke="#6557F5" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M 0 70 L 10 32 L 20 48 L 30 18 L 40 26 L 50 12 L 60 9 L 70 28 L 80 52 L 90 65 L 100 65" fill="none" stroke="#5FC6DD" strokeWidth="1.5" strokeLinecap="round" />

                    <circle cx="30" cy="18" r="1.5" fill="#FF6B3D" />
                    <circle cx="60" cy="9" r="1.5" fill="#FF6B3D" />
                    <circle cx="90" cy="65" r="1.5" fill="#E8B84B" />

                    <defs>
                      <linearGradient id="arousalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#5FC6DD" />
                        <stop offset="100%" stopColor="#5FC6DD" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>

                  <div className="absolute top-2 left-2 text-xs font-mono text-graphite-tertiary flex gap-3">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-iris-primary" /> Attention index</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#5FC6DD]" /> Arousal index</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-ember-creative" /> Peak hotspots</span>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2 text-xs font-mono text-graphite-tertiary px-1">
                  <div>
                    <span className="font-semibold text-graphite-primary block">0s to 5s</span>
                    <span>Visual hook</span>
                  </div>
                  <div>
                    <span className="font-semibold text-graphite-primary block">5s to 10s</span>
                    <span>Story setup</span>
                  </div>
                  <div>
                    <span className="font-semibold text-graphite-primary block">10s to 15s</span>
                    <span>Tactile fabric close</span>
                  </div>
                  <div>
                    <span className="font-semibold text-graphite-primary block">15s to 20s</span>
                    <span>Beach transition peak</span>
                  </div>
                  <div>
                    <span className="font-semibold text-graphite-primary block">20s to 26s</span>
                    <span>Brand logo outro</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Multi-tab insights */}
            <div className="lg:col-span-5 flex flex-col gap-6">

              {/* Tabs bar */}
              <div className="bg-[#121110] p-1 rounded-md border border-graphite-subtle flex gap-1 font-mono text-sm text-graphite-secondary font-semibold">
                <button
                  onClick={() => setActiveTab("insights")}
                  aria-pressed={activeTab === "insights"}
                  className={`flex-1 py-1.5 text-center rounded-sm transition-colors ${
                    activeTab === "insights" ? "bg-iris-primary text-white" : "hover:text-graphite-primary"
                  }`}
                >
                  Narrative report
                </button>
                <button
                  onClick={() => setActiveTab("brain")}
                  aria-pressed={activeTab === "brain"}
                  className={`flex-1 py-1.5 text-center rounded-sm transition-colors ${
                    activeTab === "brain" ? "bg-iris-primary text-white" : "hover:text-graphite-primary"
                  }`}
                >
                  17 cognitive clusters
                </button>
              </div>

              {/* TAB CONTENT: Narrative Report */}
              {activeTab === "insights" && (
                <div className="flex flex-col gap-6">
                  {report ? (
                    <>
                      {/* Conversion Analysis Box */}
                      <div className="p-4 flex flex-col gap-2.5 bg-graphite-sunken border border-graphite-subtle rounded-md">
                        <h3 className="text-base font-semibold text-graphite-primary">Conversion insights</h3>
                        <p className="text-sm text-graphite-secondary leading-relaxed bg-[#0B0A09]/55 p-3.5 rounded-md border border-graphite-subtle">
                          {report.conversion_analysis}
                        </p>
                      </div>

                      {/* Brand Recall Analysis Box */}
                      <div className="p-4 flex flex-col gap-2.5 bg-graphite-sunken border border-graphite-subtle rounded-md">
                        <h3 className="text-base font-semibold text-graphite-primary">Brand recall insights</h3>
                        <p className="text-sm text-graphite-secondary leading-relaxed bg-[#0B0A09]/55 p-3.5 rounded-md border border-graphite-subtle">
                          {report.brand_recall_analysis}
                        </p>
                      </div>

                      {/* Recommendations Checklist */}
                      <div className="p-4 flex flex-col gap-3 bg-graphite-sunken border border-graphite-subtle rounded-md">
                        <div>
                          <h3 className="text-base font-semibold text-graphite-primary">Creative optimisation checklist</h3>
                          <p className="text-xs font-mono text-graphite-tertiary mt-0.5 tracking-wide">Interactive checklist</p>
                        </div>

                        <div className="flex flex-col gap-2.5 bg-[#0B0A09]/55 p-3 rounded-md border border-graphite-subtle">
                          {report.recommendations.map((rec, idx) => {
                            const isChecked = !!checkedRecs[idx];
                            return (
                              <label
                                key={idx}
                                onClick={() => toggleRec(idx)}
                                className={`flex items-start gap-2.5 cursor-pointer py-1 transition-colors text-sm ${
                                  isChecked ? "opacity-45 line-through text-graphite-tertiary" : "text-graphite-secondary hover:text-graphite-primary"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  readOnly
                                  className="mt-0.5 accent-iris-primary rounded-sm border-graphite-subtle shrink-0"
                                />
                                <span className="leading-relaxed select-none">{rec}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-graphite-tertiary font-mono p-4 border border-graphite-subtle bg-[#121110] rounded-md">
                      Narrative report is not available for this job.
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: 17 Cognitive Clusters */}
              {activeTab === "brain" && (
                <div className="p-4 flex flex-col gap-3 bg-graphite-sunken border border-graphite-subtle rounded-md">
                  <div className="flex justify-between items-center text-xs font-mono text-graphite-tertiary tracking-wide">
                    <span>Brain networks (A–Q)</span>
                    <span>Activation score (out of 100)</span>
                  </div>

                  {scores ? (
                    <div className="flex flex-col gap-2.5 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
                      {Object.entries(scores.clusters).map(([key, cluster]) => {
                        const strengthPercentage = cluster.strength_0_1 * 100;
                        const metadata = CLUSTER_METADATA[key] || { name: cluster.cluster_name, proxy: cluster.psychological_proxy };

                        let barColor = "bg-graphite-secondary";
                        if (strengthPercentage >= 75) barColor = "bg-ember-creative";
                        else if (strengthPercentage > 30) barColor = "bg-iris-primary";

                        return (
                          <div
                            key={key}
                            className="p-2.5 bg-[#0B0A09]/60 border border-graphite-subtle rounded-md flex flex-col gap-1.5 hover:border-iris-primary/30 transition-colors"
                          >
                            <div className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-5 h-5 rounded-sm border border-graphite-subtle bg-[#121110] flex items-center justify-center font-semibold font-mono text-xs text-graphite-primary shrink-0">
                                  {key}
                                </span>
                                <span className="font-medium text-graphite-primary truncate">
                                  {metadata.name}
                                </span>
                              </div>
                              <span className="font-mono text-sm text-graphite-primary font-semibold shrink-0">
                                {strengthPercentage.toFixed(1)}%
                              </span>
                            </div>

                            <div className="w-full bg-[#121110] h-1 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
                                style={{ width: `${strengthPercentage}%` }}
                              />
                            </div>

                            <p className="text-xs text-graphite-tertiary leading-relaxed italic">
                              {metadata.proxy}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-graphite-tertiary font-mono p-4 border border-graphite-subtle bg-[#121110] rounded-md">
                      Cluster mapping is not available for this job.
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-graphite-subtle py-3 px-6 md:px-12 flex flex-col sm:flex-row justify-between items-center bg-[#121110] text-xs text-graphite-tertiary font-mono gap-1">
        <div>
          <span>Sakhaa Signal neuromarketing pipeline studio</span>
          <span className="mx-2 text-graphite-subtle">•</span>
          <span>Session: {job?.id || "demo"}</span>
        </div>
        <div className="text-center sm:text-right">Assists production using research-prior indices; directional, not predictive.</div>
      </footer>
    </div>
  );
}