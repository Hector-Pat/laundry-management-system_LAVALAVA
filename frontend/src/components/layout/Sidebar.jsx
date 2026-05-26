import { NavLink } from 'react-router-dom'

function Sidebar({ navLinks = [] }) {
  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col shrink-0 h-full">
      <div className="px-6 py-5 border-b border-gray-700">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Menú</p>
      </div>

      <nav className="flex-1 p-4 flex flex-col gap-1">
        {navLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.end ?? true}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span className="shrink-0">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
