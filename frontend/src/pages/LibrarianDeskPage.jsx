import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardShell from '../components/DashboardShell';
import { useTheme } from '../context/ThemeContext';
import DeskLookupBar from '../components/desk/DeskLookupBar';
import { useAuth } from '../context/AuthContext';
import SessionCard from '../components/desk/SessionCard';
import { useDeskSession } from '../hooks/useDeskSession';
import { useReturns } from '../hooks/useReturns';
import * as borrowApi from '../api/borrowingApi';
import { useStaffNavCounts, getStaffNavItems } from '../hooks/useStaffNavCounts';

/* ── Countdown timer ── */
function CountdownTimer({ deadline, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    const calc = () => Math.max(0, Math.floor((new Date(deadline) - new Date()) / 1000));
    setTimeLeft(calc());
    const t = setInterval(() => {
      const r = calc();
      setTimeLeft(r);
      if (r <= 0) { clearInterval(t); if (onExpire) onExpire(); }
    }, 1000);
    return () => clearInterval(t);
  }, [deadline]);
  if (timeLeft <= 0) return <span style={{ color: '#ef4444', fontWeight: 800 }}>Expired</span>;
  const m = Math.floor(timeLeft / 60), s = timeLeft % 60;
  return (
    <span style={{ color: timeLeft < 60 ? '#ef4444' : '#f59e0b', fontWeight: 800 }}>
      ⏳ {m}:{s < 10 ? '0' : ''}{s}
    </span>
  );
}

