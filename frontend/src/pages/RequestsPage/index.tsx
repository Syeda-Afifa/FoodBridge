import { useState } from 'react'
import { RequestList } from '../../components/RequestList'
import { useRequests } from '../../hooks/useRequests'
import { UiContainer, UiSubtitle, UiTitle } from '../../ui'

/** Both sides of the request conversation — FR7 and FR8. */
export function RequestsPage() {
  const [box, setBox] = useState<'sent' | 'received'>('received')
  const { requests, loading, error, setStatus } = useRequests(box)

  return (
    <UiContainer>
      <UiTitle>Requests</UiTitle>
      <UiSubtitle>
        {box === 'received'
          ? 'People asking for food you have listed. Approving one reserves the listing and declines the rest.'
          : 'Food you have asked for. You can withdraw a request while it is still awaiting a response.'}
      </UiSubtitle>

      <div
        role="tablist"
        style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}
      >
        {(['received', 'sent'] as const).map((option) => (
          <button
            key={option}
            role="tab"
            aria-selected={box === option}
            onClick={() => setBox(option)}
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: '999px',
              border: '1px solid var(--fb-border)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              fontFamily: 'inherit',
              background: box === option ? 'var(--fb-green)' : 'white',
              color: box === option ? 'white' : 'var(--fb-slate)',
            }}
          >
            {option === 'received' ? 'Received' : 'Sent'}
          </button>
        ))}
      </div>

      {error && <p style={{ color: 'var(--fb-red)', fontSize: '0.85rem' }}>{error}</p>}

      <RequestList
        requests={requests}
        loading={loading}
        box={box}
        emptyMessage={
          box === 'received'
            ? 'No one has requested your listings yet.'
            : 'You have not requested anything yet. Browse what is available.'
        }
        onSetStatus={setStatus}
      />
    </UiContainer>
  )
}
