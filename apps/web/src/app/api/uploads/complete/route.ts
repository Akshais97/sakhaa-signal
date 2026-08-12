import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { withUserDatabaseContext } from "@/lib/db-context";
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

    const artifact = await withUserDatabaseContext(user.id, workspace.id, (tx) =>
      tx.artifact.findFirst({ where: { id: artifactId, workspaceId: workspace.id } }),
    );
    if (!artifact) {
      return NextResponse.json({ error: "Upload artifact not found" }, { status: 404 });
    }

    if (!isB2Configured()) {
      return NextResponse.json({ error: "Backblaze B2 is not configured" }, { status: 503 });
    }

    const head = await getB2Client().send(new HeadObjectCommand({
      Bucket: getQuarantineBucket(),
      Key: artifact.objectKey,
    }));
    if (!head.ContentLength || head.ContentLength <= 0) {
      return NextResponse.json({ error: "Uploaded object is empty" }, { status: 422 });
    }
    if (head.ContentLength !== artifact.byteSize) {
      return NextResponse.json(
        { error: "Uploaded object size does not match the requested upload" },
        { status: 422 },
      );
    }

    const completed = await withUserDatabaseContext(user.id, workspace.id, (tx) =>
      tx.artifact.update({ where: { id: artifact.id }, data: { status: "CLEAN" } }),
    );
    return NextResponse.json({ artifact: completed });
  } catch (error: unknown) {
    console.error("[UPLOAD_COMPLETE_ERROR]", error);
    return NextResponse.json(
      { error: "Upload verification is temporarily unavailable", code: "UPLOAD_VERIFICATION_FAILED" },
      { status: 503 },
    );
  }
}
