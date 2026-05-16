import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import DashboardShell from '../components/DashboardShell'
import BookCard from '../components/BookCard'
import api from '../api/axiosInstance'

const navItems = [
  { key: 'catalog', label: 'Browse Catalog', icon: '📚' },
  { key: 'borrows', label: 'My Borrowed Books', icon: '📖' },
  { key: 'reservations', label: 'My Reservations', icon: '🕒' },
  { key: 'fines', label: 'My Fines', icon: '💳' }
]

const tabTitles = {
  catalog: 'Browse Catalog',
  borrows: 'My Borrowed Books',
  reservations: 'My Reservations',
  fines: 'My Fines'
}

export default function MemberDashboard() {
  const { user, logout } = useAuth()
  const { isDark } = useTheme()
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
  const [cart, setCart] = useState([])
  const [category, setCategory] = useState('')
  const [author, setAuthor] = useState('')
  const [isbn, setIsbn] = useState('')
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [payingFineId, setPayingFineId] = useState(null)

  useEffect(() => {
    loadAll()
  }, [])

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
        api.get('/member/my-fines')
      ])
      setDashboard(dash.data.data)
      setBooks(catalog.data.data || [])
      setBorrows(borrowed.data.data || [])
      setReservations(reserved.data.data || [])
      setFines(fineRows.data.data || [])
    } catch (err) {
      setNotice(err.response?.data?.message || err.message || 'Could not load member dashboard')
    } finally {
      setLoading(false)
    }
  }

  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return books.filter(book => {
      const matchesSearch = !q || [book.Title, book.Authors, book.CategoryName, book.ISBN]
        .some(value => String(value || '').toLowerCase().includes(q))
      const matchesCategory = !category || book.CategoryName === category
      const matchesAuthor = !author || String(book.Authors || '').toLowerCase().includes(author.toLowerCase())
      const matchesIsbn = !isbn || String(book.ISBN || '').toLowerCase().includes(isbn.toLowerCase())
      return matchesSearch && matchesCategory && matchesAuthor && matchesIsbn
    })
  }, [books, searchQuery, category, author, isbn])

  const categories = useMemo(
    () => [...new Set(books.map(book => book.CategoryName).filter(Boolean))],
    [books]
  )

  const cartCopyIds = cart.map(item => item.copyId)

  const addToCart = (book) => {
    const copyId = String(book.AvailableCopyIds || '').split(',').filter(Boolean)[0]
    if (!copyId) return setNotice('No available copy for this book right now.')
    if (cartCopyIds.includes(Number(copyId))) return setNotice('That book is already in your request cart.')

    setCart(prev => [...prev, {
      bookId: book.BookID,
      copyId: Number(copyId),
      title: book.Title,
      authors: book.Authors,
      category: book.CategoryName
    }])
    setNotice(`${book.Title} added to your borrow cart.`)
  }

  const submitBorrowRequest = async () => {
    if (!cart.length) return setNotice('Add at least one available book first.')
    try {
      const response = await api.post('/borrowing/request', { copyIds: cart.map(item => item.copyId) })
      setNotice(response.data.data?.message || 'Borrow request submitted.')
      setCart([])
      await loadAll()
      setTab('borrows')
    } catch (err) {
      setNotice(err.response?.data?.message || err.response?.data?.error || err.message)
    }
  }

  const joinWaitlist = async (bookId) => {
    try {
      await api.post('/member/reserve', { bookId })
      setNotice('Added to waitlist successfully.')
      await loadAll()
      setTab('reservations')
    } catch (err) {
      setNotice(err.response?.data?.message || err.message)
    }
  }

  const cancelReservation = async (id) => {
    try {
      await api.delete(`/member/reservations/${id}`)
      setNotice('Reservation cancelled.')
      await loadAll()
    } catch (err) {
      setNotice(err.response?.data?.message || err.message)
    }
  }


  const payWithChapa = async (fine, amount) => {
    setPayingFineId(fine.FineID)
    try {
      const response = await api.post('/member/payments/chapa/initialize', {
        fineId: fine.FineID,
        amount
      })
      const checkoutUrl = response.data.data?.checkoutUrl
      if (checkoutUrl) window.location.href = checkoutUrl
      else setNotice('Chapa checkout was initialized but no checkout URL was returned.')
    } catch (err) {
      setNotice(err.response?.data?.message || err.message || 'Unable to initialize Chapa payment.')
    } finally {
      setPayingFineId(null)
    }
  }

  const recordMockPayment = async (fine, amount) => {
    setPayingFineId(fine.FineID)
    try {
      await api.post('/member/payments/mock', { fineId: fine.FineID, amount })
      setNotice('Development payment recorded. Fine balance updated.')
      await loadAll()
    } catch (err) {
      setNotice(err.response?.data?.message || err.message)
    } finally {
      setPayingFineId(null)
    }
  }

  const verifyChapa = async (txRef) => {
    try {
      const response = await api.get(`/member/payments/chapa/verify/${txRef}`)
      setNotice(response.data.data?.completed ? 'Chapa payment verified successfully.' : 'Chapa payment was not completed.')
      navigate('/member?tab=fines', { replace: true })
      await loadAll()
    } catch (err) {
      setNotice(err.response?.data?.message || err.message || 'Could not verify Chapa payment.')
    }
  }

  return (
    <DashboardShell
      role="member"
      navItems={navItems}
      activeTab={tab}
      setTab={setTab}
      user={user}
      logout={logout}
      tabLabel={tabTitles[tab] || 'Member Dashboard'}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
    >
      <style>{`
        @keyframes cardIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseSoft { 0%,100% { box-shadow: 0 0 0 rgba(37,99,235,0); } 50% { box-shadow: 0 0 28px rgba(37,99,235,.22); } }
        .member-card { animation: cardIn .38s ease both; transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease; }
        .member-card:hover { transform: translateY(-4px); box-shadow: 0 16px 34px rgba(15,23,42,.12); border-color: rgba(37,99,235,.35) !important; }
        .member-button { transition: transform .18s ease, filter .18s ease, box-shadow .18s ease; }
        .member-button:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.04); }
        .member-button:active:not(:disabled) { transform: translateY(0); }
        .soft-pulse { animation: pulseSoft 2.4s ease-in-out infinite; }
      `}</style>

      {notice && (
        <div className="member-card" style={{ marginBottom: 18, padding: 14, borderRadius: 12, border: '1px solid rgba(37,99,235,.25)', background: '#eff6ff', color: '#1e3a8a', fontWeight: 700 }}>
          {notice}
        </div>
      )}

      <SummaryStrip dashboard={dashboard} loading={loading} />

      {tab === 'catalog' && (
        <CatalogTab
          books={filteredBooks}
          categories={categories}
          category={category}
          setCategory={setCategory}
          author={author}
          setAuthor={setAuthor}
          isbn={isbn}
          setIsbn={setIsbn}
          addToCart={addToCart}
          joinWaitlist={joinWaitlist}
          cart={cart}
          removeFromCart={(copyId) => setCart(prev => prev.filter(item => item.copyId !== copyId))}
          submitBorrowRequest={submitBorrowRequest}
          blocked={dashboard?.borrowingBlocked}
          isDark={isDark}
        />
      )}

      {tab === 'borrows' && <BorrowedTab rows={borrows} />}
      {tab === 'reservations' && <ReservationsTab rows={reservations} cancelReservation={cancelReservation} />}
      {tab === 'fines' && (
        <FinesTab
          fines={fines}
          payingFineId={payingFineId}
          payWithChapa={payWithChapa}
          recordMockPayment={recordMockPayment}
        />
      )}
    </DashboardShell>
  )
}

