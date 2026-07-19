import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Plus, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import MainLayout from '../../components/layout/MainLayout'
import { getNavLinks } from '../../components/layout/navLinks'
import { getPedidos } from '../../services/pedidos.service'
import { ORDER_STATUS_LABELS, ORDER_STATUS_VALUES, ORDER_STATUS_COLORS } from '../../constants/orderStatus'

const PAGE_SIZE = 10

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

function PedidosPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const canCreate = user?.role === 'RECEPCIONISTA' || user?.role === 'ADMIN'

  const [status, setStatus] = useState('')
  const [date, setDate] = useState('')
  const [clienteInput, setClienteInput] = useState('')
  const [cliente, setCliente] = useState('')
  const [page, setPage] = useState(1)

  const [pedidos, setPedidos] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Debounce del filtro de cliente: evita pegarle al backend en cada tecla.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setCliente(clienteInput.trim())
      setPage(1)
    }, 400)

    return () => clearTimeout(timeout)
  }, [clienteInput])

  const loadPedidos = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const result = await getPedidos({
        status: status || undefined,
        date: date || undefined,
        cliente: cliente || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      setPedidos(result.data)
      setPagination(result.pagination)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar los pedidos')
    } finally {
      setIsLoading(false)
    }
  }, [status, date, cliente, page])

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
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Pedidos</h1>
            <p className="text-sm text-gray-400 mt-0.5">Seguimiento de todos los pedidos de la lavandería</p>
          </div>
          {canCreate && (
            <Link
              to="/pedidos/nuevo"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
            >
              <Plus size={18} />
              Nuevo pedido
            </Link>
          )}
        </div>

        <div className="flex items-end gap-3 flex-wrap bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500">Estado</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todos</option>
              {ORDER_STATUS_VALUES.map((value) => (
                <option key={value} value={value}>
                  {ORDER_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-gray-500">Cliente (nombre o teléfono)</label>
            <input
              type="text"
              value={clienteInput}
              onChange={(e) => setClienteInput(e.target.value)}
              placeholder="Buscar cliente..."
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {(status || date || cliente) && (
            <button
              onClick={() => {
                setStatus('')
                setDate('')
                setClienteInput('')
                setCliente('')
                setPage(1)
              }}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 px-2 py-2"
            >
              Limpiar filtros
            </button>
          )}
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
                    <th className="px-6 py-3 font-semibold">Total</th>
                    <th className="px-6 py-3 font-semibold">Fecha</th>
                    <th className="px-6 py-3 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pedidos.map((pedido) => (
                    <tr key={pedido.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-800">{pedido.folio}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-800">{pedido.cliente.fullName}</span>
                          <span className="text-xs text-gray-400">{pedido.cliente.phoneNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${ORDER_STATUS_COLORS[pedido.status]}`}
                        >
                          {ORDER_STATUS_LABELS[pedido.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-800">{formatCurrency(pedido.total)}</td>
                      <td className="px-6 py-4 text-gray-500">{formatDateTime(pedido.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/pedidos/${pedido.id}`}
                          className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm"
                        >
                          Ver detalle
                        </Link>
                      </td>
                    </tr>
                  ))}
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

export default PedidosPage
