import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import DashboardHeader from '../components/DashboardHeader'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastContent, setBroadcastContent] = useState('')
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    setNotice('')
    try {
      const { data } = await api.get('/teacher/teams')
      setTeams(data.teams || [])
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load assigned teams')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30)
    return () => clearTimeout(t)
  }, [])

  const rows = useMemo(() => teams, [teams])

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
    } catch (e2) {
      setError(e2?.response?.data?.message || 'Failed to send broadcast')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-emerald-100 text-slate-900">
      <DashboardHeader />
      <div
        className={
          'mx-auto max-w-6xl px-4 py-10 transition-all duration-500 ease-out ' +
          (mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2')
        }
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Teacher Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">Signed in as {user?.email}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={load}
              className="rounded-xl border border-white/30 bg-white/60 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-md transition hover:bg-white/80"
            >
              Refresh
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {notice ? (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800">
            {notice}
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-white/30 bg-white/60 p-5 shadow-xl backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Broadcast Message</h2>
            <button
              onClick={() => {
                setShowBroadcast((v) => !v)
                setError('')
                setNotice('')
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
            >
              {showBroadcast ? 'Close' : 'Broadcast Message'}
            </button>
          </div>

          {showBroadcast ? (
            <form onSubmit={onBroadcastSubmit} className="mt-4 grid gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600" htmlFor="broadcast-title">
                  Title
                </label>
                <input
                  id="broadcast-title"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300"
                  placeholder="Enter title"
                  disabled={sending}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600" htmlFor="broadcast-content">
                  Message Content
                </label>
                <textarea
                  id="broadcast-content"
                  value={broadcastContent}
                  onChange={(e) => setBroadcastContent(e.target.value)}
                  className="mt-1 min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300"
                  placeholder="Write your announcement…"
                  disabled={sending}
                />
              </div>
              <div>
                <button
                  type="submit"
                  disabled={sending}
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {sending ? 'Sending…' : 'Submit'}
                </button>
              </div>
            </form>
          ) : null}
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/30 bg-white/60 shadow-xl backdrop-blur-md">
          <div className="px-5 py-4">
            <h2 className="text-base font-semibold">Assigned Teams</h2>
            <p className="mt-1 text-xs text-slate-500">Only teams where mentor email matches your email are visible.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs text-slate-600">
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
                    <tr key={t._id} className="hover:bg-slate-50">
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
                          className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
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
        </div>
      </div>
    </div>
  )
}
