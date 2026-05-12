import React, { useState, useEffect } from 'react'
import { peopleApi } from '../../lib/crmPeopleApi.js'
import { crmApi } from '../../lib/crmApi.js'

const NAVY   = '#172B4D'
const SUBTLE = '#5E6C84'
const BORDER = '#DFE1E6'
const BG     = '#F7F8FA'
const WHITE  = '#fff'
const EMERALD = '#10b981'
const BLUE = '#0052CC'

const PALETTE = [
  '#5E6C84','#0052CC','#6554C0','#00875A','#974F0C','#006644','#BF2600',
  '#FF8B00','#00B8D9','#E11D48','#7C3AED','#059669',
]

function smBtn(color) {
  if (color === EMERALD) return { padding: '5px 12px', background: EMERALD, color: WHITE, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 }
  return { padding: '5px 11px', background: WHITE, color: SUBTLE, border: `1.5px solid ${BORDER}`, borderRadius: 6, cursor: 'pointer', fontSize: 11 }
}

function ColorPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ width: 22, height: 22, borderRadius: 4, background: value, border: `2px solid ${BORDER}`, cursor: 'pointer', padding: 0, flexShrink: 0 }} />
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 200, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(9,30,66,0.18)', padding: 8, display: 'flex', flexWrap: 'wrap', gap: 4, width: 130, marginTop: 4 }}>
          {PALETTE.map(c => (
            <button key={c} onClick={() => { onChange(c); setOpen(false) }}
              style={{ width: 18, height: 18, borderRadius: 3, background: c, border: value === c ? '2px solid #172B4D' : '1px solid transparent', cursor: 'pointer', padding: 0 }} />
          ))}
          <input type="color" value={value} onChange={e => onChange(e.target.value)}
            style={{ width: '100%', height: 22, padding: 0, border: 'none', cursor: 'pointer', marginTop: 2 }} />
        </div>
      )}
    </div>
  )
}

