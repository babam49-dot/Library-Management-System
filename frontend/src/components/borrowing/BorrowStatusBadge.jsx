import React from 'react';

const STATUS_STYLES = {
  Borrowed: {
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.45)',
    color: '#059669',
    dot: '#10b981',
    label: '● Active',
    glow: '0 0 10px rgba(16,185,129,0.3)',
    pulse: true,
  },
  Pending: {
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.45)',
    color: '#b45309',
    dot: '#f59e0b',
    label: '⏳ Pending',
    glow: '0 0 10px rgba(245,158,11,0.2)',
    pulse: true,
  },
  Overdue: {
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.5)',
    color: '#dc2626',
    dot: '#ef4444',
    label: '🔴 Overdue',
    glow: '0 0 12px rgba(239,68,68,0.35)',
    pulse: false,
  },
  Returned: {
    bg: 'rgba(99, 102, 241, 0.10)',
    border: 'rgba(99, 102, 241, 0.35)',
    color: '#4f46e5',
    dot: '#6366f1',
    label: '✓ Returned',
    glow: 'none',
    pulse: false,
  },
  Expired: {
    bg: 'rgba(148, 163, 184, 0.10)',
    border: 'rgba(148, 163, 184, 0.30)',
    color: '#64748b',
    dot: '#94a3b8',
    label: '⌛ Expired',
    glow: 'none',
    pulse: false,
  },
};

export default function BorrowStatusBadge({ status }) {
  const s = STATUS_STYLES[status] || {
    bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.30)',
    color: '#64748b', dot: '#94a3b8', label: status, glow: 'none', pulse: false
  };

  return (
    <>
      <style>{`
        @keyframes badgePulse {
          0%, 100% { box-shadow: ${s.glow}; }
          50% { box-shadow: 0 0 18px ${s.dot}55; }
        }
        @keyframes dotBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 12px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 800,
        background: s.bg,
        color: s.color,
        border: `1.5px solid ${s.border}`,
        boxShadow: s.glow,
        animation: s.pulse ? 'badgePulse 2s ease-in-out infinite' : 'none',
        whiteSpace: 'nowrap',
        letterSpacing: '0.3px',
      }}>
        {status === 'Borrowed' && (
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: s.dot, flexShrink: 0,
            animation: 'dotBlink 1.4s ease-in-out infinite',
            boxShadow: `0 0 6px ${s.dot}`,
          }} />
        )}
        {s.label}
      </span>
    </>
  );
}
