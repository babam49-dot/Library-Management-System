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
  const [tab, setTab] = useState('overview')

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
  ]
  const tabLabel = TABS.find(t => t.key === tab)?.label || 'Member Dashboard'

  return (
    <DashboardShell role="member" navItems={TABS} activeTab={tab} setTab={setTab} user={user} logout={logout} tabLabel={tabLabel}>

      {tab === 'overview' && stats && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
            <StatCard title="Active Borrows" value={stats.activeBorrowsCount} color="#3b82f6" />
            <StatCard title="Pending Reservations" value={stats.reservationsCount} color="#8b5cf6" />
            <StatCard title="Unpaid Fines" value={`$${stats.unpaidFinesTotal}`} color="#ef4444" highlight={stats.unpaidFinesTotal > 0} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#94a3b8', marginBottom: 16, textTransform:'uppercase', letterSpacing:1 }}>Currently Borrowed</h3>
          {stats.activeBorrows?.length === 0 ? (
            <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter:'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 30, textAlign: 'center', color: '#64748b' }}>
              No active borrowings. Check the catalog to find a book!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats.activeBorrows?.map(b => (
                <div key={b.BorrowID} className="stat-card" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter:'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 15 }}>{b.Title}</div>
                    <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Due: {new Date(b.DueDate).toLocaleDateString()}</div>
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
            <div key={b.BookID} className="stat-card" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter:'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow:'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 180, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow:'hidden' }}>
                {b.CoverImage ? (
                  <img src={b.CoverImage.startsWith('http') ? b.CoverImage : `http://localhost:4000${b.CoverImage}`} alt={b.Title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 48 }}>📚</span>
                )}
              </div>
              <div style={{ padding: 20, flex:1, display:'flex', flexDirection:'column' }}>
                <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{b.CategoryName || 'General'}</div>
                <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 16, marginBottom: 4 }}>{b.Title}</div>
                <div style={{ color: '#64748b', fontSize: 13, marginBottom: 16, flex: 1 }}>By {b.Authors || 'Unknown Author'}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
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
        <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter:'blur(12px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          {borrows.length === 0 ? <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}><div style={{fontSize:40,marginBottom:12}}>📭</div>No borrowing history found.</div> : (
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
                  <tr key={b.BorrowID} className="table-row" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: 16, fontWeight: 600, color: '#f1f5f9' }}>{b.Title}</td>
                    <td style={{ padding: 16, color: '#64748b' }}>{new Date(b.BorrowDate).toLocaleDateString()}</td>
                    <td style={{ padding: 16, color: '#64748b' }}>{new Date(b.DueDate).toLocaleDateString()}</td>
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
        <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter:'blur(12px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          {fines.length === 0 ? <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}><div style={{fontSize:40,marginBottom:12}}>✅</div>You have no fines!</div> : (
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
                  <tr key={f.FineID} className="table-row" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: 16 }}>
                      <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{f.TypeName || 'Library Fine'}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{f.BookTitle}</div>
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

    </DashboardShell>
  )
}

const StatCard = ({ title, value, color = '#3b82f6', highlight }) => (
  <div className="stat-card" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter:'blur(12px)', border: highlight ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, boxShadow: highlight ? `0 0 24px ${color}22` : 'none' }}>
    <div style={{ fontSize: 12, color: highlight ? color : '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{title}</div>
    <div style={{ fontSize: 36, fontWeight: 800, color: highlight ? color : '#f1f5f9' }}>{value ?? '—'}</div>
  </div>
)
