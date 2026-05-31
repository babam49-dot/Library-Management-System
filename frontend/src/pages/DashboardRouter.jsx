import React from 'react'
import { useAuth } from '../context/AuthContext'
import MemberDashboard from './MemberDashboard'
import StaffDashboard from './StaffDashboard'
import AdminDashboard from './AdminDashboard'

export default function DashboardRouter(){
  const { user } = useAuth()
  if (!user) return null
  const role = user.RoleName || 'Member'
  if (role === 'Member') return <MemberDashboard />
  if (role === 'Staff') return <StaffDashboard />
  if (role === 'Admin') return <AdminDashboard />
  return <MemberDashboard />
}
