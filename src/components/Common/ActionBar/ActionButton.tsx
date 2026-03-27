import React, { useState, useRef, useEffect } from 'react'
import type { Action } from './ActionBar.types'
import { useLongPress } from './useLongPress'
import { ProgressBorder } from './ProgressBorder'
import { CssFallback } from '../../../utils/CssFallback'
import './ActionButton.css'

/** Matches defaults in ActionButton.css; used when getComputedStyle omits or invalidates custom props (e.g. test env). */
type LongPressStyle = {
  strokeColor: string
  strokeWidth: number
  duration: number
}

const DEFAULT_LONG_PRESS_STYLE: LongPressStyle = {
  strokeColor: 'black',
  strokeWidth: 4,
  duration: 2000,
}

interface ActionButtonProps {
  action: Action
  isKeyDown: boolean
  debugProgress?: number
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  action,
  isKeyDown,
  debugProgress,
}) => {
  const [styleProps, setStyleProps] = useState({
    strokeColor: DEFAULT_LONG_PRESS_STYLE.strokeColor,
    strokeWidth: DEFAULT_LONG_PRESS_STYLE.strokeWidth,
    duration: DEFAULT_LONG_PRESS_STYLE.duration,
  })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { isPressing, progress, startPress, resetPress } = useLongPress(
    action,
    styleProps.duration
  )

  const updateStyleProperties = () => {
    if (buttonRef.current) {
      const buttonStyle = window.getComputedStyle(buttonRef.current)
      setStyleProps({
        strokeColor: CssFallback.nonEmptyTrimmedOr(
          buttonStyle.getPropertyValue('--long-press-border-color'),
          DEFAULT_LONG_PRESS_STYLE.strokeColor
        ),
        strokeWidth: CssFallback.positiveIntOr(
          buttonStyle.getPropertyValue('--long-press-border-width'),
          DEFAULT_LONG_PRESS_STYLE.strokeWidth
        ),
        duration: CssFallback.positiveIntOr(
          buttonStyle.getPropertyValue('--long-press-duration'),
          DEFAULT_LONG_PRESS_STYLE.duration
        ),
      })
    }
  }

  const startPressWithUpdate = () => {
    if (action.disabled || (isPressing && !isKeyDown)) return
    updateStyleProperties()
    startPress()
  }

  const handleClick = () => {
    if (!action.isLongPress && !action.disabled) {
      action.action()
    }
  }

  useEffect(() => {
    if (isKeyDown) {
      startPressWithUpdate()
    } else {
      resetPress()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isKeyDown])

  return (
    <button
      ref={buttonRef}
      className={`action-bar-button ${isKeyDown ? 'key-pressed' : ''}`}
      onMouseDown={startPressWithUpdate}
      onMouseUp={resetPress}
      onMouseLeave={resetPress}
      onTouchStart={startPressWithUpdate}
      onTouchEnd={resetPress}
      onClick={handleClick}
      disabled={action.disabled}
    >
      {action.isLongPress && (isPressing || isKeyDown || debugProgress) && (
        <ProgressBorder
          progress={debugProgress ?? progress}
          strokeWidth={styleProps.strokeWidth}
          strokeColor={styleProps.strokeColor}
          buttonRef={buttonRef}
        />
      )}
      <span style={{ position: 'relative', zIndex: 2 }}>
        {action.label}{' '}
        <span className="action-bar-button-keyboard-shortcut">
          {action.shortcutDisplay}
          {action.isLongPress && ' (HOLD)'}
        </span>
      </span>
    </button>
  )
}
