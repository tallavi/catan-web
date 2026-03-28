import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { InProgressView } from './InProgressView'
import { InProgressController } from '../../core/controllers/concrete/InProgressController'
import { CubesResult, EventsCubeResult, GameSaveData } from '../../core/types'
import { GameState } from '../../core/types/GameState'
import { GameStorage } from '../../core/GameStorage'

describe('InProgressView', () => {
  let testKey: string

  beforeEach(() => {
    testKey = `test-ip-view-${Date.now()}-${Math.random()}`
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
          turnDuration: 5,
        },
      ]
    )
    const result = GameState.tryFromGameSaveData(save)
    if (!result.ok) throw new Error(result.errors.join(', '))
    return result.state
  }

  it('renders current player, turn, and in-progress actions', () => {
    const storage = new GameStorage(testKey)
    const controller = new InProgressController(oneTurnState(), {
      save: d => storage.save(d),
      pause: vi.fn(),
    })

    render(<InProgressView controller={controller} />)

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText(/to play/)).toBeInTheDocument()
    const eventsCubeCell = screen.getByText('Events cube').closest('.info-cell')
    if (!(eventsCubeCell instanceof HTMLElement)) {
      throw new Error('expected .info-cell around Events cube label')
    }
    expect(within(eventsCubeCell).getByText('GREEN')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Pause/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Next Turn/i })).toBeInTheDocument()
  })
})
