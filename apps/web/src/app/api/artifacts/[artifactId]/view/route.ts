import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth";
import { getB2Client, getPrivateArtifactsBucket, getQuarantineBucket } from "@/lib/b2";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ artifactId: string }> }
) {
  try {
    const { user, workspace } = await getAuthenticatedSession();
    if (!user || !workspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { artifactId } = await params;
    const artifact = await prisma.artifact.findUnique({ where: { id: artifactId } });
    if (!artifact || artifact.status !== "CLEAN") {
      return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
    }

    if (artifact.workspaceId !== workspace.id && !user.isPlatformAdmin) {
      const membership = await prisma.membership.findFirst({
        where: { userId: user.id, workspaceId: artifact.workspaceId, status: "ACTIVE" },
        select: { id: true },
      });
      if (!membership) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const bucket = artifact.retentionClass === "ANALYSIS_INPUT"
      ? getQuarantineBucket()
      : getPrivateArtifactsBucket();
    const signedUrl = await getSignedUrl(
      getB2Client(),
      new GetObjectCommand({
        Bucket: bucket,
        Key: artifact.objectKey,
        ResponseContentType: artifact.contentType,
        ResponseContentDisposition: `inline; filename="${artifact.fileName.replace(/["\r\n]/g, "_")}"`,
      }),
      { expiresIn: 5 * 60 }
    );

    return NextResponse.redirect(signedUrl, 307);
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to create artifact view URL", details }, { status: 500 });
  }
}
