/** Defensive parsing when `getComputedStyle` or props omit or invalidate values (e.g. test env). */
export class CssFallback {
  static positiveIntOr(source: string | number, fallback: number): number {
    const n =
      typeof source === 'string' ? parseInt(source.trim(), 10) : source
    return Number.isFinite(n) && n > 0 ? n : fallback
  }

  static nonEmptyTrimmedOr(raw: string, fallback: string): string {
    const t = raw.trim()
    return t.length > 0 ? t : fallback
  }
}
