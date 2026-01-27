import React, { useEffect, useState, useMemo } from 'react'
import './game.css'
import { GameLogic, GameStorage, GameStatus } from '../core'
import type { GameStatus as GameStatusType } from '../core/types'
import { mockGameSaveData } from '../mocks/mockGameState'
import NormalView from './NormalView'
import PauseView from './PauseView'
import StartView from './StartView'

const USE_MOCK_DATA = true

// This is a development-only feature to force a re-render when the mock data changes.
// In a production build, import.meta.hot will be undefined.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if ((import.meta as any).hot) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(import.meta as any).hot.accept('../mocks/mockGameState', () => {
    // When the mock data changes, we want to force a full page reload to re-initialize the game state.
    // While we could try to hot-update the component, a full reload is simpler and more reliable for this case.
    window.location.reload()
  })
}

export const GameView: React.FC = () => {
  const [gameStatus, setGameStatus] = useState<GameStatusType>(() => {
    const storage = new GameStorage()
    if (USE_MOCK_DATA) {
      storage.createNewGame([], [], mockGameSaveData)
    }
    const logic = new GameLogic(undefined, null, () => {})
    return logic.status
  })

  const gameLogic = useMemo(() => {
    const storage = new GameStorage()
    if (USE_MOCK_DATA) {
      storage.createNewGame([], [], mockGameSaveData)
    }
    return new GameLogic(undefined, null, setGameStatus)
  }, [setGameStatus])

  // Toggle between normal and pause when Space is pressed
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        if (gameLogic.status === GameStatus.InProgress) {
          gameLogic.pause()
          e.preventDefault()
        } else if (gameLogic.status === GameStatus.Paused) {
          gameLogic.resume()
          e.preventDefault()
        }
      } else if (e.code === 'Enter' || e.key === 'Enter') {
        if (gameLogic.status === GameStatus.Start) {
          gameLogic.nextTurn()
          e.preventDefault()
        } else if (gameLogic.status === GameStatus.InProgress) {
          gameLogic.nextTurn()
          e.preventDefault()
        }
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameLogic])

  const renderView = () => {
    switch (gameStatus) {
      case GameStatus.Start:
        return <StartView gameLogic={gameLogic} />
      case GameStatus.InProgress:
        return (
          <NormalView gameLogic={gameLogic} onPause={() => gameLogic.pause()} />
        )
      case GameStatus.Paused:
        return (
          <PauseView
            gameLogic={gameLogic}
            onResume={() => gameLogic.resume()}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="game-view">
      <div className="view-content">{renderView()}</div>
    </div>
  )
}

export default GameView
