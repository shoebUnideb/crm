import React, { useState } from 'react'

export default function SnapshotsPanel({ snapshots, onSave, onRestore, onDelete, onClose }) {
  const [nameInput, setNameInput] = useState('')

  function handleSave() {
    const name = nameInput.trim() || `Snapshot ${new Date().toLocaleTimeString()}`
    onSave(name)
    setNameInput('')
  }

  return (
    <div style={{
      position: 'absolute', right: 12, top: 12, bottom: 12, width: 280, zIndex: 15,
      background: 'white', borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.16)', border: '1px solid #E5E7EB',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{ padding: '11px 14px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAFAFA', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>Version Snapshots</div>
          <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: 1 }}>{snapshots.length} saved</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '18px', lineHeight: 1 }}>×</button>
      </div>

      {/* Save new snapshot */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #F3F4F6', display: 'flex', gap: 6 }}>
        <input
          value={nameInput}
          onChange={e => setNameInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder="Snapshot name (optional)"
          style={{ flex: 1, padding: '6px 9px', border: '1px solid #E5E7EB', borderRadius: '7px', fontSize: '12px', outline: 'none', fontFamily: 'inherit' }}
        />
        <button
          onClick={handleSave}
          style={{ padding: '6px 12px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >Save</button>
      </div>

      {/* Snapshot list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {snapshots.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', fontSize: '12px', color: '#D1D5DB' }}>
            No snapshots yet.<br />Save one above to capture the current state.
          </div>
        )}
        {[...snapshots].reverse().map(snap => (
          <div key={snap.id} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #F3F4F6', marginBottom: 6, background: '#FAFAFA' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{snap.name}</div>
                <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: 2 }}>
                  {new Date(snap.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {' · '}{snap.nodeCount} nodes
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button
                  onClick={() => {
                    if (window.confirm(`Restore to "${snap.name}"? Current state will be overwritten.`)) {
                      onRestore(snap.id)
                    }
                  }}
                  style={{ fontSize: '10px', padding: '3px 8px', background: '#EFF6FF', color: '#3B82F6', border: '1px solid #BFDBFE', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >Restore</button>
                <button
                  onClick={() => onDelete(snap.id)}
                  style={{ fontSize: '10px', padding: '3px 6px', background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: '6px', cursor: 'pointer' }}
                >×</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
