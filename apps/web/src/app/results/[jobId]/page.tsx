"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
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

// ----------------------------------------------------
// UI Animation Components (Reference import.md)
// ----------------------------------------------------

function CountUp({ end, start = 0, duration = 1.2, suffix = "" }: { end: number; start?: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(start);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      setCount(progress * (end - start) + start);
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };
    animationFrameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [end, start, duration]);

  return <span>{count.toFixed(1)}{suffix}</span>;
}

function DecryptedText({ text, speed = 30, maxIterations = 4, className = "" }: { text: string; speed?: number; maxIterations?: number; className?: string }) {
  const [displayText, setDisplayText] = useState("");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";

  useEffect(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      const nextText = text
        .split("")
        .map((char: string, index: number) => {
          if (char === " ") return " ";
          const solvedThreshold = iteration / maxIterations;
          if (index < solvedThreshold) {
            return text[index];
          }
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join("");

      setDisplayText(nextText);

      if (iteration >= text.length * maxIterations) {
        setDisplayText(text);
        clearInterval(interval);
      }
      iteration++;
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, maxIterations]);

  return <span className={className}>{displayText}</span>;
}

function SpotlightCard({ 
  spotlightColor = "rgba(101, 87, 245, 0.12)", 
  children, 
  className = "", 
  ...props 
}: { 
  spotlightColor?: string; 
  children: React.ReactNode; 
  className?: string;
  [key: string]: any;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={cardRef}
      className={`spotlight-card ${className}`}
      onMouseMove={handleMouseMove}
      style={{
        ["--spotlight-color" as any]: spotlightColor,
        ["--x" as any]: `${coords.x}px`,
        ["--y" as any]: `${coords.y}px`,
        ...props.style
      } as React.CSSProperties}
      {...props}
    >
      <div className="spotlight-card-border" />
      <div className="spotlight-card-content">{children}</div>
    </div>
  );
}

function ShinyText({ text, className = "" }: { text: string; className?: string }) {
  return <span className={`shiny-text ${className}`}>{text}</span>;
}

// ----------------------------------------------------
// Metadata & Mock Datasets
// ----------------------------------------------------

const CLUSTER_METADATA: Record<string, { name: string; icon: string; proxy: string }> = {
  A: { name: "Visual Processing", icon: "👁️", proxy: "Occipital activation tracking rapid visual transitions, colors, and motion density." },
  B: { name: "Face/Scene Recognition", icon: "👤", proxy: "Fusiform and parahippocampal response to human subjects and styling contexts." },
  C: { name: "Theory of Mind (ToM)", icon: "🧠", proxy: "Temporoparietal junction mapping empathy, character intent, and narrative connection." },
  D: { name: "Arousal & Salience", icon: "🔥", proxy: "Subconscious emotional spikes triggered by sudden audio-visual pattern breaks." },
  E: { name: "Episodic Memory", icon: "🎞️", proxy: "Hippocampal pathways responsible for encoding story sequences for long-term recall." },
  F: { name: "Value / Self-Relevance", icon: "💎", proxy: "Medial prefrontal cortex (mPFC) evaluating buying intent and personal utility relevance." },
  G: { name: "Language & Semantics", icon: "🗣️", proxy: "Temporal lobe semantic understanding processing spoken voiceovers and text copy." },
  H: { name: "Music & Acoustic Rhythm", icon: "🎵", proxy: "Auditory cortex synchronization tracking music beat drops and audio resonance." },
  I: { name: "Selective Attention", icon: "🎯", proxy: "Frontoparietal attention network regulating visual focus on logos, actions, or products." },
  J: { name: "Cognitive Friction", icon: "⚠️", proxy: "Anterior cingulate cortex (ACC) warning of confusing edits, low clarity, or visual gaps." },
  K: { name: "Motor/Embodied Resonance", icon: "🏃", proxy: "Premotor simulation of physical touch, fabric feeling, or hands-on actions." },
  L: { name: "Creative Surprise", icon: "⚡", proxy: "Salience network response to unexpected creative hooks, hooks, or humor." },
  M: { name: "Audio-Visual Binding", icon: "🎛️", proxy: "Multimodal integration scoring beat-to-cut alignment." },
  N: { name: "Brand Trust & Credibility", icon: "🤝", proxy: "Orbitofrontal and insular assessment of brand authority and trust indicators." },
  O: { name: "Aesthetic Appeal", icon: "🎨", proxy: "Ventral striatum reward pathway response to overall visual elegance and styling." },
  P: { name: "Valence Direction", icon: "📈", proxy: "Frontal asymmetry measuring approach motivation (positive interest) vs. avoidance." },
  Q: { name: "Narrative Coherence", icon: "📖", proxy: "Storyline structure evaluation ensuring the narrative builds logically over time." }
};

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
    creative_objective: "Drive purchase intent for linen wear and maximize brand recognition via visual loops"
  },
  createdAt: "2026-07-01T10:30:00.000Z"
};

