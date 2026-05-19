import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useCart } from '../context/CartContext'
import DashboardShell from '../components/DashboardShell'
import BookCard from '../components/BookCard'
import api from '../api/axiosInstance'

import { startRegistration } from '@simplewebauthn/browser'

const makeNavItems = (pendingBorrows, pendingFines, pendingReservations) => [
  { key: 'catalog',      label: 'Browse Catalog',    icon: '📚' },
  { key: 'borrows',      label: 'My Borrowings',     icon: '📖', badge: pendingBorrows },
  { key: 'reservations', label: 'My Reservations',   icon: '🕒', badge: pendingReservations },
  { key: 'fines',        label: 'My Fines',          icon: '💳', badge: pendingFines > 0 ? 1 : 0 },
  { key: 'profile',      label: 'My Profile',        icon: '👤' },
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
  const [payingFineId, setPayingFineId] = useState(null)

  const pendingBorrows = borrows.filter(b => b.Status === 'Pending').length
  const pendingReservations = reservations.filter(r => r.Status === 'Queued' || r.Status === 'Ready').length
  const pendingFines = fines.filter(f => f.FineStatus !== 'Paid' && Number(f.Balance) > 0).length
  const navItems = makeNavItems(pendingBorrows, pendingFines, pendingReservations)

  useEffect(() => { loadAll() }, [])

  useEffect(() => {
    const txRef = params.get('tx_ref')
    if (txRef) verifyChapa(txRef)
  }, [location.search])

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
    if (!cart.length) return setNotice('Add at least one book first.')
    try {
      const res = await api.post('/borrowing/request', { copyIds: cart.map(i => i.copyId) })
      setNotice(res.data.data?.message || 'Request submitted! Show the code at the desk.')
      clearCart(); await loadAll(); setTab('borrows')
    } catch (err) { setNotice(err.response?.data?.message || err.message) }
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
    if (!window.confirm('Retract this pending borrow request? The book will go back to available.')) return
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

  const recordMockPayment = async (fine, amount) => {
    setPayingFineId(fine.FineID)
    try {
      await api.post('/member/payments/mock', { fineId: fine.FineID, amount })
      setNotice('Payment recorded.'); await loadAll()
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

      {/* Notice */}
      {notice && (
        <div className="m-card" onClick={() => setNotice('')} style={{ marginBottom:16, padding:'12px 18px', borderRadius:12, border:`1px solid rgba(37,99,235,.25)`, background:isDark?'rgba(37,99,235,.12)':'#eff6ff', color:'#1e3a8a', fontWeight:700, cursor:'pointer' }}>
          {notice} <span style={{ float:'right', opacity:.5 }}>✕</span>
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
        <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 300px', gap:18, alignItems:'start' }}>
          <section>
            {/* Category pills */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
              <button onClick={() => setCategory('')} className="m-btn"
                style={{ padding:'7px 16px', borderRadius:20, border:'none', fontWeight:700, fontSize:13, cursor:'pointer', background: !category ? '#3b82f6' : isDark?'rgba(255,255,255,.08)':'#e2e8f0', color: !category ? '#fff' : c.muted }}>
                All
              </button>
              {categories.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)} className="m-btn"
                  style={{ padding:'7px 16px', borderRadius:20, border:'none', fontWeight:700, fontSize:13, cursor:'pointer', background: category===cat ? '#3b82f6' : isDark?'rgba(255,255,255,.08)':'#e2e8f0', color: category===cat ? '#fff' : c.muted }}>
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))', gap:18 }}>
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
          </section>

          {/* Borrow Cart */}
          <aside className="m-card" style={{ background:'#0f172a', color:'#fff', borderRadius:16, padding:20, position:'sticky', top:80 }}>
            <h3 style={{ margin:'0 0 6px', fontSize:17, fontWeight:900 }}>🛒 Borrow Cart</h3>
            <p style={{ color:'#cbd5e1', fontSize:12, margin:'0 0 14px' }}>Add books, then submit one request for the whole session.</p>
            <div style={{ display:'grid', gap:8, marginBottom:14 }}>
              {cart.map(item => (
                <div key={item.copyId} style={{ background:'rgba(255,255,255,.07)', borderRadius:10, padding:10 }}>
                  <div style={{ fontWeight:800, fontSize:13 }}>{item.title}</div>
                  <div style={{ color:'#94a3b8', fontSize:11 }}>Copy #{item.copyId}</div>
                  <button onClick={() => removeFromCart(item.copyId)}
                    style={{ marginTop:6, background:'transparent', color:'#fca5a5', border:0, cursor:'pointer', fontWeight:700, fontSize:12, padding:0 }}>Remove</button>
                </div>
              ))}
              {!cart.length && <div style={{ color:'#94a3b8', fontSize:13 }}>Your cart is empty.</div>}
            </div>
            <button className="m-btn" onClick={submitBorrowRequest} disabled={!cart.length || blocked}
              style={{ width:'100%', border:0, borderRadius:11, padding:13, color:'#fff', fontWeight:900, fontSize:14, cursor:(!cart.length||blocked)?'not-allowed':'pointer', background: blocked?'#64748b':'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
              {blocked ? '🔒 Borrowing Suspended' : cart.length ? `Submit ${cart.length} Book(s)` : 'Submit Request'}
            </button>
          </aside>
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
                    <tr>{['Book','Code','Status','Priority','Pickup Deadline','Action'].map(h =>
                      <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:800, color:c.muted, textTransform:'uppercase', letterSpacing:.6 }}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {reservations.map((r, i) => (
                      <tr key={r.ReservationID || r.ResID || i} style={{ borderTop:`1px solid ${c.border}` }}>
                        <td style={{ padding:'12px 16px', fontWeight:700, color:c.text }}>{r.Title}</td>
                        <td style={{ padding:'12px 16px', fontFamily:'monospace', color:'#3b82f6', fontSize:13 }}>{r.RequestCode || '—'}</td>
                        <td style={{ padding:'12px 16px' }}><StatusBadge v={r.Status} /></td>
                        <td style={{ padding:'12px 16px', color:c.muted, fontSize:13 }}>#{r.Priority || 1}</td>
                        <td style={{ padding:'12px 16px', color:c.muted, fontSize:13 }}>{fmtDT(r.PickupDeadline)}</td>
                        <td style={{ padding:'12px 16px' }}>
                          {r.Status === 'Queued' && (
                            <button onClick={() => cancelReservation(r.ReservationID || r.ResID)}
                              style={{ background:'#fee2e2', color:'#991b1b', border:'none', padding:'6px 12px', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:12 }}>
                              Cancel
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

      {/* PROFILE */}
      {tab === 'profile' && (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div className="m-card" style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 28, marginBottom: 20, textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(59,130,246,0.3)' }}>👤</div>
            <h2 style={{ margin: '0 0 4px', color: c.text, fontSize: 22, fontWeight: 800 }}>{user?.FullName}</h2>
            <p style={{ margin: '0 0 16px', color: c.muted, fontSize: 14 }}>{user?.Email}</p>
            <StatusBadge v={user?.Status} />
          </div>

          <div className="m-card" style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
            <h4 style={{ margin: '0 0 16px', color: c.text }}>🔐 Account Security</h4>
            <p style={{ color: c.muted, fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
              Register your PC's fingerprint scanner or Windows Hello to enable passwordless sign-in.
            </p>
            <button 
              onClick={registerFingerprint}
              className="m-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(139,92,246,0.3)' }}>
              <span style={{ fontSize: 20 }}>🔐</span>
              Register Fingerprint / Windows Hello
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
        <div key={label} className="m-card" style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:13, padding:16 }}>
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
  const paid = fine.FineStatus === 'Paid' || balance <= 0

  return (
    <div className="m-card" style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, padding:20, display:'grid', gridTemplateColumns:'1fr auto', gap:16, alignItems:'start' }}>
      <div>
        <h3 style={{ margin:0, color:c.text, fontSize:16 }}>{fine.TypeName || 'Library Fine'}{fine.BookTitle ? ` — ${fine.BookTitle}` : ''}</h3>
        <p style={{ margin:'6px 0 0', color:c.muted, fontSize:13 }}>
          Total: ETB {Number(fine.Amount||0).toFixed(2)} &nbsp;|&nbsp; Paid: ETB {Number(fine.TotalPaid||0).toFixed(2)} &nbsp;|&nbsp; <strong style={{ color:'#dc2626' }}>Balance: ETB {balance.toFixed(2)}</strong>
        </p>
        <div style={{ marginTop:8 }}><StatusBadge v={fine.FineStatus} /></div>
      </div>
      <div style={{ minWidth:240 }}>
        {!paid ? (
          <>
            <input type="number" min="1" max={balance} step="0.01" value={amount}
              onChange={e => setAmount(e.target.value)}
              style={{ width:'100%', padding:'9px 12px', borderRadius:9, border:`1px solid ${c.border}`, background:c.input, color:c.text, fontSize:14, outline:'none', marginBottom:8, boxSizing:'border-box' }} />
            <button className="m-btn" disabled={busy} onClick={() => payWithChapa(fine, Number(amount))}
              style={{ width:'100%', border:0, borderRadius:10, padding:11, background:'#10b981', color:'#fff', fontWeight:900, cursor:busy?'wait':'pointer', marginBottom:6, fontSize:13 }}>
              {busy ? 'Opening Chapa…' : '💳 Pay with Chapa'}
            </button>
            <button className="m-btn" disabled={busy} onClick={() => recordMockPayment(fine, Number(amount))}
              style={{ width:'100%', border:`1px solid ${c.border}`, borderRadius:10, padding:9, background:'transparent', color:c.muted, fontWeight:700, cursor:busy?'wait':'pointer', fontSize:12 }}>
              Dev Mock Payment
            </button>
          </>
        ) : (
          <div style={{ color:'#059669', fontWeight:900, textAlign:'right', fontSize:14 }}>✅ Resolved</div>
        )}
      </div>
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
