import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// Lazy-loaded: prevents CRM code from entering the Canvas JS chunk
const InlineCRMModal = React.lazy(() => import('../crm/InlineCRMModal.jsx'))

// ── Design tokens ─────────────────────────────────────────────────────────────
const navy    = '#172B4D'
const blue    = '#0052CC'
const subtle  = '#5E6C84'
const border  = '#DFE1E6'
const bg      = '#FAFBFC'

// ── Status options ────────────────────────────────────────────────────────────
const STATUS_OPTS = [
  { value: '',            label: 'No Status',   color: '#42526E', bg: '#DFE1E6' },
  { value: 'todo',        label: 'To Do',       color: '#42526E', bg: '#DFE1E6' },
  { value: 'in-progress', label: 'In Progress', color: '#0052CC', bg: '#DEEBFF' },
  { value: 'done',        label: 'Done',        color: '#006644', bg: '#E3FCEF' },
  { value: 'blocked',     label: 'Blocked',     color: '#BF2600', bg: '#FFEBE6' },
]

const PRIORITY_OPTS = [
  { value: '',         label: 'None',     icon: '—' },
  { value: 'critical', label: 'Critical', icon: '🔴' },
  { value: 'high',     label: 'High',     icon: '🟠' },
  { value: 'medium',   label: 'Medium',   icon: '🟡' },
  { value: 'low',      label: 'Low',      icon: '🟢' },
]

const ISSUE_TYPE_OPTS = [
  { value: '',        label: 'Task',    icon: '🔵' },
  { value: 'epic',    label: 'Epic',    icon: '🟣' },
  { value: 'story',   label: 'Story',   icon: '🟢' },
  { value: 'task',    label: 'Task',    icon: '🔵' },
  { value: 'bug',     label: 'Bug',     icon: '🔴' },
  { value: 'subtask', label: 'Subtask', icon: '⚪' },
]

const STATUS_NODE_COLORS = {
  '':            { color: '#42526E', bg: '#DFE1E6' },
  'todo':        { color: '#42526E', bg: '#DFE1E6' },
  'in-progress': { color: '#0052CC', bg: '#DEEBFF' },
  'done':        { color: '#006644', bg: '#E3FCEF' },
  'blocked':     { color: '#BF2600', bg: '#FFEBE6' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getStatusBadge(status) {
  return STATUS_NODE_COLORS[status] || STATUS_NODE_COLORS['']
}

function getIssueIcon(type) {
  return ISSUE_TYPE_OPTS.find(o => o.value === (type || ''))?.icon || '🔵'
}

function getPriorityIcon(p) {
  return PRIORITY_OPTS.find(o => o.value === (p || ''))?.icon || '—'
}

function formatDate(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) } catch { return iso }
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return formatDate(iso)
}

function initials(str) {
  if (!str) return '?'
  return str.trim().split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Avatar({ name, size = 24, color = blue }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, color: '#fff', fontSize: size * 0.42,
      fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, userSelect: 'none',
    }}>
      {initials(name)}
    </div>
  )
}

function DetailRow({ label, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 8, alignItems: 'center', minHeight: 32 }}>
      <span style={{ fontSize: 12, color: subtle, fontWeight: 500 }}>{label}</span>
      <div>{children}</div>
    </div>
  )
}

