import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Regression: PASSWORD-AUTH-001 — Google OAuth automation blocked production QA.
// Found by /qa on 2026-08-17.
// Report: .gstack/qa-reports/qa-report-sakhaa-signal-vercel-app-2026-08-17.md

test("login supports password sign-in and username-backed account creation", () => {
  const login = readFileSync("apps/web/src/app/login/page.tsx", "utf8");

  assert.match(login, /signInWithPassword/);
  assert.match(login, /signUp/);
  assert.match(login, /name="username"/);
  assert.match(login, /name="email"/);
  assert.match(login, /name="password"/);
  assert.match(login, /options:\s*\{\s*data:/);
  assert.match(login, /window\.location\.assign/);
});
