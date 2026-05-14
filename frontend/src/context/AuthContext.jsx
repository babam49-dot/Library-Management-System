import React, { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:4000/api'
const AuthContext = createContext()

export function useAuth() { return useContext(AuthContext) }

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('lms_token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      axios.get(`${API}/auth/me`)
        .then(r => { if (r.data.success) setUser(r.data.data) })
        .catch(() => { localStorage.removeItem('lms_token'); delete axios.defaults.headers.common['Authorization'] })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async ({ email, password }) => {
    const res = await axios.post(`${API}/auth/login`, { email, password })
    if (!res.data.success) throw new Error(res.data.message)
    const { token, user: u } = res.data.data
    localStorage.setItem('lms_token', token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(u)
    return u
  }

  const registerStaff = async (data) => {
    const res = await axios.post(`${API}/users`, { ...data, RoleID: 2 })
    if (!res.data.success) throw new Error(res.data.message)
    return res.data.message
  }

  const registerMember = async (data) => {
    const res = await axios.post(`${API}/users`, { ...data, RoleID: 3 })
    if (!res.data.success) throw new Error(res.data.message)
    return res.data.message
  }

  const logout = () => {
    localStorage.removeItem('lms_token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, registerStaff, registerMember, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
