import React, { useState, useEffect, useRef } from 'react'
import { crmApi } from '../../lib/crmApi.js'

const NAVY   = '#172B4D'
const SUBTLE = '#5E6C84'
const BORDER = '#DFE1E6'
const BG     = '#FAFBFC'

export default function CRMNotifications({ onOpenDeal }) {
  const [open, setOpen]     = useState(false)
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef(null)
  const btnRef   = useRef(null)

  async function fetchNotifs() {
    setLoading(true)
    try { setData(await crmApi.getNotifications()) } catch {}
    setLoading(false)
  }

  useEffect(() => {
    fetchNotifs()
    const id = setInterval(fetchNotifs, 60000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target) &&
          btnRef.current   && !btnRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const total = data?.total || 0

  function daysAgo(d) {
    if (!d) return ''
    const diff = Math.floor((Date.now() - new Date(d)) / 86_400_000)
    if (diff === 0) return 'today'
    if (diff === 1) return '1d ago'
    return `${diff}d ago`
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        ref={btnRef}
        onClick={() => setOpen(v => !v)}
        title="Notifications"
        style={{
          position: 'relative',
          width: 32, height: 32, borderRadius: 6,
          background: open ? 'rgba(255,255,255,0.18)' : 'none',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.75)',
          transition: 'background 0.12s, color 0.12s',
        }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff' } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' } }}
      >
        <BellIcon />
        {total > 0 && (
          <span style={{
            position: 'absolute', top: 3, right: 3,
            minWidth: 14, height: 14, borderRadius: 7,
            background: '#DE350B', color: '#fff',
            fontSize: '0.5625rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px', lineHeight: 1,
            border: '1.5px solid #172B4D',
          }}>
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            width: 360, maxHeight: 480,
            background: '#fff', borderRadius: 10,
            border: `1px solid ${BORDER}`,
            boxShadow: '0 8px 32px rgba(9,30,66,0.2)',
            zIndex: 500,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '14px 16px 12px',
            borderBottom: `1px solid ${BORDER}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: NAVY }}>Notifications</span>
              {loading && <span style={{ fontSize: '0.6875rem', color: '#97A0AF' }}>loading…</span>}
              {!loading && total > 0 && (
                <span style={{ background: '#DE350B', color: '#fff', borderRadius: 10, fontSize: '0.625rem', fontWeight: 700, padding: '1px 6px' }}>
                  {total} new
                </span>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#97A0AF', padding: 4, borderRadius: 4, display: 'flex' }}
              onMouseEnter={e => { e.currentTarget.style.color = NAVY; e.currentTarget.style.background = BG }}
              onMouseLeave={e => { e.currentTarget.style.color = '#97A0AF'; e.currentTarget.style.background = 'none' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Body */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {total === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: SUBTLE }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>🔔</div>
                <p style={{ margin: 0, fontWeight: 600, color: NAVY, fontSize: '0.875rem' }}>All caught up</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.8125rem' }}>No notifications right now</p>
              </div>
            )}

            {/* Overdue Follow-ups */}
            {data?.follow_ups?.length > 0 && (
              <div>
                <p style={{ margin: 0, padding: '10px 16px 4px', fontSize: '0.625rem', fontWeight: 700, color: '#DE350B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Overdue Follow-ups · {data.follow_ups.length}
                </p>
                {data.follow_ups.map(d => (
                  <button key={`fu-${d.id}`} onClick={() => { onOpenDeal(d); setOpen(false) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: `1px solid ${BORDER}` }}
                    onMouseEnter={e => e.currentTarget.style.background = BG}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: '#FFEBE6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1rem' }}>📅</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.company_name}</div>
                      <div style={{ fontSize: '0.75rem', color: SUBTLE }}>Due {daysAgo(d.follow_up_at)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Overdue Tasks */}
            {data?.tasks?.length > 0 && (
              <div>
                <p style={{ margin: 0, padding: '10px 16px 4px', fontSize: '0.625rem', fontWeight: 700, color: '#FF8B00', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Overdue Tasks · {data.tasks.length}
                </p>
                {data.tasks.map(t => (
                  <button key={`task-${t.id}`} onClick={() => { onOpenDeal({ id: t.deal_id, company_name: t.company_name }); setOpen(false) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: `1px solid ${BORDER}` }}
                    onMouseEnter={e => e.currentTarget.style.background = BG}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: '#FFF0B3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1rem' }}>✅</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                      <div style={{ fontSize: '0.75rem', color: SUBTLE }}>{t.company_name} · Due {daysAgo(t.due_at)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Stale Deals */}
            {data?.stale_deals?.length > 0 && (
              <div>
                <p style={{ margin: 0, padding: '10px 16px 4px', fontSize: '0.625rem', fontWeight: 700, color: SUBTLE, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Stale Deals · {data.stale_deals.length}
                </p>
                {data.stale_deals.map(d => (
                  <button key={`stale-${d.id}`} onClick={() => { onOpenDeal(d); setOpen(false) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: `1px solid ${BORDER}` }}
                    onMouseEnter={e => e.currentTarget.style.background = BG}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: '#F4F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1rem' }}>⏳</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.company_name}</div>
                      <div style={{ fontSize: '0.75rem', color: SUBTLE }}>Last update {daysAgo(d.updated_at)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}
