/**
 * Client-side timer for tracking game and turn durations.
 * Replaces Python's time.time() with browser Date.now()
 */

/**
 * Timer class for tracking elapsed time with pause/resume support
 */
export class Timer {
  private startTime: number
  private pausedAt: number | null = null
  private totalPausedTime: number = 0
  private accumulatedDuration: number

  /**
   * Create a new timer
   * @param initialSeconds - Initial duration in seconds (for loading saved games)
   */
  constructor(initialSeconds: number = 0) {
    this.accumulatedDuration = initialSeconds
    this.startTime = Date.now()
  }

  /**
   * Get the current duration in seconds
   * @returns Current elapsed time in seconds
   */
  getCurrentDuration(): number {
    if (this.pausedAt !== null) {
      // Timer is paused - return duration at pause time
      return this.accumulatedDuration
    }

    // Timer is running - add elapsed time since start/resume
    const elapsedMs = Date.now() - this.startTime - this.totalPausedTime
    const elapsedSeconds = elapsedMs / 1000
    return this.accumulatedDuration + elapsedSeconds
  }

  /**
   * Pause the timer
   * Subsequent calls to getCurrentDuration() will return the same value
   * until resume() is called
   */
  pause(): void {
    if (this.pausedAt === null) {
      // Save current duration and record pause time
      this.accumulatedDuration = this.getCurrentDuration()
      this.pausedAt = Date.now()
    }
  }

  /**
   * Resume the timer after being paused
   * Time spent paused will not count towards the duration
   */
  resume(): void {
    if (this.pausedAt !== null) {
      // Add pause duration to total paused time
      this.totalPausedTime += Date.now() - this.pausedAt
      this.pausedAt = null
    }
  }

  /**
   * Check if the timer is currently paused
   * @returns true if paused, false if running
   */
  isPaused(): boolean {
    return this.pausedAt !== null
  }

  /**
   * Reset the timer to zero and start from beginning
   */
  reset(): void {
    this.accumulatedDuration = 0
    this.startTime = Date.now()
    this.pausedAt = null
    this.totalPausedTime = 0
  }

  /**
   * Set the timer to a specific duration (useful for loading saved state)
   * @param seconds - Duration in seconds to set
   */
  setDuration(seconds: number): void {
    this.accumulatedDuration = seconds
    this.startTime = Date.now()
    this.totalPausedTime = 0
  }
}

/**
 * Format seconds into a human-readable time string (MM:SS or HH:MM:SS)
 * @param seconds - Duration in seconds
 * @returns Formatted time string
 */
export function formatTime(seconds: number): string {
  const totalSeconds = Math.floor(seconds)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60

  if (hours > 0) {
    // Format as HH:MM:SS
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  } else {
    // Format as MM:SS
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
}

/**
 * Format seconds into a detailed string (e.g., "1h 23m 45s")
 * @param seconds - Duration in seconds
 * @returns Detailed formatted time string
 */
export function formatTimeDetailed(seconds: number): string {
  const totalSeconds = Math.floor(seconds)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60

  const parts: string[] = []
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)

  return parts.join(' ')
}
