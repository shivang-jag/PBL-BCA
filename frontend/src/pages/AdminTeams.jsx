import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import DashboardHeader from '../components/DashboardHeader'

function formatDateTime(iso) {
  if (!iso) return 'Never'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return String(iso)
  }
}

function AdminNav() {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Link
        to="/admin/teams"
        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
      >
        Teams
      </Link>
      <Link
        to="/admin/messages"
        className="rounded-xl border border-white/30 bg-white/60 px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur-md transition hover:bg-white/80"
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

export default function AdminTeams() {
  const { user } = useAuth()
  const [teams, setTeams] = useState([])
  const [lastSyncedAt, setLastSyncedAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [migrating, setMigrating] = useState(false)
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

  async function onMigrateStatuses() {
    setMigrating(true)
    setError('')
    setOkMsg('')
    try {
      const { data } = await api.post('/admin/migrate-statuses')
      setOkMsg(`Migration complete. Updated ${Number(data?.modifiedCount || 0)} team(s).`)
      await load()
    } catch (e) {
      setError(e?.response?.data?.message || 'Migration failed')
    } finally {
      setMigrating(false)
    }
  }

  const rows = useMemo(() => teams, [teams])

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
            <h1 className="text-2xl font-semibold tracking-tight">Admin • Teams</h1>
            <p className="mt-1 text-sm text-slate-600">Signed in as {user?.email || '—'}</p>
            <AdminNav />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onSyncMentors}
              disabled={syncing}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
            >
              {syncing ? 'Syncing…' : 'Sync Mentor Updates From Google Sheets'}
            </button>
            <button
              onClick={onMigrateStatuses}
              disabled={migrating}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {migrating ? 'Migrating…' : 'Migrate Legacy Status (FROZEN → FINALIZED)'}
            </button>
            <button
              onClick={() => {
                setOkMsg('')
                load()
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/30 bg-white/60 p-5 shadow-xl backdrop-blur-md">
          <p className="text-sm text-slate-700">
            Last synced at: <span className="font-semibold text-slate-900">{formatDateTime(lastSyncedAt)}</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">Mentor sync updates only mentor name/email by Team ID.</p>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {okMsg ? (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800">
            {okMsg}
          </div>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/30 bg-white/60 shadow-xl backdrop-blur-md">
          <div className="px-5 py-4">
            <h2 className="text-base font-semibold">All Teams</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs text-slate-600">
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
                    <tr key={t._id} className="hover:bg-slate-50">
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
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {t.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          to={`/admin/team/${t._id}`}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
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
        </div>
      </div>
    </div>
  )
}
