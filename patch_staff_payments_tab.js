const fs = require('fs');
const path = require('path');

const staffPath = path.join(__dirname, 'frontend', 'src', 'pages', 'StaffDashboard.jsx');
let content = fs.readFileSync(staffPath, 'utf8');

// ── 1. Add 'payments' tab to TABS array ──────────────────────────────────────
// Find the TABS array definition
const oldTabsEnd = `  { key: 'profile',    label: 'My Profile',        icon: '👤' },\n];`;
const newTabsEnd = `  { key: 'profile',    label: 'My Profile',        icon: '👤' },\n  { key: 'payments',   label: 'Payment History',   icon: '🧾' },\n];`;

if (content.includes(oldTabsEnd)) {
  content = content.replace(oldTabsEnd, newTabsEnd);
  console.log('✅ Added payments tab to TABS array');
} else {
  // Try alternative
  const altOld = "  { key: 'profile',    label: 'My Profile',        icon: '👤' },\r\n];";
  const altNew = "  { key: 'profile',    label: 'My Profile',        icon: '👤' },\r\n  { key: 'payments',   label: 'Payment History',   icon: '🧾' },\r\n];";
  if (content.includes(altOld)) {
    content = content.replace(altOld, altNew);
    console.log('✅ Added payments tab to TABS array (CRLF)');
  } else {
    console.error('❌ Could not find TABS array end - searching for profile tab...');
    const idx = content.indexOf("key: 'profile'");
    if (idx !== -1) console.log('Found profile tab at char idx:', idx, '\nContext:', JSON.stringify(content.slice(idx-5, idx+80)));
  }
}

// ── 2. Add PaymentsTab rendering in the JSX return ───────────────────────────
// Find where FinesTab is rendered and add PaymentsTab after it
const oldFinesRender = `      {tab === 'fines' && <FinesTab getHeaders={getHeaders} c={{ cardBg, border, textPrimary, textMuted, inputBg, inputBorder }} />}`;
const newFinesRender = `      {tab === 'fines' && <FinesTab getHeaders={getHeaders} c={{ cardBg, border, textPrimary, textMuted, inputBg, inputBorder }} />}

      {tab === 'payments' && <PaymentsHistoryTab getHeaders={getHeaders} API={API} c={{ cardBg, border, textPrimary, textMuted, inputBg, inputBorder }} />}`;

if (content.includes(oldFinesRender)) {
  content = content.replace(oldFinesRender, newFinesRender);
  console.log('✅ Added PaymentsHistoryTab rendering');
} else {
  const altOld = "      {tab === 'fines' && <FinesTab getHeaders={getHeaders} c={{ cardBg, border, textPrimary, textMuted, inputBg, inputBorder }} />}\r\n";
  const altNew = "      {tab === 'fines' && <FinesTab getHeaders={getHeaders} c={{ cardBg, border, textPrimary, textMuted, inputBg, inputBorder }} />}\r\n\r\n      {tab === 'payments' && <PaymentsHistoryTab getHeaders={getHeaders} API={API} c={{ cardBg, border, textPrimary, textMuted, inputBg, inputBorder }} />}\r\n";
  if (content.includes(altOld)) {
    content = content.replace(altOld, altNew);
    console.log('✅ Added PaymentsHistoryTab rendering (CRLF)');
  } else {
    console.error('❌ Could not find FinesTab render location');
    const idx = content.indexOf("tab === 'fines'");
    if (idx !== -1) console.log('Context:', JSON.stringify(content.slice(idx-5, idx+200)));
  }
}

