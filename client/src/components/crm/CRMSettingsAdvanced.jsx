import React, { useState, useEffect } from 'react'
import { crmApi } from '../../lib/crmApi.js'
import { PIPELINE_CATEGORIES, PIPELINE_TEMPLATES } from '../../lib/pipelineTemplates.js'
import { useApplyPipelineTemplate } from '../../hooks/useApplyPipelineTemplate.js'

const NAVY = '#172B4D', SUBTLE = '#5E6C84', BORDER = '#DFE1E6', WHITE = '#fff', BLUE = '#0052CC', EMERALD = '#10b981'
const inputSt = { width: '100%', padding: '7px 10px', border: `1.5px solid ${BORDER}`, borderRadius: 6, fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }
const btnPrimary = { padding: '6px 14px', background: BLUE, color: WHITE, border: 'none', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer' }
const btnSecondary = { padding: '6px 12px', background: WHITE, color: SUBTLE, border: `1px solid ${BORDER}`, borderRadius: 5, fontSize: 11, cursor: 'pointer' }
const btnDanger = { padding: '6px 12px', background: '#FFEBE6', color: '#BF2600', border: `1px solid #FFCCC7`, borderRadius: 5, fontSize: 11, cursor: 'pointer', fontWeight: 600 }
const cardSt = { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#FAFBFC', borderRadius: 6, marginBottom: 4, border: `1px solid ${BORDER}` }

// ── Smart Views ─────────────────────────────────────────────────────────────
export function SmartViewsPanel() {
  const [views, setViews] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', filters: '{}', columns: '["company_name","deal_value","stage"]', sort_field: 'updated_at', sort_dir: 'desc' })
  const [editing, setEditing] = useState(null)

  useEffect(() => { load() }, [])
  function load() { crmApi.getSmartViews().then(setViews).catch(() => {}).finally(() => setLoading(false)) }

  async function save() {
    if (!form.name) return
    const body = { ...form, filters: tryParse(form.filters), columns: tryParse(form.columns) }
    try {
      if (editing) { const r = await crmApi.updateSmartView(editing, body); setViews(prev => prev.map(v => v.id === editing ? r : v)) }
      else { const r = await crmApi.createSmartView(body); setViews(prev => [...prev, r]) }
      setForm({ name: '', filters: '{}', columns: '["company_name","deal_value","stage"]', sort_field: 'updated_at', sort_dir: 'desc' })
      setEditing(null)
    } catch {}
  }
  async function del(id) { try { await crmApi.deleteSmartView(id); setViews(prev => prev.filter(v => v.id !== id)) } catch {} }
  function edit(v) {
    setEditing(v.id)
    setForm({ name: v.name, filters: JSON.stringify(v.filters || {}), columns: JSON.stringify(v.columns || []), sort_field: v.sort_field || 'updated_at', sort_dir: v.sort_dir || 'desc' })
  }

  return (
    <div>
      <h4 style={{ margin: '0 0 12px', fontSize: 14, color: NAVY }}>Smart Views</h4>
      <p style={{ fontSize: 11, color: SUBTLE, margin: '0 0 12px' }}>Saved filter/column configurations for quick access to deal subsets.</p>
      <div style={{ background: '#FAFBFC', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <input placeholder="View name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ ...inputSt, flex: 1 }} />
          <select value={form.sort_field} onChange={e => setForm(f => ({ ...f, sort_field: e.target.value }))} style={{ ...inputSt, width: 120 }}>
            <option value="updated_at">Updated</option>
            <option value="created_at">Created</option>
            <option value="deal_value">Value</option>
            <option value="company_name">Company</option>
            <option value="close_date">Close Date</option>
          </select>
          <select value={form.sort_dir} onChange={e => setForm(f => ({ ...f, sort_dir: e.target.value }))} style={{ ...inputSt, width: 80 }}>
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 9, color: SUBTLE }}>Filters (JSON)</label>
            <textarea value={form.filters} onChange={e => setForm(f => ({ ...f, filters: e.target.value }))} rows={2} style={{ ...inputSt, fontFamily: 'monospace', fontSize: 10, resize: 'vertical' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 9, color: SUBTLE }}>Columns (JSON array)</label>
            <textarea value={form.columns} onChange={e => setForm(f => ({ ...f, columns: e.target.value }))} rows={2} style={{ ...inputSt, fontFamily: 'monospace', fontSize: 10, resize: 'vertical' }} />
          </div>
        </div>
        <button onClick={save} style={btnPrimary}>{editing ? 'Update View' : '+ Create View'}</button>
        {editing && <button onClick={() => { setEditing(null); setForm({ name: '', filters: '{}', columns: '["company_name","deal_value","stage"]', sort_field: 'updated_at', sort_dir: 'desc' }) }} style={{ ...btnSecondary, marginLeft: 6 }}>Cancel</button>}
      </div>
      {loading ? <div style={{ fontSize: 11, color: SUBTLE }}>Loading…</div> : views.map(v => (
        <div key={v.id} style={cardSt}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>{v.name}</div>
            <div style={{ fontSize: 10, color: SUBTLE }}>Sort: {v.sort_field} {v.sort_dir} · {(v.columns || []).length} cols</div>
          </div>
          <button onClick={() => edit(v)} style={{ ...btnSecondary, padding: '3px 8px' }}>Edit</button>
          <button onClick={() => del(v.id)} style={{ ...btnDanger, padding: '3px 8px' }}>×</button>
        </div>
      ))}
      {!loading && views.length === 0 && <div style={{ fontSize: 11, color: SUBTLE }}>No smart views yet</div>}
    </div>
  )
}

// ── Approval Workflows ──────────────────────────────────────────────────────
export function ApprovalsPanel() {
  const [rules, setRules] = useState([])
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', condition_field: 'deal_value', condition_operator: 'gt', condition_value: '50000', approver_email: '' })

  useEffect(() => { load() }, [])
  function load() {
    Promise.all([crmApi.getApprovalRules(), crmApi.getPendingApprovals()])
      .then(([r, p]) => { setRules(r); setPending(p) })
      .catch(() => {}).finally(() => setLoading(false))
  }

  async function addRule() {
    if (!form.name || !form.approver_email) return
    try { const r = await crmApi.createApprovalRule(form); setRules(prev => [...prev, r]); setForm({ name: '', condition_field: 'deal_value', condition_operator: 'gt', condition_value: '50000', approver_email: '' }) } catch {}
  }
  async function delRule(id) { try { await crmApi.deleteApprovalRule(id); setRules(prev => prev.filter(r => r.id !== id)) } catch {} }
  async function resolve(id, status) { try { await crmApi.resolveApproval(id, { status }); setPending(prev => prev.filter(p => p.id !== id)) } catch {} }

  return (
    <div>
      <h4 style={{ margin: '0 0 12px', fontSize: 14, color: NAVY }}>Approval Workflows</h4>
      <p style={{ fontSize: 11, color: SUBTLE, margin: '0 0 12px' }}>Define conditions that require manager approval before deals advance.</p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <input placeholder="Rule name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ ...inputSt, width: 130 }} />
        <select value={form.condition_field} onChange={e => setForm(f => ({ ...f, condition_field: e.target.value }))} style={{ ...inputSt, width: 110 }}>
          <option value="deal_value">Deal Value</option>
          <option value="discount_pct">Discount %</option>
          <option value="stage">Stage</option>
        </select>
        <select value={form.condition_operator} onChange={e => setForm(f => ({ ...f, condition_operator: e.target.value }))} style={{ ...inputSt, width: 80 }}>
          <option value="gt">{'>'}</option>
          <option value="lt">{'<'}</option>
          <option value="eq">=</option>
        </select>
        <input placeholder="Value" value={form.condition_value} onChange={e => setForm(f => ({ ...f, condition_value: e.target.value }))} style={{ ...inputSt, width: 80 }} />
        <input placeholder="Approver email" value={form.approver_email} onChange={e => setForm(f => ({ ...f, approver_email: e.target.value }))} style={{ ...inputSt, width: 160 }} />
        <button onClick={addRule} style={btnPrimary}>+ Add Rule</button>
      </div>
      {loading ? <div style={{ fontSize: 11, color: SUBTLE }}>Loading…</div> : (
        <>
          {rules.map(r => (
            <div key={r.id} style={cardSt}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>{r.name}</div>
                <div style={{ fontSize: 10, color: SUBTLE }}>If {r.condition_field} {r.condition_operator} {r.condition_value} → requires approval from {r.approver_email}</div>
              </div>
              <button onClick={() => delRule(r.id)} style={{ ...btnDanger, padding: '3px 8px' }}>×</button>
            </div>
          ))}
          {rules.length === 0 && <div style={{ fontSize: 11, color: SUBTLE, marginBottom: 16 }}>No approval rules</div>}

          {pending.length > 0 && (
            <>
              <h5 style={{ margin: '16px 0 8px', fontSize: 12, color: NAVY }}>Pending Approvals ({pending.length})</h5>
              {pending.map(p => (
                <div key={p.id} style={{ ...cardSt, background: '#FFFAE6', border: '1px solid #FFE380' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: NAVY }}>{p.company_name || `Deal #${p.deal_id}`}</div>
                    <div style={{ fontSize: 10, color: SUBTLE }}>Requested {new Date(p.requested_at).toLocaleDateString()}</div>
                  </div>
                  <button onClick={() => resolve(p.id, 'approved')} style={{ ...btnPrimary, padding: '4px 10px', background: EMERALD }}>Approve</button>
                  <button onClick={() => resolve(p.id, 'rejected')} style={{ ...btnDanger, padding: '4px 10px' }}>Reject</button>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}

// ── Multiple Pipelines ──────────────────────────────────────────────────────
export function PipelinesPanel() {
  const [pipelines, setPipelines] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', description: '' })
  const [editing, setEditing] = useState(null)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const { apply, applying, progress, error, reset } = useApplyPipelineTemplate()

  useEffect(() => { load() }, [])
  function load() { crmApi.getPipelines().then(setPipelines).catch(() => {}).finally(() => setLoading(false)) }

  async function save() {
    if (!form.name) return
    try {
      if (editing) { const r = await crmApi.updatePipeline(editing, form); setPipelines(prev => prev.map(p => p.id === editing ? r : p)) }
      else { const r = await crmApi.createPipeline(form); setPipelines(prev => [...prev, r]) }
      setForm({ name: '', description: '' }); setEditing(null)
    } catch {}
  }
  async function del(id) { try { await crmApi.deletePipeline(id); setPipelines(prev => prev.filter(p => p.id !== id)) } catch {} }

  async function applyTemplate(template) {
    const pipeline = await apply(template, { includeSampleDeals: true })
    if (pipeline) {
      setPipelines(prev => [...prev, pipeline])
      setTimeout(() => { setShowTemplatePicker(false); reset() }, 1000)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 14, color: NAVY }}>Multiple Pipelines</h4>
          <p style={{ fontSize: 11, color: SUBTLE, margin: '4px 0 0' }}>Create separate pipelines for different deal types (e.g. Sales, Partnerships, Renewals).</p>
        </div>
        <button onClick={() => setShowTemplatePicker(!showTemplatePicker)} style={{ ...btnSecondary, display: 'flex', alignItems: 'center', gap: 4 }}>
          {showTemplatePicker ? 'Close' : '📋 From Template'}
        </button>
      </div>

      {showTemplatePicker && (
        <div style={{ background: '#FAFBFC', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: NAVY, marginBottom: 8 }}>Quick-start from a template:</div>
          {applying && progress && (
            <div style={{ fontSize: 10, color: BLUE, marginBottom: 8 }}>
              {progress.step === 'done' ? 'Pipeline created!' : `${progress.step === 'stages' ? 'Creating stages' : 'Adding deals'}... ${progress.current}/${progress.total}`}
            </div>
          )}
          {error && <div style={{ fontSize: 10, color: '#BF2600', marginBottom: 8 }}>{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
            {PIPELINE_TEMPLATES.slice(0, 12).map(t => (
              <button key={t.id} onClick={() => applyTemplate(t)} disabled={applying} style={{ padding: '8px 10px', border: `1px solid ${BORDER}`, borderRadius: 6, background: WHITE, cursor: applying ? 'wait' : 'pointer', textAlign: 'left' }}>
                <div style={{ fontSize: 14 }}>{t.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: NAVY, marginTop: 2 }}>{t.name}</div>
                <div style={{ fontSize: 9, color: SUBTLE }}>{t.stages.length} stages</div>
              </button>
            ))}
          </div>
          <div style={{ fontSize: 9, color: SUBTLE, marginTop: 8 }}>Showing top 12 — see Pipeline Templates tab for all {PIPELINE_TEMPLATES.length}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <input placeholder="Pipeline name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ ...inputSt, width: 200 }} />
        <input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputSt, flex: 1 }} />
        <button onClick={save} style={btnPrimary}>{editing ? 'Update' : '+ Add'}</button>
        {editing && <button onClick={() => { setEditing(null); setForm({ name: '', description: '' }) }} style={btnSecondary}>Cancel</button>}
      </div>
      {loading ? <div style={{ fontSize: 11, color: SUBTLE }}>Loading…</div> : pipelines.map(p => (
        <div key={p.id} style={cardSt}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>{p.name}</div>
            {p.description && <div style={{ fontSize: 10, color: SUBTLE }}>{p.description}</div>}
          </div>
          <button onClick={() => { setEditing(p.id); setForm({ name: p.name, description: p.description || '' }) }} style={{ ...btnSecondary, padding: '3px 8px' }}>Edit</button>
          <button onClick={() => del(p.id)} style={{ ...btnDanger, padding: '3px 8px' }}>×</button>
        </div>
      ))}
      {!loading && pipelines.length === 0 && <div style={{ fontSize: 11, color: SUBTLE }}>No pipelines. Your stages use the default pipeline.</div>}
    </div>
  )
}

// ── Territories & Lead Routing ──────────────────────────────────────────────
export function TerritoriesPanel() {
  const [territories, setTerritories] = useState([])
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [tForm, setTForm] = useState({ name: '', region: '', assigned_to: '' })
  const [rForm, setRForm] = useState({ territory_id: '', field: 'region', operator: 'eq', value: '' })

  useEffect(() => { load() }, [])
  function load() {
    Promise.all([crmApi.getTerritories(), crmApi.getRoutingRules()])
      .then(([t, r]) => { setTerritories(t); setRules(r) })
      .catch(() => {}).finally(() => setLoading(false))
  }

  async function addTerritory() {
    if (!tForm.name) return
    try { const r = await crmApi.createTerritory(tForm); setTerritories(prev => [...prev, r]); setTForm({ name: '', region: '', assigned_to: '' }) } catch {}
  }
  async function delTerritory(id) { try { await crmApi.deleteTerritory(id); setTerritories(prev => prev.filter(t => t.id !== id)) } catch {} }
  async function addRule() {
    if (!rForm.territory_id || !rForm.value) return
    try { const r = await crmApi.createRoutingRule(rForm); setRules(prev => [...prev, r]); setRForm({ territory_id: '', field: 'region', operator: 'eq', value: '' }) } catch {}
  }
  async function delRule(id) { try { await crmApi.deleteRoutingRule(id); setRules(prev => prev.filter(r => r.id !== id)) } catch {} }

  return (
    <div>
      <h4 style={{ margin: '0 0 12px', fontSize: 14, color: NAVY }}>Territories</h4>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <input placeholder="Territory name" value={tForm.name} onChange={e => setTForm(f => ({ ...f, name: e.target.value }))} style={{ ...inputSt, width: 140 }} />
        <input placeholder="Region" value={tForm.region} onChange={e => setTForm(f => ({ ...f, region: e.target.value }))} style={{ ...inputSt, width: 120 }} />
        <input placeholder="Assigned to" value={tForm.assigned_to} onChange={e => setTForm(f => ({ ...f, assigned_to: e.target.value }))} style={{ ...inputSt, width: 140 }} />
        <button onClick={addTerritory} style={btnPrimary}>+ Add</button>
      </div>
      {territories.map(t => (
        <div key={t.id} style={cardSt}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>{t.name}</span>
            <span style={{ fontSize: 10, color: SUBTLE, marginLeft: 8 }}>{t.region} → {t.assigned_to || 'unassigned'}</span>
          </div>
          <button onClick={() => delTerritory(t.id)} style={{ ...btnDanger, padding: '3px 8px' }}>×</button>
        </div>
      ))}

      <h5 style={{ margin: '20px 0 8px', fontSize: 12, color: NAVY }}>Routing Rules</h5>
      <p style={{ fontSize: 10, color: SUBTLE, margin: '0 0 8px' }}>Auto-assign new deals to territories based on field values.</p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <select value={rForm.territory_id} onChange={e => setRForm(f => ({ ...f, territory_id: e.target.value }))} style={{ ...inputSt, width: 140 }}>
          <option value="">Select territory</option>
          {territories.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={rForm.field} onChange={e => setRForm(f => ({ ...f, field: e.target.value }))} style={{ ...inputSt, width: 100 }}>
          <option value="region">Region</option>
          <option value="source">Source</option>
          <option value="company_name">Company</option>
          <option value="deal_value">Value</option>
        </select>
        <select value={rForm.operator} onChange={e => setRForm(f => ({ ...f, operator: e.target.value }))} style={{ ...inputSt, width: 80 }}>
          <option value="eq">=</option>
          <option value="contains">Contains</option>
          <option value="gt">{'>'}</option>
          <option value="lt">{'<'}</option>
        </select>
        <input placeholder="Value" value={rForm.value} onChange={e => setRForm(f => ({ ...f, value: e.target.value }))} style={{ ...inputSt, width: 100 }} />
        <button onClick={addRule} style={btnPrimary}>+ Rule</button>
      </div>
      {rules.map(r => (
        <div key={r.id} style={{ ...cardSt, background: '#F0F9FF' }}>
          <div style={{ flex: 1, fontSize: 11 }}>
            <span style={{ fontWeight: 600, color: NAVY }}>→ {territories.find(t => t.id == r.territory_id)?.name || `Territory #${r.territory_id}`}</span>
            <span style={{ color: SUBTLE, marginLeft: 8 }}>when {r.field} {r.operator} "{r.value}"</span>
          </div>
          <button onClick={() => delRule(r.id)} style={{ ...btnDanger, padding: '3px 8px' }}>×</button>
        </div>
      ))}
    </div>
  )
}

// ── SLA Policies ────────────────────────────────────────────────────────────
export function SLAPoliciesPanel() {
  const [policies, setPolicies] = useState([])
  const [breaches, setBreaches] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', stage: 'lead', max_hours: 24, priority: 'normal' })

  useEffect(() => { load() }, [])
  function load() {
    Promise.all([crmApi.getSlaPolicies(), crmApi.getSlaBreaches()])
      .then(([p, b]) => { setPolicies(p); setBreaches(b) })
      .catch(() => {}).finally(() => setLoading(false))
  }

  async function add() {
    if (!form.name) return
    try { const r = await crmApi.createSlaPolicy(form); setPolicies(prev => [...prev, r]); setForm({ name: '', stage: 'lead', max_hours: 24, priority: 'normal' }) } catch {}
  }
  async function del(id) { try { await crmApi.deleteSlaPolicy(id); setPolicies(prev => prev.filter(p => p.id !== id)) } catch {} }

  return (
    <div>
      <h4 style={{ margin: '0 0 12px', fontSize: 14, color: NAVY }}>SLA Policies</h4>
      <p style={{ fontSize: 11, color: SUBTLE, margin: '0 0 12px' }}>Set maximum time allowed per stage. Deals exceeding SLA are flagged as breaches.</p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <input placeholder="Policy name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ ...inputSt, width: 150 }} />
        <input placeholder="Stage" value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))} style={{ ...inputSt, width: 100 }} />
        <input type="number" placeholder="Max hrs" value={form.max_hours} onChange={e => setForm(f => ({ ...f, max_hours: parseInt(e.target.value) || 24 }))} style={{ ...inputSt, width: 80 }} />
        <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} style={{ ...inputSt, width: 100 }}>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <button onClick={add} style={btnPrimary}>+ Add</button>
      </div>
      {loading ? <div style={{ fontSize: 11, color: SUBTLE }}>Loading…</div> : (
        <>
          {policies.map(p => (
            <div key={p.id} style={cardSt}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>{p.name}</div>
                <div style={{ fontSize: 10, color: SUBTLE }}>Stage: {p.stage} · Max: {p.max_hours}h · Priority: {p.priority}</div>
              </div>
              <button onClick={() => del(p.id)} style={{ ...btnDanger, padding: '3px 8px' }}>×</button>
            </div>
          ))}
          {policies.length === 0 && <div style={{ fontSize: 11, color: SUBTLE, marginBottom: 16 }}>No SLA policies defined</div>}

          {breaches.length > 0 && (
            <>
              <h5 style={{ margin: '16px 0 8px', fontSize: 12, color: '#BF2600' }}>Current Breaches ({breaches.length})</h5>
              {breaches.map((b, i) => (
                <div key={i} style={{ ...cardSt, background: '#FFF0EE', border: '1px solid #FFCCC7' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: NAVY }}>{b.deal?.company_name || `Deal #${b.deal?.id}`}</span>
                    <span style={{ fontSize: 10, color: '#BF2600', marginLeft: 8 }}>Stage "{b.policy?.stage || b.deal?.stage}" exceeded {b.policy?.max_hours}h SLA by {b.hours_over}h</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}

// ── Quote Builder ───────────────────────────────────────────────────────────
export function QuotesPanel() {
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ deal_id: '', line_items: '[{"description":"Item 1","quantity":1,"unit_price":100}]', discount_amount: 0, tax_rate: 0, valid_until: '', notes: '' })

  useEffect(() => { crmApi.getQuotes().then(setQuotes).catch(() => {}).finally(() => setLoading(false)) }, [])

  async function save() {
    if (!form.deal_id) return
    const body = { ...form, line_items: tryParse(form.line_items), deal_id: parseInt(form.deal_id), discount_amount: parseFloat(form.discount_amount) || 0, tax_rate: parseFloat(form.tax_rate) || 0 }
    try { const r = await crmApi.createQuote(body); setQuotes(prev => [...prev, r]); setForm({ deal_id: '', line_items: '[{"description":"Item 1","quantity":1,"unit_price":100}]', discount_amount: 0, tax_rate: 0, valid_until: '', notes: '' }) } catch {}
  }
  async function del(id) { try { await crmApi.deleteQuote(id); setQuotes(prev => prev.filter(q => q.id !== id)) } catch {} }

  return (
    <div>
      <h4 style={{ margin: '0 0 12px', fontSize: 14, color: NAVY }}>Quote Builder</h4>
      <p style={{ fontSize: 11, color: SUBTLE, margin: '0 0 12px' }}>Create quotes with line items, discounts, and validity periods.</p>
      <div style={{ background: '#FAFBFC', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <input type="number" placeholder="Deal ID" value={form.deal_id} onChange={e => setForm(f => ({ ...f, deal_id: e.target.value }))} style={{ ...inputSt, width: 80 }} />
          <input type="number" placeholder="Discount $" value={form.discount_amount} onChange={e => setForm(f => ({ ...f, discount_amount: e.target.value }))} style={{ ...inputSt, width: 90 }} />
          <input type="number" placeholder="Tax %" value={form.tax_rate} onChange={e => setForm(f => ({ ...f, tax_rate: e.target.value }))} style={{ ...inputSt, width: 70 }} />
          <input type="date" placeholder="Valid until" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} style={{ ...inputSt, width: 130 }} />
        </div>
        <label style={{ fontSize: 9, color: SUBTLE }}>Line items JSON: [{`{"description":"...","quantity":1,"unit_price":100}`}]</label>
        <textarea value={form.line_items} onChange={e => setForm(f => ({ ...f, line_items: e.target.value }))} rows={3} style={{ ...inputSt, fontFamily: 'monospace', fontSize: 10, resize: 'vertical', marginBottom: 8 }} />
        <input placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ ...inputSt, marginBottom: 8 }} />
        <button onClick={save} style={btnPrimary}>Create Quote</button>
      </div>
      {loading ? <div style={{ fontSize: 11, color: SUBTLE }}>Loading…</div> : quotes.map(q => (
        <div key={q.id} style={cardSt}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>{q.quote_number || `Quote #${q.id}`}</div>
            <div style={{ fontSize: 10, color: SUBTLE }}>Deal #{q.deal_id} · {(q.line_items || []).length} items · Discount: ${q.discount_amount || 0} · Status: {q.status || 'draft'}</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: EMERALD }}>${parseFloat(q.total || 0).toFixed(2)}</span>
          <button onClick={() => del(q.id)} style={{ ...btnDanger, padding: '3px 8px' }}>×</button>
        </div>
      ))}
      {!loading && quotes.length === 0 && <div style={{ fontSize: 11, color: SUBTLE }}>No quotes yet</div>}
    </div>
  )
}

// ── Deal Scoring ────────────────────────────────────────────────────────────
export function DealScoringPanel() {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ field: 'deal_value', operator: 'gt', value: '10000', points: 20 })

  useEffect(() => { crmApi.getDealScoringRules().then(setRules).catch(() => {}).finally(() => setLoading(false)) }, [])

  async function add() {
    if (!form.value) return
    try { const r = await crmApi.createDealScoringRule(form); setRules(prev => [...prev, r]); setForm({ field: 'deal_value', operator: 'gt', value: '10000', points: 20 }) } catch {}
  }
  async function del(id) { try { await crmApi.deleteDealScoringRule(id); setRules(prev => prev.filter(r => r.id !== id)) } catch {} }
  async function recalc() { try { const r = await crmApi.recalculateDealScores(); alert(`Recalculated deal scores for ${r.updated} deals`) } catch {} }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 style={{ margin: 0, fontSize: 14, color: NAVY }}>Deal Health Scoring</h4>
        <button onClick={recalc} style={btnPrimary}>Recalculate All</button>
      </div>
      <p style={{ fontSize: 11, color: SUBTLE, margin: '0 0 12px' }}>Separate from lead scoring — evaluates deal health/priority based on deal-specific signals.</p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <select value={form.field} onChange={e => setForm(f => ({ ...f, field: e.target.value }))} style={{ ...inputSt, width: 120 }}>
          <option value="deal_value">Deal Value</option>
          <option value="stage">Stage</option>
          <option value="probability">Probability</option>
          <option value="days_in_stage">Days in Stage</option>
          <option value="has_next_step">Has Next Step</option>
        </select>
        <select value={form.operator} onChange={e => setForm(f => ({ ...f, operator: e.target.value }))} style={{ ...inputSt, width: 100 }}>
          <option value="gt">Greater than</option>
          <option value="lt">Less than</option>
          <option value="eq">Equals</option>
          <option value="not_empty">Not empty</option>
        </select>
        <input placeholder="Value" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} style={{ ...inputSt, width: 100 }} />
        <input type="number" placeholder="Points" value={form.points} onChange={e => setForm(f => ({ ...f, points: parseInt(e.target.value) || 0 }))} style={{ ...inputSt, width: 60 }} />
        <button onClick={add} style={btnPrimary}>+ Add</button>
      </div>
      {loading ? <div style={{ fontSize: 11, color: SUBTLE }}>Loading…</div> : rules.map(r => (
        <div key={r.id} style={cardSt}>
          <span style={{ fontSize: 11, color: NAVY, fontWeight: 600, flex: 1 }}>{r.field} {r.operator} "{r.value}"</span>
          <span style={{ fontSize: 11, color: EMERALD, fontWeight: 700 }}>+{r.points}pts</span>
          <button onClick={() => del(r.id)} style={{ ...btnDanger, padding: '3px 8px' }}>×</button>
        </div>
      ))}
      {!loading && rules.length === 0 && <div style={{ fontSize: 11, color: SUBTLE }}>No deal scoring rules</div>}
    </div>
  )
}

// ── Contact Roles ───────────────────────────────────────────────────────────
export function ContactRolesPanel() {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', description: '' })

  useEffect(() => { crmApi.getContactRoles().then(setRoles).catch(() => {}).finally(() => setLoading(false)) }, [])

  async function add() {
    if (!form.name) return
    try { const r = await crmApi.createContactRole(form); setRoles(prev => [...prev, r]); setForm({ name: '', description: '' }) } catch {}
  }
  async function del(id) { try { await crmApi.deleteContactRole(id); setRoles(prev => prev.filter(r => r.id !== id)) } catch {} }

  return (
    <div>
      <h4 style={{ margin: '0 0 12px', fontSize: 14, color: NAVY }}>Contact Roles</h4>
      <p style={{ fontSize: 11, color: SUBTLE, margin: '0 0 12px' }}>Define roles for contacts associated with deals (e.g. Decision Maker, Champion, Influencer).</p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <input placeholder="Role name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ ...inputSt, width: 150 }} />
        <input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputSt, flex: 1 }} />
        <button onClick={add} style={btnPrimary}>+ Add</button>
      </div>
      {loading ? <div style={{ fontSize: 11, color: SUBTLE }}>Loading…</div> : roles.map(r => (
        <div key={r.id} style={cardSt}>
          <span style={{ fontSize: 12, fontWeight: 600, color: NAVY, flex: 1 }}>{r.name}</span>
          {r.description && <span style={{ fontSize: 10, color: SUBTLE }}>{r.description}</span>}
          <button onClick={() => del(r.id)} style={{ ...btnDanger, padding: '3px 8px' }}>×</button>
        </div>
      ))}
      {!loading && roles.length === 0 && <div style={{ fontSize: 11, color: SUBTLE }}>No contact roles. Add roles like "Decision Maker", "Champion", etc.</div>}
    </div>
  )
}

// ── Form Builder ────────────────────────────────────────────────────────────
export function FormsPanel() {
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', fields: '[{"name":"company","label":"Company","type":"text","required":true},{"name":"email","label":"Email","type":"email","required":true}]', default_stage: 'lead', assigned_to: '' })
  const [subs, setSubs] = useState(null)
  const [viewingForm, setViewingForm] = useState(null)

  useEffect(() => { crmApi.getForms().then(setForms).catch(() => {}).finally(() => setLoading(false)) }, [])

  async function save() {
    if (!form.name) return
    const body = { ...form, fields: tryParse(form.fields) }
    try { const r = await crmApi.createForm(body); setForms(prev => [...prev, r]); setForm({ name: '', fields: '[{"name":"company","label":"Company","type":"text","required":true}]', default_stage: 'lead', assigned_to: '' }) } catch {}
  }
  async function del(id) { try { await crmApi.deleteForm(id); setForms(prev => prev.filter(f => f.id !== id)) } catch {} }
  async function viewSubs(id) {
    try { const s = await crmApi.getFormSubmissions(id); setSubs(s); setViewingForm(id) } catch {}
  }

  return (
    <div>
      <h4 style={{ margin: '0 0 12px', fontSize: 14, color: NAVY }}>Web Forms</h4>
      <p style={{ fontSize: 11, color: SUBTLE, margin: '0 0 12px' }}>Build lead capture forms that create deals automatically on submission.</p>
      <div style={{ background: '#FAFBFC', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <input placeholder="Form name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ ...inputSt, flex: 1 }} />
          <input placeholder="Default stage" value={form.default_stage} onChange={e => setForm(f => ({ ...f, default_stage: e.target.value }))} style={{ ...inputSt, width: 100 }} />
          <input placeholder="Assign to" value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} style={{ ...inputSt, width: 160 }} />
        </div>
        <label style={{ fontSize: 9, color: SUBTLE }}>Fields JSON: [{`{"name":"...","label":"...","type":"text|email|tel|select","required":true}`}]</label>
        <textarea value={form.fields} onChange={e => setForm(f => ({ ...f, fields: e.target.value }))} rows={3} style={{ ...inputSt, fontFamily: 'monospace', fontSize: 10, resize: 'vertical', marginBottom: 8 }} />
        <button onClick={save} style={btnPrimary}>Create Form</button>
      </div>
      {loading ? <div style={{ fontSize: 11, color: SUBTLE }}>Loading…</div> : forms.map(f => (
        <div key={f.id} style={cardSt}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>{f.name}</div>
            <div style={{ fontSize: 10, color: SUBTLE }}>{(f.fields || []).length} fields · Stage: {f.default_stage} · {f.active !== false ? 'Active' : 'Inactive'}</div>
          </div>
          <button onClick={() => viewSubs(f.id)} style={{ ...btnSecondary, padding: '3px 8px' }}>Submissions</button>
          <button onClick={() => del(f.id)} style={{ ...btnDanger, padding: '3px 8px' }}>×</button>
        </div>
      ))}
      {!loading && forms.length === 0 && <div style={{ fontSize: 11, color: SUBTLE }}>No forms yet</div>}

      {subs && (
        <div style={{ marginTop: 16, padding: 12, background: '#F0F9FF', borderRadius: 8, border: '1px solid #B3D4FF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h5 style={{ margin: 0, fontSize: 12, color: NAVY }}>Submissions for Form #{viewingForm} ({subs.length})</h5>
            <button onClick={() => { setSubs(null); setViewingForm(null) }} style={btnSecondary}>Close</button>
          </div>
          {subs.map(s => (
            <div key={s.id} style={{ fontSize: 10, padding: '6px 8px', background: WHITE, borderRadius: 4, marginBottom: 3, border: `1px solid ${BORDER}` }}>
              <span style={{ color: SUBTLE }}>{new Date(s.created_at).toLocaleString()}</span>
              <span style={{ marginLeft: 8, color: NAVY }}>{JSON.stringify(s.data).slice(0, 100)}</span>
            </div>
          ))}
          {subs.length === 0 && <div style={{ fontSize: 11, color: SUBTLE }}>No submissions yet</div>}
        </div>
      )}
    </div>
  )
}

// ── Activity Cadences ───────────────────────────────────────────────────────
export function CadencesPanel() {
  const [cadences, setCadences] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', steps: '[]', description: '' })
  const [enrollForm, setEnrollForm] = useState({ cadence_id: '', deal_id: '' })
  const [enrollments, setEnrollments] = useState([])

  useEffect(() => { crmApi.getCadences().then(setCadences).catch(() => {}).finally(() => setLoading(false)) }, [])

  async function save() {
    if (!form.name) return
    const body = { ...form, steps: tryParse(form.steps) }
    try { const r = await crmApi.createCadence(body); setCadences(prev => [...prev, r]); setForm({ name: '', steps: '[]', description: '' }) } catch {}
  }
  async function del(id) { try { await crmApi.deleteCadence(id); setCadences(prev => prev.filter(c => c.id !== id)) } catch {} }
  async function enroll() {
    if (!enrollForm.cadence_id || !enrollForm.deal_id) return
    try { await crmApi.enrollInCadence(enrollForm.cadence_id, { deal_id: parseInt(enrollForm.deal_id) }); alert('Enrolled!'); setEnrollForm({ cadence_id: '', deal_id: '' }) } catch {}
  }
  async function viewEnrollments(id) {
    try { const e = await crmApi.getCadenceEnrollments(id); setEnrollments(e) } catch {}
  }

  return (
    <div>
      <h4 style={{ margin: '0 0 12px', fontSize: 14, color: NAVY }}>Activity Cadences</h4>
      <p style={{ fontSize: 11, color: SUBTLE, margin: '0 0 12px' }}>Multi-step outreach sequences that auto-schedule tasks for enrolled deals.</p>
      <div style={{ background: '#FAFBFC', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <input placeholder="Cadence name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ ...inputSt, flex: 1 }} />
          <input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputSt, flex: 1 }} />
        </div>
        <label style={{ fontSize: 9, color: SUBTLE }}>Steps JSON: [{`{"day":1,"type":"email","subject":"..."}, {"day":3,"type":"call","note":"..."}`}]</label>
        <textarea value={form.steps} onChange={e => setForm(f => ({ ...f, steps: e.target.value }))} rows={3} style={{ ...inputSt, fontFamily: 'monospace', fontSize: 10, resize: 'vertical', marginBottom: 8 }} />
        <button onClick={save} style={btnPrimary}>Create Cadence</button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={enrollForm.cadence_id} onChange={e => setEnrollForm(f => ({ ...f, cadence_id: e.target.value }))} style={{ ...inputSt, width: 150 }}>
          <option value="">Select cadence</option>
          {cadences.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="number" placeholder="Deal ID" value={enrollForm.deal_id} onChange={e => setEnrollForm(f => ({ ...f, deal_id: e.target.value }))} style={{ ...inputSt, width: 80 }} />
        <button onClick={enroll} style={btnPrimary}>Enroll Deal</button>
      </div>

      {loading ? <div style={{ fontSize: 11, color: SUBTLE }}>Loading…</div> : cadences.map(c => (
        <div key={c.id} style={cardSt}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>{c.name}</div>
            <div style={{ fontSize: 10, color: SUBTLE }}>{(c.steps || []).length} steps · {c.description || ''}</div>
          </div>
          <button onClick={() => viewEnrollments(c.id)} style={{ ...btnSecondary, padding: '3px 8px' }}>Enrollments</button>
          <button onClick={() => del(c.id)} style={{ ...btnDanger, padding: '3px 8px' }}>×</button>
        </div>
      ))}

      {enrollments.length > 0 && (
        <div style={{ marginTop: 12, padding: 10, background: '#F0F9FF', borderRadius: 8, border: '1px solid #B3D4FF' }}>
          <h5 style={{ margin: '0 0 8px', fontSize: 11, color: NAVY }}>Enrollments ({enrollments.length})</h5>
          {enrollments.map(e => (
            <div key={e.id} style={{ fontSize: 10, color: NAVY, padding: '4px 6px', borderBottom: `1px solid ${BORDER}` }}>
              Deal #{e.deal_id} · Step {e.current_step} · Status: {e.status} · Started {new Date(e.started_at).toLocaleDateString()}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Exchange Rates ──────────────────────────────────────────────────────────
export function ExchangeRatesPanel() {
  const [rates, setRates] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ from_currency: 'EUR', to_currency: 'USD', rate: 1.08 })

  useEffect(() => { crmApi.getExchangeRates().then(setRates).catch(() => {}).finally(() => setLoading(false)) }, [])

  async function add() {
    if (!form.from_currency || !form.to_currency) return
    try { const r = await crmApi.setExchangeRate(form); setRates(prev => { const idx = prev.findIndex(x => x.id === r.id); return idx >= 0 ? prev.map(x => x.id === r.id ? r : x) : [...prev, r] }); setForm({ from_currency: 'EUR', to_currency: 'USD', rate: 1.08 }) } catch {}
  }
  async function del(id) { try { await crmApi.deleteExchangeRate(id); setRates(prev => prev.filter(r => r.id !== id)) } catch {} }

  return (
    <div>
      <h4 style={{ margin: '0 0 12px', fontSize: 14, color: NAVY }}>Exchange Rates</h4>
      <p style={{ fontSize: 11, color: SUBTLE, margin: '0 0 12px' }}>Define currency conversion rates for multi-currency deal values.</p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <input placeholder="From (e.g. EUR)" value={form.from_currency} onChange={e => setForm(f => ({ ...f, from_currency: e.target.value.toUpperCase() }))} style={{ ...inputSt, width: 80 }} />
        <span style={{ lineHeight: '32px', color: SUBTLE }}>→</span>
        <input placeholder="To (e.g. USD)" value={form.to_currency} onChange={e => setForm(f => ({ ...f, to_currency: e.target.value.toUpperCase() }))} style={{ ...inputSt, width: 80 }} />
        <input type="number" step="0.0001" placeholder="Rate" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: parseFloat(e.target.value) || 0 }))} style={{ ...inputSt, width: 100 }} />
        <button onClick={add} style={btnPrimary}>Set Rate</button>
      </div>
      {loading ? <div style={{ fontSize: 11, color: SUBTLE }}>Loading…</div> : rates.map(r => (
        <div key={r.id} style={cardSt}>
          <span style={{ fontSize: 12, fontWeight: 600, color: NAVY, flex: 1 }}>{r.from_currency} → {r.to_currency}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: EMERALD }}>{parseFloat(r.rate).toFixed(4)}</span>
          <button onClick={() => del(r.id)} style={{ ...btnDanger, padding: '3px 8px' }}>×</button>
        </div>
      ))}
      {!loading && rates.length === 0 && <div style={{ fontSize: 11, color: SUBTLE }}>No exchange rates set. Base currency is USD.</div>}
    </div>
  )
}

// ── Velocity Rules ──────────────────────────────────────────────────────────
export function VelocityRulesPanel() {
  const [rules, setRules] = useState([])
  const [violations, setViolations] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', stage: 'lead', max_days: 7, action: 'notify' })

  useEffect(() => { load() }, [])
  function load() {
    Promise.all([crmApi.getVelocityRules(), crmApi.getVelocityViolations()])
      .then(([r, v]) => { setRules(r); setViolations(v) })
      .catch(() => {}).finally(() => setLoading(false))
  }

  async function add() {
    if (!form.name) return
    try { const r = await crmApi.createVelocityRule(form); setRules(prev => [...prev, r]); setForm({ name: '', stage: 'lead', max_days: 7, action: 'notify' }) } catch {}
  }
  async function del(id) { try { await crmApi.deleteVelocityRule(id); setRules(prev => prev.filter(r => r.id !== id)) } catch {} }

  return (
    <div>
      <h4 style={{ margin: '0 0 12px', fontSize: 14, color: NAVY }}>Velocity Rules</h4>
      <p style={{ fontSize: 11, color: SUBTLE, margin: '0 0 12px' }}>Flag deals that sit too long in any stage, driving action before they go stale.</p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <input placeholder="Rule name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ ...inputSt, width: 140 }} />
        <input placeholder="Stage" value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))} style={{ ...inputSt, width: 100 }} />
        <input type="number" placeholder="Max days" value={form.max_days} onChange={e => setForm(f => ({ ...f, max_days: parseInt(e.target.value) || 7 }))} style={{ ...inputSt, width: 80 }} />
        <select value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value }))} style={{ ...inputSt, width: 100 }}>
          <option value="notify">Notify</option>
          <option value="escalate">Escalate</option>
          <option value="auto_move">Auto-move</option>
        </select>
        <button onClick={add} style={btnPrimary}>+ Add</button>
      </div>
      {loading ? <div style={{ fontSize: 11, color: SUBTLE }}>Loading…</div> : (
        <>
          {rules.map(r => (
            <div key={r.id} style={cardSt}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>{r.name}</span>
                <span style={{ fontSize: 10, color: SUBTLE, marginLeft: 8 }}>Stage "{r.stage}" max {r.max_days}d → {r.action}</span>
              </div>
              <button onClick={() => del(r.id)} style={{ ...btnDanger, padding: '3px 8px' }}>×</button>
            </div>
          ))}
          {rules.length === 0 && <div style={{ fontSize: 11, color: SUBTLE, marginBottom: 12 }}>No velocity rules</div>}

          {violations.length > 0 && (
            <>
              <h5 style={{ margin: '16px 0 8px', fontSize: 12, color: '#BF2600' }}>Current Violations ({violations.length})</h5>
              {violations.map((v, i) => (
                <div key={i} style={{ ...cardSt, background: '#FFF0EE', border: '1px solid #FFCCC7' }}>
                  <div style={{ flex: 1, fontSize: 11 }}>
                    <span style={{ fontWeight: 600, color: NAVY }}>{v.deal?.company_name || `Deal #${v.deal?.id}`}</span>
                    <span style={{ color: '#BF2600', marginLeft: 6 }}>in "{v.rule?.stage || v.deal?.stage}" for {v.days_over + (v.rule?.max_days || 0)}d (max: {v.rule?.max_days}d)</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}

// ── Stage Validations ───────────────────────────────────────────────────────
export function StageValidationsPanel() {
  const [validations, setValidations] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ stage: '', field: '', rule_type: 'required', rule_config: '{}', blocking: true, message: '' })

  useEffect(() => { crmApi.getStageValidations().then(setValidations).catch(() => {}).finally(() => setLoading(false)) }, [])

  async function add() {
    if (!form.stage || !form.field) return
    const body = { ...form, rule_config: tryParse(form.rule_config) }
    try { const r = await crmApi.createStageValidation(body); setValidations(prev => [...prev, r]); setForm({ stage: '', field: '', rule_type: 'required', rule_config: '{}', blocking: true, message: '' }) } catch {}
  }
  async function del(id) { try { await crmApi.deleteStageValidation(id); setValidations(prev => prev.filter(v => v.id !== id)) } catch {} }

  return (
    <div>
      <h4 style={{ margin: '0 0 12px', fontSize: 14, color: NAVY }}>Stage Validations</h4>
      <p style={{ fontSize: 11, color: SUBTLE, margin: '0 0 12px' }}>Require specific fields to be filled or conditions met before deals can advance to a stage.</p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        <input placeholder="Target stage" value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))} style={{ ...inputSt, width: 110 }} />
        <input placeholder="Field name" value={form.field} onChange={e => setForm(f => ({ ...f, field: e.target.value }))} style={{ ...inputSt, width: 120 }} />
        <select value={form.rule_type} onChange={e => setForm(f => ({ ...f, rule_type: e.target.value }))} style={{ ...inputSt, width: 110 }}>
          <option value="required">Required</option>
          <option value="not_empty">Not Empty</option>
          <option value="min_value">Min Value</option>
          <option value="regex">Regex</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: NAVY }}>
          <input type="checkbox" checked={form.blocking} onChange={e => setForm(f => ({ ...f, blocking: e.target.checked }))} /> Blocking
        </label>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <input placeholder="Error message" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} style={{ ...inputSt, flex: 1 }} />
        <div style={{ width: 120 }}>
          <label style={{ fontSize: 9, color: SUBTLE }}>Config (JSON)</label>
          <input value={form.rule_config} onChange={e => setForm(f => ({ ...f, rule_config: e.target.value }))} style={{ ...inputSt, fontFamily: 'monospace', fontSize: 10 }} />
        </div>
        <button onClick={add} style={{ ...btnPrimary, alignSelf: 'flex-end' }}>+ Add</button>
      </div>
      {loading ? <div style={{ fontSize: 11, color: SUBTLE }}>Loading…</div> : validations.map(v => (
        <div key={v.id} style={cardSt}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>Stage "{v.stage}" — {v.field} ({v.rule_type})</div>
            <div style={{ fontSize: 10, color: SUBTLE }}>
              {v.blocking ? '🚫 Blocking' : '⚠️ Warning'} · {v.message || 'No message'}
            </div>
          </div>
          <button onClick={() => del(v.id)} style={{ ...btnDanger, padding: '3px 8px' }}>×</button>
        </div>
      ))}
      {!loading && validations.length === 0 && <div style={{ fontSize: 11, color: SUBTLE }}>No stage validations configured</div>}
    </div>
  )
}

// ── Notification Preferences ────────────────────────────────────────────────
export function NotificationPrefsPanel() {
  const [prefs, setPrefs] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ event_type: 'deal_won', channel: 'in_app', enabled: true })

  const eventTypes = ['deal_won', 'deal_lost', 'deal_created', 'stage_change', 'task_overdue', 'follow_up_due', 'sla_breach', 'approval_requested', 'deal_stale']

  useEffect(() => { crmApi.getNotificationPrefs().then(setPrefs).catch(() => {}).finally(() => setLoading(false)) }, [])

  async function save() {
    try { const r = await crmApi.setNotificationPref(form); setPrefs(prev => { const idx = prev.findIndex(p => p.id === r.id); return idx >= 0 ? prev.map(p => p.id === r.id ? r : p) : [...prev, r] }) } catch {}
  }
  async function del(id) { try { await crmApi.deleteNotificationPref(id); setPrefs(prev => prev.filter(p => p.id !== id)) } catch {} }

  return (
    <div>
      <h4 style={{ margin: '0 0 12px', fontSize: 14, color: NAVY }}>Notification Preferences</h4>
      <p style={{ fontSize: 11, color: SUBTLE, margin: '0 0 12px' }}>Control which events trigger notifications and through which channels.</p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <select value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))} style={{ ...inputSt, width: 150 }}>
          {eventTypes.map(e => <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))} style={{ ...inputSt, width: 100 }}>
          <option value="in_app">In-App</option>
          <option value="email">Email</option>
          <option value="both">Both</option>
          <option value="none">None</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: NAVY }}>
          <input type="checkbox" checked={form.enabled} onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))} style={{ accentColor: EMERALD }} />
          Enabled
        </label>
        <button onClick={save} style={btnPrimary}>Save Pref</button>
      </div>
      {loading ? <div style={{ fontSize: 11, color: SUBTLE }}>Loading…</div> : prefs.map(p => (
        <div key={p.id} style={{ ...cardSt, opacity: p.enabled ? 1 : 0.5 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: NAVY, flex: 1 }}>{(p.event_type || '').replace(/_/g, ' ')}</span>
          <span style={{ fontSize: 10, color: p.channel === 'none' ? '#BF2600' : BLUE, fontWeight: 600 }}>{p.channel}</span>
          <span style={{ fontSize: 9, color: p.enabled ? EMERALD : SUBTLE }}>{p.enabled ? 'ON' : 'OFF'}</span>
          <button onClick={() => del(p.id)} style={{ ...btnDanger, padding: '3px 8px' }}>×</button>
        </div>
      ))}
      {!loading && prefs.length === 0 && <div style={{ fontSize: 11, color: SUBTLE }}>Using default notification settings. Add preferences to customize.</div>}
    </div>
  )
}

