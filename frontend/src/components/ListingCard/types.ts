import type { ListingResponse } from '../../types/api'

export type ListingCardProps = {
  listing: ListingResponse
  onOpen?: (listingId: string) => void
}
