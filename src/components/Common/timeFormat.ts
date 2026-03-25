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
