import type { ReactNode } from 'react'
import type { Role } from './types/api'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'

import { AuthProvider, useAuth } from './context/AuthContext'
import { AppLayout } from './layouts/AppLayout'
import { AboutPage } from './pages/AboutPage'
import { AdminPage } from './pages/AdminPage'
import { HomePage } from './pages/HomePage'
import { ListingDetailsPage } from './pages/ListingDetailsPage'
import { LoginPage } from './pages/LoginPage'
import { MyListingsPage } from './pages/MyListingsPage'
import { ProfilePage } from './pages/ProfilePage'
import { RequestsPage } from './pages/RequestsPage'
import { SignupPage } from './pages/SignupPage'

/**
 * Route guard. Anything wrapped in this redirects to /login when there is no
 * session, so a protected page never renders and then flashes away.
 */
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

/**
 * Role guard. Renders its children only when the signed-in user holds one of
 * the allowed roles; anyone else is sent back to Browse. The matching backend
 * dependency (require_admin) enforces the same rule server-side, so this is a
 * navigation convenience, not the security boundary.
 */
function RoleRoute({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return allow.includes(user.role) ? <>{children}</> : <Navigate to="/" replace />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          <Route element={<AppLayout />}>
            <Route
              index
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="listings/:listingId"
              element={
                <ProtectedRoute>
                  <ListingDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="my-listings"
              element={
                <RoleRoute allow={['DONOR', 'ADMIN']}>
                  <MyListingsPage />
                </RoleRoute>
              }
            />
            <Route
              path="admin"
              element={
                <RoleRoute allow={['ADMIN']}>
                  <AdminPage />
                </RoleRoute>
              }
            />
            <Route
              path="requests"
              element={
                <ProtectedRoute>
                  <RequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="about" element={<AboutPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
