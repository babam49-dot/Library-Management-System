import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const API = 'http://localhost:4000/api'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState(null)
  const [pendingStaff, setPendingStaff] = useState([])
  const [tab, setTab] = useState('overview') // overview, staff

  const fetchData = async () => {
    try {
      const s = await axios.get(`${API}/admin/dashboard`)
      setStats(s.data.data)
      const p = await axios.get(`${API}/admin/pending-staff`)
      setPendingStaff(p.data.data)
    } catch (err) { console.error(err) }
  }

  useEffect(() => { fetchData() }, [])

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this staff account?')) return
    await axios.patch(`${API}/admin/approve-staff/${id}`)
    fetchData()
  }

  const handleReject = async (id) => {
    if (!window.confirm('Reject this staff account?')) return
    await axios.patch(`${API}/admin/reject-staff/${id}`)
    fetchData()
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Georgia', serif", background: '#faf6f0' }}>
      {/* Sidebar */}
      <div style={{ width: 250, background: '#1a0f0a', color: '#e8d5b0', padding: 24, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
          <div style={{ width: 32, height: 32, background: '#8b5e3c', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff' }}>A</div>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Admin Portal</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          <button onClick={() => setTab('overview')} style={navBtnStyle(tab === 'overview')}>Dashboard Overview</button>
          <button onClick={() => setTab('staff')} style={navBtnStyle(tab === 'staff')}>
            Staff Management
            {pendingStaff.length > 0 && <span style={{ background: '#c4813a', color: '#fff', padding: '2px 8px', borderRadius: 12, fontSize: 11, marginLeft: 8 }}>{pendingStaff.length}</span>}
          </button>
        </nav>

        <div style={{ borderTop: '1px solid #3d2010', paddingTop: 20, marginTop: 'auto' }}>
          <div style={{ fontSize: 14, marginBottom: 12 }}>Logged in as:<br/><strong style={{ color: '#fff' }}>{user.FullName}</strong></div>
          <button onClick={logout} style={{ width: '100%', background: 'transparent', border: '1px solid #c4813a', color: '#c4813a', padding: 10, borderRadius: 8, cursor: 'pointer' }}>Sign Out</button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: 40, overflowY: 'auto' }}>
        <h2 style={{ fontSize: 28, color: '#1a0f0a', marginBottom: 24, fontWeight: 700 }}>
          {tab === 'overview' ? 'System Overview' : 'Staff Approvals'}
        </h2>

        {tab === 'overview' && stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            <StatCard title="Total Books" value={stats.totalBooks} />
            <StatCard title="Active Members" value={stats.totalMembers} />
            <StatCard title="Active Staff" value={stats.totalStaff} />
            <StatCard title="Current Borrows" value={stats.activeBorrowings} />
            <StatCard title="Pending Staff" value={stats.pendingStaff} highlight={stats.pendingStaff > 0} />
          </div>
        )}

        {tab === 'staff' && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e5e5', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e5e5', background: '#fdf4e7', fontWeight: 600, color: '#8b5e3c' }}>
              Pending Registrations
            </div>
            {pendingStaff.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#8b6a4a' }}>No pending staff registrations.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#faf6f0', color: '#8b6a4a' }}>
                    <th style={{ padding: 16 }}>Name</th>
                    <th style={{ padding: 16 }}>Email</th>
                    <th style={{ padding: 16 }}>Job Title</th>
                    <th style={{ padding: 16, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingStaff.map(s => (
                    <tr key={s.UserID} style={{ borderTop: '1px solid #e5e5e5' }}>
                      <td style={{ padding: 16, fontWeight: 500 }}>{s.FullName}</td>
                      <td style={{ padding: 16 }}>{s.Email}</td>
                      <td style={{ padding: 16 }}>{s.JobTitle || 'Staff'}</td>
                      <td style={{ padding: 16, textAlign: 'right' }}>
                        <button onClick={() => handleReject(s.UserID)} style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', marginRight: 8 }}>Reject</button>
                        <button onClick={() => handleApprove(s.UserID)} style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #6ee7b7', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>Approve</button>
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
  )
}

const navBtnStyle = (active) => ({
  background: active ? '#3d2010' : 'transparent',
  color: active ? '#fff' : '#a08060',
  border: 'none', padding: '12px 16px', borderRadius: 8, cursor: 'pointer', textAlign: 'left', fontSize: 15, transition: '0.2s',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
})

const StatCard = ({ title, value, highlight }) => (
  <div style={{ background: '#fff', border: highlight ? '2px solid #c4813a' : '1px solid #e5e5e5', borderRadius: 12, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
    <div style={{ fontSize: 13, color: highlight ? '#c4813a' : '#8b6a4a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{title}</div>
    <div style={{ fontSize: 36, fontWeight: 700, color: '#1a0f0a' }}>{value}</div>
  </div>
)
