import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLES = [
  { id: 3, label: 'Member', sub: 'I want to borrow books', icon: '📚', color: '#e07b39', bg: '#fdf4e7' },
  { id: 2, label: 'Staff', sub: 'I work at the library', icon: '🗂️', color: '#c4a35a', bg: '#fcf8e3' },
]

export default function SignUp() {
  const [selectedRole, setSelectedRole] = useState(3)
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', phone: '',
    universityId: '', department: '', // Member specific
    jobTitle: '' // Staff specific
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { registerStaff, registerMember } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (selectedRole === 2) {
        const msg = await registerStaff(formData)
        setSuccess(msg)
      } else {
        const msg = await registerMember(formData)
        setSuccess(msg)
      }
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Georgia', serif", background: '#1a0f0a' }}>
      {/* Left panel */}
      <div style={{
        width: '42%', background: 'linear-gradient(160deg, #2d1a0e 0%, #1a0f0a 100%)',
        padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        borderRight: '1px solid #3d2010'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
            <div style={{ width: 36, height: 36, background: '#c4813a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: 16 }}>L</div>
            <span style={{ color: '#e8d5b0', fontWeight: 700, fontSize: 18, letterSpacing: 0.5 }}>Lenket Library</span>
          </div>
          <h1 style={{ color: '#fff', fontSize: 42, fontWeight: 700, lineHeight: 1.1, marginBottom: 12 }}>
            Join the<br />
            <span style={{ color: '#c4813a', fontStyle: 'italic' }}>community.</span>
          </h1>
          <p style={{ color: '#a08060', fontSize: 15, lineHeight: 1.6, marginTop: 16, maxWidth: '85%' }}>
            Create an account to borrow books, reserve digital media, or manage the library catalog.
          </p>
        </div>

        <div style={{ marginTop: 40, color: '#6b4a2a', fontSize: 13, fontStyle: 'italic' }}>
          "The only thing that you absolutely have to know, is the location of the library."
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, background: '#fcfaf7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 48px', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 500 }}>
          <h2 style={{ fontSize: 30, fontWeight: 700, color: '#1a0f0a', marginBottom: 6 }}>Create an Account</h2>
          <p style={{ color: '#8b6a4a', fontSize: 15, marginBottom: 28 }}>Choose your role and fill in your details below.</p>

          <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
            {ROLES.map(r => (
              <button key={r.id} type="button" onClick={() => setSelectedRole(r.id)}
                style={{
                  flex: 1, padding: '16px', borderRadius: 12, 
                  border: selectedRole === r.id ? `2px solid ${r.color}` : '1px solid #e5d5c5',
                  background: selectedRole === r.id ? r.bg : '#fff', cursor: 'pointer', textAlign: 'center',
                  transition: 'all 0.2s'
                }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{r.icon}</div>
                <div style={{ fontWeight: 700, color: '#1a0f0a' }}>{r.label}</div>
                <div style={{ fontSize: 12, color: '#8b6a4a', marginTop: 4 }}>{r.sub}</div>
              </button>
            ))}
          </div>

          {success ? (
            <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#047857', padding: 24, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✨</div>
              <p style={{ fontWeight: 700, marginBottom: 8, fontSize: 18 }}>Registration Successful!</p>
              <p style={{ fontSize: 15 }}>{success}</p>
              <p style={{ fontSize: 13, marginTop: 16, color: '#059669', fontStyle: 'italic' }}>Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#3d2010', display: 'block', marginBottom: 8 }}>First Name</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required style={inputStyle} placeholder="Jane" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#3d2010', display: 'block', marginBottom: 8 }}>Last Name</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required style={inputStyle} placeholder="Doe" />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#3d2010', display: 'block', marginBottom: 8 }}>Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required style={inputStyle} placeholder="jane@uni.edu" />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#3d2010', display: 'block', marginBottom: 8 }}>Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={6} style={inputStyle} placeholder="Min. 6 characters" />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#3d2010', display: 'block', marginBottom: 8 }}>Phone Number <span style={{ color: '#a08060', fontWeight: 400 }}>(Optional)</span></label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} style={inputStyle} placeholder="+1 234 567 890" />
              </div>

              {selectedRole === 3 && (
                <div style={{ display: 'flex', gap: 16, background: '#fdf4e7', padding: 16, borderRadius: 12, border: '1px dashed #d4b896', marginTop: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#3d2010', display: 'block', marginBottom: 8 }}>University ID</label>
                    <input type="text" name="universityId" value={formData.universityId} onChange={handleChange} required style={inputStyle} placeholder="e.g. 1029384" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#3d2010', display: 'block', marginBottom: 8 }}>Department</label>
                    <input type="text" name="department" value={formData.department} onChange={handleChange} style={inputStyle} placeholder="e.g. Computer Science" />
                  </div>
                </div>
              )}

              {selectedRole === 2 && (
                <div style={{ background: '#fcf8e3', padding: 16, borderRadius: 12, border: '1px dashed #d4b896', marginTop: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#3d2010', display: 'block', marginBottom: 8 }}>Job Title</label>
                  <input type="text" name="jobTitle" value={formData.jobTitle} onChange={handleChange} required style={inputStyle} placeholder="e.g. Circulation Assistant" />
                </div>
              )}

              {error && <div style={{ color: '#b91c1c', fontSize: 13, background: '#fef2f2', padding: 10, borderRadius: 8, border: '1px solid #fca5a5' }}>⚠️ {error}</div>}

              <button type="submit" disabled={loading} style={{ background: selectedRole === 2 ? '#a67c00' : '#8b5e3c', color: '#fff', padding: 16, borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 16, transition: 'background 0.2s' }}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}

          <div style={{ display: 'flex', alignItems: 'center', margin: '32px 0', color: '#d4b896' }}>
            <div style={{ flex: 1, height: 1, background: '#e5d5c5' }}></div>
            <span style={{ padding: '0 12px', fontSize: 13, fontStyle: 'italic' }}>or</span>
            <div style={{ flex: 1, height: 1, background: '#e5d5c5' }}></div>
          </div>

          <p style={{ textAlign: 'center', fontSize: 14, color: '#8b6a4a' }}>
            Already have an account? <Link to="/login" style={{ color: selectedRole === 2 ? '#a67c00' : '#8b5e3c', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '12px 16px', borderRadius: 8, border: '1.5px solid #e5d5c5', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', background: '#fff', color: '#1a0f0a'
}
