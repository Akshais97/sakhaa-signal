export const dynamic = "force-dynamic";

import React from "react";
import prisma from "@/lib/db";

export default async function AdminWorkersPage() {
  const heartbeats = await prisma.workerHeartbeat.findMany({
    orderBy: { lastSeenAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#F3F2EF]">Worker Heartbeats & GPU Hosts</h1>
        <p className="text-sm text-[#B4B0A7] mt-1">Monitor CPU/GPU worker health, active leases, queue lag, and processing nodes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CPU Worker Card */}
        <div className="p-6 rounded-xl bg-[#121110] border border-[#2E2B26] space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-[#5BD08C] bg-[#5BD08C]/10 border border-[#5BD08C]/30 px-2.5 py-1 rounded">
              ALWAYS-ON ONLINE
            </span>
            <span className="text-xs font-mono text-[#8A867C]">TYPE: CPU_WORKER</span>
          </div>
          <h3 className="text-lg font-bold text-[#F3F2EF]">Static & Standard Video Polling Worker</h3>
          <p className="text-xs text-[#B4B0A7] leading-relaxed">
            Leases jobs every 3s, extracts media streams, runs static creative rules, and generates report artifacts.
          </p>
        </div>

        {/* GPU Worker Card */}
        <div className="p-6 rounded-xl bg-[#121110] border border-[#2E2B26] space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-[#5FC6DD] bg-[#5FC6DD]/10 border border-[#5FC6DD]/30 px-2.5 py-1 rounded">
              STANDBY / DEMAND
            </span>
            <span className="text-xs font-mono text-[#8A867C]">TYPE: GPU_WORKER</span>
          </div>
          <h3 className="text-lg font-bold text-[#F3F2EF]">TribeV2 CUDA GPU Fast-Inference Node</h3>
          <p className="text-xs text-[#B4B0A7] leading-relaxed">
            Processes 3D-ResNet visual, Wav2Vec audio, and BERT text embeddings to run fused transformer model inference.
          </p>
        </div>
      </div>
    </div>
  );
}