function SummaryStrip({ dashboard, loading }) {
  const items = [
    ['Borrowed / Pending', dashboard?.activeBorrowCount ?? 0, '#2563eb'],
    ['Reservations', dashboard?.reservationCount ?? 0, '#7c3aed'],
    ['Fine Balance', `ETB ${Number(dashboard?.fineBalance || 0).toFixed(2)}`, '#dc2626'],
    ['Borrow Limit', dashboard?.profile?.MaxBooksAllowed ?? 5, '#059669']
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14, marginBottom: 22 }}>
      {items.map(([label, value, color]) => (
        <div key={label} className="member-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18 }}>
          <div style={{ color: '#64748b', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</div>
          <div style={{ color, fontSize: 28, fontWeight: 900, marginTop: 8 }}>{loading ? '...' : value}</div>
        </div>
      ))}
    </div>
  )
}

function CatalogTab({ books, categories, category, setCategory, author, setAuthor, isbn, setIsbn, addToCart, joinWaitlist, cart, removeFromCart, submitBorrowRequest, blocked, isDark }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 18 }}>
      <section>
        {blocked && (
          <div className="member-card soft-pulse" style={{ background: '#fef2f2', border: '1px solid #f87171', borderRadius: 14, padding: 16, marginBottom: 16, color: '#991b1b', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 16 }}>Borrowing Blocked</div>
              <div style={{ fontSize: 13, color: '#b91c1c', fontWeight: 600 }}>You have an outstanding balance. New borrowing requests cannot be processed until your fines are settled.</div>
            </div>
          </div>
        )}
        <div className="member-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }}>
          <select value={category} onChange={e => setCategory(e.target.value)} style={filterStyle}>
            <option value="">All categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Filter by author" style={filterStyle} />
          <input value={isbn} onChange={e => setIsbn(e.target.value)} placeholder="Filter by ISBN" style={filterStyle} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 18 }}>
          {books.map((book, i) => (
            <BookCard
              key={book.BookID}
              book={book}
              isDark={isDark}
              showActions="member"
              onBorrow={addToCart}
              onWaitlist={joinWaitlist}
              blocked={blocked}
              index={i}
              detailLink={true}
            />
          ))}
          {!books.length && <EmptyState title="No books found" text="Try a different title, author, category, or ISBN." />}
        </div>
      </section>

      <aside className="member-card soft-pulse" style={{ background: '#0f172a', color: '#fff', borderRadius: 16, padding: 18, height: 'fit-content', position: 'sticky', top: 92 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Borrow Request Cart</h3>
        <p style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.5 }}>Add available books, then submit one request code for the whole session.</p>
        <div style={{ display: 'grid', gap: 10, margin: '16px 0' }}>
          {cart.map(item => (
            <div key={item.copyId} style={{ background: 'rgba(255,255,255,.08)', borderRadius: 12, padding: 12 }}>
              <div style={{ fontWeight: 800 }}>{item.title}</div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>Copy #{item.copyId}</div>
              <button onClick={() => removeFromCart(item.copyId)} style={{ marginTop: 8, background: 'transparent', color: '#fca5a5', border: 0, padding: 0, cursor: 'pointer', fontWeight: 800 }}>Remove</button>
            </div>
          ))}
          {!cart.length && <div style={{ color: '#94a3b8', fontSize: 13 }}>Your cart is empty.</div>}
        </div>
        <button className="member-button" onClick={submitBorrowRequest} disabled={!cart.length || blocked} style={{ width: '100%', border: 0, borderRadius: 12, padding: 13, color: '#fff', background: blocked ? '#64748b' : 'linear-gradient(135deg,#2563eb,#1d4ed8)', cursor: !cart.length || blocked ? 'not-allowed' : 'pointer', fontWeight: 900 }}>
          {blocked ? 'Borrowing Blocked by Fines' : 'Submit Request'}
        </button>
      </aside>
    </div>
  )
}


