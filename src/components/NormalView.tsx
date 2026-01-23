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

        <div className="card info-card">
          <div className="info-grid">
            <div className="info-cell span-2">
              <div className="info-label text-center">
                Turn <b>#{gameState.currentTurnNumber}</b>
              </div>
              <div className="info-value current-player">
                <b>{currentPlayer}</b> to play
              </div>
            </div>

            <div className="info-cell">
              <div className="info-label">Total</div>
              <div className="info-value">{lastTurn?.cubes.total ?? 0}</div>
            </div>

            <div className="info-cell">
              <div className="info-label">Red cube</div>
              <div className="info-value text-red">
                {lastTurn?.cubes.redCube ?? '-'}
              </div>
            </div>

            <div className="info-cell">
              <div className="info-label">Events cube</div>
              <div
                className={`info-value ${
                  lastTurn
                    ? EventsCubeResult.getColorClass(lastTurn.eventsCube)
                    : ''
                }`}
              >
                {lastTurn ? EventsCubeResult.getName(lastTurn.eventsCube) : '-'}
              </div>
            </div>

            <div className="info-cell">
              <div className="info-label">Pirates track</div>
              <div className="info-value">{gameState.piratesTrack}</div>
            </div>

            <div className="info-cell">
              <div className="info-label">Turn time</div>
              <Timer
                className="small-timer"
                durationSeconds={gameState.getLastTurnDuration()}
                label=""
              />
            </div>

            <div className="info-cell">
              <div className="info-label">Game time</div>
              <Timer
                className="small-timer"
                durationSeconds={gameState.calculateTotalGameDuration()}
                label=""
              />
            </div>
          </div>
        </div>
      </div>

      <div className="action-bar">
        <button className="primary" onClick={onPause}>
          Pause <span className="kbd">Space</span>
        </button>

        <button className="secondary" disabled>
          Next Turn <span className="kbd">Enter</span>
        </button>
      </div>
    </div>
  )
}

export default NormalView
