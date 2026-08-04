import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, ChevronLeft, ChevronRight, AlertCircle, ScrollText } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import MainLayout from '../../components/layout/MainLayout'
import { getNavLinks } from '../../components/layout/navLinks'
import { getAuditLog } from '../../services/auditoria.service'
import EmptyState from '../../components/ui/EmptyState'

const PAGE_SIZE = 20

const ACTION_LABELS = {
  FORZAR_ESTADO_PEDIDO: 'Forzar estado de pedido',
  CANCELAR_PEDIDO: 'Cancelar pedido',
  ANULAR_PAGO: 'Anular pago',
  RESOLVER_RECLAMACION: 'Resolver reclamación',
  ACTUALIZAR_USUARIO: 'Actualizar usuario',
  DESACTIVAR_USUARIO: 'Desactivar usuario',
}

function formatDateTime(value) {
  return new Date(value).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDetails(details) {
  if (!details || Object.keys(details).length === 0) return '—'
  return Object.entries(details)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
    .join(' · ')
}

function AuditoriaPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [entries, setEntries] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const loadEntries = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const result = await getAuditLog({ page, pageSize: PAGE_SIZE })
      setEntries(result.data)
      setPagination(result.pagination)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cargar la bitácora')
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEntries()
  }, [loadEntries])

  return (
    <MainLayout
      navLinks={getNavLinks(user?.role)}
      userName={user?.fullName}
      userRole={user?.role}
      onLogout={handleLogout}
    >
      <div className="flex flex-col h-full gap-5">
        <div>
          <h1 className="text-2xl font-bold text-ink">Bitácora de auditoría</h1>
          <p className="text-sm text-gray-400 mt-0.5">Acciones sensibles registradas en el sistema</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
              <Loader2 size={32} className="animate-spin" />
              <p className="text-sm font-medium">Cargando bitácora...</p>
            </div>
          ) : entries.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              title="No hay acciones registradas todavía"
              description="Las acciones del sistema aparecerán aquí conforme ocurran."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Fecha</th>
                    <th className="px-6 py-3 font-semibold">Usuario</th>
                    <th className="px-6 py-3 font-semibold">Acción</th>
                    <th className="px-6 py-3 font-semibold">Entidad</th>
                    <th className="px-6 py-3 font-semibold">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{formatDateTime(entry.createdAt)}</td>
                      <td className="px-6 py-4 font-medium text-ink">{entry.userFullName || '—'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-detergent/10 text-detergent">
                          {ACTION_LABELS[entry.action] || entry.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {entry.entityType} #{entry.entityId}
                      </td>
                      <td className="px-6 py-4 text-gray-500 max-w-md truncate" title={formatDetails(entry.details)}>
                        {formatDetails(entry.details)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && entries.length > 0 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                Página {pagination.page} de {pagination.totalPages} · {pagination.total} registros
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

export default AuditoriaPage
