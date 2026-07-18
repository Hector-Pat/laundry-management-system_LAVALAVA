import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import MainLayout from '../../components/layout/MainLayout'
import { getNavLinks } from '../../components/layout/navLinks'

function OperadorPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <MainLayout navLinks={getNavLinks(user?.role)} userName={user?.fullName} userRole={user?.role} onLogout={handleLogout}>
      <div className="flex h-full flex-col items-center justify-center gap-1 text-gray-400">
        <h1 className="text-xl font-bold text-gray-700">Panel de operador</h1>
        <p className="text-sm font-medium">Próximamente</p>
      </div>
    </MainLayout>
  )
}

export default OperadorPage
