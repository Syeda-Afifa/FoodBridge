import type { CSSProperties } from 'react'
import type { UiButtonProps } from './types'

export type { UiButtonProps } from './types'

const TONES: Record<NonNullable<UiButtonProps['tone']>, CSSProperties> = {
  primary: { background: 'var(--fb-green)', color: 'white', border: '1px solid transparent' },
  secondary: { background: 'white', color: 'var(--fb-slate)', border: '1px solid var(--fb-border)' },
  danger: { background: 'var(--fb-red)', color: 'white', border: '1px solid transparent' },
}

export function UiButton({
  children,
  tone = 'primary',
  type = 'button',
  disabled = false,
  fullWidth = false,
  onClick,
}: UiButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: '0.55rem 1.1rem',
        borderRadius: '0.5rem',
        fontWeight: 600,
        fontSize: '0.9rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        width: fullWidth ? '100%' : undefined,
        ...TONES[tone],
      }}
    >
      {children}
    </button>
  )
}
