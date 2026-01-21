/**
 * Core game logic for Catan dice game.
 * Ported from Python version in catan-cli/logic/game_logic.py
 */

import type { GameTurn, DurationStats, Duration } from './types/index'
import { CubesResult, EventsCubeResult } from './types/index'
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
  private isInProgress: boolean = true
  private lastSaveTime: number = 0

  /**
   * Initialize the game logic
   * @param storageKey - LocalStorage key for saving/loading (defaults to 'catan-game-save')
   */
  constructor(storageKey: string = 'catan-game-save') {
    this.storage = new GameStorage(storageKey) //TODO: should I use multiple storage keys, one for initial game data and finished turns (changed just when the turn advances) vs current turn data that is saved again and again every 10 seconds? Or it doesn't matter?
    this.gameState = new GameState()

    this.load()

    this.gameState.initPossibleCubesResults()
    this.gameState.initPossibleEventsCubeResults()

    this.gameState.replayTurns()

    //TODO: not sure why two timers are needed, can't we
    // Initialize timers
    const totalGameDuration = this.gameState.calculateTotalGameDuration()
    this.gameTimer = new Timer(totalGameDuration)

    const lastTurnDuration = this.gameState.getLastTurnDuration()
    this.turnTimer = new Timer(lastTurnDuration)
  }

  /**
   * Get the current game state (read-only)
   */
  get state(): GameState {
    return this.gameState
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
   * Load game save data from storage
   */
  private load(): void {
    const saveData = this.storage.load()

    if (saveData === null) {
      throw new Error(
        'No save data found. Create a new game using GameStorage.createNewGame()'
      )
    }

    this.gameState.gameSaveData = saveData
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
    this.gameState.gameSaveData.gameTurns.push(gameTurn)

    // Reset turn timer for new turn
    this.turnTimer.reset()

    // Save
    this.save()
  }

  /**
   * Execute the next turn with random cubes
   */
  nextTurn(): void {
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
    if (!this.isInProgress) return

    this.updateTurnDuration()
    this.gameTimer.pause()
    this.turnTimer.pause()
    this.isInProgress = false
  }

  /**
   * Resume the game (starts timers)
   */
  resume(): void {
    if (this.isInProgress) return

    this.gameTimer.resume()
    this.turnTimer.resume()
    this.isInProgress = true
  }

  /**
   * Check if game is in progress (not paused)
   */
  isGameInProgress(): boolean {
    return this.isInProgress
  }

  /**
   * Get duration statistics for the game
   * @returns Duration statistics or null if no turns have been played
   */
  getDurationStats(): DurationStats | null {
    if (!this.gameState.gameSaveData) return null
    if (this.gameState.gameSaveData.gameTurns.length === 0) return null

    const stats: DurationStats = {
      gameDuration: 0,
      currentTurnDuration: 0,
      shortest: [],
      longest: [],
      average: [],
    }

    // Calculate current turn duration
    stats.currentTurnDuration = this.turnTimer.getCurrentDuration()

    // Calculate game duration
    stats.gameDuration = this.gameTimer.getCurrentDuration() //TODO: no need for a timer for game duration. The duration of all finished turns can be precalculated, and then only the current turn duration (which we have) can be added to get the game duration.

    // Collect all turn durations with player names
    const allDurations: Duration[] = []
    const playerTotalDurations = new Map<string, number>()
    const playerTurnCounts = new Map<string, number>()

    for (const turn of this.gameState.gameSaveData.gameTurns) {
      const playerName = this.gameState.gameSaveData.players[turn.playerIndex]
      const duration = turn.turnDuration

      allDurations.push({ playerName, duration })

      playerTotalDurations.set(
        playerName,
        (playerTotalDurations.get(playerName) || 0) + duration
      )
      playerTurnCounts.set(
        playerName,
        (playerTurnCounts.get(playerName) || 0) + 1
      )
    }

    // Add current turn if game is in progress
    if (this.isInProgress) {
      const currentPlayerName =
        this.gameState.gameSaveData.players[this.gameState.currentPlayerIndex]
      const currentDuration = this.turnTimer.getCurrentDuration()

      allDurations.push({
        playerName: currentPlayerName,
        duration: currentDuration,
      })

      playerTotalDurations.set(
        currentPlayerName,
        (playerTotalDurations.get(currentPlayerName) || 0) + currentDuration
      )
      playerTurnCounts.set(
        currentPlayerName,
        (playerTurnCounts.get(currentPlayerName) || 0) + 1
      )
    }

    // Get top 3 shortest (shortest first)
    const sortedShortest = [...allDurations].sort(
      (a, b) => a.duration - b.duration
    )
    stats.shortest = sortedShortest.slice(0, 3)

    // Get top 3 longest (longest first)
    const sortedLongest = [...allDurations].sort(
      (a, b) => b.duration - a.duration
    )
    stats.longest = sortedLongest.slice(0, 3)

    // Calculate averages for each player (longest first)
    for (const [playerName, totalDuration] of playerTotalDurations) {
      const turnCount = playerTurnCounts.get(playerName) || 1
      const avgDuration = totalDuration / turnCount
      stats.average.push({ playerName, duration: avgDuration })
    }

    stats.average.sort((a, b) => b.duration - a.duration)

    return stats
  }

  /**
   * Auto-save timer tick - call this periodically to enable auto-save
   */
  timerTick(): void {
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
   * Get the current player's name
   */
  getCurrentPlayerName(): string {
    return this.gameState.getCurrentPlayerName()
  }

  /**
   * Get the last turn (most recent)
   */
  getLastTurn(): GameTurn | null {
    return this.gameState.getLastTurn()
  }
}
