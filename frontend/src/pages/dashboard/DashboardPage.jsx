import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle, ClipboardList, CheckCircle2, Clock, Wallet, TrendingUp } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import MainLayout from '../../components/layout/MainLayout'
import { getNavLinks } from '../../components/layout/navLinks'
import { getPedidos } from '../../services/pedidos.service'
import { getCorteCaja, getReporteCaja } from '../../services/caja.service'

// Ingreso del dia/semana es informacion financiera: solo ADMIN la ve en el
// dashboard, igual que /caja esta reservada a RECEPCIONISTA/ADMIN. El resto
// de KPIs son operativos y los ve cualquier rol de piso.
const FINANCIAL_ROLES = ['ADMIN']

function todayISODate() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function formatCurrency(value) {
  return `$${Number(value).toFixed(2)}`
}

function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const canSeeFinancials = FINANCIAL_ROLES.includes(user?.role)

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

  const [kpis, setKpis] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadKpis = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const todayISO = todayISODate()

      const [pedidosHoyResult, entregadosHoyResult, listosResult] = await Promise.all([
        getPedidos({ date: todayISO, pageSize: 1 }),
        getPedidos({ deliveredDate: todayISO, pageSize: 1 }),
        getPedidos({ status: 'LISTO', pageSize: 100 }),
      ])

      const listosPendientes = listosResult.data.filter((pedido) => !pedido.cancelledAt).length

      const next = {
        pedidosHoy: pedidosHoyResult.pagination.total,
        entregadosHoy: entregadosHoyResult.pagination.total,
        listosPendientes,
        ingresoDia: null,
        ingresoSemana: null,
      }

      if (canSeeFinancials) {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 6)
        const weekAgoISO = weekAgo.toISOString().slice(0, 10)

        const [corte, reporte] = await Promise.all([
          getCorteCaja(todayISO),
          getReporteCaja(weekAgoISO, todayISO),
        ])

        next.ingresoDia = corte.ingresos
        next.ingresoSemana = reporte.totales.ingresos
      }

      setKpis(next)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar los datos del panel')
    } finally {
      setIsLoading(false)
    }
  }, [canSeeFinancials])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadKpis()
  }, [loadKpis])

  const TONE_CLASSES = {
    detergent: 'bg-detergent/10 text-detergent',
    tag: 'bg-tag/10 text-tag',
    sage: 'bg-sage/10 text-sage',
  }

  const cards = kpis && [
    {
      label: 'Pedidos de hoy',
      value: kpis.pedidosHoy,
      icon: ClipboardList,
      tone: 'detergent',
    },
    {
      label: 'Entregados hoy',
      value: kpis.entregadosHoy,
      icon: CheckCircle2,
      tone: 'sage',
    },
    {
      label: 'Pendientes de entrega',
      value: kpis.listosPendientes,
      icon: Clock,
      tone: 'tag',
    },
    ...(canSeeFinancials
      ? [
          {
            label: 'Ingreso del día',
            value: formatCurrency(kpis.ingresoDia),
            icon: Wallet,
            tone: 'detergent',
          },
          {
            label: 'Ingreso de la semana',
            value: formatCurrency(kpis.ingresoSemana),
            icon: TrendingUp,
            tone: 'detergent',
          },
        ]
      : []),
  ]

  return (
    <MainLayout navLinks={getNavLinks(user?.role)} userName={user?.fullName} userRole={user?.role} onLogout={handleLogout}>
      <div className="flex h-full flex-col gap-5">
        <div>
          <h1 className="text-2xl font-bold text-ink">Bienvenido, {user?.fullName}</h1>
          <p className="text-sm text-gray-400 mt-0.5 capitalize">{today}</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-black/10 shadow-sm text-gray-400">
            <Loader2 size={32} className="animate-spin" />
            <p className="text-sm font-medium">Cargando datos del panel...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1 auto-rows-fr">
            {cards.map((card) => {
              const Icon = card.icon
              return (
                <div
                  key={card.label}
                  className="ticket-edge bg-surface rounded-2xl p-5 shadow-sm border border-black/5 flex items-center gap-4"
                >
                  <div className={`shrink-0 p-3 rounded-xl ${TONE_CLASSES[card.tone]}`}>
                    <Icon size={26} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-4xl font-bold text-ink leading-none">{card.value}</p>
                    <p className="text-sm text-gray-500 mt-1.5 leading-tight">{card.label}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default DashboardPage
