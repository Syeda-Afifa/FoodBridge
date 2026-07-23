import { FOOD_TYPE_LABELS } from '../../types'
import type { ListingCardProps } from './types'
import { StatusBadge } from '../StatusBadge'

export type { ListingCardProps } from './types'

/** Human-readable countdown, e.g. "expires in 4h" or "expired". */
export function expiryLabel(expiryIso: string): string {
  const millisecondsLeft = new Date(expiryIso).getTime() - Date.now()
  if (millisecondsLeft <= 0) return 'Expired'

  const hours = Math.floor(millisecondsLeft / 3_600_000)
  if (hours < 1) return `Expires in ${Math.max(1, Math.floor(millisecondsLeft / 60_000))} min`
  if (hours < 24) return `Expires in ${hours}h`
  return `Expires in ${Math.floor(hours / 24)}d`
}

export function ListingCard({ listing, onOpen }: ListingCardProps) {
  return (
    <article
      onClick={() => onOpen?.(listing.id)}
      style={{
        background: 'white',
        border: '1px solid var(--fb-border)',
        borderRadius: '0.75rem',
        padding: '1rem',
        cursor: onOpen ? 'pointer' : 'default',
        display: 'grid',
        gap: '0.5rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{listing.title}</h3>
        <StatusBadge status={listing.status} expired={listing.is_expired} />
      </div>

      {listing.description && (
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--fb-slate)' }}>
          {listing.description}
        </p>
      )}

      <dl
        style={{
          margin: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.4rem 1rem',
          fontSize: '0.8rem',
        }}
      >
        <div>
          <dt style={dtStyle}>Quantity</dt>
          <dd style={ddStyle}>{listing.quantity}</dd>
        </div>
        <div>
          <dt style={dtStyle}>Type</dt>
          <dd style={ddStyle}>{FOOD_TYPE_LABELS[listing.food_type]}</dd>
        </div>
        <div>
          <dt style={dtStyle}>Pickup</dt>
          <dd style={ddStyle}>{listing.pickup_address}</dd>
        </div>
        <div>
          <dt style={dtStyle}>Window</dt>
          <dd style={{ ...ddStyle, color: listing.is_expired ? 'var(--fb-red)' : undefined }}>
            {expiryLabel(listing.expiry_date)}
          </dd>
        </div>
      </dl>

      <footer style={{ fontSize: '0.75rem', color: 'var(--fb-slate)' }}>
        Offered by {listing.donor_name ?? 'a donor'} · {listing.request_count}{' '}
        {listing.request_count === 1 ? 'request' : 'requests'}
      </footer>
    </article>
  )
}

const dtStyle = { fontWeight: 600, color: 'var(--fb-slate)', margin: 0 }
const ddStyle = { margin: 0 }
