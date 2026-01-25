import React from 'react'
import { GameState, formatTimeDetailed } from '../core'
import DurationTable from './DurationTable'

interface PauseViewProps {
  gameState: GameState
  onResume: () => void
}

export const PauseView: React.FC<PauseViewProps> = ({
  gameState,
  onResume,
}) => {
  const stats = gameState.getDurationStats()

  return (
    <div className="view">
      <div className="view-title">GAME PAUSED</div>

      <div className="stats">
        <div className="duration-tables">
          <div className="card">
            <DurationTable title="Longest Turns" data={stats.longest} />
          </div>
          <div className="card">
            <DurationTable title="Shortest Turns" data={stats.shortest} />
          </div>
          <div className="card">
            <DurationTable
              title="Average Turn Durations"
              data={stats.average}
            />
          </div>
        </div>
        <div className="game-duration">
          Game duration: {formatTimeDetailed(stats.gameDuration)}
        </div>
      </div>

      <div className="action-bar">
        <button className="primary" onClick={onResume}>
          Resume <span className="kbd">Space</span>
        </button>
        <button className="secondary" disabled>
          Free Throw <span className="kbd">f</span>
        </button>
        <button className="secondary" disabled>
          Cube Options <span className="kbd">c</span>
        </button>
      </div>
    </div>
  )
}

export default PauseView
