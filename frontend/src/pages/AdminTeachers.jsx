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

export default function AdminTeachers() {
  const { user } = useAuth()
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  const [teacherLoginEnabled, setTeacherLoginEnabled] = useState(false)

  const [addingTeacher, setAddingTeacher] = useState(false)
  const [teacherEmail, setTeacherEmail] = useState('')
  const [teacherName, setTeacherName] = useState('')
  const [addTeacherError, setAddTeacherError] = useState('')
  const [addTeacherOk, setAddTeacherOk] = useState('')

  const emailInputId = 'teacher-email'
  const nameInputId = 'teacher-name'

  function isValidEmail(v) {
    const s = String(v || '').trim().toLowerCase()
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
  }

  async function load() {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/admin/teachers')
      setTeachers(data?.teachers || [])
      setTeacherLoginEnabled(Boolean(data?.teacherLoginEnabled))
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load teachers')
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

  async function onAddTeacher(e) {
    e?.preventDefault?.()
    setAddTeacherError('')
    setAddTeacherOk('')
    const email = String(teacherEmail || '').trim().toLowerCase()
    const name = String(teacherName || '').trim()
    if (!email) {
      setAddTeacherError('Teacher email is required')
      return
    }
    if (!isValidEmail(email)) {
      setAddTeacherError('Enter a valid email address')
      return
    }

    setAddingTeacher(true)
    try {
      const { data } = await api.post('/admin/teachers', { email, name })
      setAddTeacherOk(`Teacher provisioned: ${data?.teacher?.email || email}`)
      setTeacherEmail('')
      setTeacherName('')
      await load()
    } catch (err) {
      setAddTeacherError(err?.response?.data?.message || err?.message || 'Failed to add teacher')
    } finally {
      setAddingTeacher(false)
    }
  }

  const rows = useMemo(() => teachers, [teachers])

  const stats = useMemo(() => {
    const safe = Array.isArray(teachers) ? teachers : []
    const assignedTeams = safe.reduce((acc, t) => acc + Number(t?.assignedTeamsCount || 0), 0)
    const canLoginCount = safe.filter((t) => Boolean(t?.canLogin)).length
    return [
      { key: 'teachers', label: 'Teachers', value: loading ? '—' : String(safe.length), hint: 'Provisioned accounts', badge: '1' },
      { key: 'assigned', label: 'Assigned Teams', value: loading ? '—' : String(assignedTeams), hint: 'Across teachers', badge: '2' },
      { key: 'login', label: 'Login Enabled', value: teacherLoginEnabled ? 'Yes' : 'No', hint: 'Teacher secret login', badge: '3' },
      { key: 'can', label: 'Can Login', value: loading ? '—' : String(canLoginCount), hint: 'Teachers with access', badge: '4' },
    ]
  }, [loading, teacherLoginEnabled, teachers])

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
          title="Admin • Teachers"
          subtitle="Provision teacher accounts and track assigned teams."
          metaItems={[
            { key: 'enabled', label: '🔐 Teacher Secret Login', value: teacherLoginEnabled ? 'Enabled' : 'Disabled' },
            { key: 'count', label: '👨‍🏫 Teachers', value: loading ? '—' : String(teachers.length) },
          ]}
        />

        <div className="mt-6">
          <StatsTiles items={stats} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <Card
              title="Add Teacher"
              subtitle="Provision a teacher account for secret-code login."
              right={
                <button
                  onClick={load}
                  className="rounded-xl border border-purple-200 bg-white px-4 py-2 text-xs font-semibold text-purple-700 transition hover:bg-purple-50"
                >
                  Refresh
                </button>
              }
            >
              <form onSubmit={onAddTeacher} className="mt-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-end">
                  <div className="flex-1">
                    <label htmlFor={emailInputId} className="text-xs font-semibold text-slate-700">
                      Teacher Email
                    </label>
                    <input
                      id={emailInputId}
                      type="email"
                      value={teacherEmail}
                      onChange={(e) => setTeacherEmail(e.target.value)}
                      placeholder="teacher2@pbl.local"
                      className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition hover:bg-purple-50 focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor={nameInputId} className="text-xs font-semibold text-slate-700">
                      Teacher Name (optional)
                    </label>
                    <input
                      id={nameInputId}
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      placeholder="Teacher 2"
                      className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition hover:bg-purple-50 focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={addingTeacher}
                    className="rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {addingTeacher ? 'Adding…' : 'Add Teacher'}
                  </button>
                </div>

                {addTeacherError ? (
                  <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-800">
                    {addTeacherError}
                  </div>
                ) : null}

                {addTeacherOk ? (
                  <div className="mt-3 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-800">
                    {addTeacherOk}
                  </div>
                ) : null}
              </form>
            </Card>

            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            ) : null}

            <Card title="All Teachers" subtitle="Assigned teams count is derived from mentor email matching.">
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-purple-50 text-xs text-slate-600">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Name</th>
                      <th className="px-5 py-3 font-semibold">Email</th>
                      <th className="px-5 py-3 font-semibold">Assigned Teams</th>
                      <th className="px-5 py-3 font-semibold">Can Login</th>
                      <th className="px-5 py-3 font-semibold">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {loading ? (
                      <tr>
                        <td className="px-5 py-6 text-slate-600" colSpan={5}>
                          Loading teachers…
                        </td>
                      </tr>
                    ) : rows.length ? (
                      rows.map((t) => (
                        <tr key={t._id} className="hover:bg-purple-50/40">
                          <td className="px-5 py-4 font-semibold text-slate-900">{t.name || 'Teacher'}</td>
                          <td className="px-5 py-4 text-slate-700">{t.email || '—'}</td>
                          <td className="px-5 py-4 text-slate-700">{Number(t.assignedTeamsCount || 0)}</td>
                          <td className="px-5 py-4">
                            {t.canLogin ? (
                              <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 border border-purple-200">
                                Yes
                              </span>
                            ) : (
                              <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                                No
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-slate-700">{formatDateTime(t.createdAt)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-5 py-6 text-slate-600" colSpan={5}>
                          No teachers found.
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
                    to="/admin/messages"
                    className="rounded-xl border border-purple-200 bg-white px-4 py-2 text-center text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
                  >
                    Messages
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
