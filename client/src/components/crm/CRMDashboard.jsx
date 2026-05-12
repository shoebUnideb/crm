import React, { useState, useEffect } from 'react'
import { peopleApi } from '../../lib/crmPeopleApi.js'

const EMERALD = '#10b981'
const NAVY    = '#172B4D'
const SUBTLE  = '#5E6C84'
const BORDER  = '#DFE1E6'
const BG      = '#F7F8FA'
const WHITE   = '#fff'

const STAGE_ORDER_DEFAULT = ['lead','qualified','demo','proposal','negotiation','won','lost']
const STAGE_COLORS_DEFAULT = {
  lead:        '#DEEBFF',
  qualified:   '#EAE6FF',
  demo:        '#FFF0B3',
  proposal:    '#FFEBE6',
  negotiation: '#FFF4E5',
  won:         '#E3FCEF',
  lost:        '#F4F5F7',
}
const STAGE_TEXT_DEFAULT = {
  lead:'#0052CC', qualified:'#5243AA', demo:'#FF8B00', proposal:'#BF2600',
  negotiation:'#FF991F', won:'#006644', lost:'#97A0AF',
}
const ACT_ICON = { note:'📝', call:'📞', email:'✉️', meeting:'🤝' }

function fmt$(v, cur) {
  const n = parseFloat(v) || 0
  if (!cur || cur === 'USD') {
    if (n >= 1_000_000) return '$' + (n/1_000_000).toFixed(1)+'M'
    if (n >= 1_000) return '$' + (n/1_000).toFixed(0)+'K'
    return '$' + n.toFixed(0)
  }
  try { return new Intl.NumberFormat(undefined,{style:'currency',currency:cur,maximumFractionDigits:0}).format(n) }
  catch { return cur+' '+n.toFixed(0) }
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(undefined, { month:'short', day:'numeric' })
}

