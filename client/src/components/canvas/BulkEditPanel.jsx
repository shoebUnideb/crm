import React, { useState } from 'react'

const STATUS_OPTIONS = [
  { value: '', label: '— keep existing —' },
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'blocked', label: 'Blocked' },
]

const PRIORITY_OPTIONS = [
  { value: '', label: '— keep existing —' },
  { value: 'critical', label: '🔴 Critical' },
  { value: 'high', label: '🟠 High' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'low', label: '🟢 Low' },
]

const ISSUE_TYPE_OPTIONS = [
  { value: '', label: '— keep existing —' },
  { value: 'epic', label: '🟣 Epic' },
  { value: 'story', label: '🟢 Story' },
  { value: 'task', label: '🔵 Task' },
  { value: 'bug', label: '🔴 Bug' },
  { value: 'subtask', label: '⚪ Subtask' },
]

export default function BulkEditPanel({ nodeIds, nodes, onApply, onClose }) {
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [issueType, setIssueType] = useState('')
  const [assignee, setAssignee] = useState('')
  const [sprint, setSprint] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [addTags, setAddTags] = useState('')
  const [clearTags, setClearTags] = useState(false)

  const count = nodeIds.length

  function apply() {
    const meta = {}
    if (status) meta.status = status
    if (priority) meta.priority = priority
    if (issueType) meta.issueType = issueType
    if (assignee.trim()) meta.assignee = assignee.trim()
    if (sprint.trim()) meta.sprint = sprint.trim()
    if (dueDate) meta.dueDate = dueDate

    const newTagsList = addTags.split(',').map(t => t.trim()).filter(Boolean)

    if (Object.keys(meta).length === 0 && newTagsList.length === 0 && !clearTags) {
      onClose()
      return
    }

    for (const nodeId of nodeIds) {
      const nodeMeta = { ...meta }
      if (clearTags) {
        nodeMeta.tags = newTagsList
      } else if (newTagsList.length > 0) {
        const existing = nodes[nodeId]?.tags ?? []
        nodeMeta.tags = [...new Set([...existing, ...newTagsList])]
      }
      onApply(nodeId, nodeMeta)
    }
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: '16px', width: 420, maxWidth: '95vw',
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)', border: '1px solid #E5E7EB',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAFAFA' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>Bulk Edit</div>
            <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: 1 }}>
              Editing {count} node{count !== 1 ? 's' : ''} — only filled fields will be applied
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '22px', lineHeight: 1 }}>×</button>
        </div>

        {/* Form */}
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Status + Priority */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Status">
              <select value={status} onChange={e => setStatus(e.target.value)} style={selectStyle}>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select value={priority} onChange={e => setPriority(e.target.value)} style={selectStyle}>
                {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>

          {/* Issue Type */}
          <Field label="Issue Type">
            <select value={issueType} onChange={e => setIssueType(e.target.value)} style={selectStyle}>
              {ISSUE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>

          {/* Assignee + Sprint */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Assignee">
              <input
                type="text" value={assignee} onChange={e => setAssignee(e.target.value)}
                placeholder="Name or email" style={inputStyle}
              />
            </Field>
            <Field label="Sprint">
              <input
                type="text" value={sprint} onChange={e => setSprint(e.target.value)}
                placeholder="Sprint name" style={inputStyle}
              />
            </Field>
          </div>

          {/* Due Date */}
          <Field label="Due Date">
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inputStyle} />
          </Field>

          {/* Tags */}
          <Field label="Add Tags (comma-separated)">
            <input
              type="text" value={addTags} onChange={e => setAddTags(e.target.value)}
              placeholder="e.g. frontend, urgent" style={inputStyle}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, fontSize: '11px', color: '#6B7280', cursor: 'pointer' }}>
              <input type="checkbox" checked={clearTags} onChange={e => setClearTags(e.target.checked)} />
              Replace existing tags (instead of merging)
            </label>
          </Field>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 16px', background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB', borderRadius: '9px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
          >Cancel</button>
          <button
            onClick={apply}
            style={{ padding: '8px 18px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '9px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
          >Apply to {count} node{count !== 1 ? 's' : ''}</button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '6px 9px', border: '1px solid #E5E7EB',
  borderRadius: '7px', fontSize: '12px', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit',
}

const selectStyle = {
  width: '100%', padding: '6px 9px', border: '1px solid #E5E7EB',
  borderRadius: '7px', fontSize: '12px', outline: 'none', background: 'white',
  cursor: 'pointer', fontFamily: 'inherit', boxSizing: 'border-box',
}
