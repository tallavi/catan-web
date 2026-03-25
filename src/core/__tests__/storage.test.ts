import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  type GameStorageLoadResult,
  GameStorage,
} from '../GameStorage'
import { CubesResult, EventsCubeResult, GameSaveData } from '../types'

type GameStorageLoadOk = Extract<GameStorageLoadResult, { ok: true }>
type GameStorageLoadFailed = Extract<GameStorageLoadResult, { ok: false }>

function assertGameStorageLoadOk(
  result: GameStorageLoadResult
): asserts result is GameStorageLoadOk {
  if (result.ok !== true) {
    throw new Error('expected successful GameStorage.load() result')
  }
}

function assertGameStorageLoadFailed(
  result: GameStorageLoadResult
): asserts result is GameStorageLoadFailed {
  if (result.ok !== false) {
    throw new Error('expected failed GameStorage.load() result')
  }
}

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
      const saveData = storage.createNewGame(['Alice', 'Bob'])
      storage.save(saveData)
      expect(storage.exists()).toBe(true)
    })

    it('should return false after clearing', () => {
      const saveData = storage.createNewGame(['Alice', 'Bob'])
      storage.save(saveData)
      storage.clear()
      expect(storage.exists()).toBe(false)
    })
  })

  describe('createNewGame', () => {
    it('should create game with players', () => {
      const saveData = storage.createNewGame(['Alice', 'Bob', 'Charlie'])
      expect(saveData.players).toEqual(['Alice', 'Bob', 'Charlie'])
      expect(saveData.blockedResults).toEqual([])
      expect(saveData.gameTurns).toEqual([])
    })

    it('should create game with blocked results', () => {
      const saveData = storage.createNewGame(['Player1'], [2, 12])
      expect(saveData.blockedResults).toEqual([2, 12])
    })

    it('should throw error with empty players array', () => {
      expect(() => storage.createNewGame([])).toThrow()
    })

    it('should throw error with blocked result below 2', () => {
      expect(() => storage.createNewGame(['Alice'], [1])).toThrow()
    })

    it('should throw error with blocked result above 12', () => {
      expect(() => storage.createNewGame(['Alice'], [13])).toThrow()
    })
  })

  describe('save and load', () => {
    it('should save and load data correctly', () => {
      const saveData = storage.createNewGame(['Alice', 'Bob'])
      storage.save(saveData)

      const loaded = storage.load()
      assertGameStorageLoadOk(loaded)
      expect(loaded.data.players).toEqual(['Alice', 'Bob'])
    })

    it('should return empty save when loading non-existent data', () => {
      const loaded = storage.load()
      assertGameStorageLoadOk(loaded)
      expect(loaded.data.players).toEqual([])
      expect(loaded.data.blockedResults).toEqual([])
      expect(loaded.data.gameTurns).toEqual([])
      expect(loaded.rawString).toBe(
        new GameSaveData([], [], []).toJsonString(true)
      )
    })

    it('should return ok false with errors when stored JSON is not a valid save', () => {
      localStorage.setItem(testKey, 'not valid json {{{')
      const loaded = storage.load()
      assertGameStorageLoadFailed(loaded)
      expect(loaded.rawString).toBe('not valid json {{{')
      expect(loaded.errors.length).toBeGreaterThan(0)
    })

    it('should preserve blocked results in save/load cycle', () => {
      const saveData = storage.createNewGame(['Alice'], [2, 7, 12])
      storage.save(saveData)

      const loaded = storage.load()
      assertGameStorageLoadOk(loaded)
      expect(loaded.data.blockedResults).toEqual([2, 7, 12])
    })

    it('should preserve game turns in save/load cycle', () => {
      const saveData = storage.createNewGame(['Alice', 'Bob'])

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

      assertGameStorageLoadOk(loaded)
      expect(loaded.data.gameTurns.length).toBe(1)
      expect(loaded.data.gameTurns[0].turnNumber).toBe(1)
      expect(loaded.data.gameTurns[0].cubes.yellowCube).toBe(3)
      expect(loaded.data.gameTurns[0].cubes.redCube).toBe(4)
      expect(loaded.data.gameTurns[0].eventsCube).toBe(EventsCubeResult.GREEN)
    })

    it('should preserve predetermined flag in CubesResult', () => {
      const saveData = storage.createNewGame(['Alice'])

      saveData.gameTurns.push({
        turnNumber: 1,
        playerIndex: 0,
        cubes: new CubesResult(3, 4, true),
        eventsCube: EventsCubeResult.PIRATES,
        turnDuration: 10,
      })

      storage.save(saveData)
      const loaded = storage.load()

      assertGameStorageLoadOk(loaded)
      expect(loaded.data.gameTurns[0].cubes.predetermined).toBe(true)
    })
  })

  describe('clear', () => {
    it('should remove saved data', () => {
      const saveData = storage.createNewGame(['Alice'])
      storage.save(saveData)

      expect(storage.exists()).toBe(true)

      storage.clear()

      expect(storage.exists()).toBe(false)
      const after = storage.load()
      assertGameStorageLoadOk(after)
      expect(after.data.players).toEqual([])
    })
  })
})
