import { test, expect } from "./fixtures";

test("units page renders property cards and navigates to detail on click", async ({ tenantPage: page }) => {
  await page.goto("/app/units");

  // Wait for at least one property card — cards contain a price element
  const card = page.locator(".cursor-pointer.group").first();
  await expect(card).toBeVisible({ timeout: 15_000 });

  // Click the first card and expect navigation to the property detail page
  await card.click();
  await page.waitForURL(/\/app\/properties\/[^/]+$/, { timeout: 10_000 });

  // Property detail page should show the booking CTA
  await expect(
    page.getByRole("button", { name: /book your viewing|request a viewing/i }),
  ).toBeVisible({ timeout: 10_000 });
});
