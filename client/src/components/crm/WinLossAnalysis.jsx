import React, { useState, useEffect } from 'react'
import { crmApi } from '../../lib/crmApi.js'

const NAVY = '#172B4D', SUBTLE = '#5E6C84', BORDER = '#DFE1E6', WHITE = '#fff'

function fmt$(v) {
  const n = parseFloat(v) || 0
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

export default function WinLossAnalysis() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { crmApi.getWinLossAnalysis().then(setData).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: SUBTLE, fontSize: 13 }}>Loading analysis…</div>
  if (!data) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: SUBTLE, fontSize: 13 }}>Could not load data.</div>

  const wonCount = parseInt(data.won?.count) || 0
  const lostCount = parseInt(data.lost?.count) || 0
  const total = wonCount + lostCount
  const winRate = total > 0 ? Math.round(wonCount / total * 100) : 0
  const cardSt = { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: '#F7F8FA' }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: NAVY }}>Win/Loss Analysis</h3>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <div style={{ ...cardSt, padding: '16px 20px' }}>
          <div style={{ fontSize: 10, color: SUBTLE, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Won</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#006644' }}>{wonCount}</div>
          <div style={{ fontSize: 10, color: SUBTLE }}>{fmt$(data.won?.total)} total</div>
        </div>
        <div style={{ ...cardSt, padding: '16px 20px' }}>
          <div style={{ fontSize: 10, color: SUBTLE, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Lost</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#BF2600' }}>{lostCount}</div>
          <div style={{ fontSize: 10, color: SUBTLE }}>{fmt$(data.lost?.total)} total</div>
        </div>
        <div style={{ ...cardSt, padding: '16px 20px' }}>
          <div style={{ fontSize: 10, color: SUBTLE, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Win Rate</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: winRate >= 50 ? '#006644' : '#BF2600' }}>{winRate}%</div>
        </div>
        <div style={{ ...cardSt, padding: '16px 20px' }}>
          <div style={{ fontSize: 10, color: SUBTLE, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Avg Deal Size (Won)</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: NAVY }}>{wonCount > 0 ? fmt$(parseFloat(data.won.total) / wonCount) : '$0'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Loss Reasons */}
        <div style={cardSt}>
          <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Top Loss Reasons</div>
          {data.loss_reasons.length === 0 && <div style={{ fontSize: 11, color: SUBTLE }}>No loss reasons recorded</div>}
          {data.loss_reasons.map((r, i) => {
            const pct = lostCount > 0 ? Math.round(parseInt(r.count) / lostCount * 100) : 0
            return (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                  <span style={{ color: NAVY, fontWeight: 500 }}>{r.lost_reason}</span>
                  <span style={{ color: SUBTLE }}>{r.count} ({pct}%)</span>
                </div>
                <div style={{ height: 6, background: '#F4F5F7', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: '#FF5630', borderRadius: 3 }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Competitors */}
        <div style={cardSt}>
          <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Competitors Encountered</div>
          {data.competitors.length === 0 && <div style={{ fontSize: 11, color: SUBTLE }}>No competitors recorded</div>}
          {data.competitors.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: `1px solid #F4F5F7` }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: NAVY, flex: 1 }}>{c.competitor}</span>
              <span style={{ fontSize: 10, color: SUBTLE }}>{c.count} deals</span>
              <span style={{ fontSize: 10, color: '#BF2600', fontWeight: 600 }}>{fmt$(c.total)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
