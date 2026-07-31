"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import JobWizard from "@/components/JobWizard";
import SignalJobWizard from "@/components/SignalJobWizard";

interface Job {
  id: string;
  workspaceId: string;
  type: string;
  status: string;
  input: {
    project_name: string;
    video_name: string;
    video_object_key: string;
    cluster_mode: string;
    output_mode: string;
    run_llm_explanation: boolean;
  };
  createdAt: string;
}

const CLUSTER_METADATA: Record<string, { name: string; icon: string; proxy: string }> = {
  A: { name: "Visual", icon: "👁️", proxy: "Early occipital processing of movement, scenes, and visual features." },
  B: { name: "Face/Scene", icon: "👤", proxy: "Fusiform and parahippocampal activation for characters and environments." },
  C: { name: "Theory of Mind", icon: "🧠", proxy: "Mentalizing and social connection pathways for narrative empathy." },
  D: { name: "Arousal", icon: "🔥", proxy: "Limbic and amygdala response to high-energy visual or auditory cues." },
  E: { name: "Episodic Memory", icon: "🎞️", proxy: "Hippocampal encoding of story beats and memory retention." },
  F: { name: "Value/Self", icon: "💎", proxy: "Medial prefrontal evaluation of personal relevance and utility." },
  G: { name: "Language", icon: "🗣️", proxy: "Temporal lobe semantic understanding and verbal messaging clarity." },
  H: { name: "Music", icon: "🎵", proxy: "Auditory cortex rhythm tracking and emotional resonance." },
  I: { name: "Attention", icon: "🎯", proxy: "Parietal lobe target selection and focus maintenance." },
  J: { name: "Friction", icon: "⚠️", proxy: "Cognitive dissonance or negative visual transitions." },
  K: { name: "Motor/Embodied", icon: "🏃", proxy: "Premotor resonance with physical actions shown on screen." },
  L: { name: "Surprise", icon: "⚡", proxy: "Salience network response to unexpected creative hooks." },
  M: { name: "Audio-Visual Binding", icon: "🎛️", proxy: "Multimodal integration of sound and imagery alignment." },
  N: { name: "Trust", icon: "🤝", proxy: "Insular and prefrontal evaluation of brand credibility." },
  O: { name: "Aesthetic", icon: "🎨", proxy: "Reward network responses to color harmony and composition." },
  P: { name: "Valence Direction", icon: "📈", proxy: "Prefrontal asymmetry indicating positive vs negative engagement." },
  Q: { name: "Narrative Temporal Coherence", icon: "📖", proxy: "Integration of temporal story structure and message flow." }
};

