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
  private storage: GameStorage
  private gameState: GameState
  private turnTimer: Timer //TODO: why is the Timer class needed?
  private gameTimer: Timer //TODO: why is the Timer class needed?
  private _status: GameStatusType
  private lastSaveTime: number = 0
  public onStatusChange: (status: GameStatusType) => void

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
    this.storage = new GameStorage(storageKey) //TODO: should I use multiple storage keys, one for initial game data and finished turns (changed just when the turn advances) vs current turn data that is saved again and again every 10 seconds? Or it doesn't matter?
    this.onStatusChange = onStatusChange

    const saveData = initialData ?? this.storage.load()

    if (saveData === null) {
      throw new Error(
        'No save data found. Create a new game using GameStorage.createNewGame()'
      )
    }

    this.gameState = new GameState(saveData)

    // Set initial status without calling callback
    this._status =
      this.gameState.gameSaveData.gameTurns.length === 0
        ? GameStatus.Start
        : GameStatus.InProgress

    //TODO: not sure why two timers are needed, can't we
    // Initialize timers
    this.gameTimer = new Timer(this.gameState.getGameDuration())

    const lastTurnDuration = this.gameState.getCurrentTurn()?.turnDuration ?? 0
    this.turnTimer = new Timer(lastTurnDuration)
  }

  /**
   * Get the current game state (read-only)
   */
  get state(): GameState {
    return this.gameState
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
  private setStatus(newStatus: GameStatusType): void {
    if (this._status !== newStatus) {
      this._status = newStatus
      this.onStatusChange(newStatus)
    }
  }

  /**
   * Get the game timer
   */
  get gameTimerInstance(): Timer {
    return this.gameTimer
  }

  /**
   * Get the turn timer
   */
  get turnTimerInstance(): Timer {
    return this.turnTimer
  }

  /**
   * Update the current turn's duration based on elapsed time
   */
  private updateTurnDuration(): void {
    if (!this.gameState.gameSaveData) return

    const turns = this.gameState.gameSaveData.gameTurns
    if (turns.length === 0) return

    const currentTurn = turns[turns.length - 1]
    currentTurn.turnDuration = Math.floor(this.turnTimer.getCurrentDuration())
  }

  /**
   * Save game state to storage
   */
  private save(): void {
    if (!this.gameState.gameSaveData) return

    this.updateTurnDuration()
    this.storage.save(this.gameState.gameSaveData)
    this.lastSaveTime = Date.now() / 1000
  }

  /**
   * Internal method to execute a turn with given cubes
   */
  private innerNextTurn(cubes: CubesResult): void {
    if (!this.gameState.gameSaveData) {
      throw new Error('No game save data')
    }

    if (this.status === GameStatus.Start) {
      this.setStatus(GameStatus.InProgress)
    }

    // Move to next player
    this.gameState.currentPlayerIndex =
      (this.gameState.currentPlayerIndex + 1) %
      this.gameState.gameSaveData.players.length
    this.gameState.currentTurnNumber += 1

    // Update previous turn duration
    this.updateTurnDuration()

    // Create new turn
    const eventsCube = this.randomChoice(
      this.gameState.possibleEventsCubeResults
    )

    const gameTurn: GameTurn = {
      turnNumber: this.gameState.currentTurnNumber,
      playerIndex: this.gameState.currentPlayerIndex,
      cubes,
      eventsCube,
      turnDuration: 0,
    }

    // Play the turn and add to history
    this.gameState.playTurn(gameTurn)

    // Reset turn timer for new turn
    this.turnTimer.reset()

    // Save
    this.save()
  }

  /**
   * Execute the next turn with random cubes
   */
  nextTurn(): void {
    //TODO: this method should only be called when the status is Start or InProgress. Should we assert that or ignore invalid calls like today?
    const cubes = this.randomChoice(this.gameState.possibleCubesResults)
    this.innerNextTurn(cubes)
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
    this.innerNextTurn(cubes)
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

    this.updateTurnDuration()
    this.gameTimer.pause()
    this.turnTimer.pause()
    this.setStatus(GameStatus.Paused)
  }

  /**
   * Resume the game (starts timers)
   */
  resume(): void {
    //TODO: this method should only be called when the status is Paused. Should we assert that or ignore invalid calls like today?
    if (this.status !== GameStatus.Paused) return

    this.gameTimer.resume()
    this.turnTimer.resume()
    this.setStatus(GameStatus.InProgress)
  }

  /**
   * Auto-save timer tick - call this periodically to enable auto-save
   */
  timerTick(): void {
    //TODO: this method should only be called when the status is InProgress. Should we assert that?
    const currentTime = Date.now() / 1000
    if (currentTime - this.lastSaveTime >= AUTO_SAVE_INTERVAL_SECONDS) {
      this.save()
    }
  }

  /**
   * Utility method to get a random element from an array
   */
  private randomChoice<T>(array: T[]): T {
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
    if (!this.gameState.gameSaveData) {
      return null
    }

    const turns = [...this.gameState.gameSaveData.gameTurns]
    const count = this.gameState.gameSaveData.players.length

    // Shortest turns
    const sortedByShortest = [...turns].sort(
      (a, b) => a.turnDuration - b.turnDuration
    )
    const shortest = sortedByShortest.slice(0, count).map(turn => ({
      playerName: this.gameState.gameSaveData!.players[turn.playerIndex],
      duration: turn.turnDuration,
    }))

    // Longest turns
    const sortedByLongest = [...turns].sort(
      (a, b) => b.turnDuration - a.turnDuration
    )
    const longest = sortedByLongest.slice(0, count).map(turn => ({
      playerName: this.gameState.gameSaveData!.players[turn.playerIndex],
      duration: turn.turnDuration,
    }))

    // Average turn durations
    const playerDurations: { [playerName: string]: number[] } = {}
    for (const turn of this.gameState.gameSaveData.gameTurns) {
      const playerName = this.gameState.gameSaveData!.players[turn.playerIndex]
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
      average.push({ playerName, duration: avg })
    }

    return {
      shortest,
      longest,
      average,
      gameDuration: this.gameState.getGameDuration(),
    }
  }
}
