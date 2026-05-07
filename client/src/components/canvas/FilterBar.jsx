import React from 'react'

const STATUSES = ['todo', 'in-progress', 'done', 'blocked']
const PRIORITIES = ['critical', 'high', 'medium', 'low']

const STATUS_COLORS = { todo: '#6B7280', 'in-progress': '#3B82F6', done: '#22C55E', blocked: '#EF4444' }
const STATUS_BG = { todo: '#F3F4F6', 'in-progress': '#EFF6FF', done: '#F0FDF4', blocked: '#FEF2F2' }
const PRIORITY_COLORS = { critical: '#EF4444', high: '#F97316', medium: '#EAB308', low: '#22C55E' }
const PRIORITY_ICONS = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }

export default function FilterBar({ filters, onChange, nodes, onClose }) {
  const assignees = [...new Set(Object.values(nodes).map(n => n.assignee).filter(Boolean))].sort()
  const sprints = [...new Set(Object.values(nodes).map(n => n.sprint).filter(Boolean))].sort()
  const tags = [...new Set(Object.values(nodes).flatMap(n => n.tags || []))].sort()

  function toggle(key, value) {
    const current = filters[key] || []
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    onChange({ ...filters, [key]: next })
  }

  const activeCount = Object.values(filters).reduce((sum, arr) => sum + (arr?.length || 0), 0)

  return (
    <div style={{
      position: 'absolute', top: 56, left: 12, zIndex: 15,
      background: 'white', borderRadius: '12px',
      border: '1px solid #E5E7EB', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      padding: '10px 14px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 14px',
      maxWidth: 'calc(100% - 300px)',
    }}>
      {/* Status */}
      <FilterGroup label="Status">
        {STATUSES.map(s => (
          <FilterChip
            key={s}
            active={(filters.status || []).includes(s)}
            onClick={() => toggle('status', s)}
            color={STATUS_COLORS[s]}
            bg={STATUS_BG[s]}
          >{s}</FilterChip>
        ))}
      </FilterGroup>

      {/* Priority */}
      <FilterGroup label="Priority">
        {PRIORITIES.map(p => (
          <FilterChip
            key={p}
            active={(filters.priority || []).includes(p)}
            onClick={() => toggle('priority', p)}
            color={PRIORITY_COLORS[p]}
            bg={PRIORITY_COLORS[p] + '15'}
          >{PRIORITY_ICONS[p]} {p}</FilterChip>
        ))}
      </FilterGroup>

      {/* Assignee */}
      {assignees.length > 0 && (
        <FilterGroup label="Assignee">
          {assignees.map(a => (
            <FilterChip
              key={a}
              active={(filters.assignee || []).includes(a)}
              onClick={() => toggle('assignee', a)}
              color="#818CF8"
              bg="#EEF2FF"
            >{a.split(' ')[0]}</FilterChip>
          ))}
        </FilterGroup>
      )}

      {/* Sprint */}
      {sprints.length > 0 && (
        <FilterGroup label="Sprint">
          {sprints.map(sp => (
            <FilterChip
              key={sp}
              active={(filters.sprint || []).includes(sp)}
              onClick={() => toggle('sprint', sp)}
              color="#0891B2"
              bg="#ECFEFF"
            >{sp}</FilterChip>
          ))}
        </FilterGroup>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <FilterGroup label="Tags">
          {tags.map(t => (
            <FilterChip
              key={t}
              active={(filters.tags || []).includes(t)}
              onClick={() => toggle('tags', t)}
              color="#7C3AED"
              bg="#F5F3FF"
            >{t}</FilterChip>
          ))}
        </FilterGroup>
      )}

      {/* Clear + close */}
      <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', alignItems: 'center' }}>
        {activeCount > 0 && (
          <button
            onClick={() => onChange({})}
            style={{ fontSize: '11px', color: '#EF4444', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '999px', padding: '3px 10px', cursor: 'pointer', fontWeight: 600 }}
          >Clear {activeCount}</button>
        )}
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '16px', lineHeight: 1 }}>×</button>
      </div>
    </div>
  )
}

function FilterGroup({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{children}</div>
    </div>
  )
}

function FilterChip({ children, active, onClick, color, bg }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '3px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
        border: `1.5px solid ${active ? color : '#E5E7EB'}`,
        background: active ? bg : 'white',
        color: active ? color : '#6B7280',
        transition: 'all 0.1s',
      }}
    >{children}</button>
  )
}

export function applyFilters(nodes, filters) {
  const hasFilters = Object.values(filters).some(arr => arr?.length > 0)
  if (!hasFilters) return null // null = no filtering active

  const visible = new Set()
  for (const n of Object.values(nodes)) {
    let match = true
    if (filters.status?.length && !filters.status.includes(n.status)) match = false
    if (filters.priority?.length && !filters.priority.includes(n.priority)) match = false
    if (filters.assignee?.length && !filters.assignee.includes(n.assignee)) match = false
    if (filters.sprint?.length && !filters.sprint.includes(n.sprint)) match = false
    if (filters.tags?.length && !filters.tags.some(t => n.tags?.includes(t))) match = false
    if (match) visible.add(n.id)
  }
  return visible
}
