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

describe('ControllerCoordinator#createInitialController', () => {
  let testKey: string
  let storage: GameStorage

  beforeEach(() => {
    testKey = `test-bootstrap-${Date.now()}-${Math.random()}`
    storage = new GameStorage(testKey)
  })

  afterEach(() => {
    localStorage.removeItem(testKey)
  })

  function createInitial(storageInstance: GameStorage) {
    return new ControllerCoordinator(
      vi.fn(),
      storageInstance
    ).createInitialController()
  }

  function innerCreateInitial(
    storageInstance: GameStorage,
    isPaused: boolean
  ): IController {
    const coordinator = new ControllerCoordinator(vi.fn(), storageInstance)
    return (
      coordinator as unknown as {
        _innerCreateInitialController(p: boolean): IController
      }
    )._innerCreateInitialController(isPaused)
  }

  it('returns SetupController when storage is empty (bootstrap default)', () => {
    const c = createInitial(storage)
    expect(c).toBeInstanceOf(SetupController)
    expect(c.appMode()).toBe(ControllerCoordinator.AppMode.Setup)
    expect((c as SetupController).getGameSaveData().gameTurns).toEqual([])
  })

  it('returns RepairSaveController when JSON is invalid', () => {
    localStorage.setItem(testKey, 'not json {')
    const c = createInitial(storage)
    expect(c).toBeInstanceOf(RepairSaveController)
    expect(c.appMode()).toBe(ControllerCoordinator.AppMode.RepairSave)
    expect((c as RepairSaveController).getRawSaveText()).toBe('not json {')
    expect((c as RepairSaveController).canCancel()).toBe(true)
  })

  it('returns RepairSaveController when save fails structural schema', () => {
    localStorage.setItem(testKey, JSON.stringify({ foo: 1 }))
    const c = createInitial(storage)
    expect(c).toBeInstanceOf(RepairSaveController)
    expect(c.appMode()).toBe(ControllerCoordinator.AppMode.RepairSave)
  })

  it('returns SetupController when valid save has no turns', () => {
    const data = new GameSaveData(['Alice', 'Bob'], [7], [])
    localStorage.setItem(testKey, data.toJsonString(true))
    const c = createInitial(storage)
    expect(c).toBeInstanceOf(SetupController)
    expect(c.appMode()).toBe(ControllerCoordinator.AppMode.Setup)
    expect((c as SetupController).getGameSaveData().players).toEqual([
      'Alice',
      'Bob',
    ])
  })

  it('returns InProgressController when valid save has turns and state replays', () => {
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
    const c = createInitial(storage)
    expect(c).toBeInstanceOf(InProgressController)
    expect(c.appMode()).toBe(ControllerCoordinator.AppMode.InProgress)
    const ip = c as InProgressController
    expect(ip.getTurnTimerSeconds()).toBeCloseTo(12, 1)
    expect(ip.getGameTimerSeconds()).toBeCloseTo(12, 1)
    expect(ip.getGameState().gameSaveData.gameTurns).toHaveLength(1)
  })

  it('returns PausedController when valid save has turns and caller requests paused flow', () => {
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
    const c = innerCreateInitial(storage, true)
    expect(c).toBeInstanceOf(PausedController)
    expect(c.appMode()).toBe(ControllerCoordinator.AppMode.Paused)
  })

  it('returns RepairSaveController when structural parse ok but GameState rejects', () => {
    const data = new GameSaveData(
      ['Alice'],
      [],
      [
        {
          turnNumber: 2,
          playerIndex: 0,
          cubes: new CubesResult(2, 3),
          eventsCube: EventsCubeResult.GREEN,
          turnDuration: 0,
        },
      ]
    )
    const raw = data.toJsonString(true)
    localStorage.setItem(testKey, raw)
    const c = createInitial(storage)
    expect(c).toBeInstanceOf(RepairSaveController)
    expect(c.appMode()).toBe(ControllerCoordinator.AppMode.RepairSave)
    expect((c as RepairSaveController).getRawSaveText()).toBe(raw)
  })
})
