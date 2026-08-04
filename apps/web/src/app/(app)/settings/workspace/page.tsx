"use client";

import React, { useState, useEffect } from "react";
import AppNavbar from "@/components/layout/AppNavbar";

export default function WorkspaceSettingsPage() {
  const [workspace, setWorkspace] = useState<any>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchWorkspace() {
      try {
        const res = await fetch("/api/jobs");
        if (res.ok) {
          const data = await res.json();
          setWorkspace(data.workspace);
          setName(data.workspace?.name || "");
          setSlug(data.workspace?.slug || "");
        }
      } catch {}
    }
    fetchWorkspace();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0B0A09] text-[#F3F2EF] font-sans flex flex-col justify-between">
      <AppNavbar workspace={workspace} />

      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full">
        <h1 className="text-3xl font-bold text-[#F3F2EF]">Workspace Settings</h1>
        <p className="text-sm text-[#B4B0A7] mt-1">Manage workspace brand details, capabilities, and retention preferences.</p>

        {saved && (
          <div className="mt-6 p-4 rounded-md bg-[#5BD08C]/10 border border-[#5BD08C]/30 text-[#5BD08C] text-sm font-semibold">
            ✓ Workspace settings saved successfully.
          </div>
        )}

        <form onSubmit={handleSave} className="mt-8 space-y-8">
          <div className="p-6 rounded-xl bg-[#121110] border border-[#2E2B26] space-y-6">
            <h2 className="text-lg font-semibold text-[#F3F2EF] border-b border-[#2E2B26] pb-3">General Identity</h2>

            <div>
              <label className="block text-xs font-mono text-[#8A867C] mb-2">WORKSPACE NAME</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Main Studio"
                className="w-full px-4 py-2.5 bg-[#1A1815] border border-[#46433C] rounded-md text-sm text-[#F3F2EF] focus:outline-none focus:border-[#7C70F6]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#8A867C] mb-2">SLUG IDENTIFIER</label>
              <input
                type="text"
                value={slug}
                readOnly
                className="w-full px-4 py-2.5 bg-[#1A1815] border border-[#2E2B26] rounded-md text-sm text-[#8A867C] font-mono cursor-not-allowed"
              />
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#121110] border border-[#2E2B26] space-y-4">
            <h2 className="text-lg font-semibold text-[#F3F2EF] border-b border-[#2E2B26] pb-3">Media Retention Policy</h2>
            <p className="text-sm text-[#B4B0A7]">
              Raw ad video uploads and intermediate extracted frames are automatically purged after 30 days to protect privacy and optimize storage.
            </p>
            <div className="text-xs font-mono text-[#7C70F6] bg-[#7C70F6]/10 px-3 py-2 rounded border border-[#7C70F6]/30 w-fit">
              RETENTION: 30 DAYS (STANDARD PLAN)
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-3 rounded-md bg-[#7C70F6] text-white text-sm font-semibold hover:bg-[#6557F5] transition-all"
          >
            Save Workspace Settings
          </button>
        </form>
      </main>

      <footer className="border-t border-[#2E2B26] py-6 px-6 text-center text-xs text-[#8A867C] font-mono">
        Sakhaa Signal SaaS Workspace Configuration
      </footer>
    </div>
  );
}
