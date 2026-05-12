import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Design tokens ─────────────────────────────────────────────────────────────
const navy        = '#172B4D'
const blue        = '#0052CC'
const subtle      = '#5E6C84'
const muted       = '#97A0AF'
const border      = '#DFE1E6'
const innerBorder = '#EBECF0'
const bg          = '#FAFBFC'

// ─── Helpers ───────────────────────────────────────────────────────────────────
function allNodes(project) {
  return project.maps
    ? Object.values(project.maps).flatMap(m => Object.values(m.nodes || {}))
    : Object.values(project.nodes || {})
}

function getMaps(project) {
  if (!project?.maps) return []
  const order = project.mapOrder || Object.keys(project.maps)
  return order.map(id => project.maps[id]).filter(Boolean)
}

// ─── RenameInput ───────────────────────────────────────────────────────────────
function RenameInput({ initialValue, onSave, onCancel, fontWeight = 400 }) {
  const [value, setValue] = useState(initialValue)
  const ref = useRef(null)
  const committed = useRef(false)
  useEffect(() => { ref.current?.select() }, [])
  function commit() {
    if (committed.current) return
    committed.current = true
    if (value.trim()) onSave(value.trim()); else onCancel()
  }
  return (
    <input
      ref={ref} value={value}
      onChange={e => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={e => {
        if (e.key === 'Enter') { e.preventDefault(); commit() }
        if (e.key === 'Escape') { committed.current = true; onCancel() }
      }}
      onClick={e => e.stopPropagation()}
      style={{
        flex: 1, fontSize: '0.8125rem', fontWeight,
        padding: '2px 6px', borderRadius: 4,
        border: `1px solid ${blue}`, outline: 'none', background: '#fff',
        color: navy, boxSizing: 'border-box', minWidth: 0,
      }}
    />
  )
}

// ─── InlineMenu ────────────────────────────────────────────────────────────────
function InlineMenu({ items }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        title="More options"
        style={{
          background: open ? innerBorder : 'transparent',
          border: 'none', cursor: 'pointer',
          width: 18, height: 18, borderRadius: 3,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: open ? navy : muted, padding: 0,
        }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.background = innerBorder; e.currentTarget.style.color = navy } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = muted } }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
        </svg>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 2px)', right: 0,
            background: '#fff', border: `1px solid ${border}`, borderRadius: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)', minWidth: 160, zIndex: 400,
            padding: '4px 0', overflow: 'hidden',
          }}
          onClick={e => e.stopPropagation()}
        >
          {items.map((item, i) =>
            item.divider
              ? <div key={i} style={{ height: 1, background: '#F4F5F7', margin: '4px 0' }} />
              : (
                <button
                  key={item.label}
                  onClick={() => { item.action(); setOpen(false) }}
                  style={{
                    display: 'flex', alignItems: 'center',
                    width: '100%', padding: '7px 14px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '0.8125rem', color: item.danger ? '#DE350B' : navy, textAlign: 'left',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = item.danger ? '#FFF5F5' : '#F4F5F7' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                >
                  {item.label}
                </button>
              )
          )}
        </div>
      )}
    </div>
  )
}

