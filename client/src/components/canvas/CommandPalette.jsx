import React, { useState, useEffect, useRef, useMemo } from 'react'

export default function CommandPalette({ nodes, projects, onNavigateNode, onSwitchProject, onClose }) {
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const items = []

    // Match nodes
    for (const node of Object.values(nodes)) {
      if (!q || node.title.toLowerCase().includes(q)) {
        items.push({
          type: 'node',
          id: node.id,
          label: node.title,
          sub: node.status ? `${node.status}${node.assignee ? ' · ' + node.assignee : ''}` : (node.assignee || ''),
          depth: node.depth,
        })
      }
    }

    // Match projects
    if (projects) {
      for (const p of projects) {
        if (!q || p.name.toLowerCase().includes(q)) {
          items.push({ type: 'project', id: p.id, label: p.name, sub: `${Object.keys(p.nodes).length} nodes` })
        }
      }
    }

    // Sort: nodes first, then match quality (starts-with before contains)
    if (q) {
      items.sort((a, b) => {
        const aStarts = a.label.toLowerCase().startsWith(q) ? 0 : 1
        const bStarts = b.label.toLowerCase().startsWith(q) ? 0 : 1
        return aStarts - bStarts || a.depth - b.depth
      })
    }

    return items.slice(0, 12)
  }, [query, nodes, projects])

  useEffect(() => { setActiveIdx(0) }, [query])

  useEffect(() => {
    const el = listRef.current?.children[activeIdx]
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  function confirm(item) {
    if (!item) return
    if (item.type === 'node') onNavigateNode?.(item.id)
    else if (item.type === 'project') onSwitchProject?.(item.id)
    onClose()
  }

  const STATUS_DOT = { todo: '#94A3B8', 'in-progress': '#3B82F6', done: '#22C55E', blocked: '#EF4444' }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: 80,
      background: 'rgba(0,0,0,0.3)',
    }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: '#fff', borderRadius: 14, width: 480, maxHeight: 440,
        boxShadow: '0 16px 48px rgba(0,0,0,0.2)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #F3F4F6', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Jump to node or project…"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#111827' }}
            onKeyDown={e => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)) }
              if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
              if (e.key === 'Enter') confirm(results[activeIdx])
              if (e.key === 'Escape') onClose()
            }}
          />
          <kbd style={{ fontSize: 10, color: '#9CA3AF', background: '#F3F4F6', borderRadius: 4, padding: '2px 5px' }}>Esc</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ overflowY: 'auto', flex: 1 }}>
          {results.length === 0 && (
            <div style={{ padding: '20px 16px', textAlign: 'center', fontSize: 12, color: '#9CA3AF' }}>No results</div>
          )}
          {results.map((item, i) => (
            <button
              key={`${item.type}-${item.id}`}
              onMouseEnter={() => setActiveIdx(i)}
              onClick={() => confirm(item)}
              style={{
                display: 'flex', alignItems: 'center', width: '100%',
                padding: '8px 14px', gap: 10, border: 'none', textAlign: 'left',
                background: i === activeIdx ? '#EFF6FF' : 'transparent',
                cursor: 'pointer',
              }}
            >
              <span style={{
                width: 22, height: 22, borderRadius: item.type === 'project' ? 6 : 5,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: item.type === 'project' ? '#F59E0B22' : '#E5E7EB',
                fontSize: 11, color: item.type === 'project' ? '#B45309' : '#6B7280',
                flexShrink: 0,
              }}>
                {item.type === 'project' ? '📁' : '#'}
              </span>
              <span style={{ flex: 1, overflow: 'hidden' }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
                {item.sub && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6B7280', marginTop: 1 }}>
                    {item.type === 'node' && item.sub.split('·')[0]?.trim() && (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_DOT[item.sub.split('·')[0]?.trim()] ?? '#CBD5E1', flexShrink: 0 }} />
                    )}
                    {item.sub}
                  </span>
                )}
              </span>
              {item.type === 'node' && (
                <span style={{ fontSize: 10, color: '#D1D5DB', flexShrink: 0 }}>depth {item.depth}</span>
              )}
            </button>
          ))}
        </div>

        {results.length > 0 && (
          <div style={{ padding: '6px 14px', borderTop: '1px solid #F3F4F6', fontSize: 10, color: '#9CA3AF', display: 'flex', gap: 12 }}>
            <span>↑↓ navigate</span><span>↵ select</span><span>Esc dismiss</span>
          </div>
        )}
      </div>
    </div>
  )
}
