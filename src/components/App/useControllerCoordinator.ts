import { useEffect, useMemo, useState } from 'react'
import {
  ControllerCoordinator,
  type IController,
} from '../../core/controllers/coordinator/ControllerCoordinator'

export function useControllerCoordinator(): IController | null {
  const [controller, setController] = useState<IController | null>(null)

  const coordinator = useMemo(
    () => new ControllerCoordinator(setController),
    []
  )

  useEffect(() => {
    setController(coordinator.createInitialController())
  }, [coordinator])

  return controller
}
