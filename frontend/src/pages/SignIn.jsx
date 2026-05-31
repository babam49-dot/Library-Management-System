import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { startAuthentication } from '@simplewebauthn/browser'
import axios from 'axios'

const API = 'http://localhost:4000/api'

// ── Animated particle canvas background ──────────────────────────────────────
function ParticleCanvas({ isDark }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    const particles = []
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    const color = isDark ? '99,102,241' : '59,130,246'
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 1,
        dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.5 + 0.1
      })
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.dx; p.y += p.dy
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${color},${p.opacity})`
        ctx.fill()
      })
      // draw connecting lines between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(${color},${0.12 * (1 - dist / 120)})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      }
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [isDark])
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
}

export default function SignIn() {
  const [loginMode, setLoginMode] = useState('student')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, setUser } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const u = await login({ identifier, password, loginType: loginMode })
      if (u.RoleID === 1) navigate('/admin')
      else if (u.RoleID === 2) navigate('/staff')
      else navigate('/member', { state: location.state })
    } catch (err) {
      const msg = err.message || 'Login failed'
      if (msg.toLowerCase().includes('pending')) navigate('/pending')
      else setError(msg)
    } finally { setLoading(false) }
  }

  const signInWithFingerprint = async () => {
    if (!identifier) return setError('Please enter your ID or email first to use fingerprint login.')
    setError(''); setLoading(true)
    try {
      const res = await axios.post(`${API}/auth/webauthn/login/begin`, { identifier, loginType: loginMode })
      const { options, userId } = res.data.data
      const attResp = await startAuthentication({ optionsJSON: options })
      const verifyRes = await axios.post(`${API}/auth/webauthn/login/complete`, { userId, response: attResp })
      if (verifyRes.data.success) {
        const { token, user: u } = verifyRes.data.data
        localStorage.setItem('lms_token', token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        setUser(u)
        if (u.RoleID === 1) navigate('/admin')
        else if (u.RoleID === 2) navigate('/staff')
        else navigate('/member', { state: location.state })
      }
    } catch (err) {
      setError('Fingerprint login failed: ' + (err.response?.data?.message || err.message))
    } finally { setLoading(false) }
  }

  const primaryColor = loginMode === 'student' ? '#3b82f6' : '#10b981'
  const placeholderText = loginMode === 'student'
    ? 'Student ID (e.g. 1029384) or Email'
    : 'Staff ID (e.g. LIB-STAFF-001) or Email'

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: 12,
    border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'}`,
    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.8)',
    color: isDark ? '#f1f5f9' : '#0f172a', fontSize: 15, outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s',
    backdropFilter: 'blur(8px)'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark
        ? 'linear-gradient(135deg,#0a0e1a 0%,#0f1729 50%,#0a0e1a 100%)'
        : 'linear-gradient(135deg,#dbeafe 0%,#e0f2fe 40%,#f0f9ff 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter',sans-serif", position: 'relative', overflow: 'hidden',
      padding: '40px 16px'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes floatR { 0%,100%{transform:translateY(0)} 50%{transform:translateY(20px)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .signin-card { animation: fadeIn 0.5s ease forwards; }
        .signin-input:focus { border-color: ${primaryColor} !important; box-shadow: 0 0 0 3px ${primaryColor}22 !important; }
        .mode-btn { transition: all 0.25s ease; }
        .mode-btn:hover { transform: translateY(-1px); }
        .signin-submit:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.06); }
        .signin-submit { transition: all 0.22s ease; }
        .fp-btn:hover:not(:disabled) { background: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(59,130,246,0.06)'} !important; border-color: ${primaryColor} !important; transform: translateY(-1px); }
        .fp-btn { transition: all 0.22s ease; }
      `}</style>

      {/* Animated particle network background */}
      <ParticleCanvas isDark={isDark} />

      {/* Decorative glowing blobs */}
      <div style={{ position: 'fixed', top: '-15%', left: '-10%', width: 500, height: 500, background: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(59,130,246,0.15)', borderRadius: '50%', filter: 'blur(90px)', animation: 'float 8s ease-in-out infinite', pointerEvents: 'none', zIndex: 1 }} />
      <div style={{ position: 'fixed', bottom: '-10%', right: '-5%', width: 450, height: 450, background: isDark ? `rgba(16,185,129,0.1)` : `rgba(16,185,129,0.18)`, borderRadius: '50%', filter: 'blur(80px)', animation: 'floatR 10s ease-in-out infinite', pointerEvents: 'none', zIndex: 1 }} />
      <div style={{ position: 'fixed', top: '40%', right: '15%', width: 250, height: 250, background: isDark ? 'rgba(139,92,246,0.08)' : 'rgba(139,92,246,0.12)', borderRadius: '50%', filter: 'blur(60px)', animation: 'float 12s ease-in-out infinite reverse', pointerEvents: 'none', zIndex: 1 }} />

      {/* Card */}
      <div className="signin-card" style={{
        width: '100%', maxWidth: 480, margin: '0 auto', position: 'relative', zIndex: 10,
        background: isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(24px)',
        borderRadius: 24,
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.9)',
        boxShadow: isDark ? '0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)' : '0 32px 80px rgba(59,130,246,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
        padding: 40
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 4px 12px rgba(245,158,11,0.4)' }}>📚</div>
            <span style={{ fontWeight: 800, fontSize: 20, fontFamily: "'Playfair Display',serif", color: isDark ? '#fff' : '#0f172a' }}>UniLibrary</span>
          </Link>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: isDark ? '#fff' : '#0f172a', margin: '0 0 8px', lineHeight: 1.2 }}>
            Welcome <span style={{ color: primaryColor, fontStyle: 'italic' }}>back.</span>
          </h2>
          <p style={{ color: isDark ? '#64748b' : '#475569', fontSize: 14, margin: 0 }}>Sign in to access your portal</p>
        </div>

        {/* Mode Toggle */}
        <div style={{ display: 'flex', background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.06)', borderRadius: 14, padding: 4, marginBottom: 24, gap: 4 }}>
          {[{ key: 'student', label: '🎓 Student Member' }, { key: 'staff', label: '🗂️ Staff / Admin' }].map(m => (
            <button key={m.key} type="button" className="mode-btn"
              onClick={() => { setLoginMode(m.key); setIdentifier(''); setError('') }}
              style={{
                flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                background: loginMode === m.key
                  ? (isDark ? 'rgba(255,255,255,0.1)' : '#fff')
                  : 'transparent',
                color: loginMode === m.key ? (isDark ? '#fff' : '#0f172a') : (isDark ? '#64748b' : '#94a3b8'),
                fontWeight: 600, fontSize: 14, cursor: 'pointer',
                boxShadow: loginMode === m.key ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
              }}>
              {m.label}
            </button>
          ))}
        </div>

        {/* Pending Notice */}
        {location.state?.pendingNotice && (
          <div style={{ padding: '14px 18px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, marginBottom: 20, color: '#10b981', fontSize: 14, fontWeight: 600 }}>
            ✅ Account created! Sign in to check your approval status.
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#ef4444', fontSize: 14, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: isDark ? '#94a3b8' : '#475569', marginBottom: 8 }}>
              {loginMode === 'student' ? 'Student ID or Email' : 'Staff ID or Email'}
            </label>
            <input
              id="signin-identifier"
              className="signin-input"
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              required
              placeholder={placeholderText}
              autoComplete="username"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: isDark ? '#94a3b8' : '#475569', marginBottom: 8 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="signin-password"
                className="signin-input"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                autoComplete="current-password"
                style={{ ...inputStyle, paddingRight: 48 }}
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: isDark ? '#64748b' : '#94a3b8', padding: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showPw
                    ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                    : <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>
                  }
                </svg>
              </button>
            </div>
          </div>

          <button
            id="signin-submit"
            type="submit"
            disabled={loading}
            className="signin-submit"
            style={{
              padding: '14px', borderRadius: 12, border: 'none',
              background: `linear-gradient(135deg,${primaryColor},${primaryColor}cc)`,
              color: '#fff', fontWeight: 700, fontSize: 16,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: `0 4px 20px ${primaryColor}44`, marginTop: 4,
              opacity: loading ? 0.8 : 1
            }}>
            {loading ? '⏳ Signing in…' : 'Sign in →'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />
          <span style={{ fontSize: 12, color: isDark ? '#334155' : '#94a3b8', fontWeight: 600 }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />
        </div>

        {/* Fingerprint Button */}
        <button
          id="signin-fingerprint"
          type="button"
          className="fp-btn"
          onClick={signInWithFingerprint}
          disabled={loading}
          style={{
            width: '100%', padding: '13px 16px', borderRadius: 12,
            border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)',
            color: isDark ? '#f1f5f9' : '#0f172a',
            fontWeight: 600, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            backdropFilter: 'blur(8px)'
          }}>
          <span style={{ fontSize: 20 }}>🔐</span>
          {loading ? 'Verifying…' : 'Sign in with Fingerprint / Windows Hello'}
        </button>

        {/* Staff credentials info box */}
        <div style={{ marginTop: 20, padding: '12px 16px', background: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10 }}>
          <p style={{ margin: 0, fontSize: 12, color: isDark ? '#fbbf24' : '#92400e', fontWeight: 600 }}>
            📋 Staff IDs: <code>STAFF-ADMIN-001</code> (Admin) · <code>LIB-STAFF-001</code> · <code>LIB-STAFF-002</code>
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: isDark ? '#94a3b8' : '#78716c' }}>
            You can also sign in using your email address on either tab.
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, color: isDark ? '#64748b' : '#475569', marginTop: 28 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: primaryColor, fontWeight: 700, textDecoration: 'none' }}>Create one →</Link>
        </p>
      </div>
    </div>
  )
}
