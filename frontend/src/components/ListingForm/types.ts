import type { ListingFormValues } from '../../types'
import type { ListingResponse } from '../../types/api'

export type ListingFormProps = {
  initial?: ListingResponse | null
  submitLabel?: string
  onSubmit: (values: ListingFormValues) => Promise<void>
  onCancel?: () => void
}
