import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.22l6.86-6.86C35.9 2.17 30.35 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.2C12.45 13.23 17.77 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.56-.14-3.06-.4-4.5H24v9.02h12.65c-.55 2.97-2.22 5.48-4.74 7.18l7.65 5.93C43.98 38.07 46.5 31.84 46.5 24.5z"
      />
      <path
        fill="#FBBC05"
        d="M10.54 28.58A14.5 14.5 0 0 1 9.78 24c0-1.6.28-3.14.76-4.58l-7.98-6.2A23.98 23.98 0 0 0 0 24c0 3.88.93 7.54 2.56 10.78l7.98-6.2z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.35 0 11.9-2.1 15.86-5.7l-7.65-5.93c-2.13 1.43-4.85 2.28-8.21 2.28-6.23 0-11.55-3.73-13.46-9.02l-7.98 6.2C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M13 5l7 7-7 7M20 12H4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const MODES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { loginAdmin, loginStudentGoogle, loginTeacher } = useAuth()
  const [mode, setMode] = useState(MODES.STUDENT)

  const [email, setEmail] = useState('')
  const [secretCode, setSecretCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function routeByRole(role) {
    if (role === 'admin') return '/admin/panel'
    if (role === 'teacher') return '/teacher/dashboard'
    return '/student/dashboard'
  }

  async function onSecretLogin(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const fn = mode === MODES.ADMIN ? loginAdmin : loginTeacher
      const u = await fn({ email, secretCode })
      navigate(routeByRole(u?.role), { replace: true })
    } catch (e2) {
      setError(e2?.response?.data?.message || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  const isStudent = mode === MODES.STUDENT
  const isAdmin = mode === MODES.ADMIN
  const isTeacher = mode === MODES.TEACHER

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      <div
        className="absolute inset-0 bg-[url('/campus-bg.svg')] bg-cover bg-center"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80"
        aria-hidden="true"
      />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-white/15 bg-white/10 shadow-2xl backdrop-blur-xl">
            <div className="px-7 pb-7 pt-8 sm:px-9">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <img
                    src="/logo.jpg"
                    alt="College Logo"
                    className="h-16 w-16 rounded-full border border-white/20 bg-white/10"
                  />
                  <div
                    className="absolute -inset-2 -z-10 rounded-full bg-white/10 blur-xl"
                    aria-hidden="true"
                  />
                </div>
                <h1 className="mt-5 text-2xl font-semibold tracking-tight text-white">
                  Welcome Back
                </h1>
                <p className="mt-1 text-sm text-white/70">Sign in to continue to your dashboard</p>
              </div>

              <div className="mt-7">
                <div className="flex rounded-full bg-white/10 p-1">
                  <button
                    type="button"
                    onClick={() => setMode(MODES.STUDENT)}
                    className={
                      'flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ' +
                      (mode === MODES.STUDENT
                        ? 'bg-white/20 text-white shadow-sm'
                        : 'text-white/70 hover:text-white')
                    }
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode(MODES.TEACHER)}
                    className={
                      'flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ' +
                      (mode === MODES.TEACHER
                        ? 'bg-white/20 text-white shadow-sm'
                        : 'text-white/70 hover:text-white')
                    }
                  >
                    Teacher
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode(MODES.ADMIN)}
                    className={
                      'flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ' +
                      (mode === MODES.ADMIN
                        ? 'bg-white/20 text-white shadow-sm'
                        : 'text-white/70 hover:text-white')
                    }
                  >
                    Admin
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-white">
                        {isAdmin ? 'Admin Access' : isTeacher ? 'Teacher Access' : 'Student Login'}
                      </h2>
                      <p className="mt-1 text-sm text-white/70">
                        {isStudent
                          ? 'Continue with Google OAuth 2.0.'
                          : 'Sign in using email and secret code.'}
                      </p>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-emerald-400/80" aria-hidden="true" />
                  </div>

                  {isStudent ? (
                    <div className="mt-5">
                      <div className="flex w-full justify-center">
                        <GoogleLogin
                          onSuccess={async (resp) => {
                            setBusy(true)
                            setError('')
                            try {
                              const u = await loginStudentGoogle({ credential: resp.credential })
                              navigate(routeByRole(u?.role), { replace: true })
                            } catch (e) {
                              setError(e?.response?.data?.message || 'Login failed')
                            } finally {
                              setBusy(false)
                            }
                          }}
                          onError={() => setError('Google login failed')}
                        />
                      </div>
                      <p className="mt-3 text-center text-xs text-white/60">Secured with OAuth 2.0</p>
                    </div>
                  ) : (
                    <form className="mt-5 space-y-3" onSubmit={onSecretLogin}>
                      <div>
                        <label htmlFor="email" className="block text-xs font-medium text-white/70">
                          Email
                        </label>
                        <input
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          type="email"
                          autoComplete="email"
                          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/25 focus:bg-white/10"
                          placeholder={isAdmin ? 'admin@pbl.local' : 'teacher@pbl.local'}
                        />
                      </div>
                      <div>
                        <label htmlFor="secretCode" className="block text-xs font-medium text-white/70">
                          Secret Code
                        </label>
                        <input
                          id="secretCode"
                          value={secretCode}
                          onChange={(e) => setSecretCode(e.target.value)}
                          type="password"
                          autoComplete="off"
                          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/25 focus:bg-white/10"
                          placeholder="Enter secret code"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={busy}
                        className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        Login
                      </button>
                    </form>
                  )}

                  {error ? (
                    <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-800">
                      {error}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-white/50">
            PBL Management System • Premium Login
          </p>
        </div>
      </div>
    </div>
  )
}
