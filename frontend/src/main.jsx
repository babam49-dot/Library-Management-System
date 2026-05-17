import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { CartProvider } from './context/CartContext'
import Home from './pages/Home'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import PendingApproval from './pages/PendingApproval'
import AdminDashboard from './pages/AdminDashboard'
import StaffDashboard from './pages/StaffDashboard'
import MemberDashboard from './pages/MemberDashboard'
import Layout from './components/Layout'
import './styles/tailwind.css'
import './styles/interactive.css'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0a0e1a', color: '#fff', fontSize: 18, fontFamily: 'Georgia, serif' }}>Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.RoleID)) {
    if (user.RoleID === 1) return <Navigate to="/admin" replace />
    if (user.RoleID === 2) return <Navigate to="/staff" replace />
    if (user.RoleID === 3) return <Navigate to="/member" replace />
  }
  return children
}

import BorrowingPage from './pages/BorrowingPage'
import MyBorrowsPage from './pages/MyBorrowsPage'
import LibrarianDeskPage from './pages/LibrarianDeskPage'
import ReservationsPage from './pages/ReservationsPage'
import OverduePage from './pages/OverduePage'
import BookDetailPage from './pages/BookDetailPage'

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<SignIn />} />
              <Route path="/register" element={<SignUp />} />
              <Route path="/pending" element={<PendingApproval />} />
              <Route path="/admin/*" element={<ProtectedRoute allowedRoles={[1]}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/staff/*" element={<ProtectedRoute allowedRoles={[2]}><StaffDashboard /></ProtectedRoute>} />
              <Route path="/member/*" element={<ProtectedRoute allowedRoles={[3]}><MemberDashboard /></ProtectedRoute>} />
              
              {/* Module 3 Routes */}
              <Route path="/borrow" element={<ProtectedRoute allowedRoles={[3]}><BorrowingPage /></ProtectedRoute>} />
              <Route path="/my-borrows" element={<ProtectedRoute allowedRoles={[3]}><MyBorrowsPage /></ProtectedRoute>} />
              <Route path="/desk" element={<ProtectedRoute allowedRoles={[1, 2]}><LibrarianDeskPage /></ProtectedRoute>} />
              <Route path="/reservations" element={<ProtectedRoute allowedRoles={[1, 2]}><ReservationsPage /></ProtectedRoute>} />
              <Route path="/overdue" element={<ProtectedRoute allowedRoles={[1, 2]}><OverduePage /></ProtectedRoute>} />
              <Route path="/book/:id" element={<ProtectedRoute allowedRoles={[1, 2, 3]}><BookDetailPage /></ProtectedRoute>} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  </ThemeProvider>
)
