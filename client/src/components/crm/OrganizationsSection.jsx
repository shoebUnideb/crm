import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { peopleApi } from '../../lib/crmPeopleApi.js'
import { crmApi } from '../../lib/crmApi.js'
import TagManager from './TagManager.jsx'

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

const DEFAULT_DEAL_STAGES = [
  { id: 'lead', label: 'Lead', probability: 10 },
  { id: 'qualified', label: 'Qualified', probability: 25 },
  { id: 'demo', label: 'Demo', probability: 40 },
  { id: 'proposal', label: 'Proposal', probability: 60 },
  { id: 'negotiation', label: 'Negotiation', probability: 80 },
  { id: 'won', label: 'Won', probability: 100 },
  { id: 'lost', label: 'Lost', probability: 0 },
]

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtDateTime(d) {
  if (!d) return ''
  return new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function fmt$(v) {
  const n = parseFloat(v) || 0
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(0) + 'K'
  return '$' + n.toFixed(0)
}

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

const ALL_COLUMNS = [
  { key: 'name', label: 'Name', default: true, locked: true, entity: 'Organization' },
  { key: 'id', label: 'ID', default: false, entity: 'Organization' },
  { key: 'label', label: 'Labels', default: false, entity: 'Organization' },
  { key: 'email', label: 'Email', default: true, entity: 'Organization' },
  { key: 'phone', label: 'Phone', default: true, entity: 'Organization' },
  { key: 'address', label: 'Address', default: true, entity: 'Organization' },
  { key: 'people_count', label: 'People', default: true, entity: 'Organization' },
  { key: 'closed_deals', label: 'Closed deals', default: true, entity: 'Organization' },
  { key: 'open_deals', label: 'Open deals', default: true, entity: 'Organization' },
  { key: 'industry', label: 'Industry', default: false, entity: 'Organization' },
  { key: 'website', label: 'Website', default: false, entity: 'Organization' },
  { key: 'linkedin', label: 'LinkedIn profile', default: false, entity: 'Organization' },
  { key: 'annual_revenue', label: 'Annual revenue', default: false, entity: 'Organization' },
  { key: 'employees', label: 'Number of employees', default: false, entity: 'Organization' },
  { key: 'owner', label: 'Owner', default: false, entity: 'Organization' },
  { key: 'visible_to', label: 'Visible to', default: false, entity: 'Organization' },
  { key: 'created_at', label: 'Organization created', default: false, entity: 'Organization' },
  { key: 'updated_at', label: 'Update time', default: false, entity: 'Organization' },
  { key: 'last_activity_date', label: 'Last activity date', default: false, entity: 'Organization' },
  { key: 'won_deals', label: 'Won deals', default: false, entity: 'Organization' },
  { key: 'lost_deals', label: 'Lost deals', default: false, entity: 'Organization' },
  { key: 'total_activities', label: 'Total activities', default: false, entity: 'Organization' },
  { key: 'done_activities', label: 'Done activities', default: false, entity: 'Organization' },
  { key: 'activities_to_do', label: 'Activities to do', default: false, entity: 'Organization' },
  { key: 'street', label: 'Street/road name of Address', default: false, entity: 'Organization' },
  { key: 'city', label: 'City/town/village/locality of Address', default: false, entity: 'Organization' },
  { key: 'state', label: 'State/county of Address', default: false, entity: 'Organization' },
  { key: 'region', label: 'Region of Address', default: false, entity: 'Organization' },
  { key: 'country', label: 'Country of Address', default: false, entity: 'Organization' },
  { key: 'zip_code', label: 'ZIP/Postal code of Address', default: false, entity: 'Organization' },
  { key: 'notes', label: 'Notes', default: false, entity: 'Organization' },
]

const FILTER_FIELDS = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'address', label: 'Address', type: 'text' },
  { key: 'industry', label: 'Industry', type: 'text' },
  { key: 'label', label: 'Label', type: 'text' },
  { key: 'owner', label: 'Owner', type: 'text' },
  { key: 'city', label: 'City', type: 'text' },
  { key: 'country', label: 'Country', type: 'text' },
  { key: 'people_count', label: 'People', type: 'number' },
  { key: 'open_deals', label: 'Open deals', type: 'number' },
  { key: 'closed_deals', label: 'Closed deals', type: 'number' },
  { key: 'annual_revenue', label: 'Annual revenue', type: 'number' },
  { key: 'employees', label: 'Employees', type: 'number' },
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
}

function matchFilter(item, filter) {
  const val = item[filter.field]
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
    default: return true
  }
}

