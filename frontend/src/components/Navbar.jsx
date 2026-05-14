import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import DarkModeToggle from './DarkModeToggle'

export default function Navbar() {
  const [scrollY, setScrollY] = useState(0)
  const { isDark } = useTheme()
  const { user, logout } = useAuth()
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isDashboard = location.pathname.startsWith('/admin') || 
                      location.pathname.startsWith('/staff') || 
                      location.pathname.startsWith('/member')
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'
  const isHome = location.pathname === '/'

  const themeVars = isDark ? `
    :root {
      --nav-bg: rgba(10, 14, 26, 0.8);
      --nav-text: #ffffff;
      --nav-border: rgba(255, 255, 255, 0.1);
    }
  ` : `
    :root {
      --nav-bg: rgba(255, 255, 255, 0.8);
      --nav-text: #0f172a;
      --nav-border: rgba(0, 0, 0, 0.05);
    }
  `

  return (
    <nav style={{ 
      position: 'fixed', top: 0, width: '100%', zIndex: 1000, 
      padding: '16px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      background: scrollY > 20 || isDashboard || isAuthPage ? 'var(--nav-bg)' : 'transparent',
      backdropFilter: scrollY > 20 || isDashboard || isAuthPage ? 'blur(16px)' : 'none',
      borderBottom: scrollY > 20 || isDashboard || isAuthPage ? '1px solid var(--nav-border)' : '1px solid transparent',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxSizing: 'border-box'
    }}>
      <style>{themeVars}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to="/" style={{ textDecoration:'none', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: 20 }}>📚</div>
          <span style={{ fontWeight: 700, fontSize: 22, fontFamily: "'Playfair Display', serif", color: 'var(--nav-text)' }}>UniLibrary</span>
        </Link>
      </div>
      
      <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
        {isDashboard ? (
          <>
            <Link to="/" style={{ color: 'var(--nav-text)', textDecoration: 'none', fontWeight: 500 }}>← Back to Home</Link>
            <div style={{ color: 'var(--nav-text)', fontWeight: 700, textTransform: 'uppercase', fontSize: 13, letterSpacing: 1.5, opacity: 0.8 }}>
              {location.pathname.includes('admin') ? 'Admin Portal' : location.pathname.includes('staff') ? 'Staff Portal' : 'Member Portal'}
            </div>
          </>
        ) : isAuthPage ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--nav-text)', opacity: 0.6 }}>
              {location.pathname === '/login' ? 'Sign in to access your library account' : 'Create your library account'}
            </span>
          </div>
        ) : (
          <>
            <Link to="/" style={{ color: 'var(--nav-text)', textDecoration: 'none', fontWeight: 600 }}>Home 🏠</Link>
            <a href="#books" style={{ color: 'var(--nav-text)', textDecoration: 'none', fontWeight: 500 }}>Catalog 📚</a>
            <a href="#location" style={{ color: 'var(--nav-text)', textDecoration: 'none', fontWeight: 500 }}>Location 📍</a>
            <a href="#about" style={{ color: 'var(--nav-text)', textDecoration: 'none', fontWeight: 500 }}>About ℹ️</a>
            <a href="#services" style={{ color: 'var(--nav-text)', textDecoration: 'none', fontWeight: 500 }}>Services ✨</a>
            {user && (
              <Link to={user.RoleID === 1 ? "/admin" : user.RoleID === 2 ? "/staff" : "/member"} style={{ color: '#f59e0b', textDecoration: 'none', fontWeight: 700, marginLeft: 10 }}>Dashboard →</Link>
            )}
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <DarkModeToggle />
        {user ? (
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
             <div style={{ textAlign:'right', display: 'none', '@media (min-width: 768px)': { display: 'block' } }}>
               <div style={{ fontSize:13, fontWeight:600, color: 'var(--nav-text)' }}>{user.FullName}</div>
               <div style={{ fontSize:11, color:'#f59e0b' }}>{user.RoleName}</div>
             </div>
             <button onClick={logout} style={{ padding:'8px 16px', borderRadius:8, background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'none', cursor:'pointer', fontWeight:600 }}>Log Out</button>
          </div>
        ) : !isAuthPage ? (
          <>
            <Link to="/login" style={{ color: 'var(--nav-text)', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
            <Link to="/register" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)' }}>Join Now</Link>
          </>
        ) : (
          <Link to="/" style={{ color: 'var(--nav-text)', textDecoration: 'none', fontWeight: 500, fontSize: 14, opacity: 0.7 }}>← Back to Home</Link>
        )}
      </div>
    </nav>
  )
}
