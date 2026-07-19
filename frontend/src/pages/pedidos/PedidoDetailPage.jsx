import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Printer, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import MainLayout from '../../components/layout/MainLayout'
import { getNavLinks } from '../../components/layout/navLinks'
import { getPedidoById, updatePedidoStatus } from '../../services/pedidos.service'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, ORDER_TRANSITIONS } from '../../constants/orderStatus'
import './PedidoDetailPage.css'

function formatCurrency(value) {
  return `$${Number(value).toFixed(2)}`
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

function PedidoDetailPage() {
  const { id } = useParams()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const [pedido, setPedido] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const loadPedido = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await getPedidoById(id)
      setPedido(data)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cargar el pedido')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial del detalle
    loadPedido()
  }, [loadPedido])

  const transition = pedido ? ORDER_TRANSITIONS[pedido.status] : null
  const canAdvance =
    pedido &&
    pedido.status !== 'ENTREGADO' &&
    transition &&
    (user?.role === 'ADMIN' || transition.roles.includes(user?.role))

  const handleAdvance = async () => {
    if (!transition) return
    setIsUpdating(true)
    setError('')
    try {
      const updated = await updatePedidoStatus(id, transition.next)
      setPedido(updated)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo actualizar el estado')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <MainLayout
      navLinks={getNavLinks(user?.role)}
      userName={user?.fullName}
      userRole={user?.role}
      onLogout={handleLogout}
    >
      <div className="flex flex-col h-full gap-5 print:hidden">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Link to="/pedidos" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700">
            <ArrowLeft size={16} />
            Volver a pedidos
          </Link>

          {pedido && (
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
            >
              <Printer size={16} />
              Imprimir etiqueta
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
            <Loader2 size={32} className="animate-spin" />
            <p className="text-sm font-medium">Cargando pedido...</p>
          </div>
        ) : !pedido ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p className="text-sm font-medium">No se encontró el pedido</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Folio</p>
                <h1 className="text-3xl font-extrabold text-gray-800">{pedido.folio}</h1>
                <p className="text-sm text-gray-400 mt-1">Creado el {formatDateTime(pedido.createdAt)}</p>
              </div>

              <div className="flex flex-col items-start md:items-end gap-2">
                <span
                  className={`inline-flex px-3 py-1.5 rounded-full text-sm font-semibold ${ORDER_STATUS_COLORS[pedido.status]}`}
                >
                  {ORDER_STATUS_LABELS[pedido.status]}
                </span>

                {pedido.status === 'ENTREGADO' ? (
                  <p className="text-xs text-gray-400 inline-flex items-center gap-1">
                    <CheckCircle2 size={14} className="text-green-500" />
                    Entregado el {formatDateTime(pedido.deliveredAt)}
                  </p>
                ) : canAdvance ? (
                  <button
                    onClick={handleAdvance}
                    disabled={isUpdating}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
                  >
                    {isUpdating && <Loader2 size={14} className="animate-spin" />}
                    {transition.next === 'ENTREGADO'
                      ? 'Marcar como entregado'
                      : `Avanzar a ${ORDER_STATUS_LABELS[transition.next]}`}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Servicio</th>
                      <th className="px-6 py-3 font-semibold">Cantidad</th>
                      <th className="px-6 py-3 font-semibold">Precio</th>
                      <th className="px-6 py-3 font-semibold text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pedido.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-3 font-medium text-gray-800">{item.servicioName}</td>
                        <td className="px-6 py-3 text-gray-500">{item.quantity}</td>
                        <td className="px-6 py-3 text-gray-500">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-6 py-3 text-right font-semibold text-gray-800">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="px-6 py-3 font-semibold text-gray-600 text-right">
                        Total
                      </td>
                      <td className="px-6 py-3 text-right font-extrabold text-gray-800 text-lg">
                        {formatCurrency(pedido.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Cliente</p>
                  <p className="font-semibold text-gray-800">{pedido.cliente.fullName}</p>
                  <p className="text-sm text-gray-500">{pedido.cliente.phoneNumber}</p>
                  {pedido.cliente.email && <p className="text-sm text-gray-500">{pedido.cliente.email}</p>}
                </div>

                <div className="flex flex-col items-center gap-2 pt-2 border-t border-gray-100">
                  <img src={pedido.qrCode} alt={`Código QR del folio ${pedido.folio}`} className="w-32 h-32" />
                  <p className="text-xs text-gray-400">Escanea para identificar el pedido</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Etiqueta imprimible: solo visible al imprimir (ver PedidoDetailPage.css) */}
      {pedido && (
        <div className="hidden print:flex print:flex-col print:items-center print:gap-2 print:text-black">
          <p className="text-lg font-bold">LAVALAVA</p>
          <p className="text-2xl font-extrabold tracking-wide">{pedido.folio}</p>
          <img src={pedido.qrCode} alt={`Código QR del folio ${pedido.folio}`} className="w-40 h-40" />
          <p className="text-sm font-semibold">{pedido.cliente.fullName}</p>
          <p className="text-xs">{formatDateTime(pedido.createdAt)}</p>
          <p className="text-sm font-bold">Total: {formatCurrency(pedido.total)}</p>
        </div>
      )}
    </MainLayout>
  )
}

export default PedidoDetailPage
