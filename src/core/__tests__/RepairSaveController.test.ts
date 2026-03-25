import { describe, it, expect, vi } from 'vitest'
import {
  RepairSaveController,
  type RepairSaveControllerCallbacks,
} from '../controllers/concrete/RepairSaveController'
import { CubesResult, EventsCubeResult, GameSaveData } from '../types'

function repairCallbacks(): RepairSaveControllerCallbacks {
  return {
    continueStartup: vi.fn(),
    applyManualEdit: vi.fn(),
  }
}

describe('RepairSaveController', () => {
  it('runs structural validation in constructor', () => {
    const c = new RepairSaveController('not json {', true, repairCallbacks())
    expect(c.getStructuralErrors().length).toBeGreaterThan(0)
    expect(c.getApplyErrors()).toEqual([])
  })

  it('setRawSaveText updates structural errors and clears apply errors', () => {
    const valid = new GameSaveData(['A'], [], [])
    const goodText = valid.toJsonString(true)
    const c = new RepairSaveController(goodText, true, repairCallbacks())

    c.apply()
    expect(c.getApplyErrors()).toEqual([])

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
    expect(c.getStructuralErrors()).toEqual([])
    expect(c.getApplyErrors()).toEqual([])

    c.apply()
    expect(c.getApplyErrors().length).toBeGreaterThan(0)

    c.setRawSaveText('{')
    expect(c.getStructuralErrors().length).toBeGreaterThan(0)
    expect(c.getApplyErrors()).toEqual([])
  })

  it('apply leaves structural errors only when JSON parse fails', () => {
    const c = new RepairSaveController('{}', true, repairCallbacks())
    c.setRawSaveText('not json')
    c.apply()
    expect(c.getStructuralErrors().length).toBeGreaterThan(0)
    expect(c.getApplyErrors()).toEqual([])
  })

  it('apply sets apply errors when structure ok but replay fails', () => {
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
    const c = new RepairSaveController(
      badTurn.toJsonString(true),
      true,
      repairCallbacks()
    )
    c.apply()
    expect(c.getStructuralErrors()).toEqual([])
    expect(c.getApplyErrors().length).toBeGreaterThan(0)
  })

  it('apply on success calls continueStartup when isStartupRecovery', () => {
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
    expect(callbacks.continueStartup).toHaveBeenCalledTimes(1)
    expect(callbacks.applyManualEdit).not.toHaveBeenCalled()
    expect(c.getStructuralErrors()).toEqual([])
    expect(c.getApplyErrors()).toEqual([])
  })

  it('apply on success calls applyManualEdit when not startup recovery', () => {
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
    const c = new RepairSaveController(data.toJsonString(true), false, callbacks)
    c.apply()
    expect(callbacks.applyManualEdit).toHaveBeenCalledTimes(1)
    expect(callbacks.continueStartup).not.toHaveBeenCalled()
  })
})
