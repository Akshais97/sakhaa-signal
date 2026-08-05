"use client";

import React, { useState, useEffect } from "react";
import AppNavbar from "@/components/layout/AppNavbar";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [emailNotify, setEmailNotify] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setWorkspace(data.workspace);
          if (data.user?.displayName) {
            setDisplayName(data.user.displayName);
          } else if (data.user?.email) {
            setDisplayName(data.user.email.split("@")[0]);
          }
        }
      } catch (err: any) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSaved(false);

    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setSaved(true);
        setTimeout(() => setSaved(false), 4000);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Failed to save profile.");
      }
    } catch {
      setErrorMsg("Network error saving profile changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0A09] text-[#F3F2EF] font-sans flex flex-col justify-between">
      <AppNavbar user={user} workspace={workspace} />

      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full space-y-6">
        <div className="flex justify-between items-center border-b border-[#2E2B26] pb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#F3F2EF]">User Account Profile</h1>
            <p className="text-sm text-[#B4B0A7] mt-1">Manage your personal identity, display name, and preferences.</p>
          </div>
          {user?.displayName && (
            <div className="px-4 py-2 rounded-xl bg-[#7C70F6]/10 border border-[#7C70F6]/30 text-xs font-mono text-[#7C70F6]">
              Identity: <span className="font-bold text-white">{user.displayName}</span>
            </div>
          )}
        </div>

        {saved && (
          <div className="p-4 rounded-xl bg-[#5BD08C]/10 border border-[#5BD08C]/30 text-[#5BD08C] text-xs font-mono">
            ✓ Display Name updated to &quot;{user?.displayName}&quot; successfully.
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-xl bg-[#F2786C]/10 border border-[#F2786C]/30 text-[#F2786C] text-xs font-mono">
            ⚠️ {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-sm font-mono text-[#8A867C] bg-[#121110] border border-[#2E2B26] rounded-xl animate-pulse">
            Loading profile information...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Identity Card */}
            <div className="p-6 rounded-xl bg-[#121110] border border-[#2E2B26] space-y-6">
              <h2 className="text-base font-semibold text-[#F3F2EF] border-b border-[#2E2B26] pb-3">Personal Identity Details</h2>

              <div className="space-y-2">
                <label className="block text-xs font-mono text-[#8A867C]">EMAIL ADDRESS (READ-ONLY)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full px-4 py-2.5 bg-[#1A1815] border border-[#2E2B26] rounded-md text-sm text-[#8A867C] font-mono cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono text-[#8A867C]">DISPLAY NAME</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  required
                  className="w-full px-4 py-2.5 bg-[#1A1815] border border-[#46433C] rounded-md text-sm text-[#F3F2EF] focus:outline-none focus:border-[#7C70F6]"
                />
                <p className="text-xs text-[#8A867C] font-mono">This name will be displayed in workspace team rosters and reports.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono text-[#8A867C]">TIMEZONE PREFERENCE</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#1A1815] border border-[#46433C] rounded-md text-sm text-[#F3F2EF] focus:outline-none focus:border-[#7C70F6]"
                >
                  <option value="Asia/Kolkata">India Standard Time (IST - UTC+05:30)</option>
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="America/New_York">Eastern Time (US & Canada)</option>
                  <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                  <option value="Europe/London">London (GMT/BST)</option>
                </select>
              </div>
            </div>

            {/* Notifications */}
            <div className="p-6 rounded-xl bg-[#121110] border border-[#2E2B26] space-y-4">
              <h2 className="text-base font-semibold text-[#F3F2EF] border-b border-[#2E2B26] pb-3">Notification Preferences</h2>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotify}
                  onChange={(e) => setEmailNotify(e.target.checked)}
                  className="w-4 h-4 accent-[#7C70F6] rounded"
                />
                <span className="text-sm text-[#D4D1CA]">Email me when analysis job completes or fails</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-md bg-[#7C70F6] text-white text-sm font-semibold hover:bg-[#6557F5] disabled:opacity-50 transition-all"
            >
              {saving ? "Saving Changes..." : "Save Profile Changes"}
            </button>
          </form>
        )}
      </main>

      <footer className="border-t border-[#2E2B26] py-6 px-6 text-center text-xs text-[#8A867C] font-mono">
        Sakhaa Signal SaaS User Profile &bull; Configured
      </footer>
    </div>
  );
}
