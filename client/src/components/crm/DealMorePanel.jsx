import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { crmApi } from '../../lib/crmApi.js'

const EntityDocLinks = React.lazy(() => import('../docs/EntityDocLinks.jsx'))

const NAVY = '#172B4D', SUBTLE = '#5E6C84', BORDER = '#DFE1E6', WHITE = '#fff', BLUE = '#0052CC', EMERALD = '#10b981'
const btnPrimary = { padding: '6px 14px', background: BLUE, color: WHITE, border: 'none', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer' }
const btnSecondary = { padding: '6px 12px', background: WHITE, color: SUBTLE, border: `1px solid ${BORDER}`, borderRadius: 5, fontSize: 11, cursor: 'pointer' }
const btnDanger = { padding: '6px 12px', background: '#FFEBE6', color: '#BF2600', border: `1px solid #FFCCC7`, borderRadius: 5, fontSize: 11, cursor: 'pointer', fontWeight: 600 }
const inputSt = { width: '100%', padding: '7px 10px', border: `1.5px solid ${BORDER}`, borderRadius: 6, fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }

export default function DealMorePanel({ deal, onRefresh }) {
  const navigate = useNavigate()
  const [relations, setRelations] = useState([])
  const [snoozeForm, setSnoozeForm] = useState({ reason: '', wake_at: '' })
  const [splitForm, setSplitForm] = useState({ count: 2, amounts: '' })
  const [relForm, setRelForm] = useState({ related_deal_id: '', relation_type: 'related_to' })
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)

  useEffect(() => { loadRelations() }, [deal.id])

  function loadRelations() {
    crmApi.getDealRelations(deal.id).then(setRelations).catch(() => {}).finally(() => setLoading(false))
  }

  async function createRenewal() {
    try {
      const r = await crmApi.createRenewalDeal(deal.id)
      setMsg({ type: 'success', text: `Renewal deal #${r.id} created!` })
      onRefresh()
    } catch (e) { setMsg({ type: 'error', text: e.message || 'Failed to create renewal' }) }
  }

  async function splitDeal() {
    if (!splitForm.amounts) return
    const amounts = splitForm.amounts.split(',').map(a => parseFloat(a.trim())).filter(n => !isNaN(n))
    if (amounts.length < 2) { setMsg({ type: 'error', text: 'Need at least 2 amounts, comma-separated' }); return }
    const splits = amounts.map(val => ({ deal_value: val }))
    try {
      const r = await crmApi.splitDeal(deal.id, splits)
      setMsg({ type: 'success', text: `Deal split into ${r.length || splits.length} deals!` })
      setSplitForm({ count: 2, amounts: '' })
      onRefresh()
    } catch (e) { setMsg({ type: 'error', text: e.message || 'Failed to split deal' }) }
  }

  async function snoozeDeal() {
    if (!snoozeForm.wake_at) return
    try {
      await crmApi.createSnooze({ entity_type: 'deal', entity_id: deal.id, snooze_until: snoozeForm.wake_at, reason: snoozeForm.reason })
      setMsg({ type: 'success', text: 'Deal snoozed!' })
      setSnoozeForm({ reason: '', wake_at: '' })
    } catch (e) { setMsg({ type: 'error', text: e.message || 'Failed to snooze' }) }
  }

  async function addRelation() {
    if (!relForm.related_deal_id) return
    try {
      await crmApi.createDealRelation({ deal_id: deal.id, related_deal_id: parseInt(relForm.related_deal_id), relation_type: relForm.relation_type })
      setRelForm({ related_deal_id: '', relation_type: 'related_to' })
      loadRelations()
    } catch (e) { setMsg({ type: 'error', text: e.message || 'Failed to add relation' }) }
  }

  async function delRelation(id) {
    try { await crmApi.deleteDealRelation(id); setRelations(prev => prev.filter(r => r.id !== id)) } catch {}
  }

  async function requestApproval() {
    try {
      await crmApi.requestApproval(deal.id, {})
      setMsg({ type: 'success', text: 'Approval requested!' })
    } catch (e) { setMsg({ type: 'error', text: e.message || 'Failed to request approval' }) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {msg && (
        <div style={{ padding: '8px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: msg.type === 'success' ? '#E3FCEF' : '#FFEBE6', color: msg.type === 'success' ? '#006644' : '#BF2600', border: `1px solid ${msg.type === 'success' ? '#57D9A3' : '#FFCCC7'}` }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'inherit' }}>×</button>
        </div>
      )}

      {/* Renewal */}
      <Section title="Renewal" icon="🔄">
        <p style={{ fontSize: 11, color: SUBTLE, margin: '0 0 8px' }}>Create a renewal deal linked to this one (copies details, resets stage).</p>
        {deal.is_recurring && <div style={{ fontSize: 10, color: EMERALD, marginBottom: 6 }}>This is a recurring deal (MRR: ${deal.mrr_value || 0})</div>}
        <button onClick={createRenewal} style={btnPrimary}>Create Renewal Deal</button>
      </Section>

      {/* Deal Split */}
      <Section title="Split Deal" icon="✂️">
        <p style={{ fontSize: 11, color: SUBTLE, margin: '0 0 8px' }}>Split this deal ({fmtCurrency(deal.deal_value)}) into multiple deals with specified amounts.</p>
        <div style={{ display: 'flex', gap: 6 }}>
          <input placeholder="Amounts (e.g. 3000, 2000, 5000)" value={splitForm.amounts} onChange={e => setSplitForm(f => ({ ...f, amounts: e.target.value }))} style={{ ...inputSt, flex: 1 }} />
          <button onClick={splitDeal} style={btnPrimary}>Split</button>
        </div>
      </Section>

      {/* Snooze */}
      <Section title="Snooze Deal" icon="💤">
        <p style={{ fontSize: 11, color: SUBTLE, margin: '0 0 8px' }}>Temporarily hide this deal and get reminded later.</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <input placeholder="Reason" value={snoozeForm.reason} onChange={e => setSnoozeForm(f => ({ ...f, reason: e.target.value }))} style={{ ...inputSt, flex: 1, minWidth: 100 }} />
          <input type="datetime-local" value={snoozeForm.wake_at} onChange={e => setSnoozeForm(f => ({ ...f, wake_at: e.target.value }))} style={{ ...inputSt, width: 170 }} />
          <button onClick={snoozeDeal} style={btnPrimary}>Snooze</button>
        </div>
      </Section>

      {/* Related Deals */}
      <Section title="Related Deals" icon="🔗">
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <input type="number" placeholder="Deal ID" value={relForm.related_deal_id} onChange={e => setRelForm(f => ({ ...f, related_deal_id: e.target.value }))} style={{ ...inputSt, width: 80 }} />
          <select value={relForm.relation_type} onChange={e => setRelForm(f => ({ ...f, relation_type: e.target.value }))} style={{ ...inputSt, width: 120 }}>
            <option value="related_to">Related To</option>
            <option value="blocks">Blocks</option>
            <option value="blocked_by">Blocked By</option>
            <option value="parent_of">Parent Of</option>
            <option value="child_of">Child Of</option>
          </select>
          <button onClick={addRelation} style={btnPrimary}>+ Add</button>
        </div>
        {loading ? <div style={{ fontSize: 11, color: SUBTLE }}>Loading…</div> : (
          <>
            {relations.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', background: '#FAFBFC', borderRadius: 5, marginBottom: 3, border: `1px solid ${BORDER}` }}>
                <span style={{ fontSize: 10, color: BLUE, fontWeight: 600 }}>{r.relation_type.replace(/_/g, ' ')}</span>
                <span style={{ fontSize: 11, color: NAVY, flex: 1 }}>Deal #{r.deal_id === deal.id ? r.related_deal_id : r.deal_id}</span>
                <button onClick={() => delRelation(r.id)} style={{ ...btnDanger, padding: '2px 6px', fontSize: 10 }}>×</button>
              </div>
            ))}
            {relations.length === 0 && <div style={{ fontSize: 11, color: SUBTLE }}>No related deals</div>}
          </>
        )}
      </Section>

      {/* Request Approval */}
      <Section title="Approval" icon="✅">
        <p style={{ fontSize: 11, color: SUBTLE, margin: '0 0 8px' }}>Submit this deal for manager approval (if approval rules are configured).</p>
        <button onClick={requestApproval} style={btnPrimary}>Request Approval</button>
      </Section>

      {/* Linked Docs */}
      <Section title="Linked Docs" icon="📄">
        <React.Suspense fallback={<div style={{ fontSize: 11, color: SUBTLE }}>Loading…</div>}>
          <EntityDocLinks
            sourceType="crm_deal"
            sourceId={String(deal.id)}
            canEdit={true}
            onNavigate={(spaceSlug, pageId) => navigate(`/app/docs/${spaceSlug}/${pageId}`)}
          />
        </React.Suspense>
      </Section>

      {/* Stage Validation Check */}
      <StageValidationCheck deal={deal} />
    </div>
  )
}

function Section({ title, icon, children }) {
  return (
    <div style={{ background: '#FAFBFC', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 8 }}>{icon} {title}</div>
      {children}
    </div>
  )
}

function StageValidationCheck({ deal }) {
  const [target, setTarget] = useState('')
  const [result, setResult] = useState(null)

  async function check() {
    if (!target) return
    try {
      const r = await crmApi.checkStageValidation(deal.id, target)
      setResult(r)
    } catch (e) { setResult({ valid: false, errors: [e.message || 'Check failed'] }) }
  }

  return (
    <div style={{ background: '#FAFBFC', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 8 }}>🚦 Stage Gate Check</div>
      <p style={{ fontSize: 11, color: SUBTLE, margin: '0 0 8px' }}>Check if this deal meets requirements to advance to a target stage.</p>
      <div style={{ display: 'flex', gap: 6 }}>
        <input placeholder="Target stage" value={target} onChange={e => setTarget(e.target.value)} style={{ ...inputSt, flex: 1 }} />
        <button onClick={check} style={btnPrimary}>Check</button>
      </div>
      {result && (
        <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 6, background: result.valid ? '#E3FCEF' : '#FFEBE6', border: `1px solid ${result.valid ? '#57D9A3' : '#FFCCC7'}` }}>
          {result.valid ? (
            <span style={{ fontSize: 11, color: '#006644', fontWeight: 600 }}>✓ Deal can advance to "{target}"</span>
          ) : (
            <div>
              <span style={{ fontSize: 11, color: '#BF2600', fontWeight: 600 }}>✗ Cannot advance. Missing:</span>
              <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: 10, color: '#BF2600' }}>
                {(result.errors || result.missing_fields || []).map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function fmtCurrency(v) {
  return '$' + (parseFloat(v) || 0).toLocaleString()
}
