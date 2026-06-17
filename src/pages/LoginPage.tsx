import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FormField } from '../components/FormField'
import { useAuth } from '../hooks/useAuth'
import { useData } from '../hooks/useData'
import { useToast } from '../hooks/useToast'
import { loginApi } from '../services/api'
import type { Role } from '../types'

interface FormErrors {
  username?: string
  password?: string
}

export function LoginPage() {
  const { login } = useAuth()
  const { users, loading } = useData()
  const { push } = useToast()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  const validate = (): FormErrors => {
    const next: FormErrors = {}
    if (!username.trim()) next.username = 'Username is required.'
    if (!password) next.password = 'Password is required.'
    return next
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      const resp = await loginApi(username.trim(), password.trim())

      // Map backend uppercase role (ADMIN → admin) to frontend Role type
      const role = (resp.role ?? '').toLowerCase() as Role

      // Prefer the full profile from DataContext (has classId / grade / subject)
      // Students have email: null in DB → synthesize from username (same as mapApiUsersToFrontend)
      const email = (resp.email ?? `${resp.username ?? resp.userId}@estudiez.edu.vn`).toLowerCase()
      const baseUser = users.find(u => u.email.toLowerCase() === email) ?? {
        email,
        fullName: resp.fullName ?? username.trim(),
        address: '',
        phone: resp.phone ?? undefined,
        password: '',
        role,
      }
      // Always attach the backend userId so password-change and other mutations work
      const user = { ...baseUser, userId: resp.userId ?? baseUser.userId }

      login(user)
      push('success', `Welcome back, ${user.fullName}.`)
      navigate(
        location.state?.from && location.state.from !== '/login'
          ? location.state.from
          : '/dashboard',
      )
    } catch (err) {
      const status = err instanceof Error ? err.message : ''
      if (status.includes('403')) {
        push('error', 'Your account has been disabled. Contact an administrator.')
      } else {
        push('error', 'Invalid username or password.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h1 className="text-2xl font-bold text-slate-900">Login</h1>
      <p className="text-sm text-slate-500 mt-1">Sign in to access your role dashboard.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
        <FormField
          label="Username"
          name="username"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          error={errors.username}
          autoComplete="username"
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          autoComplete="current-password"
        />
        <button
          type="submit"
          disabled={loading || submitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-4 py-2 disabled:opacity-50"
        >
          {loading || submitting ? 'Please wait…' : 'Login'}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        New here?{' '}
        <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}
