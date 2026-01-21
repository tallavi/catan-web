/**
 * Core type definitions for the Catan game logic.
 * Ported from Python dataclasses in catan-cli/logic/game_logic.py
 */

/**
 * Represents a duration record for a player's turn
 */
export interface Duration {
  playerName: string
  duration: number
}

/**
 * Statistics about game and turn durations
 */
export interface DurationStats {
  gameDuration: number
  currentTurnDuration: number
  shortest: Duration[]
  longest: Duration[]
  average: Duration[]
}

/**
 * Events cube results
 * Represents the possible outcomes of the events die
 * Object-oriented class with built-in randomization methods
 */
export class EventsCubeResult {
  static readonly GREEN = 0
  static readonly BLUE = 1
  static readonly YELLOW = 2
  static readonly PIRATES = 3

  /**
   * Generate a random EventsCubeResult based on die probabilities
   * Face 1 = GREEN, 2 = BLUE, 3 = YELLOW, 4-6 = PIRATES
   */
  static random(): EventsCubeResult {
    const face = Math.floor(Math.random() * 6) + 1
    return this.fromFaceNumber(face)
  }

  /**
   * Convert a die face number (1-6) to an EventsCubeResult
   * Face 1 = GREEN, 2 = BLUE, 3 = YELLOW, 4-6 = PIRATES
   */
  static fromFaceNumber(n: number): EventsCubeResult {
    switch (n) {
      case 1:
        return EventsCubeResult.GREEN
      case 2:
        return EventsCubeResult.BLUE
      case 3:
        return EventsCubeResult.YELLOW
      case 4:
      case 5:
      case 6:
        return EventsCubeResult.PIRATES
      default:
        throw new Error(`Invalid face number: ${n}. Must be 1-6.`)
    }
  }

  /**
   * Get the name of an EventsCubeResult
   */
  static getName(result: EventsCubeResult): string {
    const entries = Object.entries(this) as [string, number][]
    const entry = entries.find(([, value]) => value === result)
    return entry ? entry[0] : 'UNKNOWN'
  }
}

/**
 * Represents the result of rolling two dice (yellow and red)
 */
export class CubesResult {
  yellowCube: number
  redCube: number
  /**
   * Whether this result was predetermined (manually input) rather than randomly drawn.
   * Predetermined cubes bypass pool validation - useful for manual game state input.
   * - undefined/false: Normal random roll, must exist in available pool
   * - true: Manual input, bypasses pool validation
   */
  predetermined?: boolean

  constructor(yellowCube: number, redCube: number, predetermined?: boolean) {
    this.yellowCube = yellowCube
    this.redCube = redCube
    this.predetermined = predetermined
  }

  /**
   * Get the total of both dice
   */
  get total(): number {
    return this.yellowCube + this.redCube
  }

  /**
   * Check equality with another CubesResult
   */
  equals(other: CubesResult): boolean {
    return (
      this.yellowCube === other.yellowCube &&
      this.redCube === other.redCube &&
      this.total === other.total &&
      this.predetermined === other.predetermined
    )
  }

  /**
   * Generate a random CubesResult with values 1-6 for both dice
   */
  static random(): CubesResult {
    const yellowCube = Math.floor(Math.random() * 6) + 1
    const redCube = Math.floor(Math.random() * 6) + 1
    return new CubesResult(yellowCube, redCube)
  }
}

/**
 * Represents a single turn in the game
 */
export interface GameTurn {
  turnNumber: number
  playerIndex: number
  cubes: CubesResult
  eventsCube: EventsCubeResult
  turnDuration: number
}

/**
 * Data structure for saving/loading game state
 */
export interface GameSaveData {
  players: string[]
  blockedResults: number[]
  gameTurns: GameTurn[]
}

/**
 * Current state of the game
 */
export class GameState {
  gameSaveData: GameSaveData | null = null
  possibleCubesResults: CubesResult[] = []
  possibleEventsCubeResults: EventsCubeResult[] = []
  currentPlayerIndex: number = -1
  currentTurnNumber: number = 0
  piratesTrack: number = 1

  constructor() {
    // Initialize with default values
  }

  /**
   * Initialize the pool of possible cube results (36 combinations)
   * Filters out blocked results
   */
  initPossibleCubesResults(): void {
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
  initPossibleEventsCubeResults(): void {
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
  calculateTotalGameDuration(): number {
    if (!this.gameSaveData) return 0

    let total = 0
    for (const turn of this.gameSaveData.gameTurns) {
      total += turn.turnDuration
    }
    return total
  }

  /**
   * Get the duration of the last turn (or 0 if no turns)
   */
  getLastTurnDuration(): number {
    if (!this.gameSaveData) return 0

    const turns = this.gameSaveData.gameTurns
    if (turns.length === 0) return 0

    return turns[turns.length - 1].turnDuration
  }

  /**
   * Play a turn (used for both replay and new turns)
   * Updates game state by removing used cubes/events and managing pirates track
   */
  playTurn(gameTurn: GameTurn): void {
    if (!this.gameSaveData) {
      throw new Error('No game save data')
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
  }

  /**
   * Replay all saved turns to restore game state
   */
  replayTurns(): void {
    if (!this.gameSaveData) return

    for (const gameTurn of this.gameSaveData.gameTurns) {
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
   * Get the last turn (most recent)
   */
  getLastTurn(): GameTurn | null {
    if (!this.gameSaveData) return null

    const turns = this.gameSaveData.gameTurns
    if (turns.length === 0) return null

    return turns[turns.length - 1]
  }
}
