import { test, expect } from '@playwright/test'
import { registerAppE2EInitScripts } from './fixtures/storage'

/**
 * Minimal wiring check: built app serves, React mounts, default route shows setup.
 * Full journey: `app-full-flow.spec.ts`.
 */
test('app loads Game Setup', async ({ page }) => {
  await registerAppE2EInitScripts(page)
  await page.goto('/')
  await expect(page.getByText('Game Setup')).toBeVisible()
})
