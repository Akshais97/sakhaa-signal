import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Missing storage key query param" }, { status: 400 });
    }

    // Determine the local filesystem destination
    const storageRoot = path.resolve(process.cwd(), ".local", "storage", "v0-local-quarantine");
    const filePath = path.join(storageRoot, key);
    const dirPath = path.dirname(filePath);

    // Ensure containing directory exists
    await mkdir(dirPath, { recursive: true });

    // Read upload body as buffer
    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

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
