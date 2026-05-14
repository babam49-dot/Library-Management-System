import React from 'react';
import ReservationStatusBadge from '../borrowing/ReservationStatusBadge';
import { useTheme } from '../../context/ThemeContext';

export default function ReservationTable({ reservations, onCancel, onShowMember }) {
  const { isDark } = useTheme();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className={\`\${isDark ? 'bg-gray-800' : 'bg-gray-50'}\`}>
          <tr>
            <th className="p-3">Res ID</th>
            <th className="p-3">Member Name</th>
            <th className="p-3">Book Title</th>
            <th className="p-3">Copy ID</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-center">Priority</th>
            <th className="p-3">Reserved On</th>
            <th className="p-3">Deadline</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {reservations.map(res => (
            <tr key={res.reservationId} className={\`\${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} \${res.status === 'Ready' ? 'bg-green-50/50 dark:bg-green-900/20' : ''}\`}>
              <td className="p-3 text-gray-500">#{res.reservationId}</td>
              <td className="p-3 font-bold cursor-pointer hover:text-[#d4af37]" onClick={() => onShowMember && onShowMember(res.memberID)}>
                {res.memberName}
              </td>
              <td className="p-3">{res.bookTitle}</td>
              <td className="p-3 font-mono">{res.copyId}</td>
              <td className="p-3"><ReservationStatusBadge status={res.status} /></td>
              <td className="p-3 text-center font-mono">{res.status === 'Queued' ? res.priority : '-'}</td>
              <td className="p-3">{new Date(res.reservationDate).toLocaleDateString()}</td>
              <td className="p-3">{res.pickupDeadline ? new Date(res.pickupDeadline).toLocaleString() : '-'}</td>
              <td className="p-3 flex gap-2">
                {['Queued', 'Ready'].includes(res.status) && (
                  <button 
                    onClick={() => onCancel(res.reservationId)}
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
              <td colSpan="9" className="p-4 text-center text-gray-500">No reservations found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
