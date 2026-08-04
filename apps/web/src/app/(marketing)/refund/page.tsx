import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Refund Policy — Sakhaa Signal",
  description: "Refund and cancellation policy for Sakhaa Signal SaaS subscriptions.",
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#0B0A09] text-[#F3F2EF] font-sans flex flex-col justify-between">
      <header className="border-b border-[#2E2B26] py-6 px-6 max-w-7xl mx-auto w-full flex justify-between items-center">
        <Link href="/" className="text-lg font-bold text-[#F3F2EF]">Sakhaa Signal</Link>
        <Link href="/" className="text-sm text-[#7C70F6] hover:underline">&larr; Back to Home</Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full space-y-8">
        <h1 className="text-3xl font-bold text-[#F3F2EF]">Refund & Cancellation Policy</h1>
        <p className="text-sm text-[#8A867C] font-mono">Last Updated: August 4, 2026</p>

        <section className="space-y-4 text-sm text-[#D4D1CA] leading-relaxed">
          <h2 className="text-xl font-semibold text-[#F3F2EF]">1. Subscription Cancellations</h2>
          <p>
            You can cancel your subscription at any time via your Workspace Billing Settings. Upon cancellation, your workspace retains active credits until the end of the current billing cycle.
          </p>

          <h2 className="text-xl font-semibold text-[#F3F2EF]">2. Automated Failed Job Credit Refunds</h2>
          <p>
            If a GPU analysis job fails fatally due to a system or CUDA worker error, unused reserved credits are automatically refunded to your workspace balance immediately.
          </p>
        </section>
      </main>

      <footer className="border-t border-[#2E2B26] py-6 text-center text-xs text-[#8A867C] font-mono">
        Sakhaa Signal Refund Policy
      </footer>
    </div>
  );
}
