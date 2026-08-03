import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Printer, Receipt, Loader2, AlertCircle, CheckCircle2, Plus, X, ShieldAlert, Pencil } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import MainLayout from '../../components/layout/MainLayout'
import { getNavLinks } from '../../components/layout/navLinks'
import { getPedidoById, updatePedidoStatus, cancelPedido } from '../../services/pedidos.service'
import { getPagos, registerPago, voidPago } from '../../services/pagos.service'
import { getReclamaciones, registerReclamacion, resolveReclamacion } from '../../services/reclamaciones.service'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, ORDER_TRANSITIONS } from '../../constants/orderStatus'
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_VALUES, PAYMENT_TYPE_LABELS } from '../../constants/paymentMethods'
import './PedidoDetailPage.css'

const PAGOS_ROLES = ['RECEPCIONISTA', 'ADMIN']
const RECLAMACIONES_ROLES = ['RECEPCIONISTA', 'OPERADOR', 'ADMIN']
const CANCEL_ROLES = ['RECEPCIONISTA', 'ADMIN']
const RESOLVE_ROLES = ['RECEPCIONISTA', 'ADMIN']

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

  // Pagos (RF-06): solo RECEPCIONISTA/ADMIN pueden cobrar, asi que solo para
  // ellos se pide el desglose (el backend rechazaria la llamada para OPERADOR).
  const canManagePagos = PAGOS_ROLES.includes(user?.role)

  const [paymentSummary, setPaymentSummary] = useState(null)
  const [isLoadingPayments, setIsLoadingPayments] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [voidingPago, setVoidingPago] = useState(null)

  const loadPagos = useCallback(async () => {
    if (!canManagePagos) return
    setIsLoadingPayments(true)
    try {
      const data = await getPagos(id)
      setPaymentSummary(data)
    } catch {
      setPaymentSummary(null)
    } finally {
      setIsLoadingPayments(false)
    }
  }, [id, canManagePagos])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de pagos
    loadPagos()
  }, [loadPagos])

  // Daños/reclamaciones (RF-09): cualquier miembro de piso puede reportarlos.
  const canManageReclamaciones = RECLAMACIONES_ROLES.includes(user?.role)

  const [reclamaciones, setReclamaciones] = useState([])
  const [isLoadingReclamaciones, setIsLoadingReclamaciones] = useState(false)
  const [showReclamacionModal, setShowReclamacionModal] = useState(false)
  const [resolvingReclamacion, setResolvingReclamacion] = useState(null)
  const canResolveReclamaciones = RESOLVE_ROLES.includes(user?.role)

  const loadReclamaciones = useCallback(async () => {
    if (!canManageReclamaciones) return
    setIsLoadingReclamaciones(true)
    try {
      const data = await getReclamaciones(id)
      setReclamaciones(data)
    } catch {
      setReclamaciones([])
    } finally {
      setIsLoadingReclamaciones(false)
    }
  }, [id, canManageReclamaciones])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de reclamaciones
    loadReclamaciones()
  }, [loadReclamaciones])

  // Ticket termico (RNF-02): "etiqueta" es la pegatina chica con QR, "ticket"
  // es el comprobante completo con servicios y saldo. Solo uno se renderiza
  // a la vez (ver bloques print:* mas abajo), y se imprime tras el
  // re-render para que el bloque correcto ya este en el DOM.
  const [printMode, setPrintMode] = useState('etiqueta')
  const isFirstPrintRender = useRef(true)

  useEffect(() => {
    if (isFirstPrintRender.current) {
      isFirstPrintRender.current = false
      return undefined
    }

    const raf = requestAnimationFrame(() => window.print())
    return () => cancelAnimationFrame(raf)
  }, [printMode])

  const handlePrint = (mode) => setPrintMode(mode)

  const transition = pedido ? ORDER_TRANSITIONS[pedido.status] : null
  const canAdvance =
    pedido &&
    !pedido.cancelledAt &&
    pedido.status !== 'ENTREGADO' &&
    transition &&
    (user?.role === 'ADMIN' || transition.roles.includes(user?.role))

  const canCancel =
    pedido && !pedido.cancelledAt && pedido.status !== 'ENTREGADO' && CANCEL_ROLES.includes(user?.role)

  const canEdit =
    pedido &&
    !pedido.cancelledAt &&
    pedido.status === 'RECIBIDO' &&
    CANCEL_ROLES.includes(user?.role) &&
    (!paymentSummary || paymentSummary.totalPagado === 0)

  const [showCancelModal, setShowCancelModal] = useState(false)

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
            <div className="flex items-center gap-2">
              {canEdit && (
                <Link
                  to={`/pedidos/${id}/editar`}
                  className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
                >
                  <Pencil size={16} />
                  Editar
                </Link>
              )}
              <button
                onClick={() => handlePrint('etiqueta')}
                className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
              >
                <Printer size={16} />
                Imprimir etiqueta
              </button>
              <button
                onClick={() => handlePrint('ticket')}
                className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
              >
                <Receipt size={16} />
                Imprimir ticket
              </button>
            </div>
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
                  className={`inline-flex px-3 py-1.5 rounded-full text-sm font-semibold ${
                    pedido.cancelledAt ? 'bg-red-50 text-red-600' : ORDER_STATUS_COLORS[pedido.status]
                  }`}
                >
                  {pedido.cancelledAt ? 'Cancelado' : ORDER_STATUS_LABELS[pedido.status]}
                </span>

                {pedido.cancelledAt ? (
                  <p className="text-xs text-gray-400 text-right max-w-xs">
                    Cancelado el {formatDateTime(pedido.cancelledAt)}
                    {pedido.cancelReason ? `: ${pedido.cancelReason}` : ''}
                  </p>
                ) : pedido.status === 'ENTREGADO' ? (
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

                {canCancel && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="text-xs font-medium text-red-500 hover:text-red-700"
                  >
                    Cancelar pedido
                  </button>
                )}
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

            {canManagePagos && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <h2 className="font-semibold text-gray-800">Pagos</h2>
                  {paymentSummary && paymentSummary.saldoPendiente > 0 && !pedido.cancelledAt && (
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
                    >
                      <Plus size={16} />
                      Registrar pago
                    </button>
                  )}
                </div>

                {isLoadingPayments ? (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Loader2 size={16} className="animate-spin" /> Cargando pagos...
                  </div>
                ) : paymentSummary ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-gray-50 rounded-xl px-4 py-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total</p>
                        <p className="text-lg font-bold text-gray-800">{formatCurrency(paymentSummary.total)}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl px-4 py-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pagado</p>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(paymentSummary.totalPagado)}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl px-4 py-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Saldo pendiente</p>
                        <p className={`text-lg font-bold ${paymentSummary.saldoPendiente > 0 ? 'text-amber-600' : 'text-gray-800'}`}>
                          {formatCurrency(paymentSummary.saldoPendiente)}
                        </p>
                      </div>
                    </div>

                    {paymentSummary.pagos.length > 0 && (
                      <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
                        {paymentSummary.pagos.map((pago) => (
                          <div
                            key={pago.id}
                            className={`flex items-center justify-between px-4 py-2.5 text-sm gap-3 ${
                              pago.isVoided ? 'opacity-50' : ''
                            }`}
                          >
                            <div>
                              <span
                                className={`font-semibold ${pago.isVoided ? 'text-gray-500 line-through' : 'text-gray-800'}`}
                              >
                                {formatCurrency(pago.amount)}
                              </span>
                              <span className="text-gray-400 ml-2">
                                {PAYMENT_TYPE_LABELS[pago.type]} · {PAYMENT_METHOD_LABELS[pago.method]}
                              </span>
                              {pago.isVoided && (
                                <p className="text-xs text-red-500 mt-0.5">Anulado: {pago.voidReason}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs text-gray-400">{formatDateTime(pago.createdAt)}</span>
                              {!pago.isVoided && (
                                <button
                                  onClick={() => setVoidingPago(pago)}
                                  className="text-xs font-medium text-red-500 hover:text-red-700"
                                >
                                  Anular
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-400">No se pudo cargar la información de pagos.</p>
                )}
              </div>
            )}

            {canManageReclamaciones && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <h2 className="font-semibold text-gray-800">Daños y reclamaciones</h2>
                  <button
                    onClick={() => setShowReclamacionModal(true)}
                    className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
                  >
                    <ShieldAlert size={16} />
                    Reportar daño
                  </button>
                </div>

                {isLoadingReclamaciones ? (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Loader2 size={16} className="animate-spin" /> Cargando reclamaciones...
                  </div>
                ) : reclamaciones.length === 0 ? (
                  <p className="text-sm text-gray-400">No hay daños ni reclamaciones registrados.</p>
                ) : (
                  <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
                    {reclamaciones.map((reclamacion) => (
                      <div key={reclamacion.id} className="px-4 py-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                reclamacion.status === 'RESUELTA'
                                  ? 'bg-green-50 text-green-600'
                                  : 'bg-amber-50 text-amber-600'
                              }`}
                            >
                              {reclamacion.status === 'RESUELTA' ? 'Resuelta' : 'Abierta'}
                            </span>
                            <p className="text-xs text-gray-400">{formatDateTime(reclamacion.createdAt)}</p>
                          </div>
                          <p className="text-sm text-gray-800 mt-1">{reclamacion.description}</p>
                          {reclamacion.status === 'RESUELTA' && (
                            <p className="text-xs text-green-600 mt-1">
                              Resuelto: {reclamacion.resolutionNotes}
                            </p>
                          )}
                        </div>
                        {canResolveReclamaciones && reclamacion.status !== 'RESUELTA' && (
                          <button
                            onClick={() => setResolvingReclamacion(reclamacion)}
                            className="shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                          >
                            Resolver
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showPaymentModal && (
        <PaymentModal
          saldoPendiente={paymentSummary?.saldoPendiente ?? 0}
          onClose={() => setShowPaymentModal(false)}
          onSubmit={async (payload) => {
            const updated = await registerPago(id, payload)
            setPaymentSummary(updated)
            setShowPaymentModal(false)
          }}
        />
      )}

      {showReclamacionModal && (
        <ReclamacionModal
          onClose={() => setShowReclamacionModal(false)}
          onSubmit={async (payload) => {
            const created = await registerReclamacion(id, payload)
            setReclamaciones((prev) => [created, ...prev])
            setShowReclamacionModal(false)
          }}
        />
      )}

      {resolvingReclamacion && (
        <ResolveReclamacionModal
          onClose={() => setResolvingReclamacion(null)}
          onSubmit={async (notes) => {
            const updated = await resolveReclamacion(id, resolvingReclamacion.id, notes)
            setReclamaciones((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
            setResolvingReclamacion(null)
          }}
        />
      )}

      {voidingPago && (
        <VoidPagoModal
          pago={voidingPago}
          onClose={() => setVoidingPago(null)}
          onSubmit={async (reason) => {
            const updated = await voidPago(id, voidingPago.id, reason)
            setPaymentSummary(updated)
            setVoidingPago(null)
          }}
        />
      )}

      {showCancelModal && (
        <CancelModal
          onClose={() => setShowCancelModal(false)}
          onSubmit={async (reason) => {
            const updated = await cancelPedido(id, reason)
            setPedido(updated)
            setShowCancelModal(false)
          }}
        />
      )}

      {/* Etiqueta imprimible: solo visible al imprimir (ver PedidoDetailPage.css) */}
      {pedido && printMode === 'etiqueta' && (
        <div className="hidden print:flex print:flex-col print:items-center print:gap-2 print:text-black">
          <p className="text-lg font-bold">LAVALAVA</p>
          <p className="text-2xl font-extrabold tracking-wide">{pedido.folio}</p>
          <img src={pedido.qrCode} alt={`Código QR del folio ${pedido.folio}`} className="w-40 h-40" />
          <p className="text-sm font-semibold">{pedido.cliente.fullName}</p>
          <p className="text-xs">{formatDateTime(pedido.createdAt)}</p>
          <p className="text-sm font-bold">Total: {formatCurrency(pedido.total)}</p>
        </div>
      )}

      {/* Ticket completo para impresora termica de 80mm (RNF-02): detalle de
          servicios y saldo, no solo el folio. Ver estilos .print-ticket en
          PedidoDetailPage.css */}
      {pedido && printMode === 'ticket' && (
        <div className="hidden print:block print:text-black print-ticket">
          <p className="ticket-title">LAVALAVA</p>
          <p className="ticket-sub">Ticket de pedido</p>

          <div className="ticket-row">
            <span>Folio</span>
            <span>{pedido.folio}</span>
          </div>
          <div className="ticket-row">
            <span>Fecha</span>
            <span>{formatDateTime(pedido.createdAt)}</span>
          </div>
          <div className="ticket-row">
            <span>Cliente</span>
            <span>{pedido.cliente.fullName}</span>
          </div>
          <div className="ticket-row">
            <span>Teléfono</span>
            <span>{pedido.cliente.phoneNumber}</span>
          </div>

          <hr className="ticket-divider" />

          <table className="ticket-items">
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Cant</th>
                <th>Subt.</th>
              </tr>
            </thead>
            <tbody>
              {pedido.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.servicioName}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <hr className="ticket-divider" />

          <div className="ticket-row ticket-total">
            <span>Total</span>
            <span>{formatCurrency(pedido.total)}</span>
          </div>

          {paymentSummary && (
            <>
              <div className="ticket-row">
                <span>Pagado</span>
                <span>{formatCurrency(paymentSummary.totalPagado)}</span>
              </div>
              <div className="ticket-row">
                <span>Saldo pendiente</span>
                <span>{formatCurrency(paymentSummary.saldoPendiente)}</span>
              </div>
            </>
          )}

          <hr className="ticket-divider" />
          <p className="ticket-footer">¡Gracias por tu preferencia!</p>
        </div>
      )}
    </MainLayout>
  )
}

function PaymentModal({ saldoPendiente, onClose, onSubmit }) {
  const [amount, setAmount] = useState(String(saldoPendiente))
  const [method, setMethod] = useState('EFECTIVO')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const parsedAmount = Number(amount)
  const isValidAmount = Number.isFinite(parsedAmount) && parsedAmount > 0 && parsedAmount <= saldoPendiente

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValidAmount) return

    setIsSubmitting(true)
    setError('')
    try {
      await onSubmit({ amount: parsedAmount, method })
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo registrar el pago')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="print:hidden fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 text-lg">Registrar pago</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-500">
          Saldo pendiente: <span className="font-semibold text-gray-800">{formatCurrency(saldoPendiente)}</span>
        </p>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-3 py-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500">Monto</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={saldoPendiente}
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {!isValidAmount && amount !== '' && (
              <p className="text-xs text-red-500 mt-1">
                El monto debe ser mayor a 0 y no exceder el saldo pendiente ({formatCurrency(saldoPendiente)}).
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500">Método de pago</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {PAYMENT_METHOD_VALUES.map((value) => (
                <option key={value} value={value}>
                  {PAYMENT_METHOD_LABELS[value]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 px-3 py-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isValidAmount || isSubmitting}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ReclamacionModal({ onClose, onSubmit }) {
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isValid = description.trim().length > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid) return

    setIsSubmitting(true)
    setError('')
    try {
      await onSubmit({ description: description.trim() })
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo registrar la reclamación')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="print:hidden fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 text-lg">Reportar daño o reclamación</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-3 py-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500">Descripción</label>
            <textarea
              autoFocus
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Mancha en camisa blanca detectada al planchar"
              className="w-full mt-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 px-3 py-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ResolveReclamacionModal({ onClose, onSubmit }) {
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isValid = notes.trim().length > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid) return

    setIsSubmitting(true)
    setError('')
    try {
      await onSubmit(notes.trim())
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo resolver la reclamación')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="print:hidden fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 text-lg">Resolver reclamación</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-3 py-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500">¿Cómo se resolvió?</label>
            <textarea
              autoFocus
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Se aplicó un descuento del 20% al pedido"
              className="w-full mt-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 px-3 py-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              Marcar como resuelta
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function VoidPagoModal({ pago, onClose, onSubmit }) {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isValid = reason.trim().length > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid) return

    setIsSubmitting(true)
    setError('')
    try {
      await onSubmit(reason.trim())
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo anular el pago')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="print:hidden fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 text-lg">Anular pago</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-500">
          Monto: <span className="font-semibold text-gray-800">{formatCurrency(pago.amount)}</span> del{' '}
          {formatDateTime(pago.createdAt)}
        </p>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-3 py-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500">Motivo de la anulación</label>
            <textarea
              autoFocus
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej. Monto capturado por error"
              className="w-full mt-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 px-3 py-2"
            >
              Volver
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              Anular pago
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CancelModal({ onClose, onSubmit }) {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isValid = reason.trim().length > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid) return

    setIsSubmitting(true)
    setError('')
    try {
      await onSubmit(reason.trim())
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cancelar el pedido')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="print:hidden fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 text-lg">Cancelar pedido</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-500">
          Esta acción no reembolsa pagos ya registrados automáticamente. Si el pedido tiene pagos, anúlalos por
          separado si aplica.
        </p>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-3 py-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500">Motivo de la cancelación</label>
            <textarea
              autoFocus
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej. El cliente ya no requiere el servicio"
              className="w-full mt-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 px-3 py-2"
            >
              Volver
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              Cancelar pedido
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PedidoDetailPage
