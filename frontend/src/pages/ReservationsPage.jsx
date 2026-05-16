import React, { useState, useEffect } from 'react';
import DashboardShell from '../components/DashboardShell';
import { useTheme } from '../context/ThemeContext';
import { useReservations } from '../hooks/useReservations';
import ReservationTable from '../components/reservations/ReservationTable';

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
  }

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

      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: c.muted }}>Loading...</div>
        ) : (
          <ReservationTable 
            reservations={reservations} 
            onCancel={handleCancel}
            c={c}
          />
        )}
      </div>
    </DashboardShell>
  );
}
