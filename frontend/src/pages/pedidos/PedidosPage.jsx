import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import MainLayout from '../../components/layout/MainLayout';
import { getNavLinks } from '../../components/layout/navLinks';

function PedidosPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <MainLayout navLinks={getNavLinks(user?.role)} userName={user?.fullName} userRole={user?.role} onLogout={handleLogout}>
      <div className="flex h-full flex-col gap-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pedidos</h1>
          <p className="text-sm text-gray-400 mt-0.5">Seguimiento de todos los pedidos de la lavandería</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-400">
          <Loader2 size={32} className="animate-spin" />
          <p className="text-sm font-medium">Cargando pedidos...</p>
        </div>
      </div>
    </MainLayout>
  );
}

export default PedidosPage;
