export const AppMode = {
  RepairSave: 'RepairSave',
  Setup: 'Setup',
  InProgress: 'InProgress',
  Paused: 'Paused',
} as const

export type AppMode = (typeof AppMode)[keyof typeof AppMode]

export interface IController {
  appMode(): AppMode
}
