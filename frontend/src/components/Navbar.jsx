import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import DarkModeToggle from './DarkModeToggle'

const catalogData = {
  'All Categories': [
    { name: 'Addis Ababa University', desc: 'Main Campus Portal', icon: '🏫', path: '/' },
    { name: 'CTBE Civil Dept', desc: 'Structural & Surveying', icon: '🌉', path: '/' },
    { name: 'AAiT Computing', desc: 'Software & IT Systems', icon: '🖥️', path: '/' },
    { name: 'AAiT Electrical', desc: 'Power & Telecommunications', icon: '🔋', path: '/' },
    { name: 'CTBE Arch Dept', desc: 'Design & Urban Planning', icon: '🏛️', path: '/' },
    { name: 'AAiT Mechanical', desc: 'Automotive & Materials', icon: '⚙️', path: '/' },
  ],
  'Mathematics': [
    { name: 'Calculus: Stewart', desc: 'Early Transcendentals', icon: '📐', path: '/?category=Mathematics#books' },
    { name: 'Linear Algebra', desc: 'Matrices & Vector Spaces', icon: '📈', path: '/?category=Mathematics#books' },
    { name: 'Probability', desc: 'Stats & Random Processes', icon: '🎲', path: '/?category=Mathematics#books' },
    { name: 'Discrete Math', desc: 'Logic & Set Theory', icon: '⛓️', path: '/?category=Mathematics#books' },
  ],
  'Physics': [
    { name: 'University Physics', desc: 'Young & Freedman', icon: '⚛️', path: '/?category=Physics#books' },
    { name: 'Quantum Physics', desc: 'Principles & Mechanics', icon: '🌌', path: '/?category=Physics#books' },
    { name: 'Thermodynamics', desc: 'Heat & Statistical Physics', icon: '🔥', path: '/?category=Physics#books' },
    { name: 'Electromagnetism', desc: 'Field theory & Maxwell', icon: '⚡', path: '/?category=Physics#books' },
  ],
  'Computer Sci': [
    { name: 'Algorithms (CLRS)', desc: 'Design & Analysis', icon: '💻', path: '/?category=Computer Sci#books' },
    { name: 'Operating Systems', desc: 'Kernel & Processes', icon: '💿', path: '/?category=Computer Sci#books' },
    { name: 'Computer Networks', desc: 'Protocols & Routing', icon: '🌐', path: '/?category=Computer Sci#books' },
    { name: 'Database Systems', desc: 'SQL, NoSQL & Design', icon: '🗄️', path: '/?category=Computer Sci#books' },
  ],
  'Programming': [
    { name: 'Clean Code', desc: 'Uncle Bob Martin', icon: '⚙️', path: '/?category=Programming#books' },
    { name: 'Modern JavaScript', desc: 'ES6, React & Node.js', icon: '🟨', path: '/?category=Programming#books' },
    { name: 'Python Engineering', desc: 'Data & Automation', icon: '🐍', path: '/?category=Programming#books' },
    { name: 'C++ Systems', desc: 'High performance code', icon: '🔵', path: '/?category=Programming#books' },
  ]
}