// ── Snooze Manager ──────────────────────────────────────────────────────────
export function SnoozePanel() {
  const [snoozes, setSnoozes] = useState([])
  const [due, setDue] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ entity_type: 'deal', entity_id: '', snooze_until: '', reason: '' })

  useEffect(() => { load() }, [])
  function load() {
    Promise.all([crmApi.getSnoozes(), crmApi.getDueSnoozes()])
      .then(([s, d]) => { setSnoozes(s); setDue(d) })
      .catch(() => {}).finally(() => setLoading(false))
  }

  async function add() {
    if (!form.entity_id || !form.snooze_until) return
    try { const r = await crmApi.createSnooze({ ...form, entity_id: parseInt(form.entity_id) }); setSnoozes(prev => [...prev, r]); setForm({ entity_type: 'deal', entity_id: '', snooze_until: '', reason: '' }) } catch {}
  }
  async function resolve(id) { try { await crmApi.resolveSnooze(id); setSnoozes(prev => prev.filter(s => s.id !== id)); setDue(prev => prev.filter(s => s.id !== id)) } catch {} }

  return (
    <div>
      <h4 style={{ margin: '0 0 12px', fontSize: 14, color: NAVY }}>Snooze Manager</h4>
      <p style={{ fontSize: 11, color: SUBTLE, margin: '0 0 12px' }}>Temporarily hide deals from active pipeline view and get reminded when it's time to revisit.</p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <input type="number" placeholder="Deal ID" value={form.entity_id} onChange={e => setForm(f => ({ ...f, entity_id: e.target.value }))} style={{ ...inputSt, width: 80 }} />
        <input placeholder="Reason" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} style={{ ...inputSt, flex: 1 }} />
        <input type="datetime-local" value={form.snooze_until} onChange={e => setForm(f => ({ ...f, snooze_until: e.target.value }))} style={{ ...inputSt, width: 180 }} />
        <button onClick={add} style={btnPrimary}>Snooze</button>
      </div>

      {due.length > 0 && (
        <>
          <h5 style={{ margin: '0 0 8px', fontSize: 12, color: '#BF2600' }}>Due Now ({due.length})</h5>
          {due.map(s => (
            <div key={s.id} style={{ ...cardSt, background: '#FFFAE6', border: '1px solid #FFE380' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: NAVY }}>Deal #{s.entity_id}</span>
                <span style={{ fontSize: 10, color: SUBTLE, marginLeft: 8 }}>{s.reason}</span>
              </div>
              <button onClick={() => resolve(s.id)} style={{ ...btnPrimary, padding: '3px 10px', background: EMERALD }}>Wake Up</button>
            </div>
          ))}
        </>
      )}

      {loading ? <div style={{ fontSize: 11, color: SUBTLE }}>Loading…</div> : (
        <>
          <h5 style={{ margin: '16px 0 8px', fontSize: 12, color: NAVY }}>Active Snoozes ({snoozes.length})</h5>
          {snoozes.map(s => (
            <div key={s.id} style={cardSt}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: NAVY }}>Deal #{s.entity_id}</span>
                <span style={{ fontSize: 10, color: SUBTLE, marginLeft: 8 }}>{s.reason} · Wakes: {new Date(s.snooze_until).toLocaleString()}</span>
              </div>
              <button onClick={() => resolve(s.id)} style={{ ...btnSecondary, padding: '3px 8px' }}>Resolve</button>
            </div>
          ))}
          {snoozes.length === 0 && <div style={{ fontSize: 11, color: SUBTLE }}>No snoozed deals</div>}
        </>
      )}
    </div>
  )
}

