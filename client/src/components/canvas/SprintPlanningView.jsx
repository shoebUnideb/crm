import React, { useMemo, useState } from 'react'

const PRIORITY_DOT = { critical: '#EF4444', high: '#F97316', medium: '#EAB308', low: '#22C55E' }

export default function SprintPlanningView({ nodes, onSetNodeMeta, onClose }) {
  const [currentSprint, setCurrentSprint] = useState('')

  const { backlog, sprintNodes, sprints } = useMemo(() => {
    const sprintNames = [...new Set(Object.values(nodes).filter(n => n.sprint).map(n => n.sprint))].sort()
    const backlog = Object.values(nodes).filter(n => n.parentId !== null && !n.sprint)
    const sprintNodes = Object.values(nodes).filter(n => n.sprint)
    return { backlog, sprintNodes, sprints: sprintNames }
  }, [nodes])

  const activeSprint = currentSprint || sprints[sprints.length - 1] || ''
  const sprintItems = sprintNodes.filter(n => n.sprint === activeSprint)
  const totalPts = sprintItems.reduce((s, n) => s + (n.storyPoints ?? 0), 0)

  function assignToSprint(nodeId) {
    const sprintName = window.prompt('Assign to sprint:', activeSprint || 'Sprint 1')
    if (sprintName === null) return
    onSetNodeMeta?.(nodeId, { sprint: sprintName || null })
  }

  function removeFromSprint(nodeId) {
    onSetNodeMeta?.(nodeId, { sprint: null })
  }

  return (
    <div style={{ position:'absolute', inset:0, zIndex:30, background:'#F8FAFC', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', background:'white', borderBottom:'1px solid #E5E7EB' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontWeight:700, fontSize:14 }}>Sprint Planning</span>
          <select value={activeSprint} onChange={e => setCurrentSprint(e.target.value)} style={{ fontSize:12, border:'1px solid #E5E7EB', borderRadius:6, padding:'3px 8px' }}>
            {sprints.map(s => <option key={s} value={s}>{s}</option>)}
            <option value="">No sprint selected</option>
          </select>
          <span style={{ fontSize:12, color:'#6B7280' }}>{sprintItems.length} items · {totalPts} pts</span>
        </div>
        <button onClick={onClose} style={{ fontSize:20, background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}>×</button>
      </div>

      {/* Two-column layout */}
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        {/* Backlog */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', borderRight:'1px solid #E5E7EB', overflow:'hidden' }}>
          <div style={{ padding:'8px 16px', background:'white', borderBottom:'1px solid #F3F4F6', fontSize:12, fontWeight:700, color:'#6B7280' }}>
            BACKLOG ({backlog.length})
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:12, display:'flex', flexDirection:'column', gap:6 }}>
            {backlog.map(n => (
              <PlanningCard key={n.id} node={n} action="→ Sprint" onAction={() => assignToSprint(n.id)} />
            ))}
            {backlog.length === 0 && <div style={{ textAlign:'center', color:'#D1D5DB', fontSize:12, padding:20 }}>All items are in sprints</div>}
          </div>
        </div>

        {/* Sprint */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ padding:'8px 16px', background:'white', borderBottom:'1px solid #F3F4F6', fontSize:12, fontWeight:700, color:'#2563EB' }}>
            {activeSprint || 'SELECT SPRINT'} ({sprintItems.length})
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:12, display:'flex', flexDirection:'column', gap:6 }}>
            {sprintItems.map(n => (
              <PlanningCard key={n.id} node={n} action="← Remove" onAction={() => removeFromSprint(n.id)} actionColor="#EF4444" />
            ))}
            {sprintItems.length === 0 && <div style={{ textAlign:'center', color:'#D1D5DB', fontSize:12, padding:20 }}>Drag items from backlog</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

function PlanningCard({ node, action, onAction, actionColor = '#2563EB' }) {
  return (
    <div style={{ background:'white', border:'1px solid #E5E7EB', borderRadius:8, padding:'8px 10px', display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:600, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{node.title}</div>
        <div style={{ display:'flex', gap:6, marginTop:3, flexWrap:'wrap' }}>
          {node.storyPoints != null && <span style={{ fontSize:10, background:'#F3F4F6', color:'#6B7280', borderRadius:4, padding:'1px 5px', fontWeight:600 }}>{node.storyPoints}pt</span>}
          {node.priority && <div style={{ width:7, height:7, borderRadius:'50%', background:PRIORITY_DOT[node.priority], alignSelf:'center' }} />}
          {node.assignee && <span style={{ fontSize:10, color:'#6B7280' }}>@{node.assignee.split(' ')[0]}</span>}
        </div>
      </div>
      <button onClick={onAction} style={{ fontSize:10, color:actionColor, background:'none', border:`1px solid ${actionColor}33`, borderRadius:4, padding:'2px 6px', cursor:'pointer', flexShrink:0, fontWeight:600 }}>{action}</button>
    </div>
  )
}
