import { defineConfig, devices } from "@playwright/test"

const testPort = Number(process.env.PLAYWRIGHT_PORT || 3000)
const baseURL = `http://127.0.0.1:${testPort}`

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  use: { baseURL, trace: "on-first-retry" },
  webServer: { command: `BOOKING_WRITE_MODE=sandbox ALLOW_SANDBOX_CHECKOUT=true pnpm exec next dev --webpack --port ${testPort}`, url: baseURL, reuseExistingServer: true },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 13"], browserName: "webkit" } },
  ],
})