// ── Goal Cascading ──────────────────────────────────────────────────────────
export function GoalCascadePanel() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { crmApi.getCascadedGoals().then(setGoals).catch(() => {}).finally(() => setLoading(false)) }, [])

  function buildTree(flat) {
    const map = {}
    flat.forEach(g => { map[g.id] = { ...g, children: [] } })
    const roots = []
    flat.forEach(g => {
      if (g.parent_goal_id && map[g.parent_goal_id]) map[g.parent_goal_id].children.push(map[g.id])
      else roots.push(map[g.id])
    })
    return roots
  }

  function renderTree(items, depth = 0) {
    return items.map(g => (
      <div key={g.id}>
        <div style={{ ...cardSt, marginLeft: depth * 20, background: depth === 0 ? '#F0F9FF' : '#FAFBFC' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>{g.goal_type || 'revenue'}: {g.metric}</div>
            <div style={{ fontSize: 10, color: SUBTLE }}>
              Target: {g.target_value} · Current: {g.current_value || 0} · Period: {g.period_key}
              {g.team && ` · Team: ${g.team}`}
              {g.assigned_to && ` · Owner: ${g.assigned_to}`}
            </div>
            <div style={{ marginTop: 4, height: 4, background: BORDER, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: (g.current_value || 0) >= g.target_value ? EMERALD : BLUE, width: `${Math.min(100, ((g.current_value || 0) / g.target_value) * 100)}%`, borderRadius: 2 }} />
            </div>
          </div>
        </div>
        {g.children && g.children.length > 0 && renderTree(g.children, depth + 1)}
      </div>
    ))
  }

  return (
    <div>
      <h4 style={{ margin: '0 0 12px', fontSize: 14, color: NAVY }}>Goal Cascade</h4>
      <p style={{ fontSize: 11, color: SUBTLE, margin: '0 0 12px' }}>View hierarchical goals. Parent goals cascade percentages down to child goals. Manage goals in the Goals section of the nav.</p>
      {loading ? <div style={{ fontSize: 11, color: SUBTLE }}>Loading…</div> : (
        goals.length === 0 ? <div style={{ fontSize: 11, color: SUBTLE }}>No cascaded goals. Create goals with parent_goal_id to build a hierarchy.</div> : renderTree(buildTree(goals))
      )}
    </div>
  )
}

function tryParse(str) {
  try { return JSON.parse(str) } catch { return str }
}
