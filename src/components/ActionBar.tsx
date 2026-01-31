import React, { useEffect, useState } from 'react'
import { ActionButton } from './ActionButton'

export interface LongPressOptions {
  duration?: number
  strokeWidth?: number
  strokeColor?: string
}

export interface Action {
  label: string
  shortcutDisplay: string
  keys: string[]
  action: () => void
  disabled?: boolean
  isLongPress?: boolean
  longPressOptions?: LongPressOptions
}

interface ActionBarProps {
  actions: Action[]
  debugProgress?: { [key: string]: number }
}

export const ActionBar: React.FC<ActionBarProps> = ({
  actions,
  debugProgress,
}) => {
  const [pressedKeys, setPressedKeys] = useState<string[]>([])

  useEffect(() => {
    const longPressTimers = new Map<string, ReturnType<typeof setTimeout>>()

    const onKeyDown = (e: KeyboardEvent) => {
      setPressedKeys(prev => (prev.includes(e.key) ? prev : [...prev, e.key]))
      const targetAction = actions.find(a => a.keys.includes(e.key))
      if (!targetAction) return
      if (targetAction.disabled) return

      e.preventDefault()
      if (targetAction.isLongPress) {
        if (!longPressTimers.has(targetAction.label)) {
          const timer = setTimeout(() => {
            targetAction.action()
            longPressTimers.delete(targetAction.label)
          }, targetAction.longPressOptions?.duration ?? 2000)
          longPressTimers.set(targetAction.label, timer)
        }
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      setPressedKeys(prev => prev.filter(k => k !== e.key))
      const targetAction = actions.find(a => a.keys.includes(e.key))
      if (!targetAction) return
      if (targetAction.disabled) return

      if (targetAction.isLongPress) {
        if (longPressTimers.has(targetAction.label)) {
          clearTimeout(longPressTimers.get(targetAction.label)!)
          longPressTimers.delete(targetAction.label)
        }
      } else {
        targetAction.action()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      longPressTimers.forEach(timer => clearTimeout(timer))
    }
  }, [actions])

  return (
    <div className="action-bar">
      {actions.map(action => (
        <ActionButton
          key={action.label}
          action={action}
          isKeyDown={action.keys.some(k => pressedKeys.includes(k))}
          debugProgress={debugProgress?.[action.label]}
        />
      ))}
    </div>
  )
}

export default ActionBar
