import type { Page } from "@playwright/test";

import { test, expect } from "./fixtures";

test("admin panel loads with Users, Buildings, and Requests tabs", async ({ adminPage: page }) => {
  await page.goto("/app/admin/panel");

  // Sidebar navigation tabs should be visible
  await expect(page.getByTestId("admin-tab-users")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("admin-tab-buildings")).toBeVisible();
  await expect(page.getByTestId("admin-tab-requests")).toBeVisible();
});

test("admin Users tab shows a table with at least one row", async ({ adminPage: page }) => {
  await page.goto("/app/admin/panel");

  // Users tab is active by default — wait for the users table to render
  const tableRow = page.getByTestId("admin-user-row").first();
  await expect(tableRow).toBeVisible({ timeout: 15_000 });
});

/**
 * Панель отрисовывает сайдбар раньше, чем догружает данные первой вкладки.
 * Ждём появления строк таблицы: к этому моменту начальная загрузка завершена
 * и по вкладкам можно кликать.
 */
async function waitForPanelReady(page: Page): Promise<void> {
  await expect(page.getByTestId("admin-tab-users")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("admin-user-row").first()).toBeVisible({ timeout: 15_000 });
}

test("admin Buildings tab renders", async ({ adminPage: page }) => {
  await page.goto("/app/admin/panel");
  await waitForPanelReady(page);

  await page.getByTestId("admin-tab-buildings").click();

  // The URL should remain on the admin panel
  await page.waitForTimeout(1_500);
  expect(page.url()).toMatch(/\/app\/admin\/panel/);
});

test("admin Properties tab: rows render, create through the modal, delete", async ({
  adminPage: page,
}) => {
  await page.goto("/app/admin/panel");
  await waitForPanelReady(page);

  await page.getByTestId("admin-tab-properties").click();

  // The list is a typed RTK Query fetch that only fires when this tab opens;
  // a rendered row proves the query, the envelope and the section wiring.
  await expect(page.getByTestId("admin-property-row").first()).toBeVisible({
    timeout: 15_000,
  });

  const name = "e2e-crud-property";
  const rowFor = () =>
    page.getByTestId("admin-property-row").filter({ hasText: name });

  // Idempotency: a previously interrupted run may have left the row behind.
  while ((await rowFor().count()) > 0) {
    await rowFor().first().getByTitle("Delete property").click();
    await page.getByTestId("confirm-delete").click();
    await expect(rowFor()).toHaveCount(0, { timeout: 15_000 });
  }

  // Create through the Add modal. The row must appear without any manual
  // refetch — tag invalidation is the only thing refreshing the list.
  await page.getByTestId("admin-add-property").click();
  await page.getByPlaceholder("e.g. Modern 2BR Apartment").fill(name);
  await page.getByTestId("property-modal-submit").click();
  await expect(rowFor()).toHaveCount(1, { timeout: 15_000 });

  // Delete through the confirm dialog; invalidation removes the row again.
  await rowFor().first().getByTitle("Delete property").click();
  await page.getByTestId("confirm-delete").click();
  await expect(rowFor()).toHaveCount(0, { timeout: 15_000 });

  expect(page.url()).toMatch(/\/app\/admin\/panel/);
});

test("admin Requests tab renders", async ({ adminPage: page }) => {
  await page.goto("/app/admin/panel");
  await waitForPanelReady(page);

  await page.getByTestId("admin-tab-requests").click();

  await page.waitForTimeout(1_500);
  expect(page.url()).toMatch(/\/app\/admin\/panel/);
});

/**
 * Регрессия: гвард онбординга.
 *
 * SimpleDashboardRouter гейтил доступ по isOnboarded, то есть по
 * isProfileComplete() — «профиль заполнен». Но онбординг собирает только phone
 * и date_of_birth, а address и nationality не спрашивает вообще. В результате
 * пользователь, честно прошедший флоу, выбрасывался обратно в онбординг —
 * в первую очередь админ, заведённый через админ-панель с пустым профилем,
 * то есть панель была недоступна тому, для кого создана.
 *
 * После унификации гварды смотрят на onboardingCompleted — явный признак
 * завершения флоу.
 */
test("admin with an incomplete profile can still open the panel", async ({
  adminPartialProfilePage: page,
}) => {
  await page.goto("/app/admin/panel");

  await expect(page.getByTestId("admin-tab-users")).toBeVisible({ timeout: 10_000 });
  expect(page.url()).toMatch(/\/app\/admin\/panel/);

  // Контроль: не увело на онбординг спустя мгновение после рендера.
  await page.waitForTimeout(2_000);
  expect(page.url()).toMatch(/\/app\/admin\/panel/);
});
