import { UiButton } from '../../ui'
import { StatusBadge } from '../StatusBadge'
import type { RequestListProps } from './types'

export type { RequestListProps } from './types'

export function RequestList({
  requests,
  loading = false,
  box,
  emptyMessage = 'Nothing here yet.',
  onSetStatus,
}: RequestListProps) {
  if (loading) return <p style={messageStyle}>Loading requests…</p>
  if (requests.length === 0) return <p style={messageStyle}>{emptyMessage}</p>

  return (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      {requests.map((request) => (
        <article
          key={request.id}
          style={{
            background: 'white',
            border: '1px solid var(--fb-border)',
            borderRadius: '0.75rem',
            padding: '1rem',
            display: 'grid',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
              {request.listing_title ?? 'Listing removed'}
            </h3>
            <StatusBadge status={request.status} />
          </div>

          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--fb-slate)' }}>
            {box === 'received'
              ? `From ${request.recipient_name ?? 'a recipient'}`
              : 'Your request'}{' '}
            · {new Date(request.created_at).toLocaleString()}
          </p>

          {request.message && (
            <p
              style={{
                margin: 0,
                fontSize: '0.85rem',
                background: 'var(--fb-slate-light)',
                borderRadius: '0.5rem',
                padding: '0.5rem 0.65rem',
              }}
            >
              {request.message}
            </p>
          )}

          {/* Actions only appear while a decision is still open. */}
          {request.status === 'PENDING' && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {box === 'received' ? (
                <>
                  <UiButton onClick={() => onSetStatus(request.id, 'APPROVED')}>Approve</UiButton>
                  <UiButton tone="secondary" onClick={() => onSetStatus(request.id, 'REJECTED')}>
                    Decline
                  </UiButton>
                </>
              ) : (
                <UiButton tone="secondary" onClick={() => onSetStatus(request.id, 'CANCELLED')}>
                  Withdraw request
                </UiButton>
              )}
            </div>
          )}
        </article>
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
