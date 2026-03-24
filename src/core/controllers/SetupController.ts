import type { GameSaveData } from '../types'
import { AppMode, type IController } from './IController'

/** Callbacks for {@link SetupController} persistence and leaving setup (app-level transition). */
export interface SetupControllerCallbacks {
  /** Persist the current save (e.g. delegate to {@link GameStorage.save}). */
  save: (gameSaveData: GameSaveData) => void
  /**
   * Called from {@link SetupController.startGame}. App should transition to in-progress and build
   * {@link InProgressController} (or equivalent) using the provided {@link GameSaveData}.
   */
  startGame: (gameSaveData: GameSaveData) => void
}

export class SetupController implements IController {
  private readonly _gameSaveData: GameSaveData
  private readonly _callbacks: SetupControllerCallbacks

  constructor(gameSaveData: GameSaveData, callbacks: SetupControllerCallbacks) {
    this._gameSaveData = gameSaveData
    //TODO: assert that turns are empty, if there are turns, we are not supposed to be here.
    this._callbacks = callbacks
  }

  appMode(): AppMode {
    return AppMode.Setup
  }

  getGameSaveData(): GameSaveData {
    return this._gameSaveData
  }

  /** Notifies the consumer to start the game with the current {@link GameSaveData}. */
  startGame(): void {
    this._callbacks.startGame(this._gameSaveData)
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
    this._callbacks.save(this._gameSaveData)
  }
}
