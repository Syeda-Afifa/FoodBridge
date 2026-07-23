import { fieldStyle, labelStyle } from '../UiTextInput'
import type { UiSelectProps } from './types'

export type { UiSelectOption, UiSelectProps } from './types'

export function UiSelect({ label, value, onChange, options, placeholder }: UiSelectProps) {
  return (
    <label style={{ display: 'grid', gap: '0.3rem' }}>
      {label && <span style={labelStyle}>{label}</span>}
      <select value={value} onChange={onChange} aria-label={label} style={fieldStyle}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
