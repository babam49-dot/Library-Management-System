import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardShell from '../components/DashboardShell';
import { useTheme } from '../context/ThemeContext';
import DeskLookupBar from '../components/desk/DeskLookupBar';
import { useAuth } from '../context/AuthContext';
import SessionCard from '../components/desk/SessionCard';
import ReturnConditionSelect from '../components/desk/ReturnConditionSelect';
import { useDeskSession } from '../hooks/useDeskSession';
import { useReturns } from '../hooks/useReturns';
import * as borrowApi from '../api/borrowingApi';
import { useStaffNavCounts, getStaffNavItems } from '../hooks/useStaffNavCounts';

function CountdownTimer({ deadline, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const calc = () => {
      const diff = new Date(deadline) - new Date();
      return Math.max(0, Math.floor(diff / 1000));
    };

    setTimeLeft(calc());

    const timer = setInterval(() => {
      const rem = calc();
      setTimeLeft(rem);
      if (rem <= 0) {
        clearInterval(timer);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  if (timeLeft <= 0) {
    return <span style={{ color: '#ef4444', fontWeight: 800 }}>Expired</span>;
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const formatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  return (
    <span style={{ color: timeLeft < 60 ? '#ef4444' : '#f59e0b', fontWeight: 800 }}>
      ⏳ {formatted}
    </span>
  );
}

export default function LibrarianDeskPage() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  const initialTab = location.state?.subTab || 'pickup';
  const [tab, setTab] = useState(initialTab);
  const [pendingSessions, setPendingSessions] = useState([]);
  
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

  const loadPendingSessions = async () => {
    try {
      const res = await borrowApi.getAllSessions();
      const rows = res.data.data || [];
      const pending = rows.filter(r => r.status === 'Pending');
      const grouped = {};
      pending.forEach(r => {
        if (!grouped[r.code]) {
          grouped[r.code] = {
            code: r.code,
            memberName: r.memberName,
            pickupDeadline: r.pickupDeadline,
            roleId: r.roleId,
            books: []
          };
        }
        if (!grouped[r.code].books.includes(r.bookTitle)) {
          grouped[r.code].books.push(r.bookTitle);
        }
      });
      setPendingSessions(Object.values(grouped));
    } catch (e) {
      console.error("Failed to load sessions", e);
    }
  };

  useEffect(() => {
    loadPendingSessions();
    const interval = setInterval(loadPendingSessions, 10000);
    return () => clearInterval(interval);
  }, [tab]);

  const c = {
    bg: isDark ? '#0a0e1a' : '#f1f5f9',
    card: isDark ? '#161b27' : '#fff',
    border: isDark ? '#1e2d40' : '#e2e8f0',
    text: isDark ? '#f1f5f9' : '#0f172a',
    muted: isDark ? '#64748b' : '#64748b',
    input: isDark ? '#1e2d40' : '#f8fafc',
  };

  const handleLookup = async (code) => {
    try {
      const data = await lookupSession(code);
      if (tab === 'return') {
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

  const handleQuickApprove = async (code) => {
    try {
      await borrowApi.confirmCollection(code, {});
      alert(`Session ${code} approved successfully!`);
      loadPendingSessions();
      if (lookupCode === code) {
        handleLookup(code);
      }
    } catch (e) {
      alert('Failed to approve: ' + (e.response?.data?.message || e.message || e));
    }
  };

  const handleConfirmPickup = async (data) => {
    try {
      await confirmSession(lookupCode, data);
      alert('Pickup confirmed successfully!');
      loadPendingSessions();
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
      handleLookup(lookupCode);
      loadPendingSessions();
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

  const { counts } = useStaffNavCounts();
  const STAFF_NAV_ITEMS = getStaffNavItems(counts);

  return (
    <DashboardShell role="staff" navItems={STAFF_NAV_ITEMS} activeTab="desk" tabLabel="Librarian Desk">
      {/* Top Live Notification Banners for Pending Borrow requests */}
      {pendingSessions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {pendingSessions.map(sess => {
            const isExpired = new Date(sess.pickupDeadline) < new Date();
            if (isExpired) return null;
            return (
              <div 
                key={`notif-${sess.code}`}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  background: isDark ? 'rgba(212, 175, 55, 0.15)' : '#fffbeb', 
                  border: '1.5px solid #d4af37', 
                  borderRadius: 12, 
                  padding: '14px 20px',
                  boxShadow: '0 6px 20px rgba(212,175,55,0.08)',
                  animation: 'fadeIn 0.3s ease',
                  flexWrap: 'wrap',
                  gap: 12
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 22, animation: 'float 3s ease-in-out infinite' }}>🔔</span>
                  <div>
                    <strong style={{ color: c.text, fontSize: 15 }}>Pending Approval Request: <span style={{ fontFamily: 'monospace', color: '#d4af37', fontSize: 16 }}>{sess.code}</span></strong>
                    <div style={{ fontSize: 13, color: c.muted, marginTop: 2 }}>
                      Member: <strong>{sess.memberName}</strong> • Books: {sess.books.join(', ')}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 13, background: isDark ? '#1a2236' : '#f1f5f9', padding: '6px 12px', borderRadius: 20, border: `1.5px solid ${c.border}`, marginRight: 8 }}>
                    Expires: <CountdownTimer deadline={sess.pickupDeadline} onExpire={loadPendingSessions} />
                  </div>
                  <button
                    onClick={() => handleLookup(sess.code)}
                    className="interactive-btn"
                    style={{ 
                      background: '#3b82f6', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: 8, 
                      padding: '8px 16px', 
                      fontSize: 13, 
                      fontWeight: 700, 
                      cursor: 'pointer' 
                    }}
                  >
                    View Details
                  </button>
                  {(() => {
                    const isStaffReq = sess.roleId === 1 || sess.roleId === 2;
                    const curUserIsAdmin = user?.RoleID === 1 || user?.roleId === 1 || user?.role === 'admin';
                    const allowedToApprove = !isStaffReq || curUserIsAdmin;
                    return (
                      <button
                        onClick={() => allowedToApprove && handleQuickApprove(sess.code)}
                        className="interactive-btn"
                        disabled={!allowedToApprove}
                        style={{ 
                          background: allowedToApprove ? '#10b981' : '#64748b', 
                          color: '#fff', 
                          border: 'none', 
                          borderRadius: 8, 
                          padding: '8px 16px', 
                          fontSize: 13, 
                          fontWeight: 700, 
                          cursor: allowedToApprove ? 'pointer' : 'not-allowed' 
                        }}
                      >
                        {allowedToApprove ? 'Approve Request' : '🔒 Admin Required'}
                      </button>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display:'flex', borderBottom:`1px solid ${c.border}`, marginBottom: 24 }}>
        <button
          onClick={() => { setTab('pickup'); clearSession(); }}
          style={{ padding:'12px 24px', fontWeight:600, borderBottom:`2px solid ${tab === 'pickup' ? '#d4af37' : 'transparent'}`, color: tab === 'pickup' ? '#d4af37' : c.muted, background:'transparent', borderTop:'none', borderLeft:'none', borderRight:'none', cursor:'pointer', fontSize:15 }}
        >
          Process Pickup
        </button>
        <button
          onClick={() => { setTab('return'); clearSession(); }}
          style={{ padding:'12px 24px', fontWeight:600, borderBottom:`2px solid ${tab === 'return' ? '#d4af37' : 'transparent'}`, color: tab === 'return' ? '#d4af37' : c.muted, background:'transparent', borderTop:'none', borderLeft:'none', borderRight:'none', cursor:'pointer', fontSize:15 }}
        >
          Process Return
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', gap: 24, flexWrap: 'wrap', width: '100%' }}>
        {/* Left Column: Form & Active Session */}
        <div style={{ flex: '2 1 500px', minWidth: 320 }}>
          <div style={{ marginBottom: 24 }}>
            <DeskLookupBar 
              onLookup={handleLookup} 
              isLoading={isLookupLoading} 
            />
          </div>

          {lookupError && (
            <div style={{ marginBottom: 24, padding: 16, background: '#fee2e2', color: '#991b1b', borderRadius: 12, border: '1px solid #fca5a5' }}>
              {lookupError}
            </div>
          )}

          {sessionData && tab === 'pickup' && (
            <SessionCard 
              sessionData={sessionData} 
              onConfirm={handleConfirmPickup}
              isConfirming={isLookupLoading}
            />
          )}

          {sessionData && tab === 'return' && (
            <div style={{ background: c.card, borderRadius: 16, border: `1px solid ${c.border}`, overflow: 'hidden' }}>
              <div style={{ padding: 24, borderBottom: `1px solid ${c.border}`, background: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc' }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: c.text }}>Return Books - Session {sessionData.requestCode}</h2>
                <p style={{ margin: '4px 0 0', color: c.muted, fontSize: 14 }}>Member: {sessionData.member.fullName}</p>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {sessionData.rows.filter(r => ['Borrowed', 'Overdue', 'Returned'].includes(r.status)).map((row, idx, arr) => {
                  const isReturned = row.status === 'Returned';
                  const state = returnState[row.borrowId] || { condition: '', notes: '' };
                  const isLast = idx === arr.length - 1;

                  return (
                    <div key={row.borrowId} style={{ padding: 24, display: 'flex', gap: 24, alignItems: 'center', borderBottom: isLast ? 'none' : `1px solid ${c.border}`, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 250 }}>
                        <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: c.text }}>{row.bookTitle}</h3>
                        <div style={{ fontSize: 13, color: c.muted, display: 'flex', gap: 16 }}>
                          <span>Copy: {row.copyId}</span>
                          <span>Due: {new Date(row.dueDate).toLocaleDateString()}</span>
                          {row.status === 'Overdue' && <span style={{ color: '#ef4444', fontWeight: 700 }}>OVERDUE</span>}
                          {isReturned && <span style={{ color: '#10b981', fontWeight: 700 }}>RETURNED ✓</span>}
                        </div>
                      </div>

                      {!isReturned && (
                        <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 300, alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                            <select 
                              value={state.condition}
                              onChange={(e) => updateReturnState(row.borrowId, 'condition', e.target.value)}
                              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${c.border}`, background: c.input, color: c.text, outline: 'none' }}
                            >
                              <option value="">-- Select Condition --</option>
                              <option value="Good">Good</option>
                              <option value="Minor Damage">Minor Damage</option>
                              <option value="Major Damage">Major Damage</option>
                              <option value="Total Loss">Total Loss</option>
                            </select>
                            <input 
                              type="text" 
                              placeholder="Optional notes..."
                              value={state.notes}
                              onChange={(e) => updateReturnState(row.borrowId, 'notes', e.target.value)}
                              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${c.border}`, background: c.input, color: c.text, outline: 'none' }}
                            />
                          </div>
                          <button 
                            onClick={() => handleProcessReturn(row.borrowId)}
                            disabled={isReturnLoading || !state.condition}
                            className="interactive-btn"
                            style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: !state.condition ? c.muted : '#10b981', color: '#fff', fontWeight: 700, cursor: !state.condition ? 'not-allowed' : 'pointer' }}
                          >
                            Process
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {sessionData.rows.filter(r => ['Borrowed', 'Overdue', 'Returned'].includes(r.status)).length === 0 && (
                  <div style={{ padding: 40, textAlign: 'center', color: c.muted }}>No borrowed books found in this session.</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Pending Sessions Sidebar */}
        <div style={{ flex: '1 1 280px', minWidth: 260 }}>
          <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: c.text, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⏳</span> Pending Requests ({pendingSessions.length})
            </h3>
            {pendingSessions.length === 0 ? (
              <p style={{ margin: 0, color: c.muted, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No pending requests found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pendingSessions.map(sess => (
                  <div 
                    key={sess.code} 
                    onClick={() => handleLookup(sess.code)}
                    style={{ 
                      padding: 14, 
                      borderRadius: 12, 
                      border: `1.5px solid ${c.border}`, 
                      background: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#d4af37';
                      e.currentTarget.style.background = isDark ? 'rgba(212,175,55,0.05)' : 'rgba(212,175,55,0.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = c.border;
                      e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 900, fontFamily: 'monospace', color: '#d4af37' }}>{sess.code}</span>
                      <span style={{ fontSize: 11, background: '#2563eb', color: '#fff', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>Click to Load</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: c.text, marginBottom: 4 }}>{sess.memberName}</div>
                    <div style={{ fontSize: 11, color: c.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 8 }}>
                      {sess.books.join(', ')}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${c.border}`, paddingTop: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 12 }}><CountdownTimer deadline={sess.pickupDeadline} onExpire={loadPendingSessions} /></span>
                      {(() => {
                        const isStaffReq = sess.roleId === 1 || sess.roleId === 2;
                        const curUserIsAdmin = user?.RoleID === 1 || user?.roleId === 1 || user?.role === 'admin';
                        const allowedToApprove = !isStaffReq || curUserIsAdmin;
                        return (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (allowedToApprove) handleQuickApprove(sess.code);
                            }}
                            className="interactive-btn"
                            disabled={!allowedToApprove}
                            style={{
                              background: allowedToApprove ? '#10b981' : '#64748b',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 6,
                              padding: '4px 10px',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: allowedToApprove ? 'pointer' : 'not-allowed'
                            }}
                          >
                            {allowedToApprove ? 'Approve' : '🔒 Admin'}
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

