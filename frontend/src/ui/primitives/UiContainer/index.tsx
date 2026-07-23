import type { UiContainerProps } from './types'

export type { UiContainerProps } from './types'

export function UiContainer({ children, width = 'wide' }: UiContainerProps) {
  return (
    <div
      style={{
        maxWidth: width === 'narrow' ? 420 : 960,
        margin: '0 auto',
        padding: '1.5rem 1rem',
      }}
    >
      {children}
    </div>
  )
}