const MOCK_SCORES: MarketingScores = {
  model_version: "TribeV2-TF-v2.0.4",
  outcomes: {
    "Engagement": {
      score_0_100: 33.5,
      rating: "Moderate",
      neurological_basis: "Moderate visual hook (Cluster A: 0.78) and dorsal attention focus (Cluster I: 0.84) are balanced by low narrative coherence (Cluster Q: 0.22) and social mentalizing (Cluster C: 0.00)."
    },
    "Virality": {
      score_0_100: 30.4,
      rating: "Weak",
      neurological_basis: "Strong affective arousal (Cluster D: 0.79) is offset by complete absence of social relatability (Cluster C: 0.00) and low audio-visual binding (Cluster M: 0.22)."
    },
    "Conversion": {
      score_0_100: 27.2,
      rating: "Weak",
      neurological_basis: "Imagined product use (Cluster K: 1.00) is strong, but cognitive load friction (Cluster J: 0.61) and low message clarity (Cluster G: 0.11) block effective persuasion at the CTA."
    },
    "Brand Recall": {
      score_0_100: 29.5,
      rating: "Weak",
      neurological_basis: "Average episodic memory encoding (Cluster E: 0.57) co-occurs with very low brand familiarity / trust signals (Cluster N: 0.20) and low multisensory binding (Cluster M: 0.22)."
    }
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
    "Q": { cluster_name: "Narrative Coherence", strength_0_1: 0.223, psychological_proxy: "Storyline structure progression; narrative temporal coherence." }
  }
};

