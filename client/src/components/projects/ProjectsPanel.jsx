import React, { useState, useRef, useEffect, useMemo } from 'react'

// ─── helpers ─────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#0052CC', '#6554C0', '#00875A', '#FF5630', '#FF8B00', '#00B8D9', '#DE350B', '#36B37E']

function projectColor(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function relativeTime(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins}m`
  if (hours < 24) return `${hours}h`
  if (days === 1) return '1d'
  if (days < 7) return `${days}d`
  if (days < 30) return `${Math.floor(days / 7)}w`
  return `${Math.floor(days / 30)}mo`
}

function allNodes(project) {
  return project.maps
    ? Object.values(project.maps).flatMap(m => Object.values(m.nodes || {}))
    : Object.values(project.nodes || {})
}

// ─── sub-components ───────────────────────────────────────────────────────────
function RenameInput({ initialValue, onSave, onCancel }) {
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
        flex: 1, fontSize: 12, padding: '4px 8px', borderRadius: 5,
        border: '1.5px solid #4C9AFF', outline: 'none', background: '#fff',
        color: '#172B4D', boxSizing: 'border-box', minWidth: 0,
      }}
    />
  )
}

// ─── Rail project row ─────────────────────────────────────────────────────────
function RailAvatar({ project, isActive, isOpen, onClick }) {
  const [hov, setHov] = useState(false)
  const nodes = allNodes(project)
  const totalNodes = nodes.length
  const doneNodes = nodes.filter(n => n.status === 'done').length

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 12px 7px 0',
        background: isActive ? 'rgba(255,255,255,0.1)' : hov ? 'rgba(255,255,255,0.05)' : 'transparent',
        border: 'none',
        borderLeft: `3px solid ${isActive ? '#fff' : 'transparent'}`,
        paddingLeft: 13,
        cursor: 'pointer', textAlign: 'left',
        transition: 'background 0.12s, border-color 0.12s',
        boxSizing: 'border-box',
      }}
    >
      <span style={{
        flex: 1, minWidth: 0, fontSize: 12,
        fontWeight: isActive ? 600 : 400,
        color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        transition: 'color 0.12s',
      }}>
        {project.name}
      </span>
      {totalNodes > 0 && (
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', flexShrink: 0 }}>
          {doneNodes}/{totalNodes}
        </span>
      )}
      {project.collab && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#36B37E', flexShrink: 0 }} />
      )}
    </button>
  )
}

// ─── Map row in the flyout ────────────────────────────────────────────────────
function MapRow({ map, isActive, color, onSwitch, onRename, onDelete, renamingId, onRenameSave, onRenameCancel }) {
  const [hov, setHov] = useState(false)
  const nodeCount = Object.keys(map.nodes || {}).length

  if (renamingId === map.id) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', gap: 7 }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8590A2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
          <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
        </svg>
        <RenameInput initialValue={map.name} onSave={n => onRenameSave(map.id, n)} onCancel={onRenameCancel} />
      </div>
    )
  }

  return (
    <div
      onClick={onSwitch}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 12px',
        cursor: 'pointer',
        background: isActive ? color + '12' : hov ? '#F8F9FA' : 'transparent',
        borderLeft: `2px solid ${isActive ? color : 'transparent'}`,
        transition: 'background 0.1s, border-color 0.1s',
      }}
    >
      {/* Active indicator */}
      {isActive && (
        <svg width="9" height="9" viewBox="0 0 24 24" fill={color} stroke="none" style={{ flexShrink: 0 }}>
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
      )}
      {!isActive && (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={hov ? '#626F86' : '#C1C7D0'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
          <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
        </svg>
      )}

      <span style={{
        flex: 1, minWidth: 0, fontSize: 12,
        fontWeight: isActive ? 600 : 400,
        color: isActive ? color : hov ? '#172B4D' : '#344563',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {map.name}
      </span>

      {/* Node count — hide on hover to make room for actions */}
      {!hov && (
        <span style={{ fontSize: 10, color: '#8590A2', flexShrink: 0 }}>{nodeCount}</span>
      )}

      {/* Map collab dot */}
      {map.collab && !hov && (
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#36B37E', flexShrink: 0 }} />
      )}

      {/* Actions on hover */}
      {hov && (
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          <button
            onClick={e => { e.stopPropagation(); onRename(map.id) }}
            title="Rename"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 4px', borderRadius: 4, color: '#626F86', display: 'flex', alignItems: 'center' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#E2E4EA'; e.currentTarget.style.color = '#172B4D' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#626F86' }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(map.id) }}
            title="Delete"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 4px', borderRadius: 4, color: '#626F86', display: 'flex', alignItems: 'center' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FFEBE6'; e.currentTarget.style.color = '#DE350B' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#626F86' }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Flyout panel ─────────────────────────────────────────────────────────────
function Flyout({
  project, activeMapId,
  onClose, onShare, onShareMap, onRenameProject, onDeleteProject,
  onSwitchMap, onCreateMap, onCreateMapFromTemplate,
  onDeleteMap, onRenameMap,
  onExport, onImport,
  importRef,
  initialRenamingId, onRenameConsumed,
}) {
  const [renamingProjectId, setRenamingProjectId] = useState(initialRenamingId || null)
  const [renamingMapId, setRenamingMapId] = useState(null)
  const [confirmDeleteMap, setConfirmDeleteMap] = useState(null)
  const color = projectColor(project.name)

  // Accept externally-triggered rename (e.g. after programmatic project creation)
  useEffect(() => {
    if (initialRenamingId) {
      setRenamingProjectId(initialRenamingId)
      onRenameConsumed?.()
    }
  }, [initialRenamingId])

  const maps = useMemo(() => {
    if (!project.maps) return []
    const order = project.mapOrder || Object.keys(project.maps)
    return order.map(id => project.maps[id]).filter(Boolean)
  }, [project.maps, project.mapOrder])

  const nodes = allNodes(project)
  const total = nodes.length
  const done = nodes.filter(n => n.status === 'done').length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div style={{
      width: 210, height: '100%',
      background: '#FAFBFC',
      borderRight: '1px solid #EBECF0',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Project header */}
      <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid #EBECF0', flexShrink: 0 }}>
        {renamingProjectId === project.id ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
              {(project.name || '?').charAt(0).toUpperCase()}
            </div>
            <RenameInput
              initialValue={project.name}
              onSave={name => { onRenameProject(project.id, name); setRenamingProjectId(null) }}
              onCancel={() => setRenamingProjectId(null)}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
              {(project.name || '?').charAt(0).toUpperCase()}
            </div>
            <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: '#172B4D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {project.name}
            </span>
            {/* Overflow menu */}
            <FlyoutMenu color={color} onRename={() => setRenamingProjectId(project.id)} onShare={() => onShare?.(project.id)} onDelete={() => onDeleteProject(project.id)} hasCollab={!!project.collab} />
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: total > 0 ? 8 : 0 }}>
          <span style={{ fontSize: 10, color: '#8590A2' }}>{maps.length} map{maps.length !== 1 ? 's' : ''}</span>
          <span style={{ width: 2, height: 2, borderRadius: '50%', background: '#C1C7D0' }} />
          <span style={{ fontSize: 10, color: '#8590A2' }}>{total} nodes</span>
          {total > 0 && (
            <>
              <span style={{ width: 2, height: 2, borderRadius: '50%', background: '#C1C7D0' }} />
              <span style={{ fontSize: 10, color: pct === 100 ? '#006644' : '#8590A2', fontWeight: pct > 0 ? 600 : 400 }}>{pct}%</span>
            </>
          )}
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div style={{ height: 2, background: '#E2E4EA', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: pct === 100 ? '#36B37E' : `linear-gradient(90deg, ${color}88, ${color})`,
              borderRadius: 99, transition: 'width 0.3s ease',
            }} />
          </div>
        )}
      </div>

      {/* Add map buttons */}
      <div style={{ borderBottom: '1px solid #EBECF0', padding: '8px 10px', display: 'flex', gap: 6, flexShrink: 0 }}>
        <button
          onClick={() => onCreateMap(project.id)}
          style={{
            flex: 1, padding: '7px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500,
            background: '#fff', color: '#344563', border: '1.5px solid #DFE1E6',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            transition: 'border-color 0.1s, background 0.1s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = color + '10'; e.currentTarget.style.color = color }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#DFE1E6'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#344563' }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Blank
        </button>
        {onCreateMapFromTemplate && (
          <button
            onClick={() => onCreateMapFromTemplate(project.id)}
            style={{
              flex: 1, padding: '7px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500,
              background: '#fff', color: '#344563', border: '1.5px solid #DFE1E6',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              transition: 'border-color 0.1s, background 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#6554C0'; e.currentTarget.style.background = '#F3F0FF'; e.currentTarget.style.color = '#6554C0' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#DFE1E6'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#344563' }}
          >
            <span>📐</span>
            Template
          </button>
        )}
      </div>

      {/* Collaborate section — only show when not yet shared */}
      {!project.collab && (
      <div style={{ borderBottom: '1px solid #EBECF0', padding: '8px 10px', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <p style={{ margin: '0 0 4px', fontSize: 9, fontWeight: 700, color: '#8590A2', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Collaborate
            </p>
            <button
              onClick={() => onShare?.(project.id)}
              style={{
                width: '100%', padding: '7px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: '#0052CC', color: '#fff', border: '1.5px solid #0052CC',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                transition: 'background 0.1s, border-color 0.1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#0747A6'; e.currentTarget.style.borderColor = '#0747A6' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#0052CC'; e.currentTarget.style.borderColor = '#0052CC' }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Share whole project ({maps.length} map{maps.length !== 1 ? 's' : ''})
            </button>
            <button
              onClick={() => activeMapId && onShareMap?.(project.id, activeMapId)}
              disabled={!activeMapId}
              style={{
                width: '100%', padding: '6px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                background: 'transparent', color: activeMapId ? '#344563' : '#C1C7D0',
                border: `1.5px solid ${activeMapId ? '#DFE1E6' : '#EBECF0'}`,
                cursor: activeMapId ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                transition: 'border-color 0.1s, background 0.1s',
              }}
              onMouseEnter={e => { if (activeMapId) { e.currentTarget.style.borderColor = '#0052CC'; e.currentTarget.style.background = '#EBF2FF'; e.currentTarget.style.color = '#0052CC' } }}
              onMouseLeave={e => { if (activeMapId) { e.currentTarget.style.borderColor = '#DFE1E6'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#344563' } }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
              </svg>
              Share this map only
            </button>
          </div>
      </div>
      )}

      {/* Export / import */}
      {(onExport || onImport) && (
        <div style={{ borderBottom: '1px solid #EBECF0', padding: '7px 10px', display: 'flex', gap: 6, flexShrink: 0 }}>
          {onExport && (
            <button onClick={() => onExport(project.id)} title="Export project as JSON"
              style={{ flex: 1, padding: '6px 0', borderRadius: 5, fontSize: 10, fontWeight: 500, color: '#8590A2', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F1F2F4'; e.currentTarget.style.color = '#172B4D' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8590A2' }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export
            </button>
          )}
          {onImport && (
            <button onClick={() => importRef.current?.click()} title="Import project from JSON"
              style={{ flex: 1, padding: '6px 0', borderRadius: 5, fontSize: 10, fontWeight: 500, color: '#8590A2', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F1F2F4'; e.currentTarget.style.color = '#172B4D' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8590A2' }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Import
            </button>
          )}
        </div>
      )}

      {/* Section label */}
      <div style={{ padding: '10px 14px 5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#8590A2', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Mind Maps
        </span>
        <span style={{ fontSize: 10, color: '#C1C7D0' }}>{maps.length}</span>
      </div>

      {/* Map list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {maps.length === 0 && (
          <div style={{ padding: '16px 12px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#8590A2', margin: 0 }}>No maps yet</p>
          </div>
        )}

        {maps.map(map => {
          if (confirmDeleteMap === map.id) {
            return (
              <div key={map.id} style={{ margin: '5px 10px', padding: '9px 11px', background: '#FFEBE6', borderRadius: 6, border: '1px solid #FFBDAD' }}>
                <p style={{ fontSize: 11, color: '#BF2600', fontWeight: 600, marginBottom: 6 }}>Delete "{map.name}"?</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => { onDeleteMap(project.id, map.id); setConfirmDeleteMap(null) }}
                    style={{ flex: 1, padding: '5px 0', background: '#DE350B', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Delete</button>
                  <button onClick={() => setConfirmDeleteMap(null)}
                    style={{ flex: 1, padding: '5px 0', background: 'transparent', color: '#626F86', border: '1px solid #DFE1E6', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )
          }
          return (
            <MapRow
              key={map.id}
              map={map}
              isActive={activeMapId === map.id}
              color={color}
              onSwitch={() => onSwitchMap(project.id, map.id)}
              onRename={mapId => setRenamingMapId(mapId)}
              onDelete={mapId => setConfirmDeleteMap(mapId)}
              renamingId={renamingMapId}
              onRenameSave={(mapId, name) => { onRenameMap(project.id, mapId, name); setRenamingMapId(null) }}
              onRenameCancel={() => setRenamingMapId(null)}
            />
          )
        })}
      </div>
    </div>
  )
}

// ─── Overflow menu for flyout header ─────────────────────────────────────────
function FlyoutMenu({ color, onRename, onShare, onDelete, hasCollab }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        style={{
          background: open ? '#F1F2F4' : 'transparent', border: 'none', cursor: 'pointer',
          width: 24, height: 24, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#8590A2',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#F1F2F4'; e.currentTarget.style.color = '#172B4D' }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8590A2' } }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0,
          background: '#fff', border: '1px solid #DFE1E6', borderRadius: 8,
          boxShadow: '0 4px 16px rgba(9,30,66,0.15)', minWidth: 155, zIndex: 50,
          padding: '5px 0', overflow: 'hidden',
        }}
          onClick={e => e.stopPropagation()}
        >
          {[
            { label: hasCollab ? 'Manage collab' : 'Share', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>, action: () => { onShare?.(); setOpen(false) } },
            { label: 'Rename project', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>, action: () => { onRename(); setOpen(false) } },
          ].map(item => (
            <button key={item.label} onClick={item.action}
              style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#344563', textAlign: 'left' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F4F5F7' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
            >
              {item.icon}{item.label}
            </button>
          ))}
          <div style={{ height: 1, background: '#F4F5F7', margin: '4px 0' }} />
          <button onClick={() => { onDelete(); setOpen(false) }}
            style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#DE350B', textAlign: 'left' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FFEBE6' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            Delete project
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ProjectsPanel({
  projects, activeId, activeMapId,
  onSwitch, onCreate, onRename, onDelete, onClose,
  onExport, onImport, onShare, onShareMap, onFromTemplate,
  onCreateMap, onDeleteMap, onRenameMap, onSwitchMap, onCreateMapFromTemplate,
  pendingRenameId, onPendingRenameConsumed,
}) {
  const [openProjectId, setOpenProjectId] = useState(activeId)
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(null)
  const [flyoutRenameId, setFlyoutRenameId] = useState(null)
  const importRef = useRef(null)

  // Consume pendingRenameId from parent (triggered after programmatic project creation)
  useEffect(() => {
    if (pendingRenameId) {
      setOpenProjectId(pendingRenameId)
      setFlyoutRenameId(pendingRenameId)
      onPendingRenameConsumed?.()
    }
  }, [pendingRenameId])

  // Keep flyout in sync when active project changes externally
  useEffect(() => {
    setOpenProjectId(activeId)
  }, [activeId])

  const openProject = projects.find(p => p.id === openProjectId) || projects.find(p => p.id === activeId) || projects[0] || null

  function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try { onImport?.(JSON.parse(ev.target.result)) } catch { alert('Invalid JSON file') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleCreateProject() {
    const id = onCreate('New Project')
    if (id) {
      setOpenProjectId(id)
      setFlyoutRenameId(id)
    }
  }

  function handleDeleteProject(id) {
    setConfirmDeleteProject(id)
  }

  function confirmDelete(id) {
    onDelete(id)
    setConfirmDeleteProject(null)
    // Open another project's flyout
    const remaining = projects.filter(p => p.id !== id)
    if (remaining.length > 0) setOpenProjectId(remaining[remaining.length - 1].id)
  }

  return (
    <aside style={{
      height: '100%', display: 'flex', flexDirection: 'row',
      boxShadow: '4px 0 24px rgba(9,30,66,0.14)',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>

      {/* ── Rail ── */}
      <div style={{
        width: 180, height: '100%',
        background: '#172B4D',
        display: 'flex', flexDirection: 'column',
        flexShrink: 0,
        overflowX: 'hidden',
        overflowY: 'auto',
      }}>
        {/* Rail header: title + close button */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 12px 10px 16px', flexShrink: 0,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Projects
          </span>
          {onClose && (
            <button
              onClick={onClose}
              title="Close sidebar"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                width: 24, height: 24, borderRadius: 5,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.35)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Project list */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', flex: 1, overflowY: 'auto' }}>
          {projects.map(p => (
            <RailAvatar
              key={p.id}
              project={p}
              isActive={p.id === activeId}
              isOpen={p.id === openProjectId}
              onClick={() => {
                onSwitch(p.id)
                setOpenProjectId(p.id)
              }}
            />
          ))}
        </div>

        {/* New project button at bottom */}
        <div style={{ padding: '8px 10px 14px', flexShrink: 0 }}>
          <button
            onClick={handleCreateProject}
            title="New project"
            style={{
              width: '100%', padding: '6px 10px', borderRadius: 6,
              background: 'rgba(255,255,255,0.07)', border: '1px dashed rgba(255,255,255,0.2)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              color: 'rgba(255,255,255,0.4)', fontSize: 11,
              transition: 'background 0.12s, border-color 0.12s, color 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.13)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.45)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New project
          </button>
        </div>
      </div>

      {/* ── Flyout ── */}
      {confirmDeleteProject ? (
        <div style={{
          width: 210, height: '100%', background: '#FAFBFC', borderRight: '1px solid #EBECF0',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ padding: '22px 16px' }}>
            <div style={{ fontSize: 22, marginBottom: 10 }}>⚠️</div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#BF2600', marginBottom: 7 }}>
              Delete "{projects.find(p => p.id === confirmDeleteProject)?.name}"?
            </p>
            <p style={{ fontSize: 11, color: '#626F86', marginBottom: 16, lineHeight: 1.6 }}>
              All maps and nodes inside this project will be permanently deleted.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => confirmDelete(confirmDeleteProject)}
                style={{ flex: 1, padding: '7px 0', background: '#DE350B', color: '#fff', border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#BF2600' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#DE350B' }}
              >Delete</button>
              <button onClick={() => setConfirmDeleteProject(null)}
                style={{ flex: 1, padding: '7px 0', background: 'transparent', color: '#626F86', border: '1px solid #DFE1E6', borderRadius: 5, fontSize: 12, cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F1F2F4' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >Cancel</button>
            </div>
          </div>
        </div>
      ) : openProject ? (
        <Flyout
          project={openProject}
          activeMapId={openProject.id === activeId ? activeMapId : null}
          onClose={onClose}
          onShare={onShare}
          onShareMap={onShareMap}
          onRenameProject={onRename}
          onDeleteProject={handleDeleteProject}
          onSwitchMap={(projId, mapId) => { onSwitch(projId); onSwitchMap(projId, mapId) }}
          onCreateMap={onCreateMap}
          onCreateMapFromTemplate={onCreateMapFromTemplate}
          onDeleteMap={onDeleteMap}
          onRenameMap={onRenameMap}
          onExport={onExport}
          onImport={onImport}
          importRef={importRef}
          initialRenamingId={flyoutRenameId === openProject?.id ? flyoutRenameId : null}
          onRenameConsumed={() => setFlyoutRenameId(null)}
        />
      ) : (
        <div style={{ width: 210, height: '100%', background: '#FAFBFC', borderRight: '1px solid #EBECF0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>📁</div>
            <p style={{ fontSize: 12, color: '#8590A2', margin: '0 0 14px', lineHeight: 1.6 }}>
              No project selected.<br/>Click an avatar to begin.
            </p>
          </div>
        </div>
      )}

      {/* Hidden file input for import */}
      <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />
    </aside>
  )
}
