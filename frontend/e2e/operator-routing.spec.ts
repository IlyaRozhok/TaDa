import { test, expect } from "./fixtures";

/**
 * Steps 2А.2 and 2А.3 took the operator branch out of role routing and then
 * deleted the operator pages. Operators are live users, so these tests guard
 * the thing that must not regress: the role always lands on a page that exists.
 */

test("operator hitting /app/dashboard lands on the units listing", async ({
  operatorPage: page,
}) => {
  await page.goto("/app/dashboard");

  await expect(page).toHaveURL(/\/app\/units$/, { timeout: 15_000 });
  // The default branch of getRedirectPath leads to the role-selection screen;
  // an operator must never fall into it.
  await expect(page).not.toHaveURL(/needsRole=true/);
});

test("operator stays on the units listing instead of being bounced", async ({
  operatorPage: page,
}) => {
  await page.goto("/app/units");

  // The units guard used to redirect operators to their own dashboard, which
  // would have made the redirect above a round trip back to a doomed route.
  await expect(page.getByTestId("property-card").first()).toBeVisible({
    timeout: 15_000,
  });
  await expect(page).toHaveURL(/\/app\/units$/);
});

test("operator is refused the admin panel", async ({ operatorPage: page }) => {
  await page.goto("/app/admin/panel");

  // The role check used to grant operators admin screens explicitly. Refusal
  // now goes through the role router, so it ends on the units listing.
  await expect(page).toHaveURL(/\/app\/units$/, { timeout: 15_000 });
  await expect(page.getByTestId("admin-tab-users")).toHaveCount(0);
});

test("the operator dashboard route is gone", async ({ operatorPage: page }) => {
  const response = await page.goto("/app/dashboard/operator");

  // Nothing links here any more; the page was removed in 2А.3.
  expect(response?.status()).toBe(404);
});
