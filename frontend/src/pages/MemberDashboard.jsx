import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useCart } from '../context/CartContext'
import DashboardShell from '../components/DashboardShell'
import BookCard from '../components/BookCard'
import api from '../api/axiosInstance'
import BubblePopup from '../components/BubblePopup'

import { io } from 'socket.io-client'
import { startRegistration, startAuthentication } from '@simplewebauthn/browser'

const makeNavItems = (pendingBorrows, pendingFines, pendingReservations, cartCount) => [
  { key: 'catalog',      label: 'Browse Catalog',    icon: '📚' },
  { key: 'borrows',      label: 'My Borrowings',     icon: '📖', badge: pendingBorrows },
  { key: 'reservations', label: 'My Reservations',   icon: '🕒', badge: pendingReservations },
  { key: 'fines',        label: 'My Fines',          icon: '💳', badge: pendingFines > 0 ? 1 : 0 },
  { key: 'profile',      label: 'My Profile',        icon: '👤' },
  { key: 'cart',         label: 'Borrow Cart',       icon: '🛒', badge: cartCount, path: '/borrow-cart' },
]

const tabTitles = {
  catalog:      'Browse Catalog',
  borrows:      'My Borrowings',
  reservations: 'My Reservations',
  fines:        'My Fines',
  profile:      'My Profile',
}

const fmt = (d) => d ? new Date(d).toLocaleDateString() : '—'
const fmtDT = (d) => d ? new Date(d).toLocaleString() : '—'

