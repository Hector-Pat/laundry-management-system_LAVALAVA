import { useState } from 'react'
import { LogOut, KeyRound, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { changePassword } from '../../services/auth.service'

function ChangePasswordModal({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const isValid =
    currentPassword.length > 0 && newPassword.length >= 6 && newPassword === confirmPassword

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid) return

    setIsSubmitting(true)
    setError('')
    try {
      await changePassword({ currentPassword, newPassword })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cambiar la contraseña')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="print:hidden fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink text-lg">Cambiar contraseña</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 size={32} className="text-sage" />
            <p className="text-sm text-gray-600">Tu contraseña se actualizó correctamente.</p>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 bg-detergent hover:bg-detergent-hover text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-3 py-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500">Contraseña actual</label>
                <input
                  type="password"
                  autoFocus
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-detergent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500">Contraseña nueva (mínimo 6 caracteres)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-detergent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500">Confirmar contraseña nueva</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-detergent"
                />
                {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                  <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden.</p>
                )}
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
          </>
        )}
      </div>
    </div>
  )
}

function Navbar({ userName = 'Ana García', userRole = 'Recepcionista', onLogout }) {
  const [showChangePassword, setShowChangePassword] = useState(false)

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0 print:hidden">
      <span className="text-2xl font-extrabold text-detergent tracking-widest">
        LAVALAVA
      </span>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold text-ink leading-tight">{userName}</p>
          <p className="text-xs text-detergent font-medium">{userRole}</p>
        </div>
        <button
          onClick={() => setShowChangePassword(true)}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2.5 rounded-xl transition-colors text-sm font-medium"
        >
          <KeyRound size={16} />
          Contraseña
        </button>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 px-4 py-2.5 rounded-xl transition-colors text-sm font-medium"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>

      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
    </header>
  )
}

export default Navbar
