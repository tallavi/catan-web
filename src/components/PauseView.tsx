import React from 'react'
import { GameState, formatTimeDetailed } from '../core'
import CubeStatistics from './CubeStatistics'
import EventsStatistics from './EventsStatistics'
import DurationTable from './DurationTable'

interface PauseViewProps {
  gameState: GameState
  onResume: () => void
}

export const PauseView: React.FC<PauseViewProps> = ({
  gameState,
  onResume,
}) => {
  const shortestTurns = gameState.getShortestTurns(3)
  const longestTurns = gameState.getLongestTurns(3)
  const averageTurnDurations = gameState.getAverageTurnDurations()

  return (
    <div className="view">
      <div className="view-title">GAME PAUSED</div>

      <div className="stats">
        <div className="duration-tables">
          <div className="card">
            <DurationTable title="Longest Turns" data={longestTurns} />
          </div>
          <div className="card">
            <DurationTable title="Shortest Turns" data={shortestTurns} />
          </div>
          <div className="card">
            <DurationTable
              title="Average Turn Durations"
              data={averageTurnDurations}
            />
          </div>
        </div>
        <div className="game-duration">
          Game duration:{' '}
          {formatTimeDetailed(gameState.calculateTotalGameDuration())}
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
