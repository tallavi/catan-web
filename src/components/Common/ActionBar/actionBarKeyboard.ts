/** True when keyboard shortcuts for {@link ActionBar} should not run (focused field or CodeMirror). */
export function isActionBarKeyboardTargetIgnored(
  target: EventTarget | null
): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  ) {
    return true
  }
  return target.closest('.cm-editor') !== null
}
