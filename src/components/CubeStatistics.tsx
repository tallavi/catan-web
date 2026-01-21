import React from 'react'
import { CubesResult } from '../core'

interface CubeStatisticsProps {
  possibleResults: CubesResult[]
  className?: string
}

export const CubeStatistics: React.FC<CubeStatisticsProps> = ({
  possibleResults,
  className,
}) => {
  // Compute counts per total (2..12)
  const counts: Record<number, number> = {}
  for (let total = 2; total <= 12; total++) counts[total] = 0

  possibleResults.forEach((r: CubesResult) => {
    const total = r.total
    counts[total] = (counts[total] || 0) + 1
  })

  const totalCombos = possibleResults.length || 1

  return (
    <div className={className}>
      <h3>Cube Statistics</h3>
      <table className="cube-stats">
        <thead>
          <tr>
            <th>Total</th>
            <th>Count</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(counts).map(k => {
            const t = Number(k)
            const c = counts[t]
            return (
              <tr key={k} className={c === 0 ? 'depleted' : ''}>
                <td>{t}</td>
                <td>{c}</td>
                <td>{((c / totalCombos) * 100).toFixed(1)}%</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default CubeStatistics
