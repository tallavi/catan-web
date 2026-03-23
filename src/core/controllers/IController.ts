import type { GameSaveData } from '../types'
import type { GameState } from '../types/game-state'

export const AppMode = {
  RepairSave: 'RepairSave',
  Setup: 'Setup',
  InProgress: 'InProgress',
  Paused: 'Paused',
} as const

export type AppMode = (typeof AppMode)[keyof typeof AppMode]

export interface RepairSaveTransitionState {
  mode: typeof AppMode.RepairSave
  rawSaveText: string
  isStartupRecovery: boolean
}

export interface SetupTransitionState {
  mode: typeof AppMode.Setup
  gameSaveData: GameSaveData
}

export interface InProgressTransitionState {
  mode: typeof AppMode.InProgress
  gameState: GameState
  turnTimerSeconds: number
  gameTimerSeconds: number
}

export interface PausedTransitionState {
  mode: typeof AppMode.Paused
  gameState: GameState
}

export type ControllerTransitionState =
  | RepairSaveTransitionState
  | SetupTransitionState
  | InProgressTransitionState
  | PausedTransitionState

export interface IController {
  appMode(): AppMode
  toTransitionState(): ControllerTransitionState
}
