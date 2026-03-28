import { expect, type Page } from '@playwright/test'
import { longPress } from './actionBar'

function _playersCard(page: Page) {
  return page
    .locator('.card')
    .filter({ has: page.locator('.table-title:text-is("Players")') })
}

/**
 * Renames the **existing** player at `index` (0-based) in the **Players** table.
 * Ignores the **Add player** row.
 */
export async function setPlayerNameAt(
  page: Page,
  index: number,
  name: string
): Promise<void> {
  const input = _playersCard(page)
    .locator('tbody input[type="text"]:not([placeholder="Add player"])')
    .nth(index)
  await input.fill(name)
}

/** Types into **Add player** and submits with **Enter**. */
export async function addPlayerViaForm(page: Page, name: string): Promise<void> {
  await page.getByPlaceholder('Add player').fill(name)
  await page.keyboard.press('Enter')
}

/** Types a blocked result and submits with **Enter** (when valid). */
export async function addBlockedResult(page: Page, value: number): Promise<void> {
  await page.getByPlaceholder(/Add blocked number/).fill(String(value))
  await page.keyboard.press('Enter')
}

export async function expectStartGameEnabled(page: Page): Promise<void> {
  await expect(page.getByRole('button', { name: /Start/i })).toBeEnabled()
}

/** **Start** → confirm modal → long-press **Yes**. */
export async function startGameWithLongPressYes(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Start/i }).click()
  await expect(page.getByText('Are you sure?')).toBeVisible()
  await longPress(page.getByRole('button', { name: /Yes/i }))
}
