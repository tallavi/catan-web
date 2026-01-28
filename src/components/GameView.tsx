import React, { useEffect, useState, useMemo } from 'react'
import './game.css'
import { GameLogic, GameStatus } from '../core'
import type { GameStatus as GameStatusType } from '../core/types'
import { mockGameSaveData } from '../mocks/mockGameState'
import NormalView from './NormalView'
import PauseView from './PauseView'
import StartView from './StartView'

const USE_MOCK_DATA = false

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
  const gameLogic = useMemo(() => {
    return new GameLogic(
      undefined,
      USE_MOCK_DATA ? mockGameSaveData : null,
      () => {}
    )
  }, [])

  const [gameStatus, setGameStatus] = useState<GameStatusType>(gameLogic.status)

  useEffect(() => {
    gameLogic.setOnStatusChange(setGameStatus)
  }, [gameLogic])

  const renderView = () => {
    switch (gameStatus) {
      case GameStatus.Start:
        return <StartView gameLogic={gameLogic} />
      case GameStatus.InProgress:
        return <NormalView gameLogic={gameLogic} />
      case GameStatus.Paused:
        return <PauseView gameLogic={gameLogic} />
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
