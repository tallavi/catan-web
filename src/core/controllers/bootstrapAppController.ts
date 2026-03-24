/**
 * Bootstrap the current {@link IController} from persistence (or optional in-memory seed),
 * matching {@link GameLogic} constructor rules for valid data, but routing invalid saves to
 * {@link RepairSaveController} instead of throwing.
 *
 * For the setup branch, `setupCallbacks.save` should usually delegate to {@link GameStorage.save}
 * on the same `storage` instance; `setupCallbacks.startGame` should perform the app-level switch
 * to in-progress (e.g. construct {@link InProgressController}).
 *
 * For repair branches, `repairSaveCallbacks` should perform mode transitions after the user applies
 * a fixed save (defaults are no-ops for tests only).
 */

import { GameState } from '../types/game-state'
import { GameStorage } from '../storage'
import type { IController } from './IController'
import {
  InProgressController,
  type InProgressControllerCallbacks,
} from './InProgressController'
import {
  RepairSaveController,
  type RepairSaveControllerCallbacks,
} from './RepairSaveController'
import { SetupController, type SetupControllerCallbacks } from './SetupController'

const defaultRepairSaveCallbacks: RepairSaveControllerCallbacks = {
  continueStartup: () => {},
  applyManualEdit: () => {},
}

/**
 * Load persisted JSON from `localStorage` (or use `initialData` for tests),
 * then return the appropriate controller.
 *
 * - Missing key: same as `GameLogic` — empty {@link GameSaveData} → {@link SetupController}.
 * - Invalid JSON / structural save: {@link RepairSaveController} with startup recovery.
 * - Valid, no turns: {@link SetupController}.
 * - Valid, has turns but {@link GameState.tryFromGameSaveData} fails: {@link RepairSaveController}.
 * - Valid, has turns, state ok: {@link InProgressController} with turn {@link Timer} seeded from the current
 *   turn's saved `turnDuration` (see {@link InProgressController} constructor).
 */
export function bootstrapAppController(
  storage: GameStorage,
  setupCallbacks: SetupControllerCallbacks,
  inProgressCallbacks: InProgressControllerCallbacks = {
    save: d => storage.save(d),
    pause: () => {},
  },
  repairSaveCallbacks: RepairSaveControllerCallbacks = defaultRepairSaveCallbacks
): IController {
  const loaded = storage.load()
  if (!loaded.ok) {
    return new RepairSaveController(loaded.rawString, true, repairSaveCallbacks)
  }

  if (loaded.data.gameTurns.length === 0) {
    return new SetupController(loaded.data, setupCallbacks)
  }

  const result = GameState.tryFromGameSaveData(loaded.data)
  if (!result.ok) {
    return new RepairSaveController(loaded.rawString, true, repairSaveCallbacks)
  }

  const state = result.state

  return new InProgressController(state, inProgressCallbacks)
}
