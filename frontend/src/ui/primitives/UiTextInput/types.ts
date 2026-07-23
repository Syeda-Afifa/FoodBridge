import type { ChangeEventHandler } from 'react'

export type UiTextInputProps = {
  label?: string
  value: string
  onChange: ChangeEventHandler<HTMLInputElement>
  type?: 'text' | 'email' | 'password' | 'datetime-local' | 'search'
  placeholder?: string
  required?: boolean
  ariaLabel?: string
}
