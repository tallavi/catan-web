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

  const eventResultByName: Record<string, EventsCubeResult> = {
    GREEN: EventsCubeResult.GREEN,
    BLUE: EventsCubeResult.BLUE,
    YELLOW: EventsCubeResult.YELLOW,
    PIRATES: EventsCubeResult.PIRATES,
  }

  return (
    <div className={className}>
      <table className="events-stats">
        <thead>
          <tr>
            <th className="text-left">Event</th>
            <th className="text-center">Times</th>
            <th className="text-right">Chance</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(counts).map(k => (
            <tr key={k} className={counts[k] === 0 ? 'depleted' : ''}>
              <td
                className={`text-left ${EventsCubeResult.getColorClass(
                  eventResultByName[k]
                )}`}
              >
                {k}
              </td>
              <td className="text-center">{counts[k]}</td>
              <td className="text-right">
                {((counts[k] / total) * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="text-left">
              <b>total</b>
            </td>
            <td className="text-center">
              <b>{possibleEvents.length}</b>
            </td>
            <td className="text-right">
              <b>100%</b>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

export default EventsStatistics
