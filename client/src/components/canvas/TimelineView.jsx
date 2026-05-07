import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react'

const ZOOM_PRESETS = {
  week:    { pxPerDay: 40, label: 'Week' },
  month:   { pxPerDay: 14, label: 'Month' },
  quarter: { pxPerDay:  5, label: 'Quarter' },
}

const STATUS_META = {
  'todo':        { bar: '#94A3B8', barDark: '#64748B', badge: '#F1F5F9', text: '#475569', label: 'To Do' },
  'in-progress': { bar: '#60A5FA', barDark: '#2563EB', badge: '#DBEAFE', text: '#1D4ED8', label: 'In Progress' },
  'done':        { bar: '#4ADE80', barDark: '#16A34A', badge: '#DCFCE7', text: '#15803D', label: 'Done' },
  'blocked':     { bar: '#F87171', barDark: '#DC2626', badge: '#FEE2E2', text: '#DC2626', label: 'Blocked' },
}

const PRIORITY_STRIPE = {
  critical: '#EF4444',
  high:     '#F97316',
  medium:   '#EAB308',
  low:      '#22C55E',
  none:     '#94A3B8',
}

const ISSUE_ICONS = { epic: '🟣', story: '🟢', task: '🔵', bug: '🔴', subtask: '⚪' }

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const ASSIGNEE_COLORS = ['#818CF8','#F472B6','#34D399','#60A5FA','#FBBF24','#A78BFA','#FB923C','#38BDF8']
function avatarColor(name) {
  if (!name) return '#94A3B8'
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff
  return ASSIGNEE_COLORS[Math.abs(h) % ASSIGNEE_COLORS.length]
}

function startOfDay(ts) {
  const d = new Date(ts); d.setHours(0,0,0,0); return d.getTime()
}
function addDays(ts, n) { return ts + n * 86400000 }
function daysBetween(a, b) { return Math.round((b - a) / 86400000) }

const LEFT_W = 230
const ROW_H = 44
const GROUP_H = 32
const HEADER_TOP_H = 26
const HEADER_BOT_H = 24
const HEADER_H = HEADER_TOP_H + HEADER_BOT_H

