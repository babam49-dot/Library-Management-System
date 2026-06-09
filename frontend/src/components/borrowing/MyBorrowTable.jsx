import React from 'react';
import BorrowStatusBadge from './BorrowStatusBadge';
import { useTheme } from '../../context/ThemeContext';

export default function MyBorrowTable({ borrows, onCancel }) {
  const { isDark } = useTheme();

  const formatDate = (d) => {
    if (!d) return '-';
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return '-';
    return dateObj.toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  };

  const getDaysLeft = (dueDate) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due - now;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const getRowBg = (row) => {
    if (row.status === 'Overdue') {
      return isDark ? 'rgba(239,68,68,0.07)' : 'rgba(254,226,226,0.6)';
    }
    if (row.status === 'Borrowed') {
      return isDark ? 'rgba(16,185,129,0.06)' : 'rgba(209,250,229,0.4)';
    }
    if (row.status === 'Pending') {
      return isDark ? 'rgba(245,158,11,0.06)' : 'rgba(255,251,235,0.6)';
    }
    return 'transparent';
  };

  const getLeftBorder = (row) => {
    if (row.status === 'Overdue') return '4px solid #ef4444';
    if (row.status === 'Borrowed') return '4px solid #10b981';
    if (row.status === 'Pending') return '4px solid #f59e0b';
    return '4px solid transparent';
  };

  const th = {
    padding: '12px 16px',
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    color: isDark ? '#64748b' : '#94a3b8',
    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
    background: isDark ? '#111827' : '#f8fafc',
    whiteSpace: 'nowrap',
  };

  return (
    <>
      <style>{`
        @keyframes overdueFlash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
      <div style={{ overflowX: 'auto' }}>
        {borrows.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: isDark ? '#475569' : '#94a3b8' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: isDark ? '#64748b' : '#475569' }}>No records found</div>
            <div style={{ fontSize: 13 }}>No borrow history in this tab.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr>
                <th style={th}>Request Code</th>
                <th style={th}>Book Title</th>
                <th style={th}>Status</th>
                <th style={th}>Borrow Date</th>
                <th style={th}>Due / Return Date</th>
                <th style={th}>Timeline</th>
                {onCancel && <th style={th}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {borrows.map((row) => {
                const daysLeft = getDaysLeft(row.dueDate);
                const isBorrowed = row.status === 'Borrowed';
                const isOverdue = row.status === 'Overdue';
                const isPending = row.status === 'Pending';

                return (
                  <tr
                    key={row.borrowId}
                    style={{
                      background: getRowBg(row),
                      borderLeft: getLeftBorder(row),
                      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'}`,
                      transition: 'background 0.2s',
                    }}
                  >
                    {/* Request Code */}
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#3b82f6', whiteSpace: 'nowrap' }}>
                      {row.requestCode}
                    </td>

                    {/* Book Title */}
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', fontSize: 14 }}>
                      {row.bookTitle}
                      {isPending && (
                        <div style={{ fontSize: 11, color: '#d97706', marginTop: 3, fontWeight: 600 }}>
                          ⏳ Awaiting librarian approval
                        </div>
                      )}
                      {isOverdue && (
                        <div style={{
                          fontSize: 11, color: '#dc2626', marginTop: 3, fontWeight: 700,
                          animation: 'overdueFlash 2s ease-in-out infinite',
                        }}>
                          🚨 Past due date — please return immediately
                        </div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '14px 16px' }}>
                      <BorrowStatusBadge status={row.status} />
                    </td>

                    {/* Borrow Date */}
                    <td style={{ padding: '14px 16px', fontSize: 13, color: isDark ? '#94a3b8' : '#64748b' }}>
                      {formatDate(row.borrowDate)}
                    </td>

                    {/* Due / Return Date */}
                    <td style={{ padding: '14px 16px', fontSize: 13 }}>
                      {row.returnDate ? (
                        <div>
                          <div style={{ fontWeight: 600, color: isDark ? '#e2e8f0' : '#334155' }}>{formatDate(row.returnDate)}</div>
                          <div style={{ fontSize: 11, color: '#10b981', marginTop: 2, fontWeight: 700 }}>✓ Returned</div>
                        </div>
                      ) : row.dueDate ? (
                        <div>
                          <div style={{
                            fontWeight: 700,
                            color: isOverdue ? '#dc2626' : (isDark ? '#e2e8f0' : '#334155'),
                          }}>
                            {formatDate(row.dueDate)}
                          </div>
                          <div style={{ fontSize: 11, color: isOverdue ? '#ef4444' : '#64748b', marginTop: 2, fontWeight: 600 }}>
                            {isOverdue ? '⚠️ Overdue' : 'Due date'}
                          </div>
                        </div>
                      ) : '-'}
                    </td>

                    {/* Timeline / Countdown */}
                    <td style={{ padding: '14px 16px', minWidth: 140 }}>
                      {isBorrowed && daysLeft !== null && daysLeft > 0 && (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: 'rgba(16,185,129,0.12)',
                          border: '1.5px solid rgba(16,185,129,0.35)',
                          color: '#059669',
                          borderRadius: 20,
                          padding: '4px 12px',
                          fontSize: 12,
                          fontWeight: 800,
                        }}>
                          🕐 {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                        </div>
                      )}
                      {isBorrowed && daysLeft !== null && daysLeft <= 0 && (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: 'rgba(239,68,68,0.12)',
                          border: '1.5px solid rgba(239,68,68,0.4)',
                          color: '#dc2626',
                          borderRadius: 20,
                          padding: '4px 12px',
                          fontSize: 12,
                          fontWeight: 800,
                          animation: 'overdueFlash 2s ease-in-out infinite',
                        }}>
                          🔴 Due today!
                        </div>
                      )}
                      {isOverdue && (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: 'rgba(239,68,68,0.14)',
                          border: '1.5px solid rgba(239,68,68,0.5)',
                          color: '#dc2626',
                          borderRadius: 20,
                          padding: '4px 12px',
                          fontSize: 12,
                          fontWeight: 800,
                          animation: 'overdueFlash 1.8s ease-in-out infinite',
                        }}>
                          ⚠️ {row.daysOverdue || Math.abs(daysLeft || 0)} days overdue
                        </div>
                      )}
                      {isPending && row.pickupDeadline && (
                        <div style={{
                          fontSize: 11,
                          color: '#b45309',
                          fontWeight: 600,
                        }}>
                          Collect by {new Date(row.pickupDeadline).toLocaleString()}
                        </div>
                      )}
                    </td>

                    {/* Cancel Action */}
                    {onCancel && (
                      <td style={{ padding: '14px 16px' }}>
                        {isPending && (
                          <button
                            onClick={() => onCancel(row.requestCode)}
                            style={{
                              background: 'rgba(239,68,68,0.08)',
                              color: '#ef4444',
                              border: '1.5px solid rgba(239,68,68,0.3)',
                              borderRadius: 8,
                              padding: '6px 14px',
                              fontWeight: 700,
                              fontSize: 12,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              whiteSpace: 'nowrap',
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.16)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                          >
                            ✕ Cancel
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
