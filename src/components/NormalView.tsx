import React from 'react'
import type { GameState } from '../core'
import { EventsCubeResult } from '../core'
import CubeStatistics from './CubeStatistics'
import EventsStatistics from './EventsStatistics'
import Timer from './Timer'

interface NormalViewProps {
  gameState: GameState
  onPause: () => void
}

export const NormalView: React.FC<NormalViewProps> = ({
  gameState,
  onPause,
}) => {
  const lastTurn = gameState.getLastTurn()
  const currentPlayer = gameState.getCurrentPlayerName() || 'Unknown'

  return (
    <div className="normal-view">
      <div className="normal-top">
        <div className="card cube-card">
          <CubeStatistics
            className="card-content"
            possibleResults={gameState.possibleCubesResults}
          />
        </div>

        <div className="card events-card">
          <EventsStatistics
            className="card-content"
            possibleEvents={gameState.possibleEventsCubeResults}
          />
        </div>
      </div>

      <div className="info-bar" role="status" aria-live="polite">
        <div className="info-item">
          <div className="info-label">Turn</div>
          <div className="info-value">#{gameState.currentTurnNumber}</div>
        </div>

        <div className="info-item">
          <div className="info-label">Player</div>
          <div className="info-value">{currentPlayer}</div>
        </div>

        <div className="info-item">
          <div className="info-label">Total</div>
          <div className="info-value">{lastTurn?.cubes.total ?? 0}</div>
        </div>

        <div className="info-item">
          <div className="info-label">Red cube</div>
          <div className="info-value">{lastTurn?.cubes.redCube ?? '-'}</div>
        </div>

        <div className="info-item">
          <div className="info-label">Event</div>
          <div className="info-value">
            {lastTurn ? EventsCubeResult.getName(lastTurn.eventsCube) : '-'}
          </div>
        </div>

        <div className="info-item">
          <div className="info-label">Pirates</div>
          <div className="info-value">{gameState.piratesTrack}</div>
        </div>

        <div className="info-item timer-item">
          <Timer
            className="small-timer"
            durationSeconds={gameState.getLastTurnDuration()}
            label="Turn"
          />
        </div>

        <div className="info-item timer-item">
          <Timer
            className="small-timer"
            durationSeconds={gameState.calculateTotalGameDuration()}
            label="Game"
          />
        </div>
      </div>

      <div className="action-bar">
        <button className="primary" onClick={onPause}>
          Pause <span className="kbd">Space</span>
        </button>

        <button className="secondary" disabled>
          Next Turn <span className="kbd">Enter</span>
        </button>

        <button className="secondary">
          Quit <span className="kbd">q</span>
        </button>
      </div>
    </div>
  )
}

export default NormalView
