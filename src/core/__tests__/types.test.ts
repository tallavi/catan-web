import { describe, it, expect } from 'vitest'
import { EventsCubeResult, CubesResult } from '../types'

describe('EventsCubeResult', () => {
  describe('random', () => {
    it('should return a valid EventsCubeResult', () => {
      const result = EventsCubeResult.random()
      const validValues = [
        EventsCubeResult.GREEN,
        EventsCubeResult.BLUE,
        EventsCubeResult.YELLOW,
        EventsCubeResult.PIRATES,
      ]
      expect(validValues).toContain(result)
    })

    it('should have proper distribution over many calls', () => {
      const results: EventsCubeResult[] = []
      const iterations = 6000

      for (let i = 0; i < iterations; i++) {
        results.push(EventsCubeResult.random())
      }

      const greenCount = results.filter(
        r => r === EventsCubeResult.GREEN
      ).length
      const blueCount = results.filter(r => r === EventsCubeResult.BLUE).length
      const yellowCount = results.filter(
        r => r === EventsCubeResult.YELLOW
      ).length
      const piratesCount = results.filter(
        r => r === EventsCubeResult.PIRATES
      ).length

      // Expected: 1/6 GREEN, 1/6 BLUE, 1/6 YELLOW, 3/6 PIRATES
      const expectedGreen = iterations / 6
      const expectedBlue = iterations / 6
      const expectedYellow = iterations / 6
      const expectedPirates = (iterations * 3) / 6

      // Allow some variance (±10%)
      const tolerance = 0.1

      expect(greenCount).toBeGreaterThan(expectedGreen * (1 - tolerance))
      expect(greenCount).toBeLessThan(expectedGreen * (1 + tolerance))

      expect(blueCount).toBeGreaterThan(expectedBlue * (1 - tolerance))
      expect(blueCount).toBeLessThan(expectedBlue * (1 + tolerance))

      expect(yellowCount).toBeGreaterThan(expectedYellow * (1 - tolerance))
      expect(yellowCount).toBeLessThan(expectedYellow * (1 + tolerance))

      expect(piratesCount).toBeGreaterThan(expectedPirates * (1 - tolerance))
      expect(piratesCount).toBeLessThan(expectedPirates * (1 + tolerance))
    })
  })

  describe('fromFaceNumber', () => {
    it('should return GREEN for face 1', () => {
      const result = EventsCubeResult.fromFaceNumber(1)
      expect(result).toBe(EventsCubeResult.GREEN)
    })

    it('should return BLUE for face 2', () => {
      const result = EventsCubeResult.fromFaceNumber(2)
      expect(result).toBe(EventsCubeResult.BLUE)
    })

    it('should return YELLOW for face 3', () => {
      const result = EventsCubeResult.fromFaceNumber(3)
      expect(result).toBe(EventsCubeResult.YELLOW)
    })

    it('should return PIRATES for face 4', () => {
      const result = EventsCubeResult.fromFaceNumber(4)
      expect(result).toBe(EventsCubeResult.PIRATES)
    })

    it('should return PIRATES for face 5', () => {
      const result = EventsCubeResult.fromFaceNumber(5)
      expect(result).toBe(EventsCubeResult.PIRATES)
    })

    it('should return PIRATES for face 6', () => {
      const result = EventsCubeResult.fromFaceNumber(6)
      expect(result).toBe(EventsCubeResult.PIRATES)
    })

    it('should throw error for face 0', () => {
      expect(() => EventsCubeResult.fromFaceNumber(0)).toThrow()
    })

    it('should throw error for face 7', () => {
      expect(() => EventsCubeResult.fromFaceNumber(7)).toThrow()
    })
  })

  describe('getName', () => {
    it('should return correct name for GREEN', () => {
      const name = EventsCubeResult.getName(EventsCubeResult.GREEN)
      expect(name).toBe('GREEN')
    })

    it('should return correct name for PIRATES', () => {
      const name = EventsCubeResult.getName(EventsCubeResult.PIRATES)
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

  describe('random', () => {
    it('should return a valid CubesResult', () => {
      const result = CubesResult.random()
      expect(result).toBeInstanceOf(CubesResult)
      expect(result.yellowCube).toBeGreaterThanOrEqual(1)
      expect(result.yellowCube).toBeLessThanOrEqual(6)
      expect(result.redCube).toBeGreaterThanOrEqual(1)
      expect(result.redCube).toBeLessThanOrEqual(6)
      expect(result.total).toBe(result.yellowCube + result.redCube)
    })

    it('should have uniform distribution over many calls', () => {
      const results: CubesResult[] = []
      const iterations = 36000

      for (let i = 0; i < iterations; i++) {
        results.push(CubesResult.random())
      }

      // Check distribution for yellow cube (should be roughly uniform)
      const yellowCounts = [0, 0, 0, 0, 0, 0]
      const redCounts = [0, 0, 0, 0, 0, 0]

      for (const result of results) {
        yellowCounts[result.yellowCube - 1]++
        redCounts[result.redCube - 1]++
      }

      const expectedCount = iterations / 6
      const tolerance = 0.05 // ±5%

      for (let i = 0; i < 6; i++) {
        expect(yellowCounts[i]).toBeGreaterThan(expectedCount * (1 - tolerance))
        expect(yellowCounts[i]).toBeLessThan(expectedCount * (1 + tolerance))
        expect(redCounts[i]).toBeGreaterThan(expectedCount * (1 - tolerance))
        expect(redCounts[i]).toBeLessThan(expectedCount * (1 + tolerance))
      }
    })
  })
})
