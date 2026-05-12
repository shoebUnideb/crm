import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

// Lazy-loaded: prevents CRM code from entering the Canvas JS chunk
const InlineCRMModal = React.lazy(() => import('../crm/InlineCRMModal.jsx'))

const STATUS_OPTIONS = [
  { value: '', label: 'No status' },
  { value: 'todo', label: 'To Do', dot: '#6B7280' },
  { value: 'in-progress', label: 'In Progress', dot: '#3B82F6' },
  { value: 'done', label: 'Done', dot: '#22C55E' },
  { value: 'blocked', label: 'Blocked', dot: '#EF4444' },
]

const PRIORITY_OPTIONS = [
  { value: '', label: 'No priority' },
  { value: 'critical', label: '🔴 Critical' },
  { value: 'high', label: '🟠 High' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'low', label: '🟢 Low' },
]

const ISSUE_TYPE_OPTIONS = [
  { value: '', label: 'Default (from depth map)' },
  { value: 'epic', label: '🟣 Epic' },
  { value: 'story', label: '🟢 Story' },
  { value: 'task', label: '🔵 Task' },
  { value: 'bug', label: '🔴 Bug' },
  { value: 'subtask', label: '⚪ Subtask' },
]

// Render comment text with @mention highlighting
function CommentText({ text }) {
  const parts = text.split(/(@\w+)/g)
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith('@') ? (
          <span key={i} style={{ color: '#3B82F6', fontWeight: 600, background: '#EFF6FF', borderRadius: '4px', padding: '0 3px' }}>{part}</span>
        ) : part
      )}
    </span>
  )
}

