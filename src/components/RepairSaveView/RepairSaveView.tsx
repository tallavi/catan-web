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

  const structuralErrors = controller.getStructuralErrors()
  const applyErrors = controller.getApplyErrors()
  const hasBlockingErrors =
    structuralErrors.length > 0 || applyErrors.length > 0 || value.trim() === ''

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
  if (controller.canCancel()) {
    actions.push({
      label: 'Cancel',
      shortcutDisplay: 'Esc',
      keys: ['Escape'],
      isLongPress: true,
      action: () => controller.cancel(),
    })
  }

  const title = isStartupRecovery ? 'Repair Save' : 'Edit Save'

  return (
    <>
      <div className="view repair-save-view">
        <div className="view-title">{title}</div>
        <div className="repair-save-body">
          <div className="repair-save-editor-wrap">
            <CodeMirror
              value={value}
              theme="light"
              minHeight="50vh"
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
          {(structuralErrors.length > 0 || applyErrors.length > 0) && (
            <div className="repair-save-errors card" role="alert">
              {structuralErrors.length > 0 && (
                <div className="repair-save-error-group">
                  <div className="repair-save-error-heading">
                    JSON / save shape
                  </div>
                  <ul className="repair-save-error-list">
                    {structuralErrors.map((msg, i) => (
                      <li key={`s-${i}`} className="repair-save-error-line">
                        {msg}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {applyErrors.length > 0 && (
                <div className="repair-save-error-group">
                  <div className="repair-save-error-heading">Game state</div>
                  <ul className="repair-save-error-list">
                    {applyErrors.map((msg, i) => (
                      <li key={`a-${i}`} className="repair-save-error-line">
                        {msg}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <ActionBar actions={actions} />
    </>
  )
}

export default RepairSaveView
