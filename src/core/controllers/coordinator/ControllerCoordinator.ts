import type { CubesResult, GameSaveData } from '../../types'
import { GameState } from '../../types/GameState'
import { GameStorage } from '../../GameStorage'
import {
  InProgressController,
  type InProgressControllerCallbacks,
} from '../concrete/InProgressController'
import {
  PausedController,
  type PausedControllerCallbacks,
} from '../concrete/PausedController'
import {
  type RepairSaveContinuation,
  type RepairSaveControllerCallbacks,
} from '../concrete/RepairSaveController'
import { RepairSaveController } from '../concrete/RepairSaveController'
import { RepairSaveContinuationKind } from '../concrete/RepairSaveController'
import {
  SetupController,
  type SetupControllerCallbacks,
} from '../concrete/SetupController'

/**
 * Owns {@link GameStorage} and wires mutually recursive controller callbacks.
 * Initial load from persistence is {@link ControllerCoordinator.createInitialController}
 * (load → repair vs setup vs {@link GameState.tryFromGameSaveData} → repair vs in-progress).
 */
export class ControllerCoordinator {
  static readonly AppMode = {
    RepairSave: 'RepairSave',
    Setup: 'Setup',
    InProgress: 'InProgress',
    Paused: 'Paused',
  } as const

  private readonly _setupCallbacks: SetupControllerCallbacks
  private readonly _inProgressCallbacks: InProgressControllerCallbacks
  private readonly _pausedCallbacks: PausedControllerCallbacks
  private readonly _repairCallbacks: RepairSaveControllerCallbacks

  private readonly _storage: GameStorage
  private readonly _replaceController: (next: IController) => void

  constructor(
    replaceController: (next: IController) => void,
    storage: GameStorage = new GameStorage()
  ) {
    this._replaceController = replaceController
    this._storage = storage
    this._setupCallbacks = {} as SetupControllerCallbacks
    this._inProgressCallbacks = {} as InProgressControllerCallbacks
    this._pausedCallbacks = {} as PausedControllerCallbacks
    this._repairCallbacks = {} as RepairSaveControllerCallbacks
    this._initializeCallbackMaps()
  }

  /**
   * Load persisted JSON, then return the appropriate controller (invalid / bad state →
   * {@link RepairSaveController} with startup recovery).
   */
  createInitialController(): IController {
    const loaded = this._storage.load()
    if (!loaded.ok) {
      return new RepairSaveController(
        loaded.rawString,
        true,
        this._repairCallbacks
      )
    }

    if (loaded.data.gameTurns.length === 0) {
      return new SetupController(loaded.data, this._setupCallbacks)
    }

    const result = GameState.tryFromGameSaveData(loaded.data)
    if (!result.ok) {
      return new RepairSaveController(
        loaded.rawString,
        true,
        this._repairCallbacks
      )
    }

    return new InProgressController(result.state, this._inProgressCallbacks)
  }

  private _initializeCallbackMaps(): void {
    this._inProgressCallbacks.save = d => this._handleSave(d)
    this._inProgressCallbacks.pause = gameState => this._handlePause(gameState)

    this._setupCallbacks.save = d => this._handleSave(d)
    this._setupCallbacks.editSave = gameSaveData =>
      this._handleEditSave(gameSaveData)
    this._setupCallbacks.startGame = gameSaveData =>
      this._handleStartGame(gameSaveData)

    this._pausedCallbacks.resume = gameState => this._handleResume(gameState)
    this._pausedCallbacks.newGame = gameState => this._handleNewGame(gameState)
    this._pausedCallbacks.nextTurnWithPredeterminedCubes = (gameState, cubes) =>
      this._handleNextTurnWithPredeterminedCubes(gameState, cubes)
    this._pausedCallbacks.editSave = gameSaveData =>
      this._handleEditSave(gameSaveData)

    this._repairCallbacks.repairSaveApplied = (gameState, next) =>
      this._handleRepairSaveApplied(gameState, next)

    this._repairCallbacks.cancelManualEdit = () =>
      this._handleCancelManualEdit()
  }

  private _handleSave(gameSaveData: GameSaveData): void {
    this._storage.save(gameSaveData)
  }

  private _handlePause(gameState: GameState): void {
    this._replaceController(
      new PausedController(gameState, this._pausedCallbacks)
    )
  }

  private _handleStartGame(gameState: GameState): void {
    const inProgressController = new InProgressController(
      gameState,
      this._inProgressCallbacks
    )
    inProgressController.nextTurn()
    this._replaceController(inProgressController)
  }

  private _handleResume(gameState: GameState): void {
    this._replaceController(
      new InProgressController(gameState, this._inProgressCallbacks)
    )
  }

  private _handleNewGame(gameState: GameState): void {
    const saveData = gameState.gameSaveData
    this._storage.save(saveData)
    this._replaceController(new SetupController(saveData, this._setupCallbacks))
  }

  private _handleNextTurnWithPredeterminedCubes(
    gameState: GameState,
    cubes: CubesResult
  ): void {
    const inProgressController = new InProgressController(
      gameState,
      this._inProgressCallbacks
    )
    inProgressController.nextTurnWithPredeterminedCubes(cubes)
    this._replaceController(inProgressController)
  }

  private _handleRepairSaveApplied(
    gameState: GameState,
    next: RepairSaveContinuation
  ): void {
    const save = gameState.gameSaveData
    this._handleSave(save)

    switch (next.kind) {
      case RepairSaveContinuationKind.NewGame:
        this._replaceController(new SetupController(save, this._setupCallbacks))
        return
      case RepairSaveContinuationKind.StartupRepairWithTurns:
        this._replaceController(
          new InProgressController(gameState, this._inProgressCallbacks)
        )
        return
      case RepairSaveContinuationKind.ManualEditWithTurns:
        this._replaceController(
          new PausedController(gameState, this._pausedCallbacks)
        )
        return
      default: {
        const _exhaustive: never = next
        throw new Error(`Unhandled repair continuation: ${_exhaustive}`)
      }
    }
  }

  private _handleEditSave(gameSaveData: GameSaveData): void {
    const raw = gameSaveData.toJsonString(true)
    this._replaceController(
      new RepairSaveController(raw, false, this._repairCallbacks)
    )
  }

  private _handleCancelManualEdit(): void {
    this._replaceController(this.createInitialController())
  }
}

export type AppMode =
  (typeof ControllerCoordinator.AppMode)[keyof typeof ControllerCoordinator.AppMode]

export interface IController {
  appMode(): AppMode
}
