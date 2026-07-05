import { createContext, useContext, useEffect, useState } from 'react'
import authApi from '../api/authApi'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authApi.me()
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (credentials) => {
    const res = await authApi.login(credentials)
    setUser(res.data.user)
    return res.data.user
  }

  const register = async (payload) => {
    const res = await authApi.register(payload)
    setUser(res.data.user)
    return res.data.user
  }

  const logout = async () => {
    await authApi.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