// ── Custom Field CRUD Panel ──────────────────────────────────────────────────
function CustomFieldPanel({ onClose, onFieldsChanged }) {
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingField, setEditingField] = useState(null)
  const [form, setForm] = useState({ field_name: '', field_label: '', field_type: 'text', options: '', required: false })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const FIELD_TYPES = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Dropdown' },
    { value: 'multiselect', label: 'Multi-select' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'url', label: 'URL' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'currency', label: 'Currency' },
  ]

  useEffect(() => {
    loadFields()
  }, [])

  async function loadFields() {
    try {
      const data = await peopleApi.getCustomFields('organization')
      setFields(data)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  function startEdit(field) {
    setEditingField(field)
    setForm({
      field_name: field.field_name,
      field_label: field.field_label,
      field_type: field.field_type,
      options: (field.options || []).join(', '),
      required: field.required,
    })
  }

  function startCreate() {
    setEditingField('new')
    setForm({ field_name: '', field_label: '', field_type: 'text', options: '', required: false })
  }

  async function handleSave() {
    if (!form.field_label.trim()) { setError('Label is required'); return }
    setSaving(true)
    setError('')
    const fieldName = form.field_name.trim() || form.field_label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')
    const options = ['select', 'multiselect'].includes(form.field_type)
      ? form.options.split(',').map(s => s.trim()).filter(Boolean)
      : []
    try {
      if (editingField === 'new') {
        await peopleApi.createCustomField({
          entity_type: 'organization',
          field_name: fieldName,
          field_label: form.field_label.trim(),
          field_type: form.field_type,
          options,
          required: form.required,
        })
      } else {
        await peopleApi.updateCustomField(editingField.id, {
          field_label: form.field_label.trim(),
          field_type: form.field_type,
          options,
          required: form.required,
        })
      }
      await loadFields()
      setEditingField(null)
      onFieldsChanged()
    } catch (e) { setError(e.message) }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this custom field? All values will be lost.')) return
    try {
      await peopleApi.deleteCustomField(id)
      await loadFields()
      onFieldsChanged()
    } catch (e) { setError(e.message) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 450, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
      <div style={{ position: 'relative', background: WHITE, borderRadius: 4, width: 520, maxWidth: '92vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
        {/* Header */}
        <div style={{ padding: '14px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: NAVY }}>Custom Fields</h3>
          <button onClick={startCreate}
            style={{ padding: '5px 12px', background: GREEN_BG, color: WHITE, border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
            + New field
          </button>
        </div>

        {error && <div style={{ padding: '6px 20px', color: '#d32f2f', fontSize: 11 }}>{error}</div>}

        {/* Edit/Create Form */}
        {editingField && (
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #eee', background: '#FAFBFC' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: SUBTLE, display: 'block', marginBottom: 3 }}>Label *</label>
                <input value={form.field_label} onChange={e => setForm(f => ({ ...f, field_label: e.target.value }))}
                  placeholder="e.g. Tax ID"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '6px 8px', borderRadius: 2, border: `1px solid ${BORDER}`, fontSize: 12, color: NAVY, outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: SUBTLE, display: 'block', marginBottom: 3 }}>Field type</label>
                <select value={form.field_type} onChange={e => setForm(f => ({ ...f, field_type: e.target.value }))}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '6px 8px', borderRadius: 2, border: `1px solid ${BORDER}`, fontSize: 12, color: NAVY, outline: 'none', background: WHITE }}>
                  {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            {['select', 'multiselect'].includes(form.field_type) && (
              <div style={{ marginTop: 8 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: SUBTLE, display: 'block', marginBottom: 3 }}>Options (comma separated)</label>
                <input value={form.options} onChange={e => setForm(f => ({ ...f, options: e.target.value }))}
                  placeholder="Option 1, Option 2, Option 3"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '6px 8px', borderRadius: 2, border: `1px solid ${BORDER}`, fontSize: 12, color: NAVY, outline: 'none' }} />
              </div>
            )}
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: NAVY, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.required} onChange={e => setForm(f => ({ ...f, required: e.target.checked }))}
                  style={{ accentColor: GREEN_BG }} />
                Required field
              </label>
              {editingField === 'new' && (
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: SUBTLE, display: 'block', marginBottom: 2 }}>API name</label>
                  <input value={form.field_name} onChange={e => setForm(f => ({ ...f, field_name: e.target.value }))}
                    placeholder="auto-generated"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '5px 8px', borderRadius: 2, border: `1px solid ${BORDER}`, fontSize: 11, color: SUBTLE, outline: 'none' }} />
                </div>
              )}
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingField(null)}
                style={{ padding: '5px 12px', background: WHITE, color: NAVY, border: `1px solid ${BORDER}`, borderRadius: 2, cursor: 'pointer', fontSize: 11 }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: '5px 12px', background: GREEN_BG, color: WHITE, border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 11, fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving...' : editingField === 'new' ? 'Create' : 'Update'}
              </button>
            </div>
          </div>
        )}

        {/* Field list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: SUBTLE }}>Loading...</div>
          ) : fields.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: SUBTLE }}>
              <div style={{ fontSize: 12, marginBottom: 4 }}>No custom fields yet</div>
              <div style={{ fontSize: 11 }}>Click "+ New field" to create your first custom field</div>
            </div>
          ) : (
            fields.map(f => (
              <div key={f.id}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 20px', borderBottom: '1px solid #f5f5f5' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FAFBFC'}
                onMouseLeave={e => e.currentTarget.style.background = WHITE}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: NAVY, fontWeight: 500 }}>{f.field_label}</div>
                  <div style={{ fontSize: 10, color: SUBTLE, marginTop: 2 }}>
                    {FIELD_TYPES.find(t => t.value === f.field_type)?.label || f.field_type}
                    {f.required && <span style={{ marginLeft: 8, color: '#d32f2f' }}>Required</span>}
                    {f.options?.length > 0 && <span style={{ marginLeft: 8 }}>({f.options.length} options)</span>}
                  </div>
                </div>
                <button onClick={() => startEdit(f)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUBTLE, fontSize: 11, padding: '3px 6px' }}
                  onMouseEnter={e => e.currentTarget.style.color = NAVY}
                  onMouseLeave={e => e.currentTarget.style.color = SUBTLE}>
                  Edit
                </button>
                <button onClick={() => handleDelete(f.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUBTLE, fontSize: 11, padding: '3px 6px' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#d32f2f'}
                  onMouseLeave={e => e.currentTarget.style.color = SUBTLE}>
                  Delete
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose}
            style={{ padding: '6px 14px', background: WHITE, color: NAVY, border: `1px solid ${BORDER}`, borderRadius: 2, cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Column Customization Panel (Pipedrive-style) ─────────────────────────────
function ColumnCustomizer({ columns, onColumnsChange, onClose, customFields, onCustomFieldsChanged }) {
  const [search, setSearch] = useState('')
  const [localCols, setLocalCols] = useState(columns)
  const [showCustomFieldPanel, setShowCustomFieldPanel] = useState(false)

  useEffect(() => { setLocalCols(columns) }, [columns])

  const all = localCols.filter(c => c.label.toLowerCase().includes(search.toLowerCase()))

  function toggleColumn(key) {
    setLocalCols(prev => prev.map(c => c.key === key ? { ...c, visible: !c.visible } : c))
  }
  function resetDefaults() {
    const defaultCols = ALL_COLUMNS.map((c, i) => ({ ...c, visible: c.default, position: i }))
    const cfCols = customFields.map(cf => ({ key: `cf_${cf.id}`, label: cf.field_label, default: false, entity: 'Custom', visible: false, customField: cf }))
    setLocalCols([...defaultCols, ...cfCols])
  }
  function save() {
    onColumnsChange(localCols)
    onClose()
  }

  return (
    <>
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
      <div style={{ position: 'relative', background: WHITE, borderRadius: 4, width: 480, maxWidth: '92vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
        {/* Header */}
        <div style={{ padding: '14px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: NAVY }}>Customize columns</h3>
          <button onClick={() => setShowCustomFieldPanel(true)}
            style={{ padding: '5px 12px', background: WHITE, color: NAVY, border: `1px solid ${BORDER}`, borderRadius: 2, cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>
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
              <span style={{ fontSize: 11, color: col.entity === 'Custom' ? GREEN_BG : SUBTLE, fontWeight: 500, flexShrink: 0 }}>{col.entity}</span>
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
    {showCustomFieldPanel && (
      <CustomFieldPanel
        onClose={() => setShowCustomFieldPanel(false)}
        onFieldsChanged={onCustomFieldsChanged}
      />
    )}
    </>
  )
}

// ── Add/Edit Organization Modal (Pipedrive-style) ─────────────────────────────
function OrgModal({ initial, onSave, onClose, saving, allOrgs = [] }) {
  const defaults = { name: '', industry: '', website: '', address: '', notes: '', label: '', owner: '', visible_to: 'group', parent_org_id: '', email: '', phone: '', linkedin: '', annual_revenue: '', employees: '', street: '', city: '', state: '', zip_code: '', country: '', region: '' }
  const [form, setForm] = useState({ ...defaults, ...(initial || {}) })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => { setForm({ ...defaults, ...(initial || {}) }) }, [initial?.id])

  const fieldLabel = { display: 'block', fontSize: 11, fontWeight: 500, color: NAVY, marginBottom: 4 }
  const fieldInput = {
    width: '100%', boxSizing: 'border-box', padding: '6px 8px',
    borderRadius: 2, border: `1px solid ${BORDER}`, fontSize: 12,
    color: NAVY, background: WHITE, fontFamily: 'inherit', outline: 'none',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
      <div style={{ position: 'relative', background: WHITE, borderRadius: 4, width: 560, maxWidth: '92vw', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '12px 20px 10px', borderBottom: `1px solid #eee`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: NAVY }}>
            {initial?.id ? 'Edit organization' : 'Add organization'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUBTLE, fontSize: 18, lineHeight: 1 }}>×</button>
        </div>

        {/* Form body */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {/* Name */}
          <div style={{ marginBottom: 12 }}>
            <label style={fieldLabel}>Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Organization name"
              style={fieldInput}
              onFocus={e => e.target.style.borderColor = GREEN_BG}
              onBlur={e => e.target.style.borderColor = BORDER} />
          </div>

          {/* Two-column grid for compact fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={fieldLabel}>Email</label>
              <input value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="email@company.com"
                style={fieldInput} onFocus={e => e.target.style.borderColor = GREEN_BG} onBlur={e => e.target.style.borderColor = BORDER} />
            </div>
            <div>
              <label style={fieldLabel}>Phone</label>
              <input value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+1 234 567 8900"
                style={fieldInput} onFocus={e => e.target.style.borderColor = GREEN_BG} onBlur={e => e.target.style.borderColor = BORDER} />
            </div>
          </div>

          {/* Labels + Owner */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={fieldLabel}>Labels</label>
              <select value={form.label || ''} onChange={e => set('label', e.target.value)} style={{ ...fieldInput, cursor: 'pointer' }}>
                <option value="">Add labels</option>
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
                <option value="customer">Customer</option>
                <option value="partner">Partner</option>
                <option value="prospect">Prospect</option>
              </select>
            </div>
            <div>
              <label style={fieldLabel}>Owner</label>
              <select value={form.owner || ''} onChange={e => set('owner', e.target.value)} style={{ ...fieldInput, cursor: 'pointer' }}>
                <option value="">Select owner</option>
                <option value="you">You</option>
              </select>
            </div>
          </div>

          {/* Industry + Website */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={fieldLabel}>Industry</label>
              <input value={form.industry || ''} onChange={e => set('industry', e.target.value)} placeholder="e.g. Technology"
                style={fieldInput} onFocus={e => e.target.style.borderColor = GREEN_BG} onBlur={e => e.target.style.borderColor = BORDER} />
            </div>
            <div>
              <label style={fieldLabel}>Website</label>
              <input value={form.website || ''} onChange={e => set('website', e.target.value)} placeholder="https://example.com"
                style={fieldInput} onFocus={e => e.target.style.borderColor = GREEN_BG} onBlur={e => e.target.style.borderColor = BORDER} />
            </div>
          </div>

          {/* LinkedIn + Revenue + Employees */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={fieldLabel}>LinkedIn</label>
              <input value={form.linkedin || ''} onChange={e => set('linkedin', e.target.value)} placeholder="LinkedIn URL"
                style={fieldInput} onFocus={e => e.target.style.borderColor = GREEN_BG} onBlur={e => e.target.style.borderColor = BORDER} />
            </div>
            <div>
              <label style={fieldLabel}>Revenue</label>
              <input type="number" value={form.annual_revenue || ''} onChange={e => set('annual_revenue', e.target.value)} placeholder="0"
                style={fieldInput} onFocus={e => e.target.style.borderColor = GREEN_BG} onBlur={e => e.target.style.borderColor = BORDER} />
            </div>
            <div>
              <label style={fieldLabel}>Employees</label>
              <input type="number" value={form.employees || ''} onChange={e => set('employees', e.target.value)} placeholder="0"
                style={fieldInput} onFocus={e => e.target.style.borderColor = GREEN_BG} onBlur={e => e.target.style.borderColor = BORDER} />
            </div>
          </div>

          {/* Address section */}
          <div style={{ marginBottom: 12 }}>
            <label style={fieldLabel}>Address</label>
            <input value={form.address || ''} onChange={e => set('address', e.target.value)} placeholder="Full address"
              style={fieldInput} onFocus={e => e.target.style.borderColor = GREEN_BG} onBlur={e => e.target.style.borderColor = BORDER} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={fieldLabel}>Street</label>
              <input value={form.street || ''} onChange={e => set('street', e.target.value)} placeholder="Street name"
                style={fieldInput} onFocus={e => e.target.style.borderColor = GREEN_BG} onBlur={e => e.target.style.borderColor = BORDER} />
            </div>
            <div>
              <label style={fieldLabel}>City</label>
              <input value={form.city || ''} onChange={e => set('city', e.target.value)} placeholder="City"
                style={fieldInput} onFocus={e => e.target.style.borderColor = GREEN_BG} onBlur={e => e.target.style.borderColor = BORDER} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={fieldLabel}>State/County</label>
              <input value={form.state || ''} onChange={e => set('state', e.target.value)} placeholder="State"
                style={fieldInput} onFocus={e => e.target.style.borderColor = GREEN_BG} onBlur={e => e.target.style.borderColor = BORDER} />
            </div>
            <div>
              <label style={fieldLabel}>ZIP Code</label>
              <input value={form.zip_code || ''} onChange={e => set('zip_code', e.target.value)} placeholder="ZIP"
                style={fieldInput} onFocus={e => e.target.style.borderColor = GREEN_BG} onBlur={e => e.target.style.borderColor = BORDER} />
            </div>
            <div>
              <label style={fieldLabel}>Country</label>
              <input value={form.country || ''} onChange={e => set('country', e.target.value)} placeholder="Country"
                style={fieldInput} onFocus={e => e.target.style.borderColor = GREEN_BG} onBlur={e => e.target.style.borderColor = BORDER} />
            </div>
          </div>

          {/* Visible to */}
          <div style={{ marginBottom: 12 }}>
            <label style={fieldLabel}>Visible to</label>
            <select value={form.visible_to || 'group'} onChange={e => set('visible_to', e.target.value)}
              style={{ ...fieldInput, cursor: 'pointer' }}>
              <option value="owner">Item owner</option>
              <option value="group">Item owner's visibility group</option>
              <option value="everyone">Entire company</option>
            </select>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 12 }}>
            <label style={fieldLabel}>Notes</label>
            <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="Notes..."
              rows={3} style={{ ...fieldInput, resize: 'vertical' }}
              onFocus={e => e.target.style.borderColor = GREEN_BG} onBlur={e => e.target.style.borderColor = BORDER} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 20px', borderTop: `1px solid #eee`, display: 'flex', gap: 8, alignItems: 'center', background: '#FAFBFC' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: SUBTLE }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Import
          </button>
          <div style={{ flex: 1 }} />
          <button onClick={onClose}
            style={{ padding: '6px 14px', background: WHITE, color: SUBTLE, border: `1px solid ${BORDER}`, borderRadius: 2, cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>
            Cancel
          </button>
          <button onClick={() => onSave(form)} disabled={saving || !form.name.trim()}
            style={{ padding: '6px 14px', background: GREEN_BG, color: WHITE, border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 11, fontWeight: 600, opacity: saving || !form.name.trim() ? 0.55 : 1 }}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Collapsible section ───────────────────────────────────────────────────────
function CollapsibleSection({ title, defaultOpen = true, children, badge, onAdd }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderBottom: `1px solid #f0f0f0`, padding: '0 0 4px' }}>
      <div onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 0 5px', cursor: 'pointer', userSelect: 'none' }}>
        <span style={{ fontSize: 9, color: '#97A0AF', transition: 'transform .15s', transform: open ? 'rotate(90deg)' : 'rotate(0)' }}>▶</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: NAVY }}>{title}</span>
        {badge != null && <span style={{ fontSize: 10, color: SUBTLE, marginLeft: 4 }}>{badge}</span>}
        {onAdd && (
          <button onClick={e => { e.stopPropagation(); onAdd() }}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#97A0AF', fontSize: 14, lineHeight: 1 }}>+</button>
        )}
      </div>
      {open && <div style={{ paddingBottom: 8 }}>{children}</div>}
    </div>
  )
}

// ── Inline editable field ────────────────────────────────────────────────────
function InlineField({ label, value, onSave, placeholder }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value || '')
  useEffect(() => { setVal(value || '') }, [value])

  function commit() {
    setEditing(false)
    if (val !== (value || '')) onSave(val)
  }
  function cancel() {
    setVal(value || '')
    setEditing(false)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', minHeight: 28 }}>
      <span style={{ fontSize: 12, color: SUBTLE, flexShrink: 0 }}>{label}</span>
      {editing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: '55%' }}>
          <input value={val} onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel() }}
            autoFocus style={{ flex: 1, fontSize: 11, color: NAVY, border: `1px solid ${GREEN_BG}`, borderRadius: 2, padding: '3px 6px', outline: 'none', textAlign: 'right', background: '#F0FDF4' }} />
          <button onClick={commit} style={{ background: GREEN_BG, color: WHITE, border: 'none', borderRadius: 2, padding: '3px 6px', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Save</button>
          <button onClick={cancel} style={{ background: 'none', color: SUBTLE, border: `1px solid ${BORDER}`, borderRadius: 2, padding: '3px 6px', fontSize: 10, cursor: 'pointer' }}>×</button>
        </div>
      ) : (
        <span onClick={() => setEditing(true)} style={{ fontSize: 11, color: value ? NAVY : '#bbb', cursor: 'pointer', padding: '2px 6px', borderRadius: 2 }}
          onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          {value || placeholder || '-'}
        </span>
      )}
    </div>
  )
}

