import { useEffect, useState } from 'react'
import type { InProgressController } from '../../core/controllers/InProgressController'

export const useGameTimer = (
  controller: InProgressController,
  dependency: unknown
) => {
  const [turnDuration, setTurnDuration] = useState(() =>
    controller.getTurnTimerSeconds()
  )
  const [gameDuration, setGameDuration] = useState(() =>
    controller.getGameTimerSeconds()
  )

  useEffect(() => {
    const updateDurations = () => {
      setTurnDuration(controller.getTurnTimerSeconds())
      setGameDuration(controller.getGameTimerSeconds())
    }

    updateDurations()

    const interval = setInterval(() => {
      controller.timerTick()
      updateDurations()
    }, 1000)

    return () => clearInterval(interval)
  }, [controller, dependency])

  return { turnDuration, gameDuration }
}
