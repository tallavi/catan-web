import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import Modal from '../Modal'

describe('Modal', () => {
  it('should render its children', () => {
    const { getByText } = render(
      <Modal>
        <div>Modal Content</div>
      </Modal>
    )
    expect(getByText('Modal Content')).toBeInTheDocument()
  })

  it('should prevent the default action for spacebar keydown events', () => {
    render(
      <Modal>
        <div>Modal Content</div>
      </Modal>
    )

    const event = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
      cancelable: true,
    })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    fireEvent(window, event)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('should not prevent the default action for other keydown events', () => {
    render(
      <Modal>
        <div>Modal Content</div>
      </Modal>
    )

    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    fireEvent(window, event)

    expect(preventDefaultSpy).not.toHaveBeenCalled()
  })
})
