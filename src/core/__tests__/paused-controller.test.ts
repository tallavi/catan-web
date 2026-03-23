import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PausedController } from '../controllers/PausedController'
import {
  CubesResult,
  EventsCubeResult,
  GameSaveData,
} from '../types'
import { GameState } from '../types/game-state'

describe('PausedController', () => {
  let testKey: string

  beforeEach(() => {
    testKey = `test-paused-ctrl-${Date.now()}-${Math.random()}`
    vi.spyOn(Math, 'random').mockReturnValue(0)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.removeItem(testKey)
  })

  function oneTurnState(): GameState {
    const save = new GameSaveData(
      ['Alice'],
      [],
      [
        {
          turnNumber: 1,
          playerIndex: 0,
          cubes: new CubesResult(2, 3),
          eventsCube: EventsCubeResult.GREEN,
          turnDuration: 10,
        },
      ]
    )
    const result = GameState.tryFromGameSaveData(save)
    if (!result.ok) throw new Error(result.errors.join(', '))
    return result.state
  }

  it('getDurationStats returns game duration when few turns', () => {
    const state = oneTurnState()
    const c = new PausedController(state, testKey)

    const stats = c.getDurationStats()
    expect(stats).not.toBeNull()
    expect(stats!.gameDuration).toBe(10)
  })

  it('getCurrentTurnDurationSeconds matches last turn', () => {
    const state = oneTurnState()
    const c = new PausedController(state, testKey)
    expect(c.getCurrentTurnDurationSeconds()).toBe(10)
  })

  it('resume invokes callback', () => {
    const state = oneTurnState()
    let resumed = false
    const c = new PausedController(state, testKey, {
      onResume: () => {
        resumed = true
      },
    })

    c.resume()
    expect(resumed).toBe(true)
  })

  it('newGame clears turns and invokes callback', () => {
    const state = oneTurnState()
    let newGameCalled = false
    const c = new PausedController(state, testKey, {
      onNewGame: () => {
        newGameCalled = true
      },
    })

    c.newGame()

    expect(newGameCalled).toBe(true)
    expect(c.getGameState().gameSaveData.gameTurns).toHaveLength(0)
    expect(c.getGameState().gameSaveData.players).toEqual(['Alice'])
  })

  it('nextTurnWithPredeterminedCubes adds a turn', () => {
    const state = oneTurnState()
    const c = new PausedController(state, testKey)

    c.nextTurnWithPredeterminedCubes(4, 5)

    expect(state.gameSaveData.gameTurns).toHaveLength(2)
    expect(state.gameSaveData.gameTurns[1].cubes).toEqual(
      new CubesResult(4, 5, true)
    )
  })

  it('getFreeRoll matches shape', () => {
    const [cubes, ev] = PausedController.getFreeRoll()
    expect(cubes).toBeInstanceOf(CubesResult)
    expect(typeof ev).toBe('number')
  })
})
