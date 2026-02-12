import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import LoginPage from './pages/LoginPage.jsx'
import StudentDashboard from './pages/StudentDashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AdminPanel from './pages/AdminPanel.jsx'
import AdminTeams from './pages/AdminTeams.jsx'
import AdminMessages from './pages/AdminMessages.jsx'
import AdminTeachers from './pages/AdminTeachers.jsx'
import AdminTeamDetails from './pages/AdminTeamDetails.jsx'
import TeacherDashboard from './pages/TeacherDashboard.jsx'
import EvaluateTeam from './pages/EvaluateTeam.jsx'

function RequireAuth({ children, role }) {
  const { user, token } = useAuth()
  if (!user || !token) return <Navigate to="/login" replace />
  if (role) {
    const allow = Array.isArray(role) ? role : [role]
    if (!allow.includes(user.role)) return <Navigate to="/login" replace />
  }
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/student/dashboard"
        element={
          <RequireAuth role="student">
            <StudentDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <RequireAuth role="admin">
            <AdminDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/panel"
        element={
          <RequireAuth role="admin">
            <AdminPanel />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/teams"
        element={
          <RequireAuth role="admin">
            <AdminTeams />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/messages"
        element={
          <RequireAuth role="admin">
            <AdminMessages />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/teachers"
        element={
          <RequireAuth role="admin">
            <AdminTeachers />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/team/:id"
        element={
          <RequireAuth role="admin">
            <AdminTeamDetails />
          </RequireAuth>
        }
      />
      <Route
        path="/teacher/dashboard"
        element={
          <RequireAuth role="teacher">
            <TeacherDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/teacher/team/:id"
        element={
          <RequireAuth role="teacher">
            <EvaluateTeam />
          </RequireAuth>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