// ── 3. Add the PaymentsHistoryTab component at the end of the file ──────────
const paymentsTabComponent = `

function PaymentsHistoryTab({ getHeaders, API, c }) {
  const [payments, setPayments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(\`\${API}/staff/payment-history\`, getHeaders());
        setPayments(res.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = payments.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (p.MemberName || '').toLowerCase().includes(q) ||
      (p.StudentID || '').toLowerCase().includes(q) ||
      (p.FineType || '').toLowerCase().includes(q) ||
      (p.PaymentMethod || '').toLowerCase().includes(q) ||
      (p.PaymentReference || '').toLowerCase().includes(q)
    );
  });

  const totalCollected = payments.reduce((sum, p) => sum + Number(p.AmountPaid || 0), 0);
  const cashTotal = payments.filter(p => p.PaymentMethod === 'Cash').reduce((sum, p) => sum + Number(p.AmountPaid || 0), 0);
  const chapaTotal = payments.filter(p => p.PaymentMethod !== 'Cash').reduce((sum, p) => sum + Number(p.AmountPaid || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{\`
        @keyframes payIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .pay-row:hover td { background: rgba(16,185,129,0.04) !important; }
      \`}</style>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
        {[
          { label: 'Total Collected', value: \`ETB \${totalCollected.toFixed(2)}\`, color: '#10b981', icon: '💰' },
          { label: 'Cash Payments', value: \`ETB \${cashTotal.toFixed(2)}\`, color: '#3b82f6', icon: '💵' },
          { label: 'Chapa / Digital', value: \`ETB \${chapaTotal.toFixed(2)}\`, color: '#8b5cf6', icon: '📱' },
          { label: 'Total Transactions', value: payments.length, color: '#f59e0b', icon: '🧾' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{ background: c.cardBg, border: \`1px solid \${c.border}\`, borderRadius: 14, padding: '16px 18px', animation: 'payIn 0.4s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: c.textMuted, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: color, lineHeight: 1 }}>{loading ? '…' : value}</div>
              </div>
              <div style={{ fontSize: 22, opacity: 0.75 }}>{icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div style={{ background: c.cardBg, border: \`1px solid \${c.border}\`, borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 16, opacity: 0.5 }}>🔍</span>
        <input
          type="text"
          placeholder="Search by member name, student ID, fine type, or reference…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: c.textPrimary, fontSize: 14 }}
        />
        {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: c.textMuted, cursor: 'pointer', fontSize: 16, fontWeight: 900 }}>✕</button>}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: c.textMuted, fontSize: 14 }}>⏳ Loading payment history…</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#ef4444', fontWeight: 700 }}>❌ {error}</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: c.textMuted }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🧾</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{search ? 'No results found' : 'No payments recorded yet'}</div>
          <div style={{ fontSize: 13 }}>{search ? 'Try a different search term.' : 'Payments will appear here once processed.'}</div>
        </div>
      ) : (
        <div style={{ background: c.cardBg, border: \`1px solid \${c.border}\`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: \`1px solid \${c.border}\`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: c.textPrimary }}>Payment Records</div>
            <div style={{ fontSize: 12, color: c.textMuted, fontWeight: 600 }}>{filtered.length} of {payments.length} records</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(16,185,129,0.05)' }}>
                  {['Date', 'Member', 'Student ID', 'Fine Type', 'Amount Paid', 'Method', 'Reference', 'Processed By'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.PaymentID || i} className="pay-row" style={{ borderTop: \`1px solid \${c.border}\` }}>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: c.textMuted, whiteSpace: 'nowrap' }}>
                      {p.PaymentDate ? new Date(p.PaymentDate).toLocaleString() : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: c.textPrimary, fontWeight: 700 }}>{p.MemberName || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#3b82f6', fontFamily: 'monospace' }}>{p.StudentID || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: c.textMuted }}>{p.FineType || 'Library Fine'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 900, color: '#10b981', whiteSpace: 'nowrap' }}>
                      ETB {Number(p.AmountPaid || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20,
                        background: p.PaymentMethod === 'Cash' ? 'rgba(59,130,246,0.1)' : 'rgba(139,92,246,0.1)',
                        color: p.PaymentMethod === 'Cash' ? '#3b82f6' : '#8b5cf6',
                        border: \`1px solid \${p.PaymentMethod === 'Cash' ? 'rgba(59,130,246,0.3)' : 'rgba(139,92,246,0.3)'}\`
                      }}>{p.PaymentMethod || 'Unknown'}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: c.textMuted, fontFamily: 'monospace', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.PaymentReference || '—'}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: c.textMuted }}>{p.ProcessedBy || 'Self / System'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
`;

// Add component before the last end of file or after FinesTab function
const endMarker = 'function FinesTab(';
const finesTabIdx = content.lastIndexOf(endMarker);
if (finesTabIdx !== -1) {
  content = content.slice(0, finesTabIdx) + paymentsTabComponent + '\n' + content.slice(finesTabIdx);
  console.log('✅ Inserted PaymentsHistoryTab component before FinesTab');
} else {
  content = content + paymentsTabComponent;
  console.log('✅ Appended PaymentsHistoryTab component at end of file');
}

// ── 4. Add pending request countdown in MemberDashboard borrow row ───────────
// This is done via a separate patch to MemberDashboard.jsx
fs.writeFileSync(staffPath, content, 'utf8');
console.log('✅ StaffDashboard.jsx updated successfully!\n');
