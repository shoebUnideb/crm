import React, { useState, useRef, useEffect } from 'react'

const NAVY   = '#172B4D'
const SUBTLE = '#5E6C84'
const BORDER = '#DFE1E6'
const BG     = '#FAFBFC'
const BLUE   = '#0052CC'

const ROLE_LABELS = { admin: 'Admin', edit: 'Editor', view: 'Viewer' }
const ROLE_COLORS = { admin: { bg: '#EAE6FF', color: '#403294' }, edit: { bg: '#E3FCEF', color: '#006644' }, view: { bg: '#DEEBFF', color: '#0052CC' } }

export default function NotificationBell({ invites, onAccept, onDecline, onProjectJoined }) {
  const [open, setOpen]   = useState(false)
  const [busy, setBusy]   = useState({})
  const [done, setDone]   = useState({})
  const panelRef = useRef(null)
  const btnRef   = useRef(null)
  const count = invites.length

  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target) &&
          btnRef.current   && !btnRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

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
    <div style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        ref={btnRef}
        onClick={() => setOpen(v => !v)}
        title="Invites & notifications"
        style={{
          position: 'relative',
          width: 32, height: 32, borderRadius: 6,
          background: open ? 'rgba(255,255,255,0.18)' : 'none',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.75)',
          transition: 'background 0.12s, color 0.12s',
        }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff' } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' } }}
      >
        <BellIcon />
        {count > 0 && (
          <span style={{
            position: 'absolute', top: 3, right: 3,
            minWidth: 14, height: 14, borderRadius: 7,
            background: '#DE350B', color: '#fff',
            fontSize: '0.5625rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px', lineHeight: 1,
            border: '1.5px solid #172B4D',
          }}>
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            width: 360, maxHeight: 480,
            background: '#fff', borderRadius: 10,
            border: `1px solid ${BORDER}`,
            boxShadow: '0 8px 32px rgba(9,30,66,0.2)',
            zIndex: 500,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '14px 16px 12px',
            borderBottom: `1px solid ${BORDER}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: NAVY }}>Notifications</span>
              {count > 0 && (
                <span style={{ background: '#DE350B', color: '#fff', borderRadius: 10, fontSize: '0.625rem', fontWeight: 700, padding: '1px 6px' }}>
                  {count} new
                </span>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#97A0AF', padding: 4, borderRadius: 4, display: 'flex' }}
              onMouseEnter={e => { e.currentTarget.style.color = NAVY; e.currentTarget.style.background = BG }}
              onMouseLeave={e => { e.currentTarget.style.color = '#97A0AF'; e.currentTarget.style.background = 'none' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Body */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {invites.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: SUBTLE }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>🔔</div>
                <p style={{ margin: 0, fontWeight: 600, color: NAVY, fontSize: '0.875rem' }}>All caught up</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.8125rem' }}>No pending invites</p>
              </div>
            ) : (
              <>
                <p style={{ margin: 0, padding: '10px 16px 4px', fontSize: '0.625rem', fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Project invites
                </p>
                {invites.map(invite => {
                  const token = invite.token
                  const state = done[token]
                  const loading = busy[token]
                  const roleColors = ROLE_COLORS[invite.role] || ROLE_COLORS.view

                  return (
                    <div key={token} style={{
                      padding: '12px 16px',
                      borderBottom: `1px solid ${BORDER}`,
                      background: '#FFFBEB',
                      opacity: state ? 0.55 : 1,
                      transition: 'opacity 0.2s',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                          background: '#DEEBFF',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1rem', fontWeight: 700, color: BLUE,
                        }}>
                          {(invite.projectName || '?').slice(0, 1).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: NAVY, lineHeight: 1.4 }}>
                            You were invited to <strong>{invite.projectName || 'Untitled project'}</strong>
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: SUBTLE }}>
                            {invite.invitedByEmail ? <>Invited by <strong>{invite.invitedByEmail}</strong></> : 'Someone invited you'}
                          </p>
                          <span style={{
                            display: 'inline-block', marginTop: 3,
                            fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.06em', padding: '1px 5px', borderRadius: 3,
                            background: roleColors.bg, color: roleColors.color,
                          }}>
                            {ROLE_LABELS[invite.role] || invite.role}
                          </span>
                        </div>
                      </div>

                      {state === 'accepted' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#36B37E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          <span style={{ fontSize: '0.75rem', color: '#36B37E', fontWeight: 600 }}>Joined! Opening project…</span>
                        </div>
                      ) : state === 'declined' ? (
                        <span style={{ fontSize: '0.75rem', color: SUBTLE }}>Invite declined</span>
                      ) : (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => handleAccept(invite)}
                            disabled={!!loading}
                            style={{
                              flex: 1, padding: '6px 0', borderRadius: 4, border: 'none',
                              background: loading === 'accepting' ? '#B3D4FF' : BLUE,
                              color: '#fff', fontSize: '0.8125rem', fontWeight: 600,
                              cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.12s',
                            }}
                            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#0747A6' }}
                            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = BLUE }}
                          >
                            {loading === 'accepting' ? 'Joining…' : '✓ Accept'}
                          </button>
                          <button
                            onClick={() => handleDecline(invite)}
                            disabled={!!loading}
                            style={{
                              flex: 1, padding: '6px 0', borderRadius: 4,
                              border: `1px solid ${BORDER}`, background: '#fff',
                              color: loading === 'declining' ? '#97A0AF' : '#DE350B',
                              fontSize: '0.8125rem', fontWeight: 500,
                              cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.12s',
                            }}
                            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#FFF5F5'; e.currentTarget.style.borderColor = '#FFBDAD' } }}
                            onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = BORDER } }}
                          >
                            {loading === 'declining' ? 'Declining…' : '✕ Decline'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}
