import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FormField } from '../components/FormField'
import { useAuth } from '../hooks/useAuth'
import { useData } from '../hooks/useData'
import { useToast } from '../hooks/useToast'

interface FormErrors {
  email?: string
  password?: string
}

export function LoginPage() {
  const { login } = useAuth()
  const { users, loading } = useData()
  const { push } = useToast()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  const validate = (): FormErrors => {
    const next: FormErrors = {}
    if (!email.trim()) next.email = 'Email is required.'
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      next.email = 'Enter a valid email address.'
    if (!password) next.password = 'Password is required.'
    return next
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const user = login(email, password, users)
    if (!user) {
      push('error', 'Invalid email or password.')
      return
    }
    push('success', `Welcome back, ${user.fullName}.`)
    navigate(location.state?.from && location.state.from !== '/login' ? location.state.from : '/dashboard')
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h1 className="text-2xl font-bold text-slate-900">Login</h1>
      <p className="text-sm text-slate-500 mt-1">Sign in to access your role dashboard.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
        <FormField
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
          autoComplete="email"
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
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-4 py-2 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Login'}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        New here?{' '}
        <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
          Create an account
        </Link>
      </p>

      <div className="mt-5 border-t border-slate-200 pt-4 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700">Demo accounts</p>
        <p>admin@estudiez.app / admin123</p>
        <p>teacher@estudiez.app / teacher123 (Mathematics)</p>
        <p>student@estudiez.app / student123 (Class 10A1)</p>
        <p>parent@estudiez.app / parent123</p>
      </div>
    </div>
  )
}
