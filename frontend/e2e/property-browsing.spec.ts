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

test("a property with no building stays in the feed, and the count matches the page", async ({
  tenantPage: page,
}) => {
  const feedResponse = page.waitForResponse((response) =>
    /\/matching\/matched-properties/.test(response.url()) && response.ok(),
  );
  await page.goto("/app/units");
  const feed = await (await feedResponse).json();

  // The CI seed (deploy.yml) is exactly this case: visible, no building.
  const seed = feed.data.find(
    (item: { property: { title: string } }) => item.property.title === "E2E Seed Property",
  );
  expect(seed).toBeDefined();
  expect(seed.property.building_id).toBeNull();

  expect(feed.total).toBeGreaterThan(0);
  expect(feed.data.length).toBe(Math.min(feed.total, 12));
  await expect(page.getByTestId("property-card").first()).toBeVisible({ timeout: 15_000 });
});
