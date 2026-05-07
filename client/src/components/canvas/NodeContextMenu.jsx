import React, { useEffect, useRef } from 'react'

export default function NodeContextMenu({ x, y, node, isRoot, onEdit, onDuplicate, onAddChild, onDelete, onEditNotes, onSetUrl, onSaveTemplate, onClose, onMerge, onSplit, onStartTimer, onStopTimer, timerActive, onOpenDetail }) {
  const menuRef = useRef(null)

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    function onDown(e) { if (!menuRef.current?.contains(e.target)) onClose() }
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('mousedown', onDown, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('mousedown', onDown, true)
    }
  }, [onClose])

  // Clamp so menu stays in viewport
  const style = {
    position: 'fixed',
    left: Math.min(x, window.innerWidth - 200),
    top: Math.min(y, window.innerHeight - 280),
    zIndex: 50,
  }

  function item(label, icon, action, danger) {
    return (
      <button
        key={label}
        onClick={() => { action(); onClose() }}
        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 text-left ${danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'}`}
      >
        <span className="w-4 text-center">{icon}</span>{label}
      </button>
    )
  }

  return (
    <div
      ref={menuRef}
      style={style}
      className="bg-white border border-gray-200 rounded-xl shadow-2xl py-1 w-48 overflow-hidden"
    >
      <div className="px-3 py-1.5 border-b border-gray-100">
        <p className="text-xs font-medium text-gray-500 truncate">{node.title}</p>
      </div>
      {onOpenDetail && item('Open detail', '⬡', onOpenDetail)}
      {onOpenDetail && <div className="border-t border-gray-100 my-1" />}
      {item('Edit title', '✎', onEdit)}
      {item('Edit notes', '📝', onEditNotes)}
      {item('Add child', '+', onAddChild)}
      {item('Duplicate', '⧉', onDuplicate)}
      {item(node.url ? 'Edit URL' : 'Set URL', '🔗', onSetUrl)}
      {onSaveTemplate && item('Save as template', '📌', onSaveTemplate)}
      {/* Timer */}
      {timerActive
        ? item('Stop timer', '⏹', onStopTimer ?? (() => {}))
        : item('Start timer', '⏱', onStartTimer ? () => onStartTimer(node.id) : () => {})
      }
      {/* Merge into parent */}
      {!isRoot && node.parentId && item('Merge into parent', '↑', onMerge ?? (() => {}))}
      {/* Split node */}
      {(node.childIds?.length ?? 0) >= 2 && item('Split node', '⇄', onSplit ?? (() => {}))}
      {!isRoot && <div className="border-t border-gray-100 my-1" />}
      {!isRoot && item('Delete', '🗑', onDelete, true)}
    </div>
  )
}
