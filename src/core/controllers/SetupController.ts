import type { GameSaveData } from '../types'
import { GameStorage } from '../storage'
import { AppMode } from './IController'
import type { ControllerTransitionState, IController } from './IController'

export class SetupController implements IController {
  private readonly _gameSaveData: GameSaveData
  private readonly _storage: GameStorage

  constructor(gameSaveData: GameSaveData, storage: GameStorage) {
    this._gameSaveData = gameSaveData
    this._storage = storage
  }

  appMode(): AppMode {
    return AppMode.Setup
  }

  getGameSaveData(): GameSaveData {
    return this._gameSaveData
  }

  /**
   * Same behavior as {@link GameLogic.setPlayers}.
   */
  setPlayers(players: string[]): void {
    this._gameSaveData.players = players
    this._save()
  }

  /**
   * Same behavior as {@link GameLogic.setBlockedResults}.
   */
  setBlockedResults(results: number[]): void {
    this._gameSaveData.blockedResults = results
    this._save()
  }

  private _save(): void {
    this._storage.save(this._gameSaveData)
  }

  toTransitionState(): ControllerTransitionState {
    return {
      mode: AppMode.Setup,
      gameSaveData: this._gameSaveData,
    }
  }
}
