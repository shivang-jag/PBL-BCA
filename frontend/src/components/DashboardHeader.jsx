import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'

function initialsFromUser(user) {
  const name = (user?.name || '').trim()
  if (name) return name.slice(0, 1).toUpperCase()
  const email = (user?.email || '').trim()
  if (email) return email.slice(0, 1).toUpperCase()
  return 'U'
}

export default function DashboardHeader() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const menuId = 'dashboard-user-menu'

  const collegeName = 'Graphic Era Hill University'
  const programName = 'Bachelor of Computer Applications (BCA)'

  useEffect(() => {
    function onDocClick(e) {
      const el = menuRef.current
      if (!el) return
      if (el.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-white/30 bg-white/60 backdrop-blur-md shadow-sm">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpg"
              alt="College Logo"
              className="h-9 w-9 rounded-full border border-white/40 bg-white/40"
            />
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight text-slate-900">{collegeName}</div>
              <div className="text-xs text-slate-600">{programName}</div>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="rounded-full border border-white/30 bg-white/50 px-4 py-2 text-xs font-semibold text-slate-800 shadow-sm">
              PBL System
            </div>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={open}
              aria-controls={menuId}
              className="flex items-center gap-3 rounded-2xl border border-white/30 bg-white/50 px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-white/70"
            >
              <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                {initialsFromUser(user)}
              </div>
              <div className="hidden text-left sm:block">
                <div className="max-w-[220px] truncate text-xs font-semibold text-slate-900">{user?.name || user?.email || 'User'}</div>
                <div className="max-w-[220px] truncate text-[11px] text-slate-600">{user?.role || ''}</div>
              </div>
              <div className="text-slate-600">▾</div>
            </button>

            <div
              id={menuId}
              className={
                'absolute right-0 mt-2 w-72 origin-top-right rounded-2xl border border-white/30 bg-white/70 p-2 shadow-xl backdrop-blur-md transition-all duration-200 ' +
                (open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0')
              }
              role="menu"
              aria-hidden={!open}
            >
              <div className="rounded-xl border border-white/30 bg-white/60 px-3 py-2">
                <div className="text-xs font-semibold text-slate-900">View Profile</div>
                <div className="mt-1 text-xs text-slate-600">{user?.email || '—'}</div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="mt-2 w-full rounded-xl border border-white/30 bg-white/60 px-3 py-2 text-left text-sm font-semibold text-slate-800 transition hover:bg-white/80"
                role="menuitem"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
