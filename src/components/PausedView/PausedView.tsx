import React, { useState } from 'react'
import { GameLogic } from '../../core'
import { type CubesResult, EventsCubeResult } from '../../core/types'
import DurationTable from './DurationTable'
import ActionBar from '../Common/ActionBar/ActionBar'
import type { Action } from '../Common/ActionBar/ActionBar.types'
import HistoryTable from './HistoryTable'
import Modal from '../Common/Modal/Modal'

interface PausedViewProps {
  gameLogic: GameLogic
}

type ViewMode = 'Normal' | 'NewGame' | 'FreeRoll' | 'Predetermined'
type PredeterminedStage = 'yellow' | 'red'
type FreeRollResult = [CubesResult, EventsCubeResult]

export const PausedView: React.FC<PausedViewProps> = ({ gameLogic }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('Normal')
  const [predeterminedStage, setPredeterminedStage] =
    useState<PredeterminedStage>('yellow')
  const [yellowCube, setYellowCube] = useState(0)
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
        action: () => {
          setViewMode('Predetermined')
          setPredeterminedStage('yellow')
        },
      },
      {
        label: 'New Game',
        shortcutDisplay: 'n',
        keys: ['n'],
        action: () => setViewMode('NewGame'),
      },
    ],
    Predetermined: [
      ...[1, 2, 3, 4, 5, 6].map(n => ({
        label: String(n),
        shortcutDisplay: String(n),
        keys: [String(n)],
        action: () => {
          if (predeterminedStage === 'yellow') {
            setYellowCube(n)
            setPredeterminedStage('red')
          } else {
            gameLogic.nextTurnWithPredeterminedCubes(yellowCube, n)
            gameLogic.resume()
          }
        },
      })),
      {
        label: 'Cancel',
        shortcutDisplay: 'Esc',
        keys: ['Escape'],
        action: () => {
          setViewMode('Normal')
          setPredeterminedStage('yellow')
        },
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
        <Modal>
          <div className="view-title" style={{ fontSize: '2.5rem' }}>
            Are you sure?
          </div>
        </Modal>
      )}
      {viewMode === 'FreeRoll' && freeRollResult && (
        <Modal width="400px">
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
        </Modal>
      )}
      {viewMode === 'Predetermined' && (
        <Modal>
          <div className="view-title" style={{ fontSize: '2.5rem' }}>
            Next Turn with Predetermined Cubes
          </div>
          <div style={{ fontSize: '1.5rem', textAlign: 'center' }}>
            <div>
              <span className="text-yellow">Yellow</span> cube:{' '}
              {predeterminedStage === 'red' && yellowCube}
            </div>
            {predeterminedStage === 'red' && (
              <div>
                <span className="text-red">Red</span> cube:
              </div>
            )}
          </div>
        </Modal>
      )}
      <ActionBar actions={actionMap[viewMode]} />
    </>
  )
}

export default PausedView
