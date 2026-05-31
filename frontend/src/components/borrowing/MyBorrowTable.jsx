import React from 'react';
import BorrowStatusBadge from './BorrowStatusBadge';
import { useTheme } from '../../context/ThemeContext';

export default function MyBorrowTable({ borrows, onCancel }) {
  const { isDark } = useTheme();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <tr>
            <th className="p-3">Request Code</th>
            <th className="p-3">Book Title</th>
            <th className="p-3">Status</th>
            <th className="p-3">Borrow Date</th>
            <th className="p-3">Due / Return Date</th>
            <th className="p-3">Timeline</th>
            {onCancel && <th className="p-3">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {borrows.map(row => (
            <tr key={row.borrowId} className={`${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}>
              <td className="p-3 font-mono">{row.requestCode}</td>
              <td className="p-3 font-bold">{row.bookTitle}</td>
              <td className="p-3"><BorrowStatusBadge status={row.status} /></td>
              <td className="p-3">{row.borrowDate ? new Date(row.borrowDate).toLocaleDateString() : '-'}</td>
              <td className="p-3">
                {row.returnDate ? new Date(row.returnDate).toLocaleDateString() 
                  : row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '-'}
              </td>
              <td className="p-3">
                {row.status === 'Borrowed' && !row.isOverdue && (
                  <span className="text-green-500">Due in {Math.max(0, Math.ceil((new Date(row.dueDate) - new Date()) / (1000 * 60 * 60 * 24)))} days</span>
                )}
                {row.status === 'Overdue' && (
                  <span className="text-red-500 font-bold">{row.daysOverdue} days overdue</span>
                )}
                {row.status === 'Pending' && row.pickupDeadline && (
                  <span className="text-yellow-600">Collect by {new Date(row.pickupDeadline).toLocaleString()}</span>
                )}
              </td>
              {onCancel && (
                <td className="p-3">
                  {row.status === 'Pending' && (
                    <button 
                      onClick={() => onCancel(row.requestCode)}
                      className="text-red-500 hover:text-red-700 font-bold"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
          {borrows.length === 0 && (
            <tr>
              <td colSpan="7" className="p-4 text-center text-gray-500">No records found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
