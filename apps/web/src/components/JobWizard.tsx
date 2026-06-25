"use client";

import React, { useState } from "react";

interface JobWizardProps {
  onJobCreated: () => void;
  onClose: () => void;
}

export default function JobWizard({ onJobCreated, onClose }: JobWizardProps) {
  const [projectName, setProjectName] = useState("");
  const [videoName, setVideoName] = useState("");
  const [clusterMode, setClusterMode] = useState("both");
  const [outputMode, setOutputMode] = useState("full_export");
  const [runLlm, setRunLlm] = useState(true);

  // Upload states
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<"idle" | "requesting" | "uploading" | "scanning" | "clean" | "error">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setVideoName(e.target.files[0].name.split(".")[0]);
      setUploadState("idle");
    }
  };

  const handleStartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName || !file) return;

    try {
      // 1. Create Job record
      setUploadState("requesting");
      const jobResponse = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_name: projectName,
          video_name: videoName,
          video_object_key: `uploads/temp/${file.name}`, // will be overridden by direct upload
          cluster_mode: clusterMode,
          output_mode: outputMode,
          run_llm_explanation: runLlm,
        }),
      });

      if (!jobResponse.ok) {
        throw new Error("Failed to initialize job record");
      }

      const { job } = await jobResponse.json();
      const job_id = job.id;

      // 2. Request upload URL
      const urlResponse = await fetch(`/api/jobs/${job_id}/upload-url`, { method: "POST" });
      if (!urlResponse.ok) throw new Error("Failed to get presigned upload URL");
      const { uploadUrl, objectKey } = await urlResponse.json();

      // 3. Upload file (PUT)
      setUploadState("uploading");
      setUploadProgress(0);

      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          // 4. Simulate quarantine scanning (F3 trust boundary)
          setUploadState("scanning");
          setTimeout(async () => {
            setUploadState("clean");
            
            // 5. Trigger GPU processing
            try {
              const startResponse = await fetch(`/api/jobs/${job_id}/start`, { method: "POST" });
              if (!startResponse.ok) throw new Error("Failed to trigger GPU worker");
              
              onJobCreated();
              onClose();
            } catch (err: any) {
              setUploadState("error");
              setErrorMsg(err.message || "Failed to start processing job");
            }
          }, 1500);
        } else {
          setUploadState("error");
          setErrorMsg("Failed to upload binary file to storage simulator");
        }
      };

      xhr.onerror = () => {
        setUploadState("error");
        setErrorMsg("Network error during upload");
      };

      xhr.send(file);
    } catch (err: any) {
      setUploadState("error");
      setErrorMsg(err.message || "Unexpected failure during job creation");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-graphite-raised border border-graphite-strong rounded-sm p-6 flex flex-col gap-6 shadow-xl">
        <div className="flex justify-between items-center border-b border-graphite-subtle pb-3">
          <h3 className="text-lg font-bold tracking-tight">Create Scoring Job</h3>
          <button onClick={onClose} className="text-graphite-tertiary hover:text-graphite-primary text-lg">
            &times;
          </button>
        </div>

        <form onSubmit={handleStartSubmit} className="flex flex-col gap-4 text-sm">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-graphite-tertiary uppercase">Project Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Mantri Square Campaign"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="px-3 py-2 bg-graphite-sunken border border-graphite-subtle rounded-sm text-graphite-primary focus:outline-none focus:border-iris-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-graphite-tertiary uppercase">Multimodal Video File</label>
            <input
              type="file"
              required
              accept="video/*"
              onChange={handleFileChange}
              className="block w-full text-xs text-graphite-tertiary file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border file:border-graphite-subtle file:bg-graphite-sunken file:text-graphite-secondary file:hover:text-graphite-primary hover:file:bg-graphite-raised"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-graphite-tertiary uppercase">Cluster Model</label>
              <select
                value={clusterMode}
                onChange={(e) => setClusterMode(e.target.value)}
                className="px-3 py-2 bg-graphite-sunken border border-graphite-subtle rounded-sm text-graphite-primary focus:outline-none focus:border-iris-primary"
              >
                <option value="15">15 Clusters</option>
                <option value="17">17 Clusters (A-Q)</option>
                <option value="both">Both Architectures</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-graphite-tertiary uppercase">Output Mode</label>
              <select
                value={outputMode}
                onChange={(e) => setOutputMode(e.target.value)}
                className="px-3 py-2 bg-graphite-sunken border border-graphite-subtle rounded-sm text-graphite-primary focus:outline-none focus:border-iris-primary"
              >
                <option value="scoring_only">Scoring Only</option>
                <option value="full_export">Full Export</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="runLlm"
              checked={runLlm}
              onChange={(e) => setRunLlm(e.target.checked)}
              className="w-4 h-4 accent-iris-primary"
            />
            <label htmlFor="runLlm" className="text-graphite-secondary">Run LLM Explanation Report</label>
          </div>

          {/* Upload Progress/Status Overlay */}
          {uploadState !== "idle" && (
            <div className="bg-graphite-sunken p-4 border border-graphite-subtle rounded-sm flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-graphite-tertiary uppercase">Status: {uploadState}</span>
                {uploadState === "uploading" && <span className="text-graphite-secondary">{uploadProgress}%</span>}
              </div>
              
              {uploadState === "uploading" && (
                <div className="w-full bg-graphite-raised h-1.5 rounded-full overflow-hidden">
                  <div className="bg-iris-primary h-full transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              )}

              {uploadState === "scanning" && (
                <div className="flex items-center gap-2 text-xs text-amber-500 font-mono">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Quarantine analysis in progress...</span>
                </div>
              )}

              {uploadState === "clean" && (
                <div className="text-xs text-emerald-500 font-mono flex items-center gap-1.5">
                  <span>✓</span> File scanned & verified. Handoff to GPU...
                </div>
              )}

              {uploadState === "error" && (
                <div className="text-xs text-rose-500 font-mono">
                  Error: {errorMsg}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-graphite-subtle pt-4 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={uploadState === "uploading" || uploadState === "scanning"}
              className="px-4 py-2 text-xs font-semibold rounded-sm bg-graphite-sunken border border-graphite-subtle text-graphite-secondary hover:text-graphite-primary transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!projectName || !file || uploadState === "uploading" || uploadState === "scanning"}
              className="px-5 py-2 text-xs font-semibold rounded-sm bg-iris-primary text-white hover:bg-opacity-95 transition-all disabled:opacity-50"
            >
              Submit & Score
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
