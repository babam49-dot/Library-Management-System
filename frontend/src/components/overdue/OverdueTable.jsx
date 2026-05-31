import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function OverdueTable({ records, onShowMember, c }) {
  const navigate = useNavigate();

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
        <thead>
          <tr style={{ background: c ? (c.card === '#fff' ? '#f8fafc' : '#1a2236') : 'rgba(0,0,0,0.02)' }}>
            {['Req Code', 'Member Name', 'Student ID', 'Book Title', 'Due Date', 'Days Overdue', 'Est. Fine', 'Actions'].map(h => (
              <th key={h} style={{ padding: '12px 16px', fontWeight: 700, color: c ? c.muted : '#64748b', textTransform: 'uppercase', letterSpacing: 1, fontSize: 12 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map(rec => (
            <tr key={rec.borrowId} className="table-row" style={{ borderTop: `1px solid ${c ? c.border : '#e2e8f0'}`, background: rec.daysOverdue > 14 ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
              <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: c ? c.text : 'inherit' }}>{rec.requestCode}</td>
              <td style={{ padding: '12px 16px', fontWeight: 700, cursor: 'pointer', color: '#3b82f6' }} onClick={() => onShowMember && onShowMember(rec.memberID)}>
                {rec.fullName}
              </td>
              <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: c ? c.muted : '#64748b' }}>{rec.studentID}</td>
              <td style={{ padding: '12px 16px', color: c ? c.text : 'inherit', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rec.bookTitle}</td>
              <td style={{ padding: '12px 16px', color: c ? c.text : 'inherit' }}>{new Date(rec.dueDate).toLocaleDateString()}</td>
              <td style={{ padding: '12px 16px', color: '#ef4444', fontWeight: 800 }}>{rec.daysOverdue} days</td>
              <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: rec.estimatedFine > 50 ? '#ef4444' : (c ? c.text : 'inherit'), fontWeight: rec.estimatedFine > 50 ? 800 : 500 }}>
                ETB {parseFloat(rec.estimatedFine).toFixed(2)}
              </td>
              <td style={{ padding: '12px 16px' }}>
                <button 
                  onClick={() => navigate('/desk', { state: { code: rec.requestCode, tab: 'return' } })}
                  className="interactive-btn"
                  style={{ padding: '6px 12px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Process Return
                </button>
              </td>
            </tr>
          ))}
          {records.length === 0 && (
            <tr>
              <td colSpan="8" style={{ padding: 40, textAlign: 'center', color: c ? c.muted : '#64748b' }}>No overdue records found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
