import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import fs from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.PUBLIC_WEB_URL || "http://localhost:3000";
const SCREENSHOT_DIR = path.resolve(process.cwd(), ".impeccable", "screenshots", new Date().toISOString().split("T")[0]);

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function takeScreenshot(driver, name) {
  const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
  const data = await driver.takeScreenshot();
  await fs.writeFile(filePath, data, "base64");
  return filePath;
}

describe("UI screenshot capture for impeccable critique", () => {
  let driver;

  before(async () => {
    await ensureDir(SCREENSHOT_DIR);
    const options = new chrome.Options();
    options.addArguments("--headless=new", "--disable-gpu", "--window-size=1440,900", "--no-sandbox");
    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it("captures login page", async () => {
    await driver.get(`${BASE_URL}/login`);
    await driver.wait(until.elementLocated(By.tagName("main")), 5000);
    await driver.sleep(1000);
    const file = await takeScreenshot(driver, "login-page");
    assert.ok((await fs.stat(file)).size > 0, "screenshot written");
  });

  it("captures dashboard page", async () => {
    await driver.get(`${BASE_URL}/`);
    await driver.wait(until.elementLocated(By.tagName("header")), 5000);
    await driver.sleep(1500);
    const file = await takeScreenshot(driver, "dashboard-page");
    assert.ok((await fs.stat(file)).size > 0, "screenshot written");
  });

  it("captures new creative analysis wizard", async () => {
    await driver.get(`${BASE_URL}/`);
    await driver.wait(until.elementLocated(By.tagName("header")), 5000);
    const button = await driver.findElement(By.xpath("//button[contains(., 'New creative analysis')]"));
    await button.click();
    await driver.sleep(500);
    const file = await takeScreenshot(driver, "signal-job-wizard");
    assert.ok((await fs.stat(file)).size > 0, "screenshot written");
  });

  it("captures legacy scoring wizard", async () => {
    await driver.get(`${BASE_URL}/`);
    await driver.wait(until.elementLocated(By.tagName("header")), 5000);
    const button = await driver.findElement(By.xpath("//button[contains(., 'Legacy TribeV2 scorer')]"));
    await button.click();
    await driver.sleep(500);
    const file = await takeScreenshot(driver, "legacy-job-wizard");
    assert.ok((await fs.stat(file)).size > 0, "screenshot written");
  });

  it("captures demo results report", async () => {
    await driver.get(`${BASE_URL}/results/demo`);
    await driver.wait(until.elementLocated(By.tagName("header")), 5000);
    await driver.sleep(1500);
    const file = await takeScreenshot(driver, "results-demo-page");
    assert.ok((await fs.stat(file)).size > 0, "screenshot written");

    // Also capture the clusters tab
    const clustersTab = await driver.findElement(By.xpath("//button[contains(., '17 cognitive clusters')]"));
    await clustersTab.click();
    await driver.sleep(500);
    const clustersFile = await takeScreenshot(driver, "results-demo-clusters-tab");
    assert.ok((await fs.stat(clustersFile)).size > 0, "screenshot written");
  });
});
