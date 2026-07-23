import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ListingForm } from '../../components/ListingForm'
import { ListingList } from '../../components/ListingList'
import { ListingStats } from '../../components/ListingStats'
import { useMyListings } from '../../hooks/useListings'
import { toErrorMessage } from '../../services/api'
import type { ListingFormValues } from '../../types'
import { UiButton, UiContainer, UiSubtitle, UiTitle } from '../../ui'

/** A donor's dashboard — FR3 (create) and FR10 (view dashboard). */
export function MyListingsPage() {
  const navigate = useNavigate()
  const { listings, loading, error, create } = useMyListings()
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState('')

  const handleCreate = async (values: ListingFormValues) => {
    setFormError('')
    try {
      await create({
        title: values.title,
        description: values.description || null,
        quantity: values.quantity,
        food_type: values.food_type,
        pickup_address: values.pickup_address,
        // datetime-local gives local wall-clock time; toISOString converts it
        // to the UTC instant the API expects.
        expiry_date: new Date(values.expiry_date).toISOString(),
      })
      setShowForm(false)
    } catch (err) {
      setFormError(toErrorMessage(err, 'Could not publish the listing'))
    }
  }

  return (
    <UiContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <UiTitle>Your listings</UiTitle>
          <UiSubtitle>Everything you have offered, including expired and reserved items.</UiSubtitle>
        </div>
        <UiButton onClick={() => setShowForm((open) => !open)}>
          {showForm ? 'Close' : 'Offer food'}
        </UiButton>
      </div>

      {showForm && (
        <section
          style={{
            background: 'white',
            border: '1px solid var(--fb-border)',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1rem',
          }}
        >
          <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>New listing</h2>
          {formError && (
            <p style={{ color: 'var(--fb-red)', fontSize: '0.85rem' }}>{formError}</p>
          )}
          <ListingForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </section>
      )}

      <ListingStats listings={listings} />

      {error && <p style={{ color: 'var(--fb-red)', fontSize: '0.85rem' }}>{error}</p>}

      <ListingList
        listings={listings}
        loading={loading}
        emptyMessage="You have not offered anything yet. Publish your first listing to get started."
        onOpen={(listingId) => navigate(`/listings/${listingId}`)}
      />
    </UiContainer>
  )
}
