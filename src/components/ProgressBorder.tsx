import React, { useState, useRef, useEffect } from 'react'

export const ProgressBorder: React.FC<{
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
