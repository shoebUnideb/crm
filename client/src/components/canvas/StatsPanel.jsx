import React, { useMemo } from 'react'

const STATUS_COLORS = { todo: '#9CA3AF', 'in-progress': '#3B82F6', done: '#22C55E', blocked: '#EF4444' }
const PRIORITY_COLORS = { critical: '#EF4444', high: '#F97316', medium: '#EAB308', low: '#22C55E' }

export default function StatsPanel({ nodes, extraEdges = [], groups = [], onFilterByStatus, onFilterByPriority, onFilterByAssignee, onClose }) {
  const stats = useMemo(() => {
    const nodeList = Object.values(nodes)
    const statusCounts = {}
    const priorityCounts = {}
    const assigneeCounts = {}
    for (const n of nodeList) {
      const s = n.status || 'none'
      statusCounts[s] = (statusCounts[s] || 0) + 1
      const p = n.priority || 'none'
      priorityCounts[p] = (priorityCounts[p] || 0) + 1
      if (n.assignee) {
        assigneeCounts[n.assignee] = (assigneeCounts[n.assignee] || 0) + 1
      }
    }
    const topAssignees = Object.entries(assigneeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
    return {
      total: nodeList.length,
      edges: extraEdges.length,
      groups: groups.length,
      statusCounts,
      priorityCounts,
      topAssignees,
    }
  }, [nodes, extraEdges, groups])

  const statusOrder = ['todo', 'in-progress', 'done', 'blocked', 'none']
  const priorityOrder = ['critical', 'high', 'medium', 'low', 'none']

  return (
    <div style={{
      position: 'absolute', right: 12, bottom: 70, width: 260, zIndex: 20,
      background: 'white', borderRadius: '14px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)', border: '1px solid #E5E7EB',
      display: 'flex', flexDirection: 'column', maxHeight: '60vh',
    }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFAFA', borderRadius: '14px 14px 0 0', flexShrink: 0 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>Statistics</div>
          <div style={{ fontSize: 10, color: '#9CA3AF' }}>{stats.total} nodes · {stats.edges} connections · {stats.groups} groups</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 18, lineHeight: 1 }}>×</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Status */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>By Status</div>
          {statusOrder.filter(s => stats.statusCounts[s]).map(s => {
            const count = stats.statusCounts[s] || 0
            const pct = Math.round((count / stats.total) * 100)
            const color = STATUS_COLORS[s] || '#9CA3AF'
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, cursor: 'pointer' }}
                onClick={() => onFilterByStatus?.(s === 'none' ? '' : s)}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 11, color: '#374151', textTransform: 'capitalize' }}>{s === 'none' ? 'No status' : s}</span>
                <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>{count}</span>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: '#F3F4F6', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Priority */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>By Priority</div>
          {priorityOrder.filter(p => stats.priorityCounts[p]).map(p => {
            const count = stats.priorityCounts[p] || 0
            const pct = Math.round((count / stats.total) * 100)
            const color = PRIORITY_COLORS[p] || '#9CA3AF'
            return (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, cursor: 'pointer' }}
                onClick={() => onFilterByPriority?.(p === 'none' ? '' : p)}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 11, color: '#374151', textTransform: 'capitalize' }}>{p === 'none' ? 'No priority' : p}</span>
                <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>{count}</span>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: '#F3F4F6', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Top Assignees */}
        {stats.topAssignees.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Assignees</div>
            {stats.topAssignees.map(([name, count]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, cursor: 'pointer' }}
                onClick={() => onFilterByAssignee?.(name)}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#818CF8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 9, color: 'white', fontWeight: 700 }}>{name.slice(0, 2).toUpperCase()}</span>
                </div>
                <span style={{ flex: 1, fontSize: 11, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ padding: '6px 12px', borderTop: '1px solid #F3F4F6', fontSize: 10, color: '#9CA3AF', flexShrink: 0 }}>
        Click a row to quick-filter
      </div>
    </div>
  )
}
