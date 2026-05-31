import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

export default function RequestCodeDisplay({ result, onReset }) {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const { requestCode, pickupDeadline, pending = [], queued = [] } = result;

  return (
    <div className={`w-full max-w-3xl mx-auto mt-10 p-8 rounded-2xl shadow-xl text-center ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="text-3xl font-bold font-serif mb-2">Request Submitted!</h2>
      <p className="text-gray-500 mb-8">Please present this code at the library desk to collect your books.</p>

      <div className={`rounded-2xl p-6 mb-8 inline-block shadow-inner ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <span className="text-5xl font-mono font-bold tracking-widest text-[#d4af37]">{requestCode}</span>
      </div>

      {pickupDeadline && (
        <p className="text-lg font-semibold mb-8">
          Collect by: <span className="text-red-500">{new Date(pickupDeadline).toLocaleString()}</span>
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-10">
        {pending.length > 0 && (
          <div className={`p-5 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
            <h3 className="font-bold mb-3 border-b pb-2 dark:border-gray-700">Ready for Pickup</h3>
            <ul className="space-y-2">
              {pending.map(item => (
                <li key={item.copyId} className="text-sm flex justify-between">
                  <span className="truncate pr-2">{item.bookTitle}</span>
                  <span className="font-mono text-gray-500 flex-shrink-0">{item.shelfLocation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {queued.length > 0 && (
          <div className={`p-5 rounded-xl border ${isDark ? 'border-orange-800 bg-orange-900/20' : 'border-orange-200 bg-orange-50'}`}>
            <h3 className="font-bold text-orange-600 mb-3 border-b border-orange-200/30 pb-2">Waitlisted</h3>
            <ul className="space-y-2 text-sm text-orange-600">
              {queued.map(item => (
                <li key={item.copyId} className="flex justify-between">
                  <span className="truncate pr-2">{item.bookTitle}</span>
                  <span className="font-bold flex-shrink-0">Queue #{item.queuePosition}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex gap-4 justify-center">
        <button
          onClick={() => navigate('/my-borrows')}
          className="px-6 py-3 rounded-xl font-bold bg-[#d4af37] text-white hover:bg-[#b5952f] transition-colors"
        >
          View My Borrows
        </button>
        <button
          onClick={onReset}
          className={`px-6 py-3 rounded-xl font-bold transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          Borrow More Books
        </button>
      </div>
    </div>
  );
}
