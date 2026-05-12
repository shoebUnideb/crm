import React, { useState, useEffect } from 'react'
import { crmApi } from '../../lib/crmApi.js'
import { peopleApi } from '../../lib/crmPeopleApi.js'

const NAVY = '#172B4D'
const SUBTLE = '#5E6C84'
const BORDER = '#DFE1E6'
const WHITE = '#fff'
const EMERALD = '#10b981'

function fmt$(v) {
  const n = parseFloat(v) || 0
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

function monthLabel(m) {
  if (!m) return ''
  const [y, mo] = m.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return months[parseInt(mo) - 1] || mo
}

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────
function BarChart({ data, width = 400, height = 180, color = EMERALD, label = 'total' }) {
  if (!data || data.length === 0) return <div style={{ color: SUBTLE, fontSize: 11, padding: 20, textAlign: 'center' }}>No data yet</div>
  const max = Math.max(...data.map(d => parseFloat(d[label]) || 0), 1)
  const barW = Math.floor((width - 40) / data.length) - 4
  const chartH = height - 40
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {[0.25, 0.5, 0.75, 1].map(p => (
        <line key={p} x1={35} x2={width - 5} y1={height - 30 - chartH * p} y2={height - 30 - chartH * p}
          stroke="#EBECF0" strokeWidth={0.5} />
      ))}
      {data.map((d, i) => {
        const val = parseFloat(d[label]) || 0
        const barH = Math.max(2, (val / max) * chartH)
        const x = 40 + i * (barW + 4)
        return (
          <g key={i}>
            <rect x={x} y={height - 30 - barH} width={barW} height={barH} fill={color} rx={2} opacity={0.85} />
            <text x={x + barW / 2} y={height - 14} textAnchor="middle" fontSize={9} fill={SUBTLE}>{monthLabel(d.month)}</text>
            {val > 0 && <text x={x + barW / 2} y={height - 34 - barH} textAnchor="middle" fontSize={8} fill={NAVY} fontWeight={600}>{fmt$(val)}</text>}
          </g>
        )
      })}
    </svg>
  )
}

// ── SVG Line Chart ────────────────────────────────────────────────────────────
function LineChart({ data, width = 400, height = 180, color = '#0052CC', label = 'avg_value', format = fmt$ }) {
  if (!data || data.length === 0) return <div style={{ color: SUBTLE, fontSize: 11, padding: 20, textAlign: 'center' }}>No data yet</div>
  const values = data.map(d => parseFloat(d[label]) || 0)
  const max = Math.max(...values, 1)
  const min = 0
  const chartH = height - 45
  const chartW = width - 50
  const points = data.map((d, i) => {
    const x = 40 + (i / Math.max(data.length - 1, 1)) * chartW
    const y = height - 30 - ((parseFloat(d[label]) || 0) - min) / (max - min) * chartH
    return { x, y, val: parseFloat(d[label]) || 0, month: d.month }
  })
  const polyline = points.map(p => `${p.x},${p.y}`).join(' ')
  const avg = values.reduce((s, v) => s + v, 0) / values.length
  const avgY = height - 30 - (avg - min) / (max - min) * chartH
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {[0.25, 0.5, 0.75, 1].map(p => (
        <g key={p}>
          <line x1={38} x2={width - 5} y1={height - 30 - chartH * p} y2={height - 30 - chartH * p} stroke="#EBECF0" strokeWidth={0.5} />
          <text x={2} y={height - 27 - chartH * p} fontSize={8} fill={SUBTLE}>{format(max * p)}</text>
        </g>
      ))}
      <line x1={38} x2={width - 5} y1={avgY} y2={avgY} stroke={color} strokeWidth={0.5} strokeDasharray="4,3" opacity={0.5} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill={WHITE} stroke={color} strokeWidth={1.5} />
          <text x={p.x} y={height - 14} textAnchor="middle" fontSize={9} fill={SUBTLE}>{monthLabel(p.month)}</text>
        </g>
      ))}
    </svg>
  )
}

