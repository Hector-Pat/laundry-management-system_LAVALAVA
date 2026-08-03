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
  { label: 'Ver Pedidos', path: '/pedidos',  icon: <Package size={26} />, color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-indigo-100' },
  { label: 'Clientes',    path: '/clientes', icon: <Users size={26} />,   color: 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-100' },
  { label: 'Caja',        path: '/caja',     icon: <Wallet size={26} />,  color: 'text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-100' },
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

  const STATS = [
    {
      label: 'Pedidos de hoy',
      value: stats.pedidosHoy,
      icon: <Clock size={32} className="text-blue-500" />,
      iconBg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      label: 'Listos para entregar',
      value: stats.listosParaEntregar,
      icon: <CheckCircle2 size={32} className="text-green-500" />,
      iconBg: 'bg-green-50',
      border: 'border-green-100',
    },
    {
      label: 'Saldo pendiente',
      value: typeof stats.saldoPendiente === 'number' ? formatCurrency(stats.saldoPendiente) : stats.saldoPendiente,
      icon: <DollarSign size={32} className="text-amber-500" />,
      iconBg: 'bg-amber-50',
      border: 'border-amber-100',
    },
  ]

  return (
    <MainLayout navLinks={getNavLinks(user?.role)} userName={user?.fullName} userRole={user?.role} onLogout={handleLogout}>
      {/* flex col + h-full para que las secciones llenen el alto disponible */}
      <div className="flex flex-col h-full gap-5">

        {/* Encabezado */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bienvenido, {user?.fullName}</h1>
          <p className="text-sm text-gray-400 mt-0.5 capitalize">{today}</p>
        </div>

        {/* Nuevo Pedido — tarjeta destacada, crece para ocupar espacio */}
        <div className="flex-1 bg-indigo-600 rounded-2xl p-7 text-white shadow-lg flex items-center justify-between gap-6 min-h-[140px]">
          <div className="flex items-center gap-5">
            <div className="bg-indigo-500 p-4 rounded-2xl shrink-0">
              <FilePlus size={40} className="text-white" />
            </div>
            <div>
              <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest mb-1">
                Acción principal
              </p>
              <h2 className="text-3xl font-extrabold leading-tight">Nuevo Pedido</h2>
              <p className="text-indigo-200 text-sm mt-1">
                Registra un nuevo pedido de lavandería
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/pedidos/nuevo')}
            className="shrink-0 flex items-center gap-2 bg-white text-indigo-600 font-bold px-7 py-4 rounded-2xl hover:bg-indigo-50 active:scale-95 transition-all text-lg shadow-md"
          >
            Crear pedido
            <ArrowRight size={20} />
          </button>
        </div>

        {/* Stats — tarjetas medianas */}
        <div className="grid grid-cols-3 gap-4 flex-1 min-h-[120px]">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className={`bg-white rounded-2xl p-6 shadow-sm border ${stat.border} flex flex-col justify-between`}
            >
              <div className={`${stat.iconBg} p-3 rounded-xl w-fit`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-4xl font-extrabold text-gray-800 mt-3">
                  {isLoadingStats ? '…' : stat.value}
                </p>
                <p className="text-sm text-gray-500 mt-1 leading-tight">{stat.label}</p>
              </div>
            </div>
          ))}
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
