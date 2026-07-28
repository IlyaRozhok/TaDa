import { test as base, type Page } from "@playwright/test";
import path from "path";

const AUTH_DIR = path.join(__dirname, ".auth");

type E2EFixtures = {
  tenantPage: Page;
  adminPage: Page;
  freshTenantPage: Page;
};

export const test = base.extend<E2EFixtures>({
  tenantPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: path.join(AUTH_DIR, "tenant.json") });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },

  adminPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: path.join(AUTH_DIR, "admin.json") });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },

  freshTenantPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: path.join(AUTH_DIR, "fresh-tenant.json") });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
});

export { expect } from "@playwright/test";
