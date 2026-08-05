"use client";

import React, { useState } from "react";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  role?: string;
}

export default function WorkspaceSwitcher({
  currentWorkspace,
}: {
  currentWorkspace?: Workspace | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    const nextIsOpen = !isOpen;
    setIsOpen(nextIsOpen);

    if (!nextIsOpen || hasLoaded || isLoading) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/workspaces");
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data.workspaces || []);
      }
    } finally {
      setHasLoaded(true);
      setIsLoading(false);
    }
  };

  const handleSwitch = (wsId: string) => {
    document.cookie = `workspace-id=${wsId}; path=/; max-age=31536000`;
    window.location.reload();
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#1A1815] border border-[#46433C] text-sm text-[#F3F2EF] hover:border-[#7C70F6] transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-[#5BD08C]"></span>
        <span className="font-semibold truncate max-w-[140px]">
          {currentWorkspace?.name || "Main Workspace"}
        </span>
        <svg className="w-4 h-4 text-[#8A867C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md bg-[#121110] border border-[#2E2B26] shadow-2xl z-50 py-1 font-sans">
          <div className="px-3 py-2 border-b border-[#2E2B26] text-xs font-mono text-[#8A867C]">
            SWITCH WORKSPACE
          </div>

          <div className="max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="px-3 py-2 text-xs text-[#8A867C]">Loading workspaces…</div>
            ) : workspaces.length > 0 ? (
              workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => handleSwitch(ws.id)}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-[#1A1815] transition-colors ${
                    ws.id === currentWorkspace?.id ? "text-[#7C70F6] font-semibold" : "text-[#D4D1CA]"
                  }`}
                >
                  <span className="truncate">{ws.name}</span>
                  {ws.id === currentWorkspace?.id && <span className="text-xs">✓</span>}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-xs text-[#8A867C]">
                {currentWorkspace?.name || "Current Workspace"}
              </div>
            )}
          </div>

          <div className="border-t border-[#2E2B26] pt-1">
            <a
              href="/settings/workspace"
              className="block px-3 py-2 text-xs font-mono text-[#7C70F6] hover:bg-[#1A1815]"
            >
              + Workspace Settings
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
