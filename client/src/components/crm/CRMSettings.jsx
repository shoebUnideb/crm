import React, { useState, useEffect } from 'react'
import { crmApi } from '../../lib/crmApi.js'
import { SmartViewsPanel, ApprovalsPanel, PipelinesPanel, TerritoriesPanel, SLAPoliciesPanel, QuotesPanel, DealScoringPanel, ContactRolesPanel, FormsPanel, CadencesPanel, ExchangeRatesPanel, VelocityRulesPanel, StageValidationsPanel, NotificationPrefsPanel, SnoozePanel, GoalCascadePanel } from './CRMSettingsAdvanced.jsx'
import PipelineTemplatesPanel from './PipelineTemplatesPanel.jsx'

const NAVY = '#172B4D', SUBTLE = '#5E6C84', BORDER = '#DFE1E6', WHITE = '#fff', BLUE = '#0052CC', EMERALD = '#10b981'

export default function CRMSettings({ initialTab }) {
  const [tab, setTab] = useState(initialTab || 'scoring')

  const tabs = [
    { id: 'scoring', label: 'Lead Scoring' },
    { id: 'custom-fields', label: 'Custom Fields' },
    { id: 'templates', label: 'Deal Templates' },
    { id: 'automations', label: 'Automations' },
    { id: 'sequences', label: 'Sequences' },
    { id: 'products', label: 'Products' },
    { id: 'import-export', label: 'Import/Export' },
    { id: 'duplicates', label: 'Duplicates' },
    { id: 'webhooks', label: 'Webhooks & API' },
    { id: 'audit', label: 'Audit Log' },
    { id: 'smart-views', label: 'Smart Views' },
    { id: 'approvals', label: 'Approvals' },
    { id: 'pipelines', label: 'Pipelines' },
    { id: 'territories', label: 'Territories' },
    { id: 'sla', label: 'SLA Policies' },
    { id: 'quotes', label: 'Quotes' },
    { id: 'deal-scoring', label: 'Deal Scoring' },
    { id: 'contact-roles', label: 'Contact Roles' },
    { id: 'forms', label: 'Web Forms' },
    { id: 'cadences', label: 'Cadences' },
    { id: 'exchange-rates', label: 'Exchange Rates' },
    { id: 'velocity', label: 'Velocity Rules' },
    { id: 'stage-validations', label: 'Stage Gates' },
    { id: 'notif-prefs', label: 'Notifications' },
    { id: 'snooze', label: 'Snooze' },
    { id: 'goal-cascade', label: 'Goal Cascade' },
    { id: 'pipeline-templates', label: 'Pipeline Templates' },
  ]

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Tab sidebar */}
      <div style={{ width: 160, background: '#FAFBFC', borderRight: `1px solid ${BORDER}`, padding: '12px 0', overflowY: 'auto', flexShrink: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'block', width: '100%', padding: '8px 16px', border: 'none', background: tab === t.id ? '#DEEBFF' : 'none', color: tab === t.id ? BLUE : SUBTLE, fontSize: 11, fontWeight: tab === t.id ? 700 : 500, cursor: 'pointer', textAlign: 'left', borderLeft: tab === t.id ? `3px solid ${BLUE}` : '3px solid transparent' }}>
            {t.label}
          </button>
        ))}
      </div>
      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {tab === 'scoring' && <ScoringRulesPanel />}
        {tab === 'custom-fields' && <CustomFieldsPanel />}
        {tab === 'templates' && <DealTemplatesPanel />}
        {tab === 'automations' && <AutomationsPanel />}
        {tab === 'sequences' && <SequencesPanel />}
        {tab === 'products' && <ProductsPanel />}
        {tab === 'import-export' && <ImportExportPanel />}
        {tab === 'duplicates' && <DuplicatesPanel />}
        {tab === 'webhooks' && <WebhooksPanel />}
        {tab === 'audit' && <AuditLogPanel />}
        {tab === 'smart-views' && <SmartViewsPanel />}
        {tab === 'approvals' && <ApprovalsPanel />}
        {tab === 'pipelines' && <PipelinesPanel />}
        {tab === 'territories' && <TerritoriesPanel />}
        {tab === 'sla' && <SLAPoliciesPanel />}
        {tab === 'quotes' && <QuotesPanel />}
        {tab === 'deal-scoring' && <DealScoringPanel />}
        {tab === 'contact-roles' && <ContactRolesPanel />}
        {tab === 'forms' && <FormsPanel />}
        {tab === 'cadences' && <CadencesPanel />}
        {tab === 'exchange-rates' && <ExchangeRatesPanel />}
        {tab === 'velocity' && <VelocityRulesPanel />}
        {tab === 'stage-validations' && <StageValidationsPanel />}
        {tab === 'notif-prefs' && <NotificationPrefsPanel />}
        {tab === 'snooze' && <SnoozePanel />}
        {tab === 'goal-cascade' && <GoalCascadePanel />}
        {tab === 'pipeline-templates' && <PipelineTemplatesPanel />}
      </div>
    </div>
  )
}

