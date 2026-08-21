import { test, expect } from "@playwright/test";

/**
 * Indexability is controlled by one build-time switch (lib/siteEnv.ts). CI
 * builds without NEXT_PUBLIC_SITE_ENV, so the assertions here pin the
 * non-production behaviour: everything blocked, and the private routes carry
 * an explicit noindex meta on top. A production build flips robots.txt to
 * Allow — that side can only be verified against the deployed site.
 */
test("non-production build blocks all crawling in robots.txt", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.ok()).toBeTruthy();
  const body = await res.text();
  expect(body).toContain("Disallow: /");
  expect(body).not.toContain("Allow: /");
});

test("the tenant CV share page carries an explicit noindex meta", async ({ page }) => {
  // Any uuid works: the noindex comes from the segment layout, not the data.
  await page.goto("/cv/00000000-0000-4000-8000-000000000000");
  const robots = page.locator('meta[name="robots"]');
  await expect(robots).toHaveAttribute("content", /noindex/);
});
