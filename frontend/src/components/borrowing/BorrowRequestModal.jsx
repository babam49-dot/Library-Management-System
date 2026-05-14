import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function BorrowRequestModal({ cart, onClose, onSubmit, loading, error }) {
  const { isDark } = useTheme();
  
  const waitlistItems = cart.filter(c => c.expectedStatus === 'Waitlist');
  const borrowItems = cart.filter(c => c.expectedStatus === 'Borrow');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className={\`w-full max-w-2xl p-6 rounded-2xl shadow-2xl \${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}\`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold font-serif">Confirm Request</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {waitlistItems.length > 0 && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <h3 className="text-orange-800 font-bold mb-2">⚠️ Waitlist Notice</h3>
            <p className="text-sm text-orange-700 mb-2">The following books are currently unavailable and will be added to your waitlist. You will be notified when they are ready for pickup.</p>
            <ul className="list-disc pl-5 text-sm text-orange-700">
              {waitlistItems.map(item => <li key={item.BookID}>{item.Title}</li>)}
            </ul>
          </div>
        )}

        <div className="mb-6">
          <h3 className="font-bold mb-3">Books for Immediate Pickup</h3>
          {borrowItems.length === 0 ? (
            <p className="text-sm text-gray-500">None</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-left text-sm">
                <thead className={\`\${isDark ? 'bg-gray-800' : 'bg-gray-50'}\`}>
                  <tr>
                    <th className="p-3">Title</th>
                    <th className="p-3">Shelf Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {borrowItems.map(item => (
                    <tr key={item.BookID}>
                      <td className="p-3">{item.Title}</td>
                      <td className="p-3">{item.ShelfLocation || 'Unknown'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className={\`flex-1 py-3 rounded-xl font-bold \${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}\`}
          >
            Cancel
          </button>
          <button 
            onClick={onSubmit}
            disabled={loading}
            className="flex-1 py-3 bg-[#d4af37] text-white rounded-xl font-bold hover:bg-[#b5952f] disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Confirm Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
