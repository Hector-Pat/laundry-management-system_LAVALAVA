import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, ChevronLeft, ChevronRight, AlertCircle, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import MainLayout from '../../components/layout/MainLayout'
import { getNavLinks } from '../../components/layout/navLinks'
import { getAllReclamaciones } from '../../services/reclamaciones.service'
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

function ReclamacionesPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [status, setStatus] = useState('ABIERTA')
  const [page, setPage] = useState(1)

  const [reclamaciones, setReclamaciones] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const loadReclamaciones = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const result = await getAllReclamaciones({ status: status || undefined, page, pageSize: PAGE_SIZE })
      setReclamaciones(result.data)
      setPagination(result.pagination)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar las reclamaciones')
    } finally {
      setIsLoading(false)
    }
  }, [status, page])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReclamaciones()
  }, [loadReclamaciones])

  return (
    <MainLayout
      navLinks={getNavLinks(user?.role)}
      userName={user?.fullName}
      userRole={user?.role}
      onLogout={handleLogout}
    >
      <div className="flex flex-col h-full gap-5">
        <div>
          <h1 className="text-2xl font-bold text-ink">Daños y reclamaciones</h1>
          <p className="text-sm text-gray-400 mt-0.5">Seguimiento de reclamaciones de todos los pedidos</p>
        </div>

        <div className="flex items-end gap-3 flex-wrap bg-white rounded-2xl border border-black/10 shadow-sm p-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500">Estado</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-detergent"
            >
              <option value="">Todas</option>
              <option value="ABIERTA">Abiertas</option>
              <option value="RESUELTA">Resueltas</option>
            </select>
          </div>
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
              <p className="text-sm font-medium">Cargando reclamaciones...</p>
            </div>
          ) : reclamaciones.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No hay reclamaciones que coincidan con el filtro"
              description="Cambia el filtro para ver reclamaciones abiertas o resueltas."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-linen text-ink/60 uppercase text-xs tracking-wide border-b border-black/10">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Folio</th>
                    <th className="px-6 py-3 font-semibold">Cliente</th>
                    <th className="px-6 py-3 font-semibold">Descripción</th>
                    <th className="px-6 py-3 font-semibold">Estado</th>
                    <th className="px-6 py-3 font-semibold">Fecha</th>
                    <th className="px-6 py-3 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/8">
                  {reclamaciones.map((reclamacion) => (
                    <tr key={reclamacion.id} className="hover:bg-linen/70">
                      <td className="px-6 py-4 font-semibold text-ink">{reclamacion.pedidoFolio}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-ink">{reclamacion.cliente.fullName}</span>
                          <span className="text-xs text-gray-400">{reclamacion.cliente.phoneNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{reclamacion.description}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                            reclamacion.status === 'RESUELTA'
                              ? 'bg-green-50 text-sage'
                              : 'bg-amber-50 text-amber-600'
                          }`}
                        >
                          {reclamacion.status === 'RESUELTA' ? 'Resuelta' : 'Abierta'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{formatDateTime(reclamacion.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/pedidos/${reclamacion.pedidoId}`}
                          className="text-detergent hover:text-detergent-hover font-semibold text-sm"
                        >
                          Ver pedido
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && reclamaciones.length > 0 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-black/10">
              <span className="text-xs text-gray-400">
                Página {pagination.page} de {pagination.totalPages} · {pagination.total} reclamaciones
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

export default ReclamacionesPage
