export const dynamic = "force-dynamic";

import React from "react";
import prisma from "@/lib/db";

export default async function AdminJobsPage() {
  const jobs = await prisma.analysisJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      workspace: true,
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#F3F2EF]">Job Triage & Failure Inspector</h1>
        <p className="text-sm text-[#B4B0A7] mt-1">Audit all static and video analysis execution logs, retry stuck jobs, or grant refunds.</p>
      </div>

      <div className="border border-[#2E2B26] rounded-xl overflow-hidden bg-[#121110] divide-y divide-[#2E2B26]">
        {jobs.map((job) => (
          <div key={job.id} className="p-6 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="text-xs font-mono text-[#8A867C]">JOB ID: {job.id}</span>
                <h3 className="text-lg font-bold text-[#F3F2EF] mt-0.5">{job.title || "Untitled Analysis"}</h3>
              </div>
              <span
                className={`text-xs font-mono px-3 py-1 rounded border ${
                  job.status === "SUCCEEDED"
                    ? "bg-[#5BD08C]/10 border-[#5BD08C]/30 text-[#5BD08C]"
                    : job.status === "FAILED"
                    ? "bg-[#7C70F6]/10 border-[#7C70F6]/30 text-[#7C70F6]"
                    : "bg-[#5FC6DD]/10 border-[#5FC6DD]/30 text-[#5FC6DD]"
                }`}
              >
                {job.status}
              </span>
            </div>

            <div className="text-xs text-[#B4B0A7] font-mono flex flex-wrap gap-4">
              <span>Workspace: {job.workspace?.name}</span>
              <span>Mode: {job.mode}</span>
              <span>Media: {job.mediaType}</span>
              <span>Created: {new Date(job.createdAt).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
