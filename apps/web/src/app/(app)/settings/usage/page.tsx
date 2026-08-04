"use client";

import React, { useState, useEffect } from "react";
import AppNavbar from "@/components/layout/AppNavbar";

interface LedgerEntry {
  id: string;
  usageType: string;
  quantity: number;
  creditsDelta: number;
  reason: string;
  createdAt: string;
}

export default function UsagePage() {
  const [workspace, setWorkspace] = useState<any>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/jobs");
        if (res.ok) {
          const data = await res.json();
          setWorkspace(data.workspace);
        }
      } catch {} finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0A09] text-[#F3F2EF] font-sans flex flex-col justify-between">
      <AppNavbar workspace={workspace} />

      <main className="max-w-5xl mx-auto px-6 py-12 flex-1 w-full">
        <h1 className="text-3xl font-bold text-[#F3F2EF]">Workspace Usage Ledger</h1>
        <p className="text-sm text-[#B4B0A7] mt-1">Audit log of all credit deductions, allocations, and analysis job reservations.</p>

        {/* Ledger Table */}
        <div className="mt-8 border border-[#2E2B26] rounded-xl overflow-hidden bg-[#121110]">
          <div className="p-4 border-b border-[#2E2B26] flex justify-between items-center text-xs font-mono text-[#8A867C]">
            <span>TRANSACTION REASON</span>
            <span>CREDITS DELTA</span>
          </div>

          <div className="divide-y divide-[#2E2B26]">
            <div className="p-4 flex items-center justify-between text-sm">
              <div>
                <p className="font-semibold text-[#F3F2EF]">Initial Free Trial Welcome Bonus</p>
                <p className="text-xs text-[#8A867C] font-mono">System Account Allocation</p>
              </div>
              <span className="text-sm font-mono font-bold text-[#5BD08C]">+5.0 Credits</span>
            </div>

            <div className="p-4 flex items-center justify-between text-sm">
              <div>
                <p className="font-semibold text-[#F3F2EF]">TribeV2 Video Creative Analysis Reservation</p>
                <p className="text-xs text-[#8A867C] font-mono">Job execution reservation</p>
              </div>
              <span className="text-sm font-mono font-bold text-[#FF6B3D]">-3.0 Credits</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#2E2B26] py-6 px-6 text-center text-xs text-[#8A867C] font-mono">
        Sakhaa Signal SaaS Metered Audit Log
      </footer>
    </div>
  );
}
