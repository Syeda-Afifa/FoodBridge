import type { ChangeEventHandler } from 'react'

export type UiSelectOption = { value: string; label: string }

export type UiSelectProps = {
  label?: string
  value: string
  onChange: ChangeEventHandler<HTMLSelectElement>
  options: UiSelectOption[]
  placeholder?: string
}
