import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import DashboardLayout from '../components/DashboardLayout'
import HeroWelcomeCard from '../components/HeroWelcomeCard'

export default function AdminPanel() {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30)
    return () => clearTimeout(t)
  }, [])

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
          title="Admin Panel"
          subtitle="Manage teams, read broadcasts, and provision teacher accounts."
          metaItems={[
            { key: 'scope', label: '🛡️ Access', value: 'Admin' },
            { key: 'area', label: '📌 Workspace', value: 'PBL Management' },
          ]}
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/admin/teams"
            className="group rounded-2xl border border-purple-100 bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="text-lg font-semibold text-slate-900">Teams</div>
            <div className="mt-1 text-sm text-slate-600">View teams, sync mentors, open team details.</div>
            <div className="mt-4 text-xs font-semibold text-purple-700 transition group-hover:text-purple-800">Open →</div>
          </Link>
          <Link
            to="/admin/messages"
            className="group rounded-2xl border border-purple-100 bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="text-lg font-semibold text-slate-900">Messages</div>
            <div className="mt-1 text-sm text-slate-600">Read-only teacher broadcast messages.</div>
            <div className="mt-4 text-xs font-semibold text-purple-700 transition group-hover:text-purple-800">Open →</div>
          </Link>
          <Link
            to="/admin/teachers"
            className="group rounded-2xl border border-purple-100 bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="text-lg font-semibold text-slate-900">Teachers</div>
            <div className="mt-1 text-sm text-slate-600">Provision teacher accounts and view teacher list.</div>
            <div className="mt-4 text-xs font-semibold text-purple-700 transition group-hover:text-purple-800">Open →</div>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}
