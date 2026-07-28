import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  globalTimeout: 5 * 60 * 1000,
  outputDir: "./test-results",
  globalSetup: "./e2e/global-setup.ts",

  use: {
    baseURL: "http://localhost:3000",
    ...devices["Desktop Chrome"],
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
