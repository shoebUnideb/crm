import React, { useEffect, useRef, useState, useCallback } from 'react'

const STATUS_COLORS = { todo: '#6B7280', 'in-progress': '#3B82F6', done: '#22C55E', blocked: '#EF4444' }
const PRIORITY_ICONS = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }

export default function SearchOverlay({ nodes, onNavigate, onClose }) {
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const q = query.trim().toLowerCase()
  const matches = q
    ? Object.values(nodes).filter(n => {
        if (n.title?.toLowerCase().includes(q)) return true
        if (n.assignee?.toLowerCase().includes(q)) return true
        if (n.jiraKey?.toLowerCase().includes(q)) return true
        if (n.tags?.some(t => t.toLowerCase().includes(q))) return true
        if (n.status?.toLowerCase().includes(q)) return true
        if (n.sprint?.toLowerCase().includes(q)) return true
        return false
      }).slice(0, 20)
    : []

  useEffect(() => { setCursor(0) }, [q])

  const confirm = useCallback((idx) => {
    const n = matches[idx ?? cursor]
    if (!n) return
    onNavigate(n.id)
    onClose()
  }, [matches, cursor, onNavigate, onClose])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setCursor(c => Math.min(c + 1, matches.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setCursor(c => Math.max(c - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        confirm()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose, matches.length, confirm])

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.children[cursor]
    el?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
      <div className="flex items-center px-3 py-2.5 border-b border-gray-100">
        <svg className="w-4 h-4 text-gray-400 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by title, assignee, tag, Jira key…"
          className="flex-1 text-sm outline-none bg-transparent"
        />
        <kbd className="text-xs bg-gray-100 border border-gray-200 rounded px-1 text-gray-400 mr-1">Esc</kbd>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
      </div>

      {matches.length > 0 && (
        <ul ref={listRef} className="max-h-64 overflow-y-auto py-1">
          {matches.map((n, i) => (
            <li key={n.id}>
              <button
                className={`w-full text-left px-4 py-2 flex items-center gap-2 transition-colors ${
                  i === cursor ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onMouseEnter={() => setCursor(i)}
                onClick={() => confirm(i)}
              >
                {n.priority && <span className="text-xs">{PRIORITY_ICONS[n.priority]}</span>}
                <span className={`text-sm font-medium truncate flex-1 ${i === cursor ? 'text-blue-700' : 'text-gray-800'}`}>
                  {n.title}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {n.jiraKey && (
                    <span className="text-xs font-mono text-blue-500 bg-blue-50 border border-blue-100 rounded px-1">{n.jiraKey}</span>
                  )}
                  {n.status && (
                    <span style={{ color: STATUS_COLORS[n.status] }} className="text-xs font-medium">{n.status}</span>
                  )}
                  {n.assignee && (
                    <span className="text-xs text-gray-400">{n.assignee.split(' ')[0]}</span>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {q && matches.length === 0 && (
        <p className="px-4 py-3 text-sm text-gray-400">No nodes match "{q}"</p>
      )}

      {!q && (
        <p className="px-4 py-3 text-xs text-gray-400">Search by title, assignee, tag, Jira key, status or sprint</p>
      )}

      <div className="px-3 py-1.5 border-t border-gray-100 flex items-center gap-3 text-xs text-gray-400">
        <span><kbd className="bg-gray-100 border border-gray-200 rounded px-1 font-mono">↑↓</kbd> navigate</span>
        <span><kbd className="bg-gray-100 border border-gray-200 rounded px-1 font-mono">↵</kbd> jump to node</span>
        <span className="ml-auto">{matches.length > 0 ? `${matches.length} result${matches.length > 1 ? 's' : ''}` : ''}</span>
      </div>
    </div>
  )
}
