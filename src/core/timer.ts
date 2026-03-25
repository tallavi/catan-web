/**
 * Client-side timer for tracking game and turn durations.
 * Replaces Python's time.time() with browser Date.now()
 */

/**
 * Timer class for tracking elapsed time with pause/resume support
 */
export class Timer {
  private _startTime: number
  private _preexistingDuration: number

  /**
   * Create a new timer
   * @param preexistingDuration - Initial duration in seconds (for loading saved games)
   */
  constructor(preexistingDuration: number = 0) {
    this._preexistingDuration = preexistingDuration
    this._startTime = Date.now()
  }

  /**
   * Get the current duration in seconds
   * @returns Current elapsed time in seconds
   */
  getCurrentDuration(): number {
    // Timer is running - add elapsed time since start/resume
    const elapsedMs = Date.now() - this._startTime
    const elapsedSeconds = elapsedMs / 1000
    return this._preexistingDuration + elapsedSeconds
  }

  /**
   * Reset the timer to zero and start from beginning
   */
  reset(): void {
    this._preexistingDuration = 0
    this._startTime = Date.now()
  }
}

