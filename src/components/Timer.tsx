import React from 'react'
import { formatTime } from '../core'

interface TimerProps {
  durationSeconds: number
  label?: string
  className?: string
}

export const Timer: React.FC<TimerProps> = ({
  durationSeconds,
  label,
  className,
}) => {
  return (
    <div className={className}>
      {label ? <div className="timer-label">{label}</div> : null}
      <div className="timer-value">{formatTime(durationSeconds)}</div>
    </div>
  )
}

export default Timer
