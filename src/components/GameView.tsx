import React, { useEffect, useState } from 'react'
import './game.css'
import { GameLogic, GameStorage } from '../core'
import { mockGameSaveData } from '../mocks/mockGameState'
import NormalView from './NormalView'
import PauseView from './PauseView'

const USE_MOCK_DATA = true

let gameLogic: GameLogic

if (USE_MOCK_DATA) {
  const storage = new GameStorage()
  storage.createNewGame([], [], mockGameSaveData)
  gameLogic = new GameLogic()
} else {
  gameLogic = new GameLogic()
}

export const GameView: React.FC = () => {
  const [view, setView] = useState<'normal' | 'pause'>('pause')

  // Toggle between normal and pause when Space is pressed
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Only react to space key
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        setView(prev => (prev === 'normal' ? 'pause' : 'normal'))
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="game-view">
      <div className="view-content">
        {view === 'normal' ? (
          <NormalView gameLogic={gameLogic} onPause={() => setView('pause')} />
        ) : (
          <PauseView gameLogic={gameLogic} onResume={() => setView('normal')} />
        )}
      </div>
    </div>
  )
}

export default GameView
