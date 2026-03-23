import type { GameTurn } from '../types'
import { CubesResult, EventsCubeResult } from '../types'
import type { GameState } from '../types/game-state'
import { GameStorage } from '../storage'
import { Timer } from '../timer'
import { AppMode } from './IController'
import type { ControllerTransitionState, IController } from './IController'

const AUTO_SAVE_INTERVAL_SECONDS = 10

/**
 * In-progress gameplay: turn timer, persistence, and advancing turns.
 * Logic mirrored from {@link GameLogic} (without setup/pause/resume/newGame).
 */
export class InProgressController implements IController {
  private readonly _gameState: GameState
  private readonly _storage: GameStorage
  private readonly _turnTimer: Timer
  private _lastSaveTime: number = 0

  constructor(
    gameState: GameState,
    turnTimerInitialSeconds: number = 0,
    storage: GameStorage
  ) {
    this._gameState = gameState
    this._storage = storage
    this._turnTimer = new Timer(turnTimerInitialSeconds)
    this._turnTimer.resume()
  }

  appMode(): AppMode {
    return AppMode.InProgress
  }

  getGameState(): GameState {
    return this._gameState
  }

  /** Same as {@link GameLogic.turnTimerInstance}. */
  get turnTimerInstance(): Timer {
    return this._turnTimer
  }

  /** Elapsed seconds for the current turn (from the live {@link Timer}). */
  getTurnTimerSeconds(): number {
    return this._turnTimer.getCurrentDuration()
  }

  /** Total game duration; syncs current turn length from the timer first. */
  getGameTimerSeconds(): number {
    this._updateTurnDuration()
    return this._gameState.getGameDuration()
  }

  toTransitionState(): ControllerTransitionState {
    this._updateTurnDuration()
    return {
      mode: AppMode.InProgress,
      gameState: this._gameState,
      turnTimerSeconds: this._turnTimer.getCurrentDuration(),
      gameTimerSeconds: this._gameState.getGameDuration(),
    }
  }

  private _updateTurnDuration(): void {
    if (!this._gameState.gameSaveData) return

    const turns = this._gameState.gameSaveData.gameTurns
    if (turns.length === 0) return

    const currentTurn = turns[turns.length - 1]
    currentTurn.turnDuration = this._turnTimer.getCurrentDuration()
  }

  private _save(): void {
    if (!this._gameState.gameSaveData) return

    this._storage.save(this._gameState.gameSaveData)
    this._lastSaveTime = Date.now() / 1000
  }

  private _innerNextTurn(cubes: CubesResult): void {
    if (!this._gameState.gameSaveData) {
      throw new Error('No game save data')
    }

    this._gameState.currentPlayerIndex =
      (this._gameState.currentPlayerIndex + 1) %
      this._gameState.gameSaveData.players.length
    this._gameState.currentTurnNumber += 1

    this._updateTurnDuration()

    const eventsCube = this._randomChoice(
      this._gameState.possibleEventsCubeResults
    )

    const gameTurn: GameTurn = {
      turnNumber: this._gameState.currentTurnNumber,
      playerIndex: this._gameState.currentPlayerIndex,
      cubes,
      eventsCube,
      turnDuration: 0,
    }

    this._gameState.playTurn(gameTurn)

    this._turnTimer.reset()
    this._turnTimer.resume()

    this._save()
  }

  /** Same as {@link GameLogic.nextTurn}. */
  nextTurn(): void {
    const cubes = this._randomChoice(this._gameState.possibleCubesResults)
    this._innerNextTurn(cubes)
  }

  /** Same as {@link GameLogic.nextTurnWithPredeterminedCubes}. */
  nextTurnWithPredeterminedCubes(yellowCube: number, redCube: number): void {
    if (yellowCube < 1 || yellowCube > 6) {
      throw new Error(`Yellow cube must be between 1 and 6, got ${yellowCube}`)
    }

    if (redCube < 1 || redCube > 6) {
      throw new Error(`Red cube must be between 1 and 6, got ${redCube}`)
    }

    const cubes = new CubesResult(yellowCube, redCube, true)
    this._innerNextTurn(cubes)
  }

  /**
   * Same as the first part of {@link GameLogic.pause}: writes the live turn length from the {@link Timer}
   * into the current turn on {@link GameState}, then pauses the timer. Call before switching to
   * {@link PausedController} (paused mode has no timer; state holds the frozen duration).
   */
  pauseTimers(): void {
    this._updateTurnDuration()
    this._turnTimer.pause()
  }

  /** Same as {@link GameLogic.timerTick}. */
  timerTick(): void {
    this._updateTurnDuration()

    const currentTime = Date.now() / 1000
    if (currentTime - this._lastSaveTime >= AUTO_SAVE_INTERVAL_SECONDS) {
      this._save()
    }
  }

  /** Same as {@link GameLogic.getFreeRoll}. */
  static getFreeRoll(): [CubesResult, EventsCubeResult] {
    const cubes = CubesResult.random()
    const eventsCube = EventsCubeResult.random()
    return [cubes, eventsCube]
  }

  private _randomChoice<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot choose from empty array')
    }
    const index = Math.floor(Math.random() * array.length)
    return array[index]
  }
}
