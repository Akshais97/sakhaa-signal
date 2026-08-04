import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Sakhaa Signal",
  description: "Privacy policy and data retention practices for Sakhaa Signal SaaS Platform.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0B0A09] text-[#F3F2EF] font-sans flex flex-col justify-between">
      <header className="border-b border-[#2E2B26] py-6 px-6 max-w-7xl mx-auto w-full flex justify-between items-center">
        <Link href="/" className="text-lg font-bold text-[#F3F2EF]">Sakhaa Signal</Link>
        <Link href="/" className="text-sm text-[#7C70F6] hover:underline">&larr; Back to Home</Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full space-y-8">
        <h1 className="text-3xl font-bold text-[#F3F2EF]">Privacy Policy</h1>
        <p className="text-sm text-[#8A867C] font-mono">Last Updated: August 4, 2026</p>

        <section className="space-y-4 text-sm text-[#D4D1CA] leading-relaxed">
          <h2 className="text-xl font-semibold text-[#F3F2EF]">1. Data Collection & Security</h2>
          <p>
            Sakhaa Signal collects account email addresses, workspace configuration details, and uploaded media files required for creative analysis. All private media is stored in encrypted S3/B2 buckets using signed expiring URLs.
          </p>

          <h2 className="text-xl font-semibold text-[#F3F2EF]">2. 30-Day Automated Media Retention</h2>
          <p>
            Uploaded raw ad video files and intermediate visual frames are automatically purged after 30 days. Final score outputs and JSON reports remain available in your account until you delete them.
          </p>
        </section>
      </main>

      <footer className="border-t border-[#2E2B26] py-6 text-center text-xs text-[#8A867C] font-mono">
        Sakhaa Signal Privacy Policy
      </footer>
    </div>
  );
}
