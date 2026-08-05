import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth";
import { roleCan } from "@/lib/rbac";

// DELETE /api/workspaces/[workspaceId]/members/[memberId] -> Remove member
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  try {
    const { user, workspace: ws } = await getAuthenticatedSession();
    if (!user || !ws) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, memberId } = await params;
    if (ws.id !== workspaceId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check user membership role in workspace
    const actorMembership = await prisma.membership.findFirst({
      where: { workspaceId, userId: user.id },
    });

    if (!actorMembership || !roleCan(actorMembership.role, "member:remove")) {
      return NextResponse.json({ error: "Permission denied. Only Owner or Admin can remove members." }, { status: 403 });
    }

    const targetMembership = await prisma.membership.findFirst({
      where: { id: memberId, workspaceId },
    });

    if (!targetMembership) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Prevent removing the last OWNER
    if (targetMembership.role === "OWNER") {
      const ownerCount = await prisma.membership.count({
        where: { workspaceId, role: "OWNER" },
      });
      if (ownerCount <= 1) {
        return NextResponse.json({ error: "Cannot remove the sole workspace Owner." }, { status: 400 });
      }
    }

    await prisma.membership.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ success: true, removedMemberId: memberId });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to remove member", details: error.message }, { status: 500 });
  }
}

// PATCH /api/workspaces/[workspaceId]/members/[memberId] -> Update member role
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  try {
    const { user, workspace: ws } = await getAuthenticatedSession();
    if (!user || !ws) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, memberId } = await params;
    if (ws.id !== workspaceId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const actorMembership = await prisma.membership.findFirst({
      where: { workspaceId, userId: user.id },
    });

    if (!actorMembership || !roleCan(actorMembership.role, "member:update_role")) {
      return NextResponse.json({ error: "Permission denied. Only Owner or Admin can update roles." }, { status: 403 });
    }

    const { role } = await req.json();
    if (!["OWNER", "ADMIN", "CLIENT_MANAGER", "REVIEWER"].includes(role)) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    const updated = await prisma.membership.update({
      where: { id: memberId },
      data: { role },
      include: { user: { select: { id: true, email: true, displayName: true } } },
    });

    return NextResponse.json({ success: true, member: updated });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update member role", details: error.message }, { status: 500 });
  }
}
