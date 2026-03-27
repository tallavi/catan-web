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
import { type RepairSaveControllerCallbacks } from '../concrete/RepairSaveController'
import { RepairSaveController } from '../concrete/RepairSaveController'
import {
  SetupController,
  type SetupControllerCallbacks,
} from '../concrete/SetupController'

/**
 * Owns {@link GameStorage} and wires mutually recursive controller callbacks.
 * Initial load from persistence is {@link ControllerCoordinator.createInitialController}
 * (delegates to {@link ControllerCoordinator._innerCreateInitialController} with `isPaused: false`).
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
   * Load persisted JSON for app bootstrap. Always uses `isPaused: false` (in-progress vs paused
   * after cancel is handled via {@link ControllerCoordinator._innerCreateInitialController}).
   */
  createInitialController(): IController {
    return this._innerCreateInitialController(false)
  }

  /**
   * Shared bootstrap from storage. `isPaused` affects repair controller wiring and whether a
   * valid save with turns becomes {@link PausedController} vs {@link InProgressController}.
   */
  private _innerCreateInitialController(isPaused: boolean): IController {
    const loaded = this._storage.load()
    if (!loaded.ok) {
      return new RepairSaveController(
        loaded.rawString,
        false,
        isPaused,
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
        false,
        isPaused,
        this._repairCallbacks
      )
    }

    if (isPaused) {
      return new PausedController(result.state, this._pausedCallbacks)
    }

    return new InProgressController(result.state, this._inProgressCallbacks)
  }

  private _initializeCallbackMaps(): void {
    this._inProgressCallbacks.save = d => this._handleSave(d)
    this._inProgressCallbacks.pause = gameState => this._handlePause(gameState)

    this._setupCallbacks.save = d => this._handleSave(d)
    this._setupCallbacks.editSave = gameSaveData =>
      this._handleEditSave(gameSaveData, false)
    this._setupCallbacks.startGame = gameSaveData =>
      this._handleStartGame(gameSaveData)

    this._pausedCallbacks.resume = gameState => this._handleResume(gameState)
    this._pausedCallbacks.newGame = gameState => this._handleNewGame(gameState)
    this._pausedCallbacks.nextTurnWithPredeterminedCubes = (gameState, cubes) =>
      this._handleNextTurnWithPredeterminedCubes(gameState, cubes)
    this._pausedCallbacks.editSave = gameSaveData =>
      this._handleEditSave(gameSaveData, true)

    this._repairCallbacks.repairSaveApply = (gameState, isPaused) =>
      this._handleRepairSaveApply(gameState, isPaused)

    this._repairCallbacks.repairSaveCancel = isPaused =>
      this._handleRepairSaveCancel(isPaused)
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

  private _handleRepairSaveApply(
    gameState: GameState,
    isPaused: boolean
  ): void {
    const save = gameState.gameSaveData
    this._handleSave(save)

    if (save.gameTurns.length === 0) {
      this._replaceController(new SetupController(save, this._setupCallbacks))
      return
    }

    if (isPaused) {
      this._replaceController(
        new PausedController(gameState, this._pausedCallbacks)
      )
      return
    }

    this._replaceController(
      new InProgressController(gameState, this._inProgressCallbacks)
    )
  }

  private _handleEditSave(gameSaveData: GameSaveData, isPaused: boolean): void {
    const raw = gameSaveData.toJsonString(true)
    this._replaceController(
      new RepairSaveController(raw, true, isPaused, this._repairCallbacks)
    )
  }

  private _handleRepairSaveCancel(isPaused: boolean): void {
    this._replaceController(this._innerCreateInitialController(isPaused))
  }
}

export type AppMode =
  (typeof ControllerCoordinator.AppMode)[keyof typeof ControllerCoordinator.AppMode]

export interface IController {
  appMode(): AppMode
}
