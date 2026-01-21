import React from 'react'
import type { GameState, DurationStats } from '../core'
import DurationStatsView from './DurationStats'
import CubeStatistics from './CubeStatistics'
import EventsStatistics from './EventsStatistics'

interface PauseViewProps {
  gameState: GameState
  onResume: () => void
}

export const PauseView: React.FC<PauseViewProps> = ({
  gameState,
  onResume,
}) => {
  // Create a simple DurationStats object using gameState
  const stats: DurationStats = {
    gameDuration: gameState.calculateTotalGameDuration(),
    currentTurnDuration: gameState.getLastTurnDuration(),
    shortest: [],
    longest: [],
    average: [],
  }

  return (
    <div className="pause-view">
      <h2>GAME PAUSED</h2>

      <div className="stats">
        <DurationStatsView stats={stats} />

        <div className="pool-stats">
          <CubeStatistics possibleResults={gameState.possibleCubesResults} />
          <EventsStatistics
            possibleEvents={gameState.possibleEventsCubeResults}
          />
        </div>
      </div>

      <div className="menu">
        <button onClick={onResume}>Resume</button>
        <button>Free Throw</button>
        <button>Cube Options</button>
        <button>Quit</button>
      </div>
    </div>
  )
}

export default PauseView
