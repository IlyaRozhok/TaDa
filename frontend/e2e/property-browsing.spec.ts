import { test, expect } from "./fixtures";

test("units page renders property cards and navigates to detail on click", async ({ tenantPage: page }) => {
  await page.goto("/app/units");

  const card = page.getByTestId("property-card").first();
  await expect(card).toBeVisible({ timeout: 15_000 });

  // Click the first card and expect navigation to the property detail page
  await card.click();
  await page.waitForURL(/\/app\/properties\/[^/]+$/, { timeout: 10_000 });

  // Property detail page should show the booking CTA
  await expect(page.getByTestId("book-viewing")).toBeVisible({ timeout: 10_000 });
});
