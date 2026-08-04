import { NavLink } from 'react-router-dom'

function Sidebar({ navLinks = [] }) {
  return (
    <aside className="w-64 bg-gradient-to-b from-ink to-ink-deep text-white flex flex-col shrink-0 h-full print:hidden">
      <div className="px-6 py-5 border-b border-white/10">
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Menú</p>
      </div>

      <nav className="flex-1 p-4 flex flex-col gap-1">
        {navLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.end ?? true}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-detergent ${
                isActive
                  ? 'bg-detergent text-white shadow-md'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
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