/* ── Inline Notice Banner ── */
function NoticeBanner({ notice, onDismiss }) {
  if (!notice.text) return null;
  const ok = notice.ok !== false;
  return (
    <div style={{
      marginBottom: 20, padding: '13px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14,
      background: ok ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)',
      border: `1px solid ${ok ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
      color: ok ? '#065f46' : '#991b1b',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      animation: 'fadeIn 0.3s ease'
    }}>
      <span>{notice.text}</span>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 900, color: 'inherit', fontSize: 18 }}>✕</button>
    </div>
  );
}

export default function LibrarianDeskPage({ isTab = false }) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  const [tab, setTab] = useState(location.state?.subTab || 'pickup');
  const [pendingSessions, setPendingSessions] = useState([]);
  const [notice, setNotice] = useState({ text: '', ok: true });
  const [approvingCode, setApprovingCode] = useState(null);
  const [returnState, setReturnState] = useState({});

  const { lookupCode, sessionData, lookupSession, confirmSession, clearSession, isLoading: isLookupLoading, error: lookupError } = useDeskSession();
  const { processReturn, loading: isReturnLoading } = useReturns();
  const { counts } = useStaffNavCounts();
  const STAFF_NAV_ITEMS = getStaffNavItems(counts);

  const curUserIsAdmin = user?.RoleID === 1 || user?.roleID === 1 || user?.roleId === 1;

  const showNotice = (text, ok = true) => {
    setNotice({ text, ok });
    setTimeout(() => setNotice({ text: '', ok: true }), 6000);
  };

  const c = {
    bg: isDark ? '#0a0e1a' : '#f1f5f9',
    card: isDark ? '#161b27' : '#fff',
    border: isDark ? '#1e2d40' : '#e2e8f0',
    text: isDark ? '#f1f5f9' : '#0f172a',
    muted: '#64748b',
    input: isDark ? '#1e2d40' : '#f8fafc',
  };

  /* ── Load all pending sessions ── */
  const loadPendingSessions = async () => {
    try {
      const res = await borrowApi.getAllSessions({ status: 'Pending' });
      const rows = res.data.data || [];
      // Group flat rows by request code
      const grouped = {};
      rows.forEach(r => {
        const key = r.code;
        if (!grouped[key]) {
          grouped[key] = {
            code: key,
            memberName: r.memberName,
            pickupDeadline: r.pickupDeadline,
            roleId: r.roleId,
            books: []
          };
        }
        if (r.bookTitle && !grouped[key].books.includes(r.bookTitle)) {
          grouped[key].books.push(r.bookTitle);
        }
      });
      setPendingSessions(Object.values(grouped));
    } catch (e) { console.error('Failed to load sessions', e); }
  };

  useEffect(() => {
    loadPendingSessions();
    const iv = setInterval(loadPendingSessions, 10000);
    return () => clearInterval(iv);
  }, [tab]);

  const handleLookup = async (code) => {
    try {
      const data = await lookupSession(code);
      if (tab === 'return') {
        const init = {};
        data.rows.forEach(r => { if (['Borrowed', 'Overdue'].includes(r.status)) init[r.borrowId] = { condition: '', notes: '' }; });
        setReturnState(init);
      }
    } catch (_) {}
  };

  /* ── Approve (quick) ── */
  const handleQuickApprove = async (code, isStaffReq) => {
    if (isStaffReq && !curUserIsAdmin) {
      showNotice('🔒 Only an Administrator can approve staff borrow requests.', false);
      return;
    }
    setApprovingCode(code);
    try {
      await borrowApi.confirmCollection(code, {});
      showNotice(`✅ Request ${code} approved! Status → Borrowed with 7-day due date.`);
      loadPendingSessions();
      if (lookupCode === code) handleLookup(code);
    } catch (e) {
      showNotice('❌ ' + (e.response?.data?.message || e.message || 'Approval failed'), false);
    } finally { setApprovingCode(null); }
  };

  /* ── Confirm pickup (from session card) ── */
  const handleConfirmPickup = async (data) => {
    try {
      await confirmSession(lookupCode, data);
      showNotice('✅ Pickup confirmed! Due date set 7 days from today.');
      loadPendingSessions();
    } catch (e) {
      showNotice('❌ ' + (e?.response?.data?.message || e?.message || 'Confirm failed'), false);
    }
  };

  /* ── Process return ── */
  const handleProcessReturn = async (borrowId) => {
    const state = returnState[borrowId];
    if (!state?.condition) { showNotice('⚠️ Please select a book condition first.', false); return; }
    try {
      const res = await processReturn({ borrowId, conditionOnReturn: state.condition, notes: state.notes });
      showNotice('✅ Return processed.' + (res.nextMemberNotified ? ' Next queued member notified!' : ''));
      handleLookup(lookupCode);
      loadPendingSessions();
    } catch (e) {
      showNotice('❌ ' + (e?.response?.data?.message || e?.message || 'Return failed'), false);
    }
  };

  const updateReturnState = (borrowId, field, value) =>
    setReturnState(prev => ({ ...prev, [borrowId]: { ...prev[borrowId], [field]: value } }));

  /* ── Styles ── */
  const btnBase = { border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13, padding: '8px 16px', color: '#fff', transition: 'filter 0.15s' };

  const innerContent = (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        .ldesk-card { transition: border-color 0.2s, background 0.2s; }
        .ldesk-card:hover { border-color: #d4af37 !important; }
        .ldesk-btn:hover:not(:disabled) { filter: brightness(1.1); }
        .ldesk-btn:disabled { opacity: 0.5; cursor: not-allowed !important; }
      `}</style>

      {/* ── Inline Notice ── */}
      <NoticeBanner notice={notice} onDismiss={() => setNotice({ text: '', ok: true })} />

      {/* ── Sub-tabs ── */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${c.border}`, marginBottom: 24 }}>
        {[['pickup', 'Process Pickup'], ['return', 'Process Return']].map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); clearSession(); }}
            style={{ padding: '12px 24px', fontWeight: 600, fontSize: 15, cursor: 'pointer', background: 'transparent', border: 'none', borderBottom: `2px solid ${tab === key ? '#d4af37' : 'transparent'}`, color: tab === key ? '#d4af37' : c.muted }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Main two-column layout ── */}
      <div style={{ display: 'flex', flexDirection: 'row', gap: 24, flexWrap: 'wrap', width: '100%' }}>

        {/* Left — Lookup + Session */}
        <div style={{ flex: '2 1 500px', minWidth: 320 }}>
          <div style={{ marginBottom: 22 }}>
            <DeskLookupBar onLookup={handleLookup} isLoading={isLookupLoading} />
          </div>

          {lookupError && (
            <div style={{ marginBottom: 20, padding: 16, background: '#fee2e2', color: '#991b1b', borderRadius: 12, border: '1px solid #fca5a5', fontWeight: 700 }}>
              {lookupError}
            </div>
          )}

          {/* Pickup tab */}
          {sessionData && tab === 'pickup' && (
            <div>
              {/* Admin-only banner for staff requests */}
              {(sessionData.member?.roleId === 1 || sessionData.member?.roleId === 2) && !curUserIsAdmin && (
                <div style={{ marginBottom: 16, padding: '12px 18px', borderRadius: 12, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.4)', color: '#6d28d9', fontWeight: 700, fontSize: 14 }}>
                  🔒 This is a <strong>staff borrow request</strong>. Only an Administrator can approve it.
                </div>
              )}
              <SessionCard sessionData={sessionData} onConfirm={handleConfirmPickup} isConfirming={isLookupLoading} />
            </div>
          )}

          {/* Return tab */}
          {sessionData && tab === 'return' && (
            <div style={{ background: c.card, borderRadius: 16, border: `1px solid ${c.border}`, overflow: 'hidden' }}>
              <div style={{ padding: 24, borderBottom: `1px solid ${c.border}`, background: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc' }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: c.text }}>Return Books — {sessionData.requestCode}</h2>
                <p style={{ margin: '4px 0 0', color: c.muted, fontSize: 14 }}>Member: <strong>{sessionData.member?.fullName}</strong></p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {sessionData.rows.filter(r => ['Borrowed', 'Overdue', 'Returned'].includes(r.status)).map((row, idx, arr) => {
                  const isReturned = row.status === 'Returned';
                  const state = returnState[row.borrowId] || { condition: '', notes: '' };
                  return (
                    <div key={row.borrowId} style={{ padding: 24, display: 'flex', gap: 24, alignItems: 'center', borderBottom: idx < arr.length - 1 ? `1px solid ${c.border}` : 'none', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 250 }}>
                        <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: c.text }}>{row.bookTitle}</h3>
                        <div style={{ fontSize: 13, color: c.muted, display: 'flex', gap: 14 }}>
                          <span>Copy: {row.copyId}</span>
                          {row.dueDate && <span>Due: {new Date(row.dueDate).toLocaleDateString()}</span>}
                          {row.status === 'Overdue' && <span style={{ color: '#ef4444', fontWeight: 700 }}>OVERDUE</span>}
                          {isReturned && <span style={{ color: '#10b981', fontWeight: 700 }}>RETURNED ✓</span>}
                        </div>
                      </div>
                      {!isReturned && (
                        <div style={{ display: 'flex', gap: 10, flex: 1, minWidth: 300, alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                            <select value={state.condition} onChange={e => updateReturnState(row.borrowId, 'condition', e.target.value)}
                              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${c.border}`, background: c.input, color: c.text, outline: 'none' }}>
                              <option value="">-- Select Condition --</option>
                              <option value="Good">Good</option>
                              <option value="Minor Damage">Minor Damage</option>
                              <option value="Major Damage">Major Damage</option>
                              <option value="Total Loss">Total Loss</option>
                            </select>
                            <input type="text" placeholder="Optional notes..." value={state.notes}
                              onChange={e => updateReturnState(row.borrowId, 'notes', e.target.value)}
                              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${c.border}`, background: c.input, color: c.text, outline: 'none' }} />
                          </div>
                          <button onClick={() => handleProcessReturn(row.borrowId)}
                            disabled={isReturnLoading || !state.condition} className="ldesk-btn"
                            style={{ ...btnBase, background: state.condition ? '#10b981' : c.muted, cursor: state.condition ? 'pointer' : 'not-allowed' }}>
                            {isReturnLoading ? '⏳' : 'Process'}
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

        {/* Right — Pending Sidebar */}
        <div style={{ flex: '1 1 280px', minWidth: 260 }}>
          <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: c.text, display: 'flex', alignItems: 'center', gap: 8 }}>
              ⏳ Pending Requests
              <span style={{ background: '#2563eb', color: '#fff', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>
                {pendingSessions.length}
              </span>
            </h3>

            {pendingSessions.length === 0 ? (
              <p style={{ margin: 0, color: c.muted, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No pending requests.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pendingSessions.map(sess => {
                  const isStaffReq = sess.roleId === 1 || sess.roleId === 2;
                  const canApprove = !isStaffReq || curUserIsAdmin;
                  const isExpired = new Date(sess.pickupDeadline) < new Date();
                  return (
                    <div key={sess.code} className="ldesk-card"
                      onClick={() => handleLookup(sess.code)}
                      style={{
                        padding: 14, borderRadius: 12, cursor: 'pointer',
                        border: `1.5px solid ${isStaffReq ? 'rgba(139,92,246,0.4)' : c.border}`,
                        background: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
                        opacity: isExpired ? 0.5 : 1
                      }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 900, fontFamily: 'monospace', color: isStaffReq ? '#8b5cf6' : '#d4af37' }}>{sess.code}</span>
                        {isStaffReq && <span style={{ fontSize: 9, background: '#8b5cf6', color: '#fff', padding: '2px 6px', borderRadius: 20, fontWeight: 800 }}>STAFF</span>}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: c.text, marginBottom: 2 }}>{sess.memberName}</div>
                      <div style={{ fontSize: 11, color: c.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 8 }}>{sess.books.join(', ')}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${c.border}`, paddingTop: 8 }}>
                        <span style={{ fontSize: 12 }}>
                          {isExpired ? <span style={{ color: '#ef4444', fontWeight: 700 }}>Expired</span>
                            : <CountdownTimer deadline={sess.pickupDeadline} onExpire={loadPendingSessions} />}
                        </span>
                        <button
                          onClick={e => { e.stopPropagation(); handleQuickApprove(sess.code, isStaffReq); }}
                          disabled={approvingCode === sess.code || isExpired || !canApprove}
                          className="ldesk-btn"
                          style={{ ...btnBase, padding: '4px 10px', fontSize: 11, background: canApprove && !isExpired ? '#10b981' : '#64748b' }}>
                          {approvingCode === sess.code ? '⏳' : canApprove ? 'Approve' : '🔒 Admin'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  if (isTab) return innerContent;

  return (
    <DashboardShell role="staff" navItems={STAFF_NAV_ITEMS} activeTab="desk" tabLabel="Librarian Desk">
      {innerContent}
    </DashboardShell>
  );
}
