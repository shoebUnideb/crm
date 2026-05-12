import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlight(text, query) {
  if (!query) return text
  const parts = text.split(new RegExp(`(${escapeRegex(query)})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} style={{ background: '#FFF0B3', color: '#172B4D', borderRadius: 2, padding: '0 1px' }}>{part}</mark>
      : part
  )
}

const STAGE_LABEL = { lead: 'Lead', qualified: 'Qualified', demo: 'Demo', proposal: 'Proposal', negotiation: 'Negotiation', won: 'Won', lost: 'Lost' }
const STAGE_COLOR = { lead: '#97A0AF', qualified: '#0052CC', demo: '#6554C0', proposal: '#FF8B00', negotiation: '#FF991F', won: '#006644', lost: '#BF2600' }

export default function GlobalSearchModal({ projects, onNavigate, onClose }) {
  const [query, setQuery] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [deals, setDeals] = useState([])
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => { inputRef.current?.focus() }, [])

  // Fetch CRM deals once on open
  useEffect(() => {
    try {
      const token = localStorage.getItem('chart-to-jira-token')
      if (!token) return
      fetch('/api/crm/deals', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then(data => setDeals(Array.isArray(data) ? data : []))
        .catch(() => {})
    } catch {}
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const hits = []

    // Canvas nodes
    for (const project of (projects || [])) {
      const mapsObj = project.maps || {}
      for (const [mapId, map] of Object.entries(mapsObj)) {
        const mapName = map.name || 'Untitled map'
        const nodesObj = map.nodes || {}
        for (const [nodeId, node] of Object.entries(nodesObj)) {
          const label = node.title || node.label || ''
          const notes = node.notes || ''
          const combined = `${label} ${notes} ${node.nodeKey || ''}`.toLowerCase()
          if (combined.includes(q)) {
            hits.push({
              type: 'node',
              projectId: project.id,
              projectName: project.name || 'Untitled project',
              mapId,
              mapName,
              nodeId,
              label: label || '(empty)',
              notes,
              nodeKey: node.nodeKey || '',
              matchIn: label.toLowerCase().includes(q) ? 'title' : 'notes',
            })
          }
          if (hits.length >= 40) break
        }
        if (hits.length >= 40) break
      }
      if (hits.length >= 40) break
    }

    // CRM deals
    for (const deal of deals) {
      const searchable = [
        deal.company_name, deal.contact_name, deal.node_key,
        deal.next_action, deal.notes, deal.contact_email,
      ].filter(Boolean).join(' ').toLowerCase()
      if (searchable.includes(q)) {
        hits.push({
          type: 'deal',
          id: deal.id,
          label: deal.company_name,
          contact: deal.contact_name || '',
          node_key: deal.node_key || '',
          stage: deal.stage || 'lead',
          deal_value: deal.deal_value,
          matchIn: deal.company_name?.toLowerCase().includes(q) ? 'name' : 'other',
        })
      }
      if (hits.length >= 50) break
    }

    return hits
  }, [query, projects, deals])

  useEffect(() => { setSelectedIdx(0) }, [results])

  function handleSelect(r) {
    if (r.type === 'deal') {
      navigate('/app/crm', { state: { openDealId: r.id } })
    } else {
      onNavigate(r.projectId, r.mapId, r.nodeId)
    }
    onClose()
  }

  function handleKey(e) {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIdx]) {
      handleSelect(results[selectedIdx])
    }
  }

  useEffect(() => {
    const el = listRef.current?.children[selectedIdx]
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIdx])

  const nodeCount = results.filter(r => r.type === 'node').length
  const dealCount = results.filter(r => r.type === 'deal').length

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(23,43,77,0.5)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: 80, paddingLeft: 16, paddingRight: 16,
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 12, width: '100%', maxWidth: 580,
        boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        overflow: 'hidden',
      }}>
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #F3F4F6', gap: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#97A0AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search nodes and CRM deals..."
            style={{
              flex: 1, border: 'none', outline: 'none', fontSize: '0.9375rem',
              color: '#172B4D', background: 'transparent',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#97A0AF', padding: 2, lineHeight: 1 }}>
              ✕
            </button>
          )}
          <kbd style={{ fontSize: 11, color: '#97A0AF', border: '1px solid #DFE1E6', borderRadius: 4, padding: '2px 6px', background: '#F4F5F7', flexShrink: 0 }}>Esc</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ maxHeight: 400, overflowY: 'auto' }}>
          {query.trim() === '' && (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#97A0AF', fontSize: '0.875rem' }}>
              Search across canvas nodes and CRM deals
            </div>
          )}
          {query.trim() !== '' && results.length === 0 && (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#97A0AF', fontSize: '0.875rem' }}>
              No results for "{query}"
            </div>
          )}

          {/* Section: Canvas Nodes */}
          {nodeCount > 0 && (
            <div style={{ padding: '6px 16px 2px', fontSize: 10, fontWeight: 700, color: '#97A0AF', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#FAFBFC', borderBottom: '1px solid #F3F4F6' }}>
              Canvas Nodes
            </div>
          )}
          {results.map((r, i) => {
            if (r.type !== 'node') return null
            return (
              <button
                key={`node-${r.nodeId}-${i}`}
                onClick={() => handleSelect(r)}
                onMouseEnter={() => setSelectedIdx(i)}
                style={{
                  display: 'flex', width: '100%', alignItems: 'flex-start', gap: 10,
                  padding: '9px 16px', border: 'none', textAlign: 'left',
                  background: i === selectedIdx ? '#EFF6FF' : 'transparent',
                  cursor: 'pointer', borderBottom: '1px solid #F9FAFB',
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 6, background: '#F4F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5E6C84" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#172B4D', marginBottom: 2 }}>
                    {highlight(r.label, query)}
                  </div>
                  {r.matchIn === 'notes' && r.notes && (
                    <div style={{ fontSize: '0.78rem', color: '#5E6C84', marginBottom: 3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {highlight(r.notes.slice(0, 80), query)}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {r.nodeKey && (
                      <span style={{ fontSize: 10, color: '#2563EB', fontWeight: 700, fontFamily: 'monospace', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>
                        {r.nodeKey}
                      </span>
                    )}
                    <span style={{ fontSize: '0.72rem', color: '#97A0AF' }}>{r.projectName}</span>
                    <span style={{ fontSize: '0.72rem', color: '#DFE1E6' }}>›</span>
                    <span style={{ fontSize: '0.72rem', color: '#97A0AF' }}>{r.mapName}</span>
                  </div>
                </div>
                {i === selectedIdx && (
                  <kbd style={{ fontSize: 10, color: '#97A0AF', border: '1px solid #DFE1E6', borderRadius: 3, padding: '1px 5px', background: '#F4F5F7', flexShrink: 0, alignSelf: 'center' }}>↵</kbd>
                )}
              </button>
            )
          })}

          {/* Section: CRM Deals */}
          {dealCount > 0 && (
            <div style={{ padding: '6px 16px 2px', fontSize: 10, fontWeight: 700, color: '#97A0AF', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#FAFBFC', borderBottom: '1px solid #F3F4F6', borderTop: nodeCount > 0 ? '1px solid #EBECF0' : 'none' }}>
              CRM Deals
            </div>
          )}
          {results.map((r, i) => {
            if (r.type !== 'deal') return null
            const stageColor = STAGE_COLOR[r.stage] || '#97A0AF'
            return (
              <button
                key={`deal-${r.id}-${i}`}
                onClick={() => handleSelect(r)}
                onMouseEnter={() => setSelectedIdx(i)}
                style={{
                  display: 'flex', width: '100%', alignItems: 'flex-start', gap: 10,
                  padding: '9px 16px', border: 'none', textAlign: 'left',
                  background: i === selectedIdx ? '#EFF6FF' : 'transparent',
                  cursor: 'pointer', borderBottom: '1px solid #F9FAFB',
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 6, background: '#F0F5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0052CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#172B4D', marginBottom: 2 }}>
                    {highlight(r.label, query)}
                  </div>
                  {r.contact && (
                    <div style={{ fontSize: '0.78rem', color: '#5E6C84', marginBottom: 3 }}>
                      {highlight(r.contact, query)}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {r.node_key && (
                      <span style={{ fontSize: 10, color: '#2563EB', fontWeight: 700, fontFamily: 'monospace', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>
                        {r.node_key}
                      </span>
                    )}
                    <span style={{ fontSize: 10, fontWeight: 600, color: stageColor, background: stageColor + '18', borderRadius: 3, padding: '1px 6px' }}>
                      {STAGE_LABEL[r.stage] || r.stage}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#97A0AF' }}>CRM</span>
                  </div>
                </div>
                {i === selectedIdx && (
                  <kbd style={{ fontSize: 10, color: '#97A0AF', border: '1px solid #DFE1E6', borderRadius: 3, padding: '1px 5px', background: '#F4F5F7', flexShrink: 0, alignSelf: 'center' }}>↵</kbd>
                )}
              </button>
            )
          })}

          {results.length >= 50 && (
            <div style={{ padding: '8px 16px', fontSize: '0.75rem', color: '#97A0AF', textAlign: 'center', borderTop: '1px solid #F3F4F6' }}>
              Showing first 50 results — refine your query
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 12 }}>
          {[['↑↓', 'Navigate'], ['↵', 'Open'], ['Esc', 'Close']].map(([key, label]) => (
            <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: '#97A0AF' }}>
              <kbd style={{ border: '1px solid #DFE1E6', borderRadius: 3, padding: '1px 5px', background: '#F4F5F7', fontSize: 10 }}>{key}</kbd>
              {label}
            </span>
          ))}
          {dealCount > 0 && (
            <span style={{ fontSize: '0.72rem', color: '#97A0AF', marginLeft: 'auto' }}>
              {nodeCount} node{nodeCount !== 1 ? 's' : ''} · {dealCount} deal{dealCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
