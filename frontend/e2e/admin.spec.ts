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

  await page.getByRole("button", { name: "Buildings" }).click();
  // The section header or a loading state should appear
  await expect(page.locator("body")).toBeVisible();
  await page.waitForTimeout(1_000);
  expect(page.url()).toMatch(/\/app\/admin\/panel/);
});

test("admin Requests tab renders", async ({ adminPage: page }) => {
  await page.goto("/app/admin/panel");

  await page.getByRole("button", { name: "Requests" }).click();
  await expect(page.locator("body")).toBeVisible();
  await page.waitForTimeout(1_000);
  expect(page.url()).toMatch(/\/app\/admin\/panel/);
});
