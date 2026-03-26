import { describe, it, expect, vi } from 'vitest'
import {
  RepairSaveController,
  RepairSaveContinuationKind,
  type RepairSaveControllerCallbacks,
} from '../controllers/concrete/RepairSaveController'
import { CubesResult, EventsCubeResult, GameSaveData } from '../types'

function repairCallbacks(): RepairSaveControllerCallbacks {
  return {
    repairSaveApplied: vi.fn(),
  }
}

describe('RepairSaveController', () => {
  it('runs structural validation in constructor', () => {
    const c = new RepairSaveController('not json {', true, repairCallbacks())
    expect(c.getErrors().length).toBeGreaterThan(0)
  })

  it('setRawSaveText updates structural errors and live apply (replay) errors', () => {
    const valid = new GameSaveData(['A'], [], [])
    const goodText = valid.toJsonString(true)
    const callbacks = repairCallbacks()
    const c = new RepairSaveController(goodText, true, callbacks)

    c.apply()
    expect(c.getErrors()).toEqual([])
    expect(callbacks.repairSaveApplied).toHaveBeenCalledTimes(1)
    expect(callbacks.repairSaveApplied).toHaveBeenCalledWith(
      expect.anything(),
      { kind: RepairSaveContinuationKind.NewGame }
    )

    const badTurn = new GameSaveData(
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
    const badReplayText = badTurn.toJsonString(true)
    c.setRawSaveText(badReplayText)
    expect(c.getErrors().length).toBeGreaterThan(0)

    c.apply()
    expect(c.getErrors().length).toBeGreaterThan(0)
    expect(callbacks.repairSaveApplied).toHaveBeenCalledTimes(1)

    c.setRawSaveText('{')
    expect(c.getErrors().length).toBeGreaterThan(0)
  })

  it('apply leaves structural errors only when JSON parse fails', () => {
    const c = new RepairSaveController('{}', true, repairCallbacks())
    c.setRawSaveText('not json')
    c.apply()
    expect(c.getErrors().length).toBeGreaterThan(0)
  })

  it('live validation sets apply errors when structure ok but replay fails', () => {
    const badTurn = new GameSaveData(
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
    const callbacks = repairCallbacks()
    const c = new RepairSaveController(
      badTurn.toJsonString(true),
      true,
      callbacks
    )
    expect(c.getErrors().length).toBeGreaterThan(0)

    c.apply()
    expect(c.getErrors().length).toBeGreaterThan(0)
    expect(callbacks.repairSaveApplied).not.toHaveBeenCalled()
  })

  it('live validation sets errors when structure ok but setup is invalid', () => {
    const data = new GameSaveData(['Alice'], [13], [])
    const callbacks = repairCallbacks()
    const c = new RepairSaveController(data.toJsonString(true), true, callbacks)
    expect(c.getErrors().length).toBeGreaterThan(0)

    c.apply()
    expect(c.getErrors().length).toBeGreaterThan(0)
    expect(callbacks.repairSaveApplied).not.toHaveBeenCalled()
  })

  it('apply on success calls repairSaveApplied with InProgressFromStartupRepair when isStartupRecovery', () => {
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
    const callbacks = repairCallbacks()
    const c = new RepairSaveController(data.toJsonString(true), true, callbacks)
    c.apply()
    expect(callbacks.repairSaveApplied).toHaveBeenCalledTimes(1)
    expect(callbacks.repairSaveApplied).toHaveBeenCalledWith(
      expect.anything(),
      { kind: RepairSaveContinuationKind.StartupRepairWithTurns }
    )
    expect(c.getErrors()).toEqual([])
  })

  it('apply on success calls repairSaveApplied with PausedFromManualEdit when not startup recovery', () => {
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
    const callbacks = repairCallbacks()
    const c = new RepairSaveController(
      data.toJsonString(true),
      false,
      callbacks
    )
    c.apply()
    expect(callbacks.repairSaveApplied).toHaveBeenCalledTimes(1)
    expect(callbacks.repairSaveApplied).toHaveBeenCalledWith(
      expect.anything(),
      { kind: RepairSaveContinuationKind.ManualEditWithTurns }
    )
  })
})
