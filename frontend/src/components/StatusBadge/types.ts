import type { ListingStatus, RequestStatus } from '../../types/api'

export type StatusBadgeProps = {
  status: ListingStatus | RequestStatus
  expired?: boolean
}
