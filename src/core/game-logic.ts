/**
 * Core game logic for Catan dice game.
 * Ported from Python version in catan-cli/logic/game_logic.py
 */

import type { GameTurn, DurationStats, Duration } from './types'
import {
  GameState,
  CubesResult,
  EventsCubeResult,
  eventsCubeFromFaceNumber,
} from './types'
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
  private turnTimer: Timer
  private gameTimer: Timer
  private isInProgress: boolean = true
  private lastSaveTime: number = 0

  /**
   * Initialize the game logic
   * @param storageKey - LocalStorage key for saving/loading (defaults to 'catan-game-save')
   */
  constructor(storageKey: string = 'catan-game-save') {
    this.storage = new GameStorage(storageKey)
    this.gameState = new GameState()

    this.load()

    this.initPossibleCubesResults()
    this.initPossibleEventsCubeResults()

    this.replayTurns()

    // Initialize timers
    const totalGameDuration = this.calculateTotalGameDuration()
    this.gameTimer = new Timer(totalGameDuration)

    const lastTurnDuration = this.getLastTurnDuration()
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
   * Initialize the pool of possible cube results (36 combinations)
   * Filters out blocked results
   */
  private initPossibleCubesResults(): void {
    this.gameState.possibleCubesResults = []

    for (let yellowCube = 1; yellowCube <= 6; yellowCube++) {
      for (let redCube = 1; redCube <= 6; redCube++) {
        const cubes = new CubesResult(yellowCube, redCube)

        // Skip blocked results
        if (
          this.gameState.gameSaveData?.blockedResults.includes(cubes.total)
        ) {
          continue
        }

        this.gameState.possibleCubesResults.push(cubes)
      }
    }
  }

  /**
   * Initialize the pool of possible events cube results
   * 18 PIRATES, 6 GREEN, 6 BLUE, 6 YELLOW (total 36)
   */
  private initPossibleEventsCubeResults(): void {
    this.gameState.possibleEventsCubeResults = []

    // 6 groups of events
    for (let group = 0; group < 6; group++) {
      // 3 pirates per group
      for (let i = 0; i < 3; i++) {
        this.gameState.possibleEventsCubeResults.push(EventsCubeResult.PIRATES)
      }
      // 1 of each color per group
      this.gameState.possibleEventsCubeResults.push(EventsCubeResult.GREEN)
      this.gameState.possibleEventsCubeResults.push(EventsCubeResult.BLUE)
      this.gameState.possibleEventsCubeResults.push(EventsCubeResult.YELLOW)
    }
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
   * Calculate total game duration from all turns
   */
  private calculateTotalGameDuration(): number {
    if (!this.gameState.gameSaveData) return 0

    let total = 0
    for (const turn of this.gameState.gameSaveData.gameTurns) {
      total += turn.turnDuration
    }
    return total
  }

  /**
   * Get the duration of the last turn (or 0 if no turns)
   */
  private getLastTurnDuration(): number {
    if (!this.gameState.gameSaveData) return 0

    const turns = this.gameState.gameSaveData.gameTurns
    if (turns.length === 0) return 0

    return turns[turns.length - 1].turnDuration
  }

  /**
   * Replay all saved turns to restore game state
   */
  private replayTurns(): void {
    if (!this.gameState.gameSaveData) return

    for (const gameTurn of this.gameState.gameSaveData.gameTurns) {
      this.gameState.currentPlayerIndex =
        (this.gameState.currentPlayerIndex + 1) %
        this.gameState.gameSaveData.players.length
      this.gameState.currentTurnNumber += 1

      this.playTurn(gameTurn)
    }
  }

  /**
   * Play a turn (used for both replay and new turns)
   * Updates game state by removing used cubes/events and managing pirates track
   */
  private playTurn(gameTurn: GameTurn): void {
    if (!this.gameState.gameSaveData) {
      throw new Error('No game save data')
    }

    // Validate turn number
    if (this.gameState.currentTurnNumber !== gameTurn.turnNumber) {
      throw new Error(
        `Invalid turn number: expected ${this.gameState.currentTurnNumber}, got ${gameTurn.turnNumber}`
      )
    }

    // Validate player index
    if (this.gameState.currentPlayerIndex !== gameTurn.playerIndex) {
      throw new Error(
        `Invalid player index: expected ${this.gameState.currentPlayerIndex}, got ${gameTurn.playerIndex}`
      )
    }

    // Remove cubes from pool (unless predetermined)
    let found = false
    if (gameTurn.cubes.predetermined === true) {
      found = true
    } else {
      for (let i = 0; i < this.gameState.possibleCubesResults.length; i++) {
        if (this.gameState.possibleCubesResults[i].equals(gameTurn.cubes)) {
          this.gameState.possibleCubesResults.splice(i, 1)
          found = true
          break
        }
      }
    }

    if (!found) {
      throw new Error('Invalid cubes in turn: not found in possible results')
    }

    // Remove events cube from pool
    found = false
    for (
      let i = 0;
      i < this.gameState.possibleEventsCubeResults.length;
      i++
    ) {
      if (this.gameState.possibleEventsCubeResults[i] === gameTurn.eventsCube) {
        this.gameState.possibleEventsCubeResults.splice(i, 1)
        found = true
        break
      }
    }

    if (!found) {
      throw new Error(
        'Invalid events cube in turn: not found in possible results'
      )
    }

    // Reset pirates track if >= 8
    if (this.gameState.piratesTrack >= 8) {
      this.gameState.piratesTrack = 1
    }

    // Increment pirates track if pirates was rolled
    if (gameTurn.eventsCube === EventsCubeResult.PIRATES) {
      this.gameState.piratesTrack += 1
    }

    // Replenish pools if empty
    if (this.gameState.possibleCubesResults.length === 0) {
      this.initPossibleCubesResults()
    }

    if (this.gameState.possibleEventsCubeResults.length === 0) {
      this.initPossibleEventsCubeResults()
    }
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
    this.playTurn(gameTurn)
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
    const redCube = Math.floor(Math.random() * 6) + 1
    const yellowCube = Math.floor(Math.random() * 6) + 1
    const eventsFace = Math.floor(Math.random() * 6) + 1

    const cubes = new CubesResult(yellowCube, redCube)
    const eventsCube = eventsCubeFromFaceNumber(eventsFace)

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
    stats.gameDuration = this.gameTimer.getCurrentDuration()

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
        this.gameState.gameSaveData.players[
          this.gameState.currentPlayerIndex
        ]
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
    if (!this.gameState.gameSaveData) return ''
    if (this.gameState.currentPlayerIndex < 0) return ''

    return this.gameState.gameSaveData.players[
      this.gameState.currentPlayerIndex
    ]
  }

  /**
   * Get the last turn (most recent)
   */
  getLastTurn(): GameTurn | null {
    if (!this.gameState.gameSaveData) return null

    const turns = this.gameState.gameSaveData.gameTurns
    if (turns.length === 0) return null

    return turns[turns.length - 1]
  }
}
