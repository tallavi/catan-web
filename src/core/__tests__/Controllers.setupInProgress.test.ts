import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SetupController } from '../controllers/concrete/SetupController'
import { InProgressController } from '../controllers/concrete/InProgressController'
import { PausedController } from '../controllers/concrete/PausedController'
import { CubesResult, EventsCubeResult, GameSaveData } from '../types'
import { GameState } from '../types/GameState'
import { GameStorage } from '../GameStorage'

describe('SetupController', () => {
  let testKey: string

  beforeEach(() => {
    testKey = `test-setup-ctrl-${Date.now()}-${Math.random()}`
  })

  afterEach(() => {
    localStorage.removeItem(testKey)
  })

  it('setPlayers and setBlockedResults persist via GameStorage', () => {
    const data = new GameSaveData([], [], [])
    const storage = new GameStorage(testKey)
    const c = new SetupController(data, {
      save: d => storage.save(d),
      startGame: vi.fn(),
    })

    c.setPlayers(['A', 'B'])
    c.setBlockedResults([7])

    const raw = localStorage.getItem(testKey)
    expect(raw).not.toBeNull()
    const parsed = GameSaveData.tryFromJsonString(raw!)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.data.players).toEqual(['A', 'B'])
    expect(parsed.data.blockedResults).toEqual([7])
  })

  it('startGame invokes callback with current GameSaveData', () => {
    const data = new GameSaveData([], [], [])
    const storage = new GameStorage(testKey)
    const startGame = vi.fn()
    const c = new SetupController(data, {
      save: d => storage.save(d),
      startGame,
    })

    c.startGame()

    expect(startGame).toHaveBeenCalledTimes(1)
    expect(startGame).toHaveBeenCalledWith(data)
  })
})

describe('InProgressController', () => {
  let testKey: string

  beforeEach(() => {
    testKey = `test-ip-ctrl-${Date.now()}-${Math.random()}`
    vi.spyOn(Math, 'random').mockReturnValue(0)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.removeItem(testKey)
  })

  function stateWithOneTurn(): GameState {
    const save = new GameSaveData(
      ['Alice'],
      [],
      [
        {
          turnNumber: 1,
          playerIndex: 0,
          cubes: new CubesResult(2, 3),
          eventsCube: EventsCubeResult.GREEN,
          turnDuration: 5,
        },
      ]
    )
    const result = GameState.tryFromGameSaveData(save)
    if (!result.ok) throw new Error(result.errors.join(', '))
    return result.state
  }

  it('nextTurn appends a turn and saves', () => {
    const state = stateWithOneTurn()
    const storage = new GameStorage(testKey)
    const c = new InProgressController(state, {
      save: d => storage.save(d),
      pause: vi.fn(),
    })

    c.nextTurn()

    expect(state.gameSaveData.gameTurns).toHaveLength(2)
    expect(state.gameSaveData.gameTurns[1].turnNumber).toBe(2)

    const raw = localStorage.getItem(testKey)
    expect(raw).not.toBeNull()
  })

  it('nextTurnWithPredeterminedCubes uses predetermined flag', () => {
    const state = stateWithOneTurn()
    const storage = new GameStorage(testKey)
    const c = new InProgressController(state, {
      save: d => storage.save(d),
      pause: vi.fn(),
    })

    c.nextTurnWithPredeterminedCubes(new CubesResult(4, 5, true))

    const last = state.gameSaveData.gameTurns.at(-1)
    expect(last?.cubes).toEqual(new CubesResult(4, 5, true))
  })

  it('PausedController.getFreeRoll matches GameLogic.getFreeRoll shape', () => {
    const [cubes, ev] = PausedController.getFreeRoll()
    expect(cubes).toBeInstanceOf(CubesResult)
    expect(typeof ev).toBe('number')
  })
})
