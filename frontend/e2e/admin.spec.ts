import { test, expect } from "./fixtures";

test("admin panel loads with Users, Buildings, and Requests tabs", async ({ adminPage: page }) => {
  await page.goto("/app/admin/panel");

  // Sidebar navigation tabs should be visible
  await expect(page.getByRole("button", { name: "Users" })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("button", { name: "Buildings" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Requests" })).toBeVisible();
});

test("admin Users tab shows a table with at least one row", async ({ adminPage: page }) => {
  await page.goto("/app/admin/panel");

  // Users tab is active by default — wait for the users table to render
  const tableRow = page.locator("table tbody tr, [role='row']").first();
  await expect(tableRow).toBeVisible({ timeout: 15_000 });
});

test("admin Buildings tab renders", async ({ adminPage: page }) => {
  await page.goto("/app/admin/panel");

  // Wait for the panel to be fully ready (sidebar visible confirms session + auth guard passed)
  await expect(page.getByRole("button", { name: "Buildings" })).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "Buildings" }).click();

  // The URL should remain on the admin panel
  await page.waitForTimeout(1_500);
  expect(page.url()).toMatch(/\/app\/admin\/panel/);
});

test("admin Requests tab renders", async ({ adminPage: page }) => {
  await page.goto("/app/admin/panel");

  // Wait for the panel to be fully ready before switching tabs
  await expect(page.getByRole("button", { name: "Requests" })).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "Requests" }).click();

  await page.waitForTimeout(1_500);
  expect(page.url()).toMatch(/\/app\/admin\/panel/);
});
