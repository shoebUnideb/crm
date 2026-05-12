import React, { useState, useEffect } from 'react'
import * as docsApi from '../../lib/docsApi.js'

const ACCENT = '#0052CC'
const ROLES = ['admin', 'edit', 'view']

export default function SpaceMembers({ space, onClose }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('edit')
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const canManage = space.role === 'admin'

  useEffect(() => {
    docsApi.getSpaceMembers(space.id)
      .then(setMembers)
      .finally(() => setLoading(false))
  }, [space.id])

  async function handleRoleChange(userId, role) {
    await docsApi.updateMemberRole(space.id, userId, role)
    setMembers(prev => prev.map(m => m.user_id === userId ? { ...m, role } : m))
  }

  async function handleRemove(userId) {
    if (!window.confirm('Remove this member from the space?')) return
    await docsApi.removeSpaceMember(space.id, userId)
    setMembers(prev => prev.filter(m => m.user_id !== userId))
  }

  async function handleInvite(e) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    setError('')
    setSuccess('')
    try {
      await docsApi.addSpaceMember(space.id, { userEmail: inviteEmail.trim(), userRole: inviteRole })
      setSuccess(`${inviteEmail} added to the space.`)
      setInviteEmail('')
      const fresh = await docsApi.getSpaceMembers(space.id)
      setMembers(fresh)
    } catch (err) {
      setError(err.message)
    } finally { setInviting(false) }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(9,30,66,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', borderRadius: 12, width: 520, maxHeight: '80vh', boxShadow: '0 20px 60px rgba(9,30,66,0.3)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #F4F5F7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#172B4D' }}>
              {space.icon} {space.name} — Members
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#5E6C84' }}>{members.length} member{members.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#97A0AF', padding: 4 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Member list */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 24px' }}>
          {loading ? (
            <p style={{ color: '#97A0AF', fontSize: '0.8125rem' }}>Loading…</p>
          ) : members.map(m => (
            <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #F4F5F7' }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', background: '#0052CC',
                color: '#fff', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              }}>
                {m.avatar
                  ? <img src={m.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : m.email?.slice(0, 2).toUpperCase()
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', color: '#172B4D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</div>
                {m.invited_by_email && (
                  <div style={{ fontSize: '0.6875rem', color: '#97A0AF' }}>invited by {m.invited_by_email}</div>
                )}
              </div>
              {canManage ? (
                <select
                  value={m.role}
                  onChange={e => handleRoleChange(m.user_id, e.target.value)}
                  style={{ padding: '4px 8px', border: '1px solid #DFE1E6', borderRadius: 5, fontSize: '0.8125rem', color: '#172B4D', background: '#fff', cursor: 'pointer' }}
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              ) : (
                <span style={{
                  fontSize: '0.75rem', fontWeight: 600, padding: '3px 8px', borderRadius: 4,
                  background: m.role === 'admin' ? '#EAE6FF' : m.role === 'edit' ? '#E3FCEF' : '#DEEBFF',
                  color: m.role === 'admin' ? '#403294' : m.role === 'edit' ? '#006644' : '#0052CC',
                }}>
                  {m.role}
                </span>
              )}
              {canManage && (
                <button onClick={() => handleRemove(m.user_id)} title="Remove member" style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: '#97A0AF', padding: 4, flexShrink: 0,
                }}
                  onMouseEnter={e => e.currentTarget.style.color = '#DE350B'}
                  onMouseLeave={e => e.currentTarget.style.color = '#97A0AF'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Invite form */}
        {canManage && (
          <form onSubmit={handleInvite} style={{ padding: '14px 24px', borderTop: '1px solid #F4F5F7', flexShrink: 0 }}>
            <p style={{ margin: '0 0 10px', fontSize: '0.8125rem', fontWeight: 600, color: '#172B4D' }}>Add member</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="Email address"
                style={{
                  flex: 1, padding: '8px 10px', border: '1px solid #DFE1E6', borderRadius: 6,
                  fontSize: '0.875rem', color: '#172B4D', outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = ACCENT}
                onBlur={e => e.target.style.borderColor = '#DFE1E6'}
              />
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                style={{ padding: '8px 10px', border: '1px solid #DFE1E6', borderRadius: 6, fontSize: '0.875rem', color: '#172B4D', background: '#fff' }}
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button type="submit" disabled={inviting || !inviteEmail.trim()} style={{
                background: ACCENT, color: '#fff', border: 'none', borderRadius: 6,
                padding: '8px 14px', cursor: inviting || !inviteEmail.trim() ? 'default' : 'pointer',
                fontSize: '0.875rem', fontWeight: 600, flexShrink: 0,
                opacity: !inviteEmail.trim() ? 0.5 : 1,
              }}>
                {inviting ? '…' : 'Add'}
              </button>
            </div>
            {error && <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#DE350B' }}>{error}</p>}
            {success && <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#36B37E' }}>{success}</p>}
          </form>
        )}
      </div>
    </div>
  )
}
