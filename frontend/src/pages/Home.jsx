import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { useTheme } from '../context/ThemeContext'
import BookCard from '../components/BookCard'

function StatCounter({ target, label, suffix = '', floatDelay = '0s' }) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = React.useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
        observer.disconnect()
      }
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  
  useEffect(() => {
    if (!isVisible) return
    let start = 0
    const end = target
    if (start === end) return
    let totalDuration = 1000 // Count fast
    let increment = end / (totalDuration / 16)
    let timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [target, isVisible])

  return (
    <div ref={ref} style={{ textAlign: 'center', padding: '10px', animation: `floatStat 6s ease-in-out infinite ${floatDelay}` }}>
      <div style={{ fontSize: 64, fontWeight: 900, fontFamily: "'Inter', sans-serif", color: '#fff', textShadow: '0 4px 20px rgba(59,130,246,0.5)' }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 14, marginTop: 8 }}>{label}</div>
    </div>
  )
}

function Testimonials() {
  const [idx, setIdx] = useState(1) // Start at 1 because of the prepended item
  const originalUsers = [
    { name: "John Doe", role: "Software Engineering Student", comment: "The library system has completely changed how I access textbooks. The search is incredibly fast and intuitive! It's exactly what we needed at AAIT." },
    { name: "Yeabsira Tefera", role: "Graduate Researcher", comment: "I love the reservation feature. I can secure my books before even reaching the campus. A total life saver during complex research projects." },
    { name: "Ermiyas Kassaye", role: "Freshman", comment: "As a new student, this portal made it so easy to understand the library rules and borrow books without any hassle. Highly recommended for all freshmen!" },
    { name: "Messeret Lemma", role: "Senior Student", comment: "The best library portal I have used. The mobile-friendly design and structured approach give me complete confidence during my final year." },
    { name: "Samuel Biru", role: "Library Staff", comment: "Managing the catalog is now effortless. The UI is clean, modern, and very intuitive for both staff and students alike." }
  ]
  
  // Clone first and last for infinite feel
  const users = [originalUsers[originalUsers.length - 1], ...originalUsers, originalUsers[0]]

  useEffect(() => {
    const t = setInterval(() => {
      setIdx(prev => {
        if (prev >= users.length - 1) return 1
        return prev + 1
      })
    }, 8000)
    return () => clearInterval(t)
  }, [users.length])

  return (
    <section className="reveal" style={{ padding: '80px 0', background: '#f8fafc', overflow: 'hidden', textAlign: 'center' }}>
       <div style={{ maxWidth: 800, margin: '0 auto 40px' }}>
         <h2 style={{ fontSize: 42, fontWeight: 900, color: '#0f172a' }}>What Our Members Say</h2>
         <div style={{ width: 60, height: 4, background: '#3b82f6', margin: '16px auto' }}></div>
       </div>
       
       <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', height: 420 }}>
          <div style={{ 
            display: 'flex', 
            gap: 50, 
            transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)', 
            transform: `translateX(calc(50% - ${idx * 950 + 450}px))` 
          }}>
            {users.map((u, i) => (
              <div key={i} style={{
                flex: '0 0 900px',
                height: 380,
                background: '#2563eb', 
                borderRadius: '40px',
                padding: '40px 60px',
                color: '#fff',
                boxShadow: '0 40px 80px rgba(37,99,235,0.25)',
                textAlign: 'left',
                opacity: i === idx ? 1 : 0.55,
                transform: i === idx ? 'scale(1)' : 'scale(0.85)',
                filter: i !== idx ? 'brightness(1.2) saturate(1.5)' : 'none',
                transition: 'all 1s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                position: 'relative',
                border: i !== idx ? '1px solid rgba(255,255,255,0.2)' : 'none'
              }}>
                <div style={{ fontSize: 80, fontFamily: 'serif', opacity: 0.3, position: 'absolute', top: 20, left: 40 }}>“</div>
                <p style={{ fontSize: 22, lineHeight: 1.5, marginBottom: 30, fontWeight: 500, fontStyle: 'italic', zIndex: 1 }}>
                  {u.comment}
                </p>
                <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.15)', marginBottom: 25 }}></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                  <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800 }}>{u.name.charAt(0)}</div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 900 }}>{u.name}</div>
                    <div style={{ fontSize: 14, opacity: 0.7 }}>{u.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
       </div>

       <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 40 }}>
         {originalUsers.map((_, i) => (
           <div key={i} onClick={() => setIdx(i + 1)}
             style={{ width: i === (idx - 1) % originalUsers.length ? 40 : 10, height: 10, borderRadius: 5, background: '#2563eb', opacity: i === (idx - 1) % originalUsers.length ? 1 : 0.15, cursor: 'pointer', transition: 'all 0.4s' }} />
         ))}
       </div>
    </section>
  )
}

