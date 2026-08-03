import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, AlertCircle, ChevronLeft, ChevronRight, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import MainLayout from '../../components/layout/MainLayout'
import { getNavLinks } from '../../components/layout/navLinks'
import { getClienteById } from '../../services/clientes.service'
import { getPedidos } from '../../services/pedidos.service'
import { getPagos } from '../../services/pagos.service'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../constants/orderStatus'

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

function ClienteDetailPage() {
  const { id } = useParams()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const [cliente, setCliente] = useState(null)
  const [isLoadingCliente, setIsLoadingCliente] = useState(true)
  const [error, setError] = useState('')

  const [page, setPage] = useState(1)
  const [pedidos, setPedidos] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [isLoadingPedidos, setIsLoadingPedidos] = useState(true)
  const [saldosById, setSaldosById] = useState({})

  useEffect(() => {
    async function loadCliente() {
      setIsLoadingCliente(true)
      setError('')
      try {
        const data = await getClienteById(id)
        setCliente(data)
      } catch (err) {
        setError(err.response?.data?.message || 'No se pudo cargar el cliente')
      } finally {
        setIsLoadingCliente(false)
      }
    }
    loadCliente()
  }, [id])

  const loadPedidos = useCallback(async () => {
    setIsLoadingPedidos(true)
    try {
      const result = await getPedidos({ clienteId: id, page, pageSize: PAGE_SIZE })
      setPedidos(result.data)
      setPagination(result.pagination)

      const saldos = await Promise.all(
        result.data.map((pedido) =>
          getPagos(pedido.id)
            .then((summary) => [pedido.id, summary.saldoPendiente])
            .catch(() => [pedido.id, null])
        )
      )
      setSaldosById(Object.fromEntries(saldos))
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cargar el historial de pedidos')
    } finally {
      setIsLoadingPedidos(false)
    }
  }, [id, page])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial del historial
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
        <Link to="/clientes" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 w-fit">
          <ArrowLeft size={16} />
          Volver a clientes
        </Link>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {isLoadingCliente ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
            <Loader2 size={32} className="animate-spin" />
            <p className="text-sm font-medium">Cargando cliente...</p>
          </div>
        ) : !cliente ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p className="text-sm font-medium">No se encontró el cliente</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 shrink-0">
                <User size={28} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{cliente.fullName}</h1>
                <p className="text-sm text-gray-500">
                  {cliente.phoneNumber} {cliente.email ? `· ${cliente.email}` : ''}
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-800">Historial de pedidos</h2>
              <p className="text-sm text-gray-400 mt-0.5">Del más reciente al más antiguo</p>
            </div>

            <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              {isLoadingPedidos ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
                  <Loader2 size={32} className="animate-spin" />
                  <p className="text-sm font-medium">Cargando pedidos...</p>
                </div>
              ) : pedidos.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <p className="text-sm font-medium">Este cliente no tiene pedidos registrados</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Folio</th>
                        <th className="px-6 py-3 font-semibold">Fecha</th>
                        <th className="px-6 py-3 font-semibold">Estado</th>
                        <th className="px-6 py-3 font-semibold">Total</th>
                        <th className="px-6 py-3 font-semibold">Saldo pendiente</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pedidos.map((pedido) => (
                        <tr key={pedido.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-semibold text-gray-800">
                            <Link to={`/pedidos/${pedido.id}`} className="text-indigo-600 hover:text-indigo-800">
                              {pedido.folio}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-gray-500">{formatDateTime(pedido.createdAt)}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                pedido.cancelledAt ? 'bg-red-50 text-red-600' : ORDER_STATUS_COLORS[pedido.status]
                              }`}
                            >
                              {pedido.cancelledAt ? 'Cancelado' : ORDER_STATUS_LABELS[pedido.status]}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-800">{formatCurrency(pedido.total)}</td>
                          <td className="px-6 py-4 text-gray-500">
                            {saldosById[pedido.id] != null ? formatCurrency(saldosById[pedido.id]) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!isLoadingPedidos && pedidos.length > 0 && (
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
          </>
        )}
      </div>
    </MainLayout>
  )
}

export default ClienteDetailPage
