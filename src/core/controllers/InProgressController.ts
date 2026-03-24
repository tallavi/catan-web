import type { GameSaveData, GameTurn } from '../types'
import { CubesResult } from '../types'
import type { GameState } from '../types/game-state'
import { Timer } from '../timer'
import { AppMode, type IController } from './IController'

const AUTO_SAVE_INTERVAL_SECONDS = 10

/** Callbacks for {@link InProgressController} persistence and pausing (app-level transition). */
export interface InProgressControllerCallbacks {
  /** Persist the current save (e.g. delegate to {@link GameStorage.save}). */
  save: (gameSaveData: GameSaveData) => void
  /**
   * Called from {@link InProgressController.pause} after timers are synced and stopped.
   * App should switch to {@link PausedController} (or equivalent).
   */
  pause: () => void
}

/**
 * In-progress gameplay: turn timer, persistence, and advancing turns.
 * Logic mirrored from {@link GameLogic} (without setup/pause/resume/newGame).
 */
export class InProgressController implements IController {
  private readonly _gameState: GameState
  private readonly _callbacks: InProgressControllerCallbacks
  private readonly _turnTimer: Timer
  private _lastSaveTime: number = 0

  constructor(gameState: GameState, callbacks: InProgressControllerCallbacks) {
    this._gameState = gameState
    this._callbacks = callbacks
    const turnTimerInitialSeconds =
      gameState.gameSaveData?.gameTurns.at(-1)?.turnDuration ?? 0
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

  private _updateTurnDuration(): void {
    if (!this._gameState.gameSaveData) return

    const turns = this._gameState.gameSaveData.gameTurns
    if (turns.length === 0) return

    const currentTurn = turns[turns.length - 1]
    currentTurn.turnDuration = this._turnTimer.getCurrentDuration()
  }

  private _save(): void {
    if (!this._gameState.gameSaveData) return

    this._callbacks.save(this._gameState.gameSaveData)
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
  nextTurnWithPredeterminedCubes(cubes: CubesResult): void {
    this._innerNextTurn(cubes)
  }

  /**
   * Syncs turn duration from the live timer, stops the timer, then notifies the app via {@link InProgressControllerCallbacks.pause}.
   */
  pause(): void {
    this._updateTurnDuration()
    this._turnTimer.pause()
    this._callbacks.pause()
  }

  /** Same as {@link GameLogic.timerTick}. */
  timerTick(): void {
    this._updateTurnDuration()

    const currentTime = Date.now() / 1000
    if (currentTime - this._lastSaveTime >= AUTO_SAVE_INTERVAL_SECONDS) {
      this._save()
    }
  }

  private _randomChoice<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot choose from empty array')
    }
    const index = Math.floor(Math.random() * array.length)
    return array[index]
  }
}
