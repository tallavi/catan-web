import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  ControllerCoordinator,
  type IController,
} from '../controllers/coordinator/ControllerCoordinator'
import { InProgressController } from '../controllers/concrete/InProgressController'
import { PausedController } from '../controllers/concrete/PausedController'
import { RepairSaveController } from '../controllers/concrete/RepairSaveController'
import { SetupController } from '../controllers/concrete/SetupController'
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

  it('from pause, editSave mounts RepairSaveController with canCancel false and save JSON', () => {
    expect(current).toBeInstanceOf(InProgressController)
    ;(current as InProgressController).pause()
    expect(current).toBeInstanceOf(PausedController)

    const expectedRaw = (current as PausedController)
      .getGameState()
      .gameSaveData.toJsonString(true)

    ;(current as PausedController).editSave()

    expect(current).toBeInstanceOf(RepairSaveController)
    const repair = current as RepairSaveController
    expect(repair.canCancel()).toBe(false)
    expect(repair.getRawSaveText()).toBe(expectedRaw)
  })

  it('cancel is a no-op when editSave came from pause (canCancel false)', () => {
    ;(current as InProgressController).pause()
    const pausedBefore = current as PausedController

    pausedBefore.editSave()
    expect(current).toBeInstanceOf(RepairSaveController)
    ;(current as RepairSaveController).cancel()
    expect(current).toBeInstanceOf(RepairSaveController)
  })

  it('from setup, apply routes to InProgress when edited save has turns', () => {
    const setupData = new GameSaveData(['Alice'], [], [])
    storage.save(setupData)
    const coordinator = new ControllerCoordinator(replace, storage)
    current = coordinator.createInitialController()
    expect(current).toBeInstanceOf(SetupController)

    ;(current as SetupController).editSave()
    expect(current).toBeInstanceOf(RepairSaveController)

    const withTurns = new GameSaveData(
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
    const repair = current as RepairSaveController
    repair.setRawSaveText(withTurns.toJsonString(true))
    repair.apply()

    expect(current).toBeInstanceOf(InProgressController)
  })

  it('from pause, apply routes to Setup when edited save has no turns', () => {
    ;(current as InProgressController).pause()
    expect(current).toBeInstanceOf(PausedController)
    ;(current as PausedController).editSave()
    expect(current).toBeInstanceOf(RepairSaveController)

    const repair = current as RepairSaveController
    repair.setRawSaveText(new GameSaveData(['Alice'], [], []).toJsonString(true))
    repair.apply()

    expect(current).toBeInstanceOf(SetupController)
  })
})
