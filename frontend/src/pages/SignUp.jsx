import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import DarkModeToggle from '../components/DarkModeToggle'

function ParticleCanvas({ isDark, color }) {
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
    const rgb = isDark ? '99,102,241' : color === '#10b981' ? '16,185,129' : '59,130,246'
    for (let i = 0; i < 55; i++) {
      particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 2 + 1, dx: (Math.random() - 0.5) * 0.4, dy: (Math.random() - 0.5) * 0.4, opacity: Math.random() * 0.45 + 0.1 })
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.dx; p.y += p.dy
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${rgb},${p.opacity})`; ctx.fill()
      })
      for (let i = 0; i < particles.length; i++) for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 120) { ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.strokeStyle = `rgba(${rgb},${0.1 * (1 - dist / 120)})`; ctx.lineWidth = 1; ctx.stroke() }
      }
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [isDark, color])
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
}

const ROLES = [
  { id: 3, label: 'Student Member', sub: 'Borrow & reserve books', icon: '🎓', color: '#3b82f6' },
  { id: 2, label: 'Library Staff', sub: 'Manage the catalog', icon: '🗂️', color: '#10b981' },
]

export default function SignUp() {
  const [selectedRole, setSelectedRole] = useState(3)
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '', universityId: '', department: '', jobTitle: '', staffId: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { registerStaff, registerMember } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()

  const role = ROLES.find(r => r.id === selectedRole)
  const handle = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await (selectedRole === 2 ? registerStaff(formData) : registerMember(formData))
      // ✅ Immediately redirect to sign-in, no delay
      navigate('/login', { state: { pendingNotice: true } })
    } catch (err) {
      // Show email-already-in-use and other errors inline on the form
      setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  const inputStyle = {
    width: '100%', padding: '11px 16px', borderRadius: 12,
    border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
    color: isDark ? '#f1f5f9' : '#0f172a', fontSize: 14, outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  }
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: isDark ? '#94a3b8' : '#475569', marginBottom: 6 }

  return (
    <div style={{ minHeight: '100vh', background: isDark ? 'linear-gradient(135deg,#0a0e1a 0%,#0f1729 50%,#0a0e1a 100%)' : 'linear-gradient(135deg,#dbeafe 0%,#e0f2fe 40%,#f0f9ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif", position: 'relative', overflow: 'hidden', padding: '40px 16px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
        @keyframes floatR{0%,100%{transform:translateY(0)}50%{transform:translateY(20px)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .signup-anim{animation:fadeIn 0.5s ease forwards}
        .su-input:focus{border-color:${role.color}!important;box-shadow:0 0 0 3px ${role.color}22}
      `}</style>

      <ParticleCanvas isDark={isDark} color={role.color} />

      {/* Blobs */}
      <div style={{ position: 'fixed', top: '-15%', left: '-10%', width: 500, height: 500, background: isDark ? 'rgba(245,158,11,0.07)' : 'rgba(245,158,11,0.1)', borderRadius: '50%', filter: 'blur(80px)', animation: 'float 8s ease-in-out infinite', pointerEvents: 'none', zIndex: 1 }} />
      <div style={{ position: 'fixed', bottom: '-10%', right: '-5%', width: 450, height: 450, background: isDark ? `${role.color}12` : `${role.color}22`, borderRadius: '50%', filter: 'blur(80px)', animation: 'floatR 10s ease-in-out infinite', pointerEvents: 'none', zIndex: 1 }} />
      <div style={{ position: 'fixed', top: '50%', left: '30%', width: 300, height: 300, background: isDark ? 'rgba(139,92,246,0.05)' : 'rgba(139,92,246,0.08)', borderRadius: '50%', filter: 'blur(70px)', animation: 'float 14s ease-in-out infinite reverse', pointerEvents: 'none', zIndex: 1 }} />


      <div className="signup-anim" style={{ width: '100%', maxWidth: 640, position: 'relative', zIndex: 10 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📚</div>
            <span style={{ fontWeight: 800, fontSize: 20, fontFamily: "'Playfair Display',serif", color: isDark ? '#fff' : '#0f172a' }}>UniLibrary</span>
          </Link>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 700, color: isDark ? '#fff' : '#0f172a', margin: '0 0 8px' }}>
            Join the <span style={{ color: '#f59e0b', fontStyle: 'italic' }}>community.</span>
          </h1>
          <p style={{ color: isDark ? '#64748b' : '#475569', fontSize: 15 }}>Create your account to get started.</p>
        </div>

        {/* Role toggle */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {ROLES.map(r => (
            <button key={r.id} onClick={() => setSelectedRole(r.id)} style={{ flex: 1, padding: '14px 12px', borderRadius: 14, border: selectedRole === r.id ? `2px solid ${r.color}` : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, background: selectedRole === r.id ? `${r.color}18` : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{r.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: isDark ? '#f1f5f9' : '#0f172a' }}>{r.label}</div>
              <div style={{ fontSize: 12, color: isDark ? '#64748b' : '#94a3b8', marginTop: 2 }}>{r.sub}</div>
            </button>
          ))}
        </div>

        {/* Card */}
        <div style={{ background: isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.88)', backdropFilter: 'blur(24px)', borderRadius: 24, border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.9)', padding: '32px 36px', boxShadow: isDark ? '0 32px 80px rgba(0,0,0,0.5)' : '0 32px 80px rgba(59,130,246,0.12)' }}>

          <form onSubmit={submit}>
            {error && <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#ef4444', fontSize: 14, marginBottom: 20 }}>⚠️ {error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>First Name *</label>
                <input className="su-input" style={inputStyle} type="text" name="firstName" value={formData.firstName} onChange={handle} required placeholder="Jane" />
              </div>
              <div>
                <label style={labelStyle}>Last Name *</label>
                <input className="su-input" style={inputStyle} type="text" name="lastName" value={formData.lastName} onChange={handle} required placeholder="Doe" />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email Address *</label>
              <input className="su-input" style={inputStyle} type="email" name="email" value={formData.email} onChange={handle} required placeholder="jane@university.edu" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Password *</label>
                <input className="su-input" style={inputStyle} type="password" name="password" value={formData.password} onChange={handle} required minLength={6} placeholder="Min. 6 characters" />
              </div>
              <div>
                <label style={labelStyle}>Phone (optional)</label>
                <input className="su-input" style={inputStyle} type="text" name="phone" value={formData.phone} onChange={handle} placeholder="+1 234 567 890" />
              </div>
            </div>

            {selectedRole === 3 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16, padding: 16, borderRadius: 14, background: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.06)', border: '1px dashed rgba(59,130,246,0.3)' }}>
                <div>
                  <label style={labelStyle}>University ID *</label>
                  <input className="su-input" style={inputStyle} type="text" name="universityId" value={formData.universityId} onChange={handle} required placeholder="e.g. 1029384" />
                </div>
                <div>
                  <label style={labelStyle}>Department</label>
                  <input className="su-input" style={inputStyle} type="text" name="department" value={formData.department} onChange={handle} placeholder="e.g. Computer Science" />
                </div>
              </div>
            )}

            {selectedRole === 2 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16, padding: 16, borderRadius: 14, background: isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.06)', border: '1px dashed rgba(16,185,129,0.3)' }}>
                <div>
                  <label style={labelStyle}>Staff ID *</label>
                  <input className="su-input" style={inputStyle} type="text" name="staffId" value={formData.staffId} onChange={handle} required placeholder="e.g. LIB-9021" />
                </div>
                <div>
                  <label style={labelStyle}>Job Title *</label>
                  <input className="su-input" style={inputStyle} type="text" name="jobTitle" value={formData.jobTitle} onChange={handle} required placeholder="e.g. Circulation Assistant" />
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${role.color},${role.color}cc)`, color: '#fff', fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: `0 4px 20px ${role.color}44`, transition: 'all 0.2s', marginTop: 8 }}>
              {loading ? 'Creating Account...' : 'Create Account →'}
            </button>
          </form>
          )
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, color: isDark ? '#64748b' : '#475569', marginTop: 20 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: role.color, fontWeight: 700, textDecoration: 'none' }}>Sign in →</Link>
        </p>
      </div>
    </div>
  )
}
