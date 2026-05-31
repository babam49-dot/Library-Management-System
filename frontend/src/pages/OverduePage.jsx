import React, { useState, useEffect } from 'react';
import DashboardShell from '../components/DashboardShell';
import { useTheme } from '../context/ThemeContext';
import { useBorrowing } from '../hooks/useBorrowing';
import { useStaffNavCounts, getStaffNavItems } from '../hooks/useStaffNavCounts';
import OverdueTable from '../components/overdue/OverdueTable';

export default function OverduePage() {
  const { isDark } = useTheme();
  const { getOverdue, loading } = useBorrowing();

  const [records, setRecords] = useState([]);
  const [memberFilter, setMemberFilter] = useState('');
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await getOverdue({});
      setRecords(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCSV = () => {
    if (records.length === 0) return;
    
    const headers = ['Borrow ID', 'Request Code', 'Member Name', 'Student ID', 'Book Title', 'Due Date', 'Days Overdue', 'Est. Fine (ETB)'];
    const csvRows = records.map(r => [
      r.borrowId, r.requestCode, `"${r.fullName}"`, r.studentID, `"${r.bookTitle}"`,
      new Date(r.dueDate).toLocaleDateString(), r.daysOverdue, r.estimatedFine
    ]);
    
    const csvContent = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `overdue-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRecords = records.filter(r => 
    r.fullName.toLowerCase().includes(memberFilter.toLowerCase()) || 
    r.studentID?.toLowerCase().includes(memberFilter.toLowerCase())
  );

  const totalOverdue = filteredRecords.length;
  const uniqueMembers = new Set(filteredRecords.map(r => r.memberID)).size;
  const totalEstFines = filteredRecords.reduce((sum, r) => sum + parseFloat(r.estimatedFine || 0), 0);

  const { counts } = useStaffNavCounts();
  const STAFF_NAV_ITEMS = getStaffNavItems(counts);

  const c = {
    card: isDark ? '#161b27' : '#fff',
    border: isDark ? '#1e2d40' : '#e2e8f0',
    text: isDark ? '#f1f5f9' : '#0f172a',
    muted: isDark ? '#64748b' : '#64748b',
    input: isDark ? '#1e2d40' : '#f8fafc',
  }

  return (
    <DashboardShell role="staff" navItems={STAFF_NAV_ITEMS} activeTab="overdue" tabLabel="Overdue Books">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 24 }}>
        <div className="interactive-card" style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 24 }}>
          <p style={{ color: c.muted, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Total Overdue</p>
          <p style={{ fontSize: 36, fontWeight: 800, fontFamily: 'monospace', color: '#ef4444' }}>{totalOverdue}</p>
        </div>
        <div className="interactive-card" style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 24 }}>
          <p style={{ color: c.muted, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Members Affected</p>
          <p style={{ fontSize: 36, fontWeight: 800, fontFamily: 'monospace', color: c.text }}>{uniqueMembers}</p>
        </div>
        <div className="interactive-card" style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 24 }}>
          <p style={{ color: c.muted, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Est. Total Fines</p>
          <p style={{ fontSize: 36, fontWeight: 800, fontFamily: 'monospace', color: '#f59e0b' }}>ETB {totalEstFines.toFixed(2)}</p>
        </div>
      </div>

      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 20, marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: 250 }}>
          <input 
            type="text" 
            placeholder="Search by Member Name or ID..."
            value={memberFilter}
            onChange={e => setMemberFilter(e.target.value)}
            style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: `1px solid ${c.border}`, background: c.input, color: c.text, fontSize: 14, outline: 'none' }}
          />
        </div>
        <button 
          onClick={handleExportCSV}
          disabled={records.length === 0}
          className="interactive-btn"
          style={{ padding: '12px 24px', background: isDark ? '#374151' : '#1e293b', color: '#fff', borderRadius: 8, fontWeight: 700, cursor: records.length === 0 ? 'not-allowed' : 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 8, opacity: records.length === 0 ? 0.5 : 1 }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          Export CSV
        </button>
      </div>

      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: c.muted }}>Loading...</div>
        ) : (
          <OverdueTable records={filteredRecords} c={c} />
        )}
      </div>
    </DashboardShell>
  );
}
