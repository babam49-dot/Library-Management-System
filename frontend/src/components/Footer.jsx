import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer({ isDark }) {
  return (
    <footer className="footer" style={{ 
      background: '#050505', 
      color: '#f1f5f9', 
      padding: '80px 48px 40px', 
      borderTop: '1px solid rgba(255,255,255,0.1)',
      fontFamily: "'Inter', sans-serif",
      transition: 'all 0.5s ease'
    }}>
      <div style={{ maxWidth: 1300, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, paddingBottom: 60, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        
        {/* Brand Column */}
        <div style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-amber))', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: 24, boxShadow: '0 8px 16px rgba(245, 158, 11, 0.2)' }}>
              📚
            </div>
            <span style={{ fontWeight: 800, fontSize: 28, color: '#ffffff', letterSpacing: -0.5, fontFamily: "'Playfair Display', serif" }}>UniLibrary</span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.7, marginBottom: 24, maxWidth: 400 }}>
            Your university library at your fingertips. Access thousands of books, manage borrowings, and explore knowledge anytime, anywhere.
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={socialIcon}>📘</div>
            <div style={socialIcon}>📸</div>
            <div style={socialIcon}>💼</div>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: 18, fontWeight: 700, marginBottom: 24, fontFamily: "'Playfair Display', serif" }}>Quick Links</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <li><a href="#home" className="footer-link">Home</a></li>
            <li><a href="#books" className="footer-link">Browse Books</a></li>
            <li><Link to="/login" className="footer-link">Sign In</Link></li>
            <li><Link to="/register" className="footer-link">Register</Link></li>
          </ul>
        </div>

        {/* For Users */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: 18, fontWeight: 700, marginBottom: 24, fontFamily: "'Playfair Display', serif" }}>For Users</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <li><Link to="/login" className="footer-link">Student Portal</Link></li>
            <li><Link to="/login" className="footer-link">Staff Portal</Link></li>
            <li><Link to="/login" className="footer-link">Admin Portal</Link></li>
            <li><a href="#help" className="footer-link">Help Center</a></li>
          </ul>
        </div>

        {/* Contact Info Column (Beside others) */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: 18, fontWeight: 700, marginBottom: 24, fontFamily: "'Playfair Display', serif" }}>Connect</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <li style={{ display: 'flex', gap: 12, alignItems: 'center', color: '#94a3b8', fontSize: 14 }}>
              <span style={{ fontSize: 18 }}>📍</span>
              <span>AAIT 5-Kilo, Addis Ababa</span>
            </li>
            <li style={{ display: 'flex', gap: 12, alignItems: 'center', color: '#94a3b8', fontSize: 14 }}>
              <span style={{ fontSize: 18 }}>📞</span>
              <span>+251 11 123 4567</span>
            </li>
            <li style={{ display: 'flex', gap: 12, alignItems: 'center', color: '#94a3b8', fontSize: 14 }}>
              <span style={{ fontSize: 18 }}>✉️</span>
              <span>library@university.edu</span>
            </li>
            <li style={{ display: 'flex', gap: 12, alignItems: 'center', color: '#94a3b8', fontSize: 14 }}>
              <span style={{ fontSize: 18 }}>⏰</span>
              <span>Open 24/7 for All</span>
            </li>
          </ul>
        </div>
      </div>

      <div style={{ maxWidth: 1300, margin: '0 auto', paddingTop: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
        <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>
          &copy; {new Date().getFullYear()} University Library Management System. All rights reserved.
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
  width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s ease', fontSize: 18
}
