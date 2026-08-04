import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePlatformAdminSession } from "@/lib/adminAuth";

// DELETE /api/admin/users/[userId] -> Super Admin Delete User
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { isAuthorized } = await requirePlatformAdminSession();
    if (!isAuthorized) {
      return NextResponse.json({ error: "Platform Admin authorization required" }, { status: 403 });
    }

    const { userId } = await params;

    // Delete memberships first
    await prisma.membership.deleteMany({ where: { userId } });
    await prisma.platformAdmin.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true, deletedUserId: userId });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete user", details: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/users/[userId] -> Super Admin Change Plan & Credit Balance
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { isAuthorized } = await requirePlatformAdminSession();
    if (!isAuthorized) {
      return NextResponse.json({ error: "Platform Admin authorization required" }, { status: 403 });
    }

    const { userId } = await params;
    const { planCode, creditBalance } = await req.json();

    const membership = await prisma.membership.findFirst({
      where: { userId },
      include: { workspace: true },
    });

    if (!membership?.workspaceId) {
      return NextResponse.json({ error: "User workspace not found" }, { status: 404 });
    }

    const workspaceId = membership.workspaceId;

    // 1. Update subscription plan if provided
    if (planCode) {
      await prisma.subscription.upsert({
        where: { id: `sub_${workspaceId}` }, // unique dummy or update existing
        update: { planCode, status: "ACTIVE" },
        create: {
          workspaceId,
          provider: "PLATFORM_ADMIN",
          providerSubscriptionId: `admin_sub_${workspaceId.substring(0, 8)}`,
          planCode,
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // 2. Update credit balance if provided
    if (typeof creditBalance === "number") {
      await prisma.creditBalance.upsert({
        where: { workspaceId },
        update: { balance: creditBalance },
        create: { workspaceId, balance: creditBalance },
      });

      await prisma.usageLedger.create({
        data: {
          workspaceId,
          usageType: "ADMIN_ADJUSTMENT",
          quantity: 1,
          unit: "CREDITS",
          creditsDelta: creditBalance,
          reason: `Super Admin credit override to ${creditBalance} credits`,
        },
      });
    }

    return NextResponse.json({ success: true, userId, workspaceId, planCode, creditBalance });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update user plan/credits", details: error.message }, { status: 500 });
  }
}
