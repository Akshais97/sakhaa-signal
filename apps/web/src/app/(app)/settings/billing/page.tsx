"use client";

import React, { useState, useEffect } from "react";
import AppNavbar from "@/components/layout/AppNavbar";
import { PLANS } from "@/lib/billing";

export default function BillingSettingsPage() {
  const [workspace, setWorkspace] = useState<any>(null);
  const [credits, setCredits] = useState<number>(0);
  const [activePlan, setActivePlan] = useState<string>("STARTER");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/jobs");
        if (res.ok) {
          const data = await res.json();
          setWorkspace(data.workspace);
          if (data.workspace?.id) {
            const usageRes = await fetch("/api/billing/status");
            if (usageRes.ok) {
              const uData = await usageRes.json();
              setCredits(uData.credits || 5.0);
              setActivePlan(uData.plan || "STARTER");
            } else {
              setCredits(5.0);
            }
          }
        }
      } catch {} finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCheckout = async (planCode: string) => {
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      }
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#0B0A09] text-[#F3F2EF] font-sans flex flex-col justify-between">
      <AppNavbar workspace={workspace} />

      <main className="max-w-5xl mx-auto px-6 py-12 flex-1 w-full">
        <h1 className="text-3xl font-bold text-[#F3F2EF]">Billing & Subscription Plans</h1>
        <p className="text-sm text-[#B4B0A7] mt-1">Manage workspace plan subscription, credit allocations, and invoices.</p>

        {/* Current Balance Overview */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-[#121110] border border-[#2E2B26]">
            <span className="text-xs font-mono text-[#8A867C]">REMAINING CREDITS</span>
            <div className="text-3xl font-extrabold text-[#7C70F6] mt-2 font-mono">{credits.toFixed(1)}</div>
            <p className="text-xs text-[#B4B0A7] mt-1">1 static analysis = 1 credit &bull; 1 video TribeV2 = 3 credits</p>
          </div>

          <div className="p-6 rounded-xl bg-[#121110] border border-[#2E2B26]">
            <span className="text-xs font-mono text-[#8A867C]">ACTIVE PLAN</span>
            <div className="text-2xl font-bold text-[#F3F2EF] mt-2">{PLANS[activePlan]?.name || "Free Trial"}</div>
            <p className="text-xs text-[#5BD08C] mt-1 font-mono">Status: ACTIVE</p>
          </div>

          <div className="p-6 rounded-xl bg-[#121110] border border-[#2E2B26] flex flex-col justify-between">
            <span className="text-xs font-mono text-[#8A867C]">RENEWAL DATE</span>
            <div className="text-sm font-mono text-[#D4D1CA]">Next cycle: Auto-renews monthly</div>
            <a href="/settings/usage" className="text-xs font-mono text-[#7C70F6] hover:underline mt-2">
              View Usage Ledger &rarr;
            </a>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="mt-12 space-y-4">
          <h2 className="text-xl font-bold text-[#F3F2EF]">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.values(PLANS).map((plan) => {
              const isCurrent = activePlan === plan.code;
              return (
                <div
                  key={plan.code}
                  className={`p-6 rounded-xl bg-[#121110] border flex flex-col justify-between ${
                    isCurrent ? "border-[#7C70F6] ring-1 ring-[#7C70F6]" : "border-[#2E2B26]"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono text-[#7C70F6]">{plan.code}</span>
                      {isCurrent && (
                        <span className="text-[10px] font-mono bg-[#7C70F6]/20 border border-[#7C70F6]/40 text-[#7C70F6] px-2 py-0.5 rounded">
                          CURRENT PLAN
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-[#F3F2EF] mt-2">
                      ${plan.monthlyPrice} <span className="text-sm font-normal text-[#8A867C]">/ mo</span>
                    </h3>
                    <ul className="mt-6 space-y-2 text-xs text-[#D4D1CA]">
                      {plan.features.map((f, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <span className="text-[#5BD08C]">✓</span> {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => handleCheckout(plan.code)}
                    disabled={isCurrent}
                    className={`mt-8 w-full py-2.5 rounded-md text-sm font-semibold transition-all ${
                      isCurrent
                        ? "bg-[#1A1815] text-[#8A867C] border border-[#2E2B26] cursor-default"
                        : "bg-[#7C70F6] text-white hover:bg-[#6557F5]"
                    }`}
                  >
                    {isCurrent ? "Active Plan" : `Upgrade to ${plan.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <footer className="border-t border-[#2E2B26] py-6 px-6 text-center text-xs text-[#8A867C] font-mono">
        Sakhaa Signal SaaS Billing & Quotas Engine
      </footer>
    </div>
  );
}
