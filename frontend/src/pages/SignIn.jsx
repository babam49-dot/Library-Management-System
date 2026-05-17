import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import DarkModeToggle from '../components/DarkModeToggle'

const ROLES = [
  { id: 3, label: 'Student Member', sub: 'Browse & borrow books', icon: '🎓', color: '#3b82f6' },
  { id: 2, label: 'Librarian / Staff', sub: 'Manage catalog & circulation', icon: '🗂️', color: '#10b981' },
  { id: 1, label: 'Administrator', sub: 'Full system access', icon: '🔑', color: '#f59e0b' },
]

export default function SignIn() {
  const [selectedRole, setSelectedRole] = useState(3)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const role = ROLES.find(r => r.id === selectedRole)

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const u = await login({ email, password })
      if (u.RoleID === 1) navigate('/admin')
      else if (u.RoleID === 2) navigate('/staff')
      else navigate('/member', { state: location.state })
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed'
      if (msg.toLowerCase().includes('pending')) {
        navigate('/pending')
      } else {
        setError(msg)
      }
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: isDark ? '#0a0e1a' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes floatR { 0%,100%{transform:translateY(0)} 50%{transform:translateY(20px)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .signin-card { animation: fadeIn 0.5s ease forwards; }
        .role-btn:hover { transform: translateY(-2px); }
        .signin-input:focus { border-color: ${role.color} !important; box-shadow: 0 0 0 3px ${role.color}22; }
      `}</style>

      {/* Floating blobs */}
      <div style={{ position:'fixed', top:'-15%', left:'-10%', width:500, height:500, background: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.12)', borderRadius:'50%', filter:'blur(80px)', animation:'float 8s ease-in-out infinite', pointerEvents:'none' }} />
      <div style={{ position:'fixed', bottom:'-10%', right:'-5%', width:450, height:450, background: isDark ? `rgba(${role.id===3?'59,130,246':role.id===2?'16,185,129':'245,158,11'},0.08)` : `rgba(${role.id===3?'59,130,246':role.id===2?'16,185,129':'245,158,11'},0.12)`, borderRadius:'50%', filter:'blur(80px)', animation:'floatR 10s ease-in-out infinite', pointerEvents:'none' }} />
      <div style={{ position:'fixed', top:'40%', right:'15%', width:250, height:250, background: isDark ? 'rgba(139,92,246,0.06)' : 'rgba(139,92,246,0.1)', borderRadius:'50%', filter:'blur(60px)', animation:'float 12s ease-in-out infinite reverse', pointerEvents:'none' }} />



      <div className="signin-card" style={{ width:'100%', maxWidth:900, margin:'0 auto', padding:'24px 16px', display:'flex', gap:24, alignItems:'stretch', zIndex:10, position:'relative' }}>
        {/* Left — Role selector */}
        <div style={{ width:300, flexShrink:0, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.8)', backdropFilter:'blur(20px)', borderRadius:24, border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)', padding:32, display:'flex', flexDirection:'column' }}>
          <Link to="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', marginBottom:36 }}>
            <div style={{ width:36, height:36, background:'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>📚</div>
            <span style={{ fontWeight:800, fontSize:18, fontFamily:"'Playfair Display',serif", color: isDark?'#fff':'#0f172a' }}>UniLibrary</span>
          </Link>

          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color: isDark?'#fff':'#0f172a', margin:'0 0 8px', lineHeight:1.2 }}>Welcome<br/><span style={{ color:'#f59e0b', fontStyle:'italic' }}>back.</span></h2>
          <p style={{ color: isDark?'#64748b':'#475569', fontSize:14, marginBottom:32, lineHeight:1.6 }}>Select your role to access the right portal.</p>

          <div style={{ display:'flex', flexDirection:'column', gap:10, flex:1 }}>
            {ROLES.map(r => (
              <button key={r.id} className="role-btn" onClick={() => setSelectedRole(r.id)} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderRadius:14, border: selectedRole===r.id ? `2px solid ${r.color}` : `1px solid ${isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)'}`, background: selectedRole===r.id ? `${r.color}18` : 'transparent', cursor:'pointer', textAlign:'left', transition:'all 0.2s' }}>
                <div style={{ width:38, height:38, borderRadius:10, background: selectedRole===r.id ? `${r.color}22` : isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{r.icon}</div>
                <div>
                  <div style={{ fontWeight:600, fontSize:14, color: isDark?'#f1f5f9':'#0f172a' }}>{r.label}</div>
                  <div style={{ fontSize:12, color: isDark?'#64748b':'#94a3b8', marginTop:2 }}>{r.sub}</div>
                </div>
                {selectedRole===r.id && <div style={{ marginLeft:'auto', width:8, height:8, borderRadius:'50%', background:r.color, flexShrink:0 }} />}
              </button>
            ))}
          </div>

          <p style={{ fontSize:12, color: isDark?'#334155':'#94a3b8', fontStyle:'italic', marginTop:24 }}>"A library is the delivery room for the imagination."</p>
        </div>

        {/* Right — Form */}
        <div style={{ flex:1, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)', backdropFilter:'blur(20px)', borderRadius:24, border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)', padding:40, display:'flex', flexDirection:'column', justifyContent:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:32 }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background:role.color }} />
            <span style={{ fontSize:13, fontWeight:600, color:role.color, textTransform:'uppercase', letterSpacing:1 }}>Signing in as {role.label}</span>
          </div>

          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color: isDark?'#fff':'#0f172a', margin:'0 0 28px' }}>Sign In</h3>

          {location.state?.pendingNotice && (
            <div style={{ padding:'14px 18px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:12, marginBottom:20, color:'#10b981', fontSize:14, fontWeight:600 }}>
              ✅ Account created successfully! Please sign in to check your approval status.
            </div>
          )}

          {error && <div style={{ padding:'12px 16px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, color:'#ef4444', fontSize:14, marginBottom:20 }}>⚠️ {error}</div>}


          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color: isDark?'#94a3b8':'#475569', marginBottom:8 }}>Email address</label>
              <input className="signin-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="name@example.com"
                style={{ width:'100%', padding:'12px 16px', borderRadius:12, border:`1.5px solid ${isDark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'}`, background: isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.03)', color: isDark?'#f1f5f9':'#0f172a', fontSize:15, outline:'none', boxSizing:'border-box', transition:'border-color 0.2s, box-shadow 0.2s' }} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color: isDark?'#94a3b8':'#475569', marginBottom:8 }}>Password</label>
              <div style={{ position:'relative' }}>
                <input className="signin-input" type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} required placeholder="Enter your password"
                  style={{ width:'100%', padding:'12px 48px 12px 16px', borderRadius:12, border:`1.5px solid ${isDark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'}`, background: isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.03)', color: isDark?'#f1f5f9':'#0f172a', fontSize:15, outline:'none', boxSizing:'border-box', transition:'border-color 0.2s, box-shadow 0.2s' }} />
                <button type="button" onClick={()=>setShowPw(v=>!v)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', border:'none', background:'none', cursor:'pointer', color: isDark?'#64748b':'#94a3b8', padding:0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ padding:'14px', borderRadius:12, border:'none', background:`linear-gradient(135deg,${role.color},${role.color}cc)`, color:'#fff', fontWeight:700, fontSize:16, cursor: loading?'not-allowed':'pointer', transition:'all 0.2s', boxShadow:`0 4px 20px ${role.color}44`, marginTop:4 }}>
              {loading ? 'Signing in…' : `Sign in →`}
            </button>
          </form>

          <div style={{ display:'flex', alignItems:'center', margin:'28px 0', gap:12 }}>
            <div style={{ flex:1, height:1, background: isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)' }} />
            <span style={{ fontSize:13, color: isDark?'#334155':'#94a3b8' }}>or</span>
            <div style={{ flex:1, height:1, background: isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)' }} />
          </div>

          <p style={{ textAlign:'center', fontSize:14, color: isDark?'#64748b':'#475569' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color:role.color, fontWeight:700, textDecoration:'none' }}>Create one →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
