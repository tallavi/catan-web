import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import ActionBar from '../ActionBar'
import type { Action } from '../ActionBar.types'

describe('ActionBar', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('invokes action on shortcut key when focus is outside .cm-editor', () => {
    const action = vi.fn()
    const actions: Action[] = [
      {
        label: 'Go',
        shortcutDisplay: 'Enter',
        keys: ['Enter'],
        action,
      },
    ]
    const { getByTestId } = render(
      <>
        <div data-testid="focus-sink" tabIndex={0} />
        <ActionBar actions={actions} />
      </>
    )
    const sink = getByTestId('focus-sink')
    sink.focus()

    fireEvent.keyDown(sink, { key: 'Enter', bubbles: true })
    fireEvent.keyUp(sink, { key: 'Enter', bubbles: true })

    expect(action).toHaveBeenCalledTimes(1)
  })

  it('does not invoke action when focus is inside .cm-editor', () => {
    const action = vi.fn()
    const actions: Action[] = [
      {
        label: 'Go',
        shortcutDisplay: 'Enter',
        keys: ['Enter'],
        action,
      },
    ]
    const { getByTestId } = render(
      <>
        <div className="cm-editor" data-testid="cm-root">
          <div data-testid="cm-inner" contentEditable suppressContentEditableWarning>
            {}
          </div>
        </div>
        <ActionBar actions={actions} />
      </>
    )
    const inner = getByTestId('cm-inner')
    inner.focus()

    fireEvent.keyDown(inner, { key: 'Enter', bubbles: true })
    fireEvent.keyUp(inner, { key: 'Enter', bubbles: true })

    expect(action).not.toHaveBeenCalled()
  })
})
