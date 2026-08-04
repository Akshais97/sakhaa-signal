export const dynamic = "force-dynamic";

import React from "react";
import prisma from "@/lib/db";

export default async function AdminWorkspacesPage() {
  const workspaces = await prisma.workspace.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      createdAt: true,
      _count: {
        select: { memberships: true },
      },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#F3F2EF]">Workspace Operations</h1>
        <p className="text-sm text-[#B4B0A7] mt-1">Inspect tenant accounts, adjust internal credit balances, and manage status.</p>
      </div>

      <div className="border border-[#2E2B26] rounded-xl overflow-hidden bg-[#121110] divide-y divide-[#2E2B26]">
        {workspaces.map((ws) => (
          <div key={ws.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-[#F3F2EF]">{ws.name}</h3>
                <span className="text-xs font-mono text-[#7C70F6] bg-[#7C70F6]/10 px-2 py-0.5 rounded border border-[#7C70F6]/30">
                  ID: {ws.id.slice(0, 8)}
                </span>
              </div>
              <p className="text-xs text-[#8A867C] font-mono mt-1">
                Slug: {ws.slug} &bull; Members: {ws._count.memberships} &bull; Created: {new Date(ws.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-[#5BD08C] bg-[#5BD08C]/10 border border-[#5BD08C]/30 px-3 py-1.5 rounded">
                STATUS: {ws.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