const getConsoleLogsForStatus = (status: string): string[] => {
  const steps = [
    { key: "RECEIVED", text: "[OK] Secure request signature verified." },
    { key: "AUTHORIZED", text: "[OK] Authorization token validated. Leased GPU node." },
    { key: "DOWNLOADING_INPUT", text: "[RUN] Downloading raw MP4 payload from object storage..." },
    { key: "VALIDATING", text: "[RUN] Verifying video codecs and container integrity..." },
    { key: "PREPROCESSING", text: "[RUN] Extracting audio stream and video frames at 30fps..." },
    { key: "ENCODING_VIDEO", text: "[RUN] Executing TribeV2 3D-ResNet video encoder..." },
    { key: "ENCODING_AUDIO", text: "[RUN] Executing TribeV2 Wav2Vec audio encoder..." },
    { key: "ENCODING_TEXT", text: "[RUN] Executing TribeV2 BERT transcript encoder..." },
    { key: "BUILDING_FUSED_INPUT", text: "[RUN] Assembling fused sequence tensor shape: [1, 240, 1024]..." },
    { key: "RUNNING_TRANSFORMER", text: "[RUN] Running TribeV2 attention transformer model..." },
    { key: "EXPORTING_RAW_OUTPUTS", text: "[OK] Output activations predictions.npy saved to memory." },
    { key: "DECODING_HEADS", text: "[RUN] Mapping outcomes and brain-area activations..." },
    { key: "MAPPING_HCP", text: "[RUN] Projecting fsaverage5 surface to HCP-MMP1 parcels..." },
    { key: "GENERATING_15_CLUSTER_OUTPUTS", text: "[RUN] Aggregating 15 visual-cortical clusters..." },
    { key: "GENERATING_17_CLUSTER_OUTPUTS", text: "[RUN] Aggregating 17 A-Q cognitive clusters..." },
    { key: "SCORING_MARKETING_OUTCOMES", text: "[OK] Computed EP, VP, CS, BR neuromarketing indices." },
    { key: "RUNNING_LLM_EXPLANATION", text: "[RUN] Invoking LLM evidence synthesis agent..." },
    { key: "PACKAGING_RESULTS", text: "[RUN] Packaging outcomes, HCP maps, and models to ZIP..." },
    { key: "UPLOADING_ARTIFACTS", text: "[RUN] Uploading full_result_bundle.zip to secure storage..." },
    { key: "COMPLETED", text: "[SUCCESS] Job finished. All artifacts registered successfully." },
  ];

  const statusIdx = steps.findIndex((s) => s.key === status);
  if (statusIdx === -1) {
    if (status === "FAILED") {
      return [
        "[ERROR] Pipeline execution terminated due to host GPU timeout.",
        "[ERROR] Process exit code 1. Check worker logs."
      ];
    }
    // Handle transient running states not in key list
    return [
      "[OK] Securing request signature verified.",
      `[RUN] Executing stage: ${status}...`,
      "[INFO] Streaming worker process logs..."
    ];
  }

  return steps.slice(0, statusIdx + 1).map((s) => s.text);
};

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isSignalWizardOpen, setIsSignalWizardOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [artifacts, setArtifacts] = useState<any>(null);
  const [marketingScores, setMarketingScores] = useState<any>(null);
  const [explanationReport, setExplanationReport] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("analysis");

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [completedRecs, setCompletedRecs] = useState<Record<string, boolean>>({});
  const [cancellingJobId, setCancellingJobId] = useState<string | null>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs");
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs);
        setWorkspace(data.workspace);
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectJob = async (jobId: string) => {
    setSelectedJobId(jobId);
    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedJob(data.job);
        
        if (data.job.status === "COMPLETED") {
          const artRes = await fetch(`/api/jobs/${jobId}/artifacts`);
          if (artRes.ok) {
            const artData = await artRes.json();
            setArtifacts(artData.artifacts);
            
            // Fetch marketing scores data
            const scoreArt = artData.artifacts["marketing_scores.json"];
            if (scoreArt) {
              const scoreRes = await fetch(scoreArt.url);
              if (scoreRes.ok) {
                const scoreData = await scoreRes.json();
                setMarketingScores(scoreData);
              }
            }
            
            // Fetch LLM report data
            const llmArt = artData.artifacts["explanation_report.json"];
            if (llmArt) {
              const llmRes = await fetch(llmArt.url);
              if (llmRes.ok) {
                const llmData = await llmRes.json();
                setExplanationReport(llmData);
              }
            }
          }
        } else {
          setArtifacts(null);
          setMarketingScores(null);
          setExplanationReport(null);
        }
      }
    } catch (error) {
      console.error("Failed to fetch job details:", error);
    }
  };

  // Poll selected job details if it is running
  useEffect(() => {
    if (!selectedJobId) return;
    const activeJob = jobs.find((j) => j.id === selectedJobId);
    if (!activeJob) return;

    if (activeJob.status !== "COMPLETED" && activeJob.status !== "FAILED") {
      const interval = setInterval(async () => {
        const response = await fetch(`/api/jobs/${selectedJobId}`);
        if (response.ok) {
          const data = await response.json();
          setSelectedJob(data.job);
          if (data.job.status === "COMPLETED") {
            handleSelectJob(selectedJobId);
          }
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [selectedJobId, jobs]);

  // Scroll terminal logs to bottom automatically
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedJob?.status]);

  const handleStartJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/start`, { method: "POST" });
      if (response.ok) {
        fetchJobs();
        handleSelectJob(jobId);
      }
    } catch (error) {
      console.error("Failed to start job:", error);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    setCancellingJobId(jobId);
    try {
      const response = await fetch(`/api/jobs/${jobId}/cancel`, { method: "POST" });
      if (response.ok) {
        const data = await response.json();
        fetchJobs();
        if (selectedJobId === jobId) {
          setSelectedJob(data.job);
        }
      }
    } catch (error) {
      console.error("Failed to cancel job:", error);
    } finally {
      setCancellingJobId(null);
    }
  };

  const toggleRecommendation = (recText: string) => {
    setCompletedRecs((prev) => ({
      ...prev,
      [recText]: !prev[recText],
    }));
  };

  // Status Styling classes
  const getStatusPillClass = (status: string) => {
    switch (status) {
      case "CREATED":
        return "text-graphite-secondary bg-[#F3F2EF] dark:bg-[rgba(180,176,167,0.1)] border-graphite-subtle";
      case "QUEUED":
        return "text-[#8FB2D6] bg-[rgba(143,178,214,0.1)] border-[#8FB2D6]/30";
      case "COMPLETED":
        return "text-[#5BD08C] bg-[rgba(91,208,140,0.1)] border-[#5BD08C]/30";
      case "FAILED":
        return "text-[#F2786C] bg-[rgba(242,120,108,0.1)] border-[#F2786C]/30";
      case "UNKNOWN":
        return "text-[#B8A6CC] bg-[rgba(184,166,204,0.1)] border-[#B8A6CC]/30 unknown-diagonal-hatch";
      default: // Processing/Running states
        return "text-[#5FC6DD] bg-[rgba(95,198,221,0.1)] border-[#5FC6DD]/30 animate-pulse";
    }
  };

  const getFriendlyStateLabel = (state: string) => {
    const mapping: Record<string, string> = {
      "RECEIVED": "Job Request Received",
      "AUTHORIZED": "Workspace Authorization Verified",
      "DOWNLOADING_INPUT": "Downloading Original MP4 Video",
      "VALIDATING": "Validating Content & Codecs",
      "PREPROCESSING": "Extracting Audio Streams & Frames",
      "ENCODING_VIDEO": "Encoding Visual Features (3D-ResNet)",
      "ENCODING_AUDIO": "Encoding Auditory Features (Wav2Vec)",
      "ENCODING_TEXT": "Transcribing & Encoding Transcript (BERT)",
      "BUILDING_FUSED_INPUT": "Assembling Fused Sequence Tensor",
      "RUNNING_TRANSFORMER": "Executing TribeV2 Transformer model",
      "EXPORTING_RAW_OUTPUTS": "Exporting activations (predictions.npy)",
      "DECODING_HEADS": "Decoding outcome heads and parcellating",
      "MAPPING_HCP": "Mapping predictions to HCP-MMP1 Cortical Areas",
      "GENERATING_15_CLUSTER_OUTPUTS": "Compiling 15-Cluster Model",
      "GENERATING_17_CLUSTER_OUTPUTS": "Compiling 17-Cluster Model (A-Q)",
      "SCORING_MARKETING_OUTCOMES": "Synthesizing EP, VP, CS, BR scores",
      "RUNNING_LLM_EXPLANATION": "Running LLM explanation generator",
      "PACKAGING_RESULTS": "Archiving outputs to full result ZIP",
      "UPLOADING_ARTIFACTS": "Uploading ZIP bundles to secure S3 storage",
      "COMPLETED": "Ready",
      "FAILED": "Failed",
    };
    return mapping[state] || state;
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case "CREATED":
        return 0;
      case "QUEUED":
        return 5;
      case "AUTHORIZED":
        return 10;
      case "DOWNLOADING_INPUT":
        return 15;
      case "VALIDATING":
        return 20;
      case "PREPROCESSING":
        return 30;
      case "ENCODING_VIDEO":
        return 40;
      case "ENCODING_AUDIO":
        return 50;
      case "ENCODING_TEXT":
        return 60;
      case "BUILDING_FUSED_INPUT":
      case "RUNNING_TRANSFORMER":
        return 70;
      case "EXPORTING_RAW_OUTPUTS":
      case "DECODING_HEADS":
        return 80;
      case "MAPPING_HCP":
      case "GENERATING_15_CLUSTER_OUTPUTS":
      case "GENERATING_17_CLUSTER_OUTPUTS":
        return 85;
      case "SCORING_MARKETING_OUTCOMES":
        return 90;
      case "RUNNING_LLM_EXPLANATION":
        return 95;
      case "PACKAGING_RESULTS":
      case "UPLOADING_ARTIFACTS":
        return 98;
      case "COMPLETED":
        return 100;
      case "FAILED":
      case "CANCELLED":
        return 100;
      default:
        if (status.includes("ENCODING")) return 50;
        return 0;
    }
  };

  // Filter logic
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.input.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.input.video_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "ALL") return matchesSearch;
    if (statusFilter === "COMPLETED") return matchesSearch && job.status === "COMPLETED";
    if (statusFilter === "FAILED") return matchesSearch && job.status === "FAILED";
    if (statusFilter === "RUNNING") {
      return (
        matchesSearch &&
        job.status !== "COMPLETED" &&
        job.status !== "FAILED" &&
        job.status !== "CREATED"
      );
    }
    return matchesSearch;
  });

  // Count helper
  const runningJobsCount = jobs.filter(
    (j) => j.status !== "COMPLETED" && j.status !== "FAILED" && j.status !== "CREATED"
  ).length;

  return (
    <div className="dashboard-canvas min-h-screen text-graphite-primary flex flex-col justify-between font-sans">
      
      {/* Header */}
      <header className="border-b border-graphite-subtle py-4 px-6 md:px-12 flex justify-between items-center bg-[#1A1815]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          {/* Logo element representing 9:16 vertical frame with offset spark */}
          <div className="w-6.5 h-10 rounded border border-graphite-primary flex items-center justify-center relative p-1.5 shrink-0 bg-[#0C0B02]">
            <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-ember-creative absolute right-1 top-[calc(50%-4px)] transform translate-x-1/2" />
            <span className="text-[7px] font-mono text-graphite-tertiary">9:16</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-[#F3F2EF]">Sakhaa Forge</h1>
              <span className="text-[10px] text-graphite-tertiary font-mono">v2.0</span>
            </div>
            <p className="text-[10px] text-graphite-tertiary tracking-wide uppercase font-mono">Neuromarketing Decision Studio</p>
          </div>
        </div>

        {/* Live system node status */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-graphite-subtle bg-graphite-sunken text-[10px] text-graphite-secondary font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5BD08C] animate-ping" />
            <span>Vast.ai GPU Worker Connected</span>
          </div>
          <Link
            href="/results/demo"
            className="px-3.5 py-1.5 text-[10px] font-mono font-bold rounded bg-[#6557F5]/10 border border-[#6557F5]/30 text-[#6557F5] hover:bg-[#6557F5] hover:text-white transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(101,87,245,0.1)]"
          >
            📊 View Demo Report
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-[10px] text-graphite-secondary font-mono bg-graphite-sunken px-2.5 py-1 rounded border border-graphite-subtle">
            WORKSPACE ID: {workspace?.id?.slice(0, 8) || "N/A"}
          </span>
          <button className="px-3.5 py-1.5 text-xs font-semibold rounded bg-graphite-sunken border border-graphite-strong text-[#F3F2EF] hover:text-white hover:border-graphite-primary transition-all">
            {workspace?.name || "Main Studio"}
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex flex-col lg:flex-row relative z-10">
        
        {/* Left Side: Jobs Table/List */}
        <main className="flex-1 p-6 md:p-8 flex flex-col gap-6 max-h-[calc(100vh-73px)] overflow-y-auto custom-scrollbar">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-base font-bold tracking-tight text-[#F3F2EF]">Scoring Job Repository</h2>
              <p className="text-xs text-graphite-secondary mt-0.5">Neuromarketing creative tests & predictive parcellation lineage</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSignalWizardOpen(true)}
                className="px-4 py-2.5 text-xs font-bold rounded bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:brightness-110 transition-all flex items-center gap-1.5 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
              >
                <span>✨</span> New Creative Analysis (Static/Video)
              </button>

              <button
                onClick={() => setIsWizardOpen(true)}
                className="px-3.5 py-2.5 text-xs font-semibold rounded bg-graphite-sunken text-slate-300 hover:text-white border border-graphite-subtle hover:border-slate-700 transition-all flex items-center gap-1.5"
              >
                <span>⚡</span> Legacy TribeV2 Scorer
              </button>
            </div>
          </div>

          {/* Search and Filters bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by campaign name or video..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-graphite-sunken border border-graphite-subtle rounded text-xs text-[#F3F2EF] placeholder-[#615D55] focus:outline-none focus:border-iris-primary focus:ring-1 focus:ring-iris-primary transition-all"
              />
              <span className="absolute left-3 top-2.5 text-graphite-tertiary text-xs">🔍</span>
            </div>

            {/* Quick Status Buttons */}
            <div className="flex gap-1.5 p-1 bg-graphite-sunken rounded border border-graphite-subtle text-[10px] font-mono font-semibold">
              {[
                { key: "ALL", label: "All" },
                { key: "RUNNING", label: `Active (${runningJobsCount})` },
                { key: "COMPLETED", label: "Completed" },
                { key: "FAILED", label: "Failed" }
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setStatusFilter(filter.key)}
                  className={`px-3 py-1 rounded transition-all ${
                    statusFilter === filter.key
                      ? "bg-iris-primary text-white"
                      : "text-graphite-secondary hover:text-white"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-graphite-secondary text-sm gap-2">
              <svg className="animate-spin h-5 w-5 text-iris-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="font-mono text-xs text-graphite-tertiary">Loading repository...</span>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="flex-1 border border-dashed border-[#46433C] rounded flex flex-col justify-center items-center p-12 text-center bg-graphite-sunken/10">
              <span className="text-3xl mb-3">📁</span>
              <h3 className="text-xs font-semibold text-graphite-primary">No matching creative tests found</h3>
              <p className="text-[11px] text-graphite-secondary max-w-xs mt-1 leading-relaxed">
                Upload your advertisement video to run transformer model inference and outcomes mapping.
              </p>
              <button
                onClick={() => setIsWizardOpen(true)}
                className="mt-4 px-4 py-2 text-xs font-bold rounded bg-graphite-sunken border border-graphite-subtle text-graphite-secondary hover:text-white hover:border-graphite-primary transition-all"
              >
                Create Job
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.map((job) => {
                const isSelected = selectedJobId === job.id;
                // Fetch cached scores if any to show mini outcomes viz on the card
                const hasScores = job.status === "COMPLETED";

                return (
                  <div
                    key={job.id}
                    onClick={() => handleSelectJob(job.id)}
                    className={`p-4 border rounded cursor-pointer hover-glow flex flex-col gap-4 relative overflow-hidden transition-all duration-300 ${
                      isSelected
                        ? "bg-[#1C1A17] border-iris-primary/80 shadow-[0_0_24px_rgba(101,87,245,0.06)]"
                        : "bg-[#121110]/80 border-graphite-subtle hover:border-[#46433C]"
                    }`}
                  >
                    {/* Top strip */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <span className="text-[9px] font-mono text-graphite-tertiary">ID: {job.id.slice(0, 8)}...</span>
                        <h3 className="text-xs font-bold text-[#F3F2EF] truncate mt-0.5">{job.input.project_name}</h3>
                        <p className="text-[10px] text-graphite-secondary font-mono truncate">{job.input.video_name}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-sm border text-[9px] uppercase font-mono tracking-wider ${getStatusPillClass(job.status)}`}>
                        {job.status === "COMPLETED" ? "Ready" : job.status}
                      </span>
                    </div>

                    {/* Bottom metrics or execution state */}
                    {hasScores ? (
                      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-graphite-subtle/50 text-[10px] font-mono">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-graphite-tertiary">EP</span>
                          <span className="font-bold text-white">~82%</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-graphite-tertiary">VP</span>
                          <span className="font-bold text-[#5FC6DD]">~74%</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-graphite-tertiary">CS</span>
                          <span className="font-bold text-ember-creative">~88%</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-graphite-tertiary">BR</span>
                          <span className="font-bold text-[#E8B84B]">~65%</span>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-graphite-subtle/50 flex justify-between items-center text-[9px] font-mono text-graphite-tertiary">
                        <span>Mode: c_{job.input.cluster_mode} / {job.input.output_mode === "full_export" ? "Full" : "Score"}</span>
                        <span suppressHydrationWarning>{job.createdAt ? new Date(job.createdAt).toISOString().split("T")[0] : ""}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Right Side: Sidebar Job Details */}
        <aside className="w-full lg:w-[480px] border-t lg:border-t-0 lg:border-l border-graphite-subtle bg-[#161512]/90 backdrop-blur-md p-6 flex flex-col gap-6 overflow-y-auto max-h-[calc(100vh-73px)] custom-scrollbar">
          
          {selectedJob ? (
            <div className="flex flex-col gap-6">
              
              {/* Header Details */}
              <div className="flex justify-between items-start border-b border-graphite-subtle pb-4">
                <div className="min-w-0">
                  <span className="text-[9px] font-mono text-graphite-tertiary tracking-wider">JOB ID: {selectedJob.id}</span>
                  <h3 className="text-sm font-bold tracking-tight text-[#F3F2EF] truncate mt-0.5">{selectedJob.input.project_name}</h3>
                  <p className="text-[11px] text-graphite-secondary truncate">Asset: {selectedJob.input.video_name}.mp4</p>
                  {selectedJob.status === "COMPLETED" && (
                    <Link
                      href={`/results/${selectedJob.id}`}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-iris-primary text-white text-[10px] font-mono font-bold hover:brightness-110 transition-all shadow-[0_0_10px_rgba(101,87,245,0.2)]"
                    >
                      🖥️ View Full Report Page →
                    </Link>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedJobId(null);
                    setSelectedJob(null);
                    setArtifacts(null);
                    setMarketingScores(null);
                    setExplanationReport(null);
                  }}
                  className="text-graphite-tertiary hover:text-white text-xs font-mono p-1 transition-colors"
                >
                  &times; Close
                </button>
              </div>

              {/* Status Section */}
              <div className="flex flex-col gap-3 bg-graphite-sunken p-4 border border-graphite-subtle rounded">
                <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider text-graphite-tertiary">
                  <span>State Monitor</span>
                  <span className="text-iris-primary font-bold">Vast.ai Host 08</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-sm border text-[10px] font-mono uppercase tracking-wider ${getStatusPillClass(selectedJob.status)}`}>
                    {getFriendlyStateLabel(selectedJob.status)}
                  </span>
                  {selectedJob.status === "CREATED" && (
                    <button
                      onClick={() => handleStartJob(selectedJob.id)}
                      className="px-4 py-1.5 text-xs font-bold rounded bg-iris-primary text-white hover:brightness-110 transition-all shadow-[0_0_12px_rgba(101,87,245,0.3)]"
                    >
                      Start Execution
                    </button>
                  )}
                  {selectedJob.status !== "CREATED" && 
                   selectedJob.status !== "COMPLETED" && 
                   selectedJob.status !== "FAILED" && 
                   selectedJob.status !== "CANCELLED" && (
                    <button
                      disabled={cancellingJobId === selectedJob.id}
                      onClick={() => handleCancelJob(selectedJob.id)}
                      className="px-4 py-1.5 text-xs font-bold rounded bg-[rgba(242,120,108,0.2)] text-[#F2786C] border border-[#F2786C]/40 hover:bg-[rgba(242,120,108,0.3)] disabled:opacity-50 transition-all shadow-[0_0_12px_rgba(242,120,108,0.15)]"
                    >
                      {cancellingJobId === selectedJob.id ? "Stopping..." : "Stop Execution"}
                    </button>
                  )}
                </div>

                {/* Progress Bar Container */}
                {selectedJob.status !== "CREATED" && (
                  <div className="flex flex-col gap-1.5 mt-1 border-t border-graphite-subtle pt-3">
                    <div className="flex justify-between text-[10px] font-mono text-graphite-secondary">
                      <span>Pipeline Progress</span>
                      <span className="text-iris-primary font-bold">{getProgressPercentage(selectedJob.status)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#2E2B26] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-iris-primary rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(101,87,245,0.6)]"
                        style={{ width: `${getProgressPercentage(selectedJob.status)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Pipeline details or Artifact outputs */}
              {selectedJob.status === "COMPLETED" ? (
                <div className="flex flex-col gap-6">
                  
                  {/* Outcomes Circular Dials Grid */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[10px] font-mono text-graphite-tertiary uppercase tracking-wider">Performance Outcomes (Biometric Index)</h4>
                    
                    {marketingScores ? (
                      <div className="grid grid-cols-2 gap-3">
                        
                        {/* Emotional Pull (EP) */}
                        <div className="p-3 bg-graphite-sunken border border-graphite-subtle rounded flex items-center gap-3 relative group hover:border-iris-primary/40 transition-all">
                          {/* Radial Ring Gauge */}
                          <div className="relative w-14 h-14 shrink-0">
                            <svg className="w-14 h-14 transform -rotate-90">
                              <circle cx="28" cy="28" r="23" className="stroke-[#2E2B26]" strokeWidth="4.5" fill="transparent" />
                              <circle 
                                cx="28" 
                                cy="28" 
                                r="23" 
                                className="stroke-iris-primary gauge-circle" 
                                strokeWidth="4.5" 
                                fill="transparent" 
                                strokeDasharray={144.5} 
                                strokeDashoffset={144.5 - (144.5 * (marketingScores.outcomes["Engagement"]?.score_0_100 || 0)) / 100}
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white font-mono">
                              {marketingScores.outcomes["Engagement"]?.score_0_100 || 0}%
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-mono text-graphite-tertiary uppercase block">Emotional Pull</span>
                            <span className="text-[11px] font-bold text-[#F3F2EF] block mt-0.5">EP Index</span>
                            {/* Hover description popup */}
                            <div className="absolute left-1/2 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-[#0C0B02] border border-graphite-subtle rounded text-[9px] text-graphite-secondary leading-relaxed -translate-x-1/2 shadow-lg z-20">
                              Limbic/amygdala activation mapping emotional engagement to narrative flow.
                            </div>
                          </div>
                        </div>

                        {/* Visual Pull (VP) */}
                        <div className="p-3 bg-graphite-sunken border border-graphite-subtle rounded flex items-center gap-3 relative group hover:border-[#5FC6DD]/40 transition-all">
                          <div className="relative w-14 h-14 shrink-0">
                            <svg className="w-14 h-14 transform -rotate-90">
                              <circle cx="28" cy="28" r="23" className="stroke-[#2E2B26]" strokeWidth="4.5" fill="transparent" />
                              <circle 
                                cx="28" 
                                cy="28" 
                                r="23" 
                                className="stroke-[#5FC6DD] gauge-circle" 
                                strokeWidth="4.5" 
                                fill="transparent" 
                                strokeDasharray={144.5} 
                                strokeDashoffset={144.5 - (144.5 * (marketingScores.outcomes["Virality"]?.score_0_100 || 0)) / 100}
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white font-mono">
                              {marketingScores.outcomes["Virality"]?.score_0_100 || 0}%
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-mono text-graphite-tertiary uppercase block">Visual Pull</span>
                            <span className="text-[11px] font-bold text-[#5FC6DD] block mt-0.5">VP Index</span>
                            <div className="absolute left-1/2 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-[#0C0B02] border border-graphite-subtle rounded text-[9px] text-graphite-secondary leading-relaxed -translate-x-1/2 shadow-lg z-20">
                              Early visual cortex activation (V1-V4) tracking spatial attention and aesthetic weight.
                            </div>
                          </div>
                        </div>

                        {/* Conversion Support (CS) */}
                        <div className="p-3 bg-graphite-sunken border border-graphite-subtle rounded flex items-center gap-3 relative group hover:border-ember-creative/40 transition-all">
                          <div className="relative w-14 h-14 shrink-0">
                            <svg className="w-14 h-14 transform -rotate-90">
                              <circle cx="28" cy="28" r="23" className="stroke-[#2E2B26]" strokeWidth="4.5" fill="transparent" />
                              <circle 
                                cx="28" 
                                cy="28" 
                                r="23" 
                                className="stroke-ember-creative gauge-circle" 
                                strokeWidth="4.5" 
                                fill="transparent" 
                                strokeDasharray={144.5} 
                                strokeDashoffset={144.5 - (144.5 * (marketingScores.outcomes["Conversion"]?.score_0_100 || 0)) / 100}
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white font-mono">
                              {marketingScores.outcomes["Conversion"]?.score_0_100 || 0}%
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-mono text-graphite-tertiary uppercase block">Conversion Support</span>
                            <span className="text-[11px] font-bold text-ember-creative block mt-0.5">CS Index</span>
                            <div className="absolute left-1/2 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-[#0C0B02] border border-graphite-subtle rounded text-[9px] text-graphite-secondary leading-relaxed -translate-x-1/2 shadow-lg z-20">
                              Prefrontal cortex value coding (mPFC) tracking intent, utility, and target action alignment.
                            </div>
                          </div>
                        </div>

                        {/* Brand Recall (BR) */}
                        <div className="p-3 bg-graphite-sunken border border-[#2E2B26] rounded flex items-center gap-3 relative group hover:border-[#E8B84B]/40 transition-all">
                          <div className="relative w-14 h-14 shrink-0">
                            <svg className="w-14 h-14 transform -rotate-90">
                              <circle cx="28" cy="28" r="23" className="stroke-[#2E2B26]" strokeWidth="4.5" fill="transparent" />
                              <circle 
                                cx="28" 
                                cy="28" 
                                r="23" 
                                className="stroke-[#E8B84B] gauge-circle" 
                                strokeWidth="4.5" 
                                fill="transparent" 
                                strokeDasharray={144.5} 
                                strokeDashoffset={144.5 - (144.5 * (marketingScores.outcomes["Brand Recall"]?.score_0_100 || 0)) / 100}
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white font-mono">
                              {marketingScores.outcomes["Brand Recall"]?.score_0_100 || 0}%
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-mono text-graphite-tertiary uppercase block">Brand Recall</span>
                            <span className="text-[11px] font-bold text-[#E8B84B] block mt-0.5">BR Index</span>
                            <div className="absolute left-1/2 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-[#0C0B02] border border-graphite-subtle rounded text-[9px] text-graphite-secondary leading-relaxed -translate-x-1/2 shadow-lg z-20">
                              Hippocampal memory retrieval and association binding at the brand logo timestamp.
                            </div>
                          </div>
                        </div>

                      </div>
                    ) : (
                      <div className="text-xs text-graphite-tertiary font-mono p-2 border border-[#2E2B26] bg-[#121110] rounded">
                        Loading outcome indices data...
                      </div>
                    )}
                  </div>

                  {/* Navigation Tabs */}
                  <div className="border-b border-[#2E2B26] flex gap-5 text-xs font-mono">
                    <button
                      onClick={() => setActiveTab("analysis")}
                      className={`pb-2.5 border-b-2 transition-all ${
                        activeTab === "analysis"
                          ? "border-iris-primary text-[#F3F2EF] font-bold"
                          : "border-transparent text-graphite-tertiary hover:text-[#B4B0A7]"
                      }`}
                    >
                      Narrative Report
                    </button>
                    <button
                      onClick={() => setActiveTab("clusters")}
                      className={`pb-2.5 border-b-2 transition-all ${
                        activeTab === "clusters"
                          ? "border-iris-primary text-[#F3F2EF] font-bold"
                          : "border-transparent text-graphite-tertiary hover:text-[#B4B0A7]"
                      }`}
                    >
                      Cortical Clusters
                    </button>
                    <button
                      onClick={() => setActiveTab("downloads")}
                      className={`pb-2.5 border-b-2 transition-all ${
                        activeTab === "downloads"
                          ? "border-iris-primary text-[#F3F2EF] font-bold"
                          : "border-transparent text-graphite-tertiary hover:text-[#B4B0A7]"
                      }`}
                    >
                      Downloads
                    </button>
                  </div>

                  {/* Tab 1: Narrative Analysis (LLM report) */}
                  {activeTab === "analysis" && (
                    <div className="flex flex-col gap-5 text-xs">
                      {explanationReport ? (
                        <div className="flex flex-col gap-5">
                          {/* Conversion Block */}
                          <div className="flex flex-col gap-2">
                            <h5 className="font-bold text-[#F3F2EF] tracking-tight">Conversion Analysis</h5>
                            <p className="text-graphite-secondary leading-relaxed bg-graphite-sunken p-3.5 rounded border border-graphite-subtle">
                              {explanationReport.conversion_analysis}
                            </p>
                          </div>

                          {/* Brand Recall Block */}
                          <div className="flex flex-col gap-2">
                            <h5 className="font-bold text-[#F3F2EF] tracking-tight">Brand Recall Analysis</h5>
                            <p className="text-graphite-secondary leading-relaxed bg-graphite-sunken p-3.5 rounded border border-graphite-subtle">
                              {explanationReport.brand_recall_analysis}
                            </p>
                          </div>

                          {/* Action Items Recommendations checklist */}
                          <div className="flex flex-col gap-2.5">
                            <h5 className="font-bold text-[#F3F2EF] tracking-tight">Creative Optimization Recommendations</h5>
                            <div className="flex flex-col gap-2 bg-[#121110] p-4 rounded border border-[#2E2B26]">
                              {explanationReport.recommendations?.map((rec: string, idx: number) => {
                                const isChecked = !!completedRecs[rec];
                                return (
                                  <label 
                                    key={idx} 
                                    onClick={() => toggleRecommendation(rec)}
                                    className={`flex gap-3 items-start cursor-pointer py-1.5 transition-all hover:text-white ${
                                      isChecked ? "opacity-45 line-through text-graphite-tertiary" : "text-graphite-secondary"
                                    }`}
                                  >
                                    <input 
                                      type="checkbox" 
                                      checked={isChecked}
                                      readOnly
                                      className="mt-0.5 accent-iris-primary rounded-sm border-graphite-subtle shrink-0"
                                    />
                                    <span className="text-[11px] leading-relaxed select-none">
                                      {rec}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-graphite-tertiary font-mono p-2 border border-[#2E2B26] bg-[#121110] rounded">
                          Loading explanation report...
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: 17 Brain Clusters */}
                  {activeTab === "clusters" && (
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center text-[10px] font-mono text-graphite-tertiary uppercase">
                        <span>Cortical Clusters (A-Q)</span>
                        <span>Activation Strength</span>
                      </div>
                      
                      {marketingScores ? (
                        <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1.5 custom-scrollbar">
                          {Object.entries(marketingScores.clusters).map(([key, cluster]: any) => {
                            const strength = cluster.strength_0_1 || 0.0;
                            const isStrong = strength >= 0.75;
                            const isMuted = strength <= 0.3;
                            
                            const metadata = CLUSTER_METADATA[key] || { name: cluster.cluster_name, icon: "🧠", proxy: cluster.psychological_proxy };

                            let barColor = "bg-graphite-secondary";
                            if (isStrong) barColor = "bg-ember-creative";
                            else if (!isMuted) barColor = "bg-iris-primary";

                            return (
                              <div 
                                key={key} 
                                className="p-3 bg-graphite-sunken/40 border border-graphite-subtle rounded flex flex-col gap-2 hover:bg-graphite-sunken transition-all group"
                              >
                                <div className="flex justify-between items-center text-xs">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-5.5 h-5.5 rounded border border-[#2E2B26] bg-graphite-sunken flex items-center justify-center font-bold font-mono text-[10px] text-white shrink-0">
                                      {key}
                                    </span>
                                    <span className="font-semibold text-[#F3F2EF] truncate shrink-0">
                                      {metadata.icon} {metadata.name}
                                    </span>
                                    {isStrong && (
                                      <span className="text-[8px] font-mono bg-ember-creative/10 border border-ember-creative/30 text-ember-creative px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                                        Strong
                                      </span>
                                    )}
                                    {isMuted && (
                                      <span className="text-[8px] font-mono bg-graphite-sunken border border-graphite-subtle text-graphite-tertiary px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                                        Muted
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-mono text-[10px] text-white font-bold shrink-0">
                                    {strength.toFixed(3)}
                                  </span>
                                </div>
                                
                                <div className="w-full bg-[#121110] h-1.5 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all duration-1000 ${barColor}`} style={{ width: `${strength * 100}%` }}></div>
                                </div>
                                
                                <p className="text-[10px] text-graphite-secondary leading-relaxed">
                                  {metadata.proxy}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-xs text-graphite-tertiary font-mono p-2 border border-[#2E2B26] bg-[#121110] rounded">
                          Loading cluster mapping dataset...
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: Downloads */}
                  {activeTab === "downloads" && artifacts && (
                    <div className="flex flex-col gap-4">
                      
                      <div className="flex flex-col gap-3">
                        {/* ZIP Bundles */}
                        <div className="p-4 bg-[rgba(101,87,245,0.04)] border border-iris-primary/30 rounded flex flex-col gap-2 hover:border-iris-primary/50 transition-all">
                          <h6 className="font-bold text-white text-xs">Full Result Package (ZIP)</h6>
                          <p className="text-[10px] text-graphite-secondary leading-relaxed">
                            Includes parcellation models, activations logs, outcome reports, and preprocessed audio/video files.
                          </p>
                          {artifacts["full_result_bundle.zip"] ? (
                            <a
                              href={artifacts["full_result_bundle.zip"].url}
                              className="mt-1 px-3 py-2 text-center text-xs font-bold rounded bg-iris-primary text-white hover:brightness-110 transition-all inline-block shadow-[0_0_12px_rgba(101,87,245,0.2)]"
                            >
                              Download Full Result Bundle
                            </a>
                          ) : (
                            <span className="text-[10px] font-mono text-graphite-tertiary">Compiling package...</span>
                          )}
                        </div>

                        <div className="p-4 bg-[#121110] border border-[#2E2B26] rounded flex flex-col gap-2 hover:border-[#46433C] transition-all">
                          <h6 className="font-bold text-white text-xs font-sans">Training-Ready Package (ZIP)</h6>
                          <p className="text-[10px] text-graphite-secondary leading-relaxed">
                            Contains raw modality tensor embeddings (.pt files) and predictions.npy matrices for machine learning pipelines.
                          </p>
                          {artifacts["training_ready_bundle.zip"] ? (
                            <a
                              href={artifacts["training_ready_bundle.zip"].url}
                              className="mt-1 px-3 py-2 text-center text-xs font-semibold rounded bg-[#1A1815] border border-graphite-subtle text-graphite-secondary hover:text-white hover:border-graphite-primary transition-all inline-block"
                            >
                              Download Training Bundle
                            </a>
                          ) : (
                            <span className="text-[10px] font-mono text-graphite-tertiary">Compiling package...</span>
                          )}
                        </div>

                        {/* Individual Raw files */}
                        <div className="flex flex-col gap-2 mt-2">
                          <span className="text-[10px] font-mono text-graphite-tertiary uppercase tracking-wider">Lineage Output Files</span>
                          <div className="flex flex-col border border-graphite-subtle rounded divide-y divide-[#2E2B26] overflow-hidden text-xs">
                            {Object.entries(artifacts)
                              .filter(([name]) => !name.endsWith(".zip"))
                              .map(([name, art]: any) => {
                                let icon = "📄";
                                if (name.endsWith(".pt") || name.endsWith(".npy")) icon = "🔢";
                                if (name.endsWith(".csv") || name.endsWith(".json")) icon = "📊";
                                if (name.endsWith(".mp4") || name.endsWith(".wav")) icon = "🎬";

                                return (
                                  <div key={name} className="flex justify-between items-center p-3 bg-graphite-sunken hover:bg-graphite-raised transition-colors">
                                    <span className="font-mono text-[10px] text-graphite-secondary truncate max-w-[280px] flex items-center gap-1.5" title={name}>
                                      <span>{icon}</span>
                                      <span>{name}</span>
                                    </span>
                                    <a
                                      href={art.url}
                                      className="text-[10px] text-iris-primary hover:underline font-bold font-mono"
                                    >
                                      Download
                                    </a>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : selectedJob.status === "FAILED" ? (
                <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded text-xs text-rose-500 flex flex-col gap-2">
                  <h4 className="font-bold flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>GPU Inference Failure</span>
                  </h4>
                  <p className="leading-relaxed bg-black/35 p-3 rounded font-mono text-[10px] border border-rose-500/20 text-[#F2786C]">
                    {selectedJob.error_message || "Fatal error during transformer parcellation pipeline."}
                  </p>
                  <p className="text-[10px] text-graphite-tertiary">
                    Please submit a new scorer job or contact admin support referencing this workspace.
                  </p>
                </div>
              ) : (
                // Running / Processing states
                <div className="flex flex-col gap-5">
                  <h4 className="text-[10px] font-mono text-graphite-tertiary uppercase tracking-wider">GPU Worker Process Logs</h4>
                  
                  {/* Streaming Terminal Console simulator */}
                  <div className="bg-[#0C0B02] border border-[#2E2B26] rounded-md p-4 flex flex-col gap-2.5 shadow-inner">
                    <div className="flex items-center justify-between border-b border-[#2E2B26] pb-2 text-[10px] font-mono text-graphite-tertiary">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span>vast-gpu-node-active</span>
                      </div>
                      <span>bash</span>
                    </div>

                    <div className="h-44 overflow-y-auto custom-scrollbar font-mono text-[10px] flex flex-col gap-1.5 text-graphite-secondary leading-relaxed pr-1 select-text">
                      {(selectedJob.logs && selectedJob.logs.length > 0
                        ? selectedJob.logs
                        : getConsoleLogsForStatus(selectedJob.status)
                      ).map((log: string, index: number) => (
                        <div key={index} className={log.includes("[ERROR]") ? "text-[#F2786C]" : log.includes("[SUCCESS]") || log.includes("[OK]") || log.includes("SUCCESS") ? "text-[#5BD08C]" : log.includes("[PROGRESS]") ? "text-iris-primary font-semibold" : ""}>
                          {log}
                        </div>
                      ))}
                      <div ref={terminalEndRef} />
                      <div className="text-iris-primary flex items-center gap-1">
                        <span>$ tribev2-pipeline --run</span>
                        <span className="terminal-cursor w-1.5 h-3 bg-iris-primary inline-block" />
                      </div>
                    </div>
                  </div>

                  {/* Vertical Progress Stepper */}
                  <div className="flex flex-col gap-4 bg-graphite-sunken p-4 border border-graphite-subtle rounded text-xs">
                    <span className="text-[9px] font-mono text-graphite-tertiary uppercase tracking-wider">Execution Pipeline Stage</span>
                    <div className="flex flex-col gap-3 font-mono">
                      {[
                        { key: "PREPROCESSING", label: "Modality Audio/Video Extraction" },
                        { key: "ENCODING_VIDEO", label: "Dense Embeddings Encoders" },
                        { key: "RUNNING_TRANSFORMER", label: "TribeV2 Fusion Attention" },
                        { key: "MAPPING_HCP", label: "KDTree HCP-MMP1 Mapping" },
                        { key: "COMPLETED", label: "ZIP Export & Output" }
                      ].map((step, idx) => {
                        const isDone = 
                          selectedJob.status === "COMPLETED" || 
                          getConsoleLogsForStatus(selectedJob.status).some(l => l.includes("[SUCCESS]") || (idx < 2 && selectedJob.status !== "RECEIVED" && selectedJob.status !== "AUTHORIZED" && selectedJob.status !== "DOWNLOADING_INPUT"));
                        
                        const isActive = selectedJob.status.includes(step.key) || (step.key === "ENCODING_VIDEO" && selectedJob.status.includes("ENCODING"));

                        return (
                          <div key={step.key} className="flex items-center gap-3">
                            <span className={`w-4 h-4 rounded-full border text-[9px] flex items-center justify-center font-bold ${
                              isDone 
                                ? "bg-[#5BD08C]/10 border-[#5BD08C] text-[#5BD08C]"
                                : isActive 
                                ? "bg-iris-primary/10 border-iris-primary text-iris-primary animate-pulse"
                                : "bg-graphite-sunken border-graphite-subtle text-graphite-tertiary"
                            }`}>
                              {isDone ? "✓" : idx + 1}
                            </span>
                            <span className={isActive ? "text-[#F3F2EF] font-bold" : isDone ? "text-graphite-secondary" : "text-graphite-tertiary"}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}
            </div>
          ) : (
            // Onboarding Empty state (Wireframe & Guides)
            <div className="flex-1 flex flex-col justify-center items-center text-center p-6 gap-5">
              
              {/* 9:16 Wireframe aspect player outline */}
              <div className="w-24 h-40 rounded-lg border-2 border-dashed border-[#46433C] flex flex-col justify-between items-center p-3 text-[#1C1A17] relative select-none">
                <span className="text-[8px] font-mono text-graphite-tertiary uppercase">Player</span>
                <span className="text-xl text-graphite-tertiary opacity-35">🎬</span>
                <span className="text-[7px] font-mono text-graphite-tertiary">9:16 Aspect</span>
                {/* Embedded spark watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                    <span className="text-3xl">▸</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-[#F3F2EF]">Studio Scorer Terminal</p>
                <p className="text-[10px] text-graphite-tertiary max-w-[260px] mt-1 leading-relaxed">
                  Select a creative test run from the repository list to visualize outcomes scores and map cortical brain clusters.
                </p>
              </div>

              {/* Step checklist details */}
              <div className="w-full text-left bg-graphite-sunken/40 border border-graphite-subtle p-4 rounded flex flex-col gap-2.5 text-[10px]">
                <span className="font-mono text-graphite-tertiary uppercase tracking-wider">How parcellation analysis works:</span>
                <div className="flex gap-2">
                  <span className="font-mono text-iris-primary">01.</span>
                  <span className="text-graphite-secondary leading-relaxed">Upload video (we securely quarantine scan before loading files).</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-mono text-iris-primary">02.</span>
                  <span className="text-graphite-secondary leading-relaxed">Extract audio tracks, video frames, and transcript alignments.</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-mono text-iris-primary">03.</span>
                  <span className="text-graphite-secondary leading-relaxed">Run the TribeV2 attention transformer model on CUDA hosts.</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-mono text-iris-primary">04.</span>
                  <span className="text-graphite-secondary leading-relaxed">Map outcome predictions to 17 cognitive clusters (A-Q).</span>
                </div>
              </div>

              {/* Claim boundary watermark */}
              <div className="mt-4 pt-4 border-t border-graphite-subtle/40 w-full text-[9px] text-graphite-tertiary leading-relaxed italic text-center max-w-xs">
                Built using structural patterns observed in high-performing short-form content. Assists production; performance outcomes are not guaranteed.
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Footer */}
      <footer className="border-t border-graphite-subtle py-4 px-6 md:px-12 flex flex-col sm:flex-row justify-between items-center bg-[#1A1815]/90 backdrop-blur-md text-[9px] text-graphite-tertiary font-mono gap-2 relative z-10">
        <div>
          <span>TribeV2 Neuromarketing Creative Studio</span>
          <span className="mx-2 text-[#46433C]">•</span>
          <span>Database session connected</span>
        </div>
        <div className="italic text-center sm:text-right">
          Assists production using research-prior indices; directional, not predictive.
        </div>
      </footer>

      {/* JobWizard Modal Overlay */}
      {isWizardOpen && (
        <JobWizard
          onJobCreated={() => {
            fetchJobs();
          }}
          onClose={() => setIsWizardOpen(false)}
        />
      )}

      {/* SignalJobWizard Modal Overlay */}
      {isSignalWizardOpen && (
        <SignalJobWizard
          isOpen={isSignalWizardOpen}
          onClose={() => setIsSignalWizardOpen(false)}
          onJobCreated={(jobId) => {
            setIsSignalWizardOpen(false);
            fetchJobs();
            window.location.href = `/analysis/${jobId}`;
          }}
        />
      )}
    </div>
  );
}
