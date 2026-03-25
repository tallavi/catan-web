import React from 'react'
import type { RepairSaveController } from '../../core/controllers/concrete/RepairSaveController'

interface RepairSaveViewProps {
  controller: RepairSaveController
}

export const RepairSaveView: React.FC<RepairSaveViewProps> = ({ controller }) => {
  const isStartupRecovery = controller.isStartupRecovery()

  return (
    <div className="view">
      <div className="view-title" style={{ fontSize: '1.2rem' }}>
        Save could not be loaded
      </div>
      <p style={{ textAlign: 'center', marginTop: '1rem' }}>
        This save is invalid or corrupted. A repair editor will be available in a
        future update; for now you can clear site data or fix the JSON in local
        storage under the game save key.
      </p>
      <p style={{ textAlign: 'center', marginTop: '0.75rem' }}>
        isStartupRecovery: <b>{String(isStartupRecovery)}</b>
      </p>
    </div>
  )
}

export default RepairSaveView
