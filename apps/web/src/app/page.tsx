"use client";

import React, { useState, useEffect } from "react";
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

const CLUSTER_METADATA: Record<string, { name: string; proxy: string }> = {
  A: { name: "Visual", proxy: "Early occipital processing of movement, scenes, and visual features." },
  B: { name: "Face/Scene", proxy: "Fusiform and parahippocampal activation for characters and environments." },
  C: { name: "Theory of Mind", proxy: "Mentalizing and social connection pathways for narrative empathy." },
  D: { name: "Arousal", proxy: "Limbic and amygdala response to high-energy visual or auditory cues." },
  E: { name: "Episodic Memory", proxy: "Hippocampal encoding of story beats and memory retention." },
  F: { name: "Value/Self", proxy: "Medial prefrontal evaluation of personal relevance and utility." },
  G: { name: "Language", proxy: "Temporal lobe semantic understanding and verbal messaging clarity." },
  H: { name: "Music", proxy: "Auditory cortex rhythm tracking and emotional resonance." },
  I: { name: "Attention", proxy: "Parietal lobe target selection and focus maintenance." },
  J: { name: "Friction", proxy: "Cognitive dissonance or negative visual transitions." },
  K: { name: "Motor/Embodied", proxy: "Premotor resonance with physical actions shown on screen." },
  L: { name: "Surprise", proxy: "Salience network response to unexpected creative hooks." },
  M: { name: "Audio-Visual Binding", proxy: "Multimodal integration of sound and imagery alignment." },
  N: { name: "Trust", proxy: "Insular and prefrontal evaluation of brand credibility." },
  O: { name: "Aesthetic", proxy: "Reward network responses to color harmony and composition." },
  P: { name: "Valence Direction", proxy: "Prefrontal asymmetry indicating positive vs negative engagement." },
  Q: { name: "Narrative Temporal Coherence", proxy: "Integration of temporal story structure and message flow." },
};

// Ordered pipeline stages, used to compute stepper progress from the real status.
const PIPELINE_STAGES = [
  "RECEIVED", "AUTHORIZED", "DOWNLOADING_INPUT", "VALIDATING", "PREPROCESSING",
  "ENCODING_VIDEO", "ENCODING_AUDIO", "ENCODING_TEXT", "BUILDING_FUSED_INPUT",
  "RUNNING_TRANSFORMER", "EXPORTING_RAW_OUTPUTS", "DECODING_HEADS", "MAPPING_HCP",
  "GENERATING_15_CLUSTER_OUTPUTS", "GENERATING_17_CLUSTER_OUTPUTS",
  "SCORING_MARKETING_OUTCOMES", "RUNNING_LLM_EXPLANATION", "PACKAGING_RESULTS",
  "UPLOADING_ARTIFACTS", "COMPLETED",
];

// Minimal inline icon set (monochrome, currentColor). No external dependency.
type IconProps = React.SVGProps<SVGSVGElement>;
const IconSearch = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="9" cy="9" r="6" /><path d="m17.5 17.5-3.6-3.6" /></svg>
);
const IconClose = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" {...p}><path d="m5 5 10 10M15 5 5 15" /></svg>
);
const IconBack = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 4 6 10l6 6" /></svg>
);
const IconPlay = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="currentColor" {...p}><path d="M6 4.5v11l9-5.5-9-5.5Z" /></svg>
);
const IconDownload = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5M3.5 15.5h13" /></svg>
);
const IconCheck = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m4 10.5 4 4 8-9" /></svg>
);
const IconAlert = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M10 3 1.5 17.5h17L10 3Z" /><path d="M10 8v4M10 15h.01" /></svg>
);
const IconChart = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 3v14h14" /><path d="M6.5 13l3-4 3 2 3.5-5.5" /></svg>
);
const IconFile = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 2.5h7l4 4v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z" /><path d="M11.5 2.5v4h4" /></svg>
);

