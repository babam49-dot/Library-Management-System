import React, { useState, useEffect } from 'react';
import DashboardShell from '../components/DashboardShell';
import { useTheme } from '../context/ThemeContext';
import { useBorrowing } from '../hooks/useBorrowing';
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
      r.borrowId, r.requestCode, \`"\${r.fullName}"\`, r.studentID, \`"\${r.bookTitle}"\`,
      new Date(r.dueDate).toLocaleDateString(), r.daysOverdue, r.estimatedFine
    ]);
    
    const csvContent = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', \`overdue-report-\${new Date().toISOString().split('T')[0]}.csv\`);
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

  return (
    <DashboardShell title="Overdue Books">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className={\`p-6 rounded-2xl shadow-sm \${isDark ? 'bg-gray-800' : 'bg-white'}\`}>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Total Overdue</p>
          <p className="text-4xl font-bold font-mono text-red-500">{totalOverdue}</p>
        </div>
        <div className={\`p-6 rounded-2xl shadow-sm \${isDark ? 'bg-gray-800' : 'bg-white'}\`}>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Members Affected</p>
          <p className="text-4xl font-bold font-mono">{uniqueMembers}</p>
        </div>
        <div className={\`p-6 rounded-2xl shadow-sm \${isDark ? 'bg-gray-800' : 'bg-white'}\`}>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Est. Total Fines</p>
          <p className="text-4xl font-bold font-mono text-[#d4af37]">ETB {totalEstFines.toFixed(2)}</p>
        </div>
      </div>

      <div className={\`p-6 rounded-2xl shadow-sm mb-6 flex flex-wrap gap-4 items-center justify-between \${isDark ? 'bg-gray-800' : 'bg-white'}\`}>
        <div className="flex-1 min-w-[250px]">
          <input 
            type="text" 
            placeholder="Search by Member Name or ID..."
            value={memberFilter}
            onChange={e => setMemberFilter(e.target.value)}
            className={\`w-full p-3 rounded-lg border \${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300'} focus:outline-none focus:ring-2 focus:ring-[#d4af37]\`}
          />
        </div>
        <button 
          onClick={handleExportCSV}
          disabled={records.length === 0}
          className="px-6 py-3 bg-gray-800 text-white dark:bg-gray-700 rounded-lg font-bold hover:bg-gray-900 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          Export CSV
        </button>
      </div>

      <div className={\`rounded-2xl border shadow-sm overflow-hidden \${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}\`}>
        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading...</div>
        ) : (
          <OverdueTable records={filteredRecords} />
        )}
      </div>
    </DashboardShell>
  );
}
