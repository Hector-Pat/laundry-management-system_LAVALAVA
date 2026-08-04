import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle, Plus, TrendingUp, TrendingDown, Wallet, Download } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import MainLayout from '../../components/layout/MainLayout'
import { getNavLinks } from '../../components/layout/navLinks'
import { getCorteCaja, createGasto, getReporteCaja } from '../../services/caja.service'
import { PAYMENT_METHOD_LABELS, PAYMENT_TYPE_LABELS } from '../../constants/paymentMethods'

function formatCurrency(value) {
  return `$${Number(value).toFixed(2)}`
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

function todayISODate() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function CajaPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const [date, setDate] = useState(todayISODate)
  const [corte, setCorte] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadCorte = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await getCorteCaja(date)
      setCorte(data)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cargar el corte de caja')
    } finally {
      setIsLoading(false)
    }
  }, [date])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial del corte
    loadCorte()
  }, [loadCorte])

  // Reporte por rango (distinto del corte del dia): tendencia de ingresos y
  // egresos agrupada por dia, con exportacion a CSV generada en el cliente.
  const [reporteDesde, setReporteDesde] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 6)
    return d.toISOString().slice(0, 10)
  })
  const [reporteHasta, setReporteHasta] = useState(todayISODate)
  const [reporte, setReporte] = useState(null)
  const [isLoadingReporte, setIsLoadingReporte] = useState(true)
  const [reporteError, setReporteError] = useState('')

  const loadReporte = useCallback(async () => {
    setIsLoadingReporte(true)
    setReporteError('')
    try {
      const data = await getReporteCaja(reporteDesde, reporteHasta)
      setReporte(data)
    } catch (err) {
      setReporteError(err.response?.data?.message || 'No se pudo cargar el reporte')
    } finally {
      setIsLoadingReporte(false)
    }
  }, [reporteDesde, reporteHasta])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial del reporte
    loadReporte()
  }, [loadReporte])

  const handleExportCsv = () => {
    if (!reporte) return

    const rows = [
      ['Fecha', 'Ingresos', 'Egresos', 'Total'],
      ...reporte.dias.map((dia) => [dia.date, dia.ingresos, dia.egresos, dia.total]),
      ['Total', reporte.totales.ingresos, reporte.totales.egresos, reporte.totales.total],
    ]
    const csv = rows.map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `caja_${reporte.from}_a_${reporte.to}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const [gasto, setGasto] = useState({ concept: '', amount: '' })
  const [isSubmittingGasto, setIsSubmittingGasto] = useState(false)
  const [gastoError, setGastoError] = useState('')

  const canSubmitGasto = gasto.concept.trim() && Number(gasto.amount) > 0

  const handleAddGasto = async (e) => {
    e.preventDefault()
    if (!canSubmitGasto) return

    setIsSubmittingGasto(true)
    setGastoError('')
    try {
      await createGasto({ concept: gasto.concept.trim(), amount: Number(gasto.amount) })
      setGasto({ concept: '', amount: '' })
      await loadCorte()
    } catch (err) {
      setGastoError(err.response?.data?.message || 'No se pudo registrar el egreso')
    } finally {
      setIsSubmittingGasto(false)
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
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-ink">Corte de caja</h1>
            <p className="text-sm text-gray-400 mt-0.5">Ingresos, egresos y total del día (RF-08)</p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-detergent"
            />
          </div>
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
            <p className="text-sm font-medium">Cargando corte de caja...</p>
          </div>
        ) : corte ? (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-3">
                <div className="bg-green-50 text-sage rounded-xl p-2.5">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Ingresos</p>
                  <p className="text-xl font-extrabold text-ink">{formatCurrency(corte.ingresos)}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-3">
                <div className="bg-red-50 text-red-600 rounded-xl p-2.5">
                  <TrendingDown size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Egresos</p>
                  <p className="text-xl font-extrabold text-ink">{formatCurrency(corte.egresos)}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-3">
                <div className="bg-detergent/10 text-detergent rounded-xl p-2.5">
                  <Wallet size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total en caja</p>
                  <p className="text-xl font-extrabold text-ink">{formatCurrency(corte.total)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-3 border-b border-gray-100">
                  <h2 className="font-semibold text-ink">Pagos cobrados</h2>
                </div>
                {corte.pagos.length === 0 ? (
                  <p className="text-sm text-gray-400 px-6 py-6 text-center">Sin pagos registrados</p>
                ) : (
                  <div className="divide-y divide-gray-100 overflow-y-auto max-h-80">
                    {corte.pagos.map((pago) => (
                      <div key={pago.id} className="flex items-center justify-between px-6 py-3 text-sm">
                        <div>
                          <p className="font-semibold text-ink">{pago.pedidoFolio}</p>
                          <p className="text-xs text-gray-400">
                            {PAYMENT_TYPE_LABELS[pago.type]} · {PAYMENT_METHOD_LABELS[pago.method]} · {formatTime(pago.createdAt)}
                          </p>
                        </div>
                        <span className="font-semibold text-sage">{formatCurrency(pago.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                <div className="px-6 py-3 border-b border-gray-100">
                  <h2 className="font-semibold text-ink">Egresos</h2>
                </div>

                {corte.gastos.length === 0 ? (
                  <p className="text-sm text-gray-400 px-6 py-6 text-center">Sin egresos registrados</p>
                ) : (
                  <div className="divide-y divide-gray-100 overflow-y-auto max-h-56">
                    {corte.gastos.map((item) => (
                      <div key={item.id} className="flex items-center justify-between px-6 py-3 text-sm">
                        <div>
                          <p className="font-semibold text-ink">{item.concept}</p>
                          <p className="text-xs text-gray-400">{formatTime(item.createdAt)}</p>
                        </div>
                        <span className="font-semibold text-red-600">-{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleAddGasto} className="p-4 border-t border-gray-100 flex flex-col gap-2">
                  {gastoError && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-3 py-2">
                      <AlertCircle size={14} />
                      {gastoError}
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      value={gasto.concept}
                      onChange={(e) => setGasto((prev) => ({ ...prev, concept: e.target.value }))}
                      placeholder="Concepto del gasto"
                      className="flex-1 min-w-[140px] rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-detergent"
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={gasto.amount}
                      onChange={(e) => setGasto((prev) => ({ ...prev, amount: e.target.value }))}
                      placeholder="Monto"
                      className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-detergent"
                    />
                    <button
                      type="submit"
                      disabled={!canSubmitGasto || isSubmittingGasto}
                      className="inline-flex items-center gap-1.5 bg-gray-800 hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-3 py-2 rounded-lg transition-colors text-sm"
                    >
                      {isSubmittingGasto ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      Agregar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : null}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-semibold text-ink">Reporte por rango de fechas</h2>
              <p className="text-xs text-gray-400 mt-0.5">Ingresos y egresos agrupados por día</p>
            </div>
            <div className="flex items-end gap-3 flex-wrap">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500">Desde</label>
                <input
                  type="date"
                  value={reporteDesde}
                  max={reporteHasta}
                  onChange={(e) => setReporteDesde(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-detergent"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500">Hasta</label>
                <input
                  type="date"
                  value={reporteHasta}
                  min={reporteDesde}
                  max={todayISODate()}
                  onChange={(e) => setReporteHasta(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-detergent"
                />
              </div>
              <button
                onClick={handleExportCsv}
                disabled={!reporte || reporte.dias.length === 0}
                className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
              >
                <Download size={16} />
                Exportar CSV
              </button>
            </div>
          </div>

          {reporteError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
              <AlertCircle size={18} />
              {reporteError}
            </div>
          )}

          {isLoadingReporte ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-6 justify-center">
              <Loader2 size={20} className="animate-spin" /> Cargando reporte...
            </div>
          ) : !reporte || reporte.dias.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Sin movimientos en el rango seleccionado</p>
          ) : (
            <div className="overflow-x-auto border border-gray-100 rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Fecha</th>
                    <th className="px-4 py-2 font-semibold">Ingresos</th>
                    <th className="px-4 py-2 font-semibold">Egresos</th>
                    <th className="px-4 py-2 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reporte.dias.map((dia) => (
                    <tr key={dia.date}>
                      <td className="px-4 py-2 text-gray-700">{dia.date}</td>
                      <td className="px-4 py-2 text-sage font-medium">{formatCurrency(dia.ingresos)}</td>
                      <td className="px-4 py-2 text-red-600 font-medium">{formatCurrency(dia.egresos)}</td>
                      <td className="px-4 py-2 font-semibold text-ink">{formatCurrency(dia.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2 font-semibold text-gray-600">Total</td>
                    <td className="px-4 py-2 font-semibold text-sage">
                      {formatCurrency(reporte.totales.ingresos)}
                    </td>
                    <td className="px-4 py-2 font-semibold text-red-600">
                      {formatCurrency(reporte.totales.egresos)}
                    </td>
                    <td className="px-4 py-2 font-extrabold text-ink">
                      {formatCurrency(reporte.totales.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

export default CajaPage