const Spinner = ({ className = "" }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

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

            const scoreArt = artData.artifacts["marketing_scores.json"];
            if (scoreArt) {
              const scoreRes = await fetch(scoreArt.url);
              if (scoreRes.ok) {
                const scoreData = await scoreRes.json();
                setMarketingScores(scoreData);
              }
            }

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

  // Status styling — status colors belong to the status system and are used only for status.
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
        return "text-[#5FC6DD] bg-[rgba(95,198,221,0.1)] border-[#5FC6DD]/30";
    }
  };

  const getFriendlyStateLabel = (state: string) => {
    const mapping: Record<string, string> = {
      "RECEIVED": "Job request received",
      "AUTHORIZED": "Workspace authorisation verified",
      "DOWNLOADING_INPUT": "Downloading original MP4 video",
      "VALIDATING": "Validating content and codecs",
      "PREPROCESSING": "Extracting audio streams and frames",
      "ENCODING_VIDEO": "Encoding visual features (3D-ResNet)",
      "ENCODING_AUDIO": "Encoding auditory features (Wav2Vec)",
      "ENCODING_TEXT": "Transcribing and encoding transcript (BERT)",
      "BUILDING_FUSED_INPUT": "Assembling fused sequence tensor",
      "RUNNING_TRANSFORMER": "Executing TribeV2 transformer model",
      "EXPORTING_RAW_OUTPUTS": "Exporting activations (predictions.npy)",
      "DECODING_HEADS": "Decoding outcome heads and parcellating",
      "MAPPING_HCP": "Mapping predictions to HCP-MMP1 cortical areas",
      "GENERATING_15_CLUSTER_OUTPUTS": "Compiling 15-cluster model",
      "GENERATING_17_CLUSTER_OUTPUTS": "Compiling 17-cluster model (A-Q)",
      "SCORING_MARKETING_OUTCOMES": "Synthesising EP, VP, CS, BR scores",
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
      case "CREATED": return 0;
      case "QUEUED": return 5;
      case "AUTHORIZED": return 10;
      case "DOWNLOADING_INPUT": return 15;
      case "VALIDATING": return 20;
      case "PREPROCESSING": return 30;
      case "ENCODING_VIDEO": return 40;
      case "ENCODING_AUDIO": return 50;
      case "ENCODING_TEXT": return 60;
      case "BUILDING_FUSED_INPUT":
      case "RUNNING_TRANSFORMER": return 70;
      case "EXPORTING_RAW_OUTPUTS":
      case "DECODING_HEADS": return 80;
      case "MAPPING_HCP":
      case "GENERATING_15_CLUSTER_OUTPUTS":
      case "GENERATING_17_CLUSTER_OUTPUTS": return 85;
      case "SCORING_MARKETING_OUTCOMES": return 90;
      case "RUNNING_LLM_EXPLANATION": return 95;
      case "PACKAGING_RESULTS":
      case "UPLOADING_ARTIFACTS": return 98;
      case "COMPLETED": return 100;
      default:
        if (status.includes("ENCODING")) return 50;
        return 0;
    }
  };

  const isRunningState = (status: string) =>
    !["CREATED", "QUEUED", "COMPLETED", "FAILED", "CANCELLED", "UNKNOWN"].includes(status);

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
      return matchesSearch && isRunningState(job.status);
    }
    return matchesSearch;
  });

  const runningJobsCount = jobs.filter((j) => isRunningState(j.status)).length;

  return (
    <div className="dashboard-canvas min-h-screen text-graphite-primary flex flex-col justify-between font-sans">

      {/* Header */}
      <header className="border-b border-graphite-subtle py-4 px-6 md:px-12 flex justify-between items-center bg-[#1A1815]/80 z-10">
        <div className="flex items-center gap-3">
          {/* 9:16 vertical frame with offset Ember spark */}
          <div className="w-7 h-10 rounded border border-graphite-strong flex items-center justify-center relative shrink-0 bg-[#0C0B02] overflow-hidden" aria-hidden="true">
            <span className="text-[10px] font-mono text-graphite-tertiary leading-none">9:16</span>
            <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-ember-creative absolute right-0.5 top-0.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-[#F3F2EF]">Sakhaa Signal</h1>
              <span className="text-xs text-graphite-tertiary font-mono">v2.0</span>
            </div>
            <p className="text-xs text-graphite-tertiary tracking-wide font-mono mt-0.5">Neuromarketing decision studio</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/results/demo"
            className="px-3.5 py-2 text-sm font-mono font-semibold rounded-md bg-iris-primary/10 border border-iris-primary/30 text-iris-primary hover:bg-iris-primary hover:text-white transition-colors flex items-center gap-1.5"
          >
            <IconChart className="w-4 h-4" />
            <span>View demo report</span>
          </Link>

          <span className="hidden sm:inline-block text-xs text-graphite-secondary font-mono bg-graphite-sunken px-2.5 py-1.5 rounded-md border border-graphite-subtle">
            Workspace: {workspace?.id?.slice(0, 8) || "N/A"}
          </span>
          <button className="px-3.5 py-2 text-sm font-semibold rounded-md bg-graphite-sunken border border-graphite-strong text-[#F3F2EF] hover:text-white hover:border-graphite-primary transition-colors">
            {workspace?.name || "Main studio"}
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex flex-col lg:flex-row relative z-10">

        {/* Left Side: Jobs Table/List */}
        <main className="flex-1 p-6 md:p-8 flex flex-col gap-6 max-h-[calc(100vh-73px)] overflow-y-auto custom-scrollbar">

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-[#F3F2EF]">Scoring jobs</h2>
              <p className="text-sm text-graphite-secondary mt-1.5">Neuromarketing creative tests and predictive parcellation lineage.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSignalWizardOpen(true)}
                className="px-4 py-2.5 text-sm font-semibold rounded-md bg-iris-primary text-white hover:brightness-110 transition-all flex items-center gap-2"
              >
                New creative analysis
              </button>

              <button
                onClick={() => setIsWizardOpen(true)}
                className="px-3.5 py-2.5 text-sm font-semibold rounded-md bg-graphite-sunken text-graphite-secondary hover:text-white border border-graphite-subtle hover:border-graphite-strong transition-colors flex items-center gap-2"
              >
                Legacy TribeV2 scorer
              </button>
            </div>
          </div>

          {/* Search and Filters bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-graphite-tertiary" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search by campaign name or video"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search jobs"
                className="w-full pl-10 pr-4 py-2.5 bg-graphite-sunken border border-graphite-subtle rounded-md text-sm text-[#F3F2EF] placeholder-[#615D55] focus:outline-none focus:border-iris-primary focus:ring-1 focus:ring-iris-primary transition-colors"
              />
            </div>

            {/* Quick Status Buttons */}
            <div className="flex gap-1.5 p-1 bg-graphite-sunken rounded-md border border-graphite-subtle text-sm font-mono font-semibold" role="tablist" aria-label="Filter jobs by status">
              {[
                { key: "ALL", label: "All" },
                { key: "RUNNING", label: `Active (${runningJobsCount})` },
                { key: "COMPLETED", label: "Completed" },
                { key: "FAILED", label: "Failed" },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setStatusFilter(filter.key)}
                  aria-pressed={statusFilter === filter.key}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
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
            <div className="flex-1 flex flex-col items-center justify-center text-graphite-secondary text-sm gap-3">
              <Spinner className="h-6 w-6 text-iris-primary" />
              <span className="font-mono text-sm text-graphite-tertiary">Loading repository…</span>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="flex-1 border border-dashed border-[#46433C] rounded-md flex flex-col justify-center items-center p-12 text-center bg-graphite-sunken/10">
              <div className="w-24 h-40 rounded-md border-2 border-dashed border-[#46433C] flex items-center justify-center mb-4" aria-hidden="true">
                <IconPlay className="w-8 h-8 text-graphite-tertiary opacity-40" />
              </div>
              <h3 className="text-base font-semibold text-graphite-primary">No matching creative tests found</h3>
              <p className="text-sm text-graphite-secondary max-w-xs mt-2 leading-relaxed">
                Upload your advertisement video to run transformer model inference and outcomes mapping.
              </p>
              <button
                onClick={() => setIsWizardOpen(true)}
                className="mt-5 px-4 py-2 text-sm font-semibold rounded-md bg-graphite-sunken border border-graphite-subtle text-graphite-secondary hover:text-white hover:border-graphite-primary transition-colors"
              >
                Create job
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.map((job) => {
                const isSelected = selectedJobId === job.id;
                return (
                  <div
                    key={job.id}
                    onClick={() => handleSelectJob(job.id)}
                    className={`p-4 border rounded-md cursor-pointer hover-glow flex flex-col gap-4 relative overflow-hidden transition-colors ${
                      isSelected
                        ? "bg-[#1C1A17] border-iris-primary"
                        : "bg-[#121110]/80 border-graphite-subtle"
                    }`}
                  >
                    {/* Top strip */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <span className="text-xs font-mono text-graphite-tertiary">ID: {job.id.slice(0, 8)}</span>
                        <h3 className="text-base font-semibold text-[#F3F2EF] truncate mt-1">{job.input.project_name}</h3>
                        <p className="text-xs text-graphite-secondary font-mono truncate">{job.input.video_name}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-sm border text-xs font-mono tracking-wide shrink-0 ${getStatusPillClass(job.status)}`}>
                        {job.status === "COMPLETED" ? "Ready" : job.status}
                      </span>
                    </div>

                    {/* Honest footer: no fabricated indices. Completed jobs link to the report. */}
                    <div className="pt-3 border-t border-graphite-subtle/50 flex justify-between items-center text-xs font-mono text-graphite-tertiary">
                      <span>{job.status === "COMPLETED" ? "Report ready" : isRunningState(job.status) ? "Running" : job.status}</span>
                      <span suppressHydrationWarning>{job.createdAt ? new Date(job.createdAt).toISOString().split("T")[0] : ""}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Right Side: Sidebar Job Details */}
        <aside className="w-full lg:w-[480px] border-t lg:border-t-0 lg:border-l border-graphite-subtle bg-[#161512]/90 p-6 flex flex-col gap-6 overflow-y-auto max-h-[calc(100vh-73px)] custom-scrollbar">

          {selectedJob ? (
            <div className="flex flex-col gap-6">

              {/* Header Details */}
              <div className="flex justify-between items-start border-b border-graphite-subtle pb-4">
                <div className="min-w-0">
                  <span className="text-xs font-mono text-graphite-tertiary tracking-wide">Job ID: {selectedJob.id}</span>
                  <h3 className="text-base font-semibold text-[#F3F2EF] truncate mt-1">{selectedJob.input.project_name}</h3>
                  <p className="text-sm text-graphite-secondary truncate mt-0.5">Asset: {selectedJob.input.video_name}.mp4</p>
                  {selectedJob.status === "COMPLETED" && (
                    <Link
                      href={`/results/${selectedJob.id}`}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-iris-primary text-white text-sm font-semibold hover:brightness-110 transition-all"
                    >
                      View full report
                      <IconBack className="w-4 h-4 rotate-180" />
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
                  aria-label="Close job details"
                  className="text-graphite-tertiary hover:text-white p-1 transition-colors rounded-md hover:bg-graphite-sunken"
                >
                  <IconClose className="w-5 h-5" />
                </button>
              </div>

              {/* Status Section */}
              <div className="flex flex-col gap-3 bg-graphite-sunken p-4 border border-graphite-subtle rounded-md">
                <div className="flex justify-between items-center text-sm font-mono text-graphite-tertiary">
                  <span>State monitor</span>
                  <span className="text-iris-primary font-semibold">Worker</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-sm border text-sm font-mono tracking-wide ${getStatusPillClass(selectedJob.status)}`}>
                    {getFriendlyStateLabel(selectedJob.status)}
                  </span>
                  {selectedJob.status === "CREATED" && (
                    <button
                      onClick={() => handleStartJob(selectedJob.id)}
                      className="px-4 py-2 text-sm font-semibold rounded-md bg-iris-primary text-white hover:brightness-110 transition-all"
                    >
                      Start execution
                    </button>
                  )}
                  {isRunningState(selectedJob.status) && (
                    <button
                      disabled={cancellingJobId === selectedJob.id}
                      onClick={() => handleCancelJob(selectedJob.id)}
                      className="px-4 py-2 text-sm font-semibold rounded-md bg-[rgba(242,120,108,0.12)] text-[#F2786C] border border-[#F2786C]/40 hover:bg-[rgba(242,120,108,0.2)] disabled:opacity-50 transition-colors"
                    >
                      {cancellingJobId === selectedJob.id ? "Stopping…" : "Stop execution"}
                    </button>
                  )}
                </div>

                {/* Progress Bar — only for actively running states */}
                {isRunningState(selectedJob.status) && (
                  <div className="flex flex-col gap-1.5 mt-1 border-t border-graphite-subtle pt-3">
                    <div className="flex justify-between text-sm font-mono text-graphite-secondary">
                      <span>Pipeline progress</span>
                      <span className="text-iris-primary font-semibold">{getProgressPercentage(selectedJob.status)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#2E2B26] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-iris-primary rounded-full transition-all duration-500 ease-out"
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
                    <h4 className="text-base font-semibold text-graphite-primary">Performance outcomes (biometric index)</h4>

                    {marketingScores ? (
                      <div className="grid grid-cols-2 gap-3">
                        {/* Emotional Pull (EP) */}
                        <div className="p-3 bg-graphite-sunken border border-graphite-subtle rounded-md flex items-center gap-3 relative group hover:border-iris-primary/40 transition-colors">
                          <div className="relative w-14 h-14 shrink-0">
                            <svg className="w-14 h-14 transform -rotate-90" aria-hidden="true">
                              <circle cx="28" cy="28" r="23" className="stroke-[#2E2B26]" strokeWidth="4.5" fill="transparent" />
                              <circle cx="28" cy="28" r="23" className="stroke-iris-primary gauge-circle" strokeWidth="4.5" fill="transparent" strokeDasharray={144.5} strokeDashoffset={144.5 - (144.5 * (marketingScores.outcomes["Engagement"]?.score_0_100 || 0)) / 100} strokeLinecap="round" />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white font-mono">
                              {marketingScores.outcomes["Engagement"]?.score_0_100 || 0}%
                            </span>
                          </div>
                          <div>
                            <span className="text-xs font-mono text-graphite-tertiary block">Emotional pull</span>
                            <span className="text-sm font-semibold text-[#F3F2EF] block mt-0.5">EP index</span>
                          </div>
                        </div>

                        {/* Visual Pull (VP) */}
                        <div className="p-3 bg-graphite-sunken border border-graphite-subtle rounded-md flex items-center gap-3 relative group hover:border-[#5FC6DD]/40 transition-colors">
                          <div className="relative w-14 h-14 shrink-0">
                            <svg className="w-14 h-14 transform -rotate-90" aria-hidden="true">
                              <circle cx="28" cy="28" r="23" className="stroke-[#2E2B26]" strokeWidth="4.5" fill="transparent" />
                              <circle cx="28" cy="28" r="23" className="stroke-[#5FC6DD] gauge-circle" strokeWidth="4.5" fill="transparent" strokeDasharray={144.5} strokeDashoffset={144.5 - (144.5 * (marketingScores.outcomes["Virality"]?.score_0_100 || 0)) / 100} strokeLinecap="round" />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white font-mono">
                              {marketingScores.outcomes["Virality"]?.score_0_100 || 0}%
                            </span>
                          </div>
                          <div>
                            <span className="text-xs font-mono text-graphite-tertiary block">Visual pull</span>
                            <span className="text-sm font-semibold text-[#5FC6DD] block mt-0.5">VP index</span>
                          </div>
                        </div>

                        {/* Conversion Support (CS) */}
                        <div className="p-3 bg-graphite-sunken border border-graphite-subtle rounded-md flex items-center gap-3 relative group hover:border-ember-creative/40 transition-colors">
                          <div className="relative w-14 h-14 shrink-0">
                            <svg className="w-14 h-14 transform -rotate-90" aria-hidden="true">
                              <circle cx="28" cy="28" r="23" className="stroke-[#2E2B26]" strokeWidth="4.5" fill="transparent" />
                              <circle cx="28" cy="28" r="23" className="stroke-ember-creative gauge-circle" strokeWidth="4.5" fill="transparent" strokeDasharray={144.5} strokeDashoffset={144.5 - (144.5 * (marketingScores.outcomes["Conversion"]?.score_0_100 || 0)) / 100} strokeLinecap="round" />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white font-mono">
                              {marketingScores.outcomes["Conversion"]?.score_0_100 || 0}%
                            </span>
                          </div>
                          <div>
                            <span className="text-xs font-mono text-graphite-tertiary block">Conversion support</span>
                            <span className="text-sm font-semibold text-ember-creative block mt-0.5">CS index</span>
                          </div>
                        </div>

                        {/* Brand Recall (BR) */}
                        <div className="p-3 bg-graphite-sunken border border-[#2E2B26] rounded-md flex items-center gap-3 relative group hover:border-[#E8B84B]/40 transition-colors">
                          <div className="relative w-14 h-14 shrink-0">
                            <svg className="w-14 h-14 transform -rotate-90" aria-hidden="true">
                              <circle cx="28" cy="28" r="23" className="stroke-[#2E2B26]" strokeWidth="4.5" fill="transparent" />
                              <circle cx="28" cy="28" r="23" className="stroke-[#E8B84B] gauge-circle" strokeWidth="4.5" fill="transparent" strokeDasharray={144.5} strokeDashoffset={144.5 - (144.5 * (marketingScores.outcomes["Brand Recall"]?.score_0_100 || 0)) / 100} strokeLinecap="round" />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white font-mono">
                              {marketingScores.outcomes["Brand Recall"]?.score_0_100 || 0}%
                            </span>
                          </div>
                          <div>
                            <span className="text-xs font-mono text-graphite-tertiary block">Brand recall</span>
                            <span className="text-sm font-semibold text-[#E8B84B] block mt-0.5">BR index</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-graphite-tertiary font-mono p-3 border border-[#2E2B26] bg-[#121110] rounded-md">
                        Loading outcome indices data…
                      </div>
                    )}
                  </div>

                  {/* Navigation Tabs */}
                  <div className="border-b border-[#2E2B26] flex gap-5 text-sm font-mono" role="tablist">
                    <button onClick={() => setActiveTab("analysis")} role="tab" aria-selected={activeTab === "analysis"} className={`pb-2.5 border-b-2 transition-colors ${activeTab === "analysis" ? "border-iris-primary text-[#F3F2EF] font-semibold" : "border-transparent text-graphite-tertiary hover:text-[#B4B0A7]"}`}>Narrative report</button>
                    <button onClick={() => setActiveTab("clusters")} role="tab" aria-selected={activeTab === "clusters"} className={`pb-2.5 border-b-2 transition-colors ${activeTab === "clusters" ? "border-iris-primary text-[#F3F2EF] font-semibold" : "border-transparent text-graphite-tertiary hover:text-[#B4B0A7]"}`}>Cortical clusters</button>
                    <button onClick={() => setActiveTab("downloads")} role="tab" aria-selected={activeTab === "downloads"} className={`pb-2.5 border-b-2 transition-colors ${activeTab === "downloads" ? "border-iris-primary text-[#F3F2EF] font-semibold" : "border-transparent text-graphite-tertiary hover:text-[#B4B0A7]"}`}>Downloads</button>
                  </div>

                  {/* Tab 1: Narrative Analysis (LLM report) */}
                  {activeTab === "analysis" && (
                    <div className="flex flex-col gap-5 text-sm">
                      {explanationReport ? (
                        <div className="flex flex-col gap-5">
                          <div className="flex flex-col gap-2">
                            <h5 className="text-base font-semibold text-[#F3F2EF]">Conversion analysis</h5>
                            <p className="text-graphite-secondary leading-relaxed bg-graphite-sunken p-3.5 rounded-md border border-graphite-subtle">
                              {explanationReport.conversion_analysis}
                            </p>
                          </div>

                          <div className="flex flex-col gap-2">
                            <h5 className="text-base font-semibold text-[#F3F2EF]">Brand recall analysis</h5>
                            <p className="text-graphite-secondary leading-relaxed bg-graphite-sunken p-3.5 rounded-md border border-graphite-subtle">
                              {explanationReport.brand_recall_analysis}
                            </p>
                          </div>

                          <div className="flex flex-col gap-2.5">
                            <h5 className="text-base font-semibold text-[#F3F2EF]">Creative optimisation recommendations</h5>
                            <div className="flex flex-col gap-2 bg-[#121110] p-4 rounded-md border border-[#2E2B26]">
                              {explanationReport.recommendations?.map((rec: string, idx: number) => {
                                const isChecked = !!completedRecs[rec];
                                return (
                                  <label
                                    key={idx}
                                    onClick={() => toggleRecommendation(rec)}
                                    className={`flex gap-3 items-start cursor-pointer py-1.5 transition-colors hover:text-white ${isChecked ? "opacity-45 line-through text-graphite-tertiary" : "text-graphite-secondary"}`}
                                  >
                                    <input type="checkbox" checked={isChecked} readOnly className="mt-1 accent-iris-primary rounded-sm border-graphite-subtle shrink-0" />
                                    <span className="text-sm leading-relaxed select-none">{rec}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-graphite-tertiary font-mono p-3 border border-[#2E2B26] bg-[#121110] rounded-md">
                          Loading explanation report…
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: 17 Brain Clusters */}
                  {activeTab === "clusters" && (
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center text-sm font-mono text-graphite-tertiary">
                        <span>Cortical clusters (A–Q)</span>
                        <span>Activation strength</span>
                      </div>

                      {marketingScores ? (
                        <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1.5 custom-scrollbar">
                          {Object.entries(marketingScores.clusters).map(([key, cluster]: any) => {
                            const strength = cluster.strength_0_1 || 0.0;
                            const isStrong = strength >= 0.75;
                            const isMuted = strength <= 0.3;
                            const metadata = CLUSTER_METADATA[key] || { name: cluster.cluster_name, proxy: cluster.psychological_proxy };

                            let barColor = "bg-graphite-secondary";
                            if (isStrong) barColor = "bg-ember-creative";
                            else if (!isMuted) barColor = "bg-iris-primary";

                            return (
                              <div key={key} className="p-3 bg-graphite-sunken/40 border border-graphite-subtle rounded-md flex flex-col gap-2 hover:bg-graphite-sunken transition-colors">
                                <div className="flex justify-between items-center text-sm">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-6 h-6 rounded border border-[#2E2B26] bg-graphite-sunken flex items-center justify-center font-semibold font-mono text-xs text-white shrink-0">{key}</span>
                                    <span className="font-medium text-[#F3F2EF] truncate">{metadata.name}</span>
                                    {isStrong && <span className="text-xs font-mono bg-ember-creative/10 border border-ember-creative/30 text-ember-creative px-1.5 py-0.5 rounded-sm">Strong</span>}
                                    {isMuted && <span className="text-xs font-mono bg-graphite-sunken border border-graphite-subtle text-graphite-tertiary px-1.5 py-0.5 rounded-sm">Muted</span>}
                                  </div>
                                  <span className="font-mono text-sm text-white font-semibold shrink-0">{strength.toFixed(3)}</span>
                                </div>

                                <div className="w-full bg-[#121110] h-1.5 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${strength * 100}%` }} />
                                </div>

                                <p className="text-xs text-graphite-secondary leading-relaxed">{metadata.proxy}</p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-sm text-graphite-tertiary font-mono p-3 border border-[#2E2B26] bg-[#121110] rounded-md">
                          Loading cluster mapping dataset…
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: Downloads */}
                  {activeTab === "downloads" && artifacts && (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3">
                        <div className="p-4 bg-iris-primary/5 border border-iris-primary/30 rounded-md flex flex-col gap-2 hover:border-iris-primary/50 transition-colors">
                          <h6 className="font-semibold text-white text-base">Full result package (ZIP)</h6>
                          <p className="text-xs text-graphite-secondary leading-relaxed">
                            Includes parcellation models, activations logs, outcome reports, and preprocessed audio/video files.
                          </p>
                          {artifacts["full_result_bundle.zip"] ? (
                            <a href={artifacts["full_result_bundle.zip"].url} className="mt-1 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-md bg-iris-primary text-white hover:brightness-110 transition-all w-fit">
                              <IconDownload className="w-4 h-4" />
                              Download full result bundle
                            </a>
                          ) : (
                            <span className="text-xs font-mono text-graphite-tertiary">Compiling package…</span>
                          )}
                        </div>

                        <div className="p-4 bg-[#121110] border border-[#2E2B26] rounded-md flex flex-col gap-2 hover:border-[#46433C] transition-colors">
                          <h6 className="font-semibold text-white text-base">Training-ready package (ZIP)</h6>
                          <p className="text-xs text-graphite-secondary leading-relaxed">
                            Contains raw modality tensor embeddings (.pt files) and predictions.npy matrices for machine learning pipelines.
                          </p>
                          {artifacts["training_ready_bundle.zip"] ? (
                            <a href={artifacts["training_ready_bundle.zip"].url} className="mt-1 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-md bg-[#1A1815] border border-graphite-subtle text-graphite-secondary hover:text-white hover:border-graphite-primary transition-colors w-fit">
                              <IconDownload className="w-4 h-4" />
                              Download training bundle
                            </a>
                          ) : (
                            <span className="text-xs font-mono text-graphite-tertiary">Compiling package…</span>
                          )}
                        </div>

                        {/* Individual Raw files */}
                        <div className="flex flex-col gap-2 mt-2">
                          <span className="text-sm font-mono text-graphite-tertiary">Lineage output files</span>
                          <div className="flex flex-col border border-graphite-subtle rounded-md divide-y divide-[#2E2B26] overflow-hidden text-sm">
                            {Object.entries(artifacts)
                              .filter(([name]) => !name.endsWith(".zip"))
                              .map(([name, art]: any) => (
                                <div key={name} className="flex justify-between items-center p-3 bg-graphite-sunken hover:bg-graphite-raised transition-colors">
                                  <span className="font-mono text-xs text-graphite-secondary truncate max-w-[280px] flex items-center gap-1.5" title={name}>
                                    <IconFile className="w-4 h-4 shrink-0 text-graphite-tertiary" />
                                    <span>{name}</span>
                                  </span>
                                  <a href={art.url} className="text-xs text-iris-primary hover:underline font-semibold font-mono">Download</a>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : selectedJob.status === "FAILED" ? (
                <div className="bg-[rgba(242,120,108,0.08)] border border-[#F2786C]/30 p-4 rounded-md text-sm text-[#F2786C] flex flex-col gap-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <IconAlert className="w-5 h-5 shrink-0" />
                    <span>GPU inference failure</span>
                  </h4>
                  <p className="leading-relaxed bg-black/30 p-3 rounded-md font-mono text-xs border border-[#F2786C]/20 text-[#F2786C]">
                    {selectedJob.error_message || "Fatal error during transformer parcellation pipeline."}
                  </p>
                  <p className="text-xs text-graphite-tertiary">
                    Submit a new scorer job or contact admin support referencing this workspace.
                  </p>
                </div>
              ) : (
                // Running / Processing states — honest status, no fabricated terminal logs.
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2 bg-graphite-sunken p-4 border border-graphite-subtle rounded-md">
                    <span className="text-sm font-mono text-graphite-tertiary">Worker status</span>
                    <p className="text-sm text-[#F3F2EF] leading-relaxed">
                      {getFriendlyStateLabel(selectedJob.status)}. You can leave this page; we keep tracking and update the report when it is ready.
                    </p>
                  </div>

                  {/* Vertical Progress Stepper */}
                  <div className="flex flex-col gap-4 bg-graphite-sunken p-4 border border-graphite-subtle rounded-md text-sm">
                    <span className="text-sm font-mono text-graphite-tertiary">Execution pipeline stage</span>
                    <div className="flex flex-col gap-3 font-mono">
                      {[
                        { key: "PREPROCESSING", label: "Modality audio/video extraction" },
                        { key: "ENCODING_VIDEO", label: "Dense embeddings encoders" },
                        { key: "RUNNING_TRANSFORMER", label: "TribeV2 fusion attention" },
                        { key: "MAPPING_HCP", label: "KDTree HCP-MMP1 mapping" },
                        { key: "COMPLETED", label: "ZIP export and output" },
                      ].map((step, idx) => {
                        const currentIdx = PIPELINE_STAGES.indexOf(selectedJob.status);
                        const stepIdx = PIPELINE_STAGES.indexOf(step.key);
                        const isDone = selectedJob.status === "COMPLETED" || (currentIdx >= 0 && stepIdx >= 0 && currentIdx > stepIdx);
                        const isActive = selectedJob.status === step.key || (step.key === "ENCODING_VIDEO" && selectedJob.status.includes("ENCODING"));

                        return (
                          <div key={step.key} className="flex items-center gap-3">
                            <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs shrink-0 ${isDone ? "bg-[#5BD08C]/10 border-[#5BD08C] text-[#5BD08C]" : isActive ? "bg-iris-primary/10 border-iris-primary text-iris-primary" : "bg-graphite-sunken border-graphite-subtle text-graphite-tertiary"}`}>
                              {isDone ? <IconCheck className="w-3 h-3" /> : idx + 1}
                            </span>
                            <span className={isActive ? "text-[#F3F2EF] font-semibold" : isDone ? "text-graphite-secondary" : "text-graphite-tertiary"}>
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
              <div className="w-24 h-40 rounded-md border-2 border-dashed border-[#46433C] flex flex-col justify-between items-center p-3 text-[#1C1A17] relative select-none" aria-hidden="true">
                <span className="text-xs font-mono text-graphite-tertiary">Player</span>
                <IconPlay className="w-8 h-8 text-graphite-tertiary opacity-40" />
                <span className="text-xs font-mono text-graphite-tertiary">9:16 aspect</span>
              </div>

              <div>
                <p className="text-base font-semibold text-[#F3F2EF]">Studio scorer terminal</p>
                <p className="text-sm text-graphite-tertiary max-w-[280px] mt-2 leading-relaxed">
                  Select a creative test run from the repository list to visualise outcome scores and map cortical brain clusters.
                </p>
              </div>

              {/* Step checklist details */}
              <div className="w-full text-left bg-graphite-sunken/40 border border-graphite-subtle p-4 rounded-md flex flex-col gap-2.5 text-sm">
                <span className="font-mono text-graphite-tertiary">How parcellation analysis works</span>
                <div className="flex gap-2">
                  <span className="font-mono text-iris-primary">01.</span>
                  <span className="text-graphite-secondary leading-relaxed">Upload video (we securely quarantine-scan before loading files).</span>
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
                  <span className="text-graphite-secondary leading-relaxed">Map outcome predictions to 17 cognitive clusters (A–Q).</span>
                </div>
              </div>

              {/* Claim boundary watermark */}
              <div className="mt-4 pt-4 border-t border-graphite-subtle/40 w-full text-sm text-graphite-tertiary leading-relaxed text-center max-w-xs">
                Built using structural patterns observed in high-performing short-form content. Assists production; performance outcomes are not guaranteed.
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Footer */}
      <footer className="border-t border-graphite-subtle py-4 px-6 md:px-12 flex flex-col sm:flex-row justify-between items-center bg-[#1A1815]/90 text-sm text-graphite-tertiary font-mono gap-2 relative z-10">
        <div>
          <span>Sakhaa Signal neuromarketing creative studio</span>
          <span className="mx-2 text-[#46433C]">•</span>
          <span>Database session connected</span>
        </div>
        <div className="text-center sm:text-right">
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