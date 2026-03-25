/**
 * Core library exports for Catan game logic
 * Provides types, game logic, storage, timers, and rendering utilities
 */

// Types
export type {
  Duration,
  DurationStats,
  GameTurn,
  GameSaveDataTryFromJsonResult,
} from './types/index'

export {
  EventsCubeResult,
  CubesResult,
  GameMode,
  GameSaveData,
} from './types/index'
export type { GameStateTryFromResult } from './types/GameState'
export { GameState } from './types/GameState'

// Game Logic
export { GameLogic } from './GameLogic'

// Storage
export type { GameStorageLoadResult } from './GameStorage'
export { GameStorage, StorageError } from './GameStorage'

// Timer
export { Timer, formatTime, formatTimeDetailed } from './timer'
