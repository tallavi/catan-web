import React, { useEffect, useState } from 'react'
import { ActionButton, LONG_PRESS_DURATION } from './ActionButton'

export interface Action {
  label: string
  shortcutDisplay: string
  keys: string[]
  action: () => void
  disabled?: boolean
  isLongPress?: boolean
}

interface ActionBarProps {
  actions: Action[]
}

export const ActionBar: React.FC<ActionBarProps> = ({ actions }) => {
  const [longPressKey, setLongPressKey] = useState<string | null>(null)

  useEffect(() => {
    const longPressTimers = new Map<string, ReturnType<typeof setTimeout>>()

    const onKeyDown = (e: KeyboardEvent) => {
      const targetAction = actions.find(a => a.keys.includes(e.key))
      if (targetAction && !targetAction.disabled) {
        e.preventDefault()
        if (targetAction.isLongPress) {
          if (!longPressTimers.has(targetAction.label)) {
            setLongPressKey(e.key)
            const timer = setTimeout(() => {
              targetAction.action()
              longPressTimers.delete(targetAction.label)
              setLongPressKey(null)
            }, LONG_PRESS_DURATION)
            longPressTimers.set(targetAction.label, timer)
          }
        } else {
          targetAction.action()
        }
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      const targetAction = actions.find(a => a.keys.includes(e.key))
      if (targetAction && targetAction.isLongPress) {
        if (longPressTimers.has(targetAction.label)) {
          clearTimeout(longPressTimers.get(targetAction.label)!)
          longPressTimers.delete(targetAction.label)
          setLongPressKey(null)
        }
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
          isKeyDown={action.keys.includes(longPressKey ?? '')}
        />
      ))}
    </div>
  )
}

export default ActionBar
