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

export {
  EventsCubeResult,
  CubesResult,
  GameSaveData,
  type GameTurn,
  type GameSaveDataTryFromJsonResult,
} from './GameSaveData'
