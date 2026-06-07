import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProfilePage } from './pages/ProfilePage'
import { UserDetailPage } from './pages/UserDetailPage'
import { ClassDetailPage } from './pages/ClassDetailPage'
import { FeedbackPage } from './pages/FeedbackPage'
import { ContactPage } from './pages/ContactPage'
import { NotFoundPage } from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users/:email"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="classes/:classId"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ClassDetailPage />
            </ProtectedRoute>
          }
        />
        <Route path="feedback" element={<FeedbackPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
