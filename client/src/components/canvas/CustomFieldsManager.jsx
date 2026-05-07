import React, { useState } from 'react'

export default function CustomFieldsManager({ customFields = [], onSave, onClose }) {
  const [fields, setFields] = useState(customFields)
  const [newLabel, setNewLabel] = useState('')
  const [newType, setNewType] = useState('text')

  function addField() {
    if (!newLabel.trim()) return
    setFields(prev => [...prev, { id: crypto.randomUUID(), label: newLabel.trim(), type: newType }])
    setNewLabel('')
  }

  function removeField(id) {
    setFields(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div style={{ background:'white', borderRadius:12, padding:24, width:400, boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <span style={{ fontWeight:700, fontSize:15 }}>Custom Fields</span>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'#9CA3AF' }}>×</button>
        </div>
        <p style={{ fontSize:12, color:'#6B7280', marginBottom:16 }}>Define extra metadata fields for all nodes in this project.</p>

        {/* Existing fields */}
        <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:16 }}>
          {fields.map(f => (
            <div key={f.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:6 }}>
              <span style={{ flex:1, fontSize:13, fontWeight:500 }}>{f.label}</span>
              <span style={{ fontSize:11, color:'#9CA3AF', background:'#E5E7EB', borderRadius:4, padding:'1px 6px' }}>{f.type}</span>
              <button onClick={() => removeField(f.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#EF4444', fontSize:16 }}>×</button>
            </div>
          ))}
          {fields.length === 0 && <p style={{ fontSize:12, color:'#D1D5DB', textAlign:'center', padding:'10px 0' }}>No custom fields yet.</p>}
        </div>

        {/* Add new field */}
        <div style={{ display:'flex', gap:6, marginBottom:16 }}>
          <input
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addField()}
            placeholder="Field name..."
            style={{ flex:1, fontSize:12, border:'1px solid #E5E7EB', borderRadius:6, padding:'6px 10px', outline:'none' }}
          />
          <select value={newType} onChange={e => setNewType(e.target.value)} style={{ fontSize:12, border:'1px solid #E5E7EB', borderRadius:6, padding:'6px 8px' }}>
            <option value="text">Text</option>
            <option value="number">Number</option>
          </select>
          <button onClick={addField} style={{ background:'#3B82F6', color:'white', border:'none', borderRadius:6, padding:'6px 12px', cursor:'pointer', fontSize:12, fontWeight:600 }}>Add</button>
        </div>

        <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button onClick={onClose} style={{ background:'none', border:'1px solid #E5E7EB', borderRadius:6, padding:'7px 16px', cursor:'pointer', fontSize:13 }}>Cancel</button>
          <button onClick={() => { onSave(fields); onClose() }} style={{ background:'#3B82F6', color:'white', border:'none', borderRadius:6, padding:'7px 16px', cursor:'pointer', fontSize:13, fontWeight:600 }}>Save</button>
        </div>
      </div>
    </div>
  )
}
