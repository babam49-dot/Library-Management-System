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

  // Metadata Forms
  const [authorForm, setAuthorForm] = useState({ FirstName: '', LastName: '', Bio: '', Nationality: '' })
  const [categoryForm, setCategoryForm] = useState({ CategoryName: '', Description: '' })
  const [publisherForm, setPublisherForm] = useState({ PublisherName: '', Email: '', Phone: '', Address: '' })
  const [metaMsg, setMetaMsg] = useState('')

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
      const pubs = await axios.get(`${API}/catalog/publishers`, getHeaders())
      setPublishers(pubs.data.data)
      const cats = await axios.get(`${API}/catalog/categories`, getHeaders())
      setCategories(cats.data.data)
      const auths = await axios.get(`${API}/catalog/authors`, getHeaders())
      setAuthors(auths.data.data)
      const borrows = await axios.get(`${API}/staff/borrowing-records`, getHeaders())
      setBorrowingRecords(borrows.data.data)
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

  const TABS = [
    { key: 'overview', label: 'Circulation Overview', icon: '📊' },
    { key: 'members', label: 'Member Approvals', icon: '👤', badge: pendingMembers.length },
    { key: 'catalog', label: 'Register Book', icon: '📚' },
    { key: 'metadata', label: 'Manage Metadata', icon: '🏷️' },
    { key: 'circulation', label: 'Issue / Return', icon: '🔄' },
  ]
  const tabLabel = TABS.find(t => t.key === tab)?.label || 'Staff Dashboard'

  return (
    <DashboardShell role="staff" navItems={TABS} activeTab={tab} setTab={setTab} user={user} logout={logout} tabLabel={tabLabel}>

      {tab === 'overview' && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          <StatCard title="Active Borrows" value={stats.activeBorrowings} color="#10b981" />
          <StatCard title="Returns Today" value={stats.returnsToday} color="#3b82f6" />
          <StatCard title="Overdue Books" value={stats.overdueCount} color="#ef4444" highlight={stats.overdueCount > 0} />
          <StatCard title="Pending Members" value={stats.pendingMembers} color="#f59e0b" highlight={stats.pendingMembers > 0} />
        </div>
      )}

      {tab === 'members' && (
        <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter:'blur(12px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontWeight: 600, color: '#f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span>Pending Member Registrations</span>
            <span style={{ fontSize:13, color:'#64748b' }}>{pendingMembers.length} pending</span>
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
                  <tr key={m.UserID} className="table-row" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: 16, fontWeight: 600, color: '#f1f5f9' }}>{m.FullName}</td>
                    <td style={{ padding: 16, color: '#64748b' }}>{m.Email}</td>
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
        <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter:'blur(12px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: 32, maxWidth: 800 }}>
          <p style={{ color: '#64748b', marginBottom: 20, fontSize:14 }}>Upload a new book to the library catalog, linking categories and assigning shelf locations.</p>
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
          <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter:'blur(12px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: 24 }}>
            <h3 style={{ color: '#f1f5f9', marginBottom: 16 }}>Manage Categories</h3>
            <form onSubmit={(e) => handleAddMeta(e, 'categories', categoryForm, setCategoryForm, {CategoryName:'', Description:''})} style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <input required type="text" placeholder="Category Name" value={categoryForm.CategoryName} onChange={e => setCategoryForm({...categoryForm, CategoryName: e.target.value})} style={inputStyle} />
              <input type="text" placeholder="Description" value={categoryForm.Description} onChange={e => setCategoryForm({...categoryForm, Description: e.target.value})} style={inputStyle} />
              <button type="submit" style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>Add Category</button>
            </form>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead><tr style={{ color: '#64748b' }}><th style={{ padding: 12 }}>Name</th><th style={{ padding: 12 }}>Description</th></tr></thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c.CategoryID} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: '#f1f5f9' }}>
                    <td style={{ padding: 12 }}>{c.CategoryName}</td>
                    <td style={{ padding: 12, color: '#94a3b8' }}>{c.Description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Authors */}
          <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter:'blur(12px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: 24 }}>
            <h3 style={{ color: '#f1f5f9', marginBottom: 16 }}>Manage Authors</h3>
            <form onSubmit={(e) => handleAddMeta(e, 'authors', authorForm, setAuthorForm, {FirstName:'', LastName:'', Bio:'', Nationality:''})} style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <input required type="text" placeholder="First Name" value={authorForm.FirstName} onChange={e => setAuthorForm({...authorForm, FirstName: e.target.value})} style={{...inputStyle, flex:1, minWidth:120}} />
              <input required type="text" placeholder="Last Name" value={authorForm.LastName} onChange={e => setAuthorForm({...authorForm, LastName: e.target.value})} style={{...inputStyle, flex:1, minWidth:120}} />
              <input type="text" placeholder="Nationality" value={authorForm.Nationality} onChange={e => setAuthorForm({...authorForm, Nationality: e.target.value})} style={{...inputStyle, flex:1, minWidth:120}} />
              <input type="text" placeholder="Bio" value={authorForm.Bio} onChange={e => setAuthorForm({...authorForm, Bio: e.target.value})} style={{...inputStyle, flex:2, minWidth:200}} />
              <button type="submit" style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Add Author</button>
            </form>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead><tr style={{ color: '#64748b' }}><th style={{ padding: 12 }}>Name</th><th style={{ padding: 12 }}>Nationality</th><th style={{ padding: 12, textAlign: 'right' }}>Actions</th></tr></thead>
              <tbody>
                {authors.map(a => (
                  <tr key={a.AuthorID} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: '#f1f5f9' }}>
                    <td style={{ padding: 12 }}>{a.Name}</td>
                    <td style={{ padding: 12, color: '#94a3b8' }}>{a.Nationality || '—'}</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      <button onClick={() => handleDeleteMeta('authors', a.AuthorID)} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Publishers */}
          <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter:'blur(12px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: 24 }}>
            <h3 style={{ color: '#f1f5f9', marginBottom: 16 }}>Manage Publishers</h3>
            <form onSubmit={(e) => handleAddMeta(e, 'publishers', publisherForm, setPublisherForm, {PublisherName:'', Email:'', Phone:'', Address:''})} style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <input required type="text" placeholder="Publisher Name" value={publisherForm.PublisherName} onChange={e => setPublisherForm({...publisherForm, PublisherName: e.target.value})} style={{...inputStyle, flex:2, minWidth:200}} />
              <input type="email" placeholder="Email" value={publisherForm.Email} onChange={e => setPublisherForm({...publisherForm, Email: e.target.value})} style={{...inputStyle, flex:1, minWidth:150}} />
              <input type="text" placeholder="Phone" value={publisherForm.Phone} onChange={e => setPublisherForm({...publisherForm, Phone: e.target.value})} style={{...inputStyle, flex:1, minWidth:120}} />
              <button type="submit" style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Add Publisher</button>
            </form>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead><tr style={{ color: '#64748b' }}><th style={{ padding: 12 }}>Name</th><th style={{ padding: 12 }}>Email</th><th style={{ padding: 12 }}>Phone</th></tr></thead>
              <tbody>
                {publishers.map(p => (
                  <tr key={p.PublisherID} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: '#f1f5f9' }}>
                    <td style={{ padding: 12 }}>{p.PublisherName}</td>
                    <td style={{ padding: 12, color: '#94a3b8' }}>{p.ContactEmail || '—'}</td>
                    <td style={{ padding: 12, color: '#94a3b8' }}>{p.Phone || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'circulation' && (
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap:'wrap' }}>
          <div style={{ flex: 1, minWidth:280, background: 'rgba(255,255,255,0.05)', backdropFilter:'blur(12px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: 28 }}>
            <h3 style={{ fontSize: 18, marginBottom: 4, color:'#f1f5f9', fontWeight:700 }}>📤 Issue Book</h3>
            <p style={{ color:'#64748b', fontSize:13, marginBottom:20 }}>Issue a book copy to a member</p>
            <form onSubmit={handleIssue} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lblStyle}>Member ID</label>
                <input required type="number" value={issueForm.memberId} onChange={e => setIssueForm({...issueForm, memberId: e.target.value})} style={inputStyle} placeholder="Numeric Member ID" />
              </div>
              <div>
                <label style={lblStyle}>Copy ID</label>
                <input required type="number" value={issueForm.copyId} onChange={e => setIssueForm({...issueForm, copyId: e.target.value})} style={inputStyle} placeholder="Specific Copy ID" />
              </div>
              <button type="submit" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', padding: '12px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', boxShadow:'0 4px 16px rgba(16,185,129,0.25)' }}>Issue Book →</button>
            </form>
          </div>

          <div style={{ flex: 1, minWidth:280, background: 'rgba(255,255,255,0.05)', backdropFilter:'blur(12px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: 28 }}>
            <h3 style={{ fontSize: 18, marginBottom: 4, color:'#f1f5f9', fontWeight:700 }}>📥 Process Return</h3>
            <p style={{ color:'#64748b', fontSize:13, marginBottom:20 }}>Record a book return and log its condition</p>
            <form onSubmit={handleReturn} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lblStyle}>Borrow ID</label>
                <input required type="number" value={returnForm.borrowId} onChange={e => setReturnForm({...returnForm, borrowId: e.target.value})} style={inputStyle} placeholder="Borrow Record ID" />
              </div>
              <div>
                <label style={lblStyle}>Condition on Return</label>
                <select value={returnForm.condition} onChange={e => setReturnForm({...returnForm, condition: e.target.value})} style={inputStyle}>
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

    </DashboardShell>
  )
}

const lblStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }
const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.08)', color: '#f1f5f9' }

const StatCard = ({ title, value, color = '#10b981', highlight }) => (
  <div className="stat-card" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter:'blur(12px)', border: highlight ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, boxShadow: highlight ? `0 0 24px ${color}22` : 'none' }}>
    <div style={{ fontSize: 12, color: highlight ? color : '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{title}</div>
    <div style={{ fontSize: 38, fontWeight: 800, color: highlight ? color : '#f1f5f9' }}>{value ?? '—'}</div>
  </div>
)
