import React, { useState, useEffect, useRef } from 'react'
import { peopleApi } from '../../lib/crmPeopleApi.js'

const NAVY  = '#172B4D'
const SUBTLE = '#5E6C84'
const BORDER = '#DFE1E6'
const BG     = '#F7F8FA'
const WHITE  = '#fff'
const EMERALD = '#10b981'

const STAGE_COLORS = { lead:'#DEEBFF', qualified:'#EAE6FF', demo:'#FFF0B3', proposal:'#FFEBE6', negotiation:'#FFF4E5', won:'#E3FCEF', lost:'#F4F5F7' }
const STAGE_TEXT   = { lead:'#0052CC', qualified:'#5243AA', demo:'#FF8B00', proposal:'#BF2600', negotiation:'#FF991F', won:'#006644', lost:'#97A0AF' }

function fmt$(v) {
  const n = parseFloat(v)||0
  if (n>=1_000_000) return '$'+(n/1_000_000).toFixed(1)+'M'
  if (n>=1_000) return '$'+(n/1_000).toFixed(0)+'K'
  return '$'+n.toFixed(0)
}

export default function GlobalSearch({ onNavigate, stages = [] }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const timer = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleChange(v) {
    setQ(v)
    clearTimeout(timer.current)
    if (v.length < 2) { setResults(null); return }
    setLoading(true)
    timer.current = setTimeout(async () => {
      try {
        const r = await peopleApi.search(v)
        setResults(r)
      } catch { /* silent */ }
      setLoading(false)
    }, 280)
  }

  const hasResults = results && (results.deals?.length || results.people?.length || results.orgs?.length)

  return (
    <div ref={ref} style={{ position:'relative', width:280 }}>
      <div style={{ display:'flex', alignItems:'center', background:BG, border:`1.5px solid ${BORDER}`, borderRadius:8, padding:'5px 10px', gap:6 }}>
        <span style={{ color:'#97A0AF', fontSize:12 }}>🔍</span>
        <input
          value={q}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search deals, contacts, orgs…"
          style={{ border:'none', background:'none', outline:'none', fontSize:11, color:NAVY, width:'100%', fontFamily:'inherit' }}
        />
        {loading && <span style={{ fontSize:10, color:'#97A0AF' }}>…</span>}
        {q && <button onClick={() => { setQ(''); setResults(null) }} style={{ background:'none', border:'none', cursor:'pointer', color:'#97A0AF', fontSize:13, padding:0, lineHeight:1 }}>×</button>}
      </div>

      {open && q.length >= 2 && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:200, marginTop:4, background:WHITE, border:`1px solid ${BORDER}`, borderRadius:8, boxShadow:'0 8px 24px rgba(9,30,66,0.2)', maxHeight:380, overflowY:'auto' }}>
          {!hasResults && !loading && (
            <div style={{ padding:'16px 14px', fontSize:12, color:'#97A0AF', textAlign:'center' }}>No results for "{q}"</div>
          )}

          {results?.deals?.length > 0 && (
            <div>
              <div style={{ padding:'6px 12px 2px', fontSize:9, fontWeight:700, color:'#97A0AF', textTransform:'uppercase', letterSpacing:'0.06em' }}>Deals</div>
              {results.deals.map(d => (
                <div key={d.id} onClick={() => { onNavigate('pipeline', d); setOpen(false); setQ('') }}
                  style={{ padding:'7px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}
                  onMouseEnter={e => e.currentTarget.style.background=BG}
                  onMouseLeave={e => e.currentTarget.style.background=WHITE}>
                  <span style={{ fontSize:10, padding:'1px 5px', borderRadius:3, background:(stages.find(s=>(s.id??s.name)===d.stage)?.bg??stages.find(s=>(s.id??s.name)===d.stage)?.bg_color??STAGE_COLORS[d.stage]??'#F4F5F7'), color:(stages.find(s=>(s.id??s.name)===d.stage)?.color??STAGE_TEXT[d.stage]??'#97A0AF'), fontWeight:600, flexShrink:0 }}>{stages.find(s=>(s.id??s.name)===d.stage)?.label??d.stage}</span>
                  <span style={{ flex:1, fontSize:12, fontWeight:500, color:NAVY }}>{d.company_name}</span>
                  <span style={{ fontSize:11, color:SUBTLE }}>{fmt$(d.deal_value)}</span>
                </div>
              ))}
            </div>
          )}

          {results?.people?.length > 0 && (
            <div style={{ borderTop: results?.deals?.length ? `1px solid ${BORDER}` : 'none' }}>
              <div style={{ padding:'6px 12px 2px', fontSize:9, fontWeight:700, color:'#97A0AF', textTransform:'uppercase', letterSpacing:'0.06em' }}>People</div>
              {results.people.map(p => (
                <div key={p.id} onClick={() => { onNavigate('contacts', p); setOpen(false); setQ('') }}
                  style={{ padding:'7px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}
                  onMouseEnter={e => e.currentTarget.style.background=BG}
                  onMouseLeave={e => e.currentTarget.style.background=WHITE}>
                  <div style={{ width:22, height:22, borderRadius:'50%', background:'#D1FAE5', color:'#065F46', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, flexShrink:0 }}>
                    {(p.name||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}
                  </div>
                  <div style={{ flex:1 }}>
                    <span style={{ fontSize:12, fontWeight:500, color:NAVY }}>{p.name}</span>
                    {p.organization && <span style={{ fontSize:10, color:SUBTLE, marginLeft:6 }}>{p.organization}</span>}
                  </div>
                  {p.email && <span style={{ fontSize:10, color:'#97A0AF' }}>{p.email}</span>}
                </div>
              ))}
            </div>
          )}

          {results?.orgs?.length > 0 && (
            <div style={{ borderTop: (results?.deals?.length||results?.people?.length) ? `1px solid ${BORDER}` : 'none' }}>
              <div style={{ padding:'6px 12px 2px', fontSize:9, fontWeight:700, color:'#97A0AF', textTransform:'uppercase', letterSpacing:'0.06em' }}>Organizations</div>
              {results.orgs.map(o => (
                <div key={o.id} onClick={() => { onNavigate('organizations', o); setOpen(false); setQ('') }}
                  style={{ padding:'7px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}
                  onMouseEnter={e => e.currentTarget.style.background=BG}
                  onMouseLeave={e => e.currentTarget.style.background=WHITE}>
                  <span style={{ fontSize:14 }}>🏢</span>
                  <span style={{ flex:1, fontSize:12, fontWeight:500, color:NAVY }}>{o.name}</span>
                  {o.industry && <span style={{ fontSize:10, color:SUBTLE }}>{o.industry}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
