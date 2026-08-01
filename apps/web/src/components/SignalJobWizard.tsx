"use client";

import React, { useState } from "react";

interface SignalJobWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: (jobId: string) => void;
}

// Minimal inline icon set (monochrome, currentColor). No external dependency.
type IconProps = React.SVGProps<SVGSVGElement>;
const IconClose = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" {...p}><path d="m5 5 10 10M15 5 5 15" /></svg>
);
const IconAlert = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M10 3 1.5 17.5h17L10 3Z" /><path d="M10 8v4M10 15h.01" /></svg>
);
const IconUpload = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M10 13V3m0 0L6.5 6.5M10 3l3.5 3.5" /><path d="M3.5 13v3a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-3" /></svg>
);
const IconImage = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2.5" y="3.5" width="15" height="13" rx="2" /><circle cx="7" cy="8" r="1.5" /><path d="m3 14 4-4 3 2.5 3-3 4 4.5" /></svg>
);
const IconVideo = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2.5" y="4.5" width="11" height="11" rx="2" /><path d="m13.5 8 4-2.2v8.4l-4-2.2" /></svg>
);
const IconLayers = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m10 2 8 4.5-8 4.5-8-4.5L10 2Z" /><path d="m2 10 8 4.5 8-4.5" /><path d="m2 14 8 4.5 8-4.5" /></svg>
);

