import React from 'react'
import type { DurationStats } from '../core'
import { formatTimeDetailed } from '../core'

interface DurationStatsProps {
  stats: DurationStats
  className?: string
}

export const DurationStatsView: React.FC<DurationStatsProps> = ({
  stats,
  className,
}) => {
  if (!stats) return null

  return (
    <div className={className}>
      <h3>Duration Statistics</h3>
      <div>Total game duration: {formatTimeDetailed(stats.gameDuration)}</div>
      <div>Current turn: {formatTimeDetailed(stats.currentTurnDuration)}</div>

      <div className="duration-lists">
        <div>
          <h4>Shortest</h4>
          <ul>
            {stats.shortest.map((d, i) => (
              <li key={i}>
                {d.playerName}: {formatTimeDetailed(d.duration)}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4>Longest</h4>
          <ul>
            {stats.longest.map((d, i) => (
              <li key={i}>
                {d.playerName}: {formatTimeDetailed(d.duration)}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4>Average</h4>
          <ul>
            {stats.average.map((d, i) => (
              <li key={i}>
                {d.playerName}: {formatTimeDetailed(d.duration)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default DurationStatsView
