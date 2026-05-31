import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import DarkModeToggle from '../components/DarkModeToggle'
import DashboardShell from '../components/DashboardShell'
import axios from 'axios'

const API = 'http://localhost:4000/api'
const fmt = (d) => d ? new Date(d).toLocaleDateString() : '—'
const statusColor = (s) => ({ active:'#10b981', pending:'#f59e0b', rejected:'#ef4444', suspended:'#6b7280' }[s] || '#94a3b8')

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const { isDark } = useTheme()
  const [tab, setTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [data, setData] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [modal, setModal] = useState(null) // { type, item }

  const c = {
    bg: isDark ? '#0a0e1a' : '#f1f5f9',
    sidebar: isDark ? '#0d1117' : '#1e293b',
    card: isDark ? '#161b27' : '#fff',
    border: isDark ? '#1e2d40' : '#e2e8f0',
    text: isDark ? '#f1f5f9' : '#0f172a',
    muted: isDark ? '#64748b' : '#64748b',
    head: isDark ? '#1a2236' : '#f8fafc',
    input: isDark ? '#1e2d40' : '#f8fafc',
  }

  const h = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('lms_token')}` } })
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const TABS = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'pending-staff', label: 'Pending Staff', icon: '⏳' },
    { key: 'all-staff', label: 'All Staff', icon: '🗂️' },
    { key: 'members', label: 'Members', icon: '🎓' },
    { key: 'all-users', label: 'All Users', icon: '👥' },
    { key: 'books', label: 'Books', icon: '📚' },
    { key: 'borrowings', label: 'Borrowings', icon: '📖' },
    { key: 'fines', label: 'Fines', icon: '💰' },
    { key: 'fine-types', label: 'Fine Types', icon: '⚙️' },
    { key: 'damage', label: 'Damage Reports', icon: '🔍' },
    { key: 'profile', label: 'My Profile', icon: '👤' },
  ]

  const fetchStats = useCallback(async () => {
    try { const r = await axios.get(`${API}/admin/dashboard`, h()); setStats(r.data.data) } catch {}
  }, [])

  const fetchTab = useCallback(async (t) => {
    setLoading(true); setSearch('')
    const map = {
      'pending-staff': '/users',
      'all-staff': '/users',
      'members': '/users',
      'all-users': '/admin/all-users',
      'books': '/admin/all-books',
      'borrowings': '/admin/borrowing-records',
      'fines': '/admin/fines',
      'fine-types': '/admin/fine-types',
      'damage': '/admin/damage-reports',
    }
    if (map[t]) {
      try {
        const r = await axios.get(`${API}${map[t]}`, h());
        let results = r.data.data || [];
        // Apply filtering based on tab
        if (t === 'pending-staff') results = results.filter(u => u.RoleName === 'Staff' && u.Status === 'Pending');
        else if (t === 'all-staff') results = results.filter(u => (u.RoleName === 'Staff' || u.RoleName === 'Admin') && u.Status !== 'Pending');
        else if (t === 'members') results = results.filter(u => u.RoleName === 'Member');
        
        setData(results)
      } catch { setData([]) }
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchStats() }, [])
  useEffect(() => { if (tab !== 'overview') fetchTab(tab) }, [tab])

  const act = async (method, url, body, msg) => {
    try {
      await axios({ method, url: `${API}${url}`, data: body, ...h() })
      showToast(msg); fetchStats()
      if (tab !== 'overview') fetchTab(tab)
    } catch (e) { showToast('Error: ' + (e.response?.data?.message || e.message)) }
  }

  const filtered = data.filter(row => {
    const s = search.toLowerCase()
    return !s || Object.values(row).some(v => String(v||'').toLowerCase().includes(s))
  })

  const Badge = ({ v }) => (
    <span style={{ background: statusColor(v)+'22', color: statusColor(v), padding:'2px 10px', borderRadius:20, fontSize:12, fontWeight:700 }}>{v}</span>
  )

  const Th = ({ children }) => <th style={{ padding:'12px 16px', textAlign:'left', fontSize:12, fontWeight:700, color:c.muted, textTransform:'uppercase', letterSpacing:1, background:c.head, whiteSpace:'nowrap' }}>{children}</th>
  const Td = ({ children, style={} }) => <td style={{ padding:'12px 16px', fontSize:13, color:c.text, borderTop:`1px solid ${c.border}`, ...style }}>{children}</td>
  const Btn = ({ onClick, color='#3b82f6', children, size='sm' }) => (
    <button onClick={onClick} style={{ background:color+'22', color, border:`1px solid ${color}44`, padding: size==='sm' ? '4px 10px' : '8px 18px', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:600, marginLeft:4 }}>{children}</button>
  )

  const renderContent = () => {
    if (tab === 'overview') return (
      <div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16, marginBottom:32 }}>
          {[
            { label:'Books', val:stats?.totalBooks, icon:'📚', color:'#3b82f6' },
            { label:'Members', val:stats?.totalMembers, icon:'🎓', color:'#8b5cf6' },
            { label:'Staff', val:stats?.totalStaff, icon:'🗂️', color:'#10b981' },
            { label:'Borrowings', val:stats?.activeBorrowings, icon:'📖', color:'#f59e0b' },
            { label:'Unpaid Fines', val:stats?.unpaidFines, icon:'💰', color:'#ef4444' },
            { label:'Pending Staff', val:stats?.pendingStaff, icon:'⏳', color:'#f97316' },
            { label:'Pending Members', val:stats?.pendingMembers, icon:'👤', color:'#ec4899' },
          ].map(s => (
            <div key={s.label} style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:12, padding:20, cursor:'pointer' }} onClick={() => s.label.includes('Pending') ? setTab(s.label.includes('Staff') ? 'pending-staff' : 'members') : null}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:12, fontWeight:700, color:c.muted, textTransform:'uppercase', letterSpacing:1 }}>{s.label}</span>
                <span style={{ fontSize:20 }}>{s.icon}</span>
              </div>
              <div style={{ fontSize:36, fontWeight:800, color:s.color }}>{s.val ?? '—'}</div>
            </div>
          ))}
        </div>
      </div>
    )

    const cols = {
      'pending-staff': ['Name','Email','Job Title','Phone','Actions'],
      'all-staff': ['Name','Email','Job Title','Status','Joined','Actions'],
      'members': ['Name','Email','Dept','Max Books','Status','Actions'],
      'all-users': ['Name','Email','Role','Status','Actions'],
      'books': ['Title','Category','Authors','Available','Total','Actions'],
      'borrowings': ['Member','Book','Borrowed','Due','Status'],
      'fines': ['Member','Book','Type','Amount','Status','Issued','Actions'],
      'fine-types': ['Name','Base Amount','Description','Actions'],
      'damage': ['Member','Book','Description','Severity','Date'],
    }

    const renderRow = (row, i) => {
      if (tab === 'pending-staff') return (
        <tr key={i}>
          <Td><strong style={{color:c.text}}>{row.FullName}</strong></Td>
          <Td>{row.Email}</Td>
          <Td>{row.JobTitle || '—'}</Td>
          <Td>{row.Phone || '—'}</Td>
          <Td>
            <Btn color='#10b981' onClick={() => act('patch',`/users/${row.UserID}/status`,{status:'Active'},'Staff approved!')}>Approve</Btn>
            <Btn color='#ef4444' onClick={() => { if(window.confirm('Reject?')) act('patch',`/users/${row.UserID}/status`,{status:'Inactive'},'Staff rejected.') }}>Reject</Btn>
          </Td>
        </tr>
      )
      if (tab === 'all-staff') return (
        <tr key={i}>
          <Td><strong style={{color:c.text}}>{row.FullName}</strong></Td>
          <Td>{row.Email}</Td>
          <Td>{row.JobTitle || '—'}</Td>
          <Td><Badge v={row.Status} /></Td>
          <Td>{fmt(row.EmploymentDate)}</Td>
          <Td>
            {row.Status === 'Active' && <Btn color='#f59e0b' onClick={() => act('patch',`/users/${row.UserID}/status`,{status:'Suspended'},'Suspended.')}>Suspend</Btn>}
            {row.Status === 'Suspended' && <Btn color='#10b981' onClick={() => act('patch',`/users/${row.UserID}/status`,{status:'Active'},'Activated.')}>Activate</Btn>}
            <Btn color='#ef4444' onClick={() => { if(window.confirm('Deactivate staff?')) act('patch',`/users/${row.UserID}/status`,{status:'Inactive'},'Deactivated.') }}>Deactivate</Btn>
          </Td>
        </tr>
      )
      if (tab === 'members') return (
        <tr key={i}>
          <Td><strong style={{color:c.text}}>{row.FullName}</strong></Td>
          <Td>{row.Email}</Td>
          <Td>{row.Department || '—'}</Td>
          <Td>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <span>{row.MaxBooksAllowed}</span>
              <Btn color='#3b82f6' onClick={() => setModal({type:'max-books', item:row})}>Edit</Btn>
            </div>
          </Td>
          <Td><Badge v={row.Status} /></Td>
          <Td>
            {row.Status === 'Pending' && <Btn color='#10b981' onClick={() => act('patch',`/users/${row.UserID}/status`,{status:'Active'},'Activated.')}>Approve</Btn>}
            {row.Status === 'Active' && <Btn color='#f59e0b' onClick={() => act('patch',`/users/${row.UserID}/status`,{status:'Suspended'},'Suspended.')}>Suspend</Btn>}
            {row.Status === 'Suspended' && <Btn color='#10b981' onClick={() => act('patch',`/users/${row.UserID}/status`,{status:'Active'},'Activated.')}>Activate</Btn>}
            <Btn color='#ef4444' onClick={() => { if(window.confirm('Deactivate member?')) act('patch',`/users/${row.UserID}/status`,{status:'Inactive'},'Deactivated.') }}>Deactivate</Btn>
          </Td>
        </tr>
      )
      if (tab === 'all-users') {
        const roleColor = { Admin: '#f59e0b', Staff: '#8b5cf6', Member: '#3b82f6' }
        return (
          <tr key={i}>
            <Td><strong style={{color:c.text}}>{row.FullName}</strong></Td>
            <Td>{row.Email}</Td>
            <Td><span style={{background:(roleColor[row.RoleName]||'#64748b')+'22',color:roleColor[row.RoleName]||'#64748b',padding:'2px 10px',borderRadius:20,fontSize:12,fontWeight:700}}>{row.RoleName}</span></Td>
            <Td><Badge v={row.Status} /></Td>
            <Td>
              {row.Status !== 'active' && row.Status !== 'Active' && <Btn color='#10b981' onClick={() => act('patch',`/users/${row.UserID}/status`,{status:'Active'},'User activated.')}>Activate</Btn>}
              {(row.Status === 'active' || row.Status === 'Active') && <Btn color='#f59e0b' onClick={() => act('patch',`/users/${row.UserID}/status`,{status:'Suspended'},'Suspended.')}>Suspend</Btn>}
              <Btn color='#ef4444' onClick={() => { if(window.confirm(`Permanently delete ${row.FullName}? This cannot be undone.`)) act('delete',`/admin/users/${row.UserID}`,{},'User deleted.') }}>Delete</Btn>
            </Td>
          </tr>
        )
      }
      if (tab === 'books') return (
        <tr key={i}>
          <Td><strong style={{color:c.text}}>{row.Title}</strong></Td>
          <Td>{row.CategoryName || '—'}</Td>
          <Td style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{row.Authors || '—'}</Td>
          <Td><span style={{color:'#10b981',fontWeight:700}}>{row.AvailableCopies}</span></Td>
          <Td>{row.TotalCopies}</Td>
          <Td><Btn color='#ef4444' onClick={() => { if(window.confirm('Delete book and all copies?')) act('delete',`/catalog/books/${row.BookID}`,{},'Book deleted.') }}>Delete</Btn></Td>
        </tr>
      )
      if (tab === 'borrowings') return (
        <tr key={i}>
          <Td><strong style={{color:c.text}}>{row.MemberName}</strong></Td>
          <Td style={{maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{row.BookTitle}</Td>
          <Td>{fmt(row.BorrowDate)}</Td>
          <Td>{fmt(row.DueDate)}</Td>
          <Td><Badge v={row.Status} /></Td>
        </tr>
      )
      if (tab === 'fines') return (
        <tr key={i}>
          <Td>{row.FullName}</Td>
          <Td style={{maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{row.BookTitle || '—'}</Td>
          <Td>{row.TypeName || '—'}</Td>
          <Td><strong style={{color:'#ef4444'}}>${row.Amount}</strong></Td>
          <Td><Badge v={row.FineStatus} /></Td>
          <Td>{fmt(row.IssuedDate)}</Td>
          <Td>
            {row.FineStatus === 'Unpaid' && <Btn color='#f59e0b' onClick={() => act('patch',`/admin/fines/${row.FineID}/waive`,{},'Fine waived.')}>Waive</Btn>}
          </Td>
        </tr>
      )
      if (tab === 'fine-types') return (
        <tr key={i}>
          <Td><strong style={{color:c.text}}>{row.TypeName}</strong></Td>
          <Td>${row.BaseAmount}/day</Td>
          <Td>{row.Description || '—'}</Td>
          <Td><Btn color='#ef4444' onClick={() => { if(window.confirm('Delete fine type?')) act('delete',`/admin/fine-types/${row.TypeID}`,{},'Deleted.') }}>Delete</Btn></Td>
        </tr>
      )
      if (tab === 'damage') return (
        <tr key={i}>
          <Td>{row.MemberName || '—'}</Td>
          <Td>{row.BookTitle || '—'}</Td>
          <Td style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{row.Description}</Td>
          <Td><Badge v={row.Severity} /></Td>
          <Td>{fmt(row.AssessmentDate)}</Td>
        </tr>
      )
      return null
    }

    return (
      <div style={{ background:c.card, borderRadius:16, border:`1px solid ${c.border}`, overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:`1px solid ${c.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Filter by name, email, title..." style={{ flex:1, padding:'9px 14px', borderRadius:8, border:`1px solid ${c.border}`, background:c.input, color:c.text, fontSize:14, outline:'none' }} />
          <span style={{ fontSize:13, color:c.muted, whiteSpace:'nowrap' }}>{filtered.length} results</span>
        </div>
        {loading ? (
          <div style={{ padding:60, textAlign:'center', color:c.muted }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:60, textAlign:'center', color:c.muted }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
            No records found.
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>{(cols[tab]||[]).map(h=><Th key={h}>{h}</Th>)}</tr></thead>
              <tbody>{filtered.map((row, i) => renderRow(row, i))}</tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  if (tab === 'profile') return <ProfileTab user={user} act={act} c={c} />

  const tabLabel = TABS.find(t => t.key === tab)?.label || 'Dashboard'
  const navItems = TABS.map(t => ({ ...t, badge: t.key === 'pending-staff' ? (stats?.pendingStaff || 0) : 0 }))

  return (
    <DashboardShell role="admin" navItems={navItems} activeTab={tab} setTab={setTab} user={user} logout={logout} tabLabel={tabLabel}>
      {/* Toast */}
      {toast && <div style={{ position:'fixed', bottom:24, right:24, background:'#1e293b', color:'#fff', padding:'12px 20px', borderRadius:10, zIndex:9999, fontSize:14, boxShadow:'0 4px 24px rgba(0,0,0,0.3)', borderLeft:'3px solid #f59e0b' }}>{toast}</div>}

      {/* Max Books Modal */}
      {modal?.type === 'max-books' && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}>
          <div style={{ background: c.card, backdropFilter:'blur(20px)', borderRadius:20, padding:32, width:380, border:`1px solid ${c.border}`, boxShadow:'0 30px 80px rgba(0,0,0,0.5)' }}>
            <h3 style={{ color:c.text, margin:'0 0 6px', fontSize:20, fontWeight:700 }}>Edit Max Books</h3>
            <p style={{ color:c.muted, fontSize:14, marginBottom:20 }}>{modal.item.FullName}</p>
            <input id="mbooks" type="number" defaultValue={modal.item.MaxBooksAllowed} min={1} style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:`1.5px solid ${c.border}`, background: c.input, color:c.text, fontSize:16, outline:'none', boxSizing:'border-box', marginBottom:20 }} />
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setModal(null)} style={{ flex:1, padding:11, borderRadius:10, border:`1px solid ${c.border}`, background:'transparent', color:c.muted, cursor:'pointer', fontWeight:600 }}>Cancel</button>
              <button onClick={() => { const v = document.getElementById('mbooks').value; act('patch',`/members/${modal.item.MemberID}/maxbooks`,{maxBooks:parseInt(v)},'Max books updated.'); setModal(null) }} style={{ flex:1, padding:11, borderRadius:10, border:'none', background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', color:'#fff', fontWeight:700, cursor:'pointer' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {renderContent()}
    </DashboardShell>
  )
}

function ProfileTab({ user, act, c }) {
  const [pw, setPw] = React.useState({ current: '', new: '', confirm: '' })
  const [loading, setLoading] = React.useState(false)

  const handlePw = async (e) => {
    e.preventDefault()
    if (pw.new !== pw.confirm) return alert("Passwords don't match")
    setLoading(true)
    try {
      const res = await axios.post(`http://localhost:4000/api/auth/change-password`, {
        currentPassword: pw.current,
        newPassword: pw.new
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('lms_token')}` } })
      if (res.data.success) {
        alert("Password updated successfully!")
        setPw({ current: '', new: '', confirm: '' })
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message)
    } finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 32, marginBottom: 24 }}>
        <h3 style={{ color: c.text, margin: '0 0 20px', fontSize: 20 }}>Account Information</h3>
        <div style={{ display: 'grid', gap: 20 }}>
          <div>
            <label style={{ color: c.muted, fontSize: 12, textTransform: 'uppercase' }}>Full Name</label>
            <div style={{ color: c.text, fontSize: 16, fontWeight: 600 }}>{user.FullName}</div>
          </div>
          <div>
            <label style={{ color: c.muted, fontSize: 12, textTransform: 'uppercase' }}>Email Address</label>
            <div style={{ color: c.text, fontSize: 16, fontWeight: 600 }}>{user.Email}</div>
          </div>
          <div>
            <label style={{ color: c.muted, fontSize: 12, textTransform: 'uppercase' }}>Account Role</label>
            <div style={{ color: '#f59e0b', fontSize: 16, fontWeight: 700 }}>{user.RoleName}</div>
          </div>
        </div>
      </div>

      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 32 }}>
        <h3 style={{ color: c.text, margin: '0 0 20px', fontSize: 20 }}>Security Settings</h3>
        <form onSubmit={handlePw} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ color: c.muted, fontSize: 12, display: 'block', marginBottom: 6 }}>Current Password</label>
            <input type="password" required value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${c.border}`, background: c.input, color: c.text }} />
          </div>
          <div>
            <label style={{ color: c.muted, fontSize: 12, display: 'block', marginBottom: 6 }}>New Password</label>
            <input type="password" required value={pw.new} onChange={e => setPw({ ...pw, new: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${c.border}`, background: c.input, color: c.text }} />
          </div>
          <div>
            <label style={{ color: c.muted, fontSize: 12, display: 'block', marginBottom: 6 }}>Confirm New Password</label>
            <input type="password" required value={pw.confirm} onChange={e => setPw({ ...pw, confirm: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${c.border}`, background: c.input, color: c.text }} />
          </div>
          <button type="submit" disabled={loading} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: 14, borderRadius: 8, fontWeight: 700, cursor: 'pointer', marginTop: 10 }}>
            {loading ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
