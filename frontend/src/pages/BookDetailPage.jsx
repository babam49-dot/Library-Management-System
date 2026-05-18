import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useCart } from '../context/CartContext'
import axios from 'axios'

const API = 'http://localhost:4000/api'
const h = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('lms_token')}` } })

export default function BookDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isDark } = useTheme()
  const { addToCart, isInCart, cart } = useCart()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [cartAdded, setCartAdded] = useState(false)

  const c = {
    bg: isDark ? '#0a0e1a' : '#f1f5f9',
    card: isDark ? '#161b27' : '#fff',
    border: isDark ? '#1e2d40' : '#e2e8f0',
    text: isDark ? '#f1f5f9' : '#0f172a',
    muted: isDark ? '#64748b' : '#64748b',
  }

  useEffect(() => {
    const fetchBook = async () => {
      setLoading(true)
      try {
        if (user?.RoleID === 3) {
          const r = await axios.get(`${API}/member/books`, h())
          const found = (r.data.data || []).find(b => String(b.BookID) === String(id))
          if (found) {
            setBook({ ...found, copies: [] })
            // Check if already in cart
            const firstCopyId = String(found.AvailableCopyIds || '').split(',').filter(Boolean)[0]
            if (firstCopyId && isInCart(Number(firstCopyId))) setCartAdded(true)
          }
          else setToast('Book not found')
        } else {
          const r = await axios.get(`${API}/books/${id}`, h())
          setBook(r.data.data)
        }
      } catch (e) { setToast('Could not load book') }
      setLoading(false)
    }
    fetchBook()
  }, [id, user])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const handleBorrow = () => {
    if (!book) return
    const copyId = String(book.AvailableCopyIds || '').split(',').filter(Boolean)[0]
    if (!copyId) return showToast('No available copies right now. Join the waitlist!')

    const copyIdNum = Number(copyId)
    if (isInCart(copyIdNum)) {
      showToast('📚 Already in your cart! Go to Member Dashboard to submit.')
      return
    }

    addToCart({
      bookId: book.BookID,
      copyId: copyIdNum,
      title: book.Title,
      authors: book.Authors,
      category: book.CategoryName
    })
    setCartAdded(true)
    showToast(`✅ "${book.Title}" added to your borrow cart!`)
  }

  const handleReserve = async () => {
    if (!book) return
    try {
      const res = await axios.post(`${API}/member/reserve`, { bookId: book.BookID }, h())
      if (res.data.success) {
        if (res.data.data && res.data.data.immediate) {
          showToast(`📌 Reserved! You have 30 minutes to pick it up.`)
          setBook(b => ({ ...b, AvailableCopies: Math.max(0, b.AvailableCopies - 1) }))
        } else {
          showToast(`🕒 Added to waitlist!`)
        }
      }
    } catch (e) {
      showToast('❌ ' + (e.response?.data?.message || e.message))
    }
  }

  const coverSrc = book?.CoverImage
    ? (book.CoverImage.startsWith('http') ? book.CoverImage : `http://localhost:4000${book.CoverImage}`)
    : null

  const gradients = [
    'linear-gradient(135deg,#1e3a8a,#3b82f6)',
    'linear-gradient(135deg,#064e3b,#10b981)',
    'linear-gradient(135deg,#581c87,#8b5cf6)',
    'linear-gradient(135deg,#7c2d12,#f97316)',
    'linear-gradient(135deg,#0c4a6e,#0ea5e9)',
  ]
  const gradient = gradients[(book?.BookID || 0) % gradients.length]

  if (loading) return (
    <div style={{ minHeight: '100vh', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: c.muted }}>
        <div style={{ fontSize: 56, marginBottom: 16, animation: 'spin 1s linear infinite' }}>📚</div>
        <p style={{ fontSize: 18 }}>Loading book details…</p>
      </div>
    </div>
  )

  if (!book) return (
    <div style={{ minHeight: '100vh', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: c.muted }}>
        <div style={{ fontSize: 64 }}>📭</div>
        <h2 style={{ color: c.text }}>Book not found</h2>
        <button onClick={() => navigate(-1)} style={{ marginTop: 16, background: '#3b82f6', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>← Go Back</button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: c.bg, fontFamily: "'Inter', sans-serif", padding: '40px 24px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounceIn { 0%{transform:scale(0.8);opacity:0} 70%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
        .detail-card { animation: fadeUp 0.4s ease both; }
        .copy-row { transition: background 0.2s; }
        .copy-row:hover { background: ${isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.04)'}; }
        .cart-btn { transition: all 0.2s ease; }
        .cart-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(37,99,235,0.4); }
        .cart-btn:active:not(:disabled) { transform: translateY(0); }
      `}</style>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1e293b', color: '#fff', padding: '14px 24px', borderRadius: 12, zIndex: 9999, fontSize: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', borderLeft: '4px solid #f59e0b', fontWeight: 600, animation: 'bounceIn 0.3s ease' }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Back button */}
        <button onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', color: c.muted, border: `1px solid ${c.border}`, padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14, marginBottom: 28, transition: 'all 0.2s' }}>
          ← Back
        </button>

        <div className="detail-card" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 32, alignItems: 'start' }}>
          {/* Left: Cover */}
          <div>
            <div style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', aspectRatio: '2/3', background: gradient }}>
              {coverSrc
                ? <img src={coverSrc} alt={book.Title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
                    <span style={{ fontSize: 72 }}>📚</span>
                    <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 800, fontSize: 18, textAlign: 'center', lineHeight: 1.3 }}>{book.Title}</span>
                  </div>
                )
              }
            </div>

            {/* Availability Badge */}
            <div style={{ marginTop: 20, background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: c.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Availability</div>
              <div style={{ fontSize: 38, fontWeight: 900, color: Number(book.AvailableCopies) > 0 ? '#10b981' : '#ef4444' }}>
                {book.AvailableCopies ?? 0}
              </div>
              <div style={{ fontSize: 13, color: c.muted }}>of {book.TotalCopies ?? 0} copies available</div>
            </div>

            {/* Cart status for members */}
            {user?.RoleID === 3 && cart.length > 0 && (
              <div
                onClick={() => navigate('/member?tab=catalog')}
                style={{ marginTop: 12, background: 'linear-gradient(135deg,#0f172a,#1e293b)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: 14, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>🛒 Borrow Cart</div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>{cart.length} book{cart.length > 1 ? 's' : ''} ready to submit</div>
                <div style={{ color: '#3b82f6', fontSize: 12, marginTop: 4 }}>Click to go to your dashboard →</div>
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div>
            <div className="detail-card" style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 20, padding: 36, marginBottom: 20 }}>
              {/* Category badge */}
              {book.CategoryName && (
                <span style={{ display: 'inline-block', background: 'rgba(59,130,246,0.12)', color: '#3b82f6', padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>
                  {book.CategoryName}
                </span>
              )}

              <h1 style={{ fontSize: 34, fontWeight: 900, color: c.text, margin: '0 0 8px', lineHeight: 1.2 }}>{book.Title}</h1>
              <p style={{ fontSize: 18, color: '#3b82f6', fontWeight: 600, margin: '0 0 28px' }}>By {book.Authors || 'Unknown Author'}</p>

              {/* Meta Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
                {[
                  ['ISBN', book.ISBN || '—'],
                  ['Year', book.Year || '—'],
                  ['Edition', book.Edition || '—'],
                  ['Language', book.Language || '—'],
                  ['Publisher', book.PublisherName || '—'],
                  ['Category', book.CategoryName || '—'],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: 12, padding: '12px 16px', border: `1px solid ${c.border}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Description */}
              {book.Description && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>About this Book</div>
                  <p style={{ color: c.text, fontSize: 15, lineHeight: 1.8, margin: 0, padding: '16px 20px', background: isDark ? 'rgba(59,130,246,0.05)' : '#f0f7ff', borderRadius: 12, border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : '#bfdbfe'}` }}>
                    {book.Description}
                  </p>
                </div>
              )}

              {/* Member Actions */}
              {user?.RoleID === 3 && (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {Number(book.AvailableCopies) > 0 ? (
                    <>
                      {cartAdded ? (
                        <button
                          onClick={() => navigate('/member?tab=catalog')}
                          className="cart-btn"
                          style={{ flex: 1, minWidth: 150, padding: '14px', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 20px rgba(16,185,129,0.35)' }}
                        >
                          ✅ In Cart
                        </button>
                      ) : (
                        <button
                          onClick={handleBorrow}
                          className="cart-btn"
                          style={{ flex: 1, minWidth: 150, padding: '14px', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 20px rgba(37,99,235,0.35)' }}
                        >
                          🛒 Add to Cart
                        </button>
                      )}
                      <button
                        onClick={handleReserve}
                        className="cart-btn"
                        style={{ flex: 1, minWidth: 150, padding: '14px', background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 20px rgba(139,92,246,0.35)' }}
                      >
                        📌 Reserve (30m)
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleReserve}
                      className="cart-btn"
                      style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg,#d97706,#b45309)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 16, cursor: 'pointer' }}
                    >
                      🕒 Join Waitlist
                    </button>
                  )}
                  <button onClick={() => navigate(-1)} style={{ padding: '14px 20px', background: 'transparent', color: c.muted, border: `1px solid ${c.border}`, borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                    ← Back
                  </button>
                </div>
              )}

              {/* Admin / Staff Actions */}
              {(user?.RoleID === 1 || user?.RoleID === 2) && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => navigate(user.RoleID === 1 ? '/admin' : '/staff', { state: { editBook: book } })} style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                    ✏️ Edit Book
                  </button>
                  <button onClick={() => navigate(-1)} style={{ flex: 1, padding: '14px', background: 'transparent', color: c.muted, border: `1px solid ${c.border}`, borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                    ← Back to List
                  </button>
                </div>
              )}
            </div>

            {/* Copies Table */}
            {book.copies && book.copies.length > 0 && (
              <div className="detail-card" style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ padding: '18px 24px', borderBottom: `1px solid ${c.border}`, fontWeight: 700, color: c.text, fontSize: 15 }}>
                  Physical Copies ({book.copies.length})
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc' }}>
                      {['Copy ID', 'Status', 'Shelf Location', 'Acquired'].map(h => (
                        <th key={h} style={{ padding: '12px 20px', textAlign: 'left', color: c.muted, fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {book.copies.map(copy => (
                      <tr key={copy.CopyID} className="copy-row" style={{ borderTop: `1px solid ${c.border}` }}>
                        <td style={{ padding: '12px 20px', color: c.muted, fontFamily: 'monospace' }}>#{copy.CopyID}</td>
                        <td style={{ padding: '12px 20px' }}>
                          <span style={{
                            background: copy.Status === 'Available' ? 'rgba(16,185,129,0.15)' : copy.Status === 'Borrowed' ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)',
                            color: copy.Status === 'Available' ? '#10b981' : copy.Status === 'Borrowed' ? '#3b82f6' : '#ef4444',
                            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700
                          }}>{copy.Status}</span>
                        </td>
                        <td style={{ padding: '12px 20px', color: c.text, fontWeight: 600 }}>{copy.ShelfLocation || '—'}</td>
                        <td style={{ padding: '12px 20px', color: c.muted }}>{copy.AcquisitionDate ? new Date(copy.AcquisitionDate).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