export default function StageManager({ stages: initialStages, onChange, onClose, pipelines: initialPipelines = [], onPipelinesChange }) {
  const [stages, setStages] = useState(initialStages || [])
  const [pipelines, setPipelines] = useState(initialPipelines || [])
  const [selectedPipelineId, setSelectedPipelineId] = useState(null)
  const [newName, setNewName] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newColor, setNewColor] = useState('#5E6C84')
  const [newStagePipelineId, setNewStagePipelineId] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [reassignTo, setReassignTo] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [newPipelineName, setNewPipelineName] = useState('')
  const [creatingPipeline, setCreatingPipeline] = useState(false)
  const [pipelineMenuId, setPipelineMenuId] = useState(null)
  const [renamingPipelineId, setRenamingPipelineId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [deletePipelineConfirm, setDeletePipelineConfirm] = useState(null)

  useEffect(() => { setStages(initialStages || []) }, [initialStages])
  useEffect(() => { setPipelines(initialPipelines || []) }, [initialPipelines])

  const filteredStages = selectedPipelineId
    ? stages.filter(s => s.pipeline_id === selectedPipelineId)
    : stages

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  function toggleSelectAll() {
    if (selected.size === filteredStages.length) setSelected(new Set())
    else setSelected(new Set(filteredStages.map(s => s.id)))
  }

  async function bulkDelete() {
    setBulkDeleting(true)
    const toDelete = stages.filter(s => selected.has(s.id))
    for (const stage of toDelete) {
      try { await peopleApi.deleteStage(stage.dbId) } catch {}
    }
    const remaining = stages.filter(s => !selected.has(s.id)).map((s, i) => ({ ...s, position: i }))
    setStages(remaining)
    onChange(remaining)
    setSelected(new Set())
    setBulkDeleting(false)
  }

  async function handleFieldUpdate(stage, field, value) {
    const updated = { ...stage, [field]: value }
    setStages(prev => prev.map(s => s.id === stage.id ? updated : s))
    try {
      const saved = await peopleApi.updateStage(stage.dbId, updated)
      const normalized = { ...saved, dbId: saved.id, id: saved.name, bg: saved.bg_color, border: saved.border_color }
      setStages(prev => prev.map(s => s.id === stage.id ? normalized : s))
      onChange(prev => prev.map(s => s.id === stage.id ? normalized : s))
    } catch {
      setStages(prev => prev.map(s => s.id === stage.id ? stage : s))
    }
  }

  async function move(index, dir) {
    const newList = [...filteredStages]
    const target = index + dir
    if (target < 0 || target >= newList.length) return
    ;[newList[index], newList[target]] = [newList[target], newList[index]]
    const reordered = newList.map((s, i) => ({ ...s, position: i }))
    const fullUpdated = stages.map(s => {
      const found = reordered.find(r => r.id === s.id)
      return found || s
    })
    setStages(fullUpdated)
    onChange(fullUpdated)
    try {
      await peopleApi.reorderStages(reordered.map(s => ({ id: s.dbId, position: s.position })))
    } catch {}
  }

  async function addStage() {
    if (!newName.trim() || !newLabel.trim()) return
    const pipelineId = selectedPipelineId || (newStagePipelineId ? parseInt(newStagePipelineId) : null)
    setSaving(true)
    const bgMap = { '#0052CC':'#DEEBFF','#6554C0':'#EAE6FF','#00875A':'#E3FCEF','#974F0C':'#FFFAE6','#006644':'#E3FCEF','#BF2600':'#FFEBE6','#FF8B00':'#FFF0B3','#00B8D9':'#E6FCFF','#E11D48':'#FFE4E6','#7C3AED':'#EDE9FE','#059669':'#D1FAE5' }
    const bg_color = bgMap[newColor] || '#F4F5F7'
    try {
      const raw = await peopleApi.createStage({ name: newName.trim(), label: newLabel.trim(), color: newColor, bg_color, border_color: BORDER, probability: 10, pipeline_id: pipelineId })
      const stage = { ...raw, dbId: raw.id, id: raw.name, bg: raw.bg_color, border: raw.border_color }
      const updated = [...stages, stage]
      setStages(updated)
      onChange(updated)
      setNewName(''); setNewLabel(''); setNewColor('#5E6C84'); setNewStagePipelineId('')
    } catch {}
    setSaving(false)
  }

  async function confirmDelete() {
    if (!deleteConfirm) return
    const params = reassignTo ? { reassign_to: reassignTo } : {}
    try {
      await peopleApi.deleteStage(deleteConfirm.dbId, params)
      const updated = stages.filter(s => s.id !== deleteConfirm.id).map((s, i) => ({ ...s, position: i }))
      setStages(updated)
      onChange(updated)
    } catch {}
    setDeleteConfirm(null)
    setReassignTo('')
  }

  async function handleCreatePipeline() {
    if (!newPipelineName.trim()) return
    setCreatingPipeline(true)
    try {
      const p = await crmApi.createPipeline({ name: newPipelineName.trim() })
      const updated = [...pipelines, p]
      setPipelines(updated)
      onPipelinesChange?.(updated)
      setNewPipelineName('')
      setSelectedPipelineId(p.id)
    } catch {}
    setCreatingPipeline(false)
  }

  async function handleRenamePipeline() {
    if (!renameValue.trim() || !renamingPipelineId) return
    try {
      const updated = await crmApi.updatePipeline(renamingPipelineId, { name: renameValue.trim() })
      const newPipelines = pipelines.map(p => p.id === renamingPipelineId ? updated : p)
      setPipelines(newPipelines)
      onPipelinesChange?.(newPipelines)
    } catch {}
    setRenamingPipelineId(null)
    setRenameValue('')
  }

  async function handleDeletePipeline(id) {
    try {
      await crmApi.deletePipeline(id)
      const newPipelines = pipelines.filter(p => p.id !== id)
      setPipelines(newPipelines)
      onPipelinesChange?.(newPipelines)
      const remainingStages = stages.filter(s => s.pipeline_id !== id)
      setStages(remainingStages)
      onChange(remainingStages)
      if (selectedPipelineId === id) setSelectedPipelineId(null)
    } catch {}
    setDeletePipelineConfirm(null)
  }

  const inputSt = { padding: '4px 7px', borderRadius: 5, border: `1.5px solid ${BORDER}`, fontSize: 11, color: NAVY, background: '#FAFBFC', fontFamily: 'inherit', outline: 'none' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(9,30,66,0.45)' }} />
      <div style={{ position: 'relative', background: WHITE, borderRadius: 12, width: 680, maxWidth: '92vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 12px 48px rgba(9,30,66,0.28)' }}>
        {/* Header */}
        <div style={{ padding: '18px 24px 14px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: NAVY }}>Manage Pipeline Stages</h3>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: SUBTLE }}>Select a pipeline to manage its stages. Changes take effect immediately.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUBTLE, fontSize: 18, lineHeight: 1, padding: 4 }}>×</button>
        </div>

        {/* Pipeline Selector */}
        <div style={{ padding: '12px 24px 0', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', paddingBottom: 12 }}>
            <button onClick={() => { setSelectedPipelineId(null); setSelected(new Set()) }}
              style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 16, cursor: 'pointer', border: !selectedPipelineId ? `2px solid ${BLUE}` : `1px solid ${BORDER}`, background: !selectedPipelineId ? '#DEEBFF' : WHITE, color: !selectedPipelineId ? BLUE : SUBTLE }}>
              All
            </button>
            {pipelines.map(p => (
              <div key={p.id} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                {renamingPipelineId === p.id ? (
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <input value={renameValue} onChange={e => setRenameValue(e.target.value)} autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') handleRenamePipeline(); if (e.key === 'Escape') setRenamingPipelineId(null) }}
                      style={{ ...inputSt, width: 100, fontSize: 11 }} />
                    <button onClick={handleRenamePipeline} style={{ background: EMERALD, color: WHITE, border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: 10, cursor: 'pointer' }}>Save</button>
                    <button onClick={() => setRenamingPipelineId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUBTLE, fontSize: 14 }}>×</button>
                  </div>
                ) : (
                  <button onClick={() => { setSelectedPipelineId(p.id); setSelected(new Set()) }}
                    style={{ padding: '5px 12px', fontSize: 11, fontWeight: 500, borderRadius: 16, cursor: 'pointer', border: selectedPipelineId === p.id ? `2px solid ${BLUE}` : `1px solid ${BORDER}`, background: selectedPipelineId === p.id ? '#DEEBFF' : WHITE, color: selectedPipelineId === p.id ? BLUE : NAVY, paddingRight: 26 }}>
                    {p.name}
                  </button>
                )}
                {renamingPipelineId !== p.id && (
                  <button onClick={e => { e.stopPropagation(); setPipelineMenuId(pipelineMenuId === p.id ? null : p.id) }}
                    style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: SUBTLE, fontSize: 10, padding: '2px 4px', lineHeight: 1 }}>
                    ⋮
                  </button>
                )}
                {pipelineMenuId === p.id && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 300, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: 110, marginTop: 4 }}>
                    <button onClick={() => { setRenamingPipelineId(p.id); setRenameValue(p.name); setPipelineMenuId(null) }}
                      style={{ display: 'block', width: '100%', padding: '7px 12px', fontSize: 11, border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', color: NAVY }}>
                      Rename
                    </button>
                    <button onClick={() => { setDeletePipelineConfirm(p); setPipelineMenuId(null) }}
                      style={{ display: 'block', width: '100%', padding: '7px 12px', fontSize: 11, border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', color: '#BF2600' }}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
            {/* New Pipeline */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginLeft: 4 }}>
              <input value={newPipelineName} onChange={e => setNewPipelineName(e.target.value)} placeholder="New pipeline..."
                onKeyDown={e => e.key === 'Enter' && handleCreatePipeline()}
                style={{ ...inputSt, width: 110, fontSize: 11 }} />
              <button onClick={handleCreatePipeline} disabled={creatingPipeline || !newPipelineName.trim()}
                style={{ padding: '4px 8px', fontSize: 10, fontWeight: 600, background: BLUE, color: WHITE, border: 'none', borderRadius: 4, cursor: 'pointer', opacity: newPipelineName.trim() ? 1 : 0.5 }}>
                + Add
              </button>
            </div>
          </div>
        </div>

        {/* Delete Pipeline Confirmation */}
        {deletePipelineConfirm && (
          <div style={{ margin: '12px 24px 0', padding: '10px 14px', background: '#FFF5F5', border: '1px solid #FFCCC7', borderRadius: 7 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#BF2600', marginBottom: 4 }}>
              Delete pipeline "{deletePipelineConfirm.name}"?
            </div>
            <div style={{ fontSize: 11, color: SUBTLE, marginBottom: 8 }}>
              This will also delete all stages and deals in this pipeline.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleDeletePipeline(deletePipelineConfirm.id)}
                style={{ padding: '4px 10px', background: '#BF2600', color: WHITE, border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Delete</button>
              <button onClick={() => setDeletePipelineConfirm(null)}
                style={smBtn('')}>Cancel</button>
            </div>
          </div>
        )}

        {/* Stage list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px' }}>
          {/* Bulk actions bar */}
          {selected.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '8px 12px', background: '#FFF5F5', borderRadius: 6, border: '1px solid #FFCCC7' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#BF2600' }}>{selected.size} selected</span>
              <button onClick={bulkDelete} disabled={bulkDeleting}
                style={{ padding: '4px 10px', background: '#BF2600', color: WHITE, border: 'none', borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: bulkDeleting ? 'wait' : 'pointer' }}>
                {bulkDeleting ? 'Deleting...' : `Delete ${selected.size} stages`}
              </button>
              <button onClick={() => setSelected(new Set())}
                style={{ padding: '4px 10px', background: WHITE, color: SUBTLE, border: `1px solid ${BORDER}`, borderRadius: 4, fontSize: 10, cursor: 'pointer' }}>
                Clear
              </button>
            </div>
          )}

          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '24px 22px 120px 1fr 70px 46px 40px 40px 28px', gap: 6, alignItems: 'center', marginBottom: 6 }}>
            <div style={{ textAlign: 'center' }}>
              <input type="checkbox" checked={selected.size === filteredStages.length && filteredStages.length > 0} onChange={toggleSelectAll} style={{ cursor: 'pointer', accentColor: '#BF2600' }} />
            </div>
            <div />
            <div style={{ fontSize: 9, fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Label</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Stage ID</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Prob %</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Won</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Lost</div>
            <div />
            <div />
          </div>

          {filteredStages.length === 0 && (
            <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 12, color: SUBTLE }}>
              {selectedPipelineId ? 'No stages in this pipeline yet. Add one below.' : 'No stages found.'}
            </div>
          )}

          {filteredStages.map((stage, i) => (
            <div key={stage.id} style={{ display: 'grid', gridTemplateColumns: '24px 22px 120px 1fr 70px 46px 40px 40px 28px', gap: 6, alignItems: 'center', marginBottom: 6, padding: '8px 10px', background: selected.has(stage.id) ? '#FFF5F5' : BG, borderRadius: 7, border: `1px solid ${selected.has(stage.id) ? '#FFCCC7' : BORDER}` }}>
              <div style={{ textAlign: 'center' }}>
                <input type="checkbox" checked={selected.has(stage.id)} onChange={() => toggleSelect(stage.id)} style={{ cursor: 'pointer', accentColor: '#BF2600' }} />
              </div>
              <ColorPicker value={stage.color} onChange={v => handleFieldUpdate(stage, 'color', v)} />
              <input value={stage.label} onChange={e => setStages(prev => prev.map(s => s.id === stage.id ? { ...s, label: e.target.value } : s))}
                onBlur={e => handleFieldUpdate(stage, 'label', e.target.value)}
                style={{ ...inputSt, width: '100%', boxSizing: 'border-box', fontWeight: 600 }}
                onFocus={e => e.target.style.borderColor = EMERALD}
              />
              <span style={{ fontSize: 11, color: SUBTLE, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stage.name}</span>
              <input type="number" min="0" max="100" value={stage.probability}
                onChange={e => setStages(prev => prev.map(s => s.id === stage.id ? { ...s, probability: parseInt(e.target.value) || 0 } : s))}
                onBlur={e => handleFieldUpdate(stage, 'probability', parseInt(e.target.value) || 0)}
                style={{ ...inputSt, width: '100%', boxSizing: 'border-box', textAlign: 'center' }}
                onFocus={e => e.target.style.borderColor = EMERALD}
              />
              <div style={{ textAlign: 'center' }}>
                <input type="checkbox" checked={stage.is_won} onChange={e => handleFieldUpdate(stage, 'is_won', e.target.checked)}
                  style={{ cursor: 'pointer', accentColor: EMERALD }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <input type="checkbox" checked={stage.is_lost} onChange={e => handleFieldUpdate(stage, 'is_lost', e.target.checked)}
                  style={{ cursor: 'pointer', accentColor: '#BF2600' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <button onClick={() => move(i, -1)} disabled={i === 0}
                  style={{ background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', color: i === 0 ? '#DFE1E6' : SUBTLE, fontSize: 9, padding: '1px 3px', lineHeight: 1 }}>▲</button>
                <button onClick={() => move(i, 1)} disabled={i === filteredStages.length - 1}
                  style={{ background: 'none', border: 'none', cursor: i === filteredStages.length - 1 ? 'default' : 'pointer', color: i === filteredStages.length - 1 ? '#DFE1E6' : SUBTLE, fontSize: 9, padding: '1px 3px', lineHeight: 1 }}>▼</button>
              </div>
              <button onClick={() => { setDeleteConfirm(stage); setReassignTo('') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DFE1E6', fontSize: 14, padding: '0 2px' }}
                onMouseEnter={e => e.currentTarget.style.color = '#BF2600'}
                onMouseLeave={e => e.currentTarget.style.color = '#DFE1E6'}>🗑</button>
            </div>
          ))}

          {/* Delete confirmation row */}
          {deleteConfirm && (
            <div style={{ background: '#FFF5F5', border: `1px solid #FFCCC7`, borderRadius: 7, padding: '10px 14px', marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#BF2600', marginBottom: 6 }}>
                Delete "{deleteConfirm.label}"?
              </div>
              <div style={{ fontSize: 11, color: SUBTLE, marginBottom: 8 }}>
                Move deals currently in this stage to:
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select value={reassignTo} onChange={e => setReassignTo(e.target.value)}
                  style={{ flex: 1, padding: '4px 7px', borderRadius: 5, border: `1.5px solid ${BORDER}`, fontSize: 11, fontFamily: 'inherit', outline: 'none' }}>
                  <option value="">— Don't move deals —</option>
                  {stages.filter(s => s.id !== deleteConfirm.id).map(s => (
                    <option key={s.id} value={s.dbId}>{s.label}</option>
                  ))}
                </select>
                <button onClick={confirmDelete} style={{ ...smBtn(EMERALD), background: '#BF2600', color: WHITE }}>Delete</button>
                <button onClick={() => setDeleteConfirm(null)} style={smBtn('')}>Cancel</button>
              </div>
            </div>
          )}

          {/* Add new stage row */}
          <div style={{ display: 'grid', gridTemplateColumns: selectedPipelineId ? '22px 120px 1fr 70px 1fr' : '22px 120px 1fr 100px 70px', gap: 6, alignItems: 'center', marginTop: 8, padding: '8px 10px', background: '#F0FDF4', borderRadius: 7, border: `1.5px dashed #A7F3D0` }}>
            <ColorPicker value={newColor} onChange={setNewColor} />
            <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Label…"
              style={{ ...inputSt, width: '100%', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = EMERALD}
              onBlur={e => e.target.style.borderColor = BORDER}
              onKeyDown={e => e.key === 'Enter' && addStage()} />
            <input value={newName} onChange={e => setNewName(e.target.value.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,''))} placeholder="id (slug)…"
              style={{ ...inputSt, width: '100%', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = EMERALD}
              onBlur={e => e.target.style.borderColor = BORDER}
              onKeyDown={e => e.key === 'Enter' && addStage()} />
            {!selectedPipelineId && (
              <select value={newStagePipelineId} onChange={e => setNewStagePipelineId(e.target.value)}
                style={{ ...inputSt, width: '100%', boxSizing: 'border-box', cursor: 'pointer' }}>
                <option value="">Pipeline…</option>
                {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
            <button onClick={addStage} disabled={saving || !newName.trim() || !newLabel.trim()}
              style={{ ...smBtn(EMERALD), opacity: (saving || !newName.trim() || !newLabel.trim()) ? 0.5 : 1 }}>
              {saving ? 'Adding…' : '+ Add stage'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 24px', borderTop: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
          <button onClick={onClose} style={smBtn(EMERALD)}>Done</button>
        </div>
      </div>
    </div>
  )
}
