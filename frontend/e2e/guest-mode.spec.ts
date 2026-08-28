import { test, expect } from "./fixtures";
import { API_URL } from "./env";

/**
 * Guest mode: the landing's featured listings are the one place a signed-out
 * visitor is handed a property, and `/app/properties/[id]` has to receive them
 * without bouncing to the sign-in wall.
 *
 * The section only exists when an admin has flagged something, so the test
 * creates its own data through the admin API and puts it back afterwards —
 * a seeded database is not assumed to carry a flagged property.
 */
test("a signed-out visitor opens a landing listing without an auth redirect", async ({
  adminPage,
  guestPage,
}) => {
  const listed = await adminPage.request.get(
    `${API_URL}/properties/public?limit=1`,
  );
  expect(listed.ok()).toBeTruthy();
  const { data } = (await listed.json()) as { data: Array<{ id: string }> };
  test.skip(data.length === 0, "no properties in the database to feature");
  const propertyId = data[0].id;

  const flag = async (is_landing_listing: boolean) =>
    adminPage.request.patch(`${API_URL}/properties/${propertyId}`, {
      data: { is_landing_listing },
    });

  const flagged = await flag(true);
  expect(flagged.ok()).toBeTruthy();

  try {
    await guestPage.goto("/");

    const section = guestPage.getByTestId("landing-listings");
    await expect(section).toBeVisible({ timeout: 15_000 });

    // The landing cards carry neither the favourite heart nor the match badge.
    await expect(section.getByTestId("shortlist-toggle")).toHaveCount(0);
    await expect(section.getByTestId("match-badge")).toHaveCount(0);

    await section.getByTestId("property-card").first().click();

    await guestPage.waitForURL(/\/app\/properties\/[^/]+$/, {
      timeout: 15_000,
    });
    expect(guestPage.url()).toContain(`/app/properties/${propertyId}`);

    // Still anonymous on the detail page: the header offers the CTA into the
    // auth flow instead of an account menu, and nothing pushed us to /app/auth.
    await expect(guestPage.getByTestId("header-get-started")).toBeVisible({
      timeout: 15_000,
    });
    expect(guestPage.url()).not.toContain("/app/auth");
  } finally {
    await flag(false);
  }
});
