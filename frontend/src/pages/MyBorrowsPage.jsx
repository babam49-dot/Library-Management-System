import React, { useState, useEffect } from 'react';
import DashboardShell from '../components/DashboardShell';
import { useTheme } from '../context/ThemeContext';
import { useMyBorrows } from '../hooks/useMyBorrows';
import { useBorrowing } from '../hooks/useBorrowing';
import MyBorrowTable from '../components/borrowing/MyBorrowTable';
import ReservationStatusBadge from '../components/borrowing/ReservationStatusBadge';

export default function MyBorrowsPage() {
  const { isDark } = useTheme();
  const [tab, setTab] = useState('active'); // active, history, reservations

  const { borrows, reservations, loading, fetchMyBorrows, fetchMyReservations, cancelReservation } = useMyBorrows();
  const { cancelRequest } = useBorrowing();

  useEffect(() => {
    if (tab === 'active') fetchMyBorrows({ status: 'Pending,Borrowed,Overdue' });
    else if (tab === 'history') fetchMyBorrows({ status: 'Returned,Expired' });
    else if (tab === 'reservations') fetchMyReservations();
  }, [tab, fetchMyBorrows, fetchMyReservations]);

  const [notice, setNotice] = useState({ text: '', ok: true });
  const showNotice = (text, ok = true) => {
    setNotice({ text, ok });
    setTimeout(() => setNotice({ text: '', ok: true }), 4000);
  };

  const handleCancelRequest = async (row) => {
    const code = row?.requestCode || row?.RequestCode;
    if (!code) return;
    try {
      await cancelRequest(code);
      showNotice(`✅ Request ${code} cancelled. The book copy is available again.`);
      fetchMyBorrows({ status: 'Pending,Borrowed,Overdue' });
    } catch (err) {
      showNotice('❌ Failed to cancel: ' + (err?.response?.data?.message || err?.message || err), false);
    }
  };

  const handleCancelReservation = async (id) => {
    try {
      await cancelReservation(id);
      showNotice('✅ Reservation cancelled successfully.');
    } catch (err) {
      showNotice('❌ Failed to cancel: ' + (err?.response?.data?.message || err?.message || err), false);
    }
  };

  const readyReservations = reservations.filter(r => r.status === 'Ready');

  const MEMBER_NAV_ITEMS = [
    { key: 'overview', label: 'My Dashboard', icon: '🏠', path: '/member' },
    { key: 'catalog', label: 'All Books', icon: '📚', path: '/member' },
    { key: 'categories', label: 'By Category', icon: '🗂️', path: '/member' },
    { key: 'borrow', label: 'Borrow Books', icon: '📖', path: '/borrow' },
    { key: 'my-borrows', label: 'My Borrows', icon: '📋', path: '/my-borrows' },
    { key: 'fines', label: 'My Fines', icon: '💳', path: '/member' },
    { key: 'profile', label: 'My Profile', icon: '👤', path: '/member' },
  ];

  return (
    <DashboardShell role="member" navItems={MEMBER_NAV_ITEMS} activeTab="my-borrows" tabLabel="My Borrows">

      {/* ── Inline action notice ── */}
      {notice.text && (
        <div style={{
          marginBottom: 16, padding: '12px 18px', borderRadius: 12, fontWeight: 700, fontSize: 14,
          background: notice.ok ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)',
          border: `1px solid ${notice.ok ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`,
          color: notice.ok ? '#065f46' : '#991b1b',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span>{notice.text}</span>
          <button onClick={() => setNotice({ text: '', ok: true })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 900, color: 'inherit', fontSize: 16 }}>✕</button>
        </div>
      )}

      {readyReservations.length > 0 && (
        <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-800 rounded-xl flex items-center shadow">
          <span className="text-2xl mr-3">📗</span>
          <div>
            <h3 className="font-bold">A book you reserved is ready for pickup!</h3>
            <p className="text-sm">Please present code <strong className="font-mono">{readyReservations[0].requestCode}</strong> at the library desk.</p>
          </div>
        </div>
      )}

      <div className="flex border-b mb-6 dark:border-gray-700">
        {['active', 'history', 'reservations'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              tab === t 
                ? 'border-[#d4af37] text-[#d4af37]' 
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className={`rounded-xl border shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} overflow-hidden`}>
        {loading && <div className="p-8 text-center text-gray-500">Loading...</div>}
        
        {!loading && (tab === 'active' || tab === 'history') && (
          <MyBorrowTable 
            borrows={borrows.records || []} 
            onCancel={tab === 'active' ? handleCancelRequest : null} 
          />
        )}

        {!loading && tab === 'reservations' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <tr>
                  <th className="p-3">Book Title</th>
                  <th className="p-3">Queue Pos</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Reserved On</th>
                  <th className="p-3">Pickup Deadline</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {reservations.map(res => (
                  <tr key={res.reservationId} className={`${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} ${res.status === 'Ready' ? 'border-l-4 border-l-green-500' : ''}`}>
                    <td className="p-3 font-bold">{res.bookTitle}</td>
                    <td className="p-3">{res.status === 'Queued' ? `#${res.queuePosition}` : '-'}</td>
                    <td className="p-3"><ReservationStatusBadge status={res.status} /></td>
                    <td className="p-3">{new Date(res.reservationDate).toLocaleDateString()}</td>
                    <td className="p-3">{res.pickupDeadline ? new Date(res.pickupDeadline).toLocaleString() : '-'}</td>
                    <td className="p-3">
                      {res.status === 'Queued' && (
                        <button 
                          onClick={() => handleCancelReservation(res.reservationId)}
                          className="text-red-500 hover:text-red-700 font-bold"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {reservations.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-gray-500">No reservations found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
