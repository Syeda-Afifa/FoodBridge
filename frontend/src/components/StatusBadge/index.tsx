import type { CSSProperties } from 'react'
import { LISTING_STATUS_LABELS, REQUEST_STATUS_LABELS } from '../../types'
import type { ListingStatus, RequestStatus } from '../../types/api'
import type { StatusBadgeProps } from './types'

export type { StatusBadgeProps } from './types'

const PALETTE: Record<string, CSSProperties> = {
  AVAILABLE: { background: 'var(--fb-green-light)', color: 'var(--fb-green-dark)' },
  APPROVED: { background: 'var(--fb-green-light)', color: 'var(--fb-green-dark)' },
  RESERVED: { background: 'var(--fb-amber-light)', color: 'var(--fb-amber)' },
  PENDING: { background: 'var(--fb-amber-light)', color: 'var(--fb-amber)' },
  COMPLETED: { background: '#e0e7ff', color: '#4338ca' },
  REJECTED: { background: 'var(--fb-red-light)', color: 'var(--fb-red)' },
  CANCELLED: { background: '#e2e8f0', color: 'var(--fb-slate)' },
  EXPIRED: { background: 'var(--fb-red-light)', color: 'var(--fb-red)' },
}

function labelFor(status: ListingStatus | RequestStatus): string {
  return (
    LISTING_STATUS_LABELS[status as ListingStatus] ??
    REQUEST_STATUS_LABELS[status as RequestStatus] ??
    status
  )
}

export function StatusBadge({ status, expired = false }: StatusBadgeProps) {
  const key = expired ? 'EXPIRED' : status
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.15rem 0.55rem',
        borderRadius: '999px',
        fontSize: '0.72rem',
        fontWeight: 700,
        letterSpacing: '0.02em',
        ...PALETTE[key],
      }}
    >
      {expired ? 'Expired' : labelFor(status)}
    </span>
  )
}
