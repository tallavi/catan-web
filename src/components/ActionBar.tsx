import React, { useEffect, useState } from 'react'
import { ActionButton } from './ActionButton'

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
  debugProgress?: { [key: string]: number }
}

export const ActionBar: React.FC<ActionBarProps> = ({
  actions,
  debugProgress,
}) => {
  const [pressedKeys, setPressedKeys] = useState<string[]>([])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return
      }
      const keyIsPressed = pressedKeys.includes(e.key)
      if (keyIsPressed) return

      const targetAction = actions.find(a => a.keys.includes(e.key))
      if (!targetAction) return

      e.preventDefault()
      setPressedKeys(prev => [...prev, e.key])
    }

    const onKeyUp = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return
      }
      const targetAction = actions.find(a => a.keys.includes(e.key))
      if (!targetAction) {
        setPressedKeys(prev => prev.filter(k => k !== e.key))
        return
      }

      if (!targetAction.isLongPress && !targetAction.disabled) {
        targetAction.action()
      }
      setPressedKeys(prev => prev.filter(k => k !== e.key))
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [actions, pressedKeys])

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
