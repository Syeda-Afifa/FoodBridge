import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { expiryLabel } from '../../components/ListingCard'
import { ListingForm } from '../../components/ListingForm'
import { StatusBadge } from '../../components/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { apiService, toErrorMessage } from '../../services/api'
import { FOOD_TYPE_LABELS, type ListingFormValues } from '../../types'
import type { ListingResponse } from '../../types/api'
import { UiButton, UiContainer, UiSubtitle, UiTextArea, UiTitle } from '../../ui'

/**
 * One listing, showing different controls depending on who is looking:
 *   the donor     → edit (FR4) and delete (FR5)
 *   everyone else → request it (FR7)
 */
export function ListingDetailsPage() {
  const { listingId } = useParams<{ listingId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [listing, setListing] = useState<ListingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!listingId) return
    let cancelled = false

    apiService
      .getListingById(listingId)
      .then((data) => {
        if (!cancelled) setListing(data)
      })
      .catch((err) => {
        if (!cancelled) setError(toErrorMessage(err, 'Could not load this listing'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    // Guards against a state update after the user navigates away mid-request.
    return () => {
      cancelled = true
    }
  }, [listingId])

  const isOwner = !!listing && !!user && listing.donor_id === user.userId

  const handleRequest = async () => {
    if (!listing) return
    setError('')
    setNotice('')
    try {
      await apiService.createRequest(listing.id, message)
      setMessage('')
      setNotice('Request sent. The donor will be notified.')
      setListing(await apiService.getListingById(listing.id))
    } catch (err) {
      setError(toErrorMessage(err, 'Could not send the request'))
    }
  }

  const handleUpdate = async (values: ListingFormValues) => {
    if (!listing) return
    const updated = await apiService.updateListing(listing.id, {
      title: values.title,
      description: values.description || null,
      quantity: values.quantity,
      food_type: values.food_type,
      pickup_address: values.pickup_address,
      expiry_date: new Date(values.expiry_date).toISOString(),
    })
    setListing(updated)
    setEditing(false)
  }

  const handleDelete = async () => {
    if (!listing) return
    if (!window.confirm('Remove this listing?')) return
    try {
      await apiService.deleteListing(listing.id)
      navigate('/my-listings')
    } catch (err) {
      setError(toErrorMessage(err, 'Could not remove the listing'))
    }
  }

  if (loading) return <UiContainer>Loading…</UiContainer>
  if (!listing) {
    return (
      <UiContainer>
        <UiTitle>Listing not found</UiTitle>
        <UiSubtitle>{error || 'It may have been collected or removed.'}</UiSubtitle>
        <UiButton tone="secondary" onClick={() => navigate('/')}>
          Back to browse
        </UiButton>
      </UiContainer>
    )
  }

  const canRequest = !isOwner && listing.status === 'AVAILABLE' && !listing.is_expired

  return (
    <UiContainer width="narrow">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
        <UiTitle>{listing.title}</UiTitle>
        <StatusBadge status={listing.status} expired={listing.is_expired} />
      </div>
      <UiSubtitle>
        Offered by {listing.donor_name ?? 'a donor'} · {expiryLabel(listing.expiry_date)}
      </UiSubtitle>

      {editing ? (
        <ListingForm
          initial={listing}
          submitLabel="Save changes"
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          <section
            style={{
              background: 'white',
              border: '1px solid var(--fb-border)',
              borderRadius: '0.75rem',
              padding: '1rem',
              display: 'grid',
              gap: '0.6rem',
              fontSize: '0.88rem',
            }}
          >
            {listing.description && <p style={{ margin: 0 }}>{listing.description}</p>}
            <Row label="Quantity" value={listing.quantity} />
            <Row label="Food type" value={FOOD_TYPE_LABELS[listing.food_type]} />
            <Row label="Pickup address" value={listing.pickup_address} />
            <Row label="Collect before" value={new Date(listing.expiry_date).toLocaleString()} />
            <Row label="Requests" value={String(listing.request_count)} />
          </section>

          {error && <p style={{ color: 'var(--fb-red)', fontSize: '0.85rem' }}>{error}</p>}
          {notice && <p style={{ color: 'var(--fb-green-dark)', fontSize: '0.85rem' }}>{notice}</p>}

          {isOwner ? (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <UiButton onClick={() => setEditing(true)}>Edit listing</UiButton>
              <UiButton tone="danger" onClick={handleDelete}>
                Remove
              </UiButton>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.6rem', marginTop: '1rem' }}>
              <UiTextArea
                label="Message to the donor (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="We can collect within the hour — we run a shelter two streets away."
              />
              <UiButton onClick={handleRequest} disabled={!canRequest}>
                {canRequest ? 'Request this food' : 'No longer available'}
              </UiButton>
            </div>
          )}
        </>
      )}
    </UiContainer>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
      <span style={{ color: 'var(--fb-slate)', fontWeight: 600 }}>{label}</span>
      <span style={{ textAlign: 'right' }}>{value}</span>
    </div>
  )
}