const inputSt = { width: '100%', padding: '7px 10px', border: `1.5px solid ${BORDER}`, borderRadius: 6, fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }
const btnPrimary = { padding: '6px 14px', background: BLUE, color: WHITE, border: 'none', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer' }
const btnSecondary = { padding: '6px 12px', background: WHITE, color: SUBTLE, border: `1px solid ${BORDER}`, borderRadius: 5, fontSize: 11, cursor: 'pointer' }
const btnDanger = { padding: '6px 12px', background: '#FFEBE6', color: '#BF2600', border: `1px solid #FFCCC7`, borderRadius: 5, fontSize: 11, cursor: 'pointer', fontWeight: 600 }

// ── Lead Scoring ─────────────────────────────────────────────────────────────
function ScoringRulesPanel() {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ field: 'deal_value', operator: 'gt', value: '', points: 10 })

  useEffect(() => { crmApi.getScoringRules().then(setRules).catch(() => {}).finally(() => setLoading(false)) }, [])

  async function add() {
    if (!form.value) return
    try { const r = await crmApi.createScoringRule(form); setRules(prev => [...prev, r]); setForm({ field: 'deal_value', operator: 'gt', value: '', points: 10 }) } catch {}
  }
  async function del(id) { try { await crmApi.deleteScoringRule(id); setRules(prev => prev.filter(r => r.id !== id)) } catch {} }
  async function recalc() { try { const r = await crmApi.recalculateScores(); alert(`Recalculated scores for ${r.updated} deals`) } catch {} }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 style={{ margin: 0, fontSize: 14, color: NAVY }}>Lead Scoring Rules</h4>
        <button onClick={recalc} style={btnPrimary}>Recalculate All</button>
      </div>
      <p style={{ fontSize: 11, color: SUBTLE, margin: '0 0 12px' }}>Points are added when a deal field matches the rule. Grade: A(80+), B(60+), C(30+), D(&lt;30)</p>

      {/* Add form */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <select value={form.field} onChange={e => setForm(f => ({ ...f, field: e.target.value }))} style={{ ...inputSt, width: 120 }}>
          <option value="deal_value">Deal Value</option>
          <option value="stage">Stage</option>
          <option value="source">Source</option>
          <option value="contact_email">Has Email</option>
          <option value="company_name">Company</option>
        </select>
        <select value={form.operator} onChange={e => setForm(f => ({ ...f, operator: e.target.value }))} style={{ ...inputSt, width: 100 }}>
          <option value="gt">Greater than</option>
          <option value="lt">Less than</option>
          <option value="eq">Equals</option>
          <option value="contains">Contains</option>
          <option value="not_empty">Not empty</option>
        </select>
        <input placeholder="Value…" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} style={{ ...inputSt, width: 100 }} />
        <input type="number" placeholder="Pts" value={form.points} onChange={e => setForm(f => ({ ...f, points: parseInt(e.target.value) || 0 }))} style={{ ...inputSt, width: 60 }} />
        <button onClick={add} style={btnPrimary}>+ Add</button>
      </div>

      {loading ? <div style={{ fontSize: 11, color: SUBTLE }}>Loading…</div> : (
        <div>
          {rules.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#FAFBFC', borderRadius: 6, marginBottom: 4, border: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 11, color: NAVY, fontWeight: 600, flex: 1 }}>{r.field} {r.operator} "{r.value}"</span>
              <span style={{ fontSize: 11, color: EMERALD, fontWeight: 700 }}>+{r.points}pts</span>
              <button onClick={() => del(r.id)} style={{ ...btnDanger, padding: '3px 8px' }}>×</button>
            </div>
          ))}
          {rules.length === 0 && <div style={{ fontSize: 11, color: SUBTLE }}>No scoring rules defined</div>}
        </div>
      )}
    </div>
  )
}

