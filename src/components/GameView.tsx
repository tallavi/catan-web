import React, { useEffect, useState } from 'react'
import './game.css'
import mockGameState from '../mocks/mockGameState'
import NormalView from './NormalView'
import PauseView from './PauseView'

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
          <NormalView
            gameState={mockGameState}
            onPause={() => setView('pause')}
          />
        ) : (
          <PauseView
            gameState={mockGameState}
            onResume={() => setView('normal')}
          />
        )}
      </div>
    </div>
  )
}

export default GameView
