export const BORROW_STATUS_COLORS = {
  Pending:  'bg-yellow-100 text-yellow-700',
  Borrowed: 'bg-blue-100 text-blue-700',
  Returned: 'bg-green-100 text-green-700',
  Overdue:  'bg-red-100 text-red-700',
  Expired:  'bg-gray-100 text-gray-500',
};

export const RESERVATION_STATUS_COLORS = {
  Queued:    'bg-blue-100 text-blue-700',
  Ready:     'bg-green-100 text-green-700',
  Collected: 'bg-gray-100 text-gray-400',
  Expired:   'bg-gray-100 text-gray-400',
  Cancelled: 'bg-gray-100 text-gray-400',
};

export const CONDITION_OPTIONS = [
  { value: 'Good',       label: 'Good — No damage',          color: 'text-green-600' },
  { value: 'Minor',      label: 'Minor — Small damage',      color: 'text-yellow-600' },
  { value: 'Major',      label: 'Major — Significant damage',color: 'text-orange-600' },
  { value: 'Total Loss', label: 'Total Loss — Unrepairable', color: 'text-red-600' },
];

export const LOAN_PERIOD_OPTIONS = [7, 14, 21, 30];
export const DEFAULT_LOAN_PERIOD = 14;
export const DEFAULT_PICKUP_HOURS = 24;
export const LIBRARY_FINE_THRESHOLD = 100.00;
export const DAILY_FINE_RATE = 5.00;
