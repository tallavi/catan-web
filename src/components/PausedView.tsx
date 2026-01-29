import React, { useState } from 'react'
import { GameLogic, formatTimeDetailed } from '../core'
import DurationTable from './DurationTable'
import ActionBar, { type Action } from './ActionBar'

interface PausedViewProps {
  gameLogic: GameLogic
}

export const PausedView: React.FC<PausedViewProps> = ({ gameLogic }) => {
  const [isConfirming, setIsConfirming] = useState(false)
  const stats = gameLogic.getDurationStats()

  const confirmActions: Action[] = [
    {
      label: 'Yes',
      shortcutDisplay: 'Y',
      keys: ['y'],
      action: () => {
        gameLogic.newGame()
        setIsConfirming(false)
      },
      isLongPress: true,
    },
    {
      label: 'No',
      shortcutDisplay: 'N or Esc',
      keys: ['n', 'Escape'],
      action: () => setIsConfirming(false),
    },
  ]

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
      action: () => setIsConfirming(true),
    },
  ]

  if (!stats) {
    throw new Error('PausedView rendered with no stats')
  }

  return (
    <>
      {isConfirming && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="view-title" style={{ fontSize: '2.5rem' }}>
              Are you sure?
            </div>
          </div>
        </div>
      )}
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

        <ActionBar actions={isConfirming ? confirmActions : actions} />
      </div>
    </>
  )
}

export default PausedView
