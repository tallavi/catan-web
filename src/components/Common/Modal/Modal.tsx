import React, { useEffect } from 'react'
import './Modal.css'

interface ModalProps {
  children: React.ReactNode
  width?: string
}

const Modal: React.FC<ModalProps> = ({ children, width }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === ' ') {
        event.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width }}>
        {children}
      </div>
    </div>
  )
}

export default Modal
