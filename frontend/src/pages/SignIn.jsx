import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLES = [
  { 
    id: 3, 
    label: 'Member', 
    sub: 'Browse & borrow books', 
    icon: '📚', 
    themeColor: '#8b5e3c', // Brown
    bgColor: '#f0e6d4',
    bgLight: '#fdf4e7',
    infoText: 'Sign in to access your borrowing dashboard and catalog.',
    accessText: 'Standard access — Borrow up to 5 books',
    demoEmail: 'jane@uni.edu',
    showStaffId: false
  },
  { 
    id: 2, 
    label: 'Librarian / Staff', 
    sub: 'Manage catalog & circulation', 
    icon: '🗂️', 
    themeColor: '#a67c00', // Gold/Yellow
    bgColor: '#f4ecd8',
    bgLight: '#fdfbf2',
    infoText: 'Access the circulation desk, inventory, and member management tools.',
    accessText: 'Staff access — Catalog & circulation management',
    demoEmail: 'staff@library.com',
    showStaffId: true
  },
  { 
    id: 1, 
    label: 'Administrator', 
    sub: 'Full system access', 
    icon: '🔑', 
    themeColor: '#4f6d4d', // Green
    bgColor: '#e3ebd8',
    bgLight: '#f2f7ed',
    infoText: 'Full system access. Manage users, roles, fine types, and system settings.',
    accessText: 'Administrator access — Full system control',
    demoEmail: 'admin@library.com',
    showStaffId: true
  },
]

export default function SignIn() {
  const [selectedRole, setSelectedRole] = useState(3)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [staffId, setStaffId] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // Backend only requires email and password right now, staffId is just for UI completeness based on user request
      const u = await login({ email, password })
      if (u.RoleID === 1) navigate('/admin')
      else if (u.RoleID === 2) navigate('/staff')
      else navigate('/member')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const roleInfo = ROLES.find(r => r.id === selectedRole)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Georgia', serif", background: '#1a0f0a' }}>
      {/* Left panel */}
      <div style={{
        width: '42%', background: 'linear-gradient(160deg, #2d1a0e 0%, #1a0f0a 100%)',
        padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        borderRight: '1px solid #3d2010'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
            <div style={{ width: 36, height: 36, background: '#c4813a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: 16 }}>L</div>
            <span style={{ color: '#e8d5b0', fontWeight: 700, fontSize: 18, letterSpacing: 0.5 }}>Lenket Library</span>
          </div>
          <h1 style={{ color: '#fff', fontSize: 42, fontWeight: 700, lineHeight: 1.1, marginBottom: 12 }}>
            Sign in to your<br />
            <span style={{ color: '#c4813a', fontStyle: 'italic' }}>library account.</span>
          </h1>
          <p style={{ color: '#a08060', fontSize: 15, lineHeight: 1.6, marginTop: 16, maxWidth: '85%' }}>
            Select your role below to access the right portal. Each role has tailored tools and permissions within the system.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 40 }}>
          {ROLES.map(r => {
            const isSelected = selectedRole === r.id;
            return (
              <button key={r.id} onClick={() => setSelectedRole(r.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: isSelected ? 'rgba(196,129,58,0.15)' : 'rgba(255,255,255,0.03)',
                  border: isSelected ? '1px solid rgba(196,129,58,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12, padding: '16px', cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.2s'
                }}>
                <div style={{ width: 42, height: 42, background: isSelected ? 'rgba(196,129,58,0.2)' : '#3d2010', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{r.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#e8d5b0', fontWeight: 600, fontSize: 16 }}>{r.label}</div>
                  <div style={{ color: '#a08060', fontSize: 13, marginTop: 2 }}>{r.sub}</div>
                </div>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${isSelected ? '#c4813a' : '#5a3a20'}`, background: isSelected ? '#c4813a' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                  {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M5 12l5 5L20 7"/></svg>}
                </div>
              </button>
            )
          })}
        </div>

        <div style={{ marginTop: 40, color: '#6b4a2a', fontSize: 13, fontStyle: 'italic' }}>
          "A library is not a luxury but one of the necessities of life."
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, background: '#fcfaf7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 48px' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          
          <p style={{ color: '#8b6a4a', fontSize: 15, marginBottom: 28 }}>{roleInfo.infoText}</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: roleInfo.bgColor, borderRadius: 8, padding: '12px 16px', marginBottom: 24, color: roleInfo.themeColor, fontSize: 13, fontWeight: 600 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: roleInfo.themeColor }}></div>
            {roleInfo.accessText}
          </div>

          <div style={{ background: roleInfo.bgLight, border: `1px solid ${roleInfo.bgColor}`, borderRadius: 10, padding: '16px', marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: roleInfo.themeColor, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Demo Credentials</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#5a3a20', marginBottom: 8 }}>
              <span>Email</span><span style={{ fontFamily: 'monospace', background: '#f0e6d4', padding: '2px 8px', borderRadius: 4 }}>{roleInfo.demoEmail}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#5a3a20' }}>
              <span>Password</span><span style={{ fontFamily: 'monospace', background: '#f0e6d4', padding: '2px 8px', borderRadius: 4 }}>pass123</span>
            </div>
          </div>

          <form onSubmit={submit}>
            <label style={{ display: 'block', marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#3d2010', display: 'block', marginBottom: 8 }}>Email address</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1.5px solid #e5d5c5', borderRadius: 8, padding: '12px 16px', background: '#fff' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a08060" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="name@example.com"
                  style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, color: '#1a0f0a', background: 'transparent' }} />
              </div>
            </label>

            <label style={{ display: 'block', marginBottom: roleInfo.showStaffId ? 16 : 24 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#3d2010', display: 'block', marginBottom: 8 }}>Password</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1.5px solid #e5d5c5', borderRadius: 8, padding: '12px 16px', background: '#fff' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a08060" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="Enter your password"
                  style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, color: '#1a0f0a', background: 'transparent' }} />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#a08060', padding: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
            </label>

            {roleInfo.showStaffId && (
              <label style={{ display: 'block', marginBottom: 24 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#3d2010', display: 'block', marginBottom: 8 }}>Staff ID</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1.5px solid #e5d5c5', borderRadius: 8, padding: '12px 16px', background: '#fff' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a08060" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></svg>
                  <input type="text" value={staffId} onChange={e => setStaffId(e.target.value)}
                    placeholder="e.g. STAFF-001"
                    style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, color: '#1a0f0a', background: 'transparent' }} />
                </div>
              </label>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, fontSize: 13 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8b6a4a', cursor: 'pointer' }}>
                <input type="checkbox" style={{ accentColor: roleInfo.themeColor }} />
                Remember me
              </label>
              <a href="#" style={{ color: roleInfo.themeColor, fontWeight: 600, textDecoration: 'none' }}>Forgot password?</a>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#b91c1c', marginBottom: 16 }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: '100%', background: loading ? '#ccc' : roleInfo.themeColor, color: '#fff', border: 'none', borderRadius: 8, padding: '14px', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
              {loading ? 'Signing in…' : `Sign in as ${roleInfo.label}`}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '32px 0', color: '#d4b896' }}>
            <div style={{ flex: 1, height: 1, background: '#e5d5c5' }}></div>
            <span style={{ padding: '0 12px', fontSize: 13, fontStyle: 'italic' }}>or</span>
            <div style={{ flex: 1, height: 1, background: '#e5d5c5' }}></div>
          </div>

          <p style={{ textAlign: 'center', fontSize: 14, color: '#8b6a4a' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: roleInfo.themeColor, fontWeight: 700, textDecoration: 'none' }}>Register now</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
