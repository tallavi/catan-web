import React, { useState } from 'react'
import { formatTime, type GameLogic } from '../../core'
import { useGameTimer } from '../../hooks/useGameTimer'
import { EventsCubeResult } from '../../core'
import CubeStatistics from './CubeStatistics'
import EventsStatistics from './EventsStatistics'
import ActionBar from '../Common/ActionBar/ActionBar'
import type { Action } from '../Common/ActionBar/ActionBar.types'
import './InProgressView.css'

interface InProgressViewProps {
  gameLogic: GameLogic
}

export const InProgressView: React.FC<InProgressViewProps> = ({
  gameLogic,
}) => {
  const [renderCounter, setRenderCounter] = useState(0)
  const forceRerender = () => setRenderCounter(v => v + 1)

  const { turnDuration, gameDuration } = useGameTimer(gameLogic, renderCounter)

  const gameState = gameLogic.state
  const currentTurn = gameLogic.state.getCurrentTurn()
  const currentPlayer = gameState.getCurrentPlayerName() || 'Unknown'

  const actions: Action[] = [
    {
      label: 'Pause',
      shortcutDisplay: 'Space',
      keys: [' '],
      action: () => gameLogic.pause(),
    },
    {
      label: 'Next Turn',
      shortcutDisplay: 'Enter',
      keys: ['Enter'],
      action: () => {
        gameLogic.nextTurn()
        forceRerender()
      },
    },
  ]

  return (
    <div className="view">
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
                <b className="text-accent">
                  {currentTurn.cubes.predetermined && ' (Predetermined)'}
                </b>
              </div>
              <div className="info-value current-player">
                <b>{currentPlayer}</b> to play
              </div>
            </div>

            <div className="info-cell">
              <div className="info-label">Total</div>
              <div className="info-value">{currentTurn.cubes.total}</div>
            </div>

            <div className="info-cell">
              <div className="info-label">Red cube</div>
              <div className="info-value text-red">
                {currentTurn.cubes.redCube}
              </div>
            </div>

            <div className="info-cell">
              <div className="info-label">Events cube</div>
              <div
                className={`info-value ${
                  currentTurn
                    ? EventsCubeResult.getColorClass(currentTurn.eventsCube)
                    : ''
                }`}
              >
                {currentTurn
                  ? EventsCubeResult.getName(currentTurn.eventsCube)
                  : '-'}
              </div>
            </div>

            <div className="info-cell">
              <div className="info-label">Pirates track</div>
              <div className="info-value">{gameState.piratesTrack}</div>
            </div>

            <div className="info-cell">
              <div className="info-label">Turn time</div>
              <div className="info-value">{formatTime(turnDuration)}</div>
            </div>

            <div className="info-cell">
              <div className="info-label">Game time</div>
              <div className="info-value">{formatTime(gameDuration)}</div>
            </div>
          </div>
        </div>
      </div>

      <ActionBar actions={actions} />
    </div>
  )
}

export default InProgressView
