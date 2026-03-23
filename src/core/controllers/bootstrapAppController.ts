/**
 * Bootstrap the current {@link IController} from persistence (or optional in-memory seed),
 * matching {@link GameLogic} constructor rules for valid data, but routing invalid saves to
 * {@link RepairSaveController} instead of throwing.
 */

import { GameState } from '../types/game-state'
import { GameStorage } from '../storage'
import type { IController } from './IController'
import { InProgressController } from './InProgressController'
import { RepairSaveController } from './RepairSaveController'
import { SetupController } from './SetupController'

/**
 * Load persisted JSON from `localStorage` (or use `initialData` for tests),
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
  storageKey: string = 'catan-game-save'
): IController {
  const loaded = new GameStorage(storageKey).load()
  if (!loaded.ok) {
    return new RepairSaveController(loaded.rawString, true)
  }

  if (loaded.data.gameTurns.length === 0) {
    return new SetupController(loaded.data, storageKey)
  }

  const result = GameState.tryFromGameSaveData(loaded.data)
  if (!result.ok) {
    return new RepairSaveController(loaded.rawString, true)
  }

  const state = result.state
  const currentTurn = state.getCurrentTurn()
  const turnTimerInitialSeconds = currentTurn?.turnDuration ?? 0

  return new InProgressController(state, turnTimerInitialSeconds, storageKey)
}
