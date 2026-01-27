import React, { useEffect, useState, useMemo } from 'react'
import './game.css'
import { GameLogic, GameStorage, GameStatus } from '../core'
import type { GameStatus as GameStatusType } from '../core/types'
import { mockGameSaveData } from '../mocks/mockGameState'
import NormalView from './NormalView'
import PauseView from './PauseView'
import StartView from './StartView'

const USE_MOCK_DATA = true

export const GameView: React.FC = () => {
  const [gameStatus, setGameStatus] = useState<GameStatusType>(GameStatus.Start)

  const gameLogic = useMemo(() => {
    const storage = new GameStorage()
    if (USE_MOCK_DATA) {
      storage.createNewGame([], [], mockGameSaveData)
    }
    return new GameLogic(undefined, null, setGameStatus)
  }, [setGameStatus])

  useEffect(() => {
    setGameStatus(gameLogic.status)
  }, [gameLogic])

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
