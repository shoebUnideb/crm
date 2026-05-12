import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { leadsApi } from '../../lib/crmLeadsApi.js'
import { crmApi } from '../../lib/crmApi.js'
import { peopleApi } from '../../lib/crmPeopleApi.js'

const NAVY = '#172B4D'
const SUBTLE = '#5E6C84'
const BORDER = '#DFE1E6'
const BG = '#F7F8FA'
const WHITE = '#fff'

const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'unqualified', 'nurturing', 'converted']
const STATUS_COLORS = {
  new:          { bg: '#DEEBFF', color: '#0052CC' },
  contacted:    { bg: '#EAE6FF', color: '#5243AA' },
  qualified:    { bg: '#E3FCEF', color: '#006644' },
  unqualified:  { bg: '#FFEBE6', color: '#BF2600' },
  nurturing:    { bg: '#FFF0B3', color: '#FF8B00' },
  converted:    { bg: '#E3FCEF', color: '#00875A' },
}
const SOURCE_OPTIONS = ['web_form', 'referral', 'linkedin', 'cold_outreach', 'event', 'ad_campaign', 'import', 'other']
const SOURCE_LABELS = { web_form: 'Web Form', referral: 'Referral', linkedin: 'LinkedIn', cold_outreach: 'Cold Outreach', event: 'Event', ad_campaign: 'Ad Campaign', import: 'Import', other: 'Other' }

