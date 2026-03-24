import type { Duration, DurationStats } from '../types'
import { CubesResult, EventsCubeResult, GameSaveData } from '../types'
import { GameState } from '../types/game-state'
import { AppMode, type IController } from './IController'

/**
 * App-level hooks for {@link PausedController} actions. This controller does not read or write
 * persistence; the app should clear/save storage (e.g. on `newGame`) and switch modes as needed.
 */
export interface PausedControllerCallbacks {
  /** After reset state is applied (empty `gameTurns`, same players / `blockedResults`). */
  newGame: (gameState: GameState) => void
  /** Current paused {@link GameState}; mount {@link InProgressController} with a fresh timer seeded from last turn’s `turnDuration`. */
  resume: (gameState: GameState) => void
  /** After advancing the turn with the given predetermined cubes (same `cubes` instance as in the new turn). */
  nextTurnWithPredeterminedCubes: (
    gameState: GameState,
    cubesResult: CubesResult
  ) => void
}

/**
 * Paused session: {@link GameState} only — current turn’s `turnDuration` is frozen at the value
 * {@link InProgressController.pause} or {@link InProgressController.pauseTimers} wrote before entering pause.
 * Does not persist; {@link PausedControllerCallbacks} delegate mode changes and storage to the app.
 * Pause-menu behavior matches {@link GameLogic} except {@link #resume} does not touch a timer (App rebuilds {@link InProgressController}).
 */
export class PausedController implements IController {
  private _gameState: GameState
  private readonly _callbacks: PausedControllerCallbacks

  constructor(gameState: GameState, callbacks: PausedControllerCallbacks) {
    this._gameState = gameState
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

  /**
   * Does not start a timer — {@link GameState} already holds the frozen turn length.
   * {@link PausedControllerCallbacks.resume} should mount {@link InProgressController} with a fresh {@link Timer}.
   */
  resume(): void {
    this._callbacks.resume(this._gameState)
  }

  /** Same in-memory reset as {@link GameLogic.newGame}; persistence is the app’s responsibility. */
  newGame(): void {
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

    this._callbacks.newGame(this._gameState)
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

  /**
   * Same as {@link GameLogic.nextTurn}. Mutates {@link GameState} only; does not invoke callbacks or persist.
   * For app-level save/sync after a random next turn, handle outside this controller.
   */

  /** Same as {@link GameLogic.nextTurnWithPredeterminedCubes}. */
  nextTurnWithPredeterminedCubes(yellowCube: number, redCube: number): void {
    if (yellowCube < 1 || yellowCube > 6) {
      throw new Error(`Yellow cube must be between 1 and 6, got ${yellowCube}`)
    }

    if (redCube < 1 || redCube > 6) {
      throw new Error(`Red cube must be between 1 and 6, got ${redCube}`)
    }

    const cubes = new CubesResult(yellowCube, redCube, true)
    this._callbacks.nextTurnWithPredeterminedCubes(this._gameState, cubes)
  }
}
