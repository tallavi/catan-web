import { describe, it, expect } from 'vitest'
import { GameState } from '../types/game-state'
import type { GameSaveData } from '../types'
import { CubesResult, EventsCubeResult } from '../types'

describe('GameState.tryFromGameSaveData', () => {
  const minimalValidSave = (): GameSaveData => ({
    players: ['Alice'],
    blockedResults: [],
    gameTurns: [
      {
        turnNumber: 1,
        playerIndex: 0,
        cubes: new CubesResult(2, 3),
        eventsCube: EventsCubeResult.GREEN,
        turnDuration: 5,
      },
    ],
  })

  it('returns ok with a GameState for valid save data', () => {
    const data = minimalValidSave()
    const result = GameState.tryFromGameSaveData(data)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state).toBeInstanceOf(GameState)
    expect(result.state.gameSaveData.players).toEqual(['Alice'])
    expect(result.state.gameSaveData.gameTurns).toHaveLength(1)
    expect(result.state.gameSaveData.gameTurns[0].turnNumber).toBe(1)
  })

  it('returns a single error when turn number is wrong', () => {
    const data = minimalValidSave()
    data.gameTurns[0].turnNumber = 2

    const result = GameState.tryFromGameSaveData(data)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatch(/Invalid turn number/)
  })

  it('returns a single error when player index is wrong', () => {
    const data: GameSaveData = {
      players: ['A', 'B'],
      blockedResults: [],
      gameTurns: [
        {
          turnNumber: 1,
          playerIndex: 0,
          cubes: new CubesResult(1, 1),
          eventsCube: EventsCubeResult.GREEN,
          turnDuration: 0,
        },
        {
          turnNumber: 2,
          playerIndex: 0,
          cubes: new CubesResult(2, 2),
          eventsCube: EventsCubeResult.BLUE,
          turnDuration: 0,
        },
      ],
    }

    const result = GameState.tryFromGameSaveData(data)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatch(/Invalid player index/)
  })

  it('returns a single error when cubes are not in the possible pool', () => {
    const data: GameSaveData = {
      players: ['A'],
      blockedResults: [],
      gameTurns: [
        {
          turnNumber: 1,
          playerIndex: 0,
          cubes: new CubesResult(4, 2),
          eventsCube: EventsCubeResult.GREEN,
          turnDuration: 0,
        },
        {
          turnNumber: 2,
          playerIndex: 0,
          cubes: new CubesResult(4, 2),
          eventsCube: EventsCubeResult.BLUE,
          turnDuration: 0,
        },
      ],
    }

    const result = GameState.tryFromGameSaveData(data)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatch(/Invalid cubes/)
  })

  it('accepts predetermined cubes that would otherwise be invalid for the pool', () => {
    const data = minimalValidSave()
    data.gameTurns[0].cubes = new CubesResult(6, 6, true)
    data.blockedResults = [12]

    const result = GameState.tryFromGameSaveData(data)
    expect(result.ok).toBe(true)
  })
})
