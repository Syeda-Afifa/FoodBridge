import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import { apiService, toErrorMessage } from '../../services/api'
import { UiButton, UiContainer, UiSelect, UiSubtitle, UiTextInput, UiTitle } from '../../ui'
import type { Role } from '../../types/api'

export function SignupPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('DONOR')
  const [organization, setOrganization] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Use at least 8 characters for your password.')
      return
    }

    setLoading(true)
    try {
      const data = await apiService.register({
        name,
        email,
        password,
        role,
        organization: organization || undefined,
        phone: phone || undefined,
      })
      login(data)
      navigate('/')
    } catch (err) {
      setError(toErrorMessage(err, 'Could not create your account'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <UiContainer width="narrow">
      <UiTitle>Create an account</UiTitle>
      <UiSubtitle>Choose how you will use FoodBridge — you can offer food or collect it.</UiSubtitle>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
        <UiTextInput
          label="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ayesha Rahman"
          required
        />
        <UiTextInput
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
        <UiTextInput
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          required
        />
        <UiSelect
          label="I want to"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          options={[
            { value: 'DONOR', label: 'Offer surplus food' },
            { value: 'RECIPIENT', label: 'Collect food' },
          ]}
        />
        <UiTextInput
          label="Organisation (optional)"
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          placeholder="Shapla Shelter"
        />
        <UiTextInput
          label="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="01XXXXXXXXX"
        />

        {error && <p style={{ color: 'var(--fb-red)', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

        <UiButton type="submit" disabled={loading} fullWidth>
          {loading ? 'Creating account…' : 'Create account'}
        </UiButton>
      </form>

      <p style={{ marginTop: '1rem', fontSize: '0.85rem', textAlign: 'center', color: 'var(--fb-slate)' }}>
        Already registered?{' '}
        <Link to="/login" style={{ color: 'var(--fb-green-dark)', fontWeight: 600 }}>
          Sign in
        </Link>
      </p>
    </UiContainer>
  )
}
