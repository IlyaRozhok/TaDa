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

test("admin Buildings tab: create through the modal, delete", async ({
  adminPage: page,
}) => {
  await page.goto("/app/admin/panel");
  await waitForPanelReady(page);

  await page.getByTestId("admin-tab-buildings").click();
  // The section is mounted once its own header button renders.
  await expect(page.getByTestId("admin-add-building")).toBeVisible({
    timeout: 15_000,
  });

  const name = "e2e-crud-building";
  const rowFor = () =>
    page.getByTestId("admin-building-row").filter({ hasText: name });

  // Idempotency: a previously interrupted run may have left the row behind.
  while ((await rowFor().count()) > 0) {
    await rowFor().first().getByTitle("Delete building").click();
    await page.getByTestId("confirm-delete").click();
    await expect(rowFor()).toHaveCount(0, { timeout: 15_000 });
  }

  // Create through the Add modal. The row must appear without any manual
  // refetch — tag invalidation is the only thing refreshing the list.
  await page.getByTestId("admin-add-building").click();
  await page.getByPlaceholder("e.g. The Grand Tower").fill(name);
  await page.getByTestId("building-modal-submit").click();
  await expect(rowFor()).toHaveCount(1, { timeout: 15_000 });

  // Delete through the confirm dialog; invalidation removes the row again.
  await rowFor().first().getByTitle("Delete building").click();
  await page.getByTestId("confirm-delete").click();
  await expect(rowFor()).toHaveCount(0, { timeout: 15_000 });

  expect(page.url()).toMatch(/\/app\/admin\/panel/);
});

test("admin Buildings tab: edit through the modal updates the row", async ({
  adminPage: page,
}) => {
  test.slow(); // create → edit → delete is three round trips
  await page.goto("/app/admin/panel");
  await waitForPanelReady(page);

  await page.getByTestId("admin-tab-buildings").click();
  await expect(page.getByTestId("admin-add-building")).toBeVisible({
    timeout: 15_000,
  });

  const name = "e2e-edit-building";
  const edited = "e2e-edited-building";
  const address = "e2e 42 Test Street";
  const rowFor = (text: string) =>
    page.getByTestId("admin-building-row").filter({ hasText: text });

  // Idempotency: clean up leftovers under either name.
  for (const leftover of [name, edited]) {
    while ((await rowFor(leftover).count()) > 0) {
      await rowFor(leftover).first().getByTitle("Delete building").click();
      await page.getByTestId("confirm-delete").click();
      await expect(rowFor(leftover)).toHaveCount(0, { timeout: 15_000 });
    }
  }

  await page.getByTestId("admin-add-building").click();
  await page.getByPlaceholder("e.g. The Grand Tower").fill(name);
  await page.getByTestId("building-modal-submit").click();
  await expect(rowFor(name)).toHaveCount(1, { timeout: 15_000 });

  // Open the Edit modal from the row; the form must be prefilled.
  await rowFor(name).first().getByTitle("Edit building").click();
  const nameInput = page.getByTestId("building-edit-name");
  await expect(nameInput).toHaveValue(name);

  // Change two fields, not one: the second field guards against the
  // save path silently dropping everything but the primary column.
  await nameInput.fill(edited);
  await page.getByTestId("building-edit-address").fill(address);

  // Pick a district through the chip dropdown — the regression this spec
  // pins down is districts being edited in the UI but dropped from the
  // PATCH payload, so the save silently lost them.
  const district = "Camden";
  await page.getByTestId("building-edit-districts").click();
  await page
    .getByTestId("building-edit-districts-options")
    .getByText(district, { exact: true })
    .click();
  await expect(page.getByTestId("building-edit-districts")).toContainText(
    district,
  );
  // Close the options panel (it overlays the footer) by clicking outside it.
  await nameInput.click();
  await expect(
    page.getByTestId("building-edit-districts-options"),
  ).toBeHidden();

  // The wire is the proof: the PATCH body must carry the district.
  const patchRequest = page.waitForRequest(
    (req) => req.method() === "PATCH" && /\/buildings\//.test(req.url()),
  );
  await page.getByTestId("building-edit-submit").click();
  const patch = await patchRequest;
  expect(patch.postDataJSON().districts).toEqual([district]);

  // The modal closes on success and invalidation refreshes the list.
  await expect(page.getByTestId("building-edit-submit")).toBeHidden({
    timeout: 15_000,
  });
  await expect(rowFor(edited)).toHaveCount(1, { timeout: 15_000 });
  await expect(rowFor(name)).toHaveCount(0);
  await expect(rowFor(edited).first()).toContainText(address);

  // Reopen the Edit modal: the district must have survived the round trip.
  await rowFor(edited).first().getByTitle("Edit building").click();
  await expect(page.getByTestId("building-edit-districts")).toContainText(
    district,
  );
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByTestId("building-edit-submit")).toBeHidden();

  await rowFor(edited).first().getByTitle("Delete building").click();
  await page.getByTestId("confirm-delete").click();
  await expect(rowFor(edited)).toHaveCount(0, { timeout: 15_000 });
});

test("admin Properties tab: edit through the modal updates the row", async ({
  adminPage: page,
}) => {
  test.slow(); // create → edit → delete is three round trips
  await page.goto("/app/admin/panel");
  await waitForPanelReady(page);

  await page.getByTestId("admin-tab-properties").click();
  await expect(page.getByTestId("admin-property-row").first()).toBeVisible({
    timeout: 15_000,
  });

  const name = "e2e-edit-property";
  const edited = "e2e-edited-property";
  const rowFor = (text: string) =>
    page.getByTestId("admin-property-row").filter({ hasText: text });

  // Idempotency: clean up leftovers under either name.
  for (const leftover of [name, edited]) {
    while ((await rowFor(leftover).count()) > 0) {
      await rowFor(leftover).first().getByTitle("Delete property").click();
      await page.getByTestId("confirm-delete").click();
      await expect(rowFor(leftover)).toHaveCount(0, { timeout: 15_000 });
    }
  }

  await page.getByTestId("admin-add-property").click();
  await page.getByPlaceholder("e.g. Modern 2BR Apartment").fill(name);
  await page.getByTestId("property-modal-submit").click();
  await expect(rowFor(name)).toHaveCount(1, { timeout: 15_000 });

  // Open the Edit modal from the row; the title must be prefilled.
  await rowFor(name).first().getByTitle("Edit property").click();
  const titleInput = page.getByPlaceholder("Enter property title");
  await expect(titleInput).toHaveValue(name);

  await titleInput.fill(edited);
  await page.getByTestId("property-edit-submit").click();

  // The modal closes on success and invalidation refreshes the list.
  await expect(page.getByTestId("property-edit-submit")).toBeHidden({
    timeout: 15_000,
  });
  await expect(rowFor(edited)).toHaveCount(1, { timeout: 15_000 });
  await expect(rowFor(name)).toHaveCount(0);

  await rowFor(edited).first().getByTitle("Delete property").click();
  await page.getByTestId("confirm-delete").click();
  await expect(rowFor(edited)).toHaveCount(0, { timeout: 15_000 });
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
