import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const API = 'http://localhost:4000/api'

export default function MemberDashboard() {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState(null)
  const [books, setBooks] = useState([])
  const [borrows, setBorrows] = useState([])
  const [tab, setTab] = useState('overview') // overview, catalog, borrows

  useEffect(() => {
    fetchDashboard()
    fetchBooks()
    fetchBorrows()
  }, [])

  const fetchDashboard = async () => {
    try {
      const s = await axios.get(`${API}/member/dashboard`)
      setStats(s.data.data)
    } catch (err) { console.error(err) }
  }

  const fetchBooks = async () => {
    try {
      const b = await axios.get(`${API}/member/books`)
      setBooks(b.data.data)
    } catch (err) { console.error(err) }
  }

  const fetchBorrows = async () => {
    try {
      const b = await axios.get(`${API}/member/my-borrowings`)
      setBorrows(b.data.data)
    } catch (err) { console.error(err) }
  }

  const handleReserve = async (bookId) => {
    try {
      await axios.post(`${API}/member/reservations`, { bookId })
      alert('Reservation created!')
      fetchDashboard()
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error')
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Georgia', serif", background: '#faf6f0' }}>
      {/* Sidebar */}
      <div style={{ width: 250, background: '#1a0f0a', color: '#e8d5b0', padding: 24, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
          <div style={{ width: 32, height: 32, background: '#e07b39', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff' }}>M</div>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Member Portal</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          <button onClick={() => setTab('overview')} style={navBtnStyle(tab === 'overview')}>Dashboard</button>
          <button onClick={() => setTab('catalog')} style={navBtnStyle(tab === 'catalog')}>Library Catalog</button>
          <button onClick={() => setTab('borrows')} style={navBtnStyle(tab === 'borrows')}>My Borrowings</button>
        </nav>

        <div style={{ borderTop: '1px solid #3d2010', paddingTop: 20, marginTop: 'auto' }}>
          <div style={{ fontSize: 14, marginBottom: 12 }}>Logged in as:<br/><strong style={{ color: '#fff' }}>{user.FullName}</strong></div>
          <button onClick={logout} style={{ width: '100%', background: 'transparent', border: '1px solid #e07b39', color: '#e07b39', padding: 10, borderRadius: 8, cursor: 'pointer' }}>Sign Out</button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: 40, overflowY: 'auto' }}>
        <h2 style={{ fontSize: 28, color: '#1a0f0a', marginBottom: 24, fontWeight: 700 }}>
          {tab === 'overview' ? 'My Dashboard' : tab === 'catalog' ? 'Library Catalog' : 'My Borrowing History'}
        </h2>

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
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#faf6f0', color: '#8b6a4a' }}>
                  <th style={{ padding: 16 }}>Book Title</th>
                  <th style={{ padding: 16 }}>Borrowed On</th>
                  <th style={{ padding: 16 }}>Due Date</th>
                  <th style={{ padding: 16 }}>Status</th>
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
                  </tr>
                ))}
              </tbody>
            </table>
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
  <div style={{ background: '#fff', border: highlight ? '2px solid #b91c1c' : '1px solid #e5e5e5', borderRadius: 12, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
    <div style={{ fontSize: 13, color: highlight ? '#b91c1c' : '#8b6a4a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{title}</div>
    <div style={{ fontSize: 36, fontWeight: 700, color: '#1a0f0a' }}>{value}</div>
  </div>
)
