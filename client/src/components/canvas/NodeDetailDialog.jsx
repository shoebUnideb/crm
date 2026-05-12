import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsApi } from '../../lib/projectsApi.js'

// Lazy-loaded: prevents CRM code from entering the Canvas JS chunk
const InlineCRMModal = React.lazy(() => import('../crm/InlineCRMModal.jsx'))
const EntityDocLinks = React.lazy(() => import('../docs/EntityDocLinks.jsx'))

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
  onEditComment,
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
  const [showCRMModal, setShowCRMModal]   = useState(false)
  const [actionsOpen, setActionsOpen]     = useState(false)
  const actionsRef                        = useRef(null)

  // Comment actions
  const [commentMenuId, setCommentMenuId]         = useState(null)
  const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState(null)
  const [editingCommentId, setEditingCommentId]   = useState(null)
  const [editingCommentText, setEditingCommentText] = useState('')
  const [replyingToId, setReplyingToId]           = useState(null)
  const [replyText, setReplyText]                 = useState('')
  const [replyMenuId, setReplyMenuId]             = useState(null) // "commentId:replyId"
  const [editingReplyId, setEditingReplyId]       = useState(null) // "commentId:replyId"
  const [editingReplyText, setEditingReplyText]   = useState('')
  const [confirmDeleteReplyId, setConfirmDeleteReplyId] = useState(null) // { commentId, replyId }
  const replyMenuRef = useRef(null)
  const commentMenuRef                            = useRef(null)

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
  })
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags]         = useState(node.tags || [])

  // Attachments
  const [attachments, setAttachments] = useState(node.attachments || [])
  const [dragOver, setDragOver]       = useState(false)
  const [pendingFiles, setPendingFiles] = useState([])
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [attachError, setAttachError]  = useState(null)
  const fileInputRef                  = useRef(null)

  // Assignee picker
  const [members, setMembers]             = useState([])
  const [assigneeOpen, setAssigneeOpen]   = useState(false)
  const [pendingAssignee, setPendingAssignee] = useState(null) // { email, action: 'add'|'remove' }
  const assigneeRef                       = useRef(null)
  const assignees = Array.isArray(node.assignees) ? node.assignees
    : (node.assignee && node.assignee !== '') ? [node.assignee] : []

  // ─── Sync node prop changes ───────────────────────────────────────────────
  useEffect(() => {
    setTitleVal(node.title || '')
    setDescVal(node.notes || '')
    setTags(node.tags || [])
    setAttachments(node.attachments || [])
    setPendingFiles([])
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
    })
  }, [node.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Keyboard: Esc to close ───────────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      // Cancel active edits before closing the dialog
      if (editingCommentId) { setEditingCommentId(null); return }
      if (editingReplyId)   { setEditingReplyId(null);   return }
      if (replyingToId)     { setReplyingToId(null); setReplyText(''); return }
      if (editingTitle)     { setEditingTitle(false); return }
      if (editingDesc)      { setEditingDesc(false); return }
      onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose, editingCommentId, editingReplyId, replyingToId, editingTitle, editingDesc])

  // Focus title input when editing starts
  useEffect(() => { if (editingTitle) titleRef.current?.focus() }, [editingTitle])
  useEffect(() => { if (editingDesc) descRef.current?.focus() }, [editingDesc])

  // Fetch project members for assignee picker
  useEffect(() => {
    if (!projectId) return
    const token = localStorage.getItem('chart-to-jira-token')
    if (!token) return
    projectsApi.getMembers(token, projectId)
      .then(data => setMembers(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [projectId])

  // Close assignee dropdown on outside click
  useEffect(() => {
    if (!assigneeOpen) return
    function handler(e) {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target)) setAssigneeOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [assigneeOpen])

  // Close actions menu on outside click
  useEffect(() => {
    if (!actionsOpen) return
    function handler(e) {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) setActionsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [actionsOpen])

  // Close comment menu on outside click
  useEffect(() => {
    if (!commentMenuId) return
    function handler(e) {
      if (commentMenuRef.current && !commentMenuRef.current.contains(e.target)) setCommentMenuId(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [commentMenuId])

  // Close reply menu on outside click
  useEffect(() => {
    if (!replyMenuId) return
    function handler(e) {
      if (replyMenuRef.current && !replyMenuRef.current.contains(e.target)) setReplyMenuId(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [replyMenuId])

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function saveField(field, value) {
    const sp = field === 'storyPoints' ? (value === '' ? null : Number(value)) : undefined
    const te = field === 'timeEstimate' ? (value === '' ? null : Number(value)) : undefined
    const meta = {
      [field]: sp !== undefined ? (isNaN(sp) ? null : sp) :
               te !== undefined ? (isNaN(te) ? null : te) :
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

  function addReply(commentId) {
    const t = replyText.trim()
    if (!t) return
    const reply = {
      id: (crypto.randomUUID?.() || Date.now().toString()),
      text: t, author: currentUser, createdAt: new Date().toISOString(),
    }
    const updatedComments = (node.comments || []).map(c =>
      c.id === commentId ? { ...c, replies: [...(c.replies || []), reply] } : c
    )
    onSave?.(node.id, { comments: updatedComments })
    setReplyingToId(null)
    setReplyText('')
  }

  function saveEditReply(commentId, replyId, newText) {
    const t = newText.trim()
    if (!t) return
    const updatedComments = (node.comments || []).map(c =>
      c.id === commentId
        ? { ...c, replies: (c.replies || []).map(r => r.id === replyId ? { ...r, text: t, editedAt: new Date().toISOString() } : r) }
        : c
    )
    onSave?.(node.id, { comments: updatedComments })
    setEditingReplyId(null)
    setEditingReplyText('')
  }

  function deleteReply(commentId, replyId) {
    const updatedComments = (node.comments || []).map(c =>
      c.id === commentId
        ? { ...c, replies: (c.replies || []).filter(r => r.id !== replyId) }
        : c
    )
    onSave?.(node.id, { comments: updatedComments })
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

  function toggleAssignee(email) {
    const current = Array.isArray(node.assignees) ? node.assignees
      : (node.assignee && node.assignee !== '') ? [node.assignee] : []
    const action = current.includes(email) ? 'remove' : 'add'
    setPendingAssignee({ email, action })
    setAssigneeOpen(false)
  }

  function confirmAssignee() {
    if (!pendingAssignee) return
    const current = Array.isArray(node.assignees) ? node.assignees
      : (node.assignee && node.assignee !== '') ? [node.assignee] : []
    const updated = pendingAssignee.action === 'remove'
      ? current.filter(e => e !== pendingAssignee.email)
      : [...current, pendingAssignee.email]
    onSave?.(node.id, { assignees: updated, assignee: updated[0] || null })
    setPendingAssignee(null)
  }

  function handleAttachFiles(files) {
    const MAX = 1 * 1024 * 1024 // 1 MB per file
    const readers = []
    Array.from(files).forEach(file => {
      if (file.size > MAX) { setAttachError(`"${file.name}" is too large. Max file size is 1 MB.`); return }
      const reader = new FileReader()
      readers.push(new Promise(resolve => {
        reader.onload = e => resolve({
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          data: e.target.result,
          addedAt: new Date().toISOString(),
          addedBy: currentUser,
        })
        reader.readAsDataURL(file)
      }))
    })
    Promise.all(readers).then(results => {
      if (results.length > 0) setPendingFiles(prev => [...prev, ...results])
    })
  }

  function confirmAttachments() {
    if (pendingFiles.length === 0) return
    setAttachments(prev => {
      const updated = [...prev, ...pendingFiles]
      onSave?.(node.id, { attachments: updated })
      return updated
    })
    setPendingFiles([])
  }

  function removePending(id) {
    setPendingFiles(prev => prev.filter(f => f.id !== id))
  }

  function removeAttachment(id) {
    setConfirmDeleteId(id)
  }

  function confirmRemoveAttachment() {
    setAttachments(prev => {
      const updated = prev.filter(a => a.id !== confirmDeleteId)
      onSave?.(node.id, { attachments: updated })
      return updated
    })
    setConfirmDeleteId(null)
  }

  // ─── Derived data ─────────────────────────────────────────────────────────
  const parentNode      = node.parentId ? nodes[node.parentId] : null
  const childNodes      = (node.childIds || []).map(id => nodes[id]).filter(Boolean)
  const comments        = node.comments || []
  const auditTrail      = node.auditTrail || []
  const statusBadge     = getStatusBadge(form.status)
  const allStatusOpts   = [...STATUS_OPTS, ...customStatuses.map(s => ({ value: s.value, label: s.label, color: '#42526E', bg: '#F4F5F7' }))]

  const activityItems = activityTab === 'all'
    ? [...comments.map(c => ({ ...c, _type: 'comment' })), ...auditTrail.map(a => ({ ...a, _type: 'audit' }))].sort((a, b) => new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp))
    : activityTab === 'comments' ? comments
    : auditTrail

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(9,30,66,0.54)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 8, width: 1320, maxWidth: '96vw', maxHeight: '78vh',
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

            {/* Three-dots actions menu */}
            <div ref={actionsRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setActionsOpen(v => !v)}
                title="More actions"
                style={{
                  width: 32, height: 32, borderRadius: 6, border: `1px solid ${actionsOpen ? blue : border}`,
                  background: actionsOpen ? '#EFF6FF' : '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: actionsOpen ? blue : subtle, transition: 'all 0.12s',
                }}
                onMouseEnter={e => { if (!actionsOpen) { e.currentTarget.style.background = '#F4F5F7'; e.currentTarget.style.borderColor = '#B3BAC5' } }}
                onMouseLeave={e => { if (!actionsOpen) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = border } }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
                </svg>
              </button>

              {actionsOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                  background: '#fff', border: `1px solid ${border}`, borderRadius: 8,
                  boxShadow: '0 8px 24px rgba(9,30,66,0.18)', zIndex: 200, minWidth: 200,
                  overflow: 'hidden',
                }}>
                  <div style={{ padding: '6px 0' }}>
                    <button
                      onClick={() => { setShowCRMModal(true); setActionsOpen(false) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                        padding: '9px 14px', background: 'none', border: 'none',
                        cursor: 'pointer', textAlign: 'left',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: '#E3FCEF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#006644" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                          <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: navy }}>Add to CRM</div>
                        <div style={{ fontSize: 11, color: subtle }}>Track as a deal or contact</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setActivityTab('docs'); setActionsOpen(false) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                        padding: '9px 14px', background: 'none', border: 'none',
                        cursor: 'pointer', textAlign: 'left',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: navy }}>Link to Doc page</div>
                        <div style={{ fontSize: 11, color: subtle }}>Connect a Wiki page to this ticket</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

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

            {/* Quick attach below description */}
            {canEdit && (
              <div style={{ marginTop: -16, marginBottom: 24 }}>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleAttachFiles(e.dataTransfer.files) }}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: 12, color: dragOver ? blue : subtle,
                    cursor: 'pointer', padding: '4px 8px', borderRadius: 4,
                    border: `1px dashed ${dragOver ? blue : 'transparent'}`,
                    background: dragOver ? '#EFF3FF' : 'none',
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = blue; e.currentTarget.style.background = '#F0F4FF'; e.currentTarget.style.borderColor = border }}
                  onMouseLeave={e => { if (!dragOver) { e.currentTarget.style.color = subtle; e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'transparent' } }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                  </svg>
                  Attach a file
                </div>
              </div>
            )}

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
                          {(child.assignees?.length > 0 || child.assignee) && (
                            <div style={{ display: 'flex', gap: 2 }}>
                              {(child.assignees?.length > 0 ? child.assignees : [child.assignee]).map(a => (
                                <Avatar key={a} name={a} size={16} />
                              ))}
                            </div>
                          )}
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
                {['all', 'comments', 'history', 'docs', 'attachments'].map(tab => (
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
                  >{tab === 'docs' ? 'Docs' : tab === 'attachments' ? `Attachments${attachments.length ? ` (${attachments.length})` : ''}` : tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
                ))}
              </div>

              {/* Docs tab — linked doc pages */}
              {activityTab === 'docs' && (
                <React.Suspense fallback={<div style={{ fontSize: 12, color: '#97A0AF' }}>Loading…</div>}>
                  <EntityDocLinks
                    sourceType="node"
                    sourceId={node.nodeKey || node.id}
                    projectId={projectId}
                    canEdit={canEdit}
                    onNavigate={(spaceSlug, pageId) => navigate(`/app/docs/${spaceSlug}/${pageId}`)}
                  />
                </React.Suspense>
              )}

              {/* Attachments tab */}
              {activityTab === 'attachments' && (
                <div>
                  {/* Pending preview — staged files awaiting confirmation */}
                  {pendingFiles.length > 0 && (
                    <div style={{ border: `1px solid #B3D4FF`, borderRadius: 8, background: '#EFF6FF', padding: '12px', marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: blue, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Preview — {pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''} ready to attach
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                        {pendingFiles.map(f => {
                          const isImage = f.type?.startsWith('image/')
                          const sizeKB = (f.size / 1024).toFixed(0)
                          return (
                            <div key={f.id} style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '8px 10px', borderRadius: 6,
                              border: `1px solid #B3D4FF`, background: '#fff',
                            }}>
                              <div style={{
                                width: isImage ? 56 : 36,
                                height: isImage ? 56 : 36,
                                borderRadius: 6, flexShrink: 0, overflow: 'hidden',
                                background: '#DEEBFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.25rem',
                              }}>
                                {isImage
                                  ? <img src={f.data} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  : <FileIcon type={f.type} />
                                }
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                                <div style={{ fontSize: 11, color: subtle }}>{sizeKB} KB · {f.type || 'unknown type'}</div>
                              </div>
                              <button
                                onClick={() => removePending(f.id)}
                                title="Remove"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#97A0AF', padding: 4, borderRadius: 4, display: 'flex', flexShrink: 0 }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#DE350B'; e.currentTarget.style.background = '#FFEBE6' }}
                                onMouseLeave={e => { e.currentTarget.style.color = '#97A0AF'; e.currentTarget.style.background = 'none' }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                              </button>
                            </div>
                          )
                        })}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={confirmAttachments}
                          style={{ ...saveBtnStyle, flex: 1 }}
                        >
                          Attach {pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''}
                        </button>
                        <button
                          onClick={() => setPendingFiles([])}
                          style={{ ...cancelBtnStyle }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Saved attachments list */}
                  {attachments.length === 0 && pendingFiles.length === 0 ? (
                    <p style={{ fontSize: 12, color: '#97A0AF', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>No attachments yet</p>
                  ) : attachments.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {attachments.map(att => {
                        const isImage = att.type?.startsWith('image/')
                        const sizeKB = (att.size / 1024).toFixed(0)
                        return (
                          <div key={att.id} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 10px', borderRadius: 6,
                            border: `1px solid ${border}`, background: '#fff',
                          }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: 6, flexShrink: 0, overflow: 'hidden',
                              background: '#F4F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '1.25rem',
                            }}>
                              {isImage
                                ? <img src={att.data} alt={att.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <FileIcon type={att.type} />
                              }
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <a
                                href={att.data} download={att.name}
                                style={{ fontSize: 13, fontWeight: 600, color: blue, textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                                onMouseLeave={e => e.target.style.textDecoration = 'none'}
                              >{att.name}</a>
                              <div style={{ fontSize: 11, color: subtle }}>{sizeKB} KB · {att.addedBy} · {timeAgo(att.addedAt)}</div>
                            </div>
                            {canEdit && (
                              <button
                                onClick={() => removeAttachment(att.id)}
                                title="Remove"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#97A0AF', padding: 4, borderRadius: 4, display: 'flex', flexShrink: 0 }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#DE350B'; e.currentTarget.style.background = '#FFEBE6' }}
                                onMouseLeave={e => { e.currentTarget.style.color = '#97A0AF'; e.currentTarget.style.background = 'none' }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                                </svg>
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

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

              {/* Activity items */}
              {activityTab !== 'docs' && activityTab !== 'attachments' && <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activityItems.length === 0 && (
                  <p style={{ fontSize: 12, color: '#97A0AF', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
                    {activityTab === 'comments' ? 'No comments yet' : activityTab === 'history' ? 'No history recorded' : 'No activity yet'}
                  </p>
                )}
                {activityItems.map((item, i) => {
                  const type = item._type || (item.text !== undefined ? 'comment' : 'audit')
                  if (type === 'comment') {
                    const isOwn = canEdit && item.author === currentUser
                    const isEditing = editingCommentId === item.id
                    const isMenuOpen = commentMenuId === item.id
                    return (
                      <div key={item.id || i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <Avatar name={item.author || 'A'} size={28} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: navy }}>{item.author || 'Anonymous'}</span>
                            <span style={{ fontSize: 11, color: '#97A0AF' }}>{timeAgo(item.createdAt)}</span>
                            {item.editedAt && <span style={{ fontSize: 10, color: '#97A0AF', fontStyle: 'italic' }}>edited</span>}
                          </div>

                          {isEditing ? (
                            <div>
                              <textarea
                                value={editingCommentText}
                                onChange={e => setEditingCommentText(e.target.value)}
                                autoFocus
                                style={{
                                  width: '100%', resize: 'vertical', border: `1.5px solid ${blue}`,
                                  borderRadius: 6, padding: '8px 10px', fontSize: 13, color: navy,
                                  lineHeight: 1.6, outline: 'none', boxSizing: 'border-box',
                                  fontFamily: 'inherit', background: '#fff', minHeight: 60,
                                }}
                              />
                              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                                <button
                                  onClick={() => {
                                    const t = editingCommentText.trim()
                                    if (t && t !== item.text) onEditComment?.(node.id, item.id, t)
                                    setEditingCommentId(null)
                                  }}
                                  disabled={!editingCommentText.trim()}
                                  style={{ ...saveBtnStyle, opacity: editingCommentText.trim() ? 1 : 0.5 }}
                                >Save</button>
                                <button onClick={() => setEditingCommentId(null)} style={cancelBtnStyle}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ position: 'relative', group: true }}>
                              <div style={{ fontSize: 13, color: navy, lineHeight: 1.6, background: '#F4F5F7', borderRadius: 6, padding: '8px 12px', whiteSpace: 'pre-wrap' }}>
                                {item.text}
                              </div>
                              {isOwn && (
                                <div ref={isMenuOpen ? commentMenuRef : null} style={{ position: 'absolute', top: 6, right: 8 }}>
                                  <button
                                    onClick={() => setCommentMenuId(isMenuOpen ? null : item.id)}
                                    style={{
                                      background: isMenuOpen ? '#E2E8F0' : 'none', border: 'none', cursor: 'pointer',
                                      borderRadius: 4, padding: '2px 5px', color: subtle, display: 'flex', alignItems: 'center',
                                      opacity: isMenuOpen ? 1 : 0.4,
                                      transition: 'opacity 0.1s, background 0.1s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = '#E2E8F0' }}
                                    onMouseLeave={e => { if (!isMenuOpen) { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.background = 'none' } }}
                                  >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                      <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
                                    </svg>
                                  </button>

                                  {isMenuOpen && (
                                    <div style={{
                                      position: 'absolute', top: 'calc(100% + 4px)', right: 0,
                                      background: '#fff', border: `1px solid ${border}`, borderRadius: 8,
                                      boxShadow: '0 6px 20px rgba(9,30,66,0.18)', zIndex: 200, minWidth: 150,
                                      overflow: 'hidden',
                                    }}>
                                      <button
                                        onMouseDown={e => { e.preventDefault(); setEditingCommentId(item.id); setEditingCommentText(item.text); setCommentMenuId(null) }}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                      >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={subtle} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                        </svg>
                                        <span style={{ fontSize: 13, color: navy, fontWeight: 500 }}>Edit</span>
                                      </button>
                                      <div style={{ height: 1, background: border }} />
                                      <button
                                        onMouseDown={e => { e.preventDefault(); setConfirmDeleteCommentId(item.id); setCommentMenuId(null) }}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#FFEBE6'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                      >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#DE350B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                                        </svg>
                                        <span style={{ fontSize: 13, color: '#DE350B', fontWeight: 500 }}>Delete</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Thread replies */}
                          {(item.replies || []).length > 0 && (
                            <div style={{ marginTop: 8, borderLeft: `2px solid ${border}`, paddingLeft: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {(item.replies || []).map((reply, ri) => {
                                const replyKey = `${item.id}:${reply.id}`
                                const isOwnReply = canEdit && reply.author === currentUser
                                const isEditingReply = editingReplyId === replyKey
                                const isReplyMenuOpen = replyMenuId === replyKey
                                return (
                                  <div key={reply.id || ri} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                    <Avatar name={reply.author || 'A'} size={22} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: navy }}>{reply.author}</span>
                                        <span style={{ fontSize: 10, color: '#97A0AF' }}>{timeAgo(reply.createdAt)}</span>
                                        {reply.editedAt && <span style={{ fontSize: 10, color: '#97A0AF', fontStyle: 'italic' }}>edited</span>}
                                      </div>
                                      {isEditingReply ? (
                                        <div>
                                          <textarea
                                            value={editingReplyText}
                                            onChange={e => setEditingReplyText(e.target.value)}
                                            autoFocus
                                            style={{
                                              width: '100%', resize: 'none', border: `1.5px solid ${blue}`,
                                              borderRadius: 6, padding: '6px 10px', fontSize: 12, color: navy,
                                              lineHeight: 1.6, outline: 'none', boxSizing: 'border-box',
                                              fontFamily: 'inherit', background: '#fff', minHeight: 48,
                                            }}
                                          />
                                          <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
                                            <button
                                              onClick={() => saveEditReply(item.id, reply.id, editingReplyText)}
                                              disabled={!editingReplyText.trim()}
                                              style={{ ...saveBtnStyle, fontSize: 12, padding: '5px 12px', opacity: editingReplyText.trim() ? 1 : 0.5 }}
                                            >Save</button>
                                            <button onClick={() => setEditingReplyId(null)} style={{ ...cancelBtnStyle, fontSize: 12, padding: '5px 10px' }}>Cancel</button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div style={{ position: 'relative' }}>
                                          <div style={{ fontSize: 12, color: navy, lineHeight: 1.6, background: '#F4F5F7', borderRadius: 6, padding: '6px 10px', whiteSpace: 'pre-wrap' }}>
                                            {reply.text}
                                          </div>
                                          {isOwnReply && (
                                            <div ref={isReplyMenuOpen ? replyMenuRef : null} style={{ position: 'absolute', top: 5, right: 8 }}>
                                              <button
                                                onClick={() => setReplyMenuId(isReplyMenuOpen ? null : replyKey)}
                                                style={{
                                                  background: isReplyMenuOpen ? '#E2E8F0' : 'none', border: 'none', cursor: 'pointer',
                                                  borderRadius: 4, padding: '2px 5px', color: subtle, display: 'flex', alignItems: 'center',
                                                  opacity: isReplyMenuOpen ? 1 : 0.4, transition: 'opacity 0.1s, background 0.1s',
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = '#E2E8F0' }}
                                                onMouseLeave={e => { if (!isReplyMenuOpen) { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.background = 'none' } }}
                                              >
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                                  <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
                                                </svg>
                                              </button>
                                              {isReplyMenuOpen && (
                                                <div style={{
                                                  position: 'absolute', top: 'calc(100% + 4px)', right: 0,
                                                  background: '#fff', border: `1px solid ${border}`, borderRadius: 8,
                                                  boxShadow: '0 6px 20px rgba(9,30,66,0.18)', zIndex: 300, minWidth: 140,
                                                  overflow: 'hidden',
                                                }}>
                                                  <button
                                                    onMouseDown={e => { e.preventDefault(); setEditingReplyId(replyKey); setEditingReplyText(reply.text); setReplyMenuId(null) }}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                  >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={subtle} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                    </svg>
                                                    <span style={{ fontSize: 12, color: navy, fontWeight: 500 }}>Edit</span>
                                                  </button>
                                                  <div style={{ height: 1, background: border }} />
                                                  <button
                                                    onMouseDown={e => { e.preventDefault(); setConfirmDeleteReplyId({ commentId: item.id, replyId: reply.id }); setReplyMenuId(null) }}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#FFEBE6'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                  >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#DE350B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                                                    </svg>
                                                    <span style={{ fontSize: 12, color: '#DE350B', fontWeight: 500 }}>Delete</span>
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {/* Reply button */}
                          {canEdit && (
                            <button
                              onClick={() => { setReplyingToId(replyingToId === item.id ? null : item.id); setReplyText('') }}
                              style={{ marginTop: 5, fontSize: 11, fontWeight: 600, color: subtle, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              onMouseEnter={e => e.currentTarget.style.color = blue}
                              onMouseLeave={e => e.currentTarget.style.color = subtle}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
                              </svg>
                              {(item.replies || []).length > 0 ? `${item.replies.length} repl${item.replies.length === 1 ? 'y' : 'ies'}` : 'Reply'}
                            </button>
                          )}

                          {/* Inline reply input */}
                          {replyingToId === item.id && (
                            <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                              <Avatar name={currentUser} size={22} />
                              <div style={{ flex: 1 }}>
                                <textarea
                                  value={replyText}
                                  onChange={e => setReplyText(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addReply(item.id) }}
                                  autoFocus
                                  placeholder="Reply to this comment..."
                                  style={{
                                    width: '100%', resize: 'none', border: `1.5px solid ${blue}`,
                                    borderRadius: 6, padding: '6px 10px', fontSize: 12, color: navy,
                                    lineHeight: 1.6, outline: 'none', boxSizing: 'border-box',
                                    fontFamily: 'inherit', background: '#fff', minHeight: 52,
                                  }}
                                />
                                <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
                                  <button onClick={() => addReply(item.id)} disabled={!replyText.trim()} style={{ ...saveBtnStyle, fontSize: 12, padding: '5px 12px', opacity: replyText.trim() ? 1 : 0.5 }}>Reply</button>
                                  <button onClick={() => { setReplyingToId(null); setReplyText('') }} style={{ ...cancelBtnStyle, fontSize: 12, padding: '5px 10px' }}>Cancel</button>
                                  <span style={{ fontSize: 10, color: '#97A0AF', marginLeft: 'auto' }}>⌘↵ to reply</span>
                                </div>
                              </div>
                            </div>
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
              </div>}
            </div>
          </div>

          {/* ── RIGHT PANEL ────────────────────────────────────────────────── */}
          <div style={{ width: 380, flexShrink: 0, overflowY: 'auto', padding: '20px 20px 32px', background: bg }}>

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
                <div ref={assigneeRef} style={{ position: 'relative', width: '100%' }}>
                  {/* Display chips */}
                  <div
                    onClick={() => canEdit && setAssigneeOpen(v => !v)}
                    style={{
                      display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center',
                      minHeight: 30, padding: '4px 7px', borderRadius: 4,
                      border: `1px solid ${assigneeOpen ? blue : border}`,
                      background: '#fff', cursor: canEdit ? 'pointer' : 'default',
                      transition: 'border-color 0.15s',
                    }}
                  >
                    {assignees.length === 0
                      ? <span style={{ fontSize: 12, color: '#97A0AF' }}>Unassigned</span>
                      : assignees.map(email => (
                          <span key={email} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            background: '#DEEBFF', color: blue, borderRadius: 20,
                            fontSize: 11, fontWeight: 600, padding: '2px 8px 2px 4px',
                          }}>
                            <Avatar name={email} size={16} />
                            {email.split('@')[0]}
                            {canEdit && (
                              <span
                                onMouseDown={e => { e.stopPropagation(); toggleAssignee(email) }}
                                style={{ cursor: 'pointer', opacity: 0.6, fontWeight: 700, fontSize: 10, marginLeft: 1 }}
                              >✕</span>
                            )}
                          </span>
                        ))
                    }
                    {canEdit && <span style={{ fontSize: 11, color: subtle, marginLeft: 2 }}>▾</span>}
                  </div>

                  {/* Dropdown */}
                  {assigneeOpen && canEdit && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                      background: '#fff', border: `1px solid ${border}`, borderRadius: 6,
                      boxShadow: '0 4px 16px rgba(9,30,66,0.18)', zIndex: 100,
                      maxHeight: 220, overflowY: 'auto',
                    }}>
                      {/* Self-assign */}
                      {currentUser && (() => {
                        const selfEmail = currentUser
                        const checked = assignees.includes(selfEmail)
                        return (
                          <div
                            key="self"
                            onMouseDown={e => { e.preventDefault(); toggleAssignee(selfEmail) }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                              cursor: 'pointer', background: checked ? '#F0F4FF' : '#fff',
                              borderBottom: `1px solid ${border}`,
                            }}
                            onMouseEnter={e => { if (!checked) e.currentTarget.style.background = '#FAFBFC' }}
                            onMouseLeave={e => { if (!checked) e.currentTarget.style.background = '#fff' }}
                          >
                            <Avatar name={selfEmail} size={22} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: navy }}>{selfEmail.split('@')[0]}</div>
                              <div style={{ fontSize: 11, color: subtle }}>Assign to me</div>
                            </div>
                            {checked && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={blue} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                          </div>
                        )
                      })()}

                      {/* Project members */}
                      {members.filter(m => m.email !== currentUser).length === 0 && (
                        <div style={{ padding: '10px 12px', fontSize: 12, color: subtle, textAlign: 'center' }}>
                          No other members yet
                        </div>
                      )}
                      {members.filter(m => m.email !== currentUser).map(m => {
                        const checked = assignees.includes(m.email)
                        return (
                          <div
                            key={m.email}
                            onMouseDown={e => { e.preventDefault(); toggleAssignee(m.email) }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                              cursor: 'pointer', background: checked ? '#F0F4FF' : '#fff',
                              borderBottom: `1px solid ${border}`,
                            }}
                            onMouseEnter={e => { if (!checked) e.currentTarget.style.background = '#FAFBFC' }}
                            onMouseLeave={e => { if (!checked) e.currentTarget.style.background = '#fff' }}
                          >
                            <Avatar name={m.email} size={22} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email.split('@')[0]}</div>
                              <div style={{ fontSize: 11, color: subtle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email} · {m.role}</div>
                            </div>
                            {checked && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={blue} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
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

              {/* Time tracking */}
              <DetailRow label="Reporter">
                <span style={{ fontSize: 12, color: navy }}>{currentUser}</span>
              </DetailRow>
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

      {/* Assignee change confirmation */}
      {pendingAssignee && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 6000,
          background: 'rgba(9,30,66,0.45)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff', borderRadius: 10, width: 380,
            boxShadow: '0 12px 40px rgba(9,30,66,0.28)', overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 24px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: pendingAssignee.action === 'add' ? '#E3FCEF' : '#FFEBE6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {pendingAssignee.action === 'add'
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#006644" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DE350B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="8" x2="25" y2="14"/></svg>
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: navy, marginBottom: 6 }}>
                    {pendingAssignee.action === 'add' ? 'Assign member?' : 'Remove assignee?'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#F4F5F7', borderRadius: 6 }}>
                    <Avatar name={pendingAssignee.email} size={28} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: navy }}>{pendingAssignee.email.split('@')[0]}</div>
                      <div style={{ fontSize: 11, color: subtle }}>{pendingAssignee.email}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: subtle, marginTop: 8 }}>
                    {pendingAssignee.action === 'add'
                      ? 'This person will be assigned to the ticket.'
                      : 'This person will be removed from the ticket.'}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '8px 24px 20px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setPendingAssignee(null)}
                style={{ fontSize: 13, fontWeight: 500, padding: '7px 16px', borderRadius: 4, border: `1px solid ${border}`, background: '#fff', color: navy, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                Cancel
              </button>
              <button
                onClick={confirmAssignee}
                style={{
                  fontSize: 13, fontWeight: 600, padding: '7px 16px', borderRadius: 4, border: 'none', cursor: 'pointer',
                  background: pendingAssignee.action === 'add' ? '#0052CC' : '#DE350B', color: '#fff',
                }}
                onMouseEnter={e => e.currentTarget.style.background = pendingAssignee.action === 'add' ? '#0747A6' : '#BF2600'}
                onMouseLeave={e => e.currentTarget.style.background = pendingAssignee.action === 'add' ? '#0052CC' : '#DE350B'}
              >
                {pendingAssignee.action === 'add' ? 'Assign' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment size error */}
      {attachError && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 6000,
          background: 'rgba(9,30,66,0.45)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff', borderRadius: 10, width: 380,
            boxShadow: '0 12px 40px rgba(9,30,66,0.28)', overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 24px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#FFF0B3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF8B00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: navy, marginBottom: 4 }}>File too large</div>
                  <div style={{ fontSize: 13, color: subtle, lineHeight: 1.5 }}>{attachError}</div>
                </div>
              </div>
            </div>
            <div style={{ padding: '8px 24px 20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setAttachError(null)}
                style={{ fontSize: 13, fontWeight: 600, padding: '7px 20px', borderRadius: 4, border: 'none', background: blue, color: '#fff', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#0747A6'}
                onMouseLeave={e => e.currentTarget.style.background = blue}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment delete confirmation */}
      {confirmDeleteId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 6000,
          background: 'rgba(9,30,66,0.45)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff', borderRadius: 10, width: 380,
            boxShadow: '0 12px 40px rgba(9,30,66,0.28)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 24px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#FFEBE6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DE350B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: navy }}>Remove attachment?</div>
                  <div style={{ fontSize: 12, color: subtle, marginTop: 2 }}>This file will be permanently deleted from this ticket.</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '12px 24px 20px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{ fontSize: 13, fontWeight: 500, padding: '7px 16px', borderRadius: 4, border: `1px solid ${border}`, background: '#fff', color: navy, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveAttachment}
                style={{ fontSize: 13, fontWeight: 600, padding: '7px 16px', borderRadius: 4, border: 'none', background: '#DE350B', color: '#fff', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#BF2600'}
                onMouseLeave={e => e.currentTarget.style.background = '#DE350B'}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment delete confirmation */}
      {confirmDeleteCommentId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 6000,
          background: 'rgba(9,30,66,0.45)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff', borderRadius: 10, width: 380,
            boxShadow: '0 12px 40px rgba(9,30,66,0.28)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 24px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FFEBE6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DE350B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#172B4D', marginBottom: 6 }}>Delete comment?</div>
                  <div style={{ fontSize: 13, color: '#5E6C84', lineHeight: 1.5 }}>
                    This comment will be permanently removed. This action cannot be undone.
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '8px 24px 20px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmDeleteCommentId(null)}
                style={{ fontSize: 13, fontWeight: 500, padding: '7px 16px', borderRadius: 4, border: '1px solid #DFE1E6', background: '#fff', color: '#172B4D', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteComment?.(node.id, confirmDeleteCommentId)
                  setConfirmDeleteCommentId(null)
                }}
                style={{ fontSize: 13, fontWeight: 600, padding: '7px 16px', borderRadius: 4, border: 'none', background: '#DE350B', color: '#fff', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#BF2600'}
                onMouseLeave={e => e.currentTarget.style.background = '#DE350B'}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reply delete confirmation */}
      {confirmDeleteReplyId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 6000,
          background: 'rgba(9,30,66,0.45)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff', borderRadius: 10, width: 380,
            boxShadow: '0 12px 40px rgba(9,30,66,0.28)', overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 24px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FFEBE6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DE350B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#172B4D', marginBottom: 6 }}>Delete reply?</div>
                  <div style={{ fontSize: 13, color: '#5E6C84', lineHeight: 1.5 }}>
                    This reply will be permanently removed. This action cannot be undone.
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '8px 24px 20px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmDeleteReplyId(null)}
                style={{ fontSize: 13, fontWeight: 500, padding: '7px 16px', borderRadius: 4, border: '1px solid #DFE1E6', background: '#fff', color: '#172B4D', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteReply(confirmDeleteReplyId.commentId, confirmDeleteReplyId.replyId)
                  setConfirmDeleteReplyId(null)
                }}
                style={{ fontSize: 13, fontWeight: 600, padding: '7px 16px', borderRadius: 4, border: 'none', background: '#DE350B', color: '#fff', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#BF2600'}
                onMouseLeave={e => e.currentTarget.style.background = '#DE350B'}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
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

function FileIcon({ type = '' }) {
  if (type.startsWith('image/')) return <span>🖼</span>
  if (type === 'application/pdf') return <span>📄</span>
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return <span>📊</span>
  if (type.includes('word') || type.includes('document')) return <span>📝</span>
  if (type.includes('zip') || type.includes('tar') || type.includes('gzip')) return <span>🗜</span>
  if (type.startsWith('video/')) return <span>🎬</span>
  if (type.startsWith('audio/')) return <span>🎵</span>
  return <span>📎</span>
}
