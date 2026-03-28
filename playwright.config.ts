import { defineConfig, devices } from '@playwright/test'

/** Must match `webServer` URL and `npm run preview` port. */
const PORT = 4173
const baseURL = `http://127.0.0.1:${PORT}`

/**
 * Playwright runs the **built** app (`vite build` + `vite preview`).
 * See [e2e/README.md](e2e/README.md) for how to run and debug tests.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
