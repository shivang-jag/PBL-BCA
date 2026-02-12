import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import CreateTeam from '../components/CreateTeam'
import DashboardHeader from '../components/DashboardHeader'

export default function StudentDashboard() {
  const { user } = useAuth()

  const [years, setYears] = useState([])
  const [subjects, setSubjects] = useState([])
  const [yearId, setYearId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [loadingYears, setLoadingYears] = useState(true)
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [error, setError] = useState('')

  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [messagesError, setMessagesError] = useState('')

  const [mentor, setMentor] = useState(null)
  const [loadingMentor, setLoadingMentor] = useState(false)

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    let alive = true
    async function loadMessages() {
      setLoadingMessages(true)
      setMessagesError('')
      try {
        const { data } = await api.get('/student/messages')
        if (!alive) return
        setMessages(data.messages || [])
      } catch (e) {
        if (!alive) return
        setMessagesError(e?.response?.data?.message || 'Failed to load announcements')
      } finally {
        if (alive) setLoadingMessages(false)
      }
    }
    loadMessages()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    let alive = true
    async function loadYears() {
      setLoadingYears(true)
      setError('')
      try {
        const { data } = await api.get('/years')
        if (!alive) return
        setYears(data.years || [])
      } catch (e) {
        if (!alive) return
        setError(e?.response?.data?.message || 'Failed to load years')
      } finally {
        if (alive) setLoadingYears(false)
      }
    }
    loadYears()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!yearId) {
      setSubjects([])
      setSubjectId('')
      return
    }
    let alive = true
    async function loadSubjects() {
      setLoadingSubjects(true)
      setError('')
      try {
        const { data } = await api.get('/subjects', { params: { yearId } })
        if (!alive) return
        setSubjects(data.subjects || [])
      } catch (e) {
        if (!alive) return
        setError(e?.response?.data?.message || 'Failed to load subjects')
      } finally {
        if (alive) setLoadingSubjects(false)
      }
    }
    loadSubjects()
    return () => {
      alive = false
    }
  }, [yearId])

  useEffect(() => {
    if (!yearId || !subjectId) {
      setMentor(null)
      return
    }
    let alive = true
    async function loadMentor() {
      setLoadingMentor(true)
      try {
        const { data } = await api.get('/teams/my', { params: { yearId, subjectId } })
        if (!alive) return
        setMentor(data.team?.mentor || null)
      } catch {
        if (!alive) return
        setMentor(null)
      } finally {
        if (alive) setLoadingMentor(false)
      }
    }
    loadMentor()
    return () => {
      alive = false
    }
  }, [subjectId, yearId])

  const selectedYear = useMemo(() => years.find((y) => y._id === yearId), [years, yearId])
  const selectedSubject = useMemo(
    () => subjects.find((s) => s._id === subjectId),
    [subjects, subjectId]
  )

  const yearDone = Boolean(yearId)
  const subjectDone = Boolean(subjectId)
  const ready = yearDone && subjectDone

  const stepNumber = !yearDone ? 1 : !subjectDone ? 2 : 3

  const progress = ((yearDone ? 1 : 0) + (subjectDone ? 1 : 0) + (ready ? 1 : 0)) / 3

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-emerald-100 text-slate-900">
      <DashboardHeader />
      <div
        className={
          'mx-auto max-w-6xl px-4 py-10 transition-all duration-500 ease-out ' +
          (mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2')
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Student Dashboard</h1>
            <p className="mt-1 text-sm text-slate-700">Signed in as {user?.name} • {user?.email}</p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border-t-4 border-emerald-500/60 border border-white/30 bg-white/60 p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-slate-600">Academic Setup</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">Select year and subject</p>
            </div>
            <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              Step {stepNumber} / 3
            </div>
          </div>

          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/50">
              <div
                className="h-2 rounded-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
              <span className={yearDone ? 'font-semibold text-emerald-700' : ''}>Year</span>
              <span className={subjectDone ? 'font-semibold text-emerald-700' : ''}>Subject</span>
              <span className={ready ? 'font-semibold text-emerald-700' : ''}>Finalize</span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="year-select" className="block text-xs font-medium text-slate-700">
                Select Year
              </label>
              <select
                id="year-select"
                value={yearId}
                onChange={(e) => setYearId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white/70 px-3 py-3 text-sm text-slate-900 outline-none transition hover:bg-white/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                disabled={loadingYears}
              >
                <option value="">{loadingYears ? 'Loading…' : 'Choose a year'}</option>
                {years.map((y) => (
                  <option key={y._id} value={y._id}>
                    {y.code || y.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="subject-select" className="block text-xs font-medium text-slate-700">
                Select Subject
              </label>
              <select
                id="subject-select"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white/70 px-3 py-3 text-sm text-slate-900 outline-none transition hover:bg-white/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                disabled={!yearId || loadingSubjects}
              >
                <option value="">{!yearId ? 'Select year first' : loadingSubjects ? 'Loading…' : 'Choose a subject'}</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                    {s.code ? ` (${s.code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              {error ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-800">
                  {error}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {yearId && subjectId ? (
          <div className="mt-6 flex justify-end">
            <div
              className={
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold shadow-sm backdrop-blur-md transition-all duration-500 ease-in-out ' +
                (mentor?.name?.trim() || mentor?.email?.trim()
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-600')
              }
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2.25c-4.26 0-7.5 2.16-7.5 4.5a1.5 1.5 0 0 0 3 0c0-.63 1.77-1.5 4.5-1.5s4.5.87 4.5 1.5a1.5 1.5 0 0 0 3 0c0-2.34-3.24-4.5-7.5-4.5Z" />
              </svg>
              <span className="text-[11px] tracking-wide opacity-80">Assigned Mentor</span>
              <span className="max-w-[260px] truncate">
                {loadingMentor
                  ? 'Loading…'
                  : mentor?.name?.trim()
                    ? mentor.name
                    : mentor?.email?.trim()
                      ? mentor.email
                      : 'Mentor Not Assigned'}
              </span>
            </div>
          </div>
        ) : null}

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/30 bg-white/60 shadow-xl backdrop-blur-md transition hover:shadow-2xl">
          <div className="px-5 py-4">
            <h2 className="text-base font-semibold">📢 Mentor Announcements</h2>
            <p className="mt-1 text-xs text-slate-500">Read-only announcements from your mentor.</p>
          </div>

          {messagesError ? (
            <div className="px-5 pb-5">
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-800">
                {messagesError}
              </div>
            </div>
          ) : null}

          <div className="px-5 pb-5">
            {loadingMessages ? (
              <div className="text-sm text-slate-600">Loading announcements…</div>
            ) : messages.length ? (
              <div className="grid gap-3">
                {messages.map((m) => (
                  <div key={m._id} className="rounded-2xl border border-white/30 bg-white/60 p-4 shadow-sm backdrop-blur-md">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{m.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">Mentor: {m.senderEmail || '—'}</p>
                      </div>
                      <p className="text-xs text-slate-500">
                        {m.createdAt ? new Date(m.createdAt).toLocaleString() : '—'}
                      </p>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-slate-800">{m.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-600">No announcements yet.</div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <CreateTeam
            yearId={yearId}
            subjectId={subjectId}
            yearLabel={
              selectedYear
                ? (() => {
                    const displayName = selectedYear.name ?? selectedYear.code ?? '—'
                    const suffix = selectedYear.name && selectedYear.code ? ` (${selectedYear.code})` : ''
                    return `${displayName}${suffix}`
                  })()
                : ''
            }
            subjectLabel={
              selectedSubject
                ? (() => {
                    const displayName = selectedSubject.name ?? selectedSubject.code ?? '—'
                    const suffix = selectedSubject.name && selectedSubject.code ? ` (${selectedSubject.code})` : ''
                    return `${displayName}${suffix}`
                  })()
                : ''
            }
          />
        </div>
      </div>
    </div>
  )
}
