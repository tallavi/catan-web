import { useState, useEffect } from 'react'
import type { GameLogic } from '../core'

export const useGameTimer = (gameLogic: GameLogic) => {
  const [turnDuration, setTurnDuration] = useState(
    gameLogic.turnTimerInstance.getCurrentDuration()
  )
  const [gameDuration, setGameDuration] = useState(
    gameLogic.state.getGameDuration()
  )

  useEffect(() => {
    const interval = setInterval(() => {
      gameLogic.timerTick()
      setTurnDuration(gameLogic.state.getCurrentTurn().turnDuration)
      setGameDuration(gameLogic.state.getGameDuration())
    }, 1000)

    return () => clearInterval(interval)
  }, [gameLogic])

  return { turnDuration, gameDuration }
}
