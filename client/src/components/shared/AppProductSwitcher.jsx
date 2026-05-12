import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const PRODUCTS = [
  {
    id: 'canvas',
    label: 'Canvas',
    path: '/app/canvas-info',
    subtitle: 'Mind maps & planning',
    accent: '#6366f1',
    accentBg: '#eef2ff',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    path: '/app/crm-info',
    subtitle: 'Sales & pipeline',
    accent: '#10b981',
    accentBg: '#ecfdf5',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    id: 'docs',
    label: 'Wiki',
    path: '/app/docs',
    subtitle: 'Team wiki',
    accent: '#f59e0b',
    accentBg: '#fffbeb',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    id: 'signal',
    label: 'bahn Signal',
    path: null,
    subtitle: 'Team communication',
    accent: '#E91E8C',
    accentBg: '#fce4f3',
    comingSoon: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
]

export default function AppProductSwitcher({ currentProduct }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    function handleEsc(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        title="Switch product"
        aria-label="Switch product"
        aria-expanded={open}
        style={{
          width: 34, height: 34, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: open ? 'rgba(255,255,255,0.14)' : 'transparent',
          border: 'none', cursor: 'pointer', color: '#fff',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = open ? 'rgba(255,255,255,0.14)' : 'transparent' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.85 }}>
          <circle cx="5" cy="5" r="2.2"/>
          <circle cx="12" cy="5" r="2.2"/>
          <circle cx="19" cy="5" r="2.2"/>
          <circle cx="5" cy="12" r="2.2"/>
          <circle cx="12" cy="12" r="2.2"/>
          <circle cx="19" cy="12" r="2.2"/>
          <circle cx="5" cy="19" r="2.2"/>
          <circle cx="12" cy="19" r="2.2"/>
          <circle cx="19" cy="19" r="2.2"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          background: '#fff', border: '1px solid #DFE1E6', borderRadius: 12,
          boxShadow: '0 10px 32px rgba(9,30,66,0.2)', width: 280, zIndex: 300,
          overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid #F4F5F7' }}>
            <p style={{ margin: 0, fontSize: '0.6875rem', fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Products
            </p>
          </div>

          <div style={{ padding: 8 }}>
            {PRODUCTS.map(product => {
              const isActive = product.id === currentProduct
              return (
                <button
                  key={product.id}
                  onClick={() => {
                    if (product.comingSoon) return
                    setOpen(false)
                    if (!isActive) navigate(product.path)
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                    padding: '10px 12px', borderRadius: 8,
                    background: isActive ? product.accentBg : 'transparent',
                    border: isActive ? `1px solid ${product.accent}30` : '1px solid transparent',
                    cursor: product.comingSoon ? 'default' : isActive ? 'default' : 'pointer', textAlign: 'left',
                    transition: 'background 0.12s',
                    opacity: product.comingSoon ? 0.6 : 1,
                  }}
                  onMouseEnter={e => { if (!isActive && !product.comingSoon) e.currentTarget.style.background = '#F4F5F7' }}
                  onMouseLeave={e => { if (!isActive && !product.comingSoon) e.currentTarget.style.background = isActive ? product.accentBg : 'transparent' }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isActive ? product.accent : '#EBECF0',
                    color: isActive ? '#fff' : '#5E6C84', flexShrink: 0,
                  }}>
                    {product.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: isActive ? product.accent : '#172B4D', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {product.label}
                      {product.id === 'crm' && (
                        <span style={{ fontSize: '0.5rem', fontWeight: 700, background: '#0052CC', color: '#fff', padding: '1px 5px', borderRadius: 3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Beta</span>
                      )}
                      {product.comingSoon && (
                        <span style={{ fontSize: '0.5rem', fontWeight: 700, background: '#E91E8C', color: '#fff', padding: '1px 5px', borderRadius: 3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Soon</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#97A0AF', marginTop: 1 }}>
                      {product.subtitle}
                    </div>
                  </div>
                  {isActive && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={product.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
              )
            })}
          </div>

          <div style={{ padding: '8px 16px 10px', borderTop: '1px solid #F4F5F7' }}>
            <p style={{ margin: 0, fontSize: '0.6875rem', color: '#B3BAC5' }}>bahnOS · All products included</p>
          </div>
        </div>
      )}
    </div>
  )
}
