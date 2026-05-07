import React, { useState, useMemo } from 'react'

const STATUS_COLORS = { todo: '#6B7280', 'in-progress': '#3B82F6', done: '#22C55E', blocked: '#EF4444' }
const STATUS_BG = { todo: '#F9FAFB', 'in-progress': '#EFF6FF', done: '#F0FDF4', blocked: '#FEF2F2' }
const PRIORITY_ICONS = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }
const ISSUE_ICONS = { epic: '🟣', story: '🟢', task: '🔵', bug: '🔴', subtask: '⚪' }

export default function SprintBoard({ nodes, onSetNodeMeta, onClose, onOpenDetail }) {
  const sprints = useMemo(() => {
    const set = new Set()
    Object.values(nodes).forEach(n => { if (n.sprint) set.add(n.sprint) })
    return ['Backlog', ...Array.from(set).sort()]
  }, [nodes])

  const [activeSprint, setActiveSprint] = useState(() => sprints[1] || 'Backlog')
  const [dragNodeId, setDragNodeId] = useState(null)
  const [dragOver, setDragOver] = useState(null)

  const columns = ['todo', 'in-progress', 'done', 'blocked']
  const COLUMN_LABELS = { todo: 'To Do', 'in-progress': 'In Progress', done: 'Done', blocked: 'Blocked' }

  const sprintNodes = useMemo(() => {
    if (activeSprint === 'Backlog') {
      return Object.values(nodes).filter(n => !n.sprint)
    }
    return Object.values(nodes).filter(n => n.sprint === activeSprint)
  }, [nodes, activeSprint])

  const byStatus = useMemo(() => {
    const map = { todo: [], 'in-progress': [], done: [], blocked: [], noStatus: [] }
    for (const n of sprintNodes) {
      const key = n.status || 'noStatus'
      if (map[key]) map[key].push(n)
      else map.noStatus.push(n)
    }
    return map
  }, [sprintNodes])

  function handleDrop(status) {
    if (!dragNodeId) return
    onSetNodeMeta?.(dragNodeId, { status: status === 'noStatus' ? null : status })
    setDragNodeId(null)
    setDragOver(null)
  }

  const totalPoints = (arr) => arr.reduce((s, n) => s + (n.storyPoints || 0), 0)

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 25, background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 12, background: 'white', flexShrink: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>Sprint Board</div>
        {/* Sprint tabs */}
        <div style={{ display: 'flex', gap: 2, flex: 1, flexWrap: 'wrap' }}>
          {sprints.map(sp => (
            <button key={sp} onClick={() => setActiveSprint(sp)} style={{
              padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
              border: '1px solid', cursor: 'pointer',
              background: activeSprint === sp ? '#EFF6FF' : 'white',
              color: activeSprint === sp ? '#3B82F6' : '#6B7280',
              borderColor: activeSprint === sp ? '#BFDBFE' : '#E5E7EB',
            }}>{sp}</button>
          ))}
        </div>
        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{sprintNodes.length} tasks · {totalPoints(sprintNodes)} pts</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9CA3AF', lineHeight: 1 }}>×</button>
      </div>

      {/* Kanban columns */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${columns.length}, 1fr)`, gap: 12, padding: 16, overflowY: 'auto', minHeight: 0 }}>
        {columns.map(col => {
          const colNodes = byStatus[col] || []
          const isDragTarget = dragOver === col
          return (
            <div
              key={col}
              onDragOver={e => { e.preventDefault(); setDragOver(col) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop(col)}
              style={{
                background: isDragTarget ? '#EFF6FF' : 'white',
                borderRadius: 12, border: `2px solid ${isDragTarget ? '#93C5FD' : '#E5E7EB'}`,
                display: 'flex', flexDirection: 'column', minHeight: 300, transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              {/* Column header */}
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[col] }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>{COLUMN_LABELS[col]}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, fontSize: '10px', color: '#9CA3AF' }}>
                  <span>{colNodes.length}</span>
                  {totalPoints(colNodes) > 0 && <span>· {totalPoints(colNodes)}pt</span>}
                </div>
              </div>

              {/* Cards */}
              <div style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
                {colNodes.map(node => (
                  <SprintCard
                    key={node.id}
                    node={node}
                    onDragStart={() => setDragNodeId(node.id)}
                    onDragEnd={() => { setDragNodeId(null); setDragOver(null) }}
                    isDragging={dragNodeId === node.id}
                    onClick={() => onOpenDetail?.(node.id)}
                  />
                ))}
                {colNodes.length === 0 && (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#D1D5DB', fontSize: '11px', border: '1px dashed #E5E7EB', borderRadius: 8 }}>
                    Drop cards here
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SprintCard({ node, onDragStart, onDragEnd, isDragging, onClick }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      style={{
        background: 'white', borderRadius: 8, padding: '10px 12px',
        border: '1px solid #E5E7EB', cursor: 'pointer',
        opacity: isDragging ? 0.4 : 1,
        boxShadow: isDragging ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'opacity 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
        {node.issueType && <span style={{ fontSize: '11px', flexShrink: 0 }}>{ISSUE_ICONS[node.issueType]}</span>}
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#111827', lineHeight: 1.3, flex: 1 }}>{node.title}</span>
        {node.priority && <span style={{ fontSize: '10px', flexShrink: 0 }}>{PRIORITY_ICONS[node.priority]}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {node.jiraKey && (
          <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#3B82F6', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 4, padding: '1px 5px' }}>{node.jiraKey}</span>
        )}
        {node.storyPoints != null && (
          <span style={{ fontSize: '10px', color: 'white', background: '#6B7280', borderRadius: '999px', padding: '1px 6px', fontWeight: 600 }}>{node.storyPoints}</span>
        )}
        {node.assignee && (
          <span style={{ fontSize: '10px', color: '#818CF8', background: '#EEF2FF', borderRadius: '999px', padding: '1px 6px' }}>
            {node.assignee.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
          </span>
        )}
        {node.dueDate && (
          <span style={{ fontSize: '10px', color: new Date(node.dueDate) < new Date() && node.status !== 'done' ? '#EF4444' : '#9CA3AF', marginLeft: 'auto' }}>
            {new Date(node.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  )
}
