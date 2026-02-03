export interface Action {
  label: string
  shortcutDisplay: string
  keys: string[]
  action: () => void
  disabled?: boolean
  isLongPress?: boolean
}
