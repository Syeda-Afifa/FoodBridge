import { useState } from 'react'
import { UiButton, UiSelect, UiTextArea, UiTextInput } from '../../ui'
import { FOOD_TYPE_LABELS, type ListingFormValues } from '../../types'
import type { FoodType } from '../../types/api'
import type { ListingFormProps } from './types'

export type { ListingFormProps } from './types'

/**
 * <input type="datetime-local"> will only accept "YYYY-MM-DDTHH:mm", while
 * the API returns a full ISO string with seconds and a timezone. This trims
 * the value down; without it, editing a listing shows an empty date field.
 */
function toDateTimeLocal(iso?: string): string {
  if (!iso) return ''
  const date = new Date(iso)
  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

const FOOD_TYPE_OPTIONS = (Object.keys(FOOD_TYPE_LABELS) as FoodType[]).map((value) => ({
  value,
  label: FOOD_TYPE_LABELS[value],
}))

export function ListingForm({
  initial = null,
  submitLabel = 'Publish listing',
  onSubmit,
  onCancel,
}: ListingFormProps) {
  const [values, setValues] = useState<ListingFormValues>({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    quantity: initial?.quantity ?? '',
    food_type: initial?.food_type ?? 'COOKED',
    pickup_address: initial?.pickup_address ?? '',
    expiry_date: toDateTimeLocal(initial?.expiry_date),
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof ListingFormValues>(key: K, value: ListingFormValues[K]) =>
    setValues((previous) => ({ ...previous, [key]: value }))

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    // Client-side check for immediate feedback. The backend enforces the same
    // rule independently, because a browser check is a convenience, not a guard.
    if (new Date(values.expiry_date).getTime() <= Date.now()) {
      setError('Pick a collection deadline in the future.')
      return
    }

    setSaving(true)
    try {
      await onSubmit(values)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not save the listing')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
      <UiTextInput
        label="What are you offering?"
        value={values.title}
        onChange={(e) => set('title', e.target.value)}
        placeholder="Rice and curry, 12 boxes"
        required
      />

      <UiTextArea
        label="Details"
        value={values.description}
        onChange={(e) => set('description', e.target.value)}
        placeholder="Prepared this afternoon, kept refrigerated. Containers included."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <UiTextInput
          label="Quantity"
          value={values.quantity}
          onChange={(e) => set('quantity', e.target.value)}
          placeholder="12 boxes / 5 kg"
          required
        />
        <UiSelect
          label="Food type"
          value={values.food_type}
          onChange={(e) => set('food_type', e.target.value as FoodType)}
          options={FOOD_TYPE_OPTIONS}
        />
      </div>

      <UiTextInput
        label="Pickup address"
        value={values.pickup_address}
        onChange={(e) => set('pickup_address', e.target.value)}
        placeholder="House 12, Road 5, Dhanmondi"
        required
      />

      <UiTextInput
        label="Collect before"
        type="datetime-local"
        value={values.expiry_date}
        onChange={(e) => set('expiry_date', e.target.value)}
        required
      />

      {error && <p style={{ color: 'var(--fb-red)', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <UiButton type="submit" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </UiButton>
        {onCancel && (
          <UiButton type="button" tone="secondary" onClick={onCancel}>
            Cancel
          </UiButton>
        )}
      </div>
    </form>
  )
}
