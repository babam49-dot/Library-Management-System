import React, { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import DashboardShell from '../components/DashboardShell'
import BookCard from '../components/BookCard'
import axios from 'axios'
import Barcode from 'react-barcode'
import BubblePopup from '../components/BubblePopup'
import { useStaffNavCounts, getStaffNavItems } from '../hooks/useStaffNavCounts'

const API = 'http://localhost:4000/api'

const CART_GRADIENTS = [
  'linear-gradient(135deg,#1e3a8a,#3b82f6)',
  'linear-gradient(135deg,#064e3b,#10b981)',
  'linear-gradient(135deg,#581c87,#8b5cf6)',
  'linear-gradient(135deg,#7c2d12,#f97316)',
  'linear-gradient(135deg,#0c4a6e,#0ea5e9)',
  'linear-gradient(135deg,#831843,#ec4899)',
]

export default function StaffDashboard() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const [stats, setStats] = useState(null)
  const [borrowingRecords, setBorrowingRecords] = useState([])
  const [tab, setTab] = useState(location.state?.tab || 'overview')
  const { counts, refetch: refetchStaffCounts } = useStaffNavCounts()
  const [pendingDeskSessionsCount, setPendingDeskSessionsCount] = useState(0)

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
  const [myReservations, setMyReservations] = useState([])
  const [myBorrowSubTab, setMyBorrowSubTab] = useState('borrows') // 'borrows' | 'reservations'
  const [myBorrowMsg, setMyBorrowMsg] = useState({ text: '', ok: true })
  const [myBorrowLoading, setMyBorrowLoading] = useState(false)
  const [myBorrowCat, setMyBorrowCat] = useState('')
  const [myBorrowResult, setMyBorrowResult] = useState(null) // success screen data

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
      const headers = getHeaders();

      try {
        const s = await axios.get(`${API}/staff/dashboard`, headers)
        setStats(s.data.data)
      } catch (e) { console.error("Failed to load dashboard stats", e) }

      try {
        const pubs = await axios.get(`${API}/catalog/publishers`, headers)
        setPublishers(pubs.data.data)
      } catch (e) { console.error("Failed to load publishers", e) }

      try {
        const cats = await axios.get(`${API}/catalog/categories`, headers)
        setCategories(cats.data.data)
      } catch (e) { console.error("Failed to load categories", e) }

      try {
        const auths = await axios.get(`${API}/catalog/authors`, headers)
        setAuthors(auths.data.data)
      } catch (e) { console.error("Failed to load authors", e) }

      try {
        const borrows = await axios.get(`${API}/staff/borrowing-records`, headers)
        setBorrowingRecords(borrows.data.data)
      } catch (e) { console.error("Failed to load borrowing records", e) }

      try {
        const bks = await axios.get(`${API}/member/books`, headers)
        setAllBooks(bks.data.data || [])
      } catch (e) { console.error("Failed to load books", e) }

      try {
        const myB = await axios.get(`${API}/staff/my-borrows`, headers)
        setMyBorrows(myB.data.data || [])
      } catch (_) { }

      try {
        const myR = await axios.get(`${API}/member/my-reservations`, headers)
        setMyReservations(myR.data.data || [])
      } catch (_) { }

      try {
        const res = await axios.get(`${API}/borrowing/sessions`, headers)
        const rows = res.data.data || [];
        const pendingCount = rows.filter(r => r.status === 'Pending').length;
        setPendingDeskSessionsCount(pendingCount);
      } catch (_) { }

      refetchStaffCounts();
    } catch (err) { console.error(err) }
  }

  useEffect(() => {
    fetchData();
    // Poll dashboard stats every 10s
    const interval = setInterval(async () => {
      try {
        const s = await axios.get(`${API}/staff/dashboard`, getHeaders())
        setStats(s.data.data)
      } catch (_) {}
      try {
        const myR = await axios.get(`${API}/member/my-reservations`, getHeaders())
        setMyReservations(myR.data.data || [])
      } catch (_) {}
      try {
        const res = await axios.get(`${API}/borrowing/sessions`, getHeaders())
        const rows = res.data.data || [];
        const pendingCount = rows.filter(r => r.status === 'Pending').length;
        setPendingDeskSessionsCount(pendingCount);
      } catch (_) {}
    }, 10000);

    // Poll my-borrows every 15s independently — shows Expired status as soon as it changes
    const borrowInterval = setInterval(async () => {
      try {
        const myB = await axios.get(`${API}/staff/my-borrows`, getHeaders())
        setMyBorrows(myB.data.data || [])
      } catch (_) {}
    }, 15000);

    return () => { clearInterval(interval); clearInterval(borrowInterval); };
  }, [])


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
        title: d.title || prev.title,
        isbn: d.isbn || prev.isbn,
        year: d.year ? String(d.year) : prev.year,
        edition: d.edition || prev.edition,
        language: d.language || prev.language,
        description: d.description || prev.description,
        publisherId: d.publisherId ? String(d.publisherId) : prev.publisherId,
        categoryId: d.categoryId ? String(d.categoryId) : prev.categoryId,
        authorIds: d.authorIds ? d.authorIds.map(String) : prev.authorIds
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
      } catch (_) { }
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
      if (type === 'books') setBookMsg('Book updated successfully!')
      else setMetaMsg('Updated successfully!')
    } catch (err) {
      const msg = 'Error: ' + (err.response?.data?.message || err.message);
      if (type === 'books') setBookMsg(msg)
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

  // Fast dedicated refresh — only fetches the staff's own borrow records
  const refreshMyBorrows = async () => {
    try {
      const res = await axios.get(`${API}/staff/my-borrows`, getHeaders())
      const records = res.data.data || []
      setMyBorrows(records)
      return records
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Network error'
      console.error('[refreshMyBorrows] Failed:', msg, err.response?.status)
      // Surface the error so user/developer can see it
      setMyBorrowMsg({ text: `⚠️ Could not load borrow history: ${msg}`, ok: false })
      return []
    }
  }

  const submitMyBorrow = async () => {
    if (!myBorrowCart.length) return setMyBorrowMsg({ text: 'Add at least one book first.', ok: false })
    setMyBorrowLoading(true)
    setMyBorrowMsg({ text: '', ok: true })
    try {
      // Use the staff-specific endpoint — resolves MemberID from DB, not from the JWT token.
      const res = await axios.post(`${API}/staff/my-borrows/request`, { copyIds: myBorrowCart.map(i => i.copyId) }, getHeaders())
      const data = res.data.data || {}
      setMyBorrowCart([])
      // Refresh borrows FIRST so the table is populated before success screen shows
      await refreshMyBorrows()
      setMyBorrowResult(data)   // show success screen
    } catch (err) {
      setMyBorrowMsg({ text: 'Error: ' + (err.response?.data?.message || err.message), ok: false })
    } finally { setMyBorrowLoading(false) }
  }

  const retractMyBorrow = async (borrowId) => {
    try {
      await axios.delete(`${API}/staff/my-borrows/${borrowId}/retract`, getHeaders())
      setMyBorrowMsg({ text: '✅ Request retracted. Copy is available again.', ok: true })
      await refreshMyBorrows()
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

  const TABS = getStaffNavItems(counts)
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

      {tab === 'overview' && (
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
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: 14 }}>
              {[
                { label: 'Active Borrows', value: stats.activeBorrowings, color: '#10b981', icon: '📖', note: 'Currently checked out', tab: 'desk' },
                { label: 'Returns Today', value: stats.returnsToday, color: '#3b82f6', icon: '↩️', note: 'Processed today', tab: null },
                { label: 'Overdue Books', value: stats.overdueCount, color: '#ef4444', icon: '📚', note: 'Past due date', tab: 'overdue', alert: stats.overdueCount > 0 },
                { label: 'Pending Members', value: stats.pendingMembers, color: '#f59e0b', icon: '👤', note: 'Awaiting approval', tab: null, alert: stats.pendingMembers > 0 },
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
          )}

          {/* ── Navigation Cards Grid ── */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: textMuted, marginBottom: 14 }}>Navigate To</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))', gap: 14 }}>
              {[
                {
                  key: 'myborrow', icon: '📖', label: 'My Borrowing',
                  desc: 'Borrow books for yourself', color: '#6366f1',
                  badge: counts.myborrow, badgeLabel: counts.myborrow > 0 ? `${counts.myborrow} Pending` : null,
                },
                {
                  key: 'browse', icon: '📚', label: 'Browse Catalog',
                  desc: `${allBooks.length} books available`, color: '#8b5cf6',
                  badge: null, badgeLabel: null,
                },
                {
                  key: 'desk', icon: '🖥️', label: 'Librarian Desk',
                  desc: 'Approve & process borrows', color: '#3b82f6',
                  badge: counts.desk, badgeLabel: counts.desk > 0 ? `${counts.desk} Pending` : null,
                },
                {
                  key: 'reservations', icon: '📋', label: 'Reservations',
                  desc: 'Manage book holds', color: '#06b6d4',
                  badge: counts.reservations, badgeLabel: counts.reservations > 0 ? `${counts.reservations} Active` : null,
                },
                {
                  key: 'overdue', icon: '⚠️', label: 'Overdue Books',
                  desc: 'Books past their due date', color: '#ef4444',
                  badge: counts.overdue, badgeLabel: counts.overdue > 0 ? `${counts.overdue} Overdue` : null,
                },
                {
                  key: 'catalog', icon: '➕', label: 'Register Book',
                  desc: 'Add new books to library', color: '#10b981',
                  badge: null, badgeLabel: null,
                },
                {
                  key: 'metadata', icon: '🏷️', label: 'Manage Metadata',
                  desc: 'Authors, categories, publishers', color: '#f59e0b',
                  badge: null, badgeLabel: null,
                },
                {
                  key: 'fines', icon: '💰', label: 'Fine Payments',
                  desc: 'Process member fines', color: '#f97316',
                  badge: null, badgeLabel: null,
                },
                {
                  key: 'payments', icon: '🧾', label: 'Payment History',
                  desc: 'View all payment records', color: '#64748b',
                  badge: null, badgeLabel: null,
                },
                {
                  key: 'profile', icon: '👤', label: 'My Profile',
                  desc: 'Update your account info', color: '#94a3b8',
                  badge: null, badgeLabel: null,
                },
              ].map(({ key, icon, label, desc, color, badge, badgeLabel }) => (
                <div
                  key={key}
                  className="ov-card"
                  onClick={() => handleNav(key)}
                  style={{
                    background: cardBg,
                    border: badge > 0 ? `2px solid ${color}55` : `1px solid ${border}`,
                    borderRadius: 14,
                    padding: '16px 18px',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: badge > 0 ? `0 0 18px ${color}22` : '0 2px 8px rgba(0,0,0,0.05)',
                  }}
                >
                  {/* Color accent top bar */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}, ${color}88)`, borderRadius: '14px 14px 0 0' }} />
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {icon}
                    </div>
                    {badgeLabel && (
                      <span style={{ background: `${color}20`, color, borderRadius: 20, fontSize: 10, fontWeight: 800, padding: '3px 8px', whiteSpace: 'nowrap', border: `1px solid ${color}44`, flexShrink: 0 }}>
                        {badgeLabel}
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: textPrimary, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 11, color: textMuted, lineHeight: 1.4 }}>{desc}</div>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 11, color, fontWeight: 700 }}>Open →</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Recent Borrowings preview ── */}
          {false && (
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

          {/* ── Page Header Banner ── */}
          <div style={{ background: `linear-gradient(135deg, ${isDark ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.08)'}, ${isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.05)'})`, border: '1.5px solid rgba(139,92,246,0.3)', borderRadius: 16, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, boxShadow: '0 4px 16px rgba(139,92,246,0.35)' }}>📚</div>
            <div style={{ flex: '1 1 200px', minWidth: 0 }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: textPrimary, marginBottom: 3 }}>Full Library Catalog</div>
              <div style={{ fontSize: 13, color: textMuted, lineHeight: 1.5 }}>Browse all <strong style={{ color: '#8b5cf6' }}>{allBooks.length} books</strong> in the library. As staff, you can add books to your personal borrow cart, reserve, or join the waitlist — just like a student.</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <div style={{ textAlign: 'center', padding: '8px 14px', background: 'rgba(139,92,246,0.12)', borderRadius: 10, border: '1px solid rgba(139,92,246,0.25)' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#8b5cf6' }}>{allBooks.filter(b => Number(b.AvailableCopies) > 0).length}</div>
                <div style={{ fontSize: 10, color: textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>Available</div>
              </div>
              <div style={{ textAlign: 'center', padding: '8px 14px', background: 'rgba(16,185,129,0.1)', borderRadius: 10, border: '1px solid rgba(16,185,129,0.25)' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#10b981' }}>{myBorrowCart.length}</div>
                <div style={{ fontSize: 10, color: textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>In Cart</div>
              </div>
            </div>
          </div>

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
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6, scrollbarWidth: 'none', maxWidth: '100%', minWidth: 0 }}>
            <button onClick={() => setSearchQuery('')} style={{ padding: '7px 18px', borderRadius: 20, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', background: !searchQuery ? '#10b981' : isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0', color: !searchQuery ? '#fff' : textMuted, transition: 'all 0.2s', flexShrink: 0 }}>All Books</button>
            {[...new Set(allBooks.map(b => b.CategoryName).filter(Boolean))].sort().map(cat => (
              <button key={cat} onClick={() => setSearchQuery(cat)} style={{ padding: '7px 18px', borderRadius: 20, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', background: searchQuery === cat ? '#10b981' : isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0', color: searchQuery === cat ? '#fff' : textMuted, transition: 'all 0.2s', flexShrink: 0 }}>{cat}</button>
            ))}
          </div>

          {/* Books grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))', gap: 20 }}>
            {allBooks.filter(b => {
              if (!searchQuery) return true;
              const q = searchQuery.toLowerCase();
              return b.Title?.toLowerCase().includes(q) || b.Authors?.toLowerCase().includes(q) || b.CategoryName?.toLowerCase().includes(q);
            }).map((b, i) => (
              <BookCard
                key={b.BookID}
                book={b}
                isDark={isDark}
                inCart={myBorrowCart.some(item => String(item.bookId) === String(b.BookID))}
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
            .wiz-btn-secondary { background: ${isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9'}; color:${textMuted}; border:none; padding:11px 20px; border-radius:10px; font-weight:700; font-size:13px; cursor:pointer; transition:all .2s; }
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
                  border: `2px dashed ${isDark ? '#10b981' : '#059669'}`, borderRadius: 12, padding: '28px 16px',
                  background: isDark ? 'rgba(16,185,129,0.04)' : 'rgba(5,150,105,0.04)',
                  cursor: 'pointer', transition: 'background .2s'
                }}
              >
                <span style={{ fontSize: 32 }}>{isbnLoading ? '⏳' : '🖼️'}</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#34d399' : '#065f46' }}>
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
                <div style={{
                  padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  background: isbnMsg.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: isbnMsg.ok ? '#10b981' : '#ef4444',
                  border: `1px solid ${isbnMsg.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                }}>
                  {isbnMsg.text}
                </div>
              )}

              {isbnPreview && (
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: isDark ? 'rgba(16,185,129,0.06)' : 'rgba(5,150,105,0.06)', borderRadius: 12, padding: 14 }}>
                  {isbnPreview.coverUrl && <img src={isbnPreview.coverUrl} alt="cover" style={{ width: 60, height: 88, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />}
                  <div style={{ fontSize: 13, color: textPrimary, lineHeight: 1.7 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: isDark ? '#34d399' : '#065f46' }}>{isbnPreview.title}</div>
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
                  {isbnPreview?.publisher && !publishers.find(p => p.PublisherName?.toLowerCase().includes((isbnPreview.publisher || '').toLowerCase().substring(0, 6))) && (
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
                  <div key={k} style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc', borderRadius: 8, padding: '8px 12px' }}>
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
                    onClick={e => submitBook({ preventDefault: () => { } })}
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
          <div style={{ background: cardBg, backdropFilter: 'blur(12px)', borderRadius: 16, border: `1px solid ${border}`, padding: 24 }}>
            <h3 style={{ color: textPrimary, marginBottom: 16 }}>Manage Categories</h3>
            <form onSubmit={(e) => handleAddMeta(e, 'categories', categoryForm, setCategoryForm, { CategoryName: '', Description: '' }, setCategoryMsg)} style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <input required type="text" placeholder="Category Name" value={categoryForm.CategoryName} onChange={e => setCategoryForm({ ...categoryForm, CategoryName: e.target.value })} style={dynInputStyle} />
              <input type="text" placeholder="Description" value={categoryForm.Description} onChange={e => setCategoryForm({ ...categoryForm, Description: e.target.value })} className="interactive-input" style={dynInputStyle} />
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
                      <button className="interactive-btn" onClick={() => setEditModal({ type: 'categories', item: c })} style={{ background: 'transparent', color: '#3b82f6', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Authors */}
          <div style={{ background: cardBg, backdropFilter: 'blur(12px)', borderRadius: 16, border: `1px solid ${border}`, padding: 24 }}>
            <h3 style={{ color: textPrimary, marginBottom: 16 }}>Manage Authors</h3>
            <form onSubmit={(e) => handleAddMeta(e, 'authors', authorForm, setAuthorForm, { FirstName: '', LastName: '', Bio: '', Nationality: '' }, setAuthorMsg)} style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <input required type="text" placeholder="First Name" value={authorForm.FirstName} onChange={e => setAuthorForm({ ...authorForm, FirstName: e.target.value })} style={{ ...dynInputStyle, flex: 1, minWidth: 120 }} />
              <input required type="text" placeholder="Last Name" value={authorForm.LastName} onChange={e => setAuthorForm({ ...authorForm, LastName: e.target.value })} style={{ ...dynInputStyle, flex: 1, minWidth: 120 }} />
              <input type="text" placeholder="Nationality" value={authorForm.Nationality} onChange={e => setAuthorForm({ ...authorForm, Nationality: e.target.value })} style={{ ...dynInputStyle, flex: 1, minWidth: 120 }} />
              <input type="text" placeholder="Bio" value={authorForm.Bio} onChange={e => setAuthorForm({ ...authorForm, Bio: e.target.value })} style={{ ...dynInputStyle, flex: 2, minWidth: 200 }} />
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
                      <button className="interactive-btn" onClick={() => setEditModal({ type: 'authors', item: a })} style={{ background: 'transparent', color: '#3b82f6', border: 'none', cursor: 'pointer', fontWeight: 600, marginRight: 12 }}>Edit</button>
                      <button className="interactive-btn" onClick={() => handleDeleteMeta('authors', a.AuthorID, setAuthorMsg)} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Publishers */}
          <div style={{ background: cardBg, backdropFilter: 'blur(12px)', borderRadius: 16, border: `1px solid ${border}`, padding: 24 }}>
            <h3 style={{ color: textPrimary, marginBottom: 16 }}>Manage Publishers</h3>
            <form onSubmit={(e) => handleAddMeta(e, 'publishers', publisherForm, setPublisherForm, { PublisherName: '', Email: '', Phone: '', Address: '' }, setPublisherMsg)} style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <input required type="text" placeholder="Publisher Name" value={publisherForm.PublisherName} onChange={e => setPublisherForm({ ...publisherForm, PublisherName: e.target.value })} style={{ ...dynInputStyle, flex: 2, minWidth: 200 }} />
              <input type="email" placeholder="Email" value={publisherForm.Email} onChange={e => setPublisherForm({ ...publisherForm, Email: e.target.value })} style={{ ...dynInputStyle, flex: 1, minWidth: 150 }} />
              <input type="text" placeholder="Phone" value={publisherForm.Phone} onChange={e => setPublisherForm({ ...publisherForm, Phone: e.target.value })} style={{ ...dynInputStyle, flex: 1, minWidth: 120 }} />
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
                      <button onClick={() => setEditModal({ type: 'publishers', item: p })} style={{ background: 'transparent', color: '#3b82f6', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'circulation' && (
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280, background: cardBg, backdropFilter: 'blur(12px)', borderRadius: 16, border: `1px solid ${border}`, padding: 28 }}>
            <h3 style={{ fontSize: 18, marginBottom: 4, color: textPrimary, fontWeight: 700 }}>📤 Issue Book</h3>
            <p style={{ color: textMuted, fontSize: 13, marginBottom: 20 }}>Issue a book copy to a member</p>
            <form onSubmit={handleIssue} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lblStyle}>Member ID</label>
                <input required type="number" value={issueForm.memberId} onChange={e => setIssueForm({ ...issueForm, memberId: e.target.value })} style={dynInputStyle} placeholder="Numeric Member ID" />
              </div>
              <div>
                <label style={lblStyle}>Copy ID</label>
                <input required type="number" value={issueForm.copyId} onChange={e => setIssueForm({ ...issueForm, copyId: e.target.value })} className="interactive-input" style={dynInputStyle} placeholder="Specific Copy ID" />
              </div>
              <div style={{ position: 'relative' }}>
                <button type="submit" className="interactive-btn btn-pulse" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(16,185,129,0.25)', width: '100%' }}>Issue Book →</button>
                <BubblePopup msg={issueMsg} onClear={() => setIssueMsg('')} />
              </div>
            </form>
          </div>

          <div style={{ flex: 1, minWidth: 280, background: cardBg, backdropFilter: 'blur(12px)', borderRadius: 16, border: `1px solid ${border}`, padding: 28 }}>
            <h3 style={{ fontSize: 18, marginBottom: 4, color: textPrimary, fontWeight: 700 }}>📥 Process Return</h3>
            <p style={{ color: textMuted, fontSize: 13, marginBottom: 20 }}>Record a book return and log its condition</p>
            <form onSubmit={handleReturn} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lblStyle}>Borrow ID</label>
                <input required type="number" value={returnForm.borrowId} onChange={e => setReturnForm({ ...returnForm, borrowId: e.target.value })} style={dynInputStyle} placeholder="Borrow Record ID" />
              </div>
              <div>
                <label style={lblStyle}>Condition on Return</label>
                <select value={returnForm.condition} onChange={e => setReturnForm({ ...returnForm, condition: e.target.value })} style={dynInputStyle}>
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
                <button type="submit" style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(59,130,246,0.25)', width: '100%' }}>Process Return →</button>
                <BubblePopup msg={returnMsg} onClear={() => setReturnMsg('')} />
              </div>
            </form>
          </div>
        </div>
      )}

      {tab === 'profile' && <ProfileTab user={user} c={{ card: cardBg, text: textPrimary, muted: textMuted, border: border, input: inputBg }} />}

      {/* Edit Modals */}
      {editModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: cardBg, borderRadius: 20, padding: 32, width: editModal.type === 'books' ? 600 : 400, border: `1px solid ${border}`, boxShadow: '0 30px 80px rgba(0,0,0,0.5)', color: textPrimary }}>
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
                    <textarea name="Bio" defaultValue={editModal.item.Bio} style={{ ...dynInputStyle, minHeight: 60 }} />
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

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button type="button" onClick={() => setEditModal(null)} style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${border}`, background: 'transparent', color: textMuted, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: 11, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcodes Modal */}
      {barcodesModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', padding: 24 }}>
          <div style={{ background: cardBg, borderRadius: 24, padding: 36, width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${border}`, boxShadow: '0 40px 100px rgba(0,0,0,0.6)', animation: 'fadeInScale 0.25s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 50, height: 50, borderRadius: 14, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: '0 4px 16px rgba(16,185,129,0.4)' }}>🏷️</div>
                <div>
                  <h2 style={{ color: textPrimary, margin: 0, fontSize: 22, fontWeight: 800 }}>Barcodes: {barcodesModal.Title}</h2>
                  <p style={{ color: textMuted, margin: 0, fontSize: 13 }}>Printable labels for physical copies</p>
                </div>
              </div>
              <button onClick={() => setBarcodesModal(null)} style={{ background: 'transparent', border: 'none', color: textMuted, fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>✖</button>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
          <style>{`
            @keyframes mbIn { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
            @keyframes mbCardIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
            .mb-card { animation: mbCardIn 0.3s ease both; transition: transform 0.2s, box-shadow 0.2s; }
            .mb-card:hover { transform: translateY(-5px); box-shadow: 0 14px 36px rgba(0,0,0,0.16) !important; }
            .mb-btn { transition: all 0.18s ease; border:none; cursor:pointer; font-weight:700; border-radius:8px; }
            .mb-btn:hover:not(:disabled) { filter:brightness(1.1); transform:translateY(-2px); }
            .mb-btn:disabled { opacity:0.45; cursor:not-allowed; }
          `}</style>

          {/* ── Policy banner ── */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16, background: isDark ? 'rgba(99,102,241,0.08)' : 'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.06))', border: isDark ? '1px solid rgba(99,102,241,0.3)' : '2px solid rgba(99,102,241,0.3)', borderRadius: 14, padding: '16px 20px', boxSizing: 'border-box' }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>ℹ️</span>
            <div style={{ flex: '1 1 280px', minWidth: 0 }}>
              <div style={{ fontWeight: 800, color: isDark ? '#818cf8' : '#4338ca', fontSize: 14, marginBottom: 4 }}>Staff Borrow Policy</div>
              <div style={{ fontSize: 13, color: isDark ? '#a5b4fc' : '#4f46e5', lineHeight: 1.6 }}>As a staff member you may borrow books for personal use. Browse the catalog, add books to your cart, then submit a borrow request. Your request must be approved by an <strong>Administrator</strong> at the desk.</div>
            </div>
            <button
              onClick={() => setTab('browse')}
              style={{ flexShrink: 0, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 14px rgba(99,102,241,0.35)', margin: '4px 0' }}
            >
              📚 Browse Catalog →
            </button>
          </div>

          {/* ── Error message (non-ok only) ── */}
          {myBorrowMsg.text && !myBorrowMsg.ok && (
            <div style={{ animation: 'mbIn 0.3s ease', padding: '12px 18px', borderRadius: 12, fontWeight: 700, fontSize: 14, background: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', color: isDark ? '#f87171' : '#991b1b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, wordBreak: 'break-word', boxSizing: 'border-box' }}>
              <span>⚠️ {myBorrowMsg.text}</span>
              <button onClick={() => setMyBorrowMsg({ text: '', ok: true })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 900, color: 'inherit', fontSize: 16, flexShrink: 0 }}>✕</button>
            </div>
          )}

          {/* ── Success Screen (shown after submit) ── */}
          {myBorrowResult && (
            <div style={{ animation: 'mbIn 0.4s ease', background: cardBg, border: `1px solid ${border}`, borderRadius: 20, padding: '40px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: textPrimary, marginBottom: 8 }}>Request Submitted!</h2>
              <p style={{ color: textMuted, fontSize: 14, marginBottom: 28 }}>Show the code below to an Admin at the library desk for approval.</p>

              <div style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius: 20, padding: '32px 36px', marginBottom: 28, boxShadow: '0 16px 48px rgba(79,70,229,0.4)', display: 'inline-block', minWidth: 280 }}>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Your Request Code</div>
                <div style={{ fontSize: 42, fontWeight: 900, fontFamily: 'monospace', color: '#fff', letterSpacing: 5 }}>{myBorrowResult.requestCode || '—'}</div>
                {myBorrowResult.pickupDeadline && (
                  <div style={{ marginTop: 14, color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                    Pick up before: {new Date(myBorrowResult.pickupDeadline).toLocaleString()}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    setMyBorrowResult(null)
                    // Data is already loaded by refreshMyBorrows() before this screen appeared
                    // Scroll to history section smoothly
                    setTimeout(() => {
                      document.getElementById('staff-borrow-history')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }, 100)
                  }}
                  style={{ padding: '12px 26px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: 14, boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
                >
                  📖 View My Borrowings
                </button>
                <button
                  onClick={() => { setMyBorrowResult(null); setTab('browse'); }}
                  style={{ padding: '12px 26px', background: 'transparent', color: textMuted, border: `1px solid ${border}`, borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
                >
                  Browse More Books
                </button>
              </div>
            </div>
          )}

          {/* ── Cart (BorrowCartPage-style) ── */}
          {!myBorrowResult && myBorrowCart.length > 0 && (
            <div style={{ animation: 'mbIn 0.35s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: textPrimary }}>🛒 Borrow Cart</h2>
                  <p style={{ margin: '4px 0 0', color: textMuted, fontSize: 13 }}>{myBorrowCart.length} book{myBorrowCart.length !== 1 ? 's' : ''} ready to borrow</p>
                </div>
                <button onClick={() => setTab('browse')} style={{ padding: '9px 18px', background: 'transparent', color: textMuted, border: `1px solid ${border}`, borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                  ← Continue Browsing
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr min(320px,100%)', gap: 20, alignItems: 'start' }}>
                {/* Book cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {myBorrowCart.map((item, i) => (
                    <div key={item.copyId} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, overflow: 'hidden', display: 'flex', transition: 'all 0.2s ease' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                    >
                      <div style={{ width: 7, flexShrink: 0, background: CART_GRADIENTS[i % CART_GRADIENTS.length] }} />
                      <div style={{ width: 84, flexShrink: 0, background: CART_GRADIENTS[i % CART_GRADIENTS.length], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 32 }}>📚</span>
                      </div>
                      <div style={{ flex: 1, padding: '16px 18px' }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: textPrimary, marginBottom: 4 }}>{item.title}</div>
                        {item.authors && <div style={{ color: '#3b82f6', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>By {item.authors}</div>}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {item.category && <span style={{ fontSize: 11, background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', color: textMuted, padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>{item.category}</span>}
                          <span style={{ fontSize: 11, background: 'rgba(16,185,129,0.12)', color: '#10b981', padding: '3px 10px', borderRadius: 20, fontWeight: 700, border: '1px solid rgba(16,185,129,0.25)' }}>Copy #{item.copyId}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px' }}>
                        <button onClick={() => removeFromMyCart(item.copyId)} style={{ background: isDark ? 'rgba(239,68,68,0.12)' : '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 9, padding: '7px 13px', fontWeight: 800, cursor: 'pointer', fontSize: 13, transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fca5a5'; e.currentTarget.style.color = '#7f1d1d'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.12)' : '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
                        >
                          ✕ Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setMyBorrowCart([])} style={{ alignSelf: 'flex-start', background: 'transparent', color: textMuted, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, textDecoration: 'underline', padding: 0 }}>
                    Clear all books
                  </button>
                </div>

                {/* Summary Panel */}
                <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 18, padding: 24, position: 'sticky', top: 80 }}>
                  <div style={{ fontWeight: 900, fontSize: 17, color: textPrimary, marginBottom: 18 }}>Order Summary</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                    {myBorrowCart.map(item => (
                      <div key={item.copyId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 15 }}>📖</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                        </div>
                        <span style={{ fontSize: 11, color: textMuted, flexShrink: 0 }}>#{item.copyId}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop: `1px solid ${border}`, paddingTop: 14, marginBottom: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: textMuted, fontSize: 13, marginBottom: 6 }}><span>Books</span><span>{myBorrowCart.length}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: textMuted, fontSize: 13, marginBottom: 6 }}><span>Loan period</span><span>7 days</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: textPrimary, marginTop: 10 }}><span>Total</span><span>{myBorrowCart.length} book{myBorrowCart.length !== 1 ? 's' : ''}</span></div>
                  </div>
                  <div style={{ background: isDark ? 'rgba(99,102,241,0.08)' : '#eff6ff', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 11, padding: '11px 14px', marginBottom: 18 }}>
                    <div style={{ fontSize: 12, color: '#6366f1', fontWeight: 700, marginBottom: 3 }}>📋 How it works</div>
                    <div style={{ fontSize: 12, color: textMuted, lineHeight: 1.6 }}>
                      After submitting, show your <strong>request code</strong> to an <strong>Admin</strong> at the desk for approval.
                    </div>
                  </div>
                  <button
                    onClick={submitMyBorrow}
                    disabled={myBorrowLoading}
                    style={{ width: '100%', padding: '14px', background: myBorrowLoading ? '#64748b' : 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', borderRadius: 13, fontWeight: 900, fontSize: 15, cursor: myBorrowLoading ? 'not-allowed' : 'pointer', boxShadow: '0 8px 24px rgba(99,102,241,0.35)', transition: 'all 0.2s ease' }}
                    onMouseEnter={e => { if (!myBorrowLoading) e.currentTarget.style.filter = 'brightness(1.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
                  >
                    {myBorrowLoading ? '⏳ Submitting...' : `🚀 Submit Request (${myBorrowCart.length} book${myBorrowCart.length !== 1 ? 's' : ''})`}
                  </button>
                  <p style={{ margin: '10px 0 0', color: textMuted, fontSize: 11, textAlign: 'center' }}>Admin approval required at the desk.</p>
                </div>
              </div>
            </div>
          )}


          {/* ── My Borrow History ── */}
          <div id="staff-borrow-history" style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, overflow: 'hidden', maxWidth: '100%', boxSizing: 'border-box' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 20 }}>📖</span>
                <span style={{ fontWeight: 800, fontSize: 15, color: textPrimary }}>My Borrow History</span>
                {myBorrows.length > 0 && (
                  <span style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1', borderRadius: 20, fontSize: 11, fontWeight: 800, padding: '2px 10px', border: '1px solid rgba(99,102,241,0.25)' }}>
                    {myBorrows.length} record{myBorrows.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <button onClick={() => setTab('browse')} style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                + Borrow More Books
              </button>
            </div>

            {myBorrows.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: textMuted }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No borrow records yet</div>
                <div style={{ fontSize: 13, marginBottom: 20 }}>Browse the catalog to find books and add them to your cart.</div>
                <button onClick={() => setTab('browse')} style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
                  📚 Browse Catalog
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                  <thead style={{ background: tableHead }}>
                    <tr>
                      {['Book', 'Request Code', 'Borrowed', 'Due Date', 'Return Date', 'Status', 'Action'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: textMuted, textTransform: 'uppercase', letterSpacing: .6, borderBottom: `1px solid ${border}` }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {myBorrows.map((b, i) => {
                      const title = b.bookTitle || b.Title || b.title || '—';
                      const requestCode = b.requestCode || b.RequestCode || '—';
                      const borrowDate = b.borrowDate || b.BorrowDate;
                      const dueDate = b.dueDate || b.DueDate;
                      const returnDate = b.returnDate || b.ReturnDate;
                      const st = b.status || b.Status || '';
                      const borrowId = b.borrowId || b.BorrowID;
                      const isPending = st === 'Pending';
                      const isBorrowed = st === 'Borrowed';
                      const isOverdue = st === 'Overdue';
                      const isReturned = st === 'Returned' || st === 'returned';
                      const isExpired = st === 'Expired';
                      const col = isPending ? '#f59e0b' : isBorrowed ? '#10b981' : isOverdue ? '#ef4444' : isReturned ? '#6366f1' : isExpired ? '#ef4444' : '#94a3b8';
                      const statusLabel = isPending ? 'Pending' : isBorrowed ? 'Active' : isOverdue ? 'Overdue' : isReturned ? 'Returned' : isExpired ? 'Expired' : st;
                      const fmt = (d) => d ? new Date(d).toLocaleDateString() : '—';

                      return (
                        <tr key={borrowId || i} style={{ borderTop: `1px solid ${border}`, background: isPending ? (isDark ? 'rgba(245,158,11,0.07)' : '#fffbeb') : 'transparent' }}>
                          <td style={{ padding: '14px 16px', fontWeight: 700, color: textPrimary }}>
                            <div style={{ fontSize: 14 }}>{title}</div>
                            {isPending && <div style={{ color: '#d97706', fontSize: 11, marginTop: 2, fontWeight: 600 }}>⏳ Awaiting admin approval at the desk</div>}
                            {isExpired && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 2, fontWeight: 600 }}>⌛ Request expired (not picked up within 5 mins)</div>}
                          </td>
                          <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#3b82f6', fontSize: 13, fontWeight: 700 }}>{requestCode}</td>
                          <td style={{ padding: '14px 16px', color: textMuted, fontSize: 13 }}>{fmt(borrowDate)}</td>
                          <td style={{ padding: '14px 16px', color: isOverdue ? '#ef4444' : textMuted, fontWeight: isOverdue ? 800 : 400, fontSize: 13 }}>{fmt(dueDate)}</td>
                          <td style={{ padding: '14px 16px', color: textMuted, fontSize: 13 }}>{fmt(returnDate)}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              fontSize: 11, fontWeight: 800, padding: '5px 12px',
                              borderRadius: 20, background: `${col}18`, color: col,
                              border: `1px solid ${col}40`, whiteSpace: 'nowrap', display: 'inline-block'
                            }}>
                              {statusLabel}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            {isPending && (
                              <button
                                onClick={() => retractMyBorrow(borrowId)}
                                style={{
                                  background: 'rgba(239,68,68,0.08)',
                                  color: '#ef4444',
                                  border: '1.5px solid rgba(239,68,68,0.3)',
                                  borderRadius: 8,
                                  padding: '5px 12px',
                                  fontWeight: 700,
                                  fontSize: 12,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  whiteSpace: 'nowrap'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.16)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                              >
                                ✕ Retract
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
      lookupMember({ preventDefault: () => { } });
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
                      onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      placeholder="Amount"
                      required
                      style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid #93c5fd`, width: 120, outline: 'none' }}
                    />
                    <select
                      value={paymentForm.method}
                      onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}
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
      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 32, marginBottom: 24, backdropFilter: 'blur(12px)' }}>
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

      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 32, backdropFilter: 'blur(12px)' }}>
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
  <div className="stat-card interactive-card" style={{ background: cardBg, backdropFilter: 'blur(12px)', border: highlight ? `2px solid ${color}` : `1px solid ${border}`, borderRadius: 12, padding: '14px 18px', boxShadow: highlight ? `0 0 24px ${color}22` : 'none' }}>
    <div style={{ fontSize: 11, color: highlight ? color : '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{title}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: highlight ? color : textPrimary }}>{value ?? '�'}</div>
  </div>
)
