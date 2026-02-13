export default function StatsTiles({ items = [], className = '' }) {
  const safeItems = Array.isArray(items) ? items : []

  return (
    <section className={'grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ' + className}>
      {safeItems.map((s) => (
        <div
          key={s.key || s.label}
          className={
            'bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 ' +
            'border border-purple-100 p-5'
          }
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-600">{s.label}</div>
              <div className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-900">{s.value}</div>
              {s.hint ? <div className="mt-1 text-xs text-slate-600">{s.hint}</div> : null}
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-purple-100 text-purple-700 border border-purple-200">
              <span className="text-sm font-bold">{s.badge || '★'}</span>
            </div>
          </div>
        </div>
      ))}
    </section>
  )
}
