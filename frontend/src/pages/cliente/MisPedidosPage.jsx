import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, ChevronLeft, ChevronRight, AlertCircle, PackageSearch } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import MainLayout from '../../components/layout/MainLayout'
import { getNavLinks } from '../../components/layout/navLinks'
import { getMisPedidos } from '../../services/pedidos.service'
import EstadoBadge from '../../components/ui/EstadoBadge'
import EmptyState from '../../components/ui/EmptyState'

const PAGE_SIZE = 10

function formatDateTime(value) {
  return new Date(value).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCurrency(value) {
  return `$${Number(value).toFixed(2)}`
}

function MisPedidosPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [pedidos, setPedidos] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const loadPedidos = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const result = await getMisPedidos({ page, pageSize: PAGE_SIZE })
      setPedidos(result.data)
      setPagination(result.pagination)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar tus pedidos')
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPedidos()
  }, [loadPedidos])

  return (
    <MainLayout
      navLinks={getNavLinks(user?.role)}
      userName={user?.fullName}
      userRole={user?.role}
      onLogout={handleLogout}
    >
      <div className="flex flex-col h-full gap-5">
        <div>
          <h1 className="text-2xl font-bold text-ink">Mis pedidos</h1>
          <p className="text-sm text-gray-400 mt-0.5">Seguimiento de tus pedidos en LavaLava</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="flex-1 bg-white rounded-2xl border border-black/10 shadow-sm overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
              <Loader2 size={32} className="animate-spin" />
              <p className="text-sm font-medium">Cargando pedidos...</p>
            </div>
          ) : pedidos.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="No encontramos pedidos asociados a tu cuenta"
              description="Si dejaste tu pedido en mostrador con un correo o teléfono distinto al de tu cuenta, pídele al personal que lo verifique."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-linen text-ink/60 uppercase text-xs tracking-wide border-b border-black/10">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Folio</th>
                    <th className="px-6 py-3 font-semibold">Estado</th>
                    <th className="px-6 py-3 font-semibold">Total</th>
                    <th className="px-6 py-3 font-semibold">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/8">
                  {pedidos.map((pedido) => (
                    <tr key={pedido.id} className="hover:bg-linen/70">
                      <td className="px-6 py-4 font-semibold text-ink">{pedido.folio}</td>
                      <td className="px-6 py-4">
                        <EstadoBadge status={pedido.cancelledAt ? 'CANCELADO' : pedido.status} />
                      </td>
                      <td className="px-6 py-4 font-semibold text-ink">{formatCurrency(pedido.total)}</td>
                      <td className="px-6 py-4 text-gray-500">{formatDateTime(pedido.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && pedidos.length > 0 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-black/10">
              <span className="text-xs text-gray-400">
                Página {pagination.page} de {pagination.totalPages} · {pagination.total} pedidos
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

export default MisPedidosPage