const DepartmentLogo = ({ icon, name, sub }) => {
  const { isDark } = useTheme()
  const [hovered, setHovered] = useState(false)
  return (
    <div 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        opacity: hovered ? 1 : (isDark ? 0.75 : 0.55),
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        cursor: 'pointer'
      }}
    >
      <div style={{
        color: hovered ? '#3b82f6' : (isDark ? '#94a3b8' : '#64748b'),
        transition: 'color 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {icon}
      </div>
      <div>
        <div style={{
          fontWeight: 800,
          fontSize: 14,
          color: hovered ? '#2563eb' : (isDark ? '#f1f5f9' : '#0f172a'),
          fontFamily: "'Inter', sans-serif",
          letterSpacing: '-0.3px',
          lineHeight: 1
        }}>
          {name}
        </div>
        <div style={{
          fontSize: 9,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          color: isDark ? '#64748b' : '#94a3b8',
          marginTop: 2
        }}>
          {sub}
        </div>
      </div>
    </div>
  )
}

const structures = [
  { // 0 — Balanced grid
    verticals:   ['8%', '20%', '33%', '50%', '67%', '80%', '92%'],
    horizontals: ['20%', '38%', '55%', '72%']
  },
  { // 1 — Wide columns
    verticals:   ['15%', '30%', '50%', '70%', '85%'],
    horizontals: ['15%', '35%', '58%', '78%']
  },
  { // 2 — Dense vertical
    verticals:   ['7%', '18%', '29%', '40%', '51%', '62%', '73%', '84%', '93%'],
    horizontals: ['25%', '50%', '75%']
  },
  { // 3 — Dense horizontal
    verticals:   ['20%', '40%', '60%', '80%'],
    horizontals: ['10%', '22%', '34%', '46%', '58%', '70%', '82%', '92%']
  },
  { // 4 — Asymmetric left-heavy
    verticals:   ['5%', '14%', '24%', '36%', '52%', '70%', '88%'],
    horizontals: ['18%', '40%', '62%', '84%']
  },
  { // 5 — Asymmetric right-heavy
    verticals:   ['12%', '28%', '46%', '62%', '74%', '84%', '94%'],
    horizontals: ['22%', '44%', '66%', '88%']
  },
  { // 6 — Center-focused
    verticals:   ['10%', '25%', '38%', '50%', '62%', '75%', '90%'],
    horizontals: ['12%', '30%', '50%', '70%', '88%']
  },
  { // 7 — Sparse open
    verticals:   ['20%', '42%', '58%', '78%'],
    horizontals: ['20%', '50%', '80%']
  },
  { // 8 — Fine mesh
    verticals:   ['10%', '19%', '28%', '37%', '50%', '63%', '72%', '81%', '90%'],
    horizontals: ['16%', '30%', '46%', '62%', '78%', '90%']
  },
  { // 9 — Classic 3-column
    verticals:   ['12%', '33%', '50%', '67%', '88%'],
    horizontals: ['25%', '50%', '75%']
  }
];

