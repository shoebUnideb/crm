import React, { useRef, useEffect, useState } from 'react'

export default function InlineEditor({ value, onSave, onCancel }) {
  const [text, setText] = useState(value)
  const inputRef = useRef(null)
  const committed = useRef(false)
  const triggerRef = useRef('blur')

  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.focus()
    input.select()
  }, [])

  const commit = (e) => {
    // Don't commit if focus is moving to another [data-node] element (palette, buttons)
    if (e?.relatedTarget?.closest?.('[data-node]')) return
    if (committed.current) return
    committed.current = true
    onSave(text.trim() || value, triggerRef.current)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); triggerRef.current = 'enter'; commit() }
    else if (e.key === 'Escape') {
      committed.current = true
      onCancel()
    }
  }

  return (
    <input
      ref={inputRef}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={commit}
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
        outline: 'none',
        background: 'transparent',
        fontSize: '13px',
        textAlign: 'center',
        color: '#374151',
        fontFamily: 'inherit',
      }}
    />
  )
}
