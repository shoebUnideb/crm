import React from 'react'

const LENSES = [
  { id: 'dependencies', label: 'Dependencies', icon: '⚡', color: '#3B82F6' },
  { id: 'crm_links', label: 'Revenue', icon: '💰', color: '#10B981' },
  { id: 'critical_path', label: 'Critical Path', icon: '🎯', color: '#F59E0B' },
  { id: 'risk', label: 'Risk', icon: '⚠️', color: '#EF4444' },
]

export default function GraphLensBar({ activeLens, onToggle, loading }) {
  return (
    <div style={{
      position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', gap: 6, padding: '6px 10px',
      background: 'rgba(255,255,255,0.95)', borderRadius: 10,
      border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      zIndex: 20, userSelect: 'none',
    }}>
      {LENSES.map(lens => {
        const isActive = activeLens === lens.id
        return (
          <button
            key={lens.id}
            onClick={() => onToggle(lens.id)}
            title={lens.label}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500,
              border: isActive ? `1.5px solid ${lens.color}` : '1px solid #D1D5DB',
              background: isActive ? `${lens.color}15` : 'white',
              color: isActive ? lens.color : '#6B7280',
              cursor: 'pointer', transition: 'all 0.15s',
              opacity: loading && isActive ? 0.6 : 1,
            }}
          >
            <span style={{ fontSize: 13 }}>{lens.icon}</span>
            <span>{lens.label}</span>
          </button>
        )
      })}
      {activeLens && (
        <button
          onClick={() => onToggle(null)}
          title="Clear overlay (Esc)"
          style={{
            padding: '4px 8px', borderRadius: 6, fontSize: 11,
            border: '1px solid #D1D5DB', background: '#F9FAFB',
            color: '#9CA3AF', cursor: 'pointer',
          }}
        >
          ✕
        </button>
      )}
    </div>
  )
}