export default function NodePropertiesPanel({ node, onSave, onAddComment, onDeleteComment, onAddReply, onClose, currentUser, onToggleLock, onToggleReaction, onOpenDetail, customStatuses = [], customFields = [] }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(buildForm(node))
  const [tagInput, setTagInput] = useState('')
  const [commentText, setCommentText] = useState('')
  const [activeTab, setActiveTab] = useState('props') // 'props' | 'audit'
  const [checklistInput, setChecklistInput] = useState('')
  const [aliasValue, setAliasValue] = useState(node.alias ?? '')
  const [iconValue, setIconValue] = useState(node.icon ?? '')
  // Feature 25: reply state
  const [replyingTo, setReplyingTo] = useState(null) // commentId
  const [replyText, setReplyText] = useState('')
  const [showCRMModal, setShowCRMModal] = useState(false)

  useEffect(() => {
    setForm(buildForm(node))
    setTagInput('')
    setCommentText('')
    setActiveTab('props')
    setAliasValue(node.alias ?? '')
    setIconValue(node.icon ?? '')
    setReplyingTo(null)
    setReplyText('')
  }, [node.id])

  function buildForm(n) {
    return {
      status: n.status ?? '',
      priority: n.priority ?? '',
      storyPoints: n.storyPoints != null ? String(n.storyPoints) : '',
      issueType: n.issueType ?? '',
      assignee: n.assignee ?? '',
      tags: n.tags ?? [],
      dueDate: n.dueDate ?? '',
      sprint: n.sprint ?? '',
      jiraKey: n.jiraKey ?? '',
      timeEstimate: n.timeEstimate != null ? String(n.timeEstimate) : '',
      timeLogged: n.timeLogged != null ? String(n.timeLogged) : '',
    }
  }

  function flush(updatedForm) {
    const sp = updatedForm.storyPoints === '' ? null : Number(updatedForm.storyPoints)
    const te = updatedForm.timeEstimate === '' ? null : Number(updatedForm.timeEstimate)
    const tl = updatedForm.timeLogged === '' ? null : Number(updatedForm.timeLogged)
    onSave(node.id, {
      status: updatedForm.status || null,
      priority: updatedForm.priority || null,
      storyPoints: isNaN(sp) ? null : sp,
      issueType: updatedForm.issueType || null,
      assignee: updatedForm.assignee || null,
      tags: updatedForm.tags,
      dueDate: updatedForm.dueDate || null,
      sprint: updatedForm.sprint || null,
      jiraKey: updatedForm.jiraKey || null,
      timeEstimate: isNaN(te) ? null : te,
      timeLogged: isNaN(tl) ? null : tl,
    })
  }

  function setField(field, value) {
    const updated = { ...form, [field]: value }
    setForm(updated)
    flush(updated)
  }

  function addTag() {
    const t = tagInput.trim()
    if (!t || form.tags.includes(t)) return
    setField('tags', [...form.tags, t])
    setTagInput('')
  }

  const checklist = node.checklist || []
  const checklistDone = checklist.filter(i => i.done).length

  function addChecklistItem() {
    const text = checklistInput.trim()
    if (!text) return
    const updated = [...checklist, { id: crypto.randomUUID(), text, done: false }]
    onSave(node.id, { checklist: updated })
    setChecklistInput('')
  }

  function toggleChecklistItem(itemId) {
    const updated = checklist.map(i => i.id === itemId ? { ...i, done: !i.done } : i)
    onSave(node.id, { checklist: updated })
  }

  function deleteChecklistItem(itemId) {
    const updated = checklist.filter(i => i.id !== itemId)
    onSave(node.id, { checklist: updated })
  }

  const overdue = form.dueDate && new Date(form.dueDate) < new Date() && form.status !== 'done'

  return (
    <div style={{
      position: 'absolute', right: 12, top: 12, bottom: 12, width: 284, zIndex: 15,
      background: 'white', borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)', border: '1px solid #E5E7EB',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0, background: '#FAFAFA' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 190 }}>{node.title}</div>
          <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: 1 }}>Node Properties</div>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
          {onOpenDetail && (
            <button
              onClick={() => onOpenDetail()}
              title="Open full detail view"
              style={{
                background: '#EFF6FF', border: '1px solid #BFDBFE',
                borderRadius: '6px', cursor: 'pointer', padding: '3px 7px', fontSize: '11px',
                fontWeight: 600, color: '#1D4ED8', lineHeight: 1, whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#DBEAFE' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#EFF6FF' }}
            >
              ⬡ Open
            </button>
          )}
          <button
            onClick={() => setShowCRMModal(true)}
            title="Track this node as a CRM deal"
            style={{
              background: '#F0FDF4', border: '1px solid #86EFAC',
              borderRadius: '6px', cursor: 'pointer', padding: '3px 7px', fontSize: '11px',
              fontWeight: 600, color: '#15803D', lineHeight: 1, whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#DCFCE7' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F0FDF4' }}
          >
            $ CRM
          </button>
          <button
            onClick={() => onToggleLock?.(node.id)}
            title={node.locked ? 'Unlock node' : 'Lock node'}
            style={{
              background: node.locked ? '#FEF2F2' : '#F3F4F6', border: node.locked ? '1px solid #FECACA' : '1px solid #E5E7EB',
              borderRadius: '6px', cursor: 'pointer', padding: '3px 6px', fontSize: '12px', lineHeight: 1,
            }}
          >{node.locked ? '🔒' : '🔓'}</button>
          <button onClick={onClose} style={{ color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', lineHeight: 1, marginTop: -2 }}>×</button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA', flexShrink: 0 }}>
        {['props', 'reactions', 'audit'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, padding: '7px 4px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: '11px', fontWeight: 600, textTransform: 'capitalize',
            color: activeTab === tab ? '#3B82F6' : '#6B7280',
            borderBottom: activeTab === tab ? '2px solid #3B82F6' : '2px solid transparent',
          }}>{tab === 'props' ? 'Properties' : tab === 'reactions' ? `Reactions${Object.keys(node.reactions || {}).length > 0 ? ` (${Object.values(node.reactions || {}).flat().length})` : ''}` : `Audit${(node.auditTrail?.length ?? 0) > 0 ? ` (${node.auditTrail.length})` : ''}`}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {activeTab === 'props' && (<>
        {/* Status + Priority row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field label="Status">
            <select value={form.status} onChange={e => setField('status', e.target.value)} style={selectStyle}>
              {[...STATUS_OPTIONS, ...customStatuses.map(s => ({ value: s.value, label: s.label }))].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select value={form.priority} onChange={e => setField('priority', e.target.value)} style={selectStyle}>
              {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
        </div>

        {/* Story Points + Issue Type row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field label="Story Points">
            <input
              type="number" min="0" max="999" value={form.storyPoints}
              onChange={e => setForm(f => ({ ...f, storyPoints: e.target.value }))}
              onBlur={e => flush({ ...form, storyPoints: e.target.value })}
              placeholder="e.g. 5"
              style={inputStyle}
            />
          </Field>
          <Field label="Issue Type">
            <select value={form.issueType} onChange={e => setField('issueType', e.target.value)} style={selectStyle}>
              {ISSUE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
        </div>

        {/* Time Tracking row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field label="Est. Hours">
            <input
              type="number" min="0" step="0.5" value={form.timeEstimate}
              onChange={e => setForm(f => ({ ...f, timeEstimate: e.target.value }))}
              onBlur={e => flush({ ...form, timeEstimate: e.target.value })}
              placeholder="e.g. 8"
              style={inputStyle}
            />
          </Field>
          <Field label={<span>Logged Hrs {form.timeEstimate && form.timeLogged ? <span style={{ color: Number(form.timeLogged) > Number(form.timeEstimate) ? '#EF4444' : '#22C55E', fontSize: '9px' }}>({Math.round(Number(form.timeLogged)/Number(form.timeEstimate)*100)}%)</span> : null}</span>}>
            <input
              type="number" min="0" step="0.5" value={form.timeLogged}
              onChange={e => setForm(f => ({ ...f, timeLogged: e.target.value }))}
              onBlur={e => flush({ ...form, timeLogged: e.target.value })}
              placeholder="e.g. 4"
              style={inputStyle}
            />
          </Field>
        </div>

        {/* Assignee */}
        <Field label="Assignee">
          <input
            type="text" value={form.assignee}
            onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))}
            onBlur={e => flush({ ...form, assignee: e.target.value })}
            placeholder="Name or email"
            style={inputStyle}
          />
        </Field>

        {/* Due Date */}
        <Field label={<span>Due Date {overdue && <span style={{ color: '#EF4444', fontSize: '10px', fontWeight: 600 }}>OVERDUE</span>}</span>}>
          <input
            type="date" value={form.dueDate}
            onChange={e => setField('dueDate', e.target.value)}
            style={{ ...inputStyle, borderColor: overdue ? '#FCA5A5' : '#E5E7EB' }}
          />
        </Field>

        {/* Sprint */}
        <Field label="Sprint">
          <input
            type="text" value={form.sprint}
            onChange={e => setForm(f => ({ ...f, sprint: e.target.value }))}
            onBlur={e => flush({ ...form, sprint: e.target.value })}
            placeholder="Sprint name or number"
            style={inputStyle}
          />
        </Field>

        {/* Tags */}
        <Field label="Tags">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: form.tags.length > 0 ? 5 : 0 }}>
            {form.tags.map(tag => (
              <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#EFF6FF', color: '#3B82F6', border: '1px solid #BFDBFE', borderRadius: '999px', padding: '2px 8px', fontSize: '11px' }}>
                {tag}
                <button onClick={() => setField('tags', form.tags.filter(t => t !== tag))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93C5FD', lineHeight: 1, padding: 0, fontSize: '12px' }}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTag()}
              placeholder="Add tag, press Enter"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={addTag} style={{ padding: '5px 10px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>+</button>
          </div>
        </Field>

        {/* Jira Key */}
        <Field label="Jira Key">
          <div style={{ display: 'flex', gap: 4 }}>
            <input
              value={form.jiraKey}
              onChange={e => setForm(f => ({ ...f, jiraKey: e.target.value }))}
              onBlur={e => flush({ ...form, jiraKey: e.target.value })}
              placeholder="e.g. PROJ-123"
              style={{ ...inputStyle, flex: 1, fontFamily: 'monospace', color: form.jiraKey ? '#3B82F6' : undefined }}
            />
            {form.jiraKey && (
              <button
                onClick={() => setField('jiraKey', '')}
                title="Clear"
                style={{ padding: '5px 8px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#EF4444', borderRadius: '8px', fontSize: '11px', cursor: 'pointer' }}
              >✕</button>
            )}
          </div>
        </Field>

        {/* Alias (subtitle) */}
        <Field label="Alias (subtitle)">
          <input
            type="text" value={aliasValue}
            onChange={e => setAliasValue(e.target.value)}
            onBlur={e => onSave(node.id, { alias: e.target.value.trim() || null })}
            placeholder="Short subtitle shown on node"
            style={inputStyle}
          />
        </Field>

        {/* Custom Icon/Emoji */}
        <Field label="Custom Icon">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {['⭐','🔥','✅','⚠️','💡','🚀','🐛','❤️','🎯','📌','🔒','🌟'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => { setIconValue(emoji); onSave(node.id, { icon: emoji }) }}
                  style={{
                    width: 28, height: 28, borderRadius: '6px', fontSize: '14px',
                    background: iconValue === emoji ? '#EFF6FF' : '#F9FAFB',
                    border: `1.5px solid ${iconValue === emoji ? '#3B82F6' : '#E5E7EB'}`,
                    cursor: 'pointer', padding: 0,
                  }}
                >{emoji}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                type="text" value={iconValue}
                onChange={e => setIconValue(e.target.value)}
                onBlur={e => onSave(node.id, { icon: e.target.value.trim() || null })}
                placeholder="Any emoji or text"
                style={{ ...inputStyle, flex: 1 }}
              />
              {iconValue && (
                <button
                  onClick={() => { setIconValue(''); onSave(node.id, { icon: null }) }}
                  style={{ padding: '5px 8px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#EF4444', borderRadius: '8px', fontSize: '11px', cursor: 'pointer' }}
                >Clear</button>
              )}
            </div>
          </div>
        </Field>

        {/* Custom Fields */}
        {customFields.length > 0 && (
          <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 10 }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Custom Fields
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {customFields.map(field => (
                <Field key={field.id} label={field.label}>
                  <input
                    type={field.type === 'number' ? 'number' : 'text'}
                    value={(node.customData ?? {})[field.id] ?? ''}
                    onChange={e => {
                      const val = field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value
                      onSave(node.id, { customData: { ...(node.customData ?? {}), [field.id]: val } })
                    }}
                    onBlur={e => {
                      const val = field.type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value || null
                      onSave(node.id, { customData: { ...(node.customData ?? {}), [field.id]: val } })
                    }}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    style={inputStyle}
                  />
                </Field>
              ))}
            </div>
          </div>
        )}

        {/* Checklist */}
        <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Checklist
            </div>
            {checklist.length > 0 && (
              <span style={{ fontSize: '10px', color: '#6B7280', fontWeight: 600 }}>{checklistDone}/{checklist.length} done</span>
            )}
          </div>
          {checklist.length > 0 && (
            <div style={{ marginBottom: 6, background: '#F3F4F6', borderRadius: 4, height: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#22C55E', width: `${checklist.length > 0 ? (checklistDone / checklist.length) * 100 : 0}%`, transition: 'width 0.2s' }} />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 6 }}>
            {checklist.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={item.done} onChange={() => toggleChecklistItem(item.id)} style={{ width: 14, height: 14, cursor: 'pointer', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12, color: item.done ? '#9CA3AF' : '#374151', textDecoration: item.done ? 'line-through' : 'none' }}>{item.text}</span>
                <button onClick={() => deleteChecklistItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', fontSize: 13, lineHeight: 1, padding: '0 2px' }}>×</button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <input
              value={checklistInput}
              onChange={e => setChecklistInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addChecklistItem()}
              placeholder="Add item, press Enter"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={addChecklistItem} style={{ padding: '5px 10px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>+</button>
          </div>
        </div>

        {/* Comments */}
        <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 10 }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Comments {(node.comments?.length ?? 0) > 0 && <span style={{ color: '#6B7280', fontWeight: 400 }}>({node.comments.length})</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 7 }}>
            {(node.comments || []).map(c => (
              <div key={c.id} style={{ background: '#F9FAFB', borderRadius: '8px', padding: '7px 9px', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ fontWeight: 600, color: '#374151' }}>{c.author || 'You'}</span>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span style={{ color: '#9CA3AF', fontSize: '10px' }}>{new Date(c.createdAt || c.timestamp).toLocaleDateString()}</span>
                    <button
                      onClick={() => { setReplyingTo(replyingTo === c.id ? null : c.id); setReplyText('') }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3B82F6', fontSize: '10px', padding: '0 2px' }}
                      title="Reply"
                    >↩ Reply</button>
                    <button onClick={() => onDeleteComment?.(node.id, c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', fontSize: '13px', lineHeight: 1, padding: '0 1px' }}>×</button>
                  </div>
                </div>
                <div style={{ color: '#4B5563', lineHeight: '1.4', wordBreak: 'break-word', fontSize: '11px' }}><CommentText text={c.text} /></div>

                {/* Replies */}
                {(c.replies || []).length > 0 && (
                  <div style={{ marginTop: 6, paddingLeft: 16, borderLeft: '2px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {(c.replies || []).map(r => (
                      <div key={r.id} style={{ fontSize: '11px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 1 }}>
                          <span style={{ fontWeight: 600, color: '#374151' }}>{r.author || 'You'}</span>
                          <span style={{ color: '#9CA3AF', fontSize: '10px' }}>{new Date(r.timestamp).toLocaleDateString()}</span>
                        </div>
                        <div style={{ color: '#4B5563', lineHeight: '1.4', wordBreak: 'break-word' }}><CommentText text={r.text} /></div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline reply input */}
                {replyingTo === c.id && (
                  <div style={{ marginTop: 6, paddingLeft: 16, borderLeft: '2px solid #BFDBFE' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <input
                        autoFocus
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey && replyText.trim()) {
                            onAddReply?.(node.id, c.id, replyText.trim(), currentUser || 'You')
                            setReplyText('')
                            setReplyingTo(null)
                          }
                          if (e.key === 'Escape') { setReplyingTo(null); setReplyText('') }
                        }}
                        placeholder="Write a reply..."
                        style={{ ...inputStyle, flex: 1, fontSize: '11px' }}
                      />
                      <button
                        onClick={() => {
                          if (!replyText.trim()) return
                          onAddReply?.(node.id, c.id, replyText.trim(), currentUser || 'You')
                          setReplyText('')
                          setReplyingTo(null)
                        }}
                        style={{ padding: '4px 8px', background: '#3B82F6', border: 'none', borderRadius: '6px', color: 'white', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >Send</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && commentText.trim()) {
                  onAddComment?.(node.id, commentText.trim(), currentUser || 'You')
                  setCommentText('')
                }
              }}
              placeholder="Add comment, Enter to post"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              onClick={() => {
                if (!commentText.trim()) return
                onAddComment?.(node.id, commentText.trim(), currentUser || 'You')
                setCommentText('')
              }}
              style={{ padding: '5px 10px', background: '#3B82F6', border: 'none', borderRadius: '8px', color: 'white', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >Post</button>
          </div>
        </div>

        {/* Image — Feature 27 */}
        <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 10 }}>
          <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>IMAGE</label>
          {node.imageUrl && (
            <div style={{ marginBottom: 6, position: 'relative', display: 'inline-block' }}>
              <img src={node.imageUrl} alt="" style={{ maxWidth: 180, maxHeight: 100, borderRadius: 6, border: '1px solid #E5E7EB', display: 'block' }} />
              <button
                onClick={() => onSave(node.id, { imageUrl: null })}
                style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#EF4444', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
              >×</button>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            style={{ fontSize: 11 }}
            onChange={e => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = (ev) => onSave(node.id, { imageUrl: ev.target.result })
              reader.readAsDataURL(file)
            }}
          />
        </div>

        {/* Recurring — Feature 28 */}
        <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 10 }}>
          <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>RECURRING</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <input
              type="checkbox"
              id="recurring-check"
              checked={!!node.recurring}
              onChange={e => onSave(node.id, { recurring: e.target.checked, recurringFrequency: e.target.checked ? (node.recurringFrequency || 'weekly') : null })}
              style={{ width: 14, height: 14, cursor: 'pointer' }}
            />
            <label htmlFor="recurring-check" style={{ fontSize: 12, color: '#374151', cursor: 'pointer' }}>Mark as recurring</label>
          </div>
          {node.recurring && (
            <Field label="Frequency">
              <select
                value={node.recurringFrequency || 'weekly'}
                onChange={e => onSave(node.id, { recurringFrequency: e.target.value })}
                style={selectStyle}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom</option>
              </select>
            </Field>
          )}
        </div>
        </>)}

        {activeTab === 'reactions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: '11px', color: '#6B7280' }}>Click an emoji to toggle your reaction</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['👍','👎','❤️','🎉','🚀','😂','😮','🙏','🔥','✅','⚠️','🐛'].map(emoji => {
                const users = node.reactions?.[emoji] || []
                const mine = users.includes(currentUser || 'You')
                return (
                  <button key={emoji} onClick={() => onToggleReaction?.(node.id, emoji)} style={{
                    padding: '5px 10px', borderRadius: '999px', fontSize: '13px', cursor: 'pointer',
                    background: mine ? '#EFF6FF' : '#F9FAFB',
                    border: mine ? '1.5px solid #BFDBFE' : '1.5px solid #E5E7EB',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <span>{emoji}</span>
                    {users.length > 0 && <span style={{ fontSize: '11px', fontWeight: 600, color: mine ? '#3B82F6' : '#6B7280' }}>{users.length}</span>}
                  </button>
                )
              })}
            </div>
            {Object.keys(node.reactions || {}).length > 0 && (
              <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 8 }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', marginBottom: 6 }}>Who reacted</div>
                {Object.entries(node.reactions).map(([emoji, users]) => (
                  <div key={emoji} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: '12px' }}>
                    <span>{emoji}</span>
                    <span style={{ color: '#6B7280' }}>{users.join(', ')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {(node.auditTrail?.length ?? 0) === 0 ? (
              <div style={{ color: '#9CA3AF', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>No audit history yet</div>
            ) : (
              [...(node.auditTrail || [])].reverse().map(entry => (
                <div key={entry.id} style={{ background: '#F9FAFB', borderRadius: '8px', padding: '7px 10px', fontSize: '11px', borderLeft: '3px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontWeight: 600, color: '#374151', textTransform: 'capitalize' }}>{entry.field}</span>
                    <span style={{ color: '#9CA3AF', fontSize: '10px' }}>{new Date(entry.timestamp).toLocaleString()}</span>
                  </div>
                  <div style={{ color: '#6B7280', fontSize: '11px' }}>
                    <span style={{ color: '#EF4444' }}>{entry.oldValue ?? 'none'}</span>
                    <span style={{ margin: '0 4px' }}>→</span>
                    <span style={{ color: '#22C55E' }}>{entry.newValue ?? 'none'}</span>
                  </div>
                  <div style={{ color: '#9CA3AF', fontSize: '10px', marginTop: 1 }}>by {entry.user}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showCRMModal && (
        <React.Suspense fallback={null}>
          <InlineCRMModal
            nodeId={node.id}
            nodeKey={node.nodeKey || ''}
            companyName={node.title || ''}
            onClose={() => setShowCRMModal(false)}
          />
        </React.Suspense>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '5px 8px', border: '1px solid #E5E7EB',
  borderRadius: '7px', fontSize: '12px', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit',
}

const selectStyle = {
  width: '100%', padding: '5px 8px', border: '1px solid #E5E7EB',
  borderRadius: '7px', fontSize: '12px', outline: 'none', background: 'white',
  cursor: 'pointer', fontFamily: 'inherit', boxSizing: 'border-box',
}
