const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'frontend/src/pages/StaffDashboard.jsx');
let text = fs.readFileSync(file, 'utf8');

const MYBORROW_TAB = `
      {tab === 'myborrow' && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <style>{\`
            @keyframes mbIn { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
            @keyframes mbCardIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
            .mb-card { animation: mbCardIn 0.3s ease both; transition: transform 0.2s, box-shadow 0.2s; }
            .mb-card:hover { transform: translateY(-5px); box-shadow: 0 14px 36px rgba(0,0,0,0.16) !important; }
            .mb-btn { transition: all 0.18s ease; border:none; cursor:pointer; font-weight:700; border-radius:8px; }
            .mb-btn:hover:not(:disabled) { filter:brightness(1.1); transform:translateY(-2px); }
            .mb-btn:disabled { opacity:0.45; cursor:not-allowed; }
          \`}</style>

          <div style={{ display:'flex', alignItems:'flex-start', gap:12, background:'linear-gradient(135deg,rgba(16,185,129,0.1),rgba(5,150,105,0.06))', border:'2px solid rgba(16,185,129,0.3)', borderRadius:14, padding:'14px 18px' }}>
            <span style={{ fontSize:22 }}>&#x2139;&#xFE0F;</span>
            <div>
              <div style={{ fontWeight:800, color:'#065f46', fontSize:14, marginBottom:4 }}>Staff Borrow Policy</div>
              <div style={{ fontSize:13, color:'#047857', lineHeight:1.6 }}>As a staff member you may borrow books for personal use. Add books below, submit a request, then show your code to an <strong>Administrator</strong> at the desk for approval.</div>
            </div>
          </div>

          {myBorrowMsg.text && (
            <div style={{ animation:'mbIn 0.3s ease', padding:'12px 18px', borderRadius:12, fontWeight:700, fontSize:14, background: myBorrowMsg.ok ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)', border:\`1px solid \${myBorrowMsg.ok ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}\`, color: myBorrowMsg.ok ? '#065f46' : '#991b1b', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>{myBorrowMsg.text}</span>
              <button onClick={() => setMyBorrowMsg({ text:'', ok:true })} style={{ background:'none', border:'none', cursor:'pointer', fontWeight:900, color:'inherit', fontSize:16 }}>x</button>
            </div>
          )}

          {myBorrowCart.length > 0 && (
            <div style={{ animation:'mbIn 0.35s ease', background:'linear-gradient(135deg,rgba(16,185,129,0.08),rgba(5,150,105,0.04))', border:'2px solid rgba(16,185,129,0.4)', borderRadius:16, padding:20 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{ fontWeight:800, fontSize:16, color:'#065f46' }}>Borrow Cart ({myBorrowCart.length} book{myBorrowCart.length !== 1 ? 's' : ''})</div>
                <button onClick={submitMyBorrow} disabled={myBorrowLoading} className="mb-btn" style={{ background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', padding:'10px 22px', fontSize:14 }}>
                  {myBorrowLoading ? 'Submitting...' : 'Submit Borrow Request'}
                </button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {myBorrowCart.map(item => (
                  <div key={item.copyId} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,255,255,0.7)', borderRadius:10, padding:'10px 14px', border:'1px solid rgba(16,185,129,0.2)' }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14 }}>{item.title}</div>
                      {item.authors && <div style={{ fontSize:12, color:'#64748b' }}>{item.authors}</div>}
                    </div>
                    <button onClick={() => removeFromMyCart(item.copyId)} style={{ background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'none', borderRadius:7, padding:'5px 10px', fontWeight:700, cursor:'pointer' }}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4, scrollbarWidth:'none' }}>
            {['',...[...new Set(allBooks.map(b => b.CategoryName).filter(Boolean))].sort()].map(cat => (
              <button key={cat || '__all'} onClick={() => setMyBorrowCat(cat)} className="mb-btn" style={{ padding:'6px 16px', borderRadius:20, flexShrink:0, background: myBorrowCat === cat ? '#10b981' : 'rgba(16,185,129,0.1)', color: myBorrowCat === cat ? '#fff' : '#065f46', fontSize:13 }}>
                {cat || 'All Books'}
              </button>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(210px, 1fr))', gap:16 }}>
            {allBooks
              .filter(b => !myBorrowCat || b.CategoryName === myBorrowCat)
              .filter(b => !searchQuery || [b.Title, b.Authors, b.CategoryName, b.ISBN].some(v => String(v||'').toLowerCase().includes(searchQuery.toLowerCase())))
              .map((book, idx) => {
                const available = Number(book.AvailableCopies) > 0;
                const inCart = myBorrowCart.some(i => String(i.bookId) === String(book.BookID));
                return (
                  <div key={book.BookID} className="mb-card" style={{ animationDelay: idx * 0.04 + 's', background: cardBg, border:\`1px solid \${border}\`, borderRadius:14, overflow:'hidden', display:'flex', flexDirection:'column' }}>
                    {book.CoverImage
                      ? <img src={book.CoverImage.startsWith('/') ? \`http://localhost:4000\${book.CoverImage}\` : book.CoverImage} alt={book.Title} style={{ width:'100%', height:130, objectFit:'cover' }} />
                      : <div style={{ width:'100%', height:130, background:'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(5,150,105,0.08))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:42 }}>&#x1F4D7;</div>
                    }
                    <div style={{ padding:12, flex:1, display:'flex', flexDirection:'column', gap:4 }}>
                      <div style={{ fontWeight:800, fontSize:13, color:textPrimary, lineHeight:1.3 }}>{book.Title}</div>
                      {book.Authors && <div style={{ fontSize:11, color:textMuted }}>{book.Authors}</div>}
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:'auto', paddingTop:10 }}>
                        <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background: available ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)', color: available ? '#10b981' : '#ef4444' }}>
                          {available ? book.AvailableCopies + ' avail.' : 'None'}
                        </span>
                        <button onClick={() => addToMyCart(book)} disabled={!available || inCart} className="mb-btn" style={{ marginLeft:'auto', background: inCart ? 'rgba(16,185,129,0.15)' : available ? '#10b981' : 'rgba(150,150,150,0.12)', color: inCart ? '#10b981' : '#fff', padding:'5px 11px', fontSize:12 }}>
                          {inCart ? 'Added' : '+ Borrow'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {myBorrows.length > 0 && (
            <div style={{ background:cardBg, border:\`1px solid \${border}\`, borderRadius:16, overflow:'hidden' }}>
              <div style={{ padding:'14px 20px', borderBottom:\`1px solid \${border}\`, display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontWeight:800, fontSize:16, color:textPrimary }}>My Borrow History</span>
                <span style={{ marginLeft:'auto', fontSize:12, color:textMuted }}>{myBorrows.length} record{myBorrows.length !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead><tr style={{ background:'rgba(0,0,0,0.03)' }}>
                    {['Book','Code','Date','Due','Status',''].map(h => (
                      <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:textMuted, textTransform:'uppercase', letterSpacing:0.5, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {myBorrows.map(b => {
                      const st = b.status || b.Status || '';
                      const isPending = st === 'Pending';
                      const col = isPending ? '#f59e0b' : st === 'Borrowed' ? '#10b981' : st === 'Overdue' ? '#ef4444' : '#64748b';
                      return (
                        <tr key={b.BorrowID || b.borrowId} className="table-row" style={{ borderBottom:\`1px solid \${border}\` }}>
                          <td style={{ padding:'11px 14px', color:textPrimary, fontWeight:600, fontSize:13, maxWidth:180 }}><div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.Title || b.bookTitle || '—'}</div></td>
                          <td style={{ padding:'11px 14px', fontSize:12, color:textMuted, fontFamily:'monospace' }}>{b.RequestCode || b.requestCode || '—'}</td>
                          <td style={{ padding:'11px 14px', fontSize:12, color:textMuted, whiteSpace:'nowrap' }}>{b.BorrowDate || b.borrowDate ? new Date(b.BorrowDate || b.borrowDate).toLocaleDateString() : '—'}</td>
                          <td style={{ padding:'11px 14px', fontSize:12, color: st === 'Overdue' ? '#ef4444' : textMuted, whiteSpace:'nowrap' }}>{b.DueDate || b.dueDate ? new Date(b.DueDate || b.dueDate).toLocaleDateString() : '—'}</td>
                          <td style={{ padding:'11px 14px' }}><span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:col+'18', color:col, border:\`1px solid \${col}40\` }}>{st}</span></td>
                          <td style={{ padding:'11px 14px' }}>
                            {isPending && (
                              <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                                <button onClick={() => retractMyBorrow(b.BorrowID || b.borrowId)} style={{ fontSize:12, padding:'4px 10px', background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.3)', borderRadius:7, fontWeight:700, cursor:'pointer' }}>Retract</button>
                                <div style={{ fontSize:10, color:'#f59e0b' }}>Awaiting Admin</div>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

`;

const FINES_MARKER = `{tab === 'fines' && `;
if (!text.includes(FINES_MARKER)) {
  console.error('ERROR: Could not find fines tab marker!');
  process.exit(1);
}
text = text.replace(FINES_MARKER, MYBORROW_TAB + '      ' + FINES_MARKER);
fs.writeFileSync(file, text, 'utf8');
console.log('✅ myborrow tab content inserted successfully!');
