import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import { PrismaClient } from "../../packages/db/generated/client/index.js";

// Regression: PRESIGN-WORKSPACE-001 — authenticated uploads returned
// WORKSPACE_RESOLUTION_FAILED before B2 presigning.
// Found by /qa on 2026-08-12.
// Report: .gstack/qa-reports/qa-report-localhost-2026-08-12.md

const DEV_USER_ID = "00000000-0000-4000-8000-000000000001";
const DEV_WORKSPACE_ID = "00000000-0000-4000-8000-000000000002";

test("authenticated browser resolves a persisted workspace before requesting an upload URL", {
  timeout: 90_000,
}, async () => {
  if (!process.env.DATABASE_URL && typeof process.loadEnvFile === "function") {
    process.loadEnvFile(path.resolve(process.cwd(), ".env"));
  }

  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required for the presign regression test");
  assert.ok(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    "Supabase URL is required for the presign regression test",
  );

  const port = 4300 + (process.pid % 300);
  const baseUrl = `http://127.0.0.1:${port}`;
  const nextBin = path.resolve(process.cwd(), "apps/web/node_modules/next/dist/bin/next");
  const screenshotDir = path.resolve(process.cwd(), ".gstack/qa-reports/screenshots");
  const sampleImage = path.resolve(process.cwd(), "samples/Social_Media_creative_sample.png");
  const sampleSize = (await stat(sampleImage)).size;
  const serverOutput = [];
  const server = spawn(process.execPath, [
    nextBin,
    "dev",
    "--webpack",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ], {
    cwd: path.resolve(process.cwd(), "apps/web"),
    env: {
      ...process.env,
      ALLOW_DEV_BYPASS: "true",
      NEXT_PUBLIC_APP_URL: baseUrl,
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  server.stdout.on("data", (chunk) => serverOutput.push(chunk.toString()));
  server.stderr.on("data", (chunk) => serverOutput.push(chunk.toString()));

  const options = new chrome.Options();
  options.addArguments(
    "--headless=new",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--window-size=1440,900",
  );

  let driver;
  let artifactId;
  const prisma = new PrismaClient();
  try {
    await waitForServer(`${baseUrl}/login`, server, serverOutput);
    driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();

    await driver.get(`${baseUrl}/dashboard`);
    const openWizard = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(normalize-space(), 'New creative analysis')]")),
      20_000,
    );
    await openWizard.click();

    const fileInput = await driver.wait(until.elementLocated(By.css("input[type='file']")), 10_000);
    await fileInput.sendKeys(sampleImage);
    await driver.wait(until.elementLocated(By.xpath("//*[contains(., 'Social_Media_creative_sample.png')]")), 10_000);

    await mkdir(screenshotDir, { recursive: true });
    await writeFile(
      path.join(screenshotDir, "presign-workspace-before.png"),
      await driver.takeScreenshot(),
      "base64",
    );

    const result = await driver.executeAsyncScript(
      function requestPresign(fileName, byteSize, done) {
        fetch("/api/uploads/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName,
            contentType: "image/png",
            byteSize,
            mediaType: "image",
          }),
        })
          .then(async (response) => ({ status: response.status, body: await response.json() }))
          .then(done)
          .catch((error) => done({ status: 0, body: { error: error.message } }));
      },
      path.basename(sampleImage),
      sampleSize,
    );

    assert.equal(result.status, 200, JSON.stringify(result.body));
    assert.equal(result.body.workspaceId, DEV_WORKSPACE_ID);
    assert.match(result.body.uploadUrl, /^https?:\/\//);
    assert.ok(result.body.artifactId);
    artifactId = result.body.artifactId;

    await writeFile(
      path.join(screenshotDir, "presign-workspace-after.png"),
      await driver.takeScreenshot(),
      "base64",
    );
  } finally {
    if (driver) await driver.quit();
    server.kill();

    if (artifactId) {
      await prisma.artifact.deleteMany({ where: { id: artifactId } });
    }
    await prisma.membership.deleteMany({
      where: { workspaceId: DEV_WORKSPACE_ID, userId: DEV_USER_ID },
    });
    await prisma.workspace.deleteMany({ where: { id: DEV_WORKSPACE_ID } });
    await prisma.user.deleteMany({ where: { id: DEV_USER_ID } });
    await prisma.$disconnect();
  }
});

async function waitForServer(url, server, output) {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Next.js exited before startup:\n${output.join("")}`);
    }
    try {
      const response = await fetch(url, { redirect: "manual" });
      await response.arrayBuffer();
      if (response.status < 500) return;
    } catch {
      // Development server is still compiling.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Next.js did not start within 45 seconds:\n${output.join("")}`);
}
