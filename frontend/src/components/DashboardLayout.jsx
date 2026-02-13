import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Dropdown from './Dropdown'

function academicYearLabel(now = new Date()) {
  const year = now.getFullYear()
  const month = now.getMonth() // 0-11
  const startYear = month >= 6 ? year : year - 1
  const endTwoDigit = String((startYear + 1) % 100).padStart(2, '0')
  return `${startYear}–${endTwoDigit}`
}

function initialsFromUser(user) {
  const name = String(user?.name || '').trim()
  if (name) return name.slice(0, 1).toUpperCase()
  const email = String(user?.email || '').trim()
  if (email) return email.slice(0, 1).toUpperCase()
  return 'U'
}

function Icon({ name }) {
  const cls = 'h-5 w-5 text-white/90'
  if (name === 'dashboard') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 13h7V4H4v9Zm9 7h7V11h-7v9ZM4 20h7v-5H4v5Zm9-11h7V4h-7v5Z" fill="currentColor" />
      </svg>
    )
  }
  if (name === 'teams') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M16 11c1.66 0 3-1.34 3-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3Zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h7v-2.5c0-2.33-4.67-3.5-7-3.5Z"
          fill="currentColor"
        />
      </svg>
    )
  }
  if (name === 'announcements') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 11v2h2l5 5V6L5 11H3Zm13.5 1c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02ZM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77Z"
          fill="currentColor"
        />
      </svg>
    )
  }
  if (name === 'evaluation') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Zm-9 14H7v-2h3v2Zm0-4H7v-2h3v2Zm0-4H7V7h3v2Zm7 8h-5V7h5v10Z"
          fill="currentColor"
        />
      </svg>
    )
  }
  if (name === 'settings') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.1 7.1 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 1h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.58.23-1.12.54-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 7.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.3.6.22l2.39-.96c.5.4 1.05.71 1.63.94l.36 2.54c.04.24.25.42.49.42h3.8c.24 0 .45-.18.49-.42l.36-2.54c.58-.23 1.12-.54 1.63-.94l2.39.96c.22.09.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z"
          fill="currentColor"
        />
      </svg>
    )
  }
  if (name === 'logout') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M10 17v-2h4v-6h-4V7l-5 5 5 5Zm9-14H11a2 2 0 0 0-2 2v3h2V5h8v14h-8v-3H9v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z"
          fill="currentColor"
        />
      </svg>
    )
  }
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2 2 7l10 5 10-5-10-5Zm0 7L2 4v13l10 5V9Zm10-5-10 5v13l10-5V4Z" fill="currentColor" />
    </svg>
  )
}

