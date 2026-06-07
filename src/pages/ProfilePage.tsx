import { useState } from 'react'
import { Card } from '../components/Card'
import { FormField } from '../components/FormField'
import { useAuth } from '../hooks/useAuth'
import { useData } from '../hooks/useData'
import { useToast } from '../hooks/useToast'

interface ProfileFormState {
  fullName: string
  address: string
  phone: string
  age: string
  childEmail: string
}

interface PasswordFormState {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

type ProfileErrors = Partial<Record<keyof ProfileFormState, string>>
type PasswordErrors = Partial<Record<keyof PasswordFormState, string>>

const PASSWORD_INITIAL: PasswordFormState = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

export function ProfilePage() {
  const { currentUser, setCurrentUser } = useAuth()
  const { users, updateUser } = useData()
  const { push } = useToast()

  const [profile, setProfile] = useState<ProfileFormState>({
    fullName: currentUser?.fullName ?? '',
    address: currentUser?.address ?? '',
    phone: currentUser?.phone ?? '',
    age: currentUser?.age?.toString() ?? '',
    childEmail: currentUser?.childEmail ?? '',
  })
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({})

  const [password, setPassword] = useState<PasswordFormState>(PASSWORD_INITIAL)
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({})

  if (!currentUser) return null

  const updateProfileField = <K extends keyof ProfileFormState>(
    key: K,
    value: ProfileFormState[K],
  ) => setProfile((prev) => ({ ...prev, [key]: value }))

  const updatePasswordField = <K extends keyof PasswordFormState>(
    key: K,
    value: PasswordFormState[K],
  ) => setPassword((prev) => ({ ...prev, [key]: value }))

  const validateProfile = (): ProfileErrors => {
    const next: ProfileErrors = {}
    if (!profile.fullName.trim()) next.fullName = 'Full name is required.'
    if (!profile.address.trim()) next.address = 'Address is required.'
    if (!profile.phone.trim()) next.phone = 'Phone number is required.'
    else if (!/^[+\d][\d\s().-]{6,}$/.test(profile.phone.trim()))
      next.phone = 'Enter a valid phone number.'

    if (currentUser.role === 'student') {
      const ageNumber = Number(profile.age)
      if (!profile.age) next.age = 'Age is required.'
      else if (Number.isNaN(ageNumber) || ageNumber < 5 || ageNumber > 100)
        next.age = 'Age must be between 5 and 100.'
    }

    if (currentUser.role === 'parent' && profile.childEmail) {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(profile.childEmail))
        next.childEmail = 'Enter a valid email or leave blank.'
      else if (
        !users.some(
          (user) =>
            user.email === profile.childEmail.trim().toLowerCase() &&
            user.role === 'student',
        )
      ) {
        next.childEmail = 'No student account is registered with that email.'
      }
    }
    return next
  }

  const handleProfileSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const errors = validateProfile()
    setProfileErrors(errors)
    if (Object.keys(errors).length > 0) return

    const patch: Parameters<typeof updateUser>[1] = {
      fullName: profile.fullName.trim(),
      address: profile.address.trim(),
      phone: profile.phone.trim(),
    }
    if (currentUser.role === 'student') {
      patch.age = Number(profile.age)
    }
    if (currentUser.role === 'parent') {
      patch.childEmail = profile.childEmail
        ? profile.childEmail.trim().toLowerCase()
        : undefined
    }

