import type { CSSProperties } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { ROLE_LABELS } from '../types'

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const isAdmin = user?.role === 'ADMIN'
  const isDonorRole = user?.role === 'DONOR'
  const canPost = isDonorRole || isAdmin

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLinkStyle = ({ isActive }: { isActive: boolean }): CSSProperties => ({
    fontWeight: isActive ? 700 : 500,
    color: isActive ? 'var(--fb-green-dark)' : 'var(--fb-slate)',
    textDecoration: 'none',
    fontSize: '0.9rem',
  })

  return (
    <div style={{ minHeight: '100vh' }}>
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          padding: '0.85rem 1.25rem',
          background: 'white',
          borderBottom: '1px solid var(--fb-border)',
          flexWrap: 'wrap',
        }}
      >
        <strong style={{ fontSize: '1.05rem', color: 'var(--fb-green-dark)' }}>FoodBridge</strong>

        {/* The menu is built from the signed-in role, so each persona in
            docs/09-user-persons.md sees only the screens that apply to them.
            This is presentation only — every endpoint is guarded on the
            backend as well. */}
        <NavLink to="/" style={navLinkStyle}>
          Browse
        </NavLink>

        {canPost && (
          <NavLink to="/my-listings" style={navLinkStyle}>
            My listings
          </NavLink>
        )}

        {user && (
          <NavLink to="/requests" style={navLinkStyle}>
            {isDonorRole ? 'Requests received' : 'My requests'}
          </NavLink>
        )}

        {isAdmin && (
          <NavLink to="/admin" style={navLinkStyle}>
            Administration
          </NavLink>
        )}

        <NavLink to="/about" style={navLinkStyle}>
          About
        </NavLink>

        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          {user && (
            <NavLink
              to="/profile"
              style={{ fontSize: '0.8rem', color: 'var(--fb-slate)', textDecoration: 'none' }}
              title="View and edit your profile"
            >
              <strong>{user.name}</strong> · {ROLE_LABELS[user.role]}
            </NavLink>
          )}
          {user ? (
            <button onClick={handleLogout} style={{ ...navButton, color: 'var(--fb-red)' }}>
              Sign out
            </button>
          ) : (
            <NavLink to="/login" style={{ ...navButton, textDecoration: 'none' }}>
              Sign in
            </NavLink>
          )}
        </div>
      </nav>

      <Outlet />
    </div>
  )
}

const navButton: CSSProperties = {
  background: 'none',
  border: '1px solid var(--fb-border)',
  borderRadius: '0.5rem',
  padding: '0.3rem 0.75rem',
  cursor: 'pointer',
  color: 'var(--fb-slate)',
  fontSize: '0.8rem',
  fontFamily: 'inherit',
}
