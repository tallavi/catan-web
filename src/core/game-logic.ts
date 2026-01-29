/**
 * Core game logic for Catan dice game.
 * Ported from Python version in catan-cli/logic/game_logic.py
 */

import type {
  Duration,
  DurationStats,
  GameSaveData,
  GameTurn,
  GameStatus as GameStatusType,
} from './types/index'
import { CubesResult, EventsCubeResult, GameStatus } from './types/index'
import { GameState } from './types/game-state'
import { GameStorage } from './storage'
import { Timer } from './timer'

const AUTO_SAVE_INTERVAL_SECONDS = 10

/**
 * Main game logic class
 * Manages game state, turn progression, and statistics
 */
export class GameLogic {
  private _storage: GameStorage
  private _gameState: GameState
  private _turnTimer: Timer
  private _status: GameStatusType
  private _lastSaveTime: number = 0
  private _onStatusChange: (status: GameStatusType) => void

  /**
   * Initialize the game logic
   * @param storageKey - LocalStorage key for saving/loading (defaults to 'catan-game-save')
   * @param initialData - Optional initial game data to use instead of loading from storage
   */
  constructor(
    storageKey: string = 'catan-game-save',
    initialData: GameSaveData | null = null,
    onStatusChange: (status: GameStatusType) => void = () => {}
  ) {
    this._storage = new GameStorage(storageKey) //TODO: should I use multiple storage keys, one for initial game data and finished turns (changed just when the turn advances) vs current turn data that is saved again and again every 10 seconds? Or it doesn't matter?
    this._onStatusChange = onStatusChange

    const saveData = initialData ??
      this._storage.load() ?? {
        players: [],
        blockedResults: [],
        gameTurns: [],
      }

    this._gameState = new GameState(saveData)

    // Set initial status without calling callback
    this._status =
      this._gameState.gameSaveData.gameTurns.length === 0
        ? GameStatus.Setup
        : GameStatus.InProgress

    const lastTurnDuration = this._gameState.getCurrentTurn()?.turnDuration ?? 0
    this._turnTimer = new Timer(lastTurnDuration)
    this._turnTimer.resume()
  }

  setOnStatusChange(onStatusChange: (status: GameStatusType) => void): void {
    this._onStatusChange = onStatusChange
  }

  setPlayers(players: string[]): void {
    if (this.status !== GameStatus.Setup) {
      console.warn('Cannot set players when game is in progress')
      return
    }
    this._gameState.gameSaveData.players = players
    this._save()
  }

  setBlockedResults(results: number[]): void {
    if (this.status !== GameStatus.Setup) {
      console.warn('Cannot set blocked results when game is in progress')
      return
    }
    this._gameState.gameSaveData.blockedResults = results
    this._save()
  }

  /**
   * Get the current game state (read-only)
   */
  get state(): GameState {
    return this._gameState
  }

  /**
   * Get the current game status
   */
  get status(): GameStatusType {
    return this._status
  }

  /**
   * Set the game status and notify listener
   */
  private _setStatus(newStatus: GameStatusType): void {
    if (this._status !== newStatus) {
      this._status = newStatus
      this._onStatusChange(newStatus)
    }
  }

  /**
   * Get the turn timer
   */
  get turnTimerInstance(): Timer {
    return this._turnTimer
  }

  /**
   * Update the current turn's duration based on elapsed time
   */
  private _updateTurnDuration(): void {
    if (!this._gameState.gameSaveData) return

    const currentTurn = this._gameState.getCurrentTurn()

    if (!currentTurn) return

    currentTurn.turnDuration = this._turnTimer.getCurrentDuration()
  }

  /**
   * Save game state to storage
   */
  private _save(): void {
    if (!this._gameState.gameSaveData) return

    this._storage.save(this._gameState.gameSaveData)
    this._lastSaveTime = Date.now() / 1000
  }

  /**
   * Internal method to execute a turn with given cubes
   */
  private _innerNextTurn(cubes: CubesResult): void {
    if (!this._gameState.gameSaveData) {
      throw new Error('No game save data')
    }

    if (this.status === GameStatus.Setup) {
      this._setStatus(GameStatus.InProgress)
    }

    // Move to next player
    this._gameState.currentPlayerIndex =
      (this._gameState.currentPlayerIndex + 1) %
      this._gameState.gameSaveData.players.length
    this._gameState.currentTurnNumber += 1

    // Update previous turn duration
    this._updateTurnDuration()

    // Create new turn
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

    // Play the turn and add to history
    this._gameState.playTurn(gameTurn)

    // Reset turn timer for new turn
    this._turnTimer.reset()
    this._turnTimer.resume()

    // Save
    this._save()
  }

