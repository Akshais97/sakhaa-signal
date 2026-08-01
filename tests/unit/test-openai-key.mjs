import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFileSync, existsSync } from "node:fs";

// Load environment variables from .env
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        process.env[key] = value.trim();
      }
    });
  }
} catch (e) {}

test("Validate OpenAI API Key directly against OpenAI API endpoint", async () => {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log(`[KEY_VALIDATION_TEST] Testing API key starting with: "${apiKey ? apiKey.substring(0, 7) : "NONE"}..." (total length: ${apiKey ? apiKey.length : 0})`);

  assert.ok(apiKey && apiKey.trim().length > 0, "OPENAI_API_KEY must be set in environment");

  const response = await fetch("https://api.openai.com/v1/models", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiKey.trim()}`,
      "Content-Type": "application/json",
    },
  });

  const responseBody = await response.json();
  console.log(`[KEY_VALIDATION_TEST] OpenAI HTTP Status Code: ${response.status}`);

  if (response.ok) {
    console.log(`[KEY_VALIDATION_TEST] SUCCESS: API key is valid and working! Total models available: ${responseBody.data ? responseBody.data.length : 0}`);
    assert.equal(response.status, 200);
  } else {
    console.error(`[KEY_VALIDATION_TEST] FAILED: OpenAI API error response:`, JSON.stringify(responseBody, null, 2));
    assert.fail(`OpenAI API Key Validation Failed (Status ${response.status}): ${responseBody.error ? responseBody.error.message : JSON.stringify(responseBody)}`);
  }
});
