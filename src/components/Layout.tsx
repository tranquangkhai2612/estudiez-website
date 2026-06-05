import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { NotificationBell } from './NotificationBell'
import { ToastStack } from './ToastStack'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
    isActive ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-indigo-50'
  }`

export function Layout() {
  const { currentUser, signOut } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()

  const handleSignOut = () => {
    signOut()
    push('success', 'You have signed out successfully.')
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">
              eS
            </span>
            <span className="text-xl font-bold text-slate-900">eStudiez</span>
          </NavLink>
          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            {currentUser ? (
              <>
                <NavLink to="/dashboard" className={navLinkClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/profile" className={navLinkClass}>
                  Profile
                </NavLink>
              </>
            ) : null}
            <NavLink to="/feedback" className={navLinkClass}>
              Feedback
            </NavLink>
            <NavLink to="/contact" className={navLinkClass}>
              Contact
            </NavLink>
            {!currentUser ? (
              <>
                <NavLink to="/login" className={navLinkClass}>
                  Login
                </NavLink>
                <NavLink to="/register" className={navLinkClass}>
                  Register
                </NavLink>
              </>
            ) : null}
          </nav>
          <div className="flex items-center gap-3">
            {currentUser ? (
              <>
                <NotificationBell />
                <span className="text-sm text-slate-600">
                  Hi,{' '}
                  <span className="font-semibold text-slate-900">{currentUser.fullName}</span>
                  <span className="ml-1 inline-flex items-center rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-xs font-semibold uppercase">
                    {currentUser.role}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-3 py-1.5 rounded-md border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <span className="text-sm text-slate-500">Not signed in</span>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 mt-8">
        <div className="max-w-6xl mx-auto px-4 py-4 text-sm text-slate-500 flex flex-wrap justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} eStudiez</span>
          <span>
            Contact developer:{' '}
            <a
              className="text-indigo-600 hover:underline"
              href="mailto:support@estudiez.app"
            >
              support@estudiez.app
            </a>
          </span>
        </div>
      </footer>

      <ToastStack />
    </div>
  )
}
