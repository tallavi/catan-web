import React from 'react'
import '../game.css'
import './App.css'
import { useControllerCoordinator } from './useControllerCoordinator'
import { AppMode } from '../../core/controllers/IController'
import { InProgressController } from '../../core/controllers/InProgressController'
import { PausedController } from '../../core/controllers/PausedController'
import { RepairSaveController } from '../../core/controllers/RepairSaveController'
import { SetupController } from '../../core/controllers/SetupController'
import InProgressView from '../InProgressView/InProgressView'
import PausedView from '../PausedView/PausedView'
import RepairSaveView from '../RepairSaveView/RepairSaveView'
import SetupView from '../SetupView/SetupView'

export const App: React.FC = () => {
  const controller = useControllerCoordinator()

  const renderView = () => {
    if (!controller) {
      return null
    }
    const mode = controller.appMode()
    switch (mode) {
      case AppMode.Setup:
        return <SetupView controller={controller as SetupController} />
      case AppMode.InProgress:
        return (
          <InProgressView controller={controller as InProgressController} />
        )
      case AppMode.Paused:
        return <PausedView controller={controller as PausedController} />
      case AppMode.RepairSave:
        return <RepairSaveView controller={controller as RepairSaveController} />
      default: {
        const _exhaustive: never = mode
        return _exhaustive
      }
    }
  }

  return (
    <div className="game-view">
      <div className="view-content">{renderView()}</div>
    </div>
  )
}

export default App
