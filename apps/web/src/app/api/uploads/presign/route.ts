import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import prisma from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth";
import { MAX_UPLOAD_SIZE_BYTES } from "@/lib/storageUtils";

export async function POST(req: NextRequest) {
  try {
    const { user, workspace: ws } = await getAuthenticatedSession();
    if (!user || !ws) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { fileName, contentType, byteSize, mediaType } = body;

    if (!fileName || !contentType || !byteSize || !mediaType) {
      return NextResponse.json(
        { error: "Missing required upload parameters: fileName, contentType, byteSize, mediaType" },
        { status: 400 }
      );
    }

    const sizeInBytes = Number(byteSize);
    if (isNaN(sizeInBytes) || sizeInBytes <= 0) {
      return NextResponse.json({ error: "Invalid upload payload size" }, { status: 400 });
    }

    if (sizeInBytes > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `File size (${(sizeInBytes / (1024 * 1024)).toFixed(1)}MB) exceeds maximum allowed limit of ${(
            MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)
          ).toFixed(0)}MB`,
        },
        { status: 413 }
      );
    }

    // Validate allowed file extensions
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    const allowedExtensions = ["mp4", "mov", "webm", "avi", "png", "jpg", "jpeg", "webp"];
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported file extension '.${ext}'. Allowed formats: ${allowedExtensions.join(", ")}` },
        { status: 400 }
      );
    }

    const artifactId = crypto.randomUUID();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectKey = `workspaces/${ws.id}/analyses/${artifactId}/${sanitizedFileName}`;

    // Create DB artifact record
    const artifact = await prisma.artifact.create({
      data: {
        id: artifactId,
        workspaceId: ws.id,
        fileName: sanitizedFileName,
        contentType,
        byteSize: Number(byteSize),
        sha256: "0".repeat(64),
        status: "QUARANTINED",
        retentionClass: "ANALYSIS_INPUT",
        producer: "USER_UPLOAD",
        schemaVersion: "v1",
        objectKey,
      },
    });

    // Use same-origin upload proxy endpoint to guarantee 0 CORS preflight issues across all browsers
    const uploadUrl = `/api/uploads/direct?key=${encodeURIComponent(objectKey)}&artifactId=${artifact.id}`;

    return NextResponse.json({
      uploadUrl,
      artifactId: artifact.id,
      objectKey,
      workspaceId: ws.id,
    });
  } catch (error: any) {
    console.error("[PRESIGN_UPLOAD_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL", details: error.message },
      { status: 500 }
    );
  }
}
