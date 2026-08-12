import path from "node:path";
import { writeFile } from "node:fs/promises";
import { stat } from "node:fs/promises";
import { Builder } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";

const root = process.cwd();
const baseUrl = "https://sakhaa-signal.vercel.app";
const profileRoot = process.env.LIVE_CHROME_USER_DATA_DIR ||
  path.join(root, ".tmp", "selenium-live-profile");
const sample = path.join(root, "samples", "Social_Media_creative_sample.png");
const size = (await stat(sample)).size;

const options = new chrome.Options();
options.addArguments(
  "--headless=new",
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--window-size=1440,900",
  `--user-data-dir=${profileRoot}`,
  "--profile-directory=Profile 8",
);

const driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();
try {
  await driver.get(`${baseUrl}/dashboard`);
  await driver.sleep(2500);
  const url = await driver.getCurrentUrl();
  const deploymentId = await driver.executeScript(
    "return document.documentElement.getAttribute('data-dpl-id') || null",
  );
  const cookies = await driver.manage().getCookies();
  const authCookieNames = cookies
    .map((cookie) => cookie.name)
    .filter((name) => name.startsWith("sb-") && name.includes("auth-token"));

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
        .then(async (response) => ({
          status: response.status,
          body: await response.json(),
          vercelId: response.headers.get("x-vercel-id"),
        }))
        .then(done)
        .catch((error) => done({ status: 0, body: { error: error.message } }));
    },
    path.basename(sample),
    size,
  );

  await writeFile(
    path.join(root, ".tmp", "live-presign-result.png"),
    await driver.takeScreenshot(),
    "base64",
  );
  console.log(JSON.stringify({ url, deploymentId, authCookieCount: authCookieNames.length, result }));
} finally {
  await driver.quit();
}
