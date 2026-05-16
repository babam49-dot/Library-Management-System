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
    { key: 'desk', label: 'Librarian Desk', icon: '🖥️', path: '/desk' },
    { key: 'reservations', label: 'Reservations', icon: '📋', path: '/reservations' },
    { key: 'overdue', label: 'Overdue Books', icon: '⚠️', path: '/overdue' },
    { key: 'profile', label: 'My Profile', icon: '👤', path: '/staff' },
  ];

  return (
    <DashboardShell role="staff" navItems={STAFF_NAV_ITEMS} activeTab="reservations" tabLabel="Reservations">
      <div className={`p-6 rounded-2xl shadow-sm mb-6 flex flex-wrap gap-4 items-end ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-bold mb-2">Copy ID</label>
          <input 
            type="number" 
            placeholder="e.g. 101"
            value={copyIdFilter}
            onChange={e => setCopyIdFilter(e.target.value)}
            className={`w-full p-3 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300'} focus:outline-none focus:ring-2 focus:ring-[#d4af37]`}
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-bold mb-2">Status</label>
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className={`w-full p-3 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300'} focus:outline-none focus:ring-2 focus:ring-[#d4af37]`}
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
          className="px-6 py-3 bg-[#d4af37] text-white rounded-lg font-bold hover:bg-[#b5952f] transition-colors"
        >
          Filter
        </button>
      </div>

      <div className={`rounded-2xl border shadow-sm overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading...</div>
        ) : (
          <ReservationTable 
            reservations={reservations} 
            onCancel={handleCancel}
          />
        )}
      </div>
    </DashboardShell>
  );
}
