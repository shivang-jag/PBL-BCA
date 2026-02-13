import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import CreateTeam from '../components/CreateTeam'
import DashboardLayout from '../components/DashboardLayout'
import HeroWelcomeCard from '../components/HeroWelcomeCard'
import Card from '../components/Card'

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

  const [team, setTeam] = useState(null)
  const [loadingTeam, setLoadingTeam] = useState(false)

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
      setTeam(null)
      return
    }
    let alive = true
    async function loadTeam() {
      setLoadingTeam(true)
      try {
        const { data } = await api.get('/teams/my', { params: { yearId, subjectId } })
        if (!alive) return
        setTeam(data.team || null)
      } catch {
        if (!alive) return
        setTeam(null)
      } finally {
        if (alive) setLoadingTeam(false)
      }
    }
    loadTeam()
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

  const mentorLabel =
    (team?.mentor?.name && String(team.mentor.name).trim()) ||
    (team?.mentor?.email && String(team.mentor.email).trim()) ||
    (yearId && subjectId ? (loadingTeam ? 'Loading…' : 'Mentor Not Assigned') : 'Select year & subject')

  const submissionLabel = yearId && subjectId ? (team ? (team.status || 'FINALIZED') : 'Not Submitted') : '—'

  return (
    <DashboardLayout>
      <div
        className={
          'transition-all duration-500 ease-out ' +
          (mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2')
        }
      >
        <HeroWelcomeCard
          user={user}
          mentorLabel={mentorLabel}
          submissionLabel={submissionLabel}
          subtitle="Your academic workspace for PBL submissions and mentor announcements."
        />

        <div className="mt-6">
          <Card
            id="announcements"
            title="Announcements"
            subtitle="Mentor broadcasts (read-only)."
            className="bg-orange-50 border-orange-200"
          >
            {messagesError ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-800">
                {messagesError}
              </div>
            ) : null}

            {loadingMessages ? (
              <div className="text-sm text-slate-700">Loading announcements…</div>
            ) : messages.length ? (
              <div className="grid gap-3">
                {messages.map((m) => (
                  <div
                    key={m._id}
                    className="rounded-2xl border border-orange-100 bg-white p-4 shadow-md transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{m.title}</p>
                        <p className="mt-0.5 text-xs text-slate-600">Mentor: {m.senderEmail || '—'}</p>
                      </div>
                      <p className="text-xs text-slate-600">
                        {m.createdAt ? new Date(m.createdAt).toLocaleString() : '—'}
                      </p>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-slate-800">{m.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-700">No announcements yet.</div>
            )}
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <Card
              title="Academic Setup"
              subtitle="Select year and subject to unlock team submission."
              right={
                <div className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 border border-purple-200">
                  Step {stepNumber} / 3
                </div>
              }
            >
              <div className="mt-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-purple-100">
                  <div
                    className="h-2 rounded-full bg-purple-600 transition-all duration-300"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
                  <span className={yearDone ? 'font-semibold text-purple-700' : ''}>Year</span>
                  <span className={subjectDone ? 'font-semibold text-purple-700' : ''}>Subject</span>
                  <span className={ready ? 'font-semibold text-purple-700' : ''}>Finalize</span>
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
                    className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition hover:bg-purple-50 focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
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
                    className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition hover:bg-purple-50 focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
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
            </Card>

            <Card
              id="teams"
              title="Team Overview"
              subtitle="Your team and mentor information for the selected subject."
            >
              {!yearId || !subjectId ? (
                <div className="text-sm text-slate-600">Select year and subject to view your team overview.</div>
              ) : loadingTeam ? (
                <div className="text-sm text-slate-600">Loading team…</div>
              ) : team ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-purple-200 bg-purple-100 p-4">
                    <div className="text-xs font-semibold text-purple-700">Team</div>
                    <div className="mt-1 text-lg font-bold tracking-tight text-slate-900">{team.teamName || 'Team'}</div>
                    <div className="mt-2 text-xs text-slate-700">Members: {Array.isArray(team.members) ? team.members.length : 0}</div>
                  </div>
                  <div className="rounded-2xl border border-purple-200 bg-purple-100 p-4">
                    <div className="text-xs font-semibold text-purple-700">Mentor</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{mentorLabel}</div>
                    <div className="mt-2 text-xs text-slate-700">Status: {team.status || 'FINALIZED'}</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-600">No team submission found for this subject yet.</div>
              )}
            </Card>

            <Card
              id="submission"
              title="Submission Status"
              subtitle="Submit your team once; submission becomes FINALIZED."
            >
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
            </Card>

          </div>

          <div className="space-y-6 lg:col-span-4">
            <Card title="Quick Info" subtitle="Academic snapshot." className="sticky top-6">
              <div className="grid gap-3">
                <div className="rounded-2xl border border-purple-200 bg-purple-100 p-4">
                  <div className="text-xs font-semibold text-purple-700">Academic Year</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{new Date().getMonth() >= 6 ? `${new Date().getFullYear()}–${String((new Date().getFullYear() + 1) % 100).padStart(2, '0')}` : `${new Date().getFullYear() - 1}–${String(new Date().getFullYear() % 100).padStart(2, '0')}`}</div>
                </div>

                <div className="rounded-2xl border border-purple-200 bg-purple-100 p-4">
                  <div className="text-xs font-semibold text-purple-700">Selected</div>
                  <div className="mt-1 text-sm text-slate-800">
                    {selectedYear ? (selectedYear.code || selectedYear.name) : 'Year: —'}
                  </div>
                  <div className="mt-1 text-sm text-slate-800">
                    {selectedSubject ? (selectedSubject.code ? `${selectedSubject.name} (${selectedSubject.code})` : selectedSubject.name) : 'Subject: —'}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
