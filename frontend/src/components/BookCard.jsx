import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

/**
 * Shared interactive book card used across Admin, Staff, Member dashboards and Home.
 *
 * Props:
 *  book          – book object from API
 *  isDark        – boolean for dark mode
 *  onBorrow      – optional function(book) – called when "Borrow/Add to Cart" clicked
 *  onWaitlist    – optional function(book) – called when "Join Waitlist" clicked
 *  onEdit        – optional function(book) – called when "Edit" clicked (admin/staff)
 *  onDelete      – optional function(book) – called when "Delete" clicked (admin)
 *  showActions   – 'member' | 'admin' | 'staff' | 'public' | 'readonly'
 *  blocked       – boolean (member borrowing blocked by fines)
 *  detailLink    – if true, clicking card image navigates to /book/:id
 *  index         – for gradient fallback
 */
export default function BookCard({
  book,
  isDark = false,
  onBorrow,
  onReserve,
  onWaitlist,
  onEdit,
  onDelete,
  onBarcodes,
  showActions = 'readonly',
  blocked = false,
  detailLink = true,
  index = 0,
  inCart: customInCart,
}) {
  const navigate = useNavigate()
  const [popup, setPopup] = useState(false)
  const [hovered, setHovered] = useState(false)

  const { cart } = useCart()
  const inCart = customInCart !== undefined ? customInCart : cart.some(i => i.bookId === book.BookID)

  const available = Number(book.AvailableCopies ?? 0)

  const coverSrc = book.CoverImage
    ? (book.CoverImage.startsWith('http') ? book.CoverImage : `http://localhost:4000${book.CoverImage}`)
    : null

  const gradients = [
    'linear-gradient(135deg,#1e3a8a,#3b82f6)',
    'linear-gradient(135deg,#064e3b,#10b981)',
    'linear-gradient(135deg,#581c87,#8b5cf6)',
    'linear-gradient(135deg,#7c2d12,#f97316)',
    'linear-gradient(135deg,#0c4a6e,#0ea5e9)',
    'linear-gradient(135deg,#831843,#ec4899)',
    'linear-gradient(135deg,#1c1917,#78716c)',
  ]
  const gradient = gradients[index % gradients.length]

  const cardBg = isDark ? '#161b27' : '#fff'
  const border = isDark ? '#1e2d40' : '#e2e8f0'
  const text = isDark ? '#f1f5f9' : '#0f172a'
  const muted = isDark ? '#64748b' : '#64748b'
  const desc = book.Description || ''
  const shortDesc = desc.length > 90 ? desc.slice(0, 90) + '…' : desc

  return (
    <>
      <style>{`
        .bk-card { transition: transform 0.25s cubic-bezier(0.175,0.885,0.32,1.275), box-shadow 0.25s ease, border-color 0.25s ease; position: relative; }
        .bk-card:hover { transform: translateY(-6px) scale(1.01); box-shadow: 0 20px 48px rgba(0,0,0,0.18) !important; border-color: #3b82f6 !important; }
        .bk-card.in-cart-card { border-color: #10b981 !important; }
        .bk-hover-overlay { position: absolute; inset: 0; z-index: 20; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 20px; background: rgba(0,0,0,0.72); backdrop-filter: blur(4px); border-radius: 18px; animation: bkFadeIn 0.18s ease; }
        .bk-popup-overlay { animation: bkFadeIn 0.2s ease; }
        .bk-popup-inner { animation: bkScaleIn 0.25s cubic-bezier(0.175,0.885,0.32,1.275); }
        @keyframes bkFadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes bkScaleIn { from { opacity:0; transform:scale(0.92) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .bk-action-btn { transition: all 0.18s ease; }
        .bk-action-btn:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.08); }
        .bk-hover-btn { width: 100%; padding: 11px; border: none; border-radius: 12px; font-weight: 800; font-size: 14px; cursor: pointer; transition: all 0.15s ease; }
        .bk-hover-btn:hover { filter: brightness(1.1); transform: scale(1.02); }
      `}</style>

      <article
        className={`bk-card${inCart ? ' in-cart-card' : ''}`}
        style={{ background: cardBg, border: `1px solid ${inCart ? '#10b981' : border}`, borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', opacity: inCart ? 0.82 : 1, position: 'relative' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >

        {/* Hover overlay for member quick-actions */}
        {hovered && (showActions === 'member' || showActions === 'staff-browse') && (
          <div className="bk-hover-overlay" onMouseLeave={() => setHovered(false)}>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, textAlign: 'center', marginBottom: 4, lineHeight: 1.3 }}>{book.Title}</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 8 }}>By {book.Authors || 'Unknown'}</div>
            {inCart ? (
              <div style={{ background: 'rgba(16,185,129,0.25)', border: '1.5px solid #10b981', borderRadius: 12, padding: '10px 18px', color: '#6ee7b7', fontWeight: 800, fontSize: 13, textAlign: 'center', width: '100%' }}>
                ✅ Already in Borrow Cart
              </div>
            ) : available > 0 ? (
              <button
                className="bk-hover-btn"
                disabled={blocked}
                onClick={(e) => { e.stopPropagation(); onBorrow && onBorrow(book) }}
                style={{ background: blocked ? '#475569' : 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff' }}
              >
                🛒 Add to Borrow Cart
              </button>
            ) : (
              <button
                className="bk-hover-btn"
                disabled={blocked}
                onClick={(e) => { e.stopPropagation(); onWaitlist && onWaitlist(book) }}
                style={{ background: blocked ? '#475569' : 'linear-gradient(135deg,#d97706,#b45309)', color: '#fff' }}
              >
                ⏳ Join Waitlist
              </button>
            )}
            {available > 0 && !inCart && (
              <button
                className="bk-hover-btn"
                disabled={blocked}
                onClick={(e) => { e.stopPropagation(); onReserve && onReserve(book) }}
                style={{ background: blocked ? '#475569' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff' }}
              >
                🕒 Reserve
              </button>
            )}
            <button
              className="bk-hover-btn"
              onClick={(e) => { e.stopPropagation(); navigate(`/book/${book.BookID}`) }}
              style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              👁️ View Details
            </button>
          </div>
        )}

        {/* Cover Image Area */}
        <div
          onClick={() => detailLink ? navigate(`/book/${book.BookID}`) : setPopup(true)}
          style={{ height: 220, background: gradient, position: 'relative', overflow: 'hidden', flexShrink: 0 }}
        >
          {coverSrc
            ? <img src={coverSrc} alt={book.Title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 12 }}>
                <span style={{ fontSize: 52 }}>📚</span>
                <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, fontSize: 14, textAlign: 'center', lineHeight: 1.3 }}>{book.Title}</span>
              </div>
            )
          }
          {/* In-cart badge */}
          {inCart && (
            <span style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(16,185,129,0.9)', backdropFilter: 'blur(8px)', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
              ✅ In Cart
            </span>
          )}
          {/* Category Badge */}
          {book.CategoryName && !inCart && (
            <span style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase' }}>
              {book.CategoryName}
            </span>
          )}
          {/* Availability badge */}
          <span style={{ position: 'absolute', top: 12, right: 12, background: available > 0 ? 'rgba(16,185,129,0.85)' : 'rgba(239,68,68,0.85)', color: '#fff', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
            {available > 0 ? `${available} free` : 'Unavailable'}
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h3
            onClick={() => detailLink ? navigate(`/book/${book.BookID}`) : setPopup(true)}
            style={{ margin: 0, fontSize: 15, fontWeight: 800, color: text, lineHeight: 1.3, cursor: 'pointer' }}
          >
            {book.Title}
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: muted }}>By {book.Authors || 'Unknown'}</p>

          {/* Description snippet */}
          {desc && (
            <p style={{ margin: '4px 0 0', fontSize: 12, color: muted, lineHeight: 1.5 }}>
              {shortDesc}{' '}
              {desc.length > 90 && (
                <button
                  onClick={e => { e.stopPropagation(); setPopup(true) }}
                  style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 700, cursor: 'pointer', fontSize: 12, padding: 0 }}
                >
                  read more
                </button>
              )}
            </p>
          )}

          {/* Details row */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            {book.ISBN && <span style={{ fontSize: 11, color: muted, background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', padding: '2px 8px', borderRadius: 6 }}>ISBN: {book.ISBN}</span>}
            {book.Year && <span style={{ fontSize: 11, color: muted, background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', padding: '2px 8px', borderRadius: 6 }}>{book.Year}</span>}
            {book.Language && <span style={{ fontSize: 11, color: muted, background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', padding: '2px 8px', borderRadius: 6 }}>{book.Language}</span>}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 12, flexWrap: 'wrap' }}>
            {showActions === 'member' && (
              <>
                {available > 0 ? (
                  <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                    <button className="bk-action-btn" disabled={blocked}
                      onClick={() => onBorrow && onBorrow(book)}
                      style={{ flex: 1, background: blocked ? '#94a3b8' : 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 8px', fontWeight: 800, cursor: blocked ? 'not-allowed' : 'pointer', fontSize: 12 }}>
                      🛒 Cart
                    </button>
                    <button className="bk-action-btn" disabled={blocked}
                      onClick={() => onReserve && onReserve(book)}
                      style={{ flex: 1, background: blocked ? '#94a3b8' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 8px', fontWeight: 800, cursor: blocked ? 'not-allowed' : 'pointer', fontSize: 12 }}>
                      🕒 Reserve
                    </button>
                  </div>
                ) : (
                  <button className="bk-action-btn" disabled={blocked}
                    onClick={() => onWaitlist && onWaitlist(book)}
                    style={{ flex: 1, background: blocked ? '#94a3b8' : 'linear-gradient(135deg,#d97706,#b45309)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 12px', fontWeight: 800, cursor: blocked ? 'not-allowed' : 'pointer', fontSize: 13 }}>
                    ⏳ Join Waitlist
                  </button>
                )}
                <button className="bk-action-btn" onClick={() => setPopup(true)}
                  style={{ background: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9', color: text, border: 'none', borderRadius: 10, padding: '9px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                  ℹ️
                </button>
              </>
            )}
            {(showActions === 'admin' || showActions === 'staff') && (
              <>
                <button className="bk-action-btn" onClick={() => onEdit && onEdit(book)} style={{ flex: 1, background: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 10, padding: '8px 12px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                  ✏️ Edit
                </button>
                <button className="bk-action-btn" onClick={() => onBarcodes && onBarcodes(book)} style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '8px 12px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                  🏷️ Barcodes
                </button>
                {showActions === 'admin' && (
                  <button className="bk-action-btn" onClick={() => onDelete && onDelete(book)} style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '8px 12px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                    🗑️
                  </button>
                )}
                <button className="bk-action-btn" onClick={() => navigate(`/book/${book.BookID}`)} style={{ background: isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9', color: muted, border: 'none', borderRadius: 10, padding: '8px 12px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                  👁️
                </button>
              </>
            )}
            {showActions === 'staff-browse' && (
              <>
                {available > 0 ? (
                  <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                    <button className="bk-action-btn"
                      onClick={() => onBorrow && onBorrow(book)}
                      style={{ flex: 1, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 8px', fontWeight: 800, cursor: 'pointer', fontSize: 12 }}>
                      🛒 Cart
                    </button>
                    <button className="bk-action-btn"
                      onClick={() => onReserve && onReserve(book)}
                      style={{ flex: 1, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 8px', fontWeight: 800, cursor: 'pointer', fontSize: 12 }}>
                      🕒 Reserve
                    </button>
                  </div>
                ) : (
                  <button className="bk-action-btn"
                    onClick={() => onWaitlist && onWaitlist(book)}
                    style={{ flex: 1, background: 'linear-gradient(135deg,#d97706,#b45309)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 12px', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>
                    ⏳ Waitlist
                  </button>
                )}
                <button className="bk-action-btn" onClick={() => onBarcodes && onBarcodes(book)} style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '8px 12px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                  🏷️
                </button>
                <button className="bk-action-btn" onClick={() => setPopup(true)}
                  style={{ background: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9', color: text, border: 'none', borderRadius: 10, padding: '9px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                  ℹ️
                </button>
              </>
            )}
            {showActions === 'public' && (
              <button className="bk-action-btn" onClick={() => setPopup(true)} style={{ flex: 1, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>
                Borrow Now
              </button>
            )}
          </div>
        </div>
      </article>

      {/* Full Info Popup Modal */}
      {popup && (
        <div
          className="bk-popup-overlay"
          onClick={() => setPopup(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9500, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: 24 }}
        >
          <div
            className="bk-popup-inner"
            onClick={e => e.stopPropagation()}
            style={{ background: isDark ? '#161b27' : '#fff', borderRadius: 24, width: '100%', maxWidth: 660, maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${border}`, boxShadow: '0 40px 120px rgba(0,0,0,0.5)' }}
          >
            {/* Cover banner */}
            <div style={{ height: 240, background: gradient, position: 'relative', overflow: 'hidden', borderRadius: '24px 24px 0 0' }}>
              {coverSrc
                ? <img src={coverSrc} alt={book.Title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                    <span style={{ fontSize: 64 }}>📚</span>
                    <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 800, fontSize: 20, textAlign: 'center' }}>{book.Title}</span>
                  </div>
                )
              }
              <button onClick={() => setPopup(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                ✕
              </button>
              {/* Badges */}
              <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', gap: 8 }}>
                {book.CategoryName && <span style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>{book.CategoryName}</span>}
                <span style={{ background: available > 0 ? 'rgba(16,185,129,0.85)' : 'rgba(239,68,68,0.85)', color: '#fff', padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
                  {available > 0 ? `${available} Available` : 'Currently Unavailable'}
                </span>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: 32 }}>
              <h2 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 900, color: text, lineHeight: 1.2 }}>{book.Title}</h2>
              <p style={{ margin: '0 0 24px', color: '#3b82f6', fontWeight: 600, fontSize: 15 }}>By {book.Authors || 'Unknown Author'}</p>

              {/* Meta Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                {[
                  ['ISBN', book.ISBN],
                  ['Year', book.Year],
                  ['Edition', book.Edition],
                  ['Language', book.Language],
                  ['Publisher', book.PublisherName],
                  ['Copies', `${available} / ${book.TotalCopies || 0}`],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc', borderRadius: 10, padding: '10px 14px', border: `1px solid ${border}` }}>
                    <div style={{ fontSize: 10, color: muted, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: text }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Full Description */}
              {desc && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, color: muted, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Description</div>
                  <p style={{ margin: 0, fontSize: 14, color: text, lineHeight: 1.8, padding: '16px 18px', background: isDark ? 'rgba(59,130,246,0.06)' : '#f0f7ff', borderRadius: 12, border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : '#bfdbfe'}` }}>
                    {desc}
                  </p>
                </div>
              )}

              {/* Bottom CTA */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => navigate(`/book/${book.BookID}`)} style={{ flex: 1, padding: '13px', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: 15 }}>
                  View Full Details →
                </button>
                <button onClick={() => setPopup(false)} style={{ padding: '13px 20px', background: 'transparent', color: muted, border: `1px solid ${border}`, borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
