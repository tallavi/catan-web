import React from 'react'
import { GameLogic, formatTimeDetailed } from '../core'
import DurationTable from './DurationTable'
import ActionBar, { type Action } from './ActionBar'

interface PausedViewProps {
  gameLogic: GameLogic
}

export const PausedView: React.FC<PausedViewProps> = ({ gameLogic }) => {
  const stats = gameLogic.getDurationStats()

  const actions: Action[] = [
    {
      label: 'Resume',
      shortcutDisplay: 'Space',
      keys: [' '],
      action: () => gameLogic.resume(),
    },
    {
      label: 'Free Throw',
      shortcutDisplay: 'f',
      keys: ['f'],
      action: () => {},
      disabled: true,
    },
    {
      label: 'Cube Options',
      shortcutDisplay: 'c',
      keys: ['c'],
      action: () => {},
      disabled: true,
    },
    {
      label: 'New Game',
      shortcutDisplay: 'n',
      keys: ['n'],
      action: () => gameLogic.newGame(),
    },
  ]

  if (!stats) {
    throw new Error('PausedView rendered with no stats')
  }

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

      <ActionBar actions={actions} />
    </div>
  )
}

export default PausedView
