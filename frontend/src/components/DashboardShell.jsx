import React from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import DarkModeToggle from '../components/DarkModeToggle'

export default function DashboardShell({ role, navItems, activeTab, setTab, user, logout, children, tabLabel }) {
  const { isDark } = useTheme()

  const ROLE_META = {
    admin:  { color:'#f59e0b', gradient:'linear-gradient(135deg,#f59e0b,#d97706)', label:'Administrator', icon:'🔑', badge:'bg-amber' },
    staff:  { color:'#10b981', gradient:'linear-gradient(135deg,#10b981,#059669)', label:'Library Staff',  icon:'🗂️', badge:'bg-emerald' },
    member: { color:'#3b82f6', gradient:'linear-gradient(135deg,#3b82f6,#1d4ed8)', label:'Student Member', icon:'🎓', badge:'bg-blue' },
  }
  const meta = ROLE_META[role]

  const c = {
    bg:      isDark ? '#0a0e1a' : '#f1f5f9',
    sidebar: isDark ? '#0d1117' : '#0f172a',
    card:    isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)',
    border:  isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
    text:    isDark ? '#f1f5f9' : '#0f172a',
    muted:   isDark ? '#64748b' : '#64748b',
    topbar:  isDark ? 'rgba(13,17,23,0.8)' : 'rgba(255,255,255,0.8)',
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:"'Inter',sans-serif", background:c.bg, position:'relative', overflow:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-18px)}}
        @keyframes floatR{0%,100%{transform:translateY(0)}50%{transform:translateY(18px)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .dash-content{animation:fadeIn 0.4s ease forwards}
        .nav-item:hover{background:rgba(255,255,255,0.06)!important;color:#fff!important}
        .stat-card{transition:all 0.3s cubic-bezier(0.175,0.885,0.32,1.275);}
        .stat-card:hover{transform:translateY(-6px);box-shadow:0 20px 40px rgba(0,0,0,0.25)!important;}
        .table-row:hover td{background:${isDark?'rgba(255,255,255,0.03)':'rgba(0,0,0,0.02)'}!important}
        .action-btn{transition:all 0.2s!important}
        .action-btn:hover{transform:translateY(-1px)!important;filter:brightness(1.1)!important}
      `}</style>

      {/* Background blobs */}
      <div style={{ position:'fixed', top:'-15%', right:'-10%', width:500, height:500, background:`${meta.color}09`, borderRadius:'50%', filter:'blur(90px)', animation:'float 10s ease-in-out infinite', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', bottom:'-10%', left:'10%', width:400, height:400, background:`${meta.color}06`, borderRadius:'50%', filter:'blur(80px)', animation:'floatR 12s ease-in-out infinite', pointerEvents:'none', zIndex:0 }} />

      {/* Sidebar */}
      <div style={{ width:248, background:c.sidebar, display:'flex', flexDirection:'column', flexShrink:0, position:'relative', zIndex:10, borderRight:`1px solid ${c.border}` }}>
        {/* Logo */}
        <div style={{ padding:'24px 20px 20px', borderBottom:`1px solid rgba(255,255,255,0.06)` }}>
          <Link to="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
            <div style={{ width:38, height:38, background:'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>📚</div>
            <div>
              <div style={{ fontWeight:800, fontSize:15, fontFamily:"'Playfair Display',serif", color:'#fff', lineHeight:1 }}>UniLibrary</div>
              <div style={{ fontSize:10, color:'#475569', marginTop:2, textTransform:'uppercase', letterSpacing:1 }}>{meta.label}</div>
            </div>
          </Link>
        </div>

        {/* Role accent bar */}
        <div style={{ height:2, background:meta.gradient, margin:'0 20px' }} />

        {/* Nav */}
        <nav style={{ flex:1, padding:'16px 12px', display:'flex', flexDirection:'column', gap:2, overflowY:'auto' }}>
          {navItems.map(item => {
            const active = activeTab === item.key
            return (
              <button key={item.key} className="nav-item" onClick={() => setTab(item.key)} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, border:'none', background: active ? `${meta.color}20` : 'transparent', color: active ? meta.color : '#64748b', cursor:'pointer', textAlign:'left', fontSize:14, fontWeight: active ? 700 : 400, transition:'all 0.15s', width:'100%', position:'relative' }}>
                {active && <div style={{ position:'absolute', left:0, top:'20%', height:'60%', width:3, borderRadius:4, background:meta.color }} />}
                <span style={{ fontSize:16 }}>{item.icon}</span>
                <span style={{ flex:1 }}>{item.label}</span>
                {item.badge > 0 && <span style={{ background:'#ef4444', color:'#fff', padding:'1px 7px', borderRadius:20, fontSize:10, fontWeight:800 }}>{item.badge}</span>}
              </button>
            )
          })}
        </nav>

        {/* User footer */}
        <div style={{ padding:'16px 20px', borderTop:`1px solid rgba(255,255,255,0.06)` }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:meta.gradient, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:14, flexShrink:0 }}>{user?.FullName?.charAt(0) || '?'}</div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.FullName}</div>
              <div style={{ fontSize:11, color:'#475569' }}>{meta.label}</div>
            </div>
          </div>
          <button onClick={logout} style={{ width:'100%', padding:'8px', borderRadius:8, border:'1px solid rgba(255,255,255,0.08)', background:'transparent', color:'#475569', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'all 0.2s' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', position:'relative', zIndex:5 }}>
        {/* Topbar */}
        <div style={{ background:c.topbar, backdropFilter:'blur(16px)', borderBottom:`1px solid ${c.border}`, padding:'14px 28px', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div>
            <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:c.text, fontFamily:"'Playfair Display',serif" }}>{tabLabel}</h2>
            <div style={{ fontSize:12, color:c.muted, marginTop:2 }}>{new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ background:`${meta.color}18`, color:meta.color, padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700, border:`1px solid ${meta.color}33` }}>{meta.label}</span>
            <DarkModeToggle />
          </div>
        </div>

        {/* Content */}
        <div className="dash-content" style={{ flex:1, overflowY:'auto', padding:28 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
