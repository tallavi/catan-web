import React, { useState, useRef, useEffect } from 'react'
import type { Action } from './ActionBar'

export const LONG_PRESS_DURATION = 2000 // 2 seconds

interface ActionButtonProps {
  action: Action
  isKeyDown: boolean
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  action,
  isKeyDown,
}) => {
  const [isPressing, setIsPressing] = useState(false)
  const [progress, setProgress] = useState(0)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  )
  const startTimeRef = useRef<number>(0)

  const startPress = () => {
    if (action.disabled || isPressing) return
    setIsPressing(true)

    if (action.isLongPress) {
      startTimeRef.current = Date.now()
      setProgress(0) // Reset progress on new press
      progressIntervalRef.current = setInterval(() => {
        const elapsedTime = Date.now() - startTimeRef.current
        const currentProgress = Math.min(elapsedTime / LONG_PRESS_DURATION, 1)
        setProgress(currentProgress)
      }, 16)

      timerRef.current = setTimeout(() => {
        action.action()
        resetPress()
      }, LONG_PRESS_DURATION)
    }
  }

  const resetPress = () => {
    setIsPressing(false)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    if (!action.isLongPress && !action.disabled) {
      action.action()
    } else {
      e.preventDefault()
    }
  }

  useEffect(() => {
    if (isKeyDown) {
      startPress()
    } else {
      resetPress()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isKeyDown])

  useEffect(() => {
    return () => resetPress()
  }, [])

  const longPressActive = action.isLongPress && (isPressing || isKeyDown)

  return (
    <button
      ref={buttonRef}
      className={`primary ${longPressActive ? 'long-press-active' : ''}`}
      style={
        {
          '--progress': `${progress * 100}%`,
          position: 'relative', // Needed for child span z-index
        } as React.CSSProperties
      }
      onMouseDown={startPress}
      onMouseUp={resetPress}
      onMouseLeave={resetPress}
      onTouchStart={startPress}
      onTouchEnd={resetPress}
      onClick={handleClick}
      disabled={action.disabled}
    >
      <span style={{ position: 'relative', zIndex: 2 }}>
        {action.label}{' '}
        <span className="kbd">
          {action.shortcutDisplay}
          {action.isLongPress && ' (HOLD)'}
        </span>
      </span>
    </button>
  )
}
