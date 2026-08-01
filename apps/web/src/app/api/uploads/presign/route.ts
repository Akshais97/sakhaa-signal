import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import prisma from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { workspace: ws } = await getAuthenticatedSession();
    const body = await req.json();
    const { fileName, contentType, byteSize, mediaType } = body;

    if (!fileName || !contentType || !byteSize || !mediaType) {
      return NextResponse.json(
        { error: "Missing required upload parameters: fileName, contentType, byteSize, mediaType" },
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
