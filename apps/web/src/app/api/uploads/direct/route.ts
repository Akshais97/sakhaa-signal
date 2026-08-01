import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import prisma from "@/lib/db";

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const objectKey = searchParams.get("key");
    const artifactId = searchParams.get("artifactId");

    if (!objectKey) {
      return NextResponse.json({ error: "Missing required query parameter: key" }, { status: 400 });
    }

    const contentType = req.headers.get("content-type") || "application/octet-stream";
    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.byteLength === 0) {
      return NextResponse.json({ error: "Uploaded file payload is empty (0 bytes)" }, { status: 400 });
    }

    const provider = process.env.OBJECT_STORAGE_PROVIDER || "local-filesystem";
    let uploadedToS3 = false;

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
        const command = new PutObjectCommand({
          Bucket: bucket,
          Key: objectKey,
          ContentType: contentType,
          Body: buffer,
        });

        await s3Client.send(command);
        uploadedToS3 = true;
        console.log(`[UPLOAD_PROXY_S3] Successfully uploaded ${buffer.byteLength} bytes to S3/B2 key: ${objectKey}`);
      } catch (err: any) {
        console.warn(`[UPLOAD_PROXY_WARNING] S3/B2 upload failed (${err.message}). Saving to local storage simulator fallback...`);
      }
    }

    // Always ensure local storage copy as fallback in both web app local path and workspace root
    const storageRoots = [
      path.resolve(process.cwd(), ".local", "storage", "v0-local-quarantine"),
      path.resolve(process.cwd(), "..", "..", ".local", "storage", "v0-local-quarantine"),
    ];

    for (const storageRoot of storageRoots) {
      const filePath = path.join(storageRoot, objectKey);
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, buffer);
    }

    if (artifactId) {
      try {
        await prisma.artifact.update({
          where: { id: artifactId },
          data: {
            status: "CLEAN",
            byteSize: buffer.byteLength,
          },
        });
      } catch (e) {}
    }

    return NextResponse.json({
      success: true,
      objectKey,
      byteSize: buffer.byteLength,
      storage: uploadedToS3 ? "S3/B2" : "LOCAL_SIMULATOR",
    });
  } catch (error: any) {
    console.error("[UPLOAD_PROXY_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to upload file via direct upload proxy", details: error.message },
      { status: 500 }
    );
  }
}
