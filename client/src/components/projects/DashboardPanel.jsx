import React, { useMemo } from 'react'

const STATUS_COLORS = {
  todo: '#6B7280',
  'in-progress': '#3B82F6',
  done: '#22C55E',
  blocked: '#EF4444',
}

const PRIORITY_COLORS = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#22C55E',
}

function computeProjectStats(project) {
  // Aggregate nodes across all maps (new format) or from flat nodes (old/migrated)
  const nodes = project.maps
    ? Object.values(project.maps).flatMap(m => Object.values(m.nodes || {}))
    : Object.values(project.nodes || {})
  const total = nodes.length
  const done = nodes.filter(n => n.status === 'done').length
  const blocked = nodes.filter(n => n.status === 'blocked').length
  const inProgress = nodes.filter(n => n.status === 'in-progress').length
  const todo = nodes.filter(n => n.status === 'todo').length
  const noStatus = nodes.filter(n => !n.status).length

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const overdue = nodes.filter(n => n.dueDate && new Date(n.dueDate) < today && n.status !== 'done').length

  const totalPoints = nodes.reduce((sum, n) => sum + (n.storyPoints ?? 0), 0)
  const donePoints = nodes.filter(n => n.status === 'done').reduce((sum, n) => sum + (n.storyPoints ?? 0), 0)

  const withJira = nodes.filter(n => n.jiraKey).length
  const completionPct = total > 0 ? Math.round((done / total) * 100) : 0
  const pointsPct = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0

  return { total, done, blocked, inProgress, todo, noStatus, overdue, totalPoints, donePoints, withJira, completionPct, pointsPct }
}

