import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { apiService } from '../../services/api'
import { ROLE_LABELS } from '../../types'
import type { UserResponse } from '../../types/api'
import { UiButton, UiContainer, UiSubtitle, UiTextInput, UiTitle } from '../../ui'

const cardStyle = {
  background: '#fff',
  border: '1px solid var(--fb-border)',
  borderRadius: '0.6rem',
  padding: '1.25rem',
  marginBottom: '1.25rem',
}

const noteStyle = {
  fontSize: '0.8rem',
  color: 'var(--fb-slate)',
  margin: '0 0 1rem',
  lineHeight: 1.5,
}

/**
 * FR11 — Manage Own Profile.
 *
 * Two independent forms on one screen:
 *   PUT /api/auth/me           → name, phone, organization
 *   PUT /api/auth/me/password  → current + new password
 *
 * Neither form can change role or email. The backend takes the user id from
 * the JWT rather than the request body, so a signed-in user can only ever
 * edit their own record.
 */
export function ProfilePage() {
  const { user, refreshUser } = useAuth()

  const [me, setMe] = useState<UserResponse | null>(null)
  const [loading, setLoading] = useState(true)

  // details form
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [organization, setOrganization] = useState('')
  const [savingDetails, setSavingDetails] = useState(false)
  const [detailsMessage, setDetailsMessage] = useState('')
  const [detailsError, setDetailsError] = useState('')

  // password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    let cancelled = false
    apiService
      .getMe()
      .then((data) => {
        if (cancelled) return
        setMe(data)
        setName(data.name)
        setPhone(data.phone ?? '')
        setOrganization(data.organization ?? '')
      })
      .catch(() => {
        if (!cancelled) setDetailsError('Could not load your profile.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const saveDetails = async () => {
    setSavingDetails(true)
    setDetailsMessage('')
    setDetailsError('')
    try {
      const updated = await apiService.updateMe({
        name: name.trim(),
        phone: phone.trim() || null,
        organization: organization.trim() || null,
      })
      setMe(updated)
      refreshUser({ name: updated.name })
      setDetailsMessage('Your details were saved.')
    } catch {
      setDetailsError('Could not save your details.')
    } finally {
      setSavingDetails(false)
    }
  }

  const savePassword = async () => {
    setPasswordMessage('')
    setPasswordError('')

    if (newPassword.length < 8) {
      setPasswordError('The new password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('The two new passwords do not match.')
      return
    }

    setSavingPassword(true)
    try {
      await apiService.changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMessage('Password changed. Other devices have been signed out.')
    } catch {
      setPasswordError('Could not change your password. Check your current password.')
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return (
      <UiContainer width="narrow">
        <UiTitle>My profile</UiTitle>
        <p style={{ color: 'var(--fb-slate)', fontSize: '0.9rem' }}>Loading…</p>
      </UiContainer>
    )
  }

  return (
    <UiContainer width="narrow">
      <UiTitle>My profile</UiTitle>
      <UiSubtitle>Your account details, and the password you sign in with.</UiSubtitle>

      {/* ── Read-only identity ───────────────────────────────────────────── */}
      <div style={cardStyle}>
        <Row label="Email" value={me?.email ?? user?.email ?? ''} />
        <Row label="Role" value={me ? ROLE_LABELS[me.role] : ''} />
        <Row
          label="Member since"
          value={me ? new Date(me.created_at).toLocaleDateString() : ''}
        />
        <p style={{ ...noteStyle, margin: '0.75rem 0 0' }}>
          Email and role cannot be changed here. Only an administrator can alter an account's
          role, which is what stops a user promoting themselves.
        </p>
      </div>

      {/* ── Editable details ─────────────────────────────────────────────── */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: '1rem', margin: '0 0 0.35rem' }}>Your details</h2>
        <p style={noteStyle}>Recipients see your name and organisation on your listings.</p>

        <UiTextInput label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <UiTextInput
          label="Organisation"
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          placeholder="Optional"
        />
        <UiTextInput
          label="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Optional"
        />

        {detailsError && <Message text={detailsError} tone="error" />}
        {detailsMessage && <Message text={detailsMessage} tone="success" />}

        <UiButton onClick={() => void saveDetails()} disabled={savingDetails || name.trim().length < 2}>
          {savingDetails ? 'Saving…' : 'Save details'}
        </UiButton>
      </div>

      {/* ── Password ─────────────────────────────────────────────────────── */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: '1rem', margin: '0 0 0.35rem' }}>Change password</h2>
        <p style={noteStyle}>
          Your current password is required. Changing it signs out every other device.
        </p>

        <UiTextInput
          label="Current password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <UiTextInput
          label="New password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="At least 8 characters"
        />
        <UiTextInput
          label="Confirm new password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {passwordError && <Message text={passwordError} tone="error" />}
        {passwordMessage && <Message text={passwordMessage} tone="success" />}

        <UiButton
          onClick={() => void savePassword()}
          disabled={savingPassword || !currentPassword || !newPassword}
        >
          {savingPassword ? 'Saving…' : 'Change password'}
        </UiButton>
      </div>
    </UiContainer>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0' }}>
      <span style={{ fontSize: '0.82rem', color: 'var(--fb-slate)' }}>{label}</span>
      <strong style={{ fontSize: '0.88rem' }}>{value}</strong>
    </div>
  )
}

function Message({ text, tone }: { text: string; tone: 'error' | 'success' }) {
  return (
    <p
      style={{
        fontSize: '0.83rem',
        margin: '0 0 0.85rem',
        color: tone === 'error' ? 'var(--fb-red)' : 'var(--fb-green-dark)',
      }}
    >
      {text}
    </p>
  )
}
