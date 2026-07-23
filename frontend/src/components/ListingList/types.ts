import type { ListingResponse } from '../../types/api'

export type ListingListProps = {
  listings: ListingResponse[]
  loading?: boolean
  emptyMessage?: string
  onOpen?: (listingId: string) => void
}
