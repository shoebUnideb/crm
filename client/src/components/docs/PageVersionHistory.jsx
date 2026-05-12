import React, { useState, useEffect } from 'react'
import * as docsApi from '../../lib/docsApi.js'

const ACCENT = '#0052CC'

export default function PageVersionHistory({ pageId, onRestore }) {
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState(null)

  useEffect(() => {
    docsApi.getVersions(pageId)
      .then(setVersions)
      .catch(err => console.error('Failed to load versions:', err))
      .finally(() => setLoading(false))
  }, [pageId])

  async function handleRestore(versionId) {
    if (!window.confirm('Restore this version? Current content will become a new version.')) return
    setRestoring(versionId)
    try {
      const updated = await docsApi.restoreVersion(pageId, versionId)
      onRestore(updated)
      const fresh = await docsApi.getVersions(pageId)
      setVersions(fresh)
    } catch (err) {
      console.error('Failed to restore version:', err)
      alert('Failed to restore version. Please try again.')
    } finally { setRestoring(null) }
  }

  if (loading) return <div style={{ padding: 16, color: '#97A0AF', fontSize: '0.8125rem' }}>Loading…</div>

  return (
    <div style={{ padding: '12px 16px' }}>
      {versions.length === 0 && (
        <p style={{ color: '#97A0AF', fontSize: '0.8125rem', textAlign: 'center', marginTop: 24 }}>No versions yet</p>
      )}
      {versions.map((v, i) => (
        <div key={v.id} style={{
          padding: '10px 0', borderBottom: '1px solid #F4F5F7',
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: '#0052CC',
            color: '#fff', fontSize: '0.6875rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
          }}>
            {v.edited_by_email?.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#172B4D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {v.title}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#97A0AF', marginTop: 2 }}>
              {v.edited_by_email} · {new Date(v.created_at).toLocaleString()}
            </div>
            {i === 0 && <span style={{ fontSize: '0.6875rem', color: '#36B37E', fontWeight: 600 }}>Current</span>}
          </div>
          {i > 0 && (
            <button
              onClick={() => handleRestore(v.id)}
              disabled={restoring === v.id}
              style={{
                background: ACCENT, color: '#fff', border: 'none', borderRadius: 5,
                padding: '4px 8px', cursor: restoring === v.id ? 'default' : 'pointer',
                fontSize: '0.6875rem', fontWeight: 600, flexShrink: 0,
              }}
            >
              {restoring === v.id ? '…' : 'Restore'}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
