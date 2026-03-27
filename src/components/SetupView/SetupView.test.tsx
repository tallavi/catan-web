import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SetupView } from './SetupView'
import {
  SetupController,
  type SetupControllerCallbacks,
} from '../../core/controllers/concrete/SetupController'
import { GameSaveData } from '../../core/types'
import { GameStorage } from '../../core/GameStorage'

describe('SetupView', () => {
  let testKey: string

  beforeEach(() => {
    testKey = `test-setup-view-${Date.now()}-${Math.random()}`
  })

  afterEach(() => {
    localStorage.removeItem(testKey)
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  function renderWithController(
    initial: GameSaveData,
    startGame: SetupControllerCallbacks['startGame']
  ) {
    const storage = new GameStorage(testKey)
    const controller = new SetupController(initial, {
      save: d => storage.save(d),
      editSave: vi.fn(),
      startGame,
    })
    return render(<SetupView controller={controller} />)
  }

  it('shows setup validation when there are no players', () => {
    const data = new GameSaveData([], [], [])
    renderWithController(
      data,
      vi.fn() as SetupControllerCallbacks['startGame']
    )

    expect(
      screen.getByText('There must be at least one player.')
    ).toBeInTheDocument()
  })

  it('adds a player and completes start flow with long-press confirm', async () => {
    const user = userEvent.setup()
    const startGame = vi.fn()
    const data = new GameSaveData([], [], [])
    renderWithController(
      data,
      startGame as SetupControllerCallbacks['startGame']
    )

    const addField = screen.getByPlaceholderText('Add player')
    await user.type(addField, 'Alice')
    await user.keyboard('{Enter}')

    expect(screen.queryByText('There must be at least one player.')).not.toBeInTheDocument()

    const startBtn = screen.getByRole('button', { name: /Start/i })
    await user.click(startBtn)

    expect(screen.getByText('Are you sure?')).toBeInTheDocument()

    vi.useFakeTimers()
    const yesBtn = screen.getByRole('button', { name: /Yes/i })
    fireEvent.mouseDown(yesBtn)
    await act(async () => {
      vi.advanceTimersByTime(2500)
    })
    fireEvent.mouseUp(yesBtn)

    expect(startGame).toHaveBeenCalledTimes(1)
    const arg = startGame.mock.calls[0][0]
    expect(arg.gameSaveData.players).toEqual(['Alice'])
    expect(arg.gameSaveData.gameTurns).toEqual([])
  })
})
