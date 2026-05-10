import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Home from './pages/Home'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import AdminDashboard from './pages/AdminDashboard'
import StaffDashboard from './pages/StaffDashboard'
import MemberDashboard from './pages/MemberDashboard'
import './styles/tailwind.css'

function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0a0e1a', color: '#fff', fontSize: 18, fontFamily: 'Georgia, serif' }}>Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (allowedRole && user.RoleID !== allowedRole) {
    if (user.RoleID === 1) return <Navigate to="/admin" replace />
    if (user.RoleID === 2) return <Navigate to="/staff" replace />
    if (user.RoleID === 3) return <Navigate to="/member" replace />
  }
  return children
}

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="/register" element={<SignUp />} />
          <Route path="/admin/*" element={<ProtectedRoute allowedRole={1}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/staff/*" element={<ProtectedRoute allowedRole={2}><StaffDashboard /></ProtectedRoute>} />
          <Route path="/member/*" element={<ProtectedRoute allowedRole={3}><MemberDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
)
