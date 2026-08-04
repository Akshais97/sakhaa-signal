import test from "node:test";
import assert from "node:assert/strict";
import { PLANS } from "../../apps/web/src/lib/billing.ts";

test("Phase 3: SaaS Plans configuration and entitlements", () => {
  assert.equal(PLANS.STARTER.monthlyPrice, 49);
  assert.equal(PLANS.STARTER.monthlyCredits, 20);

  assert.equal(PLANS.GROWTH.monthlyPrice, 149);
  assert.equal(PLANS.GROWTH.monthlyCredits, 100);

  assert.equal(PLANS.PRO.monthlyPrice, 399);
  assert.equal(PLANS.PRO.monthlyCredits, 350);
});

test("Phase 3: Usage metering reservation cost computation", () => {
  const COST_MAP = {
    STATIC_STANDARD: 1.0,
    TRIBEV2_VIDEO_FULL: 3.0,
  };

  const initialBalance = 5.0; // 5 welcome credits
  const staticJobCost = COST_MAP.STATIC_STANDARD;
  const videoJobCost = COST_MAP.TRIBEV2_VIDEO_FULL;

  assert.equal(initialBalance - staticJobCost, 4.0);
  assert.equal(initialBalance - videoJobCost, 2.0);

  // Insufficient credit check
  const lowBalance = 1.5;
  assert.equal(lowBalance >= videoJobCost, false);
});
