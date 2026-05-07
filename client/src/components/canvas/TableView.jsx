import React, { useState, useMemo } from 'react'

const STATUS_OPTIONS = ['', 'todo', 'in-progress', 'done', 'blocked']
const PRIORITY_OPTIONS = ['', 'critical', 'high', 'medium', 'low']

export default function TableView({ nodes, onEditNode, onSetNodeMeta, onClose, onOpenDetail }) {
  const [sortKey, setSortKey] = useState('title')
  const [sortDir, setSortDir] = useState('asc')
  const [editingCell, setEditingCell] = useState(null) // { nodeId, field }

  const rows = useMemo(() => {
    const list = Object.values(nodes)
    return [...list].sort((a, b) => {
      let av = a[sortKey] ?? ''
      let bv = b[sortKey] ?? ''
      if (sortKey === 'storyPoints') { av = Number(av) || 0; bv = Number(bv) || 0 }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [nodes, sortKey, sortDir])

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function SortArrow({ col }) {
    if (sortKey !== col) return <span style={{ opacity: 0.3, marginLeft: 3 }}>↕</span>
    return <span style={{ marginLeft: 3 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const th = { padding: '7px 10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7280', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' }
  const td = { padding: '5px 10px', fontSize: 12, color: '#374151', borderBottom: '1px solid #F3F4F6', verticalAlign: 'middle' }

  const STATUS_COLORS = { todo: '#6B7280', 'in-progress': '#3B82F6', done: '#22C55E', blocked: '#EF4444' }
  const PRIORITY_COLORS = { critical: '#EF4444', high: '#F97316', medium: '#EAB308', low: '#22C55E' }

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'white', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F9FAFB', flexShrink: 0 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Table View</div>
          <div style={{ fontSize: 11, color: '#9CA3AF' }}>{rows.length} nodes — click a cell to edit</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#9CA3AF', lineHeight: 1 }}>×</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr>
              {[['title', 'Title', 280], ['status', 'Status', 110], ['priority', 'Priority', 100], ['assignee', 'Assignee', 120], ['dueDate', 'Due Date', 120], ['storyPoints', 'Points', 70]].map(([key, label, w]) => (
                <th key={key} style={{ ...th, minWidth: w }} onClick={() => handleSort(key)}>
                  {label}<SortArrow col={key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(node => (
              <tr key={node.id} style={{ background: 'white' }}>
                {/* Title */}
                <td style={td}>
                  {editingCell?.nodeId === node.id && editingCell?.field === 'title' ? (
                    <input
                      autoFocus
                      defaultValue={node.title}
                      style={{ width: '100%', padding: '2px 4px', border: '1.5px solid #3B82F6', borderRadius: 4, fontSize: 12, outline: 'none' }}
                      onBlur={e => { onEditNode?.(node.id, e.target.value); setEditingCell(null) }}
                      onKeyDown={e => { if (e.key === 'Enter') { onEditNode?.(node.id, e.target.value); setEditingCell(null) } if (e.key === 'Escape') setEditingCell(null) }}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {node.nodeKey && (
                        <span style={{ fontSize: 10, color: '#2563EB', fontWeight: 700, fontFamily: 'monospace', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>
                          {node.nodeKey}
                        </span>
                      )}
                      <span style={{ cursor: 'pointer', flex: 1 }} onClick={() => setEditingCell({ nodeId: node.id, field: 'title' })}>{node.title}</span>
                      <button
                        onClick={() => onOpenDetail?.(node.id)}
                        title="Open detail"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#9CA3AF', padding: '0 2px', lineHeight: 1, flexShrink: 0 }}
                      >⬡</button>
                    </div>
                  )}
                </td>
                {/* Status */}
                <td style={td}>
                  <select
                    value={node.status || ''}
                    onChange={e => onSetNodeMeta?.(node.id, { status: e.target.value || null })}
                    style={{ padding: '2px 4px', borderRadius: 4, border: '1px solid #E5E7EB', fontSize: 11, color: STATUS_COLORS[node.status] || '#6B7280', background: 'white', cursor: 'pointer' }}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s || '—'}</option>)}
                  </select>
                </td>
                {/* Priority */}
                <td style={td}>
                  <select
                    value={node.priority || ''}
                    onChange={e => onSetNodeMeta?.(node.id, { priority: e.target.value || null })}
                    style={{ padding: '2px 4px', borderRadius: 4, border: '1px solid #E5E7EB', fontSize: 11, color: PRIORITY_COLORS[node.priority] || '#6B7280', background: 'white', cursor: 'pointer' }}
                  >
                    {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p || '—'}</option>)}
                  </select>
                </td>
                {/* Assignee */}
                <td style={td}>
                  {editingCell?.nodeId === node.id && editingCell?.field === 'assignee' ? (
                    <input
                      autoFocus
                      defaultValue={node.assignee || ''}
                      style={{ width: '100%', padding: '2px 4px', border: '1.5px solid #3B82F6', borderRadius: 4, fontSize: 12, outline: 'none' }}
                      onBlur={e => { onSetNodeMeta?.(node.id, { assignee: e.target.value || null }); setEditingCell(null) }}
                      onKeyDown={e => { if (e.key === 'Enter') { onSetNodeMeta?.(node.id, { assignee: e.target.value || null }); setEditingCell(null) } if (e.key === 'Escape') setEditingCell(null) }}
                    />
                  ) : (
                    <span style={{ cursor: 'pointer', color: node.assignee ? '#374151' : '#D1D5DB' }} onClick={() => setEditingCell({ nodeId: node.id, field: 'assignee' })}>
                      {node.assignee || '—'}
                    </span>
                  )}
                </td>
                {/* Due Date */}
                <td style={td}>
                  <input
                    type="date"
                    value={node.dueDate || ''}
                    onChange={e => onSetNodeMeta?.(node.id, { dueDate: e.target.value || null })}
                    style={{ padding: '2px 4px', borderRadius: 4, border: '1px solid #E5E7EB', fontSize: 11, background: 'white', cursor: 'pointer' }}
                  />
                </td>
                {/* Story Points */}
                <td style={td}>
                  <input
                    type="number"
                    min="0"
                    defaultValue={node.storyPoints ?? ''}
                    style={{ width: 56, padding: '2px 4px', borderRadius: 4, border: '1px solid #E5E7EB', fontSize: 11, background: 'white' }}
                    onBlur={e => { const v = e.target.value; onSetNodeMeta?.(node.id, { storyPoints: v === '' ? null : Number(v) }) }}
                    onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
