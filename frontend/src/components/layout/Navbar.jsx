import { LogOut } from 'lucide-react'

function Navbar({ userName = 'Ana García', userRole = 'Recepcionista', onLogout }) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0 print:hidden">
      <span className="text-2xl font-extrabold text-indigo-600 tracking-widest">
        LAVALAVA
      </span>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-800 leading-tight">{userName}</p>
          <p className="text-xs text-indigo-500 font-medium">{userRole}</p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 px-4 py-2.5 rounded-xl transition-colors text-sm font-medium"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}

export default Navbar
