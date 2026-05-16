import React from 'react';
import { BORROW_STATUS_COLORS } from '../../constants/borrowingStatuses';

export default function BorrowStatusBadge({ status }) {
  const colorClass = BORROW_STATUS_COLORS[status] || 'bg-gray-100 text-gray-500';
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
      {status}
    </span>
  );
}
