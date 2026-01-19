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
 */
export const EventsCubeResult = {
  GREEN: 0,
  BLUE: 1,
  YELLOW: 2,
  PIRATES: 3,
} as const

export type EventsCubeResult =
  (typeof EventsCubeResult)[keyof typeof EventsCubeResult]

/**
 * Convert a die face number (1-6) to an EventsCubeResult
 * Face 1 = GREEN, 2 = BLUE, 3 = YELLOW, 4-6 = PIRATES
 */
export function eventsCubeFromFaceNumber(n: number): EventsCubeResult {
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
export function getEventsCubeName(result: EventsCubeResult): string {
  const entries = Object.entries(EventsCubeResult) as [string, number][]
  const entry = entries.find(([, value]) => value === result)
  return entry ? entry[0] : 'UNKNOWN'
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
   * Compare with another CubesResult for sorting
   * Sorts by total first, then by red cube value
   */
  compareTo(other: CubesResult): number {
    if (this.total === other.total) {
      return this.redCube - other.redCube
    }
    return this.total - other.total
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
}
