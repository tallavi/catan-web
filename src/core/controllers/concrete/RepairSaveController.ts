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
  /** When {@link RepairSaveController} was opened from pause (`!isStartupRecovery`), restore paused UI without applying edits. */
  cancelManualEdit?: () => void
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
    this._recomputeFromRaw(rawSaveText)
  }

  appMode(): AppMode {
    return ControllerCoordinator.AppMode.RepairSave
  }

  getRawSaveText(): string {
    return this._rawSaveText
  }

  setRawSaveText(text: string): void {
    this._rawSaveText = text
    this._recomputeFromRaw(text)
  }

  /**
   * Parse JSON into {@link GameSaveData}, then {@link GameState.tryFromGameSaveData}.
   * On success calls {@link RepairSaveControllerCallbacks.continueStartup}
   * or {@link RepairSaveControllerCallbacks.applyManualEdit} depending on startup vs manual repair.
   */
  apply(): void {
    const v = this._validateRaw(this._rawSaveText)
    if (!v.ok) {
      this._structuralErrors = v.structural
      this._applyErrors = v.apply
      return
    }
    this._structuralErrors = []
    this._applyErrors = []
    if (this._isStartupRecovery) {
      this._callbacks.continueStartup(v.state)
    } else {
      this._callbacks.applyManualEdit(v.state)
    }
  }

  isStartupRecovery(): boolean {
    return this._isStartupRecovery
  }

  canCancel(): boolean {
    return !this._isStartupRecovery
  }

  /** No-op when {@link canCancel} is false or no `cancelManualEdit` callback was provided. */
  cancel(): void {
    if (!this.canCancel()) return
    this._callbacks.cancelManualEdit?.()
  }

  getStructuralErrors(): string[] {
    return this._structuralErrors
  }

  getApplyErrors(): string[] {
    return this._applyErrors
  }

  private _recomputeFromRaw(text: string): void {
    const v = this._validateRaw(text)
    if (!v.ok) {
      this._structuralErrors = v.structural
      this._applyErrors = v.apply
    } else {
      this._structuralErrors = []
      this._applyErrors = []
    }
  }

  private _validateRaw(
    text: string
  ):
    | { ok: true; state: GameState }
    | { ok: false; structural: string[]; apply: string[] } {
    const parsed = GameSaveData.tryFromJsonString(text)
    if (!parsed.ok) {
      return { ok: false, structural: parsed.errors, apply: [] }
    }
    const stateResult = GameState.tryFromGameSaveData(parsed.data)
    if (!stateResult.ok) {
      return { ok: false, structural: [], apply: stateResult.errors }
    }
    return { ok: true, state: stateResult.state }
  }
}
