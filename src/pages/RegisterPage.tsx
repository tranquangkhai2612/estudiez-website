import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FormField } from '../components/FormField'
import { useData } from '../hooks/useData'
import { useToast } from '../hooks/useToast'
import type { Role } from '../types'

interface RegisterFormState {
  email: string
  fullName: string
  address: string
  phone: string
  age: string
  password: string
  confirmPassword: string
  role: Role
  childEmail: string
}

const initial: RegisterFormState = {
  email: '',
  fullName: '',
  address: '',
  phone: '',
  age: '',
  password: '',
  confirmPassword: '',
  role: 'student',
  childEmail: '',
}

type Errors = Partial<Record<keyof RegisterFormState, string>>

export function RegisterPage() {
  const { users, registrations, addRegistrationRequest } = useData()
  const { push } = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState<RegisterFormState>(initial)
  const [errors, setErrors] = useState<Errors>({})

  const update = <K extends keyof RegisterFormState>(key: K, value: RegisterFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const validate = (): Errors => {
    const next: Errors = {}
    if (!form.email.trim()) next.email = 'Email is required.'
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
      next.email = 'Enter a valid email address.'
    else if (
      users.some((user) => user.email === form.email.trim().toLowerCase())
    ) {
      next.email = 'This email is already registered.'
    } else if (
      registrations.some(
        (request) =>
          request.status === 'pending' &&
          request.email === form.email.trim().toLowerCase(),
      )
    ) {
      next.email = 'A registration request for this email is already pending approval.'
    }

    if (!form.fullName.trim()) next.fullName = 'Full name is required.'
    if (!form.address.trim()) next.address = 'Address is required.'
    if (!form.phone.trim()) next.phone = 'Phone number is required.'
    else if (!/^[+\d][\d\s().-]{6,}$/.test(form.phone.trim()))
      next.phone = 'Enter a valid phone number.'

    if (form.role === 'student') {
      const ageNumber = Number(form.age)
      if (!form.age) next.age = 'Age is required for students.'
      else if (Number.isNaN(ageNumber) || ageNumber < 5 || ageNumber > 100)
        next.age = 'Age must be between 5 and 100.'
    }

    if (form.role === 'parent' && form.childEmail) {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.childEmail))
        next.childEmail = 'Enter a valid child email or leave blank.'
    }

    if (!form.password) next.password = 'Password is required.'
    else if (form.password.length < 6)
      next.password = 'Password must be at least 6 characters.'

    if (form.password !== form.confirmPassword)
      next.confirmPassword = 'Passwords must match.'

    return next
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    addRegistrationRequest({
      email: form.email.trim().toLowerCase(),
      fullName: form.fullName.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      password: form.password,
      role: form.role,
      age: form.role === 'student' ? Number(form.age) : undefined,
      childEmail:
        form.role === 'parent' && form.childEmail
          ? form.childEmail.trim().toLowerCase()
          : undefined,
    })

    push('success', 'Request submitted. An administrator will review and approve your account.')
    navigate('/login')
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h1 className="text-2xl font-bold text-slate-900">Register</h1>
      <p className="text-sm text-slate-500 mt-1">
        Submit a request to join. An administrator will review and approve your account before you
        can sign in.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-5 grid sm:grid-cols-2 gap-4">
        <FormField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={(event) => update('email', event.target.value)}
          error={errors.email}
          autoComplete="email"
        />
        <FormField
          label="Full Name"
          name="fullName"
          value={form.fullName}
          onChange={(event) => update('fullName', event.target.value)}
          error={errors.fullName}
          autoComplete="name"
        />
        <FormField
          label="Address"
          name="address"
          value={form.address}
          onChange={(event) => update('address', event.target.value)}
          error={errors.address}
          autoComplete="street-address"
        />
        <FormField
          label="Phone Number"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={(event) => update('phone', event.target.value)}
          error={errors.phone}
          autoComplete="tel"
        />
        <FormField
          as="select"
          label="Role"
          name="role"
          value={form.role}
          onChange={(event) => update('role', event.target.value as Role)}
        >
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="parent">Parent / Guardian</option>
        </FormField>
        {form.role === 'student' ? (
          <FormField
            label="Age"
            name="age"
            type="number"
            min={5}
            max={100}
            value={form.age}
            onChange={(event) => update('age', event.target.value)}
            error={errors.age}
          />
        ) : null}
        {form.role === 'parent' ? (
          <FormField
            label="Child's Email (optional)"
            name="childEmail"
            type="email"
            value={form.childEmail}
            onChange={(event) => update('childEmail', event.target.value)}
            error={errors.childEmail}
            hint="Link your child's account by their registered email."
          />
        ) : null}
        <FormField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={(event) => update('password', event.target.value)}
          error={errors.password}
          hint="At least 6 characters."
          autoComplete="new-password"
        />
        <FormField
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={(event) => update('confirmPassword', event.target.value)}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />
        <div className="sm:col-span-2 flex items-center justify-between gap-3 pt-2">
          <p className="text-sm text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
              Login here
            </Link>
          </p>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-5 py-2"
          >
            Submit for Approval
          </button>
        </div>
      </form>
    </div>
  )
}
