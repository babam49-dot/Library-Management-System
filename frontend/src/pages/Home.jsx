import React, { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Footer from '../components/Footer'

export default function Home() {
  const [scrollY, setScrollY] = useState(0)
  const [isDark, setIsDark] = useState(true) // Default to dark mode as requested
  const [books, setBooks] = useState([])
  const [stats] = useState({
    books: 0,
    members: 0,
    arrivals: 0,
    satisfaction: 0
  })
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // Fetch books to display in the catalog
    axios.get('http://localhost:4000/api/public/books').then(res => {
      setBooks(res.data.data.slice(0, 4))
    }).catch(err => {
      console.log('Error fetching public books, using demo data', err)
      setBooks([
        { BookID: 1, Title: 'Calculus: Early Transcendentals', Authors: 'James Stewart', CategoryName: 'Mathematics', AvailableCopies: 2, CoverImage: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
        { BookID: 2, Title: 'University Physics', Authors: 'Hugh D. Young', CategoryName: 'Physics', AvailableCopies: 0, CoverImage: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
        { BookID: 3, Title: 'Introduction to Algorithms', Authors: 'Thomas H. Cormen', CategoryName: 'Computer Science', AvailableCopies: 5, CoverImage: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
        { BookID: 4, Title: 'Clean Code', Authors: 'Robert C. Martin', CategoryName: 'Programming', AvailableCopies: 1, CoverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' }
      ])
    })
  }, [])

  const themeVars = isDark ? `
    :root {
      --bg-primary: #0a0e1a;
      --bg-secondary: #111827;
      --card-bg: rgba(26, 32, 53, 0.7);
      --text-primary: #ffffff;
      --text-secondary: #9ca3af;
      --accent-gold: #f59e0b;
      --accent-amber: #d97706;
      --accent-blue: #3b82f6;
      --border-color: rgba(255, 255, 255, 0.1);
      --footer-bg: #05070d;
      --footer-text: #9ca3af;
    }
  ` : `
    :root {
      --bg-primary: #f8fafc;
      --bg-secondary: #ffffff;
      --card-bg: rgba(255, 255, 255, 0.9);
      --text-primary: #0f172a;
      --text-secondary: #475569;
      --accent-gold: #eab308;
      --accent-amber: #d97706;
      --accent-blue: #2563eb;
      --border-color: rgba(0, 0, 0, 0.1);
      --footer-bg: #f1f5f9;
      --footer-text: #475569;
    }
  `

  return (
    <div style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: "'Inter', sans-serif", minHeight: '100vh', transition: 'background 0.5s ease, color 0.5s ease' }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600&display=swap');
          ${themeVars}
          html { scroll-behavior: smooth; }
          .glass-card {
            background: var(--card-bg);
            backdrop-filter: blur(12px);
            border: 1px solid var(--border-color);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }
          .glass-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            border-color: rgba(245, 158, 11, 0.4);
          }
          .btn-gold {
            background: linear-gradient(135deg, var(--accent-gold), var(--accent-amber));
            color: #fff;
            padding: 12px 28px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s;
            border: none;
            cursor: pointer;
          }
          .btn-gold:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);
          }
          .btn-outline {
            background: transparent;
            color: var(--text-primary);
            border: 1px solid var(--border-color);
            padding: 12px 28px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s;
            cursor: pointer;
          }
          .btn-outline:hover {
            border-color: var(--text-primary);
            background: rgba(255,255,255,0.05);
          }
          .gradient-text {
            background: linear-gradient(135deg, var(--accent-gold) 0%, #ef4444 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .nav-link {
            color: var(--text-primary);
            text-decoration: none;
            font-weight: 500;
            transition: color 0.3s;
          }
          .nav-link:hover { color: var(--accent-gold); }
          .footer-link {
            color: var(--footer-text);
            text-decoration: none;
            transition: color 0.2s;
          }
          .footer-link:hover { color: var(--accent-gold); }
          
          /* Animations */
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }
          .floating { animation: float 6s ease-in-out infinite; }
          .floating-delay { animation: float 8s ease-in-out infinite reverse; }
        `}
      </style>

      {/* Theme Toggle */}
      <button 
        onClick={() => setIsDark(!isDark)}
        style={{ position: 'fixed', bottom: 30, right: 30, zIndex: 1000, width: 50, height: 50, borderRadius: '50%', background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
        {isDark ? '☀️' : '🌙'}
      </button>

      {/* Navigation */}
      <nav style={{ 
        position: 'fixed', top: 0, width: '100%', zIndex: 100, 
        padding: '20px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: scrollY > 50 ? 'var(--card-bg)' : 'transparent',
        backdropFilter: scrollY > 50 ? 'blur(16px)' : 'none',
        borderBottom: scrollY > 50 ? '1px solid var(--border-color)' : '1px solid transparent',
        transition: 'all 0.3s',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-amber))', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: 20 }}>📚</div>
          <span style={{ fontWeight: 700, fontSize: 22, fontFamily: "'Playfair Display', serif" }}>UniLibrary</span>
        </div>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <a href="#home" className="nav-link">Home</a>
          <a href="#about" className="nav-link">About</a>
          <a href="#books" className="nav-link">Books</a>
          <a href="#contact" className="nav-link">Contact</a>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link to="/login" className="btn-outline">Sign In</Link>
          <Link to="/register" className="btn-gold">Join Now</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '120px 48px 60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0 }}></div>
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0 }}></div>

        <div style={{ display: 'flex', gap: 60, maxWidth: 1400, margin: '0 auto', width: '100%', position: 'relative', zIndex: 1, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 72, fontWeight: 800, fontFamily: "'Playfair Display', serif", lineHeight: 1.1, marginBottom: 24 }}>
              Discover. <br/>Borrow. <br/><span className="gradient-text">Learn.</span>
            </h1>
            <p style={{ fontSize: 20, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 40, maxWidth: 500 }}>
              Your university library at your fingertips. Access thousands of books, manage borrowings, and explore knowledge anytime.
            </p>
            <div style={{ display: 'flex', gap: 20 }}>
              <Link to="/register" className="btn-gold" style={{ fontSize: 16, padding: '16px 36px' }}>Join the Library</Link>
              <Link to="/login" className="btn-outline" style={{ fontSize: 16, padding: '16px 36px' }}>Sign In</Link>
            </div>
          </div>
          
          <div style={{ flex: 1, position: 'relative', height: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-card floating" style={{ width: '80%', height: 400, borderRadius: 24, padding: 30, display: 'flex', flexDirection: 'column', gap: 20, position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
                <div style={{ fontWeight: 600 }}>My Dashboard</div>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12 }}>User</div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Active Borrows</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-gold)' }}>3</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Overdue</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#ef4444' }}>0</div>
                </div>
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16 }}>
                 <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>Recent Book</div>
                 <div style={{ display: 'flex', gap: 12 }}>
                   <div style={{ width: 60, height: 80, background: 'var(--bg-primary)', borderRadius: 4 }}></div>
                   <div>
                     <div style={{ fontWeight: 600, fontSize: 14 }}>Calculus Vol 1</div>
                     <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Due in 5 days</div>
                   </div>
                 </div>
              </div>
            </div>

            <div className="glass-card floating-delay" style={{ position: 'absolute', top: 40, right: -20, width: 200, padding: 20, borderRadius: 16, zIndex: 3 }}>
               <div style={{ fontSize: 24, marginBottom: 8 }}>✨</div>
               <div style={{ fontWeight: 600, fontSize: 14 }}>New Arrival</div>
               <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Physics 101 Added</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section style={{ background: 'var(--bg-secondary)', padding: '60px 48px', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 40 }}>
          <div style={{ textAlign: 'center' }}>
            <div className="gradient-text" style={{ fontSize: 48, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>10,000+</div>
            <div style={{ color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, fontSize: 14, marginTop: 8 }}>Books in Collection</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="gradient-text" style={{ fontSize: 48, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>500+</div>
            <div style={{ color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, fontSize: 14, marginTop: 8 }}>Active Members</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="gradient-text" style={{ fontSize: 48, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>50+</div>
            <div style={{ color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, fontSize: 14, marginTop: 8 }}>New Arrivals This Month</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="gradient-text" style={{ fontSize: 48, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>98%</div>
            <div style={{ color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, fontSize: 14, marginTop: 8 }}>Member Satisfaction</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="about" style={{ padding: '120px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <h2 style={{ fontSize: 48, fontFamily: "'Playfair Display', serif", fontWeight: 700, marginBottom: 20 }}>Everything You Need in One Place</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 18, maxWidth: 600, margin: '0 auto' }}>A comprehensive suite of tools designed to make library management and book borrowing effortless.</p>
        </div>

        <div style={{ maxWidth: 1300, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 30 }}>
          <div className="glass-card" style={{ padding: 40, borderRadius: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 24 }}>🔍</div>
            <h3 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>Smart Book Search</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Search by title, author, ISBN, or category instantly using our advanced indexing algorithms.</p>
          </div>
          <div className="glass-card" style={{ padding: 40, borderRadius: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 24 }}>📱</div>
            <h3 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>Easy Borrowing</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Borrow and return books with a simple streamlined process directly from your digital dashboard.</p>
          </div>
          <div className="glass-card" style={{ padding: 40, borderRadius: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 24 }}>⏰</div>
            <h3 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>Reservation System</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Reserve books in advance and get notified the moment they become available for pickup.</p>
          </div>
          <div className="glass-card" style={{ padding: 40, borderRadius: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 24 }}>💳</div>
            <h3 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>Fine Management</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Track and pay library fines transparently online, with automated reminders for due dates.</p>
          </div>
          <div className="glass-card" style={{ padding: 40, borderRadius: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 24 }}>🟢</div>
            <h3 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>Real Time Availability</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>See which books are available right now instantly, reducing wasted trips to the library shelves.</p>
          </div>
          <div className="glass-card" style={{ padding: 40, borderRadius: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 24 }}>💻</div>
            <h3 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>Digital Dashboard</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Manage everything from your personal dashboard, whether you are a student, staff, or admin.</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '120px 48px', background: 'var(--bg-secondary)' }}>
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <h2 style={{ fontSize: 48, fontFamily: "'Playfair Display', serif", fontWeight: 700, marginBottom: 20 }}>Get Started in 3 Simple Steps</h2>
        </div>

        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
          {/* Connecting Line */}
          <div style={{ position: 'absolute', top: 40, left: 100, right: 100, height: 2, background: 'var(--border-color)', zIndex: 0 }}></div>
          
          <div style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1, padding: '0 20px' }}>
            <div style={{ width: 80, height: 80, background: 'var(--bg-primary)', border: '2px solid var(--accent-gold)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 24px' }}>📝</div>
            <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Create Your Account</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Register as a student with your university ID and personal details.</p>
          </div>

          <div style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1, padding: '0 20px' }}>
            <div style={{ width: 80, height: 80, background: 'var(--bg-primary)', border: '2px solid var(--accent-gold)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 24px' }}>✅</div>
            <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Get Approved</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Staff will review and approve your membership quickly to grant access.</p>
          </div>

          <div style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1, padding: '0 20px' }}>
            <div style={{ width: 80, height: 80, background: 'var(--bg-primary)', border: '2px solid var(--accent-gold)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 24px' }}>📚</div>
            <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Start Borrowing</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Browse thousands of books and borrow instantly from your dashboard.</p>
          </div>
        </div>
      </section>

      {/* Who it is for */}
      <section style={{ padding: '120px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <h2 style={{ fontSize: 48, fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>Built for Everyone in the University</h2>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40 }}>
          <div className="glass-card" style={{ padding: 40, borderRadius: 24, borderTop: '4px solid var(--accent-blue)', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 24 }}>🎓</div>
            <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Students</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 30, minHeight: 80 }}>Borrow books, make reservations, track due dates, and manage fines all in one convenient place.</p>
            <Link to="/register" className="btn-outline" style={{ display: 'inline-block', borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}>Join as Student</Link>
          </div>

          <div className="glass-card" style={{ padding: 40, borderRadius: 24, borderTop: '4px solid var(--accent-gold)', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 24 }}>👩‍🏫</div>
            <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Library Staff</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 30, minHeight: 80 }}>Approve members, manage borrowings, process returns, issue fines, and update the catalog efficiently.</p>
            <Link to="/login" className="btn-outline" style={{ display: 'inline-block', borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' }}>Staff Portal</Link>
          </div>

          <div className="glass-card" style={{ padding: 40, borderRadius: 24, borderTop: '4px solid #ef4444', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 24 }}>⚙️</div>
            <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Administrators</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 30, minHeight: 80 }}>Full system control, manage books, oversee staff and members, and generate detailed reports.</p>
            <Link to="/login" className="btn-outline" style={{ display: 'inline-block', borderColor: '#ef4444', color: '#ef4444' }}>Admin Access</Link>
          </div>
        </div>
      </section>

      {/* Featured Books */}
      <section id="books" style={{ padding: '120px 48px', background: 'var(--bg-secondary)' }}>
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <h2 style={{ fontSize: 48, fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>Recently Added to Our Collection</h2>
        </div>

        <div style={{ maxWidth: 1300, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 30 }}>
          {books.map((b, i) => (
            <div key={i} className="glass-card" style={{ borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 280, position: 'relative', background: '#e2e8f0' }}>
                {b.CoverImage ? (
                  <img src={b.CoverImage.startsWith('http') ? b.CoverImage : `http://localhost:4000${b.CoverImage}`} alt={b.Title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                   <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60 }}>📚</div>
                )}
                <div style={{ position: 'absolute', top: 16, right: 16, background: b.AvailableCopies > 0 ? '#047857' : '#b91c1c', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                  {b.AvailableCopies > 0 ? 'Available' : 'Borrowed'}
                </div>
              </div>
              <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 12, color: 'var(--accent-gold)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{b.CategoryName}</div>
                <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{b.Title}</h4>
                <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>By {b.Authors}</div>
                <button onClick={() => navigate('/login')} style={{ marginTop: 'auto', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>View Details</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '120px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <h2 style={{ fontSize: 48, fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>What Our Members Say</h2>
        </div>

        <div style={{ maxWidth: 1300, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 40 }}>
          <div className="glass-card" style={{ padding: 40, borderRadius: 24 }}>
            <div style={{ fontSize: 40, color: 'var(--accent-gold)', marginBottom: 20 }}>"</div>
            <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 30, color: 'var(--text-secondary)' }}>The library system made it so easy to find and borrow textbooks. I never miss a due date anymore thanks to the clean dashboard.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>AB</div>
              <div>
                <div style={{ fontWeight: 700 }}>Aisha Bekele</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Computer Science Department</div>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 40, borderRadius: 24 }}>
            <div style={{ fontSize: 40, color: 'var(--accent-gold)', marginBottom: 20 }}>"</div>
            <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 30, color: 'var(--text-secondary)' }}>Reserving books in advance saved me so much time during exam season. The interface is simply world-class and extremely fast.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>MT</div>
              <div>
                <div style={{ fontWeight: 700 }}>Mikael Tadesse</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Engineering Department</div>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 40, borderRadius: 24 }}>
            <div style={{ fontSize: 40, color: 'var(--accent-gold)', marginBottom: 20 }}>"</div>
            <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 30, color: 'var(--text-secondary)' }}>The fine tracking feature is transparent and fair. I always know exactly what I owe and how to pay it online.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>SH</div>
              <div>
                <div style={{ fontWeight: 700 }}>Sara Hailu</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Business Department</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section style={{ padding: '120px 48px', background: 'var(--bg-secondary)', textAlign: 'center', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 className="gradient-text" style={{ fontSize: 56, fontFamily: "'Playfair Display', serif", fontWeight: 800, marginBottom: 24 }}>Ready to Join the Library?</h2>
          <p style={{ fontSize: 20, color: 'var(--text-secondary)', marginBottom: 40 }}>Register today and get immediate access to thousands of books, journals, and academic resources tailored for your success.</p>
          <Link to="/register" className="btn-gold" style={{ fontSize: 18, padding: '18px 48px', display: 'inline-block', marginBottom: 20 }}>Create Your Account</Link>
          <div>
            <Link to="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Already a member? <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Sign In</span></Link>
          </div>
        </div>
      </section>

      {/* Footer Component */}
      <Footer isDark={isDark} />

    </div>
  )
}
