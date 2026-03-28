import { expect, type Page } from '@playwright/test'
import { focusNeutralForActionBar, longPress } from './actionBar'

export async function expectPausedVisible(page: Page): Promise<void> {
  await expect(page.getByText('GAME PAUSED')).toBeVisible()
}

export async function pauseFromInProgress(page: Page): Promise<void> {
  await focusNeutralForActionBar(page)
  await page.keyboard.press('Space')
  await expectPausedVisible(page)
}

export async function openEditorFromPause(page: Page): Promise<void> {
  await focusNeutralForActionBar(page)
  await page.keyboard.press('e')
  await expect(page.getByText('EDIT SAVE')).toBeVisible({ timeout: 15_000 })
}

function _modalOverlay(page: Page) {
  return page.locator('.modal-overlay')
}

export async function openFreeRollFromPause(page: Page): Promise<void> {
  await focusNeutralForActionBar(page)
  await page.keyboard.press('f')
  await expect(
    _modalOverlay(page).getByText('Free Roll', { exact: true })
  ).toBeVisible()
}

/** Closes the **Free Roll** modal (**Done** / **Esc**). */
export async function dismissFreeRollModal(page: Page): Promise<void> {
  await focusNeutralForActionBar(page)
  await page.keyboard.press('Escape')
  await expect(_modalOverlay(page)).not.toBeVisible()
}

export async function openPredeterminedFromPause(page: Page): Promise<void> {
  await focusNeutralForActionBar(page)
  await page.keyboard.press('p')
  await expect(
    _modalOverlay(page).getByText('Next Turn with Predetermined Cubes')
  ).toBeVisible()
}

/**
 * Picks yellow then red via digit keys (ActionBar shortcuts while modal is open).
 */
export async function pickPredeterminedCubes(
  page: Page,
  yellow: number,
  red: number
): Promise<void> {
  await page.keyboard.press(String(yellow))
  await page.keyboard.press(String(red))
}

export async function nextTurnFromInProgress(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Next Turn/i }).click()
}

export async function resumeFromPause(page: Page): Promise<void> {
  await focusNeutralForActionBar(page)
  await page.keyboard.press('Space')
}

export async function applyRepairSave(page: Page): Promise<void> {
  await longPress(page.getByRole('button', { name: /Apply/i }))
}
