import { GameSaveData } from '../../types'
import { GameState } from '../../types/GameState'
import {
  ControllerCoordinator,
  type AppMode,
  type IController,
} from '../coordinator/ControllerCoordinator'

/** Callbacks for {@link RepairSaveController} after a successful {@link RepairSaveController.apply}. */
export interface RepairSaveControllerCallbacks {
  repairSaveApplied: (
    gameState: GameState,
    next: RepairSaveContinuation
  ) => void
  /** When {@link RepairSaveController} was opened from pause (`!isStartupRecovery`), restore paused UI without applying edits. */
  cancelManualEdit?: () => void
}

export class RepairSaveContinuationKind {
  static readonly NewGame = 'SetupFromStartupRepair' as const
  static readonly StartupRepairWithTurns =
    'InProgressFromStartupRepair' as const
  static readonly ManualEditWithTurns = 'PausedFromManualEdit' as const
}

export type RepairSaveContinuation =
  | { kind: typeof RepairSaveContinuationKind.NewGame }
  | { kind: typeof RepairSaveContinuationKind.StartupRepairWithTurns }
  | { kind: typeof RepairSaveContinuationKind.ManualEditWithTurns }

export class RepairSaveController implements IController {
  private readonly _isStartupRecovery: boolean
  private readonly _callbacks: RepairSaveControllerCallbacks
  private _rawSaveText: string
  private _errors: string[] = []

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
   * On success calls {@link RepairSaveControllerCallbacks.repairSaveApplied} with a typed continuation
   * describing where the app should go next.
   */
  apply(): void {
    const v = this._validateRaw(this._rawSaveText)
    if (!v.ok) {
      this._errors = v.errors
      return
    }
    this._errors = []
    const save = v.state.gameSaveData
    if (!save) {
      throw new Error('Repair apply: missing gameSaveData')
    }

    let next: RepairSaveContinuation

    if (save.gameTurns.length === 0) {
      next = { kind: RepairSaveContinuationKind.NewGame }
    } else if (this._isStartupRecovery) {
      next = { kind: RepairSaveContinuationKind.StartupRepairWithTurns }
    } else {
      next = { kind: RepairSaveContinuationKind.ManualEditWithTurns }
    }

    this._callbacks.repairSaveApplied(v.state, next)
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

  /** In startup recovery only, clears to a default save and exits to setup. */
  clear(): void {
    if (!this._isStartupRecovery) return
    const data = GameSaveData.createDefault()
    const state = GameState.tryFromGameSaveData(data)
    if (!state.ok) {
      throw new Error(state.errors[0])
    }
    this._callbacks.repairSaveApplied(state.state, {
      kind: RepairSaveContinuationKind.NewGame,
    })
  }

  getErrors(): string[] {
    return this._errors
  }

  private _recomputeFromRaw(text: string): void {
    const v = this._validateRaw(text)
    if (!v.ok) {
      this._errors = v.errors
    } else {
      this._errors = []
    }
  }

  private _validateRaw(
    text: string
  ): { ok: true; state: GameState } | { ok: false; errors: string[] } {
    const parsed = GameSaveData.tryFromJsonString(text)
    if (!parsed.ok) {
      return { ok: false, errors: parsed.errors }
    }
    const stateResult = GameState.tryFromGameSaveData(parsed.data)
    if (!stateResult.ok) {
      return { ok: false, errors: stateResult.errors }
    }
    return { ok: true, state: stateResult.state }
  }
}
