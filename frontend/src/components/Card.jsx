export default function Card({
  title,
  subtitle,
  children,
  id,
  right,
  className = '',
}) {
  return (
    <section
      id={id}
      className={
        'bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 ' +
        'border border-purple-100 ' +
        className
      }
    >
      {title || subtitle || right ? (
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
          <div>
            {title ? <h2 className="text-base font-semibold text-slate-900">{title}</h2> : null}
            {subtitle ? <p className="mt-1 text-xs text-slate-600">{subtitle}</p> : null}
          </div>
          {right ? <div>{right}</div> : null}
        </div>
      ) : null}
      <div className={title || subtitle || right ? 'px-5 pb-5' : 'p-5'}>{children}</div>
    </section>
  )
}