function InlineSelect({ value, options, onChange, disabled }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      style={{
        fontSize: 13, border: `1px solid ${border}`, borderRadius: 4,
        padding: '3px 6px', background: '#fff', color: navy,
        cursor: disabled ? 'not-allowed' : 'pointer', width: '100%',
        outline: 'none',
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.icon ? `${o.icon} ${o.label}` : o.label}</option>)}
    </select>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function NodeDetailDialog({
  node,
  nodes          = {},
  projectId,
  onSave,
  onAddComment,
  onDeleteComment,
  onAddChild,
  onOpenDetail,
  onClose,
  onAssignNodeKey,
  currentUser    = 'You',
  customStatuses = [],
  myRole         = null,
}) {
  const canEdit = myRole !== 'view'
  const navigate = useNavigate()

  // Auto-assign nodeKey for legacy nodes that don't have one yet
  useEffect(() => {
    if (!node.nodeKey && onAssignNodeKey) {
      onAssignNodeKey(node.id)
    }
  }, [node.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Local state ──────────────────────────────────────────────────────────
  const [activityTab, setActivityTab]     = useState('comments')
  const [commentText, setCommentText]     = useState('')
  const [workLogText, setWorkLogText]     = useState('')
  const [workLogHours, setWorkLogHours]   = useState('')
  const [showCRMModal, setShowCRMModal]   = useState(false)

  // Title editing
  const [editingTitle, setEditingTitle]   = useState(false)
  const [titleVal, setTitleVal]           = useState(node.title || '')
  const titleRef                          = useRef(null)

  // Description editing
  const [editingDesc, setEditingDesc]     = useState(false)
  const [descVal, setDescVal]             = useState(node.notes || '')
  const descRef                           = useRef(null)

  // Right panel form
  const [form, setForm] = useState({
    status:      node.status      ?? '',
    priority:    node.priority    ?? '',
    issueType:   node.issueType   ?? '',
    assignee:    node.assignee    ?? '',
    dueDate:     node.dueDate     ?? '',
    sprint:      node.sprint      ?? '',
    storyPoints: node.storyPoints != null ? String(node.storyPoints) : '',
    jiraKey:     node.jiraKey     ?? '',
    url:         node.url         ?? '',
    timeEstimate: node.timeEstimate != null ? String(node.timeEstimate) : '',
    timeLogged:  node.timeLogged  != null ? String(node.timeLogged) : '',
  })
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags]         = useState(node.tags || [])

  // ─── Sync node prop changes ───────────────────────────────────────────────
  useEffect(() => {
    setTitleVal(node.title || '')
    setDescVal(node.notes || '')
    setTags(node.tags || [])
    setForm({
      status:      node.status      ?? '',
      priority:    node.priority    ?? '',
      issueType:   node.issueType   ?? '',
      assignee:    node.assignee    ?? '',
      dueDate:     node.dueDate     ?? '',
      sprint:      node.sprint      ?? '',
      storyPoints: node.storyPoints != null ? String(node.storyPoints) : '',
      jiraKey:     node.jiraKey     ?? '',
      url:         node.url         ?? '',
      timeEstimate: node.timeEstimate != null ? String(node.timeEstimate) : '',
      timeLogged:  node.timeLogged  != null ? String(node.timeLogged) : '',
    })
  }, [node.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Keyboard: Esc to close ───────────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  // Focus title input when editing starts
  useEffect(() => { if (editingTitle) titleRef.current?.focus() }, [editingTitle])
  useEffect(() => { if (editingDesc) descRef.current?.focus() }, [editingDesc])

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function saveField(field, value) {
    const sp = field === 'storyPoints' ? (value === '' ? null : Number(value)) : undefined
    const te = field === 'timeEstimate' ? (value === '' ? null : Number(value)) : undefined
    const tl = field === 'timeLogged'   ? (value === '' ? null : Number(value)) : undefined
    const meta = {
      [field]: sp !== undefined ? (isNaN(sp) ? null : sp) :
               te !== undefined ? (isNaN(te) ? null : te) :
               tl !== undefined ? (isNaN(tl) ? null : tl) :
               (value === '' ? null : value),
    }
    onSave?.(node.id, meta)
    setForm(f => ({ ...f, [field]: value }))
  }

  function saveTitle() {
    const t = titleVal.trim()
    if (t && t !== node.title) onSave?.(node.id, { title: t })
    else setTitleVal(node.title || '')
    setEditingTitle(false)
  }

  function saveDesc() {
    onSave?.(node.id, { notes: descVal })
    setEditingDesc(false)
  }

  function addComment() {
    const t = commentText.trim()
    if (!t) return
    onAddComment?.(node.id, t, currentUser)
    setCommentText('')
  }

  function addWorkLog() {
    const hrs = parseFloat(workLogHours)
    if (isNaN(hrs) || hrs <= 0) return
    const newLogged = (node.timeLogged || 0) + hrs
    onSave?.(node.id, {
      timeLogged: newLogged,
      workLog: [...(node.workLog || []), { id: crypto.randomUUID(), hours: hrs, note: workLogText.trim(), author: currentUser, createdAt: new Date().toISOString() }],
    })
    setWorkLogHours('')
    setWorkLogText('')
  }

  function addTag() {
    const t = tagInput.trim()
    if (!t || tags.includes(t)) return
    const updated = [...tags, t]
    setTags(updated)
    onSave?.(node.id, { tags: updated })
    setTagInput('')
  }

  function removeTag(tag) {
    const updated = tags.filter(t => t !== tag)
    setTags(updated)
    onSave?.(node.id, { tags: updated })
  }

  // ─── Derived data ─────────────────────────────────────────────────────────
  const parentNode      = node.parentId ? nodes[node.parentId] : null
  const childNodes      = (node.childIds || []).map(id => nodes[id]).filter(Boolean)
  const comments        = node.comments || []
  const auditTrail      = node.auditTrail || []
  const workLog         = node.workLog || []
  const statusBadge     = getStatusBadge(form.status)
  const allStatusOpts   = [...STATUS_OPTS, ...customStatuses.map(s => ({ value: s.value, label: s.label, color: '#42526E', bg: '#F4F5F7' }))]

  const activityItems = activityTab === 'all'
    ? [...comments.map(c => ({ ...c, _type: 'comment' })), ...auditTrail.map(a => ({ ...a, _type: 'audit' }))].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    : activityTab === 'comments' ? comments
    : activityTab === 'history'  ? auditTrail
    : workLog

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(9,30,66,0.54)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 8, width: 880, maxWidth: '96vw', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 64px rgba(9,30,66,0.32)',
        overflow: 'hidden',
      }}>

        {/* ── Dialog header ───────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
          {/* Breadcrumb + node key */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: subtle, minWidth: 0 }}>
            <span style={{ fontSize: 14 }}>{getIssueIcon(form.issueType)}</span>
            {parentNode && (
              <>
                <button
                  onClick={() => onOpenDetail?.(parentNode.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: blue, fontWeight: 500, fontSize: 12, padding: 0 }}
                >
                  {parentNode.title}
                </button>
                <span>/</span>
              </>
            )}
            {/* Node key badge — prominent, monospace, blue pill */}
            {(node.nodeKey || form.jiraKey) && (
              <span
                title="Node ID — click to copy"
                onClick={() => { try { navigator.clipboard.writeText(node.nodeKey || form.jiraKey) } catch {} }}
                style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: '#2563EB', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 4, padding: '2px 7px', cursor: 'pointer', letterSpacing: '0.04em', flexShrink: 0 }}
              >
                {node.nodeKey || form.jiraKey}
              </span>
            )}
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            {comments.length > 0 && (
              <span style={{ fontSize: 11, color: subtle, background: '#F4F5F7', borderRadius: 4, padding: '2px 7px' }}>
                {`💬 ${comments.length}`}
              </span>
            )}
            <button
              onClick={() => setShowCRMModal(true)}
              title="Track this node as a CRM deal"
              style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 6, cursor: 'pointer', padding: '6px 16px', fontSize: 12, fontWeight: 600, color: '#1D4ED8', lineHeight: 1, letterSpacing: '0.01em' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#DBEAFE' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#EFF6FF' }}
            >
              + Add to CRM
            </button>
            <ActionBtn title="Close (Esc)" onClick={onClose}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </ActionBtn>
          </div>
        </div>

        {/* ── Body: left + right panels ────────────────────────────────────── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
          <div style={{ flex: '1 1 0', overflowY: 'auto', padding: '24px 24px 32px', borderRight: `1px solid ${border}` }}>

            {/* Title */}
            <div style={{ marginBottom: 4 }}>
              {editingTitle ? (
                <textarea
                  ref={titleRef}
                  value={titleVal}
                  onChange={e => setTitleVal(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveTitle() } if (e.key === 'Escape') { setTitleVal(node.title || ''); setEditingTitle(false) } }}
                  style={{
                    width: '100%', resize: 'none', border: `1.5px solid ${blue}`, borderRadius: 4,
                    padding: '6px 8px', fontSize: 20, fontWeight: 700, color: navy,
                    lineHeight: 1.3, outline: 'none', boxSizing: 'border-box', background: '#fff',
                    fontFamily: 'inherit',
                  }}
                  rows={2}
                />
              ) : (
                <h1
                  onClick={() => canEdit && setEditingTitle(true)}
                  style={{
                    fontSize: 20, fontWeight: 700, color: navy, lineHeight: 1.35, margin: 0,
                    cursor: canEdit ? 'text' : 'default',
                    borderRadius: 4, padding: '4px 6px', marginLeft: -6,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (canEdit) e.currentTarget.style.background = '#F4F5F7' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  {titleVal || '(untitled)'}
                </h1>
              )}
            </div>

            {/* Action row */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {canEdit && (
                <SmallBtn onClick={() => onAddChild?.(node.id)} icon="+">Add child</SmallBtn>
              )}
              {node.url && (
                <a href={node.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: blue, textDecoration: 'none' }}>
                  🔗 Open link
                </a>
              )}
            </div>

            {/* Description */}
            <SectionTitle>Description</SectionTitle>
            <div style={{ marginBottom: 24 }}>
              {editingDesc ? (
                <div>
                  <textarea
                    ref={descRef}
                    value={descVal}
                    onChange={e => setDescVal(e.target.value)}
                    placeholder="Add a description..."
                    style={{
                      width: '100%', minHeight: 100, resize: 'vertical', border: `1.5px solid ${blue}`,
                      borderRadius: 4, padding: '8px 10px', fontSize: 13, color: navy, lineHeight: 1.6,
                      outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <button onClick={saveDesc} style={saveBtnStyle}>Save</button>
                    <button onClick={() => { setDescVal(node.notes || ''); setEditingDesc(false) }} style={cancelBtnStyle}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => canEdit && setEditingDesc(true)}
                  style={{
                    fontSize: 13, color: descVal ? navy : '#97A0AF', lineHeight: 1.7,
                    cursor: canEdit ? 'text' : 'default',
                    padding: '8px 10px', borderRadius: 4, minHeight: 48,
                    background: '#FAFBFC', border: `1px solid ${border}`,
                    whiteSpace: 'pre-wrap',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (canEdit) e.currentTarget.style.borderColor = '#B3BAC5' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = border }}
                >
                  {descVal || 'Add a description...'}
                </div>
              )}
            </div>

            {/* Child Issues (Subtasks) */}
            {(childNodes.length > 0 || canEdit) && (
              <div style={{ marginBottom: 24 }}>
                <SectionTitle>Child Issues ({childNodes.length})</SectionTitle>
                {childNodes.length > 0 && (
                  <div style={{ border: `1px solid ${border}`, borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
                    {childNodes.map((child, i) => {
                      const sb = getStatusBadge(child.status)
                      return (
                        <div
                          key={child.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                            borderTop: i > 0 ? `1px solid ${border}` : 'none',
                            background: '#fff', cursor: 'pointer', transition: 'background 0.1s',
                          }}
                          onClick={() => onOpenDetail?.(child.id)}
                          onMouseEnter={e => { e.currentTarget.style.background = '#F4F5F7' }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
                        >
                          <span style={{ fontSize: 12 }}>{getIssueIcon(child.issueType)}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, background: sb.bg, color: sb.color, borderRadius: 3, padding: '2px 6px', whiteSpace: 'nowrap' }}>
                            {child.status ? STATUS_OPTS.find(s => s.value === child.status)?.label || child.status : 'To Do'}
                          </span>
                          <span style={{ fontSize: 13, color: navy, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{child.title}</span>
                          {child.assignee && <span style={{ fontSize: 11, color: subtle }}>{child.assignee}</span>}
                          {child.priority && <span style={{ fontSize: 12 }}>{getPriorityIcon(child.priority)}</span>}
                        </div>
                      )
                    })}
                  </div>
                )}
                {canEdit && (
                  <button
                    onClick={() => onAddChild?.(node.id)}
                    style={{ fontSize: 12, color: blue, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontWeight: 500 }}
                  >
                    + Create child issue
                  </button>
                )}
              </div>
            )}

            {/* Activity */}
            <div>
              <SectionTitle>Activity</SectionTitle>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 2, marginBottom: 14, borderBottom: `1px solid ${border}`, paddingBottom: 0 }}>
                {['all', 'comments', 'history', 'worklog'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActivityTab(tab)}
                    style={{
                      fontSize: 12, fontWeight: 600, padding: '6px 12px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: activityTab === tab ? blue : subtle,
                      borderBottom: `2px solid ${activityTab === tab ? blue : 'transparent'}`,
                      textTransform: 'capitalize',
                    }}
                  >{tab === 'worklog' ? 'Work Log' : tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
                ))}
              </div>

              {/* Comment input (only on All/Comments) */}
              {(activityTab === 'all' || activityTab === 'comments') && canEdit && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'flex-start' }}>
                  <Avatar name={currentUser} size={28} />
                  <div style={{ flex: 1 }}>
                    <textarea
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addComment() }}
                      placeholder="Add a comment..."
                      style={{
                        width: '100%', resize: 'vertical', border: `1.5px solid ${border}`,
                        borderRadius: 6, padding: '8px 10px', fontSize: 13, color: navy,
                        lineHeight: 1.6, outline: 'none', boxSizing: 'border-box',
                        fontFamily: 'inherit', background: '#FAFBFC', minHeight: 64,
                        transition: 'border-color 0.15s',
                      }}
                      onFocus={e => { e.target.style.borderColor = blue; e.target.style.background = '#fff' }}
                      onBlur={e => { e.target.style.borderColor = border; e.target.style.background = '#FAFBFC' }}
                    />
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
                      <button onClick={addComment} disabled={!commentText.trim()} style={{ ...saveBtnStyle, opacity: commentText.trim() ? 1 : 0.5 }}>Save</button>
                      <button onClick={() => setCommentText('')} style={cancelBtnStyle}>Cancel</button>
                      <span style={{ fontSize: 11, color: '#97A0AF', marginLeft: 'auto' }}>⌘↵ to save</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Work log input */}
              {activityTab === 'worklog' && canEdit && (
                <div style={{ background: '#FAFBFC', border: `1px solid ${border}`, borderRadius: 6, padding: '12px', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: navy, marginBottom: 8 }}>Log work</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: '0 0 100px' }}>
                      <label style={{ fontSize: 11, color: subtle, display: 'block', marginBottom: 3 }}>Hours spent</label>
                      <input
                        type="number" min="0.1" step="0.5"
                        value={workLogHours}
                        onChange={e => setWorkLogHours(e.target.value)}
                        placeholder="0.5"
                        style={{ ...inputStyle, width: '100%' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, color: subtle, display: 'block', marginBottom: 3 }}>Description (optional)</label>
                      <input
                        value={workLogText}
                        onChange={e => setWorkLogText(e.target.value)}
                        placeholder="What did you work on?"
                        style={{ ...inputStyle, width: '100%' }}
                      />
                    </div>
                  </div>
                  <button onClick={addWorkLog} disabled={!workLogHours} style={{ ...saveBtnStyle, opacity: workLogHours ? 1 : 0.5 }}>Log work</button>
                </div>
              )}

              {/* Activity items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activityItems.length === 0 && (
                  <p style={{ fontSize: 12, color: '#97A0AF', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
                    {activityTab === 'comments' ? 'No comments yet' : activityTab === 'history' ? 'No history recorded' : activityTab === 'worklog' ? 'No work logged' : 'No activity yet'}
                  </p>
                )}
                {activityItems.map((item, i) => {
                  const type = item._type || (item.text !== undefined ? 'comment' : 'audit')
                  if (type === 'comment') {
                    return (
                      <div key={item.id || i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <Avatar name={item.author || 'A'} size={28} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: navy }}>{item.author || 'Anonymous'}</span>
                            <span style={{ fontSize: 11, color: '#97A0AF' }}>{timeAgo(item.createdAt)}</span>
                          </div>
                          <div style={{ fontSize: 13, color: navy, lineHeight: 1.6, background: '#F4F5F7', borderRadius: 6, padding: '8px 12px', whiteSpace: 'pre-wrap' }}>
                            {item.text}
                          </div>
                          {canEdit && item.author === currentUser && (
                            <button
                              onClick={() => onDeleteComment?.(node.id, item.id)}
                              style={{ fontSize: 11, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: '3px 0', marginTop: 2 }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  }
                  if (type === 'audit') {
                    return (
                      <div key={item.id || i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', opacity: 0.85 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#F4F5F7', border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
                          ✏️
                        </div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 12, color: navy }}>
                            <strong>{item.user || 'Someone'}</strong> changed <strong>{item.field}</strong>
                            {item.oldValue && <span style={{ color: subtle }}> from "{item.oldValue}"</span>}
                            {item.newValue && <span style={{ color: blue }}> to "{item.newValue}"</span>}
                          </span>
                          <span style={{ fontSize: 11, color: '#97A0AF', marginLeft: 8 }}>{timeAgo(item.timestamp)}</span>
                        </div>
                      </div>
                    )
                  }
                  // Work log entry
                  return (
                    <div key={item.id || i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <Avatar name={item.author || 'A'} size={28} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: navy }}>{item.author}</span>
                          <span style={{ fontSize: 11, background: '#E3FCEF', color: '#006644', borderRadius: 3, padding: '1px 6px', fontWeight: 600 }}>
                            {item.hours}h logged
                          </span>
                          <span style={{ fontSize: 11, color: '#97A0AF' }}>{timeAgo(item.createdAt)}</span>
                        </div>
                        {item.note && <div style={{ fontSize: 13, color: subtle }}>{item.note}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL ────────────────────────────────────────────────── */}
          <div style={{ width: 300, flexShrink: 0, overflowY: 'auto', padding: '20px 20px 32px', background: bg }}>

            {/* Status button */}
            <div style={{ marginBottom: 16 }}>
              <select
                value={form.status}
                onChange={e => saveField('status', e.target.value)}
                disabled={!canEdit}
                style={{
                  fontSize: 12, fontWeight: 700, padding: '6px 10px', borderRadius: 4,
                  border: 'none', cursor: canEdit ? 'pointer' : 'not-allowed',
                  background: statusBadge.bg, color: statusBadge.color,
                  width: '100%', letterSpacing: '0.04em', textTransform: 'uppercase',
                  outline: 'none', appearance: 'auto',
                }}
              >
                {allStatusOpts.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Details section */}
            <div style={{ background: '#fff', border: `1px solid ${border}`, borderRadius: 6, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: navy, marginBottom: 2 }}>Details</div>

              <DetailRow label="Node ID">
                {node.nodeKey ? (
                  <span
                    title="Click to copy"
                    onClick={() => { try { navigator.clipboard.writeText(node.nodeKey) } catch {} }}
                    style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: '#2563EB', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 4, padding: '2px 7px', cursor: 'pointer', letterSpacing: '0.04em' }}
                  >
                    {node.nodeKey}
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: '#97A0AF' }}>Not assigned</span>
                )}
              </DetailRow>

              <DetailRow label="Assignee">
                {canEdit ? (
                  <input
                    value={form.assignee}
                    onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))}
                    onBlur={() => saveField('assignee', form.assignee)}
                    placeholder="Unassigned"
                    style={{ ...inputStyle, width: '100%' }}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {form.assignee ? <><Avatar name={form.assignee} size={20} /><span style={{ fontSize: 12, color: navy }}>{form.assignee}</span></> : <span style={{ fontSize: 12, color: '#97A0AF' }}>Unassigned</span>}
                  </div>
                )}
              </DetailRow>

              <DetailRow label="Priority">
                <InlineSelect
                  value={form.priority}
                  options={PRIORITY_OPTS}
                  onChange={v => saveField('priority', v)}
                  disabled={!canEdit}
                />
              </DetailRow>

              <DetailRow label="Parent">
                {parentNode ? (
                  <button onClick={() => onOpenDetail?.(parentNode.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: blue, fontSize: 12, fontWeight: 500, padding: 0, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                    {parentNode.title}
                  </button>
                ) : <span style={{ fontSize: 12, color: '#97A0AF' }}>None</span>}
              </DetailRow>

              <DetailRow label="Due date">
                {canEdit ? (
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={e => saveField('dueDate', e.target.value)}
                    style={{ ...inputStyle, width: '100%', colorScheme: 'light' }}
                  />
                ) : (
                  <span style={{ fontSize: 12, color: form.dueDate ? (new Date(form.dueDate) < new Date() && form.status !== 'done' ? '#EF4444' : navy) : '#97A0AF' }}>
                    {form.dueDate ? formatDate(form.dueDate) : 'None'}
                  </span>
                )}
              </DetailRow>

              <DetailRow label="Labels">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                  {tags.map(tag => (
                    <span key={tag} style={{ fontSize: 11, background: '#DEEBFF', color: blue, borderRadius: 3, padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 3 }}>
                      {tag}
                      {canEdit && <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: blue, fontSize: 11, padding: 0, lineHeight: 1 }}>×</button>}
                    </span>
                  ))}
                  {canEdit && (
                    <input
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }}
                      placeholder={tags.length === 0 ? 'Add label' : '+'}
                      style={{ ...inputStyle, width: tags.length === 0 ? 80 : 36, padding: '2px 4px', fontSize: 11 }}
                    />
                  )}
                </div>
              </DetailRow>

              <DetailRow label="Sprint">
                {canEdit ? (
                  <input
                    value={form.sprint}
                    onChange={e => setForm(f => ({ ...f, sprint: e.target.value }))}
                    onBlur={() => saveField('sprint', form.sprint)}
                    placeholder="None"
                    style={{ ...inputStyle, width: '100%' }}
                  />
                ) : <span style={{ fontSize: 12, color: form.sprint ? navy : '#97A0AF' }}>{form.sprint || 'None'}</span>}
              </DetailRow>

              <DetailRow label="Story Points">
                {canEdit ? (
                  <input
                    type="number" min="0"
                    value={form.storyPoints}
                    onChange={e => setForm(f => ({ ...f, storyPoints: e.target.value }))}
                    onBlur={() => saveField('storyPoints', form.storyPoints)}
                    placeholder="—"
                    style={{ ...inputStyle, width: 60 }}
                  />
                ) : <span style={{ fontSize: 12, color: form.storyPoints ? navy : '#97A0AF' }}>{form.storyPoints || '—'}</span>}
              </DetailRow>

              <DetailRow label="Issue Type">
                <InlineSelect
                  value={form.issueType}
                  options={ISSUE_TYPE_OPTS}
                  onChange={v => saveField('issueType', v)}
                  disabled={!canEdit}
                />
              </DetailRow>

              <DetailRow label="Jira Key">
                {canEdit ? (
                  <input
                    value={form.jiraKey}
                    onChange={e => setForm(f => ({ ...f, jiraKey: e.target.value }))}
                    onBlur={() => saveField('jiraKey', form.jiraKey)}
                    placeholder="e.g. KAN-1"
                    style={{ ...inputStyle, width: '100%' }}
                  />
                ) : <span style={{ fontSize: 12, color: form.jiraKey ? blue : '#97A0AF' }}>{form.jiraKey || 'None'}</span>}
              </DetailRow>

              <DetailRow label="URL">
                {canEdit ? (
                  <input
                    value={form.url}
                    onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                    onBlur={() => saveField('url', form.url)}
                    placeholder="https://..."
                    style={{ ...inputStyle, width: '100%' }}
                  />
                ) : form.url ? <a href={form.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: blue }}>Open link</a> : <span style={{ fontSize: 12, color: '#97A0AF' }}>None</span>}
              </DetailRow>

              {/* Time tracking */}
              <DetailRow label="Reporter">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Avatar name={currentUser} size={20} />
                  <span style={{ fontSize: 12, color: navy }}>{currentUser}</span>
                </div>
              </DetailRow>

              {/* Time tracking section */}
              <div style={{ borderTop: `1px solid ${border}`, paddingTop: 10, marginTop: 2 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: subtle, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Time Tracking</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, color: subtle, display: 'block', marginBottom: 2 }}>Estimated (h)</label>
                    {canEdit ? (
                      <input
                        type="number" min="0"
                        value={form.timeEstimate}
                        onChange={e => setForm(f => ({ ...f, timeEstimate: e.target.value }))}
                        onBlur={() => saveField('timeEstimate', form.timeEstimate)}
                        placeholder="0"
                        style={{ ...inputStyle, width: '100%' }}
                      />
                    ) : <span style={{ fontSize: 12 }}>{form.timeEstimate || '—'}</span>}
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: subtle, display: 'block', marginBottom: 2 }}>Logged (h)</label>
                    <span style={{ fontSize: 12, color: form.timeLogged ? navy : '#97A0AF' }}>{node.timeLogged || '—'}</span>
                  </div>
                </div>
                {/* Progress bar */}
                {(form.timeEstimate && node.timeLogged) && (() => {
                  const pct = Math.min(100, Math.round((node.timeLogged / Number(form.timeEstimate)) * 100))
                  return (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ height: 4, borderRadius: 2, background: border, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? '#EF4444' : blue, transition: 'width 0.3s' }} />
                      </div>
                      <div style={{ fontSize: 10, color: subtle, marginTop: 2 }}>{pct}% of estimate used</div>
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Created date */}
            {node.createdAt && (
              <div style={{ fontSize: 11, color: '#97A0AF', marginTop: 12, textAlign: 'center' }}>
                Created {formatDate(node.createdAt)}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCRMModal && (
        <React.Suspense fallback={null}>
          <InlineCRMModal
            nodeId={node.id}
            nodeKey={node.nodeKey || ''}
            companyName={node.title || ''}
            projectId={projectId}
            onClose={() => setShowCRMModal(false)}
          />
        </React.Suspense>
      )}
    </div>
  )
}

