import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

export default function OverdueTable({ records, onShowMember }) {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <tr>
            <th className="p-3">Req Code</th>
            <th className="p-3">Member Name</th>
            <th className="p-3">Student ID</th>
            <th className="p-3">Book Title</th>
            <th className="p-3">Due Date</th>
            <th className="p-3">Days Overdue</th>
            <th className="p-3">Est. Fine</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {records.map(rec => (
            <tr key={rec.borrowId} className={`${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} ${rec.daysOverdue > 14 ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
              <td className="p-3 font-mono">{rec.requestCode}</td>
              <td className="p-3 font-bold cursor-pointer hover:text-[#d4af37]" onClick={() => onShowMember && onShowMember(rec.memberID)}>
                {rec.fullName}
              </td>
              <td className="p-3 font-mono text-gray-500">{rec.studentID}</td>
              <td className="p-3">{rec.bookTitle}</td>
              <td className="p-3">{new Date(rec.dueDate).toLocaleDateString()}</td>
              <td className="p-3 text-red-500 font-bold">{rec.daysOverdue} days</td>
              <td className={`p-3 font-mono ${rec.estimatedFine > 50 ? 'text-red-500 font-bold' : ''}`}>
                ETB {parseFloat(rec.estimatedFine).toFixed(2)}
              </td>
              <td className="p-3">
                <button 
                  onClick={() => navigate('/desk', { state: { code: rec.requestCode, tab: 'return' } })}
                  className="px-3 py-1 bg-[#d4af37] text-white rounded text-xs font-bold hover:bg-[#b5952f]"
                >
                  Process Return
                </button>
              </td>
            </tr>
          ))}
          {records.length === 0 && (
            <tr>
              <td colSpan="8" className="p-4 text-center text-gray-500">No overdue records found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
