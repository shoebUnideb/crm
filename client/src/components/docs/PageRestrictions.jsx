import React, { useState, useEffect } from 'react'
import * as docsApi from '../../lib/docsApi.js'

const ACCENT = '#0052CC'
const ROLES = ['view', 'edit']

export default function PageRestrictions({ pageId, effectiveRole }) {
  const [restrictions, setRestrictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [role, setRole] = useState('view')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const canManage = effectiveRole === 'admin'

  useEffect(() => {
    docsApi.getRestrictions(pageId)
      .then(setRestrictions)
      .catch(err => console.error('Failed to load restrictions:', err))
      .finally(() => setLoading(false))
  }, [pageId])

  async function handleAdd(e) {
    e.preventDefault()
    if (!userEmail.trim()) return
    setAdding(true)
    setError('')
    try {
      // In a real impl, look up userId by email. For now, pass email and let server resolve.
      // This requires a helper endpoint; we'll show a placeholder for now.
      const restriction = await docsApi.addRestriction(pageId, { userEmail: userEmail.trim(), role })
      setRestrictions(prev => [...prev, restriction])
      setUserEmail('')
    } catch (err) {
      setError(err.message)
    } finally { setAdding(false) }
  }

  async function handleRemove(restrictionId) {
    try {
      await docsApi.removeRestriction(pageId, restrictionId)
      setRestrictions(prev => prev.filter(r => r.id !== restrictionId))
    } catch (err) {
      console.error('Failed to remove restriction:', err)
    }
  }

  if (loading) return <div style={{ padding: 16, color: '#97A0AF', fontSize: '0.8125rem' }}>Loading…</div>

  return (
    <div style={{ padding: '12px 16px' }}>
      {/* Info banner */}
      <div style={{ background: '#EAF3FF', border: '1px solid #4C9AFF', borderRadius: 6, padding: '8px 12px', marginBottom: 16, fontSize: '0.75rem', color: '#0747A6' }}>
        <strong>Space-level</strong> roles apply by default. Restrictions here can only <em>reduce</em> access for specific users.
      </div>

      {/* Restriction list */}
      {restrictions.length === 0 ? (
        <p style={{ fontSize: '0.8125rem', color: '#97A0AF', marginBottom: 16 }}>No restrictions — all space members have their default access.</p>
      ) : (
        <div style={{ marginBottom: 16 }}>
          {restrictions.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid #F4F5F7' }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', background: '#0052CC',
                color: '#fff', fontSize: '0.6875rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {r.email?.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8125rem', color: '#172B4D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.email}</div>
              </div>
              <span style={{
                fontSize: '0.6875rem', fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                background: r.role === 'view' ? '#DEEBFF' : '#E3FCEF',
                color: r.role === 'view' ? '#0052CC' : '#006644',
              }}>
                {r.role}
              </span>
              {canManage && (
                <button onClick={() => handleRemove(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#97A0AF', padding: 2, flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#DE350B'}
                  onMouseLeave={e => e.currentTarget.style.color = '#97A0AF'}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add restriction form (admin only) */}
      {canManage && (
        <form onSubmit={handleAdd}>
          <p style={{ margin: '0 0 8px', fontSize: '0.75rem', fontWeight: 600, color: '#172B4D' }}>Add restriction</p>
          <input
            type="email"
            value={userEmail}
            onChange={e => setUserEmail(e.target.value)}
            placeholder="user@email.com"
            style={{
              width: '100%', padding: '7px 10px', border: '1px solid #DFE1E6', borderRadius: 6,
              fontSize: '0.8125rem', color: '#172B4D', outline: 'none', boxSizing: 'border-box', marginBottom: 8,
            }}
            onFocus={e => e.target.style.borderColor = ACCENT}
            onBlur={e => e.target.style.borderColor = '#DFE1E6'}
          />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              style={{ padding: '6px 8px', border: '1px solid #DFE1E6', borderRadius: 6, fontSize: '0.8125rem', color: '#172B4D', background: '#fff', flex: 1 }}
            >
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button type="submit" disabled={adding || !userEmail.trim()} style={{
              background: ACCENT, color: '#fff', border: 'none', borderRadius: 6,
              padding: '7px 12px', cursor: adding || !userEmail.trim() ? 'default' : 'pointer',
              fontSize: '0.8125rem', fontWeight: 600, flexShrink: 0,
              opacity: !userEmail.trim() ? 0.5 : 1,
            }}>
              {adding ? '…' : 'Add'}
            </button>
          </div>
          {error && <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#DE350B' }}>{error}</p>}
        </form>
      )}

      {!canManage && (
        <p style={{ fontSize: '0.75rem', color: '#97A0AF' }}>Only admins can manage page restrictions.</p>
      )}
    </div>
  )
}
