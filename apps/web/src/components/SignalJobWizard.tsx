"use client";

import React, { useState } from "react";

interface SignalJobWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: (jobId: string) => void;
}

export default function SignalJobWizard({ isOpen, onClose, onJobCreated }: SignalJobWizardProps) {
  const [mode, setMode] = useState<"STATIC_STANDARD" | "VIDEO_STANDARD" | "FULL_WITH_TRIBEV2">("STATIC_STANDARD");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [brandName, setBrandName] = useState("");
  const [targetPlatform, setTargetPlatform] = useState("INSTAGRAM_REELS");
  const [placement, setPlacement] = useState("REEL");
  const [creativeGoal, setCreativeGoal] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);

      // Auto-detect mode based on file type
      if (selected.type.startsWith("image/")) {
        setMode("STATIC_STANDARD");
      } else if (selected.type.startsWith("video/")) {
        if (mode === "STATIC_STANDARD") {
          setMode("VIDEO_STANDARD");
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a creative media file to upload.");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setUploadProgress(10);

      const mediaType = file.type.startsWith("video/") ? "video" : "image";

      // 1. Request presigned upload URL
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || (mediaType === "video" ? "video/mp4" : "image/jpeg"),
          byteSize: file.size,
          mediaType,
        }),
      });

      if (!presignRes.ok) {
        const errJson = await presignRes.json();
        throw new Error(errJson.error || "Failed to get presigned upload URL");
      }

      const { uploadUrl, artifactId, objectKey } = await presignRes.json();
      setUploadProgress(40);

      // 2. Upload file payload via same-origin upload proxy endpoint
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || (mediaType === "video" ? "video/mp4" : "image/jpeg"),
        },
        body: file,
      });

      if (!uploadRes.ok) {
        const errJson = await uploadRes.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to upload creative file to storage.");
      }

      setUploadProgress(80);

      // 3. Create Analysis Job in DB
      const createJobRes = await fetch("/api/analysis/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          inputArtifactId: artifactId,
          inputObjectKey: objectKey,
          mediaType,
          title: title || `${brandName || "Ad"} ${mediaType === "video" ? "Video" : "Static"} Analysis`,
          brandName,
          targetPlatform,
          placement,
          creativeGoal,
        }),
      });

      if (!createJobRes.ok) {
        const errJson = await createJobRes.json();
        throw new Error(errJson.error || "Failed to create analysis job");
      }

      const { job } = await createJobRes.json();
      setUploadProgress(100);

      onJobCreated(job.id);
      onClose();
    } catch (err: any) {
      console.error("[JOB_WIZARD_ERROR]", err);
      setError(err.message || "An unexpected error occurred during submission.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400">✨</span> New Creative Analysis
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Upload static image or video creative for pre-flight diagnosis</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-sm">
              🚨 {error}
            </div>
          )}

          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select Analysis Mode
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setMode("STATIC_STANDARD")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  mode === "STATIC_STANDARD"
                    ? "border-indigo-500 bg-indigo-950/40 text-white shadow-lg shadow-indigo-500/10"
                    : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                <div className="text-base font-semibold">🖼️ Static Ad</div>
                <div className="text-[11px] text-slate-400 mt-1">Single image OCR, visual rules & GPT</div>
              </button>

              <button
                type="button"
                onClick={() => setMode("VIDEO_STANDARD")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  mode === "VIDEO_STANDARD"
                    ? "border-indigo-500 bg-indigo-950/40 text-white shadow-lg shadow-indigo-500/10"
                    : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                <div className="text-base font-semibold">🎥 Video Standard</div>
                <div className="text-[11px] text-slate-400 mt-1">Video OCR, Groq STT, YAMNet & timeline</div>
              </button>

              <button
                type="button"
                onClick={() => setMode("FULL_WITH_TRIBEV2")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  mode === "FULL_WITH_TRIBEV2"
                    ? "border-purple-500 bg-purple-950/40 text-white shadow-lg shadow-purple-500/10"
                    : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                <div className="text-base font-semibold">🚀 Full + TribeV2</div>
                <div className="text-[11px] text-slate-400 mt-1">GPU Transformer, 17-Cluster & Neuro Scores</div>
              </button>
            </div>
          </div>

          {/* File Upload Drop Area */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Creative Media File
            </label>
            <div className="relative border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:border-indigo-500/80 transition-colors bg-slate-950/30 group">
              <input
                type="file"
                accept={mode === "STATIC_STANDARD" ? "image/jpeg,image/png,image/webp" : "video/mp4,video/quicktime,video/webm,image/jpeg,image/png"}
                onChange={handleFileSelect}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              <div className="space-y-2">
                <div className="text-3xl text-slate-400 group-hover:scale-110 transition-transform duration-200">
                  {file ? (file.type.startsWith("video/") ? "🎬" : "📸") : "☁️"}
                </div>
                {file ? (
                  <div>
                    <p className="text-sm font-semibold text-indigo-300">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-slate-300 font-medium">
                      Drag & drop your creative file here, or <span className="text-indigo-400 underline">browse</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Supports MP4, MOV, WebM, JPEG, PNG up to 500MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Campaign Context Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Brand Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Acme Health"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Target Platform</label>
              <select
                value={targetPlatform}
                onChange={(e) => setTargetPlatform(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="INSTAGRAM_REELS">Instagram Reels</option>
                <option value="META">Meta Feed</option>
                <option value="YOUTUBE">YouTube Shorts</option>
                <option value="TIKTOK">TikTok</option>
                <option value="LINKEDIN">LinkedIn</option>
                <option value="GENERIC">Generic Social</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Creative Goal / Offer (Optional)</label>
            <input
              type="text"
              placeholder="e.g. 50% Off Summer Sale CTA with free shipping"
              value={creativeGoal}
              onChange={(e) => setCreativeGoal(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-indigo-300">
                <span>Uploading media to secure storage...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/25"
            >
              {uploading ? "Uploading & Creating..." : "Start Analysis ✨"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
