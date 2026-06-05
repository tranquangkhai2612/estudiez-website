import { useAuth } from '../hooks/useAuth'
import { AdminDashboard } from './dashboard/AdminDashboard'
import { StudentDashboard } from './dashboard/StudentDashboard'
import { TeacherDashboard } from './dashboard/TeacherDashboard'
import { ParentDashboard } from './dashboard/ParentDashboard'

const TITLES: Record<string, string> = {
  admin: 'Admin Dashboard',
  teacher: 'Teacher Dashboard',
  student: 'Student Dashboard',
  parent: 'Parent Dashboard',
}

export function DashboardPage() {
  const { currentUser } = useAuth()
  if (!currentUser) return null

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{TITLES[currentUser.role]}</h1>
        <p className="text-sm text-slate-500 mt-1">
          Logged in as <span className="font-semibold">{currentUser.fullName}</span> ({currentUser.email})
        </p>
      </header>

      {currentUser.role === 'admin' ? <AdminDashboard /> : null}
      {currentUser.role === 'teacher' ? <TeacherDashboard /> : null}
      {currentUser.role === 'student' ? <StudentDashboard /> : null}
      {currentUser.role === 'parent' ? <ParentDashboard /> : null}
    </div>
  )
}
