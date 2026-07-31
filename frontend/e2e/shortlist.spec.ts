import { test, expect } from "./fixtures";

test("tenant can heart a property, see it on shortlist, and un-heart it", async ({ tenantPage: page }) => {
  await page.goto("/app/units");

  const firstCard = page.getByTestId("property-card").first();
  await expect(firstCard).toBeVisible({ timeout: 15_000 });

  const heartBtn = firstCard.getByTestId("shortlist-toggle");
  await heartBtn.click();

  // Navigate to the shortlist page
  await page.goto("/app/shortlist");

  // At least one property should appear on the shortlist
  const shortlistCard = page.getByTestId("property-card").first();
  await expect(shortlistCard).toBeVisible({ timeout: 10_000 });

  // Un-heart the property
  const removeBtn = shortlistCard.getByTestId("shortlist-toggle");
  await removeBtn.click();

  // The shortlist should now be empty or have fewer items
  await page.waitForTimeout(1_000);
  const remainingCards = page.getByTestId("property-card");
  const countAfter = await remainingCards.count();
  expect(countAfter).toBe(0);
});
