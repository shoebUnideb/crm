import React, { useState, useEffect, useRef } from 'react'
import * as docsApi from '../../lib/docsApi.js'

const ACCENT = '#0052CC'

// Reusable component: shows doc pages linked to any entity (canvas node, CRM deal, etc.)
// Props:
//   sourceType  — 'node' | 'crm_deal'
//   sourceId    — the entity's id / nodeKey
//   projectId   — optional, used when creating the link
//   canEdit     — whether the user can add/remove links
//   onNavigate  — (spaceSlug, pageId) => void  — called when user clicks a linked page
export default function EntityDocLinks({ sourceType, sourceId, projectId, canEdit, onNavigate }) {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const searchDebounce = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!sourceId) { setLoading(false); return }
    docsApi.getLinkedPages(sourceType, sourceId)
      .then(setLinks)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sourceType, sourceId])

  // Debounced search
  useEffect(() => {
    clearTimeout(searchDebounce.current)
    if (!query.trim()) { setResults([]); return }
    searchDebounce.current = setTimeout(async () => {
      setSearching(true)
      try {
        const r = await docsApi.searchPages(query.trim())
        // Filter out already-linked pages
        const linkedIds = new Set(links.map(l => l.id))
        setResults(r.filter(p => !linkedIds.has(p.id)))
      } catch {}
      setSearching(false)
    }, 300)
    return () => clearTimeout(searchDebounce.current)
  }, [query, links])

  useEffect(() => {
    if (showSearch) setTimeout(() => inputRef.current?.focus(), 50)
  }, [showSearch])

  async function handleLink(page) {
    try {
      const link = await docsApi.linkPage({ sourceType, sourceId: String(sourceId), pageId: page.id, projectId })
      setLinks(prev => [link, ...prev])
      setQuery('')
      setResults([])
      setShowSearch(false)
    } catch (err) {
      console.error('Link failed:', err.message)
    }
  }

  async function handleUnlink(linkId) {
    await docsApi.unlinkPage(linkId)
    setLinks(prev => prev.filter(l => l.link_id !== linkId))
  }

  if (loading) {
    return <div style={{ padding: '12px 0', color: '#97A0AF', fontSize: '0.8125rem' }}>Loading…</div>
  }

  return (
    <div>
      {/* Linked pages list */}
      {links.length === 0 ? (
        <p style={{ margin: '0 0 12px', fontSize: '0.8125rem', color: '#97A0AF' }}>
          No doc pages linked yet.
        </p>
      ) : (
        <div style={{ marginBottom: 12 }}>
          {links.map(link => (
            <div key={link.link_id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 0', borderBottom: '1px solid #F4F5F7',
            }}>
              {/* Doc icon */}
              <div style={{
                width: 26, height: 26, borderRadius: 5, background: '#EAF3FF',
                border: '1px solid #FDE68A', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <button
                  onClick={() => onNavigate && onNavigate(link.space_slug, link.id)}
                  style={{
                    background: 'none', border: 'none', cursor: onNavigate ? 'pointer' : 'default',
                    padding: 0, textAlign: 'left', display: 'block', width: '100%',
                  }}
                >
                  <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#172B4D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {link.title || 'Untitled'}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#97A0AF', marginTop: 1 }}>
                    {link.space_icon} {link.space_name}
                    {link.status === 'draft' && <span style={{ marginLeft: 6, background: '#F4F5F7', borderRadius: 3, padding: '1px 4px', color: '#5E6C84' }}>draft</span>}
                  </div>
                </button>
              </div>

              {canEdit && (
                <button
                  onClick={() => handleUnlink(link.link_id)}
                  title="Remove link"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#97A0AF', padding: 2, flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#DE350B'}
                  onMouseLeave={e => e.currentTarget.style.color = '#97A0AF'}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add link button + search */}
      {canEdit && (
        <div>
          {!showSearch ? (
            <button
              onClick={() => setShowSearch(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: '1px dashed #DFE1E6', borderRadius: 5,
                padding: '5px 10px', cursor: 'pointer', color: '#5E6C84', fontSize: '0.8125rem',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#DFE1E6'; e.currentTarget.style.color = '#5E6C84' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Link doc page
            </button>
          ) : (
            <div style={{ position: 'relative' }}>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') { setShowSearch(false); setQuery(''); setResults([]) } }}
                placeholder="Search pages…"
                style={{
                  width: '100%', padding: '6px 10px', border: `1px solid ${ACCENT}`, borderRadius: 5,
                  fontSize: '0.8125rem', color: '#172B4D', outline: 'none', boxSizing: 'border-box',
                }}
              />
              {(results.length > 0 || searching) && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                  background: '#fff', border: '1px solid #DFE1E6', borderRadius: 6,
                  boxShadow: '0 4px 16px rgba(9,30,66,0.15)', marginTop: 2, maxHeight: 220, overflow: 'auto',
                }}>
                  {searching && <div style={{ padding: '8px 12px', fontSize: '0.8125rem', color: '#97A0AF' }}>Searching…</div>}
                  {results.map(page => (
                    <button
                      key={page.id}
                      onClick={() => handleLink(page)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer',
                        borderBottom: '1px solid #F4F5F7',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#172B4D' }}>{page.title || 'Untitled'}</div>
                      <div style={{ fontSize: '0.6875rem', color: '#97A0AF', marginTop: 2 }}>
                        {page.space_icon} {page.space_name}
                      </div>
                    </button>
                  ))}
                  {!searching && results.length === 0 && query.trim() && (
                    <div style={{ padding: '8px 12px', fontSize: '0.8125rem', color: '#97A0AF' }}>No pages found</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
