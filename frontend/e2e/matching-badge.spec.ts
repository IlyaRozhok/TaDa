import { test, expect } from "./fixtures";
import { isBatchScores, isPerCardMatch } from "./matching-requests";

/**
 * The match badge had no coverage at all, which is awkward for a step that
 * changes how the score reaches the card. These tests pin both halves: the
 * percentage still renders, and it no longer costs one request per card.
 *
 * `GET /matching/property/:id` is the per-card route the grids used to fan out
 * over. The property detail page still uses it once, legitimately, for the
 * property it is showing — hence the exact counts rather than "none anywhere".
 *
 * Neither test writes anything: shortlist coverage lives in `shortlist.spec.ts`,
 * which already owns that state, so the two specs cannot race each other.
 */

test("units cards show a match percentage without a request per card", async ({
  tenantPage: page,
}) => {
  const perCard: string[] = [];
  page.on("request", (request) => {
    if (isPerCardMatch(request.url())) perCard.push(request.url());
  });

  await page.goto("/app/units");

  const badge = page.getByTestId("match-badge").first();
  await expect(badge).toBeVisible({ timeout: 15_000 });
  await expect(badge).toHaveText(/\d+%/);

  // The default sort is best-match, whose response already carries the scores,
  // so the grid asks for nothing extra — neither per card nor in a batch.
  expect(perCard).toHaveLength(0);
});

test("the detail page scores its related grids in one batch", async ({
  tenantPage: page,
}) => {
  await page.goto("/app/units");
  const card = page.getByTestId("property-card").first();
  await expect(card).toBeVisible({ timeout: 15_000 });

  const perCard: string[] = [];
  const batches: string[] = [];
  page.on("request", (request) => {
    if (isPerCardMatch(request.url())) perCard.push(request.url());
    if (isBatchScores(request.url())) batches.push(request.url());
  });

  await card.click();
  await page.waitForURL(/\/app\/properties\/[^/]+$/, { timeout: 10_000 });
  await expect(page.getByTestId("book-viewing")).toBeVisible({ timeout: 15_000 });

  const badge = page.getByTestId("match-badge").first();
  await expect(badge).toBeVisible({ timeout: 15_000 });
  await expect(badge).toHaveText(/\d+%/);

  // Exactly one per-card call: the page's own property. The two "more
  // properties" grids below it used to add one per card on top of that.
  await expect
    .poll(() => batches.length, { timeout: 10_000 })
    .toBeGreaterThan(0);
  expect(perCard).toHaveLength(1);
});
