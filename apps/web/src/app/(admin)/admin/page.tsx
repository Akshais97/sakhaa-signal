export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
import prisma from "@/lib/db";

export default async function AdminOverviewPage() {
  const workspaceCount = await prisma.workspace.count();
  const userCount = await prisma.user.count();
  const totalJobsCount = await prisma.analysisJob.count();
  const failedJobsCount = await prisma.analysisJob.count({ where: { status: "FAILED" } });
  const recentJobs = await prisma.analysisJob.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { workspace: true },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#F3F2EF]">Platform Overview</h1>
        <p className="text-sm text-[#B4B0A7] mt-1">Real-time SaaS system metrics, customer accounts, and worker execution health.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-xl bg-[#121110] border border-[#2E2B26]">
          <span className="text-xs font-mono text-[#8A867C]">TOTAL WORKSPACES</span>
          <div className="text-3xl font-extrabold text-[#7C70F6] mt-2 font-mono">{workspaceCount}</div>
        </div>

        <div className="p-6 rounded-xl bg-[#121110] border border-[#2E2B26]">
          <span className="text-xs font-mono text-[#8A867C]">REGISTERED USERS</span>
          <div className="text-3xl font-extrabold text-[#5BD08C] mt-2 font-mono">{userCount}</div>
        </div>

        <div className="p-6 rounded-xl bg-[#121110] border border-[#2E2B26]">
          <span className="text-xs font-mono text-[#8A867C]">TOTAL CREATIVE JOBS</span>
          <div className="text-3xl font-extrabold text-[#5FC6DD] mt-2 font-mono">{totalJobsCount}</div>
        </div>

        <div className="p-6 rounded-xl bg-[#121110] border border-[#2E2B26]">
          <span className="text-xs font-mono text-[#8A867C]">FAILED JOBS (TRIAGE)</span>
          <div className="text-3xl font-extrabold text-[#7C70F6] mt-2 font-mono">{failedJobsCount}</div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-[#F3F2EF]">Recent Analysis Jobs</h2>
          <Link href="/admin/jobs" className="text-xs font-mono text-[#7C70F6] hover:underline">
            View All Jobs &rarr;
          </Link>
        </div>

        <div className="border border-[#2E2B26] rounded-xl overflow-hidden bg-[#121110] divide-y divide-[#2E2B26]">
          {recentJobs.map((job: any) => (
            <div key={job.id} className="p-4 flex items-center justify-between text-sm">
              <div>
                <p className="font-semibold text-[#F3F2EF]">{job.title || "Untitled Job"}</p>
                <p className="text-xs text-[#8A867C] font-mono">
                  Workspace: {job.workspace?.name} &bull; Mode: {job.mode}
                </p>
              </div>
              <span
                className={`text-xs font-mono px-2.5 py-1 rounded border ${
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
          ))}
        </div>
      </div>
    </div>
  );
}
