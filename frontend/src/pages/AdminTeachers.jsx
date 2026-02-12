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
        className="rounded-xl border border-white/30 bg-white/60 px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur-md transition hover:bg-white/80"
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
        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
      >
        Teachers
      </Link>
    </div>
  )
}

export default function AdminTeachers() {
  const { user } = useAuth()
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

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
            <h1 className="text-2xl font-semibold tracking-tight">Admin • Teachers</h1>
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

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/30 bg-white/60 shadow-xl backdrop-blur-md">
          <div className="px-5 py-4">
            <h2 className="text-base font-semibold">Add Teacher</h2>
            <p className="mt-1 text-xs text-slate-500">Provision a teacher account for secret-code login.</p>
          </div>

          <div className="px-5 pb-5">
            <form onSubmit={onAddTeacher} className="rounded-2xl border border-white/30 bg-white/60 p-4">
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
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200"
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
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
                <button
                  type="submit"
                  disabled={addingTeacher}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
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
                <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800">
                  {addTeacherOk}
                </div>
              ) : null}
            </form>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/30 bg-white/60 shadow-xl backdrop-blur-md">
          <div className="px-5 py-4">
            <h2 className="text-base font-semibold">All Teachers</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs text-slate-600">
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
                    <tr key={t._id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-semibold text-slate-900">{t.name || 'Teacher'}</td>
                      <td className="px-5 py-4 text-slate-700">{t.email || '—'}</td>
                      <td className="px-5 py-4 text-slate-700">{Number(t.assignedTeamsCount || 0)}</td>
                      <td className="px-5 py-4">
                        {t.canLogin ? (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
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
        </div>
      </div>
    </div>
  )
}