export default function DashboardPanel({ projects, activeId, onSwitch, onClose, onFromTemplate }) {
  const stats = useMemo(() =>
    projects.map(p => ({
      ...computeProjectStats(p),
      id: p.id, name: p.name, updatedAt: p.updatedAt,
      mapCount: p.maps ? Object.keys(p.maps).length : 1,
    })),
    [projects]
  )

  const totals = useMemo(() => ({
    projects: stats.length,
    nodes: stats.reduce((s, p) => s + p.total, 0),
    done: stats.reduce((s, p) => s + p.done, 0),
    blocked: stats.reduce((s, p) => s + p.blocked, 0),
    overdue: stats.reduce((s, p) => s + p.overdue, 0),
    points: stats.reduce((s, p) => s + p.totalPoints, 0),
    donePoints: stats.reduce((s, p) => s + p.donePoints, 0),
  }), [stats])

  const globalPct = totals.nodes > 0 ? Math.round((totals.done / totals.nodes) * 100) : 0

  return (
    <div style={{
      width: 560, height: '100%', background: 'white',
      borderRight: '1px solid #E5E7EB',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      boxShadow: '4px 0 24px rgba(0,0,0,0.1)',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: '#FAFAFA' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>Project Dashboard</div>
          <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: 1 }}>{totals.projects} project{totals.projects !== 1 ? 's' : ''}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9CA3AF', lineHeight: 1 }}>×</button>
      </div>

      {/* Global summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: '14px 18px', borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
        <SummaryCard label="Total Nodes" value={totals.nodes} color="#374151" />
        <SummaryCard label="Done" value={`${globalPct}%`} color="#22C55E" sub={`${totals.done}/${totals.nodes}`} />
        <SummaryCard label="Blocked" value={totals.blocked} color="#EF4444" />
        <SummaryCard label="Overdue" value={totals.overdue} color={totals.overdue > 0 ? '#F97316' : '#22C55E'} />
      </div>

      {/* Global progress bar */}
      <div style={{ padding: '0 18px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: '10px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overall Completion</span>
          <span style={{ fontSize: '10px', color: '#374151', fontWeight: 700 }}>{globalPct}%</span>
        </div>
        <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${globalPct}%`, background: 'linear-gradient(90deg, #3B82F6, #22C55E)', borderRadius: 3, transition: 'width 0.3s ease' }} />
        </div>
        {totals.points > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: '10px', color: '#6B7280' }}>Story Points: {totals.donePoints}/{totals.points}</span>
            <span style={{ fontSize: '10px', color: '#374151', fontWeight: 600 }}>{totals.points > 0 ? Math.round(totals.donePoints / totals.points * 100) : 0}%</span>
          </div>
        )}
      </div>

      {/* Per-project list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 12px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Projects</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {stats.map(s => (
            <ProjectCard
              key={s.id}
              stat={s}
              isActive={s.id === activeId}
              onClick={() => { onSwitch(s.id); onClose() }}
            />
          ))}
        </div>
      </div>

      {/* New from template CTA */}
      {onFromTemplate && (
        <div style={{ padding: '12px 18px', borderTop: '1px solid #F3F4F6', flexShrink: 0 }}>
          <button
            onClick={onFromTemplate}
            style={{
              width: '100%', padding: '9px 14px', borderRadius: 8,
              border: '1.5px solid #7C3AED', background: '#F5F3FF',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontSize: '12px', fontWeight: 600, color: '#7C3AED',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#EDE9FE' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F5F3FF' }}
          >
            <span>📐</span>
            New project from template
          </button>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, color, sub }) {
  return (
    <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
      <div style={{ fontSize: '20px', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: 1 }}>{sub}</div>}
      <div style={{ fontSize: '10px', color: '#6B7280', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
    </div>
  )
}

function ProjectCard({ stat, isActive, onClick }) {
  const statusBars = [
    { key: 'done', label: 'Done', count: stat.done, color: '#22C55E' },
    { key: 'in-progress', label: 'In Progress', count: stat.inProgress, color: '#3B82F6' },
    { key: 'todo', label: 'To Do', count: stat.todo, color: '#9CA3AF' },
    { key: 'blocked', label: 'Blocked', count: stat.blocked, color: '#EF4444' },
    { key: 'none', label: 'No Status', count: stat.noStatus, color: '#E5E7EB' },
  ].filter(b => b.count > 0)

  return (
    <div
      onClick={onClick}
      style={{
        border: `2px solid ${isActive ? '#3B82F6' : '#E5E7EB'}`,
        borderRadius: 12,
        padding: '12px 14px',
        cursor: 'pointer',
        background: isActive ? '#EFF6FF' : 'white',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = '#93C5FD' }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = '#E5E7EB' }}
    >
      {/* Name row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3B82F6', display: 'inline-block', flexShrink: 0 }} />}
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{stat.name}</span>
        </div>
        <span style={{ fontSize: '10px', color: '#9CA3AF' }}>
          {stat.mapCount > 1 ? `${stat.mapCount} maps · ` : ''}{stat.total} node{stat.total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 5, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden', marginBottom: 8, display: 'flex' }}>
        {statusBars.map(b => (
          <div key={b.key} style={{ height: '100%', width: `${stat.total > 0 ? (b.count / stat.total) * 100 : 0}%`, background: b.color }} />
        ))}
      </div>

      {/* Stats chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        <Chip label={`${stat.completionPct}% done`} color="#22C55E" />
        {stat.inProgress > 0 && <Chip label={`${stat.inProgress} in progress`} color="#3B82F6" />}
        {stat.blocked > 0 && <Chip label={`${stat.blocked} blocked`} color="#EF4444" />}
        {stat.overdue > 0 && <Chip label={`${stat.overdue} overdue`} color="#F97316" />}
        {stat.totalPoints > 0 && <Chip label={`${stat.donePoints}/${stat.totalPoints} pts`} color="#8B5CF6" />}
        {stat.withJira > 0 && <Chip label={`${stat.withJira} Jira`} color="#0052CC" />}
      </div>

      {/* Updated at */}
      <div style={{ fontSize: '10px', color: '#D1D5DB', marginTop: 6, textAlign: 'right' }}>
        Updated {new Date(stat.updatedAt).toLocaleDateString()}
      </div>
    </div>
  )
}

function Chip({ label, color }) {
  return (
    <span style={{
      fontSize: '10px', fontWeight: 600, color,
      background: color + '18', border: `1px solid ${color}40`,
      borderRadius: '999px', padding: '2px 7px',
    }}>{label}</span>
  )
}
