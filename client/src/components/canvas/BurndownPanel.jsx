import React, { useMemo } from 'react'

const STATUS_COLORS = {
  done: '#22C55E',
  'in-progress': '#3B82F6',
  blocked: '#EF4444',
  todo: '#9CA3AF',
  none: '#E5E7EB',
}

const STATUS_LABELS = {
  done: 'Done',
  'in-progress': 'In Progress',
  blocked: 'Blocked',
  todo: 'To Do',
  none: 'No Status',
}

export default function BurndownPanel({ nodes, onClose }) {
  const stats = useMemo(() => {
    const allNodes = Object.values(nodes)
    const buckets = { done: 0, 'in-progress': 0, blocked: 0, todo: 0, none: 0 }
    const pointBuckets = { done: 0, 'in-progress': 0, blocked: 0, todo: 0, none: 0 }
    let totalNodes = 0
    let totalPoints = 0

    for (const n of allNodes) {
      const key = n.status || 'none'
      if (!(key in buckets)) continue
      buckets[key]++
      totalNodes++
      const sp = Number(n.storyPoints)
      if (!isNaN(sp) && sp > 0) {
        pointBuckets[key] += sp
        totalPoints += sp
      }
    }

    return { buckets, pointBuckets, totalNodes, totalPoints }
  }, [nodes])

  const { buckets, pointBuckets, totalNodes, totalPoints } = stats
  const completionPct = totalNodes > 0 ? Math.round((buckets.done / totalNodes) * 100) : 0
  const pointsPct = totalPoints > 0 ? Math.round((pointBuckets.done / totalPoints) * 100) : 0

  const statusOrder = ['done', 'in-progress', 'todo', 'blocked', 'none']

  return (
    <div style={{
      position: 'absolute', right: 12, top: 12, width: 280, zIndex: 15,
      background: 'white', borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.16)', border: '1px solid #E5E7EB',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '11px 14px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAFAFA' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>Burndown / Velocity</div>
          <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: 1 }}>Story points &amp; node completion</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '18px', lineHeight: 1 }}>×</button>
      </div>

      <div style={{ padding: '14px' }}>
        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          <StatCard label="Nodes Done" value={`${completionPct}%`} sub={`${buckets.done} / ${totalNodes}`} color="#22C55E" />
          <StatCard label="Points Done" value={`${pointsPct}%`} sub={`${pointBuckets.done} / ${totalPoints} sp`} color="#3B82F6" />
        </div>

        {/* Node count bar chart */}
        <SectionLabel>Node Count by Status</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
          {statusOrder.map(key => {
            const count = buckets[key]
            const pct = totalNodes > 0 ? (count / totalNodes) * 100 : 0
            return (
              <BarRow key={key} label={STATUS_LABELS[key]} count={count} pct={pct} color={STATUS_COLORS[key]} />
            )
          })}
        </div>

        {/* Story points bar chart */}
        {totalPoints > 0 && (
          <>
            <SectionLabel>Story Points by Status</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
              {statusOrder.map(key => {
                const pts = pointBuckets[key]
                if (pts === 0) return null
                const pct = (pts / totalPoints) * 100
                return (
                  <BarRow key={key} label={STATUS_LABELS[key]} count={`${pts}sp`} pct={pct} color={STATUS_COLORS[key]} />
                )
              })}
            </div>
          </>
        )}

        {/* Stacked progress bar */}
        <SectionLabel>Overall Progress</SectionLabel>
        <StackedBar buckets={buckets} total={totalNodes} />
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: '#F9FAFB', borderRadius: '10px', padding: '10px', border: '1px solid #F3F4F6' }}>
      <div style={{ fontSize: '10px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '22px', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: 3 }}>{sub}</div>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
      {children}
    </div>
  )
}

function BarRow({ label, count, pct, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <div style={{ fontSize: '11px', color: '#374151', width: 76, flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 6, background: '#F3F4F6', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '999px', transition: 'width 0.3s' }} />
      </div>
      <div style={{ fontSize: '10px', color: '#9CA3AF', width: 30, textAlign: 'right', flexShrink: 0 }}>{count}</div>
    </div>
  )
}

function StackedBar({ buckets, total }) {
  if (total === 0) return <div style={{ fontSize: '11px', color: '#D1D5DB' }}>No nodes yet</div>
  const order = ['done', 'in-progress', 'todo', 'blocked', 'none']
  return (
    <div style={{ height: 14, display: 'flex', borderRadius: '999px', overflow: 'hidden', width: '100%' }}>
      {order.map(key => {
        const pct = (buckets[key] / total) * 100
        if (pct === 0) return null
        return (
          <div key={key} style={{ width: `${pct}%`, background: STATUS_COLORS[key], transition: 'width 0.3s' }} title={`${STATUS_LABELS[key]}: ${buckets[key]}`} />
        )
      })}
    </div>
  )
}
