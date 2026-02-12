const KEY = 'pbl_session_v1'

export function getSession() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setSession(session) {
  localStorage.setItem(KEY, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(KEY)
}
