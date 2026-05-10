import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import DarkModeToggle from '../components/DarkModeToggle'
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
      const s = await axios.get(`${API}/member/dashboard`, getHeaders())
      setStats(s.data.data)
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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', 'Georgia', sans-serif", background: bg }}>
      {/* Sidebar */}
      <div style={{ width: 260, background: sidebar, color: '#e8d5b0', padding: 24, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: 18 }}>M</div>
          <span style={{ fontWeight: 700, fontSize: 17, color: '#fff' }}>Member Portal</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          {[
            { key: 'overview', label: 'Dashboard', icon: '🏠' },
            { key: 'catalog', label: 'Library Catalog', icon: '📚' },
            { key: 'borrows', label: 'My Borrowings', icon: '📖' },
            { key: 'fines', label: 'My Fines', icon: '💳' },
          ].map(item => (
            <button key={item.key} onClick={() => setTab(item.key)} style={navBtnStyle(tab === item.key)}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </span>
            </button>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20, marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>
              {user?.FullName?.charAt(0) || 'M'}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{user?.FullName}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Student Member</div>
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
              {tab === 'overview' ? 'My Dashboard' : tab === 'catalog' ? 'Library Catalog' : tab === 'fines' ? 'My Fines' : 'My Borrowing History'}
            </h2>
            <div style={{ fontSize: 13, color: textMuted, marginTop: 4 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>Student</span>
            <DarkModeToggle />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>

        {tab === 'overview' && stats && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 40 }}>
              <StatCard title="Active Borrows" value={stats.activeBorrowsCount} />
              <StatCard title="Pending Reservations" value={stats.reservationsCount} />
              <StatCard title="Unpaid Fines" value={`$${stats.unpaidFinesTotal}`} highlight={stats.unpaidFinesTotal > 0} />
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#3d2010', marginBottom: 16 }}>Currently Borrowed Books</h3>
            {stats.activeBorrows.length === 0 ? (
              <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: 30, textAlign: 'center', color: '#8b6a4a' }}>
                You have no active borrowings. Check the catalog to find a book!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {stats.activeBorrows.map(b => (
                  <div key={b.BorrowID} style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1a0f0a', fontSize: 16 }}>{b.Title}</div>
                      <div style={{ color: '#8b6a4a', fontSize: 13, marginTop: 4 }}>Due: {new Date(b.DueDate).toLocaleDateString()}</div>
                    </div>
                    <div style={{ background: '#fdf4e7', color: '#8b5e3c', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>
                      Borrowed
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'catalog' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {books.map(b => (
              <div key={b.BookID} style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative', height: 200, marginBottom: 16, borderRadius: 8, overflow: 'hidden', background: '#fdf4e7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {b.CoverImage ? (
                    <img src={b.CoverImage.startsWith('http') ? b.CoverImage : `http://localhost:4000${b.CoverImage}`} alt={b.Title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 40 }}>📚</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#e07b39', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{b.CategoryName || 'General'}</div>
                <div style={{ fontWeight: 700, color: '#1a0f0a', fontSize: 18, marginBottom: 4 }}>{b.Title}</div>
                <div style={{ color: '#8b6a4a', fontSize: 14, marginBottom: 16, flex: 1 }}>By {b.Authors || 'Unknown Author'}</div>
                
                <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 13, color: b.AvailableCopies > 0 ? '#047857' : '#b91c1c', fontWeight: 600 }}>
                    {b.AvailableCopies} / {b.TotalCopies} Available
                  </div>
                  <button onClick={() => handleReserve(b.BookID)} disabled={b.AvailableCopies > 0} 
                    style={{ background: b.AvailableCopies > 0 ? '#e5e5e5' : '#1a0f0a', color: b.AvailableCopies > 0 ? '#a08060' : '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: b.AvailableCopies > 0 ? 'not-allowed' : 'pointer', fontSize: 13 }}>
                    Reserve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'borrows' && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e5e5', overflow: 'hidden' }}>
            {borrows.length === 0 ? <div style={{ padding: 30, textAlign: 'center', color: '#8b6a4a' }}>No borrowing history found.</div> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#faf6f0', color: '#8b6a4a' }}>
                    <th style={{ padding: 16 }}>Book Title</th>
                    <th style={{ padding: 16 }}>Borrowed On</th>
                    <th style={{ padding: 16 }}>Due Date</th>
                    <th style={{ padding: 16 }}>Status</th>
                    <th style={{ padding: 16 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {borrows.map(b => (
                    <tr key={b.BorrowID} style={{ borderTop: '1px solid #e5e5e5' }}>
                      <td style={{ padding: 16, fontWeight: 500 }}>{b.Title}</td>
                      <td style={{ padding: 16 }}>{new Date(b.BorrowDate).toLocaleDateString()}</td>
                      <td style={{ padding: 16 }}>{new Date(b.DueDate).toLocaleDateString()}</td>
                      <td style={{ padding: 16 }}>
                        <span style={{ 
                          background: b.Status === 'returned' ? '#ecfdf5' : '#fdf4e7',
                          color: b.Status === 'returned' ? '#047857' : '#8b5e3c',
                          padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600
                        }}>
                          {b.Status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: 16 }}>
                        <button onClick={() => generatePDF(b)} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Download PDF</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'fines' && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e5e5', overflow: 'hidden' }}>
            {fines.length === 0 ? <div style={{ padding: 30, textAlign: 'center', color: '#8b6a4a' }}>You have no fines!</div> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#faf6f0', color: '#8b6a4a' }}>
                    <th style={{ padding: 16 }}>Description</th>
                    <th style={{ padding: 16 }}>Amount</th>
                    <th style={{ padding: 16 }}>Issued On</th>
                    <th style={{ padding: 16 }}>Status</th>
                    <th style={{ padding: 16 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fines.map(f => (
                    <tr key={f.FineID} style={{ borderTop: '1px solid #e5e5e5' }}>
                      <td style={{ padding: 16 }}>
                        <div style={{ fontWeight: 500 }}>{f.TypeName || 'Library Fine'}</div>
                        <div style={{ fontSize: 12, color: '#8b6a4a' }}>{f.BookTitle}</div>
                      </td>
                      <td style={{ padding: 16, fontWeight: 600, color: '#b91c1c' }}>${f.Amount}</td>
                      <td style={{ padding: 16 }}>{new Date(f.IssuedDate).toLocaleDateString()}</td>
                      <td style={{ padding: 16 }}>
                        <span style={{ 
                          background: f.FineStatus === 'Paid' ? '#ecfdf5' : '#fef2f2',
                          color: f.FineStatus === 'Paid' ? '#047857' : '#b91c1c',
                          padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600
                        }}>
                          {f.FineStatus.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: 16 }}>
                        {f.FineStatus === 'Unpaid' ? (
                          <button onClick={() => alert('Payment simulation integration pending')} style={{ background: '#10b981', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Pay Now</button>
                        ) : (
                          <span style={{ color: '#047857', fontSize: 13, fontWeight: 600 }}>Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
        </div>{/* end scrollable */}
      </div>{/* end main column */}
    </div>
  )
}

const navBtnStyle = (active) => ({
  background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
  color: active ? '#60a5fa' : '#94a3b8',
  border: active ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
  padding: '11px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', fontSize: 14, transition: 'all 0.2s',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%'
})

const StatCard = ({ title, value, highlight }) => (
  <div style={{ background: '#fff', border: highlight ? '2px solid #ef4444' : '1px solid #e5e5e5', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
    <div style={{ fontSize: 12, color: highlight ? '#ef4444' : '#8b6a4a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{title}</div>
    <div style={{ fontSize: 36, fontWeight: 700, color: '#1a0f0a' }}>{value}</div>
  </div>
)
