import type { ChangeEventHandler } from 'react'

export type UiTextAreaProps = {
  label?: string
  value: string
  onChange: ChangeEventHandler<HTMLTextAreaElement>
  placeholder?: string
  rows?: number
  required?: boolean
}
