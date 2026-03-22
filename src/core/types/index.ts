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
  turnNumber: number
}

/**
 * Statistics about game and turn durations
 */
export interface DurationStats {
  gameDuration: number
  shortest?: Duration[]
  longest?: Duration[]
  average?: Duration[]
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

type GameSaveDataJsonParseResult =
  | { ok: true; data: GameSaveData }
  | { ok: false; errors: string[] }

/**
 * Data structure for saving/loading game state (serializable game snapshot).
 */
export class GameSaveData {
  players: string[]
  blockedResults: number[]
  gameTurns: GameTurn[]

  constructor(
    players: string[],
    blockedResults: number[],
    gameTurns: GameTurn[] = []
  ) {
    this.players = players
    this.blockedResults = blockedResults
    this.gameTurns = gameTurns
  }

  /**
   * Parse JSON text into structural {@link GameSaveData} (non-throwing).
   * Suitable for live editor validation; does not run {@link GameState.tryFromGameSaveData}.
   */
  static tryFromJsonString(text: string): GameSaveDataJsonParseResult {
    let plain: unknown
    try {
      plain = JSON.parse(text)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return { ok: false, errors: [`Invalid JSON: ${msg}`] }
    }
    return GameSaveData.parsePlainObject(plain)
  }

  /**
   * Serialize this snapshot to JSON. When `pretty` is true, uses 2-space indentation (default).
   */
  toJsonString(pretty: boolean = true): string {
    const plain = {
      players: this.players,
      blockedResults: this.blockedResults,
      gameTurns: this.gameTurns.map(turn => ({
        turnNumber: turn.turnNumber,
        playerIndex: turn.playerIndex,
        cubes: {
          yellowCube: turn.cubes.yellowCube,
          redCube: turn.cubes.redCube,
          predetermined: turn.cubes.predetermined,
        },
        eventsCube: turn.eventsCube,
        turnDuration: turn.turnDuration,
      })),
    }
    return pretty ? JSON.stringify(plain, null, 2) : JSON.stringify(plain)
  }

  private static parsePlainObject(plain: unknown): GameSaveDataJsonParseResult {
    if (typeof plain !== 'object' || plain === null) {
      return { ok: false, errors: ['Invalid save data: root must be an object'] }
    }

    const p = plain as Record<string, unknown>

    if (!p.players || !Array.isArray(p.players)) {
      return {
        ok: false,
        errors: ['Invalid save data: missing or invalid players array'],
      }
    }
    if (!p.blockedResults || !Array.isArray(p.blockedResults)) {
      return {
        ok: false,
        errors: ['Invalid save data: missing or invalid blockedResults array'],
      }
    }
    if (!p.gameTurns || !Array.isArray(p.gameTurns)) {
      return {
        ok: false,
        errors: ['Invalid save data: missing or invalid gameTurns array'],
      }
    }

    const players = p.players as unknown[]
    if (!players.every((x): x is string => typeof x === 'string')) {
      return { ok: false, errors: ['Invalid save data: players must be strings'] }
    }

    const blockedResults = p.blockedResults as unknown[]
    if (!blockedResults.every((x): x is number => typeof x === 'number')) {
      return {
        ok: false,
        errors: ['Invalid save data: blockedResults must be numbers'],
      }
    }

    const gameTurns: GameTurn[] = []
    for (let i = 0; i < p.gameTurns.length; i++) {
      const turn = p.gameTurns[i]
      if (typeof turn !== 'object' || turn === null) {
        return {
          ok: false,
          errors: [`Invalid turn at index ${i}: not an object`],
        }
      }

      const t = turn as Record<string, unknown>

      if (
        !t.cubes ||
        typeof t.turnNumber !== 'number' ||
        typeof t.playerIndex !== 'number' ||
        typeof t.turnDuration !== 'number'
      ) {
        return {
          ok: false,
          errors: [`Invalid turn at index ${i}: missing or invalid fields`],
        }
      }

      const cubesObj = t.cubes as Record<string, unknown>

      const yellow = Number(cubesObj.yellowCube)
      const red = Number(cubesObj.redCube)
      const predetermined =
        cubesObj.predetermined === undefined
          ? undefined
          : Boolean(cubesObj.predetermined)

      gameTurns.push({
        turnNumber: Number(t.turnNumber),
        playerIndex: Number(t.playerIndex),
        cubes: new CubesResult(yellow, red, predetermined),
        eventsCube: t.eventsCube as EventsCubeResult,
        turnDuration: Number(t.turnDuration),
      })
    }

    return {
      ok: true,
      data: new GameSaveData(
        players as string[],
        blockedResults as number[],
        gameTurns
      ),
    }
  }
}

export type GameSaveDataTryFromJsonResult = GameSaveDataJsonParseResult

/**
 * Represents the current status of the game
 */
export const GameMode = {
  Setup: 'Setup',
  InProgress: 'InProgress',
  Paused: 'Paused',
} as const

export type GameMode = keyof typeof GameMode
