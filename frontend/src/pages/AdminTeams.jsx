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
    return new Date(iso).toLocaleString()
  } catch {
    return String(iso)
  }
}

export default function AdminTeams() {
  const { user } = useAuth()
  const [teams, setTeams] = useState([])
  const [lastSyncedAt, setLastSyncedAt] = useState(null)
  const [teamsTotal, setTeamsTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [okMsg, setOkMsg] = useState('')
  const [mounted, setMounted] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/admin/teams')
      setTeams(data?.teams || [])
      setLastSyncedAt(data?.lastSyncedAt || null)
      setTeamsTotal(Number(data?.pagination?.total || 0))
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load teams')
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

  async function onSyncMentors() {
    setSyncing(true)
    setError('')
    setOkMsg('')
    try {
      const { data } = await api.post('/admin/sync-mentors', {}, { timeout: 60000 })
      setLastSyncedAt(data.lastSyncedAt || new Date().toISOString())
      await load()
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.response?.data?.details ||
          e?.message ||
          'Sync failed'
      )
    } finally {
      setSyncing(false)
    }
  }

  const rows = useMemo(() => teams, [teams])

  const stats = useMemo(
    () => [
      {
        key: 'total',
        label: 'Total Teams',
        value: loading ? '—' : String(teamsTotal),
        hint: 'Across all years/subjects',
        badge: '1',
      },
      {
        key: 'listed',
        label: 'Listed',
        value: loading ? '—' : String(rows.length),
        hint: 'Current page size',
        badge: '2',
      },
      {
        key: 'sync',
        label: 'Last Sync',
        value: loading ? '—' : lastSyncedAt ? 'Synced' : 'Never',
        hint: loading ? '' : formatDateTime(lastSyncedAt),
        badge: '3',
      },
      {
        key: 'status',
        label: 'Team Status',
        value: 'Normalized',
        hint: 'Legacy values auto-mapped',
        badge: '4',
      },
    ],
    [lastSyncedAt, loading, rows.length, teamsTotal]
  )

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
          title="Admin • Teams"
          subtitle="Manage teams, run mentor sync, and open team details for marks."
          metaItems={[
            { key: 'total', label: '📦 Total Teams', value: loading ? '—' : String(teamsTotal) },
            { key: 'sync', label: '🔄 Last Mentor Sync', value: loading ? '—' : formatDateTime(lastSyncedAt) },
          ]}
        />

        <div className="mt-6">
          <StatsTiles items={stats} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <Card title="Sync & Maintenance" subtitle="Run sync/migrations without leaving the Teams view.">
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={onSyncMentors}
                  disabled={syncing}
                  className="rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {syncing ? 'Syncing…' : 'Sync Mentor Updates From Google Sheets'}
                </button>
                <button
                  onClick={() => {
                    setOkMsg('')
                    load()
                  }}
                  className="rounded-xl border border-purple-200 bg-white px-4 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
                >
                  Refresh
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-purple-100 bg-white p-4 text-sm text-slate-700 shadow-md">
                Last synced at: <span className="font-semibold text-slate-900">{formatDateTime(lastSyncedAt)}</span>
                <div className="mt-1 text-xs text-slate-500">Mentor sync updates only mentor name/email by Team ID.</div>
              </div>

              {error ? (
                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-800">
                  {error}
                </div>
              ) : null}

              {okMsg ? (
                <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-800">
                  {okMsg}
                </div>
              ) : null}
            </Card>

            <Card title="All Teams" subtitle="Open team details for a read-only marks view.">
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-purple-50 text-xs text-slate-600">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Team Name</th>
                      <th className="px-5 py-3 font-semibold">Year</th>
                      <th className="px-5 py-3 font-semibold">Subject</th>
                      <th className="px-5 py-3 font-semibold">Mentor</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold">View Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {loading ? (
                      <tr>
                        <td className="px-5 py-6 text-slate-600" colSpan={6}>
                          Loading teams…
                        </td>
                      </tr>
                    ) : rows.length ? (
                      rows.map((t) => (
                        <tr key={t._id} className="hover:bg-purple-50/40">
                          <td className="px-5 py-4 font-semibold text-slate-900">{t.teamName}</td>
                          <td className="px-5 py-4 text-slate-700">
                            {t.year ? `${t.year?.name || '—'}${t.year?.code ? ` (${t.year.code})` : ''}` : '—'}
                          </td>
                          <td className="px-5 py-4 text-slate-700">
                            {t.subject
                              ? `${t.subject?.name || '—'}${t.subject?.code ? ` (${t.subject.code})` : ''}`
                              : '—'}
                          </td>
                          <td className="px-5 py-4 text-slate-700">
                            {t.mentor?.email ? (
                              <div>
                                <div className="font-medium text-slate-900">{t.mentor?.name || 'Mentor'}</div>
                                <div className="text-xs text-slate-500">{t.mentor.email}</div>
                              </div>
                            ) : (
                              <span className="text-slate-500">Unassigned</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 border border-purple-200">
                              {t.status}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <Link
                              to={`/admin/team/${t._id}`}
                              className="rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-5 py-6 text-slate-600" colSpan={6}>
                          No teams found.
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
              <Card title="Notes" subtitle="Admin team management reminders.">
                <div className="mt-2 space-y-3 text-sm text-slate-700">
                  <div className="rounded-xl border border-purple-200 bg-purple-100 px-3 py-2 text-xs font-semibold text-purple-700">
                    Marks are visible only in Team Details.
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
