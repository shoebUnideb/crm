import React, { useState, useRef, useEffect } from 'react'

const ROLE_LABELS = { admin: 'Admin', edit: 'Editor', view: 'Viewer' }
const ROLE_COLORS = { admin: '#7C3AED', edit: '#2563EB', view: '#6B7280' }

export default function NotificationBell({ invites, onAccept, onDecline, onProjectJoined }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState({}) // token → 'accepting' | 'declining'
  const [done, setDone] = useState({}) // token → 'accepted' | 'declined'
  const panelRef = useRef(null)
  const count = invites.length

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [open])

  // Auto-open when a new invite arrives and panel is closed
  const prevCountRef = useRef(count)
  useEffect(() => {
    if (count > prevCountRef.current) setOpen(true)
    prevCountRef.current = count
  }, [count])

  async function handleAccept(invite) {
    setBusy(b => ({ ...b, [invite.token]: 'accepting' }))
    try {
      const projectData = await onAccept(invite.token)
      setDone(d => ({ ...d, [invite.token]: 'accepted' }))
      if (projectData) onProjectJoined?.(projectData)
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy(b => { const n = { ...b }; delete n[invite.token]; return n })
    }
  }

  async function handleDecline(invite) {
    setBusy(b => ({ ...b, [invite.token]: 'declining' }))
    try {
      await onDecline(invite.token)
      setDone(d => ({ ...d, [invite.token]: 'declined' }))
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy(b => { const n = { ...b }; delete n[invite.token]; return n })
    }
  }

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Invites & notifications"
        style={{
          position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: 6,
          background: open ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: count > 0 ? '#FBBF24' : 'rgba(255,255,255,0.55)',
          cursor: 'pointer', flexShrink: 0,
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff' }}
        onMouseLeave={e => {
          e.currentTarget.style.background = open ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)'
          e.currentTarget.style.color = count > 0 ? '#FBBF24' : 'rgba(255,255,255,0.55)'
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill={count > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {count > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            minWidth: 16, height: 16, borderRadius: 9999,
            background: '#EF4444', color: '#fff',
            fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px', lineHeight: 1,
            border: '1.5px solid rgba(0,0,0,0.4)',
          }}>
            {count}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 6,
          width: 300, maxHeight: 420, overflowY: 'auto',
          background: '#1E2030', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 1000,
        }}>
          {/* Header */}
          <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#E5E7EB', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Invites
            </p>
          </div>

          {invites.length === 0 ? (
            <div style={{ padding: '20px 14px', textAlign: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 8px', display: 'block' }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>No pending invites</p>
            </div>
          ) : (
            invites.map(invite => {
              const token = invite.token
              const state = done[token]
              const loading = busy[token]

              return (
                <div key={token} style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  opacity: state ? 0.5 : 1,
                  transition: 'opacity 0.2s',
                }}>
                  {/* Project icon + name */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                      background: 'rgba(59,130,246,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, color: '#60A5FA',
                    }}>
                      {(invite.projectName || '?').slice(0, 1).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#F3F4F6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {invite.projectName || 'Untitled project'}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {invite.invitedByEmail || 'Someone'} invited you as{' '}
                        <span style={{ color: ROLE_COLORS[invite.role] || '#9CA3AF', fontWeight: 600 }}>
                          {ROLE_LABELS[invite.role] || invite.role}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Action buttons or result */}
                  {state === 'accepted' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span style={{ fontSize: 11, color: '#34D399', fontWeight: 600 }}>Joined! Opening project…</span>
                    </div>
                  ) : state === 'declined' ? (
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Invite declined</span>
                  ) : (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleAccept(invite)}
                        disabled={!!loading}
                        style={{
                          flex: 1, padding: '5px 0', borderRadius: 5, fontSize: 11, fontWeight: 600,
                          background: loading === 'accepting' ? 'rgba(59,130,246,0.4)' : '#3B82F6',
                          color: '#fff', border: 'none', cursor: loading ? 'default' : 'pointer',
                          transition: 'background 0.15s',
                        }}
                      >
                        {loading === 'accepting' ? 'Joining…' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleDecline(invite)}
                        disabled={!!loading}
                        style={{
                          flex: 1, padding: '5px 0', borderRadius: 5, fontSize: 11, fontWeight: 500,
                          background: 'rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)',
                          cursor: loading ? 'default' : 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#FCA5A5' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
                      >
                        {loading === 'declining' ? '…' : 'Decline'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
