import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useTheme } from '../context/ThemeContext'

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

export default function Home() {
  const { isDark } = useTheme()
  const [books, setBooks] = useState([])
  const navigate = useNavigate()

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

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('active')
      })
    }, { threshold: 0.1 })
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div style={{ background: isDark ? '#0a0e1a' : '#fff', color: isDark ? '#fff' : '#0f172a', fontFamily: "'Inter', sans-serif", minHeight: '100vh', transition: 'all 0.5s ease' }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
          html { scroll-behavior: smooth; }
          .reveal { opacity: 0; transform: translateY(30px); transition: all 0.8s ease-out; }
          .reveal.active { opacity: 1; transform: translateY(0); }
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
          .animate-grid { animation: gridForward 4s linear infinite; }
          @keyframes floatStat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        `}
      </style>

      {/* Hero Section: MOVING GRID */}
      <section id="home" className="reveal" style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', padding: '100px 48px', position: 'relative', background: isDark ? '#0a0e1a' : '#fff', overflow: 'hidden' }}>
        <div className="animate-grid" style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(59,130,246,0.15) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(59,130,246,0.15) 1.5px, transparent 1.5px)', backgroundSize: '80px 80px', zIndex: 0 }}></div>
        <div style={{ maxWidth: 1000, margin: '0 auto', width: '100%', zIndex: 1, textAlign: 'center' }}>
          <h1 style={{ fontSize: 72, fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a', lineHeight: 1.15, marginBottom: 24 }}>
            <span style={{ color: '#3b82f6' }}>Skip the Research Bottleneck</span> <br/>
            and <span style={{ color: '#3b82f6' }}>Learn Faster</span>
          </h1>
          <p style={{ fontSize: 20, color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.8, marginBottom: 64, maxWidth: 900, margin: '0 auto 64px' }}>
            Welcome to the ultimate digital gateway for AAIT students and staff. Our library management system provides seamless access to over 10,000 academic resources, automated borrowing tracking, and real-time availability. Whether you're a freshman or a senior researcher, we empower your academic journey with technology you can trust.
          </p>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 20 }}>
            <Link to="/register" style={{ 
              padding: '18px 50px', borderRadius: 50, background: '#3b82f6', 
              color: '#fff', fontWeight: 800, fontSize: 19, textDecoration: 'none', 
              transition: 'all 0.3s', boxShadow: '0 10px 30px rgba(59,130,246,0.3)'
            }} onMouseOver={(e) => { e.target.style.transform = 'translateY(-4px)'; e.target.style.boxShadow = '0 15px 35px rgba(59,130,246,0.4)'; }}
               onMouseOut={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 10px 30px rgba(59,130,246,0.3)'; }}>
              Join the Library Today
            </Link>
          </div>
        </div>
      </section>

      {/* Campus Section: FULL DARK BLUE */}
      <section id="location" className="reveal" style={{ display: 'flex', minHeight: '600px', flexWrap: 'wrap', background: '#0f172a' }}>
        <div style={{ flex: 1, minWidth: 400, color: '#fff', padding: '100px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ fontSize: 56, fontWeight: 900, marginBottom: 24 }}>Our Campus</h2>
          <p style={{ fontSize: 20, marginBottom: 48, opacity: 0.8, lineHeight: 1.6 }}>Our physical presence at CTBE is the foundation of our student success.</p>
          <div style={{ display: 'flex', gap: 32 }}>
             <div style={{ color: '#3b82f6', fontWeight: 700 }}>📍 CTBE, Addis Ababa</div>
             <div style={{ color: '#3b82f6', fontWeight: 700 }}>📞 +251 111 234 567</div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 400, padding: '60px' }}>
          <div style={{ width: '100%', height: '100%', minHeight: 400, borderRadius: 32, overflow: 'hidden', border: '8px solid rgba(255,255,255,0.05)' }}>
             <iframe title="Map" width="100%" height="100%" frameBorder="0" src="https://maps.google.com/maps?q=AAIT%205%20kilo%20Addis%20Ababa&t=&z=15&ie=UTF8&iwloc=&output=embed"></iframe>
          </div>
        </div>
      </section>

      {/* Stats Section: Cyber-Grid Aesthetic */}
      <section style={{ background: '#0a0e14', padding: '120px 48px', position: 'relative', overflow: 'hidden' }}>
        {/* Static Data Lines */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
           <div style={{ position:'absolute', top:'20%', left:0, right:0, height:1, background:'linear-gradient(90deg, transparent, #3b82f6, transparent)' }}></div>
           <div style={{ position:'absolute', bottom:'30%', left:0, right:0, height:1, background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }}></div>
           <div style={{ position:'absolute', top:0, bottom:0, left:'15%', width:1, background:'linear-gradient(180deg, transparent, #3b82f6, transparent)' }}></div>
           <div style={{ position:'absolute', top:0, bottom:0, right:'25%', width:1, background:'linear-gradient(180deg, transparent, rgba(255,255,255,0.3), transparent)' }}></div>
           <div style={{ position:'absolute', top:0, bottom:0, left:'45%', width:1, background:'linear-gradient(180deg, transparent, rgba(59,130,246,0.2), transparent)' }}></div>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <h2 style={{ fontSize: 64, fontWeight: 900, color: '#fff', marginBottom: 16, letterSpacing: -2 }}>
            UniLibrary by the <span style={{ color: '#3b82f6' }}>numbers</span>
          </h2>
          <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.6)', marginBottom: 80, fontWeight: 500 }}>
            Optimizing academic research with meticulous digital management and instant accessibility.
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

      {/* Books Section: Month, Real Images */}
      <section id="books" className="reveal" style={{ padding: '80px 48px 40px', background: isDark ? '#0a0e1a' : '#fff' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 48, fontWeight: 800 }}>Best borrowed books of the month</h2>
          <p style={{ color: '#64748b', marginTop: 12 }}>Check out our most popular titles currently in demand.</p>
        </div>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 32 }}>
          {books.map((b, i) => (
            <div key={i} className="book-card" style={{ borderRadius: 24, overflow: 'hidden' }}>
              <Link to="/login" state={{ tab: 'catalog', bookId: b.BookID }} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div style={{ height: 350, background: '#f1f5f9' }}>
                  <img src={b.CoverImage || 'https://via.placeholder.com/400x600'} alt={b.Title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: 24 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', marginBottom: 8 }}>{b.CategoryName}</div>
                  <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{b.Title}</h4>
                  <div style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>{b.Authors}</div>
                  <div className="btn-gold" style={{ width: '100%', textAlign: 'center', padding: '10px 0' }}>Borrow Now</div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>



      {/* About Us Section */}
      <section id="about" className="reveal" style={{ padding: '40px 48px 100px', background: isDark ? '#0a0e1a' : '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 80, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 400 }}>
             <h2 style={{ fontSize: 48, fontWeight: 900, color: isDark ? '#fff' : '#0f172a', marginBottom: 24 }}>About UniLibrary</h2>
             <p style={{ fontSize: 18, color: '#64748b', lineHeight: 1.8, marginBottom: 32 }}>
               Founded in 2010, the UniLibrary has been at the forefront of academic excellence at AAIT. Our mission is to bridge the gap between traditional research and modern digital accessibility. We serve thousands of students daily, providing the resources they need to excel in their engineering and technology careers.
             </p>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
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
            <h2 style={{ fontSize: 48, fontWeight: 900, color: isDark ? '#fff' : '#0f172a' }}>Our Services</h2>
            <p style={{ color: '#64748b', marginTop: 12 }}>Empowering your academic journey with modern library solutions.</p>
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
