import type { GameState } from '../types/game-state'
import { AppMode } from './IController'
import type { ControllerTransitionState, IController } from './IController'

export class PausedController implements IController {
  private readonly _gameState: GameState

  constructor(gameState: GameState) {
    this._gameState = gameState
  }

  appMode(): AppMode {
    return AppMode.Paused
  }

  getGameState(): GameState {
    return this._gameState
  }

  toTransitionState(): ControllerTransitionState {
    return {
      mode: AppMode.Paused,
      gameState: this._gameState,
    }
  }
}
