import { AppMode } from './IController'
import type { ControllerTransitionState, IController } from './IController'

export class RepairSaveController implements IController {
  private readonly _isStartupRecovery: boolean
  private _rawSaveText: string
  private _structuralErrors: string[] = []
  private _applyErrors: string[] = []

  constructor(rawSaveText: string, isStartupRecovery: boolean) {
    this._rawSaveText = rawSaveText
    this._isStartupRecovery = isStartupRecovery
  }

  appMode(): AppMode {
    return AppMode.RepairSave
  }

  getRawSaveText(): string {
    return this._rawSaveText
  }

  setRawSaveText(text: string): void {
    this._rawSaveText = text
  }

  isStartupRecovery(): boolean {
    return this._isStartupRecovery
  }

  canCancel(): boolean {
    return !this._isStartupRecovery
  }

  getStructuralErrors(): string[] {
    return this._structuralErrors
  }

  setStructuralErrors(errors: string[]): void {
    this._structuralErrors = errors
  }

  clearStructuralErrors(): void {
    this._structuralErrors = []
  }

  getApplyErrors(): string[] {
    return this._applyErrors
  }

  setApplyErrors(errors: string[]): void {
    this._applyErrors = errors
  }

  clearApplyErrors(): void {
    this._applyErrors = []
  }

  toTransitionState(): ControllerTransitionState {
    return {
      mode: AppMode.RepairSave,
      rawSaveText: this._rawSaveText,
      isStartupRecovery: this._isStartupRecovery,
    }
  }
}
