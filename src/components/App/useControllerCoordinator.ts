import { useEffect, useMemo, useState } from 'react'
import { ControllerCoordinator } from '../../core/controllers/ControllerCoordinator'
import type { IController } from '../../core/controllers/IController'

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
