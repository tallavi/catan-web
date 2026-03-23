import React, { useEffect, useState, useMemo } from 'react'
import '../game.css'
import './App.css'
import { GameLogic, GameMode, GameStorage } from '../../core'
import type { GameMode as GameModeType } from '../../core/types'
import InProgressView from '../InProgressView/InProgressView'
import PausedView from '../PausedView/PausedView'
import SetupView from '../SetupView/SetupView'

export const App: React.FC = () => {
  const gameLogic = useMemo(() => {
    const storage = new GameStorage()
    return new GameLogic(storage)
  }, [])

  const [gameMode, setGameMode] = useState<GameModeType>(gameLogic.status)

  useEffect(() => {
    gameLogic.setOnGameModeChange(setGameMode)
  }, [gameLogic])

  const renderView = () => {
    switch (gameMode) {
      case GameMode.Setup:
        return <SetupView gameLogic={gameLogic} />
      case GameMode.InProgress:
        return <InProgressView gameLogic={gameLogic} />
      case GameMode.Paused:
        return <PausedView gameLogic={gameLogic} />
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

export default App
