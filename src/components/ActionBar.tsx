import React, { useEffect } from 'react'

export interface Action {
  label: string
  shortcutDisplay: string
  keys: string[]
  action: () => void
  disabled?: boolean
}

interface ActionBarProps {
  actions: Action[]
}

export const ActionBar: React.FC<ActionBarProps> = ({ actions }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const targetAction = actions.find(a => a.keys.includes(e.key))
      if (targetAction && !targetAction.disabled) {
        e.preventDefault()
        targetAction.action()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [actions])

  return (
    <div className="action-bar">
      {actions.map(a => (
        <button
          key={a.label}
          className="primary"
          onClick={a.action}
          disabled={a.disabled}
          style={{
            backgroundColor: a.disabled ? 'lightgray' : '',
            cursor: a.disabled ? 'not-allowed' : 'pointer',
            opacity: a.disabled ? 0.5 : 1,
          }}
        >
          {a.label} <span className="kbd">{a.shortcutDisplay}</span>
        </button>
      ))}
    </div>
  )
}

export default ActionBar
