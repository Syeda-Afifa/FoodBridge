import { useCallback, useEffect, useState } from 'react'
import { apiService, toErrorMessage } from '../services/api'
import type { RequestResponse, RequestStatus } from '../types/api'

/**
 * Requests for one side of the exchange.
 *
 *   box="sent"     → requests I submitted as a recipient
 *   box="received" → requests other people made on my listings
 */
export function useRequests(box: 'sent' | 'received') {
  const [requests, setRequests] = useState<RequestResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setRequests(await apiService.getRequests(box))
    } catch (err) {
      setError(toErrorMessage(err, 'Could not load requests'))
    } finally {
      setLoading(false)
    }
  }, [box])

  useEffect(() => {
    void load()
  }, [load])

  const setStatus = async (requestId: string, status: RequestStatus) => {
    try {
      await apiService.updateRequest(requestId, status)
      // Approving one request auto-rejects the others on that listing, so a
      // full reload is the only way to show a state the server agrees with.
      await load()
    } catch (err) {
      setError(toErrorMessage(err, 'Could not update the request'))
    }
  }

  return { requests, loading, error, setStatus, reload: load }
}