// ── Grouped Bar Chart (Won vs Lost) ──────────────────────────────────────────
function GroupedBarChart({ wonData, lostData, width = 400, height = 180 }) {
  const allMonths = [...new Set([...wonData.map(d => d.month), ...lostData.map(d => d.month)])].sort()
  if (allMonths.length === 0) return <div style={{ color: SUBTLE, fontSize: 11, padding: 20, textAlign: 'center' }}>No data yet</div>
  const wonMap = Object.fromEntries(wonData.map(d => [d.month, parseInt(d.count) || 0]))
  const lostMap = Object.fromEntries(lostData.map(d => [d.month, parseInt(d.count) || 0]))
  const max = Math.max(...allMonths.map(m => Math.max(wonMap[m] || 0, lostMap[m] || 0)), 1)
  const groupW = Math.floor((width - 50) / allMonths.length)
  const barW = Math.floor(groupW / 3)
  const chartH = height - 40
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {allMonths.map((m, i) => {
        const x = 40 + i * groupW
        const wonH = Math.max(1, ((wonMap[m] || 0) / max) * chartH)
        const lostH = Math.max(1, ((lostMap[m] || 0) / max) * chartH)
        return (
          <g key={m}>
            <rect x={x} y={height - 30 - wonH} width={barW} height={wonH} fill="#36B37E" rx={2} opacity={0.8} />
            <rect x={x + barW + 2} y={height - 30 - lostH} width={barW} height={lostH} fill="#FF5630" rx={2} opacity={0.8} />
            {(wonMap[m] || 0) > 0 && <text x={x + barW / 2} y={height - 34 - wonH} textAnchor="middle" fontSize={8} fill="#006644" fontWeight={600}>{wonMap[m]}</text>}
            {(lostMap[m] || 0) > 0 && <text x={x + barW + 2 + barW / 2} y={height - 34 - lostH} textAnchor="middle" fontSize={8} fill="#BF2600" fontWeight={600}>{lostMap[m]}</text>}
            <text x={x + groupW / 2 - 2} y={height - 14} textAnchor="middle" fontSize={9} fill={SUBTLE}>{monthLabel(m)}</text>
          </g>
        )
      })}
      <rect x={width - 90} y={6} width={8} height={8} fill="#36B37E" rx={1} />
      <text x={width - 78} y={13} fontSize={9} fill={SUBTLE}>Won</text>
      <rect x={width - 50} y={6} width={8} height={8} fill="#FF5630" rx={1} />
      <text x={width - 38} y={13} fontSize={9} fill={SUBTLE}>Lost</text>
    </svg>
  )
}

// ── Quota vs Actual Chart ────────────────────────────────────────────────────
function QuotaChart({ wonData, goals, width = 400, height = 180 }) {
  const goalMap = Object.fromEntries(goals.map(g => [g.period_key, parseFloat(g.target_value) || 0]))
  const wonMap = Object.fromEntries(wonData.map(d => [d.month, parseFloat(d.total) || 0]))
  const allMonths = [...new Set([...Object.keys(goalMap), ...Object.keys(wonMap)])].sort().slice(-6)
  if (allMonths.length === 0) return <div style={{ color: SUBTLE, fontSize: 11, padding: 20, textAlign: 'center' }}>Set goals to see quota tracking</div>
  const max = Math.max(...allMonths.map(m => Math.max(goalMap[m] || 0, wonMap[m] || 0)), 1)
  const groupW = Math.floor((width - 50) / allMonths.length)
  const barW = Math.floor(groupW / 3)
  const chartH = height - 40
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {allMonths.map((m, i) => {
        const x = 40 + i * groupW
        const goalH = Math.max(1, ((goalMap[m] || 0) / max) * chartH)
        const actH = Math.max(1, ((wonMap[m] || 0) / max) * chartH)
        const pct = goalMap[m] ? Math.round((wonMap[m] || 0) / goalMap[m] * 100) : null
        return (
          <g key={m}>
            <rect x={x} y={height - 30 - goalH} width={barW} height={goalH} fill="#DFE1E6" rx={2} />
            <rect x={x + barW + 2} y={height - 30 - actH} width={barW} height={actH} fill={pct && pct >= 100 ? '#36B37E' : '#0052CC'} rx={2} opacity={0.85} />
            {pct !== null && <text x={x + groupW / 2 - 2} y={height - 34 - Math.max(goalH, actH)} textAnchor="middle" fontSize={8} fill={pct >= 100 ? '#006644' : '#0052CC'} fontWeight={700}>{pct}%</text>}
            <text x={x + groupW / 2 - 2} y={height - 14} textAnchor="middle" fontSize={9} fill={SUBTLE}>{monthLabel(m)}</text>
          </g>
        )
      })}
      <rect x={width - 100} y={6} width={8} height={8} fill="#DFE1E6" rx={1} />
      <text x={width - 88} y={13} fontSize={9} fill={SUBTLE}>Target</text>
      <rect x={width - 50} y={6} width={8} height={8} fill="#0052CC" rx={1} />
      <text x={width - 38} y={13} fontSize={9} fill={SUBTLE}>Actual</text>
    </svg>
  )
}

