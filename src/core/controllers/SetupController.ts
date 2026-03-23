import type { GameSaveData } from '../types'
import { AppMode } from './IController'
import type { ControllerTransitionState, IController } from './IController'

export class SetupController implements IController {
  private readonly _gameSaveData: GameSaveData

  constructor(gameSaveData: GameSaveData) {
    this._gameSaveData = gameSaveData
  }

  appMode(): AppMode {
    return AppMode.Setup
  }

  getGameSaveData(): GameSaveData {
    return this._gameSaveData
  }

  toTransitionState(): ControllerTransitionState {
    return {
      mode: AppMode.Setup,
      gameSaveData: this._gameSaveData,
    }
  }
}
