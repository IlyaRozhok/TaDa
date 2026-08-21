import { defineConfig, devices } from "@playwright/test";
import { BASE_URL } from "./e2e/env";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  // CI gets triple the local budget: the suite gates every deploy there, and
  // a slow runner aborting the whole run at 5 minutes reds a release for a
  // reason unrelated to the code.
  globalTimeout: (process.env.CI ? 15 : 5) * 60 * 1000,
  // One flake must not block a deploy; a trace from the retry is what makes
  // the failure debuggable from the uploaded artifacts.
  retries: process.env.CI ? 2 : 0,
  outputDir: "./test-results",
  globalSetup: "./e2e/global-setup.ts",

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
    // Sandboxes with a preinstalled Chromium (a different revision than this
    // @playwright/test expects) can point at it instead of downloading one.
    // Unset everywhere else, including CI, which installs its own browser.
    ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } }
      : {}),
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
