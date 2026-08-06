import { test, expect } from "./fixtures";
import { API_URL } from "./env";
import { isBatchScores, isPerCardMatch } from "./matching-requests";

/**
 * `POST|DELETE /shortlist/:propertyId` — one toggle. Deliberately not matching
 * the bare `/shortlist` route, which is the clear-everything call used below.
 */
const isToggleResponse = (url: string): boolean =>
  /\/shortlist\/[0-9a-f-]+$/i.test(url);

test("tenant can heart a property, see it on shortlist, and un-heart it", async ({ tenantPage: page }) => {
  // The shortlist is server state that outlives the run, so start from a known
  // empty list rather than trusting whatever the previous run left behind.
  await page.request.delete(`${API_URL}/shortlist`);

  await page.goto("/app/units");

  const firstCard = page.getByTestId("property-card").first();
  await expect(firstCard).toBeVisible({ timeout: 15_000 });

  // The heart is painted optimistically, so a click on its own says nothing
  // about the server. Each toggle waits for its own request to be accepted —
  // otherwise the test can finish with a write still in flight, and the row it
  // leaves behind flips the meaning of the first click in the next run.
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        isToggleResponse(response.url()) &&
        response.ok(),
    ),
    firstCard.getByTestId("shortlist-toggle").click(),
  ]);

  // Navigate to the shortlist page, watching how its grid fetches match scores
  const perCard: string[] = [];
  const batches: string[] = [];
  page.on("request", (request) => {
    if (isPerCardMatch(request.url())) perCard.push(request.url());
    if (isBatchScores(request.url())) batches.push(request.url());
  });

  await page.goto("/app/shortlist");

  // At least one property should appear on the shortlist
  const shortlistCard = page.getByTestId("property-card").first();
  await expect(shortlistCard).toBeVisible({ timeout: 10_000 });

  // The card shows its match percentage, and the whole grid was scored by one
  // batch request rather than one request per card.
  const badge = shortlistCard.getByTestId("match-badge");
  await expect(badge).toBeVisible({ timeout: 10_000 });
  await expect(badge).toHaveText(/\d+%/);
  await expect.poll(() => batches.length, { timeout: 10_000 }).toBeGreaterThan(0);
  expect(perCard).toHaveLength(0);

  // Un-heart the property, again waiting for the server to confirm
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.request().method() === "DELETE" &&
        isToggleResponse(response.url()) &&
        response.ok(),
    ),
    shortlistCard.getByTestId("shortlist-toggle").click(),
  ]);

  // The shortlist is empty again, on screen and on the server
  await expect(page.getByTestId("property-card")).toHaveCount(0);
});
