"use client";

import React, { useState, useEffect } from "react";
import JobWizard from "@/components/JobWizard";

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

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [artifacts, setArtifacts] = useState<any>(null);
  const [marketingScores, setMarketingScores] = useState<any>(null);
  const [explanationReport, setExplanationReport] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("analysis");

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
    // Poll jobs list in background every 3 seconds to update states automatically
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

  // Helper to get status pill styling based on DESIGN.md (§4.4)
  const getStatusPillClass = (status: string) => {
    switch (status) {
      case "CREATED":
        return "text-[#615D55] bg-[#F3F2EF] dark:text-[#B4B0A7] dark:bg-[rgba(180,176,167,0.1)] border-[#D4D1CA]/40";
      case "QUEUED":
        return "text-[#3F5B7A] bg-[#E8EFF6] dark:text-[#8FB2D6] dark:bg-[rgba(143,178,214,0.1)] border-[#3F5B7A]/30";
      case "SUCCEEDED":
      case "COMPLETED":
        return "text-[#1F7A4D] bg-[#E2F4EA] dark:text-[#5BD08C] dark:bg-[rgba(91,208,140,0.1)] border-[#1F7A4D]/30";
      case "FAILED":
        return "text-[#B42318] bg-[#FCEBEA] dark:text-[#F2786C] dark:bg-[rgba(242,120,108,0.1)] border-[#B42318]/30";
      case "UNKNOWN":
        return "text-[#5B5168] bg-[#EFEBF3] dark:text-[#B8A6CC] dark:bg-[rgba(184,166,204,0.1)] border-[#5B5168]/30 unknown-diagonal-hatch";
      default: // Running states like PREPROCESSING, RUNNING_TRANSFORMER, etc.
        return "text-[#0E6E8C] bg-[#DDF1F6] dark:text-[#5FC6DD] dark:bg-[rgba(95,198,221,0.1)] border-[#0E6E8C]/30 animate-pulse";
    }
  };

  // Map state to user friendly labels
  const getFriendlyStateLabel = (state: string) => {
    const mapping: Record<string, string> = {
      "RECEIVED": "Job Received",
      "AUTHORIZED": "Authorized",
      "DOWNLOADING_INPUT": "Downloading Video File",
      "VALIDATING": "Validating Content Integrity",
      "PREPROCESSING": "Extracting Audio/Video Frames",
      "ENCODING_VIDEO": "Running Video Encoder",
      "ENCODING_AUDIO": "Running Audio Encoder",
      "ENCODING_TEXT": "Running Text Encoder",
      "BUILDING_FUSED_INPUT": "Assembling Fused Sequence Tensor",
      "RUNNING_TRANSFORMER": "Executing TribeV2 Fusion Transformer",
      "EXPORTING_RAW_OUTPUTS": "Exporting Raw predictions.npy",
      "DECODING_HEADS": "Decoding Outcome Heads",
      "MAPPING_HCP": "Performing KDTree HCP-MMP1 Parcellation",
      "GENERATING_15_CLUSTER_OUTPUTS": "Aggregating 15-Cluster Model",
      "GENERATING_17_CLUSTER_OUTPUTS": "Aggregating 17-Cluster Model (A-Q)",
      "SCORING_MARKETING_OUTCOMES": "Calculating EP, VP, CS, BR Deterministic Scores",
      "RUNNING_LLM_EXPLANATION": "Compiling Creative Handoff & LLM Explanation",
      "PACKAGING_RESULTS": "Packaging Final Result ZIP Bundles",
      "UPLOADING_ARTIFACTS": "Uploading Artifacts to Secure Cloud",
      "COMPLETED": "Completed successfully",
      "FAILED": "Failed",
    };
    return mapping[state] || state;
  };

  return (
    <div className="min-h-screen bg-graphite-base text-graphite-primary flex flex-col justify-between font-sans">
      {/* Header */}
      <header className="border-b border-graphite-subtle py-4 px-6 md:px-12 flex justify-between items-center bg-graphite-raised">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-iris-primary flex items-center justify-center font-bold text-sm text-white tracking-wider">
            T2
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Tribe V2 Ad Scorer</h1>
            <p className="text-xs text-graphite-tertiary">Neuromarketing Creative Studio</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-graphite-secondary font-mono bg-graphite-sunken px-2.5 py-1 rounded-sm border border-graphite-subtle">
            WORKSPACE ID: {workspace?.id?.slice(0, 8)}...
          </span>
          <button className="px-3.5 py-1.5 text-xs font-semibold rounded-sm bg-graphite-sunken border border-graphite-subtle text-graphite-secondary hover:text-graphite-primary transition-colors">
            {workspace?.name || "Main Workspace"}
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Side: Jobs Table/List */}
        <main className="flex-1 p-6 md:p-8 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Scoring Job Repository</h2>
              <p className="text-xs text-graphite-secondary mt-0.5">Lineage and metrics record of creative tests</p>
            </div>
            <button
              onClick={() => setIsWizardOpen(true)}
              className="px-4 py-2 text-xs font-semibold rounded-sm bg-iris-primary text-white hover:bg-opacity-95 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>+</span> New Scorer Job
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-graphite-secondary text-sm">
              Loading workspace repository...
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex-1 border border-dashed border-graphite-subtle rounded-sm flex flex-col justify-center items-center p-12 text-center bg-graphite-raised/20">
              <span className="text-2xl text-graphite-tertiary mb-2">📁</span>
              <h3 className="text-sm font-semibold text-graphite-primary">No scoring jobs created</h3>
              <p className="text-xs text-graphite-secondary max-w-xs mt-1">
                Upload your first advertisement video to run fMRI mapping and outcomes scoring.
              </p>
              <button
                onClick={() => setIsWizardOpen(true)}
                className="mt-4 px-4 py-1.5 text-xs font-semibold rounded-sm bg-graphite-sunken border border-graphite-subtle text-graphite-secondary hover:text-graphite-primary"
              >
                Create Job
              </button>
            </div>
          ) : (
            <div className="border border-graphite-subtle bg-graphite-raised rounded-sm overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-graphite-sunken border-b border-graphite-subtle font-mono text-graphite-secondary">
                    <th className="p-3">Job ID</th>
                    <th className="p-3">Project / Video</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Mode</th>
                    <th className="p-3">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-graphite-subtle/50 text-graphite-secondary">
                  {jobs.map((job) => (
                    <tr
                      key={job.id}
                      onClick={() => handleSelectJob(job.id)}
                      className={`hover:bg-graphite-sunken/40 cursor-pointer transition-colors ${
                        selectedJobId === job.id ? "bg-graphite-sunken/80 text-graphite-primary" : ""
                      }`}
                    >
                      <td className="p-3 font-mono text-graphite-tertiary">
                        {job.id.slice(0, 8)}...
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-graphite-primary">
                          {job.input.project_name}
                        </div>
                        <div className="text-[10px] text-graphite-secondary">
                          {job.input.video_name}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-xs border text-[10px] uppercase font-mono ${getStatusPillClass(job.status)}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[10px]">
                        c_{job.input.cluster_mode} / {job.input.output_mode === "full_export" ? "full" : "score"}
                      </td>
                      <td className="p-3 font-mono text-graphite-tertiary">
                        {new Date(job.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>

        {/* Right Side: Sidebar Job Details */}
        <aside className="w-full lg:w-[500px] border-t lg:border-t-0 lg:border-l border-graphite-subtle bg-graphite-raised p-6 flex flex-col gap-6 overflow-y-auto max-h-[calc(100vh-73px)]">
          {selectedJob ? (
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-start border-b border-graphite-subtle pb-4">
                <div>
                  <span className="text-[10px] font-mono text-graphite-tertiary">JOB ID: {selectedJob.id}</span>
                  <h3 className="text-base font-bold tracking-tight text-graphite-primary">{selectedJob.input.project_name}</h3>
                  <p className="text-xs text-graphite-secondary mt-0.5">Asset: {selectedJob.input.video_name}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedJobId(null);
                    setSelectedJob(null);
                    setArtifacts(null);
                    setMarketingScores(null);
                    setExplanationReport(null);
                  }}
                  className="text-graphite-tertiary hover:text-graphite-primary text-sm font-mono"
                >
                  &times; Close
                </button>
              </div>

              {/* Status Section */}
              <div className="flex flex-col gap-2 bg-graphite-sunken p-4 border border-graphite-subtle rounded-sm">
                <span className="text-[10px] font-mono text-graphite-tertiary uppercase">State Monitor</span>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-xs border text-xs font-mono uppercase ${getStatusPillClass(selectedJob.status)}`}>
                    {selectedJob.status}
                  </span>
                  {selectedJob.status === "CREATED" && (
                    <button
                      onClick={() => handleStartJob(selectedJob.id)}
                      className="px-4 py-1 text-xs font-semibold rounded-sm bg-iris-primary text-white hover:bg-opacity-95 transition-all shadow-xs"
                    >
                      Start Execution
                    </button>
                  )}
                </div>
              </div>

              {/* Pipeline details or Artifact outputs */}
              {selectedJob.status === "COMPLETED" ? (
                <div className="flex flex-col gap-6">
                  {/* Outcomes Visualizer Grid */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-xs font-mono text-graphite-tertiary uppercase tracking-wider">Performance Outcomes</h4>
                    
                    {marketingScores ? (
                      <div className="grid grid-cols-2 gap-3">
                        {/* Engagement (EP) */}
                        <div className="p-3 bg-graphite-sunken border border-graphite-subtle rounded-sm flex flex-col justify-between gap-2">
                          <span className="text-[10px] font-mono text-graphite-tertiary uppercase">Emotional Pull (EP)</span>
                          <div className="flex items-end justify-between">
                            <span className="text-2xl font-bold tracking-tight text-white">
                              {marketingScores.outcomes["Engagement"]?.score_0_100}%
                            </span>
                            <span className="text-[10px] font-mono text-[#5BD08C] bg-[rgba(91,208,140,0.1)] px-1.5 py-0.5 rounded-xs border border-[#1F7A4D]/30">
                              EP
                            </span>
                          </div>
                          <div className="w-full bg-graphite-raised h-1 rounded-full overflow-hidden">
                            <div 
                              className="bg-iris-primary h-full rounded-full transition-all duration-1000" 
                              style={{ width: `${marketingScores.outcomes["Engagement"]?.score_0_100}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Virality (VP) */}
                        <div className="p-3 bg-graphite-sunken border border-graphite-subtle rounded-sm flex flex-col justify-between gap-2">
                          <span className="text-[10px] font-mono text-graphite-tertiary uppercase">Visual Pull (VP)</span>
                          <div className="flex items-end justify-between">
                            <span className="text-2xl font-bold tracking-tight text-white">
                              {marketingScores.outcomes["Virality"]?.score_0_100}%
                            </span>
                            <span className="text-[10px] font-mono text-[#8FB2D6] bg-[rgba(143,178,214,0.1)] px-1.5 py-0.5 rounded-xs border border-[#3F5B7A]/30">
                              VP
                            </span>
                          </div>
                          <div className="w-full bg-graphite-raised h-1 rounded-full overflow-hidden">
                            <div 
                              className="bg-iris-primary h-full rounded-full transition-all duration-1000" 
                              style={{ width: `${marketingScores.outcomes["Virality"]?.score_0_100}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Conversion (CS) */}
                        <div className="p-3 bg-graphite-sunken border border-graphite-subtle rounded-sm flex flex-col justify-between gap-2">
                          <span className="text-[10px] font-mono text-graphite-tertiary uppercase">Conversion Support</span>
                          <div className="flex items-end justify-between">
                            <span className="text-2xl font-bold tracking-tight text-white">
                              {marketingScores.outcomes["Conversion"]?.score_0_100}%
                            </span>
                            <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-xs border border-amber-400/30">
                              CS
                            </span>
                          </div>
                          <div className="w-full bg-graphite-raised h-1 rounded-full overflow-hidden">
                            <div 
                              className="bg-accent-creative h-full rounded-full transition-all duration-1000" 
                              style={{ 
                                width: `${marketingScores.outcomes["Conversion"]?.score_0_100}%`,
                                backgroundColor: "var(--accent-creative)" 
                              }}
                            ></div>
                          </div>
                        </div>

                        {/* Brand Recall (BR) */}
                        <div className="p-3 bg-graphite-sunken border border-graphite-subtle rounded-sm flex flex-col justify-between gap-2">
                          <span className="text-[10px] font-mono text-graphite-tertiary uppercase">Brand Recall</span>
                          <div className="flex items-end justify-between">
                            <span className="text-2xl font-bold tracking-tight text-white">
                              {marketingScores.outcomes["Brand Recall"]?.score_0_100}%
                            </span>
                            <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-xs border border-amber-400/30">
                              BR
                            </span>
                          </div>
                          <div className="w-full bg-graphite-raised h-1 rounded-full overflow-hidden">
                            <div 
                              className="bg-accent-creative h-full rounded-full transition-all duration-1000" 
                              style={{ 
                                width: `${marketingScores.outcomes["Brand Recall"]?.score_0_100}%`,
                                backgroundColor: "var(--accent-creative)" 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-graphite-tertiary font-mono">Loading outcomes scores...</div>
                    )}
                  </div>

                  {/* Navigation Tabs */}
                  <div className="border-b border-graphite-subtle flex gap-4 text-xs font-mono">
                    <button
                      onClick={() => setActiveTab("analysis")}
                      className={`pb-2 border-b-2 transition-all ${
                        activeTab === "analysis" ? "border-iris-primary text-white" : "border-transparent text-graphite-tertiary"
                      }`}
                    >
                      Narrative Analysis
                    </button>
                    <button
                      onClick={() => setActiveTab("clusters")}
                      className={`pb-2 border-b-2 transition-all ${
                        activeTab === "clusters" ? "border-iris-primary text-white" : "border-transparent text-graphite-tertiary"
                      }`}
                    >
                      Brain Clusters
                    </button>
                    <button
                      onClick={() => setActiveTab("downloads")}
                      className={`pb-2 border-b-2 transition-all ${
                        activeTab === "downloads" ? "border-iris-primary text-white" : "border-transparent text-graphite-tertiary"
                      }`}
                    >
                      Downloads
                    </button>
                  </div>

                  {/* Tab 1: Narrative Analysis (LLM report) */}
                  {activeTab === "analysis" && (
                    <div className="flex flex-col gap-4 text-xs">
                      {explanationReport ? (
                        <div className="flex flex-col gap-5">
                          {/* Conversion Block */}
                          <div>
                            <h5 className="font-bold text-white mb-1.5">Conversion Analysis</h5>
                            <p className="text-graphite-secondary leading-relaxed bg-graphite-sunken p-3 rounded-sm border border-graphite-subtle/50">
                              {explanationReport.conversion_analysis}
                            </p>
                          </div>

                          {/* Brand Recall Block */}
                          <div>
                            <h5 className="font-bold text-white mb-1.5">Brand Recall Analysis</h5>
                            <p className="text-graphite-secondary leading-relaxed bg-graphite-sunken p-3 rounded-sm border border-graphite-subtle/50">
                              {explanationReport.brand_recall_analysis}
                            </p>
                          </div>

                          {/* Action Items Recommendations checklist */}
                          <div>
                            <h5 className="font-bold text-white mb-1.5">Creative Optimization Actions</h5>
                            <div className="flex flex-col gap-2 bg-graphite-sunken/40 p-3 rounded-sm border border-graphite-subtle/30">
                              {explanationReport.recommendations?.map((rec: string, idx: number) => (
                                <label key={idx} className="flex gap-2.5 items-start cursor-pointer hover:text-white transition-colors">
                                  <input 
                                    type="checkbox" 
                                    className="mt-0.5 accent-iris-primary rounded-xs border-graphite-subtle"
                                  />
                                  <span className="text-[11px] text-graphite-secondary leading-relaxed">
                                    {rec}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-graphite-tertiary font-mono">Loading explanation report...</div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: 17 Brain Clusters */}
                  {activeTab === "clusters" && (
                    <div className="flex flex-col gap-4">
                      <h5 className="text-xs font-mono text-graphite-tertiary uppercase">17 A-Q Cortical Cluster Strength</h5>
                      
                      {marketingScores ? (
                        <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1">
                          {Object.entries(marketingScores.clusters).map(([key, cluster]: any) => {
                            const strength = cluster.strength_0_1 || 0.0;
                            const isStrong = strength >= 0.75;
                            const isSuppressed = strength <= 0.3;
                            
                            let barColor = "bg-graphite-subtle";
                            if (isStrong) barColor = "bg-[var(--accent-creative)]";
                            else if (!isSuppressed) barColor = "bg-[var(--interactive-primary-bg)]";

                            return (
                              <div key={key} className="p-3 bg-graphite-sunken/50 border border-graphite-subtle/50 rounded-sm flex flex-col gap-1.5 hover:bg-graphite-sunken transition-colors">
                                <div className="flex justify-between items-center text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-xs bg-graphite-sunken border border-graphite-subtle flex items-center justify-center font-bold font-mono text-[10px] text-white">
                                      {key}
                                    </span>
                                    <span className="font-semibold text-graphite-primary truncate max-w-[240px]" title={cluster.cluster_name}>
                                      {cluster.cluster_name}
                                    </span>
                                  </div>
                                  <span className="font-mono text-[10px] text-graphite-secondary font-bold">
                                    {strength.toFixed(3)}
                                  </span>
                                </div>
                                <div className="w-full bg-graphite-sunken h-1.5 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${strength * 100}%` }}></div>
                                </div>
                                <div className="text-[10px] text-graphite-tertiary leading-relaxed mt-0.5">
                                  {cluster.psychological_proxy}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-xs text-graphite-tertiary font-mono">Loading cluster data...</div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: Downloads */}
                  {activeTab === "downloads" && artifacts && (
                    <div className="flex flex-col gap-4">
                      <h5 className="text-xs font-mono text-graphite-tertiary uppercase">Result Packages & Raw Data</h5>
                      
                      <div className="flex flex-col gap-3">
                        {/* ZIP Bundles (Primary call-to-actions) */}
                        <div className="p-4 bg-[rgba(93,95,239,0.06)] border border-iris-primary/30 rounded-sm flex flex-col gap-2">
                          <h6 className="font-bold text-white text-xs">Full Result Bundle (ZIP)</h6>
                          <p className="text-[10px] text-graphite-secondary leading-relaxed">
                            Contains original video, preprocessed audios, cortex activations CSV, outcomes JSON, and the explanation report.
                          </p>
                          {artifacts["full_result_bundle.zip"] ? (
                            <a
                              href={artifacts["full_result_bundle.zip"].url}
                              className="mt-1 px-3 py-1.5 text-center text-xs font-semibold rounded-sm bg-iris-primary text-white hover:bg-opacity-95 transition-all inline-block shadow-xs"
                            >
                              Download Full Result Bundle
                            </a>
                          ) : null}
                        </div>

                        <div className="p-4 bg-graphite-sunken border border-graphite-subtle rounded-sm flex flex-col gap-2">
                          <h6 className="font-bold text-white text-xs">Training-Ready Bundle (ZIP)</h6>
                          <p className="text-[10px] text-graphite-secondary leading-relaxed">
                            Contains original video file, modality features (.pt), and rawpredictions.npy for downstream model training.
                          </p>
                          {artifacts["training_ready_bundle.zip"] ? (
                            <a
                              href={artifacts["training_ready_bundle.zip"].url}
                              className="mt-1 px-3 py-1.5 text-center text-xs font-semibold rounded-sm bg-graphite-sunken border border-graphite-subtle text-graphite-secondary hover:text-graphite-primary hover:border-graphite-strong transition-all inline-block"
                            >
                              Download Training Bundle
                            </a>
                          ) : null}
                        </div>

                        {/* Individual Raw files */}
                        <div className="flex flex-col gap-1.5 mt-2">
                          <span className="text-[10px] font-mono text-graphite-tertiary uppercase">Individual Data Files</span>
                          <div className="flex flex-col gap-1.5 border border-graphite-subtle rounded-sm overflow-hidden divide-y divide-graphite-subtle/50 text-xs">
                            {Object.entries(artifacts)
                              .filter(([name]) => !name.endsWith(".zip"))
                              .map(([name, art]: any) => (
                                <div key={name} className="flex justify-between items-center p-2.5 bg-graphite-sunken hover:bg-graphite-raised transition-colors">
                                  <span className="font-mono text-[10px] text-graphite-secondary truncate max-w-[280px]" title={name}>
                                    {name}
                                  </span>
                                  <a
                                    href={art.url}
                                    className="text-[10px] text-iris-primary hover:underline font-bold font-mono"
                                  >
                                    Download
                                  </a>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : selectedJob.status === "FAILED" ? (
                <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-sm text-xs text-rose-500">
                  <h4 className="font-bold mb-1">Execution Failure</h4>
                  <p className="leading-relaxed">
                    {selectedJob.error_message || "An error occurred during the GPU pipeline run."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  <h4 className="text-xs font-mono text-graphite-tertiary uppercase tracking-wider">GPU Pipeline Progress</h4>
                  
                  {/* Stepper progress indicator */}
                  <div className="flex flex-col gap-4 bg-graphite-sunken p-4 border border-graphite-subtle rounded-sm">
                    <div className="flex items-center gap-3">
                      <svg className="animate-spin h-4 w-4 text-iris-primary" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <div>
                        <span className="text-xs font-bold text-white font-mono uppercase animate-pulse">
                          {selectedJob.status}...
                        </span>
                        <p className="text-[10px] text-graphite-secondary mt-0.5">
                          {getFriendlyStateLabel(selectedJob.status)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-graphite-secondary leading-relaxed flex flex-col gap-2">
                    <p>
                      The Vast.ai GPU host is executing the TribeV2 creative brain parcellation pipeline.
                    </p>
                    <p className="text-[10px] text-graphite-tertiary font-mono">
                      State updates are automatically pushed from the database listener.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-12 text-graphite-secondary">
              <span className="text-3xl text-graphite-tertiary/40 mb-3">🔍</span>
              <p className="text-sm font-semibold text-graphite-primary">No job selected</p>
              <p className="text-xs text-graphite-tertiary max-w-[240px] mt-1">
                Select a job from the repository list to view pipeline state metrics and download artifacts.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Footer */}
      <footer className="border-t border-graphite-subtle py-4 px-6 text-center bg-graphite-raised text-[10px] text-graphite-tertiary font-mono">
        TribeV2 Neuromarketing Scorer V2 • System Database connected
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
    </div>
  );
}
