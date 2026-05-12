import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'

const ACCENT = '#0052CC'

export default function PageTree({ nodes, activePageId, spaceSlug, onCreatePage, onDelete, onDuplicate, onRename }) {
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null) // { id, label }

  function startRename(node) {
    setEditingId(node.id)
    setEditValue(node.nav_title || node.title || '')
  }

  function commitRename() {
    if (editingId !== null) {
      if (editValue.trim()) onRename?.(editingId, editValue.trim())
      setEditingId(null)
    }
  }

  function cancelRename() {
    setEditingId(null)
  }

  return (
    <>
      <div>
        {nodes.length === 0 && (
          <p style={{ fontSize: '0.75rem', color: '#B3BAC5', padding: '4px 6px', margin: 0 }}>No pages yet</p>
        )}
        {nodes.map(node => (
          <PageTreeNode
            key={node.id}
            node={node}
            activePageId={activePageId}
            spaceSlug={spaceSlug}
            onCreatePage={onCreatePage}
            onRequestDelete={target => setDeleteTarget(target)}
            onDuplicate={onDuplicate}
            onRename={onRename}
            editingId={editingId}
            editValue={editValue}
            setEditValue={setEditValue}
            startRename={startRename}
            commitRename={commitRename}
            cancelRename={cancelRename}
            depth={0}
          />
        ))}
      </div>

      {deleteTarget && createPortal(
        <DeleteConfirmModal
          label={deleteTarget.label}
          onConfirm={() => { onDelete?.(deleteTarget.id); setDeleteTarget(null) }}
          onCancel={() => setDeleteTarget(null)}
        />,
        document.body
      )}
    </>
  )
}

