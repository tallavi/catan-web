/**
 * LocalStorage wrapper for game save data persistence.
 * Replaces file I/O from Python version with browser LocalStorage.
 */

import type { GameSaveData, GameTurn } from './types'
import { CubesResult, EventsCubeResult } from './types'

/**
 * Error thrown when storage operations fail
 */
export class StorageError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'StorageError'
    this.cause = cause
  }
}

/**
 * Manages game state persistence using browser LocalStorage
 */
export class GameStorage {
  private storageKey: string

  /**
   * Create a new GameStorage instance
   * @param storageKey - The key to use for localStorage
   */
  constructor(storageKey: string = 'catan-game-save') {
    this.storageKey = storageKey
  }

  /**
   * Save game data to localStorage
   * @param data - The game save data to persist
   * @throws {StorageError} If serialization or storage fails
   */
  save(data: GameSaveData): void {
    try {
      const serialized = this.serialize(data)
      localStorage.setItem(this.storageKey, serialized)
    } catch (error) {
      throw new StorageError('Failed to save game data', error)
    }
  }

  /**
   * Load game data from localStorage
   * @returns The loaded game save data, or null if not found
   * @throws {StorageError} If deserialization fails
   */
  load(): GameSaveData | null {
    try {
      const serialized = localStorage.getItem(this.storageKey)
      if (serialized === null) {
        return null
      }
      return this.deserialize(serialized)
    } catch (error) {
      throw new StorageError('Failed to load game data', error)
    }
  }

  /**
   * Check if saved game data exists
   * @returns true if save data exists, false otherwise
   */
  exists(): boolean {
    return localStorage.getItem(this.storageKey) !== null
  }

  /**
   * Clear saved game data from localStorage
   */
  clear(): void {
    localStorage.removeItem(this.storageKey)
  }

  /**
   * Create a new game save file with specified players and blocked results
   * @param players - List of player names
   * @param blockedResults - Optional list of blocked cube totals (2-12)
   * @returns The created GameSaveData object
   */
  static createNewGame(
    players: string[],
    blockedResults: number[] = []
  ): GameSaveData {
    if (players.length === 0) {
      throw new Error('At least one player is required')
    }

    // Validate blocked results are in valid range (2-12)
    for (const result of blockedResults) {
      if (result < 2 || result > 12) {
        throw new Error(
          `Invalid blocked result: ${result}. Must be between 2 and 12.`
        )
      }
    }

    return {
      players,
      blockedResults,
      gameTurns: [],
    }
  }

  /**
   * Serialize GameSaveData to JSON string
   * Handles custom types like CubesResult and EventsCubeResult
   */
  private serialize(data: GameSaveData): string {
    // Convert to plain object for serialization
    const plain = {
      players: data.players,
      blockedResults: data.blockedResults,
      gameTurns: data.gameTurns.map((turn) => ({
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

    return JSON.stringify(plain, null, 2)
  }

  /**
   * Deserialize JSON string to GameSaveData
   * Reconstructs custom types like CubesResult
   */
  private deserialize(json: string): GameSaveData {
    const plain = JSON.parse(json)

    // Validate structure
    if (!plain.players || !Array.isArray(plain.players)) {
      throw new Error('Invalid save data: missing or invalid players array')
    }

    if (!plain.blockedResults || !Array.isArray(plain.blockedResults)) {
      throw new Error(
        'Invalid save data: missing or invalid blockedResults array'
      )
    }

    if (!plain.gameTurns || !Array.isArray(plain.gameTurns)) {
      throw new Error('Invalid save data: missing or invalid gameTurns array')
    }

    // Reconstruct GameTurns with proper types
    const gameTurns: GameTurn[] = plain.gameTurns.map((turn: any) => {
      if (!turn.cubes) {
        throw new Error('Invalid turn: missing cubes')
      }

      return {
        turnNumber: turn.turnNumber,
        playerIndex: turn.playerIndex,
        cubes: new CubesResult(
          turn.cubes.yellowCube,
          turn.cubes.redCube,
          turn.cubes.predetermined
        ),
        eventsCube: turn.eventsCube as EventsCubeResult,
        turnDuration: turn.turnDuration,
      }
    })

    return {
      players: plain.players,
      blockedResults: plain.blockedResults,
      gameTurns,
    }
  }
}
