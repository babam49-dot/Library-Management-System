import React from 'react';
import ReservationStatusBadge from '../borrowing/ReservationStatusBadge';

export default function ReservationTable({ reservations, onCancel, onShowMember, c }) {

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
        <thead>
          <tr style={{ background: c ? (c.card === '#fff' ? '#f8fafc' : '#1a2236') : 'rgba(0,0,0,0.02)' }}>
            {['Res ID', 'Member Name', 'Book Title', 'Copy ID', 'Status', 'Priority', 'Reserved On', 'Deadline', 'Actions'].map(h => (
              <th key={h} style={{ padding: '12px 16px', fontWeight: 700, color: c ? c.muted : '#64748b', textTransform: 'uppercase', letterSpacing: 1, fontSize: 12 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {reservations.map(res => (
            <tr key={res.reservationId} className="table-row" style={{ borderTop: `1px solid ${c ? c.border : '#e2e8f0'}`, background: res.status === 'Ready' ? 'rgba(16, 185, 129, 0.05)' : 'transparent' }}>
              <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: c ? c.muted : '#64748b' }}>#{res.reservationId}</td>
              <td style={{ padding: '12px 16px', fontWeight: 700, cursor: 'pointer', color: '#3b82f6' }} onClick={() => onShowMember && onShowMember(res.memberID)}>
                {res.memberName}
              </td>
              <td style={{ padding: '12px 16px', color: c ? c.text : 'inherit' }}>{res.bookTitle}</td>
              <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: c ? c.text : 'inherit' }}>{res.copyId}</td>
              <td style={{ padding: '12px 16px' }}><ReservationStatusBadge status={res.status} /></td>
              <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'monospace', color: c ? c.text : 'inherit' }}>{res.status === 'Queued' ? res.priority : '-'}</td>
              <td style={{ padding: '12px 16px', color: c ? c.text : 'inherit' }}>{new Date(res.reservationDate).toLocaleDateString()}</td>
              <td style={{ padding: '12px 16px', color: c ? c.text : 'inherit' }}>{res.pickupDeadline ? new Date(res.pickupDeadline).toLocaleString() : '-'}</td>
              <td style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
                {['Queued', 'Ready'].includes(res.status) && (
                  <button 
                    onClick={() => onCancel(res.reservationId)}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
                  >
                    Cancel
                  </button>
                )}
              </td>
            </tr>
          ))}
          {reservations.length === 0 && (
            <tr>
              <td colSpan="9" style={{ padding: 40, textAlign: 'center', color: c ? c.muted : '#64748b' }}>No reservations found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
