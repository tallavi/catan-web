import type { CubesResult, GameSaveData } from '../types'
import { GameState } from '../types/GameState'
import { GameStorage } from '../GameStorage'
import type { IController } from './IController'
import {
  InProgressController,
  type InProgressControllerCallbacks,
} from './InProgressController'
import {
  PausedController,
  type PausedControllerCallbacks,
} from './PausedController'
import type { RepairSaveControllerCallbacks } from './RepairSaveController'
import { RepairSaveController } from './RepairSaveController'
import {
  SetupController,
  type SetupControllerCallbacks,
} from './SetupController'

/**
 * Owns {@link GameStorage} and wires mutually recursive controller callbacks.
 * Initial load from persistence is {@link ControllerCoordinator.createInitialController}
 * (load → repair vs setup vs {@link GameState.tryFromGameSaveData} → repair vs in-progress).
 */
export class ControllerCoordinator {
  private readonly _setupCallbacks: SetupControllerCallbacks
  private readonly _inProgressCallbacks: InProgressControllerCallbacks
  private readonly _pausedCallbacks: PausedControllerCallbacks
  private readonly _repairCallbacks: RepairSaveControllerCallbacks

  private readonly _storage: GameStorage
  private readonly _replaceController: (next: IController) => void

  constructor(replaceController: (next: IController) => void) {
    this._replaceController = replaceController
    this._storage = new GameStorage()
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
    this._setupCallbacks.startGame = gameSaveData =>
      this._handleStartGame(gameSaveData)

    this._pausedCallbacks.resume = gameState => this._handleResume(gameState)
    this._pausedCallbacks.newGame = gameState => this._handleNewGame(gameState)
    this._pausedCallbacks.nextTurnWithPredeterminedCubes = (gameState, cubes) =>
      this._handleNextTurnWithPredeterminedCubes(gameState, cubes)

    this._repairCallbacks.continueStartup = gameState =>
      this._handleContinueStartup(gameState)
    this._repairCallbacks.applyManualEdit = gameState =>
      this._handleApplyManualEdit(gameState)
  }

  private _handleSave(gameSaveData: GameSaveData): void {
    this._storage.save(gameSaveData)
  }

  private _handlePause(gameState: GameState): void {
    this._replaceController(
      new PausedController(gameState, this._pausedCallbacks)
    )
  }

  private _handleStartGame(gameSaveData: GameSaveData): void {
    this._storage.clear()
    const data = gameSaveData.asNewGame()
    const result = GameState.tryFromGameSaveData(data)
    if (!result.ok) {
      throw new Error(result.errors[0])
    }
    const ipc = new InProgressController(
      result.state,
      this._inProgressCallbacks
    )
    ipc.nextTurn()
    this._replaceController(ipc)
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
    const ipc = new InProgressController(gameState, this._inProgressCallbacks)
    ipc.nextTurnWithPredeterminedCubes(cubes)
    this._replaceController(ipc)
  }

  private _handleContinueStartup(gameState: GameState): void {
    const save = gameState.gameSaveData
    if (!save) {
      throw new Error('Repair continueStartup: missing gameSaveData')
    }
    this._storage.save(save)
    if (save.gameTurns.length === 0) {
      this._replaceController(new SetupController(save, this._setupCallbacks))
    } else {
      this._replaceController(
        new InProgressController(gameState, this._inProgressCallbacks)
      )
    }
  }

  private _handleApplyManualEdit(gameState: GameState): void {
    this._replaceController(
      new PausedController(gameState, this._pausedCallbacks)
    )
  }
}
