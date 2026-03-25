import { describe, expect, it } from 'vitest'
import { CubesResult, EventsCubeResult, GameSaveData } from '../types'

describe('GameSaveData JSON serialization', () => {
  it('parses valid flattened JSON into GameSaveData', () => {
    const input = JSON.stringify({
      players: ['Alice', 'Bob'],
      blockedResults: [2, 12],
      gameTurns: [
        {
          turnNumber: 1,
          playerIndex: 0,
          yellowCube: 3,
          redCube: 4,
          eventsCube: 'GREEN',
          turnDuration: 5,
        },
        {
          turnNumber: 2,
          playerIndex: 1,
          yellowCube: 6,
          redCube: 6,
          predetermined: true,
          eventsCube: 'PIRATES',
          turnDuration: 9,
        },
      ],
    })

    const result = GameSaveData.tryFromJsonString(input)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.data.players).toEqual(['Alice', 'Bob'])
    expect(result.data.blockedResults).toEqual([2, 12])
    expect(result.data.gameTurns).toHaveLength(2)
    expect(result.data.gameTurns[0].cubes).toEqual(new CubesResult(3, 4))
    expect(result.data.gameTurns[0].eventsCube).toBe(EventsCubeResult.GREEN)
    expect(result.data.gameTurns[1].cubes).toEqual(new CubesResult(6, 6, true))
    expect(result.data.gameTurns[1].eventsCube).toBe(EventsCubeResult.PIRATES)
  })

  it('returns parse errors for invalid eventsCube label', () => {
    const input = JSON.stringify({
      players: ['Alice'],
      blockedResults: [],
      gameTurns: [
        {
          turnNumber: 1,
          playerIndex: 0,
          yellowCube: 2,
          redCube: 3,
          eventsCube: 'ORANGE',
          turnDuration: 5,
        },
      ],
    })

    const result = GameSaveData.tryFromJsonString(input)
    expect(result.ok).toBe(false)
    if (result.ok) return

    expect(result.errors[0]).toContain('gameTurns.0.eventsCube')
  })

  it('returns parse errors when cube values are strings', () => {
    const input = JSON.stringify({
      players: ['Alice'],
      blockedResults: [],
      gameTurns: [
        {
          turnNumber: 1,
          playerIndex: 0,
          yellowCube: '2',
          redCube: 3,
          eventsCube: 'GREEN',
          turnDuration: 5,
        },
      ],
    })

    const result = GameSaveData.tryFromJsonString(input)
    expect(result.ok).toBe(false)
    if (result.ok) return

    expect(result.errors[0]).toContain('gameTurns.0.yellowCube')
  })

  it('returns parse errors for missing required fields', () => {
    const input = JSON.stringify({
      players: ['Alice'],
      blockedResults: [],
    })

    const result = GameSaveData.tryFromJsonString(input)
    expect(result.ok).toBe(false)
    if (result.ok) return

    expect(result.errors[0]).toContain('gameTurns')
  })

  it('returns parse errors for non-object root', () => {
    const result = GameSaveData.tryFromJsonString('[]')
    expect(result.ok).toBe(false)
    if (result.ok) return

    expect(result.errors[0]).toContain('Invalid save data')
  })

  it('round-trips with flattened cubes and string eventsCube', () => {
    const save = new GameSaveData(
      ['Alice'],
      [7],
      [
        {
          turnNumber: 1,
          playerIndex: 0,
          cubes: new CubesResult(3, 4, true),
          eventsCube: EventsCubeResult.BLUE,
          turnDuration: 12,
        },
      ]
    )

    const json = save.toJsonString(false)
    const plain = JSON.parse(json) as {
      gameTurns: Array<{
        yellowCube: number
        redCube: number
        predetermined?: boolean
        eventsCube: string
      }>
    }

    expect(plain.gameTurns[0]).toMatchObject({
      yellowCube: 3,
      redCube: 4,
      predetermined: true,
      eventsCube: 'BLUE',
    })

    const reparsed = GameSaveData.tryFromJsonString(json)
    expect(reparsed.ok).toBe(true)
    if (!reparsed.ok) return

    expect(reparsed.data.players).toEqual(save.players)
    expect(reparsed.data.blockedResults).toEqual(save.blockedResults)
    expect(reparsed.data.gameTurns).toHaveLength(1)
    expect(reparsed.data.gameTurns[0].turnNumber).toBe(1)
    expect(reparsed.data.gameTurns[0].playerIndex).toBe(0)
    expect(reparsed.data.gameTurns[0].cubes).toEqual(new CubesResult(3, 4, true))
    expect(reparsed.data.gameTurns[0].eventsCube).toBe(EventsCubeResult.BLUE)
    expect(reparsed.data.gameTurns[0].turnDuration).toBe(12)
  })
})
