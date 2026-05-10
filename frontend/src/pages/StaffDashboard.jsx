import React, { useEffect, useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const API = 'http://localhost:4000/api'

export default function StaffDashboard() {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState(null)
  const [pendingMembers, setPendingMembers] = useState([])
  const [tab, setTab] = useState('overview')
  
  // Book Form State
  const [bookForm, setBookForm] = useState({ title: '', isbn: '', year: '', description: '' })
  const [coverFile, setCoverFile] = useState(null)
  const [bookLoading, setBookLoading] = useState(false)
  const [bookMsg, setBookMsg] = useState('')
  const fileInputRef = useRef(null)

  const fetchData = async () => {
    try {
      const s = await axios.get(`${API}/staff/dashboard`)
      setStats(s.data.data)
      const p = await axios.get(`${API}/staff/pending-members`)
      setPendingMembers(p.data.data)
    } catch (err) { console.error(err) }
  }

  useEffect(() => { fetchData() }, [])

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this member?')) return
    await axios.patch(`${API}/staff/approve-member/${id}`)
    fetchData()
  }

  const handleReject = async (id) => {
    if (!window.confirm('Reject this member?')) return
    await axios.patch(`${API}/staff/reject-member/${id}`)
    fetchData()
  }

  const handleBookChange = (e) => setBookForm({ ...bookForm, [e.target.name]: e.target.value })
  
  const submitBook = async (e) => {
    e.preventDefault()
    setBookLoading(true)
    setBookMsg('')
    try {
      const fd = new FormData()
      fd.append('title', bookForm.title)
      fd.append('isbn', bookForm.isbn)
      fd.append('year', bookForm.year)
      fd.append('description', bookForm.description)
      if (coverFile) fd.append('coverImage', coverFile)

      await axios.post(`${API}/books`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setBookMsg('Book added to catalog successfully!')
      setBookForm({ title: '', isbn: '', year: '', description: '' })
      setCoverFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setBookMsg('Error: ' + (err.response?.data?.message || err.message))
    } finally {
      setBookLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Georgia', serif", background: '#faf6f0' }}>
      {/* Sidebar */}
      <div style={{ width: 250, background: '#1a0f0a', color: '#e8d5b0', padding: 24, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
          <div style={{ width: 32, height: 32, background: '#c4813a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff' }}>S</div>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Staff Portal</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          <button onClick={() => setTab('overview')} style={navBtnStyle(tab === 'overview')}>Dashboard Overview</button>
          <button onClick={() => setTab('members')} style={navBtnStyle(tab === 'members')}>
            Member Approvals
            {pendingMembers.length > 0 && <span style={{ background: '#8b5e3c', color: '#fff', padding: '2px 8px', borderRadius: 12, fontSize: 11, marginLeft: 8 }}>{pendingMembers.length}</span>}
          </button>
          <button onClick={() => setTab('catalog')} style={navBtnStyle(tab === 'catalog')}>Catalog Management</button>
        </nav>

        <div style={{ borderTop: '1px solid #3d2010', paddingTop: 20, marginTop: 'auto' }}>
          <div style={{ fontSize: 14, marginBottom: 12 }}>Logged in as:<br/><strong style={{ color: '#fff' }}>{user.FullName}</strong></div>
          <button onClick={logout} style={{ width: '100%', background: 'transparent', border: '1px solid #c4813a', color: '#c4813a', padding: 10, borderRadius: 8, cursor: 'pointer' }}>Sign Out</button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: 40, overflowY: 'auto' }}>
        <h2 style={{ fontSize: 28, color: '#1a0f0a', marginBottom: 24, fontWeight: 700 }}>
          {tab === 'overview' ? 'Circulation Overview' : tab === 'members' ? 'Member Approvals' : 'Add New Book'}
        </h2>

        {tab === 'overview' && stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            <StatCard title="Active Borrows" value={stats.activeBorrowings} />
            <StatCard title="Returns Today" value={stats.returnsToday} />
            <StatCard title="Overdue Books" value={stats.overdueCount} highlight={stats.overdueCount > 0} />
            <StatCard title="Pending Members" value={stats.pendingMembers} highlight={stats.pendingMembers > 0} />
          </div>
        )}

        {tab === 'members' && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e5e5', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e5e5', background: '#fdf4e7', fontWeight: 600, color: '#8b5e3c' }}>
              Pending Member Registrations
            </div>
            {pendingMembers.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#8b6a4a' }}>No pending member registrations.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#faf6f0', color: '#8b6a4a' }}>
                    <th style={{ padding: 16 }}>Name</th>
                    <th style={{ padding: 16 }}>Email</th>
                    <th style={{ padding: 16 }}>University ID</th>
                    <th style={{ padding: 16, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingMembers.map(m => (
                    <tr key={m.UserID} style={{ borderTop: '1px solid #e5e5e5' }}>
                      <td style={{ padding: 16, fontWeight: 500 }}>{m.FullName}</td>
                      <td style={{ padding: 16 }}>{m.Email}</td>
                      <td style={{ padding: 16 }}>{m.StudentID}</td>
                      <td style={{ padding: 16, textAlign: 'right' }}>
                        <button onClick={() => handleReject(m.UserID)} style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', marginRight: 8 }}>Reject</button>
                        <button onClick={() => handleApprove(m.UserID)} style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #6ee7b7', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>Approve</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'catalog' && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e5e5', padding: 30, maxWidth: 600 }}>
            <p style={{ color: '#8b6a4a', marginBottom: 20 }}>Upload a new book to the library catalog with a cover image.</p>
            {bookMsg && <div style={{ padding: 12, marginBottom: 20, background: bookMsg.startsWith('Error') ? '#fef2f2' : '#ecfdf5', color: bookMsg.startsWith('Error') ? '#b91c1c' : '#047857', borderRadius: 8 }}>{bookMsg}</div>}
            
            <form onSubmit={submitBook} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3d2010', marginBottom: 6 }}>Book Title *</label>
                <input required type="text" name="title" value={bookForm.title} onChange={handleBookChange} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3d2010', marginBottom: 6 }}>ISBN</label>
                  <input type="text" name="isbn" value={bookForm.isbn} onChange={handleBookChange} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3d2010', marginBottom: 6 }}>Publication Year</label>
                  <input type="number" name="year" value={bookForm.year} onChange={handleBookChange} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3d2010', marginBottom: 6 }}>Cover Image (Upload)</label>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={e => setCoverFile(e.target.files[0])} style={{ ...inputStyle, padding: '8px 12px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3d2010', marginBottom: 6 }}>Description</label>
                <textarea name="description" value={bookForm.description} onChange={handleBookChange} style={{ ...inputStyle, minHeight: 100, fontFamily: 'inherit' }}></textarea>
              </div>
              <button type="submit" disabled={bookLoading} style={{ background: '#c4813a', color: '#fff', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 700, cursor: bookLoading ? 'not-allowed' : 'pointer', marginTop: 10 }}>
                {bookLoading ? 'Uploading...' : 'Save Book to Catalog'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e5e5', fontSize: 14, outline: 'none', boxSizing: 'border-box' }

const navBtnStyle = (active) => ({
  background: active ? '#3d2010' : 'transparent',
  color: active ? '#fff' : '#a08060',
  border: 'none', padding: '12px 16px', borderRadius: 8, cursor: 'pointer', textAlign: 'left', fontSize: 15, transition: '0.2s',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
})

const StatCard = ({ title, value, highlight }) => (
  <div style={{ background: '#fff', border: highlight ? '2px solid #e07b39' : '1px solid #e5e5e5', borderRadius: 12, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
    <div style={{ fontSize: 13, color: highlight ? '#e07b39' : '#8b6a4a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{title}</div>
    <div style={{ fontSize: 36, fontWeight: 700, color: '#1a0f0a' }}>{value}</div>
  </div>
)
