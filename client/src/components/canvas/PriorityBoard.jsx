import React, { useMemo, useState } from 'react'

const PRIORITIES = [
  { id: 'critical', label: 'Critical',     color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA', dot: '#EF4444', icon: '🔴', gradient: 'linear-gradient(135deg,#FEE2E2,#FEF2F2)' },
  { id: 'high',     label: 'High',         color: '#C2410C', bg: '#FFF7ED', border: '#FED7AA', dot: '#F97316', icon: '🟠', gradient: 'linear-gradient(135deg,#FFEDD5,#FFF7ED)' },
  { id: 'medium',   label: 'Medium',       color: '#B45309', bg: '#FEFCE8', border: '#FDE68A', dot: '#EAB308', icon: '🟡', gradient: 'linear-gradient(135deg,#FEF9C3,#FEFCE8)' },
  { id: 'low',      label: 'Low',          color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0', dot: '#22C55E', icon: '🟢', gradient: 'linear-gradient(135deg,#DCFCE7,#F0FDF4)' },
  { id: 'none',     label: 'No Priority',  color: '#4B5563', bg: '#F9FAFB', border: '#E5E7EB', dot: '#9CA3AF', icon: '⚫', gradient: 'linear-gradient(135deg,#F3F4F6,#F9FAFB)' },
]

const STATUS_META = {
  'todo':        { bg: '#F1F5F9', color: '#475569', label: 'To Do' },
  'in-progress': { bg: '#DBEAFE', color: '#1D4ED8', label: 'In Progress' },
  'done':        { bg: '#DCFCE7', color: '#15803D', label: 'Done' },
  'blocked':     { bg: '#FEE2E2', color: '#DC2626', label: 'Blocked' },
}

const ISSUE_ICONS = { epic: '🟣', story: '🟢', task: '🔵', bug: '🔴', subtask: '⚪' }

const ASSIGNEE_COLORS = ['#818CF8', '#F472B6', '#34D399', '#60A5FA', '#FBBF24', '#A78BFA']
function assigneeColor(name) {
  if (!name) return '#9CA3AF'
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff
  return ASSIGNEE_COLORS[Math.abs(h) % ASSIGNEE_COLORS.length]
}

export default function PriorityBoard({ nodes, onSetNodeMeta, onClose, onOpenDetail }) {
  const [dragNodeId, setDragNodeId] = useState(null)
  const [dragOverPriority, setDragOverPriority] = useState(null)
  const [sortBy, setSortBy] = useState('dueDate')

  const allNodes = useMemo(() => Object.values(nodes).filter(n => n.parentId !== null), [nodes])

  const columns = useMemo(() => {
    const map = {}
    for (const p of PRIORITIES) map[p.id] = []
    for (const n of allNodes) {
      const key = n.priority || 'none'
      if (map[key]) map[key].push(n)
      else map.none.push(n)
    }
    for (const p of PRIORITIES) {
      map[p.id].sort((a, b) => {
        if (sortBy === 'dueDate') {
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate) - new Date(b.dueDate)
        }
        if (sortBy === 'points') return (b.storyPoints || 0) - (a.storyPoints || 0)
        return (a.title || '').localeCompare(b.title || '')
      })
    }
    return map
  }, [allNodes, sortBy])

  function moveCard(nodeId, newPriority) {
    onSetNodeMeta?.(nodeId, { priority: newPriority === 'none' ? null : newPriority })
  }

  const totalPoints = arr => arr.reduce((s, n) => s + (n.storyPoints || 0), 0)
  const doneCount = arr => arr.filter(n => n.status === 'done').length
  const overdueCount = arr => arr.filter(n => n.dueDate && new Date(n.dueDate) < new Date() && n.status !== 'done').length

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 25, background: '#F1F5F9', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 12, background: 'white', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#F97316,#EF4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎯</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Priority Board</div>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>{allNodes.length} tasks · drag cards to reprioritize</div>
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Sort by:</span>
        {[['dueDate', 'Due date'], ['points', 'Points'], ['title', 'Name']].map(([k, label]) => (
          <button key={k} onClick={() => setSortBy(k)} style={{
            padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
            background: sortBy === k ? '#EFF6FF' : '#F8FAFC',
            color: sortBy === k ? '#2563EB' : '#64748B',
            boxShadow: sortBy === k ? '0 0 0 1.5px #BFDBFE' : 'none',
          }}>{label}</button>
        ))}
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#94A3B8', lineHeight: 1, padding: '0 4px', marginLeft: 4 }}>×</button>
      </div>

      {/* Columns */}
      <div style={{ flex: 1, display: 'flex', gap: 14, padding: '16px 20px', overflowX: 'auto', overflowY: 'hidden', alignItems: 'flex-start' }}>
        {PRIORITIES.map(p => {
          const cards = columns[p.id] || []
          const done = doneCount(cards)
          const pts = totalPoints(cards)
          const overdue = overdueCount(cards)
          const isDrop = dragOverPriority === p.id
          const pct = cards.length > 0 ? (done / cards.length) * 100 : 0

          return (
            <div
              key={p.id}
              style={{
                flexShrink: 0, width: 252, display: 'flex', flexDirection: 'column',
                borderRadius: 16, overflow: 'hidden',
                border: `1.5px solid ${isDrop ? p.dot : p.border}`,
                boxShadow: isDrop
                  ? `0 0 0 3px ${p.dot}33, 0 8px 24px ${p.dot}22`
                  : '0 2px 8px rgba(0,0,0,0.06)',
                transition: 'box-shadow 0.2s, border-color 0.2s',
                maxHeight: 'calc(100vh - 120px)',
              }}
              onDragOver={e => { e.preventDefault(); setDragOverPriority(p.id) }}
              onDragLeave={() => setDragOverPriority(null)}
              onDrop={() => { if (dragNodeId) moveCard(dragNodeId, p.id); setDragOverPriority(null) }}
            >
              {/* Column header */}
              <div style={{ padding: '14px 14px 12px', background: isDrop ? p.bg : p.gradient, borderBottom: `1px solid ${p.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 18 }}>{p.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: p.color, flex: 1, letterSpacing: '-0.01em' }}>{p.label}</span>
                  <span style={{
                    fontSize: 11, background: 'white', color: p.color,
                    border: `1.5px solid ${p.border}`, borderRadius: '999px',
                    padding: '1px 9px', fontWeight: 700, minWidth: 24, textAlign: 'center',
                  }}>{cards.length}</span>
                </div>
                {/* Progress bar */}
                <div style={{ height: 5, borderRadius: 999, background: `${p.dot}22`, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: `linear-gradient(90deg, ${p.dot}99, ${p.dot})`, transition: 'width 0.5s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: p.color }}>
                  <span style={{ fontWeight: 600 }}>{done}/{cards.length} done</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {overdue > 0 && <span style={{ color: '#EF4444', fontWeight: 700 }}>⚠ {overdue} overdue</span>}
                    {pts > 0 && <span>{pts} pts</span>}
                  </div>
                </div>
              </div>

              {/* Cards */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: 7, background: 'white' }}>
                {cards.map(node => (
                  <PriorityCard
                    key={node.id}
                    node={node}
                    priorityDot={p.dot}
                    onDragStart={() => setDragNodeId(node.id)}
                    onDragEnd={() => { setDragNodeId(null); setDragOverPriority(null) }}
                    isDragging={dragNodeId === node.id}
                    onClick={() => onOpenDetail?.(node.id)}
                  />
                ))}
                {cards.length === 0 && (
                  <div style={{
                    textAlign: 'center', padding: '28px 12px', fontSize: 11, color: '#CBD5E1',
                    borderRadius: 10, border: `1.5px dashed ${p.border}`,
                    background: p.bg, margin: 4,
                  }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{p.icon}</div>
                    Drop tasks here
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

function PriorityCard({ node, priorityDot, onDragStart, onDragEnd, isDragging, onClick }) {
  const status = STATUS_META[node.status] || { bg: '#F8FAFC', color: '#94A3B8', label: '—' }
  const overdue = node.dueDate && new Date(node.dueDate) < new Date() && node.status !== 'done'
  const dueDate = node.dueDate ? new Date(node.dueDate) : null
  const daysLeft = dueDate ? Math.ceil((dueDate - new Date()) / 86400000) : null
  const color = assigneeColor(node.assignee)

  let dueLabel = ''
  let dueColor = '#94A3B8'
  if (daysLeft !== null) {
    if (overdue) { dueLabel = `${Math.abs(daysLeft)}d overdue`; dueColor = '#EF4444' }
    else if (daysLeft === 0) { dueLabel = 'Due today'; dueColor = '#F97316' }
    else if (daysLeft <= 3) { dueLabel = `${daysLeft}d left`; dueColor = '#F97316' }
    else { dueLabel = `${daysLeft}d left`; dueColor = '#94A3B8' }
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      style={{
        background: overdue ? '#FFFBFB' : 'white',
        borderRadius: 10, padding: '10px 12px',
        border: `1px solid ${overdue ? '#FECACA' : '#E2E8F0'}`,
        borderLeft: `3.5px solid ${priorityDot}`,
        boxShadow: isDragging ? 'none' : overdue
          ? '0 0 0 1px #FCA5A544'
          : '0 1px 3px rgba(0,0,0,0.05)',
        cursor: 'pointer', userSelect: 'none',
        opacity: isDragging ? 0.3 : 1,
        transition: 'opacity 0.15s, box-shadow 0.15s',
      }}
    >
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 8 }}>
        {node.issueType && (
          <span style={{ fontSize: 11, flexShrink: 0, marginTop: 1 }}>{ISSUE_ICONS[node.issueType]}</span>
        )}
        <span style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', lineHeight: 1.4, flex: 1, wordBreak: 'break-word' }}>
          {node.title}
        </span>
      </div>

      {/* Status + Jira key row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: status.color, background: status.bg, borderRadius: 5, padding: '2px 7px' }}>
          {status.label}
        </span>
        {node.jiraKey && (
          <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#3B82F6', background: '#EFF6FF', borderRadius: 5, padding: '2px 6px', fontWeight: 700 }}>
            {node.jiraKey}
          </span>
        )}
        {node.storyPoints != null && (
          <span style={{ fontSize: 10, color: '#64748B', background: '#F1F5F9', borderRadius: 5, padding: '2px 7px', fontWeight: 600, marginLeft: 'auto' }}>
            {node.storyPoints}sp
          </span>
        )}
      </div>

      {/* Assignee + Due row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {node.assignee && (
          <div style={{
            width: 20, height: 20, borderRadius: '50%', background: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 8, fontWeight: 700, color: 'white', flexShrink: 0,
          }}>
            {node.assignee.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
        )}
        {node.assignee && (
          <span style={{ fontSize: 10, color: '#64748B', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {node.assignee.length > 14 ? node.assignee.slice(0, 14) + '…' : node.assignee}
          </span>
        )}
        {dueLabel && (
          <span style={{ fontSize: 10, fontWeight: overdue ? 700 : 400, color: dueColor, display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto', flexShrink: 0 }}>
            {overdue && '⚠ '}{dueLabel}
          </span>
        )}
      </div>

      {/* Tags */}
      {node.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 7 }}>
          {node.tags.slice(0, 3).map(tag => (
            <span key={tag} style={{ fontSize: 9, background: '#EFF6FF', color: '#3B82F6', border: '1px solid #BFDBFE', borderRadius: '999px', padding: '1px 6px' }}>{tag}</span>
          ))}
          {node.tags.length > 3 && <span style={{ fontSize: 9, color: '#94A3B8' }}>+{node.tags.length - 3}</span>}
        </div>
      )}
    </div>
  )
}
