import { describe, it, expect } from 'vitest'
import {
  EventsCubeResult,
  eventsCubeFromFaceNumber,
  getEventsCubeName,
  CubesResult,
} from '../types'

describe('EventsCubeResult', () => {
  describe('eventsCubeFromFaceNumber', () => {
    it('should return GREEN for face 1', () => {
      const result = eventsCubeFromFaceNumber(1)
      expect(result).toBe(EventsCubeResult.GREEN)
    })

    it('should return BLUE for face 2', () => {
      const result = eventsCubeFromFaceNumber(2)
      expect(result).toBe(EventsCubeResult.BLUE)
    })

    it('should return YELLOW for face 3', () => {
      const result = eventsCubeFromFaceNumber(3)
      expect(result).toBe(EventsCubeResult.YELLOW)
    })

    it('should return PIRATES for face 4', () => {
      const result = eventsCubeFromFaceNumber(4)
      expect(result).toBe(EventsCubeResult.PIRATES)
    })

    it('should return PIRATES for face 5', () => {
      const result = eventsCubeFromFaceNumber(5)
      expect(result).toBe(EventsCubeResult.PIRATES)
    })

    it('should return PIRATES for face 6', () => {
      const result = eventsCubeFromFaceNumber(6)
      expect(result).toBe(EventsCubeResult.PIRATES)
    })

    it('should throw error for face 0', () => {
      expect(() => eventsCubeFromFaceNumber(0)).toThrow()
    })

    it('should throw error for face 7', () => {
      expect(() => eventsCubeFromFaceNumber(7)).toThrow()
    })
  })

  describe('getEventsCubeName', () => {
    it('should return correct name for GREEN', () => {
      const name = getEventsCubeName(EventsCubeResult.GREEN)
      expect(name).toBe('GREEN')
    })

    it('should return correct name for PIRATES', () => {
      const name = getEventsCubeName(EventsCubeResult.PIRATES)
      expect(name).toBe('PIRATES')
    })
  })
})

describe('CubesResult', () => {
  describe('constructor and total calculation', () => {
    it('should calculate total correctly', () => {
      const cubes = new CubesResult(3, 4)
      expect(cubes.yellowCube).toBe(3)
      expect(cubes.redCube).toBe(4)
      expect(cubes.total).toBe(7)
    })

    it('should calculate total for minimum values', () => {
      const cubes = new CubesResult(1, 1)
      expect(cubes.total).toBe(2)
    })

    it('should calculate total for maximum values', () => {
      const cubes = new CubesResult(6, 6)
      expect(cubes.total).toBe(12)
    })

    it('should handle predetermined flag', () => {
      const cubes = new CubesResult(3, 4, true)
      expect(cubes.predetermined).toBe(true)
    })

    it('should have undefined predetermined by default', () => {
      const cubes = new CubesResult(3, 4)
      expect(cubes.predetermined).toBeUndefined()
    })
  })

  describe('equals', () => {
    it('should return true for same values', () => {
      const cubes1 = new CubesResult(3, 4)
      const cubes2 = new CubesResult(3, 4)
      expect(cubes1.equals(cubes2)).toBe(true)
    })

    it('should return false for different values', () => {
      const cubes1 = new CubesResult(3, 4)
      const cubes2 = new CubesResult(4, 3)
      expect(cubes1.equals(cubes2)).toBe(false)
    })

    it('should consider predetermined flag in equality', () => {
      const cubes1 = new CubesResult(3, 4, true)
      const cubes2 = new CubesResult(3, 4, false)
      expect(cubes1.equals(cubes2)).toBe(false)
    })

    it('should return true when both predetermined are undefined', () => {
      const cubes1 = new CubesResult(3, 4)
      const cubes2 = new CubesResult(3, 4)
      expect(cubes1.equals(cubes2)).toBe(true)
    })
  })

  describe('compareTo', () => {
    it('should compare by total when totals differ', () => {
      const cubes1 = new CubesResult(2, 3) // total = 5
      const cubes2 = new CubesResult(3, 4) // total = 7
      expect(cubes1.compareTo(cubes2)).toBeLessThan(0)
      expect(cubes2.compareTo(cubes1)).toBeGreaterThan(0)
    })

    it('should compare by red cube when totals are equal', () => {
      const cubes1 = new CubesResult(4, 3) // total = 7, red = 3
      const cubes2 = new CubesResult(3, 4) // total = 7, red = 4
      expect(cubes1.compareTo(cubes2)).toBeLessThan(0)
      expect(cubes2.compareTo(cubes1)).toBeGreaterThan(0)
    })

    it('should return 0 for equal values', () => {
      const cubes1 = new CubesResult(3, 4)
      const cubes2 = new CubesResult(3, 4)
      expect(cubes1.compareTo(cubes2)).toBe(0)
    })
  })
})
