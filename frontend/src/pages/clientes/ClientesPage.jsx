import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Plus, ChevronLeft, ChevronRight, AlertCircle, Pencil, X, UserSearch } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import MainLayout from '../../components/layout/MainLayout'
import { getNavLinks } from '../../components/layout/navLinks'
import { getClientes, createCliente, updateCliente } from '../../services/clientes.service'
import EmptyState from '../../components/ui/EmptyState'

const PAGE_SIZE = 10

function formatDateTime(value) {
  return new Date(value).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function ClienteModal({ cliente, onClose, onSaved }) {
  const isEdit = Boolean(cliente)
  const [fullName, setFullName] = useState(cliente?.fullName || '')
  const [phoneNumber, setPhoneNumber] = useState(cliente?.phoneNumber || '')
  const [email, setEmail] = useState(cliente?.email || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isValid = fullName.trim().length > 0 && /^\d{10}$/.test(phoneNumber)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid) return

    setIsSubmitting(true)
    setError('')
    try {
      const payload = { fullName: fullName.trim(), phoneNumber, email: email.trim() || null }
      const saved = isEdit ? await updateCliente(cliente.id, payload) : await createCliente(payload)
      onSaved(saved)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar el cliente')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink text-lg">{isEdit ? 'Editar cliente' : 'Nuevo cliente'}</h2>
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
            <label className="text-xs font-semibold text-gray-500">Nombre completo</label>
            <input
              type="text"
              autoFocus
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-detergent"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500">Teléfono (10 dígitos)</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="w-full mt-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-detergent"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500">Correo (opcional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-detergent"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center text-sm font-medium text-ink/70 hover:text-ink border border-ink/20 hover:bg-ink/5 rounded-xl px-4 py-2 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="inline-flex items-center gap-2 bg-detergent hover:bg-detergent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ClientesPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [clienteInput, setClienteInput] = useState('')
  const [cliente, setCliente] = useState('')
  const [page, setPage] = useState(1)

  const [clientes, setClientes] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalCliente, setModalCliente] = useState(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCliente(clienteInput.trim())
      setPage(1)
    }, 400)

    return () => clearTimeout(timeout)
  }, [clienteInput])

  const loadClientes = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const result = await getClientes({ cliente: cliente || undefined, page, pageSize: PAGE_SIZE })
      setClientes(result.data)
      setPagination(result.pagination)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar los clientes')
    } finally {
      setIsLoading(false)
    }
  }, [cliente, page])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadClientes()
  }, [loadClientes])

  const handleSaved = (saved) => {
    setClientes((prev) => {
      const exists = prev.some((item) => item.id === saved.id)
      return exists ? prev.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...prev]
    })
    setModalCliente(null)
    setIsCreateOpen(false)
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
            <h1 className="text-2xl font-bold text-ink">Clientes</h1>
            <p className="text-sm text-gray-400 mt-0.5">Directorio de clientes de mostrador</p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 bg-detergent hover:bg-detergent-hover text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Plus size={16} />
            Nuevo cliente
          </button>
        </div>

        <div className="flex items-end gap-3 flex-wrap bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-gray-500">Nombre o teléfono</label>
            <input
              type="text"
              value={clienteInput}
              onChange={(e) => setClienteInput(e.target.value)}
              placeholder="Buscar cliente..."
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-detergent"
            />
          </div>

          {cliente && (
            <button
              onClick={() => {
                setClienteInput('')
                setCliente('')
                setPage(1)
              }}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 px-2 py-2"
            >
              Limpiar filtro
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
              <p className="text-sm font-medium">Cargando clientes...</p>
            </div>
          ) : clientes.length === 0 ? (
            <EmptyState
              icon={UserSearch}
              title="No hay clientes que coincidan con la búsqueda"
              description="Prueba con otro nombre o teléfono, o registra uno nuevo."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Nombre</th>
                    <th className="px-6 py-3 font-semibold">Teléfono</th>
                    <th className="px-6 py-3 font-semibold">Correo</th>
                    <th className="px-6 py-3 font-semibold">Registrado</th>
                    <th className="px-6 py-3 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {clientes.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-ink">
                        <Link to={`/clientes/${item.id}`} className="text-detergent hover:text-detergent-hover">
                          {item.fullName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{item.phoneNumber}</td>
                      <td className="px-6 py-4 text-gray-500">{item.email || '—'}</td>
                      <td className="px-6 py-4 text-gray-500">{formatDateTime(item.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setModalCliente(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                          <Pencil size={14} />
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && clientes.length > 0 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                Página {pagination.page} de {pagination.totalPages} · {pagination.total} clientes
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

      {isCreateOpen && <ClienteModal onClose={() => setIsCreateOpen(false)} onSaved={handleSaved} />}
      {modalCliente && (
        <ClienteModal cliente={modalCliente} onClose={() => setModalCliente(null)} onSaved={handleSaved} />
      )}
    </MainLayout>
  )
}

export default ClientesPage