export default function Home() {
  const { isDark } = useTheme()
  const [books, setBooks] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  
  const [activeStructureIdx, setActiveStructureIdx] = useState(0)
  const [linesOpacity, setLinesOpacity] = useState(1)
  const [fadeSide, setFadeSide] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 800, y: 350 })
  const [isHovered, setIsHovered] = useState(false)
  const [isMapHovered, setIsMapHovered] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Fade out lines from one random side
      setFadeSide(Math.random() > 0.5 ? 'left' : 'right')
      setLinesOpacity(0)
      
      // 2. Change layout configuration at 1.5s
      setTimeout(() => {
        setActiveStructureIdx(prev => (prev + 1) % 10)
      }, 1400)
      
      // 3. Fade back in
      setTimeout(() => {
        setLinesOpacity(1)
        setFadeSide(null)
      }, 2600)
      
    }, 12000)
    return () => clearInterval(timer)
  }, [])

  // Auto-drifting orbit when mouse is not hovering
  useEffect(() => {
    if (isHovered) return;
    let angle = 0;
    const interval = setInterval(() => {
      angle += 0.012;
      const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 : 600;
      const centerY = 350;
      const radiusX = typeof window !== 'undefined' ? window.innerWidth / 4 : 300;
      const radiusY = 120;
      setMousePos({
        x: centerX + Math.cos(angle) * radiusX,
        y: centerY + Math.sin(angle) * radiusY
      });
    }, 30);
    return () => clearInterval(interval);
  }, [isHovered]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  useEffect(() => {
    axios.get('http://localhost:4000/api/public/books')
      .then(res => setBooks(res.data.data || []))
      .catch(() => setBooks([
        { BookID: 1, Title: 'Calculus: Early Transcendentals', Authors: 'James Stewart', CategoryName: 'Mathematics', AvailableCopies: 2, CoverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400' },
        { BookID: 2, Title: 'University Physics',              Authors: 'Hugh D. Young',     CategoryName: 'Physics',       AvailableCopies: 0, CoverImage: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=400' },
        { BookID: 3, Title: 'Introduction to Algorithms',      Authors: 'Thomas H. Cormen',  CategoryName: 'Computer Sci',  AvailableCopies: 5, CoverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=400' },
        { BookID: 4, Title: 'Clean Code',                      Authors: 'Robert C. Martin',  CategoryName: 'Programming',   AvailableCopies: 1, CoverImage: 'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=400' },
      ]))
  }, [])

  // Listen to navigation changes (navbar triggers category search)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const cat = params.get('category')
    if (cat) {
      setSelectedCategory(cat)
      setTimeout(() => {
        const el = document.getElementById('books')
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }, 150)
    }
  }, [location.search])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active')
          // Trigger child text animations
          entry.target.querySelectorAll(
            '.sec-left, .sec-right, .sec-up, .sec-up-d1, .sec-up-d2, .sec-up-d3, .sec-up-d4'
          ).forEach(el => el.classList.add('sec-active'))
        }
      })
    }, { threshold: 0.12 })
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Section scroll-spy
  useEffect(() => {
    const sectionIds = ['home', 'location', 'books', 'about']
    const observers = sectionIds.map(id => {
      const el = document.getElementById(id)
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id) },
        { threshold: 0.4 }
      )
      obs.observe(el)
      return obs
    }).filter(Boolean)
    return () => observers.forEach(obs => obs.disconnect())
  }, [])

  // Real-time catalog filtering for search bar
  const filteredSearchBooks = searchQuery.trim() === '' ? [] : books.filter(b => 
    b.Title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.Authors && b.Authors.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (b.CategoryName && b.CategoryName.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 5) // Show top 5 matches

  // Filter book list for display
  const displayBooks = selectedCategory === 'All' 
    ? books 
    : books.filter(b => b.CategoryName === selectedCategory)

  return (
    <div style={{ background: isDark ? '#0a0e1a' : '#fff', color: isDark ? '#fff' : '#0f172a', fontFamily: "'Sora', sans-serif", minHeight: '100vh', transition: 'all 0.5s ease' }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&display=swap');
          html { scroll-behavior: smooth; }
          .reveal { opacity: 0; transform: translateY(30px); transition: all 0.8s ease-out; }
          .reveal.active { opacity: 1; transform: translateY(0); }

          @keyframes heroDropDown {
            0%   { opacity: 0; transform: translateY(-40px) scale(0.95); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes heroSlideLeft {
            0%   { opacity: 0; transform: translateX(-60px); }
            100% { opacity: 1; transform: translateX(0); }
          }
          @keyframes heroSlideRight {
            0%   { opacity: 0; transform: translateX(60px); }
            100% { opacity: 1; transform: translateX(0); }
          }
          @keyframes heroFadeUp {
            0%   { opacity: 0; transform: translateY(32px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes heroFadeIn {
            0%   { opacity: 0; }
            100% { opacity: 1; }
          }
          .hero-badge    { animation: heroDropDown  1.1s cubic-bezier(0.22,1,0.36,1) 0.2s  both; }
          .hero-line1    { animation: heroSlideLeft  1.2s cubic-bezier(0.22,1,0.36,1) 0.55s both; }
          .hero-line2    { animation: heroSlideRight 1.2s cubic-bezier(0.22,1,0.36,1) 0.85s both; }
          .hero-sub      { animation: heroFadeUp     1.1s cubic-bezier(0.22,1,0.36,1) 1.15s both; }
          .hero-search   { animation: heroFadeUp     1.1s cubic-bezier(0.22,1,0.36,1) 1.45s both; }
          .hero-depts    { animation: heroFadeIn     1.2s ease                        1.75s both; }

          /* === Section reveal classes (triggered by IntersectionObserver) === */
          .sec-left  { opacity: 0; transform: translateX(-50px); transition: opacity 1.2s cubic-bezier(0.22,1,0.36,1), transform 1.2s cubic-bezier(0.22,1,0.36,1); }
          .sec-right { opacity: 0; transform: translateX(50px);  transition: opacity 1.2s cubic-bezier(0.22,1,0.36,1), transform 1.2s cubic-bezier(0.22,1,0.36,1); }
          .sec-up    { opacity: 0; transform: translateY(40px);   transition: opacity 1.2s cubic-bezier(0.22,1,0.36,1), transform 1.2s cubic-bezier(0.22,1,0.36,1); }
          .sec-up-d1 { opacity: 0; transform: translateY(40px);   transition: opacity 1.2s cubic-bezier(0.22,1,0.36,1) 0.2s, transform 1.2s cubic-bezier(0.22,1,0.36,1) 0.2s; }
          .sec-up-d2 { opacity: 0; transform: translateY(40px);   transition: opacity 1.2s cubic-bezier(0.22,1,0.36,1) 0.4s, transform 1.2s cubic-bezier(0.22,1,0.36,1) 0.4s; }
          .sec-up-d3 { opacity: 0; transform: translateY(40px);   transition: opacity 1.2s cubic-bezier(0.22,1,0.36,1) 0.6s, transform 1.2s cubic-bezier(0.22,1,0.36,1) 0.6s; }
          .sec-up-d4 { opacity: 0; transform: translateY(40px);   transition: opacity 1.2s cubic-bezier(0.22,1,0.36,1) 0.8s, transform 1.2s cubic-bezier(0.22,1,0.36,1) 0.8s; }
          .sec-active { opacity: 1 !important; transform: translate(0,0) !important; }

          /* Interactive text hover */
          .txt-hover { display: inline-block; transition: color 0.3s ease, transform 0.3s ease; cursor: default; }
          .txt-hover:hover { color: #3b82f6; transform: translateY(-3px); }

          .btn-gold {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: #fff;
            padding: 12px 28px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 700;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            display: inline-block;
          }
          .btn-gold:hover { transform: translateY(-4px) scale(1.05); box-shadow: 0 12px 24px rgba(245, 158, 11, 0.4); }
          
          .interactive-card {
            position: relative;
            transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            cursor: pointer;
            overflow: hidden;
            z-index: 1;
          }
          .interactive-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1));
            opacity: 0;
            transition: opacity 0.5s;
            z-index: -1;
          }
          .interactive-card:hover { 
            transform: translateY(-15px) scale(1.02); 
            box-shadow: 0 30px 60px rgba(59,130,246,0.2) !important;
            border-color: #3b82f6 !important;
          }
          .interactive-card:hover::before {
            opacity: 1;
          }
          .interactive-card:hover .service-icon {
            transform: rotateY(180deg) scale(1.1);
            color: #3b82f6;
          }
          .service-icon {
            transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            display: inline-block;
            color: #f59e0b;
          }

          .book-card {
            background: ${isDark ? '#1e293b' : '#fff'};
            border: 1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'};
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            cursor: pointer;
          }
          .book-card:hover { transform: translateY(-10px); z-index: 10; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
          @keyframes gridForward { from { background-position: 0 0; } to { background-position: 80px 80px; } }
          .animate-grid { }
          @keyframes floatStat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
          @keyframes pulseGlow {
            0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
            70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
            100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
          }
          @keyframes sideRevealLeft {
            from { clip-path: inset(0 100% 0 0); }
            to   { clip-path: inset(0 0% 0 0); }
          }
          @keyframes sideRevealRight {
            from { clip-path: inset(0 0 0 100%); }
            to   { clip-path: inset(0 0 0 0%); }
          }
        `}
      </style>

      {/* Hero Section: Blueprint line aesthetics with interactive neon glow */}
      <section 
        id="home" 
        className="reveal" 
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ minHeight: '94vh', display: 'flex', alignItems: 'center', padding: '120px 48px 80px', position: 'relative', background: isDark ? '#0a0e1a' : '#fff', overflow: 'hidden' }}
      >
        <div className="animate-grid" style={{ position: 'absolute', inset: 0, backgroundImage: isDark ? 'linear-gradient(rgba(255,255,255,0.06) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(255,255,255,0.06) 1.5px, transparent 1.5px)' : 'linear-gradient(rgba(59,130,246,0.05) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(59,130,246,0.05) 1.5px, transparent 1.5px)', backgroundSize: '80px 80px', zIndex: 0 }}></div>
        
        {/* === MEREB-STYLE GRID LINES: thin, full-span, matching nav border === */}
        {/* Base vertical lines */}
        {structures[activeStructureIdx].verticals.map((pos, idx) => (
          <div 
            key={`v-${idx}`}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: pos,
              width: '1px',
              background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(59,130,246,0.12)',
              opacity: linesOpacity,
              transition: `opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1) ${fadeSide === 'right' ? `${idx * 60}ms` : `${(structures[activeStructureIdx].verticals.length - 1 - idx) * 60}ms`}`,
              zIndex: 0,
              pointerEvents: 'none'
            }}
          />
        ))}
        {/* Base horizontal lines */}
        {structures[activeStructureIdx].horizontals.map((pos, idx) => (
          <div 
            key={`h-${idx}`}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: pos,
              height: '1px',
              background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(59,130,246,0.12)',
              opacity: linesOpacity,
              transition: `opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1) ${idx * 80}ms`,
              zIndex: 0,
              pointerEvents: 'none'
            }}
          />
        ))}

        {/* Interactive spotlight highlighted grid lines */}
        {isHovered && (
          <div style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 1,
            WebkitMaskImage: `radial-gradient(circle 200px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
            maskImage: `radial-gradient(circle 200px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`
          }}>
            {/* Highlighted Vertical Lines */}
            {structures[activeStructureIdx].verticals.map((pos, idx) => (
              <div 
                key={`v-hl-${idx}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: pos,
                  width: '2px',
                  background: '#3b82f6',
                  boxShadow: '0 0 10px rgba(59, 130, 246, 0.9)',
                  opacity: linesOpacity,
                  transition: 'opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            ))}
            {/* Highlighted Horizontal Lines */}
            {structures[activeStructureIdx].horizontals.map((pos, idx) => (
              <div 
                key={`h-hl-${idx}`}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: pos,
                  height: '2px',
                  background: '#3b82f6',
                  boxShadow: '0 0 10px rgba(59, 130, 246, 0.9)',
                  opacity: linesOpacity,
                  transition: 'opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            ))}
          </div>
        )}
        
        <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%', zIndex: 1, textAlign: 'center', position: 'relative' }}>
          
          {/* Top Pill Badge — drops down from top */}
          <div 
            className="hero-badge"
            onClick={() => {
              const el = document.getElementById('books');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              border: isDark ? '1.5px solid rgba(59,130,246,0.4)' : '1.5px solid #2563eb',
              borderRadius: 50,
              padding: '10px 24px',
              color: isDark ? '#60a5fa' : '#2563eb',
              fontWeight: 700,
              fontSize: 13,
              background: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59, 130, 246, 0.04)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 32,
              cursor: 'pointer',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              boxShadow: '0 4px 20px rgba(59,130,246,0.06)',
              letterSpacing: '0.5px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(59,130,246,0.18)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(59,130,246,0.06)';
            }}
          >
            <span>Live Catalog: {books.length ? `${books.length}+ Books Online` : 'Loading Academic Catalog...'}</span>
            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#10b981', animation: 'pulseGlow 1.5s infinite' }}></span>
          </div>

          {/* H1 — line 1 slides from left, line 2 slides from right */}
          <h1 style={{ fontSize: 72, fontWeight: 900, color: isDark ? '#f1f5f9' : '#0f172a', lineHeight: 1.12, marginBottom: 24, letterSpacing: '-2px', overflow: 'hidden' }}>
            <span className="hero-line1" style={{ display: 'block', color: '#3b82f6' }}>Skip the Research Bottleneck</span>
            <span className="hero-line2" style={{ display: 'block' }}>and <span style={{ color: '#3b82f6' }}>Learn Faster</span></span>
          </h1>

          {/* Subtitle — fades up */}
          <p className="hero-sub" style={{ fontSize: 20, color: isDark ? '#94a3b8' : '#475569', lineHeight: 1.7, marginBottom: 40, maxWidth: 720, margin: '0 auto 40px', fontWeight: 400 }}>
            Welcome to the ultimate digital gateway for AAIT students and staff. Seamless access to over 10,000 academic resources, automated borrowing tracking, and real-time availability.
          </p>

          {/* Search bar — fades up */}
          <div className="hero-search" style={{ position: 'relative', maxWidth: 620, margin: '0 auto 50px', zIndex: 100 }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              background: isDark ? 'rgba(30, 41, 59, 0.8)' : '#ffffff', 
              border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(59, 130, 246, 0.15)'}`, 
              borderRadius: 50, 
              padding: '6px 12px 6px 24px', 
              boxShadow: '0 20px 48px rgba(0,0,0,0.08)', 
              backdropFilter: 'blur(12px)', 
              transition: 'all 0.3s' 
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 12 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input 
                type="text" 
                placeholder="Search books, authors, or categories live..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: isDark ? '#fff' : '#0f172a', fontSize: 16, padding: '12px 0', fontWeight: 500 }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px 12px', fontSize: 16 }}>✕</button>
              )}
              <button 
                onClick={() => {
                  const el = document.getElementById('books');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 50, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' }} 
                onMouseOver={(e) => e.target.style.background = '#2563eb'} 
                onMouseOut={(e) => e.target.style.background = '#3b82f6'}
              >
                Find
              </button>
            </div>
            
            {/* Search Suggestions Dropdown */}
            {searchQuery && (
              <div style={{ 
                position: 'absolute', 
                top: '112%', 
                left: 0, 
                right: 0, 
                background: isDark ? '#111827' : '#ffffff', 
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`, 
                borderRadius: 20, 
                boxShadow: '0 25px 60px rgba(0,0,0,0.15)', 
                overflow: 'hidden', 
                zIndex: 1000, 
                textAlign: 'left', 
                animation: 'dropdownFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)' 
              }}>
                <div style={{ padding: '12px 20px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  {filteredSearchBooks.length ? `Matches found (${filteredSearchBooks.length})` : 'No matches found'}
                </div>
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {filteredSearchBooks.map((b) => (
                    <div 
                      key={b.BookID}
                      onClick={() => navigate(`/book/${b.BookID}`)}
                      style={{ display: 'flex', gap: 16, padding: '14px 20px', cursor: 'pointer', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}`, transition: 'all 0.2s' }}
                      onMouseOver={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(59,130,246,0.04)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: 38, height: 48, background: 'rgba(0,0,0,0.08)', borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                        {b.CoverImage ? (
                          <img src={b.CoverImage.startsWith('http') ? b.CoverImage : `http://localhost:4000${b.CoverImage}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyItems: 'center', fontSize: 16 }}>📚</div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: isDark ? '#fff' : '#0f172a', fontSize: 14, lineHeight: 1.2 }}>{b.Title}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>By {b.Authors}</div>
                      </div>
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, background: b.AvailableCopies > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: b.AvailableCopies > 0 ? '#10b981' : '#ef4444', padding: '3px 8px', borderRadius: 12, fontWeight: 700 }}>
                          {b.AvailableCopies > 0 ? 'Available' : 'Out'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Department wall — fades in last */}
          <div className="hero-depts" style={{ marginTop: 90, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`, paddingTop: 40 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: isDark ? '#94a3b8' : '#94a3b8', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 30 }}>
              Academic Departments We Build For
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '32px 50px' }}>
              <DepartmentLogo 
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18M3 12a9 9 0 0 0 9 9M3 12a9 9 0 0 1 9-9M21 12a9 9 0 0 1-9 9M21 12a9 9 0 0 0-9-9"/></svg>}
                name="CTBE Civil"
                sub="Structural Dept"
              />
              <DepartmentLogo 
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>}
                name="AAiT Computing"
                sub="Software & IT"
              />
              <DepartmentLogo 
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}
                name="AAiT Electrical"
                sub="Power & Systems"
              />
              <DepartmentLogo 
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V8M5 12H19M2 22h20M12 2l10 6H2l10-6z"/></svg>}
                name="CTBE Arch"
                sub="Design & Planning"
              />
              <DepartmentLogo 
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>}
                name="AAiT Mechanical"
                sub="Automotive & Mfg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Campus Section: Dynamic Interactive Dark Map */}
      <section 
        id="location" 
        className="reveal" 
        style={{ 
          display: 'flex', 
          minHeight: '600px', 
          flexWrap: 'wrap', 
          background: isDark 
            ? 'linear-gradient(180deg, #111827 0%, #0f172a 100%)' 
            : 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)', 
          transition: 'all 0.5s ease',
          borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'}`,
          borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'}`,
          boxShadow: isDark 
            ? 'inset 0 24px 48px rgba(0, 0, 0, 0.2), inset 0 -24px 48px rgba(0, 0, 0, 0.2)' 
            : 'inset 0 16px 32px rgba(0, 0, 0, 0.02), inset 0 -16px 32px rgba(0, 0, 0, 0.02)'
        }}
      >
        <div style={{ 
          flex: 1, 
          minWidth: 400, 
          color: isDark ? '#fff' : '#0f172a', 
          padding: '100px 60px', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center' 
        }}>
          <h2 style={{ fontSize: 56, fontWeight: 900, marginBottom: 24, letterSpacing: '-1.5px', lineHeight: 1.1 }}>
            <span className="sec-left txt-hover" style={{ display: 'block' }}>Our</span>
            <span className="sec-right txt-hover" style={{ display: 'block', color: '#3b82f6' }}>Campus</span>
          </h2>
          <p className="sec-up-d1" style={{ fontSize: 18, marginBottom: 48, color: '#64748b', lineHeight: 1.7, fontWeight: 400 }}>
            <span className="txt-hover">Our physical presence at CTBE</span>{' '}
            <span className="txt-hover">is the foundation of our student success.</span>{' '}
            <span className="txt-hover">Feel free to visit our campus library space.</span>
          </p>
          <div className="sec-up-d2" style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
             <div style={{ 
               color: '#3b82f6', 
               fontWeight: 700, 
               background: isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.05)', 
               padding: '12px 24px', 
               borderRadius: '16px',
               border: '1px solid rgba(59, 130, 246, 0.15)',
               boxShadow: '0 4px 12px rgba(59,130,246,0.03)'
             }}>
               📍 CTBE, Addis Ababa
             </div>
             <div style={{ 
               color: '#3b82f6', 
               fontWeight: 700, 
               background: isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.05)', 
               padding: '12px 24px', 
               borderRadius: '16px',
               border: '1px solid rgba(59, 130, 246, 0.15)',
               boxShadow: '0 4px 12px rgba(59,130,246,0.03)'
             }}>
               📞 +251 111 234 567
             </div>
          </div>
        </div>
        <div 
          style={{ flex: 1, minWidth: 400, padding: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={() => setIsMapHovered(true)}
          onMouseLeave={() => setIsMapHovered(false)}
        >
          <div style={{ 
            width: '100%', 
            height: '100%', 
            minHeight: 400, 
            borderRadius: 32, 
            overflow: 'hidden', 
            border: `8px solid ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}`,
            boxShadow: isMapHovered 
              ? (isDark ? '0 30px 60px rgba(59,130,246,0.15)' : '0 30px 60px rgba(0,0,0,0.12)') 
              : '0 10px 30px rgba(0,0,0,0.05)',
            transform: isMapHovered ? 'translateY(-6px)' : 'translateY(0)',
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
             <iframe 
               title="Map" 
               width="100%" 
               height="100%" 
               frameBorder="0" 
               src="https://maps.google.com/maps?q=AAIT%205%20kilo%20Addis%20Ababa&t=&z=15&ie=UTF8&iwloc=&output=embed"
               style={{
                 width: '100%',
                 height: '100%',
                 border: 'none',
                 transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                 filter: isMapHovered
                   ? 'none'
                   : (isDark 
                       ? 'invert(90%) hue-rotate(180deg) brightness(85%) contrast(95%)' 
                       : 'grayscale(35%) contrast(95%) brightness(96%)')
               }}
             ></iframe>
          </div>
        </div>
      </section>

      {/* Books Section */}
      <section id="books" className="reveal" style={{ padding: '90px 48px 60px', background: isDark ? '#0a0e1a' : '#fff', transition: 'background 0.5s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 50 }}>
          <h2 style={{ fontSize: 44, fontWeight: 900, letterSpacing: '-1px', color: isDark ? '#fff' : '#0f172a', overflow: 'hidden' }}>
            <span className="sec-left txt-hover" style={{ display: 'inline-block' }}>Best borrowed books</span>{' '}
            <span className="sec-right txt-hover" style={{ display: 'inline-block', color: '#3b82f6' }}>of the month</span>
          </h2>
          <p className="sec-up-d1" style={{ color: '#64748b', marginTop: 12, fontSize: 16, fontWeight: 400 }}>
            <span className="txt-hover">Hover or click a book to see its full details.</span>{' '}
            <span className="txt-hover">Click the cover to view the full page.</span>
          </p>
        </div>

        {/* Live Category Filter pills */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 50, flexWrap: 'wrap' }}>
          {['All', 'Mathematics', 'Physics', 'Computer Sci', 'Programming'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '10px 22px',
                borderRadius: '50px',
                border: `1.5px solid ${selectedCategory === cat ? '#3b82f6' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)')}`,
                background: selectedCategory === cat ? '#3b82f6' : 'transparent',
                color: selectedCategory === cat ? '#ffffff' : (isDark ? '#cbd5e1' : '#475569'),
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                boxShadow: selectedCategory === cat ? '0 4px 12px rgba(59,130,246,0.2)' : 'none'
              }}
              onMouseOver={(e) => {
                if (selectedCategory !== cat) {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.color = '#3b82f6';
                }
              }}
              onMouseOut={(e) => {
                if (selectedCategory !== cat) {
                  e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
                  e.target.style.color = isDark ? '#cbd5e1' : '#475569';
                }
              }}
            >
              {cat === 'All' ? '📚 All Categories' : cat}
            </button>
          ))}
        </div>

        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 28 }}>
          {displayBooks.map((b, i) => (
            <BookCard
              key={b.BookID}
              book={b}
              isDark={isDark}
              showActions="public"
              index={i}
              detailLink={true}
            />
          ))}
        </div>
      </section>

      {/* Stats Section: Cyber-Grid Aesthetic */}
      <section className="reveal" style={{ background: '#0a0e14', padding: '120px 48px', position: 'relative', overflow: 'hidden' }}>
        {/* Static Data Lines */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
           <div style={{ position:'absolute', top:'20%', left:0, right:0, height:1, background:'linear-gradient(90deg, transparent, #3b82f6, transparent)' }}></div>
           <div style={{ position:'absolute', bottom:'30%', left:0, right:0, height:1, background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }}></div>
           <div style={{ position:'absolute', top:0, bottom:0, left:'15%', width:1, background:'linear-gradient(180deg, transparent, #3b82f6, transparent)' }}></div>
           <div style={{ position:'absolute', top:0, bottom:0, right:'25%', width:1, background:'linear-gradient(180deg, transparent, rgba(255,255,255,0.3), transparent)' }}></div>
           <div style={{ position:'absolute', top:0, bottom:0, left:'45%', width:1, background:'linear-gradient(180deg, transparent, rgba(59,130,246,0.2), transparent)' }}></div>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <h2 style={{ fontSize: 64, fontWeight: 900, color: '#fff', marginBottom: 16, letterSpacing: -2, overflow: 'hidden' }}>
            <span className="sec-left txt-hover" style={{ display: 'inline-block' }}>UniLibrary by the</span>{' '}
            <span className="sec-right txt-hover" style={{ display: 'inline-block', color: '#3b82f6' }}>numbers</span>
          </h2>
          <p className="sec-up-d1" style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', marginBottom: 80, fontWeight: 400 }}>
            <span className="txt-hover">Optimizing academic research</span>{' '}
            <span className="txt-hover">with meticulous digital management</span>{' '}
            <span className="txt-hover">and instant accessibility.</span>
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0 }}>
            <div style={{ flex: 1, padding: '0 40px' }}>
              <StatCounter target={10000} suffix="+" label="Books Collection" floatDelay="0s" />
            </div>
            
            <div style={{ width: 1, height: 120, background: 'linear-gradient(transparent, rgba(255,255,255,0.3), transparent)' }}></div>
            
            <div style={{ flex: 1, padding: '0 40px' }}>
              <StatCounter target={500} suffix="+" label="Active Members" floatDelay="1s" />
            </div>

            <div style={{ width: 1, height: 120, background: 'linear-gradient(transparent, rgba(255,255,255,0.3), transparent)' }}></div>

            <div style={{ flex: 1, padding: '0 40px' }}>
              <StatCounter target={99} suffix="%" label="User Satisfaction" floatDelay="2s" />
            </div>
          </div>
        </div>
      </section>



      {/* About Us Section */}
      <section id="about" className="reveal" style={{ padding: '40px 48px 100px', background: isDark ? '#0a0e1a' : '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 80, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 400 }}>
             <h2 style={{ fontSize: 48, fontWeight: 900, color: isDark ? '#fff' : '#0f172a', marginBottom: 24, lineHeight: 1.1 }}>
               <span className="sec-left txt-hover" style={{ display: 'block' }}>About</span>
               <span className="sec-right txt-hover" style={{ display: 'block', color: '#3b82f6' }}>UniLibrary</span>
             </h2>
             <p className="sec-up-d1" style={{ fontSize: 17, color: '#64748b', lineHeight: 1.9, marginBottom: 32, fontWeight: 400 }}>
               <span className="txt-hover">Founded in 2010, the UniLibrary has been at the forefront of academic excellence at AAIT.</span>{' '}
               <span className="txt-hover">Our mission is to bridge the gap between traditional research and modern digital accessibility.</span>{' '}
               <span className="txt-hover">We serve thousands of students daily, providing the resources they need to excel in their engineering and technology careers.</span>
             </p>
             <div className="sec-up-d2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                   <div style={{ color: '#3b82f6', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>15+ Years</div>
                   <div style={{ color: '#64748b', fontSize: 14 }}>Of Academic Service</div>
                </div>
                <div>
                   <div style={{ color: '#3b82f6', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>24/7</div>
                   <div style={{ color: '#64748b', fontSize: 14 }}>Digital Access</div>
                </div>
             </div>
          </div>
          <div style={{ flex: 1, minWidth: 400 }}>
             <div style={{ width: '100%', height: 450, borderRadius: 32, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                <img src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=800" alt="CTBE Library" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
             </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="reveal" style={{ padding: '120px 48px', background: isDark ? '#0a0e1a' : '#f8fafc' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <h2 style={{ fontSize: 48, fontWeight: 900, color: isDark ? '#fff' : '#0f172a', overflow: 'hidden' }}>
              <span className="sec-left txt-hover" style={{ display: 'inline-block' }}>Our</span>{' '}
              <span className="sec-right txt-hover" style={{ display: 'inline-block', color: '#3b82f6' }}>Services</span>
            </h2>
            <p className="sec-up-d1" style={{ color: '#64748b', marginTop: 16, fontWeight: 400 }}>
              <span className="txt-hover">Empowering your academic journey</span>{' '}
              <span className="txt-hover">with modern library solutions.</span>
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
            {[
              { 
                title: 'Digital Catalog', 
                desc: 'Search and browse over 10,000 academic titles from any device seamlessly.', 
                icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><circle cx="12" cy="8" r="2"/><line x1="14" y1="10" x2="16" y2="12"/></svg> 
              },
              { 
                title: 'Easy Borrowing', 
                desc: 'Hassle-free borrowing and return process with automated tracking.', 
                icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              },
              { 
                title: 'Research Support', 
                desc: 'Expert assistance in finding the right resources for your projects.', 
                icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              },
              { 
                title: 'Study Spaces', 
                desc: 'Secure and quiet zones for focused individual or group study.', 
                icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21h18"/><path d="M9 8h1"/><path d="M9 12h1"/><path d="M9 16h1"/><path d="M14 8h1"/><path d="M14 12h1"/><path d="M14 16h1"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/></svg>
              }
            ].map((s, i) => (
              <div key={i} className="interactive-card" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#fff', padding: 40, borderRadius: 24, border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                <div className="service-icon" style={{ marginBottom: 24 }}>{s.icon}</div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: isDark ? '#fff' : '#0f172a', marginBottom: 12 }}>{s.title}</h3>
                <p style={{ color: '#64748b', lineHeight: 1.6, fontSize: 15 }}>{s.desc}</p>
                <Link to="/login" style={{ marginTop: 24, display: 'inline-flex', alignItems: 'center', color: '#3b82f6', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
                  Explore <span style={{ marginLeft: 8 }}>→</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials: New Image Style - MOVED TO END */}
      <Testimonials />

    </div>
  )
}