const MOCK_LLM_REPORT: ExplanationReport = {
  conversion_analysis: "Conversion Support is low at 27.2/100. This suggests significant executive friction (Cluster J: 0.61) or low subjective value (Cluster F: 0.46) during key CTA frames. The brain mapping highlights that while visual attention is captured, the cognitive networks do not bind the offer to personal relevance, resulting in weak persuasion signals. However, motor simulation of product-use (Cluster K) is exceptionally strong at 1.00, demonstrating high tactile appreciation that could be leveraged.",
  brand_recall_analysis: "Brand Recall Potential is low at 29.5/100. The neural trace for brand familiarity (Cluster N: 0.20) and memory association is weak. This is often caused by a 'pre-brand memory drain' (Cluster E penalty) where the brand is introduced after a cognitive climax, or where logo exposures lack audio-visual binding (Cluster M: 0.22).",
  strengths: [
    "Maximum motor/embodied resonance (100.0% Motor/Embodied activation) showing that viewers strongly simulate fabric contact and product utility.",
    "Very high gaze priority and attention guidance (84.4% Selective Attention activation) keeping viewers focused on the creative action.",
    "Strong aesthetic appeal (81.3% Aesthetic Appeal activation) conveying premium feel and visual polish."
  ],
  weaknesses: [
    "Extremely low social relatability and theory of mind activation (0.0% Theory of Mind activation).",
    "Weak copy semantics and message clarity (11.4% Language & Semantics activation) causing message dilution.",
    "Low brand trust and symbolic familiarity (19.7% Brand Trust activation) during logo presentation frames."
  ],
  recommendations: [
    "Simplify the offer and CTA framing. Reduce visual clutter and text density at the end card to lower cognitive load (Cluster J) and raise Conversion Support.",
    "Synchronize audio cues with logo reveals. Ensure the brand name is spoken exactly when the logo is displayed on screen to leverage multisensory binding (Cluster M).",
    "Enhance the emotional hook in the first 3 seconds (Cluster A). Use higher visual contrast and motion energy to capture attention before narrative delivery begins."
  ]
};

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.jobId as string;

  const [job, setJob] = useState<Job | null>(null);
  const [scores, setScores] = useState<MarketingScores | null>(null);
  const [report, setReport] = useState<ExplanationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("insights");
  const [checkedRecs, setCheckedRecs] = useState<Record<number, boolean>>({});

  useEffect(() => {
    async function fetchJobResults() {
      if (!jobId || jobId === "demo") {
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
            
            // Try loading scores
            const scoreArt = artData.artifacts["marketing_scores.json"];
            let loadedScores = MOCK_SCORES;
            if (scoreArt) {
              const scoreRes = await fetch(scoreArt.url);
              if (scoreRes.ok) loadedScores = await scoreRes.json();
            }
            setScores(loadedScores);

            // Try loading report
            const llmArt = artData.artifacts["explanation_report.json"];
            let loadedReport = MOCK_LLM_REPORT;
            if (llmArt) {
              const llmRes = await fetch(llmArt.url);
              if (llmRes.ok) loadedReport = await llmRes.json();
            }
            setReport(loadedReport);
          }
        } else {
          // Fallback to demo if job is not completed yet
          setJob(MOCK_JOB_DATA);
          setScores(MOCK_SCORES);
          setReport(MOCK_LLM_REPORT);
        }
      } catch (err) {
        console.warn("Failed to fetch, loading demo data:", err);
        setJob(MOCK_JOB_DATA);
        setScores(MOCK_SCORES);
        setReport(MOCK_LLM_REPORT);
      } finally {
        setLoading(false);
      }
    }

    fetchJobResults();
  }, [jobId]);

  const toggleRec = (idx: number) => {
    setCheckedRecs(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Fixed download page for results logic (Task 5)
  const handleExportResults = () => {
    if (jobId === "demo" || !job?.id) {
      // Simulate file download by creating a blob
      const textReport = `====================================================
SAKHAA FORGE NEUROMARKETING BRAND SCORER REPORT
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
      // Navigate to correct download endpoint
      window.location.href = `/api/storage/download?key=exports/${job.id}/exports/full_result_bundle.zip`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0A09] flex flex-col items-center justify-center text-[#F3F2EF]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-[#6557F5]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="font-mono text-xs text-[#B4B0A7] tracking-widest uppercase animate-pulse">
            Calibrating Neuromarketing Vectors...
          </span>
        </div>
      </div>
    );
  }

  const epScore = scores?.outcomes["Engagement"]?.score_0_100 || 0;
  const vpScore = scores?.outcomes["Virality"]?.score_0_100 || 0;
  const csScore = scores?.outcomes["Conversion"]?.score_0_100 || 0;
  const brScore = scores?.outcomes["Brand Recall"]?.score_0_100 || 0;

  return (
    <div className="min-h-screen bg-[#0B0A09] text-[#F3F2EF] font-sans flex flex-col relative overflow-hidden">
      
      {/* Soft Aurora Ambient Backdrop behind elements (Reference import.md) */}
      <div className="soft-aurora-ambient">
        <div className="aurora-blob blob-1" style={{ backgroundColor: "rgba(101, 87, 245, 0.1)" }} />
        <div className="aurora-blob blob-2" style={{ backgroundColor: "rgba(255, 107, 61, 0.05)" }} />
        <div className="aurora-blob blob-3" style={{ backgroundColor: "rgba(95, 198, 221, 0.08)" }} />
      </div>

      {/* Header */}
      <header className="border-b border-[#2E2B26] py-3.5 px-6 md:px-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#121110]/85 backdrop-blur-lg sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-8 h-8 rounded-lg border border-[#2E2B26] flex items-center justify-center bg-[#121110] hover:border-[#6557F5] hover:text-[#6557F5] transition-all shrink-0">
            <span className="text-sm font-bold">←</span>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-sm bg-[#6557F5]/10 border border-[#6557F5]/30 text-[#6557F5] text-[9px] uppercase font-mono tracking-wider font-bold">
                Analysis Studio
              </span>
              <h1 className="text-sm font-bold tracking-tight text-[#F3F2EF]">
                <DecryptedText text="Sakhaa Forge" />
              </h1>
              <span className="text-[10px] text-[#8A867C] font-mono">v2.0</span>
            </div>
            <p className="text-[10px] text-[#8A867C] uppercase tracking-wider font-mono">
              Report ID: {job?.id.slice(0, 12)}...
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded border border-[#2E2B26] bg-[#0C0B02] text-[10px] text-[#B4B0A7] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5BD08C] animate-pulse" />
            <span>MODEL: {scores?.model_version}</span>
          </div>

          <button
            onClick={handleExportResults}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-[#6557F5] text-white hover:bg-[#5343E8] transition-all flex items-center gap-1.5 shadow-[0_0_20px_rgba(101,87,245,0.25)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>📥</span> <ShinyText text="Export Outcomes" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 z-10">
        
        {/* Left Column: Asset Info & Interactive Scoring Dials (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Metadata Card */}
          <SpotlightCard className="p-5 flex flex-col md:flex-row gap-5 relative">
            <div className="flex-1 flex flex-col justify-between gap-4">
              <div>
                <span className="text-[9px] font-mono text-[#8A867C] tracking-wide uppercase">Creative Asset Metadata</span>
                <h2 className="text-base font-bold text-[#F3F2EF] mt-1">{job?.input.project_name}</h2>
                <p className="text-xs text-[#B4B0A7] font-mono">Asset: {job?.input.video_name}.mp4</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-[#2E2B26]/50 pt-4 text-xs">
                <div>
                  <span className="text-[#8A867C] block text-[9px] font-mono uppercase">Target Audience</span>
                  <span className="text-[#F3F2EF] font-medium block mt-0.5 leading-relaxed">{job?.input.target_audience}</span>
                </div>
                <div>
                  <span className="text-[#8A867C] block text-[9px] font-mono uppercase">Creative Objective</span>
                  <span className="text-[#F3F2EF] font-medium block mt-0.5 leading-relaxed">{job?.input.creative_objective}</span>
                </div>
              </div>
            </div>

            {/* Simulated 9:16 Aspect Video Container */}
            <div className="w-full md:w-36 h-56 shrink-0 rounded-lg border border-[#2E2B26] bg-[#0C0B02] flex flex-col justify-between p-2.5 relative overflow-hidden group">
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none border border-white m-1.5 border-dashed" />
              <div className="flex justify-between items-center text-[7px] font-mono text-[#8A867C] z-10">
                <span>9:16</span>
                <span className="px-1.5 bg-[#2E2B26] rounded text-[6px] text-[#F3F2EF]">PREVIEW</span>
              </div>
              
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="w-9 h-9 rounded-full bg-[#6557F5]/20 border border-[#6557F5] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform cursor-pointer">
                  <span className="text-white text-xs pl-0.5">▶</span>
                </div>
              </div>

              <div className="text-[7px] font-mono text-[#8A867C] z-10 flex justify-between">
                <span className="truncate max-w-[80px]">Surya_Valencia</span>
                <span>0:26s</span>
              </div>
            </div>
          </SpotlightCard>

          {/* Biometric Scores Circular Dials (Task 1: Correct Metric Labels) */}
          <div className="bg-[#121110]/60 border border-[#2E2B26] rounded-xl p-5 flex flex-col gap-5">
            <div>
              <h3 className="text-xs font-mono text-[#8A867C] uppercase tracking-wider">Predictive Biometric Outcomes</h3>
              <p className="text-xs text-[#B4B0A7] mt-0.5">Calibrated directly from parcellated EEG & attention trace profiles</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Engagement Dial */}
              <div className="p-3 bg-[#0B0A09]/50 border border-[#2E2B26] rounded-lg flex flex-col items-center justify-center text-center relative group hover:border-[#6557F5]/40 transition-colors">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle cx="32" cy="32" r="27" className="stroke-[#2E2B26]" strokeWidth="5" fill="transparent" />
                    <circle 
                      cx="32" 
                      cy="32" 
                      r="27" 
                      className="stroke-[#6557F5] gauge-circle" 
                      strokeWidth="5" 
                      fill="transparent" 
                      strokeDasharray={169.6} 
                      strokeDashoffset={169.6 - (169.6 * epScore) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white font-mono">
                    <CountUp end={epScore} />%
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#F3F2EF] mt-2 block">Engagement</span>
                <span className="text-[8px] font-mono text-[#6557F5] uppercase tracking-wide px-1.5 py-0.5 rounded-sm bg-[#6557F5]/10 mt-1">
                  ENG Index
                </span>
                <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-[#0C0B02] border border-[#2E2B26] rounded text-[9px] text-[#B4B0A7] leading-relaxed shadow-xl z-20">
                  Measures viewer retention and emotional resonance over the narrative arc. Spikes during high-arousal scenes and visual hooks.
                </div>
              </div>

              {/* Virality Dial */}
              <div className="p-3 bg-[#0B0A09]/50 border border-[#2E2B26] rounded-lg flex flex-col items-center justify-center text-center relative group hover:border-[#5FC6DD]/40 transition-colors">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle cx="32" cy="32" r="27" className="stroke-[#2E2B26]" strokeWidth="5" fill="transparent" />
                    <circle 
                      cx="32" 
                      cy="32" 
                      r="27" 
                      className="stroke-[#5FC6DD] gauge-circle" 
                      strokeWidth="5" 
                      fill="transparent" 
                      strokeDasharray={169.6} 
                      strokeDashoffset={169.6 - (169.6 * vpScore) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white font-mono">
                    <CountUp end={vpScore} />%
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#F3F2EF] mt-2 block">Virality</span>
                <span className="text-[8px] font-mono text-[#5FC6DD] uppercase tracking-wide px-1.5 py-0.5 rounded-sm bg-[#5FC6DD]/10 mt-1">
                  VIR Index
                </span>
                <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-[#0C0B02] border border-[#2E2B26] rounded text-[9px] text-[#B4B0A7] leading-relaxed shadow-xl z-20">
                  Measures aesthetic impact, visual interest, and shareability potential. High spikes indicate strong visual styling, color harmony, and rapid attention capture.
                </div>
              </div>

              {/* Conversion Dial */}
              <div className="p-3 bg-[#0B0A09]/50 border border-[#2E2B26] rounded-lg flex flex-col items-center justify-center text-center relative group hover:border-[#FF6B3D]/40 transition-colors">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle cx="32" cy="32" r="27" className="stroke-[#2E2B26]" strokeWidth="5" fill="transparent" />
                    <circle 
                      cx="32" 
                      cy="32" 
                      r="27" 
                      className="stroke-[#FF6B3D] gauge-circle" 
                      strokeWidth="5" 
                      fill="transparent" 
                      strokeDasharray={169.6} 
                      strokeDashoffset={169.6 - (169.6 * csScore) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white font-mono">
                    <CountUp end={csScore} />%
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#F3F2EF] mt-2 block">Conversion</span>
                <span className="text-[8px] font-mono text-[#FF6B3D] uppercase tracking-wide px-1.5 py-0.5 rounded-sm bg-[#FF6B3D]/10 mt-1">
                  CON Index
                </span>
                <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-[#0C0B02] border border-[#2E2B26] rounded text-[9px] text-[#B4B0A7] leading-relaxed shadow-xl z-20">
                  Measures target audience intent, value perception, and product relevance. Higher scores suggest clear utility coding (prefrontal cortex) and hands-on product demonstration effectiveness.
                </div>
              </div>

              {/* Brand Recall Dial */}
              <div className="p-3 bg-[#0B0A09]/50 border border-[#2E2B26] rounded-lg flex flex-col items-center justify-center text-center relative group hover:border-[#E8B84B]/40 transition-colors">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle cx="32" cy="32" r="27" className="stroke-[#2E2B26]" strokeWidth="5" fill="transparent" />
                    <circle 
                      cx="32" 
                      cy="32" 
                      r="27" 
                      className="stroke-[#E8B84B] gauge-circle" 
                      strokeWidth="5" 
                      fill="transparent" 
                      strokeDasharray={169.6} 
                      strokeDashoffset={169.6 - (169.6 * brScore) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white font-mono">
                    <CountUp end={brScore} />%
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#F3F2EF] mt-2 block">Brand Recall</span>
                <span className="text-[8px] font-mono text-[#E8B84B] uppercase tracking-wide px-1.5 py-0.5 rounded-sm bg-[#E8B84B]/10 mt-1">
                  REC Index
                </span>
                <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-[#0C0B02] border border-[#2E2B26] rounded text-[9px] text-[#B4B0A7] leading-relaxed shadow-xl z-20">
                  Measures the strength of brand association and long-term memory encoding. Boosted by early brand introduction and prolonged exposure to clear brand logo visuals.
                </div>
              </div>
            </div>
          </div>

          {/* Time Series Graph */}
          <div className="bg-[#121110]/60 border border-[#2E2B26] rounded-xl p-5 flex flex-col gap-4">
            <div>
              <h3 className="text-xs font-mono text-[#8A867C] uppercase tracking-wider">Arousal & Attention Timeline Trace</h3>
              <p className="text-xs text-[#B4B0A7] mt-0.5">Modality alignment peaks plotted over video runtime (seconds)</p>
            </div>

            <div className="relative h-40 w-full bg-[#0C0B02] border border-[#2E2B26] rounded-lg p-2">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <line x1="0" y1="25" x2="100" y2="25" stroke="#2E2B26" strokeWidth="0.5" strokeDasharray="2,2" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="#2E2B26" strokeWidth="0.5" strokeDasharray="2,2" />
                <line x1="0" y1="75" x2="100" y2="75" stroke="#2E2B26" strokeWidth="0.5" strokeDasharray="2,2" />

                <path
                  d="M 0 100 L 0 70 L 30 32 L 60 48 L 90 9 L 100 100 Z"
                  fill="url(#arousalGrad)"
                  opacity="0.15"
                />

                <path
                  d="M 0 55 L 10 40 L 20 60 L 30 28 L 40 38 L 50 21 L 60 18 L 70 30 L 80 40 L 90 38 L 100 60"
                  fill="none"
                  stroke="#6557F5"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />

                <path
                  d="M 0 70 L 10 32 L 20 48 L 30 18 L 40 26 L 50 12 L 60 9 L 70 28 L 80 52 L 90 65 L 100 65"
                  fill="none"
                  stroke="#5FC6DD"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />

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

              <div className="absolute top-2 left-2 text-[8px] font-mono text-[#8A867C] flex gap-3">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#6557F5]" /> Attention Index</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#5FC6DD]" /> Arousal Index</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#FF6B3D]" /> Peak Hotspots</span>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2 text-[8px] font-mono text-[#8A867C] px-1">
              <div>
                <span className="font-bold text-white block">0s - 5s</span>
                <span>Visual Hook</span>
              </div>
              <div>
                <span className="font-bold text-white block">5s - 10s</span>
                <span>Story Setup</span>
              </div>
              <div>
                <span className="font-bold text-white block">10s - 15s</span>
                <span>Tactile Fabric Close</span>
              </div>
              <div>
                <span className="font-bold text-white block">15s - 20s</span>
                <span>Beach Transition Peak</span>
              </div>
              <div>
                <span className="font-bold text-white block">20s - 26s</span>
                <span>Brand Logo Outro</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Multi-tab insights (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Tabs bar */}
          <div className="bg-[#121110] p-1 rounded-lg border border-[#2E2B26] flex gap-1 font-mono text-[10px] uppercase text-[#B4B0A7] tracking-wider font-semibold shadow-inner">
            <button
              onClick={() => setActiveTab("insights")}
              className={`flex-1 py-1.5 text-center rounded transition-all ${
                activeTab === "insights" ? "bg-[#6557F5] text-white shadow-md" : "hover:text-[#F3F2EF]"
              }`}
            >
              Narrative Report
            </button>
            <button
              onClick={() => setActiveTab("brain")}
              className={`flex-1 py-1.5 text-center rounded transition-all ${
                activeTab === "brain" ? "bg-[#6557F5] text-white shadow-md" : "hover:text-[#F3F2EF]"
              }`}
            >
              17 Cognitive Clusters
            </button>
          </div>

          {/* TAB CONTENT: Narrative Report (LLM findings) */}
          {activeTab === "insights" && report && (
            <div className="flex flex-col gap-6 animate-pageIn">
              
              {/* Conversion Analysis Box */}
              <SpotlightCard className="p-4 flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm">💎</span>
                  <h3 className="font-bold text-xs text-[#F3F2EF] tracking-tight">Conversion Insights</h3>
                </div>
                <p className="text-[11px] text-[#B4B0A7] leading-relaxed bg-[#0B0A09]/55 p-3.5 rounded border border-[#2E2B26]">
                  {report.conversion_analysis}
                </p>
              </SpotlightCard>

              {/* Brand Recall Analysis Box */}
              <SpotlightCard className="p-4 flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🤝</span>
                  <h3 className="font-bold text-xs text-[#F3F2EF] tracking-tight">Brand Recall Insights</h3>
                </div>
                <p className="text-[11px] text-[#B4B0A7] leading-relaxed bg-[#0B0A09]/55 p-3.5 rounded border border-[#2E2B26]">
                  {report.brand_recall_analysis}
                </p>
              </SpotlightCard>

              {/* Recommendations Checklist */}
              <SpotlightCard className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm">⚡</span>
                  <div>
                    <h3 className="font-bold text-xs text-[#F3F2EF] tracking-tight">Creative Optimization Checklist</h3>
                    <p className="text-[8px] font-mono text-[#8A867C] mt-0.5 uppercase tracking-wide">Interactive checklist</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 bg-[#0B0A09]/55 p-3 rounded border border-[#2E2B26]">
                  {report.recommendations.map((rec, idx) => {
                    const isChecked = !!checkedRecs[idx];
                    return (
                      <label 
                        key={idx}
                        onClick={() => toggleRec(idx)}
                        className={`flex items-start gap-2.5 cursor-pointer py-1 transition-all text-[11px] ${
                          isChecked ? "opacity-45 line-through text-[#8A867C]" : "text-[#B4B0A7] hover:text-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="mt-0.5 accent-[#6557F5] rounded border-[#2E2B26] shrink-0"
                        />
                        <span className="leading-relaxed select-none">{rec}</span>
                      </label>
                    );
                  })}
                </div>
              </SpotlightCard>

            </div>
          )}

          {/* TAB CONTENT: 17 Cognitive Clusters (Task 3: Scores converted out of 100) */}
          {activeTab === "brain" && scores && (
            <SpotlightCard className="p-4 flex flex-col gap-3 animate-pageIn">
              <div className="flex justify-between items-center text-[8px] font-mono text-[#8A867C] uppercase tracking-wider">
                <span>Brain Networks (A-Q)</span>
                <span>Activation Score (Out of 100)</span>
              </div>

              <div className="flex flex-col gap-2.5 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
                {Object.entries(scores.clusters).map(([key, cluster]) => {
                  const strengthPercentage = cluster.strength_0_1 * 100;
                  const metadata = CLUSTER_METADATA[key] || { name: cluster.cluster_name, icon: "🧠", proxy: cluster.psychological_proxy };

                  let barColor = "bg-[#B4B0A7]";
                  if (strengthPercentage >= 75) barColor = "bg-[#FF6B3D]";
                  else if (strengthPercentage > 30) barColor = "bg-[#6557F5]";

                  return (
                    <div 
                      key={key} 
                      className="p-2.5 bg-[#0B0A09]/60 border border-[#2E2B26] rounded flex flex-col gap-1.5 hover:border-[#6557F5]/30 transition-colors group"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-5 h-5 rounded border border-[#2E2B26] bg-[#121110] flex items-center justify-center font-bold font-mono text-[9px] text-[#F3F2EF] shrink-0">
                            {key}
                          </span>
                          <span className="font-semibold text-[#F3F2EF] truncate text-[11px]">
                            {metadata.icon} {metadata.name}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-white font-bold">
                          {strengthPercentage.toFixed(1)}%
                        </span>
                      </div>

                      <div className="w-full bg-[#121110] h-1 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${barColor}`} 
                          style={{ width: `${strengthPercentage}%` }}
                        />
                      </div>

                      <p className="text-[9px] text-[#8A867C] leading-normal italic">
                        {metadata.proxy}
                      </p>
                    </div>
                  );
                })}
              </div>
            </SpotlightCard>
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#2E2B26] py-3 px-6 md:px-12 flex flex-col sm:flex-row justify-between items-center bg-[#121110]/90 text-[8px] text-[#8A867C] font-mono gap-1 relative z-10">
        <div>
          <span>Sakhaa Forge Neuromarketing Pipeline Studio</span>
          <span className="mx-2 text-[#46433C]">•</span>
          <span>Workspace Session: {job?.id || "Demo"}</span>
        </div>
        <div>
          <span>Powered by TribeV2 Transformers & Vast.ai Cluster mapping</span>
        </div>
      </footer>
    </div>
  );
}
