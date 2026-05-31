import { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:4000/api';
const getHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('lms_token')}` } });

export function useStaffNavCounts() {
  const [counts, setCounts] = useState({
    myborrow: 0,
    desk: 0,
    overdue: 0,
    reservations: 0,
  });

  const fetchCounts = async () => {
    try {
      // 1. My borrowing pending count
      let pendingMyBorrows = 0;
      try {
        const myB = await axios.get(`${API}/borrowing/my`, getHeaders());
        const records = myB.data.data?.records || myB.data.data || [];
        pendingMyBorrows = records.filter(b => (b.status || b.Status) === 'Pending').length;
      } catch (e) {
        console.error("Failed to load my borrowing count", e);
      }

      // 2. Pending desk sessions count
      let pendingDeskCount = 0;
      try {
        const res = await axios.get(`${API}/borrowing/sessions`, getHeaders());
        const rows = res.data.data || [];
        pendingDeskCount = rows.filter(r => r.status === 'Pending').length;
      } catch (e) {
        console.error("Failed to load desk sessions count", e);
      }

      // 3. Overdue books count
      let overdueCount = 0;
      try {
        const statsRes = await axios.get(`${API}/staff/dashboard`, getHeaders());
        overdueCount = statsRes.data.data?.overdueCount || 0;
      } catch (e) {
        console.error("Failed to load dashboard stats", e);
      }

      // 4. Reservations count
      let resCount = 0;
      try {
        const resList = await axios.get(`${API}/reservations`, getHeaders());
        const list = resList.data.data || [];
        resCount = list.filter(r => r.status === 'Ready' || r.status === 'Queued').length;
      } catch (e) {
        console.error("Failed to load reservations count", e);
      }

      setCounts({
        myborrow: pendingMyBorrows,
        desk: pendingDeskCount,
        overdue: overdueCount,
        reservations: resCount,
      });
    } catch (err) {
      console.error("Failed to load staff nav counts", err);
    }
  };

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 10000);
    return () => clearInterval(interval);
  }, []);

  return { counts, refetch: fetchCounts };
}

export function getStaffNavItems(counts) {
  return [
    { key: 'overview', label: 'Circulation Overview', icon: '📊', path: '/staff' },
    { key: 'myborrow', label: 'My Borrowing', icon: '📖', path: '/staff', badge: counts.myborrow },
    { key: 'browse', label: 'Browse Catalog', icon: '📚', path: '/staff' },
    { key: 'catalog', label: 'Register Book', icon: '➕', path: '/staff' },
    { key: 'metadata', label: 'Manage Metadata', icon: '🏷️', path: '/staff' },
    { key: 'fines', label: 'Fine Payments', icon: '💰', path: '/staff' },
    { key: 'desk', label: 'Librarian Desk', icon: '🖥️', path: '/desk', badge: counts.desk },
    { key: 'reservations', label: 'Reservations', icon: '📋', path: '/reservations', badge: counts.reservations },
    { key: 'overdue', label: 'Overdue Books', icon: '⚠️', path: '/overdue', badge: counts.overdue },
    { key: 'profile', label: 'My Profile', icon: '👤', path: '/staff' },
    { key: 'payments', label: 'Payment History', icon: '🧾', path: '/staff' },
  ];
}
