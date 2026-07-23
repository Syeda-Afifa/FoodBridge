import { ListingCard } from '../ListingCard'
import type { ListingListProps } from './types'

export type { ListingListProps } from './types'

export function ListingList({
  listings,
  loading = false,
  emptyMessage = 'No listings yet.',
  onOpen,
}: ListingListProps) {
  if (loading) {
    return <p style={messageStyle}>Loading listings…</p>
  }

  if (listings.length === 0) {
    // An empty screen is an invitation to act, not a dead end.
    return <p style={messageStyle}>{emptyMessage}</p>
  }

  return (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} onOpen={onOpen} />
      ))}
    </div>
  )
}

const messageStyle = {
  color: 'var(--fb-slate)',
  fontSize: '0.9rem',
  background: 'white',
  border: '1px dashed var(--fb-border)',
  borderRadius: '0.75rem',
  padding: '1.5rem',
  textAlign: 'center' as const,
}