function StatCard({ label, value, sub, color = EMERALD }) {
  return (
    <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '16px 20px', flex: 1, minWidth: 130 }}>
      <div style={{ fontSize: 11, color: SUBTLE, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: SUBTLE, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

export default function CRMDashboard({ onNavigate, stages = [] }) {
  const STAGE_ORDER  = stages.length ? stages.map(s => s.id ?? s.name) : STAGE_ORDER_DEFAULT
  const STAGE_COLORS = stages.length ? Object.fromEntries(stages.map(s => [s.id ?? s.name, s.bg ?? s.bg_color ?? '#F4F5F7'])) : STAGE_COLORS_DEFAULT
  const STAGE_TEXT   = stages.length ? Object.fromEntries(stages.map(s => [s.id ?? s.name, s.color ?? '#97A0AF']))              : STAGE_TEXT_DEFAULT
  const stageLabel   = id => stages.length ? (stages.find(s => (s.id ?? s.name) === id)?.label ?? id) : id
  const [data, setData] = useState(null)
  const [funnel, setFunnel] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [d, f] = await Promise.all([peopleApi.getDashboard(), peopleApi.getPipelineFunnel()])
        if (!cancelled) { setData(d); setFunnel(f) }
      } catch (e) { if (!cancelled) setError(e.message) }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:SUBTLE, fontSize:14 }}>Loading dashboard…</div>
  )
  if (error) return (
    <div style={{ padding:32, color:'#BF2600', fontSize:13 }}>Error: {error}</div>
  )

  const totalPipeline = parseFloat(data?.forecast?.pipeline || 0)
  const weighted = parseFloat(data?.forecast?.forecast || 0)
  const totalDeals = (data?.stages || []).reduce((s,r) => s + parseInt(r.cnt), 0)
  const wonDeals = (data?.stage_counts || []).find(r => r.stage === 'won')
  const lostDeals = (data?.stage_counts || []).find(r => r.stage === 'lost')
  const winRate = wonDeals && (parseInt(wonDeals.cnt) + parseInt(lostDeals?.cnt || 0)) > 0
    ? Math.round(parseInt(wonDeals.cnt) / (parseInt(wonDeals.cnt) + parseInt(lostDeals?.cnt || 0)) * 100)
    : 0

  // Pipeline stage bar
  const maxFunnelCnt = Math.max(...funnel.map(r => parseInt(r.cnt)), 1)

  // Activity breakdown
  const totalActs = (data?.activity_breakdown || []).reduce((s,r) => s + parseInt(r.cnt), 0)

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', background:BG }}>
      {/* ── Stat cards ── */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <StatCard label="Pipeline Value" value={fmt$(totalPipeline)} sub={`${totalDeals} open deal${totalDeals!==1?'s':''}`} />
        <StatCard label="Weighted Forecast" value={fmt$(weighted)} sub="Probability-adjusted" color="#8B5CF6" />
        <StatCard label="Win Rate" value={`${winRate}%`} sub={`${wonDeals?.cnt||0} won · ${lostDeals?.cnt||0} lost`} color={winRate >= 50 ? EMERALD : '#FF8B00'} />
        <StatCard label="Contacts" value={data?.recent_people?.length !== undefined ? '—' : '—'} sub="See Contacts tab" color={NAVY} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        {/* ── Pipeline by stage ── */}
        <div style={{ background:WHITE, border:`1px solid ${BORDER}`, borderRadius:10, padding:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:NAVY, marginBottom:12 }}>Pipeline by Stage</div>
          {STAGE_ORDER.filter(s => stages.length ? (stages.find(x => (x.id??x.name) === s)?.is_lost !== true) : s !== 'lost').map(stage => {
            const row = (data?.stages || []).find(r => r.stage === stage)
            const cnt = parseInt(row?.cnt || 0)
            const total = parseFloat(row?.total || 0)
            const pct = Math.round(cnt / Math.max(totalDeals, 1) * 100)
            return (
              <div key={stage} style={{ marginBottom: 8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:11, fontWeight:600, color:STAGE_TEXT[stage], background:STAGE_COLORS[stage], padding:'1px 6px', borderRadius:3 }}>{stageLabel(stage)}</span>
                  <span style={{ fontSize:11, color:SUBTLE }}>{cnt} deal{cnt!==1?'s':''} · {fmt$(total)}</span>
                </div>
                <div style={{ height:6, background:'#F0F0F0', borderRadius:3 }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:STAGE_COLORS[stage] === '#F4F5F7' ? '#DFE1E6' : EMERALD, borderRadius:3, opacity:0.8, minWidth:pct>0?4:0 }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Conversion funnel ── */}
        <div style={{ background:WHITE, border:`1px solid ${BORDER}`, borderRadius:10, padding:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:NAVY, marginBottom:12 }}>Conversion Funnel</div>
          {STAGE_ORDER.map(stage => {
            const row = funnel.find(r => r.stage === stage)
            const cnt = parseInt(row?.cnt || 0)
            const avgDays = parseFloat(row?.avg_days || 0).toFixed(1)
            const barW = Math.round(cnt / maxFunnelCnt * 100)
            return (
              <div key={stage} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                <div style={{ width:90, fontSize:10, fontWeight:600, color:STAGE_TEXT[stage], textAlign:'right', flexShrink:0 }}>{stageLabel(stage)}</div>
                <div style={{ flex:1, height:18, background:'#F0F0F0', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${barW}%`, background:STAGE_COLORS[stage] === '#F4F5F7' ? '#DFE1E6' : EMERALD, minWidth:cnt>0?4:0, display:'flex', alignItems:'center', paddingLeft:4 }}>
                    {cnt > 0 && <span style={{ fontSize:9, color:WHITE, fontWeight:700, whiteSpace:'nowrap' }}>{cnt}</span>}
                  </div>
                </div>
                <div style={{ width:50, fontSize:10, color:SUBTLE, flexShrink:0 }}>{avgDays}d avg</div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:16 }}>
        {/* ── Recent deals ── */}
        <div style={{ background:WHITE, border:`1px solid ${BORDER}`, borderRadius:10, padding:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <span style={{ fontSize:12, fontWeight:700, color:NAVY }}>Recent Deals</span>
            <button onClick={() => onNavigate('pipeline')} style={{ fontSize:10, color:EMERALD, background:'none', border:'none', cursor:'pointer', padding:0 }}>View all →</button>
          </div>
          {(data?.recent_deals || []).length === 0
            ? <div style={{ fontSize:11, color:'#97A0AF', textAlign:'center', padding:'12px 0' }}>No deals yet</div>
            : (data?.recent_deals || []).map(d => (
              <div key={d.id} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:7, paddingBottom:7, borderBottom:`1px solid ${BORDER}` }}>
                <span style={{ fontSize:10, padding:'1px 5px', borderRadius:3, background:STAGE_COLORS[d.stage]||'#F4F5F7', color:STAGE_TEXT[d.stage]||'#97A0AF', fontWeight:600, flexShrink:0, whiteSpace:'nowrap' }}>{stageLabel(d.stage)}</span>
                <span style={{ flex:1, fontSize:11, fontWeight:500, color:NAVY, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.company_name}</span>
                <span style={{ fontSize:11, color:SUBTLE, flexShrink:0 }}>{fmt$(d.deal_value, d.currency)}</span>
              </div>
            ))
          }
        </div>

        {/* ── Recent contacts ── */}
        <div style={{ background:WHITE, border:`1px solid ${BORDER}`, borderRadius:10, padding:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <span style={{ fontSize:12, fontWeight:700, color:NAVY }}>New Contacts</span>
            <button onClick={() => onNavigate('contacts')} style={{ fontSize:10, color:EMERALD, background:'none', border:'none', cursor:'pointer', padding:0 }}>View all →</button>
          </div>
          {(data?.recent_people || []).length === 0
            ? <div style={{ fontSize:11, color:'#97A0AF', textAlign:'center', padding:'12px 0' }}>No contacts yet</div>
            : (data?.recent_people || []).map(p => (
              <div key={p.id} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:7, paddingBottom:7, borderBottom:`1px solid ${BORDER}` }}>
                <div style={{ width:24, height:24, borderRadius:'50%', background:'#D1FAE5', color:'#065F46', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, flexShrink:0 }}>
                  {(p.name||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:11, fontWeight:500, color:NAVY, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                  {p.organization && <div style={{ fontSize:10, color:SUBTLE, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.organization}</div>}
                </div>
                <div style={{ fontSize:10, color:'#97A0AF', flexShrink:0 }}>{fmtDate(p.created_at)}</div>
              </div>
            ))
          }
        </div>

        {/* ── Activity breakdown + Lost reasons ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ background:WHITE, border:`1px solid ${BORDER}`, borderRadius:10, padding:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:NAVY, marginBottom:10 }}>Activity (30d)</div>
            {(data?.activity_breakdown || []).length === 0
              ? <div style={{ fontSize:11, color:'#97A0AF', textAlign:'center', padding:'8px 0' }}>No activities</div>
              : (data?.activity_breakdown || []).sort((a,b)=>b.cnt-a.cnt).map(r => {
                  const pct = Math.round(parseInt(r.cnt) / Math.max(totalActs,1) * 100)
                  return (
                    <div key={r.type} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5 }}>
                      <span style={{ fontSize:12, width:18 }}>{ACT_ICON[r.type]||'📝'}</span>
                      <div style={{ flex:1, height:6, background:'#F0F0F0', borderRadius:3 }}>
                        <div style={{ height:'100%', width:`${pct}%`, background:EMERALD, borderRadius:3, minWidth:pct>0?4:0 }} />
                      </div>
                      <span style={{ fontSize:10, color:SUBTLE, width:28, textAlign:'right' }}>{r.cnt}</span>
                    </div>
                  )
                })
            }
          </div>

          {(data?.lost_reasons || []).length > 0 && (
            <div style={{ background:WHITE, border:`1px solid ${BORDER}`, borderRadius:10, padding:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:NAVY, marginBottom:10 }}>Lost Reasons</div>
              {data.lost_reasons.map(r => (
                <div key={r.lost_reason} style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:11 }}>
                  <span style={{ color:SUBTLE, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{r.lost_reason}</span>
                  <span style={{ fontWeight:600, color:'#BF2600', flexShrink:0, marginLeft:6 }}>{r.cnt}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Export buttons ── */}
      <div style={{ background:WHITE, border:`1px solid ${BORDER}`, borderRadius:10, padding:16, display:'flex', alignItems:'center', gap:12 }}>
        <span style={{ fontSize:12, fontWeight:700, color:NAVY, marginRight:8 }}>Export Data</span>
        <button onClick={() => peopleApi.exportContacts()} style={{ padding:'5px 14px', background:'none', border:`1.5px solid ${BORDER}`, borderRadius:6, cursor:'pointer', fontSize:11, color:SUBTLE }}>↓ Contacts CSV</button>
        <button onClick={() => peopleApi.exportOrgs()} style={{ padding:'5px 14px', background:'none', border:`1.5px solid ${BORDER}`, borderRadius:6, cursor:'pointer', fontSize:11, color:SUBTLE }}>↓ Organizations CSV</button>
        <button onClick={() => peopleApi.exportDeals()} style={{ padding:'5px 14px', background:'none', border:`1.5px solid ${BORDER}`, borderRadius:6, cursor:'pointer', fontSize:11, color:SUBTLE }}>↓ Deals CSV</button>
      </div>
    </div>
  )
}
