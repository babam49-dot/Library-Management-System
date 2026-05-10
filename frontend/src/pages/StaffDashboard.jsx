import React, { useEffect, useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import DarkModeToggle from '../components/DarkModeToggle'
import axios from 'axios'

const API = 'http://localhost:4000/api'

export default function StaffDashboard() {
  const { user, logout } = useAuth()
  const { isDark } = useTheme()
  const [stats, setStats] = useState(null)
  const [pendingMembers, setPendingMembers] = useState([])
  const [borrowingRecords, setBorrowingRecords] = useState([])
  const [tab, setTab] = useState('overview')
  
  // Catalog Form States
  const [bookForm, setBookForm] = useState({ 
    title: '', isbn: '', year: '', edition: '', language: 'English', description: '',
    publisherId: '', categoryId: '', authorIds: [], numberOfCopies: 1, shelfLocation: ''
  })
  const [coverFile, setCoverFile] = useState(null)
  const [bookLoading, setBookLoading] = useState(false)
  const [bookMsg, setBookMsg] = useState('')
  const fileInputRef = useRef(null)

  // Dropdown Data
  const [publishers, setPublishers] = useState([])
  const [categories, setCategories] = useState([])
  const [authors, setAuthors] = useState([])

  // Action States
  const [issueForm, setIssueForm] = useState({ memberId: '', copyId: '' })
  const [returnForm, setReturnForm] = useState({ borrowId: '', condition: 'Good' })
  const [actionMsg, setActionMsg] = useState('')

  const getHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('lms_token')}` } })

  const bg = isDark ? '#0a0e1a' : '#f8f9fa'
  const sidebar = isDark ? '#111827' : '#1a0f0a'
  const cardBg = isDark ? '#1e2334' : '#fff'
  const textPrimary = isDark ? '#f1f5f9' : '#1a0f0a'
  const textMuted = isDark ? '#94a3b8' : '#8b6a4a'
  const border = isDark ? '#2d3748' : '#e5e5e5'
  const tableHead = isDark ? '#1a2236' : '#faf6f0'
  const inputBg = isDark ? '#2a3550' : '#fff'
  const inputBorder = isDark ? '#374151' : '#e5e5e5'

  const fetchData = async () => {
    try {
      const s = await axios.get(`${API}/staff/dashboard`, getHeaders())
      setStats(s.data.data)
      const p = await axios.get(`${API}/staff/pending-members`, getHeaders())
      setPendingMembers(p.data.data)
      const pubs = await axios.get(`${API}/books/publishers`, getHeaders())
      setPublishers(pubs.data.data)
      const cats = await axios.get(`${API}/books/categories`, getHeaders())
      setCategories(cats.data.data)
      const auths = await axios.get(`${API}/books/authors`, getHeaders())
      setAuthors(auths.data.data)
      const borrows = await axios.get(`${API}/staff/borrowing-records`, getHeaders())
      setBorrowingRecords(borrows.data.data)
    } catch (err) { console.error(err) }
  }

  useEffect(() => { fetchData() }, [])

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this member?')) return
    await axios.patch(`${API}/staff/approve-member/${id}`, {}, getHeaders())
    fetchData()
  }

  const handleReject = async (id) => {
    if (!window.confirm('Reject this member?')) return
    await axios.patch(`${API}/staff/reject-member/${id}`, {}, getHeaders())
    fetchData()
  }

  const handleBookChange = (e) => {
    if (e.target.name === 'authorIds') {
      const options = e.target.options
      const value = []
      for (let i = 0, l = options.length; i < l; i++) {
        if (options[i].selected) value.push(options[i].value)
      }
      setBookForm({ ...bookForm, authorIds: value })
    } else {
      setBookForm({ ...bookForm, [e.target.name]: e.target.value })
    }
  }
  
  const submitBook = async (e) => {
    e.preventDefault()
    setBookLoading(true)
    setBookMsg('')
    try {
      const fd = new FormData()
      Object.keys(bookForm).forEach(key => {
        if (key === 'authorIds') {
          fd.append(key, JSON.stringify(bookForm[key]))
        } else {
          fd.append(key, bookForm[key])
        }
      })
      if (coverFile) fd.append('coverImage', coverFile)

      await axios.post(`${API}/books`, fd, { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` } })
      setBookMsg('Book and copies added successfully!')
      setBookForm({ 
        title: '', isbn: '', year: '', edition: '', language: 'English', description: '',
        publisherId: '', categoryId: '', authorIds: [], numberOfCopies: 1, shelfLocation: ''
      })
      setCoverFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      fetchData()
    } catch (err) {
      setBookMsg('Error: ' + (err.response?.data?.message || err.message))
    } finally {
      setBookLoading(false)
    }
  }

  const handleIssue = async (e) => {
    e.preventDefault()
    setActionMsg('')
    try {
      await axios.post(`${API}/staff/borrow`, issueForm, getHeaders())
      setActionMsg('Book issued successfully!')
      setIssueForm({ memberId: '', copyId: '' })
      fetchData()
    } catch (err) {
      setActionMsg('Error: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleReturn = async (e) => {
    e.preventDefault()
    setActionMsg('')
    try {
      const res = await axios.post(`${API}/staff/return`, returnForm, getHeaders())
      setActionMsg(res.data.data.fineCreated ? 'Returned. Fine applied.' : 'Returned successfully!')
      setReturnForm({ borrowId: '', condition: 'Good' })
      fetchData()
    } catch (err) {
      setActionMsg('Error: ' + (err.response?.data?.message || err.message))
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', 'Georgia', sans-serif", background: bg }}>
      {/* Sidebar */}
      <div style={{ width: 260, background: sidebar, color: '#e8d5b0', padding: 24, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: 18 }}>S</div>
          <span style={{ fontWeight: 700, fontSize: 17, color: '#fff' }}>Staff Portal</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          {[
            { key: 'overview', label: 'Dashboard Overview', icon: '📊' },
            { key: 'members', label: 'Member Approvals', icon: '👤', badge: pendingMembers.length },
            { key: 'catalog', label: 'Catalog Registration', icon: '📚' },
            { key: 'circulation', label: 'Issue / Return', icon: '🔄' },
          ].map(item => (
            <button key={item.key} onClick={() => setTab(item.key)} style={navBtnStyle(tab === item.key, isDark)}>
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
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>
              {user?.FullName?.charAt(0) || 'S'}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{user?.FullName}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Library Staff</div>
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
              {tab === 'overview' ? 'Circulation Overview' : tab === 'members' ? 'Member Approvals' : tab === 'catalog' ? 'Register New Book' : 'Circulation Management'}
            </h2>
            <div style={{ fontSize: 13, color: textMuted, marginTop: 4 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ background: '#d1fae5', color: '#065f46', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>Staff</span>
            <DarkModeToggle />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>

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
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e5e5', padding: 30, maxWidth: 800 }}>
            <p style={{ color: '#8b6a4a', marginBottom: 20 }}>Upload a new book to the library catalog, linking categories and assigning shelf locations.</p>
            {bookMsg && <div style={{ padding: 12, marginBottom: 20, background: bookMsg.startsWith('Error') ? '#fef2f2' : '#ecfdf5', color: bookMsg.startsWith('Error') ? '#b91c1c' : '#047857', borderRadius: 8 }}>{bookMsg}</div>}
            
            <form onSubmit={submitBook} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={lblStyle}>Book Title *</label>
                <input required type="text" name="title" value={bookForm.title} onChange={handleBookChange} style={inputStyle} />
              </div>
              <div>
                <label style={lblStyle}>ISBN</label>
                <input type="text" name="isbn" value={bookForm.isbn} onChange={handleBookChange} style={inputStyle} />
              </div>
              <div>
                <label style={lblStyle}>Publication Year</label>
                <input type="number" name="year" value={bookForm.year} onChange={handleBookChange} style={inputStyle} />
              </div>
              <div>
                <label style={lblStyle}>Publisher</label>
                <select name="publisherId" value={bookForm.publisherId} onChange={handleBookChange} style={inputStyle}>
                  <option value="">-- Select Publisher --</option>
                  {publishers.map(p => <option key={p.PublisherID} value={p.PublisherID}>{p.PublisherName}</option>)}
                </select>
              </div>
              <div>
                <label style={lblStyle}>Category</label>
                <select name="categoryId" value={bookForm.categoryId} onChange={handleBookChange} style={inputStyle}>
                  <option value="">-- Select Category --</option>
                  {categories.map(c => <option key={c.CategoryID} value={c.CategoryID}>{c.CategoryName}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={lblStyle}>Authors (Hold Ctrl to select multiple)</label>
                <select multiple name="authorIds" value={bookForm.authorIds} onChange={handleBookChange} style={{ ...inputStyle, minHeight: 80 }}>
                  {authors.map(a => <option key={a.AuthorID} value={a.AuthorID}>{a.Name}</option>)}
                </select>
              </div>
              <div>
                <label style={lblStyle}>Number of Copies *</label>
                <input required type="number" min="1" name="numberOfCopies" value={bookForm.numberOfCopies} onChange={handleBookChange} style={inputStyle} />
              </div>
              <div>
                <label style={lblStyle}>Shelf Location</label>
                <input type="text" name="shelfLocation" value={bookForm.shelfLocation} onChange={handleBookChange} placeholder="e.g. A1-05" style={inputStyle} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={lblStyle}>Cover Image</label>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={e => setCoverFile(e.target.files[0])} style={{ ...inputStyle, padding: '8px 12px' }} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={lblStyle}>Description</label>
                <textarea name="description" value={bookForm.description} onChange={handleBookChange} style={{ ...inputStyle, minHeight: 80, fontFamily: 'inherit' }}></textarea>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <button type="submit" disabled={bookLoading} style={{ background: '#c4813a', color: '#fff', border: 'none', padding: '14px', borderRadius: 8, fontWeight: 700, cursor: bookLoading ? 'not-allowed' : 'pointer', width: '100%', fontSize: 16 }}>
                  {bookLoading ? 'Registering...' : 'Register Book & Copies'}
                </button>
              </div>
            </form>
          </div>
        )}

        {tab === 'circulation' && (
          <div style={{ display: 'flex', gap: 30, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, background: '#fff', borderRadius: 12, border: '1px solid #e5e5e5', padding: 24 }}>
              <h3 style={{ fontSize: 18, marginBottom: 16, borderBottom: '1px solid #e5e5e5', paddingBottom: 12 }}>Issue Book to Member</h3>
              <form onSubmit={handleIssue} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={lblStyle}>Member ID</label>
                  <input required type="number" name="memberId" value={issueForm.memberId} onChange={e => setIssueForm({...issueForm, memberId: e.target.value})} style={inputStyle} placeholder="Numeric Member ID" />
                </div>
                <div>
                  <label style={lblStyle}>Copy ID</label>
                  <input required type="number" name="copyId" value={issueForm.copyId} onChange={e => setIssueForm({...issueForm, copyId: e.target.value})} style={inputStyle} placeholder="Specific Copy ID" />
                </div>
                <button type="submit" style={{ background: '#10b981', color: '#fff', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Issue Book</button>
              </form>
            </div>

            <div style={{ flex: 1, background: '#fff', borderRadius: 12, border: '1px solid #e5e5e5', padding: 24 }}>
              <h3 style={{ fontSize: 18, marginBottom: 16, borderBottom: '1px solid #e5e5e5', paddingBottom: 12 }}>Process Return</h3>
              <form onSubmit={handleReturn} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={lblStyle}>Borrow ID</label>
                  <input required type="number" name="borrowId" value={returnForm.borrowId} onChange={e => setReturnForm({...returnForm, borrowId: e.target.value})} style={inputStyle} placeholder="Borrow Record ID" />
                </div>
                <div>
                  <label style={lblStyle}>Condition on Return</label>
                  <select name="condition" value={returnForm.condition} onChange={e => setReturnForm({...returnForm, condition: e.target.value})} style={inputStyle}>
                    <option value="Good">Good</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
                <button type="submit" style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Process Return</button>
              </form>
              {actionMsg && <div style={{ marginTop: 16, padding: 12, background: '#eff6ff', color: '#1d4ed8', borderRadius: 8, fontSize: 14 }}>{actionMsg}</div>}
            </div>
          </div>
        )}

        </div>{/* end scrollable */}
      </div>{/* end main column */}
    </div>
  )
}

const lblStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#3d2010', marginBottom: 6 }
const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e5e5', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#1a0f0a' }

const navBtnStyle = (active, isDark) => ({
  background: active ? 'rgba(16,185,129,0.15)' : 'transparent',
  color: active ? '#10b981' : '#94a3b8',
  border: active ? '1px solid rgba(16,185,129,0.3)' : '1px solid transparent',
  padding: '11px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', fontSize: 14, transition: 'all 0.2s',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%'
})

const StatCard = ({ title, value, highlight }) => (
  <div style={{ background: '#fff', border: highlight ? '2px solid #10b981' : '1px solid #e5e5e5', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
    <div style={{ fontSize: 12, color: highlight ? '#10b981' : '#8b6a4a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{title}</div>
    <div style={{ fontSize: 36, fontWeight: 700, color: '#1a0f0a' }}>{value}</div>
  </div>
)
