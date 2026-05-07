import React, { useState, useEffect } from 'react'
import { loadWebhooks, saveWebhooks } from '../../lib/webhookClient.js'

const EVENT_OPTIONS = [
  { value: 'status_change', label: 'Status Change', desc: 'When a node status is updated' },
  { value: 'node_created', label: 'Node Created', desc: 'When a new node is added' },
  { value: 'node_deleted', label: 'Node Deleted', desc: 'When a node is removed' },
  { value: 'comment_added', label: 'Comment Added', desc: 'When a comment is posted' },
  { value: 'jira_synced', label: 'Jira Synced', desc: 'When tickets are pushed to Jira' },
]

function makeWebhook() {
  return {
    id: crypto.randomUUID(),
    url: '',
    name: '',
    format: 'json',
    events: ['status_change'],
    active: true,
  }
}

export default function WebhookPanel({ onClose }) {
  const [webhooks, setWebhooks] = useState(() => loadWebhooks())
  const [testResult, setTestResult] = useState({})

  useEffect(() => {
    saveWebhooks(webhooks)
  }, [webhooks])

  function addWebhook() {
    setWebhooks(w => [...w, makeWebhook()])
  }

  function removeWebhook(id) {
    setWebhooks(w => w.filter(x => x.id !== id))
  }

  function updateWebhook(id, field, value) {
    setWebhooks(w => w.map(x => x.id === id ? { ...x, [field]: value } : x))
  }

  function toggleEvent(id, event) {
    setWebhooks(w => w.map(x => {
      if (x.id !== id) return x
      const events = x.events.includes(event)
        ? x.events.filter(e => e !== event)
        : [...x.events, event]
      return { ...x, events }
    }))
  }

  async function testWebhook(webhook) {
    if (!webhook.url?.trim()) return
    setTestResult(r => ({ ...r, [webhook.id]: 'sending...' }))
    try {
      const body = webhook.format === 'slack'
        ? { text: 'Test from bahnOS — webhook is working!' }
        : { event: 'test', timestamp: new Date().toISOString(), message: 'Test from bahnOS', source: 'bahnOS' }

      await fetch(webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        mode: 'no-cors',
      })
      setTestResult(r => ({ ...r, [webhook.id]: 'sent' }))
    } catch {
      setTestResult(r => ({ ...r, [webhook.id]: 'error' }))
    }
    setTimeout(() => setTestResult(r => { const n = { ...r }; delete n[webhook.id]; return n }), 3000)
  }

  return (
    <div style={{
      position: 'absolute', right: 12, top: 12, bottom: 12, width: 360, zIndex: 20,
      background: 'white', borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)', border: '1px solid #E5E7EB',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: '#FAFAFA' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>Webhooks & Notifications</div>
          <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: 1 }}>Send events to Slack or any endpoint</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9CA3AF', lineHeight: 1 }}>×</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {webhooks.length === 0 && (
          <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '12px', padding: '24px 0' }}>
            No webhooks configured.<br />Add one below to send events to Slack or any HTTP endpoint.
          </div>
        )}

        {webhooks.map(w => (
          <div key={w.id} style={{ border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 12px', background: w.active ? 'white' : '#F9FAFB' }}>
            {/* Name + active toggle + remove */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
              <input
                value={w.name}
                onChange={e => updateWebhook(w.id, 'name', e.target.value)}
                placeholder="Webhook name (e.g. Slack #dev)"
                style={{ flex: 1, padding: '4px 8px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: '12px', outline: 'none', fontFamily: 'inherit' }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: '11px', color: '#6B7280', flexShrink: 0 }}>
                <input
                  type="checkbox"
                  checked={w.active}
                  onChange={e => updateWebhook(w.id, 'active', e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Active
              </label>
              <button
                onClick={() => removeWebhook(w.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', fontSize: '16px', lineHeight: 1, flexShrink: 0 }}
              >×</button>
            </div>

            {/* URL */}
            <input
              value={w.url}
              onChange={e => updateWebhook(w.id, 'url', e.target.value)}
              placeholder="https://hooks.slack.com/services/... or any URL"
              style={{ width: '100%', padding: '5px 8px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: '11px', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace', marginBottom: 8 }}
            />

            {/* Format */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer', fontSize: '11px', color: '#6B7280' }}>
                <input type="radio" name={`fmt-${w.id}`} value="json" checked={w.format === 'json'} onChange={() => updateWebhook(w.id, 'format', 'json')} />
                Generic JSON
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer', fontSize: '11px', color: '#6B7280' }}>
                <input type="radio" name={`fmt-${w.id}`} value="slack" checked={w.format === 'slack'} onChange={() => updateWebhook(w.id, 'format', 'slack')} />
                Slack format
              </label>
            </div>

            {/* Events */}
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Trigger on</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
              {EVENT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => toggleEvent(w.id, opt.value)}
                  title={opt.desc}
                  style={{
                    padding: '3px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 600,
                    cursor: 'pointer', border: '1px solid',
                    background: w.events.includes(opt.value) ? '#EFF6FF' : '#F9FAFB',
                    color: w.events.includes(opt.value) ? '#3B82F6' : '#9CA3AF',
                    borderColor: w.events.includes(opt.value) ? '#BFDBFE' : '#E5E7EB',
                  }}
                >{opt.label}</button>
              ))}
            </div>

            {/* Test button */}
            <button
              onClick={() => testWebhook(w)}
              disabled={!w.url?.trim()}
              style={{
                padding: '4px 12px', borderRadius: 6, fontSize: '11px', cursor: w.url?.trim() ? 'pointer' : 'default',
                background: testResult[w.id] === 'sent' ? '#F0FDF4' : testResult[w.id] === 'error' ? '#FEF2F2' : '#F3F4F6',
                border: `1px solid ${testResult[w.id] === 'sent' ? '#86EFAC' : testResult[w.id] === 'error' ? '#FECACA' : '#E5E7EB'}`,
                color: testResult[w.id] === 'sent' ? '#16A34A' : testResult[w.id] === 'error' ? '#DC2626' : '#6B7280',
                fontWeight: 600,
              }}
            >
              {testResult[w.id] === 'sending...' ? 'Sending…' : testResult[w.id] === 'sent' ? '✓ Sent' : testResult[w.id] === 'error' ? '✕ Failed' : 'Send Test'}
            </button>
          </div>
        ))}

        <button
          onClick={addWebhook}
          style={{ padding: '8px', background: '#F3F4F6', border: '1px dashed #D1D5DB', borderRadius: 10, fontSize: '12px', cursor: 'pointer', color: '#6B7280', fontWeight: 600 }}
        >+ Add Webhook</button>

        <div style={{ fontSize: '10px', color: '#9CA3AF', lineHeight: 1.5, padding: '4px 0' }}>
          Webhooks fire on selected events. For Slack, use an Incoming Webhooks URL. For other services, any POST endpoint works. Requests use <code>mode: no-cors</code> — check your endpoint for delivery confirmation.
        </div>
      </div>
    </div>
  )
}
