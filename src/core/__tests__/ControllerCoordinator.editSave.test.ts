import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  ControllerCoordinator,
  type IController,
} from '../controllers/coordinator/ControllerCoordinator'
import { InProgressController } from '../controllers/concrete/InProgressController'
import { PausedController } from '../controllers/concrete/PausedController'
import { RepairSaveController } from '../controllers/concrete/RepairSaveController'
import { CubesResult, EventsCubeResult, GameSaveData } from '../types'
import { GameStorage } from '../GameStorage'

describe('ControllerCoordinator#editSave', () => {
  let testKey: string
  let storage: GameStorage
  let current: IController
  let replace: (next: IController) => void

  beforeEach(() => {
    testKey = `test-editsave-${Date.now()}-${Math.random()}`
    storage = new GameStorage(testKey)
    replace = vi.fn((next: IController) => {
      current = next
    })
    const coordinator = new ControllerCoordinator(replace, storage)
    const data = new GameSaveData(
      ['Alice'],
      [],
      [
        {
          turnNumber: 1,
          playerIndex: 0,
          cubes: new CubesResult(2, 3),
          eventsCube: EventsCubeResult.GREEN,
          turnDuration: 12,
        },
      ]
    )
    localStorage.setItem(testKey, data.toJsonString(true))
    current = coordinator.createInitialController()
    vi.mocked(replace).mockClear()
  })

  afterEach(() => {
    localStorage.removeItem(testKey)
  })

  it('from pause, editSave mounts RepairSaveController with isStartupRecovery false and save JSON', () => {
    expect(current).toBeInstanceOf(InProgressController)
    ;(current as InProgressController).pause()
    expect(current).toBeInstanceOf(PausedController)

    const expectedRaw = (current as PausedController)
      .getGameState()
      .gameSaveData.toJsonString(true)

    ;(current as PausedController).editSave()

    expect(current).toBeInstanceOf(RepairSaveController)
    const repair = current as RepairSaveController
    expect(repair.isStartupRecovery()).toBe(false)
    expect(repair.getRawSaveText()).toBe(expectedRaw)
  })

  it('RepairSaveController.cancel restores PausedController with same game state snapshot', () => {
    ;(current as InProgressController).pause()
    const pausedBefore = current as PausedController
    const stateBefore = pausedBefore.getGameState()
    const rawBefore = stateBefore.gameSaveData.toJsonString(true)

    pausedBefore.editSave()
    expect(current).toBeInstanceOf(RepairSaveController)
    ;(current as RepairSaveController).cancel()

    expect(current).toBeInstanceOf(PausedController)
    expect((current as PausedController).getGameState()).not.toBe(stateBefore)
    expect(
      (current as PausedController).getGameState().gameSaveData.toJsonString(true)
    ).toBe(rawBefore)
  })
})
