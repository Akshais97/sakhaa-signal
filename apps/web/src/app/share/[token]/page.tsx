import React from "react";
import crypto from "node:crypto";
import prisma from "@/lib/db";
import Link from "next/link";

export default async function SharedReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const shareLink = await prisma.reportShareLink.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
  });

  if (!shareLink) {
    return (
      <div className="min-h-screen bg-[#0B0A09] text-[#F3F2EF] font-sans flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-xl bg-[#121110] border border-[#2E2B26] text-center space-y-4">
          <h1 className="text-xl font-bold text-[#F2786C]">Invalid or Expired Report Link</h1>
          <p className="text-sm text-[#B4B0A7]">This shared creative report link has expired or was revoked by the workspace owner.</p>
          <Link href="/" className="inline-block mt-4 text-xs font-mono text-[#7C70F6] hover:underline">
            &larr; Return to Sakhaa Signal Home
          </Link>
        </div>
      </div>
    );
  }

  const job = await prisma.analysisJob.findUnique({
    where: { id: shareLink.analysisJobId },
    include: {
      categoryScores: true,
      findings: true,
    },
  });

  return (
    <div className="min-h-screen bg-[#0B0A09] text-[#F3F2EF] font-sans flex flex-col justify-between">
      <header className="border-b border-[#2E2B26] py-4 px-6 max-w-7xl mx-auto w-full flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-[#F3F2EF]">Sakhaa Signal Shared Diagnostic Report</span>
          <span className="text-xs font-mono bg-[#7C70F6]/10 text-[#7C70F6] px-2 py-0.5 rounded border border-[#7C70F6]/30">READ-ONLY ACCESS</span>
        </div>
        <Link href="/" className="text-xs font-mono text-[#7C70F6] hover:underline">Powered by Sakhaa Signal &rarr;</Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full space-y-8">
        <div>
          <span className="text-xs font-mono text-[#8A867C]">CREATIVE ANALYSIS REPORT</span>
          <h1 className="text-3xl font-bold text-[#F3F2EF] mt-1">{job?.title || "Shared Analysis"}</h1>
          <p className="text-xs text-[#8A867C] font-mono mt-1">Status: {job?.status} &bull; Mode: {job?.mode}</p>
        </div>

        {/* Scores Overview */}
        <div className="p-6 rounded-xl bg-[#121110] border border-[#2E2B26] space-y-4">
          <h2 className="text-lg font-semibold text-[#F3F2EF]">Biometric Outcome Scores</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-center">
            <div className="p-4 rounded-lg bg-[#1A1815] border border-[#2E2B26]">
              <span className="text-xs text-[#8A867C]">EMOTIONAL PULL</span>
              <div className="text-2xl font-bold text-[#7C70F6] mt-1">EP</div>
            </div>
            <div className="p-4 rounded-lg bg-[#1A1815] border border-[#2E2B26]">
              <span className="text-xs text-[#8A867C]">VISUAL PULL</span>
              <div className="text-2xl font-bold text-[#5FC6DD] mt-1">VP</div>
            </div>
            <div className="p-4 rounded-lg bg-[#1A1815] border border-[#2E2B26]">
              <span className="text-xs text-[#8A867C]">CONVERSION</span>
              <div className="text-2xl font-bold text-[#FF6B3D] mt-1">CS</div>
            </div>
            <div className="p-4 rounded-lg bg-[#1A1815] border border-[#2E2B26]">
              <span className="text-xs text-[#8A867C]">BRAND RECALL</span>
              <div className="text-2xl font-bold text-[#E8B84B] mt-1">BR</div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#2E2B26] py-6 text-center text-xs text-[#8A867C] font-mono">
        Shared Report &bull; Directional Analysis &bull; Sakhaa Signal
      </footer>
    </div>
  );
}
