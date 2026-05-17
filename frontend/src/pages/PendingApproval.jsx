import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

export default function PendingApproval() {
  const { isDark } = useTheme()
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark ? '#0a0e1a' : '#f1f5f9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
        @keyframes floatR { 0%,100%{transform:translateY(0)} 50%{transform:translateY(18px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,0.4)} 50%{box-shadow:0 0 0 22px rgba(245,158,11,0)} }
        .pending-card { animation: fadeUp 0.55s ease both; }
        .pulse-ring { animation: pulse 2.2s ease-in-out infinite; }
      `}</style>

      {/* Blobs */}
      <div style={{ position:'fixed', top:'-15%', left:'-10%', width:500, height:500, background: isDark?'rgba(245,158,11,0.07)':'rgba(245,158,11,0.1)', borderRadius:'50%', filter:'blur(80px)', animation:'float 8s ease-in-out infinite', pointerEvents:'none' }} />
      <div style={{ position:'fixed', bottom:'-10%', right:'-5%', width:450, height:450, background: isDark?'rgba(139,92,246,0.07)':'rgba(139,92,246,0.1)', borderRadius:'50%', filter:'blur(80px)', animation:'floatR 10s ease-in-out infinite', pointerEvents:'none' }} />

      <div className="pending-card" style={{
        width: '100%', maxWidth: 520, padding: '0 20px', position: 'relative', zIndex: 10,
        textAlign: 'center'
      }}>
        {/* Logo */}
        <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:10, textDecoration:'none', marginBottom:36 }}>
          <div style={{ width:44, height:44, background:'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>📚</div>
          <span style={{ fontWeight:800, fontSize:22, fontFamily:"'Playfair Display',serif", color: isDark?'#fff':'#0f172a' }}>UniLibrary</span>
        </Link>

        {/* Card */}
        <div style={{
          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          borderRadius: 28,
          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
          padding: '52px 44px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.18)'
        }}>
          {/* Hourglass Icon */}
          <div className="pulse-ring" style={{
            width: 88, height: 88, borderRadius: '50%',
            background: 'rgba(245,158,11,0.15)', border: '2px solid rgba(245,158,11,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 44, margin: '0 auto 28px'
          }}>
            ⏳
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 30, fontWeight: 700,
            color: isDark ? '#fff' : '#0f172a',
            margin: '0 0 14px', lineHeight: 1.2
          }}>
            Account Pending<br/>
            <span style={{ color: '#f59e0b', fontStyle: 'italic' }}>Approval</span>
          </h1>

          <p style={{
            color: isDark ? '#94a3b8' : '#475569',
            fontSize: 15, lineHeight: 1.8, margin: '0 0 32px'
          }}>
            Your registration has been received. An administrator needs to review and approve your account before you can access the library system.
          </p>

          {/* Status Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 36, textAlign: 'left' }}>
            {[
              { icon: '✅', label: 'Account Created', done: true },
              { icon: '⏳', label: 'Awaiting Admin Approval', done: false, active: true },
              { icon: '🔓', label: 'Access Granted', done: false },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', borderRadius: 14, background: step.active ? 'rgba(245,158,11,0.1)' : step.done ? 'rgba(16,185,129,0.08)' : 'transparent', border: step.active ? '1px solid rgba(245,158,11,0.3)' : '1px solid transparent', marginBottom: 8 }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{step.icon}</span>
                <span style={{ fontWeight: 600, fontSize: 14, color: step.active ? '#d97706' : step.done ? '#10b981' : isDark ? '#64748b' : '#94a3b8' }}>
                  {step.label}
                </span>
                {step.active && (
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: '#d97706', fontWeight: 700 }}>In Progress</span>
                )}
                {step.done && (
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: '#10b981', fontWeight: 700 }}>Done</span>
                )}
              </div>
            ))}
          </div>

          <div style={{ padding: '16px 20px', background: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(241,245,249,0.8)', borderRadius: 14, marginBottom: 32, fontSize: 13, color: isDark ? '#94a3b8' : '#475569', lineHeight: 1.7 }}>
            💡 Once approved, you can log in with the email and password you registered with. You do not need to register again.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={() => navigate('/login')}
              style={{ padding: '13px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 20px rgba(245,158,11,0.35)' }}
            >
              Try Signing In Again
            </button>
            <Link to="/" style={{ padding: '12px', borderRadius: 12, border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', color: isDark ? '#94a3b8' : '#475569', fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'block' }}>
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