// ── Custom Fields ────────────────────────────────────────────────────────────
function CustomFieldsPanel() {
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ entity_type: 'deal', field_name: '', field_label: '', field_type: 'text' })

  useEffect(() => { crmApi.getCustomFields().then(setFields).catch(() => {}).finally(() => setLoading(false)) }, [])

  async function add() {
    if (!form.field_name || !form.field_label) return
    try { const r = await crmApi.createCustomField(form); setFields(prev => [...prev, r]); setForm({ entity_type: 'deal', field_name: '', field_label: '', field_type: 'text' }) } catch {}
  }
  async function del(id) { try { await crmApi.deleteCustomField(id); setFields(prev => prev.filter(f => f.id !== id)) } catch {} }

  return (
    <div>
      <h4 style={{ margin: '0 0 12px', fontSize: 14, color: NAVY }}>Custom Fields</h4>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <select value={form.entity_type} onChange={e => setForm(f => ({ ...f, entity_type: e.target.value }))} style={{ ...inputSt, width: 90 }}>
          <option value="deal">Deal</option>
          <option value="contact">Contact</option>
          <option value="org">Organization</option>
        </select>
        <input placeholder="field_name" value={form.field_name} onChange={e => setForm(f => ({ ...f, field_name: e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') }))} style={{ ...inputSt, width: 120 }} />
        <input placeholder="Label" value={form.field_label} onChange={e => setForm(f => ({ ...f, field_label: e.target.value }))} style={{ ...inputSt, width: 120 }} />
        <select value={form.field_type} onChange={e => setForm(f => ({ ...f, field_type: e.target.value }))} style={{ ...inputSt, width: 100 }}>
          <option value="text">Text</option>
          <option value="number">Number</option>
          <option value="date">Date</option>
          <option value="dropdown">Dropdown</option>
          <option value="multiselect">Multi-select</option>
          <option value="checkbox">Checkbox</option>
        </select>
        <button onClick={add} style={btnPrimary}>+ Add</button>
      </div>
      {loading ? <div style={{ fontSize: 11, color: SUBTLE }}>Loading…</div> : (
        <div>
          {fields.map(f => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#FAFBFC', borderRadius: 6, marginBottom: 4, border: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 10, color: WHITE, background: BLUE, padding: '1px 5px', borderRadius: 3, fontWeight: 600 }}>{f.entity_type}</span>
              <span style={{ fontSize: 11, color: NAVY, fontWeight: 600, flex: 1 }}>{f.field_label} <span style={{ color: SUBTLE, fontWeight: 400 }}>({f.field_name})</span></span>
              <span style={{ fontSize: 10, color: SUBTLE }}>{f.field_type}</span>
              <button onClick={() => del(f.id)} style={{ ...btnDanger, padding: '3px 8px' }}>×</button>
            </div>
          ))}
          {fields.length === 0 && <div style={{ fontSize: 11, color: SUBTLE }}>No custom fields defined</div>}
        </div>
      )}
    </div>
  )
}

// ── Deal Templates ───────────────────────────────────────────────────────────
function DealTemplatesPanel() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', description: '', default_stage: 'lead', default_value: 0 })

  useEffect(() => { crmApi.getDealTemplates().then(setTemplates).catch(() => {}).finally(() => setLoading(false)) }, [])

  async function add() {
    if (!form.name) return
    try { const r = await crmApi.createDealTemplate(form); setTemplates(prev => [...prev, r]); setForm({ name: '', description: '', default_stage: 'lead', default_value: 0 }) } catch {}
  }
  async function del(id) { try { await crmApi.deleteDealTemplate(id); setTemplates(prev => prev.filter(t => t.id !== id)) } catch {} }

  return (
    <div>
      <h4 style={{ margin: '0 0 12px', fontSize: 14, color: NAVY }}>Deal Templates</h4>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <input placeholder="Template name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ ...inputSt, width: 150 }} />
        <input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputSt, width: 180 }} />
        <input placeholder="Default value" type="number" value={form.default_value} onChange={e => setForm(f => ({ ...f, default_value: parseFloat(e.target.value) || 0 }))} style={{ ...inputSt, width: 100 }} />
        <button onClick={add} style={btnPrimary}>+ Add</button>
      </div>
      {loading ? <div style={{ fontSize: 11, color: SUBTLE }}>Loading…</div> : (
        <div>
          {templates.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#FAFBFC', borderRadius: 6, marginBottom: 4, border: `1px solid ${BORDER}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>{t.name}</div>
                {t.description && <div style={{ fontSize: 10, color: SUBTLE }}>{t.description}</div>}
              </div>
              <span style={{ fontSize: 10, color: SUBTLE }}>Stage: {t.default_stage} · ${t.default_value}</span>
              <button onClick={() => del(t.id)} style={{ ...btnDanger, padding: '3px 8px' }}>×</button>
            </div>
          ))}
          {templates.length === 0 && <div style={{ fontSize: 11, color: SUBTLE }}>No templates yet</div>}
        </div>
      )}
    </div>
  )
}

