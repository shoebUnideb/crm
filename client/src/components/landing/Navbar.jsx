import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useAuthModal } from '../../context/AuthModalContext.jsx'

// ─── Design tokens ───────────────────────────────────────────────────────────
const bgNav        = '#172B4D'
const bgDropdown   = '#FFFFFF'
const bgHover      = '#F4F5F7'
const bgNavHover   = 'rgba(255,255,255,0.08)'
const borderColor  = '#DFE1E6'
const navDivider   = 'rgba(255,255,255,0.15)'
const textPrimary  = '#172B4D'
const textSecondary= '#5E6C84'
const textMuted    = '#97A0AF'
const textNav      = 'rgba(255,255,255,0.72)'
const textNavHover = '#FFFFFF'
const accentBlue   = '#0052CC'
const capsuleColor = '#6554C0'
const crmColor     = '#00875A'
const wikiColor    = '#FF8B00'

// ─── Product definitions ──────────────────────────────────────────────────────
const PRODUCTS = [
  {
    id: 'capsule',
    label: 'bahn Capsule',
    marketingPath: '/capsule',
    appPath: '/app/canvas',
    accent: capsuleColor,
    tagline: 'Visual operational workspace',
    description: 'Every node is a capsule — context, work, tickets, and docs in one place.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <line x1="12" y1="2" x2="12" y2="6"/>
        <line x1="12" y1="18" x2="12" y2="22"/>
        <line x1="4.22" y1="4.22" x2="7.05" y2="7.05"/>
        <line x1="16.95" y1="16.95" x2="19.78" y2="19.78"/>
        <line x1="2" y1="12" x2="6" y2="12"/>
        <line x1="18" y1="12" x2="22" y2="12"/>
      </svg>
    ),
  },
  {
    id: 'crm',
    label: 'CRM',
    marketingPath: '/crm-product',
    appPath: '/app/crm',
    accent: crmColor,
    tagline: 'Revenue connected to operations',
    description: 'Pipeline, deals, and contacts — linked directly to your operational work.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    id: 'wiki',
    label: 'Wiki',
    marketingPath: '/wiki',
    appPath: '/app/docs',
    accent: wikiColor,
    tagline: 'Documentation where work lives',
    description: 'Spaces, pages, and docs connected to the nodes and deals they serve.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
]

const SOLUTIONS = [
  { label: 'Sales teams',        to: '/solutions/sales' },
  { label: 'Engineering teams',  to: '/solutions/engineering' },
  { label: 'Operations teams',   to: '/solutions/ops' },
  { label: 'Startups',           to: '/solutions/startups' },
]

