import { defineConfig, devices } from "@playwright/test";

/**
 * docs/QUALITY_AND_ACCEPTANCE.md §8 pede "test:e2e": "playwright test".
 * Só chromium instalado neste ambiente (CRM-F0-08) - suficiente para o
 * primeiro lote de specs; adicionar firefox/webkit é trivial depois.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
