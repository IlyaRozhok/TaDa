import { defineConfig, devices } from "@playwright/test";
import { BASE_URL } from "./e2e/env";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  globalTimeout: 5 * 60 * 1000,
  outputDir: "./test-results",
  globalSetup: "./e2e/global-setup.ts",

  use: {
    baseURL: BASE_URL,
    ...devices["Desktop Chrome"],
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
