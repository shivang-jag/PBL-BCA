import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import DashboardLayout from '../components/DashboardLayout'
import HeroWelcomeCard from '../components/HeroWelcomeCard'
import StatsTiles from '../components/StatsTiles'
import Card from '../components/Card'

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

  const stats = (() => {
    const list = Array.isArray(messages) ? messages : []
    const uniqueSenders = new Set(list.map((m) => String(m?.senderEmail || '').toLowerCase()).filter(Boolean)).size
    const teamsReached = list.reduce((acc, m) => acc + Number(m?.teamsCount || 0), 0)
    const latest = list[0]?.createdAt

    return [
      { key: 'count', label: 'Broadcasts', value: loading ? '—' : String(list.length), hint: 'All teachers', badge: '1' },
      { key: 'senders', label: 'Unique Senders', value: loading ? '—' : String(uniqueSenders), hint: 'Teacher emails', badge: '2' },
      { key: 'reach', label: 'Teams Reached', value: loading ? '—' : String(teamsReached), hint: 'Sum of teamsCount', badge: '3' },
      { key: 'latest', label: 'Latest', value: loading ? '—' : formatDateTime(latest), hint: 'Most recent broadcast', badge: '4' },
    ]
  })()

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
          title="Admin • Messages"
          subtitle="Read-only teacher broadcasts across all teams."
          metaItems={[
            { key: 'count', label: '📣 Total Broadcasts', value: loading ? '—' : String(messages.length) },
            { key: 'latest', label: '🕒 Latest', value: loading ? '—' : formatDateTime(messages?.[0]?.createdAt) },
          ]}
        />

        <div className="mt-6">
          <StatsTiles items={stats} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            ) : null}

            <Card
              title="Teacher Broadcast Messages"
              subtitle="Read-only broadcasts across all teams."
              right={
                <button
                  onClick={load}
                  className="rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Refresh
                </button>
              }
            >
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-purple-50 text-xs text-slate-600">
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
                        <tr key={m._id} className="hover:bg-purple-50/40">
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
            </Card>
          </div>

          <aside className="lg:col-span-4">
            <div className="space-y-6 lg:sticky lg:top-6">
              <Card title="Quick Actions" subtitle="Navigate to other admin areas.">
                <div className="mt-4 grid gap-2">
                  <Link
                    to="/admin/teams"
                    className="rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    Teams
                  </Link>
                  <Link
                    to="/admin/teachers"
                    className="rounded-xl border border-purple-200 bg-white px-4 py-2 text-center text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
                  >
                    Teachers
                  </Link>
                </div>
              </Card>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  )
}
