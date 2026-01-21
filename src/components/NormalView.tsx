import React from 'react'
import type { GameState } from '../core'
import CubeStatistics from './CubeStatistics'
import EventsStatistics from './EventsStatistics'
import ColoredText from './ColoredText'
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
      <div className="columns">
        <div className="left-column">
          <CubeStatistics possibleResults={gameState.possibleCubesResults} />
        </div>

        <div className="right-column">
          <EventsStatistics
            possibleEvents={gameState.possibleEventsCubeResults}
          />
        </div>
      </div>

      <div className="turn-info">
        <ColoredText
          text={`Turn #${gameState.currentTurnNumber}, {bold}${currentPlayer}{/bold} to play!`}
        />
        <div className="last-roll">
          <ColoredText
            text={`Total: {bold}${lastTurn?.cubes.total ?? 0}{/bold}`}
          />
          <ColoredText text={`Pirates track: ${gameState.piratesTrack}`} />
        </div>

        <div className="timers">
          <Timer
            durationSeconds={gameState.calculateTotalGameDuration()}
            label="Game"
          />
          <Timer
            durationSeconds={gameState.getLastTurnDuration()}
            label="Last Turn"
          />
        </div>

        <div className="instructions">
          <p>Enter - next turn</p>
          <p>Space - pause</p>
          <p>q - quit</p>
          <button onClick={onPause}>Pause</button>
        </div>
      </div>
    </div>
  )
}

export default NormalView
