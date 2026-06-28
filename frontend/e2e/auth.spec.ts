import { test, expect } from "@playwright/test";

test("auth page renders Google login button", async ({ page }) => {
  await page.goto("/app/auth");
  const googleBtn = page.getByRole("button", { name: /google/i });
  await expect(googleBtn).toBeVisible();
});

test("unauthenticated visit to /app/units redirects away from units", async ({ page }) => {
  await page.goto("/app/units");
  await page.waitForURL((url) => !url.pathname.startsWith("/app/units"), { timeout: 10_000 });
  expect(page.url()).not.toMatch(/\/app\/units/);
});
