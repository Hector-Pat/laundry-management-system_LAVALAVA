import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import MainLayout from '../../components/layout/MainLayout'
import { getNavLinks } from '../../components/layout/navLinks'

function ClientesPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <MainLayout navLinks={getNavLinks(user?.role)} userName={user?.fullName} userRole={user?.role} onLogout={handleLogout}>
      <div className="flex h-full items-center justify-center text-gray-400">
        <p className="text-sm font-medium">Próximamente</p>
      </div>
    </MainLayout>
  )
}

export default ClientesPage
