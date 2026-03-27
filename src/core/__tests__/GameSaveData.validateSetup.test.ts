import { describe, it, expect } from 'vitest'
import { GameSaveData } from '../types'

describe('GameSaveData.validateSetup', () => {
  it('returns error when there are no players', () => {
    const errors = GameSaveData.validateSetup([], [])
    expect(errors).toContain('There must be at least one player.')
  })

  it('returns error when a player name is empty after trimming', () => {
    const errors = GameSaveData.validateSetup(['   '], [])
    expect(errors).toContain('Player names must not be empty.')
  })

  it('returns error when a player name exceeds max length', () => {
    const tooLong = 'a'.repeat(GameSaveData.PLAYER_NAME_MAX_LENGTH + 1)
    const errors = GameSaveData.validateSetup([tooLong], [])
    expect(errors.some(e => e.includes('Player names must be at most'))).toBe(
      true
    )
  })

  it('returns error when player names are not unique (trimmed)', () => {
    const errors = GameSaveData.validateSetup(['Alice', ' Alice '], [])
    expect(errors).toContain("Player names must be unique ('Alice').")
  })

  it('returns error when blocked result is out of range', () => {
    const errors = GameSaveData.validateSetup(['A'], [13])
    expect(
      errors.some(e => e.includes('Blocked results must be between'))
    ).toBe(true)
  })

  it('returns error when blocked results are not unique', () => {
    const errors = GameSaveData.validateSetup(['A'], [2, 2])
    expect(errors).toContain('Blocked results must be unique (2).')
  })

  it('returns error when all possible results are blocked', () => {
    const all = Array.from(
      {
        length:
          GameSaveData.BLOCKED_RESULT_MAX - GameSaveData.BLOCKED_RESULT_MIN + 1,
      },
      (_, i) => GameSaveData.BLOCKED_RESULT_MIN + i
    )
    const errors = GameSaveData.validateSetup(['A'], all)
    expect(errors).toContain('There must be at least one unblocked result.')
  })

  it('returns no errors for a valid setup', () => {
    const errors = GameSaveData.validateSetup(['Alice', 'Bob'], [7, 12])
    expect(errors).toEqual([])
  })
})
