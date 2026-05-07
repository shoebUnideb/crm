import React, { useState, useCallback } from 'react'
import { graphApi } from '../../lib/graphApi.js'

export default function ImpactPanel({ nodeId, nodeTitle, projectId, onClose, onHighlight }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const runAnalysis = useCallback(async () => {
    if (!nodeId || !projectId) return
    setLoading(true)
    setError(null)
    try {
      const data = await graphApi.impact({ startNode: { type: 'node', id: nodeId }, projectId })
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [nodeId, projectId])

  React.useEffect(() => { runAnalysis() }, [runAnalysis])

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, width: 340,
      background: 'white', borderLeft: '1px solid #E5E7EB',
      boxShadow: '-4px 0 16px rgba(0,0,0,0.06)', zIndex: 50,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Impact Analysis</div>
          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{nodeTitle || nodeId}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9CA3AF' }}>×</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {loading && <div style={{ color: '#6B7280', fontSize: 12 }}>Analyzing graph...</div>}
        {error && <div style={{ color: '#EF4444', fontSize: 12 }}>Error: {error}</div>}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <StatCard label="Nodes Affected" value={result.affectedNodes} color="#3B82F6" />
              <StatCard label="Deals at Risk" value={result.affectedDeals} color="#10B981" />
              <StatCard label="Revenue at Risk" value={`$${(result.revenueAtRisk / 1000).toFixed(0)}k`} color="#F59E0B" />
              <StatCard label="Max Depth" value={result.maxDepthReached} color="#8B5CF6" />
            </div>

            {/* Breakdown */}
            <div style={{ fontSize: 11, color: '#374151' }}>
              <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 12 }}>Breakdown</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span>Direct dependencies</span>
                <span style={{ fontWeight: 600 }}>{result.directDependencies}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span>Transitive dependencies</span>
                <span style={{ fontWeight: 600 }}>{result.transitiveDependencies}</span>
              </div>
              {result.truncated && (
                <div style={{ color: '#F59E0B', marginTop: 6, fontSize: 10 }}>
                  ⚠ Graph too large — results truncated
                </div>
              )}
            </div>

            {/* Linked Deals */}
            {result.linkedDeals?.length > 0 && (
              <div style={{ fontSize: 11 }}>
                <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 12, color: '#374151' }}>Deals at Risk</div>
                {result.linkedDeals.map((deal, i) => (
                  <div key={i} style={{
                    padding: '8px 10px', background: '#F0FDF4', borderRadius: 6,
                    marginBottom: 4, border: '1px solid #D1FAE5',
                  }}>
                    <div style={{ fontWeight: 600, color: '#065F46' }}>{deal.company_name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, color: '#047857' }}>
                      <span>${parseFloat(deal.deal_value || 0).toLocaleString()}</span>
                      <span style={{ textTransform: 'capitalize' }}>{deal.stage}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {onHighlight && (
                <button
                  onClick={() => onHighlight(result)}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                    background: '#3B82F6', color: 'white', border: 'none', cursor: 'pointer',
                  }}
                >
                  Highlight on Canvas
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      padding: '10px 12px', borderRadius: 8, background: `${color}08`,
      border: `1px solid ${color}20`,
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>{label}</div>
    </div>
  )
}