// ─── AddMapMenu ────────────────────────────────────────────────────────────────
function AddMapMenu({ onBlank, onFromTemplate }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        title="New map"
        style={{
          width: 18, height: 18, background: open ? '#DEEBFF' : 'none', border: 'none',
          cursor: 'pointer', color: open ? blue : muted, padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3,
        }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.color = blue; e.currentTarget.style.background = '#DEEBFF' } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.color = muted; e.currentTarget.style.background = 'none' } }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 2px)', right: 0,
            background: '#fff', border: `1px solid ${border}`, borderRadius: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)', minWidth: 160, zIndex: 400,
            padding: '4px 0', overflow: 'hidden',
          }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => { setOpen(false); onBlank() }}
            style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '7px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8125rem', color: navy, textAlign: 'left' }}
            onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            Blank map
          </button>
          {onFromTemplate && (
            <button
              onClick={() => { setOpen(false); onFromTemplate() }}
              style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '7px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8125rem', color: navy, textAlign: 'left' }}
              onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              From template
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── DeleteConfirm ─────────────────────────────────────────────────────────────
function DeleteConfirm({ label, onConfirm, onCancel }) {
  return (
    <div style={{ margin: '2px 0 4px', padding: '10px 12px', background: '#FFEBE6', borderRadius: 6, border: '1px solid #FFBDAD' }}>
      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#BF2600', marginBottom: 8 }}>
        Delete "{label}"?
      </p>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={onConfirm}
          style={{ flex: 1, padding: '5px 0', background: '#DE350B', color: '#fff', border: 'none', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 600, cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = '#BF2600'}
          onMouseLeave={e => e.currentTarget.style.background = '#DE350B'}
        >Delete</button>
        <button
          onClick={onCancel}
          style={{ flex: 1, padding: '5px 0', background: 'transparent', color: subtle, border: `1px solid ${border}`, borderRadius: 4, fontSize: '0.6875rem', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >Cancel</button>
      </div>
    </div>
  )
}

// ─── MapNode ───────────────────────────────────────────────────────────────────
function MapNode({ map, projectId, isActive, renamingId, confirmDelete, onSwitch, onStartRename, onConfirmDelete, onCancelDelete, onDeleteMap, onShareMap }) {
  const [hov, setHov] = useState(false)
  const isRenaming = renamingId?.type === 'map' && renamingId.id === map.id
  const isConfirming = confirmDelete?.type === 'map' && confirmDelete.id === map.id

  const menuItems = [
    { label: 'Rename', action: () => onStartRename({ type: 'map', id: map.id, projectId }) },
    ...(onShareMap ? [{ label: map.collab ? 'Manage collab' : 'Share map', action: () => onShareMap(projectId, map.id) }] : []),
    { divider: true },
    { label: 'Delete map', action: () => onConfirmDelete({ type: 'map', id: map.id, name: map.name, projectId }), danger: true },
  ]

  return (
    <div>
      <div
        onClick={onSwitch}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'flex', alignItems: 'center',
          paddingLeft: 18, paddingRight: 6, paddingTop: 5, paddingBottom: 5,
          cursor: 'pointer', borderRadius: 5, marginBottom: 1,
          background: isActive ? '#DEEBFF' : hov ? '#F4F5F7' : 'transparent',
          transition: 'background 0.1s',
        }}
      >
        {/* spacer to align with project rows that have a chevron */}
        <div style={{ width: 16, flexShrink: 0 }} />

        {isRenaming ? (
          <RenameInput
            initialValue={map.name}
            onSave={name => onStartRename({ type: 'map', id: map.id, projectId, save: true, name })}
            onCancel={() => onStartRename({ type: 'map', id: map.id, projectId, cancel: true })}
            fontWeight={isActive ? 600 : 400}
          />
        ) : (
          <span style={{
            flex: 1, minWidth: 0, fontSize: '0.8125rem',
            fontWeight: isActive ? 600 : 400,
            color: isActive ? blue : navy,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            padding: '0 4px 0 0',
          }}>
            {map.name}
          </span>
        )}

        {!isRenaming && hov && (
          <div onClick={e => e.stopPropagation()} style={{ flexShrink: 0 }}>
            <InlineMenu items={menuItems} />
          </div>
        )}

        {!isRenaming && !hov && map.collab && (
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#36B37E', flexShrink: 0 }} />
        )}
      </div>

      {isConfirming && (
        <div style={{ paddingLeft: 18, paddingRight: 6 }}>
          <DeleteConfirm
            label={confirmDelete.name}
            onConfirm={() => { onDeleteMap(projectId, map.id); onCancelDelete() }}
            onCancel={onCancelDelete}
          />
        </div>
      )}
    </div>
  )
}

// ─── ProjectNode ───────────────────────────────────────────────────────────────
function ProjectNode({
  project, isActive, activeMapId, expanded, onToggle,
  renamingId, confirmDelete,
  onSwitch, onStartRename, onConfirmDelete, onCancelDelete,
  onCreateMap, onCreateMapFromTemplate, onDeleteProject,
  onSwitchMap, onDeleteMap, onShare, onShareMap,
}) {
  const [hov, setHov] = useState(false)
  const maps = getMaps(project)
  const hasMaps = maps.length > 0
  const isRenaming = renamingId?.type === 'project' && renamingId.id === project.id
  const isConfirming = confirmDelete?.type === 'project' && confirmDelete.id === project.id

  const menuItems = [
    { label: 'Rename project', action: () => onStartRename({ type: 'project', id: project.id }) },
    { label: project.collab ? 'Manage collab' : 'Share project', action: () => onShare?.(project.id) },
    { divider: true },
    { label: 'Delete project', action: () => onConfirmDelete({ type: 'project', id: project.id, name: project.name }), danger: true },
  ]

  return (
    <div>
      {/* Project row */}
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'flex', alignItems: 'center',
          paddingLeft: 4, paddingRight: 6, paddingTop: 5, paddingBottom: 5,
          cursor: 'pointer', borderRadius: 5, marginBottom: 1,
          background: isActive && !activeMapId ? '#DEEBFF' : hov ? '#F4F5F7' : 'transparent',
          transition: 'background 0.1s',
        }}
      >
        {/* Expand/collapse chevron */}
        <button
          onClick={e => { e.stopPropagation(); onToggle() }}
          style={{
            width: 16, height: 16, flexShrink: 0,
            background: 'none', border: 'none', padding: 0,
            cursor: hasMaps ? 'pointer' : 'default',
            color: muted,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: hasMaps ? 1 : 0,
            pointerEvents: hasMaps ? 'auto' : 'none',
          }}
        >
          <svg
            width="10" height="10" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
          >
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        {isRenaming ? (
          <RenameInput
            initialValue={project.name}
            onSave={name => onStartRename({ type: 'project', id: project.id, save: true, name })}
            onCancel={() => onStartRename({ type: 'project', id: project.id, cancel: true })}
            fontWeight={600}
          />
        ) : (
          <button
            onClick={() => { onSwitch(project.id); onToggle() }}
            style={{
              flex: 1, minWidth: 0, background: 'none', border: 'none', cursor: 'pointer',
              textAlign: 'left', fontSize: '0.8125rem',
              fontWeight: 600,
              color: isActive && !activeMapId ? blue : navy,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              padding: '0 4px 0 4px',
            }}
          >
            {project.name}
          </button>
        )}

        {!isRenaming && hov && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}
            onClick={e => e.stopPropagation()}>
            {/* + New map dropdown */}
            <AddMapMenu
              onBlank={() => onCreateMap(project.id)}
              onFromTemplate={onCreateMapFromTemplate ? () => onCreateMapFromTemplate(project.id) : null}
            />
            <InlineMenu items={menuItems} />
          </div>
        )}

        {!isRenaming && !hov && project.collab && (
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#36B37E', flexShrink: 0 }} />
        )}
      </div>

      {/* Inline project delete confirm */}
      {isConfirming && (
        <div style={{ paddingLeft: 4, paddingRight: 6 }}>
          <DeleteConfirm
            label={confirmDelete.name}
            onConfirm={() => { onDeleteProject(project.id); onCancelDelete() }}
            onCancel={onCancelDelete}
          />
        </div>
      )}

      {/* Map children */}
      {expanded && !isConfirming && maps.map(map => (
        <MapNode
          key={map.id}
          map={map}
          projectId={project.id}
          isActive={isActive && activeMapId === map.id}
          renamingId={renamingId}
          confirmDelete={confirmDelete}
          onSwitch={() => { onSwitch(project.id); onSwitchMap(project.id, map.id) }}
          onStartRename={onStartRename}
          onConfirmDelete={onConfirmDelete}
          onCancelDelete={onCancelDelete}
          onDeleteMap={onDeleteMap}
          onShareMap={onShareMap}
        />
      ))}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function ProjectsPanel({
  projects, activeId, activeMapId,
  onSwitch, onCreate, onRename, onDelete, onClose,
  onExport, onImport, onShare, onShareMap, onFromTemplate,
  onCreateMap, onDeleteMap, onRenameMap, onSwitchMap, onCreateMapFromTemplate,
  pendingRenameId, onPendingRenameConsumed,
}) {
  const navigate = useNavigate()
  const [expandedProjects, setExpandedProjects] = useState(() => new Set(activeId ? [activeId] : []))
  const [renamingId, setRenamingId]     = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const importRef = useRef(null)

  // Auto-expand when active project changes externally
  useEffect(() => {
    if (activeId) {
      setExpandedProjects(prev => {
        const next = new Set(prev)
        next.add(activeId)
        return next
      })
    }
  }, [activeId])

  // Auto-start rename on newly created project
  useEffect(() => {
    if (pendingRenameId) {
      setExpandedProjects(prev => { const n = new Set(prev); n.add(pendingRenameId); return n })
      setRenamingId({ type: 'project', id: pendingRenameId })
      onPendingRenameConsumed?.()
    }
  }, [pendingRenameId])

  function toggleProject(id) {
    setExpandedProjects(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function handleStartRename(desc) {
    if (desc.save) {
      if (desc.type === 'project') onRename(desc.id, desc.name)
      if (desc.type === 'map') onRenameMap(desc.projectId, desc.id, desc.name)
      setRenamingId(null)
    } else if (desc.cancel) {
      setRenamingId(null)
    } else {
      setRenamingId(desc)
    }
  }

  function handleDeleteProject(projectId) {
    onDelete(projectId)
    const remaining = projects.filter(p => p.id !== projectId)
    if (remaining.length > 0) onSwitch(remaining[0].id)
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try { onImport?.(JSON.parse(ev.target.result)) } catch { /* invalid json */ }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleCreateProject() {
    const id = onCreate('New Project')
    if (id) {
      setExpandedProjects(prev => { const n = new Set(prev); n.add(id); return n })
      setRenamingId({ type: 'project', id })
    }
  }

  return (
    <aside style={{
      width: 240, height: '100%',
      background: bg, borderRight: `1px solid ${border}`,
      display: 'flex', flexDirection: 'column',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      overflow: 'hidden',
    }}>

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '10px 12px 4px', borderBottom: `1px solid ${innerBorder}`,
        flexShrink: 0,
      }}>
        {/* Back to Capsule */}
        <button
          onClick={() => navigate('/app/canvas-info')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, width: '100%',
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px 6px', borderRadius: 5, marginBottom: 6,
            color: muted, fontSize: '0.75rem',
            transition: 'color 0.15s, background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = navy; e.currentTarget.style.background = innerBorder }}
          onMouseLeave={e => { e.currentTarget.style.color = muted; e.currentTarget.style.background = 'none' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back to Capsule
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 6px' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Projects
          </span>
          {onClose && (
            <button
              onClick={onClose}
              title="Close sidebar"
              style={{ background: 'none', border: 'none', cursor: 'pointer', width: 22, height: 22, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', color: muted }}
              onMouseEnter={e => { e.currentTarget.style.background = innerBorder; e.currentTarget.style.color = navy }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = muted }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>

        {/* New project — full-width dashed button, wiki style */}
        <div style={{ padding: '6px 0 8px' }}>
          <button
            onClick={handleCreateProject}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, width: '100%',
              background: 'none', border: `1px dashed ${border}`, borderRadius: 6,
              cursor: 'pointer', padding: '6px 10px',
              color: subtle, fontSize: '0.8125rem',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = navy; e.currentTarget.style.color = navy }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = subtle }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New project
          </button>
        </div>
      </div>

      {/* ── Tree ─────────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
        {projects.length === 0 && (
          <p style={{ fontSize: '0.75rem', color: muted, padding: '4px 6px', margin: 0 }}>No projects yet</p>
        )}
        {projects.map(project => (
          <ProjectNode
            key={project.id}
            project={project}
            isActive={project.id === activeId}
            activeMapId={project.id === activeId ? activeMapId : null}
            expanded={expandedProjects.has(project.id)}
            onToggle={() => toggleProject(project.id)}
            renamingId={renamingId}
            confirmDelete={confirmDelete}
            onSwitch={onSwitch}
            onStartRename={handleStartRename}
            onConfirmDelete={setConfirmDelete}
            onCancelDelete={() => setConfirmDelete(null)}
            onCreateMap={id => {
              setExpandedProjects(prev => { const n = new Set(prev); n.add(id); return n })
              onCreateMap(id)
            }}
            onCreateMapFromTemplate={onCreateMapFromTemplate}
            onDeleteProject={handleDeleteProject}
            onSwitchMap={onSwitchMap}
            onDeleteMap={onDeleteMap}
            onShare={onShare}
            onShareMap={onShareMap}
          />
        ))}
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      {(onExport || onImport) && (
        <div style={{ borderTop: `1px solid ${innerBorder}`, padding: '7px 10px', display: 'flex', gap: 4, flexShrink: 0 }}>
          {onExport && (
            <button
              onClick={() => activeId && onExport(activeId)}
              title="Export active project as JSON"
              style={{ flex: 1, padding: '5px 0', borderRadius: 4, fontSize: '0.75rem', fontWeight: 500, color: muted, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
              onMouseEnter={e => { e.currentTarget.style.background = innerBorder; e.currentTarget.style.color = navy }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = muted }}
            >
              Export
            </button>
          )}
          {onImport && (
            <button
              onClick={() => importRef.current?.click()}
              title="Import project from JSON"
              style={{ flex: 1, padding: '5px 0', borderRadius: 4, fontSize: '0.75rem', fontWeight: 500, color: muted, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
              onMouseEnter={e => { e.currentTarget.style.background = innerBorder; e.currentTarget.style.color = navy }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = muted }}
            >
              Import
            </button>
          )}
        </div>
      )}

      <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />
    </aside>
  )
}
