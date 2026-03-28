import { test, expect } from '@playwright/test'
import { registerAppE2EInitScripts } from './fixtures/storage'
import {
  addBlockedResult,
  addPlayerViaForm,
  expectStartGameEnabled,
  setPlayerNameAt,
  startGameWithLongPressYes,
} from './helpers/setup'
import {
  applyRepairSave,
  dismissFreeRollModal,
  expectPausedVisible,
  nextTurnFromInProgress,
  openEditorFromPause,
  openFreeRollFromPause,
  openPredeterminedFromPause,
  pauseFromInProgress,
  pickPredeterminedCubes,
  resumeFromPause,
} from './helpers/paused'

/**
 * Extended coordinator journey: setup edits, multiple **Next Turn**s, paused sub-modes
 * (**Free Roll**, **Predetermined**), second pause before **Edit save**, repair **Apply**, resume.
 */
test('extended setup → in-progress → pause → free roll → predetermined → pause → repair → resume', async ({
  page,
}) => {
  test.setTimeout(120_000)

  await registerAppE2EInitScripts(page)
  await page.goto('/')

  await test.step('Setup: rename players, add player, add blocked 7, start', async () => {
    await expect(page.getByText('Game Setup')).toBeVisible()
    await setPlayerNameAt(page, 0, 'E2E-A')
    await setPlayerNameAt(page, 1, 'E2E-B')
    await setPlayerNameAt(page, 2, 'E2E-C')
    await addPlayerViaForm(page, 'E2E-D')
    await addBlockedResult(page, 7)
    await expectStartGameEnabled(page)
    await startGameWithLongPressYes(page)
  })

  await test.step('InProgress: at least two Next Turns', async () => {
    await expect(page.getByRole('button', { name: /Pause/i })).toBeVisible()
    await nextTurnFromInProgress(page)
    await nextTurnFromInProgress(page)
  })

  await test.step('Pause', async () => {
    await pauseFromInProgress(page)
  })

  await test.step('Free roll then dismiss', async () => {
    await openFreeRollFromPause(page)
    await dismissFreeRollModal(page)
    await expectPausedVisible(page)
  })

  await test.step('Predetermined cubes → back to InProgress', async () => {
    await openPredeterminedFromPause(page)
    await pickPredeterminedCubes(page, 2, 3)
    await expect(page.getByRole('button', { name: /Pause/i })).toBeVisible()
  })

  await test.step('InProgress: one Next Turn', async () => {
    await nextTurnFromInProgress(page)
  })

  await test.step('Pause again (before Edit save)', async () => {
    await pauseFromInProgress(page)
  })

  await test.step('Repair: Edit save + Apply', async () => {
    await openEditorFromPause(page)
    await applyRepairSave(page)
    await expectPausedVisible(page)
  })

  await test.step('Resume → InProgress', async () => {
    await resumeFromPause(page)
    await expect(page.getByRole('button', { name: /Pause/i })).toBeVisible()
  })
})
