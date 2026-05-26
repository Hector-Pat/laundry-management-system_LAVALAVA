import { UserCheck, Shirt, ShieldCheck } from 'lucide-react'

const ICON_MAP = { UserCheck, Shirt, ShieldCheck }

function RoleCard({ role, label, icon, description, selected, onSelect }) {
  const Icon = ICON_MAP[icon]

  return (
    <button
      type="button"
      onClick={() => onSelect(role)}
      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-colors w-full cursor-pointer
        ${selected
          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
          : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300'
        }`}
    >
      {Icon && <Icon size={30} strokeWidth={1.5} />}
      <span className="font-semibold text-sm">{label}</span>
      <span className="text-xs text-gray-500 leading-snug">{description}</span>
    </button>
  )
}

export default RoleCard
