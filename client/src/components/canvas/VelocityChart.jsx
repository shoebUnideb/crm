import React, { useMemo } from 'react'

export default function VelocityChart({ nodes, onClose }) {
  const sprints = useMemo(() => {
    const map = {}
    for (const n of Object.values(nodes)) {
      if (!n.sprint) continue
      if (!map[n.sprint]) map[n.sprint] = { name: n.sprint, planned: 0, done: 0 }
      const pts = n.storyPoints ?? 0
      map[n.sprint].planned += pts
      if (n.status === 'done') map[n.sprint].done += pts
    }
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name))
  }, [nodes])

  const maxPts = Math.max(...sprints.map(s => s.planned), 1)
  const BAR_H = 28
  const BAR_GAP = 10
  const LABEL_W = 120
  const CHART_W = 300

  if (sprints.length === 0) return (
    <div style={{ position:'absolute', top:60, right:8, zIndex:25, background:'white', border:'1px solid #E5E7EB', borderRadius:12, padding:20, width:260, boxShadow:'0 4px 16px rgba(0,0,0,0.1)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
        <span style={{ fontWeight:700, fontSize:13 }}>Velocity Chart</span>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#9CA3AF' }}>×</button>
      </div>
      <p style={{ fontSize:12, color:'#9CA3AF', textAlign:'center', padding:'20px 0' }}>No sprint data. Set sprint field on nodes.</p>
    </div>
  )

  return (
    <div style={{ position:'absolute', top:60, right:8, zIndex:25, background:'white', border:'1px solid #E5E7EB', borderRadius:12, padding:'16px 20px', width: LABEL_W + CHART_W + 48, boxShadow:'0 4px 16px rgba(0,0,0,0.1)', maxHeight:420, overflowY:'auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <span style={{ fontWeight:700, fontSize:13 }}>Velocity Chart</span>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#9CA3AF' }}>×</button>
      </div>
      {sprints.map((s, i) => (
        <div key={s.name} style={{ marginBottom: i < sprints.length - 1 ? BAR_GAP : 0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width: LABEL_W, fontSize:11, color:'#374151', fontWeight:500, textOverflow:'ellipsis', overflow:'hidden', whiteSpace:'nowrap', flexShrink:0 }} title={s.name}>{s.name}</div>
            <div style={{ flex:1, height: BAR_H, background:'#F3F4F6', borderRadius:4, position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', left:0, top:0, height:'100%', width:`${(s.planned / maxPts) * 100}%`, background:'#BFDBFE', borderRadius:4 }} />
              <div style={{ position:'absolute', left:0, top:0, height:'100%', width:`${(s.done / maxPts) * 100}%`, background:'#3B82F6', borderRadius:4 }} />
              <span style={{ position:'absolute', right:6, top:'50%', transform:'translateY(-50%)', fontSize:10, fontWeight:700, color:'#1D4ED8' }}>
                {s.done}/{s.planned}pt
              </span>
            </div>
          </div>
        </div>
      ))}
      <div style={{ display:'flex', gap:12, marginTop:12, fontSize:10, color:'#6B7280' }}>
        <span><span style={{ display:'inline-block', width:10, height:10, background:'#3B82F6', borderRadius:2, marginRight:4 }} />Done</span>
        <span><span style={{ display:'inline-block', width:10, height:10, background:'#BFDBFE', borderRadius:2, marginRight:4 }} />Planned</span>
      </div>
    </div>
  )
}
