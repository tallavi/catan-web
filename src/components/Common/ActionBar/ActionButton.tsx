import React, { useState, useRef, useEffect } from 'react'
import type { Action } from './ActionBar.types'
import { useLongPress } from '../../../hooks/useLongPress'
import { ProgressBorder } from './ProgressBorder'

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
    strokeColor: 'black',
    strokeWidth: 4,
    duration: 2000,
  })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { isPressing, progress, startPress, resetPress } = useLongPress(
    action,
    styleProps.duration
  )

  const updateStyleProperties = () => {
    if (buttonRef.current) {
      const buttonStyle = window.getComputedStyle(buttonRef.current)
      const duration = parseInt(
        buttonStyle.getPropertyValue('--long-press-duration').trim(),
        10
      )
      setStyleProps({
        strokeColor: buttonStyle
          .getPropertyValue('--long-press-border-color')
          .trim(),
        strokeWidth: parseInt(
          buttonStyle.getPropertyValue('--long-press-border-width').trim(),
          10
        ),
        duration: !isNaN(duration) ? duration : 2000,
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
