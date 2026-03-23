import type { Duration, DurationStats } from '../types'
import type { GameTurn } from '../types'
import { CubesResult, EventsCubeResult, GameSaveData } from '../types'
import { GameState } from '../types/game-state'
import { GameStorage } from '../storage'
import { AppMode } from './IController'
import type { ControllerTransitionState, IController } from './IController'

/** Optional hooks when {@link PausedController} performs actions that imply an app-level mode change. */
export interface PausedControllerCallbacks {
  /**
   * Called after {@link PausedController.resume}. App should show in-progress UI and construct
   * {@link InProgressController} with `turnTimerInitialSeconds` from the last turn’s saved
   * `turnDuration` in {@link GameState} (already synced before pause).
   */
  onResume?: () => void
  /** Called after {@link PausedController.newGame} (switch to setup UI). */
  onNewGame?: () => void
}

/**
 * Paused session: {@link GameState} only — current turn’s `turnDuration` is frozen at the value
 * {@link InProgressController.pauseTimers} wrote before entering pause.
 * Pause-menu behavior matches {@link GameLogic} except {@link #resume} does not touch a timer (App rebuilds {@link InProgressController}).
 */
export class PausedController implements IController {
  private _gameState: GameState
  private readonly _storage: GameStorage
  private readonly _callbacks?: PausedControllerCallbacks

  constructor(
    gameState: GameState,
    storage: GameStorage,
    callbacks?: PausedControllerCallbacks
  ) {
    this._gameState = gameState
    this._storage = storage
    this._callbacks = callbacks
  }

  appMode(): AppMode {
    return AppMode.Paused
  }

  getGameState(): GameState {
    return this._gameState
  }

  /** Seconds recorded on the current (last) turn — use when constructing {@link InProgressController} after resume. */
  getCurrentTurnDurationSeconds(): number {
    const turns = this._gameState.gameSaveData?.gameTurns
    if (!turns || turns.length === 0) return 0
    return turns[turns.length - 1].turnDuration
  }

  toTransitionState(): ControllerTransitionState {
    return {
      mode: AppMode.Paused,
      gameState: this._gameState,
      turnTimerSeconds: this.getCurrentTurnDurationSeconds(),
    }
  }

  /**
   * Does not start a timer — {@link GameState} already holds the frozen turn length.
   * Call {@link PausedControllerCallbacks.onResume} so the app can mount {@link InProgressController} with a fresh {@link Timer}.
   */
  resume(): void {
    this._callbacks?.onResume?.()
  }

  /** Same as {@link GameLogic.newGame}. */
  newGame(): void {
    this._storage.clear()
    const newSaveData = new GameSaveData(
      this._gameState.gameSaveData.players,
      this._gameState.gameSaveData.blockedResults,
      []
    )

    const result = GameState.tryFromGameSaveData(newSaveData)

    if (!result.ok) {
      throw new Error(result.errors[0])
    }

    this._gameState = result.state

    this._callbacks?.onNewGame?.()
  }

  /** Same as {@link GameLogic.getDurationStats}. */
  getDurationStats(): DurationStats | null {
    if (!this._gameState.gameSaveData) {
      return null
    }

    const turns = [...this._gameState.gameSaveData.gameTurns]
    const count = this._gameState.gameSaveData.players.length

    if (turns.length <= count) {
      return {
        gameDuration: this._gameState.getGameDuration(),
      }
    }

    const sortedByShortest = [...turns].sort(
      (a, b) => a.turnDuration - b.turnDuration
    )
    const shortest = sortedByShortest.slice(0, count).map(turn => ({
      playerName: this._gameState.gameSaveData!.players[turn.playerIndex],
      duration: turn.turnDuration,
      turnNumber: turn.turnNumber,
    }))

    const sortedByLongest = [...turns].sort(
      (a, b) => b.turnDuration - a.turnDuration
    )
    const longest = sortedByLongest.slice(0, count).map(turn => ({
      playerName: this._gameState.gameSaveData!.players[turn.playerIndex],
      duration: turn.turnDuration,
      turnNumber: turn.turnNumber,
    }))

    const shortestTurnNumbers = new Set(shortest.map(t => t.turnNumber))
    const longestTurnNumbers = longest.map(t => t.turnNumber)
    const hasOverlap = longestTurnNumbers.some(t => shortestTurnNumbers.has(t))

    if (hasOverlap) {
      return {
        gameDuration: this._gameState.getGameDuration(),
      }
    }

    const playerDurations: { [playerName: string]: number[] } = {}
    for (const turn of this._gameState.gameSaveData.gameTurns) {
      const playerName = this._gameState.gameSaveData!.players[turn.playerIndex]
      if (!playerDurations[playerName]) {
        playerDurations[playerName] = []
      }
      playerDurations[playerName].push(turn.turnDuration)
    }

    const average: Duration[] = []
    for (const playerName in playerDurations) {
      const durations = playerDurations[playerName]
      const totalDuration = durations.reduce(
        (sum, duration) => sum + duration,
        0
      )
      const avg = totalDuration / durations.length
      average.push({ playerName, duration: avg, turnNumber: -1 })
    }
    average.sort((a, b) => b.duration - a.duration)

    return {
      shortest,
      longest,
      average,
      gameDuration: this._gameState.getGameDuration(),
    }
  }

  /** Same as {@link GameLogic.getFreeRoll}. */
  static getFreeRoll(): [CubesResult, EventsCubeResult] {
    const cubes = CubesResult.random()
    const eventsCube = EventsCubeResult.random()
    return [cubes, eventsCube]
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

  private _save(): void {
    if (!this._gameState.gameSaveData) return

    this._storage.save(this._gameState.gameSaveData)
  }

  /**
   * Current turn lengths are already in {@link GameState} (frozen at pause). No timer sync here.
   */
  private _innerNextTurn(cubes: CubesResult): void {
    if (!this._gameState.gameSaveData) {
      throw new Error('No game save data')
    }

    this._gameState.currentPlayerIndex =
      (this._gameState.currentPlayerIndex + 1) %
      this._gameState.gameSaveData.players.length
    this._gameState.currentTurnNumber += 1

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

    this._save()
  }

  private _randomChoice<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot choose from empty array')
    }
    const index = Math.floor(Math.random() * array.length)
    return array[index]
  }
}
