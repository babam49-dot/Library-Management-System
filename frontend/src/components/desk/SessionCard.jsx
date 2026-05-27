import React, { useState, useEffect } from 'react';
import CopyConfirmRow from './CopyConfirmRow';
import { LOAN_PERIOD_OPTIONS, DEFAULT_LOAN_PERIOD } from '../../constants/borrowingStatuses';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function SessionCard({ sessionData, onConfirm, isConfirming }) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { requestCode, member, rows } = sessionData;
  
  const eligibleRows = rows.filter(r => r.eligibleForConfirmation);
  
  const [selectedIds, setSelectedIds] = useState([]);
  const [loanPeriod, setLoanPeriod] = useState(DEFAULT_LOAN_PERIOD);

  useEffect(() => {
    setSelectedIds(eligibleRows.map(r => r.borrowId));
  }, [sessionData]);

  const toggleRow = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    if (selectedIds.length > 0) {
      onConfirm({ borrowIds: selectedIds, loanPeriodDays: loanPeriod });
    }
  };

  // Detect if borrower is Staff (roleId=2) or Admin (roleId=1)
  const borrowerIsStaffOrAdmin = member.roleId === 1 || member.roleId === 2;
  const borrowerRoleLabel = member.roleId === 1 ? 'Administrator' : member.roleId === 2 ? 'Library Staff' : 'Member';
  
  // Current logged-in user's role
  const currentUserIsAdmin = user?.RoleID === 1 || user?.roleId === 1 || user?.role === 'admin';
  
  // Can this desk operator approve?
  const canApprove = !borrowerIsStaffOrAdmin || currentUserIsAdmin;

  return (
    <div className={`rounded-2xl shadow-lg border overflow-hidden mb-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className={`p-6 border-b ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold font-serif mb-1">Session {requestCode}</h2>
            <span className={`inline-block px-3 py-1 text-xs rounded-full font-bold ${
              borrowerIsStaffOrAdmin
                ? 'bg-amber-100 text-amber-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {borrowerIsStaffOrAdmin ? `${borrowerRoleLabel} Borrow` : 'Member Pickup'}
            </span>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">{member.fullName}</p>
            <p className="text-sm text-gray-500 font-mono">{member.studentID}</p>
            <p className="text-sm text-gray-500">{member.email}</p>
          </div>
        </div>

        {/* ── Admin-only warning banner (shown when borrower is Staff/Admin) ── */}
        {borrowerIsStaffOrAdmin && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            background: canApprove
              ? 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.08))'
              : 'linear-gradient(135deg, rgba(251,191,36,0.18), rgba(245,158,11,0.12))',
            border: `2px solid ${canApprove ? 'rgba(16,185,129,0.4)' : 'rgba(251,191,36,0.55)'}`,
            borderRadius: 12, padding: '14px 16px', marginTop: 12
          }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{canApprove ? '✅' : '🔒'}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: canApprove ? '#065f46' : '#b45309', marginBottom: 4 }}>
                {canApprove ? 'Admin Approval — Authorized' : 'Admin Approval Required'}
              </div>
              <div style={{ fontSize: 13, color: canApprove ? '#047857' : '#92400e', lineHeight: 1.5 }}>
                {canApprove
                  ? `You are an Administrator and can authorize this ${borrowerRoleLabel} borrow request.`
                  : `This pickup belongs to a <strong>${borrowerRoleLabel}</strong>. Only an Administrator can confirm borrow pickups for staff accounts. Please ask an Admin to scan this code.`
                }
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className={`${isDark ? 'bg-gray-900 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
            <tr>
              <th className="p-3">Book Title</th>
              <th className="p-3">Copy ID</th>
              <th className="p-3">Shelf</th>
              <th className="p-3">Status</th>
              <th className="p-3">Deadline</th>
              <th className="p-3 text-center">Confirm</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {rows.map(row => (
              <CopyConfirmRow
                key={row.borrowId}
                row={row}
                isChecked={selectedIds.includes(row.borrowId)}
                onToggle={canApprove ? toggleRow : () => {}}
                isDark={isDark}
              />
            ))}
          </tbody>
        </table>
      </div>

      {eligibleRows.length > 0 && (
        <div className={`p-6 border-t flex flex-col md:flex-row gap-4 justify-between items-center ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          {canApprove ? (
            <>
              <div className="flex items-center gap-3">
                <label className="font-bold">Loan Period:</label>
                <select
                  value={loanPeriod}
                  onChange={(e) => setLoanPeriod(Number(e.target.value))}
                  className={`p-2 rounded border focus:outline-none focus:ring-2 focus:ring-[#d4af37] ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}`}
                >
                  {LOAN_PERIOD_OPTIONS.map(days => (
                    <option key={days} value={days}>{days} days</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleConfirm}
                disabled={selectedIds.length === 0 || isConfirming}
                className="w-full md:w-auto px-8 py-3 bg-[#d4af37] text-white rounded-xl font-bold hover:bg-[#b5952f] disabled:opacity-50 transition-colors"
              >
                {isConfirming ? 'Processing...' : `Confirm ${selectedIds.length} Books`}
              </button>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}>
              <span style={{ fontSize: 20 }}>🔒</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#b45309' }}>
                Only Administrators can approve staff borrow requests. Confirm button is locked.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
