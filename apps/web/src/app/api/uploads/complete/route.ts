import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth";
import { getB2Client, getQuarantineBucket, isB2Configured } from "@/lib/b2";

export async function POST(req: NextRequest) {
  try {
    const { user, workspace } = await getAuthenticatedSession();
    if (!user || !workspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { artifactId } = await req.json();
    if (typeof artifactId !== "string") {
      return NextResponse.json({ error: "artifactId is required" }, { status: 400 });
    }

    const artifact = await prisma.artifact.findUnique({ where: { id: artifactId } });
    if (!artifact) {
      return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
    }
    if (artifact.workspaceId !== workspace.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    if (!isB2Configured()) {
      if (process.env.NODE_ENV !== "production" && artifact.status === "CLEAN") {
        return NextResponse.json({ artifact });
      }
      return NextResponse.json({ error: "Backblaze B2 is not configured" }, { status: 503 });
    }

    const head = await getB2Client().send(new HeadObjectCommand({
      Bucket: getQuarantineBucket(),
      Key: artifact.objectKey,
    }));
    const actualSize = Number(head.ContentLength ?? -1);
    const actualContentType = head.ContentType?.split(";", 1)[0]?.trim().toLowerCase();
    const expectedContentType = artifact.contentType.toLowerCase();

    if (actualSize !== artifact.byteSize || actualContentType !== expectedContentType) {
      await prisma.artifact.update({
        where: { id: artifact.id },
        data: { status: "REJECTED" },
      });
      return NextResponse.json({
        error: "Uploaded object metadata does not match the presigned upload",
        expected: { byteSize: artifact.byteSize, contentType: artifact.contentType },
        actual: { byteSize: actualSize, contentType: head.ContentType ?? null },
      }, { status: 409 });
    }

    const completed = await prisma.artifact.update({
      where: { id: artifact.id },
      data: { status: "CLEAN" },
    });
    return NextResponse.json({ artifact: completed });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to verify upload", details }, { status: 500 });
  }
}
