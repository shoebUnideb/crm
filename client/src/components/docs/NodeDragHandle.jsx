import React, { useEffect, useRef, useState } from 'react'
import { NodeSelection } from '@tiptap/pm/state'

export default function NodeDragHandle({ editor }) {
  const [pos, setPos] = useState(null) // { top, left, nodePos, nodeEnd }
  const dragging = useRef(false)
  const hideTimer = useRef(null)
  const overHandle = useRef(false)

  function scheduleHide() {
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      if (!overHandle.current && !dragging.current) setPos(null)
    }, 250)
  }

  function cancelHide() {
    clearTimeout(hideTimer.current)
  }

  useEffect(() => {
    return () => clearTimeout(hideTimer.current)
  }, [])

  useEffect(() => {
    if (!editor) return
    const view = editor.view

    function findTopBlock(clientX, clientY) {
      // Clamp X to be within the editor's horizontal bounds so posAtCoords
      // works even when mouse is to the left of the text (in the handle zone).
      const editorRect = view.dom.getBoundingClientRect()
      const clampedX = Math.max(editorRect.left + 2, Math.min(editorRect.right - 2, clientX))

      const pmPos = view.posAtCoords({ left: clampedX, top: clientY })
      if (!pmPos) return null
      try {
        const $pos = view.state.doc.resolve(pmPos.pos)
        if ($pos.depth < 1) return null
        const nodePos = $pos.before(1)
        const node = view.state.doc.nodeAt(nodePos)
        const dom = view.nodeDOM(nodePos)
        if (!(dom instanceof Element)) return null
        return { nodePos, nodeEnd: nodePos + (node?.nodeSize ?? 1), dom }
      } catch { return null }
    }

    // Listen on document so we catch mouse movements into the handle zone
    // (which is outside the editor DOM) without losing the handle.
    function onDocMouseMove(e) {
      if (dragging.current || overHandle.current) return

      const editorRect = view.dom.getBoundingClientRect()
      // Extend detection 56px to the left of the editor (handle zone width)
      const inZone =
        e.clientX >= editorRect.left - 56 &&
        e.clientX <= editorRect.right &&
        e.clientY >= editorRect.top &&
        e.clientY <= editorRect.bottom

      if (!inZone) { scheduleHide(); return }

      const result = findTopBlock(e.clientX, e.clientY)
      if (!result) { scheduleHide(); return }

      cancelHide()
      const rect = result.dom.getBoundingClientRect()
      setPos({
        top: rect.top,
        left: rect.left,
        nodePos: result.nodePos,
        nodeEnd: result.nodeEnd,
      })
    }

    // On scroll: recompute position of the currently shown block
    function onScroll() {
      if (dragging.current || !pos) return
      try {
        const dom = view.nodeDOM(pos.nodePos)
        if (dom instanceof Element) {
          const rect = dom.getBoundingClientRect()
          setPos(p => p ? { ...p, top: rect.top, left: rect.left } : null)
        } else {
          scheduleHide()
        }
      } catch { scheduleHide() }
    }

    document.addEventListener('mousemove', onDocMouseMove)
    document.addEventListener('scroll', onScroll, { passive: true, capture: true })

    return () => {
      document.removeEventListener('mousemove', onDocMouseMove)
      document.removeEventListener('scroll', onScroll, { capture: true })
    }
  }, [editor]) // pos intentionally excluded — onScroll reads it via closure but setPos is stable

  function onDragStart(e) {
    if (!pos || !editor) return
    dragging.current = true
    const { view, state } = editor
    try {
      const sel = NodeSelection.create(state.doc, pos.nodePos)
      view.dragging = { slice: sel.content(), move: true }
      view.dispatch(state.tr.setSelection(sel))
      const domNode = view.nodeDOM(pos.nodePos)
      if (domNode instanceof Element) e.dataTransfer.setDragImage(domNode, 20, 10)
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', '__tiptap_node_drag__')
    } catch (err) {
      console.warn('NodeDragHandle dragstart:', err)
      dragging.current = false
    }
  }

  function onDragEnd() {
    dragging.current = false
    overHandle.current = false
    setPos(null)
    if (editor) editor.view.dragging = null
  }

  function onAddBlock(e) {
    e.preventDefault()
    if (!pos || !editor) return
    const insertAt = pos.nodeEnd
    editor
      .chain()
      .focus()
      .insertContentAt(insertAt, { type: 'paragraph' })
      .setTextSelection(insertAt + 1)
      .run()
    setTimeout(() => editor.commands.insertContent('/'), 10)
    setPos(null)
  }

  if (!pos) return null

  return (
    <div
      onMouseEnter={() => { overHandle.current = true; cancelHide() }}
      onMouseLeave={() => { overHandle.current = false; scheduleHide() }}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left - 50,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        userSelect: 'none',
      }}
    >
      {/* + button */}
      <button
        onMouseDown={onAddBlock}
        title="Add block below (or press Enter)"
        style={{
          width: 20, height: 20, borderRadius: 4, border: 'none',
          cursor: 'pointer', background: 'transparent',
          color: '#C1C7D0', fontSize: '16px', fontWeight: 400,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          lineHeight: 1, padding: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#5E6C84'; e.currentTarget.style.background = '#EBECF0' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#C1C7D0'; e.currentTarget.style.background = 'transparent' }}
      >
        +
      </button>

      {/* ⠿ drag grip */}
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        title="Drag to reorder block"
        style={{
          cursor: 'grab', padding: '3px 3px',
          borderRadius: 4, color: '#C1C7D0',
          display: 'flex', alignItems: 'center',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#5E6C84'; e.currentTarget.style.background = '#EBECF0' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#C1C7D0'; e.currentTarget.style.background = 'transparent' }}
      >
        <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
          <circle cx="2.5" cy="2.5" r="1.5"/>
          <circle cx="2.5" cy="7"   r="1.5"/>
          <circle cx="2.5" cy="11.5" r="1.5"/>
          <circle cx="7.5" cy="2.5" r="1.5"/>
          <circle cx="7.5" cy="7"   r="1.5"/>
          <circle cx="7.5" cy="11.5" r="1.5"/>
        </svg>
      </div>
    </div>
  )
}
