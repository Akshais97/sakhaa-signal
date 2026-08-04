"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNavTabs() {
  const pathname = usePathname();

  const tabs = [
    { href: "/admin", label: "Overview", icon: "📊" },
    { href: "/admin/users", label: "Users & Plans", icon: "👥" },
    { href: "/admin/workspaces", label: "Workspaces", icon: "🏢" },
    { href: "/admin/jobs", label: "Failed Jobs", icon: "🚨" },
    { href: "/admin/workers", label: "Workers", icon: "🖥️" },
  ];

  return (
    <nav className="flex items-center gap-1.5 p-1 bg-[#121110] border border-[#2E2B26] rounded-lg">
      {tabs.map((tab) => {
        const isActive =
          tab.href === "/admin"
            ? pathname === "/admin"
            : pathname?.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
              isActive
                ? "bg-[#7C70F6] text-white font-bold shadow-md shadow-[#7C70F6]/20 border border-[#6557F5]"
                : "text-[#B4B0A7] hover:text-white hover:bg-[#1A1815]"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
