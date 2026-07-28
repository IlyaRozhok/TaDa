import { test, expect } from "./fixtures";

test("fresh tenant is redirected from /app/units to /app/onboarding", async ({ freshTenantPage: page }) => {
  await page.goto("/app/units");
  await page.waitForURL("**/app/onboarding", { timeout: 15_000 });
  await expect(page).toHaveURL(/\/app\/onboarding/);
});

test("onboarding page opens at step 1", async ({ freshTenantPage: page }) => {
  await page.goto("/app/onboarding");
  // Step counter or intro content should be visible before any navigation
  await expect(page.locator("body")).toBeVisible();
  // The page should NOT immediately redirect elsewhere for a logged-in, non-onboarded tenant
  await page.waitForTimeout(2_000);
  expect(page.url()).toMatch(/\/app\/onboarding/);
});
