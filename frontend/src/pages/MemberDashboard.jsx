import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import DashboardShell from '../components/DashboardShell'
import axios from 'axios'
import jsPDF from 'jspdf'

const API = 'http://localhost:4000/api'

export default function MemberDashboard() {
  const { user, logout } = useAuth()
  const { isDark } = useTheme()
  const [stats, setStats] = useState(null)
  const [books, setBooks] = useState([])
  const [borrows, setBorrows] = useState([])
  const [fines, setFines] = useState([])
  const [tab, setTab] = useState('catalog')

  const getHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('lms_token')}` } })

  const bg = isDark ? '#0a0e1a' : '#f8f9fa'
  const sidebar = isDark ? '#111827' : '#1a0f0a'
  const cardBg = isDark ? '#1e2334' : '#fff'
  const textPrimary = isDark ? '#f1f5f9' : '#1a0f0a'
  const textMuted = isDark ? '#94a3b8' : '#8b6a4a'
  const border = isDark ? '#2d3748' : '#e5e5e5'
  const tableHead = isDark ? '#1a2236' : '#faf6f0'

  useEffect(() => {
    fetchDashboard()
    fetchBooks()
    fetchBorrows()
    fetchFines()
  }, [])

  const fetchDashboard = async () => {
    try {
      if (!user?.MemberID) return;
      const s = await axios.get(`${API}/members/${user.MemberID}`, getHeaders())
      const data = s.data.data;
      setStats({
        activeBorrowsCount: data.CurrentlyBorrowed,
        reservationsCount: data.reservationsCount || 0, // Fallback for now
        unpaidFinesTotal: data.UnpaidFineTotal,
        activeBorrows: [] // This will be fetched by fetchBorrows
      })
    } catch (err) { console.error(err) }
  }

  const fetchBooks = async () => {
    try {
      const b = await axios.get(`${API}/member/books`, getHeaders())
      setBooks(b.data.data)
    } catch (err) { console.error(err) }
  }

  const fetchBorrows = async () => {
    try {
      const b = await axios.get(`${API}/member/my-borrowings`, getHeaders())
      setBorrows(b.data.data)
    } catch (err) { console.error(err) }
  }

  const fetchFines = async () => {
    try {
      const f = await axios.get(`${API}/member/my-fines`, getHeaders())
      setFines(f.data.data)
    } catch (err) { console.error(err) }
  }

  const handleReserve = async (bookId) => {
    try {
      await axios.post(`${API}/member/reservations`, { bookId }, getHeaders())
      alert('Reservation created!')
      fetchDashboard()
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error')
    }
  }

  const generatePDF = (borrowRecord) => {
    const doc = new jsPDF()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.text('Library Borrowing Receipt', 20, 30)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(14)
    doc.text(`Book Title: ${borrowRecord.Title}`, 20, 50)
    doc.text(`Borrowed On: ${new Date(borrowRecord.BorrowDate).toLocaleDateString()}`, 20, 60)
    doc.text(`Due Date: ${new Date(borrowRecord.DueDate).toLocaleDateString()}`, 20, 70)
    doc.text(`Status: ${borrowRecord.Status.toUpperCase()}`, 20, 80)
    
    doc.setFontSize(12)
    doc.setTextColor(100)
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 110)
    
    doc.save(`Receipt_${borrowRecord.BorrowID}.pdf`)
  }

  const TABS = [
    { key: 'overview', label: 'My Dashboard', icon: '🏠' },
    { key: 'catalog', label: 'Library Catalog', icon: '📚' },
    { key: 'borrows', label: 'My Borrowings', icon: '📖' },
    { key: 'fines', label: 'My Fines', icon: '💳' },
    { key: 'profile', label: 'My Profile', icon: '👤' },
  ]
  const tabLabel = TABS.find(t => t.key === tab)?.label || 'Member Dashboard'

  return (
    <DashboardShell role="member" navItems={TABS} activeTab={tab} setTab={setTab} user={user} logout={logout} tabLabel={tabLabel}>

      {tab === 'overview' && stats && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
            <StatCard title="Active Borrows" value={stats.activeBorrowsCount} color="#3b82f6" cardBg={cardBg} textPrimary={textPrimary} border={border} />
            <StatCard title="Pending Reservations" value={stats.reservationsCount} color="#8b5cf6" cardBg={cardBg} textPrimary={textPrimary} border={border} />
            <StatCard title="Unpaid Fines" value={`$${stats.unpaidFinesTotal}`} color="#ef4444" highlight={stats.unpaidFinesTotal > 0} cardBg={cardBg} textPrimary={textPrimary} border={border} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: textMuted, marginBottom: 16, textTransform:'uppercase', letterSpacing:1 }}>Currently Borrowed</h3>
          {stats.activeBorrows?.length === 0 ? (
            <div style={{ background: cardBg, backdropFilter:'blur(12px)', border: `1px solid ${border}`, borderRadius: 12, padding: 30, textAlign: 'center', color: textMuted }}>
              No active borrowings. Check the catalog to find a book!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats.activeBorrows?.map(b => (
                <div key={b.BorrowID} className="stat-card" style={{ background: cardBg, backdropFilter:'blur(12px)', border: `1px solid ${border}`, borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: textPrimary, fontSize: 15 }}>{b.Title}</div>
                    <div style={{ color: textMuted, fontSize: 13, marginTop: 4 }}>Due: {new Date(b.DueDate).toLocaleDateString()}</div>
                  </div>
                  <span style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: '1px solid rgba(59,130,246,0.3)' }}>BORROWED</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'catalog' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
          {books.map(b => (
            <div key={b.BookID} className="stat-card" style={{ background: cardBg, backdropFilter:'blur(12px)', border: `1px solid ${border}`, borderRadius: 16, overflow:'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 180, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow:'hidden' }}>
                {b.CoverImage ? (
                  <img src={b.CoverImage.startsWith('http') ? b.CoverImage : `http://localhost:4000${b.CoverImage}`} alt={b.Title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 48 }}>📚</span>
                )}
              </div>
              <div style={{ padding: 20, flex:1, display:'flex', flexDirection:'column' }}>
                <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{b.CategoryName || 'General'}</div>
                <div style={{ fontWeight: 700, color: textPrimary, fontSize: 16, marginBottom: 4 }}>{b.Title}</div>
                <div style={{ color: textMuted, fontSize: 13, marginBottom: 16, flex: 1 }}>By {b.Authors || 'Unknown Author'}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${border}`, paddingTop: 14 }}>
                  <div style={{ fontSize: 13, color: b.AvailableCopies > 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                    {b.AvailableCopies}/{b.TotalCopies} Available
                  </div>
                  <button onClick={() => handleReserve(b.BookID)} disabled={b.AvailableCopies > 0}
                    style={{ background: b.AvailableCopies > 0 ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: b.AvailableCopies > 0 ? '#475569' : '#fff', border: 'none', padding: '6px 14px', borderRadius: 8, cursor: b.AvailableCopies > 0 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight:600 }}>
                    Reserve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'borrows' && (
        <div style={{ background: cardBg, backdropFilter:'blur(12px)', borderRadius: 16, border: `1px solid ${border}`, overflow: 'hidden' }}>
          {borrows.length === 0 ? <div style={{ padding: 48, textAlign: 'center', color: textMuted }}><div style={{fontSize:40,marginBottom:12}}>📭</div>No borrowing history found.</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)', color: '#64748b' }}>
                  <th style={{ padding: 16 }}>Book Title</th>
                  <th style={{ padding: 16 }}>Borrowed On</th>
                  <th style={{ padding: 16 }}>Due Date</th>
                  <th style={{ padding: 16 }}>Status</th>
                  <th style={{ padding: 16 }}>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {borrows.map(b => (
                  <tr key={b.BorrowID} className="table-row" style={{ borderTop: `1px solid ${border}` }}>
                    <td style={{ padding: 16, fontWeight: 600, color: textPrimary }}>{b.Title}</td>
                    <td style={{ padding: 16, color: textMuted }}>{new Date(b.BorrowDate).toLocaleDateString()}</td>
                    <td style={{ padding: 16, color: textMuted }}>{new Date(b.DueDate).toLocaleDateString()}</td>
                    <td style={{ padding: 16 }}>
                      <span style={{ background: b.Status === 'returned' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: b.Status === 'returned' ? '#10b981' : '#f59e0b', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                        {b.Status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 16 }}>
                      <button onClick={() => generatePDF(b)} className="action-btn" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>PDF ↓</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'fines' && (
        <div style={{ background: cardBg, backdropFilter:'blur(12px)', borderRadius: 16, border: `1px solid ${border}`, overflow: 'hidden' }}>
          {fines.length === 0 ? <div style={{ padding: 48, textAlign: 'center', color: textMuted }}><div style={{fontSize:40,marginBottom:12}}>✅</div>You have no fines!</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)', color: '#64748b' }}>
                  <th style={{ padding: 16 }}>Fine Type</th>
                  <th style={{ padding: 16 }}>Amount</th>
                  <th style={{ padding: 16 }}>Issued On</th>
                  <th style={{ padding: 16 }}>Status</th>
                  <th style={{ padding: 16 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fines.map(f => (
                  <tr key={f.FineID} className="table-row" style={{ borderTop: `1px solid ${border}` }}>
                    <td style={{ padding: 16 }}>
                      <div style={{ fontWeight: 600, color: textPrimary }}>{f.TypeName || 'Library Fine'}</div>
                      <div style={{ fontSize: 12, color: textMuted }}>{f.BookTitle}</div>
                    </td>
                    <td style={{ padding: 16, fontWeight: 700, color: '#ef4444', fontSize: 16 }}>${f.Amount}</td>
                    <td style={{ padding: 16, color: '#64748b' }}>{new Date(f.IssuedDate).toLocaleDateString()}</td>
                    <td style={{ padding: 16 }}>
                      <span style={{ background: f.FineStatus === 'Paid' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: f.FineStatus === 'Paid' ? '#10b981' : '#ef4444', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                        {f.FineStatus?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 16 }}>
                      {f.FineStatus === 'Unpaid' ? (
                        <button className="action-btn" onClick={() => alert('Chapa payment integration coming soon!')} style={{ background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', color: '#fff', padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, boxShadow:'0 2px 12px rgba(16,185,129,0.3)' }}>Pay Now</button>
                      ) : (
                        <span style={{ color: '#10b981', fontSize: 13, fontWeight: 600 }}>✓ Resolved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'profile' && <ProfileTab user={user} c={{ card: cardBg, text: textPrimary, muted: textMuted, border: border, input: isDark ? '#2a3550' : '#fff' }} />}

    </DashboardShell>
  )
}

function ProfileTab({ user, c }) {
  const [pw, setPw] = React.useState({ current: '', new: '', confirm: '' })
  const [loading, setLoading] = React.useState(false)

  const handlePw = async (e) => {
    e.preventDefault()
    if (pw.new !== pw.confirm) return alert("Passwords don't match")
    setLoading(true)
    try {
      const res = await axios.patch(`http://localhost:4000/api/users/${user.UserID}/password`, {
        currentPassword: pw.current,
        newPassword: pw.new
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('lms_token')}` } })
      if (res.data.success) {
        alert("Password updated successfully!")
        setPw({ current: '', new: '', confirm: '' })
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message)
    } finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 32, marginBottom: 24, backdropFilter:'blur(12px)' }}>
        <h3 style={{ color: c.text, margin: '0 0 20px', fontSize: 20, fontWeight: 700 }}>Account Information</h3>
        <div style={{ display: 'grid', gap: 20 }}>
          <div>
            <label style={{ color: c.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Full Name</label>
            <div style={{ color: c.text, fontSize: 16, fontWeight: 600 }}>{user.FullName}</div>
          </div>
          <div>
            <label style={{ color: c.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Email Address</label>
            <div style={{ color: c.text, fontSize: 16, fontWeight: 600 }}>{user.Email}</div>
          </div>
          <div>
            <label style={{ color: c.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Account Role</label>
            <div style={{ color: '#3b82f6', fontSize: 16, fontWeight: 700 }}>{user.RoleName}</div>
          </div>
        </div>
      </div>

      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 32, backdropFilter:'blur(12px)' }}>
        <h3 style={{ color: c.text, margin: '0 0 20px', fontSize: 20, fontWeight: 700 }}>Security Settings</h3>
        <form onSubmit={handlePw} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ color: c.muted, fontSize: 12, display: 'block', marginBottom: 6 }}>Current Password</label>
            <input type="password" required value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${c.border}`, background: c.input, color: c.text }} />
          </div>
          <div>
            <label style={{ color: c.muted, fontSize: 12, display: 'block', marginBottom: 6 }}>New Password</label>
            <input type="password" required value={pw.new} onChange={e => setPw({ ...pw, new: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${c.border}`, background: c.input, color: c.text }} />
          </div>
          <div>
            <label style={{ color: c.muted, fontSize: 12, display: 'block', marginBottom: 6 }}>Confirm New Password</label>
            <input type="password" required value={pw.confirm} onChange={e => setPw({ ...pw, confirm: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${c.border}`, background: c.input, color: c.text }} />
          </div>
          <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: '#fff', border: 'none', padding: 14, borderRadius: 8, fontWeight: 700, cursor: 'pointer', marginTop: 10 }}>
            {loading ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

const StatCard = ({ title, value, color = '#3b82f6', highlight, cardBg, textPrimary, border }) => (
  <div className="stat-card" style={{ background: cardBg, backdropFilter:'blur(12px)', border: highlight ? `2px solid ${color}` : `1px solid ${border}`, borderRadius: 16, padding: 24, boxShadow: highlight ? `0 0 24px ${color}22` : 'none' }}>
    <div style={{ fontSize: 12, color: highlight ? color : '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{title}</div>
    <div style={{ fontSize: 36, fontWeight: 800, color: highlight ? color : textPrimary }}>{value ?? '—'}</div>
  </div>
)
