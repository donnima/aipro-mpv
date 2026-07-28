import { devices, type PlaywrightTestConfig } from "@playwright/test";

/**
 * Playwright is configured for CI. Browser binaries are NOT downloaded locally
 * (blocker B-1 / disk). Run `pnpm test:e2e` in CI only until disk is resolved.
 * See docs/DEVELOPMENT.md and KNOWN_LIMITATIONS.md.
 */
const config: PlaywrightTestConfig = {
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
};

if (process.env.CI) {
  config.workers = 1;
  config.webServer = {
    command: "pnpm start",
    url: "http://127.0.0.1:3000/api/health",
    reuseExistingServer: false,
    timeout: 120_000,
  };
}

export default config;
