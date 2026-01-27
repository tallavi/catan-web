import React from 'react'
import type { GameLogic } from '../core'

interface StartViewProps {
  gameLogic: GameLogic
}

export const StartView: React.FC<StartViewProps> = ({ gameLogic }) => {
  return (
    <div className="view">
      <div className="normal-top">
        <h1>good luck!</h1>
      </div>

      <div className="action-bar">
        <button className="primary" onClick={() => gameLogic.nextTurn()}>
          Start <span className="kbd">Enter</span>
        </button>
      </div>
    </div>
  )
}

export default StartView
