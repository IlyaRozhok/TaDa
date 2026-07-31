import { test, expect } from "./fixtures";

/**
 * Step 2А.2 took the operator branch out of role routing, but the operator
 * pages themselves are only deleted in 2А.3. These tests are the guard for the
 * gap between the two: operators are live users, so the role has to keep
 * landing on a page that exists.
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

  // The role check used to grant operators admin screens explicitly. Assert on
  // being sent away rather than on the destination, which changes in 2А.3.
  await expect(page).not.toHaveURL(/\/app\/admin\/panel/, { timeout: 15_000 });
  await expect(page.getByTestId("admin-tab-users")).toHaveCount(0);
});
