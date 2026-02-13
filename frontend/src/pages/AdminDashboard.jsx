import { useEffect, useMemo, useState } from 'react'
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

export default function AdminDashboard() {
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  const [teamsTotal, setTeamsTotal] = useState(0)
  const [lastSyncedAt, setLastSyncedAt] = useState(null)
  const [messages, setMessages] = useState([])
  const [teachers, setTeachers] = useState([])
  const [teacherLoginEnabled, setTeacherLoginEnabled] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [teamsRes, messagesRes, teachersRes] = await Promise.all([
        api.get('/admin/teams'),
        api.get('/admin/messages'),
        api.get('/admin/teachers'),
      ])

      setTeamsTotal(Number(teamsRes?.data?.pagination?.total || 0))
      setLastSyncedAt(teamsRes?.data?.lastSyncedAt || null)
      setMessages(Array.isArray(messagesRes?.data?.messages) ? messagesRes.data.messages : [])
      setTeachers(Array.isArray(teachersRes?.data?.teachers) ? teachersRes.data.teachers : [])
      setTeacherLoginEnabled(Boolean(teachersRes?.data?.teacherLoginEnabled))
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load admin dashboard')
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

  const stats = useMemo(
    () => [
      {
        key: 'teams',
        label: 'Total Teams',
        value: loading ? '—' : String(teamsTotal),
        hint: 'Across all years/subjects',
        badge: '1',
      },
      {
        key: 'teachers',
        label: 'Teachers',
        value: loading ? '—' : String(teachers.length),
        hint: teacherLoginEnabled ? 'Login enabled' : 'Login disabled',
        badge: '2',
      },
      {
        key: 'messages',
        label: 'Broadcasts',
        value: loading ? '—' : String(messages.length),
        hint: 'Teacher announcements',
        badge: '3',
      },
      {
        key: 'sync',
        label: 'Mentor Sync',
        value: loading ? '—' : lastSyncedAt ? 'Synced' : 'Never',
        hint: loading ? '' : `Last: ${formatDateTime(lastSyncedAt)}`,
        badge: '4',
      },
    ],
    [lastSyncedAt, loading, messages.length, teacherLoginEnabled, teachers.length, teamsTotal]
  )

  const recentMessages = useMemo(() => {
    const list = Array.isArray(messages) ? messages : []
    return list.slice(0, 5)
  }, [messages])

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
          title="Admin Dashboard"
          subtitle="Monitor PBL teams, sync status, broadcasts, and marks visibility."
          metaItems={[
            { key: 'teams', label: '📦 Total Teams', value: loading ? '—' : String(teamsTotal) },
            { key: 'sync', label: '🔄 Last Mentor Sync', value: loading ? '—' : formatDateTime(lastSyncedAt) },
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
              title="Total Teams Stats"
              subtitle="Counts are derived from the admin teams listing pagination."
              right={
                <button
                  onClick={load}
                  className="rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Refresh
                </button>
              }
            >
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-purple-100 bg-white p-4 shadow-md transition-all duration-300 hover:shadow-lg">
                  <div className="text-xs font-semibold text-slate-600">Total Teams</div>
                  <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    {loading ? '—' : teamsTotal}
                  </div>
                </div>
                <div className="rounded-2xl border border-purple-100 bg-white p-4 shadow-md transition-all duration-300 hover:shadow-lg">
                  <div className="text-xs font-semibold text-slate-600">Teachers</div>
                  <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    {loading ? '—' : teachers.length}
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    Teacher secret login: <span className="font-semibold text-purple-700">{teacherLoginEnabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/admin/teams"
                  className="rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Open Teams
                </Link>
                <Link
                  to="/admin/teachers"
                  className="rounded-xl border border-purple-200 bg-white px-4 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
                >
                  Manage Teachers
                </Link>
              </div>
            </Card>

            <Card
              title="Sync Status"
              subtitle="Mentor sync updates only mentor name/email by Team ID."
              right={
                <div className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 border border-purple-200">
                  Last: {loading ? '—' : formatDateTime(lastSyncedAt)}
                </div>
              }
            >
              <div className="mt-2 text-sm text-slate-700">
                Run sync from the Teams page when Google Sheets has updated mentor mappings.
              </div>
              <div className="mt-4">
                <Link
                  to="/admin/teams"
                  className="rounded-xl border border-purple-200 bg-white px-4 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
                >
                  Go to Teams Sync
                </Link>
              </div>
            </Card>

            <Card title="Messages Overview" subtitle="Recent teacher broadcasts across all teams.">
              <div className="mt-2">
                {loading ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Loading…</div>
                ) : recentMessages.length ? (
                  <div className="space-y-3">
                    {recentMessages.map((m) => (
                      <div
                        key={m._id}
                        className="rounded-xl border border-purple-100 bg-white p-4 shadow-md transition-all duration-300 hover:shadow-lg"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900">{m.title || '—'}</div>
                            <div className="mt-1 text-xs text-slate-600">
                              {m.senderEmail || '—'} • {formatDateTime(m.createdAt)}
                            </div>
                          </div>
                          <div className="rounded-full bg-purple-100 px-3 py-1 text-[11px] font-semibold text-purple-700 border border-purple-200">
                            Teams: {Number(m.teamsCount || 0)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    No messages yet.
                  </div>
                )}
              </div>

              <div className="mt-4">
                <Link
                  to="/admin/messages"
                  className="rounded-xl border border-purple-200 bg-white px-4 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
                >
                  View All Messages
                </Link>
              </div>
            </Card>

            <section id="evaluation" className="scroll-mt-24">
              <Card
                title="Marks Overview"
                subtitle="Marks are visible only to Admin and Teacher. Students never receive marks from student APIs."
              >
                <div className="mt-2 text-sm text-slate-700">
                  Use Team Details to view marks per member. You can open any team from the Teams page.
                </div>
                <div className="mt-4">
                  <Link
                    to="/admin/teams"
                    className="rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    Open Teams & Marks
                  </Link>
                </div>
              </Card>
            </section>
          </div>

          <aside className="lg:col-span-4">
            <div className="space-y-6 lg:sticky lg:top-6">
              <Card title="Quick Actions" subtitle="Jump to common admin tasks.">
                <div className="mt-4 grid gap-2">
                  <Link
                    to="/admin/teams"
                    className="rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    Teams
                  </Link>
                  <Link
                    to="/admin/messages"
                    className="rounded-xl border border-purple-200 bg-white px-4 py-2 text-center text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
                  >
                    Messages
                  </Link>
                  <Link
                    to="/admin/teachers"
                    className="rounded-xl border border-purple-200 bg-white px-4 py-2 text-center text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
                  >
                    Teachers
                  </Link>
                </div>
              </Card>

              <Card title="Account" subtitle="Current admin session.">
                <div className="mt-2 space-y-2 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600">Signed in as</span>
                    <span className="max-w-[220px] truncate font-semibold text-slate-900">{user?.email || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600">Role</span>
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-[11px] font-semibold text-purple-700 border border-purple-200">
                      Admin
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  )
}
