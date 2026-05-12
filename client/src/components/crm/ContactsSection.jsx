import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { peopleApi } from '../../lib/crmPeopleApi.js'
import { crmApi } from '../../lib/crmApi.js'
import TagManager from './TagManager.jsx'

const EMERALD = '#10b981'
const GREEN   = '#388e3c'
const GREEN_BG = '#43a047'
const GREEN_HOVER = '#2e7d32'
const NAVY    = '#172B4D'
const SUBTLE  = '#5E6C84'
const BORDER  = '#DFE1E6'
const BG      = '#F7F8FA'
const WHITE   = '#fff'

const STAGE_COLORS = {
  lead: { bg: '#DEEBFF', color: '#0052CC' },
  qualified: { bg: '#EAE6FF', color: '#5243AA' },
  demo: { bg: '#FFF0B3', color: '#FF8B00' },
  proposal: { bg: '#FFEBE6', color: '#BF2600' },
  negotiation: { bg: '#FFF4E5', color: '#FF991F' },
  won: { bg: '#E3FCEF', color: '#006644' },
  lost: { bg: '#F4F5F7', color: '#97A0AF' },
}

function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmt$(v) {
  const n = parseFloat(v) || 0
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(0) + 'K'
  return '$' + n.toFixed(0)
}

const ALL_COLUMNS = [
  { key: 'name', label: 'Name', default: true, locked: true, entity: 'Person' },
  { key: 'organization', label: 'Organization', default: true, entity: 'Person' },
  { key: 'email', label: 'Email', default: true, entity: 'Person' },
  { key: 'phone', label: 'Phone', default: true, entity: 'Person' },
  { key: 'closed_deals', label: 'Closed deals', default: true, entity: 'Person' },
  { key: 'open_deals', label: 'Open deals', default: true, entity: 'Person' },
  { key: 'role', label: 'Label / Role', default: false, entity: 'Person' },
  { key: 'owner', label: 'Owner', default: false, entity: 'Person' },
  { key: 'visible_to', label: 'Visible to', default: false, entity: 'Person' },
  { key: 'created_at', label: 'Person created', default: false, entity: 'Person' },
  { key: 'updated_at', label: 'Update time', default: false, entity: 'Person' },
  { key: 'last_activity_date', label: 'Last activity date', default: false, entity: 'Person' },
  { key: 'linkedin_url', label: 'LinkedIn', default: false, entity: 'Person' },
  { key: 'birthday', label: 'Birthday', default: false, entity: 'Person' },
  { key: 'won_deals', label: 'Won deals', default: false, entity: 'Person' },
  { key: 'lost_deals', label: 'Lost deals', default: false, entity: 'Person' },
  { key: 'total_activities', label: 'Total activities', default: false, entity: 'Person' },
  { key: 'done_activities', label: 'Done activities', default: false, entity: 'Person' },
  { key: 'activities_to_do', label: 'Activities to do', default: false, entity: 'Person' },
  { key: 'notes', label: 'Notes', default: false, entity: 'Person' },
]

const FILTER_FIELDS = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'organization', label: 'Organization', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'role', label: 'Label', type: 'text' },
  { key: 'open_deals', label: 'Open deals', type: 'number' },
  { key: 'closed_deals', label: 'Closed deals', type: 'number' },
  { key: 'created_at', label: 'Created', type: 'date' },
]

const FILTER_OPS = {
  text: [
    { key: 'contains', label: 'contains' },
    { key: 'not_contains', label: 'does not contain' },
    { key: 'is', label: 'is' },
    { key: 'is_empty', label: 'is empty' },
    { key: 'is_not_empty', label: 'is not empty' },
  ],
  number: [
    { key: 'eq', label: '=' },
    { key: 'gt', label: '>' },
    { key: 'lt', label: '<' },
    { key: 'gte', label: '>=' },
    { key: 'lte', label: '<=' },
  ],
  date: [
    { key: 'after', label: 'after' },
    { key: 'before', label: 'before' },
    { key: 'is', label: 'is' },
  ],
}

function matchFilter(person, filter) {
  const val = person[filter.field]
  const cmp = filter.value?.toLowerCase?.() || ''
  const pVal = (val ?? '').toString().toLowerCase()
  const numVal = parseFloat(val) || 0
  switch (filter.op) {
    case 'contains': return pVal.includes(cmp)
    case 'not_contains': return !pVal.includes(cmp)
    case 'is': return pVal === cmp
    case 'is_empty': return !val
    case 'is_not_empty': return !!val
    case 'eq': return numVal === parseFloat(filter.value)
    case 'gt': return numVal > parseFloat(filter.value)
    case 'lt': return numVal < parseFloat(filter.value)
    case 'gte': return numVal >= parseFloat(filter.value)
    case 'lte': return numVal <= parseFloat(filter.value)
    case 'after': return val && val > filter.value
    case 'before': return val && val < filter.value
    default: return true
  }
}

