import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import DarkModeToggle from '../components/DarkModeToggle'

/**
 * DashboardShell — shared layout for Admin, Staff, and Member dashboards.
 * - Admin: horizontal top navbar (unchanged)
 * - Staff / Member: vertical left sidebar + top header bar
 */
export default function DashboardShell({
  role, navItems, activeTab, setTab, user, logout, children,
  tabLabel, searchQuery, setSearchQuery
}) {
  const { isDark } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  const ROLE_META = {
    admin:  { color: '#f59e0b', gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', label: 'Administrator',   icon: '🔑' },
    staff:  { color: '#10b981', gradient: 'linear-gradient(135deg,#10b981,#059669)', label: 'Library Staff',   icon: '🗂️' },
    member: { color: '#3b82f6', gradient: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', label: 'Student Member', icon: '🎓' },
  }
  const meta = ROLE_META[role] || ROLE_META.member

  const c = {
    bg:      isDark ? '#0a0e1a' : '#f1f5f9',
    navbar:  isDark ? '#0d1117' : '#0f172a',
    sidebar: isDark ? '#0d1117' : '#1e293b',
    card:    isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)',
    border:  isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
    text:    isDark ? '#f1f5f9' : '#0f172a',
    muted:   isDark ? '#64748b' : '#94a3b8',
    topbar:  isDark ? 'rgba(13,17,23,0.95)' : 'rgba(15,23,42,0.97)',
  }

  const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
    @keyframes float  { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-18px)} }
    @keyframes floatR { 0%,100%{transform:translateY(0)}  50%{transform:translateY(18px)}  }
    @keyframes fadeIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeInScale { from{opacity:0;transform:scale(0.94)} to{opacity:1;transform:scale(1)} }
    .dash-content { animation: fadeIn 0.35s ease forwards; }
    .nav-item:hover { background: rgba(255,255,255,0.08) !important; }
    .interactive-card { transition: transform 0.25s ease, box-shadow 0.25s ease; cursor: pointer; }
    .interactive-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.18) !important; }
    .interactive-btn { transition: all 0.18s ease; cursor: pointer; }
    .interactive-btn:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
    .interactive-btn:active:not(:disabled) { transform: translateY(0); }
    .btn-pulse { animation: none; }
    .btn-pulse:hover { box-shadow: 0 0 20px rgba(16,185,129,0.35); }
    .table-row:hover td { background: ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'} !important; }
    .sidebar-item { transition: all 0.2s ease; border-radius: 10px; }
    .sidebar-item:hover { background: rgba(255,255,255,0.08) !important; }
    .dash-nav-scroll::-webkit-scrollbar { display: none; }
    .dash-nav-scroll { -ms-overflow-style: none; scrollbar-width: none; }
  `

  // ── Admin keeps horizontal top-nav ──────────────────────────────────────────
  if (role === 'admin') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: "'Inter',sans-serif", background: c.bg }}>
        <style>{globalStyles}</style>

        {/* Blobs */}
        <div style={{ position: 'fixed', top: '-15%', right: '-10%', width: 500, height: 500, background: `${meta.color}09`, borderRadius: '50%', filter: 'blur(90px)', animation: 'float 10s ease-in-out infinite', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'fixed', bottom: '-10%', left: '10%', width: 400, height: 400, background: `${meta.color}06`, borderRadius: '50%', filter: 'blur(80px)', animation: 'floatR 12s ease-in-out infinite', pointerEvents: 'none', zIndex: 0 }} />

        {/* Top Navbar */}
        <div style={{ background: c.navbar, zIndex: 100, position: 'sticky', top: 0, padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${c.border}`, boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{ width: 34, height: 34, background: meta.gradient, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>{meta.icon}</div>
              <div>
                <div style={{ color: '#fff', fontSize: 16, fontWeight: 800, lineHeight: 1, fontFamily: "'Playfair Display', serif" }}>UniLibrary</div>
                <div style={{ color: c.muted, fontSize: 10, textTransform: 'uppercase', marginTop: 1, letterSpacing: 1 }}>Admin Portal</div>
              </div>
            </Link>
            <div style={{ height: 28, width: 1, background: c.border, margin: '0 8px' }} />
            <div className="dash-nav-scroll" style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
              {(navItems || []).map(item => {
                const active = activeTab === item.key
                return (
                  <button key={item.key} onClick={() => {
                if (item.path && item.path !== location.pathname) {
                  navigate(item.path, { state: { tab: item.key } })
                } else if (setTab) {
                  setTab(item.key)
                }
              }} className="nav-item"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 10, border: 'none', background: active ? `${meta.color}22` : 'transparent', color: active ? meta.color : c.muted, cursor: 'pointer', fontSize: 13, fontWeight: active ? 700 : 500, whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                    <span>{item.icon}</span><span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4, fontSize: 13 }}>🔍</span>
              <input type="text" placeholder={`Search ${tabLabel}…`} value={searchQuery || ''} onChange={e => setSearchQuery && setSearchQuery(e.target.value)}
                style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, padding: '8px 14px 8px 34px', color: c.text, fontSize: 13, outline: 'none', width: 220 }} />
            </div>
            <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 9, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Logout
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, maxWidth: 1500, width: '100%', margin: '0 auto', padding: '24px', zIndex: 5 }}>
          <div className="dash-content" style={{ flex: 1 }}>{children}</div>
        </div>

        <footer style={{ padding: '20px 24px', textAlign: 'center', borderTop: `1px solid ${c.border}`, color: c.muted, fontSize: 12 }}>
          © {new Date().getFullYear()} UniLibrary Management System • <Link to="/" style={{ color: meta.color, textDecoration: 'none', fontWeight: 600 }}>Home</Link>
        </footer>
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}><DarkModeToggle /></div>
      </div>
    )
  }

  // ── Staff & Member: vertical sidebar layout ──────────────────────────────────
  const sidebarW = sidebarOpen ? 240 : 68

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter',sans-serif", background: c.bg, position: 'relative' }}>
      <style>{globalStyles}</style>

      {/* Blobs */}
      <div style={{ position: 'fixed', top: '-10%', right: '-8%', width: 420, height: 420, background: `${meta.color}08`, borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-8%', left: '5%', width: 350, height: 350, background: `${meta.color}05`, borderRadius: '50%', filter: 'blur(70px)', pointerEvents: 'none', zIndex: 0 }} />

      {/* ── Vertical Sidebar ── */}
      <aside style={{
        width: sidebarW, minHeight: '100vh', background: c.sidebar,
        display: 'flex', flexDirection: 'column',
        borderRight: `1px solid rgba(255,255,255,0.06)`,
        boxShadow: '4px 0 24px rgba(0,0,0,0.18)',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 200,
        transition: 'width 0.25s ease', overflow: 'hidden'
      }}>
        {/* Brand */}
        <div style={{ padding: '20px 16px 16px', borderBottom: `1px solid rgba(255,255,255,0.06)`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flex: 1, minWidth: 0 }}>
            <div style={{ width: 36, height: 36, background: meta.gradient, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, boxShadow: `0 4px 12px ${meta.color}40` }}>{meta.icon}</div>
            {sidebarOpen && (
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: 15, fontWeight: 800, lineHeight: 1, fontFamily: "'Playfair Display', serif", whiteSpace: 'nowrap' }}>UniLibrary</div>
                <div style={{ color: c.muted, fontSize: 10, textTransform: 'uppercase', marginTop: 2, letterSpacing: 1, whiteSpace: 'nowrap' }}>{meta.label}</div>
              </div>
            )}
          </Link>
          <button onClick={() => setSidebarOpen(o => !o)}
            style={{ background: 'transparent', border: 'none', color: c.muted, cursor: 'pointer', fontSize: 16, padding: 4, lineHeight: 1, flexShrink: 0 }}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {(navItems || []).map(item => {
            const active = activeTab === item.key
            return (
              <button key={item.key} onClick={() => setTab && setTab(item.key)} className="sidebar-item"
                title={!sidebarOpen ? item.label : ''}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                  borderRadius: 10, border: 'none', width: '100%', textAlign: 'left',
                  background: active ? `${meta.color}20` : 'transparent',
                  color: active ? meta.color : '#94a3b8',
                  cursor: 'pointer', fontSize: 14, fontWeight: active ? 700 : 500,
                  whiteSpace: 'nowrap', overflow: 'hidden',
                  borderLeft: active ? `3px solid ${meta.color}` : '3px solid transparent',
                  transition: 'all 0.2s'
                }}>
                <span style={{ fontSize: 17, flexShrink: 0 }}>{item.icon}</span>
                {sidebarOpen && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
                {sidebarOpen && item.badge > 0 && (
                  <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', borderRadius: 999, fontSize: 11, fontWeight: 800, padding: '1px 7px', flexShrink: 0 }}>{item.badge}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* User info + logout */}
        <div style={{ padding: '12px 10px 16px', borderTop: `1px solid rgba(255,255,255,0.06)`, flexShrink: 0 }}>
          {sidebarOpen && (
            <div style={{ marginBottom: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)' }}>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.FullName || 'User'}</div>
              <div style={{ color: c.muted, fontSize: 11, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.Email || ''}</div>
            </div>
          )}
          <button onClick={logout}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 10, border: 'none', background: 'rgba(239,68,68,0.12)', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            {sidebarOpen && 'Log Out'}
          </button>
        </div>
      </aside>

      {/* ── Main Panel ── */}
      <div style={{ marginLeft: sidebarW, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', transition: 'margin-left 0.25s ease', zIndex: 5 }}>

        {/* Top bar */}
        <div style={{ position: 'sticky', top: 0, background: c.topbar, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${c.border}`, zIndex: 100, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ color: '#fff', fontSize: 17, fontWeight: 800 }}>{tabLabel || 'Dashboard'}</div>
            <div style={{ color: c.muted, fontSize: 12 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', opacity: 0.4, fontSize: 13 }}>🔍</span>
              <input type="text" placeholder={`Search ${tabLabel || ''}…`} value={searchQuery || ''} onChange={e => setSearchQuery && setSearchQuery(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${c.border}`, borderRadius: 10, padding: '8px 14px 8px 32px', color: '#fff', fontSize: 13, outline: 'none', width: 240 }} />
            </div>
            <span style={{ background: `${meta.color}20`, color: meta.color, padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, border: `1px solid ${meta.color}30` }}>{meta.label}</span>
            <DarkModeToggle />
          </div>
        </div>

        {/* Page content */}
        <div className="dash-content" style={{ flex: 1, padding: 24 }}>
          {children}
        </div>

        <footer style={{ padding: '16px 24px', textAlign: 'center', borderTop: `1px solid ${c.border}`, color: c.muted, fontSize: 12 }}>
          © {new Date().getFullYear()} UniLibrary Management System
        </footer>
      </div>
    </div>
  )
}
