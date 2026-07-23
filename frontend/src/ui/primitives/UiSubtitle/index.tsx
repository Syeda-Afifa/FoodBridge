import type { UiSubtitleProps } from './types'

export type { UiSubtitleProps } from './types'

export function UiSubtitle({ children }: UiSubtitleProps) {
  return (
    <p style={{ color: 'var(--fb-slate)', fontSize: '0.9rem', margin: '0 0 1rem' }}>{children}</p>
  )
}
