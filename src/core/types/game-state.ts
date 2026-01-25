/**
 * Game state management for the Catan game
 */
import type { GameSaveData, GameTurn } from './index'
import { CubesResult, EventsCubeResult } from './index'

export class GameState {
  //TODO: consider having the memebers be private, but then we'll need more getters. Perhaps a getter for "normal view data" and "pause view data"
  gameSaveData: GameSaveData
  possibleCubesResults: CubesResult[] = []
  possibleEventsCubeResults: EventsCubeResult[] = []
  currentPlayerIndex: number = -1
  currentTurnNumber: number = 0
  piratesTrack: number = 1
  totalTimeOfFinishedTurns: number = 0

  constructor(saveData: GameSaveData) {
    // Create a new GameSaveData object, copying players and blockedResults,
    // but initializing gameTurns as an empty array.

    const gameTurns = saveData.gameTurns //TODO: this is a bit icky. We get the basic data on the game plus the turns in a single object and we separate it. The basic data is saved in a member without the turns, and the turns are passed into replayTurns so that they will be added back one by one into the same member.
    saveData.gameTurns = []
    this.gameSaveData = saveData

    // Initialize with default values
    this.initPossibleCubesResults()
    this.initPossibleEventsCubeResults()

    // Replay turns from the original saveData to populate the new gameTurns array
    this.replayTurns(gameTurns)
  }

  /**
   * Initialize the pool of possible cube results (36 combinations)
   * Filters out blocked results
   */
  private initPossibleCubesResults(): void {
    this.possibleCubesResults = []

    for (let yellowCube = 1; yellowCube <= 6; yellowCube++) {
      for (let redCube = 1; redCube <= 6; redCube++) {
        const cubes = new CubesResult(yellowCube, redCube)

        // Skip blocked results
        if (this.gameSaveData?.blockedResults.includes(cubes.total)) {
          continue
        }

        this.possibleCubesResults.push(cubes)
      }
    }
  }

  /**
   * Initialize the pool of possible events cube results
   * 18 PIRATES, 6 GREEN, 6 BLUE, 6 YELLOW (total 36)
   */
  private initPossibleEventsCubeResults(): void {
    this.possibleEventsCubeResults = []

    // 6 groups of events
    for (let group = 0; group < 6; group++) {
      // 3 pirates per group
      for (let i = 0; i < 3; i++) {
        this.possibleEventsCubeResults.push(EventsCubeResult.PIRATES)
      }
      // 1 of each color per group
      this.possibleEventsCubeResults.push(EventsCubeResult.GREEN)
      this.possibleEventsCubeResults.push(EventsCubeResult.BLUE)
      this.possibleEventsCubeResults.push(EventsCubeResult.YELLOW)
    }
  }

  /**
   * Calculate total game duration from all turns
   */
  getGameDuration(): number {
    if (!this.gameSaveData) return 0

    const currentTurn = this.getCurrentTurn()
    const currentTurnDuration = currentTurn ? currentTurn.turnDuration : 0
    return this.totalTimeOfFinishedTurns + currentTurnDuration
  }

  /**
   * Play a turn (used for both replay and new turns)
   * Updates game state by removing used cubes/events and managing pirates track
   */
  playTurn(gameTurn: GameTurn): void {
    if (!this.gameSaveData) {
      throw new Error('No game save data')
    }

    // Add the duration of the previous turn (if it exists) to the total
    if (this.gameSaveData.gameTurns.length > 0) {
      const previousTurn =
        this.gameSaveData.gameTurns[this.gameSaveData.gameTurns.length - 1]
      this.totalTimeOfFinishedTurns += previousTurn.turnDuration
    }

    // Validate turn number
    if (this.currentTurnNumber !== gameTurn.turnNumber) {
      throw new Error(
        `Invalid turn number: expected ${this.currentTurnNumber}, got ${gameTurn.turnNumber}`
      )
    }

    // Validate player index
    if (this.currentPlayerIndex !== gameTurn.playerIndex) {
      throw new Error(
        `Invalid player index: expected ${this.currentPlayerIndex}, got ${gameTurn.playerIndex}`
      )
    }

    // Remove cubes from pool (unless predetermined)
    let found = false
    if (gameTurn.cubes.predetermined === true) {
      found = true
    } else {
      for (let i = 0; i < this.possibleCubesResults.length; i++) {
        if (this.possibleCubesResults[i].equals(gameTurn.cubes)) {
          this.possibleCubesResults.splice(i, 1)
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
    for (let i = 0; i < this.possibleEventsCubeResults.length; i++) {
      if (this.possibleEventsCubeResults[i] === gameTurn.eventsCube) {
        this.possibleEventsCubeResults.splice(i, 1)
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
    if (this.piratesTrack >= 8) {
      this.piratesTrack = 1
    }

    // Increment pirates track if pirates was rolled
    if (gameTurn.eventsCube === EventsCubeResult.PIRATES) {
      this.piratesTrack += 1
    }

    // Replenish pools if empty
    if (this.possibleCubesResults.length === 0) {
      this.initPossibleCubesResults()
    }

    if (this.possibleEventsCubeResults.length === 0) {
      this.initPossibleEventsCubeResults()
    }

    // Add the turn to the history
    this.gameSaveData.gameTurns.push(gameTurn)
  }

  /**
   * Replay all saved turns to restore game state
   */
  private replayTurns(turnsToReplay: GameTurn[]): void {
    if (!this.gameSaveData) return

    for (const gameTurn of turnsToReplay) {
      this.currentPlayerIndex =
        (this.currentPlayerIndex + 1) % this.gameSaveData.players.length
      this.currentTurnNumber += 1

      this.playTurn(gameTurn)
    }
  }

  /**
   * Get the current player's name
   */
  getCurrentPlayerName(): string {
    if (!this.gameSaveData) return ''
    if (this.currentPlayerIndex < 0) return ''

    return this.gameSaveData.players[this.currentPlayerIndex]
  }

  /**
   * Get the current turn (which is the last one in the list)
   */
  getCurrentTurn(): GameTurn {
    //TODO: make sure this is not called when there are no turns. If there are no turns we should not be in normal view, we should be in StartGameView.
    const turns = this.gameSaveData.gameTurns

    return turns[turns.length - 1]
  }
}
