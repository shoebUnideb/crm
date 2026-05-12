import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// Atlassian Design System tokens
const blue = '#0052CC'
const blueHover = '#0065FF'
const navy = '#172B4D'
const textSubtle = '#5E6C84'
const bg = '#FAFBFC'
const border = '#DFE1E6'
const borderFocus = '#4C9AFF'
const surface = '#FFFFFF'
const errorBg = '#FFEBE6'
const errorBorder = '#FF8F73'
const errorText = '#DE350B'
const successBg = '#E3FCEF'
const successBorder = '#ABF5D1'
const successText = '#006644'

function EyeOpenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function AtlassianMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="11" cy="16" r="10" fill="#0052CC" opacity="0.9" />
      <circle cx="21" cy="16" r="10" fill="#4C9AFF" opacity="0.85" />
    </svg>
  )
}

export default function LoginPage() {
  const { login, loginAsGuest } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const successMessage = location.state?.message

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); return }
      login(data.token, data.user)
      navigate('/app/canvas-info')
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', background: bg, padding: '32px 16px',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
        <AtlassianMark size={40} />
        <span style={{ marginTop: 10, fontWeight: 700, fontSize: '1.125rem', color: navy, letterSpacing: '-0.01em' }}>
          bahnOS
        </span>
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 400, background: surface, borderRadius: 3, boxShadow: '0 1px 1px rgba(9,30,66,0.25), 0 0 0 1px rgba(9,30,66,0.08)', padding: '32px 40px 40px' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: navy, marginBottom: 20, textAlign: 'center', letterSpacing: '-0.01em' }}>
          Log in to your account
        </h1>

        {successMessage && (
          <div style={{ display: 'flex', gap: 10, padding: '10px 12px', background: successBg, border: `1px solid ${successBorder}`, borderRadius: 3, marginBottom: 16 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={successText} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span style={{ fontSize: '0.8125rem', color: successText }}>{successMessage}</span>
          </div>
        )}

        {error && (
          <div style={{ display: 'flex', gap: 10, padding: '10px 12px', background: errorBg, border: `1px solid ${errorBorder}`, borderRadius: 3, marginBottom: 16 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={errorText} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ fontSize: '0.8125rem', color: errorText }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: navy, marginBottom: 4 }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              autoComplete="email"
              style={{ width: '100%', border: `2px solid ${border}`, borderRadius: 3, padding: '9px 10px', fontSize: '0.875rem', color: navy, outline: 'none', boxSizing: 'border-box', background: bg }}
              onFocus={e => { e.currentTarget.style.borderColor = borderFocus; e.currentTarget.style.background = surface }}
              onBlur={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.background = bg }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: navy }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.8125rem', color: blue, textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
                onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
              >
                Can't log in?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                autoComplete="current-password"
                style={{ width: '100%', border: `2px solid ${border}`, borderRadius: 3, padding: '9px 40px 9px 10px', fontSize: '0.875rem', color: navy, outline: 'none', boxSizing: 'border-box', background: bg }}
                onFocus={e => { e.currentTarget.style.borderColor = borderFocus; e.currentTarget.style.background = surface }}
                onBlur={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.background = bg }}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: textSubtle, padding: 0, display: 'flex' }}>
                {showPassword ? <EyeOffIcon /> : <EyeOpenIcon />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '10px', borderRadius: 3, fontWeight: 600, fontSize: '0.9375rem',
              background: loading ? '#B3D4FF' : blue, color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = blueHover }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = blue }}
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
            <div style={{ flex: 1, height: 1, background: border }} />
            <span style={{ fontSize: '0.75rem', color: textSubtle }}>OR</span>
            <div style={{ flex: 1, height: 1, background: border }} />
          </div>

          <button type="button" onClick={() => { loginAsGuest(); navigate('/app/canvas-info') }}
            style={{ width: '100%', padding: '9px', borderRadius: 3, fontWeight: 500, fontSize: '0.875rem', background: bg, color: navy, border: `2px solid ${border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            onMouseEnter={e => { e.currentTarget.style.background = '#EBECF0'; e.currentTarget.style.borderColor = '#C1C7D0' }}
            onMouseLeave={e => { e.currentTarget.style.background = bg; e.currentTarget.style.borderColor = border }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            Continue as guest
          </button>
        </form>
      </div>

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <span style={{ fontSize: '0.8125rem', color: textSubtle }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: blue, fontWeight: 600, textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
            onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
          >
            Sign up for free
          </Link>
        </span>
      </div>

      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <Link to="/" style={{ fontSize: '0.75rem', color: textSubtle, textDecoration: 'none' }}
          onMouseEnter={e => { e.currentTarget.style.color = blue }}
          onMouseLeave={e => { e.currentTarget.style.color = textSubtle }}
        >
          ← Back to home
        </Link>
      </div>
    </div>
  )
}
