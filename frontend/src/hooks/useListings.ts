import { useCallback, useEffect, useState } from 'react'
import { apiService, toErrorMessage } from '../services/api'
import type { FoodType, ListingResponse, ListingStatus } from '../types/api'

export type ListingFilters = {
  search: string
  food_type: FoodType | ''
  status: ListingStatus | ''
}

/**
 * Owns everything about the browse screen: the listings, the filters, the
 * loading flag, and the error string.
 *
 * The pages stay declarative because all the async bookkeeping lives here,
 * and the same hook can be reused by any screen that lists listings.
 */
export function useListings(initialFilters?: Partial<ListingFilters>) {
  const [listings, setListings] = useState<ListingResponse[]>([])
  const [filters, setFilters] = useState<ListingFilters>({
    search: '',
    food_type: '',
    status: '',
    ...initialFilters,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setListings(await apiService.getListings(filters))
    } catch (err) {
      setError(toErrorMessage(err, 'Could not load listings'))
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Debounced so typing in the search box does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(load, 250)
    return () => clearTimeout(timer)
  }, [load])

  return { listings, filters, setFilters, loading, error, reload: load }
}

/** A donor's own listings, with create / update / delete attached. */
export function useMyListings() {
  const [listings, setListings] = useState<ListingResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setListings(await apiService.getMyListings())
    } catch (err) {
      setError(toErrorMessage(err, 'Could not load your listings'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const create = async (payload: Parameters<typeof apiService.createListing>[0]) => {
    const created = await apiService.createListing(payload)
    setListings((previous) => [created, ...previous])
    return created
  }

  const update = async (
    listingId: string,
    payload: Parameters<typeof apiService.updateListing>[1],
  ) => {
    const updated = await apiService.updateListing(listingId, payload)
    setListings((previous) => previous.map((l) => (l.id === updated.id ? updated : l)))
    return updated
  }

  const remove = async (listingId: string) => {
    await apiService.deleteListing(listingId)
    // The backend cancels rather than deletes a listing that has an approved
    // request, so reload instead of assuming the row disappeared.
    await load()
  }

  return { listings, loading, error, create, update, remove, reload: load }
}
