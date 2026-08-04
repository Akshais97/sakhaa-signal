"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function HamburgerMenu({
  user,
  workspace,
}: {
  user?: any;
  workspace?: any;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    window.location.href = "/login";
  };

  const initial = user?.email ? user.email.charAt(0).toUpperCase() : "S";

  return (
    <>
      {/* Trigger Hamburger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2.5 px-4 py-2 rounded-lg border text-[#F3F2EF] transition-all group shadow-md ${
          isOpen
            ? "bg-[#7C70F6]/20 border-[#7C70F6] text-white"
            : "bg-[#121110] border-[#2E2B26] hover:border-[#7C70F6]/60 hover:bg-[#1A1815]"
        }`}
        aria-label="Toggle Navigation Menu"
      >
        <div className="w-5 h-4 flex flex-col justify-between">
          <span className={`w-full h-0.5 transition-colors rounded-full ${isOpen ? "bg-[#7C70F6]" : "bg-[#B4B0A7] group-hover:bg-[#7C70F6]"}`} />
          <span className={`w-3/4 h-0.5 transition-colors rounded-full ${isOpen ? "bg-[#7C70F6]" : "bg-[#B4B0A7] group-hover:bg-[#7C70F6]"}`} />
          <span className={`w-full h-0.5 transition-colors rounded-full ${isOpen ? "bg-[#7C70F6]" : "bg-[#B4B0A7] group-hover:bg-[#7C70F6]"}`} />
        </div>
        <span className="text-xs font-mono font-medium text-[#B4B0A7] group-hover:text-white hidden sm:inline">
          {isOpen ? "Close" : "Menu"}
        </span>
      </button>

      {/* Backdrop Overlay - Positioned below sticky navbar header */}
      {isOpen && (
        <div
          className="fixed top-[61px] inset-x-0 bottom-0 h-[calc(100dvh-61px)] bg-black/80 backdrop-blur-md z-40 transition-opacity animate-fadeIn"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sliding Drawer Panel - Positioned below sticky navbar header */}
      <div
        className={`fixed top-[61px] right-0 bottom-0 h-[calc(100dvh-61px)] w-96 sm:w-[420px] max-w-[92vw] bg-[#0E0D0C] border-l border-[#2E2B26] z-50 flex flex-col justify-between shadow-[0_0_60px_rgba(0,0,0,0.95)] transition-transform duration-300 ease-in-out opacity-100 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header Block: Pinned Top Section (App name, Close, Avatar, Active Workspace Card) */}
        <div className="p-4 sm:p-5 border-b border-[#2E2B26] space-y-3 bg-[#141312] shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#5BD08C] animate-pulse" />
              <span className="text-[11px] font-mono font-semibold text-[#8A867C] uppercase tracking-wider">
                SAKHAA SIGNAL SAAS
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-lg bg-[#1D1B1A] border border-[#2E2B26] text-[#B4B0A7] hover:text-white flex items-center justify-center transition-colors text-base"
            >
              &times;
            </button>
          </div>

          {/* Compact User Identity & Active Workspace Card */}
          <div className="flex items-center gap-3 pt-1">
            <div className="w-9 h-9 rounded-full bg-[#7C70F6]/20 border border-[#7C70F6]/40 text-[#7C70F6] font-bold flex items-center justify-center text-sm shrink-0 shadow-inner">
              {initial}
            </div>
            <div className="overflow-hidden min-w-0 flex-1">
              <p className="text-xs font-bold text-[#F3F2EF] truncate">
                {user?.displayName || user?.email?.split("@")[0] || "Active Subscriber"}
              </p>
              <p className="text-[11px] text-[#8A867C] font-mono truncate">
                {user?.email || "user@sakhaasignal.ai"}
              </p>
            </div>
          </div>

          {workspace && (
            <div className="px-3 py-2 rounded-xl bg-[#1D1B1A] border border-[#2E2B26] flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono font-bold text-[#8A867C] uppercase tracking-wider shrink-0">
                ACTIVE WORKSPACE
              </span>
              <span className="text-xs font-semibold text-[#5FC6DD] truncate text-right">
                {workspace.name || workspace.id}
              </span>
            </div>
          )}
        </div>

        {/* ScrollableMenuContent: The ONLY area that scrolls */}
        <div className="flex-1 overflow-y-auto min-h-0 px-4 sm:px-5 py-4 space-y-5 bg-[#0E0D0C] custom-scrollbar">
          {/* STUDIO WORKSPACE Section */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-mono font-bold text-[#8A867C] uppercase tracking-widest px-1">
              STUDIO WORKSPACE
            </p>
            <nav className="space-y-1">
              <Link
                href="/dashboard"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  pathname === "/dashboard"
                    ? "bg-[#7C70F6]/15 border border-[#7C70F6]/40 text-[#F3F2EF] font-semibold"
                    : "text-[#B4B0A7] hover:bg-[#1A1815] hover:text-white"
                }`}
              >
                <span className="text-[#7C70F6] text-sm">⚡</span>
                <span>Dashboard Studio</span>
              </Link>
              <Link
                href="/profile"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  pathname === "/profile"
                    ? "bg-[#7C70F6]/15 border border-[#7C70F6]/40 text-[#F3F2EF] font-semibold"
                    : "text-[#B4B0A7] hover:bg-[#1A1815] hover:text-white"
                }`}
              >
                <span className="text-[#5FC6DD] text-sm">👤</span>
                <span>User Profile</span>
              </Link>
            </nav>
          </div>

          {/* Credits & Management */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-mono font-bold text-[#8A867C] uppercase tracking-widest px-1">
              Credits & Management
            </p>
            <nav className="space-y-1">
              <Link
                href="/settings/billing"
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  pathname === "/settings/billing"
                    ? "bg-[#7C70F6]/15 border border-[#7C70F6]/40 text-[#F3F2EF] font-semibold"
                    : "text-[#B4B0A7] hover:bg-[#1A1815] hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[#5BD08C] text-sm">💳</span>
                  <span>Credits & Billing</span>
                </div>
                <span className="text-[10px] font-mono bg-[#5BD08C]/10 text-[#5BD08C] px-2 py-0.5 rounded-md border border-[#5BD08C]/30 ml-auto shrink-0">
                  Plans
                </span>
              </Link>
              <Link
                href="/settings/usage"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  pathname === "/settings/usage"
                    ? "bg-[#7C70F6]/15 border border-[#7C70F6]/40 text-[#F3F2EF] font-semibold"
                    : "text-[#B4B0A7] hover:bg-[#1A1815] hover:text-white"
                }`}
              >
                <span className="text-[#FF6B3D] text-sm">📊</span>
                <span>Credit Usage Ledger</span>
              </Link>
              <Link
                href="/settings/members"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  pathname === "/settings/members"
                    ? "bg-[#7C70F6]/15 border border-[#7C70F6]/40 text-[#F3F2EF] font-semibold"
                    : "text-[#B4B0A7] hover:bg-[#1A1815] hover:text-white"
                }`}
              >
                <span className="text-[#B8A6CC] text-sm">👥</span>
                <span>Team Members</span>
              </Link>
              <Link
                href="/settings/workspace"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  pathname === "/settings/workspace"
                    ? "bg-[#7C70F6]/15 border border-[#7C70F6]/40 text-[#F3F2EF] font-semibold"
                    : "text-[#B4B0A7] hover:bg-[#1A1815] hover:text-white"
                }`}
              >
                <span className="text-[#8A867C] text-sm">⚙️</span>
                <span>Workspace Settings</span>
              </Link>
            </nav>
          </div>

          {/* Platform & System */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-mono font-bold text-[#8A867C] uppercase tracking-widest px-1">
              Platform & System
            </p>
            <nav className="space-y-1">
              {user?.isPlatformAdmin && (
                <Link
                  href="/admin"
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    pathname?.startsWith("/admin")
                      ? "bg-[#7C70F6]/15 border border-[#7C70F6]/40 text-[#F3F2EF] font-semibold"
                      : "text-[#B4B0A7] hover:bg-[#1A1815] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[#7C70F6] text-sm">🛡️</span>
                    <span>Platform Admin</span>
                  </div>
                  <span className="text-[10px] font-mono bg-[#7C70F6]/10 text-[#7C70F6] px-2 py-0.5 rounded-md border border-[#7C70F6]/30 ml-auto shrink-0">
                    Ops
                  </span>
                </Link>
              )}
              <Link
                href="/features"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  pathname === "/features"
                    ? "bg-[#7C70F6]/15 border border-[#7C70F6]/40 text-[#F3F2EF] font-semibold"
                    : "text-[#B4B0A7] hover:bg-[#1A1815] hover:text-white"
                }`}
              >
                <span className="text-[#7C70F6] text-sm">🧠</span>
                <span>Biometric Engine Specs</span>
              </Link>
            </nav>
          </div>
        </div>

        {/* Footer: Pinned Log Out Section */}
        <div className="p-4 sm:p-5 border-t border-[#2E2B26] bg-[#141312] shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-[#7C70F6]/10 border border-[#7C70F6]/30 text-[#7C70F6] hover:bg-[#7C70F6] hover:text-white font-bold text-xs transition-all shadow-lg group"
          >
            <span className="group-hover:translate-x-0.5 transition-transform">🚪</span>
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </>
  );
}
