import React, { useState } from 'react'
import { GameLogic } from '../core'
import DurationTable from './DurationTable'
import ActionBar, { type Action } from './ActionBar'
import HistoryTable from './HistoryTable'

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
      label: 'Free Roll',
      shortcutDisplay: 'f',
      keys: ['f'],
      action: () => {},
      disabled: true,
    },
    {
      label: 'Next turn with predetermined cubes',
      shortcutDisplay: 'p',
      keys: ['p'],
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
      <div className="view">
        <div className="view-title">GAME PAUSED</div>

        <div className="stats">
          {stats.longest && stats.shortest && stats.average && (
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
          )}
          <HistoryTable
            gameSaveData={gameLogic.state.gameSaveData}
            stats={stats}
          />
        </div>
      </div>
      {isConfirming && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="view-title" style={{ fontSize: '2.5rem' }}>
              Are you sure?
            </div>
          </div>
        </div>
      )}
      <ActionBar actions={isConfirming ? confirmActions : actions} />
    </>
  )
}

export default PausedView
