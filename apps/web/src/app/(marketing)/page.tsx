import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Sakhaa Signal — Neuromarketing Creative Scoring & AI Ad Intelligence",
  description:
    "Predict ad engagement, visual pull, conversion support, and brand recall using multimodal AI transformer models and cortical cluster mapping before launching paid campaigns.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B0A09] text-[#F3F2EF] font-sans selection:bg-[#7C70F6] selection:text-white flex flex-col justify-between">
      {/* Background Gradient Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#7C70F6]/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-[#FF6B3D]/15 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-[#5FC6DD]/15 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0B0A09]/80 border-b border-[#2E2B26]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-10 rounded border border-[#46433C] flex items-center justify-center relative shrink-0 bg-[#121110] overflow-hidden">
              <span className="text-[10px] font-mono text-[#8A867C] leading-none">9:16</span>
              <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-[#FF6B3D] absolute right-0.5 top-0.5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-[#F3F2EF]">Sakhaa Signal</span>
              <span className="ml-2 text-xs font-mono text-[#7C70F6] bg-[#7C70F6]/10 px-2 py-0.5 rounded border border-[#7C70F6]/30">SaaS v2.0</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#B4B0A7]">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#outcomes" className="hover:text-white transition-colors">Biometric Indices</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#security" className="hover:text-white transition-colors">Security</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-[#B4B0A7] hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="px-5 py-2.5 text-sm font-semibold rounded-md bg-[#7C70F6] text-white hover:bg-[#6557F5] transition-all shadow-lg shadow-[#7C70F6]/20"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-24 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A1815] border border-[#2E2B26] text-xs font-mono text-[#B4B0A7] mb-8">
          <span className="w-2 h-2 rounded-full bg-[#5BD08C] animate-pulse"></span>
          <span>TribeV2 Multimodal AI Encoder & HCP-MMP1 Parcellation Ready</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#F3F2EF] max-w-5xl mx-auto leading-none">
          Predict Creative Ad Performance <br />
          <span className="bg-gradient-to-r from-[#7C70F6] via-[#FF6B3D] to-[#5FC6DD] bg-clip-text text-transparent">
            Before Spending Ad Dollars
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-[#B4B0A7] max-w-3xl mx-auto leading-relaxed">
          Upload static banners or 9:16 short-form video ads. Receive deterministic Emotional Pull, Visual Pull, Conversion Support, and Brand Recall scores powered by fused multimodal attention models.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 text-base font-semibold rounded-md bg-[#7C70F6] text-white hover:bg-[#6557F5] transition-all shadow-xl shadow-[#7C70F6]/25 flex items-center justify-center gap-2"
          >
            <span>Upload Creative for Analysis</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          <Link
            href="/results/demo"
            className="w-full sm:w-auto px-8 py-4 text-base font-semibold rounded-md bg-[#1A1815] border border-[#46433C] text-[#F3F2EF] hover:bg-[#211F1B] hover:border-[#7C70F6] transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5 text-[#5FC6DD]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Explore Interactive Demo Report</span>
          </Link>
        </div>

        {/* Hero Interactive Terminal Mockup */}
        <div className="mt-16 relative mx-auto max-w-5xl rounded-xl border border-[#2E2B26] bg-[#121110]/90 p-4 shadow-2xl overflow-hidden backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-[#2E2B26] pb-3 mb-4 text-xs font-mono text-[#8A867C]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FF6B3D]"></span>
              <span className="w-3 h-3 rounded-full bg-[#E8B84B]"></span>
              <span className="w-3 h-3 rounded-full bg-[#5BD08C]"></span>
              <span className="ml-2 font-semibold text-[#F3F2EF]">sakhaa-signal-v2 // live_parcellation_stream</span>
            </div>
            <span>Status: READY</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left font-mono">
            {/* Outcome 1 */}
            <div className="p-4 rounded-lg bg-[#1A1815] border border-[#2E2B26]">
              <span className="text-xs text-[#8A867C]">EP INDEX (EMOTIONAL PULL)</span>
              <div className="text-3xl font-bold text-[#7C70F6] mt-1">84.2%</div>
              <p className="text-xs text-[#B4B0A7] mt-2">Limbic & affective resonance trigger</p>
            </div>
            {/* Outcome 2 */}
            <div className="p-4 rounded-lg bg-[#1A1815] border border-[#2E2B26]">
              <span className="text-xs text-[#8A867C]">VP INDEX (VISUAL PULL)</span>
              <div className="text-3xl font-bold text-[#5FC6DD] mt-1">91.8%</div>
              <p className="text-xs text-[#B4B0A7] mt-2">Early occipital & scene tracking</p>
            </div>
            {/* Outcome 3 */}
            <div className="p-4 rounded-lg bg-[#1A1815] border border-[#2E2B26]">
              <span className="text-xs text-[#8A867C]">CS INDEX (CONVERSION SUPPORT)</span>
              <div className="text-3xl font-bold text-[#FF6B3D] mt-1">76.5%</div>
              <p className="text-xs text-[#B4B0A7] mt-2">Prefrontal value evaluation</p>
            </div>
            {/* Outcome 4 */}
            <div className="p-4 rounded-lg bg-[#1A1815] border border-[#2E2B26]">
              <span className="text-xs text-[#8A867C]">BR INDEX (BRAND RECALL)</span>
              <div className="text-3xl font-bold text-[#E8B84B] mt-1">88.0%</div>
              <p className="text-xs text-[#B4B0A7] mt-2">Hippocampal episodic encoding</p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Engines Grid Section */}
      <section id="features" className="relative z-10 py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#F3F2EF]">
            Two Powerful Analysis Engines in One Studio
          </h2>
          <p className="text-[#B4B0A7] mt-4 text-base sm:text-lg">
            Whether you test static display banners or 9:16 video ad creatives, Sakhaa Signal gives you clear, evidence-backed diagnostic reports.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Static Creative Engine */}
          <div className="p-8 rounded-xl bg-[#121110] border border-[#2E2B26] hover:border-[#7C70F6]/50 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-lg bg-[#7C70F6]/10 border border-[#7C70F6]/30 flex items-center justify-center text-[#7C70F6] mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#F3F2EF]">Static Ad Scorer</h3>
              <p className="text-[#B4B0A7] mt-3 leading-relaxed">
                Analyze JPG, PNG, and WebP banners for visual hierarchy, focal contrast, brand placement clarity, typography legibility, and friction hotspots.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-[#D4D1CA]">
                <li className="flex items-center gap-2">
                  <span className="text-[#5BD08C]">✓</span> Visual saliency heatmap evaluation
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#5BD08C]">✓</span> Headline readability & focal flow ratio
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#5BD08C]">✓</span> CTA dominance & brand icon prominence
                </li>
              </ul>
            </div>
            <Link
              href="/login"
              className="mt-8 text-sm font-semibold text-[#7C70F6] hover:text-white transition-colors inline-flex items-center gap-1"
            >
              Analyze Static Creative &rarr;
            </Link>
          </div>

          {/* Video Creative Engine */}
          <div className="p-8 rounded-xl bg-[#121110] border border-[#2E2B26] hover:border-[#FF6B3D]/50 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-lg bg-[#FF6B3D]/10 border border-[#FF6B3D]/30 flex items-center justify-center text-[#FF6B3D] mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#F3F2EF]">Full Video TribeV2 Engine</h3>
              <p className="text-[#B4B0A7] mt-3 leading-relaxed">
                Extract audio tracks, video frames, and transcripts to fuse 3D-ResNet, Wav2Vec, and BERT embeddings into a unified attention transformer sequence tensor.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-[#D4D1CA]">
                <li className="flex items-center gap-2">
                  <span className="text-[#5BD08C]">✓</span> 17 Cognitive Cluster Activation (A–Q)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#5BD08C]">✓</span> Canonical HCP-MMP1 cortical area mapping
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#5BD08C]">✓</span> LLM-generated creative improvement steps
                </li>
              </ul>
            </div>
            <Link
              href="/login"
              className="mt-8 text-sm font-semibold text-[#FF6B3D] hover:text-white transition-colors inline-flex items-center gap-1"
            >
              Analyze Video Ad &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 py-20 px-6 max-w-7xl mx-auto border-t border-[#2E2B26]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#F3F2EF]">
            Simple 4-Step Analysis Workflow
          </h2>
          <p className="text-[#B4B0A7] mt-4 text-base">
            From raw upload to actionable creative recommendations in minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-lg bg-[#121110] border border-[#2E2B26]">
            <span className="text-xs font-mono text-[#7C70F6] bg-[#7C70F6]/10 px-2.5 py-1 rounded border border-[#7C70F6]/30">STEP 01</span>
            <h4 className="text-lg font-bold text-[#F3F2EF] mt-4">Upload Asset</h4>
            <p className="text-sm text-[#B4B0A7] mt-2">Secure presigned direct upload with quarantine scan & format checks.</p>
          </div>
          <div className="p-6 rounded-lg bg-[#121110] border border-[#2E2B26]">
            <span className="text-xs font-mono text-[#5FC6DD] bg-[#5FC6DD]/10 px-2.5 py-1 rounded border border-[#5FC6DD]/30">STEP 02</span>
            <h4 className="text-lg font-bold text-[#F3F2EF] mt-4">Multimodal Encoding</h4>
            <p className="text-sm text-[#B4B0A7] mt-2">Extract visual frames, audio cadence, and semantic script tokens.</p>
          </div>
          <div className="p-6 rounded-lg bg-[#121110] border border-[#2E2B26]">
            <span className="text-xs font-mono text-[#FF6B3D] bg-[#FF6B3D]/10 px-2.5 py-1 rounded border border-[#FF6B3D]/30">STEP 03</span>
            <h4 className="text-lg font-bold text-[#F3F2EF] mt-4">Cortical Mapping</h4>
            <p className="text-sm text-[#B4B0A7] mt-2">Transformer inference maps activation vectors across 17 brain clusters.</p>
          </div>
          <div className="p-6 rounded-lg bg-[#121110] border border-[#2E2B26]">
            <span className="text-xs font-mono text-[#E8B84B] bg-[#E8B84B]/10 px-2.5 py-1 rounded border border-[#E8B84B]/30">STEP 04</span>
            <h4 className="text-lg font-bold text-[#F3F2EF] mt-4">Actionable Report</h4>
            <p className="text-sm text-[#B4B0A7] mt-2">Deterministic score cards, ZIP package download, & LLM edit recommendations.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section Teaser */}
      <section id="pricing" className="relative z-10 py-20 px-6 max-w-7xl mx-auto border-t border-[#2E2B26]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#F3F2EF]">
            Transparent Usage-Based Plans
          </h2>
          <p className="text-[#B4B0A7] mt-4 text-base">
            Choose a plan that fits your campaign volume. All plans include team workspaces and report sharing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Starter Plan */}
          <div className="p-8 rounded-xl bg-[#121110] border border-[#2E2B26] flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono text-[#8A867C]">STARTER</span>
              <h3 className="text-2xl font-bold text-[#F3F2EF] mt-2">$49 <span className="text-sm font-normal text-[#8A867C]">/ mo</span></h3>
              <p className="text-sm text-[#B4B0A7] mt-3">Ideal for solo media buyers and small e-commerce stores.</p>
              <ul className="mt-6 space-y-3 text-sm text-[#D4D1CA]">
                <li>✓ 20 Analysis Credits / mo</li>
                <li>✓ Static + Standard Video Analysis</li>
                <li>✓ EP, VP, CS, BR Biometric Scores</li>
                <li>✓ 1 Workspace & 2 Members</li>
              </ul>
            </div>
            <Link
              href="/login"
              className="mt-8 w-full py-3 rounded-md bg-[#1A1815] border border-[#46433C] text-center text-sm font-semibold hover:border-[#7C70F6] transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Growth Plan (Popular) */}
          <div className="p-8 rounded-xl bg-[#1A1815] border-2 border-[#7C70F6] relative flex flex-col justify-between shadow-xl shadow-[#7C70F6]/10">
            <span className="absolute -top-3 right-6 bg-[#7C70F6] text-white text-[11px] font-bold font-mono px-3 py-0.5 rounded-full">
              MOST POPULAR
            </span>
            <div>
              <span className="text-xs font-mono text-[#7C70F6]">GROWTH</span>
              <h3 className="text-2xl font-bold text-[#F3F2EF] mt-2">$149 <span className="text-sm font-normal text-[#8A867C]">/ mo</span></h3>
              <p className="text-sm text-[#B4B0A7] mt-3">Designed for performance agencies and scaling ad accounts.</p>
              <ul className="mt-6 space-y-3 text-sm text-[#D4D1CA]">
                <li>✓ 100 Analysis Credits / mo</li>
                <li>✓ Full TribeV2 GPU Parcellation Engine</li>
                <li>✓ 17 Cluster (A–Q) Activations</li>
                <li>✓ LLM Executive Explanation Reports</li>
                <li>✓ 5 Workspaces & 10 Members</li>
              </ul>
            </div>
            <Link
              href="/login"
              className="mt-8 w-full py-3 rounded-md bg-[#7C70F6] text-white text-center text-sm font-semibold hover:bg-[#6557F5] transition-colors"
            >
              Start 14-Day Free Trial
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="p-8 rounded-xl bg-[#121110] border border-[#2E2B26] flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono text-[#FF6B3D]">ENTERPRISE</span>
              <h3 className="text-2xl font-bold text-[#F3F2EF] mt-2">Custom</h3>
              <p className="text-sm text-[#B4B0A7] mt-3">For enterprise brand studios requiring dedicated GPU clusters.</p>
              <ul className="mt-6 space-y-3 text-sm text-[#D4D1CA]">
                <li>✓ Unlimited Custom Credits</li>
                <li>✓ Training Bundle ML Export (.pt)</li>
                <li>✓ Custom Media Retention Policy</li>
                <li>✓ Dedicated Account Manager</li>
              </ul>
            </div>
            <Link
              href="/login"
              className="mt-8 w-full py-3 rounded-md bg-[#1A1815] border border-[#46433C] text-center text-sm font-semibold hover:border-[#FF6B3D] transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Trust & Security Section */}
      <section id="security" className="relative z-10 py-16 px-6 max-w-7xl mx-auto border-t border-[#2E2B26] text-center">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-[#F3F2EF]">Enterprise Storage Privacy & Content Security</h3>
          <p className="text-[#B4B0A7] mt-3 text-sm leading-relaxed">
            Your ad creative assets and raw videos are uploaded to private, encrypted object storage with quarantine validation. Signed URLs expire automatically, and private media is never exposed publicly.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#2E2B26] py-12 px-6 bg-[#0B0A09]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-[#8A867C]">
          <div>
            <span className="font-bold text-[#F3F2EF]">Sakhaa Signal</span> &copy; 2026. All rights reserved.
          </div>
          <div className="flex items-center gap-6 font-mono text-xs">
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/refund" className="hover:text-white transition-colors">Refund Policy</Link>
            <Link href="/features" className="hover:text-white transition-colors">Features Guide</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
