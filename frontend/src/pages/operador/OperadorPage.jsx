import { Fragment, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, AlertCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import MainLayout from '../../components/layout/MainLayout'
import { getNavLinks } from '../../components/layout/navLinks'
import { getPedidos, getPedidoById, updatePedidoStatus } from '../../services/pedidos.service'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, ORDER_TRANSITIONS } from '../../constants/orderStatus'

const PAGE_SIZE = 10
// Estados sobre los que el operador puede seguir trabajando: cualquier estado
// con una transicion definida (ENTREGADO es terminal y no aparece aqui).
const ACTIVE_STATUSES = Object.keys(ORDER_TRANSITIONS)

function formatDateTime(value) {
  return new Date(value).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCurrency(value) {
  return `$${Number(value).toFixed(2)}`
}

function OperadorPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const [pedidos, setPedidos] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [expandedId, setExpandedId] = useState(null)
  const [itemsById, setItemsById] = useState({})
  const [itemsLoadingId, setItemsLoadingId] = useState(null)
  const [advancingId, setAdvancingId] = useState(null)

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

  const loadPedidos = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      if (statusFilter) {
        const result = await getPedidos({ status: statusFilter, page, pageSize: PAGE_SIZE })
        setPedidos(result.data)
        setPagination(result.pagination)
      } else {
        // Sin filtro explicito: agrega los estados activos (todo menos
        // ENTREGADO) y descarta los cancelados, ya que GET /pedidos solo
        // filtra por un status a la vez.
        const results = await Promise.all(
          ACTIVE_STATUSES.map((status) => getPedidos({ status, page: 1, pageSize: 100 }))
        )
        const merged = results
          .flatMap((result) => result.data)
          .filter((pedido) => !pedido.cancelledAt)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

        const totalPages = Math.max(1, Math.ceil(merged.length / PAGE_SIZE))
        const safePage = Math.min(page, totalPages)
        const start = (safePage - 1) * PAGE_SIZE

        setPedidos(merged.slice(start, start + PAGE_SIZE))
        setPagination({ page: safePage, totalPages, total: merged.length })
        if (safePage !== page) setPage(safePage)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar los pedidos')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, page])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPedidos()
  }, [loadPedidos])

  const toggleExpand = async (pedido) => {
    if (expandedId === pedido.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(pedido.id)
    if (!itemsById[pedido.id]) {
      setItemsLoadingId(pedido.id)
      try {
        const detail = await getPedidoById(pedido.id)
        setItemsById((prev) => ({ ...prev, [pedido.id]: detail.items }))
      } catch {
        setItemsById((prev) => ({ ...prev, [pedido.id]: [] }))
      } finally {
        setItemsLoadingId(null)
      }
    }
  }

  const handleAdvance = async (pedido) => {
    const transition = ORDER_TRANSITIONS[pedido.status]
    if (!transition) return
    setAdvancingId(pedido.id)
    setError('')
    try {
      const updated = await updatePedidoStatus(pedido.id, transition.next)
      setItemsById((prev) => ({ ...prev, [pedido.id]: updated.items }))
      await loadPedidos()
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo actualizar el estado')
    } finally {
      setAdvancingId(null)
    }
  }

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

        <div className="flex items-end gap-3 flex-wrap bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Activos</option>
              {Object.keys(ORDER_STATUS_LABELS).map((value) => (
                <option key={value} value={value}>
                  {ORDER_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
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
              <p className="text-sm font-medium">Cargando pedidos...</p>
            </div>
          ) : pedidos.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <p className="text-sm font-medium">No hay pedidos que coincidan con los filtros</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Folio</th>
                    <th className="px-6 py-3 font-semibold">Cliente</th>
                    <th className="px-6 py-3 font-semibold">Estado</th>
                    <th className="px-6 py-3 font-semibold">Servicios</th>
                    <th className="px-6 py-3 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pedidos.map((pedido) => {
                    const transition = ORDER_TRANSITIONS[pedido.status]
                    const canAdvance =
                      !pedido.cancelledAt && transition && transition.roles.includes(user?.role)
                    const isExpanded = expandedId === pedido.id

                    return (
                      <Fragment key={pedido.id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-semibold text-gray-800">{pedido.folio}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-800">{pedido.cliente.fullName}</span>
                              <span className="text-xs text-gray-400">{pedido.cliente.phoneNumber}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                pedido.cancelledAt ? 'bg-red-50 text-red-600' : ORDER_STATUS_COLORS[pedido.status]
                              }`}
                            >
                              {pedido.cancelledAt ? 'Cancelado' : ORDER_STATUS_LABELS[pedido.status]}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleExpand(pedido)}
                              className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 text-xs font-semibold"
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              Ver servicios
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {canAdvance ? (
                              <button
                                onClick={() => handleAdvance(pedido)}
                                disabled={advancingId === pedido.id}
                                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors text-xs"
                              >
                                {advancingId === pedido.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <ArrowRight size={12} />
                                )}
                                {ORDER_STATUS_LABELS[transition.next]}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-gray-50/60">
                            <td colSpan={5} className="px-6 py-3">
                              {itemsLoadingId === pedido.id ? (
                                <div className="flex items-center gap-2 text-gray-400 text-xs">
                                  <Loader2 size={14} className="animate-spin" />
                                  Cargando servicios...
                                </div>
                              ) : (
                                <ul className="flex flex-col gap-1">
                                  {(itemsById[pedido.id] || []).map((item) => (
                                    <li key={item.id} className="flex items-center justify-between text-xs text-gray-600 max-w-md">
                                      <span>
                                        {item.servicioName} <span className="text-gray-400">x{item.quantity}</span>
                                      </span>
                                      <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                                    </li>
                                  ))}
                                  <li className="text-xs text-gray-400 mt-1">
                                    Recibido el {formatDateTime(pedido.createdAt)} · Total {formatCurrency(pedido.total)}
                                  </li>
                                </ul>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && pedidos.length > 0 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
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

export default OperadorPage
