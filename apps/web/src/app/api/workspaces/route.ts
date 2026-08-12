import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth";

// GET /api/workspaces -> List workspaces available to the signed-in user.
export async function GET() {
  try {
    const { user } = await getAuthenticatedSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberships = await prisma.membership.findMany({
      where: {
        userId: user.id,
        status: "ACTIVE",
        workspace: { status: "ACTIVE" },
      },
      orderBy: { createdAt: "asc" },
      select: {
        role: true,
        workspace: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({
      workspaces: memberships.map(({ workspace, role }: any) => ({
        ...workspace,
        role,
      })),
    });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch workspaces", details },
      { status: 500 }
    );
  }
}