// ── Automations ──────────────────────────────────────────────────────────────
function AutomationsPanel() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', trigger_type: 'stage_change', trigger_config: { to_stage: 'proposal' }, action_type: 'create_task', action_config: { task_title: '' } })

  useEffect(() => { crmApi.getAutomations().then(setItems).catch(() => {}).finally(() => setLoading(false)) }, [])

  async function add() {
    if (!form.name) return
    try { const r = await crmApi.createAutomation(form); setItems(prev => [...prev, r]); setForm({ name: '', trigger_type: 'stage_change', trigger_config: { to_stage: 'proposal' }, action_type: 'create_task', action_config: { task_title: '' } }) } catch {}
  }
  async function del(id) { try { await crmApi.deleteAutomation(id); setItems(prev => prev.filter(a => a.id !== id)) } catch {} }
  async function toggle(item) { try { const r = await crmApi.updateAutomation(item.id, { ...item, active: !item.active }); setItems(prev => prev.map(a => a.id === item.id ? r : a)) } catch {} }

  return (
    <div>
      <h4 style={{ margin: '0 0 12px', fontSize: 14, color: NAVY }}>Automation Rules</h4>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: 9, color: SUBTLE, display: 'block', marginBottom: 2 }}>Name</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ ...inputSt, width: 140 }} />
        </div>
        <div>
          <label style={{ fontSize: 9, color: SUBTLE, display: 'block', marginBottom: 2 }}>Trigger</label>
          <select value={form.trigger_type} onChange={e => setForm(f => ({ ...f, trigger_type: e.target.value }))} style={{ ...inputSt, width: 120 }}>
            <option value="stage_change">Stage Change</option>
            <option value="deal_created">Deal Created</option>
            <option value="value_above">Value Above</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 9, color: SUBTLE, display: 'block', marginBottom: 2 }}>Action</label>
          <select value={form.action_type} onChange={e => setForm(f => ({ ...f, action_type: e.target.value }))} style={{ ...inputSt, width: 120 }}>
            <option value="create_task">Create Task</option>
            <option value="send_email">Send Email</option>
            <option value="move_stage">Move Stage</option>
          </select>
        </div>
        <button onClick={add} style={btnPrimary}>+ Add</button>
      </div>
      {loading ? <div style={{ fontSize: 11, color: SUBTLE }}>Loading…</div> : (
        <div>
          {items.map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: a.active ? '#FAFBFC' : '#F4F5F7', borderRadius: 6, marginBottom: 4, border: `1px solid ${BORDER}`, opacity: a.active ? 1 : 0.6 }}>
              <input type="checkbox" checked={a.active} onChange={() => toggle(a)} style={{ accentColor: EMERALD }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>{a.name}</div>
                <div style={{ fontSize: 10, color: SUBTLE }}>When: {a.trigger_type} → Then: {a.action_type} · Runs: {a.run_count || 0}</div>
              </div>
              <button onClick={() => del(a.id)} style={{ ...btnDanger, padding: '3px 8px' }}>×</button>
            </div>
          ))}
          {items.length === 0 && <div style={{ fontSize: 11, color: SUBTLE }}>No automations yet</div>}
        </div>
      )}
    </div>
  )
}

