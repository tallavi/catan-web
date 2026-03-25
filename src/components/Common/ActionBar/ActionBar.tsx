import React, { useEffect, useState } from 'react'
import { ActionButton } from './ActionButton'
import type { Action } from './ActionBar.types'
import { isActionBarKeyboardTargetIgnored } from './actionBarKeyboard'
import './ActionBar.css'

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
      if (isActionBarKeyboardTargetIgnored(e.target)) {
        return
      }
      if (e.repeat) {
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
      if (isActionBarKeyboardTargetIgnored(e.target)) {
        return
      }
      const targetAction = actions.find(a => a.keys.includes(e.key))
      if (!targetAction) {
        setPressedKeys(prev => prev.filter(k => k !== e.key))
        return
      }

      if (
        !targetAction.isLongPress &&
        !targetAction.disabled &&
        pressedKeys.includes(e.key)
      ) {
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