    const updated = updateUser(currentUser.email, patch)
    if (updated) {
      setCurrentUser(updated)
      push('success', 'Profile updated.')
    } else {
      push('error', 'Could not update profile. Try again.')
    }
  }

  const validatePassword = (): PasswordErrors => {
    const next: PasswordErrors = {}
    if (!password.currentPassword) next.currentPassword = 'Enter your current password.'
    else if (password.currentPassword !== currentUser.password)
      next.currentPassword = 'Current password is incorrect.'

    if (!password.newPassword) next.newPassword = 'New password is required.'
    else if (password.newPassword.length < 6)
      next.newPassword = 'New password must be at least 6 characters.'
    else if (password.newPassword === password.currentPassword)
      next.newPassword = 'New password must differ from current password.'

    if (password.newPassword !== password.confirmPassword)
      next.confirmPassword = 'Passwords must match.'

    return next
  }

  const handlePasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const errors = validatePassword()
    setPasswordErrors(errors)
    if (Object.keys(errors).length > 0) return

    const updated = updateUser(currentUser.email, { password: password.newPassword })
    if (updated) {
      setCurrentUser(updated)
      setPassword(PASSWORD_INITIAL)
      push('success', 'Password changed successfully.')
    } else {
      push('error', 'Could not change password. Try again.')
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Update your personal details and password.
        </p>
      </header>

      <Card
        title="Account"
        description="Email and role are fixed and cannot be edited."
      >
        <dl className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-500 font-semibold uppercase text-xs">Email</dt>
            <dd className="mt-1 text-slate-800 font-medium">{currentUser.email}</dd>
          </div>
          <div>
            <dt className="text-slate-500 font-semibold uppercase text-xs">Role</dt>
            <dd className="mt-1">
              <span className="inline-flex items-center rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-xs font-semibold uppercase">
                {currentUser.role}
              </span>
            </dd>
          </div>
        </dl>
      </Card>

      <Card title="Personal Details">
        <form onSubmit={handleProfileSubmit} noValidate className="grid sm:grid-cols-2 gap-4">
          <FormField
            label="Full Name"
            name="fullName"
            value={profile.fullName}
            onChange={(event) => updateProfileField('fullName', event.target.value)}
            error={profileErrors.fullName}
            autoComplete="name"
          />
          <FormField
            label="Address"
            name="address"
            value={profile.address}
            onChange={(event) => updateProfileField('address', event.target.value)}
            error={profileErrors.address}
            autoComplete="street-address"
          />
          <FormField
            label="Phone Number"
            name="phone"
            type="tel"
            value={profile.phone}
            onChange={(event) => updateProfileField('phone', event.target.value)}
            error={profileErrors.phone}
            autoComplete="tel"
          />
          {currentUser.role === 'student' ? (
            <FormField
              label="Age"
              name="age"
              type="number"
              min={5}
              max={100}
              value={profile.age}
              onChange={(event) => updateProfileField('age', event.target.value)}
              error={profileErrors.age}
            />
          ) : null}
          {currentUser.role === 'parent' ? (
            <FormField
              label="Child's Email"
              name="childEmail"
              type="email"
              value={profile.childEmail}
              onChange={(event) => updateProfileField('childEmail', event.target.value)}
              error={profileErrors.childEmail}
              hint="Link your child's account using their registered email."
            />
          ) : null}
          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-5 py-2"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Card>

      <Card title="Change Password">
        <form onSubmit={handlePasswordSubmit} noValidate className="grid sm:grid-cols-2 gap-4">
          <FormField
            label="Current Password"
            name="currentPassword"
            type="password"
            value={password.currentPassword}
            onChange={(event) => updatePasswordField('currentPassword', event.target.value)}
            error={passwordErrors.currentPassword}
            autoComplete="current-password"
          />
          <div className="hidden sm:block" />
          <FormField
            label="New Password"
            name="newPassword"
            type="password"
            value={password.newPassword}
            onChange={(event) => updatePasswordField('newPassword', event.target.value)}
            error={passwordErrors.newPassword}
            hint="At least 6 characters."
            autoComplete="new-password"
          />
          <FormField
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={password.confirmPassword}
            onChange={(event) => updatePasswordField('confirmPassword', event.target.value)}
            error={passwordErrors.confirmPassword}
            autoComplete="new-password"
          />
          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-5 py-2"
            >
              Update Password
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}
