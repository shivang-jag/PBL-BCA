import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  )
}

function normalizeEmail(v) {
  return String(v || '').trim().toLowerCase()
}

function normalizeRoll(v) {
  return String(v || '').trim().toUpperCase()
}

export default function CreateTeam({ yearId, subjectId, yearLabel, subjectLabel }) {
  const { user } = useAuth()
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [lockedMounted, setLockedMounted] = useState(false)

  const teamId = team?._id

  const [teamName, setTeamName] = useState('')
  const [members, setMembers] = useState(() => [
    { name: user?.name || 'Leader', email: user?.email || '', rollNumber: '', isLeader: true },
    { name: '', email: '', rollNumber: '', isLeader: false },
    { name: '', email: '', rollNumber: '', isLeader: false },
    { name: '', email: '', rollNumber: '', isLeader: false },
  ])

  useEffect(() => {
    setTeamName('')
    setMembers([
      { name: user?.name || 'Leader', email: user?.email || '', rollNumber: '', isLeader: true },
      { name: '', email: '', rollNumber: '', isLeader: false },
      { name: '', email: '', rollNumber: '', isLeader: false },
      { name: '', email: '', rollNumber: '', isLeader: false },
    ])
  }, [subjectId, user?.email, user?.name, yearId])

  useEffect(() => {
    if (!yearId || !subjectId) {
      setTeam(null)
      setError('')
      setLockedMounted(false)
      return
    }
    let alive = true
    async function loadMyTeam() {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get('/teams/my', { params: { yearId, subjectId } })
        if (!alive) return
        setTeam(data.team)
      } catch (e) {
        if (!alive) return
        setError(e?.response?.data?.message || 'Failed to load team status')
      } finally {
        if (alive) setLoading(false)
      }
    }
    loadMyTeam()
    return () => {
      alive = false
    }
  }, [yearId, subjectId])

  useEffect(() => {
    if (!team) {
      setLockedMounted(false)
      return
    }
    const t = setTimeout(() => setLockedMounted(true), 30)
    return () => clearTimeout(t)
  }, [team, teamId])

  const clientValidation = useMemo(() => {
    if (!yearId || !subjectId) return { ok: false, message: 'Select year and subject to continue' }
    if (!teamName.trim()) return { ok: false, message: 'Team name is required' }

    const normalized = members.map((m) => ({
      name: String(m.name || '').trim(),
      email: normalizeEmail(m.email),
      rollNumber: normalizeRoll(m.rollNumber),
      isLeader: Boolean(m.isLeader),
    }))

    const compact = normalized.filter((m) => m.isLeader || m.name || m.email || m.rollNumber)

    if (compact.length < 3 || compact.length > 4) {
      return { ok: false, message: 'Team must have 3 or 4 members (4th optional)' }
    }
    if (normalized.filter((m) => m.isLeader).length !== 1) return { ok: false, message: 'Exactly 1 leader required' }
    if (normalizeEmail(normalized[0].email) !== normalizeEmail(user?.email)) {
      return { ok: false, message: 'Leader must be the logged-in student' }
    }

    for (const m of compact) {
      if (!m.name || !m.email || !m.rollNumber) return { ok: false, message: 'All required member fields are required' }
    }

    const emails = compact.map((m) => m.email)
    const rolls = compact.map((m) => m.rollNumber)
    if (new Set(emails).size !== emails.length) return { ok: false, message: 'Duplicate email detected' }
    if (new Set(rolls).size !== rolls.length) return { ok: false, message: 'Duplicate roll number detected' }

    return { ok: true, normalized: compact }
  }, [members, subjectId, teamName, user?.email, yearId])

  function updateMember(index, patch) {
    setMembers((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (!clientValidation.ok) {
      setError(clientValidation.message)
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        yearId,
        subjectId,
        teamName: teamName.trim(),
        members: clientValidation.normalized,
      }
      const { data } = await api.post('/teams', payload)
      setTeam(data.team)
    } catch (e2) {
      setError(e2?.response?.data?.message || 'Team creation failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (!yearId || !subjectId) {
    return (
      <div className="rounded-2xl border border-white/30 bg-white/50 p-6 shadow-xl backdrop-blur-md">
        <h2 className="text-lg font-semibold">Create Team</h2>
        <p className="mt-1 text-sm text-slate-600">Select a year and subject to create your team.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/30 bg-white/50 p-6 shadow-xl backdrop-blur-md">
        <h2 className="text-lg font-semibold">Create Team</h2>
        <p className="mt-2 text-sm text-slate-600">Loading your team status…</p>
      </div>
    )
  }

  const hasTeam = Boolean(team)
  const showSummary = hasTeam

  const mentorAssigned = Boolean(team?.mentor?.email || team?.mentor?.name)
  const mentorLabel =
    (team?.mentor?.name && String(team.mentor.name).trim()) ||
    (team?.mentor?.email && String(team.mentor.email).trim()) ||
    'Mentor Not Assigned'

  const membersForDisplay = Array.isArray(team?.members) ? team.members : []

  if (showSummary) {
    return (
      <div
        className={
          'space-y-8 rounded-2xl border border-white/30 bg-white/60 p-6 shadow-xl backdrop-blur-md transition-all duration-500 ease-in-out ' +
          (lockedMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98]')
        }
      >
        <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-5 text-white shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-white/20 shadow-sm">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
                  <path d="M9.55 17.3 4.8 12.55l1.4-1.4 3.35 3.35 8.25-8.25 1.4 1.4L9.55 17.3Z" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold tracking-wide text-white/90">Submission Successful</div>
                <div className="mt-1 truncate text-2xl font-bold tracking-tight">{team?.teamName || 'Team'}</div>
                <div className="mt-1 text-xs text-white/80">
                  {yearLabel || '—'} • {subjectLabel || '—'}
                </div>
              </div>
            </div>

            <div
              className={
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition-all duration-500 ease-in-out ' +
                (mentorAssigned
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-600')
              }
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2.25c-4.26 0-7.5 2.16-7.5 4.5a1.5 1.5 0 0 0 3 0c0-.63 1.77-1.5 4.5-1.5s4.5.87 4.5 1.5a1.5 1.5 0 0 0 3 0c0-2.34-3.24-4.5-7.5-4.5Z" />
              </svg>
              <span className="text-[11px] tracking-wide opacity-80">Assigned Mentor</span>
              <span className="max-w-[260px] truncate text-xs font-semibold">{mentorLabel}</span>
            </div>
          </div>

          <p className="mt-3 text-xs text-white/85">This submission is now locked and cannot be modified.</p>
        </div>

        <div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-xs font-semibold tracking-widest text-slate-500">TEAM MEMBERS</div>
              <div className="mt-1 text-sm text-slate-600">{membersForDisplay.length} member(s)</div>
            </div>
            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {team?.status || 'FINALIZED'}
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {membersForDisplay.map((m, idx) => {
              const isLead = m?.role === 'leader' || Boolean(m?.isLeader) || idx === 0
              const initials = String(m?.name || m?.email || 'U')
                .trim()
                .slice(0, 1)
                .toUpperCase()

              return (
                <div
                  key={m?._id || `${m?.email || 'm'}-${idx}`}
                  className={
                    'group rounded-xl border bg-white p-4 shadow-md transition-all duration-300 ' +
                    'hover:-translate-y-0.5 hover:shadow-lg ' +
                    (isLead
                      ? 'border-emerald-200 ring-2 ring-emerald-100 hover:scale-[1.01]'
                      : 'border-emerald-100')
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">{m?.name || '—'}</div>
                        <div className="truncate text-xs text-slate-500">{m?.email || '—'}</div>
                      </div>
                    </div>
                    {isLead ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold tracking-wide text-emerald-700">
                        LEAD
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Roll:</span> {m?.rollNumber || '—'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border-t-4 border-emerald-500/60 border border-white/30 bg-white/60 p-6 shadow-xl backdrop-blur-md transition-all duration-500 ease-in-out">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Create Team</h2>
          <p className="mt-1 text-sm text-slate-700">
            {yearLabel} • {subjectLabel}
          </p>
        </div>
      </div>

      <div
        className={
          'transition-all duration-500 ease-in-out ' +
          'mt-5 max-h-[1400px] opacity-100'
        }
      >
        <form onSubmit={onSubmit} className="space-y-5">
          <Field label="Team Name">
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white/70 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition hover:bg-white/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter your team name"
            />
          </Field>

          <div className="rounded-2xl border border-white/30 bg-white/50 p-5 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Members</p>
                <p className="mt-0.5 text-xs text-slate-600">3 members required (1 leader + 2 members). 4th member optional.</p>
              </div>
              <span className="rounded-full border border-white/30 bg-white/60 px-3 py-1 text-xs font-semibold text-slate-700">
                Leader fixed
              </span>
            </div>

            <div className="mt-4 grid gap-4">
              {members.map((m, idx) => (
                <div key={idx} className="rounded-2xl border border-white/30 bg-white/60 p-4 shadow-sm backdrop-blur-md transition hover:shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900">
                      {idx === 0 ? 'Leader' : idx === 3 ? `Member ${idx + 1} (Optional)` : `Member ${idx + 1}`}
                    </div>
                    {idx === 0 ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                        Leader
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-medium text-slate-700">Name</label>
                      <input
                        value={m.name}
                        onChange={(e) => updateMember(idx, { name: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-gray-300 bg-white/70 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition hover:bg-white/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                        placeholder={idx === 0 ? 'Your name' : 'Member name'}
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-medium text-slate-700">Email</label>
                      <input
                        value={m.email}
                        onChange={(e) => updateMember(idx, { email: e.target.value })}
                        disabled={idx === 0}
                        className={
                          'mt-1 w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:ring-2 focus:ring-emerald-500 ' +
                          (idx === 0
                            ? 'cursor-not-allowed border-gray-300 bg-white/40 opacity-80'
                            : 'border-gray-300 bg-white/70 hover:bg-white/80 focus:border-emerald-500')
                        }
                        placeholder={idx === 0 ? user?.email : 'member@college.edu'}
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-medium text-slate-700">Roll Number</label>
                      <input
                        value={m.rollNumber}
                        onChange={(e) => updateMember(idx, { rollNumber: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-gray-300 bg-white/70 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition hover:bg-white/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                        placeholder="e.g. 22CS001"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-emerald-700 hover:shadow-lg hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? 'Submitting…' : 'Create Team (Finalize)'}
          </button>

          <p className="text-center text-xs text-slate-600">
            After submission, team status becomes <span className="font-semibold text-slate-800">FINALIZED</span> and cannot be updated.
          </p>
        </form>
      </div>
    </div>
  )
}