export default function Navbar() {
  const [scrollY, setScrollY] = useState(0)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [hoveredCategory, setHoveredCategory] = useState('All Categories')
  const { isDark } = useTheme()
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (activeDropdown !== 'catalog') {
      setHoveredCategory('All Categories')
    }
  }, [activeDropdown])

  const isDashboard = location.pathname.startsWith('/admin') || 
                      location.pathname.startsWith('/staff') || 
                      location.pathname.startsWith('/member')
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

  const themeVars = isDark ? `
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&display=swap');
    :root {
      --nav-bg: rgba(10, 14, 26, 0.85);
      --nav-text: #ffffff;
      --nav-border: rgba(255, 255, 255, 0.08);
      --dropdown-bg: #111827;
      --dropdown-hover: rgba(255, 255, 255, 0.05);
      --dropdown-desc: #94a3b8;
    }
    nav, nav * { font-family: 'Sora', sans-serif !important; }
  ` : `
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&display=swap');
    :root {
      --nav-bg: rgba(255, 255, 255, 0.9);
      --nav-text: #0f172a;
      --nav-border: rgba(0, 0, 0, 0.06);
      --dropdown-bg: #ffffff;
      --dropdown-hover: rgba(59, 130, 246, 0.05);
      --dropdown-desc: #64748b;
    }
    nav, nav * { font-family: 'Sora', sans-serif !important; }
  `

  const handleNavClick = (e, path, targetId) => {
    if (location.pathname === '/' && targetId) {
      e.preventDefault()
      const el = document.getElementById(targetId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      }
      setActiveDropdown(null)
    } else if (targetId) {
      // If we are on another page, let the standard navigate link handle it
      // or we can redirect to /#targetId
      navigate(`/${path}`)
      setActiveDropdown(null)
    }
  }

  // Chevron arrow icon for dropdowns
  const ChevronIcon = ({ isOpen }) => (
    <svg 
      width="12" 
      height="12" 
      viewBox="0 0 12 12" 
      fill="none" 
      style={{ 
        marginLeft: 5, 
        display: 'inline-block', 
        flexShrink: 0,
        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: 0.7
      }}
    >
      <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )

  return (
    <nav style={{ 
      position: 'fixed', top: 0, width: '100%', zIndex: 1000, 
      padding: '16px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      background: scrollY > 10 || isDashboard || isAuthPage ? 'var(--nav-bg)' : 'transparent',
      backdropFilter: scrollY > 10 || isDashboard || isAuthPage ? 'blur(20px)' : 'none',
      borderBottom: scrollY > 10 || isDashboard || isAuthPage ? '1px solid var(--nav-border)' : '1px solid transparent',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxSizing: 'border-box'
    }}>
      <style>{themeVars}</style>
      <style>{`
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(-8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes scrollDotPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }
        .nav-item-btn {
          background: none;
          border: none;
          outline: none;
          color: var(--nav-text);
          font-weight: 500;
          font-size: 15px;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 8px 12px;
          border-radius: 8px;
          transition: all 0.25s ease;
          font-family: inherit;
        }
        .nav-item-btn:hover {
          background: var(--dropdown-hover);
        }
        .nav-link-item {
          color: var(--nav-text);
          text-decoration: none;
          font-weight: 500;
          font-size: 15px;
          padding: 8px 12px;
          border-radius: 8px;
          transition: all 0.25s ease;
        }
        .nav-link-item:hover {
          background: var(--dropdown-hover);
        }
        .dropdown-panel {
          position: absolute;
          top: 100%;
          background: var(--dropdown-bg);
          border: 1px solid var(--nav-border);
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.12);
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 280px;
          z-index: 1001;
          margin-top: 8px;
          animation: dropdownFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .dropdown-link {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 10px;
          text-decoration: none;
          color: var(--nav-text);
          transition: all 0.2s ease;
        }
        .dropdown-link:hover {
          background: var(--dropdown-hover);
          transform: translateX(4px);
        }
        .dropdown-title {
          font-weight: 600;
          font-size: 14px;
          line-height: 1.2;
          margin-bottom: 2px;
        }
        .dropdown-text {
          font-size: 12px;
          color: var(--dropdown-desc);
          line-height: 1.4;
        }
        .outline-pill-btn {
          border: 1.5px solid #3b82f6;
          color: #3b82f6;
          background: transparent;
          padding: 10px 24px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .outline-pill-btn:hover {
          background: #3b82f6;
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
          transform: translateY(-1px);
        }
        .mega-dropdown-card:hover {
          background: var(--dropdown-hover) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
          border-color: #3b82f6 !important;
        }
      `}</style>

      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to="/" style={{ textDecoration:'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="url(#logoGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" stroke="url(#logoGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 6V16" stroke="url(#logoGradient)" strokeWidth="2" strokeLinecap="round" strokeDasharray="1.5 1.5"/>
          </svg>
          <span style={{ fontWeight: 800, fontSize: 21, fontFamily: "'Inter', sans-serif", letterSpacing: '-0.5px', color: 'var(--nav-text)' }}>UniLibrary</span>
        </Link>
      </div>
      
      {/* Navigation Links */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        {isDashboard ? (
          <>
            <Link to="/" style={{ color: 'var(--nav-text)', textDecoration: 'none', fontWeight: 500, fontSize: 14 }}>← Back to Home</Link>
            <div style={{ color: 'var(--nav-text)', fontWeight: 700, textTransform: 'uppercase', fontSize: 12, letterSpacing: 1.5, opacity: 0.8 }}>
              {location.pathname.includes('admin') ? 'Admin Portal' : location.pathname.includes('staff') ? 'Staff Portal' : 'Member Portal'}
            </div>
          </>
        ) : isAuthPage ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--nav-text)', opacity: 0.6 }}>
              {location.pathname === '/login' ? 'Sign in to access your library account' : 'Create your library account'}
            </span>
          </div>
        ) : (
          <>
            <Link to="/" className="nav-link-item">Home</Link>
            
            {/* Services Dropdown Trigger */}
            <div 
              onMouseEnter={() => setActiveDropdown('services')}
              onMouseLeave={() => setActiveDropdown(null)}
              style={{ position: 'relative' }}
            >
              <button className="nav-item-btn">
                Services <ChevronIcon isOpen={activeDropdown === 'services'} />
              </button>
              {activeDropdown === 'services' && (
                <div className="dropdown-panel" style={{ left: '50%', transform: 'translateX(-50%)', width: '320px' }}>
                  <Link to="/?category=All#books" onClick={(e) => handleNavClick(e, '?category=All#books', 'books')} className="dropdown-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                    <div>
                      <div className="dropdown-title">Digital Catalog</div>
                      <div className="dropdown-text">Explore over 10,000 text and research titles.</div>
                    </div>
                  </Link>
                  <Link to="/login" className="dropdown-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                    <div>
                      <div className="dropdown-title">Easy Borrowing</div>
                      <div className="dropdown-text">Automated checkout & due-date reminders.</div>
                    </div>
                  </Link>
                  <a href="#about" onClick={(e) => handleNavClick(e, '#about', 'about')} className="dropdown-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
                    <div>
                      <div className="dropdown-title">Research Support</div>
                      <div className="dropdown-text">One-on-one help searching study databases.</div>
                    </div>
                  </a>
                  <a href="#location" onClick={(e) => handleNavClick(e, '#location', 'location')} className="dropdown-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <div>
                      <div className="dropdown-title">Study Spaces</div>
                      <div className="dropdown-text">Quiet study environment on campus.</div>
                    </div>
                  </a>
                </div>
              )}
            </div>

            {/* Catalog Dropdown Trigger */}
            <div 
              onMouseEnter={() => setActiveDropdown('catalog')}
              onMouseLeave={() => setActiveDropdown(null)}
              style={{ position: 'relative' }}
            >
              <button className="nav-item-btn">
                Catalog <ChevronIcon isOpen={activeDropdown === 'catalog'} />
              </button>
              {activeDropdown === 'catalog' && (
                <div 
                  className="dropdown-panel" 
                  style={{ 
                    left: '50%', 
                    transform: 'translateX(-50%)', 
                    width: '760px',
                    padding: 0,
                    flexDirection: 'row',
                    overflow: 'hidden'
                  }}
                >
                  {/* Left Column (Categories List) */}
                  <div style={{
                    width: '240px',
                    background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                    borderRight: '1px solid var(--nav-border)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    {Object.keys(catalogData).map((catName) => (
                      <div
                        key={catName}
                        onMouseEnter={() => setHoveredCategory(catName)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          transition: 'all 0.2s ease',
                          background: hoveredCategory === catName 
                            ? (isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)')
                            : 'transparent',
                          color: hoveredCategory === catName ? '#3b82f6' : 'var(--nav-text)'
                        }}
                      >
                        <span>{catName}</span>
                        {hoveredCategory === catName && (
                          <span style={{ fontSize: '12px', opacity: 0.8 }}>→</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Right Column (Sub-Items Grid) */}
                  <div style={{
                    flex: 1,
                    padding: '20px 24px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                    alignContent: 'start'
                  }}>
                    {catalogData[hoveredCategory]?.map((item, idx) => (
                      <Link
                        key={idx}
                        to={item.path}
                        onClick={(e) => {
                          if (item.path.startsWith('/?category=')) {
                            // extract category
                            const catValue = item.path.split('category=')[1].split('#')[0]
                            const decodedCat = decodeURIComponent(catValue)
                            handleNavClick(e, item.path.substring(1), 'books')
                          } else {
                            setActiveDropdown(null)
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          borderRadius: '10px',
                          textDecoration: 'none',
                          background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
                          border: '1px solid var(--nav-border)',
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          color: 'var(--nav-text)'
                        }}
                        className="mega-dropdown-card"
                      >
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(59, 130, 246, 0.06)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          flexShrink: 0
                        }}>
                          {item.icon}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '13.5px', lineHeight: 1.2 }}>{item.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--dropdown-desc)', marginTop: '2px' }}>{item.desc}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* About Dropdown Trigger */}
            <div 
              onMouseEnter={() => setActiveDropdown('about')}
              onMouseLeave={() => setActiveDropdown(null)}
              style={{ position: 'relative' }}
            >
              <button className="nav-item-btn">
                About <ChevronIcon isOpen={activeDropdown === 'about'} />
              </button>
              {activeDropdown === 'about' && (
                <div className="dropdown-panel" style={{ left: '50%', transform: 'translateX(-50%)', width: '290px' }}>
                  <a href="#about" onClick={(e) => handleNavClick(e, '#about', 'about')} className="dropdown-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    <div>
                      <div className="dropdown-title">Our Mission</div>
                      <div className="dropdown-text">Empowering students with resource access.</div>
                    </div>
                  </a>
                  <a href="#location" onClick={(e) => handleNavClick(e, '#location', 'location')} className="dropdown-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <div>
                      <div className="dropdown-title">CTBE Campus Map</div>
                      <div className="dropdown-text">Addis Ababa, 5 Kilo physical presence.</div>
                    </div>
                  </a>
                </div>
              )}
            </div>
            
            <a href="#location" onClick={(e) => handleNavClick(e, '#location', 'location')} className="nav-link-item">Location</a>

            {user && (
              <Link to={user.RoleID === 1 ? "/admin" : user.RoleID === 2 ? "/staff" : "/member"} style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 700, marginLeft: 6, fontSize: 15 }}>Dashboard →</Link>
            )}
          </>
        )}
      </div>

      {/* Auth / Action Buttons */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <DarkModeToggle />
        {user ? (
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
             <div style={{ textAlign:'right', display: 'none', '@media (min-width: 768px)': { display: 'block' } }}>
               <div style={{ fontSize:13, fontWeight:600, color: 'var(--nav-text)' }}>{user.FullName}</div>
               <div style={{ fontSize:11, color:'#3b82f6' }}>{user.RoleName}</div>
             </div>
             <button onClick={logout} style={{ padding:'9px 18px', borderRadius:50, background:'rgba(239,68,68,0.08)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.15)', cursor:'pointer', fontWeight:600, fontSize: 13, transition: 'all 0.2s' }} onMouseOver={(e) => e.target.style.background = 'rgba(239,68,68,0.15)'} onMouseOut={(e) => e.target.style.background = 'rgba(239,68,68,0.08)'}>Log Out</button>
          </div>
        ) : !isAuthPage ? (
          <>
            <Link to="/login" style={{ color: 'var(--nav-text)', textDecoration: 'none', fontWeight: 600, fontSize: 15, padding: '8px 12px' }}>Sign In</Link>
            {/* Pill shaped button mimicking "Partner with Us" in Mereb Technologies screenshot */}
            <Link to="/register" className="outline-pill-btn">Join Now</Link>
          </>
        ) : (
          <Link to="/" style={{ color: 'var(--nav-text)', textDecoration: 'none', fontWeight: 500, fontSize: 14, opacity: 0.7 }}>← Back to Home</Link>
        )}
      </div>
    </nav>
  )
}