// ─── Products dropdown ────────────────────────────────────────────────────────
function ProductsDropdown({ onClose }) {
  const navigate = useNavigate()
  const ref = useRef(null)
  const [hovered, setHovered] = useState(null)

  useEffect(() => {
    function handleOutside(e) { if (ref.current && !ref.current.contains(e.target)) onClose() }
    function handleEsc(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  return (
    <div ref={ref} style={{
      position: 'absolute', top: 'calc(100% + 8px)', left: 0,
      background: bgDropdown, border: `1px solid ${borderColor}`, borderRadius: 10,
      boxShadow: '0 12px 32px rgba(9,30,66,0.14)', width: 560, zIndex: 300,
      overflow: 'hidden', display: 'flex',
    }}>
      {/* Left — product list */}
      <div style={{ flex: 1, padding: '8px 6px' }}>
        <p style={{ margin: '6px 10px 8px', fontSize: '0.625rem', fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Products
        </p>
        {PRODUCTS.map(product => (
          <button
            key={product.id}
            onClick={() => { onClose(); navigate(product.marketingPath) }}
            onMouseEnter={() => setHovered(product.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 10px', borderRadius: 7,
              background: hovered === product.id ? product.accent + '0C' : 'none',
              border: 'none', cursor: 'pointer', textAlign: 'left',
              width: '100%', transition: 'background 0.12s',
              borderLeft: `3px solid ${hovered === product.id ? product.accent : 'transparent'}`,
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: product.accent + '15',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: product.accent, flexShrink: 0,
            }}>
              {product.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: textPrimary, marginBottom: 2 }}>{product.label}</div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, lineHeight: 1.4 }}>{product.tagline}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={hovered === product.id ? product.accent : textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: hovered === product.id ? 1 : 0.4, transition: 'opacity 0.12s, stroke 0.12s' }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        ))}
      </div>

      {/* Right — Platform panel */}
      <div
        onClick={() => { onClose(); navigate('/platform') }}
        style={{
          width: 192, background: '#172B4D', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '20px 18px', flexShrink: 0,
        }}
      >
        <div>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>The Platform</div>
          <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
            Three products. One connected operational system.
          </div>
        </div>
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 6, marginTop: 20,
        }}>
          {[
            { dot: capsuleColor, label: 'Capsule' },
            { dot: crmColor,     label: 'CRM' },
            { dot: wikiColor,    label: 'Wiki' },
          ].map(({ dot, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, flexShrink: 0, display: 'inline-block' }} />
              <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{label}</span>
            </div>
          ))}
          <div style={{ marginTop: 6, fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.02em' }}>
            How they connect →
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Solutions dropdown ───────────────────────────────────────────────────────
function SolutionsDropdown({ onClose }) {
  const navigate = useNavigate()
  const ref = useRef(null)

  useEffect(() => {
    function handleOutside(e) { if (ref.current && !ref.current.contains(e.target)) onClose() }
    function handleEsc(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  return (
    <div ref={ref} style={{
      position: 'absolute', top: 'calc(100% + 8px)', left: 0,
      background: bgDropdown, border: `1px solid ${borderColor}`, borderRadius: 8,
      boxShadow: '0 8px 24px rgba(9,30,66,0.12)', width: 220, zIndex: 300,
      overflow: 'hidden', padding: 6,
    }}>
      {SOLUTIONS.map(item => (
        <button
          key={item.to}
          onClick={() => { onClose(); navigate(item.to) }}
          style={{
            display: 'block', width: '100%', padding: '9px 12px', borderRadius: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            textAlign: 'left', fontSize: '0.875rem', color: textSecondary,
            transition: 'background 0.12s, color 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = bgHover; e.currentTarget.style.color = textPrimary }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = textSecondary }}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

// ─── User dropdown ────────────────────────────────────────────────────────────
function UserDropdown({ user, logout, onClose }) {
  const navigate = useNavigate()
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const initials = user.email.slice(0, 2).toUpperCase()

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={onClose}
        style={{
          width: 32, height: 32, borderRadius: '50%', background: accentBlue,
          color: '#fff', border: `2px solid ${borderColor}`, cursor: 'pointer',
          fontWeight: 700, fontSize: '0.75rem', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          overflow: 'hidden', padding: 0,
        }}
      >
        {user.avatar
          ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          : initials
        }
      </button>
      <div style={{
        position: 'absolute', top: 'calc(100% + 8px)', right: 0,
        background: bgDropdown, border: `1px solid ${borderColor}`, borderRadius: 8,
        boxShadow: '0 8px 24px rgba(9,30,66,0.12)', minWidth: 220, zIndex: 300,
        overflow: 'hidden',
      }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: accentBlue, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {user.avatar
              ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.8125rem' }}>{initials}</span>
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: textPrimary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
            <p style={{ fontSize: '0.75rem', color: textSecondary, margin: '2px 0 0' }}>bahnOS account</p>
          </div>
        </div>
        {[
          { label: 'Open App', icon: '⊞', to: '/app/canvas' },
          { label: 'Settings', icon: '⚙', to: '/app/settings' },
        ].map(({ label, icon, to }) => (
          <button key={label} onClick={() => { navigate(to); onClose() }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.875rem', color: textSecondary, transition: 'background 0.12s, color 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.background = bgHover; e.currentTarget.style.color = textPrimary }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = textSecondary }}
          >
            <span style={{ fontSize: '0.875rem', width: 16, textAlign: 'center', opacity: 0.6 }}>{icon}</span>
            {label}
          </button>
        ))}
        <div style={{ height: 1, background: borderColor }} />
        <button onClick={() => { logout(); navigate('/'); onClose() }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.875rem', color: '#DE350B', transition: 'background 0.12s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FFEBE6' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
        >
          <span style={{ fontSize: '0.875rem', width: 16, textAlign: 'center' }}>↩</span>
          Sign out
        </button>
      </div>
    </div>
  )
}

// ─── Nav link component ───────────────────────────────────────────────────────
function NavLink({ to, children, isActive }) {
  return (
    <Link to={to} style={{
      color: isActive ? textNavHover : textNav,
      textDecoration: 'none', fontWeight: 500, fontSize: '0.8125rem',
      padding: '5px 10px', borderRadius: 4,
      background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
      transition: 'background 0.15s, color 0.15s', whiteSpace: 'nowrap',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = bgNavHover; e.currentTarget.style.color = textNavHover }}
      onMouseLeave={e => { e.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.12)' : 'transparent'; e.currentTarget.style.color = isActive ? textNavHover : textNav }}
    >
      {children}
    </Link>
  )
}

// ─── DropdownTrigger ──────────────────────────────────────────────────────────
function DropdownTrigger({ label, isOpen, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 4,
      color: isOpen ? textNavHover : textNav,
      background: isOpen ? bgNavHover : 'none',
      border: 'none', fontWeight: 500, fontSize: '0.8125rem',
      padding: '5px 10px', borderRadius: 4, cursor: 'pointer',
      transition: 'background 0.15s, color 0.15s', whiteSpace: 'nowrap',
    }}
      onMouseEnter={e => { if (!isOpen) { e.currentTarget.style.background = bgNavHover; e.currentTarget.style.color = textNavHover } }}
      onMouseLeave={e => { if (!isOpen) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = textNav } }}
    >
      {label}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ opacity: 0.5, transition: 'transform 0.15s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>
  )
}

// ─── Main Navbar ──────────────────────────────────────────────────────────────
export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const { openLogin, openRegister } = useAuthModal()
  const navigate = useNavigate()
  const location = useLocation()

  const [menuOpen,      setMenuOpen]      = useState(false)
  const [productsOpen,  setProductsOpen]  = useState(false)
  const [solutionsOpen, setSolutionsOpen] = useState(false)
  const [dropdownOpen,  setDropdownOpen]  = useState(false)

  const productsRef  = useRef(null)
  const solutionsRef = useRef(null)

  const isActive = (path) => location.pathname === path

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: bgNav, height: 42, display: 'flex', alignItems: 'center',
        padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 0 }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none', flexShrink: 0, padding: '0 10px 0 4px' }}>
            <svg width="24" height="24" viewBox="0 0 30 30" fill="none">
              <circle cx="10" cy="15" r="9" fill={accentBlue} opacity="0.9"/>
              <circle cx="20" cy="15" r="9" fill="#4C9AFF" opacity="0.85"/>
            </svg>
            <span style={{ fontWeight: 700, fontSize: '1.0625rem', color: '#fff', letterSpacing: '-0.01em' }}>
              bahnOS
            </span>
          </Link>

          <span style={{ width: 1, height: 18, background: navDivider, margin: '0 6px', flexShrink: 0 }} />

          {/* Desktop nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>

            <NavLink to="/" isActive={isActive('/')}>Home</NavLink>
            <NavLink to="/platform" isActive={isActive('/platform')}>Platform</NavLink>
            <NavLink to="/templates" isActive={isActive('/templates')}>Templates</NavLink>
            <NavLink to="/pricing" isActive={isActive('/pricing')}>Pricing</NavLink>

            {/* Solutions dropdown */}
            <div ref={solutionsRef} style={{ position: 'relative' }}>
              <DropdownTrigger label="Solutions" isOpen={solutionsOpen} onClick={() => { setSolutionsOpen(v => !v); setProductsOpen(false) }} />
              {solutionsOpen && <SolutionsDropdown onClose={() => setSolutionsOpen(false)} />}
            </div>

            {/* Products dropdown */}
            <div ref={productsRef} style={{ position: 'relative' }}>
              <DropdownTrigger label="Products" isOpen={productsOpen} onClick={() => { setProductsOpen(v => !v); setSolutionsOpen(false) }} />
              {productsOpen && (
                <ProductsDropdown onClose={() => setProductsOpen(false)} />
              )}
            </div>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', flexShrink: 0 }}>
            {isAuthenticated && user ? (
              <>
                <button onClick={() => navigate('/app/canvas')}
                  style={{
                    background: 'rgba(255,255,255,0.12)', color: '#fff',
                    border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4,
                    padding: '5px 14px', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)' }}
                >
                  Open Workstation
                </button>
                <span style={{ width: 1, height: 18, background: navDivider, margin: '0 2px', flexShrink: 0 }} />
                {dropdownOpen
                  ? <UserDropdown user={user} logout={logout} onClose={() => setDropdownOpen(false)} />
                  : (
                    <button onClick={() => setDropdownOpen(true)}
                      style={{ width: 30, height: 30, borderRadius: '50%', background: accentBlue, color: '#fff', border: '2px solid rgba(255,255,255,0.3)', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', padding: 0 }}
                    >
                      {user.avatar
                        ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        : user.email.slice(0, 2).toUpperCase()
                      }
                    </button>
                  )
                }
              </>
            ) : (
              <>
                <button onClick={openLogin}
                  style={{ color: textNav, background: 'none', border: 'none', fontWeight: 500, fontSize: '0.875rem', padding: '5px 12px', borderRadius: 4, cursor: 'pointer', transition: 'color 0.15s, background 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = bgNavHover }}
                  onMouseLeave={e => { e.currentTarget.style.color = textNav; e.currentTarget.style.background = 'none' }}
                >
                  Sign in
                </button>
                <button onClick={openRegister}
                  style={{ background: accentBlue, color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.875rem', borderRadius: 4, padding: '6px 16px', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#0065FF' }}
                  onMouseLeave={e => { e.currentTarget.style.background = accentBlue }}
                >
                  Get Started →
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, marginLeft: 8, color: textNav, display: 'none' }}
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {menuOpen
                ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
              }
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ position: 'fixed', top: 42, left: 0, right: 0, zIndex: 99, background: bgNav, borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '8px 20px 20px', maxHeight: 'calc(100vh - 42px)', overflowY: 'auto' }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 8px 6px', margin: 0 }}>Products</p>
          {PRODUCTS.map(product => (
            <button key={product.id}
              onClick={() => { setMenuOpen(false); navigate(product.marketingPath) }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 8px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div style={{ width: 30, height: 30, borderRadius: 6, background: product.accent + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', color: product.accent, flexShrink: 0 }}>
                {product.icon}
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff' }}>{product.label}</div>
                <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)' }}>{product.tagline}</div>
              </div>
            </button>
          ))}

          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />
          {[
            { label: 'Platform', to: '/platform' },
            { label: 'Templates', to: '/templates' },
            { label: 'Pricing', to: '/pricing' },
            { label: 'Roadmap', to: '/roadmap' },
            { label: 'Changelog', to: '/changelog' },
          ].map(link => (
            <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
              style={{ display: 'block', padding: '11px 8px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9375rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >{link.label}</Link>
          ))}

          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {isAuthenticated && user ? (
              <>
                <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)', padding: '4px 8px', margin: 0 }}>{user.email}</p>
                <Link to="/app/canvas" onClick={() => setMenuOpen(false)} style={{ display: 'block', textAlign: 'center', background: accentBlue, color: '#fff', textDecoration: 'none', fontWeight: 600, borderRadius: 4, padding: '11px' }}>Open Workstation</Link>
                <button onClick={() => { logout(); navigate('/'); setMenuOpen(false) }} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', color: '#FF8F73', textAlign: 'center', fontWeight: 500, fontSize: '0.875rem', padding: '10px', borderRadius: 4 }}>Sign out</button>
              </>
            ) : (
              <>
                <button onClick={() => { openLogin(); setMenuOpen(false) }} style={{ width: '100%', textAlign: 'center', color: '#fff', background: 'rgba(255,255,255,0.1)', fontWeight: 500, fontSize: '0.9375rem', padding: '11px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, cursor: 'pointer' }}>Sign in</button>
                <button onClick={() => { openRegister(); setMenuOpen(false) }} style={{ width: '100%', textAlign: 'center', background: accentBlue, color: '#fff', border: 'none', fontWeight: 600, borderRadius: 4, padding: '11px', cursor: 'pointer' }}>Get Started →</button>
              </>
            )}
          </div>
        </div>
      )}

      <div style={{ height: 42 }} />
    </>
  )
}
