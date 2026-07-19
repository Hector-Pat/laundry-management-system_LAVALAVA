import { useNavigate } from 'react-router-dom'
import { Shirt } from 'lucide-react'
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

  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <MainLayout
      navLinks={getNavLinks(user?.role)}
      userName={user?.fullName}
      userRole={user?.role}
      onLogout={handleLogout}
    >
      <div className="flex flex-col h-full gap-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bienvenido, {user?.fullName}</h1>
          <p className="text-sm text-gray-400 mt-0.5 capitalize">{today}</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-400">
          <Shirt size={32} />
          <p className="text-sm font-medium">El detalle de pedidos y estados de prendas llega próximamente</p>
        </div>
      </div>
    </MainLayout>
  )
}

export default OperadorPage
