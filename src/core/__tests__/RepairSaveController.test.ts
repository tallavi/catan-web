import { describe, it, expect, vi } from 'vitest'
import {
  RepairSaveController,
  type RepairSaveControllerCallbacks,
} from '../controllers/concrete/RepairSaveController'
import { CubesResult, EventsCubeResult, GameSaveData } from '../types'

function repairCallbacks(): RepairSaveControllerCallbacks {
  return {
    repairSaveApply: vi.fn(),
    repairSaveCancel: vi.fn(),
  }
}

describe('RepairSaveController', () => {
  it('runs structural validation in constructor', () => {
    const c = new RepairSaveController(
      'not json {',
      true,
      false,
      repairCallbacks()
    )
    expect(c.getErrors().length).toBeGreaterThan(0)
  })

  it('setRawSaveText updates structural errors and live apply (replay) errors', () => {
    const valid = new GameSaveData(['A'], [], [])
    const goodText = valid.toJsonString(true)
    const callbacks = repairCallbacks()
    const c = new RepairSaveController(goodText, true, false, callbacks)

    c.apply()
    expect(c.getErrors()).toEqual([])
    expect(callbacks.repairSaveApply).toHaveBeenCalledTimes(1)
    expect(callbacks.repairSaveApply).toHaveBeenCalledWith(
      expect.anything(),
      false
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
    expect(callbacks.repairSaveApply).toHaveBeenCalledTimes(1)

    c.setRawSaveText('{')
    expect(c.getErrors().length).toBeGreaterThan(0)
  })

  it('apply leaves structural errors only when JSON parse fails', () => {
    const c = new RepairSaveController('{}', true, false, repairCallbacks())
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
      false,
      callbacks
    )
    expect(c.getErrors().length).toBeGreaterThan(0)

    c.apply()
    expect(c.getErrors().length).toBeGreaterThan(0)
    expect(callbacks.repairSaveApply).not.toHaveBeenCalled()
  })

  it('live validation sets errors when structure ok but setup is invalid', () => {
    const data = new GameSaveData(['Alice'], [13], [])
    const callbacks = repairCallbacks()
    const c = new RepairSaveController(
      data.toJsonString(true),
      true,
      false,
      callbacks
    )
    expect(c.getErrors().length).toBeGreaterThan(0)

    c.apply()
    expect(c.getErrors().length).toBeGreaterThan(0)
    expect(callbacks.repairSaveApply).not.toHaveBeenCalled()
  })

  it('apply on success forwards isPaused false', () => {
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
      true,
      false,
      callbacks
    )
    c.apply()
    expect(callbacks.repairSaveApply).toHaveBeenCalledTimes(1)
    expect(callbacks.repairSaveApply).toHaveBeenCalledWith(
      expect.anything(),
      false
    )
    expect(c.getErrors()).toEqual([])
  })

  it('apply on success forwards isPaused true', () => {
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
      true,
      callbacks
    )
    c.apply()
    expect(callbacks.repairSaveApply).toHaveBeenCalledTimes(1)
    expect(callbacks.repairSaveApply).toHaveBeenCalledWith(
      expect.anything(),
      true
    )
  })

  it('clear throws when cancel is enabled', () => {
    const data = new GameSaveData(['Alice'], [], [])
    const callbacks = repairCallbacks()
    const c = new RepairSaveController(
      data.toJsonString(true),
      true,
      false,
      callbacks
    )
    expect(() => c.clear()).toThrow('Cannot clear when cancel is enabled')
    expect(callbacks.repairSaveApply).not.toHaveBeenCalled()
  })

  it('clear when cancel is disabled applies default game state', () => {
    const data = new GameSaveData(['Alice'], [], [])
    const callbacks = repairCallbacks()
    const c = new RepairSaveController(
      data.toJsonString(true),
      false,
      true,
      callbacks
    )
    c.clear()
    expect(callbacks.repairSaveApply).toHaveBeenCalledTimes(1)
    const [gameState, isPaused] = vi.mocked(callbacks.repairSaveApply).mock
      .calls[0]
    expect(isPaused).toBe(true)
    expect(gameState.gameSaveData.toJsonString(true)).toBe(
      GameSaveData.createDefault().toJsonString(true)
    )
  })

  it('cancel forwards isPaused when cancel is enabled', () => {
    const callbacks = repairCallbacks()
    const c = new RepairSaveController('{}', true, true, callbacks)
    c.cancel()
    expect(callbacks.repairSaveCancel).toHaveBeenCalledWith(true)
  })
})