export default function TimelineView({ nodes, onClose, onOpenDetail, onSetNodeMeta }) {
  const [zoom, setZoom] = useState('month')
  const [groupBy, setGroupBy] = useState('none')
  const [collapsed, setCollapsed] = useState({})
  const [tooltip, setTooltip] = useState(null)
  const scrollRef = useRef(null)

  const { pxPerDay } = ZOOM_PRESETS[zoom]

  const nodesWithDates = useMemo(() =>
    Object.values(nodes).filter(n => n.dueDate), [nodes])

  const today = useMemo(() => startOfDay(Date.now()), [])

  const { rangeStart, rangeEnd } = useMemo(() => {
    if (nodesWithDates.length === 0) {
      return { rangeStart: addDays(today, -7), rangeEnd: addDays(today, 60) }
    }
    const allTs = nodesWithDates.flatMap(n => [
      n.startDate ? startOfDay(new Date(n.startDate).getTime()) : startOfDay(new Date(n.dueDate).getTime()),
      startOfDay(new Date(n.dueDate).getTime()),
    ])
    const min = Math.min(today, ...allTs)
    const max = Math.max(...allTs)
    return { rangeStart: addDays(min, -10), rangeEnd: addDays(max, 14) }
  }, [nodesWithDates, today])

  const totalDays = daysBetween(rangeStart, rangeEnd)
  const totalPx = totalDays * pxPerDay
  const todayPx = daysBetween(rangeStart, today) * pxPerDay

  function xPx(ts) { return daysBetween(rangeStart, startOfDay(ts)) * pxPerDay }

  // Groups
  const groups = useMemo(() => {
    if (groupBy === 'none') return [{ id: '__all', label: null, color: null, nodes: nodesWithDates }]
    const map = new Map()
    const order = []
    for (const n of nodesWithDates) {
      let key
      if (groupBy === 'assignee') key = n.assignee || 'Unassigned'
      else if (groupBy === 'priority') key = n.priority || 'none'
      else if (groupBy === 'status') key = n.status || 'none'
      if (!map.has(key)) { map.set(key, []); order.push(key) }
      map.get(key).push(n)
    }
    if (groupBy === 'priority') {
      const ord = ['critical','high','medium','low','none']
      order.sort((a, b) => ord.indexOf(a) - ord.indexOf(b))
    } else if (groupBy === 'status') {
      const ord = ['in-progress','todo','blocked','done','none']
      order.sort((a, b) => ord.indexOf(a) - ord.indexOf(b))
    } else {
      order.sort((a, b) => a === 'Unassigned' ? 1 : a.localeCompare(b))
    }
    return order.map(key => ({
      id: key,
      label: groupBy === 'priority'
        ? (key === 'none' ? 'No Priority' : key.charAt(0).toUpperCase() + key.slice(1))
        : groupBy === 'status'
          ? (STATUS_META[key]?.label || 'No Status')
          : key,
      color: groupBy === 'priority' ? PRIORITY_STRIPE[key]
           : groupBy === 'status' ? STATUS_META[key]?.bar
           : avatarColor(key),
      nodes: map.get(key),
    }))
  }, [nodesWithDates, groupBy])

  // Date ticks: month spans + sub-ticks
  const { monthSpans, subTicks } = useMemo(() => {
    const months = []
    let cur = new Date(rangeStart)
    let prevMonth = -1
    while (cur.getTime() <= rangeEnd + 86400000) {
      const m = cur.getMonth(), y = cur.getFullYear()
      if (m !== prevMonth) {
        months.push({ ts: cur.getTime(), month: m, year: y })
        prevMonth = m
      }
      cur = new Date(cur.getTime() + 86400000)
    }

    const spans = months.map((m, i) => {
      const endTs = i + 1 < months.length ? months[i + 1].ts : rangeEnd
      return {
        ts: m.ts,
        label: `${MONTH_NAMES[m.month]} ${m.year}`,
        width: Math.max(1, daysBetween(m.ts, endTs)) * pxPerDay,
      }
    })

    const subs = []
    let t = new Date(rangeStart)
    const step = zoom === 'week' ? 1 : zoom === 'month' ? 7 : 28
    while (t.getTime() <= rangeEnd) {
      subs.push({
        ts: t.getTime(),
        label: zoom === 'week'
          ? t.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
          : t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isWeekend: zoom === 'week' && (t.getDay() === 0 || t.getDay() === 6),
      })
      t = new Date(t.getTime() + step * 86400000)
    }

    return { monthSpans: spans, subTicks: subs }
  }, [rangeStart, rangeEnd, pxPerDay, zoom])

  const scrollToToday = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = Math.max(0, todayPx - 200)
    }
  }, [todayPx])

  useEffect(() => { scrollToToday() }, [zoom])

  function toggleGroup(id) { setCollapsed(c => ({ ...c, [id]: !c[id] })) }

  const emptyState = nodesWithDates.length === 0

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: '#F8FAFC', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Top toolbar ── */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 10, background: 'white', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📅</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>Timeline</div>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>
            {nodesWithDates.length} tasks · click a bar or row to open detail
          </div>
        </div>
        <div style={{ flex: 1 }} />

        {/* Zoom segment */}
        <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 9, padding: 3, gap: 2 }}>
          {Object.entries(ZOOM_PRESETS).map(([k, v]) => (
            <button key={k} onClick={() => setZoom(k)} style={{
              padding: '4px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: zoom === k ? 'white' : 'transparent',
              color: zoom === k ? '#4F46E5' : '#64748B',
              boxShadow: zoom === k ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
              transition: 'all 0.15s',
            }}>{v.label}</button>
          ))}
        </div>

        {/* Group by */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>Group:</span>
          {[['none','None'],['assignee','Person'],['priority','Priority'],['status','Status']].map(([k, label]) => (
            <button key={k} onClick={() => setGroupBy(k)} style={{
              padding: '4px 9px', borderRadius: 7, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: groupBy === k ? '#EFF6FF' : 'transparent',
              color: groupBy === k ? '#2563EB' : '#64748B',
              boxShadow: groupBy === k ? '0 0 0 1.5px #BFDBFE' : 'none',
            }}>{label}</button>
          ))}
        </div>

        <button onClick={scrollToToday} style={{
          padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
          background: '#FEF2F2', color: '#EF4444', border: '1.5px solid #FECACA',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
          boxShadow: '0 1px 3px rgba(239,68,68,0.1)',
        }}>
          <span>→</span> Today
        </button>

        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#94A3B8', lineHeight: 1, padding: '0 4px', marginLeft: 4 }}>×</button>
      </div>

      {emptyState ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 48, filter: 'grayscale(0.3)' }}>📅</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#475569' }}>No tasks with due dates yet</div>
          <div style={{ fontSize: 12, color: '#94A3B8', maxWidth: 300, textAlign: 'center', lineHeight: 1.6 }}>
            Open a ticket (⬡) and set a due date to see it on the timeline.
          </div>
        </div>
      ) : (
        <div ref={scrollRef} style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ minWidth: LEFT_W + totalPx + 60 }}>

            {/* ── Date header (sticky top) ── */}
            <div style={{ display: 'flex', position: 'sticky', top: 0, zIndex: 10, height: HEADER_H, borderBottom: '2px solid #CBD5E1' }}>
              {/* Frozen left cell */}
              <div style={{
                width: LEFT_W, flexShrink: 0, height: HEADER_H,
                background: 'white', borderRight: '2px solid #CBD5E1',
                display: 'flex', alignItems: 'flex-end', padding: '0 14px 6px',
                position: 'sticky', left: 0, zIndex: 12,
                boxShadow: '3px 0 6px rgba(0,0,0,0.06)',
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Task</span>
              </div>

              {/* Month + sub-tick columns */}
              <div style={{ flex: 1, position: 'relative', background: '#F8FAFC', overflow: 'hidden' }}>
                {/* Month name row (top) */}
                {monthSpans.map((span, i) => (
                  <div key={i} style={{
                    position: 'absolute', left: xPx(span.ts), top: 0,
                    width: span.width, height: HEADER_TOP_H,
                    borderRight: '1px solid #CBD5E1',
                    display: 'flex', alignItems: 'center', paddingLeft: 8,
                    background: '#F8FAFC',
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                      {span.label}
                    </span>
                  </div>
                ))}

                {/* Sub-tick row (bottom) */}
                {subTicks.map((tick, i) => (
                  <div key={i} style={{
                    position: 'absolute', left: xPx(tick.ts), top: HEADER_TOP_H,
                    height: HEADER_BOT_H, borderLeft: '1px solid #E2E8F0',
                    paddingLeft: 4, display: 'flex', alignItems: 'center',
                    background: tick.isWeekend ? '#F1F5F9' : 'transparent',
                  }}>
                    <span style={{ fontSize: 9, color: tick.isWeekend ? '#94A3B8' : '#64748B', whiteSpace: 'nowrap', fontWeight: tick.isWeekend ? 400 : 500 }}>
                      {tick.label}
                    </span>
                  </div>
                ))}

                {/* Today line in header */}
                {todayPx >= 0 && todayPx <= totalPx && (
                  <div style={{
                    position: 'absolute', left: todayPx, top: 0, bottom: 0, width: 2,
                    background: '#EF4444', zIndex: 2,
                  }}>
                    <span style={{
                      position: 'absolute', top: 3, left: 3,
                      fontSize: 9, color: '#EF4444', fontWeight: 700, whiteSpace: 'nowrap',
                      background: 'white', padding: '0 3px', borderRadius: 3,
                    }}>TODAY</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Rows ── */}
            {groups.map(group => (
              <React.Fragment key={group.id}>

                {/* Group header row */}
                {group.label && (
                  <div
                    onClick={() => toggleGroup(group.id)}
                    style={{ display: 'flex', height: GROUP_H, cursor: 'pointer', borderBottom: '1px solid #E2E8F0' }}
                  >
                    <div style={{
                      width: LEFT_W, flexShrink: 0, height: GROUP_H,
                      display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px',
                      background: '#F1F5F9', borderRight: '2px solid #CBD5E1',
                      position: 'sticky', left: 0, zIndex: 5,
                      boxShadow: '3px 0 6px rgba(0,0,0,0.04)',
                    }}>
                      <span style={{ fontSize: 9, color: '#64748B', width: 10 }}>
                        {collapsed[group.id] ? '▶' : '▼'}
                      </span>
                      {group.color && (
                        <span style={{ width: 9, height: 9, borderRadius: '50%', background: group.color, flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', letterSpacing: '-0.01em' }}>
                        {group.label}
                      </span>
                      <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>
                        ({group.nodes.length})
                      </span>
                    </div>
                    <div style={{ flex: 1, background: '#F1F5F9', position: 'relative' }}>
                      {todayPx >= 0 && <div style={{ position: 'absolute', left: todayPx, top: 0, bottom: 0, width: 2, background: 'rgba(239,68,68,0.15)' }} />}
                    </div>
                  </div>
                )}

                {/* Task rows */}
                {!collapsed[group.id] && group.nodes.map((node, idx) => {
                  const dueTs = new Date(node.dueDate).getTime()
                  const startTs = node.startDate
                    ? new Date(node.startDate).getTime()
                    : addDays(dueTs, -1)
                  const barLeft = xPx(Math.min(startTs, dueTs))
                  const barWidth = Math.max(pxPerDay * 0.8, xPx(Math.max(startTs, dueTs)) - barLeft + pxPerDay * 0.5)

                  const status = STATUS_META[node.status] || STATUS_META.todo
                  const priority = node.priority || 'none'
                  const isOverdue = dueTs < today && node.status !== 'done'
                  const isDone = node.status === 'done'
                  const rowBg = idx % 2 === 0 ? 'white' : '#FAFBFD'

                  let barStyle
                  if (isDone) {
                    barStyle = `linear-gradient(135deg, ${status.bar}66, ${status.bar}88)`
                  } else if (isOverdue) {
                    barStyle = `repeating-linear-gradient(45deg, #FEE2E2, #FEE2E2 5px, #FCA5A5 5px, #FCA5A5 10px)`
                  } else {
                    barStyle = `linear-gradient(135deg, ${status.bar}cc, ${status.barDark})`
                  }

                  return (
                    <div
                      key={node.id}
                      style={{ display: 'flex', height: ROW_H, background: rowBg, borderBottom: '1px solid #F1F5F9' }}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      {/* Left label (sticky) */}
                      <div
                        style={{
                          width: LEFT_W, flexShrink: 0, height: ROW_H,
                          display: 'flex', alignItems: 'center', gap: 7, padding: '0 12px',
                          background: rowBg, borderRight: '2px solid #E2E8F0',
                          position: 'sticky', left: 0, zIndex: 4, cursor: 'pointer',
                          boxShadow: '3px 0 6px rgba(0,0,0,0.04)',
                        }}
                        onClick={() => onOpenDetail?.(node.id)}
                      >
                        {node.issueType
                          ? <span style={{ fontSize: 11, flexShrink: 0 }}>{ISSUE_ICONS[node.issueType]}</span>
                          : <span style={{ width: 7, height: 7, borderRadius: '50%', background: PRIORITY_STRIPE[priority], flexShrink: 0 }} />
                        }
                        <span style={{
                          fontSize: 11, fontWeight: 500, flex: 1,
                          color: isOverdue ? '#EF4444' : isDone ? '#94A3B8' : '#1E293B',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          textDecoration: isDone ? 'line-through' : 'none',
                        }}>
                          {isOverdue && '⚠ '}{node.title}
                        </span>
                        {node.nodeKey && (
                          <span style={{ fontSize: 9, color: '#2563EB', fontWeight: 700, fontFamily: 'monospace', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 3, padding: '1px 4px', flexShrink: 0 }}>
                            {node.nodeKey}
                          </span>
                        )}
                        {node.assignee && (
                          <div style={{
                            width: 20, height: 20, borderRadius: '50%', background: avatarColor(node.assignee),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 8, fontWeight: 700, color: 'white', flexShrink: 0,
                          }}>
                            {node.assignee.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Bar area */}
                      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                        {/* Weekend shading */}
                        {zoom === 'week' && subTicks.filter(t => t.isWeekend).map((t, i) => (
                          <div key={i} style={{
                            position: 'absolute', left: xPx(t.ts), width: pxPerDay,
                            top: 0, bottom: 0, background: 'rgba(148,163,184,0.07)', pointerEvents: 'none',
                          }} />
                        ))}

                        {/* Grid lines */}
                        {subTicks.map((t, i) => (
                          <div key={i} style={{
                            position: 'absolute', left: xPx(t.ts), top: 0, bottom: 0,
                            borderLeft: `1px solid ${t.isWeekend ? '#E2E8F0' : '#F1F5F9'}`,
                            pointerEvents: 'none',
                          }} />
                        ))}

                        {/* Today line */}
                        {todayPx >= 0 && (
                          <div style={{
                            position: 'absolute', left: todayPx, top: 0, bottom: 0,
                            width: 2, background: 'rgba(239,68,68,0.3)', pointerEvents: 'none',
                          }} />
                        )}

                        {/* Gantt bar */}
                        <div
                          style={{
                            position: 'absolute',
                            left: barLeft, width: barWidth,
                            top: '50%', transform: 'translateY(-50%)',
                            height: 26, borderRadius: 7,
                            background: barStyle,
                            border: `1px solid ${isOverdue ? '#FCA5A5' : isDone ? `${status.bar}44` : `${status.barDark}44`}`,
                            boxShadow: isDone || isOverdue ? 'none' : `0 2px 8px ${status.bar}44`,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', overflow: 'hidden',
                          }}
                          onClick={() => onOpenDetail?.(node.id)}
                          onMouseEnter={e => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            setTooltip({ node, x: rect.left, y: rect.bottom + 6 })
                          }}
                        >
                          {/* Priority left stripe */}
                          <div style={{
                            position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                            background: PRIORITY_STRIPE[priority],
                            borderRadius: '7px 0 0 7px',
                          }} />
                          {barWidth > 50 && (
                            <span style={{
                              fontSize: 9, paddingLeft: 10,
                              color: isDone ? '#64748B' : isOverdue ? '#9F1239' : 'white',
                              fontWeight: 600, whiteSpace: 'nowrap',
                              overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                              {node.title}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* ── Legend ── */}
      {!emptyState && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 12, padding: '8px 20px',
          borderTop: '1px solid #E2E8F0', background: 'white',
          fontSize: 10, color: '#64748B', flexShrink: 0, alignItems: 'center',
        }}>
          <span style={{ fontWeight: 700, color: '#374151', fontSize: 11 }}>Status:</span>
          {Object.entries(STATUS_META).map(([k, v]) => (
            <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: v.bar, display: 'inline-block' }} />
              {v.label}
            </span>
          ))}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              width: 12, height: 10, borderRadius: 3, display: 'inline-block',
              background: 'repeating-linear-gradient(45deg,#FEE2E2,#FEE2E2 2px,#FCA5A5 2px,#FCA5A5 4px)',
            }} />
            Overdue
          </span>
          <span style={{ color: '#CBD5E1' }}>│</span>
          <span style={{ fontWeight: 700, color: '#374151', fontSize: 11 }}>Priority stripe:</span>
          {Object.entries(PRIORITY_STRIPE).map(([k, v]) => (
            <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 4, height: 12, borderRadius: 2, background: v, display: 'inline-block' }} />
              {k === 'none' ? 'None' : k.charAt(0).toUpperCase() + k.slice(1)}
            </span>
          ))}
          <span style={{ color: '#CBD5E1' }}>│</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 2, height: 12, background: '#EF4444', display: 'inline-block', borderRadius: 1 }} />
            Today
          </span>
        </div>
      )}

      {/* ── Hover tooltip ── */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: Math.min(tooltip.x + 4, window.innerWidth - 240),
          top: Math.min(tooltip.y, window.innerHeight - 180),
          zIndex: 200, pointerEvents: 'none',
          background: '#0F172A', color: 'white',
          borderRadius: 10, padding: '10px 14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          minWidth: 200, maxWidth: 240,
        }}>
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6, lineHeight: 1.4 }}>{tooltip.node.title}</div>
          {[
            ['Status',   STATUS_META[tooltip.node.status]?.label, STATUS_META[tooltip.node.status]?.bar],
            ['Priority', tooltip.node.priority, PRIORITY_STRIPE[tooltip.node.priority]],
            ['Assignee', tooltip.node.assignee, null],
            ['Due',      tooltip.node.dueDate,  new Date(tooltip.node.dueDate) < new Date() && tooltip.node.status !== 'done' ? '#FCA5A5' : '#94A3B8'],
            ['Start',    tooltip.node.startDate, null],
            ['Points',   tooltip.node.storyPoints != null ? `${tooltip.node.storyPoints} pts` : null, null],
          ].filter(([, v]) => v != null).map(([label, val, color]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
              <span style={{ color: '#64748B' }}>{label}</span>
              <span style={{ color: color || 'white', fontWeight: 500 }}>{val}</span>
            </div>
          ))}
          <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #1E293B', fontSize: 10, color: '#475569', textAlign: 'center' }}>
            Click to open detail
          </div>
        </div>
      )}
    </div>
  )
}
