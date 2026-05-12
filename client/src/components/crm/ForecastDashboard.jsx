import React, { useState, useEffect } from 'react'
import { crmApi } from '../../lib/crmApi.js'

const NAVY = '#172B4D', SUBTLE = '#5E6C84', BORDER = '#DFE1E6', WHITE = '#fff', BLUE = '#0052CC'

function fmt$(v) {
  const n = parseFloat(v) || 0
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

export default function ForecastDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    crmApi.getForecast().then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: SUBTLE, fontSize: 13 }}>Loading forecast…</div>
  if (!data) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: SUBTLE, fontSize: 13 }}>Could not load forecast data.</div>

  const cardSt = { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: '#F7F8FA' }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: NAVY }}>Sales Forecast</h3>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        <div style={{ ...cardSt, padding: '16px 20px' }}>
          <div style={{ fontSize: 10, color: SUBTLE, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Weighted Pipeline</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: BLUE }}>{fmt$(data.totalWeighted)}</div>
          <div style={{ fontSize: 10, color: SUBTLE, marginTop: 3 }}>Value × Probability</div>
        </div>
        <div style={{ ...cardSt, padding: '16px 20px' }}>
          <div style={{ fontSize: 10, color: SUBTLE, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Avg Monthly Won</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>{fmt$(data.avgMonthlyWon)}</div>
          <div style={{ fontSize: 10, color: SUBTLE, marginTop: 3 }}>Last 12 months</div>
        </div>
        <div style={{ ...cardSt, padding: '16px 20px' }}>
          <div style={{ fontSize: 10, color: SUBTLE, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Pipeline Deals</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: NAVY }}>{data.pipeline.reduce((s, r) => s + parseInt(r.count || 0), 0)}</div>
          <div style={{ fontSize: 10, color: SUBTLE, marginTop: 3 }}>Active in pipeline</div>
        </div>
      </div>

      {/* Pipeline by stage */}
      <div style={{ ...cardSt, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Pipeline by Stage (Weighted)</div>
        {data.pipeline.map(row => {
          const pct = data.totalWeighted > 0 ? (parseFloat(row.weighted_value) / data.totalWeighted * 100) : 0
          return (
            <div key={row.stage} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ width: 80, fontSize: 11, fontWeight: 600, color: NAVY, textTransform: 'capitalize' }}>{row.stage}</span>
              <div style={{ flex: 1, height: 18, background: '#F4F5F7', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: BLUE, borderRadius: 4, transition: 'width 0.3s' }} />
                <span style={{ position: 'absolute', right: 6, top: 2, fontSize: 9, fontWeight: 600, color: NAVY }}>{fmt$(row.weighted_value)}</span>
              </div>
              <span style={{ fontSize: 10, color: SUBTLE, width: 50, textAlign: 'right' }}>{parseInt(row.count)} deals</span>
            </div>
          )
        })}
        {data.pipeline.length === 0 && <div style={{ fontSize: 11, color: SUBTLE }}>No active pipeline deals</div>}
      </div>

      {/* Expected revenue by close date */}
      <div style={{ ...cardSt, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Expected Revenue by Close Date</div>
        {data.byCloseDate.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
            {data.byCloseDate.map(row => (
              <div key={row.month} style={{ padding: '10px 8px', background: '#F4F5F7', borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: SUBTLE, marginBottom: 4 }}>{row.month}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{fmt$(row.weighted)}</div>
                <div style={{ fontSize: 9, color: SUBTLE }}>{row.count} deals</div>
              </div>
            ))}
          </div>
        ) : <div style={{ fontSize: 11, color: SUBTLE }}>Set follow-up dates on deals to see forecasted revenue</div>}
      </div>

      {/* Historical */}
      <div style={cardSt}>
        <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Historical Monthly Won</div>
        {data.historical.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
            {data.historical.map(row => (
              <div key={row.month} style={{ padding: '8px 6px', background: '#E3FCEF', borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: SUBTLE }}>{row.month}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#006644' }}>{fmt$(row.total)}</div>
              </div>
            ))}
          </div>
        ) : <div style={{ fontSize: 11, color: SUBTLE }}>No won deals yet</div>}
      </div>
    </div>
  )
}
