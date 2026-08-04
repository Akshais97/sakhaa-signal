import React from "react";
import Link from "next/link";
import { requirePlatformAdminSession } from "@/lib/adminAuth";
import { redirect } from "next/navigation";
import AdminNavTabs from "@/components/layout/AdminNavTabs";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthorized } = await requirePlatformAdminSession();

  if (!isAuthorized) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#090807] text-[#F3F2EF] font-sans flex flex-col justify-between">
      {/* Admin Top Header */}
      <header className="border-b border-[#2E2B26] py-3 px-6 md:px-12 flex flex-wrap justify-between items-center bg-[#1A1815]/90 sticky top-0 z-50 backdrop-blur-md gap-4">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#7C70F6]/20 border border-[#7C70F6]/40 text-[#7C70F6] font-bold font-mono flex items-center justify-center text-xs">
              ADM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-[#F3F2EF]">Sakhaa Signal Admin</span>
                <span className="text-[10px] text-[#7C70F6] font-mono bg-[#7C70F6]/10 px-1.5 py-0.5 rounded border border-[#7C70F6]/30">SUPER ADMIN</span>
              </div>
            </div>
          </Link>

          {/* Redesigned Tab Navigation Bar */}
          <AdminNavTabs />
        </div>

        <Link href="/dashboard" className="text-xs font-mono text-[#8A867C] hover:text-white px-3 py-1.5 rounded bg-[#121110] border border-[#2E2B26] transition-colors">
          &larr; Exit to Customer App
        </Link>
      </header>

      <div className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        {children}
      </div>

      <footer className="border-t border-[#2E2B26] py-6 px-6 text-center text-xs text-[#8A867C] font-mono">
        Sakhaa Signal Internal Platform Administration Panel &bull; Confidential
      </footer>
    </div>
  );
}
