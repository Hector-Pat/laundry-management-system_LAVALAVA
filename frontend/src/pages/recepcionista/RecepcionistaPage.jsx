import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  FilePlus,
  Package,
  Users,
  Wallet,
  ArrowRight,
  Clock,
  CheckCircle2,
  DollarSign,
} from 'lucide-react'
import MainLayout from '../../components/layout/MainLayout'
import { getNavLinks } from '../../components/layout/navLinks'
import { getPedidos } from '../../services/pedidos.service'
import { getPagos } from '../../services/pagos.service'

const QUICK_LINKS = [
  { label: 'Ver Pedidos', path: '/pedidos',  icon: <Package size={26} />, color: 'text-detergent bg-detergent/10 hover:bg-detergent/15 border-detergent/20' },
  { label: 'Clientes',    path: '/clientes', icon: <Users size={26} />,   color: 'text-detergent bg-detergent/10 hover:bg-detergent/15 border-detergent/20' },
  { label: 'Caja',        path: '/caja',     icon: <Wallet size={26} />,  color: 'text-tag bg-tag/10 hover:bg-tag/15 border-tag/20' },
]

function todayISODate() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function formatCurrency(value) {
  return `$${Number(value).toFixed(2)}`
}

function RecepcionistaPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [stats, setStats] = useState({ pedidosHoy: null, listosParaEntregar: null, saldoPendiente: null })
  const [isLoadingStats, setIsLoadingStats] = useState(true)

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

  const loadStats = useCallback(async () => {
    setIsLoadingStats(true)
    try {
      const [hoyResult, listosResult] = await Promise.all([
        getPedidos({ date: todayISODate(), pageSize: 1 }),
        getPedidos({ status: 'LISTO', pageSize: 100 }),
      ])

      const listos = listosResult.data.filter((pedido) => !pedido.cancelledAt)
      const saldos = await Promise.all(listos.map((pedido) => getPagos(pedido.id)))
      const saldoPendiente = saldos.reduce((acc, saldo) => acc + Number(saldo.saldoPendiente), 0)

      setStats({
        pedidosHoy: hoyResult.pagination.total,
        listosParaEntregar: listos.length,
        saldoPendiente,
      })
    } catch {
      setStats({ pedidosHoy: '—', listosParaEntregar: '—', saldoPendiente: '—' })
    } finally {
      setIsLoadingStats(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStats()
  }, [loadStats])

  const TONE_CLASSES = {
    detergent: 'bg-detergent/10 text-detergent',
    tag: 'bg-tag/10 text-tag',
    sage: 'bg-sage/10 text-sage',
  }

  const STATS = [
    {
      label: 'Pedidos de hoy',
      value: stats.pedidosHoy,
      icon: Clock,
      tone: 'detergent',
    },
    {
      label: 'Listos para entregar',
      value: stats.listosParaEntregar,
      icon: CheckCircle2,
      tone: 'sage',
    },
    {
      label: 'Saldo pendiente',
      value: typeof stats.saldoPendiente === 'number' ? formatCurrency(stats.saldoPendiente) : stats.saldoPendiente,
      icon: DollarSign,
      tone: 'tag',
    },
  ]

  return (
    <MainLayout navLinks={getNavLinks(user?.role)} userName={user?.fullName} userRole={user?.role} onLogout={handleLogout}>
      {/* flex col + h-full para que las secciones llenen el alto disponible */}
      <div className="flex flex-col h-full gap-5">

        {/* Encabezado */}
        <div>
          <h1 className="text-2xl font-bold text-ink">Bienvenido, {user?.fullName}</h1>
          <p className="text-sm text-gray-400 mt-0.5 capitalize">{today}</p>
        </div>

        {/* Nuevo Pedido — tarjeta destacada, crece para ocupar espacio */}
        <div className="flex-1 bg-detergent rounded-2xl p-7 text-white shadow-lg flex items-center justify-between gap-6 min-h-[140px]">
          <div className="flex items-center gap-5">
            <div className="bg-white/15 p-4 rounded-2xl shrink-0">
              <FilePlus size={40} className="text-white" />
            </div>
            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">
                Acción principal
              </p>
              <h2 className="text-3xl font-extrabold leading-tight">Nuevo Pedido</h2>
              <p className="text-white/70 text-sm mt-1">
                Registra un nuevo pedido de lavandería
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/pedidos/nuevo')}
            className="shrink-0 flex items-center gap-2 bg-white text-detergent font-bold px-7 py-4 rounded-2xl hover:bg-linen active:scale-95 transition-all text-lg shadow-md"
          >
            Crear pedido
            <ArrowRight size={20} />
          </button>
        </div>

        {/* Stats — tarjetas medianas */}
        <div className="grid grid-cols-3 gap-4 flex-1 min-h-[120px]">
          {STATS.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="ticket-edge bg-surface rounded-2xl p-5 shadow-sm border border-black/5 flex items-center gap-4"
              >
                <div className={`shrink-0 p-3 rounded-xl ${TONE_CLASSES[stat.tone]}`}>
                  <Icon size={26} />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-4xl font-bold text-ink leading-none">
                    {isLoadingStats ? '…' : stat.value}
                  </p>
                  <p className="text-sm text-gray-500 mt-1.5 leading-tight">{stat.label}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Accesos rápidos — botones grandes táctiles */}
        <div className="grid grid-cols-3 gap-4 flex-1 min-h-[100px]">
          {QUICK_LINKS.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-3 ${item.color} font-semibold rounded-2xl transition-colors active:scale-95 border text-base`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

      </div>
    </MainLayout>
  )
}

export default RecepcionistaPage
