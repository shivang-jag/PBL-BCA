import { useMemo } from 'react'

function academicYearLabel(now = new Date()) {
  const year = now.getFullYear()
  const month = now.getMonth() // 0-11
  const startYear = month >= 6 ? year : year - 1
  const endTwoDigit = String((startYear + 1) % 100).padStart(2, '0')
  return `${startYear}–${endTwoDigit}`
}

export default function HeroWelcomeCard({
  user,
  title,
  subtitle,
  mentorLabel,
  submissionLabel,
  metaItems,
  className = '',
}) {
  const displayName = useMemo(() => {
    const raw = String(user?.name || '').trim()
    if (raw) return raw.split(' ')[0] || raw
    const email = String(user?.email || '').trim()
    if (email && email.includes('@')) return email.split('@')[0]
    return 'Shivang'
  }, [user?.email, user?.name])

  const meta = useMemo(() => {
    const provided = Array.isArray(metaItems) ? metaItems.filter(Boolean) : []

    if (provided.length) {
      return [
        { key: 'year', label: '📚 Academic Year', value: academicYearLabel() },
        ...provided,
      ].slice(0, 3)
    }

    return [
      { key: 'year', label: '📚 Academic Year', value: academicYearLabel() },
      { key: 'mentor', label: '👨‍🏫 Mentor', value: mentorLabel || '—' },
      { key: 'submission', label: '📅 Submission Status', value: submissionLabel || '—' },
    ]
  }, [mentorLabel, metaItems, submissionLabel])

  return (
    <section
      className={
        'relative overflow-hidden rounded-2xl ' +
        'bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 ' +
        'px-6 py-6 text-white shadow-lg shadow-purple-500/20 ' +
        'border border-white/15 ' +
        className
      }
    >
      <div className="absolute -inset-8 bg-white/10 blur-3xl" aria-hidden="true" />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-widest text-white/80">PBL DASHBOARD</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              {title || `Welcome Back, ${displayName}`}
            </h1>
            {subtitle ? <p className="mt-1 text-sm text-white/85">{subtitle}</p> : null}
          </div>

          <div className="grid gap-2 rounded-2xl bg-white/10 p-4 backdrop-blur">
            {meta.map((m, idx) => (
              <div key={m.key || m.label || idx} className="flex items-center justify-between gap-6">
                <span className="text-xs text-white/80">{m.label}</span>
                <span className="max-w-[220px] truncate text-xs font-semibold">{m.value ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
