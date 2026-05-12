import React, { useState, useEffect } from 'react'
import { peopleApi } from '../../lib/crmPeopleApi.js'

const BORDER = '#DFE1E6'
const WHITE  = '#fff'
const BG     = '#F7F8FA'
const SUBTLE = '#5E6C84'

const TAG_COLORS = ['#10b981','#0052CC','#5243AA','#FF8B00','#BF2600','#006644','#FF991F','#97A0AF','#172B4D','#E11D48']

export default function TagManager({ entityType, entityId, compact = false }) {
  const [allTags, setAllTags] = useState([])
  const [entityTags, setEntityTags] = useState([])
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#10b981')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [all, linked] = await Promise.all([
          peopleApi.getTags(),
          peopleApi.getEntityTags(entityType, entityId),
        ])
        if (!cancelled) { setAllTags(all); setEntityTags(linked) }
      } catch { /* silent */ }
    }
    load()
    return () => { cancelled = true }
  }, [entityType, entityId])

  const linkedIds = new Set(entityTags.map(t => t.id))

  async function toggle(tag) {
    if (linkedIds.has(tag.id)) {
      await peopleApi.unlinkTag(tag.id, entityType, entityId)
      setEntityTags(prev => prev.filter(t => t.id !== tag.id))
    } else {
      await peopleApi.linkTag(tag.id, entityType, entityId)
      setEntityTags(prev => [...prev, tag])
    }
  }

  async function createAndLink() {
    if (!newName.trim()) return
    try {
      const tag = await peopleApi.createTag({ name: newName.trim(), color: newColor })
      setAllTags(prev => prev.find(t=>t.id===tag.id) ? prev : [...prev, tag])
      await peopleApi.linkTag(tag.id, entityType, entityId)
      setEntityTags(prev => prev.find(t=>t.id===tag.id) ? prev : [...prev, tag])
      setNewName('')
    } catch { /* silent */ }
  }

  async function deleteTag(tag) {
    await peopleApi.deleteTag(tag.id)
    setAllTags(prev => prev.filter(t => t.id !== tag.id))
    setEntityTags(prev => prev.filter(t => t.id !== tag.id))
  }

  return (
    <div style={{ position:'relative' }}>
      {/* Tag chips */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:4, alignItems:'center' }}>
        {entityTags.map(tag => (
          <span key={tag.id} style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'1px 7px', borderRadius:10, fontSize:10, fontWeight:600, background:tag.color+'22', color:tag.color, border:`1px solid ${tag.color}44` }}>
            {tag.name}
            {!compact && <button onClick={() => toggle(tag)} style={{ background:'none', border:'none', cursor:'pointer', color:tag.color, fontSize:10, padding:0, lineHeight:1, marginLeft:1 }}>×</button>}
          </span>
        ))}
        <button onClick={() => setOpen(v => !v)}
          style={{ padding:'1px 7px', fontSize:10, background:'none', border:`1px dashed ${BORDER}`, borderRadius:10, cursor:'pointer', color:SUBTLE }}>
          {compact ? '＋' : '+ tag'}
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{ position:'absolute', top:'100%', left:0, zIndex:100, marginTop:4, background:WHITE, border:`1px solid ${BORDER}`, borderRadius:8, boxShadow:'0 4px 16px rgba(9,30,66,0.15)', minWidth:200, padding:'8px 0' }}>
          <div style={{ padding:'4px 8px 6px', borderBottom:`1px solid ${BORDER}` }}>
            <div style={{ display:'flex', gap:4, marginBottom:4 }}>
              <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="New tag…"
                onKeyDown={e => e.key==='Enter' && createAndLink()}
                style={{ flex:1, padding:'4px 6px', fontSize:11, borderRadius:5, border:`1px solid ${BORDER}`, outline:'none', fontFamily:'inherit' }} />
              <button onClick={createAndLink} style={{ padding:'4px 8px', background:'#10b981', color:WHITE, border:'none', borderRadius:5, cursor:'pointer', fontSize:11 }}>+</button>
            </div>
            <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
              {TAG_COLORS.map(c => (
                <button key={c} onClick={() => setNewColor(c)}
                  style={{ width:14, height:14, borderRadius:'50%', background:c, border:newColor===c?`2px solid #172B4D`:`1px solid transparent`, cursor:'pointer', padding:0 }} />
              ))}
            </div>
          </div>
          {allTags.length === 0
            ? <div style={{ padding:'8px 10px', fontSize:11, color:'#97A0AF' }}>No tags yet</div>
            : allTags.map(tag => (
              <div key={tag.id} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', cursor:'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background=BG}
                onMouseLeave={e => e.currentTarget.style.background=WHITE}>
                <input type="checkbox" checked={linkedIds.has(tag.id)} onChange={() => toggle(tag)} style={{ cursor:'pointer', accentColor:tag.color }} />
                <span style={{ flex:1, fontSize:11, color:'#172B4D' }}>
                  <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:tag.color, marginRight:4 }} />
                  {tag.name}
                </span>
                <button onClick={e => { e.stopPropagation(); deleteTag(tag) }} style={{ background:'none', border:'none', cursor:'pointer', color:'#DFE1E6', fontSize:11, padding:'0 2px' }}
                  onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.color='#BF2600' }}
                  onMouseLeave={e => { e.currentTarget.style.color='#DFE1E6' }}>🗑</button>
              </div>
            ))
          }
          <div style={{ padding:'4px 8px 0', borderTop:`1px solid ${BORDER}` }}>
            <button onClick={() => setOpen(false)} style={{ width:'100%', padding:'4px', fontSize:10, background:'none', border:'none', cursor:'pointer', color:SUBTLE }}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
