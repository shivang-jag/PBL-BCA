import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import DashboardLayout from '../components/DashboardLayout'
import HeroWelcomeCard from '../components/HeroWelcomeCard'
import StatsTiles from '../components/StatsTiles'
import Card from '../components/Card'

function formatDateTime(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (!Number.isFinite(d.getTime())) return '—'
    return d.toLocaleString()
  } catch {
    return String(iso)
  }
}

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastContent, setBroadcastContent] = useState('')
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState('')
  const [deletingId, setDeletingId] = useState('')

  const loadTeams = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/teacher/teams')
      setTeams(data.teams || [])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMessages = useCallback(async () => {
    setLoadingMessages(true)
    try {
      const { data } = await api.get('/teacher/messages')
      setMessages(data?.messages || [])
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  const load = useCallback(async () => {
    setError('')
    setNotice('')
    try {
      await Promise.all([loadTeams(), loadMessages()])
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load teacher data')
    }
  }, [loadMessages, loadTeams])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30)
    return () => clearTimeout(t)
  }, [])

  const rows = useMemo(() => teams, [teams])

  const evaluation = useMemo(() => {
    const safeTeams = Array.isArray(teams) ? teams : []
    let totalMembers = 0
    let gradedMembers = 0
    let evaluatedTeams = 0

    for (const t of safeTeams) {
      const members = Array.isArray(t?.members) ? t.members : []
      totalMembers += members.length

      let gradedInTeam = 0
      for (const m of members) {
        const score = m?.marks?.score
        if (Number.isFinite(score)) {
          gradedMembers += 1
          gradedInTeam += 1
        }
      }

      if (members.length > 0 && gradedInTeam >= members.length) evaluatedTeams += 1
    }

    return {
      assignedTeams: safeTeams.length,
      totalMembers,
      gradedMembers,
      pendingMembers: Math.max(0, totalMembers - gradedMembers),
      evaluatedTeams,
      pendingTeams: Math.max(0, safeTeams.length - evaluatedTeams),
    }
  }, [teams])

  const stats = useMemo(
    () => [
      {
        key: 'teams',
        label: 'Assigned Teams',
        value: loading ? '—' : String(evaluation.assignedTeams),
        hint: 'Under your mentorship',
        badge: '1',
      },
      {
        key: 'students',
        label: 'Students',
        value: loading ? '—' : String(evaluation.totalMembers),
        hint: 'Across assigned teams',
        badge: '2',
      },
      {
        key: 'graded',
        label: 'Graded Entries',
        value: loading ? '—' : String(evaluation.gradedMembers),
        hint: 'Members graded',
        badge: '3',
      },
      {
        key: 'pending',
        label: 'Pending Entries',
        value: loading ? '—' : String(evaluation.pendingMembers),
        hint: 'Members remaining',
        badge: '4',
      },
    ],
    [evaluation, loading]
  )

  async function onBroadcastSubmit(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    const title = broadcastTitle.trim()
    const content = broadcastContent.trim()
    if (!title) {
      setError('Title is required')
      return
    }
    if (!content) {
      setError('Message content is required')
      return
    }

    setSending(true)
    try {
      await api.post('/teacher/broadcast', { title, content })
      setNotice('Broadcast sent successfully.')
      setBroadcastTitle('')
      setBroadcastContent('')
      setShowBroadcast(false)
      await loadMessages()
    } catch (e2) {
      setError(e2?.response?.data?.message || 'Failed to send broadcast')
    } finally {
      setSending(false)
    }
  }

  async function onDeleteMessage(id) {
    if (!id) return
    setError('')
    setNotice('')
    setDeletingId(id)
    try {
      await api.delete(`/teacher/messages/${id}`)
      setNotice('Message deleted.')
      await loadMessages()
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to delete message')
    } finally {
      setDeletingId('')
    }
  }

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
          title="Welcome Back, Teacher"
          subtitle="Manage your assigned teams, announcements, and evaluations in one place."
          metaItems={[
            { key: 'assigned', label: '👥 Assigned Teams', value: loading ? '—' : String(evaluation.assignedTeams) },
            { key: 'pendingTeams', label: '📝 Pending Teams', value: loading ? '—' : String(evaluation.pendingTeams) },
          ]}
        />

        <div className="mt-6">
          <Card
            id="announcements"
            title="Announcements"
            subtitle="Send announcements to all of your assigned teams, and manage your broadcasts."
            className="bg-orange-50 border-orange-200"
            right={
              <button
                onClick={() => {
                  setShowBroadcast((v) => !v)
                  setError('')
                  setNotice('')
                }}
                className="rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs font-semibold text-orange-700 transition hover:bg-orange-50"
              >
                {showBroadcast ? 'Close' : 'New Broadcast'}
              </button>
            }
          >
            {showBroadcast ? (
              <form onSubmit={onBroadcastSubmit} className="mt-4 grid gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700" htmlFor="broadcast-title">
                    Title
                  </label>
                  <input
                    id="broadcast-title"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-orange-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition hover:bg-orange-50 focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                    placeholder="Enter title"
                    disabled={sending}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700" htmlFor="broadcast-content">
                    Message Content
                  </label>
                  <textarea
                    id="broadcast-content"
                    value={broadcastContent}
                    onChange={(e) => setBroadcastContent(e.target.value)}
                    className="mt-1 min-h-[120px] w-full rounded-xl border border-orange-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition hover:bg-orange-50 focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                    placeholder="Write your announcement…"
                    disabled={sending}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={sending}
                    className="rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {sending ? 'Sending…' : 'Send Broadcast'}
                  </button>
                  <span className="text-xs text-slate-600">Broadcasts go to all assigned teams.</span>
                </div>
              </form>
            ) : null}

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-orange-100/70 text-xs text-slate-700">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Title</th>
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold"># Teams</th>
                    <th className="px-5 py-3 font-semibold">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loadingMessages ? (
                    <tr>
                      <td className="px-5 py-6 text-slate-700" colSpan={4}>
                        Loading messages…
                      </td>
                    </tr>
                  ) : messages.length ? (
                    messages.map((m) => (
                      <tr key={m._id} className="hover:bg-orange-50/60">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900">{m.title || '—'}</div>
                          <div className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs text-slate-600">
                            {m.content || ''}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-700">{formatDateTime(m.createdAt)}</td>
                        <td className="px-5 py-4 text-slate-700">{Number(m.teamsCount || 0)}</td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => onDeleteMessage(m._id)}
                            disabled={deletingId === m._id}
                            className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {deletingId === m._id ? 'Deleting…' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-5 py-6 text-slate-700" colSpan={4}>
                        No broadcast messages yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="mt-6">
          <StatsTiles items={stats} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <section id="teams" className="scroll-mt-24">
              <Card
                title="Assigned Teams"
                subtitle="Only teams where mentor email matches your email are visible."
                right={
                  <button
                    onClick={load}
                    className="rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    Refresh
                  </button>
                }
              >
                {error ? (
                  <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-800">
                    {error}
                  </div>
                ) : null}

                {notice ? (
                  <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-800">
                    {notice}
                  </div>
                ) : null}

                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-purple-50 text-xs text-slate-600">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Team Name</th>
                        <th className="px-5 py-3 font-semibold">Year</th>
                        <th className="px-5 py-3 font-semibold">Subject</th>
                        <th className="px-5 py-3 font-semibold">Evaluate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {loading ? (
                        <tr>
                          <td className="px-5 py-6 text-slate-600" colSpan={4}>
                            Loading…
                          </td>
                        </tr>
                      ) : rows.length ? (
                        rows.map((t) => (
                          <tr key={t._id} className="hover:bg-purple-50/40">
                            <td className="px-5 py-4 font-semibold text-slate-900">{t.teamName}</td>
                            <td className="px-5 py-4 text-slate-700">
                              {t.year?.name} ({t.year?.code})
                            </td>
                            <td className="px-5 py-4 text-slate-700">
                              {t.subject?.name} ({t.subject?.code})
                            </td>
                            <td className="px-5 py-4">
                              <Link
                                to={`/teacher/team/${t._id}`}
                                className="inline-flex items-center rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                              >
                                Evaluate
                              </Link>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-5 py-6 text-slate-600" colSpan={4}>
                            No assigned teams.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>

            <section id="evaluation" className="scroll-mt-24">
              <Card
                title="Evaluation Stats"
                subtitle="A quick view of grading progress across your assigned teams."
                right={
                  <div className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 border border-purple-200">
                    {loading ? 'Loading…' : `${evaluation.evaluatedTeams}/${evaluation.assignedTeams} teams fully graded`}
                  </div>
                }
              >
                <div className="mt-2">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-purple-100">
                    <div
                      className="h-2 rounded-full bg-purple-600 transition-all duration-300"
                      style={{
                        width:
                          evaluation.totalMembers > 0
                            ? `${Math.round((evaluation.gradedMembers / evaluation.totalMembers) * 100)}%`
                            : '0%',
                      }}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                    <span>
                      Graded: <span className="font-semibold text-purple-700">{loading ? '—' : evaluation.gradedMembers}</span>
                    </span>
                    <span>
                      Pending: <span className="font-semibold text-purple-700">{loading ? '—' : evaluation.pendingMembers}</span>
                    </span>
                  </div>
                </div>
              </Card>
            </section>
          </div>

          <aside className="lg:col-span-4">
            <div className="space-y-6 lg:sticky lg:top-6">
              <section id="settings" className="scroll-mt-24">
                <Card title="Quick Info" subtitle="Your teacher workspace details.">
                  <div className="mt-2 space-y-3 text-sm text-slate-700">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-600">Signed in as</span>
                      <span className="max-w-[220px] truncate font-semibold text-slate-900">{user?.email || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-600">Fully graded teams</span>
                      <span className="font-semibold text-slate-900">{loading ? '—' : evaluation.evaluatedTeams}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-600">Pending teams</span>
                      <span className="font-semibold text-slate-900">{loading ? '—' : evaluation.pendingTeams}</span>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      onClick={load}
                      className="rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      Refresh Data
                    </button>
                    <Link
                      to="/teacher/dashboard#teams"
                      className="rounded-xl border border-purple-200 bg-white px-4 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
                    >
                      View Teams
                    </Link>
                  </div>
                </Card>
              </section>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  )
}
