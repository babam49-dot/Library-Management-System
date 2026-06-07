import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { startAuthentication } from '@simplewebauthn/browser'
import axios from 'axios'

const API = 'http://localhost:4000/api'

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
    for (let i = 0; i < 55; i++) {
      particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 2 + 1, dx: (Math.random() - 0.5) * 0.4, dy: (Math.random() - 0.5) * 0.4, opacity: Math.random() * 0.5 + 0.1 })
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.dx; p.y += p.dy
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${color},${p.opacity})`; ctx.fill()
      })
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(${color},${0.1 * (1 - dist / 120)})`; ctx.lineWidth = 1; ctx.stroke()
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

// Fingerprint SVG sensor – teal scanner style
function FingerprintSensor({ state, onClick, disabled }) {
  const cfg = {
    idle:     { color: '#00c9c0', shadow: 'rgba(0,201,192,0.0)',  ring: 'rgba(0,201,192,0.12)', label: 'Enter your ID first',           sub: 'Fingerprint login available' },
    ready:    { color: '#00e5d4', shadow: 'rgba(0,229,212,0.55)', ring: 'rgba(0,229,212,0.18)', label: 'Touch your sensor',             sub: 'Click the scanner to begin' },
    scanning: { color: '#3b82f6', shadow: 'rgba(59,130,246,0.7)', ring: 'rgba(59,130,246,0.2)', label: 'Scanning…',                    sub: 'Keep your finger on the sensor' },
    success:  { color: '#10b981', shadow: 'rgba(16,185,129,0.7)', ring: 'rgba(16,185,129,0.2)', label: 'Verified! ✓',                  sub: 'Logging you in…' },
    error:    { color: '#ef4444', shadow: 'rgba(239,68,68,0.55)', ring: 'rgba(239,68,68,0.15)', label: 'Scan failed',                  sub: 'Try again' },
  }
  const c = cfg[state] || cfg.idle
  const isClickable = (state === 'ready' || state === 'error') && !disabled

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      {/* Sensor circle */}
      <div
        onClick={isClickable ? onClick : undefined}
        title={isClickable ? 'Click to scan fingerprint' : ''}
        style={{
          width: 108, height: 108, borderRadius: '50%',
          background: `radial-gradient(circle at 40% 38%, #1a2a38 0%, #0b1520 70%, #060d14 100%)`,
          border: `2.5px solid ${c.color}88`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: isClickable ? 'pointer' : 'default',
          position: 'relative', transition: 'all 0.4s ease',
          boxShadow: `0 0 0 4px ${c.ring}, 0 0 32px ${c.shadow}, inset 0 0 20px rgba(0,0,0,0.6)`,
          animation: state === 'scanning' ? 'fpPulse 1.4s ease-in-out infinite' : state === 'ready' ? 'fpGlow 2.5s ease-in-out infinite' : 'none',
        }}
      >
        {/* Ripple rings when scanning */}
        {state === 'scanning' && <>
          <div style={{ position: 'absolute', inset: -12, borderRadius: '50%', border: `1.5px solid ${c.color}50`, animation: 'fpRipple 1.5s ease-out infinite' }} />
          <div style={{ position: 'absolute', inset: -26, borderRadius: '50%', border: `1px solid ${c.color}28`, animation: 'fpRipple 1.5s ease-out 0.55s infinite' }} />
        </>}
        {state === 'success' && (
          <div style={{ position: 'absolute', inset: -12, borderRadius: '50%', border: `2px solid ${c.color}60`, animation: 'fpRippleOnce 0.65s ease-out forwards' }} />
        )}

        {/* Fingerprint SVG */}
        <div style={{ position: 'relative', width: 70, height: 70 }}>
          <svg width="70" height="70" viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Central core loop */}
            <ellipse cx="50" cy="47" rx="6" ry="7" stroke={c.color} strokeWidth="2.4" fill="none"
              style={{ transition: 'stroke 0.4s', filter: `drop-shadow(0 0 3px ${c.color})` }} />
            {/* Ridge 1 */}
            <path d="M 33 47 C 33 33 41 25 50 25 C 59 25 67 33 67 47 C 67 60 59 70 50 73 C 41 70 33 60 33 47Z"
              stroke={c.color} strokeWidth="2.2" fill="none" style={{ transition: 'stroke 0.4s', filter: `drop-shadow(0 0 2px ${c.color})` }} />
            {/* Ridge 2 */}
            <path d="M 20 49 C 20 26 33 14 50 14 C 67 14 80 26 80 49 C 80 67 67 80 50 83 C 33 80 20 67 20 49Z"
              stroke={c.color} strokeWidth="2.1" fill="none" style={{ transition: 'stroke 0.4s' }} />
            {/* Ridge 3 */}
            <path d="M 8 52 C 8 20 27 4 50 4 C 73 4 92 20 92 52 C 92 74 76 92 50 96 C 24 92 8 74 8 52Z"
              stroke={c.color} strokeWidth="2" fill="none" opacity="0.8" style={{ transition: 'stroke 0.4s' }} />
            {/* Outer ridge */}
            <path d="M 2 56 C 1 18 23 -2 50 -2 C 77 -2 99 18 98 56"
              stroke={c.color} strokeWidth="1.7" fill="none" opacity="0.4" strokeLinecap="round" style={{ transition: 'stroke 0.4s' }} />
            {/* Loop opening — left arch break */}
            <path d="M 12 28 Q 22 12 36 7" stroke={c.color} strokeWidth="2.1" fill="none" strokeLinecap="round" style={{ transition: 'stroke 0.4s' }} />
            <path d="M 22 18 Q 32 9 44 6" stroke={c.color} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.55" style={{ transition: 'stroke 0.4s' }} />
            {/* Success checkmark overlay */}
            {state === 'success' && (
              <path d="M 26 52 L 42 68 L 74 32" stroke={c.color} strokeWidth="4.5"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ strokeDasharray: 70, strokeDashoffset: 0, animation: 'fpCheck 0.4s ease forwards', filter: `drop-shadow(0 0 4px ${c.color})` }} />
            )}
          </svg>

          {/* Horizontal scan sweep */}
          {state === 'scanning' && (
            <div style={{
              position: 'absolute', left: 6, right: 6, height: 2,
              background: `linear-gradient(90deg, transparent, ${c.color}ee, transparent)`,
              borderRadius: 2, top: '30%',
              animation: 'fpSweep 1.4s ease-in-out infinite',
              boxShadow: `0 0 10px ${c.color}, 0 0 4px ${c.color}`,
            }} />
          )}
        </div>
      </div>

      {/* Labels */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: c.color, transition: 'color 0.4s', marginBottom: 2, letterSpacing: 0.2 }}>
          {c.label}
        </div>
        <div style={{ fontSize: 11, color: '#64748b' }}>{c.sub}</div>
      </div>
    </div>
  )
}

