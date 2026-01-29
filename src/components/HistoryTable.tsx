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

    // if (isCurrent) {
    //   chips.push(
    //     <span key="current" className="chip">
    //       current turn
    //     </span>
    //   )
    // }

    return chips
  }

  return (
    <div className="history-table">
      <div className="card">
        <div className="table-title">Turn History</div>
        <table className="table">
          <thead>
            <tr>
              <th className="text-center">Turn</th>
              <th className="text-center">Player</th>
              <th className="text-center">Total</th>
              <th className="text-center">Red cube</th>
              <th className="text-left">Events cube</th>
              <th className="text-right">Duration</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {reversedTurns.map((turn, index) => (
              <tr key={turn.turnNumber}>
                <td>
                  <div className="text-center">{turn.turnNumber}</div>
                </td>
                <td className="text-center">{players[turn.playerIndex]}</td>
                <td className="text-center">{turn.cubes.total}</td>
                <td className="text-center text-red">{turn.cubes.redCube}</td>
                <td
                  className={
                    'text-left ' +
                    EventsCubeResult.getColorClass(turn.eventsCube)
                  }
                >
                  {EventsCubeResult.getName(turn.eventsCube)}
                </td>
                <td>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                    }}
                  >
                    {formatTime(turn.turnDuration)}
                  </div>
                </td>
                <td>{getChip(turn.turnNumber, index === 0)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5}></td>
              <td className="text-right">
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
