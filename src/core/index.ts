/**
 * Core library exports for Catan game logic
 * Provides types, game logic, storage, timers, and rendering utilities
 */

// Types
export type {
  Duration,
  DurationStats,
  GameTurn,
  GameSaveData,
} from './types/index'

export { EventsCubeResult, CubesResult, GameMode } from './types/index'
export { GameState } from './types/game-state'

// Game Logic
export { GameLogic } from './game-logic'

// Storage
export { GameStorage, StorageError } from './storage'

// Timer
export { Timer, formatTime, formatTimeDetailed } from './timer'

// Renderer
export type { ColorType, TextPart } from './renderer'
export { TextRenderer, ColorTags, formatEventsCube } from './renderer'