function BorrowedTab({ rows }) {
  return <DataTable rows={rows} empty="No borrowed books yet." columns={[
    ['Title', r => (
      <div>
        <div style={{ fontWeight: 800 }}>{r.Title}</div>
        {r.Status === 'Overdue' && (
          <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
            OVERDUE! Accruing fines daily.
          </div>
        )}
      </div>
    )],
    ['Request Code', r => r.RequestCode],
    ['Status', r => <Badge value={r.Status} />],
    ['Due Date', r => r.DueDate ? new Date(r.DueDate).toLocaleDateString() : '-']
  ]} />
}

function ReservationsTab({ rows, cancelReservation }) {
  return <DataTable rows={rows} empty="No reservations yet." columns={[
    ['Title', r => r.Title],
    ['Code', r => r.RequestCode],
    ['Status', r => <Badge value={r.Status} />],
    ['Pickup Deadline', r => r.PickupDeadline ? new Date(r.PickupDeadline).toLocaleString() : '-'],
    ['Action', r => r.Status === 'Queued' ? (
      <button onClick={() => cancelReservation(r.ReservationID)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
        Cancel
      </button>
    ) : null]
  ]} />
}

function FinesTab({ fines, payingFineId, payWithChapa, recordMockPayment }) {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {fines.map(fine => <FineCard key={fine.FineID} fine={fine} busy={payingFineId === fine.FineID} payWithChapa={payWithChapa} recordMockPayment={recordMockPayment} />)}
      {!fines.length && <EmptyState title="No fines" text="Your account is clear. Borrowing access is open." />}
    </div>
  )
}

