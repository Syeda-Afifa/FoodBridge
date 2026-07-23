import type { ListingStatsProps } from './types'

export type { ListingStatsProps } from './types'

/**
 * FR10 — the dashboard summary.
 *
 * Computed in the browser from data already fetched, rather than added as a
 * separate stats endpoint. One less round trip, and the numbers can never
 * disagree with the list shown directly beneath them.
 */
export function ListingStats({ listings }: ListingStatsProps) {
  const available = listings.filter((l) => l.status === 'AVAILABLE' && !l.is_expired).length
  const reserved = listings.filter((l) => l.status === 'RESERVED').length
  const expired = listings.filter((l) => l.is_expired).length
  const requests = listings.reduce((total, l) => total + l.request_count, 0)

  const stats = [
    { label: 'Available now', value: available },
    { label: 'Reserved', value: reserved },
    { label: 'Expired', value: expired },
    { label: 'Requests received', value: requests },
  ]

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '0.75rem',
        marginBottom: '1rem',
      }}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          style={{
            background: 'white',
            border: '1px solid var(--fb-border)',
            borderRadius: '0.75rem',
            padding: '0.85rem',
          }}
        >
          <div style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>{stat.value}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--fb-slate)', marginTop: '0.25rem' }}>
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  )
}
