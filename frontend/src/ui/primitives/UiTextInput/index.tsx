import type { CSSProperties } from 'react'
import type { UiTextInputProps } from './types'

export type { UiTextInputProps } from './types'

export const fieldStyle: CSSProperties = {
  padding: '0.55rem 0.75rem',
  border: '1px solid var(--fb-border)',
  borderRadius: '0.5rem',
  fontSize: '0.9rem',
  width: '100%',
  fontFamily: 'inherit',
  background: 'white',
}

export const labelStyle: CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--fb-slate)',
}

export function UiTextInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  ariaLabel,
}: UiTextInputProps) {
  return (
    <label style={{ display: 'grid', gap: '0.3rem' }}>
      {label && <span style={labelStyle}>{label}</span>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        aria-label={ariaLabel ?? label}
        style={fieldStyle}
      />
    </label>
  )
}
