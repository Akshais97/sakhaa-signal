import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import prisma from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth";
import { resolvePathSafely } from "@/lib/storageUtils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const objectKey = searchParams.get("key");

    if (!objectKey) {
      return NextResponse.json({ error: "Missing required query parameter: key" }, { status: 400 });
    }

    // Workspace authorization check for non-demo keys
    const isDemoKey = objectKey.includes("job_demo_") || objectKey.startsWith("samples/");
    if (!isDemoKey) {
      const { user, workspace: ws } = await getAuthenticatedSession();
      if (!user || !ws) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const parts = objectKey.split("/");
      if (parts.length >= 2 && (parts[0] === "uploads" || parts[0] === "exports")) {
        const jobId = parts[1];
        const job = await prisma.job.findUnique({
          where: { id: jobId },
        });
        if (job && job.workspaceId !== ws.id && !user.isPlatformAdmin) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
      }
    }

    const provider = process.env.OBJECT_STORAGE_PROVIDER || "local-filesystem";
    let fileBuffer: Buffer | null = null;
    let contentType = "video/mp4";

    if (objectKey.endsWith(".png")) contentType = "image/png";
    else if (objectKey.endsWith(".jpg") || objectKey.endsWith(".jpeg")) contentType = "image/jpeg";
    else if (objectKey.endsWith(".json")) contentType = "application/json";

    // 1. Try S3/B2 Storage if configured
    if ((provider === "b2" || provider === "s3") && process.env.AWS_ACCESS_KEY_ID) {
      try {
        const s3Client = new S3Client({
          region: process.env.AWS_DEFAULT_REGION || process.env.OBJECT_STORAGE_REGION || "eu-central-003",
          endpoint: process.env.AWS_ENDPOINT_URL || process.env.OBJECT_STORAGE_ENDPOINT,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.OBJECT_STORAGE_KEY_ID || "",
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.OBJECT_STORAGE_APPLICATION_KEY || "",
          },
          forcePathStyle: true,
        });

        const bucket = process.env.B2_BUCKET_QUARANTINE || process.env.B2_BUCKET_CLEAN_MEDIA || "v0-local-quarantine";
        const command = new GetObjectCommand({
          Bucket: bucket,
          Key: objectKey,
        });

        const response = await s3Client.send(command);
        if (response.Body) {
          const stream = response.Body as Readable;
          const chunks: Buffer[] = [];
          for await (const chunk of stream) {
            chunks.push(Buffer.from(chunk));
          }
          fileBuffer = Buffer.concat(chunks);
          if (response.ContentType) contentType = response.ContentType;
        }
      } catch (s3Err: any) {
        console.warn(`[VIEW_PROXY_WARNING] S3/B2 fetch failed for key '${objectKey}': ${s3Err.message}`);
      }
    }

    // 2. Fallback to Local Storage Simulator
    if (!fileBuffer) {
      const storageRoots = [
        path.resolve(process.cwd(), ".local", "storage", "v0-local-quarantine"),
        path.resolve(process.cwd(), "..", "..", ".local", "storage", "v0-local-quarantine"),
        path.resolve(process.cwd(), "samples"),
      ];

      for (const storageRoot of storageRoots) {
        const localFilePath = resolvePathSafely(storageRoot, objectKey);
        if (localFilePath && existsSync(localFilePath)) {
          fileBuffer = await readFile(localFilePath);
          break;
        }
      }
    }

    // 3. Fallback to sample video if local quarantine copy not found
    if (!fileBuffer) {
      const samplePath = path.resolve(process.cwd(), "samples", "video_sample_ppc.mp4");
      if (existsSync(samplePath)) {
        fileBuffer = await readFile(samplePath);
      }
    }

    if (!fileBuffer) {
      return NextResponse.json({ error: "Media file not found" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileBuffer.byteLength.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("[VIEW_PROXY_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to stream media file", details: error.message },
      { status: 500 }
    );
  }
}
