import React from 'react'
import { EventsCubeResult } from '../core'

interface EventsStatisticsProps {
  possibleEvents: EventsCubeResult[]
  className?: string
}

export const EventsStatistics: React.FC<EventsStatisticsProps> = ({
  possibleEvents,
  className,
}) => {
  const counts: Record<string, number> = {
    GREEN: 0,
    BLUE: 0,
    YELLOW: 0,
    PIRATES: 0,
  }

  possibleEvents.forEach((e: EventsCubeResult) => {
    const name = EventsCubeResult.getName(e)
    counts[name] = (counts[name] || 0) + 1
  })

  const total = possibleEvents.length || 1

  return (
    <div className={className}>
      <h3 className="card-title">Events Statistics</h3>
      <table className="events-stats">
        <thead>
          <tr>
            <th>Event</th>
            <th>Times</th>
            <th>Chance</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(counts).map(k => (
            <tr key={k} className={counts[k] === 0 ? 'depleted' : ''}>
              <td>{k}</td>
              <td>{counts[k]}</td>
              <td>{((counts[k] / total) * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default EventsStatistics
