import React, { useState, useEffect } from 'react';
import DashboardShell from '../components/DashboardShell';
import { useTheme } from '../context/ThemeContext';
import { useReservations } from '../hooks/useReservations';

function CountdownTimer({ deadline, onExpire }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [color, setColor] = useState('#10b981'); // green

  useEffect(() => {
    if (!deadline) return;
    const interval = setInterval(() => {
      const diff = new Date(deadline).getTime() - new Date().getTime();
      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft('EXPIRED');
        setColor('#ef4444'); // red
        if (onExpire) onExpire();
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins}m ${secs}s`);
      if (mins < 5) setColor('#ef4444'); // red
      else if (mins < 15) setColor('#f59e0b'); // yellow
      else setColor('#10b981'); // green
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline, onExpire]);

  return <span style={{ color, fontWeight: 800, fontSize: 18 }}>{timeLeft}</span>;
}

export default function ReservationsPage() {
  const { isDark } = useTheme();
  const { reservations, loading, fetchReservations, cancelReservation } = useReservations();

  const [copyIdFilter, setCopyIdFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleFilter = () => {
    const params = {};
    if (copyIdFilter) params.copyId = copyIdFilter;
    if (statusFilter) params.status = statusFilter;
    fetchReservations(params);
  };

  const handleCancel = async (id) => {
    if (window.confirm("Cancel this reservation? This will release the hold if ready, or remove from queue.")) {
      try {
        await cancelReservation(id);
        handleFilter(); // refresh
      } catch (e) {
        alert("Failed to cancel: " + e);
      }
    }
  };

  const STAFF_NAV_ITEMS = [
    { key: 'overview', label: 'Circulation Overview', icon: '📊', path: '/staff' },
    { key: 'members', label: 'Member Approvals', icon: '👤', path: '/staff' },
    { key: 'browse', label: 'Browse Catalog', icon: '📚', path: '/staff' },
    { key: 'catalog', label: 'Register Book', icon: '➕', path: '/staff' },
    { key: 'metadata', label: 'Manage Metadata', icon: '🏷️', path: '/staff' },
    { key: 'fines', label: 'Fine Payments', icon: '💰', path: '/staff' },
    { key: 'desk', label: 'Librarian Desk', icon: '🖥️', path: '/desk' },
    { key: 'reservations', label: 'Reservations', icon: '📋', path: '/reservations' },
    { key: 'overdue', label: 'Overdue Books', icon: '⚠️', path: '/overdue' },
    { key: 'profile', label: 'My Profile', icon: '👤', path: '/staff' },
  ];

  const c = {
    card: isDark ? '#161b27' : '#fff',
    border: isDark ? '#1e2d40' : '#e2e8f0',
    text: isDark ? '#f1f5f9' : '#0f172a',
    muted: isDark ? '#64748b' : '#64748b',
    input: isDark ? '#1e2d40' : '#f8fafc',
  };

  return (
    <DashboardShell role="staff" navItems={STAFF_NAV_ITEMS} activeTab="reservations" tabLabel="Reservations">
      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 24, marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: c.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Copy ID</label>
          <input 
            type="number" 
            placeholder="e.g. 101"
            value={copyIdFilter}
            onChange={e => setCopyIdFilter(e.target.value)}
            style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: `1px solid ${c.border}`, background: c.input, color: c.text, fontSize: 14, outline: 'none' }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: c.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Status</label>
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: `1px solid ${c.border}`, background: c.input, color: c.text, fontSize: 14, outline: 'none' }}
          >
            <option value="">All Statuses</option>
            <option value="Queued">Queued</option>
            <option value="Ready">Ready</option>
            <option value="Collected">Collected</option>
            <option value="Expired">Expired</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <button 
          onClick={handleFilter}
          className="interactive-btn"
          style={{ padding: '12px 24px', background: '#3b82f6', color: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer', border: 'none' }}
        >
          Filter
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: c.muted }}>Loading...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {reservations.map(res => (
            <div key={res.ReservationID} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', overflow: 'hidden' }}>
              {res.Status === 'Ready' && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #10b981, #3b82f6)' }} />
              )}
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: c.muted, textTransform: 'uppercase', letterSpacing: 1 }}>#{res.RequestCode}</span>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: 20, 
                    fontSize: 12, 
                    fontWeight: 700,
                    background: res.Status === 'Ready' ? 'rgba(16,185,129,0.1)' : res.Status === 'Queued' ? 'rgba(245,158,11,0.1)' : 'rgba(100,116,139,0.1)',
                    color: res.Status === 'Ready' ? '#10b981' : res.Status === 'Queued' ? '#f59e0b' : '#64748b'
                  }}>
                    {res.Status}
                  </span>
                </div>
                <h3 style={{ margin: '0 0 4px', fontSize: 18, color: c.text, fontWeight: 700 }}>{res.BookTitle}</h3>
                <p style={{ margin: 0, fontSize: 14, color: c.muted }}>Copy ID: {res.CopyID || 'Pending'}</p>
              </div>

              <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: 16, borderRadius: 12 }}>
                <p style={{ margin: '0 0 8px', fontSize: 14, color: c.text }}><strong>Member:</strong> {res.MemberName} ({res.StudentID})</p>
                {res.Status === 'Queued' && (
                  <p style={{ margin: 0, fontSize: 14, color: c.text }}><strong>Priority:</strong> {res.Priority}</p>
                )}
                {res.Status === 'Ready' && res.PickupDeadline && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: c.muted }}>Time Remaining:</span>
                    <CountdownTimer deadline={res.PickupDeadline} onExpire={handleFilter} />
                  </div>
                )}
              </div>

              {['Queued', 'Ready'].includes(res.Status) && (
                <button 
                  onClick={() => handleCancel(res.ReservationID)}
                  style={{ padding: '10px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  Cancel Hold
                </button>
              )}
            </div>
          ))}
          {reservations.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: c.muted, border: `1px dashed ${c.border}`, borderRadius: 16 }}>
              No reservations found matching your filters.
            </div>
          )}
        </div>
      )}
    </DashboardShell>
  );
}
