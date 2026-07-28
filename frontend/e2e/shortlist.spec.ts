import { test, expect } from "./fixtures";

test("tenant can heart a property, see it on shortlist, and un-heart it", async ({ tenantPage: page }) => {
  await page.goto("/app/units");

  // Wait for property cards to load
  const firstCard = page.locator(".cursor-pointer.group").first();
  await expect(firstCard).toBeVisible({ timeout: 15_000 });

  // Find the shortlist heart button on the first card and click it
  const heartBtn = firstCard.locator("button[aria-label], button svg").first();
  await heartBtn.click();

  // Navigate to the shortlist page
  await page.goto("/app/shortlist");

  // At least one property should appear on the shortlist
  const shortlistCard = page.locator(".cursor-pointer.group").first();
  await expect(shortlistCard).toBeVisible({ timeout: 10_000 });

  // Un-heart the property
  const removeBtn = shortlistCard.locator("button[aria-label], button svg").first();
  await removeBtn.click();

  // The shortlist should now be empty or have fewer items
  await page.waitForTimeout(1_000);
  const remainingCards = page.locator(".cursor-pointer.group");
  const countAfter = await remainingCards.count();
  expect(countAfter).toBe(0);
});
