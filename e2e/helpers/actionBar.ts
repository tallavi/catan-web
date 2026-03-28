import type { Locator, Page } from '@playwright/test'

/** Hold time for ActionBar buttons wired to `useLongPress` (~2s in app CSS + margin). */
const LONG_PRESS_HOLD_MS = 2500

/**
 * Moves focus away from `input`, `textarea`, and CodeMirror (`.cm-editor`) so **window** key handlers
 * in {@link ../../src/components/Common/ActionBar/ActionBar.tsx} receive **Space**, **e**, **Enter**, etc.
 *
 * Uses {@link Page.locator} + {@link Locator.click} on `.game-view` (small offset avoids hitting controls).
 */
export async function focusNeutralForActionBar(page: Page): Promise<void> {
  await page.locator('.game-view').click({ position: { x: 8, y: 8 } })
}

/**
 * Performs a **long press** on the center of `target` using {@link Page.mouse}:
 * `move` → `down` → {@link Page.waitForTimeout} → `up`.
 *
 * Use for **Yes** (setup confirm), **Apply** / **Cancel** in repair, etc.
 */
export async function longPress(
  target: Locator,
  holdMs: number = LONG_PRESS_HOLD_MS
): Promise<void> {
  const page = target.page()
  await target.scrollIntoViewIfNeeded()
  const box = await target.boundingBox()
  if (!box) {
    throw new Error('longPress: element has no bounding box')
  }
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.waitForTimeout(holdMs)
  await page.mouse.up()
}
