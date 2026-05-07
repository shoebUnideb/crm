import React, { useMemo } from 'react'

const COLUMNS = [
  { id: 'none', label: 'No Status', color: '#9CA3AF', bg: '#F9FAFB', border: '#E5E7EB' },
  { id: 'todo', label: 'To Do', color: '#6B7280', bg: '#F3F4F6', border: '#D1D5DB' },
  { id: 'in-progress', label: 'In Progress', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  { id: 'blocked', label: 'Blocked', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  { id: 'done', label: 'Done', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
]

const PRIORITY_DOT = { critical: '#EF4444', high: '#F97316', medium: '#EAB308', low: '#22C55E' }
const ISSUE_ICONS = { epic: '🟣', story: '🟢', task: '🔵', bug: '🔴', subtask: '⚪' }

export default function KanbanView({ nodes, onSelectNode, onSetNodeMeta, selectedNodeId, wipLimits = {}, onSetWipLimit, onOpenDetail }) {
  const columns = useMemo(() => {
    const allNodes = Object.values(nodes).filter(n => n.parentId !== null)
    const map = { none: [], todo: [], 'in-progress': [], blocked: [], done: [] }
    for (const n of allNodes) {
      const key = n.status || 'none'
      if (!map[key]) continue
      map[key].push(n)
    }
    return map
  }, [nodes])

  function moveCard(nodeId, newStatus) {
    onSetNodeMeta?.(nodeId, { status: newStatus === 'none' ? null : newStatus })
  }

  return (
    <div style={{
      display: 'flex', gap: 12, padding: '16px', height: '100%',
      overflowX: 'auto', overflowY: 'hidden', background: '#F8FAFC',
    }}>
      {COLUMNS.map(col => {
        const cards = columns[col.id] || []
        const limit = wipLimits[col.id] || 0
        const atLimit = limit > 0 && cards.length >= limit
        return (
          <div key={col.id} style={{
            flexShrink: 0, width: 240, display: 'flex', flexDirection: 'column',
            background: col.bg, borderRadius: '12px', border: `1px solid ${atLimit ? '#F97316' : col.border}`,
            overflow: 'hidden',
          }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              const nodeId = e.dataTransfer.getData('text/node-id')
              if (nodeId) moveCard(nodeId, col.id)
            }}
          >
            {/* Column header */}
            <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${atLimit ? '#F97316' : col.border}`, background: atLimit ? '#FFF7ED' : undefined }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: atLimit ? '#F97316' : col.color }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: atLimit ? '#EA580C' : '#374151' }}>{col.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: '11px', color: atLimit ? '#EA580C' : '#9CA3AF', fontWeight: atLimit ? 700 : 500 }}>
                  {cards.length}{limit > 0 ? ` / ${limit}` : ''}
                </span>
                <button
                  onClick={() => {
                    const val = window.prompt(`WIP limit for "${col.label}" (0 = no limit):`, String(limit))
                    if (val === null) return
                    const num = parseInt(val, 10)
                    onSetWipLimit?.(col.id, isNaN(num) || num < 0 ? 0 : num)
                  }}
                  title="Set WIP limit"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '11px', padding: '0 2px', lineHeight: 1 }}
                >✏</button>
              </div>
            </div>

            {/* Cards */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {cards.map(node => (
                <KanbanCard
                  key={node.id}
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  onClick={() => { onSelectNode?.(node.id); onOpenDetail?.(node.id) }}
                  colColor={col.color}
                />
              ))}
              {cards.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 8px', fontSize: '11px', color: '#D1D5DB' }}>
                  Drop cards here
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function KanbanCard({ node, isSelected, onClick, colColor }) {
  const overdue = node.dueDate && new Date(node.dueDate) < new Date() && node.status !== 'done'

  return (
    <div
      draggable
      onDragStart={e => e.dataTransfer.setData('text/node-id', node.id)}
      onClick={onClick}
      style={{
        background: 'white', borderRadius: '8px', padding: '8px 10px',
        border: `1.5px solid ${isSelected ? colColor : '#E5E7EB'}`,
        boxShadow: isSelected ? `0 0 0 2px ${colColor}33` : '0 1px 3px rgba(0,0,0,0.06)',
        cursor: 'pointer', userSelect: 'none',
      }}
    >
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 4 }}>
        {node.issueType && (
          <span style={{ fontSize: '11px', flexShrink: 0, marginTop: 1 }}>
            {ISSUE_ICONS[node.issueType] || ''}
          </span>
        )}
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#111827', lineHeight: '1.3', wordBreak: 'break-word', flex: 1 }}>
          {node.title}
        </span>
        {node.priority && (
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: PRIORITY_DOT[node.priority], flexShrink: 0, marginTop: 3 }} title={node.priority} />
        )}
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
        {node.nodeKey && (
          <span style={{ fontSize: '10px', color: '#2563EB', fontWeight: 700, fontFamily: 'monospace', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '4px', padding: '1px 5px' }}>
            {node.nodeKey}
          </span>
        )}
        {node.jiraKey && (
          <span style={{ fontSize: '10px', color: '#3B82F6', fontWeight: 600, fontFamily: 'monospace', background: '#EFF6FF', borderRadius: '4px', padding: '1px 4px' }}>
            {node.jiraKey}
          </span>
        )}
        {node.storyPoints != null && (
          <span style={{ fontSize: '10px', color: '#6B7280', background: '#F3F4F6', borderRadius: '4px', padding: '1px 5px', fontWeight: 600 }}>
            {node.storyPoints}sp
          </span>
        )}
        {node.assignee && (
          <span style={{ fontSize: '10px', color: '#374151', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '999px', padding: '1px 6px' }}>
            {node.assignee.length > 12 ? node.assignee.slice(0, 12) + '…' : node.assignee}
          </span>
        )}
        {node.dueDate && (
          <span style={{ fontSize: '10px', color: overdue ? '#EF4444' : '#9CA3AF', fontWeight: overdue ? 700 : 400 }}>
            {overdue ? '⚠️ ' : ''}{node.dueDate}
          </span>
        )}
        {(node.comments?.length ?? 0) > 0 && (
          <span style={{ fontSize: '10px', color: '#9CA3AF' }}>💬{node.comments.length}</span>
        )}
      </div>

      {/* Tags */}
      {node.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 4 }}>
          {node.tags.slice(0, 3).map(tag => (
            <span key={tag} style={{ fontSize: '9px', background: '#EFF6FF', color: '#3B82F6', border: '1px solid #BFDBFE', borderRadius: '999px', padding: '1px 5px' }}>
              {tag}
            </span>
          ))}
          {node.tags.length > 3 && (
            <span style={{ fontSize: '9px', color: '#9CA3AF' }}>+{node.tags.length - 3}</span>
          )}
        </div>
      )}
    </div>
  )
}
