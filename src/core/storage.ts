/**
 * LocalStorage wrapper for game save data persistence.
 * Replaces file I/O from Python version with browser LocalStorage.
 */

import { GameSaveData } from './types'

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
      const serialized = data.toJsonString(true)
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
      const parsed = GameSaveData.tryFromJsonString(serialized)
      if (!parsed.ok) {
        throw new StorageError(parsed.errors.join('; '))
      }
      return parsed.data
    } catch (error) {
      if (error instanceof StorageError) {
        throw error
      }
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
   * @param initialData - Optional initial game data to use instead of creating a new game
   * @returns The created GameSaveData object
   */
  createNewGame(
    //TODO: this method does double duty, either creating a new game according to params, or directly saves a precreated game (for mocking). We probably want to separate to two methods for clarity.
    players: string[],
    blockedResults: number[] = [],
    initialData: GameSaveData | null = null
  ): GameSaveData {
    if (initialData) {
      this.save(initialData)
      return initialData
    }

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

    const newGame = new GameSaveData(players, blockedResults, [])
    this.save(newGame)
    return newGame
  }
}
