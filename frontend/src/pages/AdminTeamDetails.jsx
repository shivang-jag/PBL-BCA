import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import DashboardLayout from '../components/DashboardLayout'
import HeroWelcomeCard from '../components/HeroWelcomeCard'
import StatsTiles from '../components/StatsTiles'
import Card from '../components/Card'

export default function AdminTeamDetails() {
  const { id } = useParams()
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const stats = useMemo(() => {
    const members = Array.isArray(team?.members) ? team.members : []
    const gradedMembers = members.filter((m) => typeof m?.marks?.score === 'number').length
    const avgScore = (() => {
      const scores = members.map((m) => m?.marks?.score).filter((s) => typeof s === 'number')
      if (!scores.length) return '—'
      const sum = scores.reduce((a, b) => a + b, 0)
      return String(Math.round((sum / scores.length) * 10) / 10)
    })()

    return [
      {
        key: 'members',
        label: 'Members',
        value: loading ? '—' : String(members.length),
        hint: 'In this team',
        badge: '1',
      },
      {
        key: 'graded',
        label: 'Graded',
        value: loading ? '—' : String(gradedMembers),
        hint: 'With a score',
        badge: '2',
      },
      {
        key: 'avg',
        label: 'Average Score',
        value: loading ? '—' : avgScore,
        hint: 'Across graded members',
        badge: '3',
      },
      {
        key: 'status',
        label: 'Status',
        value: loading ? '—' : team?.status || '—',
        hint: 'Team workflow',
        badge: '4',
      },
    ]
  }, [loading, team])

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
    <DashboardLayout>
      <HeroWelcomeCard
        title={team?.teamName ? `Admin • ${team.teamName}` : 'Admin • Team Details'}
        subtitle="Read-only marks view (Admin). Student-facing APIs never expose marks."
        metaItems={[
          { key: 'year', label: '🎓 Academic Year', value: team?.year?.name ? `${team.year.name} (${team.year.code || '—'})` : '—' },
          {
            key: 'subject',
            label: '📘 Subject',
            value: team?.subject?.name ? `${team.subject.name} (${team.subject.code || '—'})` : '—',
          },
        ]}
      />

      <div className="mt-6">
        <StatsTiles items={stats} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {loading ? (
            <Card title="Loading" subtitle="Fetching team details…">
              <div className="mt-4 rounded-2xl border border-purple-100 bg-purple-50 p-6 text-slate-700">Loading…</div>
            </Card>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : team ? (
            <>
              <Card
                title="Team Overview"
                subtitle="Mentor and creator metadata."
                right={
                  <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 border border-purple-200">
                    {team.status}
                  </span>
                }
              >
                <div className="mt-4 grid gap-3 rounded-2xl border border-purple-100 bg-gradient-to-br from-white via-purple-50 to-indigo-100 p-5 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-500">Mentor</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">
                      {team.mentor?.email ? team.mentor?.name || 'Mentor' : 'Unassigned'}
                    </p>
                    {team.mentor?.email ? <p className="mt-0.5 text-xs text-slate-600">{team.mentor.email}</p> : null}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Created By</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">{team.createdBy?.name || '—'}</p>
                    <p className="mt-0.5 text-xs text-slate-600">{team.createdBy?.email || '—'}</p>
                  </div>
                </div>
              </Card>

              <Card title="Members & Marks" subtitle="Read-only marks view (Admin).">
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-purple-50 text-xs text-slate-600">
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
                        <tr key={idx} className="hover:bg-purple-50/40">
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
              </Card>
            </>
          ) : (
            <Card title="Not Found" subtitle="No team exists for this id.">
              <div className="mt-4 rounded-2xl border border-purple-100 bg-purple-50 p-6 text-slate-700">Team not found.</div>
            </Card>
          )}
        </div>

        <aside className="lg:col-span-4">
          <div className="space-y-6 lg:sticky lg:top-6">
            <Card title="Quick Actions" subtitle="Return to teams or check messages.">
              <div className="mt-4 grid gap-2">
                <Link
                  to="/admin/teams"
                  className="rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Back to Teams
                </Link>
                <Link
                  to="/admin/messages"
                  className="rounded-xl border border-purple-200 bg-white px-4 py-2 text-center text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
                >
                  View Messages
                </Link>
              </div>
            </Card>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  )
}
