import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, UserPlus, Loader2, AlertCircle, Minus, Plus } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import MainLayout from '../../components/layout/MainLayout'
import { getNavLinks } from '../../components/layout/navLinks'
import { searchClientes } from '../../services/clientes.service'
import { getServicios } from '../../services/servicios.service'
import { createPedido } from '../../services/pedidos.service'

function formatCurrency(value) {
  return `$${Number(value).toFixed(2)}`
}

function PedidoFormPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Cliente: buscar uno existente, o darlo de alta con solo nombre + telefono.
  const [clienteMode, setClienteMode] = useState('search')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState(null)
  const [newCliente, setNewCliente] = useState({ fullName: '', phoneNumber: '', email: '' })

  useEffect(() => {
    if (clienteMode !== 'search' || searchTerm.trim().length < 2 || selectedCliente) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- limpia resultados obsoletos, no dispara fetch
      setSearchResults([])
      return undefined
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await searchClientes(searchTerm.trim())
        setSearchResults(results)
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 350)

    return () => clearTimeout(timeout)
  }, [searchTerm, clienteMode, selectedCliente])

  // Servicios activos del catalogo.
  const [servicios, setServicios] = useState([])
  const [isLoadingServicios, setIsLoadingServicios] = useState(true)
  const [quantities, setQuantities] = useState({})

  const loadServicios = useCallback(async () => {
    setIsLoadingServicios(true)
    try {
      const data = await getServicios()
      setServicios(data)
    } catch {
      setServicios([])
    } finally {
      setIsLoadingServicios(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadServicios()
  }, [loadServicios])

  const toggleServicio = (servicioId) => {
    setQuantities((prev) => {
      const next = { ...prev }
      if (next[servicioId]) {
        delete next[servicioId]
      } else {
        next[servicioId] = 1
      }
      return next
    })
  }

  const setQuantity = (servicioId, quantity) => {
    setQuantities((prev) => ({ ...prev, [servicioId]: Math.max(1, quantity) }))
  }

  const selectedItems = useMemo(
    () =>
      servicios
        .filter((servicio) => quantities[servicio.id])
        .map((servicio) => ({
          servicio,
          quantity: quantities[servicio.id],
          subtotal: Number(servicio.price) * quantities[servicio.id],
        })),
    [servicios, quantities]
  )

  const total = useMemo(() => selectedItems.reduce((sum, item) => sum + item.subtotal, 0), [selectedItems])

  const isNewClienteValid = newCliente.fullName.trim() && /^\d{10}$/.test(newCliente.phoneNumber)
  const hasValidCliente = clienteMode === 'search' ? Boolean(selectedCliente) : isNewClienteValid
  const canSubmit = hasValidCliente && selectedItems.length > 0

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return

    setIsSubmitting(true)
    setError('')
    try {
      const cliente =
        clienteMode === 'search'
          ? { id: selectedCliente.id }
          : {
              fullName: newCliente.fullName.trim(),
              phoneNumber: newCliente.phoneNumber,
              email: newCliente.email.trim() || undefined,
            }

      const pedido = await createPedido({
        cliente,
        items: selectedItems.map((item) => ({ servicioId: item.servicio.id, quantity: item.quantity })),
      })

      navigate(`/pedidos/${pedido.id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo crear el pedido')
      setIsSubmitting(false)
    }
  }

  return (
    <MainLayout
      navLinks={getNavLinks(user?.role)}
      userName={user?.fullName}
      userRole={user?.role}
      onLogout={handleLogout}
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full gap-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Nuevo pedido</h1>
          <p className="text-sm text-gray-400 mt-0.5">Selecciona un cliente y los servicios a registrar</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 min-h-0">
          {/* Cliente */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Cliente</h2>
              <button
                type="button"
                onClick={() => {
                  setClienteMode((mode) => (mode === 'search' ? 'new' : 'search'))
                  setSelectedCliente(null)
                  setSearchTerm('')
                  setSearchResults([])
                }}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
              >
                <UserPlus size={14} />
                {clienteMode === 'search' ? 'Registrar cliente nuevo' : 'Buscar cliente existente'}
              </button>
            </div>

            {clienteMode === 'search' ? (
              selectedCliente ? (
                <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                  <div>
                    <p className="font-semibold text-gray-800">{selectedCliente.fullName}</p>
                    <p className="text-xs text-gray-500">{selectedCliente.phoneNumber}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCliente(null)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      autoFocus
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por nombre, teléfono o correo..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {isSearching && (
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      <Loader2 size={12} className="animate-spin" /> Buscando...
                    </p>
                  )}

                  {!isSearching && searchResults.length > 0 && (
                    <div className="mt-2 border border-gray-100 rounded-xl divide-y divide-gray-100 max-h-56 overflow-y-auto">
                      {searchResults.map((cliente) => (
                        <button
                          type="button"
                          key={cliente.id}
                          onClick={() => setSelectedCliente(cliente)}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50"
                        >
                          <p className="text-sm font-medium text-gray-800">{cliente.fullName}</p>
                          <p className="text-xs text-gray-400">{cliente.phoneNumber}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {!isSearching && searchTerm.trim().length >= 2 && searchResults.length === 0 && (
                    <p className="text-xs text-gray-400 mt-2">Sin resultados. Puedes registrarlo como nuevo.</p>
                  )}
                </div>
              )
            ) : (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500">Nombre completo</label>
                  <input
                    type="text"
                    value={newCliente.fullName}
                    onChange={(e) => setNewCliente((prev) => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Ej. María González"
                    className="w-full mt-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Teléfono (10 dígitos)</label>
                  <input
                    type="tel"
                    value={newCliente.phoneNumber}
                    onChange={(e) => setNewCliente((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="5512345678"
                    className="w-full mt-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Correo (opcional)</label>
                  <input
                    type="email"
                    value={newCliente.email}
                    onChange={(e) => setNewCliente((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="correo@ejemplo.com"
                    className="w-full mt-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Servicios */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 min-h-0">
            <h2 className="font-semibold text-gray-800">Servicios</h2>

            {isLoadingServicios ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 gap-2">
                <Loader2 size={20} className="animate-spin" /> Cargando servicios...
              </div>
            ) : (
              <div className="flex flex-col gap-2 overflow-y-auto flex-1">
                {servicios.map((servicio) => {
                  const quantity = quantities[servicio.id]
                  const isChecked = Boolean(quantity)

                  return (
                    <div
                      key={servicio.id}
                      className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-colors ${
                        isChecked ? 'border-indigo-200 bg-indigo-50/50' : 'border-gray-100'
                      }`}
                    >
                      <label className="flex items-center gap-3 flex-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleServicio(servicio.id)}
                          className="h-4 w-4 accent-indigo-600"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{servicio.name}</p>
                          <p className="text-xs text-gray-400">{formatCurrency(servicio.price)} c/u</p>
                        </div>
                      </label>

                      {isChecked && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setQuantity(servicio.id, quantity - 1)}
                            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-6 text-center text-sm font-semibold">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity(servicio.id, quantity + 1)}
                            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Total en vivo + submit */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</p>
            <p className="text-3xl font-extrabold text-gray-800">{formatCurrency(total)}</p>
          </div>
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            {isSubmitting && <Loader2 size={18} className="animate-spin" />}
            {isSubmitting ? 'Creando pedido...' : 'Crear pedido'}
          </button>
        </div>
      </form>
    </MainLayout>
  )
}

export default PedidoFormPage
