import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth";

// DELETE /api/workspaces/[workspaceId]/invites/[inviteId] -> Revoke pending invite
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; inviteId: string }> }
) {
  try {
    const { user, workspace: ws } = await getAuthenticatedSession();
    if (!user || !ws) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, inviteId } = await params;
    if (ws.id !== workspaceId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.workspaceInvite.update({
      where: { id: inviteId },
      data: { status: "REVOKED", revokedAt: new Date() },
    });

    return NextResponse.json({ success: true, revokedInviteId: inviteId });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to revoke invitation", details: error.message }, { status: 500 });
  }
}
