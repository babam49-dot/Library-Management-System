import React from 'react';
import { RESERVATION_STATUS_COLORS } from '../../constants/borrowingStatuses';

export default function ReservationStatusBadge({ status }) {
  const colorClass = RESERVATION_STATUS_COLORS[status] || 'bg-gray-100 text-gray-500';
  const isReady = status === 'Ready';
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colorClass} ${isReady ? 'animate-pulse ring-2 ring-green-400' : ''}`}>
      {status}
    </span>
  );
}
