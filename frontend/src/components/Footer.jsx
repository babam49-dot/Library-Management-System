import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer({ isDark }) {
  return (
    <footer className={isDark ? "footer dark" : "footer light"} style={{ 
      background: 'var(--footer-bg)', 
      color: 'var(--footer-text)', 
      padding: '80px 48px 40px', 
      borderTop: '1px solid var(--border-color)',
      fontFamily: "'Inter', sans-serif",
      transition: 'all 0.5s ease'
    }}>
      <div style={{ maxWidth: 1300, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 60, paddingBottom: 60, borderBottom: '1px solid var(--border-color)' }}>
        
        {/* Brand Column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-amber))', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: 24, boxShadow: '0 8px 16px rgba(245, 158, 11, 0.2)' }}>
              📚
            </div>
            <span style={{ fontWeight: 800, fontSize: 28, color: 'var(--text-primary)', letterSpacing: -0.5, fontFamily: "'Playfair Display', serif" }}>UniLibrary</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
            Your university library at your fingertips. Access thousands of books, manage borrowings, and explore knowledge anytime, anywhere.
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={socialIcon}>📘</div>
            <div style={socialIcon}>🐦</div>
            <div style={socialIcon}>📸</div>
            <div style={socialIcon}>💼</div>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 700, marginBottom: 24, fontFamily: "'Playfair Display', serif" }}>Quick Links</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <li><a href="#home" className="footer-link">Home</a></li>
            <li><a href="#books" className="footer-link">Browse Books</a></li>
            <li><Link to="/login" className="footer-link">Sign In</Link></li>
            <li><Link to="/register" className="footer-link">Register</Link></li>
          </ul>
        </div>

        {/* For Users */}
        <div>
          <h4 style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 700, marginBottom: 24, fontFamily: "'Playfair Display', serif" }}>For Users</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <li><Link to="/login" className="footer-link">Student Portal</Link></li>
            <li><Link to="/login" className="footer-link">Staff Portal</Link></li>
            <li><Link to="/login" className="footer-link">Admin Portal</Link></li>
            <li><a href="#help" className="footer-link">Help Center</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 700, marginBottom: 24, fontFamily: "'Playfair Display', serif" }}>Contact Us</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <li style={{ display: 'flex', gap: 12, alignItems: 'flex-start', color: 'var(--text-secondary)', fontSize: 15 }}>
              <span style={{ fontSize: 18 }}>📍</span>
              <span>Addis Ababa University<br/>Addis Ababa, Ethiopia</span>
            </li>
            <li style={{ display: 'flex', gap: 12, alignItems: 'center', color: 'var(--text-secondary)', fontSize: 15 }}>
              <span style={{ fontSize: 18 }}>📞</span>
              <span>+251 11 123 4567</span>
            </li>
            <li style={{ display: 'flex', gap: 12, alignItems: 'center', color: 'var(--text-secondary)', fontSize: 15 }}>
              <span style={{ fontSize: 18 }}>✉️</span>
              <span>library@university.edu</span>
            </li>
            <li style={{ display: 'flex', gap: 12, alignItems: 'center', color: 'var(--text-secondary)', fontSize: 15 }}>
              <span style={{ fontSize: 18 }}>⏰</span>
              <span>Mon-Fri 8am - 6pm</span>
            </li>
          </ul>
        </div>

      </div>

      <div style={{ maxWidth: 1300, margin: '0 auto', paddingTop: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
          &copy; 2025 University Library Management System. All rights reserved.
        </p>
        <div style={{ display: 'flex', gap: 24, fontSize: 14 }}>
          <a href="#privacy" className="footer-link">Privacy Policy</a>
          <a href="#terms" className="footer-link">Terms of Service</a>
        </div>
      </div>
    </footer>
  )
}

const socialIcon = {
  width: 40, height: 40, borderRadius: '50%', background: 'var(--card-bg)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s ease', fontSize: 18
}
