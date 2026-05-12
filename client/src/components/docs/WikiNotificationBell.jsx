import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as docsApi from '../../lib/docsApi.js'

const NAVY   = '#172B4D'
const BLUE   = '#0052CC'
const BORDER = '#DFE1E6'
const BG     = '#FAFBFC'
const SUBTLE = '#5E6C84'

export default function WikiNotificationBell({ spaces = [], onSpacesChanged }) {
  const navigate = useNavigate()
  const [open, setOpen]             = useState(false)
  const [invites, setInvites]       = useState([])
  const [loading, setLoading]       = useState(false)
  const [acting, setActing]         = useState({}) // { [spaceId]: 'accept'|'reject'|'leave' }
  const [leaveTarget, setLeaveTarget] = useState(null) // space to confirm leave
  const [error, setError]           = useState(null)
  const panelRef = useRef(null)
  const btnRef   = useRef(null)

  const fetchInvites = useCallback(() => {
    docsApi.getNotifications()
      .then(setInvites)
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchInvites()
    const id = setInterval(fetchInvites, 30_000)
    return () => clearInterval(id)
  }, [fetchInvites])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target) &&
          btnRef.current && !btnRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  async function handleAccept(spaceId) {
    setActing(a => ({ ...a, [spaceId]: 'accept' }))
    setError(null)
    try {
      await docsApi.acceptInvite(spaceId)
      setInvites(prev => prev.filter(i => i.space_id !== spaceId))
      onSpacesChanged?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setActing(a => { const n = { ...a }; delete n[spaceId]; return n })
    }
  }

  async function handleReject(spaceId) {
    setActing(a => ({ ...a, [spaceId]: 'reject' }))
    setError(null)
    try {
      await docsApi.rejectInvite(spaceId)
      setInvites(prev => prev.filter(i => i.space_id !== spaceId))
    } catch (err) {
      setError(err.message)
    } finally {
      setActing(a => { const n = { ...a }; delete n[spaceId]; return n })
    }
  }

  async function handleLeave(spaceId) {
    setActing(a => ({ ...a, [spaceId]: 'leave' }))
    setError(null)
    setLeaveTarget(null)
    try {
      await docsApi.leaveSpace(spaceId)
      onSpacesChanged?.()
      navigate('/app/docs')
    } catch (err) {
      setError(err.message)
    } finally {
      setActing(a => { const n = { ...a }; delete n[spaceId]; return n })
    }
  }

  const unread = invites.length

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        ref={btnRef}
        onClick={() => setOpen(v => !v)}
        title="Notifications"
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
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 3, right: 3,
            minWidth: 14, height: 14, borderRadius: 7,
            background: '#DE350B', color: '#fff',
            fontSize: '0.5625rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px', lineHeight: 1,
            border: '1.5px solid #172B4D',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Notification panel */}
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
              {unread > 0 && (
                <span style={{
                  background: '#DE350B', color: '#fff', borderRadius: 10,
                  fontSize: '0.625rem', fontWeight: 700, padding: '1px 6px',
                }}>
                  {unread} new
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
            {error && (
              <div style={{ margin: '8px 14px', padding: '8px 12px', background: '#FFF5F5', borderRadius: 4, fontSize: '0.8125rem', color: '#DE350B', border: '1px solid #FFBDAD' }}>
                {error}
              </div>
            )}

            {/* Pending invites section */}
            {invites.length > 0 && (
              <div>
                <p style={{ margin: 0, padding: '10px 16px 4px', fontSize: '0.625rem', fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Space invites
                </p>
                {invites.map(invite => (
                  <InviteRow
                    key={invite.id}
                    invite={invite}
                    isActing={acting[invite.space_id]}
                    onAccept={() => handleAccept(invite.space_id)}
                    onReject={() => handleReject(invite.space_id)}
                  />
                ))}
              </div>
            )}

            {/* Joined spaces — leave option */}
            {spaces.length > 0 && (
              <div>
                <p style={{ margin: 0, padding: '10px 16px 4px', fontSize: '0.625rem', fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Your spaces
                </p>
                {spaces.map(space => (
                  <SpaceRow
                    key={space.id}
                    space={space}
                    isActing={acting[space.id]}
                    onLeaveRequest={() => setLeaveTarget(space)}
                    onNavigate={() => { navigate(`/app/docs/${space.slug}`); setOpen(false) }}
                  />
                ))}
              </div>
            )}

            {invites.length === 0 && spaces.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: SUBTLE }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>🔔</div>
                <p style={{ margin: 0, fontWeight: 600, color: NAVY, fontSize: '0.875rem' }}>All caught up</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.8125rem' }}>No notifications right now</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leave confirmation modal */}
      {leaveTarget && (
        <LeaveConfirmModal
          space={leaveTarget}
          acting={acting[leaveTarget.id]}
          onConfirm={() => handleLeave(leaveTarget.id)}
          onCancel={() => setLeaveTarget(null)}
        />
      )}
    </div>
  )
}

// ─── Invite row ───────────────────────────────────────────────────────────────
function InviteRow({ invite, isActing, onAccept, onReject }) {
  const timeAgo = formatTimeAgo(invite.invited_at)
  return (
    <div style={{
      padding: '12px 16px',
      borderBottom: `1px solid ${BORDER}`,
      background: '#FFFBEB',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem',
        }}>
          {invite.space_icon || '📄'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: NAVY, lineHeight: 1.4 }}>
            You were invited to <strong>{invite.space_name}</strong>
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: SUBTLE }}>
            {invite.invited_by_email
              ? <>Invited by <strong>{invite.invited_by_email}</strong> · {timeAgo}</>
              : timeAgo}
          </p>
          <RoleBadge role={invite.role} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onAccept}
          disabled={!!isActing}
          style={{
            flex: 1, padding: '6px 0', borderRadius: 4, border: 'none',
            background: isActing === 'accept' ? '#B3D4FF' : BLUE,
            color: '#fff', fontSize: '0.8125rem', fontWeight: 600,
            cursor: isActing ? 'not-allowed' : 'pointer',
            transition: 'background 0.12s',
          }}
          onMouseEnter={e => { if (!isActing) e.currentTarget.style.background = '#0747A6' }}
          onMouseLeave={e => { if (!isActing) e.currentTarget.style.background = BLUE }}
        >
          {isActing === 'accept' ? 'Accepting…' : '✓ Accept'}
        </button>
        <button
          onClick={onReject}
          disabled={!!isActing}
          style={{
            flex: 1, padding: '6px 0', borderRadius: 4,
            border: `1px solid ${BORDER}`, background: '#fff',
            color: isActing === 'reject' ? '#97A0AF' : '#DE350B',
            fontSize: '0.8125rem', fontWeight: 500,
            cursor: isActing ? 'not-allowed' : 'pointer',
            transition: 'all 0.12s',
          }}
          onMouseEnter={e => { if (!isActing) { e.currentTarget.style.background = '#FFF5F5'; e.currentTarget.style.borderColor = '#FFBDAD' } }}
          onMouseLeave={e => { if (!isActing) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = BORDER } }}
        >
          {isActing === 'reject' ? 'Declining…' : '✕ Decline'}
        </button>
      </div>
    </div>
  )
}

