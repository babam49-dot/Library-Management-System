import React, { useEffect, useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import DashboardShell from '../components/DashboardShell'
import BookCard from '../components/BookCard'
import axios from 'axios'
import Barcode from 'react-barcode'
import BubblePopup from '../components/BubblePopup'

const API = 'http://localhost:4000/api'

export default function StaffDashboard() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const { isDark } = useTheme()
  const [stats, setStats] = useState(null)
  const [borrowingRecords, setBorrowingRecords] = useState([])
  const [tab, setTab] = useState(location.state?.tab || 'overview')

  useEffect(() => {
    if (location.state?.tab) {
      setTab(location.state.tab);
    }
  }, [location.state]);

  useEffect(() => {
    setSearchQuery('');
  }, [tab]);
  
  // Catalog Form States
  const [bookForm, setBookForm] = useState({ 
    title: '', isbn: '', year: '', edition: '', language: 'English', description: '',
    publisherId: '', categoryId: '', authorIds: [], numberOfCopies: 1, shelfLocation: ''
  })
  const [coverFile, setCoverFile] = useState(null)
  const [bookLoading, setBookLoading] = useState(false)
  const [bookMsg, setBookMsg] = useState('')
  const [registerStep, setRegisterStep] = useState(1)
  const fileInputRef = useRef(null)

  // Dropdown Data
  const [publishers, setPublishers] = useState([])
  const [categories, setCategories] = useState([])
  const [authors, setAuthors] = useState([])

  // Action States
  const [issueForm, setIssueForm] = useState({ memberId: '', copyId: '' })
  const [returnForm, setReturnForm] = useState({ borrowId: '', condition: 'Good', imageBase64: '' })
  const [issueMsg, setIssueMsg] = useState('')
  const [returnMsg, setReturnMsg] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [allBooks, setAllBooks] = useState([])

  // ── Staff self-borrowing ─────────────────────────────────────────────────
  const [myBorrowCart, setMyBorrowCart] = useState([])
  const [myBorrows, setMyBorrows] = useState([])
  const [myBorrowMsg, setMyBorrowMsg] = useState({ text: '', ok: true })
  const [myBorrowLoading, setMyBorrowLoading] = useState(false)
  const [myBorrowCat, setMyBorrowCat] = useState('')

  // Metadata Forms
  const [authorForm, setAuthorForm] = useState({ FirstName: '', LastName: '', Bio: '', Nationality: '' })
  const [categoryForm, setCategoryForm] = useState({ CategoryName: '', Description: '' })
  const [publisherForm, setPublisherForm] = useState({ PublisherName: '', Email: '', Phone: '', Address: '' })
  const [categoryMsg, setCategoryMsg] = useState('')
  const [authorMsg, setAuthorMsg] = useState('')
  const [publisherMsg, setPublisherMsg] = useState('')
  const [editModal, setEditModal] = useState(null)
  
  const [barcodesModal, setBarcodesModal] = useState(null)
  const [bookCopies, setBookCopies] = useState([])

  // ── Barcode / ISBN Lookup ─────────────────────────────────────────────────
  const [isbnInput, setIsbnInput] = useState('')
  const [isbnLoading, setIsbnLoading] = useState(false)
  const [isbnMsg, setIsbnMsg] = useState({ text: '', ok: true })
  const [isbnPreview, setIsbnPreview] = useState(null) // fetched book data
  const barcodeFileRef = useRef(null)

  const getHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('lms_token')}` } })

  const openBarcodes = async (book) => {
    try {
      const res = await axios.get(`${API}/catalog/books/${book.BookID}/copies`, getHeaders())
      setBookCopies(res.data.data || [])
      setBarcodesModal(book)
    } catch (e) {
      // ignore
    }
  }

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
      try {
        const myB = await axios.get(`${API}/borrowing/my`, getHeaders())
        setMyBorrows(myB.data.data?.records || myB.data.data || [])
      } catch (_) {}
    } catch (err) { console.error(err) }
  }

  useEffect(() => { fetchData() }, [])


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
      if (coverFile) {
        fd.append('coverImage', coverFile)
      } else if (isbnPreview?.coverUrl) {
        fd.append('coverImage', isbnPreview.coverUrl)
      }

      const headers = {
        ...getHeaders().headers,
        'Content-Type': 'multipart/form-data'
      }

      await axios.post(`${API}/books`, fd, { headers })
      setBookMsg('Book and copies added successfully!')
      setRegisterStep(1)
      setBookForm({ 
        title: '', isbn: '', year: '', edition: '', language: 'English', description: '',
        publisherId: '', categoryId: '', authorIds: [], numberOfCopies: 1, shelfLocation: ''
      })
      setCoverFile(null)
      setIsbnPreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      fetchData()
    } catch (err) {
      setBookMsg('Error: ' + (err.response?.data?.message || err.message))
    } finally {
      setBookLoading(false)
    }
  }

  // ── ISBN / Barcode Lookup logic ───────────────────────────────────────────
  const lookupIsbn = async (isbn) => {
    const clean = (isbn || isbnInput).replace(/[^0-9X]/gi, '')
    if (!clean || (clean.length !== 10 && clean.length !== 13)) {
      setIsbnMsg({ text: 'Enter a valid 10 or 13-digit ISBN.', ok: false })
      return
    }
    setIsbnLoading(true)
    setIsbnMsg({ text: '', ok: true })
    setIsbnPreview(null)
    try {
      const res = await axios.get(`${API}/catalog/isbn-lookup/${clean}`, getHeaders())
      const d = res.data.data
      setIsbnPreview(d)
      setIsbnMsg({ text: `✅ Book found via ${d.source === 'openlibrary' ? 'Open Library' : 'Google Books'}! Fields auto-filled. Redirecting to details...`, ok: true })
      
      // Refresh options to include any auto-registered publisher, category, or authors
      await fetchData()

      setBookForm(prev => ({
        ...prev,
        title:       d.title        || prev.title,
        isbn:        d.isbn         || prev.isbn,
        year:        d.year         ? String(d.year) : prev.year,
        edition:     d.edition      || prev.edition,
        language:    d.language     || prev.language,
        description: d.description  || prev.description,
        publisherId: d.publisherId  ? String(d.publisherId) : prev.publisherId,
        categoryId:  d.categoryId   ? String(d.categoryId) : prev.categoryId,
        authorIds:   d.authorIds    ? d.authorIds.map(String) : prev.authorIds
      }))
      setTimeout(() => {
        setRegisterStep(2)
      }, 1000)
    } catch (err) {
      const msg = err.response?.data?.message || 'ISBN not found in external databases. Fill manually.'
      setIsbnMsg({ text: msg, ok: false })
    } finally {
      setIsbnLoading(false)
    }
  }

  const handleBarcodeImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    // Try native BarcodeDetector first (Chrome 83+)
    if ('BarcodeDetector' in window) {
      try {
        const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e'] })
        const bitmap = await createImageBitmap(file)
        const codes = await detector.detect(bitmap)
        if (codes.length > 0) {
          const raw = codes[0].rawValue
          setIsbnInput(raw)
          await lookupIsbn(raw)
          return
        }
      } catch (_) {}
    }
    // Fallback: read as data URL and try to extract from filename
    const nameMatch = file.name.replace(/[^0-9X]/gi, '')
    if (nameMatch.length === 13 || nameMatch.length === 10) {
      setIsbnInput(nameMatch)
      await lookupIsbn(nameMatch)
      return
    }
    setIsbnMsg({ text: 'Could not auto-detect ISBN from image. Please type the ISBN number below.', ok: false })
  }

  const handleIssue = async (e) => {
    e.preventDefault()
    setIssueMsg('')
    try {
      await axios.post(`${API}/staff/borrow`, issueForm, getHeaders())
      setIssueMsg('Book issued successfully!')
      setIssueForm({ memberId: '', copyId: '' })
      fetchData()
    } catch (err) {
      setIssueMsg('Error: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleReturnImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setReturnForm({ ...returnForm, imageBase64: ev.target.result });
    };
    reader.readAsDataURL(file);
  }

  const handleReturn = async (e) => {
    e.preventDefault()
    setReturnMsg('')
    try {
      const res = await axios.post(`${API}/staff/return`, returnForm, getHeaders())
      setReturnMsg(res.data.data.fineCreated ? 'Returned. Fine applied.' : 'Returned successfully!')
      setReturnForm({ borrowId: '', condition: 'Good', imageBase64: '' })
      fetchData()
    } catch (err) {
      setReturnMsg('Error: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleAddMeta = async (e, type, form, setForm, initial, setMsg) => {
    e.preventDefault()
    setMsg('')
    try {
      await axios.post(`${API}/catalog/${type}`, form, getHeaders())
      setMsg(`Added successfully!`)
      setForm(initial)
      fetchData()
    } catch (err) { setMsg('Error: ' + (err.response?.data?.message || err.message)) }
  }

  const handleDeleteMeta = async (type, id, setMsg) => {
    if (!window.confirm('Delete this record?')) return
    setMsg('')
    try {
      await axios.delete(`${API}/catalog/${type}/${id}`, getHeaders())
      setMsg(`Deleted successfully!`)
      fetchData()
    } catch (err) { setMsg('Error: ' + (err.response?.data?.message || err.message)) }
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


  // ── Staff self-borrow handlers ───────────────────────────────────────────
  const addToMyCart = (book) => {
    const copyId = String(book.AvailableCopyIds || '').split(',').filter(Boolean)[0]
    if (!copyId) return setMyBorrowMsg({ text: '⚠️ No available copies right now.', ok: false })
    if (myBorrowCart.some(i => i.copyId === Number(copyId)))
      return setMyBorrowMsg({ text: 'Already in your borrow list.', ok: false })
    setMyBorrowCart(prev => [...prev, { bookId: book.BookID, copyId: Number(copyId), title: book.Title, authors: book.Authors }])
    setMyBorrowMsg({ text: '✅ "' + book.Title + '" added to borrow list.', ok: true })
    setTimeout(() => setMyBorrowMsg({ text: '', ok: true }), 3000)
  }
  const removeFromMyCart = (copyId) => setMyBorrowCart(prev => prev.filter(i => i.copyId !== copyId))
  const submitMyBorrow = async () => {
    if (!myBorrowCart.length) return setMyBorrowMsg({ text: 'Add at least one book first.', ok: false })
    setMyBorrowLoading(true)
    setMyBorrowMsg({ text: '', ok: true })
    try {
      const res = await axios.post(`${API}/borrowing/request`, { copyIds: myBorrowCart.map(i => i.copyId) }, getHeaders())
      const code = res.data.data?.requestCode || res.data.requestCode || ''
      setMyBorrowMsg({ text: '✅ Submitted! Show code "' + code + '" to an Admin at the desk.', ok: true })
      setMyBorrowCart([])
      fetchData()
    } catch (err) {
      setMyBorrowMsg({ text: 'Error: ' + (err.response?.data?.message || err.message), ok: false })
    } finally { setMyBorrowLoading(false) }
  }
  const retractMyBorrow = async (borrowId) => {
    if (!window.confirm('Retract this pending borrow request?')) return
    try {
      await axios.delete(`${API}/member/borrows/${borrowId}/retract`, getHeaders())
      setMyBorrowMsg({ text: '✅ Request retracted. Copy is available again.', ok: true })
      fetchData()
    } catch (err) { setMyBorrowMsg({ text: 'Error: ' + (err.response?.data?.message || err.message), ok: false }) }
  }

  const reserveForMyself = async (book) => {
    try {
      const res = await axios.post(`${API}/staff/self-reserve`, { bookId: book.BookID }, getHeaders())
      setMyBorrowMsg({ text: '✅ ' + res.data.message, ok: true })
      setTimeout(() => setMyBorrowMsg({ text: '', ok: true }), 5000)
      fetchData()
    } catch (err) {
      setMyBorrowMsg({ text: 'Error: ' + (err.response?.data?.message || err.message), ok: false })
      setTimeout(() => setMyBorrowMsg({ text: '', ok: true }), 4000)
    }
  }

  const joinMyWaitlist = (book) => {
    reserveForMyself(book)
  }

  const pendingMyBorrows = Array.isArray(myBorrows) ? myBorrows.filter(b => (b.status || b.Status) === 'Pending').length : 0
  const TABS = [
    { key: 'overview', label: 'Circulation Overview', icon: '📊', path: '/staff' },
    { key: 'myborrow', label: 'My Borrowing', icon: '📖', path: '/staff', badge: pendingMyBorrows },
    { key: 'browse', label: 'Browse Catalog', icon: '📚', path: '/staff' },
    { key: 'catalog', label: 'Register Book', icon: '➕', path: '/staff' },
    { key: 'metadata', label: 'Manage Metadata', icon: '🏷️', path: '/staff' },
    { key: 'fines', label: 'Fine Payments', icon: '💰', path: '/staff' },
    { key: 'desk', label: 'Librarian Desk', icon: '🖥️', path: '/desk' },
    { key: 'reservations', label: 'Reservations', icon: '📋', path: '/reservations' },
    { key: 'overdue', label: 'Overdue Books', icon: '⚠️', path: '/overdue' },
    { key: 'profile', label: 'My Profile', icon: '👤', path: '/staff' },
    { key: 'payments', label: 'Payment History', icon: '🧾', path: '/staff' },
  ]
  const tabLabel = TABS.find(t => t.key === tab)?.label || 'Staff Dashboard'

  const handleNav = (targetTab) => {
    const item = TABS.find(t => t.key === targetTab);
    if (item && item.path && item.path !== location.pathname) {
      navigate(item.path, { state: { tab: item.key } });
    } else {
      setTab(targetTab);
    }
  };

  return (
    <DashboardShell role="staff" navItems={TABS} activeTab={tab} setTab={setTab} user={user} logout={logout} tabLabel={tabLabel} searchQuery={searchQuery} setSearchQuery={setSearchQuery}>

      {tab === 'overview' && stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <style>{`
            @keyframes overviewIn { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
            @keyframes countUp { from{opacity:0;transform:scale(0.6)} to{opacity:1;transform:scale(1)} }
            .ov-card { animation: overviewIn .4s ease both; transition: transform .2s, box-shadow .2s; cursor: default; }
            .ov-card:hover { transform: translateY(-5px); box-shadow: 0 18px 40px rgba(0,0,0,0.18) !important; }
            .ov-action-btn { transition: all .18s ease; border: none; cursor: pointer; font-weight: 700; border-radius: 9px; }
            .ov-action-btn:hover { filter: brightness(1.12); transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.18); }
            .ov-action-btn:active { transform: scale(0.96); }
          `}</style>

          {/* ── Key Metrics Row ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            {[
              { label: 'Active Borrows',  value: stats.activeBorrowings,  color: '#10b981', icon: '📖', note: 'Currently checked out', tab: 'desk' },
              { label: 'Returns Today',   value: stats.returnsToday,       color: '#3b82f6', icon: '↩️', note: 'Processed today',       tab: null },
              { label: 'Overdue Books',   value: stats.overdueCount,       color: '#ef4444', icon: '📚', note: 'Past due date',         tab: 'overdue', alert: stats.overdueCount > 0 },
              { label: 'Pending Members', value: stats.pendingMembers,     color: '#f59e0b', icon: '👤', note: 'Awaiting approval',     tab: null, alert: stats.pendingMembers > 0 },
            ].map(({ label, value, color, icon, note, tab: goTab, alert }, i) => (
              <div
                key={label}
                className="ov-card"
                onClick={() => goTab && handleNav(goTab)}
                style={{
                  animationDelay: `${i * 0.07}s`,
                  background: cardBg,
                  border: alert ? `2px solid ${color}` : `1px solid ${border}`,
                  borderRadius: 14,
                  padding: '16px 18px',
                  boxShadow: alert ? `0 0 22px ${color}33` : '0 2px 8px rgba(0,0,0,0.06)',
                  cursor: goTab ? 'pointer' : 'default',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: alert ? color : textMuted, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: alert ? color : textPrimary, lineHeight: 1 }}>{value ?? '—'}</div>
                    <div style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>{note}</div>
                  </div>
                  <div style={{ fontSize: 24, opacity: 0.75 }}>{icon}</div>
                </div>
                {goTab && (
                  <div style={{ marginTop: 10, fontSize: 11, color, fontWeight: 700 }}>
                    View → 
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Quick Actions ── */}
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: textMuted, marginBottom: 12 }}>Quick Actions</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {[
                { label: '➕ Register Book',    color: '#10b981', bg: 'rgba(16,185,129,0.1)', target: 'catalog' },
                { label: '📖 My Borrowing',      color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  target: 'myborrow', badge: pendingMyBorrows > 0 ? pendingMyBorrows : null },
                { label: '📋 Librarian Desk',   color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', target: 'desk' },
                { label: '📚 Browse Catalog',   color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', target: 'browse' },
                { label: '🏷️ Manage Metadata', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', target: 'metadata' },
                { label: '📋 Reservations',     color: '#06b6d4', bg: 'rgba(6,182,212,0.1)',  target: 'reservations' },
                { label: '⚠️ Overdue List',     color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  target: 'overdue', badge: stats.overdueCount > 0 ? stats.overdueCount : null },
              ].map(({ label, color, bg, target, badge }) => (
                <button
                  key={target}
                  className="ov-action-btn"
                  onClick={() => handleNav(target)}
                  style={{ background: bg, color, padding: '8px 16px', fontSize: 13, position: 'relative' }}
                >
                  {label}
                  {badge && (
                    <span style={{ position: 'absolute', top: -5, right: -5, background: color, color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Recent Borrowings preview ── */}
          {borrowingRecords.length > 0 && (
            <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: textPrimary }}>📋 Recent Activity</div>
                <button onClick={() => handleNav('desk')} className="ov-action-btn" style={{ background: 'none', color: '#3b82f6', fontSize: 12, padding: '4px 10px', border: '1px solid rgba(59,130,246,0.3)' }}>
                  View All
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: tableHead }}>
                      {['Member', 'Book', 'Status', 'Due Date'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: textMuted, textTransform: 'uppercase', letterSpacing: 0.6 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {borrowingRecords.slice(0, 5).map((r, i) => {
                      const isOD = r.Status === 'Overdue'
                      return (
                        <tr key={i} className="table-row" style={{ borderTop: `1px solid ${border}` }}>
                          <td style={{ padding: '10px 14px', fontSize: 13, color: textPrimary, fontWeight: 600 }}>{r.MemberName || r.MemberID}</td>
                          <td style={{ padding: '10px 14px', fontSize: 13, color: textMuted }}>{r.Title}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ background: isOD ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: isOD ? '#ef4444' : '#10b981', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                              {r.Status}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: 12, color: isOD ? '#ef4444' : textMuted, fontWeight: isOD ? 700 : 400 }}>
                            {r.DueDate ? new Date(r.DueDate).toLocaleDateString() : '�'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'browse' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <style>{`
            @keyframes browseIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
            .br-cart { animation: browseIn 0.3s ease both; }
          `}</style>

          {/* Cart summary banner */}
          {myBorrowCart.length > 0 && (
            <div className="br-cart" style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(5,150,105,0.07))', border: '2px solid rgba(16,185,129,0.45)', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 20 }}>🛒</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: '#065f46', fontSize: 14 }}>Borrow Cart — {myBorrowCart.length} book{myBorrowCart.length !== 1 ? 's' : ''} selected</div>
                <div style={{ fontSize: 12, color: '#047857', marginTop: 2 }}>{myBorrowCart.map(i => i.title).join(', ')}</div>
              </div>
              <button onClick={() => setTab('myborrow')} style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 9, fontWeight: 700, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}>
                Review & Submit →
              </button>
            </div>
          )}

          {/* Message banner */}
          {myBorrowMsg.text && (
            <div style={{ padding: '11px 16px', borderRadius: 10, fontWeight: 700, fontSize: 13, background: myBorrowMsg.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: myBorrowMsg.ok ? '#065f46' : '#991b1b', border: `1px solid ${myBorrowMsg.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, display: 'flex', justifyContent: 'space-between' }}>
              <span>{myBorrowMsg.text}</span>
              <button onClick={() => setMyBorrowMsg({ text: '', ok: true })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 900, color: 'inherit' }}>✕</button>
            </div>
          )}

          {/* Category filter tabs */}
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6, scrollbarWidth: 'none' }}>
            <button onClick={() => setSearchQuery('')} style={{ padding: '7px 18px', borderRadius: 20, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', background: !searchQuery ? '#10b981' : isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0', color: !searchQuery ? '#fff' : textMuted, transition: 'all 0.2s', flexShrink: 0 }}>All Books</button>
            {[...new Set(allBooks.map(b => b.CategoryName).filter(Boolean))].sort().map(cat => (
              <button key={cat} onClick={() => setSearchQuery(cat)} style={{ padding: '7px 18px', borderRadius: 20, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', background: searchQuery === cat ? '#10b981' : isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0', color: searchQuery === cat ? '#fff' : textMuted, transition: 'all 0.2s', flexShrink: 0 }}>{cat}</button>
            ))}
          </div>

          {/* Books grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {allBooks.filter(b => {
              if (!searchQuery) return true;
              const q = searchQuery.toLowerCase();
              return b.Title?.toLowerCase().includes(q) || b.Authors?.toLowerCase().includes(q) || b.CategoryName?.toLowerCase().includes(q);
            }).map((b, i) => (
              <BookCard
                key={b.BookID}
                book={b}
                isDark={isDark}
                showActions="staff-browse"
                onBorrow={addToMyCart}
                onReserve={reserveForMyself}
                onWaitlist={joinMyWaitlist}
                onBarcodes={openBarcodes}
                index={i}
                detailLink={false}
              />
            ))}
            {allBooks.filter(b => {
              if (!searchQuery) return true;
              const q = searchQuery.toLowerCase();
              return b.Title?.toLowerCase().includes(q) || b.Authors?.toLowerCase().includes(q) || b.CategoryName?.toLowerCase().includes(q);
            }).length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: textMuted }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>No books found</div>
                <div style={{ fontSize: 13 }}>Try a different search or category.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Member approval is Admin-only � not shown here */}

      {tab === 'catalog' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxWidth: 800 }}>
          <style>{`
            @keyframes stepIn { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
            .wiz-step { animation: stepIn .3s ease both; }
            .wiz-field input, .wiz-field select, .wiz-field textarea {
              width: 100%; padding: 10px 14px; border-radius: 10px; font-size: 14px; outline: none; box-sizing: border-box;
              border: 1px solid ${border}; background: ${cardBg}; color: ${textPrimary};
              transition: border-color .2s, box-shadow .2s;
            }
            .wiz-field input:focus, .wiz-field select:focus, .wiz-field textarea:focus {
              border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.12);
            }
            .wiz-btn-primary { background: linear-gradient(135deg,#10b981,#059669); color:#fff; border:none; padding:11px 24px; border-radius:10px; font-weight:800; font-size:14px; cursor:pointer; transition:all .2s; }
            .wiz-btn-primary:hover { filter:brightness(1.1); transform:translateY(-2px); box-shadow:0 8px 20px rgba(16,185,129,0.3); }
            .wiz-btn-primary:active { transform:scale(0.97); }
            .wiz-btn-secondary { background: ${isDark?'rgba(255,255,255,0.07)':'#f1f5f9'}; color:${textMuted}; border:none; padding:11px 20px; border-radius:10px; font-weight:700; font-size:13px; cursor:pointer; transition:all .2s; }
            .wiz-btn-secondary:hover { filter:brightness(1.08); transform:translateY(-1px); }
          `}</style>

          {/* ── Step Breadcrumb ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
            {[
              { n: 1, label: 'Scan / ISBN' },
              { n: 2, label: 'Book Details' },
              { n: 3, label: 'Confirm & Save' },
            ].map(({ n, label }, i) => {
              const done = registerStep > n
              const active = registerStep === n
              return (
                <React.Fragment key={n}>
                  <button
                    onClick={() => n < registerStep && setRegisterStep(n)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      background: 'none', border: 'none', cursor: n < registerStep ? 'pointer' : 'default', padding: '0 4px'
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 900, fontSize: 14,
                      background: done ? '#10b981' : active ? 'linear-gradient(135deg,#10b981,#059669)' : isDark ? '#1e2334' : '#e2e8f0',
                      color: (done || active) ? '#fff' : textMuted,
                      boxShadow: active ? '0 0 0 4px rgba(16,185,129,0.2)' : 'none',
                      transition: 'all .3s'
                    }}>
                      {done ? '✓' : n}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: active ? 800 : 600, color: active ? '#10b981' : textMuted, whiteSpace: 'nowrap' }}>{label}</div>
                  </button>
                  {i < 2 && <div style={{ flex: 1, height: 2, background: done ? '#10b981' : isDark ? '#1e2334' : '#e2e8f0', transition: 'background .4s', marginBottom: 20, borderRadius: 2 }} />}
                </React.Fragment>
              )
            })}
          </div>

          {/* ── Step 1: Scan ── */}
          {registerStep === 1 && (
            <div className="wiz-step" style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 26 }}>📷</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: textPrimary }}>Scan or Enter ISBN</div>
                  <div style={{ fontSize: 12, color: textMuted }}>Upload a barcode image, or type the ISBN. Fields auto-fill from the internet.</div>
                </div>
              </div>

              {/* Drag-drop zone */}
              <label
                htmlFor="barcode-upload"
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                  border: `2px dashed ${isDark?'#10b981':'#059669'}`, borderRadius: 12, padding: '28px 16px',
                  background: isDark ? 'rgba(16,185,129,0.04)' : 'rgba(5,150,105,0.04)',
                  cursor: 'pointer', transition: 'background .2s'
                }}
              >
                <span style={{ fontSize: 32 }}>{isbnLoading ? '⏳' : '🖼️'}</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: isDark?'#34d399':'#065f46' }}>
                  {isbnLoading ? 'Scanning barcode...' : 'Click or drop a barcode image here'}
                </div>
                <div style={{ fontSize: 11, color: textMuted }}>Supports EAN-13, EAN-8, Code-128, UPC</div>
                <input id="barcode-upload" type="file" accept="image/*" ref={barcodeFileRef} onChange={handleBarcodeImageUpload} style={{ display: 'none' }} />
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 1, background: border }} />
                <span style={{ fontSize: 12, color: textMuted, fontWeight: 700 }}>OR TYPE ISBN</span>
                <div style={{ flex: 1, height: 1, background: border }} />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <div className="wiz-field" style={{ flex: 1 }}>
                  <input
                    type="text" placeholder="e.g. 9780140449136"
                    value={isbnInput} onChange={e => setIsbnInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), lookupIsbn())}
                  />
                </div>
                <button
                  type="button" onClick={() => lookupIsbn()} disabled={isbnLoading}
                  className="wiz-btn-primary" style={{ flexShrink: 0, opacity: isbnLoading ? 0.7 : 1 }}
                >
                  {isbnLoading ? '⏳ Looking up...' : '🔍 Lookup'}
                </button>
              </div>

              {isbnMsg.text && (
                <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  background: isbnMsg.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: isbnMsg.ok ? '#10b981' : '#ef4444',
                  border: `1px solid ${isbnMsg.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                }}>
                  {isbnMsg.text}
                </div>
              )}

              {isbnPreview && (
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: isDark?'rgba(16,185,129,0.06)':'rgba(5,150,105,0.06)', borderRadius: 12, padding: 14 }}>
                  {isbnPreview.coverUrl && <img src={isbnPreview.coverUrl} alt="cover" style={{ width: 60, height: 88, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />}
                  <div style={{ fontSize: 13, color: textPrimary, lineHeight: 1.7 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: isDark?'#34d399':'#065f46' }}>{isbnPreview.title}</div>
                    {isbnPreview.authors?.length > 0 && <div>✍️ {isbnPreview.authors.join(', ')}</div>}
                    {isbnPreview.publisher && <div>🏢 {isbnPreview.publisher}</div>}
                    {isbnPreview.year && <div>📅 {isbnPreview.year}</div>}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <div style={{ fontSize: 12, color: textMuted }}>
                  ISBN not found? No problem � fill details manually.
                </div>
                <button type="button" className="wiz-btn-primary" onClick={() => setRegisterStep(2)}>
                  Fill Details →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Book Details ── */}
          {registerStep === 2 && (
            <div className="wiz-step" style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: 24 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: textPrimary, marginBottom: 18 }}>
                📝 {isbnPreview ? `Review details for "${isbnPreview.title}"` : 'Enter Book Details'}
              </div>
              <form id="book-details-form" onSubmit={e => { e.preventDefault(); setRegisterStep(3) }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="wiz-field" style={{ gridColumn: 'span 2' }}>
                  <label style={lblStyle}>Book Title *</label>
                  <input required type="text" name="title" value={bookForm.title} onChange={handleBookChange} placeholder="Enter book title" />
                </div>
                <div className="wiz-field">
                  <label style={lblStyle}>ISBN</label>
                  <input type="text" name="isbn" value={bookForm.isbn} onChange={handleBookChange} placeholder="e.g. 9780140449136" />
                </div>
                <div className="wiz-field">
                  <label style={lblStyle}>Publication Year</label>
                  <input type="number" name="year" value={bookForm.year} onChange={handleBookChange} placeholder="e.g. 2019" />
                </div>
                <div className="wiz-field">
                  <label style={lblStyle}>Publisher</label>
                  <select name="publisherId" value={bookForm.publisherId} onChange={handleBookChange}>
                    <option value="">-- Select Publisher --</option>
                    {publishers.map(p => <option key={p.PublisherID} value={p.PublisherID}>{p.PublisherName}</option>)}
                  </select>
                  {isbnPreview?.publisher && !publishers.find(p => p.PublisherName?.toLowerCase().includes((isbnPreview.publisher||'').toLowerCase().substring(0,6))) && (
                    <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4 }}>📌 "{isbnPreview.publisher}" not in list � add in Manage Metadata</div>
                  )}
                </div>
                <div className="wiz-field">
                  <label style={lblStyle}>Category</label>
                  <select name="categoryId" value={bookForm.categoryId} onChange={handleBookChange}>
                    <option value="">-- Select Category --</option>
                    {categories.map(c => <option key={c.CategoryID} value={c.CategoryID}>{c.CategoryName}</option>)}
                  </select>
                </div>
                <div className="wiz-field" style={{ gridColumn: 'span 2' }}>
                  <label style={lblStyle}>Authors <span style={{ fontWeight: 400, color: textMuted }}>(Ctrl+click for multiple)</span></label>
                  <select multiple name="authorIds" value={bookForm.authorIds} onChange={handleBookChange} style={{ minHeight: 80 }}>
                    {authors.map(a => <option key={a.AuthorID} value={a.AuthorID}>{a.Name}</option>)}
                  </select>
                  {isbnPreview?.authors?.length > 0 && (
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>📌 From barcode: {isbnPreview.authors.join(', ')}</div>
                  )}
                </div>
                <div className="wiz-field">
                  <label style={lblStyle}>Edition</label>
                  <input type="text" name="edition" value={bookForm.edition} onChange={handleBookChange} placeholder="e.g. 3rd" />
                </div>
                <div className="wiz-field">
                  <label style={lblStyle}>Language</label>
                  <input type="text" name="language" value={bookForm.language} onChange={handleBookChange} />
                </div>
                <div className="wiz-field">
                  <label style={lblStyle}>Number of Copies *</label>
                  <input required type="number" min="1" name="numberOfCopies" value={bookForm.numberOfCopies} onChange={handleBookChange} />
                </div>
                <div className="wiz-field">
                  <label style={lblStyle}>Shelf Location</label>
                  <input type="text" name="shelfLocation" value={bookForm.shelfLocation} onChange={handleBookChange} placeholder="e.g. A1-05" />
                </div>
                <div className="wiz-field" style={{ gridColumn: 'span 2' }}>
                  <label style={lblStyle}>Cover Image {isbnPreview?.coverUrl ? '(auto-fetched � upload to override)' : ''}</label>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={e => setCoverFile(e.target.files[0])} style={{ padding: '8px 12px' }} />
                </div>
                <div className="wiz-field" style={{ gridColumn: 'span 2' }}>
                  <label style={lblStyle}>Description</label>
                  <textarea name="description" value={bookForm.description} onChange={handleBookChange} style={{ minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
              </form>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 18 }}>
                <button type="button" className="wiz-btn-secondary" onClick={() => setRegisterStep(1)}>← Back</button>
                <button type="submit" form="book-details-form" className="wiz-btn-primary">Review & Confirm →</button>
              </div>
            </div>
          )}

          {/* ── Step 3: Confirm ── */}
          {registerStep === 3 && (
            <div className="wiz-step" style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: textPrimary }}>✅ Confirm Registration</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  ['Title', bookForm.title], ['ISBN', bookForm.isbn], ['Year', bookForm.year],
                  ['Edition', bookForm.edition], ['Language', bookForm.language], ['Copies', bookForm.numberOfCopies],
                  ['Shelf', bookForm.shelfLocation],
                  ['Publisher', publishers.find(p => String(p.PublisherID) === String(bookForm.publisherId))?.PublisherName || '�'],
                  ['Category', categories.find(c => String(c.CategoryID) === String(bookForm.categoryId))?.CategoryName || '�'],
                ].map(([k, v]) => v ? (
                  <div key={k} style={{ background: isDark?'rgba(255,255,255,0.04)':'#f8fafc', borderRadius: 8, padding: '8px 12px' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: textMuted, letterSpacing: 0.8 }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary }}>{String(v)}</div>
                  </div>
                ) : null)}
              </div>
              {isbnPreview?.coverUrl && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <img src={isbnPreview.coverUrl} alt="cover" style={{ width: 50, height: 74, objectFit: 'cover', borderRadius: 6 }} />
                  <div style={{ fontSize: 12, color: textMuted }}>Auto-fetched cover image will be used unless you uploaded one in step 2.</div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 4, position: 'relative' }}>
                <button type="button" className="wiz-btn-secondary" onClick={() => setRegisterStep(2)}>← Edit Details</button>
                <div style={{ position: 'relative' }}>
                  <button
                    type="button" className="wiz-btn-primary" disabled={bookLoading}
                    onClick={e => submitBook({ preventDefault: () => {} })}
                    style={{ opacity: bookLoading ? 0.7 : 1, cursor: bookLoading ? 'not-allowed' : 'pointer' }}
                  >
                    {bookLoading ? '⏳ Registering...' : '🚀 Register Book & Copies'}
                  </button>
                  <BubblePopup msg={bookMsg} onClear={() => setBookMsg('')} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {tab === 'metadata' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          
          {/* Categories */}
          <div style={{ background: cardBg, backdropFilter:'blur(12px)', borderRadius: 16, border: `1px solid ${border}`, padding: 24 }}>
            <h3 style={{ color: textPrimary, marginBottom: 16 }}>Manage Categories</h3>
            <form onSubmit={(e) => handleAddMeta(e, 'categories', categoryForm, setCategoryForm, {CategoryName:'', Description:''}, setCategoryMsg)} style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <input required type="text" placeholder="Category Name" value={categoryForm.CategoryName} onChange={e => setCategoryForm({...categoryForm, CategoryName: e.target.value})} style={dynInputStyle} />
              <input type="text" placeholder="Description" value={categoryForm.Description} onChange={e => setCategoryForm({...categoryForm, Description: e.target.value})} className="interactive-input" style={dynInputStyle} />
              <div style={{ position: 'relative' }}>
                <button type="submit" className="interactive-btn btn-pulse" style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>Add Category</button>
                <BubblePopup msg={categoryMsg} onClear={() => setCategoryMsg('')} />
              </div>
            </form>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead><tr style={{ color: '#64748b' }}><th style={{ padding: 12 }}>Name</th><th style={{ padding: 12 }}>Description</th><th style={{ padding: 12, textAlign: 'right' }}>Actions</th></tr></thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c.CategoryID} className="table-row" style={{ borderTop: `1px solid ${border}`, color: textPrimary }}>
                    <td style={{ padding: 12 }}>{c.CategoryName}</td>
                    <td style={{ padding: 12, color: '#94a3b8' }}>{c.Description || '�'}</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      <button className="interactive-btn" onClick={() => setEditModal({type:'categories', item:c})} style={{ background: 'transparent', color: '#3b82f6', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Authors */}
          <div style={{ background: cardBg, backdropFilter:'blur(12px)', borderRadius: 16, border: `1px solid ${border}`, padding: 24 }}>
            <h3 style={{ color: textPrimary, marginBottom: 16 }}>Manage Authors</h3>
            <form onSubmit={(e) => handleAddMeta(e, 'authors', authorForm, setAuthorForm, {FirstName:'', LastName:'', Bio:'', Nationality:''}, setAuthorMsg)} style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <input required type="text" placeholder="First Name" value={authorForm.FirstName} onChange={e => setAuthorForm({...authorForm, FirstName: e.target.value})} style={{...dynInputStyle, flex:1, minWidth:120}} />
              <input required type="text" placeholder="Last Name" value={authorForm.LastName} onChange={e => setAuthorForm({...authorForm, LastName: e.target.value})} style={{...dynInputStyle, flex:1, minWidth:120}} />
              <input type="text" placeholder="Nationality" value={authorForm.Nationality} onChange={e => setAuthorForm({...authorForm, Nationality: e.target.value})} style={{...dynInputStyle, flex:1, minWidth:120}} />
              <input type="text" placeholder="Bio" value={authorForm.Bio} onChange={e => setAuthorForm({...authorForm, Bio: e.target.value})} style={{...dynInputStyle, flex:2, minWidth:200}} />
              <div style={{ position: 'relative' }}>
                <button type="submit" style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Add Author</button>
                <BubblePopup msg={authorMsg} onClear={() => setAuthorMsg('')} />
              </div>
            </form>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead><tr style={{ color: '#64748b' }}><th style={{ padding: 12 }}>Name</th><th style={{ padding: 12 }}>Nationality</th><th style={{ padding: 12, textAlign: 'right' }}>Actions</th></tr></thead>
              <tbody>
                {authors.map(a => (
                  <tr key={a.AuthorID} className="table-row" style={{ borderTop: `1px solid ${border}`, color: textPrimary }}>
                    <td style={{ padding: 12 }}>{a.Name}</td>
                    <td style={{ padding: 12, color: '#94a3b8' }}>{a.Nationality || '�'}</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      <button className="interactive-btn" onClick={() => setEditModal({type:'authors', item:a})} style={{ background: 'transparent', color: '#3b82f6', border: 'none', cursor: 'pointer', fontWeight: 600, marginRight: 12 }}>Edit</button>
                      <button className="interactive-btn" onClick={() => handleDeleteMeta('authors', a.AuthorID, setAuthorMsg)} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Publishers */}
          <div style={{ background: cardBg, backdropFilter:'blur(12px)', borderRadius: 16, border: `1px solid ${border}`, padding: 24 }}>
            <h3 style={{ color: textPrimary, marginBottom: 16 }}>Manage Publishers</h3>
            <form onSubmit={(e) => handleAddMeta(e, 'publishers', publisherForm, setPublisherForm, {PublisherName:'', Email:'', Phone:'', Address:''}, setPublisherMsg)} style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <input required type="text" placeholder="Publisher Name" value={publisherForm.PublisherName} onChange={e => setPublisherForm({...publisherForm, PublisherName: e.target.value})} style={{...dynInputStyle, flex:2, minWidth:200}} />
              <input type="email" placeholder="Email" value={publisherForm.Email} onChange={e => setPublisherForm({...publisherForm, Email: e.target.value})} style={{...dynInputStyle, flex:1, minWidth:150}} />
              <input type="text" placeholder="Phone" value={publisherForm.Phone} onChange={e => setPublisherForm({...publisherForm, Phone: e.target.value})} style={{...dynInputStyle, flex:1, minWidth:120}} />
              <div style={{ position: 'relative' }}>
                <button type="submit" style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Add Publisher</button>
                <BubblePopup msg={publisherMsg} onClear={() => setPublisherMsg('')} />
              </div>
            </form>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead><tr style={{ color: '#64748b' }}><th style={{ padding: 12 }}>Name</th><th style={{ padding: 12 }}>Email</th><th style={{ padding: 12 }}>Phone</th><th style={{ padding: 12, textAlign: 'right' }}>Actions</th></tr></thead>
              <tbody>
                {publishers.map(p => (
                  <tr key={p.PublisherID} style={{ borderTop: `1px solid ${border}`, color: textPrimary }}>
                    <td style={{ padding: 12 }}>{p.PublisherName}</td>
                    <td style={{ padding: 12, color: '#94a3b8' }}>{p.ContactEmail || '�'}</td>
                    <td style={{ padding: 12, color: '#94a3b8' }}>{p.Phone || '�'}</td>
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
                <input required type="number" value={issueForm.copyId} onChange={e => setIssueForm({...issueForm, copyId: e.target.value})} className="interactive-input" style={dynInputStyle} placeholder="Specific Copy ID" />
              </div>
              <div style={{ position: 'relative' }}>
                <button type="submit" className="interactive-btn btn-pulse" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', boxShadow:'0 4px 16px rgba(16,185,129,0.25)', width: '100%' }}>Issue Book →</button>
                <BubblePopup msg={issueMsg} onClear={() => setIssueMsg('')} />
              </div>
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
                  <option value="Damaged">Damaged � requires photo proof</option>
                  <option value="Lost">Lost � requires report</option>
                </select>
              </div>
              {(returnForm.condition === 'Damaged' || returnForm.condition === 'Lost') && (
                <div>
                  <label style={lblStyle}>{returnForm.condition === 'Lost' ? 'Proof / Document (Optional)' : 'Upload Damage Photo (Required)'}</label>
                  <input type="file" accept="image/*" onChange={handleReturnImageUpload} required={returnForm.condition === 'Damaged'} style={{ ...dynInputStyle, padding: '8px 12px' }} />
                  {returnForm.imageBase64 && <div style={{ marginTop: 8, fontSize: 12, color: '#10b981' }}>✓ Image attached</div>}
                </div>
              )}
              <div style={{ position: 'relative' }}>
                <button type="submit" style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', boxShadow:'0 4px 16px rgba(59,130,246,0.25)', width: '100%' }}>Process Return →</button>
                <BubblePopup msg={returnMsg} onClear={() => setReturnMsg('')} />
              </div>
            </form>
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

      {/* Barcodes Modal */}
      {barcodesModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:9200, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(6px)', padding:24 }}>
          <div style={{ background:cardBg, borderRadius:24, padding:36, width:'100%', maxWidth:720, maxHeight:'90vh', overflowY:'auto', border:`1px solid ${border}`, boxShadow:'0 40px 100px rgba(0,0,0,0.6)', animation:'fadeInScale 0.25s ease' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:50, height:50, borderRadius:14, background:'linear-gradient(135deg,#10b981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, boxShadow:'0 4px 16px rgba(16,185,129,0.4)' }}>🏷️</div>
                <div>
                  <h2 style={{ color:textPrimary, margin:0, fontSize:22, fontWeight:800 }}>Barcodes: {barcodesModal.Title}</h2>
                  <p style={{ color:textMuted, margin:0, fontSize:13 }}>Printable labels for physical copies</p>
                </div>
              </div>
              <button onClick={() => setBarcodesModal(null)} style={{ background:'transparent', border:'none', color:textMuted, fontSize:24, cursor:'pointer', lineHeight:1 }}>✖</button>
            </div>
            
            <div id="print-barcode-area" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
              {bookCopies.map(copy => (
                <div key={copy.CopyID} style={{ background: '#fff', border: `1px solid ${border}`, padding: 16, borderRadius: 12, textAlign: 'center' }}>
                  <Barcode value={copy.BarcodeNumber} format="CODE128" width={1.5} height={50} fontSize={12} background="#ffffff" lineColor="#000000" />
                  <div style={{ marginTop: 8, fontSize: 12, color: '#64748b', fontWeight: 600 }}>Shelf: {copy.ShelfLocation || 'Unassigned'}</div>
                </div>
              ))}
              {bookCopies.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 20, color: textMuted }}>No physical copies registered.</div>
              )}
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" onClick={() => setBarcodesModal(null)} style={{ padding: '10px 16px', borderRadius: 10, border: `1px solid ${border}`, background: 'transparent', color: textMuted, cursor: 'pointer', fontWeight: 600 }}>Close</button>
              <button 
                onClick={() => {
                  const printWin = window.open('', '', 'width=800,height=600');
                  printWin.document.write('<html><head><title>Print Barcodes</title></head><body style="font-family: sans-serif; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; padding: 20px;">');
                  printWin.document.write(document.getElementById('print-barcode-area').innerHTML);
                  printWin.document.write('</body></html>');
                  printWin.document.close();
                  printWin.focus();
                  setTimeout(() => { printWin.print(); printWin.close(); }, 250);
                }}
                disabled={bookCopies.length === 0}
                style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: '#fff', fontWeight: 700, cursor: bookCopies.length === 0 ? 'not-allowed' : 'pointer' }}>
                🖨️ Print Labels
              </button>
            </div>
          </div>
        </div>
      )}

      
      {tab === 'myborrow' && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <style>{`
            @keyframes mbIn { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
            @keyframes mbCardIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
            .mb-card { animation: mbCardIn 0.3s ease both; transition: transform 0.2s, box-shadow 0.2s; }
            .mb-card:hover { transform: translateY(-5px); box-shadow: 0 14px 36px rgba(0,0,0,0.16) !important; }
            .mb-btn { transition: all 0.18s ease; border:none; cursor:pointer; font-weight:700; border-radius:8px; }
            .mb-btn:hover:not(:disabled) { filter:brightness(1.1); transform:translateY(-2px); }
            .mb-btn:disabled { opacity:0.45; cursor:not-allowed; }
          `}</style>

          <div style={{ display:'flex', alignItems:'flex-start', gap:12, background:'linear-gradient(135deg,rgba(16,185,129,0.1),rgba(5,150,105,0.06))', border:'2px solid rgba(16,185,129,0.3)', borderRadius:14, padding:'14px 18px' }}>
            <span style={{ fontSize:22 }}>&#x2139;&#xFE0F;</span>
            <div>
              <div style={{ fontWeight:800, color:'#065f46', fontSize:14, marginBottom:4 }}>Staff Borrow Policy</div>
              <div style={{ fontSize:13, color:'#047857', lineHeight:1.6 }}>As a staff member you may borrow books for personal use. Add books below, submit a request, then show your code to an <strong>Administrator</strong> at the desk for approval.</div>
            </div>
          </div>

          {myBorrowMsg.text && (
            <div style={{ animation:'mbIn 0.3s ease', padding:'12px 18px', borderRadius:12, fontWeight:700, fontSize:14, background: myBorrowMsg.ok ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)', border:`1px solid ${myBorrowMsg.ok ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`, color: myBorrowMsg.ok ? '#065f46' : '#991b1b', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>{myBorrowMsg.text}</span>
              <button onClick={() => setMyBorrowMsg({ text:'', ok:true })} style={{ background:'none', border:'none', cursor:'pointer', fontWeight:900, color:'inherit', fontSize:16 }}>x</button>
            </div>
          )}

          {myBorrowCart.length > 0 && (
            <div style={{ animation:'mbIn 0.35s ease', background:'linear-gradient(135deg,rgba(16,185,129,0.08),rgba(5,150,105,0.04))', border:'2px solid rgba(16,185,129,0.4)', borderRadius:16, padding:20 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{ fontWeight:800, fontSize:16, color:'#065f46' }}>Borrow Cart ({myBorrowCart.length} book{myBorrowCart.length !== 1 ? 's' : ''})</div>
                <button onClick={submitMyBorrow} disabled={myBorrowLoading} className="mb-btn" style={{ background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', padding:'10px 22px', fontSize:14 }}>
                  {myBorrowLoading ? 'Submitting...' : 'Submit Borrow Request'}
                </button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {myBorrowCart.map(item => (
                  <div key={item.copyId} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,255,255,0.7)', borderRadius:10, padding:'10px 14px', border:'1px solid rgba(16,185,129,0.2)' }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14 }}>{item.title}</div>
                      {item.authors && <div style={{ fontSize:12, color:'#64748b' }}>{item.authors}</div>}
                    </div>
                    <button onClick={() => removeFromMyCart(item.copyId)} style={{ background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'none', borderRadius:7, padding:'5px 10px', fontWeight:700, cursor:'pointer' }}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4, scrollbarWidth:'none' }}>
            {['',...[...new Set(allBooks.map(b => b.CategoryName).filter(Boolean))].sort()].map(cat => (
              <button key={cat || '__all'} onClick={() => setMyBorrowCat(cat)} className="mb-btn" style={{ padding:'6px 16px', borderRadius:20, flexShrink:0, background: myBorrowCat === cat ? '#10b981' : 'rgba(16,185,129,0.1)', color: myBorrowCat === cat ? '#fff' : '#065f46', fontSize:13 }}>
                {cat || 'All Books'}
              </button>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(210px, 1fr))', gap:16 }}>
            {allBooks
              .filter(b => !myBorrowCat || b.CategoryName === myBorrowCat)
              .filter(b => !searchQuery || [b.Title, b.Authors, b.CategoryName, b.ISBN].some(v => String(v||'').toLowerCase().includes(searchQuery.toLowerCase())))
              .map((book, idx) => {
                const available = Number(book.AvailableCopies) > 0;
                const inCart = myBorrowCart.some(i => String(i.bookId) === String(book.BookID));
                return (
                  <div key={book.BookID} className="mb-card" style={{ animationDelay: idx * 0.04 + 's', background: cardBg, border:`1px solid ${border}`, borderRadius:14, overflow:'hidden', display:'flex', flexDirection:'column' }}>
                    {book.CoverImage
                      ? <img src={book.CoverImage.startsWith('/') ? `http://localhost:4000${book.CoverImage}` : book.CoverImage} alt={book.Title} style={{ width:'100%', height:130, objectFit:'cover' }} />
                      : <div style={{ width:'100%', height:130, background:'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(5,150,105,0.08))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:42 }}>&#x1F4D7;</div>
                    }
                    <div style={{ padding:12, flex:1, display:'flex', flexDirection:'column', gap:4 }}>
                      <div style={{ fontWeight:800, fontSize:13, color:textPrimary, lineHeight:1.3 }}>{book.Title}</div>
                      {book.Authors && <div style={{ fontSize:11, color:textMuted }}>{book.Authors}</div>}
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:'auto', paddingTop:10 }}>
                        <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background: available ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)', color: available ? '#10b981' : '#ef4444' }}>
                          {available ? book.AvailableCopies + ' avail.' : 'None'}
                        </span>
                        <button onClick={() => addToMyCart(book)} disabled={!available || inCart} className="mb-btn" style={{ marginLeft:'auto', background: inCart ? 'rgba(16,185,129,0.15)' : available ? '#10b981' : 'rgba(150,150,150,0.12)', color: inCart ? '#10b981' : '#fff', padding:'5px 11px', fontSize:12 }}>
                          {inCart ? 'Added' : '+ Borrow'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {myBorrows.length > 0 && (
            <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:16, overflow:'hidden' }}>
              <div style={{ padding:'14px 20px', borderBottom:`1px solid ${border}`, display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontWeight:800, fontSize:16, color:textPrimary }}>My Borrow History</span>
                <span style={{ marginLeft:'auto', fontSize:12, color:textMuted }}>{myBorrows.length} record{myBorrows.length !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead><tr style={{ background:'rgba(0,0,0,0.03)' }}>
                    {['Book','Code','Date','Due','Status',''].map(h => (
                      <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:textMuted, textTransform:'uppercase', letterSpacing:0.5, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {myBorrows.map(b => {
                      const st = b.status || b.Status || '';
                      const isPending = st === 'Pending';
                      const col = isPending ? '#f59e0b' : st === 'Borrowed' ? '#10b981' : st === 'Overdue' ? '#ef4444' : '#64748b';
                      return (
                        <tr key={b.BorrowID || b.borrowId} className="table-row" style={{ borderBottom:`1px solid ${border}` }}>
                          <td style={{ padding:'11px 14px', color:textPrimary, fontWeight:600, fontSize:13, maxWidth:180 }}><div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.Title || b.bookTitle || '�'}</div></td>
                          <td style={{ padding:'11px 14px', fontSize:12, color:textMuted, fontFamily:'monospace' }}>{b.RequestCode || b.requestCode || '�'}</td>
                          <td style={{ padding:'11px 14px', fontSize:12, color:textMuted, whiteSpace:'nowrap' }}>{b.BorrowDate || b.borrowDate ? new Date(b.BorrowDate || b.borrowDate).toLocaleDateString() : '�'}</td>
                          <td style={{ padding:'11px 14px', fontSize:12, color: st === 'Overdue' ? '#ef4444' : textMuted, whiteSpace:'nowrap' }}>{b.DueDate || b.dueDate ? new Date(b.DueDate || b.dueDate).toLocaleDateString() : '�'}</td>
                          <td style={{ padding:'11px 14px' }}><span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:col+'18', color:col, border:`1px solid ${col}40` }}>{st}</span></td>
                          <td style={{ padding:'11px 14px' }}>
                            {isPending && (
                              <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                                <button onClick={() => retractMyBorrow(b.BorrowID || b.borrowId)} style={{ fontSize:12, padding:'4px 10px', background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.3)', borderRadius:7, fontWeight:700, cursor:'pointer' }}>Retract</button>
                                <div style={{ fontSize:10, color:'#f59e0b' }}>Awaiting Admin</div>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'fines' && <FinesTab getHeaders={getHeaders} c={{ cardBg, border, textPrimary, textMuted, inputBg, inputBorder }} />}

      {tab === 'payments' && <PaymentsHistoryTab getHeaders={getHeaders} API={API} c={{ cardBg, border, textPrimary, textMuted, inputBg, inputBorder }} />}


    </DashboardShell>
  )
}



function PaymentsHistoryTab({ getHeaders, API, c }) {
  const [payments, setPayments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/staff/payment-history`, getHeaders());
        setPayments(res.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = payments.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (p.MemberName || '').toLowerCase().includes(q) ||
      (p.StudentID || '').toLowerCase().includes(q) ||
      (p.FineType || '').toLowerCase().includes(q) ||
      (p.PaymentMethod || '').toLowerCase().includes(q) ||
      (p.PaymentReference || '').toLowerCase().includes(q)
    );
  });

  const totalCollected = payments.reduce((sum, p) => sum + Number(p.AmountPaid || 0), 0);
  const cashTotal = payments.filter(p => p.PaymentMethod === 'Cash').reduce((sum, p) => sum + Number(p.AmountPaid || 0), 0);
  const chapaTotal = payments.filter(p => p.PaymentMethod !== 'Cash').reduce((sum, p) => sum + Number(p.AmountPaid || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`
        @keyframes payIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .pay-row:hover td { background: rgba(16,185,129,0.04) !important; }
      `}</style>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
        {[
          { label: 'Total Collected', value: `ETB ${totalCollected.toFixed(2)}`, color: '#10b981', icon: '💰' },
          { label: 'Cash Payments', value: `ETB ${cashTotal.toFixed(2)}`, color: '#3b82f6', icon: '💵' },
          { label: 'Chapa / Digital', value: `ETB ${chapaTotal.toFixed(2)}`, color: '#8b5cf6', icon: '📱' },
          { label: 'Total Transactions', value: payments.length, color: '#f59e0b', icon: '🧾' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: 14, padding: '16px 18px', animation: 'payIn 0.4s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: c.textMuted, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: color, lineHeight: 1 }}>{loading ? '…' : value}</div>
              </div>
              <div style={{ fontSize: 22, opacity: 0.75 }}>{icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 16, opacity: 0.5 }}>🔍</span>
        <input
          type="text"
          placeholder="Search by member name, student ID, fine type, or reference…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: c.textPrimary, fontSize: 14 }}
        />
        {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: c.textMuted, cursor: 'pointer', fontSize: 16, fontWeight: 900 }}>✕</button>}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: c.textMuted, fontSize: 14 }}>⏳ Loading payment history…</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#ef4444', fontWeight: 700 }}>❌ {error}</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: c.textMuted }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🧾</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{search ? 'No results found' : 'No payments recorded yet'}</div>
          <div style={{ fontSize: 13 }}>{search ? 'Try a different search term.' : 'Payments will appear here once processed.'}</div>
        </div>
      ) : (
        <div style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: c.textPrimary }}>Payment Records</div>
            <div style={{ fontSize: 12, color: c.textMuted, fontWeight: 600 }}>{filtered.length} of {payments.length} records</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(16,185,129,0.05)' }}>
                  {['Date', 'Member', 'Student ID', 'Fine Type', 'Amount Paid', 'Method', 'Reference', 'Processed By'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.PaymentID || i} className="pay-row" style={{ borderTop: `1px solid ${c.border}` }}>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: c.textMuted, whiteSpace: 'nowrap' }}>
                      {p.PaymentDate ? new Date(p.PaymentDate).toLocaleString() : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: c.textPrimary, fontWeight: 700 }}>{p.MemberName || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#3b82f6', fontFamily: 'monospace' }}>{p.StudentID || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: c.textMuted }}>{p.FineType || 'Library Fine'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 900, color: '#10b981', whiteSpace: 'nowrap' }}>
                      ETB {Number(p.AmountPaid || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20,
                        background: p.PaymentMethod === 'Cash' ? 'rgba(59,130,246,0.1)' : 'rgba(139,92,246,0.1)',
                        color: p.PaymentMethod === 'Cash' ? '#3b82f6' : '#8b5cf6',
                        border: `1px solid ${p.PaymentMethod === 'Cash' ? 'rgba(59,130,246,0.3)' : 'rgba(139,92,246,0.3)'}`
                      }}>{p.PaymentMethod || 'Unknown'}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: c.textMuted, fontFamily: 'monospace', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.PaymentReference || '—'}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: c.textMuted }}>{p.ProcessedBy || 'Self / System'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function FinesTab({ getHeaders, c }) {
  const [memberId, setMemberId] = useState('');
  const [fines, setFines] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ fineId: null, amount: '', method: 'Cash' });
  const [msg, setMsg] = useState('');

  const lookupMember = async (e) => {
    e.preventDefault();
    if (!memberId.trim()) return;
    setLoading(true); setMsg(''); setFines(null);
    try {
      const res = await axios.get(`http://localhost:4000/api/staff/member-fines/${memberId.trim()}`, getHeaders());
      setFines(res.data.data);
      if (res.data.data.length === 0) setMsg('No outstanding fines for this member.');
    } catch (err) {
      setMsg(err.response?.data?.message || err.message);
    } finally { setLoading(false); }
  };

  const processPayment = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await axios.post(`http://localhost:4000/api/staff/record-payment`, {
        fineId: paymentForm.fineId,
        amount: paymentForm.amount,
        paymentMethod: paymentForm.method
      }, getHeaders());
      setMsg(res.data.message);
      setPaymentForm({ fineId: null, amount: '', method: 'Cash' });
      // Refresh fines
      lookupMember({ preventDefault: () => {} });
    } catch (err) {
      setMsg('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ background: c.cardBg, borderRadius: 16, border: `1px solid ${c.border}`, padding: 24 }}>
        <h2 style={{ margin: '0 0 16px', color: c.textPrimary, fontSize: 20 }}>Fine Payments Desk</h2>
        <form onSubmit={lookupMember} style={{ display: 'flex', gap: 12 }}>
          <input 
            type="text" 
            placeholder="Enter Member ID or Student ID..." 
            value={memberId} 
            onChange={e => setMemberId(e.target.value)} 
            required 
            style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: `1px solid ${c.border}`, background: c.inputBg, color: c.textPrimary, outline: 'none' }}
          />
          <button type="submit" disabled={loading} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0 24px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
            {loading ? 'Searching...' : 'Search Fines'}
          </button>
        </form>
        {msg && <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: msg.includes('Error') ? '#fee2e2' : '#f0fdf4', color: msg.includes('Error') ? '#991b1b' : '#166534' }}>{msg}</div>}
      </div>

      {fines && fines.length > 0 && (
        <div style={{ background: c.cardBg, borderRadius: 16, border: `1px solid ${c.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${c.border}`, background: 'rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: c.textPrimary }}>Outstanding Fines - {fines[0].FullName}</h3>
            <span style={{ fontWeight: 700, color: '#ef4444' }}>Total: {fines.reduce((acc, f) => acc + Number(f.Balance), 0).toFixed(2)} ETB</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {fines.map((fine, idx) => (
              <div key={fine.FineID} style={{ padding: 24, borderBottom: idx === fines.length - 1 ? 'none' : `1px solid ${c.border}`, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: c.textPrimary, fontSize: 16, marginBottom: 4 }}>{fine.TypeName}</div>
                    <div style={{ color: c.textMuted, fontSize: 13, maxWidth: 400 }}>{fine.Description}</div>
                    {fine.BookTitle && <div style={{ fontSize: 13, color: '#3b82f6', marginTop: 4 }}>Book: {fine.BookTitle}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#ef4444' }}>{Number(fine.Balance).toFixed(2)} ETB</div>
                    <div style={{ fontSize: 12, color: c.textMuted }}>Orig: {Number(fine.Amount).toFixed(2)} | Paid: {Number(fine.TotalPaid).toFixed(2)}</div>
                  </div>
                </div>

                {paymentForm.fineId === fine.FineID ? (
                  <form onSubmit={processPayment} style={{ display: 'flex', gap: 12, background: 'rgba(59, 130, 246, 0.05)', padding: 16, borderRadius: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 700, color: '#3b82f6' }}>Process Payment</div>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0.01" 
                      max={fine.Balance} 
                      value={paymentForm.amount} 
                      onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} 
                      placeholder="Amount" 
                      required 
                      style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid #93c5fd`, width: 120, outline: 'none' }}
                    />
                    <select 
                      value={paymentForm.method} 
                      onChange={e => setPaymentForm({...paymentForm, method: e.target.value})}
                      style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid #93c5fd`, outline: 'none' }}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Card">Card/POS</option>
                      <option value="Online">Telebirr / Mobile Money</option>
                    </select>
                    <div style={{ flex: 1, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => setPaymentForm({ fineId: null, amount: '', method: 'Cash' })} style={{ padding: '8px 16px', background: 'transparent', color: c.textMuted, border: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                      <button type="submit" style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>Confirm Paid</button>
                    </div>
                  </form>
                ) : (
                  <div style={{ textAlign: 'right' }}>
                    <button 
                      onClick={() => setPaymentForm({ fineId: fine.FineID, amount: fine.Balance, method: 'Cash' })}
                      style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Accept Payment
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileTab({ user, c }) {
  const [pw, setPw] = React.useState({ current: '', new: '', confirm: '' })
  const [loading, setLoading] = React.useState(false)
  const [msg, setMsg] = React.useState({ text: '', type: '' })
  const [showPw, setShowPw] = React.useState(false)

  const handlePw = async (e) => {
    e.preventDefault()
    setMsg({ text: '', type: '' })
    if (pw.new !== pw.confirm) {
      setMsg({ text: "❌ Passwords don't match.", type: 'error' })
      return
    }
    if (pw.new.length < 8) {
      setMsg({ text: '❌ New password must be at least 8 characters.', type: 'error' })
      return
    }
    setLoading(true)
    try {
      const res = await axios.post(`http://localhost:4000/api/auth/change-password`, {
        currentPassword: pw.current,
        newPassword: pw.new
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('lms_token')}` } })
      if (res.data.success) {
        setMsg({ text: '✅ Password updated successfully!', type: 'success' })
        setPw({ current: '', new: '', confirm: '' })
      }
    } catch (err) {
      setMsg({ text: '❌ ' + (err.response?.data?.message || err.message), type: 'error' })
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ color: c.text, margin: 0, fontSize: 20, fontWeight: 700 }}>Security Center</h3>
          <button type="button" onClick={() => setShowPw(v => !v)}
            style={{ background: 'none', border: 'none', color: '#10b981', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {showPw ? '🙈 Hide' : '👁 Show Passwords'}
          </button>
        </div>

        {msg.text && (
          <div style={{
            padding: '12px 18px', borderRadius: 12, marginBottom: 20,
            background: msg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${msg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: msg.type === 'success' ? '#10b981' : '#ef4444',
            fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10
          }}>
            <span style={{ flex: 1 }}>{msg.text}</span>
            <button onClick={() => setMsg({ text: '', type: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 900 }}>✖</button>
          </div>
        )}

        <form onSubmit={handlePw} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ color: c.muted, fontSize: 12, display: 'block', marginBottom: 6 }}>Current Password</label>
            <input type={showPw ? 'text' : 'password'} required value={pw.current}
              onChange={e => setPw({ ...pw, current: e.target.value })}
              style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${c.border}`, background: c.input, color: c.text, boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <div>
            <label style={{ color: c.muted, fontSize: 12, display: 'block', marginBottom: 6 }}>New Password</label>
            <input type={showPw ? 'text' : 'password'} required value={pw.new}
              onChange={e => setPw({ ...pw, new: e.target.value })}
              style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${c.border}`, background: c.input, color: c.text, boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <div>
            <label style={{ color: c.muted, fontSize: 12, display: 'block', marginBottom: 6 }}>Confirm New Password</label>
            <input type={showPw ? 'text' : 'password'} required value={pw.confirm}
              onChange={e => setPw({ ...pw, confirm: e.target.value })}
              style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${c.border}`, background: c.input, color: c.text, boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <button type="submit" disabled={loading}
            style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', padding: 14, borderRadius: 8, fontWeight: 700, cursor: 'pointer', marginTop: 10, fontSize: 15, opacity: loading ? 0.8 : 1 }}>
            {loading ? '⏳ Updating...' : '🔒 Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

const lblStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }
const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(150,150,150,0.2)', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'transparent', color: 'inherit', transition: 'all 0.3s' }

const StatCard = ({ title, value, color = '#10b981', highlight, cardBg, textPrimary, border }) => (
  <div className="stat-card interactive-card" style={{ background: cardBg, backdropFilter:'blur(12px)', border: highlight ? `2px solid ${color}` : `1px solid ${border}`, borderRadius: 12, padding: '14px 18px', boxShadow: highlight ? `0 0 24px ${color}22` : 'none' }}>
    <div style={{ fontSize: 11, color: highlight ? color : '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{title}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: highlight ? color : textPrimary }}>{value ?? '�'}</div>
  </div>
)
