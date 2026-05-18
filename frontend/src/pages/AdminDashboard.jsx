import React, { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import DarkModeToggle from '../components/DarkModeToggle'
import DashboardShell from '../components/DashboardShell'
import BookCard from '../components/BookCard'
import axios from 'axios'

const API = 'http://localhost:4000/api'
const fmt = (d) => d ? new Date(d).toLocaleDateString() : '—'
const fmtCurrency = (n) => `$${Number(n||0).toFixed(2)}`
const statusColor = (s) => ({ active:'#10b981', pending:'#f59e0b', rejected:'#ef4444', suspended:'#6b7280', inactive:'#ef4444', Active:'#10b981', Pending:'#f59e0b', Rejected:'#ef4444', Suspended:'#6b7280', Inactive:'#ef4444', Unpaid:'#ef4444', Partial:'#f59e0b', Paid:'#10b981', Waived:'#8b5cf6', Overdue:'#ef4444', Borrowed:'#3b82f6', Returned:'#10b981' }[s] || '#94a3b8')

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [finesSummary, setFinesSummary] = useState(null)
  const [data, setData] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [modal, setModal] = useState(null) // { type, item }
  const [categories, setCategories] = useState([])
  const [publishers, setPublishers] = useState([])
  const [finesFilter, setFinesFilter] = useState('all') // 'all' | 'outstanding'
  const [paymentsModal, setPaymentsModal] = useState(null) // { fineId, payments }
  const [waiveModal, setWaiveModal] = useState(null) // { fineId, fineName }
  const [waiveReason, setWaiveReason] = useState('')
  const [addBookModal, setAddBookModal] = useState(false)
  const [authors, setAuthors] = useState([])
  const [addBookLoading, setAddBookLoading] = useState(false)
  const [issueFineModal, setIssueFineModal] = useState(false)
  const [fineTypes, setFineTypes] = useState([])
  const [members, setMembers] = useState([])
  const [addFineTypeModal, setAddFineTypeModal] = useState(false)

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
    { key: 'create-user', label: 'Create User', icon: '➕' },
    { key: 'pending-staff', label: 'Pending Staff', icon: '⏳' },
    { key: 'pending-members', label: 'Pending Members', icon: '👤' },
    { key: 'all-staff', label: 'All Staff', icon: '🗂️' },
    { key: 'members', label: 'Members', icon: '🎓' },
    { key: 'all-users', label: 'All Users', icon: '👥' },
    { key: 'books', label: 'Books', icon: '📚' },
    { key: 'borrowings', label: 'Borrowings', icon: '📖' },
    { key: 'fines', label: 'Fines', icon: '💰' },
    { key: 'fine-types', label: 'Fine Types', icon: '⚙️' },
    { key: 'damage', label: 'Damage Reports', icon: '🔍' },
    { key: 'reports-payment', label: 'Payment History', icon: '🧾' },
    { key: 'reports-fines', label: 'Fines Report', icon: '📄' },
    { key: 'reports-disposals', label: 'Disposal Log', icon: '🗑️' },
    { key: 'config', label: 'Config & Limits', icon: '🔧' },
    { key: 'profile', label: 'My Profile', icon: '👤' },
  ]

  const fetchStats = useCallback(async () => {
    try { const r = await axios.get(`${API}/admin/dashboard`, h()); setStats(r.data.data) } catch {}
    try { const r = await axios.get(`${API}/admin/fines/summary`, h()); setFinesSummary(r.data.data) } catch {}
  }, [])

  const fetchTab = useCallback(async (t) => {
    setLoading(true); setSearch('')
    const map = {
      'pending-staff': '/users',
      'pending-members': '/users',
      'all-staff': '/users',
      'members': '/users',
      'all-users': '/admin/all-users',
      'books': '/admin/all-books',
      'borrowings': '/admin/borrowing-records',
      'fines': '/admin/fines',
      'fine-types': '/admin/fine-types',
      'damage': '/admin/damage-reports',
      'reports-payment': '/admin/reports/payment-history',
      'reports-fines': '/admin/reports/fines',
      'reports-disposals': '/admin/disposal-log',
    }
    if (map[t]) {
      try {
        const r = await axios.get(`${API}${map[t]}`, h());
        let results = r.data.data || [];
        
        if (t === 'books') {
          const cats = await axios.get(`${API}/catalog/categories`, h());
          const pubs = await axios.get(`${API}/catalog/publishers`, h());
          const auths = await axios.get(`${API}/catalog/authors`, h());
          setCategories(cats.data.data || []);
          setPublishers(pubs.data.data || []);
          setAuthors(auths.data.data || []);
        }

        // Apply filtering based on tab
        if (t === 'pending-staff') results = results.filter(u => u.RoleName === 'Staff' && (u.Status === 'Pending' || u.Status === 'pending'));
        else if (t === 'pending-members') results = results.filter(u => u.RoleName === 'Member' && (u.Status === 'Pending' || u.Status === 'pending'));
        else if (t === 'all-staff') results = results.filter(u => (u.RoleName === 'Staff' || u.RoleName === 'Admin') && u.Status !== 'Pending' && u.Status !== 'pending');
        else if (t === 'members') results = results.filter(u => u.RoleName === 'Member');
        
        setData(results)
      } catch { setData([]) }
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchStats() }, [])
  useEffect(() => { if (tab !== 'overview' && tab !== 'create-user' && tab !== 'profile') fetchTab(tab) }, [tab])

  const act = async (method, url, body, msg) => {
    try {
      await axios({ method, url: `${API}${url}`, data: body, ...h() })
      showToast(msg); fetchStats()
      if (tab !== 'overview' && tab !== 'create-user' && tab !== 'profile') fetchTab(tab)
    } catch (e) { showToast('Error: ' + (e.response?.data?.message || e.message)) }
  }

  const fetchFineTypes = async () => {
    try { const r = await axios.get(`${API}/admin/fine-types`, h()); setFineTypes(r.data.data || []) } catch {}
  }
  const fetchMembers = async () => {
    try { const r = await axios.get(`${API}/admin/all-members`, h()); setMembers(r.data.data || []) } catch {}
  }

  const filtered = data.filter(row => {
    const s = search.toLowerCase()
    const matchesSearch = !s || Object.values(row).some(v => String(v||'').toLowerCase().includes(s))
    if (tab === 'fines' && finesFilter === 'outstanding') {
      return matchesSearch && (row.FineStatus === 'Unpaid' || row.FineStatus === 'Partial')
    }
    return matchesSearch
  })

  const Badge = ({ v }) => (
    <span style={{ background: statusColor(v)+'22', color: statusColor(v), padding:'2px 10px', borderRadius:20, fontSize:12, fontWeight:700, textTransform:'capitalize' }}>{v}</span>
  )

  const Th = ({ children }) => <th style={{ padding:'12px 16px', textAlign:'left', fontSize:12, fontWeight:700, color:c.muted, textTransform:'uppercase', letterSpacing:1, background:c.head, whiteSpace:'nowrap' }}>{children}</th>
  const Td = ({ children, style={} }) => <td style={{ padding:'12px 16px', fontSize:13, color:c.text, borderTop:`1px solid ${c.border}`, ...style }}>{children}</td>
  const Btn = ({ onClick, color='#3b82f6', children, size='sm' }) => (
    <button className="interactive-btn" onClick={onClick} style={{ background:color+'22', color, border:`1px solid ${color}44`, padding: size==='sm' ? '4px 10px' : '8px 18px', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:600, marginLeft:4 }}>{children}</button>
  )

  const openPayments = async (fineId) => {
    try {
      const r = await axios.get(`${API}/admin/fines/${fineId}/payments`, h())
      setPaymentsModal({ fineId, payments: r.data.data || [] })
    } catch { setPaymentsModal({ fineId, payments: [] }) }
  }

  const submitWaive = async () => {
    if (!waiveReason.trim()) { showToast('Please enter a waiver reason'); return }
    await act('patch', `/admin/fines/${waiveModal.fineId}/waive`, { waiverReason: waiveReason }, 'Fine waived successfully!')
    setWaiveModal(null); setWaiveReason('')
  }

  const renderContent = () => {
    if (tab === 'overview') return (
      <div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16, marginBottom:24 }}>
          {[
            { label:'Books', val:stats?.totalBooks, icon:'📚', color:'#3b82f6', navTab:'books' },
            { label:'Members', val:stats?.totalMembers, icon:'🎓', color:'#8b5cf6', navTab:'members' },
            { label:'Staff', val:stats?.totalStaff, icon:'🗂️', color:'#10b981', navTab:'all-staff' },
            { label:'Borrowings', val:stats?.activeBorrowings, icon:'📖', color:'#f59e0b', navTab:'borrowings' },
            { label:'Unpaid Fines', val:stats?.unpaidFines, icon:'💰', color:'#ef4444', navTab:'fines' },
            { label:'Pending Staff', val:stats?.pendingStaff, icon:'⏳', color:'#f97316', navTab:'pending-staff' },
            { label:'Pending Members', val:stats?.pendingMembers, icon:'👤', color:'#ec4899', navTab:'members' },
          ].map(s => (
            <div key={s.label} className="interactive-card" style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:12, padding:20, cursor:'pointer' }} onClick={() => s.navTab && setTab(s.navTab)}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:12, fontWeight:700, color:c.muted, textTransform:'uppercase', letterSpacing:1 }}>{s.label}</span>
                <span style={{ fontSize:20 }}>{s.icon}</span>
              </div>
              <div style={{ fontSize:36, fontWeight:800, color:s.color }}>{s.val ?? '—'}</div>
              {s.navTab && <div style={{ fontSize:11, color:c.muted, marginTop:6, fontWeight:600 }}>Click to manage →</div>}
            </div>
          ))}
        </div>
        {/* Fines Overview Banner */}
        {finesSummary && (
          <div className="interactive-card" style={{ display:'flex', gap:16, background: isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2', border:'1px solid rgba(239,68,68,0.3)', borderRadius:14, padding:'20px 24px', marginBottom:16, cursor:'pointer' }} onClick={() => setTab('fines')}>
            <div style={{ fontSize:32, alignSelf:'center' }}>⚠️</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, color:'#ef4444', fontSize:15, marginBottom:4 }}>Outstanding Fines Alert</div>
              <div style={{ color:c.muted, fontSize:13 }}>{finesSummary.MembersBlocked} members blocked · Total outstanding: <strong style={{color:'#ef4444'}}>${Number(finesSummary.TotalOutstanding||0).toFixed(2)}</strong></div>
            </div>
            <button className="interactive-btn" style={{ background:'#ef4444', color:'#fff', border:'none', padding:'10px 18px', borderRadius:8, fontWeight:600, cursor:'pointer', alignSelf:'center', whiteSpace:'nowrap' }}>View Fines →</button>
          </div>
        )}
        {/* Quick access cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16, marginTop:8 }}>
          {[
            { title:'📚 Book Catalog', desc:'Add, edit, and manage all books in the library system.', btn:'Manage Books', tab:'books', color:'#3b82f6' },
            { title:'👥 User Management', desc:'Register members & staff manually or approve pending registrations.', btn:'Manage Users', tab:'all-users', color:'#8b5cf6' },
            { title:'💰 Fine & Payment Hub', desc:'Track overdue fines, damage charges, and payment history.', btn:'View Fines', tab:'fines', color:'#ef4444' },
            { title:'📊 Borrowing Records', desc:'Track all active and historical borrowing activity.', btn:'View Records', tab:'borrowings', color:'#f59e0b' },
          ].map(item => (
            <div key={item.title} className="interactive-card" onClick={() => setTab(item.tab)} style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:14, padding:24, cursor:'pointer' }}>
              <h3 style={{ margin:'0 0 8px', fontSize:16, fontWeight:800, color:c.text }}>{item.title}</h3>
              <p style={{ margin:'0 0 16px', fontSize:13, color:c.muted, lineHeight:1.5 }}>{item.desc}</p>
              <button style={{ background:`${item.color}22`, color:item.color, border:`1px solid ${item.color}44`, padding:'8px 16px', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:13 }}>{item.btn} →</button>
            </div>
          ))}
        </div>
      </div>
    )

    if (tab === 'create-user') return <CreateUserTab c={c} act={act} />
    if (tab === 'profile') return <ProfileTab user={user} act={act} c={c} />
    if (tab === 'config') return <ConfigTab c={c} act={act} />

    const cols = {
      'pending-staff': ['Name','Email','Job Title','Phone','Actions'],
      'pending-members': ['Name','Email','University ID','Department','Actions'],
      'all-staff': ['Name','Email','Job Title','Status','Joined','Actions'],
      'members': ['Name','Email','Dept','Max Books','Status','Actions'],
      'all-users': ['Name','Email','Role','Status','Actions'],
      'books': ['Title','Category','Authors','Available','Total','Actions'],
      'borrowings': ['Member','Book','Borrowed','Due','Status'],
      'fines': ['Member','Book','Type','Amount','Status','Issued','Waiver Reason','Actions'],
      'fine-types': ['Name','Base Amount','Description','Actions'],
      'damage': ['Member','Book','Description','Severity','Date','Actions'],
      'reports-payment': ['Payment Ref', 'Member', 'Fine Type', 'Amount Paid', 'Method', 'Date', 'Processed By'],
      'reports-fines': ['Member', 'Fine Type', 'Total Fine', 'Paid', 'Status', 'Issued Date'],
      'reports-disposals': ['Book', 'Reason', 'Date Removed', 'Processed By'],
    }

    const renderRow = (row, i) => {
      const isStatus = (st) => String(row.Status).toLowerCase() === String(st).toLowerCase();

      if (tab === 'pending-staff') return (
        <tr key={i} className="table-row">
          <Td><strong style={{color:c.text}}>{row.FullName}</strong></Td>
          <Td>{row.Email}</Td>
          <Td>{row.JobTitle || '—'}</Td>
          <Td>{row.Phone || '—'}</Td>
          <Td>
            <Btn color='#10b981' onClick={() => act('patch',`/admin/users/${row.UserID}/status`,{status:'Active'},'Staff approved!')}>Approve</Btn>
            <Btn color='#ef4444' onClick={() => { if(window.confirm('Reject?')) act('patch',`/admin/users/${row.UserID}/status`,{status:'Rejected'},'Staff rejected.') }}>Reject</Btn>
          </Td>
        </tr>
      )
      if (tab === 'pending-members') return (
        <tr key={i} className="table-row">
          <Td><strong style={{color:c.text}}>{row.FullName}</strong></Td>
          <Td>{row.Email}</Td>
          <Td>{row.StudentID || '—'}</Td>
          <Td>{row.Department || '—'}</Td>
          <Td>
            <Btn color='#10b981' onClick={() => act('patch',`/admin/users/${row.UserID}/status`,{status:'Active'},'Member approved! They can now log in.')}>Approve</Btn>
            <Btn color='#ef4444' onClick={() => { if(window.confirm(`Reject ${row.FullName}'s application?`)) act('patch',`/admin/users/${row.UserID}/status`,{status:'Rejected'},'Member rejected.') }}>Reject</Btn>
          </Td>
        </tr>
      )
      if (tab === 'all-staff') return (
        <tr key={i} className="table-row">
          <Td><strong style={{color:c.text}}>{row.FullName}</strong></Td>
          <Td>{row.Email}</Td>
          <Td>{row.JobTitle || '—'}</Td>
          <Td><Badge v={row.Status} /></Td>
          <Td>{fmt(row.EmploymentDate)}</Td>
          <Td>
            <Btn color='#3b82f6' onClick={() => setModal({type:'edit-user', item:row})}>Edit</Btn>
            {isStatus('Active') && <Btn color='#f59e0b' onClick={() => act('patch',`/admin/users/${row.UserID}/status`,{status:'Suspended'},'Suspended.')}>Suspend</Btn>}
            {(isStatus('Suspended') || isStatus('Inactive')) && <Btn color='#10b981' onClick={() => act('patch',`/admin/users/${row.UserID}/status`,{status:'Active'},'Activated.')}>Activate</Btn>}
            {!isStatus('Inactive') && <Btn color='#ef4444' onClick={() => { if(window.confirm('Deactivate staff?')) act('patch',`/admin/users/${row.UserID}/status`,{status:'Inactive'},'Deactivated.') }}>Deactivate</Btn>}
            <Btn color='#8b5cf6' onClick={() => act('patch',`/admin/users/${row.UserID}/unlock`,{},'Account Unlocked')}>Unlock</Btn>
          </Td>
        </tr>
      )
      if (tab === 'members') return (
        <tr key={i} className="table-row">
          <Td><strong style={{color:c.text}}>{row.FullName}</strong></Td>
          <Td>{row.Email}</Td>
          <Td>{row.Department || '—'}</Td>
          <Td>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <span>{row.MaxBooksAllowed}</span>
            </div>
          </Td>
          <Td><Badge v={row.Status} /></Td>
          <Td>
            <Btn color='#3b82f6' onClick={() => setModal({type:'edit-user', item:row})}>Edit</Btn>
            {isStatus('Pending') && <Btn color='#10b981' onClick={() => act('patch',`/admin/users/${row.UserID}/status`,{status:'Active'},'Activated.')}>Approve</Btn>}
            {isStatus('Active') && <Btn color='#f59e0b' onClick={() => act('patch',`/admin/users/${row.UserID}/status`,{status:'Suspended'},'Suspended.')}>Suspend</Btn>}
            {(isStatus('Suspended') || isStatus('Inactive')) && <Btn color='#10b981' onClick={() => act('patch',`/admin/users/${row.UserID}/status`,{status:'Active'},'Activated.')}>Activate</Btn>}
            {!isStatus('Inactive') && <Btn color='#ef4444' onClick={() => { if(window.confirm('Deactivate member?')) act('patch',`/admin/users/${row.UserID}/status`,{status:'Inactive'},'Deactivated.') }}>Deactivate</Btn>}
            <Btn color='#8b5cf6' onClick={() => act('patch',`/admin/users/${row.UserID}/unlock`,{},'Account Unlocked')}>Unlock</Btn>
          </Td>
        </tr>
      )
      if (tab === 'all-users') {
        const roleColor = { Admin: '#f59e0b', Staff: '#8b5cf6', Member: '#3b82f6' }
        return (
          <tr key={i} className="table-row">
            <Td><strong style={{color:c.text}}>{row.FullName}</strong></Td>
            <Td>{row.Email}</Td>
            <Td><span style={{background:(roleColor[row.RoleName]||'#64748b')+'22',color:roleColor[row.RoleName]||'#64748b',padding:'2px 10px',borderRadius:20,fontSize:12,fontWeight:700}}>{row.RoleName}</span></Td>
            <Td><Badge v={row.Status} /></Td>
            <Td>
              <Btn color='#3b82f6' onClick={() => setModal({type:'edit-user', item:row})}>Edit</Btn>
              {!isStatus('Active') && <Btn color='#10b981' onClick={() => act('patch',`/admin/users/${row.UserID}/status`,{status:'Active'},'User activated.')}>Activate</Btn>}
              {isStatus('Active') && <Btn color='#f59e0b' onClick={() => act('patch',`/admin/users/${row.UserID}/status`,{status:'Suspended'},'Suspended.')}>Suspend</Btn>}
              <Btn color='#8b5cf6' onClick={() => act('patch',`/admin/users/${row.UserID}/unlock`,{},'Account Unlocked')}>Unlock</Btn>
              <Btn color='#ef4444' onClick={() => { if(window.confirm(`Permanently delete ${row.FullName}? This cannot be undone.`)) act('delete',`/admin/users/${row.UserID}`,{},'User deleted.') }}>Delete</Btn>
            </Td>
          </tr>
        )
      }
      if (tab === 'books') {
        // Books are shown as card grid, not table rows
        return null
      }
      if (tab === 'borrowings') return (
        <tr key={i} className="table-row">
          <Td><strong style={{color:c.text}}>{row.MemberName}</strong></Td>
          <Td style={{maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{row.BookTitle}</Td>
          <Td>{fmt(row.BorrowDate)}</Td>
          <Td>{fmt(row.DueDate)}</Td>
          <Td><Badge v={row.Status} /></Td>
        </tr>
      )
      if (tab === 'fines') return (
        <tr key={i} className="table-row">
          <Td><strong style={{color:c.text}}>{row.FullName}</strong></Td>
          <Td style={{maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{row.BookTitle || '—'}</Td>
          <Td><Badge v={row.TypeName} /></Td>
          <Td><strong style={{color: row.FineStatus === 'Paid' ? '#10b981' : '#ef4444'}}>{fmtCurrency(row.Amount)}</strong></Td>
          <Td><Badge v={row.FineStatus} /></Td>
          <Td>{fmt(row.IssuedDate)}</Td>
          <Td>{row.WaiverReason ? <span style={{fontSize:11,color:'#8b5cf6',maxWidth:120,display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={row.WaiverReason}>{row.WaiverReason}</span> : '—'}</Td>
          <Td>
            <Btn color='#3b82f6' onClick={() => openPayments(row.FineID)}>Payments</Btn>
            {(row.FineStatus === 'Unpaid' || row.FineStatus === 'Partial') && <Btn color='#f59e0b' onClick={() => { setWaiveModal({ fineId: row.FineID, fineName: row.BookTitle || 'fine' }); setWaiveReason('') }}>Waive</Btn>}
          </Td>
        </tr>
      )
      if (tab === 'fine-types') return (
        <tr key={i} className="table-row">
          <Td><strong style={{color:c.text}}>{row.TypeName}</strong></Td>
          <Td>${row.BaseAmount}/day</Td>
          <Td>{row.Description || '—'}</Td>
          <Td><Btn color='#ef4444' onClick={() => { if(window.confirm('Delete fine type?')) act('delete',`/admin/fine-types/${row.TypeID}`,{},'Deleted.') }}>Delete</Btn></Td>
        </tr>
      )
      if (tab === 'damage') return (
        <tr key={i} className="table-row">
          <Td>{row.MemberName || '—'}</Td>
          <Td>{row.BookTitle || '—'}</Td>
          <Td style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{row.Description}</Td>
          <Td><Badge v={row.Severity} /></Td>
          <Td>{fmt(row.AssessmentDate)}</Td>
          <Td>
            {row.CopyID && <Btn color='#ef4444' onClick={() => { if(window.confirm('Dispose of this copy permanently?')) act('patch', `/admin/dispose/${row.CopyID}`, { reason: 'Damaged' }, 'Copy disposed.') }}>Dispose</Btn>}
          </Td>
        </tr>
      )
      if (tab === 'reports-payment') return (
        <tr key={i} className="table-row">
          <Td><span style={{color:c.muted, fontSize:11, fontFamily:'monospace'}}>{row.PaymentReference}</span></Td>
          <Td><strong style={{color:c.text}}>{row.MemberName}</strong></Td>
          <Td>{row.FineType || '—'}</Td>
          <Td><strong style={{color:'#10b981'}}>{fmtCurrency(row.AmountPaid)}</strong></Td>
          <Td><Badge v={row.PaymentMethod} /></Td>
          <Td>{fmt(row.PaymentDate)}</Td>
          <Td>{row.ProcessedBy || 'System'}</Td>
        </tr>
      )
      if (tab === 'reports-fines') return (
        <tr key={i} className="table-row">
          <Td><strong style={{color:c.text}}>{row.MemberName}</strong></Td>
          <Td>{row.FineType || '—'}</Td>
          <Td><strong style={{color:'#ef4444'}}>{fmtCurrency(row.Amount)}</strong></Td>
          <Td><strong style={{color:'#10b981'}}>{fmtCurrency(row.AmountPaid)}</strong></Td>
          <Td><Badge v={row.FineStatus} /></Td>
          <Td>{fmt(row.IssuedDate)}</Td>
        </tr>
      )
      if (tab === 'reports-disposals') return (
        <tr key={i} className="table-row">
          <Td><strong style={{color:c.text}}>{row.Title}</strong></Td>
          <Td>{row.Reason}</Td>
          <Td>{fmt(row.DateRemoved)}</Td>
          <Td>{row.StaffName || '—'}</Td>
        </tr>
      )
      return null
    }

    // Books tab uses card grid layout
    if (tab === 'books') return (
      <div>
        <div style={{ padding:'0 0 16px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search books..." style={{ flex:1, minWidth:200, padding:'9px 14px', borderRadius:8, border:`1px solid ${c.border}`, background:c.input, color:c.text, fontSize:14, outline:'none' }} />
          <span style={{ fontSize:13, color:c.muted }}>{filtered.length} books</span>
          <button className="interactive-btn btn-pulse" onClick={() => setAddBookModal(true)} style={{ background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', border:'none', padding:'9px 18px', borderRadius:8, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', fontSize:13 }}>
            ＋ Add Book
          </button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:18 }}>
          {filtered.map((book, i) => (
            <BookCard
              key={book.BookID}
              book={book}
              isDark={isDark}
              showActions="admin"
              onEdit={(b) => setModal({type:'edit-book', item:b})}
              onDelete={(b) => { if(window.confirm('Delete book and all copies?')) act('delete',`/catalog/books/${b.BookID}`,{},'Book deleted.') }}
              index={i}
              detailLink={true}
            />
          ))}
          {!filtered.length && (
            <div style={{ gridColumn:'1/-1', padding:60, textAlign:'center', color:c.muted }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
              No books found. Add one above!
            </div>
          )}
        </div>
      </div>
    )

    return (
      <div style={{ background:c.card, borderRadius:16, border:`1px solid ${c.border}`, overflow:'hidden', flex: 1 }}>
        <div style={{ padding:'16px 20px', borderBottom:`1px solid ${c.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Filter by name, email, title..." style={{ flex:1, minWidth:200, padding:'9px 14px', borderRadius:8, border:`1px solid ${c.border}`, background:c.input, color:c.text, fontSize:14, outline:'none' }} />
          {tab === 'fines' && (
            <div style={{ display:'flex', gap:6, background:c.input, padding:4, borderRadius:8 }}>
              {['all','outstanding'].map(f => (
                <button key={f} onClick={() => setFinesFilter(f)} style={{ padding:'6px 14px', borderRadius:6, border:'none', background: finesFilter===f ? '#ef4444' : 'transparent', color: finesFilter===f ? '#fff' : c.muted, fontWeight:600, fontSize:12, cursor:'pointer', transition:'all 0.2s' }}>
                  {f === 'all' ? 'All Fines' : '🚨 Outstanding'}
                </button>
              ))}
            </div>
          )}
          {tab === 'fines' && (
            <button className="interactive-btn" onClick={() => { fetchFineTypes(); setIssueFineModal(true) }} style={{ background:'rgba(239,68,68,0.12)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.3)', padding:'8px 16px', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:13, whiteSpace:'nowrap' }}>
              ➕ Issue Fine
            </button>
          )}
          {tab === 'fine-types' && (
            <button className="interactive-btn" onClick={() => setAddFineTypeModal(true)} style={{ background:'linear-gradient(135deg,#8b5cf6,#6d28d9)', color:'#fff', border:'none', padding:'9px 18px', borderRadius:8, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', fontSize:13 }}>
              ＋ Add Fine Type
            </button>
          )}
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

  const tabLabel = TABS.find(t => t.key === tab)?.label || 'Dashboard'

  return (
    <DashboardShell role="admin" navItems={[]} activeTab={tab} setTab={setTab} user={user} logout={logout} tabLabel={tabLabel}>
      {/* Toast */}
      {toast && <div style={{ position:'fixed', bottom:24, right:24, background:'#1e293b', color:'#fff', padding:'12px 20px', borderRadius:10, zIndex:9999, fontSize:14, boxShadow:'0 4px 24px rgba(0,0,0,0.3)', borderLeft:'3px solid #f59e0b' }}>{toast}</div>}

      {/* Issue Fine Modal */}
      {issueFineModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:9300, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(6px)', padding:24 }}>
          <div style={{ background:c.card, borderRadius:24, padding:36, width:'100%', maxWidth:520, border:`1px solid ${c.border}`, boxShadow:'0 40px 100px rgba(0,0,0,0.6)', animation:'fadeInScale 0.25s ease' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:46, height:46, borderRadius:12, background:'rgba(239,68,68,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>💰</div>
                <div>
                  <h2 style={{ color:c.text, margin:0, fontSize:20, fontWeight:800 }}>Issue Manual Fine</h2>
                  <p style={{ color:c.muted, margin:0, fontSize:13 }}>Charge a member for lost, damaged, or overdue items</p>
                </div>
              </div>
              <button onClick={() => setIssueFineModal(false)} style={{ background:'transparent', border:'none', color:c.muted, fontSize:22, cursor:'pointer' }}>✕</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const fd = new FormData(e.target)
              try {
                await axios.post(`${API}/admin/fines`, {
                  memberID: fd.get('memberID'), typeID: fd.get('typeID'),
                  amount: fd.get('amount'), reason: fd.get('reason')
                }, h())
                showToast('Fine issued successfully!'); setIssueFineModal(false); fetchTab('fines')
              } catch (err) { showToast('Error: ' + (err.response?.data?.message || err.message)) }
            }}>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:700, color:c.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Member</label>
                  <select name="memberID" required style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:`1px solid ${c.border}`, background:c.input, color:c.text, fontSize:14, outline:'none' }}
                    onClick={fetchMembers}>
                    <option value="">— Select Member —</option>
                    {members.map(m => <option key={m.MemberID} value={m.MemberID}>{m.FullName} ({m.StudentID || 'ID: '+m.MemberID})</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:700, color:c.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Fine Type</label>
                  <select name="typeID" required style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:`1px solid ${c.border}`, background:c.input, color:c.text, fontSize:14, outline:'none' }}>
                    <option value="">— Select Type —</option>
                    {fineTypes.map(ft => <option key={ft.TypeID} value={ft.TypeID}>{ft.TypeName} (ETB {ft.BaseAmount})</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:700, color:c.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Amount (ETB) *</label>
                  <input name="amount" type="number" min="1" required placeholder="e.g. 50" style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:`1px solid ${c.border}`, background:c.input, color:c.text, fontSize:14, outline:'none', boxSizing:'border-box' }} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:700, color:c.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Reason / Note</label>
                  <textarea name="reason" rows={2} placeholder="e.g. Lost book — Algorithm Design 3rd Ed." style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:`1px solid ${c.border}`, background:c.input, color:c.text, fontSize:14, outline:'none', boxSizing:'border-box', resize:'vertical', fontFamily:'inherit' }} />
                </div>
                <div style={{ display:'flex', gap:12, marginTop:4 }}>
                  <button type="button" onClick={() => setIssueFineModal(false)} style={{ flex:1, padding:13, borderRadius:12, border:`1px solid ${c.border}`, background:'transparent', color:c.muted, cursor:'pointer', fontWeight:600 }}>Cancel</button>
                  <button type="submit" className="interactive-btn btn-pulse" style={{ flex:2, padding:13, borderRadius:12, border:'none', background:'linear-gradient(135deg,#ef4444,#dc2626)', color:'#fff', fontWeight:800, cursor:'pointer', fontSize:15 }}>
                    💰 Issue Fine
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Fine Type Modal */}
      {addFineTypeModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:9300, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(6px)', padding:24 }}>
          <div style={{ background:c.card, borderRadius:24, padding:36, width:'100%', maxWidth:460, border:`1px solid ${c.border}`, boxShadow:'0 40px 100px rgba(0,0,0,0.6)', animation:'fadeInScale 0.25s ease' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:46, height:46, borderRadius:12, background:'rgba(139,92,246,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>⚙️</div>
                <div>
                  <h2 style={{ color:c.text, margin:0, fontSize:20, fontWeight:800 }}>Add Fine Type</h2>
                  <p style={{ color:c.muted, margin:0, fontSize:13 }}>Create a new fine category (Overdue, Damage, Lost, etc.)</p>
                </div>
              </div>
              <button onClick={() => setAddFineTypeModal(false)} style={{ background:'transparent', border:'none', color:c.muted, fontSize:22, cursor:'pointer' }}>✕</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const fd = new FormData(e.target)
              try {
                await axios.post(`${API}/admin/fine-types`, { typeName: fd.get('typeName'), baseAmount: fd.get('baseAmount'), description: fd.get('description') }, h())
                showToast('Fine type added!'); setAddFineTypeModal(false); fetchTab('fine-types')
              } catch (err) { showToast('Error: ' + (err.response?.data?.message || err.message)) }
            }}>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:700, color:c.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Type Name *</label>
                  <input name="typeName" required placeholder="e.g. Overdue, Damage, Lost Book" style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:`1px solid ${c.border}`, background:c.input, color:c.text, fontSize:14, outline:'none', boxSizing:'border-box' }} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:700, color:c.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Base Amount (ETB) *</label>
                  <input name="baseAmount" type="number" min="1" required placeholder="e.g. 5 or 150" style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:`1px solid ${c.border}`, background:c.input, color:c.text, fontSize:14, outline:'none', boxSizing:'border-box' }} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:700, color:c.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Description</label>
                  <textarea name="description" rows={2} placeholder="Optional description..." style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:`1px solid ${c.border}`, background:c.input, color:c.text, fontSize:14, outline:'none', boxSizing:'border-box', resize:'vertical', fontFamily:'inherit' }} />
                </div>
                <div style={{ display:'flex', gap:12, marginTop:4 }}>
                  <button type="button" onClick={() => setAddFineTypeModal(false)} style={{ flex:1, padding:13, borderRadius:12, border:`1px solid ${c.border}`, background:'transparent', color:c.muted, cursor:'pointer', fontWeight:600 }}>Cancel</button>
                  <button type="submit" className="interactive-btn btn-pulse" style={{ flex:2, padding:13, borderRadius:12, border:'none', background:'linear-gradient(135deg,#8b5cf6,#6d28d9)', color:'#fff', fontWeight:800, cursor:'pointer', fontSize:15 }}>
                    ⚙️ Create Fine Type
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Book Modal */}
      {addBookModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:9200, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(6px)', padding:24 }}>
          <div style={{ background:c.card, borderRadius:24, padding:36, width:'100%', maxWidth:680, maxHeight:'90vh', overflowY:'auto', border:`1px solid ${c.border}`, boxShadow:'0 40px 100px rgba(0,0,0,0.6)', animation:'fadeInScale 0.25s ease' }}>
            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:50, height:50, borderRadius:14, background:'linear-gradient(135deg,#10b981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, boxShadow:'0 4px 16px rgba(16,185,129,0.4)' }}>📚</div>
                <div>
                  <h2 style={{ color:c.text, margin:0, fontSize:22, fontWeight:800 }}>Add New Book</h2>
                  <p style={{ color:c.muted, margin:0, fontSize:13 }}>Register a new book and its physical copies</p>
                </div>
              </div>
              <button onClick={() => setAddBookModal(false)} style={{ background:'transparent', border:'none', color:c.muted, fontSize:24, cursor:'pointer', lineHeight:1 }}>✕</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setAddBookLoading(true);
              const fd = new FormData(e.target);
              const authorIds = Array.from(e.target.querySelectorAll('input[name="authorId"]:checked')).map(el => parseInt(el.value));
              const payload = {
                title: fd.get('title'), isbn: fd.get('isbn'), year: fd.get('year'),
                edition: fd.get('edition'), language: fd.get('language'), description: fd.get('description'),
                publisherId: fd.get('publisherId'), categoryId: fd.get('categoryId'),
                authorIds, numberOfCopies: parseInt(fd.get('numberOfCopies') || 1),
                shelfLocation: fd.get('shelfLocation')
              };
              try {
                await axios.post(`${API}/catalog/books`, payload, h());
                showToast('Book registered successfully!');
                setAddBookModal(false);
                fetchTab('books');
              } catch (err) {
                showToast('Error: ' + (err.response?.data?.message || err.message));
              } finally { setAddBookLoading(false); }
            }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                {/* Title */}
                <div style={{ gridColumn:'span 2' }}>
                  <label style={{ display:'block', fontSize:12, fontWeight:700, color:c.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Book Title *</label>
                  <input name="title" required placeholder="e.g. Introduction to Algorithms" style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:`1px solid ${c.border}`, background:c.input, color:c.text, fontSize:14, outline:'none', boxSizing:'border-box' }} />
                </div>
                {/* ISBN */}
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:700, color:c.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>ISBN *</label>
                  <input name="isbn" required placeholder="978-3-16-148410-0" style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:`1px solid ${c.border}`, background:c.input, color:c.text, fontSize:14, outline:'none', boxSizing:'border-box' }} />
                </div>
                {/* Year */}
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:700, color:c.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Publication Year</label>
                  <input name="year" type="number" placeholder="2024" min="1000" max="2099" style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:`1px solid ${c.border}`, background:c.input, color:c.text, fontSize:14, outline:'none', boxSizing:'border-box' }} />
                </div>
                {/* Edition */}
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:700, color:c.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Edition</label>
                  <input name="edition" placeholder="3rd" style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:`1px solid ${c.border}`, background:c.input, color:c.text, fontSize:14, outline:'none', boxSizing:'border-box' }} />
                </div>
                {/* Language */}
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:700, color:c.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Language</label>
                  <input name="language" defaultValue="English" style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:`1px solid ${c.border}`, background:c.input, color:c.text, fontSize:14, outline:'none', boxSizing:'border-box' }} />
                </div>
                {/* Category */}
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:700, color:c.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Category *</label>
                  <select name="categoryId" required style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:`1px solid ${c.border}`, background:c.input, color:c.text, fontSize:14, outline:'none', boxSizing:'border-box' }}>
                    <option value="">— Select Category —</option>
                    {categories.map(cat => <option key={cat.CategoryID} value={cat.CategoryID}>{cat.CategoryName}</option>)}
                  </select>
                </div>
                {/* Publisher */}
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:700, color:c.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Publisher</label>
                  <select name="publisherId" style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:`1px solid ${c.border}`, background:c.input, color:c.text, fontSize:14, outline:'none', boxSizing:'border-box' }}>
                    <option value="">— Select Publisher —</option>
                    {publishers.map(p => <option key={p.PublisherID} value={p.PublisherID}>{p.PublisherName}</option>)}
                  </select>
                </div>
                {/* Copies */}
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:700, color:c.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Number of Copies</label>
                  <input name="numberOfCopies" type="number" min="1" defaultValue="1" style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:`1px solid ${c.border}`, background:c.input, color:c.text, fontSize:14, outline:'none', boxSizing:'border-box' }} />
                </div>
                {/* Shelf Location */}
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:700, color:c.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Shelf Location</label>
                  <input name="shelfLocation" placeholder="e.g. A2-03" style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:`1px solid ${c.border}`, background:c.input, color:c.text, fontSize:14, outline:'none', boxSizing:'border-box' }} />
                </div>
                {/* Description */}
                <div style={{ gridColumn:'span 2' }}>
                  <label style={{ display:'block', fontSize:12, fontWeight:700, color:c.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Description</label>
                  <textarea name="description" rows={3} placeholder="Brief description of the book..." style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:`1px solid ${c.border}`, background:c.input, color:c.text, fontSize:14, outline:'none', boxSizing:'border-box', resize:'vertical', fontFamily:'inherit' }} />
                </div>
                {/* Authors Checkboxes */}
                <div style={{ gridColumn:'span 2' }}>
                  <label style={{ display:'block', fontSize:12, fontWeight:700, color:c.muted, marginBottom:10, textTransform:'uppercase', letterSpacing:0.5 }}>Authors</label>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:8, maxHeight:150, overflowY:'auto', padding:12, borderRadius:10, border:`1px solid ${c.border}`, background: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc' }}>
                    {authors.length === 0 ? <span style={{color:c.muted, fontSize:13}}>No authors found</span> : authors.map(a => (
                      <label key={a.AuthorID} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:c.text, cursor:'pointer', padding:'4px 6px', borderRadius:6, transition:'background 0.2s' }}>
                        <input type="checkbox" name="authorId" value={a.AuthorID} style={{ accentColor:'#10b981' }} />
                        {a.Name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              {/* Buttons */}
              <div style={{ display:'flex', gap:12, marginTop:8 }}>
                <button type="button" onClick={() => setAddBookModal(false)} style={{ flex:1, padding:13, borderRadius:12, border:`1px solid ${c.border}`, background:'transparent', color:c.muted, cursor:'pointer', fontWeight:600, fontSize:14 }}>Cancel</button>
                <button type="submit" disabled={addBookLoading} className="interactive-btn btn-pulse" style={{ flex:2, padding:13, borderRadius:12, border:'none', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', fontWeight:800, cursor: addBookLoading ? 'not-allowed' : 'pointer', fontSize:15, boxShadow:'0 4px 20px rgba(16,185,129,0.35)' }}>
                  {addBookLoading ? 'Registering...' : '📚 Register Book & Copies'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {modal?.type === 'edit-user' && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}>
          <div style={{ background: c.card, backdropFilter:'blur(20px)', borderRadius:20, padding:32, width:400, border:`1px solid ${c.border}`, boxShadow:'0 30px 80px rgba(0,0,0,0.5)' }}>
            <h3 style={{ color:c.text, margin:'0 0 16px', fontSize:20, fontWeight:700 }}>Edit User Profile</h3>
            <form onSubmit={e => {
              e.preventDefault();
              const fd = new FormData(e.target);
              const payload = { fullName: fd.get('fullName'), phone: fd.get('phone') };
              if (modal.item.RoleName === 'Member' || modal.item.Department !== undefined) {
                payload.department = fd.get('department');
                payload.maxBooksAllowed = parseInt(fd.get('maxBooks') || 5);
              }
              act('put', `/admin/users/${modal.item.UserID}`, payload, 'Profile updated.');
              setModal(null);
            }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize:12, color:c.muted, display:'block', marginBottom:4 }}>Full Name</label>
                <input name="fullName" defaultValue={modal.item.FullName} required style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:`1px solid ${c.border}`, background:c.input, color:c.text, boxSizing:'border-box' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize:12, color:c.muted, display:'block', marginBottom:4 }}>Phone</label>
                <input name="phone" defaultValue={modal.item.Phone} style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:`1px solid ${c.border}`, background:c.input, color:c.text, boxSizing:'border-box' }} />
              </div>
              {(modal.item.RoleName === 'Member' || modal.item.Department !== undefined) && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize:12, color:c.muted, display:'block', marginBottom:4 }}>Department</label>
                    <input name="department" defaultValue={modal.item.Department} style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:`1px solid ${c.border}`, background:c.input, color:c.text, boxSizing:'border-box' }} />
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize:12, color:c.muted, display:'block', marginBottom:4 }}>Max Books Allowed</label>
                    <input name="maxBooks" type="number" min={1} defaultValue={modal.item.MaxBooksAllowed || 5} style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:`1px solid ${c.border}`, background:c.input, color:c.text, boxSizing:'border-box' }} />
                  </div>
                </>
              )}
              <div style={{ display:'flex', gap:10, marginTop: 24 }}>
                <button type="button" onClick={() => setModal(null)} style={{ flex:1, padding:11, borderRadius:10, border:`1px solid ${c.border}`, background:'transparent', color:c.muted, cursor:'pointer', fontWeight:600 }}>Cancel</button>
                <button type="submit" style={{ flex:1, padding:11, borderRadius:10, border:'none', background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', color:'#fff', fontWeight:700, cursor:'pointer' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Book Modal */}
      {modal?.type === 'edit-book' && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}>
          <div style={{ background: c.card, borderRadius: 20, padding: 32, width: 600, border:`1px solid ${c.border}`, boxShadow:'0 30px 80px rgba(0,0,0,0.5)', color: c.text }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700 }}>Edit Book</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              const payload = Object.fromEntries(fd.entries());
              act('put', `/catalog/books/${modal.item.BookID}`, payload, 'Book updated successfully.');
              setModal(null);
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize:12, color:c.muted, display:'block', marginBottom:4 }}>Title</label>
                  <input name="Title" defaultValue={modal.item.Title} required style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:`1px solid ${c.border}`, background:c.input, color:c.text, boxSizing:'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize:12, color:c.muted, display:'block', marginBottom:4 }}>ISBN</label>
                  <input name="ISBN" defaultValue={modal.item.ISBN} style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:`1px solid ${c.border}`, background:c.input, color:c.text, boxSizing:'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize:12, color:c.muted, display:'block', marginBottom:4 }}>Year</label>
                  <input name="PublishYear" type="number" defaultValue={modal.item.PublishYear} style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:`1px solid ${c.border}`, background:c.input, color:c.text, boxSizing:'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize:12, color:c.muted, display:'block', marginBottom:4 }}>Category</label>
                  <select name="CategoryID" defaultValue={modal.item.CategoryID} style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:`1px solid ${c.border}`, background:c.input, color:c.text, boxSizing:'border-box' }}>
                    {categories.map(cat => <option key={cat.CategoryID} value={cat.CategoryID}>{cat.CategoryName}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:12, color:c.muted, display:'block', marginBottom:4 }}>Publisher</label>
                  <select name="PublisherID" defaultValue={modal.item.PublisherID} style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:`1px solid ${c.border}`, background:c.input, color:c.text, boxSizing:'border-box' }}>
                    {publishers.map(p => <option key={p.PublisherID} value={p.PublisherID}>{p.PublisherName}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:12, color:c.muted, display:'block', marginBottom:4 }}>Edition</label>
                  <input name="Edition" defaultValue={modal.item.Edition} style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:`1px solid ${c.border}`, background:c.input, color:c.text, boxSizing:'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize:12, color:c.muted, display:'block', marginBottom:4 }}>Language</label>
                  <input name="Language" defaultValue={modal.item.Language} style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:`1px solid ${c.border}`, background:c.input, color:c.text, boxSizing:'border-box' }} />
                </div>
              </div>

              <div style={{ display:'flex', gap:10, marginTop: 24 }}>
                <button type="button" onClick={() => setModal(null)} style={{ flex:1, padding:11, borderRadius:10, border:`1px solid ${c.border}`, background:'transparent', color:c.muted, cursor:'pointer', fontWeight:600 }}>Cancel</button>
                <button type="submit" style={{ flex:1, padding:11, borderRadius:10, border:'none', background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', color:'#fff', fontWeight:700, cursor:'pointer' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Waive Fine Modal */}
      {waiveModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:9100, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}>
          <div style={{ background:c.card, borderRadius:20, padding:32, width:420, border:`1px solid ${c.border}`, boxShadow:'0 30px 80px rgba(0,0,0,0.5)', animation:'fadeInScale 0.2s ease' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:'rgba(245,158,11,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>⚖️</div>
              <div>
                <h3 style={{ color:c.text, margin:0, fontSize:18, fontWeight:700 }}>Waive Fine</h3>
                <p style={{ color:c.muted, margin:0, fontSize:13 }}>Admin override — audit log required (BR-12)</p>
              </div>
            </div>
            <div style={{ background: isDark ? 'rgba(245,158,11,0.08)' : '#fffbeb', border:'1px solid rgba(245,158,11,0.3)', borderRadius:10, padding:'12px 16px', marginBottom:20 }}>
              <p style={{ margin:0, fontSize:13, color:'#92400e' }}>⚠️ This action is <strong>permanent and audited</strong>. The waiver reason will be saved against your Admin ID.</p>
            </div>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:c.muted, marginBottom:8 }}>Waiver Reason <span style={{color:'#ef4444'}}>*</span></label>
            <textarea
              value={waiveReason}
              onChange={e => setWaiveReason(e.target.value)}
              placeholder="e.g. Medical emergency — approved by Dean of Studies"
              rows={4}
              style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:`1px solid ${c.border}`, background:c.input, color:c.text, fontSize:14, resize:'vertical', outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}
            />
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button onClick={() => { setWaiveModal(null); setWaiveReason('') }} style={{ flex:1, padding:12, borderRadius:10, border:`1px solid ${c.border}`, background:'transparent', color:c.muted, cursor:'pointer', fontWeight:600 }}>Cancel</button>
              <button onClick={submitWaive} className="interactive-btn btn-pulse" style={{ flex:1, padding:12, borderRadius:10, border:'none', background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#fff', fontWeight:700, cursor:'pointer' }}>✓ Confirm Waiver</button>
            </div>
          </div>
        </div>
      )}

      {/* Payments History Modal */}
      {paymentsModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:9100, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}>
          <div style={{ background:c.card, borderRadius:20, padding:32, width:520, maxHeight:'80vh', overflow:'hidden', display:'flex', flexDirection:'column', border:`1px solid ${c.border}`, boxShadow:'0 30px 80px rgba(0,0,0,0.5)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:'rgba(59,130,246,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>🧾</div>
                <div>
                  <h3 style={{ color:c.text, margin:0, fontSize:18, fontWeight:700 }}>Payment History</h3>
                  <p style={{ color:c.muted, margin:0, fontSize:13 }}>Fine ID #{paymentsModal.fineId}</p>
                </div>
              </div>
              <button onClick={() => setPaymentsModal(null)} style={{ background:'transparent', border:'none', color:c.muted, fontSize:22, cursor:'pointer', padding:4, lineHeight:1 }}>✕</button>
            </div>
            <div style={{ overflowY:'auto', flex:1 }}>
              {paymentsModal.payments.length === 0 ? (
                <div style={{ textAlign:'center', padding:40, color:c.muted }}>
                  <div style={{ fontSize:36, marginBottom:12 }} className="floating">💳</div>
                  <p>No payments recorded for this fine.</p>
                </div>
              ) : (
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc' }}>
                      {['Date','Amount Paid','Method','Transaction Ref','Received By'].map(h => (
                        <th key={h} style={{ padding:'10px 12px', textAlign:'left', color:c.muted, fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paymentsModal.payments.map((p,i) => (
                      <tr key={i} className="table-row">
                        <td style={{ padding:'10px 12px', color:c.text, borderTop:`1px solid ${c.border}` }}>{fmt(p.PaymentDate)}</td>
                        <td style={{ padding:'10px 12px', borderTop:`1px solid ${c.border}` }}><strong style={{color:'#10b981'}}>{fmtCurrency(p.AmountPaid)}</strong></td>
                        <td style={{ padding:'10px 12px', borderTop:`1px solid ${c.border}` }}>
                          <span style={{ background: p.PaymentMethod==='Cash' ? 'rgba(16,185,129,0.15)' : p.PaymentMethod==='Card' ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)', color: p.PaymentMethod==='Cash' ? '#10b981' : p.PaymentMethod==='Card' ? '#3b82f6' : '#8b5cf6', padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:700 }}>{p.PaymentMethod || '—'}</span>
                        </td>
                        <td style={{ padding:'10px 12px', color:c.muted, borderTop:`1px solid ${c.border}`, fontSize:11 }}>{p.TransactionRef || '—'}</td>
                        <td style={{ padding:'10px 12px', color:c.text, borderTop:`1px solid ${c.border}` }}>{p.ReceivedBy || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div style={{ paddingTop:16, borderTop:`1px solid ${c.border}`, marginTop:12 }}>
              <button onClick={() => setPaymentsModal(null)} className="interactive-btn" style={{ width:'100%', padding:12, borderRadius:10, border:`1px solid ${c.border}`, background:'transparent', color:c.muted, cursor:'pointer', fontWeight:600 }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout: Vertical Sidebar + Content Area */}

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Vertical Sidebar Navigation */}
        <div style={{ width: 260, background: c.card, borderRadius: 16, border: `1px solid ${c.border}`, padding: 16, display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, position: 'sticky', top: 90 }}>
          <h3 style={{ fontSize: 12, color: c.muted, textTransform: 'uppercase', letterSpacing: 1, margin: '8px 8px 16px', fontWeight: 700 }}>Management Menu</h3>
          {TABS.map(t => (
            <button 
              key={t.key} 
              onClick={() => setTab(t.key)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10,
                background: tab === t.key ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                color: tab === t.key ? '#3b82f6' : c.text,
                border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: tab === t.key ? 700 : 500,
                transition: 'all 0.2s', textAlign: 'left'
              }}>
              <span style={{ fontSize: 18 }}>{t.icon}</span>
              {t.label}
              {t.key === 'pending-staff' && stats?.pendingStaff > 0 && (
                <span style={{ marginLeft:'auto', background:'#f59e0b', color:'#fff', fontSize:11, padding:'2px 8px', borderRadius:20, fontWeight:700 }}>{stats.pendingStaff}</span>
              )}
              {t.key === 'pending-members' && stats?.pendingMembers > 0 && (
                <span style={{ marginLeft:'auto', background:'#ec4899', color:'#fff', fontSize:11, padding:'2px 8px', borderRadius:20, fontWeight:700 }}>{stats.pendingMembers}</span>
              )}
            </button>
          ))}
        </div>
        
        {/* Active Tab Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {renderContent()}
        </div>
      </div>
    </DashboardShell>
  )
}

function CreateUserTab({ c, act }) {
  const [type, setType] = useState('Member');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    
    if (type === 'Member') {
      await act('post', '/admin/users/member', data, 'Member account created successfully!');
    } else {
      await act('post', '/admin/users/staff', data, 'Staff account created successfully!');
    }
    e.target.reset();
    setLoading(false);
  }

  const Input = ({ label, name, type="text", required=false, icon, ...props }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display:'block', fontSize:12, color:c.muted, marginBottom:6, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>{label} {required&&'*'}</label>
      <div style={{ position:'relative' }}>
        {icon && <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:16, color:c.muted }}>{icon}</span>}
        <input 
          name={name} type={type} required={required} 
          style={{ width:'100%', padding:`12px 16px 12px ${icon ? '42px' : '16px'}`, borderRadius:10, border:`1px solid ${c.border}`, background:c.input, color:c.text, fontSize:14, boxSizing:'border-box', outline:'none', transition:'all 0.2s', boxShadow:'inset 0 2px 4px rgba(0,0,0,0.02)' }} 
          onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)' }}
          onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
          {...props} 
        />
      </div>
    </div>
  )

  return (
    <div style={{ background: c.card, borderRadius: 20, border: `1px solid ${c.border}`, padding: 36, maxWidth: 640, margin: '0 auto', boxShadow:'0 20px 40px rgba(0,0,0,0.05)', position:'relative', overflow:'hidden' }}>
      
      {/* Background Decor */}
      <div style={{ position:'absolute', top:-100, right:-100, width:300, height:300, background:'radial-gradient(circle, rgba(59,130,246,0.1) 0%, rgba(0,0,0,0) 70%)', borderRadius:'50%', pointerEvents:'none' }} />

      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom: 28 }}>
        <div style={{ width:48, height:48, borderRadius:14, background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, boxShadow:'0 4px 16px rgba(59,130,246,0.4)' }}>
          ➕
        </div>
        <div>
          <h2 style={{ margin: 0, color: c.text, fontSize: 22, fontWeight: 800 }}>Provision New User</h2>
          <p style={{ margin:0, color:c.muted, fontSize:14 }}>Manually register a member or staff account</p>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, background: c.input, padding: 6, borderRadius: 14 }}>
        {['Member', 'Staff'].map(t => (
          <button key={t} type="button" onClick={() => setType(t)} style={{ flex:1, padding:'12px', borderRadius:10, border:'none', background: type === t ? c.card : 'transparent', color: type === t ? '#3b82f6' : c.muted, fontWeight:700, cursor:'pointer', boxShadow: type===t ? '0 4px 12px rgba(0,0,0,0.08)' : 'none', transition:'all 0.2s', fontSize:14 }}>
            {t === 'Member' ? '🎓' : '🗂️'} {t} Account
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ position:'relative', zIndex:1 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <Input label="Full Name" name="fullName" icon="👤" required placeholder="John Doe" />
          <Input label="Email Address" name="email" type="email" icon="✉️" required placeholder="john@example.com" />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <Input label="Temporary Password" name="password" type="password" icon="🔒" required placeholder="Enter password" />
          <Input label="Phone Number" name="phone" icon="📞" placeholder="Optional" />
        </div>

        <div style={{ display:'flex', alignItems:'center', margin:'20px 0' }}>
          <div style={{ flex:1, height:1, background:c.border }} />
          <span style={{ padding:'0 12px', color:c.muted, fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>{type} Details</span>
          <div style={{ flex:1, height:1, background:c.border }} />
        </div>
        
        {type === 'Member' ? (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <Input label="Student / Member ID" name="studentId" icon="🆔" required placeholder="e.g. STU-123" />
              <Input label="Department" name="department" icon="🏛️" placeholder="e.g. Computer Science" />
            </div>
            <Input label="Max Books Allowed" name="maxBooksAllowed" type="number" icon="📚" defaultValue={5} />
          </>
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <Input label="Job Title" name="jobTitle" icon="👔" required placeholder="e.g. Librarian" />
              <div style={{ marginBottom: 16 }}>
                <label style={{ display:'block', fontSize:12, color:c.muted, marginBottom:6, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>System Role *</label>
                <select name="roleName" style={{ width:'100%', padding:'12px 16px', borderRadius:10, border:`1px solid ${c.border}`, background:c.input, color:c.text, fontSize:14, outline:'none' }}>
                  <option value="Staff">Library Staff</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>
            </div>
            <Input label="Salary (ETB)" name="salary" type="number" icon="💵" defaultValue={0} />
          </>
        )}

        <button type="submit" disabled={loading} className="interactive-btn btn-pulse" style={{ width:'100%', padding:16, borderRadius:12, border:'none', background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', color:'#fff', fontWeight:800, fontSize:16, cursor:loading?'not-allowed':'pointer', marginTop:24, boxShadow:'0 8px 24px rgba(59,130,246,0.3)' }}>
          {loading ? 'Processing...' : `✨ Provision ${type} Account`}
        </button>
      </form>
    </div>
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
function ConfigTab({ c, act }) {
  const [maxBooks, setMaxBooks] = useState('')

  const handleUpdateLimits = (e) => {
    e.preventDefault()
    act('put', '/admin/members/bulk-limit', { maxBooks }, `Max borrow limit updated to ${maxBooks} for all members.`)
    setMaxBooks('')
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ background: c.card, borderRadius: 16, border: `1px solid ${c.border}`, padding: 32 }}>
        <h2 style={{ color: c.text, margin: '0 0 16px', fontSize: 20 }}>System Configuration</h2>
        <p style={{ color: c.muted, marginBottom: 24 }}>Manage global rules and borrowing limits.</p>
        
        <form onSubmit={handleUpdateLimits} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', color: c.muted, fontSize: 13, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Global Borrow Limit (Max Books)</label>
            <div style={{ display: 'flex', gap: 12 }}>
              <input 
                type="number" 
                required 
                min="1" 
                max="20"
                value={maxBooks} 
                onChange={e => setMaxBooks(e.target.value)} 
                placeholder="e.g. 5" 
                style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: `1px solid ${c.border}`, background: c.input, color: c.text, outline: 'none' }}
              />
              <button type="submit" style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0 24px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Apply Limit</button>
            </div>
            <p style={{ fontSize: 12, color: c.muted, marginTop: 8 }}>This will update the maximum number of allowed concurrent borrows for all existing members.</p>
          </div>
        </form>
      </div>

      <div style={{ background: c.card, borderRadius: 16, border: `1px solid ${c.border}`, padding: 32 }}>
        <h2 style={{ color: c.text, margin: '0 0 16px', fontSize: 20 }}>Fine Settings</h2>
        <p style={{ color: c.muted, marginBottom: 24 }}>To manage fine categories, navigate to the <strong>Fine Types</strong> tab where you can add, edit, or delete fine definitions (e.g. Overdue, Minor Damage).</p>
      </div>
    </div>
  )
}
