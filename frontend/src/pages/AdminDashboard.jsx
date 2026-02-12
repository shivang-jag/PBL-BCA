import { useAuth } from '../context/AuthContext'
import DashboardHeader from '../components/DashboardHeader'

export default function AdminDashboard() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-emerald-100 text-slate-900">
      <DashboardHeader />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">Signed in as {user?.email}</p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/30 bg-white/60 p-6 shadow-xl backdrop-blur-md">
          <p className="text-sm text-slate-700">
            Admin accounts are pre-created in MongoDB. Student panel and team creation are available
            under the Student dashboard.
          </p>
        </div>
      </div>
    </div>
  )
}
