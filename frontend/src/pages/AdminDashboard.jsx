import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import DarkModeToggle from '../components/DarkModeToggle'
import axios from 'axios'

const API = 'http://localhost:4000/api'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const { isDark } = useTheme()
  const [stats, setStats] = useState(null)
  const [pendingStaff, setPendingStaff] = useState([])
  const [tab, setTab] = useState('overview')

  const bg = isDark ? '#0a0e1a' : '#f8f9fa'
  const sidebar = isDark ? '#111827' : '#1a0f0a'
  const cardBg = isDark ? '#1e2334' : '#fff'
  const textPrimary = isDark ? '#f1f5f9' : '#1a0f0a'
  const textMuted = isDark ? '#94a3b8' : '#8b6a4a'
  const border = isDark ? '#2d3748' : '#e5e5e5'
  const tableHead = isDark ? '#1a2236' : '#faf6f0'

  const getHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('lms_token')}` } })

  const fetchData = async () => {
    try {
      const s = await axios.get(`${API}/admin/dashboard`, getHeaders())
      setStats(s.data.data)
      const p = await axios.get(`${API}/admin/pending-staff`, getHeaders())
      setPendingStaff(p.data.data)
    } catch (err) { console.error(err) }
  }

  useEffect(() => { fetchData() }, [])

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this staff account?')) return
    await axios.patch(`${API}/admin/approve-staff/${id}`, {}, getHeaders())
    fetchData()
  }

  const handleReject = async (id) => {
    if (!window.confirm('Reject this staff account?')) return
    await axios.patch(`${API}/admin/reject-staff/${id}`, {}, getHeaders())
    fetchData()
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', 'Georgia', sans-serif", background: bg }}>
      {/* Sidebar */}
      <div style={{ width: 260, background: sidebar, color: '#e8d5b0', padding: 24, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: 18 }}>A</div>
          <span style={{ fontWeight: 700, fontSize: 17, color: '#fff' }}>Admin Portal</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          {[
            { key: 'overview', label: 'Dashboard Overview', icon: '📊' },
            { key: 'staff', label: 'Staff Approvals', icon: '👥', badge: pendingStaff.length },
          ].map(item => (
            <button key={item.key} onClick={() => setTab(item.key)} style={navBtnStyle(tab === item.key)}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </span>
              {item.badge > 0 && <span style={{ background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: 12, fontSize: 11 }}>{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20, marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>
              {user?.FullName?.charAt(0) || 'A'}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{user?.FullName}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Administrator</div>
            </div>
          </div>
          <button onClick={logout} style={{ width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#94a3b8', padding: '10px', borderRadius: 8, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ background: cardBg, borderBottom: `1px solid ${border}`, padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 22, color: textPrimary, fontWeight: 700, margin: 0 }}>
              {tab === 'overview' ? 'System Overview' : 'Staff Approvals'}
            </h2>
            <div style={{ fontSize: 13, color: textMuted, marginTop: 4 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>Admin</span>
            <DarkModeToggle />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
          {tab === 'overview' && stats && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, marginBottom: 32 }}>
                <StatCard title="Total Books" value={stats.totalBooks} icon="📚" bg={cardBg} textPrimary={textPrimary} textMuted={textMuted} border={border} />
                <StatCard title="Active Members" value={stats.totalMembers} icon="👥" bg={cardBg} textPrimary={textPrimary} textMuted={textMuted} border={border} />
                <StatCard title="Active Staff" value={stats.totalStaff} icon="🗂️" bg={cardBg} textPrimary={textPrimary} textMuted={textMuted} border={border} />
                <StatCard title="Active Borrowings" value={stats.activeBorrowings} icon="📖" bg={cardBg} textPrimary={textPrimary} textMuted={textMuted} border={border} highlight />
                <StatCard title="Pending Staff" value={stats.pendingStaff} icon="⏳" bg={cardBg} textPrimary={textPrimary} textMuted={textMuted} border={border} highlight={stats.pendingStaff > 0} />
              </div>
            </div>
          )}

          {tab === 'staff' && (
            <div style={{ background: cardBg, borderRadius: 16, border: `1px solid ${border}`, overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: `1px solid ${border}`, fontWeight: 600, color: textPrimary, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Pending Staff Registrations</span>
                <span style={{ fontSize: 13, color: textMuted }}>{pendingStaff.length} pending</span>
              </div>
              {pendingStaff.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center', color: textMuted }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                  No pending staff registrations.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: tableHead, color: textMuted }}>
                      <th style={{ padding: 16 }}>Name</th>
                      <th style={{ padding: 16 }}>Email</th>
                      <th style={{ padding: 16 }}>Job Title</th>
                      <th style={{ padding: 16, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingStaff.map(s => (
                      <tr key={s.UserID} style={{ borderTop: `1px solid ${border}` }}>
                        <td style={{ padding: 16, fontWeight: 500, color: textPrimary }}>{s.FullName}</td>
                        <td style={{ padding: 16, color: textMuted }}>{s.Email}</td>
                        <td style={{ padding: 16, color: textMuted }}>{s.JobTitle || 'Staff'}</td>
                        <td style={{ padding: 16, textAlign: 'right' }}>
                          <button onClick={() => handleReject(s.UserID)} style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', marginRight: 8, fontSize: 13 }}>Reject</button>
                          <button onClick={() => handleApprove(s.UserID)} style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #6ee7b7', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Approve</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const navBtnStyle = (active) => ({
  background: active ? 'rgba(245,158,11,0.15)' : 'transparent',
  color: active ? '#fbbf24' : '#94a3b8',
  border: active ? '1px solid rgba(245,158,11,0.3)' : '1px solid transparent',
  padding: '11px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', fontSize: 14, transition: 'all 0.2s',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%'
})

const StatCard = ({ title, value, icon, bg, textPrimary, textMuted, border, highlight }) => (
  <div style={{ background: bg, border: highlight ? '2px solid #f59e0b' : `1px solid ${border}`, borderRadius: 16, padding: 24, boxShadow: highlight ? '0 0 20px rgba(245,158,11,0.1)' : '0 2px 8px rgba(0,0,0,0.05)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: highlight ? '#f59e0b' : textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</div>
      <span style={{ fontSize: 22 }}>{icon}</span>
    </div>
    <div style={{ fontSize: 38, fontWeight: 800, color: textPrimary }}>{value ?? '—'}</div>
  </div>
)
