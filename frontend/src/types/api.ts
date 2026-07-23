// These types mirror the Pydantic response schemas in backend/app/schemas.
// Keeping them in sync by hand is the trade-off for not generating a client
// from the OpenAPI spec — if you change a backend schema, change it here too.

export type Role = 'DONOR' | 'RECIPIENT' | 'ADMIN'

export type FoodType = 'COOKED' | 'RAW' | 'PACKAGED' | 'BAKERY' | 'PRODUCE' | 'OTHER'

export type ListingStatus = 'AVAILABLE' | 'RESERVED' | 'COMPLETED' | 'CANCELLED'

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export type UserResponse = {
  id: string
  name: string
  email: string
  role: Role
  phone?: string | null
  organization?: string | null
  is_active: boolean
  created_at: string
}

export type ListingResponse = {
  id: string
  donor_id: string
  donor_name?: string | null
  title: string
  description?: string | null
  quantity: string
  food_type: FoodType
  pickup_address: string
  expiry_date: string
  status: ListingStatus
  is_expired: boolean
  request_count: number
  created_at: string
  updated_at: string
}

export type RequestResponse = {
  id: string
  listing_id: string
  listing_title?: string | null
  recipient_id: string
  recipient_name?: string | null
  donor_id?: string | null
  message?: string | null
  status: RequestStatus
  created_at: string
  updated_at: string
}

export type NotificationResponse = {
  id: string
  user_id: string
  message: string
  link?: string | null
  is_read: boolean
  created_at: string
}

export type AuthTokenResponse = {
  access_token: string
  token_type: string
  user_id: string
  email: string
  name: string
  role: Role
  expires_in_minutes: number
}

export type RefreshTokenResponse = {
  access_token: string
  token_type: string
  expires_in_minutes: number
}
