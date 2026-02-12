import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import DashboardHeader from '../components/DashboardHeader'

function formatDateTime(iso) {
  if (!iso) return 'Never'
  try {
    const d = new Date(iso)
    if (!Number.isFinite(d.getTime())) return '—'
    return d.toLocaleString()
  } catch {
    return String(iso)
  }
}

function AdminNav() {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Link
        to="/admin/teams"
        className="rounded-xl border border-white/30 bg-white/60 px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur-md transition hover:bg-white/80"
      >
        Teams
      </Link>
      <Link
        to="/admin/messages"
        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
      >
        Messages
      </Link>
      <Link
        to="/admin/teachers"
        className="rounded-xl border border-white/30 bg-white/60 px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur-md transition hover:bg-white/80"
      >
        Teachers
      </Link>
    </div>
  )
}

export default function AdminMessages() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/admin/messages')
      setMessages(data?.messages || [])
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load messages')
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
            <h1 className="text-2xl font-semibold tracking-tight">Admin • Messages</h1>
            <p className="mt-1 text-sm text-slate-600">Signed in as {user?.email || '—'}</p>
            <AdminNav />
          </div>
          <button
            onClick={load}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
          >
            Refresh
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/30 bg-white/60 shadow-xl backdrop-blur-md">
          <div className="px-5 py-4">
            <h2 className="text-base font-semibold">Teacher Broadcast Messages</h2>
            <p className="mt-1 text-xs text-slate-500">Read-only broadcasts across all teams.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs text-slate-600">
                <tr>
                  <th className="px-5 py-3 font-semibold">Teacher Email</th>
                  <th className="px-5 py-3 font-semibold">Title</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold"># Teams</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td className="px-5 py-6 text-slate-600" colSpan={4}>
                      Loading messages…
                    </td>
                  </tr>
                ) : messages.length ? (
                  messages.map((m) => (
                    <tr key={m._id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 text-slate-700">{m.senderEmail || '—'}</td>
                      <td className="px-5 py-4 font-semibold text-slate-900">{m.title || '—'}</td>
                      <td className="px-5 py-4 text-slate-700">{formatDateTime(m.createdAt)}</td>
                      <td className="px-5 py-4 text-slate-700">{Number(m.teamsCount || 0)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-5 py-6 text-slate-600" colSpan={4}>
                      No messages yet.
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
