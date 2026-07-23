import { useNavigate } from 'react-router'
import { ListingList } from '../../components/ListingList'
import { useListings } from '../../hooks/useListings'
import { FOOD_TYPE_LABELS } from '../../types'
import type { FoodType } from '../../types/api'
import { UiContainer, UiSelect, UiSubtitle, UiTextInput, UiTitle } from '../../ui'

const FOOD_TYPE_OPTIONS = (Object.keys(FOOD_TYPE_LABELS) as FoodType[]).map((value) => ({
  value,
  label: FOOD_TYPE_LABELS[value],
}))

/** Browse and search available listings — FR6. */
export function HomePage() {
  const navigate = useNavigate()
  const { listings, filters, setFilters, loading, error } = useListings()

  return (
    <UiContainer>
      <UiTitle>Food available now</UiTitle>
      <UiSubtitle>
        Everything here is still within its collection window. Open a listing to request it.
      </UiSubtitle>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        <UiTextInput
          type="search"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          placeholder="Search by dish, description, or area"
          ariaLabel="Search listings"
        />
        <UiSelect
          value={filters.food_type}
          onChange={(e) => setFilters({ ...filters, food_type: e.target.value as FoodType | '' })}
          options={FOOD_TYPE_OPTIONS}
          placeholder="All food types"
        />
      </div>

      {error && <p style={{ color: 'var(--fb-red)', fontSize: '0.85rem' }}>{error}</p>}

      <ListingList
        listings={listings}
        loading={loading}
        emptyMessage="Nothing available right now. Check back soon, or publish a listing of your own."
        onOpen={(listingId) => navigate(`/listings/${listingId}`)}
      />
    </UiContainer>
  )
}
