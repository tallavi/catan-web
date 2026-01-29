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
        throw new Error(`Invalid face number: \${n}. Must be 1-6.`)
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

  /**
   * Get the CSS class for an EventsCubeResult
   */
  static getColorClass(result: EventsCubeResult): string {
    switch (result) {
      case EventsCubeResult.GREEN:
        return 'text-green'
      case EventsCubeResult.BLUE:
        return 'text-blue'
      case EventsCubeResult.YELLOW:
        return 'text-yellow'
      case EventsCubeResult.PIRATES:
        return 'text-muted'
      default:
        return ''
    }
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
 * Represents the current status of the game
 */
export const GameStatus = {
  Setup: 'Setup',
  InProgress: 'InProgress',
  Paused: 'Paused',
} as const

export type GameStatus = keyof typeof GameStatus
