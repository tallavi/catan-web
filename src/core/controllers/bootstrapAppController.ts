/**
 * Bootstrap the current {@link IController} from persistence (or optional in-memory seed),
 * matching {@link GameLogic} constructor rules for valid data, but routing invalid saves to
 * {@link RepairSaveController} instead of throwing.
 */

import { GameSaveData } from '../types'
import { GameState } from '../types/game-state'
import type { IController } from './IController'
import { InProgressController } from './InProgressController'
import { RepairSaveController } from './RepairSaveController'
import { SetupController } from './SetupController'

function controllerFromParsedSave(
  saveData: GameSaveData,
  rawForRepair: string,
  storageKey: string
): IController {
  if (saveData.gameTurns.length === 0) {
    return new SetupController(saveData, storageKey)
  }

  const result = GameState.tryFromGameSaveData(saveData)
  if (!result.ok) {
    return new RepairSaveController(rawForRepair, true)
  }

  const state = result.state
  const currentTurn = state.getCurrentTurn()
  const turnTimerInitialSeconds = currentTurn?.turnDuration ?? 0

  return new InProgressController(state, turnTimerInitialSeconds, storageKey)
}

/**
 * Load persisted JSON from `localStorage` (or use `initialData` like {@link GameLogic}),
 * then return the appropriate controller.
 *
 * - Missing key: same as `GameLogic` — empty {@link GameSaveData} → {@link SetupController}.
 * - Invalid JSON / structural save: {@link RepairSaveController} with startup recovery.
 * - Valid, no turns: {@link SetupController}.
 * - Valid, has turns but {@link GameState.tryFromGameSaveData} fails: {@link RepairSaveController}.
 * - Valid, has turns, state ok: {@link InProgressController} with turn {@link Timer} seeded like {@link GameLogic}
 *   (initial seconds = current turn's saved `turnDuration`, same storage key).
 */
export function bootstrapAppController(
  storageKey: string = 'catan-game-save',
  initialData: GameSaveData | null = null
): IController {
  if (initialData !== null) {
    const rawForRepair = initialData.toJsonString(true)
    const parsed = GameSaveData.tryFromJsonString(rawForRepair)
    if (!parsed.ok) {
      return new RepairSaveController(rawForRepair, true)
    }
    return controllerFromParsedSave(parsed.data, rawForRepair, storageKey)
  }

  const raw = localStorage.getItem(storageKey)
  if (raw === null) {
    const empty = new GameSaveData([], [], [])
    return controllerFromParsedSave(empty, empty.toJsonString(true), storageKey)
  }

  const parsed = GameSaveData.tryFromJsonString(raw)
  if (!parsed.ok) {
    return new RepairSaveController(raw, true)
  }

  return controllerFromParsedSave(parsed.data, raw, storageKey)
}