const ALL_COLUMNS = [
  { key: 'name', label: 'Lead Name', default: true, locked: true },
  { key: 'company', label: 'Company', default: true },
  { key: 'source', label: 'Source', default: true },
  { key: 'status', label: 'Status', default: true },
  { key: 'lead_score', label: 'Score', default: true },
  { key: 'assigned_to', label: 'Owner', default: true },
  { key: 'last_contacted_at', label: 'Last Contacted', default: true },
  { key: 'next_follow_up', label: 'Next Follow-up', default: true },
  { key: 'created_at', label: 'Created', default: true },
  { key: 'email', label: 'Email', default: false },
  { key: 'phone', label: 'Phone', default: false },
  { key: 'tags', label: 'Tags', default: false },
  { key: 'title', label: 'Title/Role', default: false },
]

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Lead Create/Edit Modal ──────────────────────────────────────────────────
function LeadModal({ initial, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '', title: '', source: '', status: 'new',
    assigned_to: '', next_follow_up: '', notes: '', tags: '', linkedin_url: '', website: '', address: '',
    lead_score: '',
    ...(initial || {}),
  })
  const [tried, setTried] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const fld = { display: 'block', fontSize: 11, fontWeight: 500, color: SUBTLE, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }
  const inp = { width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: 2, border: `1px solid ${BORDER}`, fontSize: 12, color: NAVY, background: WHITE, fontFamily: 'inherit', outline: 'none' }

  function handleSave() {
    setTried(true)
    if (!form.name.trim()) return
    onSave(form)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
      <div style={{ position: 'relative', background: WHITE, borderRadius: 4, width: 540, maxWidth: '94vw', boxShadow: '0 12px 40px rgba(0,0,0,0.18)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: NAVY }}>{initial ? 'Edit Lead' : 'New Lead'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#97A0AF', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
            <div>
              <label style={fld}>Lead name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="John Smith"
                style={{ ...inp, borderColor: tried && !form.name.trim() ? '#DE350B' : BORDER }} />
              {tried && !form.name.trim() && <div style={{ fontSize: 10, color: '#DE350B', marginTop: 3 }}>Lead name is required</div>}
            </div>
            <div>
              <label style={fld}>Company</label>
              <input value={form.company} onChange={e => set('company', e.target.value)} placeholder="Acme Corp" style={inp} />
            </div>
            <div>
              <label style={fld}>Email</label>
              <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="john@acme.com" type="email" style={inp} />
            </div>
            <div>
              <label style={fld}>Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 555 0123" style={inp} />
            </div>
            <div>
              <label style={fld}>Title / Role</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Marketing Manager" style={inp} />
            </div>
            <div>
              <label style={fld}>Source</label>
              <select value={form.source} onChange={e => set('source', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                <option value="">Select source...</option>
                {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label style={fld}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                {STATUS_OPTIONS.filter(s => s !== 'converted').map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={fld}>Assigned to</label>
              <input value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)} placeholder="Owner name" style={inp} />
            </div>
            <div>
              <label style={fld}>Next follow-up</label>
              <input value={form.next_follow_up} onChange={e => set('next_follow_up', e.target.value)} type="date" style={inp} />
            </div>
            <div>
              <label style={fld}>LinkedIn URL</label>
              <input value={form.linkedin_url} onChange={e => set('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/..." style={inp} />
            </div>
            <div>
              <label style={fld}>Website</label>
              <input value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://acme.com" style={inp} />
            </div>
            <div>
              <label style={fld}>Tags</label>
              <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="hot, enterprise, q2" style={inp} />
            </div>
            <div>
              <label style={fld}>Lead Score (0-100)</label>
              <input value={form.lead_score} onChange={e => set('lead_score', e.target.value)} placeholder="0" type="number" min="0" max="100" style={inp} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={fld}>Address</label>
              <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Main St, City, Country" style={inp} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={fld}>Notes</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional context..." rows={3}
                style={{ ...inp, resize: 'vertical', minHeight: 48 }} />
            </div>
          </div>
        </div>
        <div style={{ padding: '10px 20px', borderTop: '1px solid #eee', display: 'flex', gap: 8, justifyContent: 'flex-end', background: '#FAFBFC' }}>
          <button onClick={onClose} style={{ padding: '6px 14px', background: WHITE, color: '#97A0AF', border: `1px solid ${BORDER}`, borderRadius: 2, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: '6px 16px', background: '#0052CC', color: WHITE, border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 12, fontWeight: 600, opacity: saving ? 0.55 : 1 }}>
            {saving ? 'Saving...' : initial ? 'Save Changes' : 'Create Lead'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Lead Convert Modal (3-step wizard) ──────────────────────────────────────
function LeadConvertModal({ lead, pipelines, stages, onClose, onConverted }) {
  const [step, setStep] = useState(1)
  const [personData, setPersonData] = useState({ name: lead.name || '', email: lead.email || '', phone: lead.phone || '', role: lead.title || '' })
  const [orgData, setOrgData] = useState({ company: lead.company || '', website: lead.website || '', address: lead.address || '' })
  const [dealData, setDealData] = useState({ pipeline_id: pipelines[0]?.id || null, stage: 'lead', deal_value: '', expected_close_date: '' })
  const [existingOrgId, setExistingOrgId] = useState(null)
  const [orgs, setOrgs] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    peopleApi.getOrganizations().then(setOrgs).catch(() => {})
  }, [])

  const pipelineStages = useMemo(() => {
    if (!stages || stages.length === 0) return [{ id: 'lead', label: 'Lead' }, { id: 'qualified', label: 'Qualified' }, { id: 'demo', label: 'Demo' }, { id: 'proposal', label: 'Proposal' }, { id: 'negotiation', label: 'Negotiation' }, { id: 'won', label: 'Won' }]
    if (!dealData.pipeline_id) return stages.map(s => ({ id: s.name || s.id, label: s.label || s.name }))
    const filtered = stages.filter(s => s.pipeline_id === dealData.pipeline_id)
    return filtered.length > 0 ? filtered.map(s => ({ id: s.name || s.id, label: s.label || s.name })) : [{ id: 'lead', label: 'Lead' }, { id: 'qualified', label: 'Qualified' }]
  }, [stages, dealData.pipeline_id])

  const matchingOrgs = orgs.filter(o => orgData.company && o.name?.toLowerCase().includes(orgData.company.toLowerCase()))

  async function handleConvert() {
    setSaving(true)
    try {
      const result = await leadsApi.convertLead(lead.id, {
        pipeline_id: dealData.pipeline_id,
        stage: dealData.stage,
        deal_value: dealData.deal_value,
        expected_close_date: dealData.expected_close_date,
        existing_org_id: existingOrgId,
      })
      onConverted(result)
    } catch (e) {
      alert(e.message || 'Conversion failed')
    }
    setSaving(false)
  }

  const fld = { display: 'block', fontSize: 11, fontWeight: 500, color: SUBTLE, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }
  const inp = { width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: 2, border: `1px solid ${BORDER}`, fontSize: 12, color: NAVY, background: WHITE, fontFamily: 'inherit', outline: 'none' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
      <div style={{ position: 'relative', background: WHITE, borderRadius: 6, width: 520, maxWidth: '94vw', boxShadow: '0 12px 40px rgba(0,0,0,0.18)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: NAVY }}>Convert Lead — Step {step}/3</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#97A0AF', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', padding: '10px 20px', gap: 4, borderBottom: '1px solid #f0f0f0' }}>
          {['Person & Org', 'Deal Setup', 'Confirm'].map((lbl, i) => (
            <div key={lbl} style={{ flex: 1, textAlign: 'center', padding: '4px 0', fontSize: 10, fontWeight: 600, color: step === i + 1 ? '#0052CC' : '#97A0AF', borderBottom: step === i + 1 ? '2px solid #0052CC' : '2px solid transparent' }}>{lbl}</div>
          ))}
        </div>

        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {step === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
              <div style={{ gridColumn: '1 / -1', fontSize: 11, fontWeight: 600, color: NAVY, borderBottom: '1px solid #eee', paddingBottom: 4, marginBottom: 4 }}>Person</div>
              <div>
                <label style={fld}>Name</label>
                <input value={personData.name} onChange={e => setPersonData(p => ({ ...p, name: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={fld}>Role / Title</label>
                <input value={personData.role} onChange={e => setPersonData(p => ({ ...p, role: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={fld}>Email</label>
                <input value={personData.email} onChange={e => setPersonData(p => ({ ...p, email: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={fld}>Phone</label>
                <input value={personData.phone} onChange={e => setPersonData(p => ({ ...p, phone: e.target.value }))} style={inp} />
              </div>
              <div style={{ gridColumn: '1 / -1', fontSize: 11, fontWeight: 600, color: NAVY, borderBottom: '1px solid #eee', paddingBottom: 4, marginBottom: 4, marginTop: 8 }}>Organization</div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={fld}>Company name</label>
                <input value={orgData.company} onChange={e => { setOrgData(o => ({ ...o, company: e.target.value })); setExistingOrgId(null) }} style={inp} />
                {matchingOrgs.length > 0 && !existingOrgId && (
                  <div style={{ marginTop: 4, border: `1px solid ${BORDER}`, borderRadius: 2, maxHeight: 100, overflowY: 'auto' }}>
                    {matchingOrgs.slice(0, 5).map(o => (
                      <div key={o.id} onClick={() => { setExistingOrgId(o.id); setOrgData(d => ({ ...d, company: o.name })) }}
                        style={{ padding: '5px 8px', fontSize: 11, cursor: 'pointer', color: NAVY }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                        onMouseLeave={e => e.currentTarget.style.background = WHITE}>
                        {o.name} <span style={{ color: SUBTLE }}>(existing)</span>
                      </div>
                    ))}
                  </div>
                )}
                {existingOrgId && <div style={{ fontSize: 10, color: '#006644', marginTop: 4 }}>Will link to existing organization</div>}
              </div>
              <div>
                <label style={fld}>Website</label>
                <input value={orgData.website} onChange={e => setOrgData(o => ({ ...o, website: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={fld}>Address</label>
                <input value={orgData.address} onChange={e => setOrgData(o => ({ ...o, address: e.target.value }))} style={inp} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
              <div>
                <label style={fld}>Pipeline</label>
                <select value={dealData.pipeline_id || ''} onChange={e => setDealData(d => ({ ...d, pipeline_id: e.target.value ? parseInt(e.target.value) : null }))} style={{ ...inp, cursor: 'pointer' }}>
                  {pipelines.length === 0 && <option value="">Default</option>}
                  {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={fld}>Stage</label>
                <select value={dealData.stage} onChange={e => setDealData(d => ({ ...d, stage: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                  {pipelineStages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label style={fld}>Deal value ($)</label>
                <input value={dealData.deal_value} onChange={e => setDealData(d => ({ ...d, deal_value: e.target.value }))} placeholder="0" type="number" min="0" style={inp} />
              </div>
              <div>
                <label style={fld}>Expected close date</label>
                <input value={dealData.expected_close_date} onChange={e => setDealData(d => ({ ...d, expected_close_date: e.target.value }))} type="date" style={inp} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ fontSize: 12, color: NAVY, lineHeight: 1.8 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>This will create:</div>
              <div style={{ padding: '10px 14px', background: '#F4F5F7', borderRadius: 4, marginBottom: 8 }}>
                <div><strong>Person:</strong> {personData.name} {personData.email ? `(${personData.email})` : ''}</div>
                <div><strong>Organization:</strong> {orgData.company || '—'} {existingOrgId ? '(link to existing)' : orgData.company ? '(create new)' : ''}</div>
                <div><strong>Deal:</strong> {dealData.stage} stage{dealData.deal_value ? ` · $${dealData.deal_value}` : ''}{dealData.expected_close_date ? ` · closes ${dealData.expected_close_date}` : ''}</div>
              </div>
              <div style={{ fontSize: 11, color: SUBTLE }}>The lead will be marked as converted and will no longer appear in your active leads list.</div>
            </div>
          )}
        </div>

        <div style={{ padding: '10px 20px', borderTop: '1px solid #eee', display: 'flex', gap: 8, justifyContent: 'space-between', background: '#FAFBFC' }}>
          <div>
            {step > 1 && <button onClick={() => setStep(s => s - 1)} style={{ padding: '6px 14px', background: WHITE, color: SUBTLE, border: `1px solid ${BORDER}`, borderRadius: 2, cursor: 'pointer', fontSize: 12 }}>Back</button>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ padding: '6px 14px', background: WHITE, color: '#97A0AF', border: `1px solid ${BORDER}`, borderRadius: 2, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>Cancel</button>
            {step < 3 && <button onClick={() => setStep(s => s + 1)} style={{ padding: '6px 16px', background: '#0052CC', color: WHITE, border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Next</button>}
            {step === 3 && <button onClick={handleConvert} disabled={saving} style={{ padding: '6px 16px', background: '#006644', color: WHITE, border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 12, fontWeight: 600, opacity: saving ? 0.55 : 1 }}>{saving ? 'Converting...' : 'Convert Lead'}</button>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Lead Import Modal ───────────────────────────────────────────────────────
function LeadImportModal({ onClose, onImported }) {
  const [file, setFile] = useState(null)
  const [rows, setRows] = useState([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)

  function handleFile(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target.result
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) return
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z_]/g, ''))
      const parsed = lines.slice(1).map(line => {
        const vals = line.split(',')
        const obj = {}
        headers.forEach((h, i) => { obj[h] = vals[i]?.trim() || '' })
        return obj
      })
      setRows(parsed)
    }
    reader.readAsText(f)
  }

  async function handleImport() {
    setImporting(true)
    try {
      const r = await leadsApi.importLeads(rows)
      setResult(r)
      onImported()
    } catch (e) {
      alert(e.message || 'Import failed')
    }
    setImporting(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
      <div style={{ position: 'relative', background: WHITE, borderRadius: 4, width: 500, maxWidth: '94vw', boxShadow: '0 12px 40px rgba(0,0,0,0.18)', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: NAVY }}>Import Leads from CSV</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#97A0AF', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {result ? (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#006644' }}>{result.imported} leads imported</div>
              {rows.length - result.imported > 0 && (
                <div style={{ fontSize: 12, color: '#DE350B', marginTop: 6 }}>{rows.length - result.imported} rows skipped (missing required "name" field)</div>
              )}
              <button onClick={onClose} style={{ marginTop: 16, padding: '6px 16px', background: '#0052CC', color: WHITE, border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Done</button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="file" accept=".csv" onChange={handleFile} style={{ fontSize: 12 }} />
                <button onClick={() => {
                  const csv = 'name,email,phone,company,title,source,status,lead_score,assigned_to,next_follow_up,notes,tags,linkedin_url,website,address\nJohn Smith,john@acme.com,+1 555 0123,Acme Corp,Marketing Manager,linkedin,new,65,Sarah,2026-06-15,Met at conference,enterprise hot,https://linkedin.com/in/johnsmith,https://acme.com,123 Main St New York\nJane Doe,jane@techstart.io,+1 555 0456,TechStart Inc,CEO,web_form,contacted,80,Mike,2026-06-01,Requested demo,startup,https://linkedin.com/in/janedoe,https://techstart.io,456 Oak Ave SF\n'
                  const blob = new Blob([csv], { type: 'text/csv' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url; a.download = 'leads_import_template.csv'; a.click()
                  URL.revokeObjectURL(url)
                }} style={{ padding: '4px 10px', fontSize: 11, color: '#0052CC', background: 'none', border: `1px solid #0052CC`, borderRadius: 3, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  ↓ Download Template
                </button>
              </div>
              {rows.length > 0 && (
                <>
                  <div style={{ fontSize: 11, color: SUBTLE, marginBottom: 8 }}>{rows.length} rows found. Expected columns: name, email, phone, company, title, source, tags</div>
                  {!rows.some(r => r.name?.trim()) && (
                    <div style={{ fontSize: 11, color: '#DE350B', marginBottom: 8, padding: '6px 10px', background: '#FFF5F5', borderRadius: 2 }}>Warning: No rows have a "name" column. All rows will be skipped. Check your CSV headers match the template.</div>
                  )}
                  <div style={{ maxHeight: 200, overflowY: 'auto', border: `1px solid ${BORDER}`, borderRadius: 2, fontSize: 11 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#F4F5F7' }}>
                          {Object.keys(rows[0]).slice(0, 5).map(h => <th key={h} style={{ padding: '4px 8px', textAlign: 'left', fontWeight: 600, color: SUBTLE }}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(0, 5).map((r, i) => (
                          <tr key={i}>
                            {Object.values(r).slice(0, 5).map((v, j) => <td key={j} style={{ padding: '4px 8px', borderTop: '1px solid #eee', color: NAVY }}>{v}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {rows.length > 5 && <div style={{ fontSize: 10, color: SUBTLE, marginTop: 4 }}>...and {rows.length - 5} more rows</div>}
                </>
              )}
            </>
          )}
        </div>
        {!result && rows.length > 0 && (
          <div style={{ padding: '10px 20px', borderTop: '1px solid #eee', display: 'flex', gap: 8, justifyContent: 'flex-end', background: '#FAFBFC' }}>
            <button onClick={onClose} style={{ padding: '6px 14px', background: WHITE, color: '#97A0AF', border: `1px solid ${BORDER}`, borderRadius: 2, cursor: 'pointer', fontSize: 12 }}>Cancel</button>
            <button onClick={handleImport} disabled={importing} style={{ padding: '6px 16px', background: '#0052CC', color: WHITE, border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 12, fontWeight: 600, opacity: importing ? 0.55 : 1 }}>
              {importing ? 'Importing...' : `Import ${rows.length} leads`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main LeadsSection ───────────────────────────────────────────────────────
export default function LeadsSection({ stages = [], deals = [], importOpenProp = false, onImportClose }) {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [createOpen, setCreateOpen] = useState(false)
  const [editingLead, setEditingLead] = useState(null)
  const [convertingLead, setConvertingLead] = useState(null)
  const [importOpen, setImportOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pipelines, setPipelines] = useState([])
  const [allStages, setAllStages] = useState([])
  const [visibleCols, setVisibleCols] = useState(() => ALL_COLUMNS.filter(c => c.default).map(c => c.key))
  const [colPickerOpen, setColPickerOpen] = useState(false)
  const [menuOpenId, setMenuOpenId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await leadsApi.getLeads({ converted: 'false' })
      setLeads(data)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    crmApi.getPipelines().then(setPipelines).catch(() => {})
    peopleApi.getStages().then(setAllStages).catch(() => {})
  }, [])
  useEffect(() => {
    if (importOpenProp) setImportOpen(true)
  }, [importOpenProp])

  const filtered = useMemo(() => {
    let list = leads
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(l => l.name?.toLowerCase().includes(q) || l.company?.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q))
    }
    if (statusFilter) list = list.filter(l => l.status === statusFilter)
    if (sourceFilter) list = list.filter(l => l.source === sourceFilter)
    list.sort((a, b) => {
      let av = a[sortBy] ?? '', bv = b[sortBy] ?? ''
      if (sortBy === 'lead_score' || sortBy === 'deal_value') { av = parseFloat(av) || 0; bv = parseFloat(bv) || 0 }
      else { av = String(av).toLowerCase(); bv = String(bv).toLowerCase() }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [leads, search, statusFilter, sourceFilter, sortBy, sortDir])

  function toggleSort(col) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  async function handleCreate(form) {
    setSaving(true)
    try {
      const created = await leadsApi.createLead(form)
      setLeads(prev => [created, ...prev])
      setCreateOpen(false)
    } catch (e) { alert(e.message || 'Failed to create lead') }
    setSaving(false)
  }

  async function handleEdit(form) {
    setSaving(true)
    try {
      const updated = await leadsApi.updateLead(editingLead.id, form)
      setLeads(prev => prev.map(l => l.id === editingLead.id ? updated : l))
      setEditingLead(null)
    } catch (e) { alert(e.message || 'Failed to update lead') }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this lead?')) return
    try {
      await leadsApi.deleteLead(id)
      setLeads(prev => prev.filter(l => l.id !== id))
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n })
    } catch {}
  }

  async function handleInlineStatus(id, status) {
    try {
      const updated = await leadsApi.updateStatus(id, status)
      setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l))
    } catch {}
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selectedIds.size} leads?`)) return
    try {
      await leadsApi.bulkDelete([...selectedIds])
      setLeads(prev => prev.filter(l => !selectedIds.has(l.id)))
      setSelectedIds(new Set())
    } catch {}
  }

  async function handleBulkStatus(status) {
    try {
      await leadsApi.bulkUpdate([...selectedIds], { status })
      setLeads(prev => prev.map(l => selectedIds.has(l.id) ? { ...l, status } : l))
      setSelectedIds(new Set())
    } catch {}
  }

  function handleConverted() {
    setConvertingLead(null)
    load()
  }

  const allSelected = filtered.length > 0 && filtered.every(l => selectedIds.has(l.id))
  const today = new Date().toISOString().slice(0, 10)

  function renderCell(lead, col) {
    switch (col) {
      case 'name': return <span style={{ fontWeight: 500, color: NAVY, cursor: 'pointer' }} onClick={() => setEditingLead(lead)}>{lead.name}</span>
      case 'company': return <span style={{ color: NAVY }}>{lead.company || '—'}</span>
      case 'email': return lead.email ? <a href={`mailto:${lead.email}`} style={{ color: '#0052CC', textDecoration: 'none', fontSize: 12 }}>{lead.email}</a> : <span style={{ color: '#ccc' }}>—</span>
      case 'phone': return <span style={{ color: lead.phone ? '#0052CC' : '#ccc' }}>{lead.phone || '—'}</span>
      case 'source': {
        const lbl = SOURCE_LABELS[lead.source] || lead.source || '—'
        return <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: '#F4F5F7', color: SUBTLE, fontWeight: 500 }}>{lbl}</span>
      }
      case 'status': {
        const sc = STATUS_COLORS[lead.status] || { bg: '#F4F5F7', color: SUBTLE }
        return (
          <select value={lead.status} onChange={e => handleInlineStatus(lead.id, e.target.value)}
            style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: sc.bg, color: sc.color, fontWeight: 600, border: 'none', cursor: 'pointer', appearance: 'auto', outline: 'none' }}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        )
      }
      case 'lead_score': {
        const s = lead.lead_score || 0
        const color = s >= 70 ? '#006644' : s >= 40 ? '#FF8B00' : '#97A0AF'
        return <span style={{ fontWeight: 600, color }}>{s}</span>
      }
      case 'assigned_to': return <span style={{ color: NAVY }}>{lead.assigned_to || '—'}</span>
      case 'last_contacted_at': return <span style={{ color: SUBTLE }}>{fmtDate(lead.last_contacted_at)}</span>
      case 'next_follow_up': {
        const overdue = lead.next_follow_up && lead.next_follow_up < today
        return <span style={{ color: overdue ? '#DE350B' : SUBTLE, fontWeight: overdue ? 600 : 400 }}>{fmtDate(lead.next_follow_up)}</span>
      }
      case 'created_at': return <span style={{ color: SUBTLE }}>{fmtDate(lead.created_at)}</span>
      case 'tags': return <span style={{ fontSize: 10, color: SUBTLE }}>{lead.tags || '—'}</span>
      case 'title': return <span style={{ color: NAVY }}>{lead.title || '—'}</span>
      default: return '—'
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: WHITE, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0, flexWrap: 'wrap' }}>
        <button onClick={() => setCreateOpen(true)}
          style={{ padding: '6px 12px', background: '#0052CC', color: WHITE, border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
          + Lead
        </button>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..."
          style={{ padding: '6px 10px', border: `1px solid ${BORDER}`, borderRadius: 2, fontSize: 12, width: 180, outline: 'none', color: NAVY }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '5px 8px', border: `1px solid ${BORDER}`, borderRadius: 2, fontSize: 11, color: NAVY, cursor: 'pointer' }}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.filter(s => s !== 'converted').map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
          style={{ padding: '5px 8px', border: `1px solid ${BORDER}`, borderRadius: 2, fontSize: 11, color: NAVY, cursor: 'pointer' }}>
          <option value="">All sources</option>
          {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: SUBTLE }}>{filtered.length} leads</span>
        <button onClick={() => setImportOpen(true)}
          style={{ padding: '5px 10px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 2, cursor: 'pointer', fontSize: 11, color: SUBTLE }}>
          Import CSV
        </button>
        <div style={{ position: 'relative' }}>
          <button onMouseDown={e => e.stopPropagation()} onClick={() => setColPickerOpen(v => !v)}
            style={{ padding: '5px 8px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 2, cursor: 'pointer', fontSize: 11, color: SUBTLE }}>
            Columns
          </button>
          {colPickerOpen && (
            <>
              <div onClick={() => setColPickerOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 50, padding: 8, minWidth: 160 }}>
                {ALL_COLUMNS.map(c => (
                  <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: NAVY, padding: '3px 0', cursor: c.locked ? 'default' : 'pointer' }}>
                    <input type="checkbox" checked={visibleCols.includes(c.key)} disabled={c.locked}
                      onChange={e => setVisibleCols(prev => e.target.checked ? [...prev, c.key] : prev.filter(k => k !== c.key))} />
                    {c.label}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: '#172B4D', flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: WHITE }}>{selectedIds.size} selected</span>
          <select onChange={e => { if (e.target.value) handleBulkStatus(e.target.value); e.target.value = '' }}
            style={{ padding: '4px 8px', fontSize: 11, borderRadius: 2, border: 'none', cursor: 'pointer' }}>
            <option value="">Change status...</option>
            {STATUS_OPTIONS.filter(s => s !== 'converted').map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <button onClick={handleBulkDelete} style={{ padding: '4px 10px', background: '#DE350B', color: WHITE, border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Delete</button>
          <button onClick={() => setSelectedIds(new Set())} style={{ padding: '4px 10px', background: 'transparent', color: '#B3D4FF', border: '1px solid #B3D4FF', borderRadius: 2, cursor: 'pointer', fontSize: 11 }}>Deselect all</button>
        </div>
      )}

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: SUBTLE, fontSize: 12 }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: SUBTLE }}>
            <div style={{ fontSize: 13, marginBottom: 8 }}>No leads yet</div>
            <button onClick={() => setCreateOpen(true)} style={{ padding: '6px 14px', background: '#0052CC', color: WHITE, border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>+ Add your first lead</button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#FAFBFC', borderBottom: `2px solid ${BORDER}` }}>
                <th style={{ padding: '8px 10px', width: 32 }}>
                  <input type="checkbox" checked={allSelected} onChange={e => {
                    if (e.target.checked) setSelectedIds(new Set(filtered.map(l => l.id)))
                    else setSelectedIds(new Set())
                  }} />
                </th>
                {visibleCols.map(col => {
                  const def = ALL_COLUMNS.find(c => c.key === col)
                  return (
                    <th key={col} onClick={() => toggleSort(col)}
                      style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: SUBTLE, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }}>
                      {def?.label} {sortBy === col ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                    </th>
                  )
                })}
                <th style={{ padding: '8px 10px', width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => (
                <tr key={lead.id} style={{ borderBottom: `1px solid #f0f0f0` }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAFBFC'}
                  onMouseLeave={e => e.currentTarget.style.background = WHITE}>
                  <td style={{ padding: '8px 10px' }}>
                    <input type="checkbox" checked={selectedIds.has(lead.id)}
                      onChange={e => setSelectedIds(prev => { const n = new Set(prev); e.target.checked ? n.add(lead.id) : n.delete(lead.id); return n })} />
                  </td>
                  {visibleCols.map(col => (
                    <td key={col} style={{ padding: '8px 10px', whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {renderCell(lead, col)}
                    </td>
                  ))}
                  <td style={{ padding: '8px 10px', position: 'relative' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => setConvertingLead(lead)} title="Convert to Contact + Deal"
                        style={{ background: '#E3FCEF', border: 'none', borderRadius: 2, cursor: 'pointer', padding: '3px 6px', fontSize: 10, fontWeight: 600, color: '#006644' }}>
                        Convert
                      </button>
                      <div style={{ position: 'relative' }}>
                        <button onClick={() => setMenuOpenId(menuOpenId === lead.id ? null : lead.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#97A0AF', padding: '2px 6px' }}>⋯</button>
                        {menuOpenId === lead.id && (
                          <div onMouseDown={e => e.stopPropagation()} style={{ position: 'absolute', top: '100%', right: 0, marginTop: 2, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', zIndex: 50, minWidth: 100, padding: '3px 0' }}>
                            <button onClick={() => { setEditingLead(lead); setMenuOpenId(null) }}
                              style={{ display: 'block', width: '100%', padding: '6px 12px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 11, color: NAVY }}>Edit</button>
                            <button onClick={() => { handleDelete(lead.id); setMenuOpenId(null) }}
                              style={{ display: 'block', width: '100%', padding: '6px 12px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 11, color: '#DE350B' }}>Delete</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {createOpen && <LeadModal onSave={handleCreate} onClose={() => setCreateOpen(false)} saving={saving} />}
      {editingLead && <LeadModal initial={editingLead} onSave={handleEdit} onClose={() => setEditingLead(null)} saving={saving} />}
      {convertingLead && <LeadConvertModal lead={convertingLead} pipelines={pipelines} stages={allStages} onClose={() => setConvertingLead(null)} onConverted={handleConverted} />}
      {importOpen && <LeadImportModal onClose={() => { setImportOpen(false); onImportClose?.() }} onImported={load} />}
    </div>
  )
}
