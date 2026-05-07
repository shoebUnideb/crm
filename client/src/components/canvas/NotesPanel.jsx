import React, { useState, useEffect, useRef } from 'react'

function renderMarkdown(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:#F3F4F6;padding:1px 4px;border-radius:3px;font-family:monospace;font-size:11px">$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul style="margin:4px 0 4px 16px;padding:0">$1</ul>')
    .replace(/\n/g, '<br/>')
}

export default function NotesPanel({ node, onSave, onClose }) {
  const [text, setText] = useState(node?.notes ?? '')
  const [previewMode, setPreviewMode] = useState(false)
  const textareaRef = useRef(null)
  const savedRef = useRef(false)

  // Sync text when node changes
  useEffect(() => {
    setText(node?.notes ?? '')
    savedRef.current = false
    setPreviewMode(false)
  }, [node?.id])

  useEffect(() => {
    if (!previewMode) textareaRef.current?.focus()
  }, [previewMode])

  function handleSave() {
    if (!savedRef.current) {
      savedRef.current = true
      onSave(node.id, text)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') { handleSave(); onClose() }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { handleSave(); onClose() }
    e.stopPropagation()
  }

  if (!node) return null

  return (
    <div
      className="absolute top-0 right-0 h-full z-20 flex flex-col bg-white border-l border-gray-200 shadow-2xl"
      style={{ width: 280 }}
      onMouseDown={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="flex-1 min-w-0 mr-2">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Notes</p>
          <p className="text-sm font-semibold text-gray-700 truncate">{node.title}</p>
        </div>
        <button
          onClick={() => { handleSave(); onClose() }}
          className="text-gray-400 hover:text-gray-700 text-xl leading-none shrink-0"
        >×</button>
      </div>

      {/* Edit / Preview tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA', flexShrink: 0 }}>
        {['Edit', 'Preview'].map(tab => (
          <button
            key={tab}
            onClick={() => { if (tab === 'Preview') handleSave(); setPreviewMode(tab === 'Preview') }}
            style={{
              flex: 1, padding: '6px 4px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: '11px', fontWeight: 600,
              color: (previewMode ? tab === 'Preview' : tab === 'Edit') ? '#3B82F6' : '#6B7280',
              borderBottom: (previewMode ? tab === 'Preview' : tab === 'Edit') ? '2px solid #3B82F6' : '2px solid transparent',
            }}
          >{tab}</button>
        ))}
      </div>

      {/* Content */}
      {previewMode ? (
        <div
          dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
          style={{ flex: 1, padding: '12px 16px', fontSize: 13, color: '#374151', overflowY: 'auto', lineHeight: 1.6 }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => { setText(e.target.value); savedRef.current = false }}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          placeholder="Add notes, links, context… (supports **bold**, *italic*, # headings, - lists, `code`)"
          className="flex-1 resize-none p-4 text-sm text-gray-700 outline-none bg-white placeholder-gray-300"
        />
      )}

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between shrink-0">
        <span className="text-xs text-gray-400">⌘↵ to save &amp; close</span>
        <button
          onClick={() => { handleSave(); onClose() }}
          className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700"
        >Save</button>
      </div>
    </div>
  )
}