function PageTreeNode({
  node, activePageId, spaceSlug, onCreatePage, onRequestDelete, onDuplicate,
  editingId, editValue, setEditValue, startRename, commitRename, cancelRename,
  depth,
}) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const menuBtnRef = useRef(null)
  const inputRef = useRef(null)
  const hasChildren = node.children?.length > 0
  const isActive = node.id === activePageId
  const isEditing = editingId === node.id
  const label = node.nav_title || node.title || 'Untitled'

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          menuBtnRef.current && !menuBtnRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  function handleMenuAction(action) {
    setMenuOpen(false)
    if (action === 'rename') {
      startRename(node)
    } else if (action === 'delete') {
      onRequestDelete?.({ id: node.id, label })
    } else if (action === 'duplicate') {
      onDuplicate?.(node.id)
    } else if (action === 'new-child') {
      onCreatePage?.(node.id)
    }
  }

  return (
    <div>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false) }}
        style={{
          display: 'flex', alignItems: 'center', position: 'relative',
          paddingLeft: depth * 14 + 4,
          borderRadius: 5,
          background: isActive ? '#DEEBFF' : hovered ? '#F4F5F7' : 'transparent',
          marginBottom: 1,
        }}
      >
        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(v => !v)}
          style={{
            width: 16, height: 16, flexShrink: 0, background: 'none', border: 'none',
            cursor: hasChildren ? 'pointer' : 'default', color: '#97A0AF', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: hasChildren ? 1 : 0, pointerEvents: hasChildren ? 'auto' : 'none',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
          >
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        {/* Page icon */}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={isActive ? ACCENT : '#97A0AF'} strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginRight: 5, marginLeft: 2 }}
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>

        {/* Title or inline rename input */}
        {isEditing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); commitRename() }
              if (e.key === 'Escape') { e.preventDefault(); cancelRename() }
            }}
            style={{
              flex: 1, fontSize: '0.8125rem', color: '#172B4D', fontWeight: 500,
              border: '1px solid ' + ACCENT, borderRadius: 4, padding: '2px 6px',
              outline: 'none', background: '#fff',
            }}
          />
        ) : (
          <button
            onClick={() => navigate(`/app/docs/${spaceSlug}/${node.id}`)}
            style={{
              flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
              fontSize: '0.8125rem', color: isActive ? ACCENT : '#172B4D',
              fontWeight: isActive ? 600 : 400, padding: '5px 4px 5px 0',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {label}
          </button>
        )}

        {/* Status badge (hidden while editing) */}
        {!isEditing && node.status === 'draft' && (
          <span style={{ fontSize: '0.625rem', color: '#97A0AF', background: '#EBECF0', borderRadius: 3, padding: '1px 4px', flexShrink: 0, marginRight: 2 }}>
            draft
          </span>
        )}

        {/* Restriction indicator */}
        {!isEditing && node.restriction_count > 0 && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#97A0AF" strokeWidth="2" style={{ flexShrink: 0, marginRight: 2 }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        )}

        {/* Hover action buttons: + and ⋯ */}
        {!isEditing && hovered && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <button
              onClick={e => { e.stopPropagation(); onCreatePage?.(node.id) }}
              title="Add child page"
              style={{
                width: 18, height: 18, background: 'none', border: 'none',
                cursor: 'pointer', color: '#97A0AF', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = ACCENT; e.currentTarget.style.background = '#DEEBFF' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#97A0AF'; e.currentTarget.style.background = 'none' }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>

            <button
              ref={menuBtnRef}
              onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
              title="More options"
              style={{
                width: 18, height: 18, background: menuOpen ? '#EBECF0' : 'none', border: 'none',
                cursor: 'pointer', color: '#97A0AF', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#172B4D'; e.currentTarget.style.background = '#EBECF0' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#97A0AF'; e.currentTarget.style.background = menuOpen ? '#EBECF0' : 'none' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
              </svg>
            </button>
          </div>
        )}

        {/* Context menu dropdown */}
        {menuOpen && (
          <div
            ref={menuRef}
            style={{
              position: 'absolute', top: '100%', right: 0, zIndex: 400,
              background: '#fff', border: '1px solid #DFE1E6', borderRadius: 6,
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              minWidth: 160, padding: '4px 0',
            }}
          >
            {[
              { key: 'rename',    icon: <PencilIcon />, label: 'Rename',         color: '#172B4D' },
              { key: 'new-child', icon: <PlusIcon />,   label: 'New child page', color: '#172B4D' },
              { key: 'duplicate', icon: <CopyIcon />,   label: 'Duplicate',      color: '#172B4D' },
              { key: 'delete',    icon: <TrashIcon />,  label: 'Delete',         color: '#DE350B' },
            ].map(item => (
              <button
                key={item.key}
                onClick={e => { e.stopPropagation(); handleMenuAction(item.key) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '7px 14px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '0.8125rem', color: item.color, textAlign: 'left',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = item.key === 'delete' ? '#FFF5F5' : '#F4F5F7' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {node.children.map(child => (
            <PageTreeNode
              key={child.id}
              node={child}
              activePageId={activePageId}
              spaceSlug={spaceSlug}
              onCreatePage={onCreatePage}
              onRequestDelete={onRequestDelete}
              onDuplicate={onDuplicate}
              editingId={editingId}
              editValue={editValue}
              setEditValue={setEditValue}
              startRename={startRename}
              commitRename={commitRename}
              cancelRename={cancelRename}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  )
}

function DeleteConfirmModal({ label, onConfirm, onCancel }) {
  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onCancel])

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(9,30,66,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 10,
          boxShadow: '0 8px 32px rgba(9,30,66,0.22)',
          padding: '28px 28px 22px',
          width: 360, maxWidth: '90vw',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: '#FFF5F5', display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DE350B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
        </div>

        <p style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700, color: '#172B4D' }}>
          Delete page?
        </p>
        <p style={{ margin: '0 0 22px', fontSize: '0.875rem', color: '#5E6C84', lineHeight: 1.5 }}>
          <strong style={{ color: '#172B4D' }}>"{label}"</strong> and all its child pages will be permanently deleted. This action cannot be undone.
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 18px', borderRadius: 6, border: '1px solid #DFE1E6',
              background: '#fff', color: '#172B4D', fontSize: '0.875rem', fontWeight: 500,
              cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 18px', borderRadius: 6, border: 'none',
              background: '#DE350B', color: '#fff', fontSize: '0.875rem', fontWeight: 600,
              cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#BF2600'}
            onMouseLeave={e => e.currentTarget.style.background = '#DE350B'}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
