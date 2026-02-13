/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { clearSession, getSession, setSession } from '../lib/session'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getSession()?.user || null)
  const [token, setToken] = useState(() => getSession()?.token || null)

  useEffect(() => {
    if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`
    else delete api.defaults.headers.common.Authorization
  }, [token])

  const value = useMemo(
    () => ({
      user,
      token,
      async loginStudentGoogle({ credential }) {
        const { data } = await api.post('/auth/google-login', { credential })
        setToken(data.token)
        setUser(data.user)
        setSession({ token: data.token, user: data.user })
        return data.user
      },
      async loginTeacher({ email, secretCode }) {
        const { data } = await api.post('/auth/teacher-login', { email, secretCode })
        setToken(data.token)
        setUser(data.user)
        setSession({ token: data.token, user: data.user })
        return data.user
      },
      async loginAdmin({ email, secretCode }) {
        const { data } = await api.post('/auth/admin-login', { email, secretCode })
        setToken(data.token)
        setUser(data.user)
        setSession({ token: data.token, user: data.user })
        return data.user
      },
      logout() {
        setUser(null)
        setToken(null)
        clearSession()
      },
    }),
    [user, token]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
