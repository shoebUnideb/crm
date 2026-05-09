import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

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

function calcStrength(pwd) {
  let s = 0
  if (pwd.length >= 8) s++
  if (/[A-Z]/.test(pwd)) s++
  if (/[0-9]/.test(pwd)) s++
  if (/[^A-Za-z0-9]/.test(pwd)) s++
  return s
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLORS = ['', '#DE350B', '#FF8B00', '#00875A', '#0052CC']

function PasswordStrengthBar({ password }) {
  if (!password) return null
  const s = calcStrength(password)
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ height: 4, flex: 1, borderRadius: 2, background: i <= s ? STRENGTH_COLORS[s] : border }} />
        ))}
      </div>
      {s > 0 && <p style={{ fontSize: '0.75rem', color: STRENGTH_COLORS[s], fontWeight: 500 }}>{STRENGTH_LABELS[s]}</p>}
    </div>
  )
}

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    if (!agreed) { setError('Please agree to the Terms of Service to continue'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed'); return }
      login(data.token, data.user)
      navigate('/canvas')
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  const inputBase = { width: '100%', border: `2px solid ${border}`, borderRadius: 3, padding: '9px 10px', fontSize: '0.875rem', color: navy, outline: 'none', boxSizing: 'border-box', background: bg }

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
      <div style={{ width: '100%', maxWidth: 420, background: surface, borderRadius: 3, boxShadow: '0 1px 1px rgba(9,30,66,0.25), 0 0 0 1px rgba(9,30,66,0.08)', padding: '32px 40px 40px' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: navy, marginBottom: 4, textAlign: 'center', letterSpacing: '-0.01em' }}>
          Create your account
        </h1>
        <p style={{ fontSize: '0.8125rem', color: textSubtle, textAlign: 'center', marginBottom: 20 }}>
          Free forever. No credit card required.
        </p>

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
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: navy, marginBottom: 4 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Enter your email" autoComplete="email"
              style={inputBase}
              onFocus={e => { e.currentTarget.style.borderColor = borderFocus; e.currentTarget.style.background = surface }}
              onBlur={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.background = bg }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: navy, marginBottom: 4 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Create a password (min. 8 chars)" autoComplete="new-password"
                style={{ ...inputBase, paddingRight: 38 }}
                onFocus={e => { e.currentTarget.style.borderColor = borderFocus; e.currentTarget.style.background = surface }}
                onBlur={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.background = bg }}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: textSubtle, padding: 0, display: 'flex' }}>
                {showPassword ? <EyeOffIcon /> : <EyeOpenIcon />}
              </button>
            </div>
            <PasswordStrengthBar password={password} />
          </div>

          {/* Confirm password */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: navy, marginBottom: 4 }}>Confirm password</label>
            <div style={{ position: 'relative' }}>
              <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Confirm your password" autoComplete="new-password"
                style={{ ...inputBase, paddingRight: 38, ...(confirmPassword && confirmPassword !== password ? { borderColor: errorBorder } : {}) }}
                onFocus={e => { e.currentTarget.style.borderColor = confirmPassword !== password ? errorBorder : borderFocus; e.currentTarget.style.background = surface }}
                onBlur={e => { e.currentTarget.style.borderColor = confirmPassword && confirmPassword !== password ? errorBorder : border; e.currentTarget.style.background = bg }}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: textSubtle, padding: 0, display: 'flex' }}>
                {showConfirm ? <EyeOffIcon /> : <EyeOpenIcon />}
              </button>
            </div>
            {confirmPassword && confirmPassword !== password && (
              <p style={{ marginTop: 4, fontSize: '0.75rem', color: errorText }}>Passwords do not match</p>
            )}
            {confirmPassword && confirmPassword === password && (
              <p style={{ marginTop: 4, fontSize: '0.75rem', color: '#006644', fontWeight: 500 }}>✓ Passwords match</p>
            )}
          </div>

          {/* Terms */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 20 }}>
            <div onClick={() => setAgreed(v => !v)} style={{
              marginTop: 2, width: 16, height: 16, borderRadius: 2, flexShrink: 0, cursor: 'pointer',
              border: agreed ? 'none' : `2px solid ${border}`,
              background: agreed ? blue : surface,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {agreed && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </div>
            <p style={{ fontSize: '0.8125rem', color: textSubtle, lineHeight: 1.5, cursor: 'pointer', userSelect: 'none', margin: 0 }} onClick={() => setAgreed(v => !v)}>
              I agree to the{' '}
              <a href="#" onClick={e => e.stopPropagation()} style={{ color: blue, textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
                onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
              >Terms of Service</a>
            </p>
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '10px', borderRadius: 3, fontWeight: 600, fontSize: '0.9375rem',
            background: loading ? '#B3D4FF' : blue, color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = blueHover }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = blue }}
          >
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>
      </div>

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <span style={{ fontSize: '0.8125rem', color: textSubtle }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: blue, fontWeight: 600, textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
            onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
          >
            Log in
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
