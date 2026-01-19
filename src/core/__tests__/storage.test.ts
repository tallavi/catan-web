import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { GameStorage } from '../storage'
import { CubesResult, EventsCubeResult } from '../types'

describe('GameStorage', () => {
  let storage: GameStorage
  let testKey: string

  beforeEach(() => {
    // Create unique test key for each test
    testKey = `test-storage-${Date.now()}-${Math.random()}`
    storage = new GameStorage(testKey)
  })

  afterEach(() => {
    // Clean up after each test
    storage.clear()
  })

  describe('exists', () => {
    it('should return false when no data exists', () => {
      expect(storage.exists()).toBe(false)
    })

    it('should return true after saving data', () => {
      const saveData = GameStorage.createNewGame(['Alice', 'Bob'])
      storage.save(saveData)
      expect(storage.exists()).toBe(true)
    })

    it('should return false after clearing', () => {
      const saveData = GameStorage.createNewGame(['Alice', 'Bob'])
      storage.save(saveData)
      storage.clear()
      expect(storage.exists()).toBe(false)
    })
  })

  describe('createNewGame', () => {
    it('should create game with players', () => {
      const saveData = GameStorage.createNewGame(['Alice', 'Bob', 'Charlie'])
      expect(saveData.players).toEqual(['Alice', 'Bob', 'Charlie'])
      expect(saveData.blockedResults).toEqual([])
      expect(saveData.gameTurns).toEqual([])
    })

    it('should create game with blocked results', () => {
      const saveData = GameStorage.createNewGame(['Player1'], [2, 12])
      expect(saveData.blockedResults).toEqual([2, 12])
    })

    it('should throw error with empty players array', () => {
      expect(() => GameStorage.createNewGame([])).toThrow()
    })

    it('should throw error with blocked result below 2', () => {
      expect(() => GameStorage.createNewGame(['Alice'], [1])).toThrow()
    })

    it('should throw error with blocked result above 12', () => {
      expect(() => GameStorage.createNewGame(['Alice'], [13])).toThrow()
    })
  })

  describe('save and load', () => {
    it('should save and load data correctly', () => {
      const saveData = GameStorage.createNewGame(['Alice', 'Bob'])
      storage.save(saveData)

      const loaded = storage.load()
      expect(loaded).not.toBeNull()
      expect(loaded?.players).toEqual(['Alice', 'Bob'])
    })

    it('should return null when loading non-existent data', () => {
      const loaded = storage.load()
      expect(loaded).toBeNull()
    })

    it('should preserve blocked results in save/load cycle', () => {
      const saveData = GameStorage.createNewGame(['Alice'], [2, 7, 12])
      storage.save(saveData)

      const loaded = storage.load()
      expect(loaded?.blockedResults).toEqual([2, 7, 12])
    })

    it('should preserve game turns in save/load cycle', () => {
      const saveData = GameStorage.createNewGame(['Alice', 'Bob'])

      // Add a turn
      saveData.gameTurns.push({
        turnNumber: 1,
        playerIndex: 0,
        cubes: new CubesResult(3, 4),
        eventsCube: EventsCubeResult.GREEN,
        turnDuration: 5,
      })

      storage.save(saveData)
      const loaded = storage.load()

      expect(loaded?.gameTurns.length).toBe(1)
      expect(loaded?.gameTurns[0].turnNumber).toBe(1)
      expect(loaded?.gameTurns[0].cubes.yellowCube).toBe(3)
      expect(loaded?.gameTurns[0].cubes.redCube).toBe(4)
      expect(loaded?.gameTurns[0].eventsCube).toBe(EventsCubeResult.GREEN)
    })

    it('should preserve predetermined flag in CubesResult', () => {
      const saveData = GameStorage.createNewGame(['Alice'])

      saveData.gameTurns.push({
        turnNumber: 1,
        playerIndex: 0,
        cubes: new CubesResult(3, 4, true),
        eventsCube: EventsCubeResult.PIRATES,
        turnDuration: 10,
      })

      storage.save(saveData)
      const loaded = storage.load()

      expect(loaded?.gameTurns[0].cubes.predetermined).toBe(true)
    })
  })

  describe('clear', () => {
    it('should remove saved data', () => {
      const saveData = GameStorage.createNewGame(['Alice'])
      storage.save(saveData)

      expect(storage.exists()).toBe(true)

      storage.clear()

      expect(storage.exists()).toBe(false)
      expect(storage.load()).toBeNull()
    })
  })
})
