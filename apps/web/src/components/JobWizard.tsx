"use client";

import React, { useState, useRef } from "react";

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
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(""); // MB/s or KB/s
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadStartTime = useRef<number>(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setVideoName(selectedFile.name.split(".")[0]);
      setUploadState("idle");
      setUploadProgress(0);
      setUploadedBytes(0);
      setTotalBytes(selectedFile.size);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
          video_object_key: `uploads/temp/${file.name}`,
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
      const { uploadUrl } = await urlResponse.json();

      // 3. Upload file (PUT)
      setUploadState("uploading");
      setUploadProgress(0);
      uploadStartTime.current = Date.now();

      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
          setUploadedBytes(event.loaded);
          setTotalBytes(event.total);

          // Calculate upload speed
          const elapsedSeconds = (Date.now() - uploadStartTime.current) / 1000;
          if (elapsedSeconds > 0) {
            const bytesPerSecond = event.loaded / elapsedSeconds;
            if (bytesPerSecond > 1024 * 1024) {
              setUploadSpeed(`${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`);
            } else {
              setUploadSpeed(`${(bytesPerSecond / 1024).toFixed(0)} KB/s`);
            }
          }
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
          }, 1800);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-[#161512]/95 border border-[#2E2B26] rounded-md p-6 flex flex-col gap-6 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-iris-500/5 rounded-full filter blur-[40px] pointer-events-none" />
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#2E2B26] pb-4">
          <div>
            <h3 className="text-base font-bold tracking-tight text-[#F3F2EF]">Create Scoring Job</h3>
            <p className="text-[11px] text-graphite-secondary mt-0.5">Upload advertisement video for neuromarketing analysis</p>
          </div>
          <button 
            onClick={onClose} 
            disabled={uploadState === "uploading" || uploadState === "scanning"}
            className="text-graphite-tertiary hover:text-graphite-primary text-xl font-mono p-1 transition-colors disabled:opacity-30"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleStartSubmit} className="flex flex-col gap-5 text-xs">
          {/* Project Name input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono text-graphite-tertiary uppercase tracking-wider">Project / Campaign Name</label>
            <input
              type="text"
              required
              disabled={uploadState !== "idle" && uploadState !== "error"}
              placeholder="e.g. Mantri Square Launch Campaign"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="px-3.5 py-2.5 bg-graphite-sunken border border-graphite-subtle rounded text-[#F3F2EF] placeholder-[#615D55] focus:outline-none focus:border-iris-primary focus:ring-1 focus:ring-iris-primary transition-all disabled:opacity-50 font-sans"
            />
          </div>

          {/* Media File Upload area */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono text-graphite-tertiary uppercase tracking-wider">Multimodal Video File (9:16 Recommended)</label>
            <input
              type="file"
              ref={fileInputRef}
              required={!file}
              accept="video/*"
              onChange={handleFileChange}
              disabled={uploadState !== "idle" && uploadState !== "error"}
              className="hidden"
            />
            
            {!file ? (
              <div 
                onClick={triggerFileSelect}
                className="border border-dashed border-[#46433C] hover:border-iris-primary/70 bg-[#121110] rounded p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
              >
                {/* Visual 9:16 frame logo with Ember spark */}
                <div className="w-12 h-16 rounded border-2 border-graphite-secondary group-hover:border-iris-primary flex items-center justify-center relative p-1.5 transition-all">
                  <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-ember-creative absolute right-2 top-[calc(50%-5px)] transform translate-x-1/2 group-hover:scale-110 transition-transform" />
                  <span className="text-[8px] font-mono text-graphite-tertiary group-hover:text-iris-primary transition-colors">9:16</span>
                </div>
                <div>
                  <p className="font-semibold text-graphite-secondary group-hover:text-graphite-primary transition-colors">Click to select MP4 ad video</p>
                  <p className="text-[10px] text-graphite-tertiary mt-1">Accepts standard video formats up to 200MB</p>
                </div>
              </div>
            ) : (
              <div className="border border-[#2E2B26] bg-[#121110] rounded p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-graphite-sunken border border-graphite-subtle rounded flex items-center justify-center text-lg shrink-0">
                    🎬
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#F3F2EF] truncate" title={file.name}>{file.name}</p>
                    <p className="text-[10px] text-graphite-secondary font-mono">{formatSize(file.size)}</p>
                  </div>
                </div>
                {(uploadState === "idle" || uploadState === "error") && (
                  <button
                    type="button"
                    onClick={triggerFileSelect}
                    className="text-[10px] font-semibold text-iris-primary hover:underline"
                  >
                    Change file
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Model options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono text-graphite-tertiary uppercase tracking-wider">Cluster Model</label>
              <div className="relative">
                <select
                  value={clusterMode}
                  disabled={uploadState !== "idle" && uploadState !== "error"}
                  onChange={(e) => setClusterMode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-graphite-sunken border border-graphite-subtle rounded text-[#F3F2EF] focus:outline-none focus:border-iris-primary appearance-none disabled:opacity-50 cursor-pointer font-sans"
                >
                  <option value="15">15 Clusters (Default)</option>
                  <option value="17">17 Clusters (A-Q)</option>
                  <option value="both">Both Architectures</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-graphite-secondary">
                  ▼
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono text-graphite-tertiary uppercase tracking-wider">Output Mode</label>
              <div className="relative">
                <select
                  value={outputMode}
                  disabled={uploadState !== "idle" && uploadState !== "error"}
                  onChange={(e) => setOutputMode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-graphite-sunken border border-graphite-subtle rounded text-[#F3F2EF] focus:outline-none focus:border-iris-primary appearance-none disabled:opacity-50 cursor-pointer font-sans"
                >
                  <option value="full_export">Full Export Bundle</option>
                  <option value="scoring_only">Scoring Outcomes Only</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-graphite-secondary">
                  ▼
                </div>
              </div>
            </div>
          </div>

          {/* Toggle LLM */}
          <div className="flex items-center gap-2.5 py-1">
            <label className="relative flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="runLlm"
                checked={runLlm}
                disabled={uploadState !== "idle" && uploadState !== "error"}
                onChange={(e) => setRunLlm(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-graphite-sunken rounded-full peer peer-focus:ring-1 peer-focus:ring-iris-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#B4B0A7] after:border-[#2e2b26] after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:bg-white peer-checked:bg-iris-primary transition-colors duration-200"></div>
              <span className="ml-2 text-graphite-secondary select-none">Compile Creative Handoff & LLM Explanation</span>
            </label>
          </div>

          {/* Upload Progress/Status Screen */}
          {uploadState !== "idle" && (
            <div className="bg-[#121110] p-4 border border-[#2E2B26] rounded flex flex-col gap-3 relative overflow-hidden">
              {/* If scanning, display moving green scanner bar overlay */}
              {uploadState === "scanning" && (
                <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-[scanline_1.8s_ease-in-out_infinite] z-10" />
              )}

              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-graphite-tertiary uppercase tracking-wider">Status: {uploadState}</span>
                {uploadState === "uploading" && (
                  <span className="text-graphite-secondary font-mono">{uploadProgress}%</span>
                )}
              </div>
              
              {uploadState === "uploading" && (
                <div className="flex flex-col gap-2">
                  <div className="w-full bg-graphite-sunken h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-iris-primary h-full rounded-full transition-all duration-200" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-graphite-tertiary font-mono">
                    <span>{formatSize(uploadedBytes)} / {formatSize(totalBytes)}</span>
                    <span className="text-iris-primary">{uploadSpeed}</span>
                  </div>
                </div>
              )}

              {uploadState === "requesting" && (
                <div className="flex items-center gap-2 text-graphite-secondary font-mono">
                  <svg className="animate-spin h-3.5 w-3.5 text-iris-primary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Securing workspace lease...</span>
                </div>
              )}

              {uploadState === "scanning" && (
                <div className="flex items-center gap-2 text-emerald-500 font-mono animate-pulse">
                  <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25 stroke-emerald-900" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Performing binary quarantine scanner analysis...</span>
                </div>
              )}

              {uploadState === "clean" && (
                <div className="text-[#5BD08C] font-mono flex items-center gap-2">
                  <span>✓</span>
                  <span>File verified clean. Launching GPU processing node...</span>
                </div>
              )}

              {uploadState === "error" && (
                <div className="text-[#F2786C] font-mono flex flex-col gap-1">
                  <span className="font-bold uppercase text-[9px] tracking-wide">Error Details:</span>
                  <span className="leading-relaxed">{errorMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 border-t border-[#2E2B26] pt-4 mt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={uploadState === "uploading" || uploadState === "scanning"}
              className="px-4 py-2 text-xs font-semibold rounded bg-graphite-sunken border border-graphite-subtle text-graphite-secondary hover:text-graphite-primary transition-all disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!projectName || !file || uploadState === "uploading" || uploadState === "scanning"}
              className="px-5 py-2 text-xs font-semibold rounded bg-iris-primary text-white hover:brightness-110 transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(101,87,245,0.2)]"
            >
              Submit & Score
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
