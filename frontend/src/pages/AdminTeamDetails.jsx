import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import DashboardHeader from '../components/DashboardHeader'

export default function AdminTeamDetails() {
  const { id } = useParams()
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get(`/admin/team/${id}`)
        if (!alive) return
        setTeam(data.team)
      } catch (e) {
        if (!alive) return
        setError(e?.response?.data?.message || 'Failed to load team')
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [id])

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-emerald-100 text-slate-900">
      <DashboardHeader />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Team Details</h1>
            <p className="mt-1 text-sm text-slate-600">Read-only marks view (Admin)</p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/admin/teams"
              className="rounded-xl border border-white/30 bg-white/60 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-md transition hover:bg-white/80"
            >
              Back
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
            Loading…
          </div>
        ) : error ? (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : team ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-white/30 bg-white/60 p-6 shadow-xl backdrop-blur-md">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{team.teamName}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {team.year?.name} ({team.year?.code}) • {team.subject?.name} ({team.subject?.code})
                  </p>
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {team.status}
                </span>
              </div>

              <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Mentor</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">
                    {team.mentor?.email ? team.mentor?.name || 'Mentor' : 'Unassigned'}
                  </p>
                  {team.mentor?.email ? <p className="mt-0.5 text-xs text-slate-600">{team.mentor.email}</p> : null}
                </div>
                <div>
                  <p className="text-xs text-slate-500">Created By</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">
                    {team.createdBy?.name || '—'}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">{team.createdBy?.email || '—'}</p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/30 bg-white/60 shadow-xl backdrop-blur-md">
              <div className="px-5 py-4">
                <h3 className="text-base font-semibold">Members & Marks (Read-only)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-100 text-xs text-slate-600">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Roll</th>
                      <th className="px-5 py-3 font-semibold">Name</th>
                      <th className="px-5 py-3 font-semibold">Section</th>
                      <th className="px-5 py-3 font-semibold">Email</th>
                      <th className="px-5 py-3 font-semibold">Score</th>
                      <th className="px-5 py-3 font-semibold">Remarks</th>
                      <th className="px-5 py-3 font-semibold">Graded By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(team.members || []).map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-semibold text-slate-900">{m.rollNumber}</td>
                        <td className="px-5 py-4 text-slate-900/90">{m.name}</td>
                        <td className="px-5 py-4 text-slate-700">{m.section || '—'}</td>
                        <td className="px-5 py-4 text-slate-600">{m.email}</td>
                        <td className="px-5 py-4 text-slate-900/90">
                          {typeof m.marks?.score === 'number' ? m.marks.score : '—'}
                        </td>
                        <td className="px-5 py-4 text-slate-700">{m.marks?.remarks || '—'}</td>
                        <td className="px-5 py-4 text-slate-600">{m.marks?.gradedBy || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
            Team not found.
          </div>
        )}
      </div>
    </div>
  )
}