// ── Micro-components ──────────────────────────────────────────────────────────
function ActionBtn({ onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 28, height: 28, borderRadius: 4, border: '1px solid #E5E7EB',
        background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: subtle,
        transition: 'background 0.1s, color 0.1s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = '#F4F5F7'; e.currentTarget.style.color = navy }}
      onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = subtle }}
    >
      {children}
    </button>
  )
}

function SmallBtn({ onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500,
        color: subtle, background: '#F4F5F7', border: `1px solid ${border}`,
        borderRadius: 4, padding: '4px 10px', cursor: 'pointer',
        transition: 'background 0.1s, border-color 0.1s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = '#E5E7EB'; e.currentTarget.style.borderColor = '#B3BAC5' }}
      onMouseLeave={e => { e.currentTarget.style.background = '#F4F5F7'; e.currentTarget.style.borderColor = border }}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  )
}

function SectionTitle({ children, style: extraStyle }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, color: navy, marginBottom: 8, letterSpacing: '0.01em', ...extraStyle }}>
      {children}
    </div>
  )
}

// ── Shared input styles ───────────────────────────────────────────────────────
const inputStyle = {
  fontSize: 12, border: `1px solid ${border}`, borderRadius: 4,
  padding: '4px 7px', outline: 'none', color: navy, background: '#fff',
  transition: 'border-color 0.15s',
}

const saveBtnStyle = {
  fontSize: 12, fontWeight: 600, background: blue, color: '#fff',
  border: 'none', borderRadius: 4, padding: '5px 12px', cursor: 'pointer',
}

const cancelBtnStyle = {
  fontSize: 12, fontWeight: 500, background: 'none', color: subtle,
  border: `1px solid ${border}`, borderRadius: 4, padding: '4px 10px', cursor: 'pointer',
}
