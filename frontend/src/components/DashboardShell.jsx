import React from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import DarkModeToggle from '../components/DarkModeToggle'

export default function DashboardShell({ role, navItems, activeTab, setTab, user, logout, children, tabLabel, searchQuery, setSearchQuery }) {
  const { isDark } = useTheme()

  const ROLE_META = {
    admin:  { color:'#f59e0b', gradient:'linear-gradient(135deg,#f59e0b,#d97706)', label:'Administrator', icon:'🔑', badge:'bg-amber' },
    staff:  { color:'#10b981', gradient:'linear-gradient(135deg,#10b981,#059669)', label:'Library Staff',  icon:'🗂️', badge:'bg-emerald' },
    member: { color:'#3b82f6', gradient:'linear-gradient(135deg,#3b82f6,#1d4ed8)', label:'Student Member', icon:'🎓', badge:'bg-blue' },
  }
  const meta = ROLE_META[role]

  const c = {
    bg:      isDark ? '#0a0e1a' : '#f1f5f9',
    navbar:  isDark ? '#0d1117' : '#0f172a',
    card:    isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)',
    border:  isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
    text:    isDark ? '#f1f5f9' : '#0f172a',
    muted:   isDark ? '#64748b' : '#64748b',
    topbar:  isDark ? 'rgba(13,17,23,0.8)' : 'rgba(255,255,255,0.8)',
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', fontFamily:"'Inter',sans-serif", background:c.bg, position:'relative', overflow:'hidden' }}>
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
        .dash-nav-scroll::-webkit-scrollbar { display: none; }
        .dash-nav-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Background blobs */}
      <div style={{ position:'fixed', top:'-15%', right:'-10%', width:500, height:500, background:`${meta.color}09`, borderRadius:'50%', filter:'blur(90px)', animation:'float 10s ease-in-out infinite', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', bottom:'-10%', left:'10%', width:400, height:400, background:`${meta.color}06`, borderRadius:'50%', filter:'blur(80px)', animation:'floatR 12s ease-in-out infinite', pointerEvents:'none', zIndex:0 }} />

      {/* Single Floating Header */}
      <div style={{ background: c.navbar, zIndex: 100, position: 'sticky', top: 0, padding: '0 24px', height: 70, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${c.border}`, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
             <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                <div style={{ width: 32, height: 32, background: meta.gradient, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{meta.icon}</div>
                <div>
                  <div style={{ color: c.text, fontSize: 16, fontWeight: 800, lineHeight: 1, fontFamily: "'Playfair Display', serif" }}>UniLibrary</div>
                  <div style={{ color: c.muted, fontSize: 10, textTransform: 'uppercase', marginTop: 2, letterSpacing: 1 }}>{role}</div>
                </div>
             </Link>
             
             <div style={{ height: 30, width: 1, background: c.border, margin: '0 10px' }} />

             <div className="dash-nav-scroll" style={{ display: 'flex', gap: 10 }}>
               {navItems ? navItems.map(item => {
                 const active = activeTab === item.key
                 const btnStyle = {
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12, border: 'none',
                    background: active ? `${meta.color}22` : 'transparent',
                    color: active ? meta.color : c.muted, textDecoration: 'none',
                    cursor: 'pointer', fontSize: 14, fontWeight: active ? 700 : 500, transition: 'all 0.2s'
                 };
                 
                 if (item.path) {
                   return (
                     <Link key={item.key} to={item.path} style={btnStyle} className="nav-item">
                       <span>{item.icon}</span>
                       <span>{item.label}</span>
                     </Link>
                   )
                 }

                 return (
                   <button key={item.key} onClick={() => setTab && setTab(item.key)} style={btnStyle} className="nav-item">
                     <span>{item.icon}</span>
                     <span>{item.label}</span>
                   </button>
                 )
               }) : null}
             </div>
          </div>

          <div style={{ flex: 1, maxWidth: 600, position: 'relative', margin: '0 40px' }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
            <input 
              type="text" 
              placeholder={`Search in ${tabLabel}...`} 
              value={searchQuery || ''}
              onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
              style={{ width: '100%', background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: '10px 16px 10px 48px', color: c.text, fontSize: 14, outline: 'none' }} 
            />
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <a href="mailto:support@unilibrary.edu" style={{ color: c.muted, textDecoration: 'none', fontSize: 13, fontWeight: 600, marginRight: 12 }}>Support</a>
            <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Log Out
            </button>
          </div>
      </div>

      {/* Main Content area */}
      <div style={{ flex:1, maxWidth:1400, width:'100%', margin:'0 auto', padding: '24px', display:'flex', flexDirection:'column', zIndex:5 }}>
        {/* Breadcrumb / Status Row */}
        <div style={{ marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:13, color:c.muted }}>{new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <span style={{ background:`${meta.color}15`, color:meta.color, padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:700, border:`1px solid ${meta.color}30` }}>{meta.label} Access</span>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="dash-content" style={{ flex:1 }}>
          {children}
        </div>
      </div>

      {/* Footer (Simplified for Dashboard) */}
      <footer style={{ padding:'24px', textAlign:'center', borderTop:`1px solid ${c.border}`, color:c.muted, fontSize:13 }}>
        © {new Date().getFullYear()} UniLibrary Management System • <Link to="/" style={{ color:meta.color, textDecoration:'none', fontWeight:600 }}>Home</Link>
      </footer>
      
      {/* Floating Dark Mode Toggle */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: c.card, borderRadius: '50%', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', padding: 4 }}>
        <DarkModeToggle />
      </div>
    </div>
  )
}
