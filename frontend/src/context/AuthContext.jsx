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

  const login = async ({ email, password, identifier, loginType }) => {
    try {
      const res = await axios.post(`${API}/auth/login`, { email, password, identifier, loginType })
      if (!res.data.success) throw new Error(res.data.message)
      const { token, user: u } = res.data.data
      localStorage.setItem('lms_token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(u)
      return u
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message)
    }
  }

  const registerStaff = async (data) => {
    try {
      const res = await axios.post(`${API}/auth/register`, { ...data, RoleID: 2 })
      if (!res.data.success) throw new Error(res.data.message)
      return res.data.message
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message)
    }
  }

  const registerMember = async (data) => {
    try {
      const res = await axios.post(`${API}/auth/register`, { ...data, RoleID: 3 })
      if (!res.data.success) throw new Error(res.data.message)
      return res.data.message
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message)
    }
  }

  const logout = () => {
    localStorage.removeItem('lms_token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, registerStaff, registerMember, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
