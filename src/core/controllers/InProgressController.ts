import type { GameState } from '../types/game-state'
import { AppMode } from './IController'
import type { ControllerTransitionState, IController } from './IController'

export class InProgressController implements IController {
  private readonly _gameState: GameState
  private _turnTimerSeconds: number
  private _gameTimerSeconds: number

  constructor(
    gameState: GameState,
    turnTimerSeconds: number = 0,
    gameTimerSeconds: number = 0
  ) {
    this._gameState = gameState
    this._turnTimerSeconds = turnTimerSeconds
    this._gameTimerSeconds = gameTimerSeconds
  }

  appMode(): AppMode {
    return AppMode.InProgress
  }

  getGameState(): GameState {
    return this._gameState
  }

  getTurnTimerSeconds(): number {
    return this._turnTimerSeconds
  }

  setTurnTimerSeconds(seconds: number): void {
    this._turnTimerSeconds = seconds
  }

  getGameTimerSeconds(): number {
    return this._gameTimerSeconds
  }

  setGameTimerSeconds(seconds: number): void {
    this._gameTimerSeconds = seconds
  }

  toTransitionState(): ControllerTransitionState {
    return {
      mode: AppMode.InProgress,
      gameState: this._gameState,
      turnTimerSeconds: this._turnTimerSeconds,
      gameTimerSeconds: this._gameTimerSeconds,
    }
  }
}
