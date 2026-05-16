import React, { useEffect, useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import DashboardShell from '../components/DashboardShell'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [allBooks, setAllBooks] = useState([])

  // Metadata Forms
  const [authorForm, setAuthorForm] = useState({ FirstName: '', LastName: '', Bio: '', Nationality: '' })
  const [categoryForm, setCategoryForm] = useState({ CategoryName: '', Description: '' })
  const [publisherForm, setPublisherForm] = useState({ PublisherName: '', Email: '', Phone: '', Address: '' })
  const [metaMsg, setMetaMsg] = useState('')
  const [editModal, setEditModal] = useState(null)

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

  const dynInputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${inputBorder}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: inputBg, color: textPrimary }

  const fetchData = async () => {
    try {
      const s = await axios.get(`${API}/staff/dashboard`, getHeaders())
      setStats(s.data.data)
      const p = await axios.get(`${API}/staff/pending-members`, getHeaders())
      setPendingMembers(p.data.data)
      const pubs = await axios.get(`${API}/catalog/publishers`, getHeaders())
      setPublishers(pubs.data.data)
      const cats = await axios.get(`${API}/catalog/categories`, getHeaders())
      setCategories(cats.data.data)
      const auths = await axios.get(`${API}/catalog/authors`, getHeaders())
      setAuthors(auths.data.data)
      const borrows = await axios.get(`${API}/staff/borrowing-records`, getHeaders())
      setBorrowingRecords(borrows.data.data)
      const bks = await axios.get(`${API}/catalog/books`, getHeaders())
      setAllBooks(bks.data.data || [])
    } catch (err) { console.error(err) }
  }

  useEffect(() => { fetchData() }, [])

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this member?')) return
    await axios.patch(`${API}/users/${id}/status`, { status: 'Active' }, getHeaders())
    fetchData()
  }

  const handleReject = async (id) => {
    if (!window.confirm('Reject this member?')) return
    await axios.patch(`${API}/users/${id}/status`, { status: 'Inactive' }, getHeaders())
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

  const handleAddMeta = async (e, type, form, setForm, initial) => {
    e.preventDefault()
    setMetaMsg('')
    try {
      await axios.post(`${API}/catalog/${type}`, form, getHeaders())
      setMetaMsg(`Added successfully!`)
      setForm(initial)
      fetchData()
    } catch (err) { setMetaMsg('Error: ' + (err.response?.data?.message || err.message)) }
  }

  const handleDeleteMeta = async (type, id) => {
    if (!window.confirm('Delete this record?')) return
    setMetaMsg('')
    try {
      await axios.delete(`${API}/catalog/${type}/${id}`, getHeaders())
      setMetaMsg(`Deleted successfully!`)
      fetchData()
    } catch (err) { setMetaMsg('Error: ' + (err.response?.data?.message || err.message)) }
  }

  const handleUpdateItem = async (e, type, id, payload) => {
    e.preventDefault()
    setMetaMsg('')
    setBookMsg('')
    try {
      await axios.put(`${API}/catalog/${type}/${id}`, payload, getHeaders())
      setEditModal(null)
      fetchData()
      if(type === 'books') setBookMsg('Book updated successfully!')
      else setMetaMsg('Updated successfully!')
    } catch (err) {
      const msg = 'Error: ' + (err.response?.data?.message || err.message);
      if(type === 'books') setBookMsg(msg)
      else setMetaMsg(msg)
    }
  }

  const TABS = [
    { key: 'overview', label: 'Circulation Overview', icon: '📊', path: '/staff' },
    { key: 'members', label: 'Member Approvals', icon: '👤', badge: pendingMembers.length, path: '/staff' },
    { key: 'browse', label: 'Browse Catalog', icon: '📚', path: '/staff' },
    { key: 'catalog', label: 'Register Book', icon: '➕', path: '/staff' },
    { key: 'metadata', label: 'Manage Metadata', icon: '🏷️', path: '/staff' },
    { key: 'desk', label: 'Librarian Desk', icon: '🖥️', path: '/desk' },
    { key: 'reservations', label: 'Reservations', icon: '📋', path: '/reservations' },
    { key: 'overdue', label: 'Overdue Books', icon: '⚠️', path: '/overdue' },
    { key: 'profile', label: 'My Profile', icon: '👤', path: '/staff' },
  ]
  const tabLabel = TABS.find(t => t.key === tab)?.label || 'Staff Dashboard'

  return (
    <DashboardShell role="staff" navItems={TABS} activeTab={tab} setTab={setTab} user={user} logout={logout} tabLabel={tabLabel} searchQuery={searchQuery} setSearchQuery={setSearchQuery}>

      {tab === 'overview' && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          <StatCard title="Active Borrows" value={stats.activeBorrowings} color="#10b981" cardBg={cardBg} textPrimary={textPrimary} border={border} />
          <StatCard title="Returns Today" value={stats.returnsToday} color="#3b82f6" cardBg={cardBg} textPrimary={textPrimary} border={border} />
          <StatCard title="Overdue Books" value={stats.overdueCount} color="#ef4444" highlight={stats.overdueCount > 0} cardBg={cardBg} textPrimary={textPrimary} border={border} />
          <StatCard title="Pending Members" value={stats.pendingMembers} color="#f59e0b" highlight={stats.pendingMembers > 0} cardBg={cardBg} textPrimary={textPrimary} border={border} />
        </div>
      )}

      {tab === 'browse' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
            <button onClick={() => setSearchQuery('')} style={{ padding: '8px 20px', borderRadius: 20, fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', background: !searchQuery ? '#10b981' : isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0', color: !searchQuery ? '#fff' : textMuted, transition: 'all 0.2s' }}>All Categories</button>
            {[...new Set(allBooks.map(b => b.CategoryName).filter(Boolean))].map(cat => (
              <button key={cat} onClick={() => setSearchQuery(cat)} style={{ padding: '8px 20px', borderRadius: 20, fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', background: searchQuery === cat ? '#10b981' : isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0', color: searchQuery === cat ? '#fff' : textMuted, transition: 'all 0.2s' }}>{cat}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {allBooks.filter(b => {
              if (!searchQuery) return true;
              const q = searchQuery.toLowerCase();
              return b.Title?.toLowerCase().includes(q) || b.Authors?.toLowerCase().includes(q) || b.CategoryName?.toLowerCase().includes(q);
            }).map(b => (
              <div key={b.BookID} style={{ background: cardBg, borderRadius: 16, overflow: 'hidden', border: `1px solid ${border}`, display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 200, background: isDark ? '#2d3748' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {b.CoverImage ? <img src={b.CoverImage.startsWith('http') ? b.CoverImage : `http://localhost:4000${b.CoverImage}`} alt={b.Title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 48 }}>📚</span>}
                </div>
                <div style={{ padding: 16, flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{b.CategoryName || 'General'}</div>
                  <div style={{ fontWeight: 700, color: textPrimary, fontSize: 15, marginBottom: 4 }}>{b.Title}</div>
                  <div style={{ color: textMuted, fontSize: 13, marginBottom: 12 }}>By {b.Authors || 'Unknown'}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${border}`, paddingTop: 12 }}>
                    <span style={{ color: b.AvailableCopies > 0 ? '#10b981' : '#ef4444', fontWeight: 700, fontSize: 13 }}>{b.AvailableCopies}/{b.TotalCopies} Available</span>
                    <div style={{ display:'flex', gap: 6, alignItems:'center' }}>
                      <span style={{ fontSize: 11, color: textMuted, padding: '4px 10px', borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>ID: {b.BookID}</span>
                      <button onClick={() => setEditModal({ type: 'books', item: b })} style={{ background:'transparent', border:'none', color:'#3b82f6', cursor:'pointer', fontSize:12, fontWeight:700 }}>Edit</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'members' && (
        <div style={{ background: cardBg, backdropFilter:'blur(12px)', borderRadius: 16, border: `1px solid ${border}`, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${border}`, fontWeight: 600, color: textPrimary, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span>Pending Member Registrations</span>
            <span style={{ fontSize:13, color:textMuted }}>{pendingMembers.length} pending</span>
          </div>
          {pendingMembers.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              No pending member registrations.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)', color: '#64748b' }}>
                  <th style={{ padding: 16 }}>Name</th>
                  <th style={{ padding: 16 }}>Email</th>
                  <th style={{ padding: 16 }}>University ID</th>
                  <th style={{ padding: 16, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingMembers.map(m => (
                  <tr key={m.UserID} className="table-row" style={{ borderTop: `1px solid ${border}` }}>
                    <td style={{ padding: 16, fontWeight: 600, color: textPrimary }}>{m.FullName}</td>
                    <td style={{ padding: 16, color: textMuted }}>{m.Email}</td>
                    <td style={{ padding: 16, color: '#64748b' }}>{m.StudentID}</td>
                    <td style={{ padding: 16, textAlign: 'right' }}>
                      <button onClick={() => handleReject(m.UserID)} className="action-btn" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', marginRight: 8, fontWeight:600 }}>Reject</button>
                      <button onClick={() => handleApprove(m.UserID)} className="action-btn" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontWeight:600 }}>Approve</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'catalog' && (
        <div style={{ background: cardBg, backdropFilter:'blur(12px)', borderRadius: 16, border: `1px solid ${border}`, padding: 32, maxWidth: 800 }}>
          <p style={{ color: textMuted, marginBottom: 20, fontSize:14 }}>Upload a new book to the library catalog, linking categories and assigning shelf locations.</p>
          {bookMsg && <div style={{ padding: 12, marginBottom: 20, background: bookMsg.startsWith('Error') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: bookMsg.startsWith('Error') ? '#ef4444' : '#10b981', borderRadius: 10, border: `1px solid ${bookMsg.startsWith('Error') ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}` }}>{bookMsg}</div>}
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
              <button type="submit" disabled={bookLoading} style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', padding: '14px', borderRadius: 12, fontWeight: 700, cursor: bookLoading ? 'not-allowed' : 'pointer', width: '100%', fontSize: 16, boxShadow:'0 4px 20px rgba(16,185,129,0.3)' }}>
                {bookLoading ? 'Registering...' : 'Register Book & Copies →'}
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === 'metadata' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {metaMsg && <div style={{ padding: 12, background: metaMsg.startsWith('Error') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: metaMsg.startsWith('Error') ? '#ef4444' : '#10b981', borderRadius: 10, border: `1px solid ${metaMsg.startsWith('Error') ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}` }}>{metaMsg}</div>}
          
          {/* Categories */}
          <div style={{ background: cardBg, backdropFilter:'blur(12px)', borderRadius: 16, border: `1px solid ${border}`, padding: 24 }}>
            <h3 style={{ color: textPrimary, marginBottom: 16 }}>Manage Categories</h3>
            <form onSubmit={(e) => handleAddMeta(e, 'categories', categoryForm, setCategoryForm, {CategoryName:'', Description:''})} style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <input required type="text" placeholder="Category Name" value={categoryForm.CategoryName} onChange={e => setCategoryForm({...categoryForm, CategoryName: e.target.value})} style={dynInputStyle} />
              <input type="text" placeholder="Description" value={categoryForm.Description} onChange={e => setCategoryForm({...categoryForm, Description: e.target.value})} style={dynInputStyle} />
              <button type="submit" style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>Add Category</button>
            </form>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead><tr style={{ color: '#64748b' }}><th style={{ padding: 12 }}>Name</th><th style={{ padding: 12 }}>Description</th><th style={{ padding: 12, textAlign: 'right' }}>Actions</th></tr></thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c.CategoryID} style={{ borderTop: `1px solid ${border}`, color: textPrimary }}>
                    <td style={{ padding: 12 }}>{c.CategoryName}</td>
                    <td style={{ padding: 12, color: '#94a3b8' }}>{c.Description || '—'}</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      <button onClick={() => setEditModal({type:'categories', item:c})} style={{ background: 'transparent', color: '#3b82f6', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Authors */}
          <div style={{ background: cardBg, backdropFilter:'blur(12px)', borderRadius: 16, border: `1px solid ${border}`, padding: 24 }}>
            <h3 style={{ color: textPrimary, marginBottom: 16 }}>Manage Authors</h3>
            <form onSubmit={(e) => handleAddMeta(e, 'authors', authorForm, setAuthorForm, {FirstName:'', LastName:'', Bio:'', Nationality:''})} style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <input required type="text" placeholder="First Name" value={authorForm.FirstName} onChange={e => setAuthorForm({...authorForm, FirstName: e.target.value})} style={{...dynInputStyle, flex:1, minWidth:120}} />
              <input required type="text" placeholder="Last Name" value={authorForm.LastName} onChange={e => setAuthorForm({...authorForm, LastName: e.target.value})} style={{...dynInputStyle, flex:1, minWidth:120}} />
              <input type="text" placeholder="Nationality" value={authorForm.Nationality} onChange={e => setAuthorForm({...authorForm, Nationality: e.target.value})} style={{...dynInputStyle, flex:1, minWidth:120}} />
              <input type="text" placeholder="Bio" value={authorForm.Bio} onChange={e => setAuthorForm({...authorForm, Bio: e.target.value})} style={{...dynInputStyle, flex:2, minWidth:200}} />
              <button type="submit" style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Add Author</button>
            </form>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead><tr style={{ color: '#64748b' }}><th style={{ padding: 12 }}>Name</th><th style={{ padding: 12 }}>Nationality</th><th style={{ padding: 12, textAlign: 'right' }}>Actions</th></tr></thead>
              <tbody>
                {authors.map(a => (
                  <tr key={a.AuthorID} style={{ borderTop: `1px solid ${border}`, color: textPrimary }}>
                    <td style={{ padding: 12 }}>{a.Name}</td>
                    <td style={{ padding: 12, color: '#94a3b8' }}>{a.Nationality || '—'}</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      <button onClick={() => setEditModal({type:'authors', item:a})} style={{ background: 'transparent', color: '#3b82f6', border: 'none', cursor: 'pointer', fontWeight: 600, marginRight: 12 }}>Edit</button>
                      <button onClick={() => handleDeleteMeta('authors', a.AuthorID)} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Publishers */}
          <div style={{ background: cardBg, backdropFilter:'blur(12px)', borderRadius: 16, border: `1px solid ${border}`, padding: 24 }}>
            <h3 style={{ color: textPrimary, marginBottom: 16 }}>Manage Publishers</h3>
            <form onSubmit={(e) => handleAddMeta(e, 'publishers', publisherForm, setPublisherForm, {PublisherName:'', Email:'', Phone:'', Address:''})} style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <input required type="text" placeholder="Publisher Name" value={publisherForm.PublisherName} onChange={e => setPublisherForm({...publisherForm, PublisherName: e.target.value})} style={{...dynInputStyle, flex:2, minWidth:200}} />
              <input type="email" placeholder="Email" value={publisherForm.Email} onChange={e => setPublisherForm({...publisherForm, Email: e.target.value})} style={{...dynInputStyle, flex:1, minWidth:150}} />
              <input type="text" placeholder="Phone" value={publisherForm.Phone} onChange={e => setPublisherForm({...publisherForm, Phone: e.target.value})} style={{...dynInputStyle, flex:1, minWidth:120}} />
              <button type="submit" style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Add Publisher</button>
            </form>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead><tr style={{ color: '#64748b' }}><th style={{ padding: 12 }}>Name</th><th style={{ padding: 12 }}>Email</th><th style={{ padding: 12 }}>Phone</th><th style={{ padding: 12, textAlign: 'right' }}>Actions</th></tr></thead>
              <tbody>
                {publishers.map(p => (
                  <tr key={p.PublisherID} style={{ borderTop: `1px solid ${border}`, color: textPrimary }}>
                    <td style={{ padding: 12 }}>{p.PublisherName}</td>
                    <td style={{ padding: 12, color: '#94a3b8' }}>{p.ContactEmail || '—'}</td>
                    <td style={{ padding: 12, color: '#94a3b8' }}>{p.Phone || '—'}</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      <button onClick={() => setEditModal({type:'publishers', item:p})} style={{ background: 'transparent', color: '#3b82f6', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'circulation' && (
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap:'wrap' }}>
          <div style={{ flex: 1, minWidth:280, background: cardBg, backdropFilter:'blur(12px)', borderRadius: 16, border: `1px solid ${border}`, padding: 28 }}>
            <h3 style={{ fontSize: 18, marginBottom: 4, color:textPrimary, fontWeight:700 }}>📤 Issue Book</h3>
            <p style={{ color:textMuted, fontSize:13, marginBottom:20 }}>Issue a book copy to a member</p>
            <form onSubmit={handleIssue} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lblStyle}>Member ID</label>
                <input required type="number" value={issueForm.memberId} onChange={e => setIssueForm({...issueForm, memberId: e.target.value})} style={dynInputStyle} placeholder="Numeric Member ID" />
              </div>
              <div>
                <label style={lblStyle}>Copy ID</label>
                <input required type="number" value={issueForm.copyId} onChange={e => setIssueForm({...issueForm, copyId: e.target.value})} style={dynInputStyle} placeholder="Specific Copy ID" />
              </div>
              <button type="submit" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', padding: '12px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', boxShadow:'0 4px 16px rgba(16,185,129,0.25)' }}>Issue Book →</button>
            </form>
          </div>

          <div style={{ flex: 1, minWidth:280, background: cardBg, backdropFilter:'blur(12px)', borderRadius: 16, border: `1px solid ${border}`, padding: 28 }}>
            <h3 style={{ fontSize: 18, marginBottom: 4, color:textPrimary, fontWeight:700 }}>📥 Process Return</h3>
            <p style={{ color:textMuted, fontSize:13, marginBottom:20 }}>Record a book return and log its condition</p>
            <form onSubmit={handleReturn} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lblStyle}>Borrow ID</label>
                <input required type="number" value={returnForm.borrowId} onChange={e => setReturnForm({...returnForm, borrowId: e.target.value})} style={dynInputStyle} placeholder="Borrow Record ID" />
              </div>
              <div>
                <label style={lblStyle}>Condition on Return</label>
                <select value={returnForm.condition} onChange={e => setReturnForm({...returnForm, condition: e.target.value})} style={dynInputStyle}>
                  <option value="Good">Good</option>
                  <option value="Damaged">Damaged — fine will be applied</option>
                  <option value="Lost">Lost — fine will be applied</option>
                </select>
              </div>
              <button type="submit" style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: '#fff', border: 'none', padding: '12px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', boxShadow:'0 4px 16px rgba(59,130,246,0.25)' }}>Process Return →</button>
            </form>
            {actionMsg && <div style={{ marginTop: 16, padding: 12, background: actionMsg.startsWith('Error') ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)', color: actionMsg.startsWith('Error') ? '#ef4444' : '#60a5fa', borderRadius: 10, fontSize: 14 }}>{actionMsg}</div>}
          </div>
        </div>
      )}

      {tab === 'profile' && <ProfileTab user={user} c={{ card: cardBg, text: textPrimary, muted: textMuted, border: border, input: inputBg }} />}

      {/* Edit Modals */}
      {editModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}>
          <div style={{ background: cardBg, borderRadius: 20, padding: 32, width: editModal.type === 'books' ? 600 : 400, border:`1px solid ${border}`, boxShadow:'0 30px 80px rgba(0,0,0,0.5)', color: textPrimary }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700 }}>Edit {editModal.type.slice(0, -1).toUpperCase()}</h3>
            <form onSubmit={(e) => {
              const fd = new FormData(e.target);
              const payload = Object.fromEntries(fd.entries());
              let idField = { books: 'BookID', categories: 'CategoryID', authors: 'AuthorID', publishers: 'PublisherID' }[editModal.type];
              handleUpdateItem(e, editModal.type, editModal.item[idField], payload);
            }}>
              
              {editModal.type === 'books' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={lblStyle}>Title</label>
                    <input name="Title" defaultValue={editModal.item.Title} required style={dynInputStyle} />
                  </div>
                  <div>
                    <label style={lblStyle}>ISBN</label>
                    <input name="ISBN" defaultValue={editModal.item.ISBN} style={dynInputStyle} />
                  </div>
                  <div>
                    <label style={lblStyle}>Year</label>
                    <input name="PublishYear" type="number" defaultValue={editModal.item.PublishYear} style={dynInputStyle} />
                  </div>
                  <div>
                    <label style={lblStyle}>Category</label>
                    <select name="CategoryID" defaultValue={editModal.item.CategoryID} style={dynInputStyle}>
                      {categories.map(c => <option key={c.CategoryID} value={c.CategoryID}>{c.CategoryName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lblStyle}>Publisher</label>
                    <select name="PublisherID" defaultValue={editModal.item.PublisherID} style={dynInputStyle}>
                      {publishers.map(p => <option key={p.PublisherID} value={p.PublisherID}>{p.PublisherName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lblStyle}>Edition</label>
                    <input name="Edition" defaultValue={editModal.item.Edition} style={dynInputStyle} />
                  </div>
                  <div>
                    <label style={lblStyle}>Language</label>
                    <input name="Language" defaultValue={editModal.item.Language} style={dynInputStyle} />
                  </div>
                </div>
              )}

              {editModal.type === 'categories' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={lblStyle}>Category Name</label>
                    <input name="CategoryName" defaultValue={editModal.item.CategoryName} required style={dynInputStyle} />
                  </div>
                  <div>
                    <label style={lblStyle}>Description</label>
                    <input name="Description" defaultValue={editModal.item.Description} style={dynInputStyle} />
                  </div>
                </div>
              )}

              {editModal.type === 'authors' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={lblStyle}>First Name</label>
                      <input name="FirstName" defaultValue={editModal.item.Name.split(' ')[0]} required style={dynInputStyle} />
                    </div>
                    <div>
                      <label style={lblStyle}>Last Name</label>
                      <input name="LastName" defaultValue={editModal.item.Name.split(' ').slice(1).join(' ')} required style={dynInputStyle} />
                    </div>
                  </div>
                  <div>
                    <label style={lblStyle}>Nationality</label>
                    <input name="Nationality" defaultValue={editModal.item.Nationality} style={dynInputStyle} />
                  </div>
                  <div>
                    <label style={lblStyle}>Bio</label>
                    <textarea name="Bio" defaultValue={editModal.item.Bio} style={{...dynInputStyle, minHeight: 60}} />
                  </div>
                </div>
              )}

              {editModal.type === 'publishers' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={lblStyle}>Publisher Name</label>
                    <input name="PublisherName" defaultValue={editModal.item.PublisherName} required style={dynInputStyle} />
                  </div>
                  <div>
                    <label style={lblStyle}>Email</label>
                    <input name="Email" type="email" defaultValue={editModal.item.ContactEmail} style={dynInputStyle} />
                  </div>
                  <div>
                    <label style={lblStyle}>Phone</label>
                    <input name="Phone" defaultValue={editModal.item.Phone} style={dynInputStyle} />
                  </div>
                  <div>
                    <label style={lblStyle}>Address</label>
                    <input name="Address" defaultValue={editModal.item.Address} style={dynInputStyle} />
                  </div>
                </div>
              )}

              <div style={{ display:'flex', gap:10, marginTop: 24 }}>
                <button type="button" onClick={() => setEditModal(null)} style={{ flex:1, padding:11, borderRadius:10, border:`1px solid ${border}`, background:'transparent', color:textMuted, cursor:'pointer', fontWeight:600 }}>Cancel</button>
                <button type="submit" style={{ flex:1, padding:11, borderRadius:10, border:'none', background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', color:'#fff', fontWeight:700, cursor:'pointer' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
      const res = await axios.post(`http://localhost:4000/api/auth/change-password`, {
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
        <h3 style={{ color: c.text, margin: '0 0 20px', fontSize: 20, fontWeight: 700 }}>Staff Information</h3>
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
            <label style={{ color: c.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Job Title</label>
            <div style={{ color: '#10b981', fontSize: 16, fontWeight: 700 }}>{user.RoleName} / Librarian</div>
          </div>
        </div>
      </div>

      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 32, backdropFilter:'blur(12px)' }}>
        <h3 style={{ color: c.text, margin: '0 0 20px', fontSize: 20, fontWeight: 700 }}>Security Center</h3>
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
          <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', padding: 14, borderRadius: 8, fontWeight: 700, cursor: 'pointer', marginTop: 10 }}>
            {loading ? 'Updating Security...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

const lblStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }
const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(150,150,150,0.2)', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'transparent', color: 'inherit' }

const StatCard = ({ title, value, color = '#10b981', highlight, cardBg, textPrimary, border }) => (
  <div className="stat-card" style={{ background: cardBg, backdropFilter:'blur(12px)', border: highlight ? `2px solid ${color}` : `1px solid ${border}`, borderRadius: 16, padding: 24, boxShadow: highlight ? `0 0 24px ${color}22` : 'none' }}>
    <div style={{ fontSize: 12, color: highlight ? color : '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{title}</div>
    <div style={{ fontSize: 38, fontWeight: 800, color: highlight ? color : textPrimary }}>{value ?? '—'}</div>
  </div>
)
