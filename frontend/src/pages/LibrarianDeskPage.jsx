import React, { useState } from 'react';
import DashboardShell from '../components/DashboardShell';
import { useTheme } from '../context/ThemeContext';
import DeskLookupBar from '../components/desk/DeskLookupBar';
import SessionCard from '../components/desk/SessionCard';
import ReturnConditionSelect from '../components/desk/ReturnConditionSelect';
import { useDeskSession } from '../hooks/useDeskSession';
import { useReturns } from '../hooks/useReturns';

export default function LibrarianDeskPage() {
  const { isDark } = useTheme();
  const [tab, setTab] = useState('pickup'); // 'pickup' or 'return'
  
  const { 
    lookupCode, 
    sessionData, 
    lookupSession, 
    confirmSession, 
    clearSession, 
    isLoading: isLookupLoading, 
    error: lookupError 
  } = useDeskSession();

  const { processReturn, loading: isReturnLoading } = useReturns();

  // Return specific state per row
  const [returnState, setReturnState] = useState({});

  const handleLookup = async (code) => {
    try {
      const data = await lookupSession(code);
      if (tab === 'return') {
        // Initialize return state for borrowed/overdue rows
        const initial = {};
        data.rows.forEach(r => {
          if (['Borrowed', 'Overdue'].includes(r.status)) {
            initial[r.borrowId] = { condition: '', notes: '' };
          }
        });
        setReturnState(initial);
      }
    } catch (e) {
      // Error handled by hook
    }
  };

  const handleConfirmPickup = async (data) => {
    try {
      await confirmSession(lookupCode, data);
      alert('Pickup confirmed successfully!');
    } catch (e) {
      alert('Failed to confirm pickup: ' + e);
    }
  };

  const handleProcessReturn = async (borrowId) => {
    const state = returnState[borrowId];
    if (!state?.condition) {
      alert("Please select a condition.");
      return;
    }

    try {
      const res = await processReturn({
        borrowId,
        conditionOnReturn: state.condition,
        notes: state.notes
      });
      alert(res.message + (res.nextMemberNotified ? ' (Next member in queue notified!)' : ''));
      // Refresh session data
      handleLookup(lookupCode);
    } catch (e) {
      alert('Failed to process return: ' + e);
    }
  };

  const updateReturnState = (borrowId, field, value) => {
    setReturnState(prev => ({
      ...prev,
      [borrowId]: { ...prev[borrowId], [field]: value }
    }));
  };

  const STAFF_NAV_ITEMS = [
    { key: 'overview', label: 'Circulation Overview', icon: '📊', path: '/staff' },
    { key: 'members', label: 'Member Approvals', icon: '👤', path: '/staff' },
    { key: 'browse', label: 'Browse Catalog', icon: '📚', path: '/staff' },
    { key: 'catalog', label: 'Register Book', icon: '➕', path: '/staff' },
    { key: 'metadata', label: 'Manage Metadata', icon: '🏷️', path: '/staff' },
    { key: 'desk', label: 'Librarian Desk', icon: '🖥️', path: '/desk' },
    { key: 'reservations', label: 'Reservations', icon: '📋', path: '/reservations' },
    { key: 'overdue', label: 'Overdue Books', icon: '⚠️', path: '/overdue' },
    { key: 'profile', label: 'My Profile', icon: '👤', path: '/staff' },
  ];

  return (
    <DashboardShell role="staff" navItems={STAFF_NAV_ITEMS} activeTab="desk" tabLabel="Librarian Desk">
      <div className="flex border-b mb-6 dark:border-gray-700">
        <button
          onClick={() => { setTab('pickup'); clearSession(); }}
          className={\`px-6 py-3 font-semibold transition-colors border-b-2 \${
            tab === 'pickup' 
              ? 'border-[#d4af37] text-[#d4af37]' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }\`}
        >
          Process Pickup
        </button>
        <button
          onClick={() => { setTab('return'); clearSession(); }}
          className={\`px-6 py-3 font-semibold transition-colors border-b-2 \${
            tab === 'return' 
              ? 'border-[#d4af37] text-[#d4af37]' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }\`}
        >
          Process Return
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        <DeskLookupBar 
          onLookup={handleLookup} 
          isLoading={isLookupLoading} 
        />

        {lookupError && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-xl border border-red-300">
            {lookupError}
          </div>
        )}

        {sessionData && tab === 'pickup' && (
          <SessionCard 
            sessionData={sessionData} 
            onConfirm={handleConfirmPickup}
            isConfirming={isLookupLoading} // reuse loading state
          />
        )}

        {sessionData && tab === 'return' && (
          <div className={\`rounded-2xl shadow-lg border overflow-hidden \${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}\`}>
            <div className={\`p-6 border-b \${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}\`}>
              <h2 className="text-xl font-bold font-serif">Return Books - Session {sessionData.requestCode}</h2>
              <p className="text-gray-500 text-sm">Member: {sessionData.member.fullName}</p>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {sessionData.rows.filter(r => ['Borrowed', 'Overdue', 'Returned'].includes(r.status)).map(row => {
                const isReturned = row.status === 'Returned';
                const state = returnState[row.borrowId] || { condition: '', notes: '' };

                return (
                  <div key={row.borrowId} className="p-6 flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{row.bookTitle}</h3>
                      <div className="text-sm text-gray-500 font-mono space-x-4">
                        <span>Copy: {row.copyId}</span>
                        <span>Due: {new Date(row.dueDate).toLocaleDateString()}</span>
                        {row.status === 'Overdue' && <span className="text-red-500 font-bold ml-2">OVERDUE</span>}
                        {isReturned && <span className="text-green-500 font-bold ml-2">RETURNED ✓</span>}
                      </div>
                    </div>

                    {!isReturned && (
                      <div className="w-full lg:w-1/2 flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 space-y-2">
                          <ReturnConditionSelect 
                            value={state.condition}
                            onChange={(val) => updateReturnState(row.borrowId, 'condition', val)}
                          />
                          <input 
                            type="text" 
                            placeholder="Optional notes..."
                            value={state.notes}
                            onChange={(e) => updateReturnState(row.borrowId, 'notes', e.target.value)}
                            className={\`w-full p-2 rounded border text-sm \${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-[#d4af37] outline-none\`}
                          />
                        </div>
                        <button 
                          onClick={() => handleProcessReturn(row.borrowId)}
                          disabled={isReturnLoading || !state.condition}
                          className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 disabled:opacity-50 h-fit"
                        >
                          Process
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {sessionData.rows.filter(r => ['Borrowed', 'Overdue', 'Returned'].includes(r.status)).length === 0 && (
                <div className="p-6 text-center text-gray-500">No borrowed books found in this session.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
