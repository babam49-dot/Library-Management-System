import React, { useState, useEffect } from 'react';
import CopyConfirmRow from './CopyConfirmRow';
import { LOAN_PERIOD_OPTIONS, DEFAULT_LOAN_PERIOD } from '../../constants/borrowingStatuses';
import { useTheme } from '../../context/ThemeContext';

export default function SessionCard({ sessionData, onConfirm, isConfirming }) {
  const { isDark } = useTheme();
  const { requestCode, member, rows } = sessionData;
  
  const eligibleRows = rows.filter(r => r.eligibleForConfirmation);
  
  const [selectedIds, setSelectedIds] = useState([]);
  const [loanPeriod, setLoanPeriod] = useState(DEFAULT_LOAN_PERIOD);

  // Auto-select all eligible rows initially
  useEffect(() => {
    setSelectedIds(eligibleRows.map(r => r.borrowId));
  }, [sessionData]);

  const toggleRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    if (selectedIds.length > 0) {
      onConfirm({ borrowIds: selectedIds, loanPeriodDays: loanPeriod });
    }
  };

  return (
    <div className={\`rounded-2xl shadow-lg border overflow-hidden mb-6 \${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}\`}>
      <div className={\`p-6 border-b \${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}\`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold font-serif mb-1">Session {requestCode}</h2>
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-bold">Member Pickup</span>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">{member.fullName}</p>
            <p className="text-sm text-gray-500 font-mono">{member.studentID}</p>
            <p className="text-sm text-gray-500">{member.email}</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className={\`\${isDark ? 'bg-gray-900 text-gray-400' : 'bg-gray-100 text-gray-600'}\`}>
            <tr>
              <th className="p-3">Book Title</th>
              <th className="p-3">Copy ID</th>
              <th className="p-3">Shelf</th>
              <th className="p-3">Status</th>
              <th className="p-3">Deadline</th>
              <th className="p-3 text-center">Confirm</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {rows.map(row => (
              <CopyConfirmRow 
                key={row.borrowId} 
                row={row} 
                isChecked={selectedIds.includes(row.borrowId)}
                onToggle={toggleRow}
                isDark={isDark}
              />
            ))}
          </tbody>
        </table>
      </div>

      {eligibleRows.length > 0 && (
        <div className={\`p-6 border-t flex flex-col md:flex-row gap-4 justify-between items-center \${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}\`}>
          <div className="flex items-center gap-3">
            <label className="font-bold">Loan Period:</label>
            <select 
              value={loanPeriod}
              onChange={(e) => setLoanPeriod(Number(e.target.value))}
              className={\`p-2 rounded border focus:outline-none focus:ring-2 focus:ring-[#d4af37] \${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}\`}
            >
              {LOAN_PERIOD_OPTIONS.map(days => (
                <option key={days} value={days}>{days} days</option>
              ))}
            </select>
          </div>
          <button 
            onClick={handleConfirm}
            disabled={selectedIds.length === 0 || isConfirming}
            className="w-full md:w-auto px-8 py-3 bg-[#d4af37] text-white rounded-xl font-bold hover:bg-[#b5952f] disabled:opacity-50 transition-colors"
          >
            {isConfirming ? 'Processing...' : \`Confirm \${selectedIds.length} Books\`}
          </button>
        </div>
      )}
    </div>
  );
}
