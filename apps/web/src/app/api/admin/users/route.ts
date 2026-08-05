import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import prisma from "@/lib/db";
import { requirePlatformAdminSession } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  try {
    const { isAuthorized } = await requirePlatformAdminSession();
    if (!isAuthorized) {
      return NextResponse.json({ error: "Platform Admin authorization required" }, { status: 403 });
    }

    // High performance parallel batch query (eliminates N+1 DB bottleneck)
    const [users, creditBalances, subscriptions] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          memberships: {
            include: {
              workspace: true,
            },
          },
        },
      }),
      prisma.creditBalance.findMany(),
      prisma.subscription.findMany({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const creditMap = new Map<string, number>();
    for (const cb of creditBalances) {
      creditMap.set(cb.workspaceId, Number(cb.balance));
    }

    const subMap = new Map<string, string>();
    for (const sub of subscriptions) {
      if (!subMap.has(sub.workspaceId)) {
        subMap.set(sub.workspaceId, sub.planCode);
      }
    }

    const mappedUsers = users.map((u) => {
      const primaryMembership = u.memberships[0];
      const workspace = primaryMembership?.workspace;
      const wsId = workspace?.id;

      const creditBalance = wsId && creditMap.has(wsId) ? creditMap.get(wsId)! : 5.0;
      const planCode = wsId && subMap.has(wsId) ? subMap.get(wsId)! : "STARTER";

      return {
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        createdAt: u.createdAt,
        membershipRole: primaryMembership?.role || "MEMBER",
        workspaceId: wsId || null,
        workspaceName: workspace?.name || "No Workspace",
        planCode,
        creditBalance,
      };
    });

    return NextResponse.json({ users: mappedUsers });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to list users", details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { isAuthorized } = await requirePlatformAdminSession();
    if (!isAuthorized) {
      return NextResponse.json({ error: "Platform Admin authorization required" }, { status: 403 });
    }

    const { email, displayName, role = "CLIENT_MANAGER", initialCredits = 20, planCode = "GROWTH" } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const userId = crypto.randomUUID();

    // 1. Create User
    const user = await prisma.user.create({
      data: {
        id: userId,
        email,
        displayName: displayName || email.split("@")[0],
      },
    });

    // 2. Create Workspace for User
    const workspace = await prisma.workspace.create({
      data: {
        name: `${displayName || email.split("@")[0]}'s Workspace`,
        slug: `workspace-${userId.substring(0, 8)}`,
        memberships: {
          create: {
            userId: user.id,
            role: role as any,
          },
        },
      },
    });

    // 3. Create Subscription & Credit Balance
    await prisma.subscription.create({
      data: {
        workspaceId: workspace.id,
        provider: "PLATFORM_ADMIN",
        providerSubscriptionId: `admin_sub_${crypto.randomUUID().substring(0, 8)}`,
        planCode,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.creditBalance.create({
      data: {
        workspaceId: workspace.id,
        balance: initialCredits,
      },
    });

    await prisma.usageLedger.create({
      data: {
        workspaceId: workspace.id,
        usageType: "ADMIN_ALLOCATION",
        quantity: initialCredits,
        unit: "CREDITS",
        creditsDelta: initialCredits,
        reason: `Initial admin allocation on user creation`,
      },
    });

    return NextResponse.json({ success: true, user, workspaceId: workspace.id });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to create user", details: error.message }, { status: 500 });
  }
}
