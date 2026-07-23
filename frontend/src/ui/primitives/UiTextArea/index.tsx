import { fieldStyle, labelStyle } from '../UiTextInput'
import type { UiTextAreaProps } from './types'

export type { UiTextAreaProps } from './types'

export function UiTextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  required = false,
}: UiTextAreaProps) {
  return (
    <label style={{ display: 'grid', gap: '0.3rem' }}>
      {label && <span style={labelStyle}>{label}</span>}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        aria-label={label}
        style={{ ...fieldStyle, resize: 'vertical' }}
      />
    </label>
  )
}
