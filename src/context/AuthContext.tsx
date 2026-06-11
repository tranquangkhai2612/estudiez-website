import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types'

interface AuthContextValue {
  currentUser: User | null
  login: (email: string, password: string, users: User[]) => User | null
  signOut: () => void
  setCurrentUser: (user: User | null) => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const STORAGE_KEY = 'estudiez.currentUser'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as User) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (currentUser) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser))
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [currentUser])

  const login = useCallback((email: string, password: string, users: User[]) => {
    const normalized = email.trim().toLowerCase()
    const trimmedPassword = password.trim()
    const found = users.find(
      (user) => user.email === normalized && user.password === trimmedPassword,
    )
    if (found) {
      setCurrentUser(found)
      return found
    }
    return null
  }, [])

  const signOut = useCallback(() => setCurrentUser(null), [])

  const value = useMemo<AuthContextValue>(
    () => ({ currentUser, login, signOut, setCurrentUser }),
    [currentUser, login, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
