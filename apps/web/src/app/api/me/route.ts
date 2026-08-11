import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth";

// GET /api/me -> Fetch current user profile & active workspace
export async function GET(req: NextRequest) {
  try {
    const { user: sessionUser, workspace: ws } = await getAuthenticatedSession();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let dbUser = null;
    try {
      dbUser = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: {
          id: true,
          email: true,
          displayName: true,
          createdAt: true,
        },
      });
    } catch (dbErr) {
      console.warn("[API/ME DB WARNING]", dbErr);
    }

    const userPayload = {
      ...(dbUser || sessionUser),
      isPlatformAdmin: (sessionUser as any)?.isPlatformAdmin ?? false,
    };

    return NextResponse.json({
      user: userPayload,
      workspace: ws,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch user profile", details: error.message }, { status: 500 });
  }
}

// PATCH /api/me -> Update user display name and profile settings
export async function PATCH(req: NextRequest) {
  try {
    const { user: sessionUser } = await getAuthenticatedSession();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { displayName } = await req.json();

    if (typeof displayName !== "string") {
      return NextResponse.json({ error: "displayName must be a string" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: sessionUser.id },
      data: { displayName: displayName.trim() },
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
      },
    });

    const userPayload = {
      ...updatedUser,
      isPlatformAdmin: (sessionUser as any)?.isPlatformAdmin ?? false,
    };

    return NextResponse.json({ success: true, user: userPayload });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update profile", details: error.message }, { status: 500 });
  }
}
