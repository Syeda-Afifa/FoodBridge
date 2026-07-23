import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import { apiService, toErrorMessage } from '../../services/api'
import { UiButton, UiContainer, UiSubtitle, UiTextInput, UiTitle } from '../../ui'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await apiService.login(email, password)
      login(data)
      navigate('/')
    } catch (err) {
      setError(toErrorMessage(err, 'Could not sign in'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <UiContainer width="narrow">
      <UiTitle>Sign in</UiTitle>
      <UiSubtitle>Share surplus food, or find some before it goes to waste.</UiSubtitle>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
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
          placeholder="••••••••"
          required
        />

        {error && <p style={{ color: 'var(--fb-red)', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

        <UiButton type="submit" disabled={loading} fullWidth>
          {loading ? 'Signing in…' : 'Sign in'}
        </UiButton>
      </form>

      <p style={{ marginTop: '1rem', fontSize: '0.85rem', textAlign: 'center', color: 'var(--fb-slate)' }}>
        New here?{' '}
        <Link to="/signup" style={{ color: 'var(--fb-green-dark)', fontWeight: 600 }}>
          Create an account
        </Link>
      </p>
    </UiContainer>
  )
}
