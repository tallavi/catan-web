import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  PausedController,
  type PausedControllerCallbacks,
} from '../controllers/PausedController'
import { CubesResult, EventsCubeResult, GameSaveData } from '../types'
import { GameState } from '../types/GameState'

describe('PausedController', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function stubCallbacks(): PausedControllerCallbacks {
    return {
      newGame: vi.fn(),
      resume: vi.fn(),
      nextTurnWithPredeterminedCubes: vi.fn(),
    }
  }

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
    const c = new PausedController(state, stubCallbacks())

    const stats = c.getDurationStats()
    expect(stats).not.toBeNull()
    expect(stats!.gameDuration).toBe(10)
  })

  it('getCurrentTurnDurationSeconds matches last turn', () => {
    const state = oneTurnState()
    const c = new PausedController(state, stubCallbacks())
    expect(c.getCurrentTurnDurationSeconds()).toBe(10)
  })

  it('resume invokes callback with game state', () => {
    const state = oneTurnState()
    const callbacks = stubCallbacks()
    const c = new PausedController(state, callbacks)

    c.resume()

    expect(callbacks.resume).toHaveBeenCalledTimes(1)
    expect(callbacks.resume).toHaveBeenCalledWith(state)
  })

  it('newGame clears turns and invokes callback with new game state', () => {
    const state = oneTurnState()
    const callbacks = stubCallbacks()
    const c = new PausedController(state, callbacks)

    c.newGame()

    expect(callbacks.newGame).toHaveBeenCalledTimes(1)
    expect(callbacks.newGame).toHaveBeenCalledWith(c.getGameState())
    expect(c.getGameState().gameSaveData.gameTurns).toHaveLength(0)
    expect(c.getGameState().gameSaveData.players).toEqual(['Alice'])
  })

  it('nextTurnWithPredeterminedCubes invokes callback; does not mutate state in controller', () => {
    const state = oneTurnState()
    const callbacks = stubCallbacks()
    const c = new PausedController(state, callbacks)
    const expectedCubes = new CubesResult(4, 5, true)

    c.nextTurnWithPredeterminedCubes(4, 5)

    expect(state.gameSaveData.gameTurns).toHaveLength(1)
    expect(callbacks.nextTurnWithPredeterminedCubes).toHaveBeenCalledTimes(1)
    expect(callbacks.nextTurnWithPredeterminedCubes).toHaveBeenCalledWith(
      state,
      expectedCubes
    )
  })

  it('getFreeRoll matches shape', () => {
    const [cubes, ev] = PausedController.getFreeRoll()
    expect(cubes).toBeInstanceOf(CubesResult)
    expect(typeof ev).toBe('number')
  })
})
