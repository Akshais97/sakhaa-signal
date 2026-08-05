import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import prisma from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { user } = await getAuthenticatedSession();
    if (!user) {
      return NextResponse.json({ error: "Authentication required to accept invite" }, { status: 401 });
    }

    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const invite = await prisma.workspaceInvite.findFirst({
      where: {
        tokenHash,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invalid or expired invitation token" }, { status: 400 });
    }

    // Create or update membership
    await prisma.membership.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: invite.workspaceId,
          userId: user.id,
        },
      },
      update: {
        role: invite.role,
      },
      create: {
        userId: user.id,
        workspaceId: invite.workspaceId,
        role: invite.role,
      },
    });

    // Mark invite as ACCEPTED
    await prisma.workspaceInvite.update({
      where: { id: invite.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, workspaceId: invite.workspaceId });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to accept invite", details: error.message }, { status: 500 });
  }
}