function SidebarItem({ item, active }) {
  const base =
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-300 '
  const cls =
    base +
    (active
      ? 'bg-white/20 backdrop-blur text-white shadow-sm'
      : 'text-white/90 hover:bg-white/10 hover:text-white')

  if (item.onClick) {
    return (
      <button type="button" onClick={item.onClick} className={cls}>
        <Icon name={item.icon} />
        <span>{item.label}</span>
      </button>
    )
  }

  return (
    <Link to={item.to} className={cls}>
      <Icon name={item.icon} />
      <span>{item.label}</span>
    </Link>
  )
}

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const role = user?.role

  const collegeName = 'Graphic Era Hill University'
  const programName = 'Bachelor of Computer Applications (BCA)'

  const isAdmin = role === 'admin'
  const isTeacher = role === 'teacher'
  const isStudent = role === 'student'

  const useSidebarLayout = isAdmin

  const nav = []
  if (isAdmin) {
    nav.push(
      { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', to: '/admin/dashboard' },
      { key: 'teams', label: 'Teams', icon: 'teams', to: '/admin/teams' },
      { key: 'announcements', label: 'Announcements', icon: 'announcements', to: '/admin/messages' },
      { key: 'evaluation', label: 'Evaluation', icon: 'evaluation', to: '/admin/dashboard#evaluation' },
      { key: 'settings', label: 'Admin Panel', icon: 'settings', to: '/admin/panel' },
      { key: 'logout', label: 'Logout', icon: 'logout', onClick: logout },
    )
  }

  function isActive(item) {
    const p = location.pathname
    const h = location.hash

    if (item.key === 'teams' && isAdmin && p.startsWith('/admin/team/')) return true
    if (item.to?.includes('#')) {
      const [path, hash] = item.to.split('#')
      if (p !== path) return false
      if (!hash) return !h
      return h === `#${hash}`
    }
    return item.to ? p === item.to : false
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-indigo-100 text-slate-900">
      {useSidebarLayout ? (
        <div className="flex min-h-screen">
          <aside className="sticky top-0 h-screen w-72 shrink-0">
            <div className="h-full rounded-r-3xl bg-gradient-to-b from-indigo-600 via-purple-600 to-fuchsia-600 shadow-2xl shadow-black/10">
              <div className="flex h-full flex-col p-5">
                <div className="flex items-center gap-3">
                  <img
                    src="/logo.jpg"
                    alt="College Logo"
                    className="h-10 w-10 rounded-2xl border border-white/20 bg-white/10"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">{collegeName}</div>
                    <div className="truncate text-xs text-white/80">{programName}</div>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  {nav.map((item) => (
                    <SidebarItem key={item.key} item={item} active={isActive(item)} />
                  ))}
                </div>

                <div className="mt-auto pt-6">
                  <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                    <Dropdown
                      align="left"
                      widthClassName="w-72"
                      button={() => (
                        <div className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-white/10">
                          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-sm font-bold text-white">
                            {initialsFromUser(user)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-white">{user?.name || 'User'}</div>
                            <div className="truncate text-xs text-white/80">{user?.email || '—'}</div>
                          </div>
                          <div className="text-white/80">▾</div>
                        </div>
                      )}
                    >
                      {({ close }) => (
                        <div>
                          <div className="rounded-xl border border-purple-200 bg-purple-100 px-3 py-2 text-xs font-semibold text-purple-700">
                            Academic Year: {academicYearLabel()}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              close()
                              navigate('/admin/panel')
                            }}
                            className="mt-2 w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 transition hover:bg-purple-50"
                            role="menuitem"
                          >
                            Admin Panel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              close()
                              logout()
                            }}
                            className="mt-2 w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 transition hover:bg-purple-50"
                            role="menuitem"
                          >
                            Logout
                          </button>
                        </div>
                      )}
                    </Dropdown>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1 px-6 py-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      ) : (
        <div className="min-h-screen">
          <header className="px-4 pt-6">
            <div className="mx-auto w-full max-w-6xl">
              <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 p-4 shadow-md">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src="/logo.jpg"
                      alt="College Logo"
                      className="h-10 w-10 rounded-2xl border border-white/20 bg-white/10"
                    />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">{collegeName}</div>
                      <div className="truncate text-xs text-white/80">{programName}</div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          logout()
                          navigate('/')
                        }}
                        className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                      >
                        Logout
                      </button>

                      <Dropdown
                        align="right"
                        widthClassName="w-72"
                        button={() => (
                          <div className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2 text-left transition hover:bg-white/15">
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-sm font-bold text-white">
                              {initialsFromUser(user)}
                            </div>
                            <div className="hidden min-w-0 sm:block">
                              <div className="max-w-[220px] truncate text-sm font-semibold text-white">
                                {user?.name || 'User'}
                              </div>
                              <div className="max-w-[220px] truncate text-xs text-white/80">{user?.email || '—'}</div>
                            </div>
                            <div className="text-white/90">▾</div>
                          </div>
                        )}
                      >
                        {({ close }) => (
                          <div>
                            <div className="rounded-xl border border-purple-200 bg-purple-100 px-3 py-2 text-xs font-semibold text-purple-700">
                              Academic Year: {academicYearLabel()}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                close()
                                  navigate(
                                    isTeacher
                                      ? '/teacher/dashboard#settings'
                                      : isStudent
                                        ? '/student/dashboard'
                                        : '/',
                                  )
                              }}
                              className="mt-2 w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 transition hover:bg-purple-50"
                              role="menuitem"
                            >
                              Settings
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                close()
                                logout()
                                navigate('/')
                              }}
                              className="mt-2 w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 transition hover:bg-purple-50"
                              role="menuitem"
                            >
                              Logout
                            </button>
                          </div>
                        )}
                      </Dropdown>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="px-4 py-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      )}
    </div>
  )
}
