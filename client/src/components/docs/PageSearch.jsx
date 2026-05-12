import React, { useState, useEffect, useRef } from 'react'
import * as docsApi from '../../lib/docsApi.js'

const ACCENT = '#0052CC'

export default function PageSearch({ spaces, onSelect, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(0)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!query.trim()) { setResults([]); return }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const pages = await docsApi.searchPages(query.trim())
        setResults(pages)
        setSelected(0)
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  useEffect(() => {
    function handler(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') setSelected(v => Math.min(v + 1, results.length - 1))
      if (e.key === 'ArrowUp') setSelected(v => Math.max(v - 1, 0))
      if (e.key === 'Enter' && results[selected]) {
        const page = results[selected]
        const space = spaces.find(s => s.id === page.space_id)
        if (space) onSelect({ space, page })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [results, selected, spaces, onSelect, onClose])

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(9,30,66,0.5)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: '15vh', zIndex: 1000,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: '#fff', borderRadius: 12, width: 560, maxHeight: 480,
        boxShadow: '0 20px 60px rgba(9,30,66,0.3)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }}>
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid #F4F5F7' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#97A0AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages…"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.9375rem', color: '#172B4D' }}
          />
          {loading && (
            <div style={{ width: 16, height: 16, border: `2px solid #DFE1E6`, borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          )}
          <kbd style={{ fontSize: '0.6875rem', color: '#97A0AF', background: '#F4F5F7', border: '1px solid #DFE1E6', borderRadius: 4, padding: '2px 5px' }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ overflow: 'auto', flex: 1 }}>
          {!query.trim() && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#97A0AF', fontSize: '0.875rem' }}>
              Type to search across all your docs
            </div>
          )}
          {query.trim() && results.length === 0 && !loading && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#97A0AF', fontSize: '0.875rem' }}>
              No pages found for "{query}"
            </div>
          )}
          {results.map((page, i) => {
            const space = spaces.find(s => s.id === page.space_id)
            if (!space) return null
            const isSelected = i === selected
            return (
              <button
                key={page.id}
                onClick={() => onSelect({ space, page })}
                onMouseEnter={() => setSelected(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  padding: '10px 18px', background: isSelected ? '#DEEBFF' : 'transparent',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isSelected ? ACCENT : '#97A0AF'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: isSelected ? ACCENT : '#172B4D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {page.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#97A0AF' }}>
                    {page.space_icon} {page.space_name}
                  </div>
                </div>
                {page.status === 'draft' && (
                  <span style={{ fontSize: '0.625rem', color: '#97A0AF', background: '#EBECF0', borderRadius: 3, padding: '1px 5px', flexShrink: 0 }}>draft</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Footer hint */}
        {results.length > 0 && (
          <div style={{ padding: '8px 18px', borderTop: '1px solid #F4F5F7', display: 'flex', gap: 16 }}>
            {[['↑↓', 'navigate'], ['↵', 'open'], ['ESC', 'close']].map(([key, label]) => (
              <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.6875rem', color: '#97A0AF' }}>
                <kbd style={{ background: '#F4F5F7', border: '1px solid #DFE1E6', borderRadius: 3, padding: '1px 4px', fontFamily: 'inherit' }}>{key}</kbd>
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
