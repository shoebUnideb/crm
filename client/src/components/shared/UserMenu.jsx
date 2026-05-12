import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function UserMenu({ user, logout }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const initials = user.email.slice(0, 2).toUpperCase()

  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(v => !v)} style={{
        width: 32, height: 32, borderRadius: '50%', background: '#0052CC',
        color: '#fff', border: open ? '2px solid #4C9AFF' : '2px solid rgba(255,255,255,0.3)',
        cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        overflow: 'hidden', padding: 0,
      }}>
        {user.avatar
          ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          : initials
        }
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: '#fff', border: '1px solid #DFE1E6', borderRadius: 8,
          boxShadow: '0 8px 24px rgba(9,30,66,0.2)', minWidth: 200, zIndex: 200, overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #DFE1E6', background: '#FAFBFC', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: '#0052CC', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {user.avatar
                ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.8125rem' }}>{initials}</span>
              }
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#172B4D', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#5E6C84', margin: '2px 0 0' }}>bahnOS account</p>
            </div>
          </div>
          {[
            { label: 'Home', onClick: () => { navigate('/'); setOpen(false) } },
            { label: 'Settings', onClick: () => { navigate('/app/settings'); setOpen(false) } },
            ...(user.isAdmin ? [{ label: 'Admin Panel', onClick: () => { navigate('/app/admin'); setOpen(false) }, color: '#0052CC' }] : []),
          ].map(({ label, onClick, color }) => (
            <button key={label} onClick={onClick} style={{
              display: 'block', width: '100%', padding: '10px 16px', background: 'none',
              border: 'none', cursor: 'pointer', textAlign: 'left',
              fontSize: '0.875rem',
              color: color || '#172B4D',
              fontWeight: color ? 600 : 'normal',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F4F5F7' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
            >
              {label}
            </button>
          ))}
          <div style={{ height: 1, background: '#DFE1E6' }} />
          <button onClick={() => { logout(); navigate('/'); setOpen(false) }} style={{
            display: 'block', width: '100%', padding: '10px 16px', background: 'none',
            border: 'none', cursor: 'pointer', textAlign: 'left',
            fontSize: '0.875rem', color: '#DE350B',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FFEBE6' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
