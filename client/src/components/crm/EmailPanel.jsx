import React, { useState, useEffect } from 'react'
import { crmApi } from '../../lib/crmApi.js'

const NAVY = '#172B4D', SUBTLE = '#5E6C84', BORDER = '#DFE1E6', WHITE = '#fff', BLUE = '#0052CC'

export default function EmailPanel({ dealId, dealEmail, onClose }) {
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)
  const [composing, setComposing] = useState(false)
  const [form, setForm] = useState({ to_address: dealEmail || '', subject: '', body: '', direction: 'outbound' })
  const [sending, setSending] = useState(false)

  useEffect(() => { load() }, [dealId])

  async function load() {
    setLoading(true)
    try {
      const data = dealId ? await crmApi.getEmails(dealId) : await crmApi.getAllEmails()
      setEmails(data)
    } catch {}
    setLoading(false)
  }

  async function send() {
    if (!form.to_address || !form.subject) return
    setSending(true)
    try {
      if (dealId) {
        await crmApi.sendEmail(dealId, form)
      } else {
        await crmApi.sendEmailGlobal(form)
      }
      setComposing(false)
      setForm({ to_address: dealEmail || '', subject: '', body: '', direction: 'outbound' })
      load()
    } catch {}
    setSending(false)
  }

  async function deleteEmail(id) {
    try { await crmApi.deleteEmail(id); setEmails(prev => prev.filter(e => e.id !== id)) } catch {}
  }

  const inputSt = { width: '100%', padding: '7px 10px', border: `1.5px solid ${BORDER}`, borderRadius: 6, fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>Emails</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setComposing(true)} style={{ padding: '4px 10px', background: BLUE, color: WHITE, border: 'none', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>+ Compose</button>
          {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUBTLE, fontSize: 16 }}>×</button>}
        </div>
      </div>

      {composing && (
        <div style={{ padding: 12, borderBottom: `1px solid ${BORDER}`, background: '#FAFBFC' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <select value={form.direction} onChange={e => setForm(f => ({ ...f, direction: e.target.value }))} style={{ ...inputSt, width: 100 }}>
              <option value="outbound">Sent</option>
              <option value="inbound">Received</option>
            </select>
            <input placeholder="To…" value={form.to_address} onChange={e => setForm(f => ({ ...f, to_address: e.target.value }))} style={{ ...inputSt, flex: 1 }} />
          </div>
          <input placeholder="Subject…" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} style={{ ...inputSt, marginBottom: 6 }} />
          <textarea placeholder="Email body…" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={4} style={{ ...inputSt, resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button onClick={send} disabled={sending} style={{ padding: '5px 14px', background: BLUE, color: WHITE, border: 'none', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: sending ? 0.6 : 1 }}>{sending ? 'Sending…' : 'Send'}</button>
            <button onClick={() => setComposing(false)} style={{ padding: '5px 12px', background: WHITE, color: SUBTLE, border: `1px solid ${BORDER}`, borderRadius: 5, fontSize: 11, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {loading && <div style={{ padding: 16, textAlign: 'center', color: SUBTLE, fontSize: 12 }}>Loading…</div>}
        {!loading && emails.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: SUBTLE, fontSize: 12 }}>No emails yet</div>}
        {emails.map(e => (
          <div key={e.id} style={{ padding: '10px 16px', borderBottom: `1px solid #F4F5F7`, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 16, marginTop: 2 }}>{e.direction === 'inbound' ? '📥' : '📤'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: NAVY, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.subject || '(no subject)'}</div>
              <div style={{ fontSize: 11, color: SUBTLE }}>{e.direction === 'inbound' ? 'From' : 'To'}: {e.direction === 'inbound' ? e.from_address : e.to_address}</div>
              {e.body && <div style={{ fontSize: 11, color: SUBTLE, marginTop: 4, whiteSpace: 'pre-wrap', maxHeight: 60, overflow: 'hidden' }}>{e.body}</div>}
              <div style={{ fontSize: 10, color: '#97A0AF', marginTop: 4 }}>{new Date(e.sent_at).toLocaleString()}</div>
            </div>
            <button onClick={() => deleteEmail(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DFE1E6', fontSize: 14 }} onMouseEnter={e => e.currentTarget.style.color = '#BF2600'} onMouseLeave={e => e.currentTarget.style.color = '#DFE1E6'}>×</button>
          </div>
        ))}
      </div>
    </div>
  )
}
