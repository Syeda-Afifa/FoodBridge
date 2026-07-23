// App-wide helper types and the labels used to render enums.
import type { FoodType, ListingStatus, RequestStatus, Role } from './api'

export const FOOD_TYPE_LABELS: Record<FoodType, string> = {
  COOKED: 'Cooked meals',
  RAW: 'Raw ingredients',
  PACKAGED: 'Packaged goods',
  BAKERY: 'Bakery',
  PRODUCE: 'Fruit & vegetables',
  OTHER: 'Other',
}

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  AVAILABLE: 'Available',
  RESERVED: 'Reserved',
  COMPLETED: 'Collected',
  CANCELLED: 'Cancelled',
}

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING: 'Awaiting response',
  APPROVED: 'Approved',
  REJECTED: 'Declined',
  CANCELLED: 'Withdrawn',
}

export const ROLE_LABELS: Record<Role, string> = {
  DONOR: 'Donor',
  RECIPIENT: 'Recipient',
  ADMIN: 'Administrator',
}

export type ListingFormValues = {
  title: string
  description: string
  quantity: string
  food_type: FoodType
  pickup_address: string
  expiry_date: string
}
