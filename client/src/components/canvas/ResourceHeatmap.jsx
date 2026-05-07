import React, { useMemo } from 'react'

const STATUS_COLORS = { todo: '#9CA3AF', 'in-progress': '#3B82F6', done: '#22C55E', blocked: '#EF4444' }

export default function ResourceHeatmap({ nodes, onClose }) {
  const assignees = useMemo(() => {
    const map = {}
    for (const n of Object.values(nodes)) {
      if (!n.assignee) continue
      if (!map[n.assignee]) map[n.assignee] = { name: n.assignee, todo: 0, 'in-progress': 0, done: 0, blocked: 0, totalPts: 0, count: 0 }
      const a = map[n.assignee]
      a.count++
      a.totalPts += n.storyPoints ?? 0
      if (n.status) a[n.status] = (a[n.status] || 0) + 1
      else a.todo++
    }
    return Object.values(map).sort((a, b) => b.count - a.count)
  }, [nodes])

  if (assignees.length === 0) return (
    <div style={{ position:'absolute', top:60, right:8, zIndex:25, background:'white', border:'1px solid #E5E7EB', borderRadius:12, padding:20, width:280, boxShadow:'0 4px 16px rgba(0,0,0,0.1)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
        <span style={{ fontWeight:700, fontSize:13 }}>Resource Heatmap</span>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#9CA3AF' }}>×</button>
      </div>
      <p style={{ fontSize:12, color:'#9CA3AF', textAlign:'center', padding:'20px 0' }}>No assignees. Set assignee on nodes.</p>
    </div>
  )

  const maxCount = Math.max(...assignees.map(a => a.count))

  return (
    <div style={{ position:'absolute', top:60, right:8, zIndex:25, background:'white', border:'1px solid #E5E7EB', borderRadius:12, padding:'16px 20px', width:320, boxShadow:'0 4px 16px rgba(0,0,0,0.1)', maxHeight:420, overflowY:'auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <span style={{ fontWeight:700, fontSize:13 }}>Resource Heatmap</span>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#9CA3AF' }}>×</button>
      </div>
      {assignees.map(a => {
        const load = a.count / maxCount
        const overloaded = a.count > 5
        return (
          <div key={a.name} style={{ marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3, alignItems:'center' }}>
              <span style={{ fontSize:12, fontWeight:600, color: overloaded ? '#DC2626' : '#374151' }}>
                {overloaded ? '⚠ ' : ''}{a.name}
              </span>
              <span style={{ fontSize:11, color:'#9CA3AF' }}>{a.count} tasks · {a.totalPts}pt</span>
            </div>
            {/* Stacked bar */}
            <div style={{ height:14, background:'#F3F4F6', borderRadius:4, overflow:'hidden', display:'flex' }}>
              {['in-progress', 'blocked', 'todo', 'done'].map(s => {
                const cnt = a[s] || 0
                if (!cnt) return null
                return (
                  <div key={s} style={{ width:`${(cnt / a.count) * 100}%`, background:STATUS_COLORS[s], height:'100%' }} title={`${s}: ${cnt}`} />
                )
              })}
            </div>
            {/* Capacity bar */}
            <div style={{ height:4, background:'#E5E7EB', borderRadius:2, marginTop:2, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${load * 100}%`, background: overloaded ? '#EF4444' : '#3B82F6', borderRadius:2, transition:'width 0.3s' }} />
            </div>
          </div>
        )
      })}
      <div style={{ marginTop:8, fontSize:10, color:'#9CA3AF' }}>Capacity bar: relative to busiest person. ⚠ = more than 5 tasks.</div>
    </div>
  )
}
