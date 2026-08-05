"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function UserProfileMenu({ user }: { user?: any }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    window.location.href = "/login";
  };

  const initial = user?.email ? user.email.charAt(0).toUpperCase() : "U";

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-[#7C70F6]/20 border border-[#7C70F6]/40 text-[#7C70F6] font-bold flex items-center justify-center text-sm hover:brightness-125 transition-all"
        title={user?.email || "Account Profile"}
      >
        {initial}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md bg-[#121110] border border-[#2E2B26] shadow-2xl z-50 py-1 font-sans">
          <div className="px-3 py-2 border-b border-[#2E2B26]">
            <p className="text-xs text-[#8A867C] font-mono">SIGNED IN AS</p>
            <p className="text-sm font-semibold text-[#F3F2EF] truncate mt-0.5">
              {user?.email || "user@example.com"}
            </p>
          </div>

          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 text-sm text-[#D4D1CA] hover:bg-[#1A1815] hover:text-white"
            >
              Account Profile
            </Link>
            <Link
              href="/settings/workspace"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 text-sm text-[#D4D1CA] hover:bg-[#1A1815] hover:text-white"
            >
              Workspace Settings
            </Link>
            <Link
              href="/settings/members"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 text-sm text-[#D4D1CA] hover:bg-[#1A1815] hover:text-white"
            >
              Team & Members
            </Link>
            <Link
              href="/settings/billing"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 text-sm text-[#D4D1CA] hover:bg-[#1A1815] hover:text-white"
            >
              Billing & Quotas
            </Link>
          </div>

          <div className="border-t border-[#2E2B26] pt-1">
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm text-[#F2786C] hover:bg-[rgba(242,120,108,0.1)] transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
