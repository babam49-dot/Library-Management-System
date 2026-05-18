import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { startAuthentication } from '@simplewebauthn/browser'
import axios from 'axios'

const API = 'http://localhost:4000/api'

export default function SignIn() {
  const [loginMode, setLoginMode] = useState('student') // 'student' or 'staff'
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
      if (msg.toLowerCase().includes('pending')) {
        navigate('/pending')
      } else {
        setError(msg)
      }
    } finally { setLoading(false) }
  }

  const signInWithFingerprint = async () => {
    if (!identifier) return setError('Please enter your ID first to use fingerprint login.')
    setError(''); setLoading(true)
    try {
      const res = await axios.post(`${API}/auth/webauthn/login/begin`, { identifier, loginType: loginMode })
      const { options, userId } = res.data.data;
      
      const attResp = await startAuthentication({ optionsJSON: options });
      
      const verifyRes = await axios.post(`${API}/auth/webauthn/login/complete`, { userId, response: attResp });
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
  
  return (
    <div style={{ minHeight: '100vh', background: isDark ? '#0a0e1a' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden', padding: '40px 16px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes floatR { 0%,100%{transform:translateY(0)} 50%{transform:translateY(20px)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .signin-card { animation: fadeIn 0.5s ease forwards; }
        .signin-input:focus { border-color: ${primaryColor} !important; box-shadow: 0 0 0 3px ${primaryColor}22; }
      `}</style>

      {/* Floating blobs */}
      <div style={{ position:'fixed', top:'-15%', left:'-10%', width:500, height:500, background: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.12)', borderRadius:'50%', filter:'blur(80px)', animation:'float 8s ease-in-out infinite', pointerEvents:'none' }} />
      <div style={{ position:'fixed', bottom:'-10%', right:'-5%', width:450, height:450, background: isDark ? `${primaryColor}14` : `${primaryColor}1E`, borderRadius:'50%', filter:'blur(80px)', animation:'floatR 10s ease-in-out infinite', pointerEvents:'none' }} />
      <div style={{ position:'fixed', top:'40%', right:'15%', width:250, height:250, background: isDark ? 'rgba(139,92,246,0.06)' : 'rgba(139,92,246,0.1)', borderRadius:'50%', filter:'blur(60px)', animation:'float 12s ease-in-out infinite reverse', pointerEvents:'none' }} />

      <div className="signin-card" style={{ width: '100%', maxWidth: 480, margin: '0 auto', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)', backdropFilter:'blur(20px)', borderRadius:24, border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)', padding:40, position:'relative', zIndex:10 }}>
        
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📚</div>
            <span style={{ fontWeight: 800, fontSize: 18, fontFamily: "'Playfair Display',serif", color: isDark ? '#fff' : '#0f172a' }}>UniLibrary</span>
          </Link>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color: isDark?'#fff':'#0f172a', margin:'0 0 8px', lineHeight:1.2 }}>Welcome <span style={{ color: primaryColor, fontStyle:'italic' }}>back.</span></h2>
          <p style={{ color: isDark?'#64748b':'#475569', fontSize:14, margin:0 }}>Sign in to access your portal</p>
        </div>

        {/* Mode Toggle */}
        <div style={{ display: 'flex', background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)', borderRadius: 12, padding: 4, marginBottom: 24 }}>
          <button 
            type="button"
            onClick={() => { setLoginMode('student'); setIdentifier(''); setError(''); }}
            style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: loginMode === 'student' ? (isDark ? '#1e293b' : '#fff') : 'transparent', color: loginMode === 'student' ? (isDark ? '#fff' : '#0f172a') : (isDark ? '#94a3b8' : '#64748b'), fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s', boxShadow: loginMode === 'student' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' }}
          >
            🎓 Student Member
          </button>
          <button 
            type="button"
            onClick={() => { setLoginMode('staff'); setIdentifier(''); setError(''); }}
            style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: loginMode === 'staff' ? (isDark ? '#1e293b' : '#fff') : 'transparent', color: loginMode === 'staff' ? (isDark ? '#fff' : '#0f172a') : (isDark ? '#94a3b8' : '#64748b'), fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s', boxShadow: loginMode === 'staff' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' }}
          >
            🗂️ Staff / Admin
          </button>
        </div>

        {location.state?.pendingNotice && (
          <div style={{ padding:'14px 18px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:12, marginBottom:20, color:'#10b981', fontSize:14, fontWeight:600 }}>
            ✅ Account created successfully! Please sign in to check your approval status.
          </div>
        )}

        {error && <div style={{ padding:'12px 16px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, color:'#ef4444', fontSize:14, marginBottom:20 }}>⚠️ {error}</div>}

        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
          <div>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color: isDark?'#94a3b8':'#475569', marginBottom:8 }}>
              {loginMode === 'student' ? 'Student ID' : 'Staff ID'}
            </label>
            <input className="signin-input" type="text" value={identifier} onChange={e=>setIdentifier(e.target.value)} required placeholder={loginMode === 'student' ? "e.g. 1029384" : "e.g. LIB-9021"}
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

          <button type="submit" disabled={loading} style={{ padding:'14px', borderRadius:12, border:'none', background:`linear-gradient(135deg,${primaryColor},${primaryColor}cc)`, color:'#fff', fontWeight:700, fontSize:16, cursor: loading?'not-allowed':'pointer', transition:'all 0.2s', boxShadow:`0 4px 20px ${primaryColor}44`, marginTop:4 }}>
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>

        <div style={{ display:'flex', alignItems:'center', margin:'28px 0', gap:12 }}>
          <div style={{ flex:1, height:1, background: isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)' }} />
          <span style={{ fontSize:13, color: isDark?'#334155':'#94a3b8' }}>or</span>
          <div style={{ flex:1, height:1, background: isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)' }} />
        </div>
        
        {/* WebAuthn Fingerprint Login */}
        <button 
          type="button" 
          onClick={signInWithFingerprint}
          disabled={loading}
          style={{ width: '100%', padding:'14px', borderRadius:12, border: `1.5px solid ${isDark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'}`, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', color: isDark ? '#f1f5f9' : '#0f172a', fontWeight:600, fontSize:15, cursor: loading?'not-allowed':'pointer', transition:'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>🔐</span> {loading ? 'Checking...' : 'Sign in with Fingerprint'}
        </button>

        <p style={{ textAlign:'center', fontSize:14, color: isDark?'#64748b':'#475569', marginTop: 32 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: primaryColor, fontWeight:700, textDecoration:'none' }}>Create one →</Link>
        </p>
      </div>
    </div>
  )
}