// ── Sequences ────────────────────────────────────────────────────────────────
function SequencesPanel() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', steps: [] })
  const [stepForm, setStepForm] = useState({ type: 'email', delay_days: 1, title: '' })

  useEffect(() => { crmApi.getSequences().then(setItems).catch(() => {}).finally(() => setLoading(false)) }, [])

  function addStep() {
    if (!stepForm.title) return
    setForm(f => ({ ...f, steps: [...f.steps, { ...stepForm }] }))
    setStepForm({ type: 'email', delay_days: 1, title: '' })
  }

  async function save() {
    if (!form.name || form.steps.length === 0) return
    try { const r = await crmApi.createSequence(form); setItems(prev => [...prev, r]); setForm({ name: '', steps: [] }) } catch {}
  }
  async function del(id) { try { await crmApi.deleteSequence(id); setItems(prev => prev.filter(s => s.id !== id)) } catch {} }

  return (
    <div>
      <h4 style={{ margin: '0 0 12px', fontSize: 14, color: NAVY }}>Activity Sequences</h4>
      <div style={{ background: '#FAFBFC', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12, marginBottom: 16 }}>
        <input placeholder="Sequence name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ ...inputSt, marginBottom: 8 }} />
        <div style={{ fontSize: 10, fontWeight: 600, color: SUBTLE, marginBottom: 6 }}>Steps ({form.steps.length}):</div>
        {form.steps.map((s, i) => (
          <div key={i} style={{ fontSize: 10, color: NAVY, padding: '3px 6px', background: '#DEEBFF', borderRadius: 4, marginBottom: 3, display: 'inline-block', marginRight: 4 }}>
            Day {s.delay_days}: {s.type} — {s.title}
          </div>
        ))}
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <select value={stepForm.type} onChange={e => setStepForm(f => ({ ...f, type: e.target.value }))} style={{ ...inputSt, width: 80 }}>
            <option value="email">Email</option>
            <option value="call">Call</option>
            <option value="task">Task</option>
          </select>
          <input type="number" placeholder="Day" value={stepForm.delay_days} onChange={e => setStepForm(f => ({ ...f, delay_days: parseInt(e.target.value) || 1 }))} style={{ ...inputSt, width: 50 }} />
          <input placeholder="Title" value={stepForm.title} onChange={e => setStepForm(f => ({ ...f, title: e.target.value }))} style={{ ...inputSt, flex: 1 }} />
          <button onClick={addStep} style={btnSecondary}>+ Step</button>
        </div>
        <button onClick={save} disabled={!form.name || form.steps.length === 0} style={{ ...btnPrimary, marginTop: 8, opacity: (!form.name || form.steps.length === 0) ? 0.5 : 1 }}>Save Sequence</button>
      </div>
      {loading ? <div style={{ fontSize: 11, color: SUBTLE }}>Loading…</div> : items.map(s => (
        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: WHITE, borderRadius: 6, marginBottom: 4, border: `1px solid ${BORDER}` }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>{s.name}</div>
            <div style={{ fontSize: 10, color: SUBTLE }}>{(s.steps || []).length} steps</div>
          </div>
          <button onClick={() => del(s.id)} style={{ ...btnDanger, padding: '3px 8px' }}>×</button>
        </div>
      ))}
    </div>
  )
}

// ── Products ─────────────────────────────────────────────────────────────────
function ProductsPanel() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', price: 0, sku: '', description: '' })

  useEffect(() => { crmApi.getProducts().then(setItems).catch(() => {}).finally(() => setLoading(false)) }, [])

  async function add() {
    if (!form.name) return
    try { const r = await crmApi.createProduct(form); setItems(prev => [...prev, r]); setForm({ name: '', price: 0, sku: '', description: '' }) } catch {}
  }
  async function del(id) { try { await crmApi.deleteProduct(id); setItems(prev => prev.filter(p => p.id !== id)) } catch {} }

  return (
    <div>
      <h4 style={{ margin: '0 0 12px', fontSize: 14, color: NAVY }}>Product Catalog</h4>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <input placeholder="Product name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ ...inputSt, width: 150 }} />
        <input placeholder="Price" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} style={{ ...inputSt, width: 80 }} />
        <input placeholder="SKU" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} style={{ ...inputSt, width: 90 }} />
        <button onClick={add} style={btnPrimary}>+ Add</button>
      </div>
      {loading ? <div style={{ fontSize: 11, color: SUBTLE }}>Loading…</div> : items.map(p => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#FAFBFC', borderRadius: 6, marginBottom: 4, border: `1px solid ${BORDER}` }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>{p.name}</span>
            {p.sku && <span style={{ fontSize: 10, color: SUBTLE, marginLeft: 8 }}>SKU: {p.sku}</span>}
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: EMERALD }}>${parseFloat(p.price).toFixed(2)}</span>
          <button onClick={() => del(p.id)} style={{ ...btnDanger, padding: '3px 8px' }}>×</button>
        </div>
      ))}
    </div>
  )
}

