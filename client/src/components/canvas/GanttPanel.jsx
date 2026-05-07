import React, { useState, useMemo } from 'react'

const STATUS_COLORS = { todo: '#9CA3AF', 'in-progress': '#3B82F6', done: '#22C55E', blocked: '#EF4444' }
const PRIORITY_COLORS = { critical: '#EF4444', high: '#F97316', medium: '#EAB308', low: '#22C55E' }

const ZOOM_LABELS = ['Day', 'Week', 'Month', 'Quarter']
const ZOOM_DAYS = [1, 7, 30, 90]

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}
function fmtShort(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
function fmtLabel(ts, zoomIdx) {
  const d = new Date(ts)
  if (zoomIdx === 0) return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  if (zoomIdx === 1) return 'W' + Math.ceil(d.getDate() / 7) + ' ' + d.toLocaleDateString(undefined, { month: 'short' })
  if (zoomIdx === 2) return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
  return `Q${Math.ceil((d.getMonth() + 1) / 3)} ${d.getFullYear()}`
}

export default function GanttPanel({ nodes, onClose, onNavigate }) {
  const [zoomIdx, setZoomIdx] = useState(2)
  const [groupBy, setGroupBy] = useState('none') // none | assignee | sprint | status

  const nodesWithDates = useMemo(() =>
    Object.values(nodes).filter(n => n.dueDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [nodes]
  )

  const minDate = nodesWithDates[0]?.dueDate
  const maxDate = nodesWithDates[nodesWithDates.length - 1]?.dueDate

  const rangeStart = useMemo(() => {
    if (!minDate) return new Date()
    const d = new Date(minDate)
    d.setDate(d.getDate() - ZOOM_DAYS[zoomIdx])
    return d
  }, [minDate, zoomIdx])

  const rangeEnd = useMemo(() => {
    if (!maxDate) return new Date()
    const d = new Date(maxDate)
    d.setDate(d.getDate() + ZOOM_DAYS[zoomIdx])
    return d
  }, [maxDate, zoomIdx])

  const totalMs = rangeEnd - rangeStart || 1
  const pct = (dateStr) => ((new Date(dateStr) - rangeStart) / totalMs) * 100
  const todayPct = ((Date.now() - rangeStart) / totalMs) * 100

  // Column tick marks
  const ticks = useMemo(() => {
    const result = []
    const tickDays = ZOOM_DAYS[zoomIdx]
    let d = new Date(rangeStart)
    while (d <= rangeEnd) {
      result.push({ ts: d.getTime(), label: fmtLabel(d.getTime(), zoomIdx) })
      d = addDays(d, tickDays)
    }
    return result
  }, [rangeStart, rangeEnd, zoomIdx])

  // Group nodes
  const groups = useMemo(() => {
    if (groupBy === 'none') return [{ label: 'All Tasks', nodes: nodesWithDates }]
    const map = {}
    for (const n of nodesWithDates) {
      const key = (groupBy === 'assignee' ? n.assignee : groupBy === 'sprint' ? n.sprint : n.status) || '(none)'
      if (!map[key]) map[key] = []
      map[key].push(n)
    }
    return Object.entries(map).map(([label, nodes]) => ({ label, nodes }))
  }, [nodesWithDates, groupBy])

  if (nodesWithDates.length === 0) {
    return (
      <div style={{ position: 'absolute', inset: 0, zIndex: 25, background: 'white', display: 'flex', flexDirection: 'column' }}>
        <Header onClose={onClose} zoomIdx={zoomIdx} setZoomIdx={setZoomIdx} groupBy={groupBy} setGroupBy={setGroupBy} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '14px' }}>
          No nodes have due dates. Add due dates in Node Properties to see the timeline.
        </div>
      </div>
    )
  }

  const ROW_H = 34
  const LABEL_W = 180

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 25, background: 'white', display: 'flex', flexDirection: 'column' }}>
      <Header onClose={onClose} zoomIdx={zoomIdx} setZoomIdx={setZoomIdx} groupBy={groupBy} setGroupBy={setGroupBy} />

      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Date header */}
        <div style={{ display: 'flex', position: 'sticky', top: 0, zIndex: 5, background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ width: LABEL_W, flexShrink: 0, borderRight: '1px solid #E5E7EB', padding: '6px 14px', fontSize: '11px', fontWeight: 700, color: '#6B7280' }}>Task</div>
          <div style={{ flex: 1, position: 'relative', height: 32, overflow: 'hidden' }}>
            {ticks.map(tick => (
              <div key={tick.ts} style={{
                position: 'absolute',
                left: `${((tick.ts - rangeStart) / totalMs) * 100}%`,
                top: 0, height: '100%',
                borderLeft: '1px solid #E5E7EB',
                paddingLeft: 4,
                fontSize: '10px', color: '#9CA3AF',
                whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center',
              }}>{tick.label}</div>
            ))}
          </div>
        </div>

        {/* Rows */}
        {groups.map(group => (
          <div key={group.label}>
            {groupBy !== 'none' && (
              <div style={{ padding: '4px 14px', fontSize: '10px', fontWeight: 700, color: '#6B7280', background: '#F3F4F6', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB' }}>
                {group.label}
              </div>
            )}
            {group.nodes.map(node => {
              const left = Math.max(0, Math.min(100, pct(node.dueDate)))
              const overdue = node.dueDate && new Date(node.dueDate) < new Date() && node.status !== 'done'
              const barColor = overdue ? '#EF4444' : STATUS_COLORS[node.status] || '#9CA3AF'
              return (
                <div key={node.id} style={{ display: 'flex', height: ROW_H, borderBottom: '1px solid #F3F4F6', alignItems: 'center' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '' }}>
                  {/* Label */}
                  <div
                    style={{ width: LABEL_W, flexShrink: 0, borderRight: '1px solid #E5E7EB', padding: '0 14px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                    onClick={() => onNavigate?.(node.id)}
                  >
                    {node.priority && <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY_COLORS[node.priority], flexShrink: 0 }} />}
                    <span style={{ fontSize: '12px', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.title}</span>
                  </div>
                  {/* Bar area */}
                  <div style={{ flex: 1, position: 'relative', height: '100%' }}>
                    {/* Today line */}
                    {todayPct >= 0 && todayPct <= 100 && (
                      <div style={{ position: 'absolute', left: `${todayPct}%`, top: 0, bottom: 0, width: 1, background: '#EF4444', opacity: 0.4, zIndex: 1 }} />
                    )}
                    {/* Tick lines */}
                    {ticks.map(tick => (
                      <div key={tick.ts} style={{ position: 'absolute', left: `${((tick.ts - rangeStart) / totalMs) * 100}%`, top: 0, bottom: 0, width: 1, background: '#F3F4F6' }} />
                    ))}
                    {/* Task pill */}
                    <div
                      style={{
                        position: 'absolute',
                        left: `calc(${left}% - 36px)`,
                        top: '50%', transform: 'translateY(-50%)',
                        height: 20, minWidth: 72,
                        background: barColor, borderRadius: '999px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0 8px', fontSize: '10px', color: 'white', fontWeight: 600,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        cursor: 'pointer', zIndex: 2,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }}
                      onClick={() => onNavigate?.(node.id)}
                      title={`${node.title} — Due: ${node.dueDate}`}
                    >
                      {fmtShort(node.dueDate)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Footer legend */}
      <div style={{ padding: '8px 16px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: 16, fontSize: '10px', color: '#6B7280', background: '#FAFAFA', flexShrink: 0, alignItems: 'center' }}>
        {Object.entries(STATUS_COLORS).map(([s, c]) => (
          <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
            {s}
          </span>
        ))}
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
          <span style={{ width: 14, height: 2, background: '#EF4444', opacity: 0.6 }} />
          Today
        </span>
        <span style={{ marginLeft: 'auto' }}>{nodesWithDates.length} tasks with due dates</span>
      </div>
    </div>
  )
}

function Header({ onClose, zoomIdx, setZoomIdx, groupBy, setGroupBy }) {
  return (
    <div style={{ padding: '10px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 12, background: '#FAFAFA', flexShrink: 0 }}>
      <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>Timeline / Gantt</div>
      <div style={{ display: 'flex', gap: 2, background: '#F3F4F6', borderRadius: 8, padding: 2 }}>
        {ZOOM_LABELS.map((l, i) => (
          <button key={l} onClick={() => setZoomIdx(i)} style={{
            padding: '3px 10px', borderRadius: 6, fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer',
            background: zoomIdx === i ? 'white' : 'transparent',
            color: zoomIdx === i ? '#374151' : '#6B7280',
            boxShadow: zoomIdx === i ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}>{l}</button>
        ))}
      </div>
      <select value={groupBy} onChange={e => setGroupBy(e.target.value)} style={{ fontSize: '11px', border: '1px solid #E5E7EB', borderRadius: 6, padding: '3px 8px', background: 'white', color: '#374151', cursor: 'pointer' }}>
        <option value="none">No grouping</option>
        <option value="status">Group by Status</option>
        <option value="assignee">Group by Assignee</option>
        <option value="sprint">Group by Sprint</option>
      </select>
      <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9CA3AF', lineHeight: 1 }}>×</button>
    </div>
  )
}
