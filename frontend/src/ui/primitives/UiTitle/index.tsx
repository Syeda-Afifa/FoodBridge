import type { UiTitleProps } from './types'

export type { UiTitleProps } from './types'

export function UiTitle({ children }: UiTitleProps) {
  return (
    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.25rem' }}>{children}</h1>
  )
}