// ─── Space row (with leave option) ───────────────────────────────────────────
function SpaceRow({ space, isActing, onLeaveRequest, onNavigate }) {
  const [hov, setHov] = useState(false)
  const isOwner = space.role === 'admin' && space.owner_id
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '10px 16px',
        borderBottom: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center', gap: 10,
        background: hov ? BG : '#fff',
        transition: 'background 0.1s',
      }}
    >
      <button
        onClick={onNavigate}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left',
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 6, flexShrink: 0,
          background: '#EBECF0', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem',
        }}>
          {space.icon || '📄'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {space.name}
          </div>
          <RoleBadge role={space.role} />
        </div>
      </button>

      {/* Leave button — only for non-owners */}
      {space.role !== 'admin' || !space.owner_id ? (
        <button
          onClick={onLeaveRequest}
          disabled={!!isActing}
          title="Leave space"
          style={{
            flexShrink: 0, background: 'none', border: 'none', cursor: isActing ? 'not-allowed' : 'pointer',
            color: hov ? '#DE350B' : '#97A0AF', padding: '4px 6px', borderRadius: 4,
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: '0.75rem', fontWeight: 500,
            opacity: hov ? 1 : 0,
            transition: 'opacity 0.12s, color 0.12s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#FFF5F5'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <LeaveIcon />
          Leave
        </button>
      ) : null}
    </div>
  )
}

// ─── Leave confirm modal ──────────────────────────────────────────────────────
function LeaveConfirmModal({ space, acting, onConfirm, onCancel }) {
  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onCancel])

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: 'rgba(9,30,66,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 10,
          boxShadow: '0 8px 32px rgba(9,30,66,0.22)',
          padding: '28px 28px 22px',
          width: 360, maxWidth: '90vw',
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: '#FFF5F5', display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <LeaveIcon size={20} color="#DE350B" />
        </div>

        <p style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700, color: NAVY }}>
          Leave space?
        </p>
        <p style={{ margin: '0 0 22px', fontSize: '0.875rem', color: SUBTLE, lineHeight: 1.5 }}>
          You will lose access to <strong style={{ color: NAVY }}>{space.icon} {space.name}</strong> and all its pages. You'll need a new invite to rejoin.
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{ padding: '8px 18px', borderRadius: 6, border: `1px solid ${BORDER}`, background: '#fff', color: NAVY, fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = BG}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={acting === 'leave'}
            style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: acting === 'leave' ? '#FFBDAD' : '#DE350B', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: acting === 'leave' ? 'not-allowed' : 'pointer' }}
            onMouseEnter={e => { if (acting !== 'leave') e.currentTarget.style.background = '#BF2600' }}
            onMouseLeave={e => { if (acting !== 'leave') e.currentTarget.style.background = '#DE350B' }}
          >
            {acting === 'leave' ? 'Leaving…' : 'Leave space'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const colors = {
    admin: { bg: '#EAE6FF', color: '#403294' },
    edit:  { bg: '#E3FCEF', color: '#006644' },
    view:  { bg: '#DEEBFF', color: '#0052CC' },
  }
  const c = colors[role] || colors.view
  return (
    <span style={{
      display: 'inline-block', marginTop: 3,
      fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.06em', padding: '1px 5px', borderRadius: 3,
      background: c.bg, color: c.color,
    }}>
      {role}
    </span>
  )
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

function LeaveIcon({ size = 12, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}
