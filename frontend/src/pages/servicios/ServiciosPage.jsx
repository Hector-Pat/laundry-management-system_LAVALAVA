import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle, Plus, X, Pencil, ShieldCheck, ShieldOff, Shirt } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import MainLayout from '../../components/layout/MainLayout'
import { getNavLinks } from '../../components/layout/navLinks'
import { getAllServicios, createServicio, updateServicio } from '../../services/servicios.service'
import EmptyState from '../../components/ui/EmptyState'

function formatCurrency(value) {
  return Number(value).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
}

function ServicioModal({ servicio, onClose, onSaved }) {
  const isEdit = Boolean(servicio)
  const [name, setName] = useState(servicio?.name || '')
  const [price, setPrice] = useState(servicio ? String(servicio.price) : '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const parsedPrice = Number(price)
  const isValid = name.trim().length > 0 && Number.isFinite(parsedPrice) && parsedPrice > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid) return

    setIsSubmitting(true)
    setError('')
    try {
      const payload = { name: name.trim(), price: parsedPrice }
      const saved = isEdit ? await updateServicio(servicio.id, payload) : await createServicio(payload)
      onSaved(saved)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar el servicio')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink text-lg">{isEdit ? 'Editar servicio' : 'Nuevo servicio'}</h2>
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
            <label className="text-xs font-semibold text-gray-500">Nombre</label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-detergent"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500">Precio</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
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

function ServiciosPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [servicios, setServicios] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [modalServicio, setModalServicio] = useState(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const loadServicios = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await getAllServicios()
      setServicios(data)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cargar el catálogo de servicios')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadServicios()
  }, [loadServicios])

  const handleToggleActive = async (servicio) => {
    setUpdatingId(servicio.id)
    setError('')
    try {
      const updated = await updateServicio(servicio.id, { isActive: !servicio.isActive })
      setServicios((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo actualizar el estado del servicio')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleSaved = (saved) => {
    setServicios((prev) => {
      const exists = prev.some((item) => item.id === saved.id)
      return exists ? prev.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...prev]
    })
    setModalServicio(null)
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">Catálogo de servicios</h1>
            <p className="text-sm text-gray-400 mt-0.5">Administra los servicios y precios disponibles</p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 bg-detergent hover:bg-detergent-hover text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Plus size={16} />
            Nuevo servicio
          </button>
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
              <p className="text-sm font-medium">Cargando servicios...</p>
            </div>
          ) : servicios.length === 0 ? (
            <EmptyState
              icon={Shirt}
              title="No hay servicios para mostrar"
              description="Agrega el primer servicio del catálogo desde el botón de arriba."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Nombre</th>
                    <th className="px-6 py-3 font-semibold">Precio</th>
                    <th className="px-6 py-3 font-semibold">Estado</th>
                    <th className="px-6 py-3 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {servicios.map((servicio) => {
                    const isRowUpdating = updatingId === servicio.id

                    return (
                      <tr key={servicio.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-ink">{servicio.name}</td>
                        <td className="px-6 py-4 text-gray-500">{formatCurrency(servicio.price)}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              servicio.isActive ? 'bg-green-50 text-sage' : 'bg-red-50 text-red-500'
                            }`}
                          >
                            {servicio.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => setModalServicio(servicio)}
                              disabled={isRowUpdating}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Pencil size={14} />
                              Editar
                            </button>
                            <button
                              onClick={() => handleToggleActive(servicio)}
                              disabled={isRowUpdating}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                servicio.isActive
                                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                  : 'bg-green-50 text-sage hover:bg-green-100'
                              }`}
                            >
                              {isRowUpdating ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : servicio.isActive ? (
                                <ShieldOff size={14} />
                              ) : (
                                <ShieldCheck size={14} />
                              )}
                              {servicio.isActive ? 'Desactivar' : 'Activar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isCreateOpen && <ServicioModal onClose={() => setIsCreateOpen(false)} onSaved={handleSaved} />}
      {modalServicio && (
        <ServicioModal servicio={modalServicio} onClose={() => setModalServicio(null)} onSaved={handleSaved} />
      )}
    </MainLayout>
  )
}

export default ServiciosPage
