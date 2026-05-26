import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Layout from '../components/Layout'

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth()

  // In DEV, we might skip auth checks, but we still want the Layout
  if (import.meta.env.DEV) {
    return <Layout>{children}</Layout>
  }

  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />

  return <Layout>{children}</Layout>
}

export default ProtectedRoute