  /**
   * Execute the next turn with random cubes
   */
  nextTurn(): void {
    //TODO: this method should only be called when the status is Start or InProgress. Should we assert that or ignore invalid calls like today?
    const cubes = this._randomChoice(this._gameState.possibleCubesResults)
    this._innerNextTurn(cubes)
  }

  /**
   * Execute the next turn with predetermined cube values
   * @param redCube - Red die value (1-6)
   * @param yellowCube - Yellow die value (1-6)
   */
  nextTurnWithPredeterminedCubes(redCube: number, yellowCube: number): void {
    if (redCube < 1 || redCube > 6) {
      throw new Error(`Red cube must be between 1 and 6, got ${redCube}`)
    }
    if (yellowCube < 1 || yellowCube > 6) {
      throw new Error(`Yellow cube must be between 1 and 6, got ${yellowCube}`)
    }

    const cubes = new CubesResult(yellowCube, redCube, true)
    this._innerNextTurn(cubes)
  }

  /**
   * Generate a practice throw (free throw) without affecting game state
   * @returns A tuple of [CubesResult, EventsCubeResult]
   */
  static getFreeThrow(): [CubesResult, EventsCubeResult] {
    const cubes = CubesResult.random()
    const eventsCube = EventsCubeResult.random()

    return [cubes, eventsCube]
  }

  /**
   * Pause the game (stops timers)
   */
  pause(): void {
    //TODO: this method should only be called when the status is InProgress. Should we assert that or ignore invalid calls like today?
    if (this.status !== GameStatus.InProgress) return

    this._updateTurnDuration()
    this._turnTimer.pause()
    this._setStatus(GameStatus.Paused)
  }

  /**
   * Resume the game (starts timers)
   */
  resume(): void {
    //TODO: this method should only be called when the status is Paused. Should we assert that or ignore invalid calls like today?
    if (this.status !== GameStatus.Paused) return

    this._turnTimer.resume()
    this._setStatus(GameStatus.InProgress)
  }

  /**
   * Start a new game
   */
  newGame(): void {
    this._storage.clear()
    const newSaveData: GameSaveData = {
      gameTurns: [],
      players: this._gameState.gameSaveData.players,
      blockedResults: this._gameState.gameSaveData.blockedResults,
    }
    this._gameState = new GameState(newSaveData)
    this._turnTimer.reset()
    this._setStatus(GameStatus.Setup)
  }

  /**
   * Auto-save timer tick - call this periodically to enable auto-save
   */
  timerTick(): void {
    this._updateTurnDuration()

    //TODO: this method should only be called when the status is InProgress. Should we assert that?
    const currentTime = Date.now() / 1000 // TODO: we don't have to save currentTime and lastSaveTimer in seconds. Remove the / 1000
    if (currentTime - this._lastSaveTime >= AUTO_SAVE_INTERVAL_SECONDS) {
      this._save()
    }
  }

  /**
   * Utility method to get a random element from an array
   */
  private _randomChoice<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot choose from empty array')
    }
    const index = Math.floor(Math.random() * array.length)
    return array[index]
  }

  /**
   * Get various duration statistics for the game.
   */
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

    // Shortest turns
    const sortedByShortest = [...turns].sort(
      (a, b) => a.turnDuration - b.turnDuration
    )
    const shortest = sortedByShortest.slice(0, count).map(turn => ({
      playerName: this._gameState.gameSaveData!.players[turn.playerIndex],
      duration: turn.turnDuration,
      turnNumber: turn.turnNumber,
    }))

    // Longest turns
    const sortedByLongest = [...turns].sort(
      (a, b) => b.turnDuration - a.turnDuration
    )
    const longest = sortedByLongest.slice(0, count).map(turn => ({
      playerName: this._gameState.gameSaveData!.players[turn.playerIndex],
      duration: turn.turnDuration,
      turnNumber: turn.turnNumber,
    }))

    // Check for overlap
    const shortestTurnNumbers = new Set(shortest.map(t => t.turnNumber))
    const longestTurnNumbers = longest.map(t => t.turnNumber)
    const hasOverlap = longestTurnNumbers.some(t => shortestTurnNumbers.has(t))

    if (hasOverlap) {
      return {
        gameDuration: this._gameState.getGameDuration(),
      }
    }

    // Average turn durations
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

    return {
      shortest,
      longest,
      average,
      gameDuration: this._gameState.getGameDuration(),
    }
  }
}
