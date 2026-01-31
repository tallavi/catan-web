import React, { useState, useRef, useEffect } from 'react'
import type { Action } from './ActionBar'

const DELAY_BEFORE_ANIMATION_START_MS = 100

const ProgressBorder: React.FC<{
  progress: number
  strokeWidth: number
  strokeColor: string
  buttonRef: React.RefObject<HTMLButtonElement | null>
}> = ({ progress, strokeWidth, strokeColor, buttonRef }) => {
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
    borderRadius: 0,
  })

  useEffect(() => {
    if (buttonRef.current) {
      const parentElement = buttonRef.current
      const { width, height } = parentElement.getBoundingClientRect()
      const computedStyle = window.getComputedStyle(parentElement)
      const borderRadius = parseInt(
        computedStyle.borderRadius.replace('px', ''),
        10
      )
      setDimensions({
        width: width + 1,
        height: height,
        borderRadius: borderRadius,
      })
    }
  }, [strokeWidth, buttonRef])

  const pathData = `
    M ${dimensions.width / 2},${strokeWidth / 2}
    L ${dimensions.width - dimensions.borderRadius},${strokeWidth / 2}
    A ${dimensions.borderRadius - strokeWidth / 2},${
      dimensions.borderRadius - strokeWidth / 2
    } 0 0 1 ${dimensions.width - strokeWidth / 2},${dimensions.borderRadius}
    L ${dimensions.width - strokeWidth / 2},${
      dimensions.height - dimensions.borderRadius
    }
    A ${dimensions.borderRadius - strokeWidth / 2},${
      dimensions.borderRadius - strokeWidth / 2
    } 0 0 1 ${dimensions.width - dimensions.borderRadius},${
      dimensions.height - strokeWidth / 2
    }
    L ${dimensions.borderRadius},${dimensions.height - strokeWidth / 2}
    A ${dimensions.borderRadius - strokeWidth / 2},${
      dimensions.borderRadius - strokeWidth / 2
    } 0 0 1 ${strokeWidth / 2},${dimensions.height - dimensions.borderRadius}
    L ${strokeWidth / 2},${dimensions.borderRadius}
    A ${dimensions.borderRadius - strokeWidth / 2},${
      dimensions.borderRadius - strokeWidth / 2
    } 0 0 1 ${dimensions.borderRadius},${strokeWidth / 2}
    Z
  `

  const pathRef = useRef<SVGPathElement>(null)
  const [perimeter, setPerimeter] = useState<number | null>(null)

  useEffect(() => {
    // When the dimensions of the button change, we need to recalculate the perimeter of the SVG path.
    if (pathRef.current && dimensions.width > 0) {
      const newPerimeter = pathRef.current.getTotalLength()
      setPerimeter(newPerimeter)
    } else {
      setPerimeter(null)
    }
  }, [dimensions.width, dimensions.height])

  return (
    <svg
      width={dimensions.width}
      height={dimensions.height}
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 1,
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      <path
        ref={pathRef}
        d={pathData}
        stroke={
          perimeter === null || dimensions.width === 0
            ? 'transparent'
            : strokeColor
        }
        strokeWidth={strokeWidth}
        fill="transparent"
        strokeDasharray={perimeter ?? 0}
        strokeDashoffset={perimeter ? perimeter * (1 - progress) : 0}
        strokeLinecap="round"
      />
    </svg>
  )
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
  const [isPressing, setIsPressing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [strokeColor, setStrokeColor] = useState('black')
  const [strokeWidth, setStrokeWidth] = useState(4)
  const [duration, setDuration] = useState(2000)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateStyleProperties = () => {
    if (buttonRef.current) {
      const buttonStyle = window.getComputedStyle(buttonRef.current)
      setStrokeColor(
        buttonStyle.getPropertyValue('--long-press-border-color').trim()
      )
      setStrokeWidth(
        parseInt(
          buttonStyle.getPropertyValue('--long-press-border-width').trim(),
          10
        )
      )
      setDuration(
        parseInt(
          buttonStyle.getPropertyValue('--long-press-duration').trim(),
          10
        )
      )
    }
  }

  useEffect(() => {
    if (debugProgress !== undefined) {
      setProgress(debugProgress)
      return
    }

    if (isPressing) {
      startTimeRef.current = Date.now()

      const animate = () => {
        const elapsedTime = Date.now() - startTimeRef.current
        const animationDuration = duration - DELAY_BEFORE_ANIMATION_START_MS
        const animationElapsedTime =
          elapsedTime - DELAY_BEFORE_ANIMATION_START_MS
        const currentProgress =
          animationElapsedTime > 0
            ? Math.min(animationElapsedTime / animationDuration, 1)
            : 0
        setProgress(currentProgress)

        if (elapsedTime < duration) {
          animationFrameRef.current = requestAnimationFrame(animate)
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate)
      timerRef.current = setTimeout(() => {
        action.action()
        resetPress()
      }, duration)

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        if (timerRef.current) {
          clearTimeout(timerRef.current)
        }
      }
    } else {
      setProgress(0)
    }
  }, [isPressing, duration, debugProgress, action])

  const startPress = () => {
    if (action.disabled || (isPressing && !isKeyDown)) return
    updateStyleProperties()
    setIsPressing(true)
  }

  const resetPress = () => {
    setIsPressing(false)
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

  return (
    <button
      ref={buttonRef}
      className={`action-bar-button ${isKeyDown ? 'key-pressed' : ''}`}
      onMouseDown={startPress}
      onMouseUp={resetPress}
      onMouseLeave={resetPress}
      onTouchStart={startPress}
      onTouchEnd={resetPress}
      onClick={handleClick}
      disabled={action.disabled}
    >
      {action.isLongPress && (isPressing || isKeyDown || debugProgress) && (
        <ProgressBorder
          progress={progress}
          strokeWidth={strokeWidth}
          strokeColor={strokeColor}
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