// ── Funnel ───────────────────────────────────────────────────────────────────
function FunnelChart({ stages, funnelData, width = 400, height = 200 }) {
  if (!funnelData || funnelData.length === 0) return <div style={{ color: SUBTLE, fontSize: 11, padding: 20, textAlign: 'center' }}>No funnel data</div>
  const stageOrder = stages.length ? stages.filter(s => !s.is_won && !s.is_lost).map(s => s.id ?? s.name) : ['lead','qualified','demo','proposal','negotiation']
  const dataMap = Object.fromEntries(funnelData.map(r => [r.stage, parseInt(r.cnt) || 0]))
  const maxCnt = Math.max(...stageOrder.map(s => dataMap[s] || 0), 1)
  const rowH = Math.min(30, (height - 20) / stageOrder.length)
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {stageOrder.map((s, i) => {
        const cnt = dataMap[s] || 0
        const pct = cnt / maxCnt
        const barW = Math.max(20, pct * (width - 120))
        const x = (width - 120 - barW) / 2 + 80
        const y = 10 + i * rowH
        const stObj = stages.find(st => (st.id ?? st.name) === s)
        const color = stObj?.color || '#5E6C84'
        return (
          <g key={s}>
            <rect x={x} y={y} width={barW} height={rowH - 4} fill={color} rx={3} opacity={0.7} />
            <text x={75} y={y + rowH / 2} textAnchor="end" fontSize={9} fill={SUBTLE} dominantBaseline="middle">{stObj?.label || s}</text>
            <text x={x + barW + 6} y={y + rowH / 2} fontSize={9} fill={NAVY} fontWeight={600} dominantBaseline="middle">{cnt}</text>
            {i > 0 && dataMap[stageOrder[i - 1]] > 0 && (
              <text x={x + barW + 24} y={y + rowH / 2} fontSize={8} fill={SUBTLE} dominantBaseline="middle">
                ({Math.round(cnt / dataMap[stageOrder[i - 1]] * 100)}%)
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function RevenueDashboard({ stages = [] }) {
  const [data, setData] = useState(null)
  const [funnel, setFunnel] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [rev, fn] = await Promise.all([
          crmApi.getRevenue(),
          peopleApi.getPipelineFunnel(),
        ])
        if (!cancelled) { setData(rev); setFunnel(fn) }
      } catch {}
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: SUBTLE, fontSize: 13 }}>Loading revenue data…</div>
  if (!data) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: SUBTLE, fontSize: 13 }}>Could not load revenue data.</div>

  const recent3 = (data.won_by_month || []).slice(-3)
  const mrr = recent3.length > 0 ? recent3.reduce((s, d) => s + parseFloat(d.total || 0), 0) / recent3.length : 0
  const arr = mrr * 12
  const totalWon = (data.won_by_month || []).reduce((s, d) => s + parseFloat(d.total || 0), 0)
  const totalLost = (data.lost_by_month || []).reduce((s, d) => s + parseFloat(d.total || 0), 0)
  const winRate = (totalWon + totalLost) > 0 ? Math.round(totalWon / (totalWon + totalLost) * 100) : 0
  const avgVelocity = (data.avg_days_to_close || []).length > 0
    ? Math.round((data.avg_days_to_close || []).reduce((s, d) => s + parseFloat(d.avg_days || 0), 0) / data.avg_days_to_close.length)
    : 0

  const cardSt = { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column' }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: '#F7F8FA' }}>
      {/* Stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <div style={{ ...cardSt, padding: '16px 20px' }}>
          <div style={{ fontSize: 10, color: SUBTLE, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Monthly Revenue (MRR)</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: EMERALD }}>{fmt$(mrr)}</div>
          <div style={{ fontSize: 10, color: SUBTLE, marginTop: 3 }}>Based on last 3 months</div>
        </div>
        <div style={{ ...cardSt, padding: '16px 20px' }}>
          <div style={{ fontSize: 10, color: SUBTLE, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>ARR Projection</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0052CC' }}>{fmt$(arr)}</div>
          <div style={{ fontSize: 10, color: SUBTLE, marginTop: 3 }}>MRR × 12</div>
        </div>
        <div style={{ ...cardSt, padding: '16px 20px' }}>
          <div style={{ fontSize: 10, color: SUBTLE, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Win Rate</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: winRate >= 50 ? '#006644' : '#BF2600' }}>{winRate}%</div>
          <div style={{ fontSize: 10, color: SUBTLE, marginTop: 3 }}>Won / (Won + Lost)</div>
        </div>
        <div style={{ ...cardSt, padding: '16px 20px' }}>
          <div style={{ fontSize: 10, color: SUBTLE, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Avg Days to Close</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: NAVY }}>{avgVelocity}d</div>
          <div style={{ fontSize: 10, color: SUBTLE, marginTop: 3 }}>Won deals, 12mo</div>
        </div>
      </div>

      {/* Charts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Win/Loss Trend */}
        <div style={cardSt}>
          <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 8 }}>Win / Loss Trend</div>
          <GroupedBarChart wonData={data.won_by_month || []} lostData={data.lost_by_month || []} />
        </div>

        {/* Quota vs Actual */}
        <div style={cardSt}>
          <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 8 }}>Quota vs Actual</div>
          <QuotaChart wonData={data.won_by_month || []} goals={data.goals || []} />
        </div>

        {/* Revenue by Month */}
        <div style={cardSt}>
          <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 8 }}>Revenue by Month (Won)</div>
          <BarChart data={data.won_by_month || []} color={EMERALD} />
        </div>

        {/* Average Deal Size */}
        <div style={cardSt}>
          <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 8 }}>Average Deal Size</div>
          <LineChart data={data.avg_deal_size || []} color="#6554C0" label="avg_value" />
        </div>

        {/* Deal Velocity */}
        <div style={cardSt}>
          <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 8 }}>Deal Velocity (Days to Close)</div>
          <LineChart data={data.avg_days_to_close || []} color="#00875A" label="avg_days" format={v => `${Math.round(v)}d`} />
        </div>

        {/* Conversion Funnel */}
        <div style={cardSt}>
          <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 8 }}>Pipeline Funnel</div>
          <FunnelChart stages={stages} funnelData={funnel} />
        </div>
      </div>
    </div>
  )
}
