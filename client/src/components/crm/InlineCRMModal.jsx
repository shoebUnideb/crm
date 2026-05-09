import { useState } from 'react'
import { crmApi } from '../../lib/crmApi.js'
import { linksApi } from '../../lib/linksApi.js'
import { eventBus, EVENTS } from '../../lib/eventBus.js'

const STAGES = ['lead', 'qualified', 'demo', 'proposal', 'negotiation', 'won']

export default function InlineCRMModal({ nodeId, nodeKey, companyName, projectId, onClose }) {
  const [form, setForm] = useState({
    company_name: companyName || '',
    contact_name: '',
    contact_email: '',
    deal_value: '',
    stage: 'lead',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.company_name.trim()) { setError('Company name is required'); return }
    setSaving(true)
    setError('')
    try {
      const deal = await crmApi.createDeal({
        ...form,
        node_id: nodeId,
        node_key: nodeKey || '',
        project_id: projectId || '',
      })
      await linksApi.create({
        source_type: 'node',
        source_id: nodeId,
        source_key: nodeKey || null,
        target_type: 'crm_deal',
        target_id: String(deal.id),
        relation: 'linked_to',
        project_id: projectId || null,
      })
      eventBus.emit(EVENTS.LINK_CREATED, { nodeId, dealId: deal.id })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to create deal')
    }
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
      <form onSubmit={handleSubmit} style={{
        position: 'relative', background: '#fff', borderRadius: 12, padding: 24,
        width: 380, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>Add to CRM</h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#666' }}>x</button>
        </div>

        {nodeKey && (
          <div style={{ marginBottom: 12, fontSize: 11, color: '#6B7280', background: '#F3F4F6', borderRadius: 6, padding: '4px 8px', display: 'inline-block' }}>
            Linked to {nodeKey}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Field label="Company *" value={form.company_name} onChange={v => set('company_name', v)} autoFocus />
          <Field label="Contact Name" value={form.contact_name} onChange={v => set('contact_name', v)} />
          <Field label="Contact Email" value={form.contact_email} onChange={v => set('contact_email', v)} type="email" />
          <Field label="Deal Value ($)" value={form.deal_value} onChange={v => set('deal_value', v)} type="number" />
          <div>
            <label style={labelStyle}>Stage</label>
            <select value={form.stage} onChange={e => set('stage', e.target.value)} style={inputStyle}>
              {STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>

        {error && <div style={{ marginTop: 10, color: '#DC2626', fontSize: 12 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={btnSecondary}>Cancel</button>
          <button type="submit" disabled={saving} style={btnPrimary}>
            {saving ? 'Creating...' : 'Create Deal'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', autoFocus }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoFocus={autoFocus}
        style={inputStyle}
      />
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 3 }
const inputStyle = { width: '100%', padding: '7px 10px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none', boxSizing: 'border-box' }
const btnPrimary = { padding: '8px 16px', fontSize: 13, fontWeight: 600, background: '#2563EB', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }
const btnSecondary = { padding: '8px 16px', fontSize: 13, fontWeight: 500, background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', borderRadius: 6, cursor: 'pointer' }
