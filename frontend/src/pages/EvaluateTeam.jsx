import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import DashboardHeader from '../components/DashboardHeader'

export default function EvaluateTeam() {
  const { id } = useParams()
  const { user } = useAuth()
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState({})

  const [draft, setDraft] = useState({})

  useEffect(() => {
    let alive = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get(`/teacher/team/${id}`)
        if (!alive) return
        setTeam(data.team)

        const nextDraft = {}
        for (const m of data.team?.members || []) {
          nextDraft[m.rollNumber] = {
            score: typeof m.marks?.score === 'number' ? m.marks.score : '',
            remarks: m.marks?.remarks || '',
          }
        }
        setDraft(nextDraft)
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

  const members = useMemo(() => team?.members || [], [team])

  function updateDraft(rollNumber, patch) {
    setDraft((prev) => ({
      ...prev,
      [rollNumber]: { ...prev[rollNumber], ...patch },
    }))
  }

  async function saveRow(rollNumber) {
    setError('')
    const row = draft[rollNumber] || { score: '', remarks: '' }
    const scoreNum = Number(row.score)
    if (!Number.isFinite(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      setError('Score must be a number between 0 and 100')
      return
    }

    setSaving((p) => ({ ...p, [rollNumber]: true }))
    try {
      await api.put('/teacher/grade', {
        teamId: id,
        grades: [{ rollNumber, score: scoreNum, remarks: row.remarks || '' }],
      })
      // Reload to show updated gradedBy/gradedAt
      const { data } = await api.get(`/teacher/team/${id}`)
      setTeam(data.team)

      const savedMember = (data.team?.members || []).find((m) => m.rollNumber === rollNumber)
      if (savedMember) {
        setDraft((prev) => ({
          ...prev,
          [rollNumber]: {
            score: typeof savedMember.marks?.score === 'number' ? savedMember.marks.score : '',
            remarks: savedMember.marks?.remarks || '',
          },
        }))
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Save failed')
    } finally {
      setSaving((p) => ({ ...p, [rollNumber]: false }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-emerald-100 text-slate-900">
      <DashboardHeader />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Evaluate Team</h1>
            <p className="mt-1 text-sm text-slate-600">Teacher: {user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/teacher/dashboard"
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
                  <p className="mt-1 text-xs text-slate-500">
                    Mentor: {team.mentor?.email ? `${team.mentor?.name || 'Mentor'} (${team.mentor.email})` : 'Unassigned'}
                  </p>
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {team.status}
                </span>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/30 bg-white/60 shadow-xl backdrop-blur-md">
              <div className="px-5 py-4">
                <h3 className="text-base font-semibold">Marks</h3>
                <p className="mt-1 text-xs text-slate-500">Only assigned mentor can grade. You can edit anytime.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-100 text-xs text-slate-600">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Roll</th>
                      <th className="px-5 py-3 font-semibold">Name</th>
                      <th className="px-5 py-3 font-semibold">Section</th>
                      <th className="px-5 py-3 font-semibold">Marks (0–100)</th>
                      <th className="px-5 py-3 font-semibold">Remarks</th>
                      <th className="px-5 py-3 font-semibold">Save</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {members.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-semibold text-slate-900">{m.rollNumber}</td>
                        <td className="px-5 py-4 text-slate-900/90">{m.name}</td>
                        <td className="px-5 py-4 text-slate-700">{m.section || '—'}</td>
                        <td className="px-5 py-4">
                          <input
                            value={draft[m.rollNumber]?.score ?? ''}
                            onChange={(e) => updateDraft(m.rollNumber, { score: e.target.value })}
                            className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-300"
                            placeholder="0-100"
                            inputMode="numeric"
                          />
                        </td>
                        <td className="px-5 py-4">
                          <input
                            value={draft[m.rollNumber]?.remarks ?? ''}
                            onChange={(e) => updateDraft(m.rollNumber, { remarks: e.target.value })}
                            className="w-64 max-w-[18rem] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-300"
                            placeholder="Remarks"
                          />
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => saveRow(m.rollNumber)}
                            disabled={Boolean(saving[m.rollNumber])}
                            className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {saving[m.rollNumber] ? 'Saving…' : 'Save'}
                          </button>
                          <div className="mt-1 text-[11px] text-slate-500">
                            {m.marks?.gradedBy ? `Last by ${m.marks.gradedBy}` : 'Not graded'}
                          </div>
                        </td>
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
