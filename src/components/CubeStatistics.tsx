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
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th className="text-center">Cubes</th>
              <th className="text-center">Times</th>
              <th className="text-right">Chance</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(counts)
              .filter(k => counts[Number(k)] > 0)
              .map(k => {
                const t = Number(k)
                const c = counts[t]
                return (
                  <tr key={k}>
                    <td className="text-center">{t}</td>
                    <td className="text-center">{c}</td>
                    <td className="text-right">
                      {((c / totalCombos) * 100).toFixed(1)}%
                    </td>
                  </tr>
                )
              })}
          </tbody>
          <tfoot>
            <tr>
              <td className="text-center">
                <b>total</b>
              </td>
              <td className="text-center">
                <b>{possibleResults.length}</b>
              </td>
              <td className="text-right">
                <b>100%</b>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

export default CubeStatistics
