import React from 'react'

const ACTION_ICONS = {
  add: '➕',
  delete: '🗑️',
  edit: '✏️',
  status: '🔄',
  move: '↔️',
  color: '🎨',
  meta: '⚙️',
  comment: '💬',
  layout: '📐',
  connect: '🔗',
  group: '📦',
}

export default function ActivityLogPanel({ activities, onClose, onClear }) {
  const sorted = [...(activities || [])].reverse()

  return (
    <div style={{
      position: 'absolute', right: 12, top: 12, bottom: 12, width: 280, zIndex: 15,
      background: 'white', borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.16)', border: '1px solid #E5E7EB',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{ padding: '11px 14px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAFAFA', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>Activity Log</div>
          <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: 1 }}>{sorted.length} event{sorted.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {sorted.length > 0 && (
            <button
              onClick={onClear}
              style={{ fontSize: '10px', color: '#9CA3AF', background: 'none', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '2px 7px', cursor: 'pointer' }}
            >Clear</button>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '18px', lineHeight: 1 }}>×</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {sorted.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', fontSize: '12px', color: '#D1D5DB' }}>
            No activity yet.<br />Start editing your project.
          </div>
        )}
        {sorted.map(entry => (
          <div key={entry.id} style={{ display: 'flex', gap: 8, padding: '6px 4px', borderBottom: '1px solid #F9FAFB' }}>
            <span style={{ fontSize: '14px', flexShrink: 0, lineHeight: '1.4' }}>{ACTION_ICONS[entry.type] || '•'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11px', color: '#374151', lineHeight: '1.4', wordBreak: 'break-word' }}>{entry.description}</div>
              <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: 2 }}>
                {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {' · '}
                {new Date(entry.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
