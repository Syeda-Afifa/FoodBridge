import type { MouseEventHandler, ReactNode } from 'react'

export type UiButtonProps = {
  children: ReactNode
  tone?: 'primary' | 'secondary' | 'danger'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  fullWidth?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
}
