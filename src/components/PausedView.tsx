import React, { useState } from 'react'
import { GameLogic } from '../core'
import { type CubesResult, EventsCubeResult } from '../core/types'
import DurationTable from './DurationTable'
import ActionBar, { type Action } from './ActionBar'
import HistoryTable from './HistoryTable'

interface PausedViewProps {
  gameLogic: GameLogic
}

type ViewMode = 'Normal' | 'NewGame' | 'FreeRoll'
type FreeRollResult = [CubesResult, EventsCubeResult]

export const PausedView: React.FC<PausedViewProps> = ({ gameLogic }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('Normal')
  const [freeRollResult, setFreeRollResult] = useState<FreeRollResult | null>(
    null
  )
  const stats = gameLogic.getDurationStats()

  const roll = () => {
    setFreeRollResult(GameLogic.getFreeRoll())
  }

  const actionMap: Record<ViewMode, Action[]> = {
    NewGame: [
      {
        label: 'Yes',
        shortcutDisplay: 'Y',
        keys: ['y'],
        action: () => {
          gameLogic.newGame()
          setViewMode('Normal')
        },
        isLongPress: true,
      },
      {
        label: 'No',
        shortcutDisplay: 'N or Esc',
        keys: ['n', 'Escape'],
        action: () => setViewMode('Normal'),
      },
    ],
    FreeRoll: [
      {
        label: 'Roll Again',
        shortcutDisplay: 'Enter',
        keys: ['Enter'],
        action: roll,
      },
      {
        label: 'Done',
        shortcutDisplay: 'Esc',
        keys: ['Escape'],
        action: () => setViewMode('Normal'),
      },
    ],
    Normal: [
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
        action: () => {
          roll()
          setViewMode('FreeRoll')
        },
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
        action: () => setViewMode('NewGame'),
      },
    ],
  }

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
      {viewMode === 'NewGame' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="view-title" style={{ fontSize: '2.5rem' }}>
              Are you sure?
            </div>
          </div>
        </div>
      )}
      {viewMode === 'FreeRoll' && freeRollResult && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '400px' }}>
            <div className="view-title" style={{ fontSize: '2.5rem' }}>
              Free Roll
            </div>
            <div style={{ fontSize: '1.5rem' }}>
              <div>
                Total: <b>{freeRollResult[0].total}</b>
              </div>
              <div>
                Red cube:{' '}
                <span className="text-red">
                  <b>{freeRollResult[0].redCube}</b>
                </span>
              </div>
              <div>
                Events cube:{' '}
                <span
                  className={EventsCubeResult.getColorClass(freeRollResult[1])}
                >
                  <b>{EventsCubeResult.getName(freeRollResult[1])}</b>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      <ActionBar actions={actionMap[viewMode]} />
    </>
  )
}

export default PausedView