// ── Import/Export ─────────────────────────────────────────────────────────────
function ImportExportPanel() {
  const [importType, setImportType] = useState('deals')
  const [csvText, setCsvText] = useState('')
  const [result, setResult] = useState(null)

  async function handleImport() {
    if (!csvText.trim()) return
    const lines = csvText.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const rows = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      const obj = {}
      headers.forEach((h, i) => { obj[h] = vals[i] || '' })
      return obj
    })
    try {
      const r = importType === 'deals' ? await crmApi.importDeals(rows) : await crmApi.importContacts(rows)
      setResult(`Imported ${r.imported} ${importType}`)
      setCsvText('')
    } catch (e) { setResult('Error: ' + e.message) }
  }

  function handleExport(type) {
    const token = localStorage.getItem('chart-to-jira-token')
    const url = type === 'deals' ? crmApi.exportDealsUrl() : crmApi.exportContactsUrl()
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.blob()).then(blob => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `crm_${type}_export.csv`
        a.click()
      })
  }

  return (
    <div>
      <h4 style={{ margin: '0 0 12px', fontSize: 14, color: NAVY }}>Import / Export</h4>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => handleExport('deals')} style={btnPrimary}>Export Deals CSV</button>
        <button onClick={() => handleExport('contacts')} style={btnPrimary}>Export Contacts CSV</button>
      </div>
      <hr style={{ border: 'none', borderTop: `1px solid ${BORDER}`, margin: '16px 0' }} />
      <h5 style={{ margin: '0 0 8px', fontSize: 12, color: NAVY }}>Import from CSV</h5>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
        <select value={importType} onChange={e => setImportType(e.target.value)} style={{ ...inputSt, width: 120 }}>
          <option value="deals">Deals</option>
          <option value="contacts">Contacts</option>
        </select>
        <button onClick={() => {
          const templates = {
            deals: 'company_name,contact_name,contact_email,deal_value,stage,probability,next_action,notes,expected_close_date,linkedin_url,tags,assigned_to,pipeline_id,follow_up_at,last_contact_at\nAcme Corp,John Smith,john@acme.com,15000,qualified,60,Schedule demo,Enterprise client,2026-07-01,https://linkedin.com/in/johnsmith,enterprise,Sarah,1,2026-06-20,2026-05-10\nTechStart Inc,Jane Doe,jane@techstart.io,5000,lead,10,Follow up email,Startup lead,2026-08-15,https://linkedin.com/in/janedoe,startup hot,Mike,1,2026-06-01,\n',
            contacts: 'name,email,phone,organization,role,linkedin_url,notes,label,birthday\nJohn Smith,john@acme.com,+1 555 0123,Acme Corp,Marketing Manager,https://linkedin.com/in/johnsmith,Key decision maker,hot,1985-03-15\nJane Doe,jane@techstart.io,+1 555 0456,TechStart Inc,CEO,https://linkedin.com/in/janedoe,Founder and CEO,warm,1990-07-22\n'
          }
          const blob = new Blob([templates[importType]], { type: 'text/csv' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url; a.download = `${importType}_import_template.csv`; a.click()
          URL.revokeObjectURL(url)
        }} style={{ padding: '4px 10px', fontSize: 11, color: '#0052CC', background: 'none', border: '1px solid #0052CC', borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          ↓ Download Template
        </button>
      </div>
      <textarea placeholder={importType === 'deals' ? 'company_name,contact_name,contact_email,deal_value,stage\nAcme Corp,John,john@acme.com,5000,lead' : 'name,email,phone,organization,role\nJane Doe,jane@co.com,555-1234,Acme,Manager'} value={csvText} onChange={e => setCsvText(e.target.value)} rows={6} style={{ ...inputSt, resize: 'vertical', fontFamily: 'monospace', fontSize: 10, marginBottom: 8 }} />
      <button onClick={handleImport} disabled={!csvText.trim()} style={{ ...btnPrimary, opacity: csvText.trim() ? 1 : 0.5 }}>Import</button>
      {result && <div style={{ marginTop: 8, fontSize: 11, color: result.startsWith('Error') ? '#BF2600' : EMERALD, fontWeight: 600 }}>{result}</div>}
    </div>
  )
}

// ── Duplicates ───────────────────────────────────────────────────────────────
function DuplicatesPanel() {
  const [dealDups, setDealDups] = useState([])
  const [contactDups, setContactDups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([crmApi.getDuplicateDeals(), crmApi.getDuplicateContacts()])
      .then(([d, c]) => { setDealDups(d); setContactDups(c) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function mergeDeal(keep, remove) {
    try { await crmApi.mergeDuplicateDeals(keep, remove); setDealDups(prev => prev.filter(d => !(d.id_a === keep && d.id_b === remove))) } catch {}
  }

  if (loading) return <div style={{ fontSize: 11, color: SUBTLE }}>Scanning for duplicates…</div>

  return (
    <div>
      <h4 style={{ margin: '0 0 12px', fontSize: 14, color: NAVY }}>Duplicate Detection</h4>
      <h5 style={{ margin: '0 0 8px', fontSize: 12, color: NAVY }}>Deal Duplicates ({dealDups.length})</h5>
      {dealDups.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#FFF5F5', borderRadius: 6, marginBottom: 4, border: '1px solid #FFCCC7' }}>
          <div style={{ flex: 1, fontSize: 11 }}>
            <span style={{ fontWeight: 600, color: NAVY }}>{d.name_a}</span> <span style={{ color: SUBTLE }}>↔</span> <span style={{ fontWeight: 600, color: NAVY }}>{d.name_b}</span>
            {d.email_a && <span style={{ fontSize: 10, color: SUBTLE, marginLeft: 6 }}>({d.email_a})</span>}
          </div>
          <button onClick={() => mergeDeal(d.id_a, d.id_b)} style={{ ...btnPrimary, padding: '3px 8px', fontSize: 9 }}>Keep A</button>
          <button onClick={() => mergeDeal(d.id_b, d.id_a)} style={{ ...btnSecondary, padding: '3px 8px', fontSize: 9 }}>Keep B</button>
        </div>
      ))}
      {dealDups.length === 0 && <div style={{ fontSize: 11, color: SUBTLE, marginBottom: 16 }}>No duplicate deals found</div>}

      <h5 style={{ margin: '16px 0 8px', fontSize: 12, color: NAVY }}>Contact Duplicates ({contactDups.length})</h5>
      {contactDups.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#FFFAE6', borderRadius: 6, marginBottom: 4, border: '1px solid #FFE380' }}>
          <div style={{ flex: 1, fontSize: 11 }}>
            <span style={{ fontWeight: 600, color: NAVY }}>{d.name_a}</span> <span style={{ color: SUBTLE }}>↔</span> <span style={{ fontWeight: 600, color: NAVY }}>{d.name_b}</span>
            {d.email_a && <span style={{ fontSize: 10, color: SUBTLE, marginLeft: 6 }}>({d.email_a})</span>}
          </div>
        </div>
      ))}
      {contactDups.length === 0 && <div style={{ fontSize: 11, color: SUBTLE }}>No duplicate contacts found</div>}
    </div>
  )
}

// ── Webhooks & API ───────────────────────────────────────────────────────────
function WebhooksPanel() {
  const [webhooks, setWebhooks] = useState([])
  const [apiKeys, setApiKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [whForm, setWhForm] = useState({ url: '', events: ['deal.created', 'deal.won'] })
  const [keyForm, setKeyForm] = useState({ name: '' })
  const [newKey, setNewKey] = useState(null)

  useEffect(() => {
    Promise.all([crmApi.getWebhooks(), crmApi.getApiKeys()])
      .then(([w, k]) => { setWebhooks(w); setApiKeys(k) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function addWebhook() {
    if (!whForm.url) return
    try { const r = await crmApi.createWebhook(whForm); setWebhooks(prev => [...prev, r]); setWhForm({ url: '', events: ['deal.created', 'deal.won'] }) } catch {}
  }
  async function delWebhook(id) { try { await crmApi.deleteWebhook(id); setWebhooks(prev => prev.filter(w => w.id !== id)) } catch {} }

  async function addKey() {
    if (!keyForm.name) return
    try { const r = await crmApi.createApiKey(keyForm); setApiKeys(prev => [...prev, r]); setNewKey(r.key); setKeyForm({ name: '' }) } catch {}
  }
  async function delKey(id) { try { await crmApi.deleteApiKey(id); setApiKeys(prev => prev.filter(k => k.id !== id)) } catch {} }

  return (
    <div>
      <h4 style={{ margin: '0 0 12px', fontSize: 14, color: NAVY }}>Webhooks</h4>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <input placeholder="https://…" value={whForm.url} onChange={e => setWhForm(f => ({ ...f, url: e.target.value }))} style={{ ...inputSt, flex: 1 }} />
        <button onClick={addWebhook} style={btnPrimary}>+ Add</button>
      </div>
      {webhooks.map(w => (
        <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#FAFBFC', borderRadius: 6, marginBottom: 4, border: `1px solid ${BORDER}` }}>
          <div style={{ flex: 1, fontSize: 11, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.url}</div>
          <span style={{ fontSize: 9, color: w.active ? EMERALD : SUBTLE }}>{w.active ? 'active' : 'inactive'}</span>
          <button onClick={() => delWebhook(w.id)} style={{ ...btnDanger, padding: '3px 8px' }}>×</button>
        </div>
      ))}

      <hr style={{ border: 'none', borderTop: `1px solid ${BORDER}`, margin: '16px 0' }} />
      <h4 style={{ margin: '0 0 12px', fontSize: 14, color: NAVY }}>API Keys</h4>
      {newKey && (
        <div style={{ padding: 10, background: '#E3FCEF', borderRadius: 6, marginBottom: 12, fontSize: 11 }}>
          <strong>New key (copy now, shown once):</strong><br />
          <code style={{ fontSize: 10, wordBreak: 'break-all' }}>{newKey}</code>
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <input placeholder="Key name" value={keyForm.name} onChange={e => setKeyForm({ name: e.target.value })} style={{ ...inputSt, width: 180 }} />
        <button onClick={addKey} style={btnPrimary}>Generate Key</button>
      </div>
      {apiKeys.map(k => (
        <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#FAFBFC', borderRadius: 6, marginBottom: 4, border: `1px solid ${BORDER}` }}>
          <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: NAVY }}>{k.name}</span>
          <span style={{ fontSize: 9, color: SUBTLE }}>{k.last_used_at ? `Used ${new Date(k.last_used_at).toLocaleDateString()}` : 'Never used'}</span>
          <button onClick={() => delKey(k.id)} style={{ ...btnDanger, padding: '3px 8px' }}>×</button>
        </div>
      ))}
    </div>
  )
}

// ── Audit Log ────────────────────────────────────────────────────────────────
function AuditLogPanel() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { crmApi.getAuditLog({ limit: 100 }).then(setLogs).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div style={{ fontSize: 11, color: SUBTLE }}>Loading audit log…</div>

  return (
    <div>
      <h4 style={{ margin: '0 0 12px', fontSize: 14, color: NAVY }}>Audit Log</h4>
      {logs.length === 0 && <div style={{ fontSize: 11, color: SUBTLE }}>No audit entries yet</div>}
      {logs.map(l => (
        <div key={l.id} style={{ padding: '8px 12px', borderBottom: `1px solid #F4F5F7`, fontSize: 11 }}>
          <span style={{ fontWeight: 600, color: NAVY }}>{l.action}</span>
          <span style={{ color: SUBTLE }}> on {l.entity_type} #{l.entity_id}</span>
          <span style={{ float: 'right', fontSize: 9, color: '#97A0AF' }}>{new Date(l.created_at).toLocaleString()}</span>
          {l.changes && Object.keys(l.changes).length > 0 && (
            <div style={{ fontSize: 9, color: SUBTLE, marginTop: 2 }}>{JSON.stringify(l.changes).slice(0, 120)}</div>
          )}
        </div>
      ))}
    </div>
  )
}