export default function MemberDashboard() {
  const { user, logout } = useAuth()
  const { isDark } = useTheme()
  const { cart, addToCart, removeFromCart, clearCart } = useCart()
  const location = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(location.search)
  const initialTab = params.get('tab') || location.state?.tab || 'catalog'

  const [tab, setTab] = useState(initialTab)
  const [searchQuery, setSearchQuery] = useState('')
  const [dashboard, setDashboard] = useState(null)
  const [books, setBooks] = useState([])
  const [borrows, setBorrows] = useState([])
  const [reservations, setReservations] = useState([])
  const [fines, setFines] = useState([])
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [cartMsg, setCartMsg] = useState('')
  const noticeTimerRef = useRef(null)

  // Auto-dismiss floating toast after 4 seconds
  const showNotice = (msg) => {
    setNotice(msg)
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current)
    noticeTimerRef.current = setTimeout(() => setNotice(''), 4000)
  }
  const [payingFineId, setPayingFineId] = useState(null)
  const [receiptData, setReceiptData] = useState(null)

  const [profilePhone, setProfilePhone] = useState('')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmNewPw, setConfirmNewPw] = useState('')
  const [profileNotice, setProfileNotice] = useState({ text: '', type: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [showProfilePw, setShowProfilePw] = useState(false)

  useEffect(() => {
    if (user?.Phone) {
      setProfilePhone(user.Phone)
    }
  }, [user])

  const pendingBorrows = borrows.filter(b => b.Status === 'Pending').length
  const pendingReservations = reservations.filter(r => r.Status === 'Queued' || r.Status === 'Ready').length
  const pendingFines = fines.filter(f => f.FineStatus !== 'Paid' && Number(f.Balance) > 0).length
  const navItems = makeNavItems(pendingBorrows, pendingFines, pendingReservations)

  useEffect(() => { loadAll() }, [])

  useEffect(() => {
    const txRef = params.get('tx_ref')
    if (txRef) verifyChapa(txRef)
  }, [location.search])

  useEffect(() => {
    if (!user?.UserID) return
    const socket = io('http://localhost:4000', {
      auth: { token: localStorage.getItem('lms_token') }
    })

    socket.on('connect', () => {
      console.log('Connected to socket server')
      socket.emit('join', `member:${user.UserID}`)
    })

    socket.on('reservation:updated', () => {
      console.log('Reservation updated event received. Reloading...')
      loadAll()
    })

    socket.on('queue:promoted', (data) => {
      console.log('Queue promoted event received:', data)
      setNotice(`🎉 Dynamic Update: You have been promoted in the waitlist for a book! It is now Ready for pickup.`)
      loadAll()
    })

    return () => {
      socket.disconnect()
    }
  }, [user])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [dash, catalog, borrowed, reserved, fineRows] = await Promise.all([
        api.get('/member/dashboard'),
        api.get('/member/books'),
        api.get('/member/my-borrowings'),
        api.get('/member/my-reservations'),
        api.get('/member/my-fines'),
      ])
      setDashboard(dash.data.data)
      setBooks(catalog.data.data || [])
      setBorrows(borrowed.data.data || [])
      setReservations(reserved.data.data || [])
      setFines(fineRows.data.data || [])
    } catch (err) {
      setNotice(err.response?.data?.message || 'Could not load dashboard')
    } finally { setLoading(false) }
  }

  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return books.filter(book => {
      const matchSearch = !q || [book.Title, book.Authors, book.CategoryName, book.ISBN]
        .some(v => String(v || '').toLowerCase().includes(q))
      const matchCat = !category || book.CategoryName === category
      return matchSearch && matchCat
    })
  }, [books, searchQuery, category])

  const categories = useMemo(() =>
    [...new Set(books.map(b => b.CategoryName).filter(Boolean))], [books])

  const cartCopyIds = cart.map(i => i.copyId)

  const handleAddToCart = (book) => {
    const copyId = String(book.AvailableCopyIds || '').split(',').filter(Boolean)[0]
    if (!copyId) return setNotice('No available copy right now. Join the waitlist!')
    if (cartCopyIds.includes(Number(copyId))) return setNotice('Already in your cart.')
    addToCart({ bookId: book.BookID, copyId: Number(copyId), title: book.Title, authors: book.Authors, category: book.CategoryName })
    setNotice(`✅ "${book.Title}" added to borrow cart.`)
  }

  const submitBorrowRequest = async () => {
    if (!cart.length) return setCartMsg('Add at least one book first.')
    setCartMsg('')
    try {
      const res = await api.post('/borrowing/request', { copyIds: cart.map(i => i.copyId) })
      showNotice(res.data.data?.message || 'Request submitted! Show the code at the desk.')
      clearCart(); await loadAll(); setTab('borrows')
    } catch (err) { setCartMsg(err.response?.data?.message || err.message) }
  }

  const joinWaitlist = async (bookId) => {
    try {
      await api.post('/member/reserve', { bookId })
      setNotice('Added to waitlist.'); await loadAll(); setTab('reservations')
    } catch (err) { setNotice(err.response?.data?.message || err.message) }
  }

  const cancelReservation = async (id) => {
    try {
      await api.delete(`/member/reservations/${id}`)
      setNotice('Reservation cancelled.'); await loadAll()
    } catch (err) { setNotice(err.response?.data?.message || err.message) }
  }

  const retractBorrow = async (borrowId) => {
    try {
      await api.delete(`/member/borrows/${borrowId}/retract`)
      setNotice('✅ Request retracted. Book is now available again.')
      await loadAll()
    } catch (err) { setNotice('Error: ' + (err.response?.data?.message || err.message)) }
  }

  const payWithChapa = async (fine, amount) => {
    setPayingFineId(fine.FineID)
    try {
      const res = await api.post('/member/payments/chapa/initialize', { fineId: fine.FineID, amount })
      const url = res.data.data?.checkoutUrl
      if (url) window.location.href = url
      else setNotice('No checkout URL returned from Chapa.')
    } catch (err) { setNotice(err.response?.data?.message || err.message) }
    finally { setPayingFineId(null) }
  }

  const recordMockPayment = async (fine, amount, phone) => {
    setPayingFineId(fine.FineID)
    try {
      const res = await api.post('/member/payments/mock', { fineId: fine.FineID, amount, phone })
      setNotice('✅ Payment successful!')
      if (res.data.data?.receipt) setReceiptData(res.data.data.receipt)
      await loadAll()
    } catch (err) { setNotice(err.response?.data?.message || err.message) }
    finally { setPayingFineId(null) }
  }

  const verifyChapa = async (txRef) => {
    try {
      const res = await api.get(`/member/payments/chapa/verify/${txRef}`)
      setNotice(res.data.data?.completed ? 'Payment verified ✅' : 'Payment not completed.')
      navigate('/member?tab=fines', { replace: true }); await loadAll()
    } catch (err) { setNotice(err.response?.data?.message || err.message) }
  }

  const registerFingerprint = async () => {
    try {
      setNotice('Waiting for fingerprint...');
      const res = await api.post('/auth/webauthn/register/begin')
      const options = res.data.data;
      
      const attResp = await startRegistration({ optionsJSON: options });
      
      const verifyRes = await api.post('/auth/webauthn/register/complete', attResp);
      if (verifyRes.data.success) {
        setNotice('✅ Fingerprint registered successfully!');
      }
    } catch (err) {
      console.error(err);
      setNotice('Registration failed: ' + (err.message || 'Unknown error'));
    }
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    setProfileNotice({ text: '', type: '' })

    if (newPw && newPw !== confirmNewPw) {
      setProfileNotice({ text: '❌ New passwords do not match.', type: 'error' })
      return
    }

    setSavingProfile(true)
    try {
      // Step A: Check if registered fingerprint credentials exist
      const checkRes = await api.get('/member/has-fingerprint')
      const { hasFingerprint } = checkRes.data.data

      if (hasFingerprint) {
        // Step B: Authenticate via WebAuthn
        setProfileNotice({ text: '🔑 Please touch your fingerprint sensor to authorize changes...', type: 'info' })
        const beginRes = await api.post('/auth/webauthn/login/begin', { identifier: user.Email, loginType: 'student' })
        const { options, userId } = beginRes.data.data

        const attResp = await startAuthentication({ optionsJSON: options })
        const verifyRes = await api.post('/auth/webauthn/login/complete', { userId, response: attResp })

        if (!verifyRes.data.success) {
          throw new Error('Biometric verification failed.')
        }
      }

      // Step C: Save details
      setProfileNotice({ text: '💾 Saving profile changes...', type: 'info' })
      await api.put('/member/profile', {
        phone: profilePhone,
        password: newPw || null,
        currentPassword: currentPw || null
      })

      setProfileNotice({ text: '✅ Profile updated successfully!', type: 'success' })
      setCurrentPw('')
      setNewPw('')
      setConfirmNewPw('')
    } catch (err) {
      console.error(err)
      setProfileNotice({
        text: '❌ Error: ' + (err.response?.data?.message || err.message || 'Verification cancelled.'),
        type: 'error'
      })
    } finally {
      setSavingProfile(false)
    }
  }

  const blocked   = dashboard?.borrowingBlocked
  const overdueCount = dashboard?.overdueCount || 0
  const fineBalance  = dashboard?.fineBalance  || 0
  const dmgBalance   = dashboard?.damageOrLossFineBalance || 0

  // Suspension reason message
  const suspendReason = overdueCount > 0 && fineBalance > 0
    ? `You have ${overdueCount} overdue book(s) and ETB ${Number(fineBalance).toFixed(2)} in unpaid fines.`
    : overdueCount > 0
    ? `You have ${overdueCount} overdue book(s) not yet returned.`
    : fineBalance > 0
    ? `You have ETB ${Number(fineBalance).toFixed(2)} in unpaid fines (overdue/damage/loss).`
    : ''

  const c = {
    bg:    isDark ? '#0a0e1a' : '#f1f5f9',
    card:  isDark ? '#161b27' : '#fff',
    border:isDark ? '#1e2d40' : '#e2e8f0',
    text:  isDark ? '#f1f5f9' : '#0f172a',
    muted: '#64748b',
    input: isDark ? '#1e2d40' : '#f8fafc',
  }

  return (
    <DashboardShell role="member" navItems={navItems} activeTab={tab} setTab={setTab}
      user={user} logout={logout} tabLabel={tabTitles[tab] || 'Member Dashboard'}
      searchQuery={searchQuery} setSearchQuery={setSearchQuery}>

      <style>{`
        @keyframes cardIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulseSoft { 0%,100%{box-shadow:0 0 0 rgba(37,99,235,0)} 50%{box-shadow:0 0 28px rgba(37,99,235,.22)} }
        .m-card { animation:cardIn .35s ease both; transition:transform .2s,box-shadow .2s,border-color .2s; }
        .m-card:hover { transform:translateY(-4px); box-shadow:0 16px 34px rgba(15,23,42,.12); border-color:rgba(37,99,235,.35)!important; }
        .m-btn  { transition:transform .18s,filter .18s; }
        .m-btn:hover:not(:disabled) { transform:translateY(-1px); filter:brightness(1.05); }
      `}</style>

      {/* Floating Bottom Toast */}
      {notice && (
        <div
          onClick={() => setNotice('')}
          style={{
            position: 'fixed',
            bottom: 36,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            background: isDark ? 'linear-gradient(135deg,#1e293b,#0f172a)' : 'linear-gradient(135deg,#1e3a8a,#1d4ed8)',
            color: '#fff',
            padding: '13px 28px',
            borderRadius: 50,
            fontWeight: 700,
            fontSize: 14,
            boxShadow: '0 16px 48px rgba(37,99,235,0.35)',
            border: '1.5px solid rgba(99,102,241,0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            whiteSpace: 'nowrap',
            maxWidth: '90vw',
            animation: 'cardIn .3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          <span style={{ fontSize: 16 }}>ℹ️</span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{notice}</span>
          <span style={{ opacity: 0.7, marginLeft: 8, fontSize: 16 }}>✕</span>
        </div>
      )}

      {/* Suspension Banner */}
      {blocked && (
        <div className="m-card" style={{ marginBottom:18, padding:18, borderRadius:14, border:'1px solid rgba(239,68,68,.4)', background:isDark?'rgba(239,68,68,.1)':'#fef2f2', display:'flex', alignItems:'flex-start', gap:14 }}>
          <span style={{ fontSize:28, flexShrink:0 }}>🔒</span>
          <div style={{ flex:1 }}>
            <div style={{ color:'#dc2626', fontWeight:900, fontSize:16 }}>Borrowing Suspended</div>
            <div style={{ color:'#b91c1c', fontSize:13, marginTop:4 }}>{suspendReason}</div>
            {fineBalance > 0 && (
              <div style={{ marginTop:10, display:'flex', gap:10, flexWrap:'wrap' }}>
                <button className="m-btn" onClick={() => setTab('fines')}
                  style={{ background:'#dc2626', color:'#fff', border:'none', borderRadius:9, padding:'8px 18px', fontWeight:800, cursor:'pointer', fontSize:13 }}>
                  💳 Pay Fines Now
                </button>
                <button className="m-btn" onClick={() => setTab('fines')}
                  style={{ background:'transparent', color:'#dc2626', border:'1px solid #dc2626', borderRadius:9, padding:'8px 18px', fontWeight:700, cursor:'pointer', fontSize:13 }}>
                  View Fine Details →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Strip */}
      <SummaryStrip dashboard={dashboard} loading={loading} isDark={isDark} c={c} />

      {/* CATALOG */}
      {tab === 'catalog' && (
        <div style={{ position: 'relative' }}>
          {/* Category pills */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
            <button onClick={() => setCategory('')} className="m-btn"
              style={{ padding:'5px 12px', borderRadius:20, border:'none', fontWeight:700, fontSize:12, cursor:'pointer', background: !category ? '#3b82f6' : isDark?'rgba(255,255,255,.08)':'#e2e8f0', color: !category ? '#fff' : c.muted }}>
              All
            </button>
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)} className="m-btn"
                style={{ padding:'5px 12px', borderRadius:20, border:'none', fontWeight:700, fontSize:12, cursor:'pointer', background: category===cat ? '#3b82f6' : isDark?'rgba(255,255,255,.08)':'#e2e8f0', color: category===cat ? '#fff' : c.muted }}>
                {cat}
              </button>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(250px, 100%),1fr))', gap:18 }}>
            {filteredBooks.map((book, i) => (
              <BookCard key={book.BookID} book={book} isDark={isDark} showActions="member"
                onBorrow={handleAddToCart}
                onReserve={() => joinWaitlist(book.BookID)}
                onWaitlist={() => joinWaitlist(book.BookID)}
                blocked={blocked} index={i} detailLink={true} />
            ))}
            {!filteredBooks.length && (
              <div className="m-card" style={{ gridColumn:'1/-1', padding:40, textAlign:'center', background:c.card, border:`1px solid ${c.border}`, borderRadius:16, color:c.muted }}>
                <div style={{ fontSize:36, marginBottom:10 }}>📭</div>No books found.
              </div>
            )}
          </div>

          {/* Floating Cart Button */}
          <style>{`
            @keyframes cartPulse { 0%,100%{box-shadow:0 8px 32px rgba(37,99,235,0.4)} 50%{box-shadow:0 8px 48px rgba(37,99,235,0.7)} }
            .cart-fab { position:fixed; bottom:32px; right:32px; z-index:1000; display:flex; align-items:center; gap:12px; padding:14px 24px; border:none; border-radius:50px; cursor:pointer; font-weight:900; font-size:15px; color:#fff; transition:all 0.2s ease; }
            .cart-fab:hover { transform:translateY(-3px) scale(1.04); }
            .cart-fab-badge { position:absolute; top:-8px; right:-8px; background:#ef4444; color:#fff; width:24px; height:24px; border-radius:50%; font-size:12px; font-weight:900; display:flex; align-items:center; justify-content:center; border:2px solid #fff; }
          `}</style>
          <button
            className="cart-fab"
            onClick={() => navigate('/borrow-cart')}
            style={{
              background: blocked ? '#64748b' : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              animation: cart.length > 0 && !blocked ? 'cartPulse 2s infinite' : 'none',
            }}
          >
            <span style={{ fontSize: 20 }}>🛒</span>
            <span>{cart.length > 0 ? `View Cart (${cart.length})` : 'Borrow Cart'}</span>
            {cart.length > 0 && <span className="cart-fab-badge">{cart.length}</span>}
          </button>
        </div>
      )}

      {/* BORROWINGS */}
      {tab === 'borrows' && (
        <div>
          <h3 style={{ color:c.text, marginBottom:16 }}>My Borrowing Records</h3>
          {!borrows.length
            ? <EmptyState title="No borrowings yet" text="Borrow a book from the catalog." />
            : (
              <div className="m-card" style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead style={{ background:isDark?'#1a2236':'#f8fafc' }}>
                    <tr>{['Book','Request Code','Borrowed','Due Date','Return Date','Status','Action'].map(h =>
                      <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:800, color:c.muted, textTransform:'uppercase', letterSpacing:.6 }}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {borrows.map((r, i) => {
                      const isOD = r.Status === 'Overdue'
                      const isPending = r.Status === 'Pending'
                      return (
                        <tr key={r.BorrowID || i} style={{ borderTop:`1px solid ${c.border}`, background: isPending ? (isDark?'rgba(245,158,11,0.07)':'#fffbeb') : 'transparent' }}>
                          <td style={{ padding:'12px 16px', fontWeight:700, color:c.text }}>
                            <div>{r.Title}</div>
                            {isOD && <div style={{ color:'#ef4444', fontSize:11, marginTop:2 }}>⚠ OVERDUE — fines accruing</div>}
                            {isPending && <div style={{ color:'#d97706', fontSize:11, marginTop:2 }}>⏳ Awaiting staff approval at the desk</div>}
                          </td>
                          <td style={{ padding:'12px 16px', fontFamily:'monospace', color:'#3b82f6', fontSize:13 }}>{r.RequestCode || '—'}</td>
                          <td style={{ padding:'12px 16px', color:c.muted, fontSize:13 }}>{fmt(r.BorrowDate)}</td>
                          <td style={{ padding:'12px 16px', color: isOD?'#ef4444':c.muted, fontWeight: isOD?800:400, fontSize:13 }}>{fmt(r.DueDate)}</td>
                          <td style={{ padding:'12px 16px', color:c.muted, fontSize:13 }}>{fmt(r.ReturnDate)}</td>
                          <td style={{ padding:'12px 16px' }}><StatusBadge v={r.Status} /></td>
                          <td style={{ padding:'12px 16px' }}>
                            {isPending && (
                              <button onClick={() => retractBorrow(r.BorrowID)}
                                style={{ background:'#fee2e2', color:'#991b1b', border:'none', padding:'6px 12px', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:12, whiteSpace:'nowrap' }}>
                                ✕ Retract
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      )}

      {/* RESERVATIONS */}
      {tab === 'reservations' && (
        <div>
          <h3 style={{ color:c.text, marginBottom:16 }}>My Reservations</h3>
          {!reservations.length
            ? <EmptyState title="No reservations" text="Join a waitlist from the catalog." />
            : (
              <div className="m-card" style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead style={{ background:isDark?'#1a2236':'#f8fafc' }}>
                    <tr>{['Book','Code','Status','Waitlist Info','Pickup Deadline','Action'].map(h =>
                       <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:800, color:c.muted, textTransform:'uppercase', letterSpacing:.6 }}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {reservations.map((r, i) => (
                      <tr key={r.ReservationID || r.ResID || i} style={{ borderTop:`1px solid ${c.border}` }}>
                        <td style={{ padding:'12px 16px', fontWeight:700, color:c.text }}>{r.Title}</td>
                        <td style={{ padding:'12px 16px', fontFamily:'monospace', color:'#3b82f6', fontSize:13 }}>{r.RequestCode || '—'}</td>
                        <td style={{ padding:'12px 16px' }}><StatusBadge v={r.Status} /></td>
                        <td style={{ padding:'12px 16px', color:c.muted, fontSize:13 }}>
                          {r.Status === 'Queued' ? (
                            <span style={{ fontWeight: 700, color: '#d97706' }}>
                              #{r.StudentsAhead + 1} in queue ({r.StudentsAhead} ahead)
                            </span>
                          ) : r.Status === 'Ready' ? (
                            <span style={{ fontWeight: 800, color: '#059669' }}>
                              Ready for Pickup!
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td style={{ padding:'12px 16px', color:c.muted, fontSize:13 }}>{fmtDT(r.PickupDeadline)}</td>
                        <td style={{ padding:'12px 16px' }}>
                          {['Queued', 'Ready'].includes(r.Status) && (
                            <button onClick={() => cancelReservation(r.ReservationID || r.ResID)}
                              className="m-btn"
                              style={{ background:'#fee2e2', color:'#991b1b', border:'none', padding:'8px 14px', borderRadius:8, cursor:'pointer', fontWeight:800, fontSize:12 }}>
                              ✕ Retract
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      )}

      {/* FINES */}
      {tab === 'fines' && (
        <div>
          <h3 style={{ color:c.text, marginBottom:16 }}>My Fines</h3>
          {!fines.length
            ? <EmptyState title="No fines 🎉" text="Your account is clear." />
            : (
              <div style={{ display:'grid', gap:14 }}>
                {fines.map(fine => (
                  <FineCard key={fine.FineID} fine={fine} busy={payingFineId === fine.FineID}
                    payWithChapa={payWithChapa} recordMockPayment={recordMockPayment}
                    isDark={isDark} c={c} />
                ))}
              </div>
            )
          }
        </div>
      )}

      {/* Payment Receipt Modal */}
      {receiptData && <PaymentReceiptModal receipt={receiptData} onClose={() => setReceiptData(null)} isDark={isDark} />}

      {/* PROFILE */}
      {tab === 'profile' && (
        <div style={{ maxWidth: 650, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header Card */}
          <div className="m-card" style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 20, padding: 32, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }} />
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(59,130,246,0.25)', color: '#fff' }}>👤</div>
            <h2 style={{ margin: '0 0 6px', color: c.text, fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em' }}>{user?.FullName}</h2>
            <p style={{ margin: '0 0 16px', color: c.muted, fontSize: 14, fontWeight: 500 }}>{user?.Email}</p>
            <StatusBadge v={user?.Status} />
          </div>

          {/* Inline Profile Alert Notification */}
          {profileNotice.text && (
            <div className="m-card" style={{
              padding: '14px 20px',
              borderRadius: 14,
              border: `1px solid ${profileNotice.type === 'error' ? 'rgba(239,68,68,0.25)' : profileNotice.type === 'success' ? 'rgba(16,185,129,0.25)' : 'rgba(59,130,246,0.25)'}`,
              background: profileNotice.type === 'error' ? (isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2') : profileNotice.type === 'success' ? (isDark ? 'rgba(16,185,129,0.1)' : '#ecfdf5') : (isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff'),
              color: profileNotice.type === 'error' ? '#dc2626' : profileNotice.type === 'success' ? '#10b981' : '#2563eb',
              fontWeight: 700,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <span>{profileNotice.type === 'error' ? '⚠' : profileNotice.type === 'success' ? '✓' : 'ℹ'}</span>
              <span style={{ flex: 1 }}>{profileNotice.text}</span>
              <button onClick={() => setProfileNotice({ text: '', type: '' })} style={{ background: 'none', border: 0, color: 'inherit', fontWeight: 900, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
          )}

          {/* Edit Profile Form */}
          <form onSubmit={saveProfile} className="m-card" style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ margin: 0, color: c.text, fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>📝 Update Contact & Security Info</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 800, color: c.muted, textTransform: 'uppercase', letterSpacing: 0.6 }}>Phone Number</label>
              <input 
                type="tel" 
                value={profilePhone} 
                onChange={e => setProfilePhone(e.target.value)} 
                placeholder="e.g. +251912345678"
                style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: `1.5px solid ${c.border}`, background: c.input, color: c.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <hr style={{ border: 0, borderTop: `1px dashed ${c.border}`, margin: '8px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: c.text, fontSize: 14, fontWeight: 700 }}>🔒 Change Password (Optional)</h4>
              <button type="button" onClick={() => setShowProfilePw(v => !v)} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                {showProfilePw ? '🙈 Hide Passwords' : '👁 Show Passwords'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 800, color: c.muted, textTransform: 'uppercase', letterSpacing: 0.6 }}>Current Password</label>
              <input 
                type={showProfilePw ? "text" : "password"} 
                value={currentPw} 
                onChange={e => setCurrentPw(e.target.value)} 
                placeholder="Enter current password to verify"
                style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: `1.5px solid ${c.border}`, background: c.input, color: c.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: c.muted, textTransform: 'uppercase', letterSpacing: 0.6 }}>New Password</label>
                <input 
                  type={showProfilePw ? "text" : "password"} 
                  value={newPw} 
                  onChange={e => setNewPw(e.target.value)} 
                  placeholder="At least 6 characters"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: `1.5px solid ${c.border}`, background: c.input, color: c.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: c.muted, textTransform: 'uppercase', letterSpacing: 0.6 }}>Confirm New Password</label>
                <input 
                  type={showProfilePw ? "text" : "password"} 
                  value={confirmNewPw} 
                  onChange={e => setConfirmNewPw(e.target.value)} 
                  placeholder="Re-enter new password"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: `1.5px solid ${c.border}`, background: c.input, color: c.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="m-btn" 
              disabled={savingProfile}
              style={{ width: '100%', border: 0, borderRadius: 12, padding: '10px 16px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', fontWeight: 900, cursor: savingProfile ? 'wait' : 'pointer', fontSize: 14, boxShadow: '0 4px 14px rgba(37,99,235,0.25)', marginTop: 8 }}
            >
              {savingProfile ? '⚡ Verifying Identity & Saving...' : '💾 Save Changes'}
            </button>
          </form>

          {/* Biometrics Enroll Card */}
          <div className="m-card" style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ margin: 0, color: c.text, fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>🔑 Biometric Credentials (Optional)</h3>
            <p style={{ color: c.muted, fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              Biometric verification is supported to enhance your account security. If you have not registered fingerprint credentials yet, touch your PC's fingerprint sensor to register first. Standard updates will automatically fallback to password authorization if no fingerprint is set.
            </p>
            <button 
              onClick={registerFingerprint}
              className="m-btn"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '10px 16px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 14px rgba(139,92,246,0.25)', fontSize: 14 }}>
              <span style={{ fontSize: 20 }}>🔐</span>
              Register Fingerprint / Windows Hello (Enroll Now)
            </button>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}

function SummaryStrip({ dashboard, loading, isDark, c }) {
  const items = [
    ['Active Borrows', dashboard?.activeBorrowCount ?? 0,       '#2563eb'],
    ['Overdue',        dashboard?.overdueCount ?? 0,            '#dc2626'],
    ['Reservations',   dashboard?.reservationCount ?? 0,        '#7c3aed'],
    ['Fine Balance',   `ETB ${Number(dashboard?.fineBalance||0).toFixed(2)}`, '#dc2626'],
    ['Borrow Limit',   dashboard?.profile?.MaxBooksAllowed ?? 5, '#059669'],
  ]
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:20 }}>
      {items.map(([label, value, color]) => (
        <div key={label} className="m-card" style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:13, padding: '12px 16px' }}>
          <div style={{ color:c.muted, fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:.6 }}>{label}</div>
          <div style={{ color, fontSize:26, fontWeight:900, marginTop:6 }}>{loading ? '…' : value}</div>
        </div>
      ))}
    </div>
  )
}

function FineCard({ fine, busy, payWithChapa, recordMockPayment, isDark, c }) {
  const balance = Number(fine.Balance || fine.Amount || 0)
  const [amount, setAmount] = useState(balance.toFixed(2))
  const [phone, setPhone] = useState('')
  const [step, setStep] = useState('idle') // idle | phone | processing | done
  const isWaived = fine.FineStatus === 'Waived'
  const paid = isWaived || fine.FineStatus === 'Paid' || balance <= 0

  const handleChapaFlow = async () => {
    if (!phone.trim()) return
    setStep('processing')
    await recordMockPayment(fine, Number(amount), phone.trim())
    setStep('done')
  }

  return (
    <div className="m-card" style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, padding:24, display:'flex', flexDirection:'column', gap:16 }}>
      {/* Fine Info Row */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div style={{ flex:1 }}>
          <h3 style={{ margin:0, color:c.text, fontSize:16, fontWeight:800 }}>
            {fine.TypeName || 'Library Fine'}
            {fine.BookTitle ? <span style={{ fontWeight:500, color:c.muted, fontSize:14 }}> — {fine.BookTitle}</span> : null}
          </h3>
          <p style={{ margin:'6px 0 0', color:c.muted, fontSize:13 }}>
            Total: <strong>ETB {Number(fine.Amount||0).toFixed(2)}</strong>
            &nbsp;|&nbsp; Paid: <strong>ETB {Number(fine.TotalPaid||0).toFixed(2)}</strong>
            &nbsp;|&nbsp;
            {isWaived
              ? <strong style={{ color:'#8b5cf6' }}>Waived — No payment needed</strong>
              : <strong style={{ color:'#dc2626' }}>Balance: ETB {balance.toFixed(2)}</strong>
            }
          </p>
          <div style={{ marginTop:8 }}><StatusBadge v={fine.FineStatus} /></div>
          {fine.WaiverReason && (
            <p style={{ margin:'6px 0 0', color:'#8b5cf6', fontSize:12, fontStyle:'italic' }}>📝 Waiver: {fine.WaiverReason}</p>
          )}
        </div>
        <div style={{ textAlign:'right', minWidth:120 }}>
          <div style={{ fontSize:28, fontWeight:900, color: paid ? '#059669' : '#dc2626' }}>
            {paid ? (isWaived ? '✨' : '✅') : `ETB ${balance.toFixed(2)}`}
          </div>
          <div style={{ fontSize:11, color:c.muted, marginTop:2 }}>{paid ? (isWaived ? 'Waived' : 'Paid') : 'Outstanding'}</div>
        </div>
      </div>

      {/* Payment Flow */}
      {!paid && (
        <div style={{ borderTop:`1px solid ${c.border}`, paddingTop:16, display:'flex', flexDirection:'column', gap:12 }}>
          {/* Amount selector */}
          <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
            <label style={{ fontSize:12, fontWeight:700, color:c.muted, whiteSpace:'nowrap' }}>Amount (ETB)</label>
            <input type="number" min="1" max={balance} step="0.01" value={amount}
              onChange={e => setAmount(e.target.value)} disabled={step !== 'idle'}
              style={{ width:120, padding:'8px 12px', borderRadius:8, border:`1px solid ${c.border}`, background:c.input, color:c.text, fontSize:14, outline:'none' }} />
            <span style={{ fontSize:12, color:c.muted }}>of ETB {balance.toFixed(2)} balance</span>
          </div>

          {/* Chapa Phone Flow */}
          {step === 'idle' && (
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <button className="m-btn" onClick={() => setStep('phone')} disabled={busy}
                style={{ flex:1, minWidth:160, border:0, borderRadius:10, padding:'10px 16px', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', fontWeight:800, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <span>💳</span> Pay with Chapa
              </button>
            </div>
          )}

          {step === 'phone' && (
            <div style={{ background: isDark?'rgba(16,185,129,0.06)':'rgba(5,150,105,0.04)', borderRadius:12, padding:16, border:`1px solid rgba(16,185,129,0.2)`, display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#10b981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>📱</div>
                <div>
                  <div style={{ fontWeight:800, color:c.text, fontSize:14 }}>Enter your Telebirr / mobile number</div>
                  <div style={{ color:c.muted, fontSize:12 }}>Chapa will send a payment prompt to this number</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <input type="tel" placeholder="e.g. +251912345678" value={phone} onChange={e => setPhone(e.target.value)}
                  style={{ flex:1, padding:'10px 14px', borderRadius:9, border:`1.5px solid rgba(16,185,129,0.4)`, background:c.input, color:c.text, fontSize:14, outline:'none' }} />
                <button className="m-btn" onClick={handleChapaFlow} disabled={!phone.trim() || busy}
                  style={{ padding:'10px 20px', borderRadius:9, border:0, background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', fontWeight:800, cursor:(!phone.trim()||busy)?'not-allowed':'pointer', fontSize:13, whiteSpace:'nowrap' }}>
                  {busy ? '⏳ Processing…' : '✓ Confirm & Pay'}
                </button>
                <button className="m-btn" onClick={() => { setStep('idle'); setPhone('') }}
                  style={{ padding:'10px 14px', borderRadius:9, border:`1px solid ${c.border}`, background:'transparent', color:c.muted, cursor:'pointer', fontWeight:700 }}>
                  ✕
                </button>
              </div>
              <div style={{ fontSize:11, color:'rgba(16,185,129,0.8)', display:'flex', alignItems:'center', gap:6 }}>
                <span>🔒</span> Secured by Chapa · Simulated payment environment
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div style={{ textAlign:'center', padding:20, color:'#10b981', fontWeight:700 }}>
              <div style={{ fontSize:28, marginBottom:8, animation:'spin 1s linear infinite', display:'inline-block' }}>⏳</div>
              <div>Processing payment via Chapa…</div>
              <div style={{ fontSize:12, color:c.muted, marginTop:4 }}>Waiting for confirmation from {phone}</div>
            </div>
          )}

          {step === 'done' && (
            <div style={{ textAlign:'center', padding:16, color:'#10b981', fontWeight:800, fontSize:14 }}>
              ✅ Payment confirmed! See your receipt above.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ v }) {
  const s = String(v || '').toLowerCase()
  const color = s.includes('paid')||s.includes('available')||s.includes('returned')||s.includes('fulfilled') ? '#059669'
    : s.includes('partial')||s.includes('pending')||s.includes('queued')||s.includes('ready') ? '#d97706'
    : s.includes('overdue')||s.includes('unpaid')||s.includes('cancelled') ? '#dc2626'
    : '#64748b'
  return (
    <span style={{ color, background:`${color}16`, border:`1px solid ${color}33`, borderRadius:999, padding:'4px 10px', fontSize:12, fontWeight:900 }}>
      {v || 'Unknown'}
    </span>
  )
}

function EmptyState({ title, text }) {
  return (
    <div className="m-card" style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:16, padding:40, textAlign:'center', color:'#64748b' }}>
      <div style={{ fontSize:36, marginBottom:10 }}>📘</div>
      <h3 style={{ color:'#0f172a', margin:'0 0 6px' }}>{title}</h3>
      <p style={{ margin:0, fontSize:14 }}>{text}</p>
    </div>
  )
}

function PaymentReceiptModal({ receipt, onClose, isDark }) {
  const printReceipt = () => {
    const printWin = window.open('', '', 'width=600,height=700')
    printWin.document.write(`
      <html><head><title>Payment Receipt – ${receipt.txRef}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 24px; background: #fff; color: #0f172a; }
        .header { text-align: center; margin-bottom: 24px; }
        .logo { font-size: 32px; }
        .title { font-size: 22px; font-weight: 900; color: #10b981; margin: 8px 0 4px; }
        .subtitle { font-size: 13px; color: #64748b; }
        .badge { display: inline-block; background: #ecfdf5; color: #059669; border: 1.5px solid #10b981; padding: 4px 14px; border-radius: 999px; font-weight: 800; font-size: 13px; margin: 8px 0; }
        .divider { border: none; border-top: 2px dashed #e2e8f0; margin: 18px 0; }
        .row { display: flex; justify-content: space-between; padding: 7px 0; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
        .label { color: #64748b; font-weight: 600; }
        .value { font-weight: 700; color: #0f172a; text-align: right; max-width: 55%; }
        .amount-row { font-size: 20px; font-weight: 900; color: #10b981; margin: 12px 0; text-align: center; }
        .txref { font-family: monospace; background: #f1f5f9; padding: 10px; border-radius: 8px; text-align: center; font-size: 13px; margin: 12px 0; word-break: break-all; }
        .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 20px; }
      </style></head><body>
      <div class="header">
        <div class="logo">🏛️</div>
        <div class="title">Library Management System</div>
        <div class="subtitle">Official Payment Receipt</div>
        <div class="badge">✓ PAYMENT CONFIRMED</div>
      </div>
      <hr class="divider">
      <div class="amount-row">ETB ${Number(receipt.amountPaid).toFixed(2)} Paid</div>
      <hr class="divider">
      <div class="row"><span class="label">Member Name</span><span class="value">${receipt.memberName || '—'}</span></div>
      <div class="row"><span class="label">Student ID</span><span class="value">${receipt.studentId || '—'}</span></div>
      <div class="row"><span class="label">Department</span><span class="value">${receipt.department || '—'}</span></div>
      <div class="row"><span class="label">Phone</span><span class="value">${receipt.phone || '—'}</span></div>
      <div class="row"><span class="label">Fine Type</span><span class="value">${receipt.fineType || '—'}</span></div>
      <div class="row"><span class="label">Book</span><span class="value">${receipt.bookTitle || '—'}</span></div>
      <div class="row"><span class="label">Payment Method</span><span class="value">${receipt.method || 'Chapa'}</span></div>
      <div class="row"><span class="label">Remaining Balance</span><span class="value">${Number(receipt.remainingBalance || 0) <= 0 ? '✅ Fully Paid' : 'ETB ' + Number(receipt.remainingBalance).toFixed(2)}</span></div>
      <div class="row"><span class="label">Date & Time</span><span class="value">${new Date(receipt.paidAt).toLocaleString()}</span></div>
      <div class="txref">Ref: ${receipt.txRef}</div>
      <div class="footer">Keep this receipt for your records. Thank you for your payment.<br>Library Management System &copy; ${new Date().getFullYear()}</div>
      </body></html>
    `)
    printWin.document.close()
    printWin.focus()
    setTimeout(() => { printWin.print(); printWin.close() }, 300)
  }

  const balance = Number(receipt.remainingBalance || 0)

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:99999, display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(6px)' }}>
      <div style={{ background: isDark ? '#161b27' : '#fff', borderRadius:24, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 40px 100px rgba(0,0,0,0.5)', border: isDark ? '1px solid #1e2d40' : '1px solid #e2e8f0', animation:'cardIn .3s cubic-bezier(0.175,0.885,0.32,1.275)' }}>

        {/* Receipt Header */}
        <div style={{ background:'linear-gradient(135deg,#10b981,#059669)', borderRadius:'24px 24px 0 0', padding:'28px 28px 24px', textAlign:'center', color:'#fff' }}>
          <div style={{ fontSize:36, marginBottom:8 }}>🏛️</div>
          <div style={{ fontSize:20, fontWeight:900, letterSpacing:'-0.02em' }}>Payment Receipt</div>
          <div style={{ fontSize:13, opacity:0.85, marginTop:4 }}>Library Management System</div>
          <div style={{ marginTop:12, background:'rgba(255,255,255,0.2)', borderRadius:999, padding:'5px 18px', display:'inline-block', fontSize:13, fontWeight:800, border:'1.5px solid rgba(255,255,255,0.4)' }}>
            ✓ PAYMENT CONFIRMED
          </div>
        </div>

        {/* Amount Hero */}
        <div style={{ textAlign:'center', padding:'20px 28px 0' }}>
          <div style={{ fontSize:40, fontWeight:900, color:'#10b981', letterSpacing:'-0.03em' }}>
            ETB {Number(receipt.amountPaid).toFixed(2)}
          </div>
          <div style={{ fontSize:13, color:'#64748b', marginTop:4 }}>
            {balance <= 0 ? '✅ Fine fully settled' : `ETB ${balance.toFixed(2)} remaining balance`}
          </div>
        </div>

        {/* Details */}
        <div style={{ padding:'16px 28px', display:'flex', flexDirection:'column', gap:0 }}>
          {[
            ['👤 Member', receipt.memberName],
            ['🎓 Student ID', receipt.studentId],
            ['🏢 Department', receipt.department],
            ['📱 Phone', receipt.phone],
            ['📋 Fine Type', receipt.fineType],
            ['📚 Book', receipt.bookTitle],
            ['💳 Method', receipt.method],
            ['📅 Date', new Date(receipt.paidAt).toLocaleString()],
          ].map(([label, value]) => (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${isDark?'#1e2d40':'#f1f5f9'}` }}>
              <span style={{ color:'#64748b', fontSize:13, fontWeight:600 }}>{label}</span>
              <span style={{ color: isDark?'#f1f5f9':'#0f172a', fontSize:13, fontWeight:700, textAlign:'right', maxWidth:'60%' }}>{value || '—'}</span>
            </div>
          ))}
          {/* TX Ref */}
          <div style={{ marginTop:14, background: isDark?'rgba(255,255,255,0.04)':'#f8fafc', borderRadius:10, padding:'10px 14px', textAlign:'center' }}>
            <div style={{ fontSize:11, color:'#64748b', fontWeight:700, marginBottom:4, textTransform:'uppercase', letterSpacing:0.8 }}>Transaction Reference</div>
            <div style={{ fontFamily:'monospace', fontSize:12, color: isDark?'#94a3b8':'#475569', wordBreak:'break-all' }}>{receipt.txRef}</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding:'0 28px 28px', display:'flex', gap:10 }}>
          <button onClick={printReceipt}
            style={{ flex:1, padding:'12px 0', borderRadius:12, border:0, background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', fontWeight:800, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            🖨️ Print Receipt
          </button>
          <button onClick={onClose}
            style={{ flex:1, padding:'12px 0', borderRadius:12, border:`1px solid ${isDark?'#1e2d40':'#e2e8f0'}`, background:'transparent', color: isDark?'#94a3b8':'#64748b', fontWeight:700, cursor:'pointer', fontSize:14 }}>
            ✕ Close
          </button>
        </div>

        <div style={{ textAlign:'center', paddingBottom:16, fontSize:11, color:'#94a3b8' }}>
          Keep this receipt for your records · Library Management System
        </div>
      </div>
    </div>
  )
}
