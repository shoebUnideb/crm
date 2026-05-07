import React, { useState, useEffect } from 'react'
import { projectsApi } from '../../lib/projectsApi.js'

const ROLE_LABELS = { admin: 'Admin', edit: 'Editor', view: 'Viewer' }
const ROLE_COLORS = { admin: '#7C3AED', edit: '#2563EB', view: '#6B7280' }

function RoleBadge({ role }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 9999,
      background: ROLE_COLORS[role] + '1A', color: ROLE_COLORS[role], letterSpacing: '0.03em',
    }}>
      {ROLE_LABELS[role] || role}
    </span>
  )
}

export default function MembersPanel({ projectId, myRole, myUserId, token, onClose, onLeave, mapCount, activeMapId, activeMapName }) {
  const [members, setMembers] = useState([])
  const [pendingInvites, setPendingInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('edit')
  const [inviteScope, setInviteScope] = useState('project')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState(null)
  const [inviteSent, setInviteSent] = useState(null)
  const [leaving, setLeaving] = useState(false)

  async function loadAll() {
    setLoading(true)
    setError(null)
    try {
      const [m, inv] = await Promise.all([
        projectsApi.getMembers(token, projectId),
        myRole === 'admin' ? projectsApi.getPendingInvites(token, projectId) : Promise.resolve([]),
      ])
      setMembers(m)
      setPendingInvites(inv)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [projectId, token])

  async function handleInvite(e) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    setInviteError(null)
    setInviteSent(null)
    try {
      const scope = inviteScope === 'map' ? activeMapId : 'project'
      await projectsApi.sendInvite(token, projectId, inviteEmail.trim(), inviteRole, scope)
      setInviteSent(inviteEmail.trim())
      setInviteEmail('')
      await loadAll()
    } catch (err) {
      setInviteError(err.message)
    } finally {
      setInviting(false)
    }
  }

  async function handleRemove(userId, email, role) {
    const msg = role === 'admin'
      ? `Remove admin ${email}? They will lose all access to this project.`
      : `Remove ${email} from this project?`
    if (!confirm(msg)) return
    try {
      await projectsApi.removeMember(token, projectId, userId)
      await loadAll()
    } catch (e) {
      alert(e.message)
    }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      await projectsApi.updateRole(token, projectId, userId, newRole)
      await loadAll()
    } catch (e) {
      alert(e.message)
    }
  }

  async function handleRevoke(inviteId) {
    try {
      await projectsApi.revokeInvite(token, projectId, inviteId)
      setPendingInvites(prev => prev.filter(i => i.id !== inviteId))
    } catch (e) {
      alert(e.message)
    }
  }

  async function handleLeave() {
    const adminCount = members.filter(m => m.role === 'admin').length
    const isLastAdmin = myRole === 'admin' && adminCount <= 1
    const hasOthers = members.length > 1

    let msg
    if (isLastAdmin && hasOthers) {
      alert('You are the last admin. Promote another member to admin before leaving, or delete the project.')
      return
    } else if (isLastAdmin && !hasOthers) {
      msg = 'You are the only member. Leaving will permanently delete this project. Continue?'
    } else {
      msg = 'Leave this project? You will lose access to all maps and data.'
    }
    if (!confirm(msg)) return

    setLeaving(true)
    try {
      await projectsApi.leave(token, projectId)
      if (onLeave) onLeave()
    } catch (e) {
      alert(e.message)
      setLeaving(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(9,30,66,0.35)',
        }}
      />

      {/* Dialog */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400, maxWidth: 'calc(100vw - 32px)',
        maxHeight: 'calc(100vh - 64px)',
        zIndex: 51,
        background: '#fff', borderRadius: 12,
        boxShadow: '0 8px 40px rgba(9,30,66,0.22)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>Collaborators</h2>
          <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
            Your role: <strong style={{ color: ROLE_COLORS[myRole] }}>{ROLE_LABELS[myRole]}</strong>
          </p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 20, lineHeight: 1, padding: 4, borderRadius: 6 }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#374151' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#9CA3AF' }}
        >×</button>
      </div>

      {/* Sharing scope selector — always visible */}
      {mapCount > 0 && (
        <div style={{ padding: '8px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
          <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Sharing scope
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setInviteScope('project')}
              style={{
                flex: 1, padding: '7px 10px', borderRadius: 7, fontSize: 11, fontWeight: 500,
                border: inviteScope === 'project' ? '1.5px solid #3B82F6' : '1px solid #E2E8F0',
                background: inviteScope === 'project' ? '#EFF6FF' : 'white',
                color: inviteScope === 'project' ? '#1D4ED8' : '#64748B',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                  <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
                </svg>
                <span>Whole project</span>
              </div>
              <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 2 }}>
                All {mapCount} map{mapCount !== 1 ? 's' : ''}
              </div>
            </button>
            <button
              onClick={() => setInviteScope('map')}
              style={{
                flex: 1, padding: '7px 10px', borderRadius: 7, fontSize: 11, fontWeight: 500,
                border: inviteScope === 'map' ? '1.5px solid #10B981' : '1px solid #E2E8F0',
                background: inviteScope === 'map' ? '#ECFDF5' : 'white',
                color: inviteScope === 'map' ? '#065F46' : '#64748B',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 3v18"/>
                </svg>
                <span>This map only</span>
              </div>
              <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeMapName || 'Current map'}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Role legend */}
      <div style={{ padding: '8px 16px', background: '#F9FAFB', borderBottom: '1px solid #F3F4F6', display: 'flex', gap: 12 }}>
        {['admin', 'edit', 'view'].map(r => (
          <div key={r} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <RoleBadge role={r} />
            <span style={{ fontSize: 9, color: '#9CA3AF', marginTop: 2 }}>
              {r === 'admin' ? 'Full control + invite' : r === 'edit' ? 'Edit + delete all' : 'View only'}
            </span>
          </div>
        ))}
      </div>

      {/* Members list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {loading && <p style={{ padding: '12px 16px', color: '#9CA3AF', fontSize: 13 }}>Loading…</p>}
        {error && (
          <div style={{ padding: '12px 16px' }}>
            <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 8 }}>{error}</p>
            <button onClick={loadAll} style={{ fontSize: 11, color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Retry
            </button>
          </div>
        )}
        {!loading && !error && members.map(m => (
          <div key={m.userId} style={{
            display: 'flex', alignItems: 'center', padding: '8px 16px', gap: 10,
            borderBottom: '1px solid #F9FAFB',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: ROLE_COLORS[m.role] + '22',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: ROLE_COLORS[m.role],
            }}>
              {m.email.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {m.email}
              </p>
              <p style={{ margin: 0, fontSize: 10, color: '#9CA3AF' }}>
                Joined {new Date(m.joinedAt).toLocaleDateString()}
              </p>
            </div>
            {myRole === 'admin' ? (
              <select
                value={m.role}
                onChange={e => handleRoleChange(m.userId, e.target.value)}
                style={{ fontSize: 11, border: '1px solid #E5E7EB', borderRadius: 4, padding: '2px 4px', color: ROLE_COLORS[m.role], cursor: 'pointer' }}
              >
                <option value="admin">Admin</option>
                <option value="edit">Editor</option>
                <option value="view">Viewer</option>
              </select>
            ) : (
              <RoleBadge role={m.role} />
            )}
            {myRole === 'admin' && m.userId !== myUserId && (
              <button
                onClick={() => handleRemove(m.userId, m.email, m.role)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 2, flexShrink: 0 }}
                title="Remove member"
                onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                onMouseLeave={e => e.currentTarget.style.color = '#D1D5DB'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            )}
          </div>
        ))}

        {/* Pending invites */}
        {myRole === 'admin' && pendingInvites.length > 0 && (
          <>
            <p style={{ padding: '10px 16px 4px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
              Pending invites
            </p>
            {pendingInvites.map(inv => (
              <div key={inv.id} style={{
                display: 'flex', alignItems: 'center', padding: '7px 16px', gap: 10,
                borderBottom: '1px solid #F9FAFB', opacity: 0.85,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#9CA3AF',
                }}>
                  {inv.email.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inv.email}
                  </p>
                  <p style={{ margin: 0, fontSize: 10, color: '#9CA3AF' }}>
                    Invited · expires {new Date(inv.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <RoleBadge role={inv.role} />
                <button
                  onClick={() => handleRevoke(inv.id)}
                  title="Revoke invite"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 2, flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                  onMouseLeave={e => e.currentTarget.style.color = '#D1D5DB'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Invite form — admin only */}
      {myRole === 'admin' && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid #E5E7EB' }}>
          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#374151' }}>Invite via email</p>
          {inviteSent && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 6, marginBottom: 8 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span style={{ fontSize: 11, color: '#065F46' }}>Invite sent to {inviteSent}</span>
            </div>
          )}
          <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              type="email"
              placeholder="Email address"
              value={inviteEmail}
              onChange={e => { setInviteEmail(e.target.value); setInviteSent(null) }}
              required
              style={{
                fontSize: 12, padding: '6px 10px', border: '1px solid #E5E7EB', borderRadius: 6,
                outline: 'none', width: '100%', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                style={{ fontSize: 12, padding: '6px 8px', border: '1px solid #E5E7EB', borderRadius: 6, flex: 1 }}
              >
                <option value="admin">Admin</option>
                <option value="edit">Editor</option>
                <option value="view">Viewer</option>
              </select>
              <button
                type="submit"
                disabled={inviting}
                style={{
                  fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 6,
                  background: '#3B82F6', color: '#fff', border: 'none', cursor: inviting ? 'default' : 'pointer',
                  opacity: inviting ? 0.7 : 1,
                }}
              >
                {inviting ? '…' : 'Send invite'}
              </button>
            </div>
            {inviteError && <p style={{ margin: 0, fontSize: 11, color: '#EF4444' }}>{inviteError}</p>}
            <p style={{ margin: 0, fontSize: 10, color: '#9CA3AF', lineHeight: 1.4 }}>
              They'll get an in-app notification instantly. {inviteScope === 'project'
                ? `All ${mapCount || ''} maps in this project will be shared.`
                : `Only "${activeMapName || 'current map'}" will be shared.`}
            </p>
          </form>
        </div>
      )}

      {/* Leave project — all roles */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleLeave}
          disabled={leaving}
          style={{
            fontSize: 11, fontWeight: 600, padding: '6px 14px', borderRadius: 6,
            background: 'none', color: '#EF4444', border: '1px solid #FCA5A5',
            cursor: leaving ? 'default' : 'pointer', opacity: leaving ? 0.6 : 1,
          }}
          onMouseEnter={e => { if (!leaving) { e.currentTarget.style.background = '#FEF2F2' } }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
        >
          {leaving ? 'Leaving…' : 'Leave project'}
        </button>
      </div>
      </div>
    </>
  )
}
