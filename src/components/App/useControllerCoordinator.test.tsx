import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useControllerCoordinator } from './useControllerCoordinator'
import {
  ControllerCoordinator,
  type IController,
} from '../../core/controllers/coordinator/ControllerCoordinator'
import { InProgressController } from '../../core/controllers/concrete/InProgressController'
import { SetupController } from '../../core/controllers/concrete/SetupController'
import { DEFAULT_GAME_STORAGE_KEY } from '../../core/GameStorage'
import { CubesResult, EventsCubeResult, GameSaveData } from '../../core/types'

const DEFAULT_PLAYERS = GameSaveData.createDefault().players

describe('useControllerCoordinator', () => {
  beforeEach(() => {
    localStorage.removeItem(DEFAULT_GAME_STORAGE_KEY)
  })

  afterEach(() => {
    localStorage.removeItem(DEFAULT_GAME_STORAGE_KEY)
  })

  it('resolves to SetupController when default storage key is missing (canonical default save)', async () => {
    const { result } = renderHook(() => useControllerCoordinator())

    await waitFor(() => {
      expect(result.current).not.toBeNull()
    })

    const c = result.current as IController
    expect(c).toBeInstanceOf(SetupController)
    expect(c.appMode()).toBe(ControllerCoordinator.AppMode.Setup)
    const save = (c as SetupController).getGameSaveData()
    expect(save.gameTurns).toEqual([])
    expect(save.players).toEqual(DEFAULT_PLAYERS)
  })

  it('resolves to InProgressController when default key has a valid in-progress save', async () => {
    const data = new GameSaveData(
      ['Alice'],
      [],
      [
        {
          turnNumber: 1,
          playerIndex: 0,
          cubes: new CubesResult(2, 3),
          eventsCube: EventsCubeResult.GREEN,
          turnDuration: 12,
        },
      ]
    )
    localStorage.setItem(DEFAULT_GAME_STORAGE_KEY, data.toJsonString(true))

    const { result } = renderHook(() => useControllerCoordinator())

    await waitFor(() => {
      expect(result.current).not.toBeNull()
    })

    const c = result.current as IController
    expect(c).toBeInstanceOf(InProgressController)
    expect(c.appMode()).toBe(ControllerCoordinator.AppMode.InProgress)
    expect(
      (c as InProgressController).getGameState().gameSaveData.gameTurns
    ).toHaveLength(1)
  })
})
