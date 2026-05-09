import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useAuthModal } from '../../context/AuthModalContext.jsx'
import { NAV_LINKS } from '../../config/navLinks.js'

const PRODUCTS = [
  {
    id: 'canvas',
    label: 'Canvas',
    path: '/canvas',
    accent: '#6366f1',
    accentBg: '#eef2ff',
    tagline: 'Mind maps & ticketing',
    description: 'Visually plan and track work on an infinite canvas. Export to Jira in one click.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
        <line x1="4.22" y1="4.22" x2="7.05" y2="7.05"/><line x1="16.95" y1="16.95" x2="19.78" y2="19.78"/>
        <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
        <line x1="4.22" y1="19.78" x2="7.05" y2="16.95"/><line x1="16.95" y1="7.05" x2="19.78" y2="4.22"/>
      </svg>
    ),
  },
  {
    id: 'crm',
    label: 'CRM',
    path: '/crm',
    accent: '#10b981',
    accentBg: '#ecfdf5',
    tagline: 'Sales pipeline & deals',
    description: 'Manage your pipeline, track deals, and link customers directly to your Canvas nodes.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
]

function ProductsDropdown({ isAuthenticated, onOpenRegister, onClose }) {
  const navigate = useNavigate()
  const ref = useRef(null)

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    function handleEsc(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  function handleProductClick(product) {
    onClose()
    if (isAuthenticated) {
      navigate(product.path)
    } else {
      onOpenRegister()
    }
  }

  return (
    <div ref={ref} style={{
      position: 'absolute', top: 'calc(100% + 10px)', left: 0,
      background: '#fff', border: '1px solid #DFE1E6', borderRadius: 10,
      boxShadow: '0 12px 40px rgba(9,30,66,0.18)', width: 500, zIndex: 300,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid #F4F5F7' }}>
        <p style={{ margin: 0, fontSize: '0.6875rem', fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Products — included in every plan
        </p>
      </div>

      {/* Product cards */}
      <div style={{ padding: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {PRODUCTS.map(product => (
          <button
            key={product.id}
            onClick={() => handleProductClick(product)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
              gap: 8, padding: '14px 16px', borderRadius: 8, background: 'none',
              border: '1px solid transparent', cursor: 'pointer', textAlign: 'left',
              transition: 'background 0.12s, border-color 0.12s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = product.accentBg
              e.currentTarget.style.borderColor = product.accent + '40'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'none'
              e.currentTarget.style.borderColor = 'transparent'
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 8, background: product.accentBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: product.accent, flexShrink: 0,
            }}>
              {product.icon}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#172B4D' }}>{product.label}</span>
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: product.accent, color: '#fff' }}>
                  {product.tagline}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#5E6C84', lineHeight: 1.5 }}>
                {product.description}
              </p>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: product.accent, marginTop: 2 }}>
              {isAuthenticated ? `Open ${product.label} →` : 'Get started free →'}
            </span>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '8px 16px 10px', borderTop: '1px solid #F4F5F7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ margin: 0, fontSize: '0.6875rem', color: '#B3BAC5' }}>
          All products included · No separate subscriptions
        </p>
        {!isAuthenticated && (
          <button
            onClick={() => { onClose(); onOpenRegister() }}
            style={{ fontSize: '0.75rem', fontWeight: 600, color: blue, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Sign up free
          </button>
        )}
      </div>
    </div>
  )
}

const blue = '#0052CC'
const blueHover = '#0065FF'
const navy = '#172B4D'
const textSubtle = '#5E6C84'
const bg = '#FAFBFC'
const border = '#DFE1E6'
const surface = '#FFFFFF'

function UserDropdown({ user, logout, onClose }) {
  const navigate = useNavigate()
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const initials = user.email.slice(0, 2).toUpperCase()

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => onClose()}
        style={{
          width: 32, height: 32, borderRadius: '50%', background: blue,
          color: '#fff', border: '2px solid rgba(255,255,255,0.3)', cursor: 'pointer', fontWeight: 700,
          fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, overflow: 'hidden', padding: 0,
        }}
      >
        {user.avatar
          ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          : initials
        }
      </button>
      <div style={{
        position: 'absolute', top: 'calc(100% + 8px)', right: 0,
        background: surface, border: `1px solid ${border}`, borderRadius: 3,
        boxShadow: '0 4px 8px rgba(9,30,66,0.25)', minWidth: 200, zIndex: 200,
        overflow: 'hidden',
      }}>
        {/* User info */}
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${border}`, background: bg, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: blue, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {user.avatar
              ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.8125rem' }}>{initials}</span>
            }
          </div>
          <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: navy, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.email}
          </p>
          <p style={{ fontSize: '0.75rem', color: textSubtle, margin: '2px 0 0' }}>bahnOS account</p>
          </div>
        </div>
        {/* Links */}
        {[
          { label: 'Open App', icon: '⊞', to: '/canvas' },
          { label: 'Profile & Settings', icon: '⚙', to: '/settings' },
        ].map(({ label, icon, to }) => (
          <button key={label} onClick={() => { navigate(to); onClose() }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.875rem', color: navy }}
            onMouseEnter={e => { e.currentTarget.style.background = bg }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
          >
            <span style={{ fontSize: '0.875rem', width: 16, textAlign: 'center' }}>{icon}</span>
            {label}
          </button>
        ))}
        <div style={{ height: 1, background: border }} />
        <button onClick={() => { logout(); navigate('/'); onClose() }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.875rem', color: '#DE350B' }}
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

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const { openLogin, openRegister } = useAuthModal()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [productsOpen, setProductsOpen] = useState(false)
  const productsRef = useRef(null)

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: navy, height: 56, display: 'flex', alignItems: 'center',
        padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 0 }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none', padding: '0 10px 0 4px', flexShrink: 0 }}>
            <svg width="28" height="28" viewBox="0 0 30 30" fill="none">
              <circle cx="10" cy="15" r="9" fill="#0052CC" opacity="0.9"/>
              <circle cx="20" cy="15" r="9" fill="#4C9AFF" opacity="0.85"/>
            </svg>
            <span style={{ fontWeight: 700, fontSize: '1.0625rem', color: '#fff', letterSpacing: '-0.01em' }}>
              bahnOS
            </span>
          </Link>

          <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.18)', margin: '0 6px', flexShrink: 0 }} />

          {/* Desktop nav links */}
          <div className="hidden md:flex" style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>

            {/* Products dropdown trigger */}
            <div ref={productsRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setProductsOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  color: productsOpen ? '#fff' : 'rgba(255,255,255,0.55)',
                  background: productsOpen ? 'rgba(255,255,255,0.1)' : 'none',
                  border: 'none', fontWeight: 500, fontSize: '0.8125rem',
                  padding: '5px 10px', borderRadius: 5, cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { if (!productsOpen) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff' } }}
                onMouseLeave={e => { if (!productsOpen) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' } }}
              >
                Products
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ opacity: 0.6, transition: 'transform 0.15s', transform: productsOpen ? 'rotate(180deg)' : 'none' }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {productsOpen && (
                <ProductsDropdown
                  isAuthenticated={isAuthenticated}
                  onOpenRegister={openRegister}
                  onClose={() => setProductsOpen(false)}
                />
              )}
            </div>

            {NAV_LINKS.map(link => {
              const isActive = location.pathname === link.to
              return (
                <Link key={link.to} to={link.to}
                  style={{
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                    textDecoration: 'none', fontWeight: 500,
                    fontSize: '0.8125rem', padding: '5px 10px', borderRadius: 5,
                    background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.1)' : 'transparent'; e.currentTarget.style.color = isActive ? '#fff' : 'rgba(255,255,255,0.55)' }}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* Desktop right side */}
          <div className="hidden md:flex" style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
            {isAuthenticated && user ? (
              <>
                <button onClick={() => navigate('/canvas')}
                  style={{ background: blue, color: '#fff', border: 'none', borderRadius: 3, padding: '6px 14px', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = blueHover }}
                  onMouseLeave={e => { e.currentTarget.style.background = blue }}
                >
                  Open App
                </button>
                {dropdownOpen
                  ? <UserDropdown user={user} logout={logout} onClose={() => setDropdownOpen(false)} />
                  : (
                    <button onClick={() => setDropdownOpen(true)}
                      style={{ width: 32, height: 32, borderRadius: '50%', background: blue, color: '#fff', border: '2px solid rgba(255,255,255,0.3)', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', padding: 0 }}
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
                  style={{ color: '#fff', background: 'none', border: 'none', fontWeight: 400, fontSize: '0.875rem', padding: '6px 12px', borderRadius: 3, cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  Log in
                </button>
                <button onClick={openRegister}
                  style={{ background: blue, color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.875rem', borderRadius: 3, padding: '6px 16px', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = blueHover }}
                  onMouseLeave={e => { e.currentTarget.style.background = blue }}
                >
                  Get it free
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden" onClick={() => setMenuOpen(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, marginLeft: 'auto', color: '#fff' }}
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ position: 'fixed', top: 56, left: 0, right: 0, zIndex: 99, background: navy, borderBottom: '2px solid rgba(255,255,255,0.1)', padding: '8px 20px 16px' }}>
          {/* Products section in mobile */}
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 8px 6px', margin: 0 }}>Products</p>
          {PRODUCTS.map(product => (
            <button
              key={product.id}
              onClick={() => {
                setMenuOpen(false)
                if (isAuthenticated) navigate(product.path)
                else openRegister()
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '9px 8px', background: 'none', border: 'none', cursor: 'pointer',
                textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div style={{ width: 28, height: 28, borderRadius: 6, background: product.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: product.accent, flexShrink: 0 }}>
                {product.icon}
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff' }}>{product.label}</div>
                <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)' }}>{product.tagline}</div>
              </div>
            </button>
          ))}

          <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />

          {NAV_LINKS.map(link => (
            <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
              style={{ display: 'block', padding: '10px 8px', color: 'rgba(255,255,255,0.82)', textDecoration: 'none', fontWeight: 400, fontSize: '0.9375rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
            >{link.label}</Link>
          ))}
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.12)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {isAuthenticated && user ? (
              <>
                <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', padding: '4px 8px' }}>{user.email}</p>
                <Link to="/canvas" onClick={() => setMenuOpen(false)} style={{ display: 'block', textAlign: 'center', background: blue, color: '#fff', textDecoration: 'none', fontWeight: 600, borderRadius: 3, padding: '10px' }}>Open App</Link>
                <Link to="/settings" onClick={() => setMenuOpen(false)} style={{ display: 'block', textAlign: 'center', color: 'rgba(255,255,255,0.82)', textDecoration: 'none', fontWeight: 500, padding: '8px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 3 }}>Settings</Link>
                <button onClick={() => { logout(); navigate('/'); setMenuOpen(false) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF8F73', textAlign: 'center', fontWeight: 500, fontSize: '0.9375rem', padding: '8px' }}>Sign out</button>
              </>
            ) : (
              <>
                <button onClick={() => { openLogin(); setMenuOpen(false) }} style={{ display: 'block', width: '100%', textAlign: 'center', color: '#fff', background: 'none', fontWeight: 500, fontSize: '0.9375rem', padding: '10px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 3, cursor: 'pointer' }}>Log in</button>
                <button onClick={() => { openRegister(); setMenuOpen(false) }} style={{ display: 'block', width: '100%', textAlign: 'center', background: blue, color: '#fff', border: 'none', fontWeight: 600, borderRadius: 3, padding: '10px', cursor: 'pointer' }}>Get it free</button>
              </>
            )}
          </div>
        </div>
      )}

      <div style={{ height: 56 }} />
    </>
  )
}