const Spinner = ({ className = "" }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const MODE_OPTIONS = [
  { key: "STATIC_STANDARD", label: "Static ad", desc: "Single image OCR, visual rules and GPT", Icon: IconImage },
  { key: "VIDEO_STANDARD", label: "Video standard", desc: "Video OCR, Groq STT, YAMNet and timeline", Icon: IconVideo },
  { key: "FULL_WITH_TRIBEV2", label: "Full + TribeV2", desc: "GPU transformer, 17-cluster and neuro scores", Icon: IconLayers },
] as const;

export default function SignalJobWizard({ isOpen, onClose, onJobCreated }: SignalJobWizardProps) {
  const [mode, setMode] = useState<"STATIC_STANDARD" | "VIDEO_STANDARD" | "FULL_WITH_TRIBEV2">("STATIC_STANDARD");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [brandName, setBrandName] = useState("");
  const [targetPlatform, setTargetPlatform] = useState("INSTAGRAM_REELS");
  const [placement, setPlacement] = useState("REEL");
  const [creativeGoal, setCreativeGoal] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o");

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
          selectedModel: selectedModel.trim() || "gpt-4o",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0A09]/80 p-4">
      <div className="bg-graphite-sunken border border-graphite-subtle rounded-md w-full max-w-2xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.7)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-graphite-subtle bg-[#121110]">
          <div>
            <h2 className="text-lg font-semibold text-graphite-primary tracking-tight">New creative analysis</h2>
            <p className="text-sm text-graphite-tertiary mt-0.5">Upload static image or video creative for pre-flight diagnosis</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-graphite-tertiary hover:text-graphite-primary transition-colors p-1 rounded-md hover:bg-[#1A1815]"
          >
            <IconClose className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-3 bg-[rgba(242,120,108,0.08)] border border-[#F2786C]/30 rounded-md text-[#F2786C] text-sm flex items-start gap-2" role="alert">
              <IconAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-graphite-tertiary mb-2 uppercase tracking-wider">
              Analysis mode
            </label>
            <div className="grid grid-cols-3 gap-3">
              {MODE_OPTIONS.map(({ key, label, desc, Icon }) => {
                const selected = mode === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMode(key)}
                    aria-pressed={selected}
                    className={`p-3.5 rounded-md border text-left transition-colors flex flex-col gap-2 ${
                      selected
                        ? "border-iris-primary bg-iris-primary/10 text-graphite-primary"
                        : "border-graphite-subtle bg-[#121110] text-graphite-tertiary hover:border-graphite-strong hover:text-graphite-secondary"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${selected ? "text-iris-primary" : "text-graphite-tertiary"}`} />
                    <div className="text-sm font-semibold">{label}</div>
                    <div className="text-xs text-graphite-tertiary leading-relaxed">{desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* File Upload Drop Area */}
          <div>
            <label className="block text-xs font-semibold text-graphite-tertiary mb-2 uppercase tracking-wider">
              Creative media file
            </label>
            <div className="relative border-2 border-dashed border-graphite-strong rounded-md p-6 text-center hover:border-iris-primary transition-colors bg-[#121110] group">
              <input
                type="file"
                accept={mode === "STATIC_STANDARD" ? "image/jpeg,image/png,image/webp" : "video/mp4,video/quicktime,video/webm,image/jpeg,image/png"}
                onChange={handleFileSelect}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                aria-label="Upload creative media file"
              />
              <div className="space-y-2">
                <div className={`flex justify-center transition-colors ${file ? "text-iris-primary" : "text-graphite-tertiary group-hover:text-iris-primary"}`}>
                  <IconUpload className="w-8 h-8" />
                </div>
                {file ? (
                  <div>
                    <p className="text-sm font-semibold text-iris-primary">{file.name}</p>
                    <p className="text-xs text-graphite-tertiary font-mono">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-graphite-secondary">
                      Drag and drop your creative file here, or <span className="text-iris-primary underline">browse</span>
                    </p>
                    <p className="text-xs text-graphite-tertiary mt-1">Supports MP4, MOV, WebM, JPEG, PNG up to 500MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* OpenAI Model Selection */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm text-graphite-tertiary">OpenAI Vision Model</label>
              <span className="text-xs text-iris-primary font-mono">Dynamic Selection</span>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="e.g. gpt-4o, gpt-5.6-sol, gpt-4.5-preview"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 bg-[#121110] border border-graphite-subtle rounded-md text-sm font-mono text-graphite-primary placeholder-[#615D55] focus:outline-none focus:border-iris-primary focus:ring-1 focus:ring-iris-primary transition-colors"
              />
              <div className="flex gap-2 flex-wrap">
                {["gpt-4o", "gpt-5.6-sol", "gpt-4.5-preview", "gpt-4o-mini"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedModel(m)}
                    className={`text-xs px-2.5 py-1 rounded border font-mono transition-colors ${
                      selectedModel === m
                        ? "bg-iris-primary/20 border-iris-primary text-iris-primary font-semibold"
                        : "bg-[#121110] border-graphite-subtle text-graphite-tertiary hover:border-graphite-strong hover:text-graphite-secondary"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Campaign Context Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-graphite-tertiary mb-1">Brand name (optional)</label>
              <input
                type="text"
                placeholder="e.g. Acme Health"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full px-3 py-2 bg-[#121110] border border-graphite-subtle rounded-md text-sm text-graphite-primary placeholder-[#615D55] focus:outline-none focus:border-iris-primary focus:ring-1 focus:ring-iris-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-graphite-tertiary mb-1">Target platform</label>
              <select
                value={targetPlatform}
                onChange={(e) => setTargetPlatform(e.target.value)}
                className="w-full px-3 py-2 bg-[#121110] border border-graphite-subtle rounded-md text-sm text-graphite-primary focus:outline-none focus:border-iris-primary transition-colors"
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
            <label className="block text-sm text-graphite-tertiary mb-1">Creative goal / offer (optional)</label>
            <input
              type="text"
              placeholder="e.g. 50% off summer sale CTA with free shipping"
              value={creativeGoal}
              onChange={(e) => setCreativeGoal(e.target.value)}
              className="w-full px-3 py-2 bg-[#121110] border border-graphite-subtle rounded-md text-sm text-graphite-primary placeholder-[#615D55] focus:outline-none focus:border-iris-primary focus:ring-1 focus:ring-iris-primary transition-colors"
            />
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-iris-primary font-mono">
                <span>Uploading media to secure storage…</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-[#121110] rounded-full h-2 overflow-hidden border border-graphite-subtle">
                <div
                  className="bg-iris-primary h-full transition-all duration-300 ease-out"
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
              className="px-4 py-2 text-sm text-graphite-tertiary hover:text-graphite-primary transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="px-6 py-2.5 bg-iris-primary hover:brightness-110 disabled:opacity-50 text-white font-semibold text-sm rounded-md transition-all disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploading && <Spinner className="h-4 w-4" />}
              {uploading ? "Uploading and creating…" : "Start analysis"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}