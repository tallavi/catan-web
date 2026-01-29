import { useState, useEffect } from 'react'
import type { GameLogic } from '../core'

export const useGameTimer = (gameLogic: GameLogic, dependency: unknown) => {
  const [turnDuration, setTurnDuration] = useState(
    gameLogic.state.getCurrentTurn().turnDuration
  )
  const [gameDuration, setGameDuration] = useState(
    gameLogic.state.getGameDuration()
  )

  useEffect(() => {
    const updateDurations = () => {
      setTurnDuration(gameLogic.state.getCurrentTurn().turnDuration)
      setGameDuration(gameLogic.state.getGameDuration())
    }

    updateDurations() // Update immediately

    const interval = setInterval(() => {
      gameLogic.timerTick()
      updateDurations()
    }, 1000)

    return () => clearInterval(interval)
  }, [gameLogic, dependency])

  return { turnDuration, gameDuration }
}
