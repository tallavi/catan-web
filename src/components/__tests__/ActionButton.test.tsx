import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import { ActionButton } from '../ActionButton'
import React from 'react'

import type { Action } from '../ActionBar'

describe('ActionButton', () => {
  let mockAction: Action

  beforeEach(() => {
    mockAction = {
      label: 'Click Me',
      shortcutDisplay: 'C',
      action: vi.fn(),
      isLongPress: false,
      disabled: false,
      keys: ['c'],
    }
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (prop: string) => {
        if (prop === '--long-press-border-color') return 'black'
        if (prop === '--long-press-border-width') return '4'
        if (prop === '--long-press-duration') return '2000'
        return ''
      },
      borderRadius: '10px',
    } as CSSStyleDeclaration)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('should render the button with the correct label', () => {
    const { getByText } = render(
      <ActionButton action={mockAction} isKeyDown={false} />
    )
    expect(getByText('Click Me')).toBeInTheDocument()
    expect(getByText('C')).toBeInTheDocument()
  })

  it('should call the action on click when not a long press', () => {
    const { getByText } = render(
      <ActionButton action={mockAction} isKeyDown={false} />
    )
    fireEvent.click(getByText('Click Me'))
    expect(mockAction.action).toHaveBeenCalled()
  })

  it('should not call the action on click when it is a long press', () => {
    const longPressAction = {
      ...mockAction,
      isLongPress: true,
      action: vi.fn(),
    }
    const { getByText } = render(
      <ActionButton action={longPressAction} isKeyDown={false} />
    )
    fireEvent.click(getByText('Click Me'))
    expect(longPressAction.action).not.toHaveBeenCalled()
  })

  it('should call the action on long press', async () => {
    vi.useFakeTimers()
    const longPressAction = {
      ...mockAction,
      isLongPress: true,
      action: vi.fn(),
    }
    const { getByText } = render(
      <ActionButton action={longPressAction} isKeyDown={false} />
    )
    const button = getByText('Click Me')
    fireEvent.mouseDown(button)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })
    expect(longPressAction.action).toHaveBeenCalled()
  })

  it('should not call the action if mouse up is on a different button', () => {
    const mockAction2: Action = {
      ...mockAction,
      label: 'Click Me 2',
      action: vi.fn(),
    }
    const { getByText } = render(
      <>
        <ActionButton action={mockAction} isKeyDown={false} />
        <ActionButton action={mockAction2} isKeyDown={false} />
      </>
    )
    const button1 = getByText('Click Me')
    const button2 = getByText('Click Me 2')
    fireEvent.mouseDown(button1)
    fireEvent.mouseEnter(button2)
    fireEvent.mouseUp(button2)
    expect(mockAction.action).not.toHaveBeenCalled()
    expect(mockAction2.action).not.toHaveBeenCalled()
  })
})