export default function SignIn() {
  const [loginMode, setLoginMode] = useState('student')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fpState, setFpState] = useState('idle') // idle | ready | scanning | success | error
  const { login, setUser } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  // Update fingerprint state when identifier changes
  useEffect(() => {
    if (identifier.trim()) {
      setFpState(prev => (prev === 'idle' ? 'ready' : prev === 'scanning' || prev === 'success' ? prev : 'ready'))
    } else {
      setFpState('idle')
    }
  }, [identifier])

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
    if (!identifier.trim()) { setError('Enter your ID or email above first.'); return }
    setError(''); setFpState('scanning'); setLoading(true)
    try {
      const res = await axios.post(`${API}/auth/webauthn/login/begin`, { identifier, loginType: loginMode })
      const { options, userId } = res.data.data
      const attResp = await startAuthentication({ optionsJSON: options })
      const verifyRes = await axios.post(`${API}/auth/webauthn/login/complete`, { userId, response: attResp })
      if (verifyRes.data.success) {
        const { token, user: u } = verifyRes.data.data
        setFpState('success')
        localStorage.setItem('lms_token', token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        setUser(u)
        setTimeout(() => {
          if (u.RoleID === 1) navigate('/admin')
          else if (u.RoleID === 2) navigate('/staff')
          else navigate('/member', { state: location.state })
        }, 700)
      }
    } catch (err) {
      setFpState('error')
      const msg = err.response?.data?.message || err.message || ''
      if (msg.toLowerCase().includes('not allowed') || msg.toLowerCase().includes('abort') || msg.toLowerCase().includes('cancel')) {
        setError('Scan cancelled — try again.')
      } else if (msg.toLowerCase().includes('no fingerprint')) {
        setError('No fingerprint registered. Go to My Profile to enroll first.')
      } else {
        setError('Fingerprint login failed: ' + msg)
      }
      setTimeout(() => setFpState(identifier.trim() ? 'ready' : 'idle'), 2000)
    } finally { setLoading(false) }
  }

  const primaryColor = loginMode === 'student' ? '#3b82f6' : '#10b981'

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: 12,
    border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'}`,
    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.8)',
    color: isDark ? '#f1f5f9' : '#0f172a', fontSize: 15, outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.2s', backdropFilter: 'blur(8px)'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark ? 'linear-gradient(135deg,#0a0e1a 0%,#0f1729 50%,#0a0e1a 100%)' : 'linear-gradient(135deg,#dbeafe 0%,#e0f2fe 40%,#f0f9ff 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter',sans-serif", position: 'relative', overflow: 'hidden', padding: '40px 16px'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes floatR { 0%,100%{transform:translateY(0)} 50%{transform:translateY(20px)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fpPulse { 0%,100%{box-shadow:0 0 60px rgba(59,130,246,0.6)} 50%{box-shadow:0 0 80px rgba(59,130,246,0.9)} }
        @keyframes fpRipple { 0%{transform:scale(1);opacity:0.7} 100%{transform:scale(1.6);opacity:0} }
        @keyframes fpRippleOnce { 0%{transform:scale(1);opacity:0.8} 100%{transform:scale(1.5);opacity:0} }
        @keyframes fpSweep { 0%{top:8px;opacity:0} 20%{opacity:1} 80%{opacity:1} 100%{top:82px;opacity:0} }
        @keyframes fpCheck { from{stroke-dashoffset:60;opacity:0} to{stroke-dashoffset:0;opacity:1} }
        .signin-card { animation: fadeIn 0.5s ease forwards; }
        .mode-btn { transition: all 0.25s ease; }
        .mode-btn:hover { transform: translateY(-1px); }
        .signin-submit { transition: all 0.22s ease; }
        .signin-submit:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.06); }
        .signin-input:focus { border-color: ${primaryColor} !important; box-shadow: 0 0 0 3px ${primaryColor}22 !important; }
      `}</style>

      <ParticleCanvas isDark={isDark} />
      <div style={{ position: 'fixed', top: '-15%', left: '-10%', width: 500, height: 500, background: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(59,130,246,0.15)', borderRadius: '50%', filter: 'blur(90px)', animation: 'float 8s ease-in-out infinite', pointerEvents: 'none', zIndex: 1 }} />
      <div style={{ position: 'fixed', bottom: '-10%', right: '-5%', width: 450, height: 450, background: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.18)', borderRadius: '50%', filter: 'blur(80px)', animation: 'floatR 10s ease-in-out infinite', pointerEvents: 'none', zIndex: 1 }} />

      <div className="signin-card" style={{
        width: '100%', maxWidth: 480, margin: '0 auto', position: 'relative', zIndex: 10,
        background: isDark ? 'rgba(15,23,42,0.88)' : 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(24px)', borderRadius: 24,
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.9)',
        boxShadow: isDark ? '0 32px 80px rgba(0,0,0,0.5)' : '0 32px 80px rgba(59,130,246,0.12)',
        padding: 40
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 4px 12px rgba(245,158,11,0.4)' }}>📚</div>
            <span style={{ fontWeight: 800, fontSize: 20, fontFamily: "'Playfair Display',serif", color: isDark ? '#fff' : '#0f172a' }}>UniLibrary</span>
          </Link>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: isDark ? '#fff' : '#0f172a', margin: '0 0 6px', lineHeight: 1.2 }}>
            Welcome <span style={{ color: primaryColor, fontStyle: 'italic' }}>back.</span>
          </h2>
          <p style={{ color: isDark ? '#64748b' : '#475569', fontSize: 14, margin: 0 }}>Sign in to access your portal</p>
        </div>

        {/* Mode Toggle */}
        <div style={{ display: 'flex', background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.06)', borderRadius: 14, padding: 4, marginBottom: 24, gap: 4 }}>
          {[{ key: 'student', label: '🎓 Student Member' }, { key: 'staff', label: '🗂️ Staff / Admin' }].map(m => (
            <button key={m.key} type="button" className="mode-btn"
              onClick={() => { setLoginMode(m.key); setIdentifier(''); setError(''); setFpState('idle') }}
              style={{
                flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                background: loginMode === m.key ? (isDark ? 'rgba(255,255,255,0.1)' : '#fff') : 'transparent',
                color: loginMode === m.key ? (isDark ? '#fff' : '#0f172a') : (isDark ? '#64748b' : '#94a3b8'),
                fontWeight: 600, fontSize: 14, cursor: 'pointer',
                boxShadow: loginMode === m.key ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
              }}>{m.label}</button>
          ))}
        </div>

        {/* Pending notice */}
        {location.state?.pendingNotice && (
          <div style={{ padding: '14px 18px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, marginBottom: 20, color: '#10b981', fontSize: 14, fontWeight: 600 }}>
            ✅ Account created! Sign in to check your approval status.
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#ef4444', fontSize: 14, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚠️</span><span style={{ flex: 1 }}>{error}</span>
            <button onClick={() => setError('')} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 900, fontSize: 16 }}>✕</button>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: isDark ? '#94a3b8' : '#475569', marginBottom: 8 }}>
              {loginMode === 'student' ? 'Student ID or Email' : 'Staff ID or Email'}
            </label>
            <input id="signin-identifier" className="signin-input" type="text"
              value={identifier} onChange={e => setIdentifier(e.target.value)}
              required placeholder={loginMode === 'student' ? 'Student ID or Email' : 'Staff ID (e.g. LIB-STAFF-001) or Email'}
              autoComplete="username" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: isDark ? '#94a3b8' : '#475569', marginBottom: 8 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input id="signin-password" className="signin-input" type={showPw ? 'text' : 'password'}
                value={password} onChange={e => setPassword(e.target.value)}
                required placeholder="Enter your password" autoComplete="current-password"
                style={{ ...inputStyle, paddingRight: 48 }} />
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
          <button id="signin-submit" type="submit" disabled={loading} className="signin-submit"
            style={{ padding: '14px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${primaryColor},${primaryColor}cc)`, color: '#fff', fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: `0 4px 20px ${primaryColor}44`, opacity: loading ? 0.8 : 1, marginTop: 4 }}>
            {loading && fpState !== 'scanning' ? '⏳ Signing in…' : 'Sign in →'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '28px 0 24px', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />
          <span style={{ fontSize: 12, color: isDark ? '#334155' : '#94a3b8', fontWeight: 600 }}>or sign in with fingerprint</span>
          <div style={{ flex: 1, height: 1, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />
        </div>

        {/* Fingerprint Sensor */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 8 }}>
          <FingerprintSensor
            state={fpState}
            onClick={signInWithFingerprint}
            disabled={loading}
          />
        </div>

        {/* Staff info box */}
        <div style={{ marginTop: 24, padding: '12px 16px', background: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10 }}>
          <p style={{ margin: 0, fontSize: 12, color: isDark ? '#fbbf24' : '#92400e', fontWeight: 600 }}>
            📋 Staff IDs: <code>STAFF-ADMIN-001</code> · <code>LIB-STAFF-001</code> · <code>LIB-STAFF-002</code>
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: isDark ? '#94a3b8' : '#78716c' }}>
            You can also sign in using your email. Register fingerprint in My Profile first.
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, color: isDark ? '#64748b' : '#475569', marginTop: 24 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: primaryColor, fontWeight: 700, textDecoration: 'none' }}>Create one →</Link>
        </p>
      </div>
    </div>
  )
}
