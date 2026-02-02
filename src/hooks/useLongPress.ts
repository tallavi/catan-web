import { useState, useRef, useEffect } from 'react'
import type { Action } from '../components/ActionBar'

const DELAY_BEFORE_ANIMATION_START_MS = 100

export const useLongPress = (action: Action, duration: number) => {
  const [isPressing, setIsPressing] = useState(false)
  const [progress, setProgress] = useState(0)
  const animationFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isPressing) {
      startTimeRef.current = Date.now()

      const animate = () => {
        const elapsedTime = Date.now() - startTimeRef.current
        const animationDuration = duration - DELAY_BEFORE_ANIMATION_START_MS
        const animationElapsedTime =
          elapsedTime - DELAY_BEFORE_ANIMATION_START_MS
        const currentProgress =
          animationElapsedTime > 0
            ? Math.min(animationElapsedTime / animationDuration, 1)
            : 0
        setProgress(currentProgress)

        if (elapsedTime < duration) {
          animationFrameRef.current = requestAnimationFrame(animate)
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate)
      if (action.isLongPress) {
        timerRef.current = setTimeout(() => {
          action.action()
          setIsPressing(false)
        }, duration)
      }

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        if (timerRef.current) {
          clearTimeout(timerRef.current)
        }
      }
    }
  }, [isPressing, duration, action])

  const startPress = () => {
    if (action.disabled) return
    setIsPressing(true)
  }

  const resetPress = () => {
    setIsPressing(false)
    setProgress(0)
  }

  return {
    isPressing,
    progress,
    startPress,
    resetPress,
  }
}
