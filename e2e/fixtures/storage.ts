import type { Page } from '@playwright/test'

/**
 * Default `localStorage` key for saves.
 * **Keep in sync with** [`DEFAULT_GAME_STORAGE_KEY`](../../src/core/GameStorage.ts).
 */
export const DEFAULT_GAME_STORAGE_KEY = 'catan-game-save'

/**
 * Registers functions that run in the browser **before** any document loads on this `page`
 * (`page.addInitScript` from Playwright).
 *
 * - Removes the default save key so bootstrap matches a fresh visit.
 * - Sets `Math.random` to `() => 0` so `InProgressController.nextTurn()` cube rolls are deterministic
 *   (same idea as Vitest tests that mock `Math.random`).
 */
export async function registerAppE2EInitScripts(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Math.random = () => 0
  })
  await page.addInitScript((key: string) => {
    localStorage.removeItem(key)
  }, DEFAULT_GAME_STORAGE_KEY)
}
