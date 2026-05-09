import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const PRODUCTS = [
  {
    id: 'canvas',
    label: 'Canvas',
    path: '/canvas',
    accent: '#6366f1',
    accentBg: '#eef2ff',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <line x1="12" y1="2" x2="12" y2="6"/>
        <line x1="12" y1="18" x2="12" y2="22"/>
        <line x1="4.22" y1="4.22" x2="7.05" y2="7.05"/>
        <line x1="16.95" y1="16.95" x2="19.78" y2="19.78"/>
        <line x1="2" y1="12" x2="6" y2="12"/>
        <line x1="18" y1="12" x2="22" y2="12"/>
        <line x1="4.22" y1="19.78" x2="7.05" y2="16.95"/>
        <line x1="16.95" y1="7.05" x2="19.78" y2="4.22"/>
      </svg>
    ),
  },
  {
    id: 'crm',
    label: 'CRM',
    path: '/crm',
    accent: '#10b981',
    accentBg: '#ecfdf5',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
]

export default function ProductSwitcher({ currentProduct }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const ref = useRef(null)

  const current = PRODUCTS.find(p => p.id === currentProduct) || PRODUCTS[0]

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    function handleEsc(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', handleOutside)
      document.addEventListener('keydown', handleEsc)
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '0 10px 0 4px',
          background: open ? 'rgba(255,255,255,0.12)' : 'none', border: 'none',
          borderRadius: 6, cursor: 'pointer', height: 34, color: '#fff',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'none' }}
        title="Switch product"
        aria-label="Switch product"
        aria-expanded={open}
      >
        {/* bahnOS logo mark */}
        <svg width="26" height="26" viewBox="0 0 30 30" fill="none">
          <circle cx="10" cy="15" r="9" fill="#0052CC" opacity="0.9"/>
          <circle cx="20" cy="15" r="9" fill="#4C9AFF" opacity="0.85"/>
        </svg>
        <span style={{ fontWeight: 700, fontSize: '1.0625rem', letterSpacing: '-0.01em' }}>
          bahnOS
        </span>
        {/* Product chip */}
        <span style={{
          fontSize: '0.6875rem', fontWeight: 600, padding: '2px 6px', borderRadius: 4,
          background: current.accent, color: '#fff', letterSpacing: '0.02em',
          textTransform: 'uppercase',
        }}>
          {current.label}
        </span>
        {/* Chevron */}
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ opacity: 0.55, marginLeft: 2, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0,
          background: '#fff', border: '1px solid #DFE1E6', borderRadius: 8,
          boxShadow: '0 8px 24px rgba(9,30,66,0.2)', minWidth: 200, zIndex: 300,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid #F4F5F7' }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
              Switch product
            </p>
          </div>

          {/* Product rows */}
          {PRODUCTS.map(product => {
            const isActive = product.id === currentProduct
            return (
              <button
                key={product.id}
                onClick={() => {
                  setOpen(false)
                  if (!isActive) navigate(product.path)
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '10px 14px', background: isActive ? product.accentBg : 'none',
                  border: 'none', cursor: isActive ? 'default' : 'pointer', textAlign: 'left',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#F4F5F7' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'none' }}
              >
                {/* Product icon with accent color */}
                <div style={{
                  width: 30, height: 30, borderRadius: 6, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', background: isActive ? product.accent : '#EBECF0',
                  color: isActive ? '#fff' : '#5E6C84', flexShrink: 0,
                }}>
                  {product.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.875rem', fontWeight: 600,
                    color: isActive ? product.accent : '#172B4D',
                  }}>
                    {product.label}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#97A0AF' }}>
                    {product.id === 'canvas' ? 'Mind maps & ticketing' : 'Sales pipeline & CRM'}
                  </div>
                </div>

                {/* Active checkmark */}
                {isActive && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={product.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            )
          })}

          {/* Footer divider */}
          <div style={{ height: 1, background: '#F4F5F7' }} />
          <div style={{ padding: '8px 14px' }}>
            <p style={{ fontSize: '0.6875rem', color: '#B3BAC5', margin: 0 }}>bahnOS · All products included</p>
          </div>
        </div>
      )}
    </div>
  )
}
