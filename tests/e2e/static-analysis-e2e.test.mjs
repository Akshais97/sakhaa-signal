import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";

test("E2E Selenium Test — Full Static Creative Analysis Flow on Social_Media_creative_sample.png", async () => {
  const sampleImagePath = path.resolve(process.cwd(), "samples", "Social_Media_creative_sample.png");

  // Configure Chrome Headless Options
  const options = new chrome.Options();
  options.addArguments("--headless=new");
  options.addArguments("--no-sandbox");
  options.addArguments("--disable-dev-shm-usage");
  options.addArguments("--window-size=1400,900");

  let driver;
  try {
    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();

    console.log("[SELENIUM_E2E] Navigating to http://localhost:3000...");
    await driver.get("http://localhost:3000");

    // 1. Click "✨ New Creative Analysis (Static/Video)" button
    console.log("[SELENIUM_E2E] Clicking New Creative Analysis button...");
    const openWizardBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(normalize-space(), 'New Creative Analysis')]")),
      10000
    );
    await openWizardBtn.click();

    // 2. Select file via file input element
    console.log("[SELENIUM_E2E] Selecting Social_Media_creative_sample.png file...");
    const fileInput = await driver.wait(
      until.elementLocated(By.css("input[type='file']")),
      5000
    );
    await fileInput.sendKeys(sampleImagePath);

    // 3. Click "Start Analysis ✨" submission button
    console.log("[SELENIUM_E2E] Submitting Start Analysis form...");
    const startAnalysisBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(., 'Start Analysis')]")),
      5000
    );
    await startAnalysisBtn.click();

    // 4. Wait for browser navigation to /analysis/[jobId]
    console.log("[SELENIUM_E2E] Waiting for redirection to /analysis/[jobId]...");
    await driver.wait(until.urlContains("/analysis/"), 15000);
    const currentUrl = await driver.getCurrentUrl();
    console.log("[SELENIUM_E2E] Redirected to report URL:", currentUrl);
    assert.ok(currentUrl.includes("/analysis/"), "URL must contain /analysis/");

    // 5. Poll page until status changes to SUCCEEDED and overall score renders (max 90s)
    console.log("[SELENIUM_E2E] Waiting for real-time processing to finish & score to populate...");
    const startTime = Date.now();
    let numericScore = 0;

    while (Date.now() - startTime < 90000) {
      try {
        const pageSource = await driver.getPageSource();
        if (pageSource.includes("SUCCEEDED")) {
          // Find score div directly
          const scoreElems = await driver.findElements(By.xpath("//div[contains(@class, 'text-2xl') and contains(@class, 'font-black')]"));
          for (const elem of scoreElems) {
            const txt = await elem.getText();
            const parsed = parseInt(txt.trim(), 10);
            if (!isNaN(parsed) && parsed > 0) {
              numericScore = parsed;
              break;
            }
          }
          if (numericScore > 0) break;
        }
      } catch (e) {}

      await driver.sleep(2000);
    }

    console.log("[SELENIUM_E2E] Rendered Diagnostic Score:", numericScore);
    assert.ok(numericScore >= 80, `Diagnostic score (${numericScore}) must be >= 80`);

    // 6. Assert Technical Properties (Dimensions)
    const dimensionsElement = await driver.findElement(By.xpath("//p[text()='Dimensions']/../p[2]"));
    const dimensionsText = await dimensionsElement.getText();
    console.log("[SELENIUM_E2E] Rendered Dimensions:", dimensionsText);
    assert.ok(dimensionsText.includes("x"), "Dimensions text must contain x resolution");

    // 7. Assert Core Strengths are rendered
    const strengthsHeading = await driver.findElement(By.xpath("//h3[contains(., 'Core Strengths')]"));
    const strengthsText = await strengthsHeading.getText();
    console.log("[SELENIUM_E2E] Rendered Core Strengths heading:", strengthsText);
    assert.ok(!strengthsText.includes("(0)"), "Core Strengths count must be > 0");

    // 8. Assert Areas for Optimization are rendered
    const optimizationsHeading = await driver.findElement(By.xpath("//h3[contains(., 'Areas for Optimization')]"));
    const optimizationsText = await optimizationsHeading.getText();
    console.log("[SELENIUM_E2E] Rendered Areas for Optimization heading:", optimizationsText);
    assert.ok(!optimizationsText.includes("(0)"), "Areas for Optimization count must be > 0");

    console.log("---------------------------------------------------------");
    console.log("🎉 SUCCESS: Full Selenium E2E Test Passed Cleanly!");
    console.log("---------------------------------------------------------");
  } finally {
    if (driver) {
      await driver.quit();
    }
  }
});
