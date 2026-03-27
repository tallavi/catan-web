import { GameSaveData } from '../../types'
import { GameState } from '../../types/GameState'
import {
  ControllerCoordinator,
  type AppMode,
  type IController,
} from '../coordinator/ControllerCoordinator'

/** Callbacks for {@link RepairSaveController} after a successful {@link RepairSaveController.apply}. */
export interface RepairSaveControllerCallbacks {
  repairSaveApply: (gameState: GameState, isPaused: boolean) => void
  repairSaveCancel?: (isPaused: boolean) => void
}

export class RepairSaveController implements IController {
  private readonly _canCancel: boolean
  private readonly _isPaused: boolean
  private readonly _callbacks: RepairSaveControllerCallbacks
  private _rawSaveText: string
  private _errors: string[] = []

  constructor(
    rawSaveText: string,
    canCancel: boolean,
    isPaused: boolean,
    callbacks: RepairSaveControllerCallbacks
  ) {
    this._rawSaveText = rawSaveText
    this._canCancel = canCancel
    this._isPaused = isPaused
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

  /** Parse JSON into {@link GameSaveData}, then {@link GameState.tryFromGameSaveData}. */
  apply(): void {
    const v = this._validateRaw(this._rawSaveText)
    if (!v.ok) {
      this._errors = v.errors
      return
    }
    this._errors = []
    this._callbacks.repairSaveApply(v.state, this._isPaused)
  }

  canCancel(): boolean {
    return this._canCancel
  }

  /** No-op when {@link canCancel} is false or no `cancel` callback was provided. */
  cancel(): void {
    if (!this.canCancel())
      throw new Error('Cannot cancel when cancel is disabled')
    this._callbacks.repairSaveCancel?.(this._isPaused)
  }

  /** Only available when cancel is disabled; applies default save state. */
  clear(): void {
    if (this._canCancel) throw new Error('Cannot clear when cancel is enabled')

    const data = GameSaveData.createDefault()
    const state = GameState.tryFromGameSaveData(data)
    if (!state.ok) {
      throw new Error(state.errors[0])
    }
    this._callbacks.repairSaveApply(state.state, this._isPaused)
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
