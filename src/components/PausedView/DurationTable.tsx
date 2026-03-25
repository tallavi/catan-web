import React from 'react'
import type { Duration } from '../../core'
import { formatTime } from '../Common/timeFormat'

interface DurationTableProps {
  title: string
  data: Duration[]
}

export const DurationTable: React.FC<DurationTableProps> = ({
  title,
  data,
}) => {
  return (
    <div>
      <div className="table-title">{title}</div>
      <table className="table">
        <thead>
          <tr>
            <th className="text-left">Player name</th>
            <th className="text-right">Duration</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={i}>
              <td className="text-left">{d.playerName}</td>
              <td className="text-right">{formatTime(d.duration)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DurationTable
