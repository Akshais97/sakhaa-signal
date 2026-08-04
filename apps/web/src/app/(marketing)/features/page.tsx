import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Features & Architecture — Sakhaa Signal",
  description: "Comprehensive guide to static creative scoring, TribeV2 video attention modeling, and HCP-MMP1 cortical cluster mapping.",
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#0B0A09] text-[#F3F2EF] font-sans selection:bg-[#7C70F6] selection:text-white flex flex-col justify-between">
      {/* Navigation */}
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
            <Link href="/" className="hover:text-white">Home</Link>
            <Link href="/features" className="text-white font-semibold">Features</Link>
            <Link href="/pricing" className="hover:text-white">Pricing</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-[#B4B0A7] hover:text-white">Sign In</Link>
            <Link href="/login" className="px-5 py-2.5 text-sm font-semibold rounded-md bg-[#7C70F6] text-white hover:bg-[#6557F5]">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Features Overview */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold text-[#F3F2EF]">Sakhaa Signal Product Architecture</h1>
        <p className="mt-4 text-lg text-[#B4B0A7]">
          Built on canonical neuroscience parcellation models and multimodal deep learning to eliminate creative guesswork.
        </p>

        <div className="mt-12 space-y-12">
          {/* Feature 1 */}
          <div className="p-8 rounded-xl bg-[#121110] border border-[#2E2B26]">
            <span className="text-xs font-mono text-[#7C70F6]">01 // BIOMETRIC OUTCOME INDICES</span>
            <h2 className="text-2xl font-bold text-[#F3F2EF] mt-2">Deterministic Scoring Engine</h2>
            <p className="mt-3 text-[#B4B0A7] leading-relaxed">
              Our deterministic pipeline computes four canonical outcome indices: Emotional Pull (EP), Visual Pull (VP), Conversion Support (CS), and Brand Recall (BR).
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-8 rounded-xl bg-[#121110] border border-[#2E2B26]">
            <span className="text-xs font-mono text-[#5FC6DD]">02 // CORTICAL PARCELLATION</span>
            <h2 className="text-2xl font-bold text-[#F3F2EF] mt-2">17 Brain Cluster Mapping (A–Q)</h2>
            <p className="mt-3 text-[#B4B0A7] leading-relaxed">
              Predictions map directly onto 180 HCP-MMP1 cortical regions aggregated into 17 high-level psychological proxies—from early visual processing to narrative temporal coherence.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-8 rounded-xl bg-[#121110] border border-[#2E2B26]">
            <span className="text-xs font-mono text-[#FF6B3D]">03 // LLM EVIDENCE DIAGNOSTICS</span>
            <h2 className="text-2xl font-bold text-[#F3F2EF] mt-2">LLM Diagnostic Reports</h2>
            <p className="mt-3 text-[#B4B0A7] leading-relaxed">
              Once deterministic scores complete, a structured evidence bundle is processed by an LLM adapter to output concrete, actionable creative editing recommendations.
            </p>
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
