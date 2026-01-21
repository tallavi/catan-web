import React, { useState } from 'react'
import './game.css'
import mockGameState from '../mocks/mockGameState'
import NormalView from './NormalView.tsx'
import PauseView from './PauseView.tsx'

export const GameView: React.FC = () => {
  const [view, setView] = useState<'normal' | 'pause'>('normal')

  return (
    <div className="game-view">
      <div className="view-controls">
        <button onClick={() => setView('normal')}>Normal</button>
        <button onClick={() => setView('pause')}>Pause</button>
      </div>

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
