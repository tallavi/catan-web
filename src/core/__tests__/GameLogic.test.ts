import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { GameLogic } from '../GameLogic'
import { GameStorage } from '../GameStorage'
import { CubesResult, EventsCubeResult, GameMode as GameStatus } from '../types'

describe('GameLogic', () => {
  let storage: GameStorage
  let testKey: string
  let game: GameLogic

  beforeEach(() => {
    // Create unique test key for each test
    testKey = `test-gamelogic-${Date.now()}-${Math.random()}`
    storage = new GameStorage(testKey)

    // Create a fresh game for each test
    const saveData = storage.createNewGame(['Alice', 'Bob', 'Charlie'])
    storage.save(saveData)
    game = new GameLogic(storage)
  })

  afterEach(() => {
    // Clean up storage
    storage.clear()
  })

  describe('initialization', () => {
    it('should initialize with correct player count', () => {
      expect(game.state.gameSaveData?.players.length).toBe(3)
    })

    it('should initialize with 36 possible events cube results', () => {
      expect(game.state.possibleEventsCubeResults.length).toBe(36)
    })

    it('should initialize with 36 possible cubes results when no blocked', () => {
      expect(game.state.possibleCubesResults.length).toBe(36)
    })

    it('should start with player index -1', () => {
      expect(game.state.currentPlayerIndex).toBe(-1)
    })

    it('should start with turn number 0', () => {
      expect(game.state.currentTurnNumber).toBe(0)
    })

    it('should start with pirates track at 1', () => {
      expect(game.state.piratesTrack).toBe(1)
    })
  })

  describe('nextTurn', () => {
    it('should increment turn number', () => {
      const initialTurn = game.state.currentTurnNumber
      game.nextTurn()
      expect(game.state.currentTurnNumber).toBe(initialTurn + 1)
    })

    it('should add turn to history', () => {
      const initialCount = game.state.gameSaveData?.gameTurns.length || 0
      game.nextTurn()
      expect(game.state.gameSaveData?.gameTurns.length).toBe(initialCount + 1)
    })

    it('should decrease possible cubes count after turn', () => {
      const initialCubes = game.state.possibleCubesResults.length
      const initialEvents = game.state.possibleEventsCubeResults.length

      game.nextTurn()

      expect(game.state.possibleCubesResults.length).toBe(initialCubes - 1)
      expect(game.state.possibleEventsCubeResults.length).toBe(
        initialEvents - 1
      )
    })

    it('should not crash after multiple turns', () => {
      for (let i = 0; i < 10; i++) {
        game.nextTurn()
      }
      expect(game.state.currentTurnNumber).toBe(10)
    })
  })

  describe('getFreeRoll', () => {
    it('should return valid cubes result', () => {
      const [cubes] = GameLogic.getFreeRoll()

      expect(cubes).toBeInstanceOf(CubesResult)
      expect(cubes.yellowCube).toBeGreaterThanOrEqual(1)
      expect(cubes.yellowCube).toBeLessThanOrEqual(6)
      expect(cubes.redCube).toBeGreaterThanOrEqual(1)
      expect(cubes.redCube).toBeLessThanOrEqual(6)
      expect(cubes.total).toBe(cubes.yellowCube + cubes.redCube)
    })

    it('should return valid events cube result', () => {
      const [, events] = GameLogic.getFreeRoll()

      expect(Object.values(EventsCubeResult)).toContain(events)
    })
  })

  describe('pause and resume', () => {
    it('should pause and resume without errors', () => {
      // can't pause if not in progress
      game.pause()
      expect(game.status).toBe(GameStatus.Setup)

      game.nextTurn()
      expect(game.status).toBe(GameStatus.InProgress)

      game.pause()
      expect(game.status).toBe(GameStatus.Paused)

      game.resume()
      expect(game.status).toBe(GameStatus.InProgress)
    })
  })
})