function FineCard({ fine, busy, payWithChapa, recordMockPayment }) {
  const balance = Number(fine.Balance || fine.Amount || 0)
  const [amount, setAmount] = useState(balance.toFixed(2))
  const paid = fine.FineStatus === 'Paid' || balance <= 0

  return (
    <div className="member-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 18, display: 'grid', gridTemplateColumns: '1fr auto', gap: 16 }}>
      <div>
        <h3 style={{ margin: 0, color: '#0f172a' }}>{fine.TypeName || 'Library Fine'} {fine.BookTitle ? `• ${fine.BookTitle}` : ''}</h3>
        <p style={{ margin: '8px 0 0', color: '#64748b' }}>Amount ETB {Number(fine.Amount || 0).toFixed(2)} • Paid ETB {Number(fine.TotalPaid || 0).toFixed(2)} • Balance ETB {balance.toFixed(2)}</p>
        <div style={{ marginTop: 10 }}><Badge value={fine.FineStatus} /></div>
      </div>
      <div style={{ minWidth: 250 }}>
        {!paid ? (
          <>
            <input type="number" min="1" max={balance} step="0.01" value={amount} onChange={e => setAmount(e.target.value)} style={{ ...filterStyle, width: '100%', marginBottom: 10 }} />
            <button className="member-button" disabled={busy} onClick={() => payWithChapa(fine, Number(amount))} style={{ width: '100%', border: 0, borderRadius: 11, padding: 11, background: '#10b981', color: '#fff', fontWeight: 900, cursor: busy ? 'wait' : 'pointer' }}>
              {busy ? 'Opening Chapa...' : 'Pay with Chapa'}
            </button>
            <button className="member-button" disabled={busy} onClick={() => recordMockPayment(fine, Number(amount))} style={{ width: '100%', marginTop: 8, border: '1px solid #cbd5e1', borderRadius: 11, padding: 10, background: '#fff', color: '#334155', fontWeight: 800, cursor: busy ? 'wait' : 'pointer' }}>
              Dev Mock Payment
            </button>
          </>
        ) : (
          <div style={{ color: '#059669', fontWeight: 900, textAlign: 'right' }}>Resolved</div>
        )}
      </div>
    </div>
  )
}

function DataTable({ rows, columns, empty }) {
  if (!rows.length) return <EmptyState title={empty} text="Anything new will appear here automatically." />
  return (
    <div className="member-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#f8fafc' }}>
          <tr>{columns.map(([label]) => <th key={label} style={{ textAlign: 'left', padding: 14, color: '#475569', fontSize: 12, textTransform: 'uppercase' }}>{label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.BorrowID || row.ReservationID || index} style={{ borderTop: '1px solid #e2e8f0' }}>
              {columns.map(([label, render]) => <td key={label} style={{ padding: 14, color: '#0f172a', fontWeight: 600 }}>{render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Badge({ value }) {
  const normalized = String(value || '').toLowerCase()
  const color = normalized.includes('paid') || normalized.includes('available') || normalized.includes('returned') ? '#059669'
    : normalized.includes('partial') || normalized.includes('pending') || normalized.includes('queued') ? '#d97706'
      : '#dc2626'
  return <span style={{ color, background: `${color}16`, border: `1px solid ${color}33`, borderRadius: 999, padding: '5px 10px', fontSize: 12, fontWeight: 900 }}>{value || 'Unknown'}</span>
}

function EmptyState({ title, text }) {
  return (
    <div className="member-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 36, textAlign: 'center', color: '#64748b' }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>📘</div>
      <h3 style={{ color: '#0f172a', margin: 0 }}>{title}</h3>
      <p>{text}</p>
    </div>
  )
}

const filterStyle = {
  border: '1px solid #cbd5e1',
  borderRadius: 11,
  padding: '11px 12px',
  outline: 'none',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 700
}