// ── Column Customization Panel (Pipedrive-style) ─────────────────────────────
function ColumnCustomizer({ columns, onColumnsChange, onClose }) {
  const [search, setSearch] = useState('')
  const [localCols, setLocalCols] = useState(columns)

  const all = localCols.filter(c => c.label.toLowerCase().includes(search.toLowerCase()))

  function toggleColumn(key) {
    setLocalCols(prev => prev.map(c => c.key === key ? { ...c, visible: !c.visible } : c))
  }
  function resetDefaults() {
    setLocalCols(ALL_COLUMNS.map((c, i) => ({ ...c, visible: c.default, position: i })))
  }
  function save() {
    onColumnsChange(localCols)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
      <div style={{ position: 'relative', background: WHITE, borderRadius: 4, width: 480, maxWidth: '92vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
        {/* Header */}
        <div style={{ padding: '14px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: NAVY }}>Customize columns</h3>
          <button style={{ padding: '5px 12px', background: WHITE, color: NAVY, border: `1px solid ${BORDER}`, borderRadius: 2, cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>
            + Custom field
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '0 20px 10px' }}>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="13" height="13" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="#999" strokeWidth="1.5"/><path d="M11 11l3.5 3.5" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              style={{ width: '100%', boxSizing: 'border-box', padding: '6px 10px 6px 30px', borderRadius: 2, border: `1.5px solid ${BORDER}`, fontSize: 12, color: NAVY, outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#4CAF50'}
              onBlur={e => e.target.style.borderColor = BORDER} />
          </div>
        </div>

        {/* Column list */}
        <div style={{ flex: 1, overflowY: 'auto', borderTop: `1px solid #eee` }}>
          {all.map(col => (
            <div key={col.key}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 20px', borderBottom: '1px solid #f5f5f5', cursor: col.locked ? 'default' : 'pointer' }}
              onClick={() => !col.locked && toggleColumn(col.key)}
              onMouseEnter={e => e.currentTarget.style.background = '#FAFBFC'}
              onMouseLeave={e => e.currentTarget.style.background = WHITE}>
              <input type="checkbox" checked={col.visible} disabled={col.locked} readOnly
                style={{ cursor: col.locked ? 'default' : 'pointer', width: 14, height: 14, accentColor: '#333', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 12, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col.label}</span>
              <span style={{ fontSize: 11, color: SUBTLE, fontWeight: 500, flexShrink: 0 }}>{col.entity}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 20px', borderTop: `1px solid #eee`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={resetDefaults}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: NAVY, padding: 0 }}>
            Default columns
          </button>
          <div style={{ flex: 1 }} />
          <button onClick={onClose}
            style={{ padding: '6px 14px', background: WHITE, color: NAVY, border: `1px solid ${BORDER}`, borderRadius: 2, cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>
            Cancel
          </button>
          <button onClick={save}
            style={{ padding: '6px 14px', background: '#2E7D32', color: WHITE, border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Enhanced Person Modal (Pipedrive-style) ───────────────────────────────────
function PersonModal({ initial, onSave, onClose, saving, organizations = [] }) {
  const [form, setForm] = useState({
    name: '', email: '', email_type: 'work', phone: '', phone_type: 'work',
    organization: '', org_id: null, role: '', linkedin_url: '', birthday: '',
    notes: '', label: '', owner: '', visible_to: 'everyone',
    ...(initial || {}),
  })
  const [dupes, setDupes] = useState([])
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (!form.email || initial?.id) return
    const t = setTimeout(async () => {
      try {
        const r = await peopleApi.checkDuplicates({ email: form.email })
        setDupes(r.filter(p => p.id !== initial?.id))
      } catch {}
    }, 500)
    return () => clearTimeout(t)
  }, [form.email])

  const fieldLabel = { display: 'block', fontSize: 11, fontWeight: 500, color: NAVY, marginBottom: 4 }
  const fieldInput = {
    width: '100%', boxSizing: 'border-box', padding: '6px 8px',
    borderRadius: 2, border: `1px solid ${BORDER}`, fontSize: 12,
    color: NAVY, background: WHITE, fontFamily: 'inherit', outline: 'none',
  }
  const selectSt = {
    padding: '6px 8px', borderRadius: 2, border: `1px solid ${BORDER}`,
    fontSize: 11, color: SUBTLE, background: WHITE, outline: 'none', cursor: 'pointer',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
      <div style={{ position: 'relative', background: WHITE, borderRadius: 4, width: 500, maxWidth: '92vw', boxShadow: '0 12px 40px rgba(0,0,0,0.18)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '14px 20px 12px', borderBottom: `1px solid #eee`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: NAVY }}>
            {initial?.id ? 'Edit person' : 'Add new person'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUBTLE, fontSize: 18, lineHeight: 1 }}>×</button>
        </div>

        {/* Form body */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {/* Name */}
          <div style={{ marginBottom: 12 }}>
            <label style={fieldLabel}>Name</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Name"
              style={fieldInput}
              onFocus={e => e.target.style.borderColor = GREEN_BG}
              onBlur={e => e.target.style.borderColor = BORDER} />
          </div>

          {/* Organization */}
          <div style={{ marginBottom: 12 }}>
            <label style={fieldLabel}>Organization</label>
            <input
              list="pm-org-list"
              value={form.organization}
              onChange={e => {
                const matched = organizations.find(o => o.name === e.target.value)
                setForm(f => ({ ...f, organization: e.target.value, org_id: matched ? matched.id : null }))
              }}
              placeholder="Organization"
              style={fieldInput}
              onFocus={e => e.target.style.borderColor = GREEN_BG}
              onBlur={e => e.target.style.borderColor = BORDER}
            />
            <datalist id="pm-org-list">
              {organizations.map(o => <option key={o.id} value={o.name} />)}
            </datalist>
          </div>

          {/* Phone with type */}
          <div style={{ marginBottom: 12 }}>
            <label style={fieldLabel}>Phone</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Phone"
                style={{ ...fieldInput, flex: 1 }}
                onFocus={e => e.target.style.borderColor = GREEN_BG}
                onBlur={e => e.target.style.borderColor = BORDER} />
              <select value={form.phone_type} onChange={e => set('phone_type', e.target.value)} style={selectSt}>
                <option value="work">Work</option>
                <option value="mobile">Mobile</option>
                <option value="home">Home</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Email with type */}
          <div style={{ marginBottom: 12 }}>
            <label style={fieldLabel}>Email</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="Email" type="email"
                style={{ ...fieldInput, flex: 1 }}
                onFocus={e => e.target.style.borderColor = GREEN_BG}
                onBlur={e => e.target.style.borderColor = BORDER} />
              <select value={form.email_type} onChange={e => set('email_type', e.target.value)} style={selectSt}>
                <option value="work">Work</option>
                <option value="home">Home</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Role */}
          <div style={{ marginBottom: 12 }}>
            <label style={fieldLabel}>Role</label>
            <input value={form.role || ''} onChange={e => set('role', e.target.value)} placeholder="e.g. Editor, Manager"
              style={fieldInput}
              onFocus={e => e.target.style.borderColor = GREEN_BG}
              onBlur={e => e.target.style.borderColor = BORDER} />
          </div>

          {/* Label */}
          <div style={{ marginBottom: 12 }}>
            <label style={fieldLabel}>Label</label>
            <select value={form.label || ''} onChange={e => set('label', e.target.value)} style={{ ...fieldInput, cursor: 'pointer' }}>
              <option value="">— None —</option>
              <option value="hot">Hot lead</option>
              <option value="warm">Warm lead</option>
              <option value="cold">Cold lead</option>
              <option value="customer">Customer</option>
              <option value="partner">Partner</option>
            </select>
          </div>

          {/* Owner */}
          <div style={{ marginBottom: 12 }}>
            <label style={fieldLabel}>Owner</label>
            <input value={form.owner || ''} onChange={e => set('owner', e.target.value)} placeholder="Owner name"
              style={fieldInput}
              onFocus={e => e.target.style.borderColor = GREEN_BG}
              onBlur={e => e.target.style.borderColor = BORDER} />
          </div>

          {/* Visible to */}
          <div style={{ marginBottom: 12 }}>
            <label style={fieldLabel}>Visible to</label>
            <div style={{ display: 'flex', gap: 12, fontSize: 13, color: NAVY }}>
              {[
                { val: 'owner', label: 'Item owner' },
                { val: 'group', label: "Owner's visibility group" },
                { val: 'everyone', label: 'Entire company' },
              ].map(opt => (
                <label key={opt.val} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                  <input type="radio" name="visible_to" value={opt.val} checked={form.visible_to === opt.val}
                    onChange={e => set('visible_to', e.target.value)}
                    style={{ accentColor: GREEN_BG }} />
                  <span style={{ fontSize: 12 }}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {dupes.length > 0 && (
            <div style={{ padding: '8px 10px', background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 2, fontSize: 11, color: '#E65100', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Similar contact{dupes.length > 1 ? 's' : ''} found: <strong>{dupes.map(p => p.name).join(', ')}</strong></span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 20px', borderTop: `1px solid #eee`, display: 'flex', gap: 8, justifyContent: 'flex-end', background: '#FAFBFC' }}>
          <button onClick={onClose}
            style={{ padding: '6px 14px', background: WHITE, color: SUBTLE, border: `1px solid ${BORDER}`, borderRadius: 2, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
            Cancel
          </button>
          <button onClick={() => onSave(form)} disabled={saving || !form.name.trim()}
            style={{ padding: '6px 16px', background: GREEN_BG, color: WHITE, border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 12, fontWeight: 600, opacity: saving || !form.name.trim() ? 0.55 : 1 }}>
            {saving ? 'Saving...' : initial?.id ? 'Save' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── New Deal Form Modal ──────────────────────────────────────────────────────
const DEFAULT_DEAL_STAGES = [
  { id: 'lead', label: 'Lead', probability: 10 },
  { id: 'qualified', label: 'Qualified', probability: 25 },
  { id: 'demo', label: 'Demo', probability: 40 },
  { id: 'proposal', label: 'Proposal', probability: 60 },
  { id: 'negotiation', label: 'Negotiation', probability: 80 },
  { id: 'won', label: 'Won', probability: 100 },
  { id: 'lost', label: 'Lost', probability: 0 },
]

function DealFormModal({ initial, pipelines, stages, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    company_name: '', contact_name: '', contact_email: '', deal_value: '',
    stage: 'lead', pipeline_id: pipelines[0]?.id || null, probability: 10,
    expected_close_date: '', next_action: '', notes: '',
    linkedin_url: '', follow_up_at: '', assigned_to: '', tags: '',
    ...(initial || {}),
  })
  const [showMore, setShowMore] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const pipelineStages = useMemo(() => {
    if (!stages || stages.length === 0) return DEFAULT_DEAL_STAGES
    if (!form.pipeline_id) return stages.map(s => ({ id: s.name || s.id, label: s.label || s.name, probability: s.probability ?? 10 }))
    const filtered = stages.filter(s => s.pipeline_id === form.pipeline_id)
    return filtered.length > 0
      ? filtered.map(s => ({ id: s.name || s.id, label: s.label || s.name, probability: s.probability ?? 10 }))
      : DEFAULT_DEAL_STAGES
  }, [stages, form.pipeline_id])

  const fld = { display: 'block', fontSize: 11, fontWeight: 500, color: '#5E6C84', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }
  const inp = { width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: 2, border: `1px solid #DFE1E6`, fontSize: 12, color: '#172B4D', background: '#fff', fontFamily: 'inherit', outline: 'none' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 4, width: 540, maxWidth: '94vw', boxShadow: '0 12px 40px rgba(0,0,0,0.18)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#172B4D' }}>New Deal</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#97A0AF', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={fld}>Company name *</label>
              <input value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="Company" style={inp}
                onFocus={e => e.target.style.borderColor = '#43a047'} onBlur={e => e.target.style.borderColor = '#DFE1E6'} />
            </div>
            <div>
              <label style={fld}>Contact name</label>
              <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="Jane Smith" style={inp}
                onFocus={e => e.target.style.borderColor = '#43a047'} onBlur={e => e.target.style.borderColor = '#DFE1E6'} />
            </div>
            <div>
              <label style={fld}>Contact email</label>
              <input value={form.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="jane@acme.com" type="email" style={inp}
                onFocus={e => e.target.style.borderColor = '#43a047'} onBlur={e => e.target.style.borderColor = '#DFE1E6'} />
            </div>
            <div>
              <label style={fld}>Deal value ($)</label>
              <input value={form.deal_value} onChange={e => set('deal_value', e.target.value)} placeholder="0" type="number" min="0" style={inp}
                onFocus={e => e.target.style.borderColor = '#43a047'} onBlur={e => e.target.style.borderColor = '#DFE1E6'} />
            </div>
            <div>
              <label style={fld}>Pipeline</label>
              <select value={form.pipeline_id || ''} onChange={e => set('pipeline_id', e.target.value ? parseInt(e.target.value) : null)} style={{ ...inp, cursor: 'pointer' }}>
                {pipelines.length === 0 && <option value="">Default</option>}
                {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={fld}>Stage</label>
              <select value={form.stage} onChange={e => { const s = pipelineStages.find(st => st.id === e.target.value); set('stage', e.target.value); if (s) set('probability', s.probability) }} style={{ ...inp, cursor: 'pointer' }}>
                {pipelineStages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label style={fld}>Probability ({form.probability}%)</label>
              <input type="range" min="0" max="100" step="5" value={form.probability} onChange={e => set('probability', parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#43a047' }} />
            </div>
            <div>
              <label style={fld}>Expected close date</label>
              <input value={form.expected_close_date} onChange={e => set('expected_close_date', e.target.value)} type="date" style={inp} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={fld}>Next action</label>
              <input value={form.next_action} onChange={e => set('next_action', e.target.value)} placeholder="Send follow-up email, schedule demo..." style={inp}
                onFocus={e => e.target.style.borderColor = '#43a047'} onBlur={e => e.target.style.borderColor = '#DFE1E6'} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={fld}>Notes</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Requirements, context, meeting notes..." rows={3}
                style={{ ...inp, resize: 'vertical', minHeight: 48 }}
                onFocus={e => e.target.style.borderColor = '#43a047'} onBlur={e => e.target.style.borderColor = '#DFE1E6'} />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <button onClick={() => setShowMore(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0052CC', fontSize: 11, fontWeight: 500, padding: 0 }}>
              {showMore ? '▲ Hide options' : '▼ More options'}
            </button>
            {showMore && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginTop: 12 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={fld}>LinkedIn URL</label>
                  <input value={form.linkedin_url} onChange={e => set('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/..." style={inp} />
                </div>
                <div>
                  <label style={fld}>Follow-up date</label>
                  <input value={form.follow_up_at} onChange={e => set('follow_up_at', e.target.value)} type="date" style={inp} />
                </div>
                <div>
                  <label style={fld}>Assigned to</label>
                  <input value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)} placeholder="Name or email of owner" style={inp} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={fld}>Tags (comma-separated)</label>
                  <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="hot, enterprise, q2..." style={inp} />
                </div>
              </div>
            )}
          </div>
        </div>
        <div style={{ padding: '10px 20px', borderTop: '1px solid #eee', display: 'flex', gap: 8, justifyContent: 'flex-end', background: '#FAFBFC' }}>
          <button onClick={onClose} style={{ padding: '6px 14px', background: '#fff', color: '#97A0AF', border: '1px solid #DFE1E6', borderRadius: 2, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>Cancel</button>
          <button onClick={() => onSave(form)} disabled={saving || !form.company_name.trim()}
            style={{ padding: '6px 16px', background: '#0052CC', color: '#fff', border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 12, fontWeight: 600, opacity: saving || !form.company_name.trim() ? 0.55 : 1 }}>
            {saving ? 'Creating...' : 'Create Deal'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Person detail dialog (full overlay) ───────────────────────────────────────
function PersonDetailDialog({ person, deals, stages = [], organizations, onClose, onUpdated, onDeleted, onOpenDeal }) {
  const [tab, setTab] = useState('activity')
  const [activities, setActivities] = useState(person.activities || [])
  const [linkedDeals, setLinkedDeals] = useState(person.deals || [])
  const personRef = useRef(person)
  useEffect(() => { personRef.current = person }, [person])
  const [addingActivity, setAddingActivity] = useState(false)
  const [newActivity, setNewActivity] = useState({ type: 'note', title: '', body: '', occurred_at: new Date().toISOString().slice(0, 10), due_date: '' })
  const [savingAct, setSavingAct] = useState(false)
  const [linkSearch, setLinkSearch] = useState('')
  const [showLinkDrop, setShowLinkDrop] = useState(false)
  const [linkSaving, setLinkSaving] = useState(false)
  const [showDealForm, setShowDealForm] = useState(false)
  const [dealFormSaving, setDealFormSaving] = useState(false)
  const [pipelines, setPipelines] = useState([])
  const [allStages, setAllStages] = useState([])
  const [editing, setEditing] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [notesVal, setNotesVal] = useState(person.notes || '')
  const [actTypeFilter, setActTypeFilter] = useState('all')
  const [collapsedSections, setCollapsedSections] = useState({})
  const [inlineEdit, setInlineEdit] = useState(null)
  const [inlineVal, setInlineVal] = useState('')
  const [actMenu, setActMenu] = useState(null)
  const [headerMenu, setHeaderMenu] = useState(false)
  const [editingAct, setEditingAct] = useState(null)
  const [editActForm, setEditActForm] = useState({})
  const notesSaved = useRef(false)

  useEffect(() => {
    crmApi.getPipelines().then(setPipelines).catch(() => {})
    peopleApi.getStages().then(setAllStages).catch(() => {})
  }, [])

  useEffect(() => {
    if (!headerMenu) return
    function close() { setHeaderMenu(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [headerMenu])

  const actTypeIcon = { note: '📝', call: '📞', email: '✉️', meeting: '🤝' }
  const today = new Date().toISOString().slice(0, 10)
  const inputSt = { width: '100%', boxSizing: 'border-box', padding: '5px 8px', borderRadius: 2, border: `1.5px solid ${BORDER}`, fontSize: 12, color: NAVY, background: '#FAFBFC', fontFamily: 'inherit', outline: 'none' }
  const miniInput = { ...inputSt, padding: '5px 8px', fontSize: 11 }

  useEffect(() => {
    function handleEsc(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const toggleSection = key => setCollapsedSections(p => ({ ...p, [key]: !p[key] }))

  async function inlineSave(field, value) {
    const current = personRef.current
    const updates = { ...current }
    if (field === 'first_name') {
      const last = current.name?.split(' ').slice(1).join(' ') || ''
      updates.name = (value + (last ? ' ' + last : '')).trim()
    } else if (field === 'last_name') {
      const first = current.name?.split(' ')[0] || ''
      updates.name = (first + (value ? ' ' + value : '')).trim()
    } else if (field === 'organization') {
      updates.organization = value
      const matched = organizations.find(o => o.name === value)
      if (matched) updates.org_id = matched.id
    } else {
      updates[field] = value
    }
    try {
      const updated = await peopleApi.updatePerson(current.id, updates)
      onUpdated(updated)
    } catch {}
    setInlineEdit(null)
  }

  function startInlineEdit(field, currentValue) {
    setInlineEdit(field)
    setInlineVal(currentValue || '')
  }

  async function saveActivity(typeOverride) {
    if (!newActivity.body.trim()) return
    setSavingAct(true)
    const payload = { ...newActivity }
    if (typeOverride) payload.type = typeOverride
    try {
      const act = await peopleApi.addPersonActivity(person.id, payload)
      setActivities(prev => [act, ...prev])
      setNewActivity({ type: 'note', title: '', body: '', occurred_at: new Date().toISOString().slice(0, 10), due_date: '' })
      setAddingActivity(false)
    } catch {}
    setSavingAct(false)
  }

  async function deleteActivity(actId) {
    if (!confirm('Delete this activity?')) return
    try {
      await peopleApi.deletePersonActivity(actId)
      setActivities(prev => prev.filter(a => a.id !== actId))
    } catch {}
    setActMenu(null)
  }

  function startEditActivity(act) {
    setEditingAct(act.id)
    setEditActForm({ type: act.type, title: act.title || '', body: act.body || '', occurred_at: act.occurred_at?.slice(0, 10) || '', due_date: act.due_date?.slice(0, 10) || '' })
    setActMenu(null)
  }

  async function saveEditActivity() {
    if (!editActForm.body.trim()) return
    try {
      const updated = await peopleApi.updatePersonActivity(editingAct, editActForm)
      setActivities(prev => prev.map(a => a.id === editingAct ? { ...a, ...updated } : a))
    } catch {}
    setEditingAct(null)
  }

  async function toggleDone(act) {
    try {
      const updated = await peopleApi.togglePersonActivityDone(act.id)
      setActivities(prev => prev.map(a => a.id === act.id ? { ...a, done: updated.done } : a))
    } catch {}
  }

  async function linkDeal(deal) {
    setLinkSaving(true)
    try {
      await peopleApi.linkPersonToDeal(deal.id, person.id)
      setLinkedDeals(prev => prev.find(d => d.id === deal.id) ? prev : [...prev, deal])
    } catch {}
    setLinkSaving(false)
    setShowLinkDrop(false)
    setLinkSearch('')
  }

  async function unlinkDeal(dealId) {
    try {
      await peopleApi.unlinkPersonFromDeal(dealId, person.id)
      setLinkedDeals(prev => prev.filter(d => d.id !== dealId))
    } catch {}
  }

  async function createDealForPerson(form) {
    setDealFormSaving(true)
    try {
      const deal = await crmApi.createDeal(form)
      await peopleApi.linkPersonToDeal(deal.id, person.id)
      setLinkedDeals(prev => [...prev, deal])
      setShowDealForm(false)
    } catch {}
    setDealFormSaving(false)
  }

  async function saveNotes() {
    try { await peopleApi.updatePerson(person.id, { ...personRef.current, notes: notesVal }) } catch {}
  }

  async function handleEdit(form) {
    setEditSaving(true)
    try {
      const updated = await peopleApi.updatePerson(person.id, form)
      onUpdated(updated)
      setEditing(false)
    } catch {}
    setEditSaving(false)
  }

  async function handleDelete() {
    if (!confirm(`Delete ${person.name}? This cannot be undone.`)) return
    try {
      await peopleApi.deletePerson(person.id)
      onDeleted(person.id)
    } catch {}
  }

  async function toggleStar() {
    try {
      const updated = await peopleApi.starPerson(person.id)
      onUpdated(updated)
    } catch {}
  }

  const availableDeals = (deals || []).filter(d => !linkedDeals.find(ld => ld.id === d.id) && d.stage !== 'lost')
  const filteredDeals = availableDeals.filter(d => (d.company_name || '').toLowerCase().includes(linkSearch.toLowerCase()))
  const stageC = s => {
    const st = stages.find(x => (x.id ?? x.name) === s)
    return st ? { bg: st.bg ?? st.bg_color ?? '#F4F5F7', color: st.color ?? SUBTLE } : (STAGE_COLORS[s] || { bg: '#F4F5F7', color: SUBTLE })
  }
  const isOverdue = act => act.due_date && !act.done && act.due_date < today
  const displayedActivities = actTypeFilter === 'all' ? activities : activities.filter(a => a.type === actTypeFilter)
  const inactiveDays = person.updated_at ? Math.floor((Date.now() - new Date(person.updated_at).getTime()) / 86400000) : null

  const sectionHdr = (key, label) => (
    <div onClick={() => toggleSection(key)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 0 6px', cursor: 'pointer', userSelect: 'none' }}>
      <span style={{ fontSize: 9, color: '#97A0AF', transition: 'transform 0.15s', transform: collapsedSections[key] ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▼</span>
      <span style={{ fontSize: 10, fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
    </div>
  )

  const detailRow = (label, value, field, type = 'text') => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid #F4F5F7`, minHeight: 30 }}>
      <span style={{ fontSize: 11, color: '#97A0AF', flexShrink: 0 }}>{label}</span>
      {field && inlineEdit === field ? (
        <input autoFocus type={type} value={inlineVal}
          onChange={e => setInlineVal(e.target.value)}
          onBlur={() => inlineSave(field, inlineVal)}
          onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setInlineEdit(null) }}
          style={{ fontSize: 11, color: NAVY, fontWeight: 500, border: `1.5px solid ${GREEN_BG}`, borderRadius: 4, padding: '3px 6px', outline: 'none', width: '55%', textAlign: 'right', background: '#F0FDF4' }} />
      ) : field ? (
        <span onClick={() => startInlineEdit(field, field === 'birthday' ? (person.birthday || '') : (value || ''))}
          style={{ fontSize: 11, color: value ? NAVY : '#C1C7D0', fontWeight: 500, maxWidth: '60%', textAlign: 'right', wordBreak: 'break-word', cursor: 'pointer', padding: '2px 6px', borderRadius: 4 }}
          onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          {value || '—'}
        </span>
      ) : (
        <span style={{ fontSize: 11, color: value ? NAVY : '#C1C7D0', fontWeight: 500, maxWidth: '60%', textAlign: 'right', wordBreak: 'break-word', padding: '2px 6px' }}>
          {value || '—'}
        </span>
      )}
    </div>
  )

  return (
    <>
      {editing && <PersonModal initial={person} onSave={handleEdit} onClose={() => setEditing(false)} saving={editSaving} organizations={organizations} />}
      {showDealForm && <DealFormModal
        initial={{ company_name: person.organization || '', contact_name: person.name || '', contact_email: person.email || '', linkedin_url: person.linkedin_url || '' }}
        pipelines={pipelines} stages={allStages}
        onSave={createDealForPerson} onClose={() => setShowDealForm(false)} saving={dealFormSaving} />}
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(9,30,66,0.54)' }} />
        <div style={{ position: 'relative', width: '92vw', maxWidth: 1100, height: '88vh', background: WHITE, borderRadius: 4, boxShadow: '0 8px 40px rgba(9,30,66,0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#D1FAE5', color: '#065F46', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
              {initials(person.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: NAVY, lineHeight: 1.3 }}>{person.name}</h2>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                {person.role && <span style={{ fontSize: 11, color: SUBTLE }}>{person.role}</span>}
                {person.role && person.organization && <span style={{ color: '#DFE1E6' }}>|</span>}
                {person.organization && <span style={{ fontSize: 11, color: '#0052CC' }}>{person.organization}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
              <button onClick={() => setShowDealForm(true)}
                style={{ padding: '5px 10px', background: GREEN_BG, color: WHITE, border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                onMouseEnter={e => e.currentTarget.style.background = '#388e3c'}
                onMouseLeave={e => e.currentTarget.style.background = GREEN_BG}>
                + Deal
              </button>
              <div style={{ position: 'relative' }}>
                <button onMouseDown={e => e.stopPropagation()} onClick={() => setHeaderMenu(v => !v)}
                  style={{ width: 28, height: 28, background: '#F7F8FA', border: `1px solid ${BORDER}`, borderRadius: 2, cursor: 'pointer', color: NAVY, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, letterSpacing: 1, lineHeight: 1 }}>⋯</button>
                {headerMenu && (
                  <div onMouseDown={e => e.stopPropagation()} style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 2, boxShadow: '0 2px 8px rgba(9,30,66,0.15)', zIndex: 100, minWidth: 150, padding: '3px 0' }}>
                    <button onClick={() => { toggleStar(); setHeaderMenu(false) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: NAVY, textAlign: 'left' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      <span style={{ fontSize: 12, color: person.starred ? '#FF8B00' : '#C1C7D0' }}>★</span>
                      {person.starred ? 'Remove star' : 'Star contact'}
                    </button>
                    <button onClick={() => { setEditing(true); setHeaderMenu(false) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: NAVY, textAlign: 'left' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      <span style={{ fontSize: 11 }}>✎</span> Edit contact
                    </button>
                    <div style={{ height: 1, background: '#F4F5F7', margin: '2px 0' }} />
                    <button onClick={() => { handleDelete(); setHeaderMenu(false) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#BF2600', textAlign: 'left' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FFF5F5'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      Delete contact
                    </button>
                  </div>
                )}
              </div>
              <button onClick={onClose} style={{ width: 28, height: 28, background: '#F7F8FA', border: `1px solid ${BORDER}`, borderRadius: 2, cursor: 'pointer', color: NAVY, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 300, lineHeight: 1 }}>×</button>
            </div>
          </div>

          {/* Two-column body */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* LEFT COLUMN */}
            <div style={{ width: 300, flexShrink: 0, borderRight: `1px solid ${BORDER}`, overflowY: 'auto', padding: '0 16px 16px' }}>
              {sectionHdr('summary', 'Summary')}
              {!collapsedSections.summary && (
                <div>
                  <div style={{ marginBottom: 10 }}><TagManager entityType="person" entityId={person.id} /></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {person.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                        <span style={{ width: 20, height: 20, borderRadius: 4, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}>✉</span>
                        <a href={`mailto:${person.email}`} style={{ color: '#0052CC', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis' }}>{person.email}</a>
                      </div>
                    )}
                    {person.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                        <span style={{ width: 20, height: 20, borderRadius: 4, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}>☎</span>
                        <a href={`tel:${person.phone}`} style={{ color: NAVY, textDecoration: 'none' }}>{person.phone}</a>
                      </div>
                    )}
                    {person.linkedin_url && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                        <span style={{ width: 20, height: 20, borderRadius: 4, background: '#EEF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#0A66C2', fontWeight: 700, flexShrink: 0 }}>in</span>
                        <a href={person.linkedin_url} target="_blank" rel="noreferrer" style={{ color: '#0052CC', textDecoration: 'none', fontSize: 12 }}>LinkedIn Profile</a>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div style={{ height: 1, background: '#F4F5F7', margin: '8px 0' }} />
              {sectionHdr('details', 'Details')}
              {!collapsedSections.details && (
                <div>
                  {detailRow('First name', person.name?.split(' ')[0], 'first_name')}
                  {detailRow('Last name', person.name?.split(' ').slice(1).join(' '), 'last_name')}
                  {detailRow('Role', person.role, 'role')}
                  {detailRow('Label', person.label, 'label')}
                  {detailRow('Email', person.email, 'email', 'email')}
                  {detailRow('Phone', person.phone, 'phone', 'tel')}
                  {detailRow('Birthday', person.birthday ? fmtDate(person.birthday) : null, 'birthday', 'date')}
                  {detailRow('LinkedIn', person.linkedin_url, 'linkedin_url', 'url')}
                </div>
              )}
              <div style={{ height: 1, background: '#F4F5F7', margin: '8px 0' }} />
              {sectionHdr('org', 'Organization')}
              {!collapsedSections.org && (
                <div>
                  {inlineEdit === 'organization' ? (
                    <div style={{ position: 'relative' }}>
                      <input autoFocus value={inlineVal} onChange={e => setInlineVal(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { inlineSave('organization', inlineVal); } if (e.key === 'Escape') setInlineEdit(null) }}
                        placeholder="Type organization name..."
                        style={{ width: '100%', boxSizing: 'border-box', padding: '6px 10px', borderRadius: 2, border: `1.5px solid ${GREEN_BG}`, fontSize: 12, color: NAVY, background: '#F0FDF4', outline: 'none' }} />
                      {organizations.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 2, boxShadow: '0 2px 8px rgba(9,30,66,0.15)', zIndex: 80, maxHeight: 160, overflowY: 'auto' }}>
                          {organizations.filter(o => !inlineVal || o.name.toLowerCase().includes(inlineVal.toLowerCase())).slice(0, 8).map(o => (
                            <button key={o.id} onClick={() => inlineSave('organization', o.name)}
                              style={{ display: 'block', width: '100%', padding: '6px 10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: NAVY, textAlign: 'left' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
                              onMouseLeave={e => e.currentTarget.style.background = 'none'}>{o.name}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : person.organization ? (
                    <div style={{ padding: '6px 10px', background: '#F8FAFC', borderRadius: 2, border: `1px solid ${BORDER}`, cursor: 'pointer' }}
                      onClick={() => startInlineEdit('organization', person.organization)}
                      onMouseEnter={e => e.currentTarget.style.background = '#EEF2F7'}
                      onMouseLeave={e => e.currentTarget.style.background = '#F8FAFC'}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#0052CC', marginBottom: 2 }}>{person.organization}</div>
                      {person.role && <div style={{ fontSize: 10, color: SUBTLE }}>{person.role}</div>}
                    </div>
                  ) : (
                    <div onClick={() => startInlineEdit('organization', '')}
                      style={{ fontSize: 11, color: '#97A0AF', padding: '6px 10px', background: '#FAFBFC', borderRadius: 2, border: `1px dashed ${BORDER}`, cursor: 'pointer', textAlign: 'center' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = GREEN_BG}
                      onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}>
                      + Add organization
                    </div>
                  )}
                </div>
              )}
              <div style={{ height: 1, background: '#F4F5F7', margin: '8px 0' }} />
              {sectionHdr('deals', `Deals (${linkedDeals.length})`)}
              {!collapsedSections.deals && (
                <div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input placeholder="Link a deal..." value={linkSearch}
                        onChange={e => { setLinkSearch(e.target.value); setShowLinkDrop(true) }}
                        onFocus={() => setShowLinkDrop(true)}
                        style={{ ...miniInput, fontSize: 11, width: '100%', boxSizing: 'border-box' }} />
                      {showLinkDrop && filteredDeals.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 2, boxShadow: '0 2px 8px rgba(9,30,66,0.15)', zIndex: 50, maxHeight: 140, overflowY: 'auto', marginTop: 2 }}>
                          {filteredDeals.slice(0, 6).map(deal => (
                            <button key={deal.id} onClick={() => linkDeal(deal)} disabled={linkSaving}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '6px 10px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 11 }}
                              onMouseEnter={e => e.currentTarget.style.background = BG}
                              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                              <span style={{ fontSize: 10, padding: '1px 4px', borderRadius: 3, background: stageC(deal.stage).bg, color: stageC(deal.stage).color, fontWeight: 600, flexShrink: 0 }}>
                                {stages.find(s => (s.id ?? s.name) === deal.stage)?.label ?? deal.stage}
                              </span>
                              <span style={{ color: NAVY, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deal.company_name}</span>
                              <span style={{ color: SUBTLE, fontSize: 10, flexShrink: 0 }}>{fmt$(deal.deal_value)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={() => setShowDealForm(true)}
                      style={{ padding: '4px 10px', background: GREEN_BG, color: WHITE, border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      + New deal
                    </button>
                  </div>
                  {linkedDeals.length === 0 ? (
                    <div style={{ fontSize: 11, color: '#97A0AF', padding: '4px 0' }}>No deals linked</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {linkedDeals.map(deal => (
                        <div key={deal.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', background: '#F8FAFC', borderRadius: 2, border: `1px solid ${BORDER}`, cursor: 'pointer' }}
                          onClick={() => onOpenDeal(deal)}
                          onMouseEnter={e => e.currentTarget.style.background = '#EEF2F7'}
                          onMouseLeave={e => e.currentTarget.style.background = '#F8FAFC'}>
                          <span style={{ fontSize: 10, padding: '1px 4px', borderRadius: 3, background: stageC(deal.stage).bg, color: stageC(deal.stage).color, fontWeight: 600, flexShrink: 0 }}>
                            {stages.find(s => (s.id ?? s.name) === deal.stage)?.label ?? deal.stage}
                          </span>
                          <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deal.company_name}</span>
                          <span style={{ fontSize: 11, color: SUBTLE, flexShrink: 0 }}>{fmt$(deal.deal_value)}</span>
                          <button onClick={e => { e.stopPropagation(); unlinkDeal(deal.id) }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DFE1E6', fontSize: 13, padding: '0 2px', flexShrink: 0 }}
                            onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.color = '#BF2600' }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#DFE1E6' }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div style={{ height: 1, background: '#F4F5F7', margin: '8px 0' }} />
              {sectionHdr('notes', 'Notes')}
              {!collapsedSections.notes && (
                <textarea value={notesVal} onChange={e => setNotesVal(e.target.value)} onBlur={saveNotes}
                  placeholder="Add notes about this person..."
                  style={{ ...miniInput, width: '100%', resize: 'vertical', minHeight: 64, boxSizing: 'border-box', fontSize: 11 }} />
              )}
              <div style={{ height: 1, background: '#F4F5F7', margin: '8px 0' }} />
              {sectionHdr('overview', 'Overview')}
              {!collapsedSections.overview && (
                <div>
                  {detailRow('Inactive days', inactiveDays != null ? `${inactiveDays} day${inactiveDays !== 1 ? 's' : ''}` : '—')}
                  {detailRow('Created', fmtDate(person.created_at))}
                  {detailRow('Last updated', fmtDate(person.updated_at))}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, padding: '0 16px', flexShrink: 0 }}>
                {[
                  { id: 'activity', label: 'Activity', count: activities.length },
                  { id: 'notes', label: 'Notes' },
                  { id: 'calls', label: 'Calls', count: activities.filter(a => a.type === 'call').length },
                  { id: 'emails', label: 'Emails', count: activities.filter(a => a.type === 'email').length },
                  { id: 'meetings', label: 'Meetings', count: activities.filter(a => a.type === 'meeting').length },
                ].map(t => (
                  <button key={t.id} onClick={() => { setTab(t.id); if (['calls', 'emails', 'meetings'].includes(t.id)) setActTypeFilter(t.id === 'calls' ? 'call' : t.id === 'emails' ? 'email' : 'meeting'); else if (t.id === 'activity') setActTypeFilter('all') }}
                    style={{ padding: '8px 12px', background: 'none', border: 'none', borderBottom: (tab === t.id) ? `2px solid ${GREEN_BG}` : '2px solid transparent', color: tab === t.id ? GREEN_BG : SUBTLE, cursor: 'pointer', fontSize: 11, fontWeight: tab === t.id ? 700 : 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {t.label}
                    {t.count > 0 && <span style={{ fontSize: 9, background: tab === t.id ? '#E8F5E9' : '#F4F5F7', color: tab === t.id ? '#2E7D32' : SUBTLE, padding: '1px 4px', borderRadius: 2, fontWeight: 600 }}>{t.count}</span>}
                  </button>
                ))}
              </div>

              <div onClick={() => { if (actMenu) setActMenu(null) }} style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
                {(tab === 'activity' || tab === 'calls' || tab === 'emails' || tab === 'meetings') && (
                  <>
                    {!addingActivity ? (
                      <div onClick={() => setAddingActivity(true)}
                        style={{ padding: '8px 14px', background: '#FAFBFC', border: `1.5px dashed #C1C7D0`, borderRadius: 2, color: SUBTLE, cursor: 'pointer', fontSize: 11, marginBottom: 10 }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = GREEN_BG}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#C1C7D0'}>
                        + Click here to add an activity
                      </div>
                    ) : (
                      <div style={{ background: '#F8FAFC', borderRadius: 2, padding: 12, marginBottom: 10, border: `1px solid ${BORDER}` }}>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                          <select value={newActivity.type} onChange={e => setNewActivity(p => ({ ...p, type: e.target.value }))}
                            style={{ ...miniInput, width: 'auto', flex: '0 0 auto', fontSize: 12 }}>
                            {['note', 'call', 'email', 'meeting'].map(t => (
                              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                            ))}
                          </select>
                          <input type="date" value={newActivity.occurred_at} onChange={e => setNewActivity(p => ({ ...p, occurred_at: e.target.value }))}
                            style={{ ...miniInput, flex: 1, fontSize: 12 }} />
                        </div>
                        <input placeholder="Title (optional)" value={newActivity.title}
                          onChange={e => setNewActivity(p => ({ ...p, title: e.target.value }))}
                          style={{ ...inputSt, marginBottom: 8, fontSize: 12 }} />
                        <textarea placeholder="What happened?" value={newActivity.body}
                          onChange={e => setNewActivity(p => ({ ...p, body: e.target.value }))}
                          style={{ ...inputSt, resize: 'vertical', minHeight: 64, marginBottom: 8, fontSize: 12 }} />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => saveActivity()} disabled={savingAct || !newActivity.body.trim()}
                            style={{ padding: '5px 14px', background: GREEN_BG, color: WHITE, border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 11, fontWeight: 600, opacity: savingAct || !newActivity.body.trim() ? 0.5 : 1 }}>
                            {savingAct ? 'Saving...' : 'Log activity'}
                          </button>
                          <button onClick={() => setAddingActivity(false)} style={{ padding: '5px 14px', background: WHITE, color: SUBTLE, border: `1px solid ${BORDER}`, borderRadius: 2, cursor: 'pointer', fontSize: 11 }}>Cancel</button>
                        </div>
                      </div>
                    )}

                    {tab === 'activity' && activities.length > 0 && (
                      <div style={{ display: 'flex', gap: 5, marginBottom: 10, flexWrap: 'wrap' }}>
                        {['all', 'note', 'call', 'email', 'meeting'].map(f => (
                          <button key={f} onClick={() => setActTypeFilter(f)} style={{
                            padding: '3px 10px', fontSize: 10, borderRadius: 2, cursor: 'pointer', border: 'none',
                            background: actTypeFilter === f ? GREEN_BG : '#F4F5F7',
                            color: actTypeFilter === f ? WHITE : SUBTLE, fontWeight: actTypeFilter === f ? 700 : 500,
                          }}>
                            {f === 'all' ? 'All' : (actTypeIcon[f] + ' ' + f.charAt(0).toUpperCase() + f.slice(1))}
                          </button>
                        ))}
                      </div>
                    )}

                    {displayedActivities.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: '#97A0AF', fontSize: 13 }}>
                        {activities.length === 0 ? 'No activities recorded yet' : 'No activities match this filter'}
                      </div>
                    ) : (
                      <div style={{ position: 'relative', paddingLeft: 20 }}>
                        <div style={{ position: 'absolute', left: 7, top: 4, bottom: 4, width: 2, background: '#EBECF0', borderRadius: 1 }} />
                        {displayedActivities.map(act => {
                          const overdue = isOverdue(act)
                          return (
                            <div key={act.id} style={{ position: 'relative', marginBottom: 12, zIndex: actMenu === act.id ? 70 : 1 }}>
                              <div style={{ position: 'absolute', left: -16, top: 10, width: 16, height: 16, borderRadius: '50%', background: act.done ? '#D1FAE5' : (overdue ? '#FFEBE6' : WHITE), border: `2px solid ${act.done ? GREEN_BG : (overdue ? '#BF2600' : '#DFE1E6')}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8 }}>
                                {act.done ? '✓' : actTypeIcon[act.type]?.charAt(0) || '•'}
                              </div>
                              {editingAct === act.id ? (
                                <div style={{ padding: '10px 12px', background: '#F8FAFC', borderRadius: 2, border: `1.5px solid ${GREEN_BG}`, marginLeft: 8 }}>
                                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                    <select value={editActForm.type} onChange={e => setEditActForm(p => ({ ...p, type: e.target.value }))}
                                      style={{ ...miniInput, width: 'auto', flex: '0 0 auto', fontSize: 12 }}>
                                      {['note', 'call', 'email', 'meeting'].map(t => (
                                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                      ))}
                                    </select>
                                    <input type="date" value={editActForm.occurred_at} onChange={e => setEditActForm(p => ({ ...p, occurred_at: e.target.value }))}
                                      style={{ ...miniInput, flex: 1, fontSize: 12 }} />
                                  </div>
                                  <textarea placeholder="What happened?" value={editActForm.body}
                                    onChange={e => setEditActForm(p => ({ ...p, body: e.target.value }))}
                                    style={{ ...inputSt, resize: 'vertical', minHeight: 56, marginBottom: 8, fontSize: 12 }} />
                                  <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={saveEditActivity} disabled={!editActForm.body.trim()} style={{ padding: '5px 12px', background: GREEN_BG, color: WHITE, border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Save</button>
                                    <button onClick={() => setEditingAct(null)} style={{ padding: '5px 12px', background: WHITE, color: SUBTLE, border: `1px solid ${BORDER}`, borderRadius: 2, cursor: 'pointer', fontSize: 11 }}>Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ padding: '8px 12px', background: act.done ? '#FAFBFC' : (overdue ? '#FFFBFA' : WHITE), borderRadius: 2, border: `1px solid ${overdue ? '#FFCCC7' : BORDER}`, opacity: act.done ? 0.8 : 1, marginLeft: 8 }}>
                                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                    <button onClick={() => toggleDone(act)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, padding: 0, flexShrink: 0, color: act.done ? GREEN_BG : '#DFE1E6', lineHeight: 1 }}>
                                      {act.done ? '✅' : '⬜'}
                                    </button>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                        <span style={{ fontSize: 15 }}>{actTypeIcon[act.type] || '📝'}</span>
                                        {act.title && <span style={{ fontSize: 13, fontWeight: 600, color: NAVY, textDecoration: act.done ? 'line-through' : 'none' }}>{act.title}</span>}
                                        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 2, background: '#F4F5F7', color: SUBTLE, fontWeight: 500 }}>{act.type}</span>
                                      </div>
                                      {act.body && <div style={{ fontSize: 12, color: SUBTLE, lineHeight: 1.6, marginBottom: 4 }}>{act.body}</div>}
                                      <div style={{ fontSize: 11, color: '#97A0AF', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        <span>{fmtDate(act.occurred_at)}</span>
                                        {act.due_date && (
                                          <span style={{ color: overdue ? '#BF2600' : SUBTLE, fontWeight: overdue ? 600 : 400 }}>
                                            {overdue ? 'Overdue: ' : 'Due: '}{fmtDate(act.due_date)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div style={{ position: 'relative', flexShrink: 0 }}>
                                      <button onClick={e => { e.stopPropagation(); setActMenu(actMenu === act.id ? null : act.id) }}
                                        style={{ width: 26, height: 26, background: 'none', border: 'none', borderRadius: 2, cursor: 'pointer', color: NAVY, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, lineHeight: 1 }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
                                        onMouseLeave={e => { if (actMenu !== act.id) e.currentTarget.style.background = 'none' }}>⋯</button>
                                      {actMenu === act.id && (
                                        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 2, boxShadow: '0 2px 8px rgba(9,30,66,0.15)', zIndex: 100, minWidth: 130, padding: '3px 0' }}>
                                          <button onClick={() => { toggleDone(act); setActMenu(null) }}
                                            style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '6px 10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: NAVY, textAlign: 'left' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                            {act.done ? 'Mark undone' : 'Mark done'}
                                          </button>
                                          <button onClick={() => startEditActivity(act)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '6px 10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: NAVY, textAlign: 'left' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                            Edit
                                          </button>
                                          <div style={{ height: 1, background: '#F4F5F7', margin: '2px 0' }} />
                                          <button onClick={() => deleteActivity(act.id)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '6px 10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#BF2600', textAlign: 'left' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#FFF5F5'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                            Delete
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}

                {tab === 'notes' && (
                  <div>
                    <textarea value={notesVal} onChange={e => setNotesVal(e.target.value)} onBlur={saveNotes}
                      placeholder="Write notes about this person..."
                      style={{ ...inputSt, width: '100%', resize: 'vertical', minHeight: 200, boxSizing: 'border-box', fontSize: 13, lineHeight: 1.6 }} />
                    <div style={{ fontSize: 10, color: '#97A0AF', marginTop: 6 }}>Auto-saves when you click away</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Main ContactsSection (Pipedrive-style People page) ────────────────────────
export default function ContactsSection({ stages = [], deals, onOpenDeal, addPersonOpen, onAddPersonClose, addPersonInitial }) {
  const location = useLocation()
  const [people, setPeople] = useState([])
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [selectedPerson, setSelectedPerson] = useState(null)
  const [addModal, setAddModal] = useState(false)
  const [addSaving, setAddSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [rowMenu, setRowMenu] = useState(null)
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false)
  const [columns, setColumns] = useState(() => ALL_COLUMNS.map(c => ({ ...c, visible: c.default })))
  const [filters, setFilters] = useState([])
  const [showAddBtn, setShowAddBtn] = useState(false)
  const [moreMenu, setMoreMenu] = useState(false)
  const csvInputRef = useRef(null)
  const [csvImporting, setCsvImporting] = useState(false)

  const load = useCallback(async () => {
    try {
      const [data, orgsData] = await Promise.all([peopleApi.getPeople(), peopleApi.getOrganizations()])
      setPeople(data)
      setOrgs(orgsData)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const openId = new URLSearchParams(location.search).get('open')
    if (openId && people.length) {
      const person = people.find(p => String(p.id) === openId)
      if (person) openPerson(person)
      window.history.replaceState({}, '', location.pathname)
    }
  }, [location.search, people])

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside() {
      if (showAddBtn) setShowAddBtn(false)
      if (moreMenu) setMoreMenu(false)
      if (rowMenu) setRowMenu(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showAddBtn, moreMenu, rowMenu])

  useEffect(() => {
    if (addPersonOpen) { setAddModal(addPersonInitial || {}); onAddPersonClose?.() }
  }, [addPersonOpen, onAddPersonClose])

  // Clear selection when search changes to prevent operating on hidden items
  useEffect(() => { setSelectedIds(new Set()) }, [search])

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(''), 5000)
    return () => clearTimeout(t)
  }, [error])

  async function openPerson(person) {
    try {
      const detail = await peopleApi.getPersonDetail(person.id)
      setSelectedPerson(detail)
    } catch { setSelectedPerson(person) }
  }

  async function handleCreate(form) {
    setAddSaving(true)
    try {
      const person = await peopleApi.createPerson(form)
      setPeople(prev => [{ ...person, open_deals: 0, closed_deals: 0 }, ...prev])
      setAddModal(false)
    } catch (e) { setError(e.message) }
    setAddSaving(false)
  }

  async function handleCsvImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setCsvImporting(true)
    try {
      const text = await file.text()
      const lines = text.split(/\r?\n/).filter(Boolean)
      if (lines.length < 2) { alert('CSV must have a header row and at least one data row.'); setCsvImporting(false); return }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))
      let created = 0, failed = 0
      for (const line of lines.slice(1)) {
        const vals = line.split(',')
        const row = Object.fromEntries(headers.map((h, i) => [h, (vals[i] || '').trim()]))
        if (!row.name?.trim()) { failed++; continue }
        try {
          await peopleApi.createPerson({
            name: row.name, email: row.email || '', phone: row.phone || '',
            organization: row.organization || '', role: row.role || '',
            linkedin_url: row.linkedin_url || '', notes: row.notes || '',
            label: row.label || '', birthday: row.birthday || ''
          })
          created++
        } catch { failed++ }
      }
      await load()
      alert(`Import complete: ${created} contacts created${failed > 0 ? `, ${failed} skipped` : ''}.`)
    } catch (err) { alert('CSV import failed: ' + err.message) }
    setCsvImporting(false)
  }

  function downloadPeopleTemplate() {
    const csv = 'name,email,phone,organization,role,linkedin_url,notes,label,birthday\nJohn Smith,john@acme.com,+1 555 0123,Acme Corp,Marketing Manager,https://linkedin.com/in/johnsmith,Key decision maker,hot,1985-03-15\nJane Doe,jane@techstart.io,+1 555 0456,TechStart Inc,CEO,https://linkedin.com/in/janedoe,Founder and CEO,warm,1990-07-22\n'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'people_import_template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  function handleUpdated(updated) {
    setPeople(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))
    setSelectedPerson(prev => prev ? { ...prev, ...updated } : prev)
  }

  function handleDeleted(id) {
    setPeople(prev => prev.filter(p => p.id !== id))
    setSelectedPerson(null)
    setSelectedIds(prev => { const s = new Set(prev); s.delete(id); return s })
  }

  function toggleSort(col) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selectedIds.size} contact${selectedIds.size !== 1 ? 's' : ''}? This cannot be undone.`)) return
    setBulkDeleting(true)
    for (const id of [...selectedIds]) {
      try { await peopleApi.deletePerson(id) } catch {}
    }
    setPeople(prev => prev.filter(p => !selectedIds.has(p.id)))
    if (selectedPerson && selectedIds.has(selectedPerson.id)) setSelectedPerson(null)
    setSelectedIds(new Set())
    setBulkDeleting(false)
  }

  function addFilter() {
    setFilters(prev => [...prev, { field: 'name', op: 'contains', value: '' }])
  }

  function updateFilter(idx, updates) {
    setFilters(prev => prev.map((f, i) => i === idx ? { ...f, ...updates } : f))
  }

  function removeFilter(idx) {
    setFilters(prev => prev.filter((_, i) => i !== idx))
  }

  const filtered = useMemo(() => {
    return people
      .filter(p => {
        if (search && ![p.name, p.email, p.organization, p.role, p.phone].some(v => v?.toLowerCase().includes(search.toLowerCase()))) return false
        for (const f of filters) {
          if (!f.value && !['is_empty', 'is_not_empty'].includes(f.op)) continue
          if (!matchFilter(p, f)) return false
        }
        return true
      })
      .sort((a, b) => {
        const av = a[sortBy] ?? '', bv = b[sortBy] ?? ''
        if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av
        const as = av.toString().toLowerCase(), bs = bv.toString().toLowerCase()
        if (as < bs) return sortDir === 'asc' ? -1 : 1
        if (as > bs) return sortDir === 'asc' ? 1 : -1
        return 0
      })
  }, [people, search, sortBy, sortDir, filters])

  const allSelected = filtered.length > 0 && filtered.every(p => selectedIds.has(p.id))
  const visibleCols = columns.filter(c => c.visible)

  function renderCellValue(person, colKey) {
    switch (colKey) {
      case 'name':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#E8F5E9', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
              {initials(person.name)}
            </div>
            <span style={{ fontWeight: 500, color: '#1976d2', fontSize: 12 }}>{person.name}</span>
          </div>
        )
      case 'organization':
        return <span style={{ color: NAVY }}>{person.organization || ''}</span>
      case 'email':
        if (!person.email) return <span style={{ color: '#bbb' }}></span>
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <a href={`mailto:${person.email}`} onClick={e => e.stopPropagation()} style={{ color: NAVY, textDecoration: 'none', fontSize: 11 }}>{person.email}</a>
            <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 2, background: '#F5F5F5', color: '#999', fontWeight: 500 }}>
              {person.email_type || 'work'}
            </span>
          </div>
        )
      case 'phone':
        if (!person.phone) return <span style={{ color: '#bbb' }}></span>
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <a href={`tel:${person.phone}`} onClick={e => e.stopPropagation()} style={{ color: '#1976d2', textDecoration: 'none', fontSize: 11 }}>{person.phone}</a>
          </div>
        )
      case 'closed_deals':
        return <span style={{ color: NAVY }}>{parseInt(person.closed_deals) || 0}</span>
      case 'open_deals':
        return <span style={{ color: NAVY }}>{parseInt(person.open_deals) || 0}</span>
      case 'role':
        return <span style={{ color: SUBTLE }}>{person.role || person.label || ''}</span>
      case 'created_at':
        return <span style={{ color: SUBTLE, whiteSpace: 'nowrap' }}>{fmtDate(person.created_at)}</span>
      case 'updated_at':
        return <span style={{ color: SUBTLE, whiteSpace: 'nowrap' }}>{fmtDate(person.updated_at)}</span>
      case 'linkedin_url':
        if (!person.linkedin_url) return ''
        return <a href={person.linkedin_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ color: '#0A66C2', textDecoration: 'none', fontSize: 12 }}>Profile</a>
      case 'birthday':
        return <span style={{ color: SUBTLE }}>{person.birthday ? fmtDate(person.birthday) : ''}</span>
      case 'notes':
        return <span style={{ color: SUBTLE, fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>{person.notes || ''}</span>
      case 'owner':
        return <span style={{ color: SUBTLE }}>{person.owner || ''}</span>
      case 'visible_to':
        return <span style={{ color: SUBTLE }}>{person.visible_to || ''}</span>
      case 'won_deals':
        return <span style={{ color: '#2e7d32' }}>{parseInt(person.won_deals) || 0}</span>
      case 'lost_deals':
        return <span style={{ color: '#d32f2f' }}>{parseInt(person.lost_deals) || 0}</span>
      case 'total_activities':
        return <span style={{ color: NAVY }}>{parseInt(person.total_activities) || 0}</span>
      case 'done_activities':
        return <span style={{ color: NAVY }}>{parseInt(person.done_activities) || 0}</span>
      case 'activities_to_do':
        return <span style={{ color: NAVY }}>{parseInt(person.activities_to_do) || 0}</span>
      case 'last_activity_date':
        return <span style={{ color: SUBTLE, whiteSpace: 'nowrap' }}>{person.last_activity_date ? fmtDate(person.last_activity_date) : ''}</span>
      default:
        return ''
    }
  }

  return (
    <>
      {addModal !== false && (
        <PersonModal
          initial={addModal && Object.keys(addModal).length ? addModal : null}
          onSave={handleCreate}
          onClose={() => setAddModal(false)}
          saving={addSaving}
          organizations={orgs}
        />
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%', background: WHITE }}>

        {/* ─── Top toolbar ─── */}
        <div style={{ padding: '6px 16px', borderBottom: `1px solid #E0E0E0`, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Green + Person split button */}
          <div style={{ position: 'relative', display: 'flex' }}>
            <button onClick={() => setAddModal({})}
              style={{ padding: '5px 12px', background: GREEN_BG, color: WHITE, border: 'none', borderTopLeftRadius: 2, borderBottomLeftRadius: 2, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
              onMouseEnter={e => e.currentTarget.style.background = GREEN_HOVER}
              onMouseLeave={e => e.currentTarget.style.background = GREEN_BG}>
              <span style={{ fontSize: 13, lineHeight: 1 }}>+</span> Person
            </button>
            <button onMouseDown={e => e.stopPropagation()} onClick={() => setShowAddBtn(v => !v)}
              style={{ padding: '5px 6px', background: GREEN_HOVER, color: WHITE, border: 'none', borderTopRightRadius: 2, borderBottomRightRadius: 2, cursor: 'pointer', borderLeft: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center' }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            {showAddBtn && (
              <div onMouseDown={e => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, marginTop: 3, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 100, minWidth: 170, padding: '3px 0' }}>
                <button onClick={() => { setAddModal({}); setShowAddBtn(false) }}
                  style={{ display: 'block', width: '100%', padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: NAVY, textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>Add person manually</button>
                <button onClick={() => { csvInputRef.current?.click(); setShowAddBtn(false) }}
                  style={{ display: 'block', width: '100%', padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: NAVY, textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>Import from spreadsheet</button>
              </div>
            )}
          </div>

          <div style={{ flex: 1 }} />

          {/* Right side: count + filter + search + gear + more */}
          <span style={{ fontSize: 12, fontWeight: 500, color: NAVY }}>
            {filtered.length} {filtered.length === 1 ? 'person' : 'people'}
          </span>

          <button onClick={() => { if (filters.length === 0) addFilter() }}
            style={{ padding: '4px 10px', background: filters.length > 0 ? '#E8F5E9' : WHITE, color: filters.length > 0 ? '#2E7D32' : SUBTLE, border: `1px solid ${filters.length > 0 ? '#A5D6A7' : '#ddd'}`, borderRadius: 2, cursor: 'pointer', fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M1 3h14M4 8h8M6 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Filter
            {filters.length > 0 && <span style={{ background: '#2E7D32', color: WHITE, fontSize: 9, padding: '1px 4px', borderRadius: 2, fontWeight: 700 }}>{filters.length}</span>}
          </button>

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <button onClick={bulkDelete} disabled={bulkDeleting}
              style={{ padding: '4px 10px', background: '#d32f2f', color: WHITE, border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
              {bulkDeleting ? 'Deleting...' : `Delete (${selectedIds.size})`}
            </button>
          )}

          {/* Column customizer gear */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowColumnCustomizer(v => !v)}
              style={{ width: 28, height: 28, background: showColumnCustomizer ? '#F5F5F5' : WHITE, border: `1px solid #ddd`, borderRadius: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Customize columns">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <path d="M10 13a3 3 0 100-6 3 3 0 000 6z" stroke="#666" strokeWidth="1.5"/>
                <path d="M10 1v2M10 17v2M18.36 10H20M0 10h1.64M15.66 4.34l1.41-1.41M2.93 17.07l1.41-1.41M15.66 15.66l1.41 1.41M2.93 2.93l1.41 1.41" stroke="#666" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </button>
            {showColumnCustomizer && <ColumnCustomizer columns={columns} onColumnsChange={setColumns} onClose={() => setShowColumnCustomizer(false)} />}
          </div>

          {/* More menu */}
          <div style={{ position: 'relative' }}>
            <button onMouseDown={e => e.stopPropagation()} onClick={() => setMoreMenu(v => !v)}
              style={{ width: 28, height: 28, background: WHITE, border: `1px solid #ddd`, borderRadius: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#666', fontWeight: 700 }}>
              ⋯
            </button>
            {moreMenu && (
              <div onMouseDown={e => e.stopPropagation()} style={{ position: 'absolute', top: '100%', right: 0, marginTop: 3, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 100, minWidth: 150, padding: '3px 0' }}>
                <button onClick={() => { peopleApi.exportContacts(); setMoreMenu(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: NAVY, textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <span style={{ fontSize: 12 }}>↑</span> Export filter results
                </button>
                <div style={{ height: 1, background: '#f0f0f0', margin: '4px 0' }} />
                <button onClick={() => { csvInputRef.current?.click(); setMoreMenu(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: NAVY, textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <span style={{ fontSize: 14 }}>↓</span> Import data
                </button>
                <button onClick={() => { downloadPeopleTemplate(); setMoreMenu(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: NAVY, textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <span style={{ fontSize: 14 }}>↓</span> Download template
                </button>
              </div>
            )}
          </div>

          {error && <span style={{ fontSize: 11, color: '#d32f2f' }}>{error}</span>}
          <input type="file" accept=".csv" ref={csvInputRef} onChange={handleCsvImport} style={{ display: 'none' }} />
        </div>

        {/* ─── Filter conditions row ─── */}
        {filters.length > 0 && (
          <div style={{ padding: '5px 16px', borderBottom: `1px solid #eee`, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', background: '#FAFAFA' }}>
            {filters.map((f, idx) => {
              const fieldDef = FILTER_FIELDS.find(ff => ff.key === f.field)
              const ops = FILTER_OPS[fieldDef?.type || 'text']
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 3, background: WHITE, border: '1px solid #ddd', borderRadius: 2, padding: '2px 4px' }}>
                  <select value={f.field} onChange={e => updateFilter(idx, { field: e.target.value, op: FILTER_OPS[FILTER_FIELDS.find(ff => ff.key === e.target.value)?.type || 'text'][0].key })}
                    style={{ border: 'none', fontSize: 11, color: NAVY, background: 'none', outline: 'none', cursor: 'pointer', fontWeight: 500 }}>
                    {FILTER_FIELDS.map(ff => <option key={ff.key} value={ff.key}>{ff.label}</option>)}
                  </select>
                  <select value={f.op} onChange={e => updateFilter(idx, { op: e.target.value })}
                    style={{ border: 'none', fontSize: 10, color: SUBTLE, background: 'none', outline: 'none', cursor: 'pointer' }}>
                    {ops.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                  </select>
                  {!['is_empty', 'is_not_empty'].includes(f.op) && (
                    <input value={f.value || ''} onChange={e => updateFilter(idx, { value: e.target.value })}
                      placeholder="value"
                      style={{ border: 'none', borderBottom: '1px solid #ddd', fontSize: 11, color: NAVY, outline: 'none', width: 70, padding: '1px 3px' }} />
                  )}
                  <button onClick={() => removeFilter(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 12, padding: '0 2px', lineHeight: 1 }}>×</button>
                </div>
              )
            })}
            <button onClick={addFilter}
              style={{ padding: '3px 8px', background: 'none', border: `1px dashed #bbb`, borderRadius: 2, cursor: 'pointer', fontSize: 10, color: GREEN_BG, fontWeight: 500 }}>
              + Add condition
            </button>
            <button onClick={() => setFilters([])}
              style={{ padding: '3px 8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: '#999' }}>
              Clear all
            </button>
          </div>
        )}

        {/* Add condition shortcut if no filters */}
        {filters.length === 0 && (
          <div style={{ padding: '4px 16px', borderBottom: `1px solid #eee`, background: '#FAFAFA' }}>
            <button onClick={addFilter}
              style={{ padding: '3px 8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: GREEN_BG, fontWeight: 500 }}>
              + Add condition
            </button>
          </div>
        )}

        {/* ─── Table ─── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, color: SUBTLE, fontSize: 13 }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 260, gap: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>👤</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: NAVY }}>No people found</div>
              <div style={{ fontSize: 13, color: SUBTLE }}>Add your first contact to get started</div>
              <button onClick={() => setAddModal({})}
                style={{ padding: '8px 20px', background: GREEN_BG, color: WHITE, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600, marginTop: 4 }}
                onMouseEnter={e => e.currentTarget.style.background = GREEN_HOVER}
                onMouseLeave={e => e.currentTarget.style.background = GREEN_BG}>
                + Add person
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid #e0e0e0` }}>
                  <th style={{ padding: '6px 4px 6px 12px', width: 28, textAlign: 'left' }}>
                    <input type="checkbox" checked={allSelected}
                      onChange={e => {
                        if (e.target.checked) setSelectedIds(new Set(filtered.map(p => p.id)))
                        else setSelectedIds(new Set())
                      }}
                      style={{ cursor: 'pointer', accentColor: GREEN_BG }} />
                  </th>
                  {visibleCols.map(col => (
                    <th key={col.key} onClick={() => toggleSort(col.key)}
                      style={{ padding: '6px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#6B778C', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none', textTransform: 'uppercase', letterSpacing: '0.03em', borderRight: '1px solid #f0f0f0' }}>
                      {col.label}
                      {sortBy === col.key && <span style={{ marginLeft: 3, fontSize: 8, color: '#999' }}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                    </th>
                  ))}
                  <th style={{ width: 32, padding: '6px 6px' }}>
                    <button onClick={() => setShowColumnCustomizer(v => !v)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 11, padding: 0 }}>⚙</button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(person => {
                  const isChecked = selectedIds.has(person.id)
                  return (
                    <tr key={person.id} onClick={() => openPerson(person)}
                      style={{ cursor: 'pointer', borderBottom: `1px solid #F4F5F7`, background: isChecked ? '#F1F8E9' : WHITE }}
                      onMouseEnter={e => { if (!isChecked) e.currentTarget.style.background = '#F8F9FA' }}
                      onMouseLeave={e => { if (!isChecked) e.currentTarget.style.background = WHITE }}>
                      <td style={{ padding: '5px 4px 5px 12px', width: 28 }} onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={isChecked}
                          onChange={e => {
                            const s = new Set(selectedIds)
                            e.target.checked ? s.add(person.id) : s.delete(person.id)
                            setSelectedIds(s)
                          }}
                          style={{ cursor: 'pointer', accentColor: GREEN_BG }} />
                      </td>
                      {visibleCols.map(col => (
                        <td key={col.key} style={{ padding: '5px 10px', color: col.key === 'email' || col.key === 'phone' ? '#1a73e8' : NAVY, borderRight: '1px solid #f8f8f8', fontSize: 11 }}>
                          {renderCellValue(person, col.key)}
                        </td>
                      ))}
                      <td style={{ padding: '5px 6px', textAlign: 'center', position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <button onMouseDown={e => e.stopPropagation()} onClick={() => setRowMenu(rowMenu === person.id ? null : person.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: rowMenu === person.id ? '#666' : '#ccc', fontSize: 14, fontWeight: 700 }}
                          onMouseEnter={e => e.currentTarget.style.color = '#666'}
                          onMouseLeave={e => { if (rowMenu !== person.id) e.currentTarget.style.color = '#ccc' }}>⋯</button>
                        {rowMenu === person.id && (
                          <div onMouseDown={e => e.stopPropagation()} style={{ position: 'absolute', top: '100%', right: 4, marginTop: 2, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 200, minWidth: 120, padding: '3px 0' }}>
                            <button onClick={() => { openPerson(person); setRowMenu(null) }}
                              style={{ display: 'block', width: '100%', padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: NAVY, textAlign: 'left' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
                              onMouseLeave={e => e.currentTarget.style.background = 'none'}>View details</button>
                            <button onClick={() => { setAddModal(person); setRowMenu(null) }}
                              style={{ display: 'block', width: '100%', padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: NAVY, textAlign: 'left' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
                              onMouseLeave={e => e.currentTarget.style.background = 'none'}>Edit</button>
                            <div style={{ height: 1, background: '#f0f0f0', margin: '4px 0' }} />
                            <button onClick={async () => { if (confirm(`Delete "${person.name}"?`)) { try { await peopleApi.deletePerson(person.id); setPeople(prev => prev.filter(p => p.id !== person.id)) } catch {} } setRowMenu(null) }}
                              style={{ display: 'block', width: '100%', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#d32f2f', textAlign: 'left' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#FFF5F5'}
                              onMouseLeave={e => e.currentTarget.style.background = 'none'}>Delete</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Person detail dialog */}
      {selectedPerson && (
        <PersonDetailDialog
          person={selectedPerson}
          deals={deals}
          stages={stages}
          organizations={orgs}
          onClose={() => setSelectedPerson(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
          onOpenDeal={onOpenDeal}
        />
      )}
    </>
  )
}
