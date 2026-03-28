import { test, expect } from '@playwright/test'
import { registerAppE2EInitScripts } from './fixtures/storage'
import { focusNeutralForActionBar, longPress } from './helpers/actionBar'

/**
 * One journey through every app mode via real UI + [`ControllerCoordinator`](../../src/core/controllers/coordinator/ControllerCoordinator.ts).
 *
 * Setup → InProgress → Paused → RepairSave → Paused → InProgress.
 */
test('Setup → InProgress → Paused → Repair → Paused → InProgress', async ({
  page,
}) => {
  // 1. Deterministic rolls + clean storage before first paint
  await registerAppE2EInitScripts(page)
  await page.goto('/')

  // 2. SetupController / SetupView
  await expect(page.getByText('Game Setup')).toBeVisible()

  // 3. Start game (coordinator _handleStartGame → InProgress + nextTurn)
  await page.getByRole('button', { name: /Start/i }).click()
  await expect(page.getByText('Are you sure?')).toBeVisible()
  await longPress(page.getByRole('button', { name: /Yes/i }))

  // 4. InProgressController / InProgressView
  await expect(page.getByRole('button', { name: /Pause/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Next Turn/i })).toBeVisible()

  // 5. Pause (Space must not be swallowed by an input / CodeMirror)
  await focusNeutralForActionBar(page)
  await page.keyboard.press('Space')
  await expect(page.getByText('GAME PAUSED')).toBeVisible()

  // 6. Edit save from pause → RepairSaveController, canCancel → EDIT SAVE + lazy chunk
  await focusNeutralForActionBar(page)
  await page.keyboard.press('e')
  await expect(page.getByText('EDIT SAVE')).toBeVisible({ timeout: 15_000 })

  // 7. Apply valid JSON (long-press) → back to Paused with same save shape
  await longPress(page.getByRole('button', { name: /Apply/i }))
  await expect(page.getByText('GAME PAUSED')).toBeVisible()

  // 8. Resume → InProgress again; blur editor if focus landed in CodeMirror
  await focusNeutralForActionBar(page)
  await page.keyboard.press('Space')
  await expect(page.getByRole('button', { name: /Pause/i })).toBeVisible()
})
