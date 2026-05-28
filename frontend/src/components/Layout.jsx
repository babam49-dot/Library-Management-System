import React from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import { useTheme } from '../context/ThemeContext'

export default function Layout({ children }) {
  const { isDark } = useTheme()
  const location = useLocation()
  
  // Hide global nav/footer for dashboard pages
  const isDashboard = ['/admin', '/staff', '/member', '/desk', '/reservations', '/overdue', '/borrow', '/my-borrows', '/book'].some(path => location.pathname.startsWith(path))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!isDashboard && <Navbar />}
      <main style={{ flex: 1, paddingTop: isDashboard ? 0 : '72px' }}>
        {children}
      </main>
      {!isDashboard && <Footer isDark={isDark} />}
    </div>
  )
}
