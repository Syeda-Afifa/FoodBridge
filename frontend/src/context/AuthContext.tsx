import { createContext, useContext, useState, type ReactNode } from 'react'
import type { AuthTokenResponse, Role } from '../types/api'
import { apiService } from '../services/api'

type AuthUser = {
  userId: string
  email: string
  name: string
  role: Role
  expiresInMinutes: number
}

type AuthContextValue = {
  user: AuthUser | null
  login: (data: AuthTokenResponse) => void
  logout: () => void
  refreshUser: (changes: Partial<Pick<AuthUser, 'name'>>) => void
  isAuthenticated: boolean
  isDonor: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  // The initialiser runs once, on mount. Reading localStorage here rather
  // than in an effect means a returning user never sees a logged-out flash.
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem('auth_user')
      return raw ? (JSON.parse(raw) as AuthUser) : null
    } catch {
      return null
    }
  })

  const login = (data: AuthTokenResponse) => {
    const authUser: AuthUser = {
      userId: data.user_id,
      email: data.email,
      name: data.name,
      role: data.role,
      expiresInMinutes: data.expires_in_minutes,
    }
    // The access token is stored separately because the axios interceptor
    // reads it on every request and rewrites it after a silent refresh.
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('auth_user', JSON.stringify(authUser))
    setUser(authUser)
  }

  /**
   * Patch the cached user after a profile edit, so the name in the header
   * updates without forcing a re-login. The access token still carries the
   * old name until it is refreshed, which is harmless — nothing authorises
   * off the name.
   */
  const refreshUser = (changes: Partial<Pick<AuthUser, 'name'>>) => {
    setUser((current) => {
      if (!current) return current
      const next = { ...current, ...changes }
      localStorage.setItem('auth_user', JSON.stringify(next))
      return next
    })
  }

  const logout = () => {
    apiService.logout().finally(() => setUser(null))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        refreshUser,
        isAuthenticated: !!user,
        isDonor: user?.role === 'DONOR' || user?.role === 'ADMIN',
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside an AuthProvider')
  return context
}
