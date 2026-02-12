import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import DashboardHeader from '../components/DashboardHeader'

function Card({ title, desc, to }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-white/30 bg-white/60 p-6 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/70 hover:shadow-2xl"
    >
      <div className="text-lg font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{desc}</div>
      <div className="mt-4 text-xs font-semibold text-emerald-700 transition group-hover:text-emerald-800">
        Open →
      </div>
    </Link>
  )
}

export default function AdminPanel() {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)

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
        <h1 className="text-2xl font-semibold tracking-tight">Admin Panel</h1>
        <p className="mt-1 text-sm text-slate-600">Signed in as {user?.email || '—'}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card title="Teams" desc="View teams, sync mentors, open team details." to="/admin/teams" />
          <Card title="Messages" desc="Read-only teacher broadcast messages." to="/admin/messages" />
          <Card title="Teachers" desc="Provision teacher accounts and view teacher list." to="/admin/teachers" />
        </div>
      </div>
    </div>
  )
}
