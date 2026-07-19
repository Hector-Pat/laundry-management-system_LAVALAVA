import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, ShieldCheck, ShieldOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import MainLayout from '../../components/layout/MainLayout'
import { getNavLinks } from '../../components/layout/navLinks'
import { getUsers, updateUser } from '../../services/users.service'

const ROLE_LABELS = {
  ADMIN: 'Administrador',
  RECEPCIONISTA: 'Recepcionista',
  OPERADOR: 'Operador',
  CLIENT: 'Cliente',
}

const ROLE_OPTIONS = Object.keys(ROLE_LABELS)

function AdminPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

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
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de usuarios</h1>
          <p className="text-sm text-gray-400 mt-0.5">Administra roles y accesos de todo el personal</p>
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
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <p className="text-sm font-medium">No hay usuarios para mostrar</p>
            </div>
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
                        <td className="px-6 py-4 font-medium text-gray-800">
                          {rowUser.fullName}
                          {isSelf && <span className="ml-2 text-xs text-indigo-500 font-normal">(tú)</span>}
                        </td>
                        <td className="px-6 py-4 text-gray-500">{rowUser.email}</td>
                        <td className="px-6 py-4">
                          <select
                            value={rowUser.role}
                            disabled={isSelf || isRowUpdating}
                            onChange={(e) => handleRoleChange(rowUser, e.target.value)}
                            className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                              rowUser.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                            }`}
                          >
                            {rowUser.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleToggleActive(rowUser)}
                            disabled={isSelf || isRowUpdating}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              rowUser.isActive
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-green-50 text-green-600 hover:bg-green-100'
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
    </MainLayout>
  )
}

export default AdminPage
