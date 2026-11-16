import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 5180);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    locale: "uk-UA",
    trace: "retain-on-failure",
  },
  projects: [
    // Системний Chrome: не треба окремо завантажувати браузер Playwright.
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
  ],
  // Якщо E2E_BASE_URL задано, тести йдуть проти вже запущеного сервера.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npx vite dev --port ${PORT} --strictPort`,
        url: `${BASE_URL}/robots.txt`,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
