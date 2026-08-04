function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6 py-10">
      {Icon && <Icon size={40} strokeWidth={1.5} className="text-ink/20" />}
      <div>
        <p className="text-sm font-semibold text-ink/70">{title}</p>
        {description && <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">{description}</p>}
      </div>
    </div>
  )
}

export default EmptyState
