import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import prisma from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth";
import { resolvePathSafely } from "@/lib/storageUtils";

export async function PUT(req: NextRequest) {
  try {
    const { user, workspace: ws } = await getAuthenticatedSession();
    if (!user || !ws) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Missing storage key query param" }, { status: 400 });
    }

    const parts = key.split("/");
    if (parts.length >= 2 && (parts[0] === "uploads" || parts[0] === "exports")) {
      const jobId = parts[1];
      const job = await prisma.job.findUnique({
        where: { id: jobId },
      });
      if (job && job.workspaceId !== ws.id && !user.isPlatformAdmin) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Determine the local filesystem destination with containment check
    const storageRoot = path.resolve(process.cwd(), ".local", "storage", "v0-local-quarantine");
    const filePath = resolvePathSafely(storageRoot, key);

    if (!filePath) {
      return NextResponse.json({ error: "Invalid key or path traversal attempt detected" }, { status: 400 });
    }

    const dirPath = path.dirname(filePath);

    // Ensure containing directory exists
    await mkdir(dirPath, { recursive: true });

    // Read upload body as buffer
    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!buffer || buffer.byteLength === 0) {
      return NextResponse.json(
        { error: "Uploaded file is empty or corrupted (0 bytes received). Please re-upload a valid image file." },
        { status: 400 }
      );
    }

    // Save file
    await writeFile(filePath, buffer);
    console.log(`[STORAGE SIMULATOR] Upload saved to: ${filePath} (${buffer.byteLength} bytes)`);

    return NextResponse.json({
      success: true,
      message: "File successfully saved to local simulator storage.",
      byteSize: buffer.byteLength,
      path: filePath
    });
  } catch (error: any) {
    console.error("[STORAGE SIMULATOR] Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file to simulator storage", details: error.message },
      { status: 500 }
    );
  }
}
