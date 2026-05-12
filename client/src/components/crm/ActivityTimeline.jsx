import React, { useState, useEffect } from 'react'
import { crmApi } from '../../lib/crmApi.js'

const NAVY = '#172B4D', SUBTLE = '#5E6C84', BORDER = '#DFE1E6', WHITE = '#fff'

const EVENT_ICONS = { email: '📧', call: '📞', meeting: '📅', document: '📎', note: '📝', stage_change: '🔄', task: '✅', deal_created: '🆕' }
const EVENT_COLORS = { email: '#0052CC', call: '#00875A', meeting: '#6554C0', document: '#FF8B00', note: '#5E6C84', stage_change: '#974F0C', task: '#10b981', deal_created: '#0052CC' }

export default function ActivityTimeline({ dealId }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ event_type: 'note', title: '', body: '' })

  useEffect(() => { load() }, [dealId])

  async function load() {
    setLoading(true)
    try { setEvents(await crmApi.getTimeline(dealId)) } catch {}
    setLoading(false)
  }

  async function addEvent() {
    if (!form.title) return
    try {
      await crmApi.addTimelineEvent(dealId, form)
      setAdding(false)
      setForm({ event_type: 'note', title: '', body: '' })
      load()
    } catch {}
  }

  async function deleteEvent(id) {
    try { await crmApi.deleteTimelineEvent(id); setEvents(prev => prev.filter(e => e.id !== id)) } catch {}
  }

  const inputSt = { width: '100%', padding: '6px 9px', border: `1.5px solid ${BORDER}`, borderRadius: 5, fontSize: 11, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ padding: '12px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>Activity Timeline</span>
        <button onClick={() => setAdding(true)} style={{ padding: '3px 8px', background: '#DEEBFF', color: '#0052CC', border: 'none', borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>+ Add</button>
      </div>

      {adding && (
        <div style={{ padding: '8px 16px', marginBottom: 8, background: '#FAFBFC', borderRadius: 6, margin: '0 12px' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <select value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))} style={{ ...inputSt, width: 100 }}>
              <option value="note">Note</option>
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="meeting">Meeting</option>
            </select>
            <input placeholder="Title…" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={{ ...inputSt, flex: 1 }} onKeyDown={e => e.key === 'Enter' && addEvent()} />
          </div>
          <textarea placeholder="Details (optional)…" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={2} style={{ ...inputSt, resize: 'vertical', marginBottom: 6 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={addEvent} style={{ padding: '4px 10px', background: '#0052CC', color: WHITE, border: 'none', borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Save</button>
            <button onClick={() => setAdding(false)} style={{ padding: '4px 10px', background: WHITE, color: SUBTLE, border: `1px solid ${BORDER}`, borderRadius: 4, fontSize: 10, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {loading && <div style={{ padding: 16, textAlign: 'center', color: SUBTLE, fontSize: 11 }}>Loading timeline…</div>}

      <div style={{ position: 'relative', paddingLeft: 30, margin: '0 16px' }}>
        <div style={{ position: 'absolute', left: 9, top: 0, bottom: 0, width: 2, background: '#EBECF0' }} />
        {events.map(ev => (
          <div key={ev.id} style={{ position: 'relative', marginBottom: 12, paddingBottom: 4 }}>
            <div style={{ position: 'absolute', left: -21, top: 2, width: 20, height: 20, borderRadius: '50%', background: WHITE, border: `2px solid ${EVENT_COLORS[ev.event_type] || BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
              {EVENT_ICONS[ev.event_type] || '•'}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: NAVY }}>{ev.title}</div>
                {ev.body && <div style={{ fontSize: 10, color: SUBTLE, marginTop: 2, whiteSpace: 'pre-wrap', maxHeight: 40, overflow: 'hidden' }}>{ev.body}</div>}
                <div style={{ fontSize: 9, color: '#97A0AF', marginTop: 2 }}>{new Date(ev.occurred_at).toLocaleString()}</div>
              </div>
              <button onClick={() => deleteEvent(ev.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DFE1E6', fontSize: 12, flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.color = '#BF2600'} onMouseLeave={e => e.currentTarget.style.color = '#DFE1E6'}>×</button>
            </div>
          </div>
        ))}
        {!loading && events.length === 0 && <div style={{ fontSize: 11, color: SUBTLE, padding: '8px 0' }}>No activity yet</div>}
      </div>
    </div>
  )
}
