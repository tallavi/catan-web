import { GameSaveData } from '../../types'
import { GameState } from '../../types/GameState'
import {
  ControllerCoordinator,
  type AppMode,
  type IController,
} from '../coordinator/ControllerCoordinator'

/** Callbacks for {@link RepairSaveController} after a successful {@link RepairSaveController.apply}. */
export interface RepairSaveControllerCallbacks {
  /** App should transition from startup repair using the rebuilt {@link GameState} (e.g. setup or in-progress). */
  continueStartup: (gameState: GameState) => void
  /** App should apply the repaired save from a manual edit (e.g. return to paused/in-progress). */
  applyManualEdit: (gameState: GameState) => void
}

export class RepairSaveController implements IController {
  private readonly _isStartupRecovery: boolean
  private readonly _callbacks: RepairSaveControllerCallbacks
  private _rawSaveText: string
  private _structuralErrors: string[] = []
  private _applyErrors: string[] = []

  constructor(
    rawSaveText: string,
    isStartupRecovery: boolean,
    callbacks: RepairSaveControllerCallbacks
  ) {
    this._rawSaveText = rawSaveText
    this._isStartupRecovery = isStartupRecovery
    this._callbacks = callbacks
    this._recomputeStructuralFromRaw(rawSaveText)
  }

  appMode(): AppMode {
    return ControllerCoordinator.AppMode.RepairSave
  }

  getRawSaveText(): string {
    return this._rawSaveText
  }

  setRawSaveText(text: string): void {
    this._rawSaveText = text
    this._recomputeStructuralFromRaw(text)
  }

  /**
   * Parse JSON into {@link GameSaveData}, then {@link GameState.tryFromGameSaveData}.
   * Updates error lists; on success calls {@link RepairSaveControllerCallbacks.continueStartup}
   * or {@link RepairSaveControllerCallbacks.applyManualEdit} depending on startup vs manual repair.
   */
  apply(): void {
    const parsed = GameSaveData.tryFromJsonString(this._rawSaveText)
    if (!parsed.ok) {
      this._structuralErrors = parsed.errors
      this._applyErrors = []
      return
    }

    const stateResult = GameState.tryFromGameSaveData(parsed.data)
    if (!stateResult.ok) {
      this._structuralErrors = []
      this._applyErrors = stateResult.errors
      return
    }

    this._structuralErrors = []
    this._applyErrors = []

    if (this._isStartupRecovery) {
      this._callbacks.continueStartup(stateResult.state)
    } else {
      this._callbacks.applyManualEdit(stateResult.state)
    }
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

  getApplyErrors(): string[] {
    return this._applyErrors
  }

  private _recomputeStructuralFromRaw(text: string): void {
    const parsed = GameSaveData.tryFromJsonString(text)
    this._structuralErrors = parsed.ok ? [] : parsed.errors
    this._applyErrors = []
  }
}
