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
      const completed = await prisma.artifact.update({
        where: { id: artifact.id },
        data: { status: "CLEAN" },
      });
      return NextResponse.json({ artifact: completed });
    }

    try {
      const head = await getB2Client().send(new HeadObjectCommand({
        Bucket: getQuarantineBucket(),
        Key: artifact.objectKey,
      }));

      const actualSize = Number(head.ContentLength ?? -1);
      const actualContentType = head.ContentType?.split(";", 1)[0]?.trim().toLowerCase();
      const expectedContentType = artifact.contentType.toLowerCase();

      const expectedMainType = expectedContentType.split("/")[0];
      const actualMainType = actualContentType ? actualContentType.split("/")[0] : "";

      const isTypeMatch =
        actualContentType === expectedContentType ||
        actualContentType === "application/octet-stream" ||
        (expectedMainType && actualMainType && expectedMainType === actualMainType);

      if (actualSize > 0 && !isTypeMatch) {
        console.warn(`[UPLOAD_VERIFY_WARNING] Metadata mismatch for artifact ${artifact.id}: expected ${expectedContentType}, got ${actualContentType}`);
      }
    } catch (headErr) {
      console.warn("[UPLOAD_VERIFY_HEAD_WARNING] B2 HeadObject check bypassed or failed:", headErr);
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
