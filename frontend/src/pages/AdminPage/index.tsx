import { useCallback, useEffect, useState } from 'react'
import { apiService } from '../../services/api'
import { ROLE_LABELS } from '../../types'
import type { UserResponse } from '../../types/api'
import { UiButton, UiContainer, UiSubtitle, UiTitle } from '../../ui'

const cellStyle = {
  padding: '0.7rem 0.6rem',
  borderBottom: '1px solid var(--fb-border)',
  fontSize: '0.88rem',
  textAlign: 'left' as const,
  verticalAlign: 'middle' as const,
}

const headStyle = {
  ...cellStyle,
  fontSize: '0.75rem',
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase' as const,
  color: 'var(--fb-slate)',
}

/**
 * Admin-only screen. Lists every account on the platform and lets an
 * administrator suspend or restore one.
 *
 * Both calls hit admin-guarded endpoints:
 *   GET /api/auth/users
 *   PUT /api/auth/users/{id}/status?is_active=<bool>
 *
 * The route guard in App.tsx keeps non-admins off this page, and
 * require_admin on the backend rejects them even if they call it directly.
 */
export function AdminPage() {
  const [users, setUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setUsers(await apiService.listUsers())
    } catch {
      setError('Could not load the user list.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const toggle = async (user: UserResponse) => {
    setBusyId(user.id)
    setError('')
    try {
      const updated = await apiService.setUserStatus(user.id, !user.is_active)
      setUsers((current) => current.map((u) => (u.id === updated.id ? updated : u)))
    } catch {
      setError('Could not update that account.')
    } finally {
      setBusyId('')
    }
  }

  const counts = {
    total: users.length,
    donors: users.filter((u) => u.role === 'DONOR').length,
    recipients: users.filter((u) => u.role === 'RECIPIENT').length,
    suspended: users.filter((u) => !u.is_active).length,
  }

  return (
    <UiContainer>
      <UiTitle>Administration</UiTitle>
      <UiSubtitle>
        Every account on the platform. Suspending an account blocks sign-in without deleting
        anything the person has already posted.
      </UiSubtitle>

      <div style={{ display: 'flex', gap: '1.5rem', margin: '0 0 1.25rem', flexWrap: 'wrap' }}>
        <Stat label="Accounts" value={counts.total} />
        <Stat label="Donors" value={counts.donors} />
        <Stat label="Recipients" value={counts.recipients} />
        <Stat label="Suspended" value={counts.suspended} />
      </div>

      {error && (
        <p style={{ color: 'var(--fb-red)', fontSize: '0.85rem', margin: '0 0 1rem' }}>{error}</p>
      )}

      {loading ? (
        <p style={{ color: 'var(--fb-slate)', fontSize: '0.9rem' }}>Loading accounts…</p>
      ) : (
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--fb-border)',
            borderRadius: '0.6rem',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={headStyle}>Name</th>
                <th style={headStyle}>Email</th>
                <th style={headStyle}>Role</th>
                <th style={headStyle}>Status</th>
                <th style={{ ...headStyle, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td style={cellStyle}>
                    <strong>{user.name}</strong>
                    {user.organization && (
                      <div style={{ color: 'var(--fb-slate)', fontSize: '0.78rem' }}>
                        {user.organization}
                      </div>
                    )}
                  </td>
                  <td style={{ ...cellStyle, color: 'var(--fb-slate)' }}>{user.email}</td>
                  <td style={cellStyle}>{ROLE_LABELS[user.role]}</td>
                  <td style={cellStyle}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.15rem 0.55rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: user.is_active ? 'var(--fb-green-light)' : 'var(--fb-red-light)',
                        color: user.is_active ? 'var(--fb-green-dark)' : 'var(--fb-red)',
                      }}
                    >
                      {user.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'right' }}>
                    {user.role === 'ADMIN' ? (
                      <span style={{ color: 'var(--fb-slate)', fontSize: '0.8rem' }}>—</span>
                    ) : (
                      <UiButton
                        tone={user.is_active ? 'danger' : 'primary'}
                        disabled={busyId === user.id}
                        onClick={() => void toggle(user)}
                      >
                        {busyId === user.id ? 'Saving…' : user.is_active ? 'Suspend' : 'Restore'}
                      </UiButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </UiContainer>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--fb-green-dark)' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--fb-slate)', letterSpacing: '0.03em' }}>
        {label}
      </div>
    </div>
  )
}