// ── Deal creation modal ─────────────────────────────────────────────────────
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

// ── Org detail dialog (Pipedrive-style) ──────────────────────────────────────
function OrgDetailDialog({ org, stages = [], onClose, onUpdated, onDeleted, onOpenAddContact, allOrgs, allPeople, globalDeals = [] }) {
  const navigate = useNavigate()
  const [detail, setDetail] = useState(null)
  const [activities, setActivities] = useState([])
  const [deals, setDeals] = useState([])
  const [people, setPeople] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [starred, setStarred] = useState(org.starred || false)
  const [tab, setTab] = useState('activity')
  const [newActivity, setNewActivity] = useState({ type: 'note', title: '', body: '', occurred_at: new Date().toISOString().slice(0, 10) })
  const [savingAct, setSavingAct] = useState(false)
  const [linkSearch, setLinkSearch] = useState('')
  const [showLinkDrop, setShowLinkDrop] = useState(false)
  const [notesVal, setNotesVal] = useState('')
  const [historyFilter, setHistoryFilter] = useState('all')
  const [dealSearch, setDealSearch] = useState('')
  const [showDealDrop, setShowDealDrop] = useState(false)
  const [headerMenu, setHeaderMenu] = useState(false)
  const [showDealForm, setShowDealForm] = useState(false)
  const [dealFormSaving, setDealFormSaving] = useState(false)
  const [pipelines, setPipelines] = useState([])
  const [allStages, setAllStages] = useState([])
  const notesSaved = useRef(false)

  useEffect(() => {
    if (!headerMenu) return
    function close() { setHeaderMenu(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [headerMenu])

  const actTypeIcon = { note: '📝', call: '📞', email: '✉️', meeting: '🤝' }
  const today = new Date().toISOString().slice(0, 10)
  const inputSt = { width: '100%', boxSizing: 'border-box', padding: '5px 8px', borderRadius: 2, border: `1px solid ${BORDER}`, fontSize: 12, color: NAVY, background: '#FAFBFC', fontFamily: 'inherit', outline: 'none' }

  useEffect(() => {
    function handleEsc(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [d, s] = await Promise.all([peopleApi.getOrgDetail(org.id), peopleApi.getOrgStats(org.id)])
        if (cancelled) return
        setDetail(d)
        setActivities(d.activities || [])
        setDeals(d.deals || [])
        setPeople(d.people || [])
        setNotesVal(d.notes || '')
        setStarred(d.starred || false)
        setStats(s)
      } catch {}
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [org.id])

  useEffect(() => {
    crmApi.getPipelines().then(setPipelines).catch(() => {})
    peopleApi.getStages().then(setAllStages).catch(() => {})
  }, [])

  async function saveActivity() {
    if (!newActivity.body.trim()) return
    setSavingAct(true)
    try {
      const act = await peopleApi.addOrgActivity(org.id, newActivity)
      setActivities(prev => [act, ...prev])
      setNewActivity({ type: 'note', title: '', body: '', occurred_at: new Date().toISOString().slice(0, 10) })
    } catch {}
    setSavingAct(false)
  }

  async function deleteActivity(actId) {
    if (!confirm('Delete this activity?')) return
    try {
      await peopleApi.deleteOrgActivity(actId)
      setActivities(prev => prev.filter(a => a.id !== actId))
    } catch {}
  }

  async function toggleDone(act) {
    try {
      const updated = await peopleApi.toggleOrgActivityDone(act.id)
      setActivities(prev => prev.map(a => a.id === act.id ? { ...a, done: updated.done } : a))
    } catch {}
  }

  async function handleEdit(form) {
    setEditSaving(true)
    try {
      const updated = await peopleApi.updateOrg(org.id, form)
      setDetail(d => ({ ...d, ...updated }))
      setNotesVal(updated.notes || '')
      onUpdated(updated)
      setEditing(false)
    } catch {}
    setEditSaving(false)
  }

  async function handleDelete() {
    if (!confirm(`Delete ${org.name}? This cannot be undone.`)) return
    try {
      await peopleApi.deleteOrg(org.id)
      onDeleted(org.id)
    } catch {}
  }

  async function toggleStar() {
    try {
      const res = await peopleApi.starOrg(org.id)
      setStarred(res.starred)
      onUpdated({ ...org, starred: res.starred })
    } catch {}
  }

  async function saveInlineField(field, value) {
    if (!detail) return
    try {
      const updated = await peopleApi.patchOrg(org.id, { [field]: value })
      setDetail(d => ({ ...d, ...updated }))
      onUpdated(updated)
    } catch {}
  }

  async function saveNotes() {
    if (!detail) return
    try { await peopleApi.patchOrg(org.id, { notes: notesVal }) } catch {}
  }

  async function handleLink(person) {
    try {
      await peopleApi.addPersonToOrg(org.id, person.id)
      setPeople(prev => {
        const updated = prev.find(p => p.id === person.id) ? prev : [...prev, { id: person.id, name: person.name, role: person.role, email: person.email }]
        onUpdated({ ...org, people_count: updated.length })
        return updated
      })
    } catch {}
    setShowLinkDrop(false)
    setLinkSearch('')
  }

  async function handleUnlink(personId) {
    try {
      await peopleApi.removePersonFromOrg(org.id, personId)
      setPeople(prev => {
        const updated = prev.filter(p => p.id !== personId)
        onUpdated({ ...org, people_count: updated.length })
        return updated
      })
    } catch {}
  }

  async function handleLinkDeal(deal) {
    try {
      const linked = await peopleApi.addDealToOrg(org.id, deal.id)
      setDeals(prev => prev.find(d => d.id === deal.id) ? prev : [...prev, linked || deal])
    } catch {}
    setShowDealDrop(false)
    setDealSearch('')
  }

  async function handleUnlinkDeal(dealId) {
    try { await peopleApi.removeDealFromOrg(org.id, dealId) } catch {}
    setDeals(prev => prev.filter(d => d.id !== dealId))
  }

  async function createDealForOrg(form) {
    setDealFormSaving(true)
    try {
      const deal = await crmApi.createDeal(form)
      await peopleApi.addDealToOrg(org.id, deal.id)
      setDeals(prev => [...prev, deal])
      setShowDealForm(false)
    } catch {}
    setDealFormSaving(false)
  }

  const linkedIds = new Set(people.map(p => p.id))
  const candidates = allPeople.filter(p => !linkedIds.has(p.id) && (!linkSearch || p.name?.toLowerCase().includes(linkSearch.toLowerCase())))
  const linkedDealIds = new Set(deals.map(d => d.id))
  const dealCandidates = globalDeals.filter(d => !linkedDealIds.has(d.id) && (!dealSearch || d.company_name?.toLowerCase().includes(dealSearch.toLowerCase())))
  const stageC = s => {
    const st = stages.find(x => (x.id ?? x.name) === s)
    return st ? { bg: st.bg ?? st.bg_color ?? '#F4F5F7', color: st.color ?? SUBTLE } : (STAGE_COLORS[s] || { bg: '#F4F5F7', color: SUBTLE })
  }
  const isOverdue = act => act.due_date && !act.done && act.due_date < today
  const filteredActivities = historyFilter === 'all' ? activities : activities.filter(a => a.type === historyFilter)
  const inactiveDays = detail?.updated_at ? Math.max(0, Math.round((Date.now() - new Date(detail.updated_at).getTime()) / 86400000)) : 0

  return (
    <>
      {editing && detail && <OrgModal initial={detail} onSave={handleEdit} onClose={() => setEditing(false)} saving={editSaving} allOrgs={allOrgs} />}
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column' }}>
        <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(9,30,66,0.54)' }} />
        <div style={{ position: 'relative', margin: '24px auto', width: '94vw', maxWidth: 1200, height: 'calc(100vh - 48px)', background: WHITE, borderRadius: 4, boxShadow: '0 8px 40px rgba(9,30,66,0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderBottom: `1px solid #eee`, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 4, background: '#E8E8E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🏢</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: NAVY, lineHeight: 1.2 }}>{org.name}</h2>
              {detail?.industry && <span style={{ fontSize: 11, color: SUBTLE }}>{detail.industry}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: SUBTLE }}>Owner</span>
              <button style={{ padding: '5px 12px', background: GREEN_BG, color: WHITE, border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                onClick={() => setShowDealForm(true)}
                onMouseEnter={e => e.currentTarget.style.background = GREEN_HOVER}
                onMouseLeave={e => e.currentTarget.style.background = GREEN_BG}>
                + Deal
              </button>
              <div style={{ position: 'relative' }}>
                <button onMouseDown={e => e.stopPropagation()} onClick={() => setHeaderMenu(v => !v)}
                  style={{ width: 28, height: 28, background: WHITE, border: `1px solid #ddd`, borderRadius: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#666', fontWeight: 700 }}>⋯</button>
                {headerMenu && (
                  <div onMouseDown={e => e.stopPropagation()} style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', zIndex: 100, minWidth: 140, padding: '3px 0' }}>
                    <button onClick={() => { toggleStar(); setHeaderMenu(false) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: NAVY, textAlign: 'left' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      <span style={{ fontSize: 12, color: starred ? '#FF8B00' : '#C1C7D0' }}>★</span>
                      {starred ? 'Remove star' : 'Star organization'}
                    </button>
                    <button onClick={() => { setEditing(true); setHeaderMenu(false) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: NAVY, textAlign: 'left' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      <span style={{ fontSize: 11 }}>✎</span> Edit
                    </button>
                    <div style={{ height: 1, background: '#F4F5F7', margin: '2px 0' }} />
                    <button onClick={() => { handleDelete(); setHeaderMenu(false) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#d32f2f', textAlign: 'left' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FFF5F5'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <button onClick={onClose} style={{ width: 28, height: 28, background: WHITE, border: `1px solid #ddd`, borderRadius: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: '#666' }}>×</button>
            </div>
          </div>

          {/* Body */}
          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: SUBTLE, fontSize: 13 }}>Loading...</div>
          ) : (
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* LEFT COLUMN */}
              <div style={{ width: 300, flexShrink: 0, borderRight: `1px solid #eee`, overflowY: 'auto', padding: '0 16px 16px' }}>
                <CollapsibleSection title="Summary">
                  <div style={{ marginBottom: 8 }}><TagManager entityType="organization" entityId={org.id} /></div>
                  {detail?.address ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: SUBTLE }}>
                      <span style={{ color: '#97A0AF' }}>📍</span> {detail.address}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#1976d2', cursor: 'pointer' }} onClick={() => setEditing(true)}>Add address or enrich data</div>
                  )}
                </CollapsibleSection>

                <CollapsibleSection title="Details">
                  <InlineField label="Website" value={detail?.website} placeholder="-" onSave={v => saveInlineField('website', v)} />
                  <InlineField label="LinkedIn profile" value={detail?.linkedin} placeholder="-" onSave={v => saveInlineField('linkedin', v)} />
                  <InlineField label="Industry" value={detail?.industry} placeholder="-" onSave={v => saveInlineField('industry', v)} />
                  <InlineField label="Annual revenue" value={detail?.annual_revenue?.toString()} placeholder="-" onSave={v => saveInlineField('annual_revenue', v)} />
                  <InlineField label="Number of employees" value={detail?.employees?.toString()} placeholder="-" onSave={v => saveInlineField('employees', v)} />
                </CollapsibleSection>

                <CollapsibleSection title="Deals" badge={deals.length > 0 ? deals.length : null} onAdd={() => setShowDealForm(true)}>
                  {deals.length === 0 ? (
                    <div>
                      <div style={{ fontSize: 12, color: '#97A0AF', marginBottom: 8 }}>No deals added yet.</div>
                      <div style={{ fontSize: 12, color: '#1976d2', cursor: 'pointer' }} onClick={() => setShowDealForm(true)}>+ New deal</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {deals.map(deal => {
                        const sc = stageC(deal.stage)
                        return (
                          <div key={deal.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', background: '#F8FAFC', borderRadius: 2, border: `1px solid #eee` }}>
                            <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: sc.bg, color: sc.color, fontWeight: 600, flexShrink: 0 }}>
                              {stages.find(s => (s.id ?? s.name) === deal.stage)?.label ?? deal.stage}
                            </span>
                            <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deal.company_name}</span>
                            <span style={{ fontSize: 11, color: SUBTLE }}>{fmt$(deal.deal_value)}</span>
                            <button onClick={() => handleUnlinkDeal(deal.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 14, padding: 0 }}
                              onMouseEnter={e => e.currentTarget.style.color = '#d32f2f'}
                              onMouseLeave={e => e.currentTarget.style.color = '#ccc'}>×</button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <div style={{ position: 'relative', marginTop: 8 }}>
                    <input value={dealSearch} onChange={e => { setDealSearch(e.target.value); setShowDealDrop(true) }}
                      onFocus={() => setShowDealDrop(true)}
                      placeholder="Link a deal..."
                      style={{ width: '100%', boxSizing: 'border-box', padding: '5px 8px', borderRadius: 2, border: `1px solid ${BORDER}`, fontSize: 12, color: NAVY, outline: 'none' }} />
                    {showDealDrop && dealCandidates.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: 150, overflowY: 'auto', marginTop: 2 }}>
                        {dealCandidates.slice(0, 8).map(d => (
                          <div key={d.id} onClick={() => handleLinkDeal(d)}
                            style={{ padding: '6px 10px', fontSize: 11, cursor: 'pointer', color: NAVY }}
                            onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
                            onMouseLeave={e => e.currentTarget.style.background = WHITE}>{d.company_name} — {fmt$(d.deal_value)}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="People" badge={people.length > 0 ? people.length : null} onAdd={() => onOpenAddContact({ org_id: org.id, organization: org.name })}>
                  {people.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#97A0AF' }}>No people linked</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {people.map(p => (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: 2 }}
                          onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#E8F5E9', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{initials(p.name)}</div>
                          <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: '#1976d2', cursor: 'pointer' }}>{p.name}</span>
                          <button onClick={() => handleUnlink(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 14, padding: 0 }}
                            onMouseEnter={e => e.currentTarget.style.color = '#d32f2f'}
                            onMouseLeave={e => e.currentTarget.style.color = '#ccc'}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ position: 'relative', marginTop: 8 }}>
                    <input value={linkSearch} onChange={e => { setLinkSearch(e.target.value); setShowLinkDrop(true) }}
                      onFocus={() => setShowLinkDrop(true)}
                      placeholder="Link a person..."
                      style={{ width: '100%', boxSizing: 'border-box', padding: '5px 8px', borderRadius: 2, border: `1px solid ${BORDER}`, fontSize: 12, color: NAVY, outline: 'none' }} />
                    {showLinkDrop && candidates.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: 150, overflowY: 'auto', marginTop: 2 }}>
                        {candidates.slice(0, 8).map(c => (
                          <div key={c.id} onClick={() => handleLink(c)}
                            style={{ padding: '6px 10px', fontSize: 11, cursor: 'pointer', color: NAVY }}
                            onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
                            onMouseLeave={e => e.currentTarget.style.background = WHITE}>{c.name}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="Overview">
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                    <span style={{ color: SUBTLE }}>Inactive (days)</span>
                    <span style={{ color: NAVY }}>{inactiveDays}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                    <span style={{ color: SUBTLE }}>Created</span>
                    <span style={{ color: NAVY }}>{fmtDate(org.created_at)}</span>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="Notes" defaultOpen={false}>
                  <textarea value={notesVal} onChange={e => setNotesVal(e.target.value)} onBlur={saveNotes}
                    placeholder="Add notes..."
                    style={{ ...inputSt, width: '100%', resize: 'vertical', minHeight: 64, boxSizing: 'border-box', fontSize: 12 }} />
                </CollapsibleSection>

                <div style={{ fontSize: 11, color: '#97A0AF', padding: '12px 0' }}>
                  Updated: {fmtDateTime(detail?.updated_at)}<br/>
                  Created: {fmtDateTime(detail?.created_at)}
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Tab bar */}
                <div style={{ display: 'flex', borderBottom: `1px solid #eee`, padding: '0 16px', flexShrink: 0 }}>
                  {[
                    { id: 'activity', label: 'Activity' },
                    { id: 'notes', label: 'Notes' },
                    { id: 'call', label: 'Call' },
                    { id: 'email', label: 'Email' },
                    { id: 'files', label: 'Files' },
                  ].map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} style={{
                      padding: '8px 12px', background: 'none', border: 'none',
                      borderBottom: tab === t.id ? `2px solid ${GREEN_BG}` : '2px solid transparent',
                      color: tab === t.id ? GREEN_BG : SUBTLE, cursor: 'pointer',
                      fontSize: 11, fontWeight: tab === t.id ? 600 : 400,
                    }}>{t.label}</button>
                  ))}
                </div>

                {/* Activity input area */}
                <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
                  <div style={{ background: '#FAFAFA', borderRadius: 2, padding: 10, border: `1px solid #eee`, marginBottom: 10 }}>
                    <input placeholder="Click here to add an activity..." value={newActivity.body}
                      onChange={e => setNewActivity(p => ({ ...p, body: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') saveActivity() }}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '6px 8px', borderRadius: 2, border: `1px solid #ddd`, fontSize: 12, color: NAVY, outline: 'none', background: WHITE }}
                      onFocus={e => e.target.style.borderColor = GREEN_BG}
                      onBlur={e => e.target.style.borderColor = '#ddd'} />
                    {newActivity.body.trim() && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
                        <select value={newActivity.type} onChange={e => setNewActivity(p => ({ ...p, type: e.target.value }))}
                          style={{ padding: '3px 6px', borderRadius: 2, border: `1px solid #ddd`, fontSize: 11, color: NAVY, outline: 'none' }}>
                          {['note', 'call', 'email', 'meeting'].map(t => (
                            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                          ))}
                        </select>
                        <input type="date" value={newActivity.occurred_at} onChange={e => setNewActivity(p => ({ ...p, occurred_at: e.target.value }))}
                          style={{ padding: '3px 6px', borderRadius: 2, border: `1px solid #ddd`, fontSize: 11, outline: 'none' }} />
                        <div style={{ flex: 1 }} />
                        <button onClick={saveActivity} disabled={savingAct}
                          style={{ padding: '4px 12px', background: GREEN_BG, color: WHITE, border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                          {savingAct ? 'Saving...' : 'Log'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* History */}
                <div style={{ padding: '0 16px', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: NAVY }}>History</span>
                    <div style={{ flex: 1 }} />
                    {['all', 'note', 'call', 'email', 'meeting'].map(f => (
                      <button key={f} onClick={() => setHistoryFilter(f)} style={{
                        padding: '3px 8px', fontSize: 10, borderRadius: 2, cursor: 'pointer', border: 'none',
                        background: historyFilter === f ? GREEN_BG : '#F4F5F7',
                        color: historyFilter === f ? WHITE : SUBTLE, fontWeight: historyFilter === f ? 600 : 400,
                      }}>
                        {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Activity timeline */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
                  {filteredActivities.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: '#97A0AF', fontSize: 12 }}>
                      {activities.length === 0 ? 'No activities yet' : 'No activities match this filter'}
                    </div>
                  ) : (
                    <div style={{ position: 'relative', paddingLeft: 20 }}>
                      <div style={{ position: 'absolute', left: 7, top: 4, bottom: 4, width: 2, background: '#E9EBF0', borderRadius: 1 }} />
                      {filteredActivities.map(act => {
                        const overdue = isOverdue(act)
                        return (
                          <div key={act.id} style={{ position: 'relative', marginBottom: 10 }}>
                            <div style={{ position: 'absolute', left: -16, top: 8, width: 12, height: 12, borderRadius: '50%', background: act.done ? GREEN_BG : (overdue ? '#d32f2f' : '#E0E0E0'), border: `2px solid ${WHITE}` }} />
                            <div style={{ padding: '8px 12px', background: WHITE, borderRadius: 2, border: `1px solid #eee`, marginLeft: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                                <button onClick={() => toggleDone(act)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: 0, flexShrink: 0, color: act.done ? GREEN_BG : '#ccc', lineHeight: 1 }}>
                                  {act.done ? '✅' : '⬜'}
                                </button>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                                    <span style={{ fontSize: 12 }}>{actTypeIcon[act.type] || '📝'}</span>
                                    {act.title && <span style={{ fontSize: 11, fontWeight: 600, color: NAVY }}>{act.title}</span>}
                                    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 2, background: '#F4F5F7', color: SUBTLE }}>{act.type}</span>
                                  </div>
                                  {act.body && <div style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>{act.body}</div>}
                                  <div style={{ fontSize: 10, color: '#97A0AF', marginTop: 3 }}>
                                    {fmtDateTime(act.occurred_at)}
                                    {act.due_date && <span style={{ marginLeft: 8, color: overdue ? '#d32f2f' : SUBTLE }}>{overdue ? 'Overdue' : 'Due'}: {fmtDate(act.due_date)}</span>}
                                  </div>
                                </div>
                                <button onClick={() => deleteActivity(act.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 13, padding: 0 }}
                                  onMouseEnter={e => e.currentTarget.style.color = '#d32f2f'}
                                  onMouseLeave={e => e.currentTarget.style.color = '#ccc'}>×</button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: -16, top: 8, width: 12, height: 12, borderRadius: '50%', background: '#E0E0E0', border: `2px solid ${WHITE}` }} />
                        <div style={{ padding: '8px 14px', fontSize: 12, color: '#97A0AF', marginLeft: 8 }}>
                          Organization created : {fmtDate(org.created_at)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {showDealForm && <DealFormModal
        initial={{ company_name: org.name || '' }}
        pipelines={pipelines} stages={allStages}
        onSave={createDealForOrg} onClose={() => setShowDealForm(false)} saving={dealFormSaving} />}
    </>
  )
}

// ── Multi-Value Email/Phone Popover ──────────────────────────────────────────
function MultiValuePopover({ org, type, onClose, onUpdated }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [newValue, setNewValue] = useState('')
  const [newType, setNewType] = useState('work')
  const [adding, setAdding] = useState(false)

  const typeOptions = type === 'email' ? ['work', 'personal', 'other'] : ['work', 'mobile', 'fax', 'other']
  const label = type === 'email' ? 'Email' : 'Phone'

  useEffect(() => {
    if (!org) return
    (async () => {
      try {
        const data = type === 'email' ? await peopleApi.getOrgEmails(org.id) : await peopleApi.getOrgPhones(org.id)
        setItems(data)
      } catch {}
      setLoading(false)
    })()
  }, [org?.id, type])

  async function handleAdd() {
    if (!newValue.trim()) return
    setAdding(true)
    try {
      const body = type === 'email'
        ? { email: newValue.trim(), type: newType, is_primary: items.length === 0 }
        : { phone: newValue.trim(), type: newType, is_primary: items.length === 0 }
      const created = type === 'email'
        ? await peopleApi.addOrgEmail(org.id, body)
        : await peopleApi.addOrgPhone(org.id, body)
      setItems(prev => [...prev, created])
      setNewValue('')
      refreshOrg()
    } catch {}
    setAdding(false)
  }

  async function handleDelete(itemId) {
    try {
      type === 'email' ? await peopleApi.deleteOrgEmail(org.id, itemId) : await peopleApi.deleteOrgPhone(org.id, itemId)
      setItems(prev => prev.filter(i => i.id !== itemId))
      refreshOrg()
    } catch {}
  }

  async function handleSetPrimary(itemId) {
    try {
      const body = { is_primary: true }
      type === 'email' ? await peopleApi.updateOrgEmail(org.id, itemId, body) : await peopleApi.updateOrgPhone(org.id, itemId, body)
      setItems(prev => prev.map(i => ({ ...i, is_primary: i.id === itemId })))
      refreshOrg()
    } catch {}
  }

  async function refreshOrg() {
    try {
      const updated = await peopleApi.getOrgDetail(org.id)
      if (updated) onUpdated(updated)
    } catch {}
  }

  if (!org) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)' }} />
      <div style={{ position: 'relative', background: WHITE, borderRadius: 4, width: 400, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px 10px', borderBottom: `1px solid #eee`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h4 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: NAVY }}>{label}s for {org.name}</h4>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUBTLE, fontSize: 15 }}>×</button>
        </div>

        <div style={{ padding: '10px 16px', maxHeight: 300, overflowY: 'auto' }}>
          {loading ? <div style={{ color: SUBTLE, fontSize: 11 }}>Loading...</div> : (
            items.length === 0 ? <div style={{ color: SUBTLE, fontSize: 11, padding: '6px 0' }}>No {type}s added yet</div> : (
              items.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <span style={{ fontSize: 9, padding: '2px 5px', borderRadius: 2, background: '#F5F5F5', color: SUBTLE, fontWeight: 500, textTransform: 'capitalize', minWidth: 46, textAlign: 'center' }}>{item.type}</span>
                  <span style={{ flex: 1, fontSize: 12, color: NAVY }}>{item.email || item.phone}</span>
                  {item.is_primary ? (
                    <span style={{ fontSize: 9, padding: '2px 5px', borderRadius: 2, background: '#E8F5E9', color: '#2E7D32', fontWeight: 600 }}>Primary</span>
                  ) : (
                    <button onClick={() => handleSetPrimary(item.id)} style={{ fontSize: 9, padding: '2px 5px', background: 'none', border: '1px solid #ddd', borderRadius: 2, cursor: 'pointer', color: SUBTLE }}>Set primary</button>
                  )}
                  <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 13 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#d32f2f'}
                    onMouseLeave={e => e.currentTarget.style.color = '#ccc'}>×</button>
                </div>
              ))
            )
          )}
        </div>

        <div style={{ padding: '10px 16px 12px', borderTop: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 6 }}>
          <select value={newType} onChange={e => setNewType(e.target.value)}
            style={{ padding: '5px 6px', fontSize: 11, border: `1px solid ${BORDER}`, borderRadius: 2, color: NAVY }}>
            {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input value={newValue} onChange={e => setNewValue(e.target.value)}
            placeholder={`Add ${type}...`}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
            style={{ flex: 1, padding: '5px 8px', fontSize: 11, border: `1px solid ${BORDER}`, borderRadius: 2, outline: 'none', color: NAVY }}
            onFocus={e => e.target.style.borderColor = GREEN_BG}
            onBlur={e => e.target.style.borderColor = BORDER} />
          <button onClick={handleAdd} disabled={adding || !newValue.trim()}
            style={{ padding: '5px 10px', background: GREEN_BG, color: WHITE, border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 11, fontWeight: 600, opacity: adding || !newValue.trim() ? 0.5 : 1 }}>
            {adding ? '...' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main OrganizationsSection (Pipedrive-style) ───────────────────────────────
export default function OrganizationsSection({ stages = [], deals, addOrgOpen, onAddOrgClose, onOpenAddContact }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [allPeople, setAllPeople] = useState([])
  const [selectedOrg, setSelectedOrg] = useState(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false)
  const [columns, setColumns] = useState(() => ALL_COLUMNS.map(c => ({ ...c, visible: c.default })))
  const [customFields, setCustomFields] = useState([])
  const [cfValues, setCfValues] = useState({})
  const [filters, setFilters] = useState([])
  const [starFilter, setStarFilter] = useState(false)
  const [showAddBtn, setShowAddBtn] = useState(false)
  const [moreMenu, setMoreMenu] = useState(false)
  const [editingCell, setEditingCell] = useState(null)
  const [editingValue, setEditingValue] = useState('')
  const [cellSaving, setCellSaving] = useState(false)
  const [rowMenu, setRowMenu] = useState(null)
  const [multiPopover, setMultiPopover] = useState(null)
  const csvInputRef = useRef(null)
  const [csvImporting, setCsvImporting] = useState(false)

  const load = useCallback(async () => {
    try {
      const [orgsData, peopleData, cfData, cfvData] = await Promise.all([
        peopleApi.getOrganizations(),
        peopleApi.getPeople(),
        peopleApi.getCustomFields('organization').catch(() => []),
        peopleApi.getAllCustomFieldValues('organization').catch(() => []),
      ])
      setOrgs(orgsData)
      setAllPeople(peopleData)
      setCustomFields(cfData)
      const valMap = {}
      cfvData.forEach(v => {
        if (!valMap[v.entity_id]) valMap[v.entity_id] = {}
        valMap[v.entity_id][`cf_${v.field_id}`] = v.value
      })
      setCfValues(valMap)
      setColumns(prev => {
        const existingKeys = new Set(prev.map(c => c.key))
        const cfCols = cfData
          .filter(cf => !existingKeys.has(`cf_${cf.id}`))
          .map(cf => ({ key: `cf_${cf.id}`, label: cf.field_label, default: false, entity: 'Custom', visible: false, customField: cf }))
        return cfCols.length > 0 ? [...prev, ...cfCols] : prev
      })
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (addOrgOpen) { setModal('new'); onAddOrgClose?.() } }, [addOrgOpen, onAddOrgClose])

  useEffect(() => {
    const openId = new URLSearchParams(location.search).get('open')
    if (openId && orgs.length) {
      const org = orgs.find(o => String(o.id) === openId)
      if (org) setSelectedOrg(org)
      window.history.replaceState({}, '', location.pathname)
    }
  }, [location.search, orgs])

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

  // Clear selection when search/filter changes to prevent operating on hidden items
  useEffect(() => { setSelected(new Set()) }, [search, filters])

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(''), 5000)
    return () => clearTimeout(t)
  }, [error])

  async function handleSave(form) {
    setSaving(true)
    try {
      if (modal?.id) {
        const updated = await peopleApi.updateOrg(modal.id, form)
        setOrgs(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o))
        if (selectedOrg?.id === updated.id) setSelectedOrg(s => ({ ...s, ...updated }))
      } else {
        const created = await peopleApi.createOrg(form)
        setOrgs(prev => [{ ...created, people: [], people_count: 0, open_deals: 0, closed_deals: 0 }, ...prev])
      }
      setModal(null)
    } catch (e) { setError(e.message) }
    setSaving(false)
  }

  function handleOrgUpdated(updated) {
    setOrgs(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o))
  }
  function handleOrgDeleted(id) {
    setOrgs(prev => prev.filter(o => o.id !== id))
    setSelectedOrg(null)
  }

  async function handleCsvImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setCsvImporting(true)
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) { setError('CSV must have a header row and at least one data row'); setCsvImporting(false); return }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      let imported = 0
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(',').map(v => v.trim())
        const row = {}
        headers.forEach((h, idx) => { if (vals[idx]) row[h] = vals[idx] })
        if (!row.name) continue
        await peopleApi.createOrg({
          name: row.name, email: row.email || '', phone: row.phone || '',
          industry: row.industry || '', website: row.website || '',
          address: row.address || '', linkedin: row.linkedin || '',
          annual_revenue: row.annual_revenue || '', employees: row.employees || '',
          street: row.street || '', city: row.city || '', state: row.state || '',
          zip_code: row.zip_code || '', country: row.country || '', region: row.region || '',
          owner: row.owner || '', notes: row.notes || '', label: row.label || '',
        })
        imported++
      }
      await load()
      setError('')
      alert(`Successfully imported ${imported} organization${imported !== 1 ? 's' : ''}`)
    } catch (err) { setError('Import failed: ' + err.message) }
    setCsvImporting(false)
  }

  function downloadOrgsTemplate() {
    const csv = 'name,email,phone,industry,website,address,linkedin,annual_revenue,employees,street,city,state,zip_code,country,region,owner,notes,label\nAcme Corp,info@acme.com,+1 555 1000,Technology,https://acme.com,123 Main St,https://linkedin.com/company/acme,5000000,250,123 Main St,New York,NY,10001,USA,North America,Sarah,Enterprise account,enterprise\nTechStart Inc,hello@techstart.io,+1 555 2000,SaaS,https://techstart.io,456 Oak Ave,https://linkedin.com/company/techstart,500000,15,456 Oak Ave,San Francisco,CA,94102,USA,West Coast,Mike,Early stage startup,startup\n'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'organizations_import_template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  function toggleSort(col) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selected.size} organization${selected.size > 1 ? 's' : ''}? This cannot be undone.`)) return
    setBulkDeleting(true)
    for (const id of [...selected]) {
      try { await peopleApi.deleteOrg(id) } catch {}
    }
    setOrgs(prev => prev.filter(o => !selected.has(o.id)))
    if (selectedOrg && selected.has(selectedOrg.id)) setSelectedOrg(null)
    setSelected(new Set())
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
    return orgs
      .filter(o => {
        if (starFilter && !o.starred) return false
        if (search && ![o.name, o.industry, o.address, o.website].some(v => v?.toLowerCase().includes(search.toLowerCase()))) return false
        for (const f of filters) {
          if (!f.value && !['is_empty', 'is_not_empty'].includes(f.op)) continue
          if (!matchFilter(o, f)) return false
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
  }, [orgs, search, sortBy, sortDir, filters, starFilter])

  const allSelected = filtered.length > 0 && filtered.every(o => selected.has(o.id))
  const visibleCols = columns.filter(c => c.visible)

  const EDITABLE_COLS = {
    address: 'text', industry: 'text', website: 'text', linkedin: 'text',
    annual_revenue: 'number', employees: 'number', notes: 'text',
    label: 'select', owner: 'select', visible_to: 'select',
    street: 'text', city: 'text', state: 'text', zip_code: 'text', country: 'text', region: 'text',
    email: 'multi-email', phone: 'multi-phone',
  }

  const SELECT_OPTIONS = {
    label: ['', 'hot', 'warm', 'cold', 'customer', 'partner', 'prospect'],
    owner: ['', 'you'],
    visible_to: ['owner', 'group', 'everyone'],
  }

  function startCellEdit(org, colKey) {
    if (editingCell && editingCell.orgId === org.id && editingCell.colKey === colKey) return
    const type = EDITABLE_COLS[colKey]
    if (!type && !colKey.startsWith('cf_')) return
    if (type === 'multi-email') { setMultiPopover({ orgId: org.id, type: 'email' }); return }
    if (type === 'multi-phone') { setMultiPopover({ orgId: org.id, type: 'phone' }); return }
    setEditingCell({ orgId: org.id, colKey })
    if (colKey.startsWith('cf_')) {
      setEditingValue(cfValues[org.id]?.[colKey] || '')
    } else {
      setEditingValue(org[colKey] ?? '')
    }
  }

  async function commitCellEdit(overrideValue) {
    if (!editingCell) return
    const { orgId, colKey } = editingCell
    const org = orgs.find(o => o.id === orgId)
    if (!org) { setEditingCell(null); return }
    const val = overrideValue !== undefined ? overrideValue : editingValue

    if (colKey.startsWith('cf_')) {
      const fieldId = parseInt(colKey.replace('cf_', ''))
      const oldValue = cfValues[orgId]?.[colKey] || ''
      if (val === oldValue) { setEditingCell(null); return }
      setCellSaving(true)
      try {
        await peopleApi.setCustomFieldValue({ field_id: fieldId, entity_type: 'organization', entity_id: orgId, value: val })
        setCfValues(prev => ({ ...prev, [orgId]: { ...(prev[orgId] || {}), [colKey]: val } }))
      } catch {}
      setCellSaving(false)
      setEditingCell(null)
      return
    }

    const oldValue = org[colKey] ?? ''
    if (val === oldValue || (val === '' && !oldValue)) { setEditingCell(null); return }
    if (colKey === 'name' && !val.trim()) { setEditingCell(null); return }
    setCellSaving(true)
    try {
      const updated = await peopleApi.patchOrg(orgId, { [colKey]: val || null })
      setOrgs(prev => prev.map(o => o.id === orgId ? { ...o, ...updated } : o))
    } catch {}
    setCellSaving(false)
    setEditingCell(null)
  }

  function cancelCellEdit() { setEditingCell(null); setEditingValue('') }

  async function handleRowDelete(org) {
    if (!confirm(`Delete "${org.name}"? This cannot be undone.`)) return
    try { await peopleApi.deleteOrg(org.id); setOrgs(prev => prev.filter(o => o.id !== org.id)) } catch {}
    setRowMenu(null)
  }

  async function handleRowClone(org) {
    try {
      const cloned = await peopleApi.cloneOrg(org.id)
      setOrgs(prev => [{ ...cloned, people: [], people_count: 0, open_deals: 0, closed_deals: 0, emails: org.emails || [], phones: org.phones || [] }, ...prev])
    } catch {}
    setRowMenu(null)
  }

  // ── Inline cell rendering ──────────────────────────────────────────────────
  function renderEditableCell(org, colKey) {
    const type = EDITABLE_COLS[colKey]
    const isCf = colKey.startsWith('cf_')
    const cfDef = isCf ? columns.find(c => c.key === colKey)?.customField : null
    const isEditing = editingCell?.orgId === org.id && editingCell?.colKey === colKey

    if (isEditing) {
      if (type === 'select') {
        return (
          <select value={editingValue} autoFocus
            onChange={e => { setEditingValue(e.target.value); commitCellEdit(e.target.value) }}
            onBlur={() => cancelCellEdit()}
            onKeyDown={e => { if (e.key === 'Escape') cancelCellEdit() }}
            style={{ width: '100%', padding: '4px 6px', fontSize: 12, border: '1.5px solid #43a047', borderRadius: 4, background: '#F0FDF4', outline: 'none', color: NAVY }}>
            {(SELECT_OPTIONS[colKey] || []).map(opt => <option key={opt} value={opt}>{opt || '—'}</option>)}
          </select>
        )
      }
      if (isCf && cfDef?.field_type === 'select') {
        return (
          <select value={editingValue} autoFocus
            onChange={e => { setEditingValue(e.target.value); commitCellEdit(e.target.value) }}
            onBlur={() => cancelCellEdit()}
            onKeyDown={e => { if (e.key === 'Escape') cancelCellEdit() }}
            style={{ width: '100%', padding: '4px 6px', fontSize: 12, border: '1.5px solid #43a047', borderRadius: 4, background: '#F0FDF4', outline: 'none', color: NAVY }}>
            <option value="">—</option>
            {(cfDef.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        )
      }
      if (isCf && cfDef?.field_type === 'checkbox') {
        return (
          <input type="checkbox" checked={editingValue === 'true'} autoFocus
            onChange={e => { setEditingValue(e.target.checked ? 'true' : 'false'); setTimeout(commitCellEdit, 0) }}
            onKeyDown={e => { if (e.key === 'Escape') cancelCellEdit() }}
            style={{ accentColor: GREEN_BG }} />
        )
      }
      const inputType = (type === 'number' || (isCf && cfDef?.field_type === 'number')) ? 'number'
        : (isCf && cfDef?.field_type === 'date') ? 'date' : 'text'
      return (
        <input
          type={inputType}
          value={editingValue}
          autoFocus
          onChange={e => setEditingValue(e.target.value)}
          onBlur={commitCellEdit}
          onKeyDown={e => { if (e.key === 'Enter') commitCellEdit(); if (e.key === 'Escape') cancelCellEdit() }}
          style={{ width: '100%', padding: '4px 6px', fontSize: 12, border: '1.5px solid #43a047', borderRadius: 4, background: '#F0FDF4', outline: 'none', color: NAVY, boxSizing: 'border-box' }}
        />
      )
    }

    // Multi-value email/phone display
    if (type === 'multi-email') {
      const emails = org.emails || []
      const primary = emails.find(e => e.is_primary) || emails[0]
      const display = primary?.email || org.email || null
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: display ? '#1a73e8' : '#ccc' }}>{display || '—'}</span>
          {emails.length > 1 && <span style={{ fontSize: 10, background: '#E3F2FD', color: '#1565c0', padding: '1px 5px', borderRadius: 8, fontWeight: 600 }}>+{emails.length - 1}</span>}
        </div>
      )
    }
    if (type === 'multi-phone') {
      const phones = org.phones || []
      const primary = phones.find(p => p.is_primary) || phones[0]
      const display = primary?.phone || org.phone || null
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: display ? '#1a73e8' : '#ccc' }}>{display || '—'}</span>
          {phones.length > 1 && <span style={{ fontSize: 10, background: '#E3F2FD', color: '#1565c0', padding: '1px 5px', borderRadius: 8, fontWeight: 600 }}>+{phones.length - 1}</span>}
        </div>
      )
    }

    return renderCellValue(org, colKey)
  }

  function renderCellValue(org, colKey) {
    switch (colKey) {
      case 'name':
        return <span style={{ fontWeight: 500, color: NAVY }}>{org.starred && <span style={{ color: '#FF8B00', marginRight: 4 }}>★</span>}{org.name}</span>
      case 'id':
        return <span style={{ color: SUBTLE }}>{org.id}</span>
      case 'label':
        if (!org.label) return ''
        const labelColors = { hot: '#d32f2f', warm: '#ff8f00', cold: '#1565c0', customer: '#2e7d32', partner: '#6a1b9a', prospect: '#00838f' }
        return <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 500, background: '#F5F5F5', color: labelColors[org.label] || NAVY }}>{org.label}</span>
      case 'email':
        if (!org.email) return ''
        return <span style={{ color: '#1a73e8' }}>{org.email}</span>
      case 'phone':
        if (!org.phone) return ''
        return <span style={{ color: '#1a73e8' }}>{org.phone}</span>
      case 'address':
        return <span style={{ color: SUBTLE }}>{org.address || ''}</span>
      case 'people_count':
        return <span style={{ color: NAVY }}>{parseInt(org.people_count) || 0}</span>
      case 'closed_deals':
        return <span style={{ color: NAVY }}>{parseInt(org.closed_deals) || 0}</span>
      case 'open_deals':
        return <span style={{ color: NAVY }}>{parseInt(org.open_deals) || 0}</span>
      case 'won_deals':
        return <span style={{ color: '#2e7d32' }}>{parseInt(org.won_deals) || 0}</span>
      case 'lost_deals':
        return <span style={{ color: '#d32f2f' }}>{parseInt(org.lost_deals) || 0}</span>
      case 'industry':
        return <span style={{ color: SUBTLE }}>{org.industry || ''}</span>
      case 'website':
        if (!org.website) return ''
        return <a href={org.website.startsWith('http') ? org.website : `https://${org.website}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ color: '#1a73e8', textDecoration: 'none', fontSize: 12 }}>{org.website.replace(/^https?:\/\//, '')}</a>
      case 'linkedin':
        if (!org.linkedin) return ''
        return <a href={org.linkedin.startsWith('http') ? org.linkedin : `https://${org.linkedin}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ color: '#1a73e8', textDecoration: 'none', fontSize: 12 }}>{org.linkedin.replace(/^https?:\/\/(www\.)?/, '').slice(0, 30)}</a>
      case 'annual_revenue':
        return <span style={{ color: NAVY }}>{org.annual_revenue ? fmt$(org.annual_revenue) : ''}</span>
      case 'employees':
        return <span style={{ color: NAVY }}>{org.employees || ''}</span>
      case 'owner':
        return <span style={{ color: SUBTLE }}>{org.owner || ''}</span>
      case 'visible_to':
        const visMap = { owner: 'Owner only', group: 'Group', everyone: 'Everyone' }
        return <span style={{ color: SUBTLE }}>{visMap[org.visible_to] || org.visible_to || ''}</span>
      case 'created_at':
        return <span style={{ color: SUBTLE, whiteSpace: 'nowrap' }}>{fmtDate(org.created_at)}</span>
      case 'updated_at':
        return <span style={{ color: SUBTLE, whiteSpace: 'nowrap' }}>{fmtDate(org.updated_at)}</span>
      case 'last_activity_date':
        return <span style={{ color: SUBTLE, whiteSpace: 'nowrap' }}>{fmtDate(org.last_activity_date)}</span>
      case 'total_activities':
        return <span style={{ color: NAVY }}>{parseInt(org.total_activities) || 0}</span>
      case 'done_activities':
        return <span style={{ color: NAVY }}>{parseInt(org.done_activities) || 0}</span>
      case 'activities_to_do':
        return <span style={{ color: NAVY }}>{parseInt(org.activities_to_do) || 0}</span>
      case 'street':
        return <span style={{ color: SUBTLE }}>{org.street || ''}</span>
      case 'city':
        return <span style={{ color: SUBTLE }}>{org.city || ''}</span>
      case 'state':
        return <span style={{ color: SUBTLE }}>{org.state || ''}</span>
      case 'region':
        return <span style={{ color: SUBTLE }}>{org.region || ''}</span>
      case 'country':
        return <span style={{ color: SUBTLE }}>{org.country || ''}</span>
      case 'zip_code':
        return <span style={{ color: SUBTLE }}>{org.zip_code || ''}</span>
      case 'notes':
        return <span style={{ color: SUBTLE, fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>{org.notes || ''}</span>
      default:
        if (colKey.startsWith('cf_')) {
          const val = cfValues[org.id]?.[colKey] || ''
          return <span style={{ color: SUBTLE }}>{val}</span>
        }
        return <span style={{ color: SUBTLE }}>{org[colKey] || ''}</span>
    }
  }

  return (
    <>
      {modal && (
        <OrgModal
          initial={modal === 'new' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
          saving={saving}
          allOrgs={orgs}
        />
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%', background: WHITE }}>

        {/* ─── Top toolbar ─── */}
        <div style={{ padding: '6px 16px', borderBottom: `1px solid #e8e8e8`, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Green + Organization split button */}
          <div style={{ position: 'relative', display: 'flex' }}>
            <button onClick={() => setModal('new')}
              style={{ padding: '5px 12px', background: GREEN_BG, color: WHITE, border: 'none', borderTopLeftRadius: 2, borderBottomLeftRadius: 2, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
              onMouseEnter={e => e.currentTarget.style.background = GREEN_HOVER}
              onMouseLeave={e => e.currentTarget.style.background = GREEN_BG}>
              <span style={{ fontSize: 13, lineHeight: 1 }}>+</span> Organization
            </button>
            <button onMouseDown={e => e.stopPropagation()} onClick={() => setShowAddBtn(v => !v)}
              style={{ padding: '5px 6px', background: GREEN_HOVER, color: WHITE, border: 'none', borderTopRightRadius: 2, borderBottomRightRadius: 2, cursor: 'pointer', borderLeft: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center' }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            {showAddBtn && (
              <div onMouseDown={e => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', zIndex: 100, minWidth: 180, padding: '3px 0' }}>
                <button onClick={() => { setModal('new'); setShowAddBtn(false) }}
                  style={{ display: 'block', width: '100%', padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: NAVY, textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>Add organization manually</button>
                <button onClick={() => { csvInputRef.current?.click(); setShowAddBtn(false) }}
                  style={{ display: 'block', width: '100%', padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: NAVY, textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>{csvImporting ? 'Importing...' : 'Import from spreadsheet'}</button>
              </div>
            )}
          </div>

          <div style={{ flex: 1 }} />

          {/* Right side: count + search + filter + gear + more */}
          <span style={{ fontSize: 12, fontWeight: 500, color: NAVY }}>
            {filtered.length} {filtered.length === 1 ? 'organization' : 'organizations'}
          </span>

          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="11" height="11" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="#999" strokeWidth="1.5"/><path d="M11 11l3.5 3.5" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              style={{ padding: '4px 8px 4px 26px', width: 150, borderRadius: 2, border: `1px solid #ddd`, fontSize: 11, color: NAVY, outline: 'none' }}
              onFocus={e => e.target.style.borderColor = GREEN_BG}
              onBlur={e => e.target.style.borderColor = '#ddd'} />
          </div>

          <button onClick={() => { if (filters.length === 0) addFilter() }}
            style={{ padding: '4px 10px', background: filters.length > 0 ? '#E8F5E9' : WHITE, color: filters.length > 0 ? '#2E7D32' : SUBTLE, border: `1px solid ${filters.length > 0 ? '#A5D6A7' : '#ddd'}`, borderRadius: 2, cursor: 'pointer', fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M1 3h14M4 8h8M6 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Filter
            {filters.length > 0 && <span style={{ background: '#2E7D32', color: WHITE, fontSize: 9, padding: '1px 4px', borderRadius: 2, fontWeight: 700 }}>{filters.length}</span>}
          </button>

          <button onClick={() => setStarFilter(v => !v)} title={starFilter ? 'Show all' : 'Show starred only'}
            style={{ padding: '4px 8px', background: starFilter ? '#FFF8E1' : WHITE, color: starFilter ? '#FF8B00' : '#C1C7D0', border: `1px solid ${starFilter ? '#FFD54F' : '#ddd'}`, borderRadius: 2, cursor: 'pointer', fontSize: 13, lineHeight: 1 }}>
            ★
          </button>

          {/* Bulk actions */}
          {selected.size > 0 && (
            <button onClick={bulkDelete} disabled={bulkDeleting}
              style={{ padding: '4px 10px', background: '#d32f2f', color: WHITE, border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
              {bulkDeleting ? 'Deleting...' : `Delete (${selected.size})`}
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
            {showColumnCustomizer && <ColumnCustomizer columns={columns} onColumnsChange={setColumns} onClose={() => setShowColumnCustomizer(false)} customFields={customFields} onCustomFieldsChanged={async () => {
              const cfData = await peopleApi.getCustomFields('organization').catch(() => [])
              setCustomFields(cfData)
              setColumns(prev => {
                const builtinKeys = new Set(ALL_COLUMNS.map(c => c.key))
                const base = prev.filter(c => builtinKeys.has(c.key))
                const cfCols = cfData.map(cf => {
                  const existing = prev.find(c => c.key === `cf_${cf.id}`)
                  return existing ? { ...existing, label: cf.field_label, customField: cf } : { key: `cf_${cf.id}`, label: cf.field_label, default: false, entity: 'Custom', visible: false, customField: cf }
                })
                return [...base, ...cfCols]
              })
            }} />}
          </div>

          {/* More menu */}
          <div style={{ position: 'relative' }}>
            <button onMouseDown={e => e.stopPropagation()} onClick={() => setMoreMenu(v => !v)}
              style={{ width: 28, height: 28, background: WHITE, border: `1px solid #ddd`, borderRadius: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#666', fontWeight: 700 }}>⋯</button>
            {moreMenu && (
              <div onMouseDown={e => e.stopPropagation()} style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', zIndex: 100, minWidth: 180, padding: '3px 0' }}>
                <button onClick={() => { peopleApi.exportOrgs?.(); setMoreMenu(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: NAVY, textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <span style={{ fontSize: 12 }}>↑</span> Export filter results
                </button>
                <div style={{ height: 1, background: '#f0f0f0', margin: '2px 0' }} />
                <button onClick={() => { csvInputRef.current?.click(); setMoreMenu(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: NAVY, textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <span style={{ fontSize: 12 }}>↓</span> Import data
                </button>
                <button onClick={() => { downloadOrgsTemplate(); setMoreMenu(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: NAVY, textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <span style={{ fontSize: 12 }}>↓</span> Download template
                </button>
                <button onClick={() => setMoreMenu(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: NAVY, textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <span style={{ fontSize: 12 }}>⊿</span> Merge duplicates
                </button>
                <button onClick={() => setMoreMenu(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: NAVY, textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <span style={{ fontSize: 12 }}>⟳</span> Open data cleanup
                </button>
                <button onClick={() => setMoreMenu(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: NAVY, textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <span style={{ fontSize: 12 }}>↺</span> Restore data
                </button>
              </div>
            )}
          </div>

          {error && <span style={{ fontSize: 11, color: '#d32f2f' }}>{error}</span>}
        </div>

        {/* ─── Add condition / filter row ─── */}
        {filters.length > 0 ? (
          <div style={{ padding: '5px 16px', borderBottom: `1px solid #eee`, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', background: '#FAFAFA' }}>
            {filters.map((f, idx) => {
              const fieldDef = FILTER_FIELDS.find(ff => ff.key === f.field)
              const ops = FILTER_OPS[fieldDef?.type || 'text']
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4, background: WHITE, border: '1px solid #ddd', borderRadius: 2, padding: '2px 5px' }}>
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
                      style={{ border: 'none', borderBottom: '1px solid #ddd', fontSize: 11, color: NAVY, outline: 'none', width: 70, padding: '2px 4px' }} />
                  )}
                  <button onClick={() => removeFilter(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 12, padding: '0 2px', lineHeight: 1 }}>×</button>
                </div>
              )
            })}
            <button onClick={addFilter}
              style={{ padding: '3px 8px', background: 'none', border: `1px dashed #bbb`, borderRadius: 2, cursor: 'pointer', fontSize: 10, color: GREEN_BG, fontWeight: 500 }}>+ Add condition</button>
            <button onClick={() => setFilters([])}
              style={{ padding: '3px 8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: '#999' }}>Clear all</button>
          </div>
        ) : (
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
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🏢</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>No organizations found</div>
              <div style={{ fontSize: 11, color: SUBTLE }}>Add your first organization to get started</div>
              <button onClick={() => setModal('new')}
                style={{ padding: '6px 14px', background: GREEN_BG, color: WHITE, border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 11, fontWeight: 600, marginTop: 4 }}
                onMouseEnter={e => e.currentTarget.style.background = GREEN_HOVER}
                onMouseLeave={e => e.currentTarget.style.background = GREEN_BG}>
                + Add organization
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid #e0e0e0` }}>
                  <th style={{ padding: '6px 6px 6px 12px', width: 32, textAlign: 'left' }}>
                    <input type="checkbox" checked={allSelected}
                      onChange={e => {
                        if (e.target.checked) setSelected(new Set(filtered.map(o => o.id)))
                        else setSelected(new Set())
                      }}
                      style={{ cursor: 'pointer', accentColor: GREEN_BG }} />
                  </th>
                  {visibleCols.map(col => (
                    <th key={col.key} onClick={() => toggleSort(col.key)}
                      style={{ padding: '6px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#6B778C', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none', borderRight: '1px solid #f0f0f0', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      {col.label}
                      {sortBy === col.key && <span style={{ marginLeft: 4, fontSize: 8, color: '#999' }}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                    </th>
                  ))}
                  <th style={{ width: 32, padding: '6px 6px' }}>
                    <button onClick={() => setShowColumnCustomizer(v => !v)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 11, padding: 0 }}>⚙</button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(org => {
                  const isChecked = selected.has(org.id)
                  return (
                    <tr key={org.id} onClick={() => { setEditingCell(null); setSelectedOrg(org) }}
                      style={{ cursor: 'pointer', borderBottom: `1px solid #F4F5F7`, background: isChecked ? '#F1F8E9' : WHITE }}
                      onMouseEnter={e => { if (!isChecked) e.currentTarget.style.background = '#F8F9FA' }}
                      onMouseLeave={e => { if (!isChecked) e.currentTarget.style.background = WHITE }}>
                      <td style={{ padding: '5px 6px 5px 12px', width: 32 }} onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={isChecked}
                          onChange={e => {
                            const s = new Set(selected)
                            e.target.checked ? s.add(org.id) : s.delete(org.id)
                            setSelected(s)
                          }}
                          style={{ cursor: 'pointer', accentColor: GREEN_BG }} />
                      </td>
                      {visibleCols.map(col => {
                        const isEditable = !!EDITABLE_COLS[col.key] || col.key.startsWith('cf_')
                        const isEditingThis = editingCell?.orgId === org.id && editingCell?.colKey === col.key
                        return (
                          <td key={col.key}
                            onClick={e => { if (isEditable) { e.stopPropagation(); startCellEdit(org, col.key) } }}
                            style={{ padding: '5px 10px', color: NAVY, borderRight: '1px solid #f8f8f8', cursor: isEditable ? 'text' : 'pointer', background: isEditingThis ? '#F0FDF4' : 'inherit', position: 'relative' }}>
                            {renderEditableCell(org, col.key)}
                          </td>
                        )
                      })}
                      <td style={{ padding: '5px 6px', textAlign: 'center', position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <button onMouseDown={e => e.stopPropagation()} onClick={() => setRowMenu(rowMenu === org.id ? null : org.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: rowMenu === org.id ? '#666' : '#ccc', fontSize: 14, fontWeight: 700 }}
                          onMouseEnter={e => e.currentTarget.style.color = '#666'}
                          onMouseLeave={e => { if (rowMenu !== org.id) e.currentTarget.style.color = '#ccc' }}>⋯</button>
                        {rowMenu === org.id && (
                          <div onMouseDown={e => e.stopPropagation()} style={{ position: 'absolute', top: '100%', right: 4, marginTop: 2, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', zIndex: 200, minWidth: 120, padding: '3px 0' }}>
                            <button onClick={() => { setModal(org); setRowMenu(null) }}
                              style={{ display: 'block', width: '100%', padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: NAVY, textAlign: 'left' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
                              onMouseLeave={e => e.currentTarget.style.background = 'none'}>Edit</button>
                            <button onClick={() => handleRowClone(org)}
                              style={{ display: 'block', width: '100%', padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: NAVY, textAlign: 'left' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
                              onMouseLeave={e => e.currentTarget.style.background = 'none'}>Clone</button>
                            <button onClick={() => { setSelectedOrg(org); setRowMenu(null) }}
                              style={{ display: 'block', width: '100%', padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: NAVY, textAlign: 'left' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
                              onMouseLeave={e => e.currentTarget.style.background = 'none'}>View details</button>
                            <div style={{ height: 1, background: '#f0f0f0', margin: '2px 0' }} />
                            <button onClick={() => handleRowDelete(org)}
                              style={{ display: 'block', width: '100%', padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#d32f2f', textAlign: 'left' }}
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

      {/* Organization detail dialog */}
      {selectedOrg && (
        <OrgDetailDialog
          org={selectedOrg}
          stages={stages}
          onClose={() => setSelectedOrg(null)}
          onUpdated={handleOrgUpdated}
          onDeleted={handleOrgDeleted}
          onOpenAddContact={onOpenAddContact}
          allOrgs={orgs}
          allPeople={allPeople}
          globalDeals={deals || []}
        />
      )}

      {/* Multi-value email/phone popover */}
      {multiPopover && (
        <MultiValuePopover
          org={orgs.find(o => o.id === multiPopover.orgId)}
          type={multiPopover.type}
          onClose={() => setMultiPopover(null)}
          onUpdated={updated => setOrgs(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o))}
        />
      )}

      <input type="file" accept=".csv" ref={csvInputRef} onChange={handleCsvImport} style={{ display: 'none' }} />
    </>
  )
}
