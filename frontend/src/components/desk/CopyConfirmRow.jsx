import React from 'react';
import BorrowStatusBadge from '../borrowing/BorrowStatusBadge';

export default function CopyConfirmRow({ row, isChecked, onToggle, isDark }) {
  const { bookTitle, copyId, shelfLocation, status, eligibleForConfirmation, pickupDeadline } = row;

  const isExpired = status === 'Pending' && !eligibleForConfirmation;
  const isConfirmed = status === 'Borrowed';

  return (
    <tr className={\`\${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}\`}>
      <td className="p-3 font-bold">{bookTitle}</td>
      <td className="p-3 font-mono text-sm">{copyId}</td>
      <td className="p-3 font-mono text-sm">{shelfLocation || 'Unknown'}</td>
      <td className="p-3"><BorrowStatusBadge status={isExpired ? 'Expired' : status} /></td>
      <td className="p-3">
        {status === 'Pending' && pickupDeadline ? new Date(pickupDeadline).toLocaleString() : '-'}
      </td>
      <td className="p-3 text-center">
        {eligibleForConfirmation ? (
          <label className="flex items-center justify-center cursor-pointer">
            <input 
              type="checkbox" 
              className="w-5 h-5 text-[#d4af37] rounded border-gray-300 focus:ring-[#d4af37]"
              checked={isChecked}
              onChange={() => onToggle(row.borrowId)}
            />
            <span className="ml-2 font-bold text-green-600 hidden md:inline">Confirm</span>
          </label>
        ) : isExpired ? (
          <span className="text-red-500 font-bold text-sm">Expired</span>
        ) : isConfirmed ? (
          <span className="text-gray-400 font-bold text-sm">Confirmed</span>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        )}
      </td>
    </tr>
  );
}
