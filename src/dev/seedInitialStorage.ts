/**
 * Dev-only: optionally overwrite localStorage with raw text from initial-game-save.json
 * before the app loads. Invalid JSON yields `GameStorage.load()` with `ok: false`;
 * bootstrap routes that to `RepairSaveController`.
 */

import { DEFAULT_GAME_STORAGE_KEY } from '../core/GameStorage'
import initialSaveText from './initial-game-save.json?raw'

/** When true, replaces the save key with the file contents on each load (dev only). */
export const USE_INITIAL_DATA = false

if (USE_INITIAL_DATA) {
  localStorage.setItem(DEFAULT_GAME_STORAGE_KEY, initialSaveText)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
if ((import.meta as any).hot) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(import.meta as any).hot.accept('./initial-game-save.json?raw', () => {
    window.location.reload()
  })
}
