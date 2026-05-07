import React, { useState, useEffect, useRef } from 'react'

export default function FindReplacePanel({ nodes, onReplaceAll, onReplaceSingle, onClose }) {
  const [find, setFind] = useState('')
  const [replace, setReplace] = useState('')
  const [matchCase, setMatchCase] = useState(false)
  const [matches, setMatches] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const findRef = useRef(null)

  useEffect(() => { findRef.current?.focus() }, [])

  useEffect(() => {
    if (!find.trim()) { setMatches([]); return }
    const term = matchCase ? find : find.toLowerCase()
    const found = Object.values(nodes).filter(n => {
      const title = matchCase ? n.title : n.title.toLowerCase()
      return title.includes(term)
    })
    setMatches(found)
    setCurrentIdx(0)
  }, [find, matchCase, nodes])

  function handleReplaceOne() {
    if (matches.length === 0) return
    const node = matches[currentIdx]
    const newTitle = matchCase
      ? node.title.replaceAll(find, replace)
      : node.title.replace(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), replace)
    onReplaceSingle?.(node.id, newTitle)
    setCurrentIdx(i => Math.min(i, matches.length - 2))
  }

  function handleReplaceAll() {
    if (matches.length === 0) return
    const replacements = {}
    for (const node of matches) {
      replacements[node.id] = matchCase
        ? node.title.replaceAll(find, replace)
        : node.title.replace(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), replace)
    }
    onReplaceAll?.(replacements)
  }

  const current = matches[currentIdx]

  return (
    <div style={{
      position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)',
      zIndex: 30, background: '#fff', border: '1px solid #E5E7EB',
      borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
      padding: '14px 16px', width: 380, display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>Find & Replace</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 18, lineHeight: 1 }}>×</button>
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          ref={findRef}
          value={find}
          onChange={e => setFind(e.target.value)}
          placeholder="Find…"
          style={{ flex: 1, padding: '6px 10px', borderRadius: 7, border: '1px solid #D1D5DB', fontSize: 12, outline: 'none' }}
          onKeyDown={e => {
            if (e.key === 'Enter') setCurrentIdx(i => (i + 1) % Math.max(matches.length, 1))
            if (e.key === 'Escape') onClose()
          }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6B7280', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <input type="checkbox" checked={matchCase} onChange={e => setMatchCase(e.target.checked)} style={{ margin: 0 }} />
          Aa
        </label>
      </div>

      <input
        value={replace}
        onChange={e => setReplace(e.target.value)}
        placeholder="Replace with…"
        style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid #D1D5DB', fontSize: 12, outline: 'none' }}
        onKeyDown={e => { if (e.key === 'Escape') onClose() }}
      />

      {find.trim() && (
        <div style={{ fontSize: 11, color: matches.length > 0 ? '#059669' : '#EF4444' }}>
          {matches.length > 0
            ? `${matches.length} match${matches.length !== 1 ? 'es' : ''} — showing #${currentIdx + 1}: "${current?.title}"`
            : 'No matches'}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => setCurrentIdx(i => (i - 1 + Math.max(matches.length, 1)) % Math.max(matches.length, 1))}
          disabled={matches.length === 0}
          style={{ flex: 1, padding: '5px 0', borderRadius: 7, border: '1px solid #E5E7EB', fontSize: 11, cursor: 'pointer', background: '#F9FAFB', color: '#374151' }}
        >← Prev</button>
        <button
          onClick={() => setCurrentIdx(i => (i + 1) % Math.max(matches.length, 1))}
          disabled={matches.length === 0}
          style={{ flex: 1, padding: '5px 0', borderRadius: 7, border: '1px solid #E5E7EB', fontSize: 11, cursor: 'pointer', background: '#F9FAFB', color: '#374151' }}
        >Next →</button>
        <button
          onClick={handleReplaceOne}
          disabled={matches.length === 0 || !replace}
          style={{ flex: 1, padding: '5px 0', borderRadius: 7, border: '1px solid #BFDBFE', fontSize: 11, cursor: 'pointer', background: '#EFF6FF', color: '#1D4ED8' }}
        >Replace</button>
        <button
          onClick={handleReplaceAll}
          disabled={matches.length === 0 || !replace}
          style={{ flex: 1.4, padding: '5px 0', borderRadius: 7, border: 'none', fontSize: 11, cursor: 'pointer', background: '#2563EB', color: '#fff', fontWeight: 600 }}
        >Replace all</button>
      </div>
    </div>
  )
}
