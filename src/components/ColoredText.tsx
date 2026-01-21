import React from 'react'
import { TextRenderer } from '../core'

interface ColoredTextProps {
  text: string
  className?: string
}

export const ColoredText: React.FC<ColoredTextProps> = ({
  text,
  className,
}) => {
  const parts = TextRenderer.parse(text)

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.color === 'default') {
          return <span key={i}>{part.content}</span>
        }
        return (
          <span key={i} className={`text-${part.color}`}>
            {part.content}
          </span>
        )
      })}
    </span>
  )
}

export default ColoredText
