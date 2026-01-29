import React from 'react'
import { EventsCubeResult, type GameSaveData } from '../core/types'
import { formatTime, type DurationStats } from '../core'

interface HistoryTableProps {
  stats: DurationStats
  gameSaveData: GameSaveData
}

const HistoryTable: React.FC<HistoryTableProps> = ({ gameSaveData, stats }) => {
  const { gameTurns: turns, players } = gameSaveData
  const { gameDuration: gameTotalDuration } = stats
  const reversedTurns = [...turns].reverse()

  const longestTurnsMap = new Map(
    stats.longest?.map((item, index) => [item.turnNumber, index + 1])
  )
  const shortestTurnsMap = new Map(
    stats.shortest?.map((item, index) => [item.turnNumber, index + 1])
  )

  const getChip = (
    turnNumber: number,
    isCurrent: boolean
  ): React.ReactNode[] => {
    const chips: React.ReactNode[] = []

    if (isCurrent) {
      chips.push(
        <span key="current" className="chip">
          current turn
        </span>
      )
    }

    const longestRank = longestTurnsMap.get(turnNumber)
    if (longestRank) {
      chips.push(
        <span key="longest" className="chip dark">
          #{longestRank} longest
        </span>
      )
    }

    const shortestRank = shortestTurnsMap.get(turnNumber)
    if (shortestRank) {
      chips.push(
        <span key="shortest" className="chip dark">
          #{shortestRank} shortest
        </span>
      )
    }

    return chips
  }

  return (
    <div className="history-table">
      <div className="card">
        <div className="table-title">Turn History</div>
        <table className="table">
          <thead>
            <tr>
              <th>Turn</th>
              <th>Player</th>
              <th>Total</th>
              <th>Red cube</th>
              <th>Events cube</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {reversedTurns.map((turn, index) => (
              <tr key={turn.turnNumber}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span>{turn.turnNumber}</span>
                  </div>
                </td>
                <td>{players[turn.playerIndex]}</td>
                <td>{turn.cubes.total}</td>
                <td className="text-red">{turn.cubes.redCube}</td>
                <td className={EventsCubeResult.getColorClass(turn.eventsCube)}>
                  {EventsCubeResult.getName(turn.eventsCube)}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {formatTime(turn.turnDuration)}
                    {getChip(turn.turnNumber, index === 0)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5}></td>
              <td>
                <b>{formatTime(gameTotalDuration)}</b>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

export default HistoryTable
