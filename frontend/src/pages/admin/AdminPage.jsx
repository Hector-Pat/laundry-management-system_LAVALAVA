import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, ShieldCheck, ShieldOff, AlertCircle, Plus, X, KeyRound, Users } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import MainLayout from '../../components/layout/MainLayout'
import { getNavLinks } from '../../components/layout/navLinks'
import { getUsers, createUser, updateUser } from '../../services/users.service'
import EmptyState from '../../components/ui/EmptyState'

const ROLE_LABELS = {
  ADMIN: 'Administrador',
  RECEPCIONISTA: 'Recepcionista',
  OPERADOR: 'Operador',
  CLIENT: 'Cliente',
}

const ROLE_OPTIONS = Object.keys(ROLE_LABELS)
const STAFF_ROLE_OPTIONS = ROLE_OPTIONS.filter((role) => role !== 'CLIENT')

function CreateUserModal({ onClose, onCreated }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('RECEPCIONISTA')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isValid = fullName.trim().length >= 3 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length >= 6

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid) return

    setIsSubmitting(true)
    setError('')
    try {
      const created = await createUser({ fullName: fullName.trim(), email: email.trim(), password, role })
      onCreated(created)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo crear el usuario')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink text-lg">Crear usuario</h2>
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
            <label className="text-xs font-semibold text-gray-500">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-detergent"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-detergent"
            />
            {password.length > 0 && password.length < 6 && (
              <p className="text-xs text-red-500 mt-1">Mínimo 6 caracteres.</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500">Rol</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-detergent"
            >
              {STAFF_ROLE_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {ROLE_LABELS[value]}
                </option>
              ))}
            </select>
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
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ResetPasswordModal({ targetUser, onClose, onSubmit }) {
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isValid = password.length >= 6

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid) return

    setIsSubmitting(true)
    setError('')
    try {
      await onSubmit(password)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo restablecer la contraseña')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink text-lg">Restablecer contraseña</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-500">
          Nueva contraseña para <span className="font-semibold text-ink">{targetUser.fullName}</span>
        </p>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-3 py-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500">Nueva contraseña (mínimo 6 caracteres)</label>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              Restablecer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AdminPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [resettingUser, setResettingUser] = useState(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await getUsers()
      setUsers(data)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cargar la lista de usuarios')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Carga inicial de usuarios: patron estandar de fetch-on-mount, no genera renders en cascada.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers()
  }, [loadUsers])

  const applyUpdate = async (targetUser, payload, fallbackMessage) => {
    setUpdatingId(targetUser.id)
    setError('')
    try {
      const updated = await updateUser(targetUser.id, payload)
      setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
    } catch (err) {
      setError(err.response?.data?.message || fallbackMessage)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRoleChange = (targetUser, role) => {
    if (role === targetUser.role) return
    applyUpdate(targetUser, { role }, 'No se pudo actualizar el rol')
  }

  const handleToggleActive = (targetUser) => {
    applyUpdate(
      targetUser,
      { isActive: !targetUser.isActive },
      'No se pudo actualizar el estado del usuario'
    )
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
            <h1 className="text-2xl font-bold text-ink">Gestión de usuarios</h1>
            <p className="text-sm text-gray-400 mt-0.5">Administra roles y accesos de todo el personal</p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 bg-detergent hover:bg-detergent-hover text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Plus size={16} />
            Crear usuario
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
              <p className="text-sm font-medium">Cargando usuarios...</p>
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No hay usuarios para mostrar"
              description="Crea el primer usuario del sistema desde el botón de arriba."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Nombre</th>
                    <th className="px-6 py-3 font-semibold">Correo</th>
                    <th className="px-6 py-3 font-semibold">Rol</th>
                    <th className="px-6 py-3 font-semibold">Estado</th>
                    <th className="px-6 py-3 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((rowUser) => {
                    const isSelf = rowUser.id === user?.id
                    const isRowUpdating = updatingId === rowUser.id

                    return (
                      <tr key={rowUser.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-ink">
                          {rowUser.fullName}
                          {isSelf && <span className="ml-2 text-xs text-detergent font-normal">(tú)</span>}
                        </td>
                        <td className="px-6 py-4 text-gray-500">{rowUser.email}</td>
                        <td className="px-6 py-4">
                          <select
                            value={rowUser.role}
                            disabled={isSelf || isRowUpdating}
                            onChange={(e) => handleRoleChange(rowUser, e.target.value)}
                            className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-detergent"
                          >
                            {ROLE_OPTIONS.map((role) => (
                              <option key={role} value={role}>
                                {ROLE_LABELS[role]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              rowUser.isActive ? 'bg-green-50 text-sage' : 'bg-red-50 text-red-500'
                            }`}
                          >
                            {rowUser.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => setResettingUser(rowUser)}
                              disabled={isRowUpdating}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <KeyRound size={14} />
                              Contraseña
                            </button>
                            <button
                              onClick={() => handleToggleActive(rowUser)}
                              disabled={isSelf || isRowUpdating}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                rowUser.isActive
                                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                  : 'bg-green-50 text-sage hover:bg-green-100'
                              }`}
                            >
                              {isRowUpdating ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : rowUser.isActive ? (
                                <ShieldOff size={14} />
                              ) : (
                                <ShieldCheck size={14} />
                              )}
                              {rowUser.isActive ? 'Desactivar' : 'Activar'}
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

      {isCreateOpen && (
        <CreateUserModal
          onClose={() => setIsCreateOpen(false)}
          onCreated={(created) => {
            setUsers((prev) => [created, ...prev])
            setIsCreateOpen(false)
          }}
        />
      )}

      {resettingUser && (
        <ResetPasswordModal
          targetUser={resettingUser}
          onClose={() => setResettingUser(null)}
          onSubmit={async (password) => {
            const updated = await updateUser(resettingUser.id, { password })
            setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
            setResettingUser(null)
          }}
        />
      )}
    </MainLayout>
  )
}

export default AdminPage
