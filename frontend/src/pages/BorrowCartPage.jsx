import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import DashboardShell from '../components/DashboardShell'
import api from '../api/axiosInstance'

const MEMBER_NAV = [
  { key: 'catalog',      label: 'Browse Catalog',  icon: '📚', path: '/member' },
  { key: 'borrows',      label: 'My Borrowings',   icon: '📖', path: '/member?tab=borrows' },
  { key: 'reservations', label: 'My Reservations', icon: '🕒', path: '/member?tab=reservations' },
  { key: 'fines',        label: 'My Fines',        icon: '💳', path: '/member?tab=fines' },
  { key: 'profile',      label: 'My Profile',      icon: '👤', path: '/member?tab=profile' },
  { key: 'cart',         label: 'Borrow Cart',     icon: '🛒', path: '/borrow-cart' },
]

const gradients = [
  'linear-gradient(135deg,#1e3a8a,#3b82f6)',
  'linear-gradient(135deg,#064e3b,#10b981)',
  'linear-gradient(135deg,#581c87,#8b5cf6)',
  'linear-gradient(135deg,#7c2d12,#f97316)',
  'linear-gradient(135deg,#0c4a6e,#0ea5e9)',
  'linear-gradient(135deg,#831843,#ec4899)',
]

export default function BorrowCartPage() {
  const navigate = useNavigate()
  const { cart, removeFromCart, clearCart } = useCart()
  const { isDark } = useTheme()
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const c = {
    bg:     isDark ? '#0a0e1a' : '#f1f5f9',
    card:   isDark ? '#161b27' : '#fff',
    border: isDark ? '#1e2d40' : '#e2e8f0',
    text:   isDark ? '#f1f5f9' : '#0f172a',
    muted:  isDark ? '#64748b' : '#64748b',
  }

  const handleSubmit = async () => {
    if (!cart.length) return
    setSubmitting(true)
    setError('')
    try {
      const res = await api.post('/borrowing/request', { copyIds: cart.map(i => i.copyId) })
      const data = res.data.data
      setResult(data)
      clearCart()
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardShell role="member" navItems={MEMBER_NAV} activeTab="cart" tabLabel="Borrow Cart">
      <style>{`
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        .cart-book-card { animation: fadeSlideIn 0.35s cubic-bezier(0.175,0.885,0.32,1.275) both; }
        .cart-book-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.15); }
        .cart-remove-btn:hover { background: #fca5a5 !important; color: #7f1d1d !important; }
      `}</style>

      {/* Success Screen */}
      {result ? (
        <div style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center' }}>
          <div style={{ fontSize: 72, marginBottom: 24 }}>🎉</div>
          <h2 style={{ fontSize: 30, fontWeight: 900, color: c.text, marginBottom: 12 }}>Request Submitted!</h2>
          <p style={{ color: c.muted, fontSize: 16, marginBottom: 32 }}>
            Show the code below at the library desk to pick up your books.
          </p>

          <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', borderRadius: 24, padding: '36px 40px', marginBottom: 32, boxShadow: '0 20px 60px rgba(37,99,235,0.35)' }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Your Request Code</div>
            <div style={{ fontSize: 48, fontWeight: 900, fontFamily: 'monospace', color: '#fff', letterSpacing: 6 }}>{result.requestCode}</div>
            {result.pickupDeadline && (
              <div style={{ marginTop: 16, color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
                Pick up before: {new Date(result.pickupDeadline).toLocaleString()}
              </div>
            )}
          </div>

          {result.pending?.length > 0 && (
            <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 20, marginBottom: 20, textAlign: 'left' }}>
              <div style={{ fontWeight: 800, color: '#10b981', fontSize: 14, marginBottom: 12 }}>✅ Approved for pickup:</div>
              {result.pending.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: i < result.pending.length - 1 ? `1px solid ${c.border}` : 'none' }}>
                  <span style={{ fontSize: 20 }}>📖</span>
                  <div>
                    <div style={{ fontWeight: 700, color: c.text }}>{p.bookTitle}</div>
                    <div style={{ fontSize: 12, color: c.muted }}>Shelf: {p.shelfLocation || '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => navigate('/member?tab=borrows')}
              style={{ padding: '13px 28px', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: 15 }}>
              View My Borrowings →
            </button>
            <button onClick={() => navigate('/member')}
              style={{ padding: '13px 28px', background: 'transparent', color: c.muted, border: `1px solid ${c.border}`, borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>
              Back to Catalog
            </button>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: c.text }}>🛒 Borrow Cart</h1>
              <p style={{ margin: '6px 0 0', color: c.muted, fontSize: 14 }}>
                {cart.length > 0 ? `${cart.length} book${cart.length > 1 ? 's' : ''} ready to borrow` : 'Your cart is empty'}
              </p>
            </div>
            <button onClick={() => navigate('/member')}
              style={{ padding: '10px 20px', background: 'transparent', color: c.muted, border: `1px solid ${c.border}`, borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
              ← Continue Browsing
            </button>
          </div>

          {cart.length === 0 ? (
            /* Empty State */
            <div style={{ textAlign: 'center', padding: '80px 40px', background: c.card, borderRadius: 24, border: `1px solid ${c.border}` }}>
              <div style={{ fontSize: 72, marginBottom: 20 }}>📭</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: c.text, marginBottom: 10 }}>Your cart is empty</h2>
              <p style={{ color: c.muted, marginBottom: 28, fontSize: 15 }}>Browse the catalog and hover over books to add them to your cart.</p>
              <button onClick={() => navigate('/member')}
                style={{ padding: '13px 32px', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: 15 }}>
                Browse Catalog
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
              {/* Books List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {cart.map((item, i) => (
                  <div
                    key={item.copyId}
                    className="cart-book-card"
                    style={{
                      background: c.card,
                      border: `1px solid ${c.border}`,
                      borderRadius: 18,
                      overflow: 'hidden',
                      display: 'flex',
                      transition: 'all 0.2s ease',
                      animationDelay: `${i * 0.07}s`
                    }}
                  >
                    {/* Color Strip */}
                    <div style={{ width: 8, flexShrink: 0, background: gradients[i % gradients.length] }} />

                    {/* Book Thumb */}
                    <div style={{
                      width: 100, flexShrink: 0,
                      background: gradients[i % gradients.length],
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: 36 }}>📚</span>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, padding: '18px 20px' }}>
                      <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 800, color: c.text }}>{item.title}</h3>
                      {item.authors && (
                        <p style={{ margin: '0 0 8px', color: '#3b82f6', fontSize: 13, fontWeight: 600 }}>By {item.authors}</p>
                      )}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {item.category && (
                          <span style={{ fontSize: 11, background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', color: c.muted, padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>
                            {item.category}
                          </span>
                        )}
                        <span style={{ fontSize: 11, background: isDark ? 'rgba(16,185,129,0.12)' : '#ecfdf5', color: '#10b981', padding: '3px 10px', borderRadius: 20, fontWeight: 700, border: '1px solid rgba(16,185,129,0.25)' }}>
                          Copy #{item.copyId}
                        </span>
                      </div>
                    </div>

                    {/* Remove */}
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px' }}>
                      <button
                        className="cart-remove-btn"
                        onClick={() => removeFromCart(item.copyId)}
                        style={{
                          background: isDark ? 'rgba(239,68,68,0.12)' : '#fee2e2',
                          color: '#ef4444',
                          border: 'none',
                          borderRadius: 10,
                          padding: '8px 14px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          fontSize: 13,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        ✕ Remove
                      </button>
                    </div>
                  </div>
                ))}

                {/* Clear all */}
                <button onClick={clearCart}
                  style={{ alignSelf: 'flex-start', background: 'transparent', color: c.muted, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, textDecoration: 'underline', padding: 0 }}>
                  Clear all books
                </button>
              </div>

              {/* Summary Panel */}
              <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 20, padding: 28, position: 'sticky', top: 80 }}>
                <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 900, color: c.text }}>Order Summary</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  {cart.map((item, i) => (
                    <div key={item.copyId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 16 }}>📖</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                      </div>
                      <span style={{ fontSize: 11, color: c.muted, flexShrink: 0 }}>#{item.copyId}</span>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: 16, marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: c.muted, fontSize: 13, marginBottom: 8 }}>
                    <span>Books</span><span>{cart.length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: c.muted, fontSize: 13, marginBottom: 8 }}>
                    <span>Loan period</span><span>7 days</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: c.text, marginTop: 12 }}>
                    <span>Total books</span><span>{cart.length}</span>
                  </div>
                </div>

                {/* Info Banner */}
                <div style={{ background: isDark ? 'rgba(59,130,246,0.08)' : '#eff6ff', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12, padding: '12px 14px', marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: '#3b82f6', fontWeight: 700, marginBottom: 4 }}>📋 How it works</div>
                  <div style={{ fontSize: 12, color: c.muted, lineHeight: 1.6 }}>
                    After submitting, you get a <strong>request code</strong>. Show it at the library desk within 5 minutes to pick up your books.
                  </div>
                </div>

                {error && (
                  <div style={{ background: '#fee2e2', color: '#991b1b', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, fontWeight: 700 }}>
                    ⚠️ {error}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={submitting || !cart.length}
                  style={{
                    width: '100%',
                    padding: '15px',
                    background: submitting ? '#64748b' : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 14,
                    fontWeight: 900,
                    fontSize: 16,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 8px 24px rgba(37,99,235,0.35)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {submitting ? '⏳ Submitting...' : `🚀 Submit Request (${cart.length} book${cart.length > 1 ? 's' : ''})`}
                </button>

                <p style={{ margin: '12px 0 0', color: c.muted, fontSize: 11, textAlign: 'center' }}>
                  You have 5 minutes after submission to reach the desk.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardShell>
  )
}
