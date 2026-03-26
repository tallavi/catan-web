import React, { useMemo, useReducer, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { json, jsonParseLinter } from '@codemirror/lang-json'
import { lintGutter, linter } from '@codemirror/lint'
import type { RepairSaveController } from '../../core/controllers/concrete/RepairSaveController'
import ActionBar from '../Common/ActionBar/ActionBar'
import type { Action } from '../Common/ActionBar/ActionBar.types'
import './RepairSaveView.css'

interface RepairSaveViewProps {
  controller: RepairSaveController
}

export const RepairSaveView: React.FC<RepairSaveViewProps> = ({
  controller,
}) => {
  const isStartupRecovery = controller.isStartupRecovery()
  const [value, setValue] = useState(() => controller.getRawSaveText())
  const [, invalidate] = useReducer((n: number) => n + 1, 0)

  const extensions = useMemo(
    () => [json(), lintGutter(), linter(jsonParseLinter())],
    []
  )

  const handleChange = (text: string) => {
    setValue(text)
    controller.setRawSaveText(text)
    invalidate()
  }

  const errors = controller.getErrors()
  const hasBlockingErrors = errors.length > 0 || value.trim() === ''

  const actions: Action[] = []
  actions.push({
    label: 'Apply',
    shortcutDisplay: 'Enter',
    keys: ['Enter'],
    isLongPress: true,
    disabled: hasBlockingErrors,
    action: () => {
      controller.apply()
      invalidate()
    },
  })
  if (isStartupRecovery) {
    actions.push({
      label: 'Clear',
      shortcutDisplay: 'c',
      keys: ['c'],
      isLongPress: true,
      action: () => controller.clear(),
    })
  }
  if (controller.canCancel()) {
    actions.push({
      label: 'Cancel',
      shortcutDisplay: 'Esc',
      keys: ['Escape'],
      isLongPress: true,
      action: () => controller.cancel(),
    })
  }

  const title = isStartupRecovery ? 'REPAIR SAVE' : 'EDIT SAVE'

  return (
    <>
      <div className="view repair-save-view">
        <div className="view-title">{title}</div>
        <div className="repair-save-body">
          <div className="repair-save-editor-wrap">
            <CodeMirror
              value={value}
              theme="light"
              className="repair-save-cm"
              extensions={extensions}
              onChange={handleChange}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true,
              }}
            />
          </div>
          {errors.length > 0 && (
            <div className="repair-save-errors card" role="alert">
              <div className="repair-save-error-group">
                <ul className="repair-save-error-list">
                  {errors.map((msg, i) => (
                    <li key={`s-${i}`} className="repair-save-error-line">
                      {msg}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
      <ActionBar actions={actions} />
    </>
  )
}

export default RepairSaveView
