import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Pricing & Plans — Sakhaa Signal",
  description: "Simple, credit-based pricing plans for static creative scoring and Brain Neuromarketing Signal Simulation GPU ad intelligence.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0B0A09] text-[#F3F2EF] font-sans selection:bg-[#7C70F6] selection:text-white flex flex-col justify-between">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0B0A09]/80 border-b border-[#2E2B26]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-10 rounded border border-[#46433C] flex items-center justify-center relative shrink-0 bg-[#121110] overflow-hidden">
              <span className="text-[10px] font-mono text-[#8A867C] leading-none">9:16</span>
              <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-[#FF6B3D] absolute right-0.5 top-0.5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#F3F2EF]">Sakhaa Signal</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#B4B0A7]">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/features" className="hover:text-white transition-colors">Features</Link>
            <Link href="/pricing" className="text-white font-semibold">Pricing</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-[#B4B0A7] hover:text-white">Sign In</Link>
            <Link href="/login" className="px-5 py-2.5 text-sm font-semibold rounded-md bg-[#7C70F6] text-white hover:bg-[#6557F5]">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Pricing Hero */}
      <section className="py-20 px-6 max-w-7xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#F3F2EF]">Flexible SaaS Credit Plans</h1>
        <p className="mt-4 text-lg text-[#B4B0A7] max-w-2xl mx-auto">
          Pay only for the creative analysis you run. Each plan includes full access to diagnostic reports and workspace team seats.
        </p>

        {/* Pricing Cards */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-5xl mx-auto">
          {/* Starter */}
          <div className="p-8 rounded-xl bg-[#121110] border border-[#2E2B26] flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono text-[#8A867C]">STARTER</span>
              <h3 className="text-3xl font-bold text-[#F3F2EF] mt-2">$49 <span className="text-sm font-normal text-[#8A867C]">/ mo</span></h3>
              <p className="text-sm text-[#B4B0A7] mt-3">Essential creative testing for freelancers and solo buyers.</p>
              <div className="mt-6 border-t border-[#2E2B26] pt-6 space-y-3 text-sm text-[#D4D1CA]">
                <p className="font-semibold text-white">Includes:</p>
                <p>✓ 20 Analysis Credits per month</p>
                <p>✓ Static Image Saliency & Focal Analysis</p>
                <p>✓ Emotional & Visual Pull Indexing</p>
                <p>✓ 1 Workspace, 2 Team Seats</p>
              </div>
            </div>
            <Link href="/login" className="mt-8 py-3 rounded-md bg-[#1A1815] border border-[#46433C] text-center text-sm font-semibold hover:border-[#7C70F6]">
              Choose Starter
            </Link>
          </div>

          {/* Growth */}
          <div className="p-8 rounded-xl bg-[#1A1815] border-2 border-[#7C70F6] flex flex-col justify-between shadow-2xl shadow-[#7C70F6]/10">
            <div>
              <span className="text-xs font-mono text-[#7C70F6]">GROWTH (RECOMMENDED)</span>
              <h3 className="text-3xl font-bold text-[#F3F2EF] mt-2">$149 <span className="text-sm font-normal text-[#8A867C]">/ mo</span></h3>
              <p className="text-sm text-[#B4B0A7] mt-3">For performance agencies managing high creative volume.</p>
              <div className="mt-6 border-t border-[#2E2B26] pt-6 space-y-3 text-sm text-[#D4D1CA]">
                <p className="font-semibold text-white">Includes Everything in Starter plus:</p>
                <p>✓ 100 Analysis Credits per month</p>
                <p>✓ Brain Neuromarketing Signal Simulation Transformer GPU Inference</p>
                <p>✓ 17 Cognitive Cluster Activations (A–Q)</p>
                <p>✓ LLM Executive Summary Reports</p>
                <p>✓ 5 Workspaces, 10 Team Seats</p>
              </div>
            </div>
            <Link href="/login" className="mt-8 py-3 rounded-md bg-[#7C70F6] text-white text-center text-sm font-semibold hover:bg-[#6557F5]">
              Choose Growth
            </Link>
          </div>

          {/* Pro / Enterprise */}
          <div className="p-8 rounded-xl bg-[#121110] border border-[#2E2B26] flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono text-[#FF6B3D]">PRO ENTERPRISE</span>
              <h3 className="text-3xl font-bold text-[#F3F2EF] mt-2">$399 <span className="text-sm font-normal text-[#8A867C]">/ mo</span></h3>
              <p className="text-sm text-[#B4B0A7] mt-3">For large studios requiring high-volume GPU processing.</p>
              <div className="mt-6 border-t border-[#2E2B26] pt-6 space-y-3 text-sm text-[#D4D1CA]">
                <p className="font-semibold text-white">Includes Everything in Growth plus:</p>
                <p>✓ 350 Analysis Credits per month</p>
                <p>✓ Training Bundle ZIP Exports (.pt / .npy)</p>
                <p>✓ Expedited Priority Queueing</p>
                <p>✓ Unlimited Workspaces & Members</p>
              </div>
            </div>
            <Link href="/login" className="mt-8 py-3 rounded-md bg-[#1A1815] border border-[#46433C] text-center text-sm font-semibold hover:border-[#FF6B3D]">
              Choose Pro
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2E2B26] py-8 px-6 text-center text-sm text-[#8A867C]">
        Sakhaa Signal &copy; 2026. All rights reserved.
      </footer>
    </div>
  );
}
