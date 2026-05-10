import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RoleRoute({ allowed, children }){
  const { user, loading } = useAuth()
  if (loading) return <div>Loading...</div>
  if (!user) return <Navigate to="/signin" replace />
  if (!allowed.includes(user.RoleName)) return <Navigate to="/" replace />
  return children
}
