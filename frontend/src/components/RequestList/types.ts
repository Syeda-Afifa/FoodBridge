import type { RequestResponse, RequestStatus } from '../../types/api'

export type RequestListProps = {
  requests: RequestResponse[]
  loading?: boolean
  box: 'sent' | 'received'
  emptyMessage?: string
  onSetStatus: (requestId: string, status: RequestStatus) => void
}
