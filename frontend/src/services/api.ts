import axios from 'axios'
import type { AxiosInstance } from 'axios'
import type {
  AuthTokenResponse,
  FoodType,
  ListingResponse,
  ListingStatus,
  NotificationResponse,
  RefreshTokenResponse,
  RequestResponse,
  RequestStatus,
  Role,
  UserResponse,
} from '../types/api'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '/api'

const axiosClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  // Required so the browser sends the httpOnly refresh_token cookie
  // on the call to /auth/refresh.
  withCredentials: true,
})

// ── Request interceptor — attach the bearer token ────────────────────────────
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

// ── Response interceptor — silent refresh on 401 ─────────────────────────────
//
//   1. any request comes back 401 (the access token expired)
//   2. this interceptor calls POST /auth/refresh; the browser attaches the
//      httpOnly cookie by itself, so no token handling happens in JS
//   3. the new access token is stored and the original request is replayed
//   4. if the refresh ALSO fails, the session is genuinely over → sign out
//
// _retry guards against an infinite loop, and the queue makes sure that when
// five requests fail at once we refresh once rather than five times.

let isRefreshing = false
let pendingQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token)
    else reject(error)
  })
  pendingQueue = []
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (
      error.response?.status !== 401 ||
      original?._retry ||
      original?.url?.includes('/auth/refresh') ||
      original?.url?.includes('/auth/login') ||
      original?.url?.includes('/auth/register')
    ) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            original.headers['Authorization'] = `Bearer ${token}`
            resolve(axiosClient(original))
          },
          reject,
        })
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const { data } = await axiosClient.post<RefreshTokenResponse>('/auth/refresh')
      localStorage.setItem('access_token', data.access_token)
      original.headers['Authorization'] = `Bearer ${data.access_token}`
      processQueue(null, data.access_token)
      return axiosClient(original)
    } catch (refreshError) {
      processQueue(refreshError, null)
      localStorage.removeItem('access_token')
      localStorage.removeItem('auth_user')
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

// ── The single place every HTTP call in the app is defined ───────────────────
// Components never import axios directly. That way a change to a URL or a
// payload shape is a one-line edit here instead of a hunt across the codebase.

export const apiService = {
  // Auth — FR1, FR2
  async register(payload: {
    name: string
    email: string
    password: string
    role: Role
    phone?: string
    organization?: string
  }): Promise<AuthTokenResponse> {
    const response = await axiosClient.post<AuthTokenResponse>('/auth/register', payload)
    return response.data
  },

  async login(email: string, password: string): Promise<AuthTokenResponse> {
    const response = await axiosClient.post<AuthTokenResponse>('/auth/login', { email, password })
    return response.data
  },

  async logout(): Promise<void> {
    await axiosClient.post('/auth/logout').catch(() => {
      /* a failed logout should never block the UI from clearing itself */
    })
    localStorage.removeItem('access_token')
    localStorage.removeItem('auth_user')
  },

  async me(): Promise<UserResponse> {
    const response = await axiosClient.get<UserResponse>('/auth/me')
    return response.data
  },

  // Own profile — FR11
  async getMe(): Promise<UserResponse> {
    const response = await axiosClient.get<UserResponse>('/auth/me')
    return response.data
  },

  async updateMe(changes: {
    name?: string
    phone?: string | null
    organization?: string | null
  }): Promise<UserResponse> {
    const response = await axiosClient.put<UserResponse>('/auth/me', changes)
    return response.data
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await axiosClient.put('/auth/me/password', {
      current_password: currentPassword,
      new_password: newPassword,
    })
  },

  // Admin — user management (admin only)
  async listUsers(): Promise<UserResponse[]> {
    const response = await axiosClient.get<UserResponse[]>('/auth/users')
    return response.data
  },

  async setUserStatus(userId: string, isActive: boolean): Promise<UserResponse> {
    const response = await axiosClient.put<UserResponse>(
      `/auth/users/${userId}/status`,
      null,
      { params: { is_active: isActive } },
    )
    return response.data
  },

  // Food listings — FR3, FR4, FR5, FR6
  async getListings(params?: {
    search?: string
    food_type?: FoodType | ''
    status?: ListingStatus | ''
  }): Promise<ListingResponse[]> {
    const query: Record<string, string> = {}
    if (params?.search) query.search = params.search
    if (params?.food_type) query.food_type = params.food_type
    if (params?.status) query.status = params.status

    const response = await axiosClient.get<ListingResponse[]>('/food', { params: query })
    return response.data
  },

  async getMyListings(): Promise<ListingResponse[]> {
    const response = await axiosClient.get<ListingResponse[]>('/food/mine')
    return response.data
  },

  async getListingById(listingId: string): Promise<ListingResponse> {
    const response = await axiosClient.get<ListingResponse>(`/food/${listingId}`)
    return response.data
  },

  async createListing(payload: {
    title: string
    description?: string | null
    quantity: string
    food_type: FoodType
    pickup_address: string
    expiry_date: string
  }): Promise<ListingResponse> {
    const response = await axiosClient.post<ListingResponse>('/food', payload)
    return response.data
  },

  async updateListing(
    listingId: string,
    payload: Partial<{
      title: string
      description: string | null
      quantity: string
      food_type: FoodType
      pickup_address: string
      expiry_date: string
      status: ListingStatus
    }>,
  ): Promise<ListingResponse> {
    const response = await axiosClient.put<ListingResponse>(`/food/${listingId}`, payload)
    return response.data
  },

  async deleteListing(listingId: string): Promise<void> {
    await axiosClient.delete(`/food/${listingId}`)
  },

  // Requests — FR7, FR8
  async createRequest(listingId: string, message?: string): Promise<RequestResponse> {
    const response = await axiosClient.post<RequestResponse>('/requests', {
      listing_id: listingId,
      message: message || null,
    })
    return response.data
  },

  async getRequests(box: 'sent' | 'received'): Promise<RequestResponse[]> {
    const response = await axiosClient.get<RequestResponse[]>('/requests', { params: { box } })
    return response.data
  },

  async updateRequest(requestId: string, status: RequestStatus): Promise<RequestResponse> {
    const response = await axiosClient.put<RequestResponse>(`/requests/${requestId}`, { status })
    return response.data
  },

  // Notifications
  async getNotifications(): Promise<NotificationResponse[]> {
    const response = await axiosClient.get<NotificationResponse[]>('/notifications')
    return response.data
  },

  async markNotificationRead(notificationId: string): Promise<NotificationResponse> {
    const response = await axiosClient.put<NotificationResponse>(
      `/notifications/${notificationId}/read`,
    )
    return response.data
  },
}

// Turns an axios error into something worth showing a user.
export function toErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg)
  }
  return fallback
}
