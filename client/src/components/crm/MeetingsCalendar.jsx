import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { crmApi } from '../../lib/crmApi.js'
import { peopleApi } from '../../lib/crmPeopleApi.js'

const GREEN_BG = '#43a047'
const GREEN_HOVER = '#2e7d32'
const NAVY = '#172B4D'
const SUBTLE = '#5E6C84'
const BORDER = '#DFE1E6'
const WHITE = '#fff'

const ACTIVITY_TYPES = [
  { key: 'call',     label: 'Call',     icon: '📞', color: '#0052CC', bg: '#DEEBFF' },
  { key: 'meeting',  label: 'Meeting',  icon: '👥', color: '#5243AA', bg: '#EAE6FF' },
  { key: 'task',     label: 'Task',     icon: '☑', color: '#00875A', bg: '#E3FCEF' },
  { key: 'deadline', label: 'Deadline', icon: '🚩', color: '#DE350B', bg: '#FFEBE6' },
  { key: 'email',    label: 'Email',    icon: '✉️', color: '#FF8B00', bg: '#FFF0B3' },
  { key: 'lunch',    label: 'Lunch',    icon: '🍽️', color: '#6554C0', bg: '#EAE6FF' },
]

function getType(key) { return ACTIVITY_TYPES.find(t => t.key === key) || ACTIVITY_TYPES[2] }
function fmt(d) { return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}` }
function p(n) { return String(n).padStart(2, '0') }
function fmtDate(d) { if (!d) return ''; return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }
function fmtTime(d) { if (!d) return ''; return new Date(d).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) }
function fmtDateTime(d) { if (!d) return ''; return new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) }

export default function MeetingsCalendar() {
  const [view, setView] = useState('calendar')
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [focusDate, setFocusDate] = useState(new Date())
  const [calView, setCalView] = useState('week')
  const [showForm, setShowForm] = useState(false)
  const [formInitial, setFormInitial] = useState(null)
  const [formError, setFormError] = useState('')
  const [deals, setDeals] = useState([])
  const [contacts, setContacts] = useState([])
  const [orgs, setOrgs] = useState([])

  useEffect(() => {
    crmApi.getDeals().then(setDeals).catch(() => {})
    peopleApi.getPeople().then(setContacts).catch(() => {})
    peopleApi.getOrganizations().then(setOrgs).catch(() => {})
  }, [])

  const getRange = useCallback(() => {
    const d = focusDate
    if (view === 'list') {
      const start = new Date(d); start.setDate(start.getDate() - 30)
      const end = new Date(d); end.setDate(end.getDate() + 60)
      return { from: fmt(start), to: fmt(end) + 'T23:59:59' }
    }
    if (calView === 'week') {
      const start = new Date(d); start.setDate(d.getDate() - d.getDay())
      const end = new Date(start); end.setDate(start.getDate() + 6)
      return { from: fmt(start), to: fmt(end) + 'T23:59:59' }
    }
    const y = d.getFullYear(), m = d.getMonth()
    const last = new Date(y, m + 1, 0).getDate()
    return { from: `${y}-${p(m+1)}-01`, to: `${y}-${p(m+1)}-${last}T23:59:59` }
  }, [focusDate, view, calView])

  const loadActivities = useCallback(async () => {
    setLoading(true)
    try {
      const { from, to } = getRange()
      const data = await crmApi.getAllActivities({ from, to })
      setActivities(data)
    } catch {}
    setLoading(false)
  }, [getRange])

  useEffect(() => { loadActivities() }, [loadActivities])

  function nav(dir) {
    const d = new Date(focusDate)
    if (calView === 'week') d.setDate(d.getDate() + dir * 7)
    else d.setMonth(d.getMonth() + dir)
    setFocusDate(d)
  }

  function goToday() { setFocusDate(new Date()) }

  function getTitle() {
    const d = focusDate
    if (calView === 'week') {
      const start = new Date(d); start.setDate(d.getDate() - d.getDay())
      const end = new Date(start); end.setDate(start.getDate() + 6)
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  async function toggleDone(act) {
    try {
      await crmApi.toggleActivityDone(act.source, act.id)
      setActivities(prev => prev.map(a => a.id === act.id && a.source === act.source ? { ...a, done: !a.done } : a))
    } catch {}
  }

  async function deleteAct(act, skipConfirm) {
    if (!skipConfirm && !confirm('Delete this activity?')) return
    try {
      await crmApi.deleteGlobalActivity(act.source, act.id)
      setActivities(prev => prev.filter(a => !(a.id === act.id && a.source === act.source)))
    } catch {}
  }

  async function handleFormSave(form) {
    setFormError('')
    try {
      const cleanForm = {
        ...form,
        deal_id: form.deal_id ? parseInt(form.deal_id) : null,
        person_id: form.person_id ? parseInt(form.person_id) : null,
        org_id: form.org_id ? parseInt(form.org_id) : null,
      }
      await crmApi.createGlobalActivity(cleanForm)
      setShowForm(false)
      setFormInitial(null)
      loadActivities()
    } catch (e) { setFormError(e.message) }
  }

  const filtered = useMemo(() => {
    if (typeFilter === 'all') return activities
    return activities.filter(a => a.type === typeFilter)
  }, [activities, typeFilter])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%', background: WHITE }}>
      {/* ─── Toolbar Row 1 ─── */}
      <div style={{ padding: '6px 16px', borderBottom: `1px solid #e8e8e8`, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* View toggles */}
        <div style={{ display: 'flex', border: `1px solid ${BORDER}`, borderRadius: 2, overflow: 'hidden' }}>
          <button onClick={() => setView('list')}
            style={{ padding: '5px 8px', border: 'none', background: view === 'list' ? '#F4F5F7' : WHITE, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="List view">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h12" stroke={view === 'list' ? NAVY : '#999'} strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
          <button onClick={() => setView('calendar')}
            style={{ padding: '5px 8px', border: 'none', borderLeft: `1px solid ${BORDER}`, background: view === 'calendar' ? '#F4F5F7' : WHITE, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="Calendar view">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="13" height="12" rx="1.5" stroke={view === 'calendar' ? NAVY : '#999'} strokeWidth="1.3"/><path d="M1.5 6h13" stroke={view === 'calendar' ? NAVY : '#999'} strokeWidth="1.3"/><path d="M5 1v3M11 1v3" stroke={view === 'calendar' ? NAVY : '#999'} strokeWidth="1.3" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* + Activity button */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => { setFormInitial(null); setShowForm(true) }}
            style={{ padding: '5px 12px', background: GREEN_BG, color: WHITE, border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}
            onMouseEnter={e => e.currentTarget.style.background = GREEN_HOVER}
            onMouseLeave={e => e.currentTarget.style.background = GREEN_BG}>
            <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> Activity
          </button>
        </div>

        {/* Meeting scheduler button */}
        <button onClick={() => { setFormInitial({ type: 'meeting' }); setShowForm(true) }}
          style={{ padding: '5px 12px', background: WHITE, color: NAVY, border: `1px solid ${BORDER}`, borderRadius: 2, cursor: 'pointer', fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="13" height="12" rx="1.5" stroke={SUBTLE} strokeWidth="1.2"/><path d="M1.5 6h13" stroke={SUBTLE} strokeWidth="1.2"/><path d="M5 1v3M11 1v3" stroke={SUBTLE} strokeWidth="1.2" strokeLinecap="round"/></svg>
          Meeting scheduler
        </button>

        <div style={{ flex: 1 }} />

        {/* Date range + nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>{getTitle()}</span>
          <button onClick={() => nav(-1)} style={{ width: 24, height: 24, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: SUBTLE, fontSize: 14 }}>‹</button>
          <button onClick={goToday} style={{ padding: '3px 8px', background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 2, cursor: 'pointer', fontSize: 11, fontWeight: 500, color: NAVY }}>Today</button>
          <button onClick={() => nav(1)} style={{ width: 24, height: 24, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: SUBTLE, fontSize: 14 }}>›</button>
        </div>
      </div>

      {/* ─── Toolbar Row 2: Type filters ─── */}
      <div style={{ padding: '5px 16px', borderBottom: `1px solid #eee`, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, background: '#FAFBFC' }}>
        <button onClick={() => setTypeFilter('all')}
          style={{ padding: '4px 10px', border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 12, fontWeight: typeFilter === 'all' ? 600 : 400, background: typeFilter === 'all' ? '#E8F5E9' : '#F4F5F7', color: typeFilter === 'all' ? '#2E7D32' : SUBTLE }}>
          All
        </button>
        {ACTIVITY_TYPES.map(t => (
          <button key={t.key} onClick={() => setTypeFilter(typeFilter === t.key ? 'all' : t.key)}
            style={{ padding: '4px 10px', border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 12, fontWeight: typeFilter === t.key ? 600 : 400, background: typeFilter === t.key ? t.bg : '#F4F5F7', color: typeFilter === t.key ? t.color : SUBTLE, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
            {t.label}
          </button>
        ))}

        {view === 'calendar' && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 2, background: '#F4F5F7', borderRadius: 2, padding: 2 }}>
            <button onClick={() => setCalView('week')}
              style={{ padding: '3px 8px', border: 'none', background: calView === 'week' ? WHITE : 'transparent', color: calView === 'week' ? NAVY : SUBTLE, fontSize: 11, fontWeight: calView === 'week' ? 600 : 400, borderRadius: 2, cursor: 'pointer', boxShadow: calView === 'week' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Week</button>
            <button onClick={() => setCalView('month')}
              style={{ padding: '3px 8px', border: 'none', background: calView === 'month' ? WHITE : 'transparent', color: calView === 'month' ? NAVY : SUBTLE, fontSize: 11, fontWeight: calView === 'month' ? 600 : 400, borderRadius: 2, cursor: 'pointer', boxShadow: calView === 'month' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Month</button>
          </div>
        )}
      </div>

      {/* ─── Main Content ─── */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: SUBTLE, fontSize: 13 }}>Loading activities...</div>
        ) : view === 'list' ? (
          <ListView activities={filtered} onToggleDone={toggleDone} onDelete={deleteAct} onEdit={act => { setFormInitial(act); setShowForm(true) }} />
        ) : calView === 'week' ? (
          <WeekCalendar activities={filtered} focusDate={focusDate} onToggleDone={toggleDone} onClickActivity={act => { setFormInitial(act); setShowForm(true) }} onClickDay={dateStr => { setFormInitial({ occurred_at: dateStr + 'T09:00' }); setShowForm(true) }} />
        ) : (
          <MonthCalendar activities={filtered} focusDate={focusDate} onClickActivity={act => { setFormInitial(act); setShowForm(true) }} onClickDay={dateStr => { setFormInitial({ occurred_at: dateStr + 'T09:00' }); setShowForm(true) }} />
        )}
      </div>

      {/* ─── Activity Form Modal ─── */}
      {showForm && (
        <ActivityFormModal
          initial={formInitial}
          deals={deals}
          contacts={contacts}
          orgs={orgs}
          error={formError}
          onSave={handleFormSave}
          onDelete={formInitial?.id ? () => { deleteAct(formInitial); setShowForm(false); setFormInitial(null) } : null}
          onClose={() => { setShowForm(false); setFormInitial(null); setFormError('') }}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIST VIEW
// ═══════════════════════════════════════════════════════════════════════════════
function ListView({ activities, onToggleDone, onDelete, onEdit }) {
  const [selected, setSelected] = useState(new Set())
  const today = new Date().toISOString().slice(0, 10)
  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return fmt(d) })()
  const endOfWeek = (() => { const d = new Date(); d.setDate(d.getDate() + (7 - d.getDay())); return fmt(d) })()

  const groups = useMemo(() => {
    const overdue = [], todayItems = [], tomorrowItems = [], thisWeek = [], later = [], done = []
    activities.forEach(a => {
      if (a.done) { done.push(a); return }
      const date = (a.occurred_at || a.due_date || '').slice(0, 10)
      if (date < today) overdue.push(a)
      else if (date === today) todayItems.push(a)
      else if (date === tomorrow) tomorrowItems.push(a)
      else if (date <= endOfWeek) thisWeek.push(a)
      else later.push(a)
    })
    return [
      { label: 'Overdue', items: overdue, color: '#DE350B' },
      { label: 'Today', items: todayItems, color: GREEN_BG },
      { label: 'Tomorrow', items: tomorrowItems, color: '#FF8B00' },
      { label: 'This week', items: thisWeek, color: '#0052CC' },
      { label: 'Later', items: later, color: SUBTLE },
      { label: 'Done', items: done, color: '#97A0AF' },
    ].filter(g => g.items.length > 0)
  }, [activities, today, tomorrow, endOfWeek])

  const hasSelection = selected.size > 0

  function toggleSelect(act) {
    const key = `${act.source}-${act.id}`
    setSelected(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })
  }

  function toggleGroupSelect(items) {
    const keys = items.map(a => `${a.source}-${a.id}`)
    const allSelected = keys.every(k => selected.has(k))
    setSelected(prev => {
      const n = new Set(prev)
      keys.forEach(k => allSelected ? n.delete(k) : n.add(k))
      return n
    })
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selected.size} activit${selected.size === 1 ? 'y' : 'ies'}? This cannot be undone.`)) return
    const toDelete = activities.filter(a => selected.has(`${a.source}-${a.id}`))
    for (const act of toDelete) await onDelete(act, true)
    setSelected(new Set())
  }

  async function bulkMarkDone() {
    const toMark = activities.filter(a => selected.has(`${a.source}-${a.id}`) && !a.done)
    for (const act of toMark) await onToggleDone(act)
    setSelected(new Set())
  }

  if (activities.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: SUBTLE }}>
        <div style={{ fontSize: 40 }}>📋</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>No activities</div>
        <div style={{ fontSize: 12 }}>Create your first activity to get started</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '12px 20px 20px', position: 'relative' }}>
      {groups.map(group => {
        const groupKeys = group.items.map(a => `${a.source}-${a.id}`)
        const allGroupSelected = groupKeys.length > 0 && groupKeys.every(k => selected.has(k))
        return (
          <div key={group.label}>
            <div style={{ padding: '6px 12px 3px', fontSize: 11, fontWeight: 700, color: group.color, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
              {hasSelection && (
                <input type="checkbox" checked={allGroupSelected} onChange={() => toggleGroupSelect(group.items)}
                  style={{ width: 13, height: 13, accentColor: GREEN_BG, cursor: 'pointer', margin: 0 }} />
              )}
              {group.label} <span style={{ fontWeight: 400, fontSize: 10, color: SUBTLE }}>({group.items.length})</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <tbody>
                {group.items.map(act => {
                  const key = `${act.source}-${act.id}`
                  const isSelected = selected.has(key)
                  return (
                    <tr key={key}
                      className="act-row"
                      style={{ borderBottom: `1px solid #f5f5f5`, cursor: 'pointer', background: isSelected ? '#EBF5FF' : WHITE }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#FAFBFC'; e.currentTarget.classList.add('hovered') }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = WHITE; e.currentTarget.classList.remove('hovered') }}>
                      <td style={{ padding: '4px 4px 4px 12px', width: 24 }} onClick={e => { e.stopPropagation(); toggleSelect(act) }}>
                        <input type="checkbox" checked={isSelected} readOnly
                          style={{ width: 13, height: 13, accentColor: GREEN_BG, cursor: 'pointer', margin: 0, opacity: hasSelection || isSelected ? 1 : 0 }}
                          className="sel-check" />
                      </td>
                      <td style={{ padding: '4px 6px', width: 26 }} onClick={e => { e.stopPropagation(); onToggleDone(act) }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', border: act.done ? 'none' : `2px solid ${BORDER}`, background: act.done ? GREEN_BG : WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          {act.done && <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke={WHITE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                      </td>
                      <td style={{ padding: '4px 10px', fontWeight: 500, color: act.done ? '#97A0AF' : NAVY, textDecoration: act.done ? 'line-through' : 'none', maxWidth: 0 }} onClick={() => onEdit(act)}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {act.title || act.body?.slice(0, 60) || 'Untitled'}
                          {act.body && act.title && <span style={{ marginLeft: 8, fontSize: 11, color: SUBTLE, fontWeight: 400 }}>{act.body.slice(0, 40)}{act.body.length > 40 ? '...' : ''}</span>}
                        </div>
                      </td>
                      <td style={{ padding: '4px 10px', color: SUBTLE, fontSize: 11, whiteSpace: 'nowrap' }}>
                        {act.entity_name && <span style={{ padding: '1px 6px', background: '#F4F5F7', borderRadius: 2, fontSize: 10, fontWeight: 500, color: NAVY }}>{act.entity_name}</span>}
                      </td>
                      <td style={{ padding: '4px 10px', color: SUBTLE, fontSize: 11, whiteSpace: 'nowrap' }}>
                        {fmtDateTime(act.occurred_at)}
                      </td>
                      <td style={{ padding: '4px 8px', width: 28, textAlign: 'center' }}>
                        <button onClick={e => { e.stopPropagation(); onDelete(act) }}
                          className="del-btn"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C1C7D0', padding: 2, display: 'flex', alignItems: 'center', opacity: 0 }}
                          onMouseEnter={e => e.currentTarget.style.color = '#d32f2f'}
                          onMouseLeave={e => e.currentTarget.style.color = '#C1C7D0'}>
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M5 2h6M2 4h12M3.5 4l.7 9.3a1.5 1.5 0 001.5 1.2h4.6a1.5 1.5 0 001.5-1.2L12.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      })}

      {hasSelection && (
        <div style={{ position: 'sticky', bottom: 0, left: 0, right: 0, padding: '8px 16px', background: '#172B4D', borderRadius: '4px 4px 0 0', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 -2px 8px rgba(0,0,0,0.15)', zIndex: 10 }}>
          <span style={{ fontSize: 12, color: WHITE, fontWeight: 500 }}>{selected.size} selected</span>
          <button onClick={bulkMarkDone} style={{ padding: '4px 10px', background: GREEN_BG, color: WHITE, border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Mark done</button>
          <button onClick={bulkDelete} style={{ padding: '4px 10px', background: '#d32f2f', color: WHITE, border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Delete</button>
          <div style={{ flex: 1 }} />
          <button onClick={() => setSelected(new Set())} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 11 }}>Deselect all</button>
        </div>
      )}

      <style>{`
        .act-row:hover .sel-check { opacity: 1 !important; }
        .act-row:hover .del-btn { opacity: 1 !important; }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEEK CALENDAR VIEW
// ═══════════════════════════════════════════════════════════════════════════════
function WeekCalendar({ activities, focusDate, onToggleDone, onClickActivity, onClickDay }) {
  const start = new Date(focusDate)
  start.setDate(focusDate.getDate() - focusDate.getDay())
  const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d })
  const todayStr = new Date().toISOString().slice(0, 10)
  const monthLabel = start.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(7, 1fr)', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <div style={{ padding: '8px 6px', fontSize: 10, fontWeight: 700, color: SUBTLE, textAlign: 'center' }}>{monthLabel}</div>
        {weekDays.map(d => {
          const ds = fmt(d)
          const isToday = ds === todayStr
          return (
            <div key={ds} onClick={() => onClickDay(ds)}
              style={{ padding: '8px 6px', textAlign: 'center', borderLeft: `1px solid #f0f0f0`, cursor: 'pointer', background: isToday ? '#EFF8FF' : WHITE }}
              onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = '#FAFBFC' }}
              onMouseLeave={e => { if (!isToday) e.currentTarget.style.background = WHITE }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: SUBTLE, textTransform: 'uppercase', marginBottom: 2 }}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div style={{ fontSize: 18, fontWeight: isToday ? 700 : 400, color: isToday ? WHITE : NAVY, width: 30, height: 30, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: isToday ? '#0052CC' : 'none' }}>{d.getDate()}</div>
            </div>
          )
        })}
      </div>

      {/* Activity cells */}
      <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(7, 1fr)', flex: 1, overflow: 'auto' }}>
        <div style={{ borderRight: `1px solid #f0f0f0` }} />
        {weekDays.map(d => {
          const ds = fmt(d)
          const isToday = ds === todayStr
          const dayActivities = activities.filter(a => (a.occurred_at || '').startsWith(ds))
          return (
            <div key={ds} onClick={() => onClickDay(ds)}
              style={{ borderLeft: `1px solid #f0f0f0`, padding: '10px 12px', minHeight: 300, background: isToday ? '#FCFEFF' : WHITE, cursor: 'pointer' }}>
              {dayActivities.map(act => {
                const t = getType(act.type)
                return (
                  <div key={`${act.source}-${act.id}`}
                    onClick={e => { e.stopPropagation(); onClickActivity(act) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', marginBottom: 4, borderRadius: 4, background: t.bg, borderLeft: `3px solid ${t.color}`, cursor: 'pointer', transition: 'box-shadow 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                    <div onClick={e => { e.stopPropagation(); onToggleDone(act) }}
                      style={{ width: 14, height: 14, borderRadius: '50%', border: act.done ? 'none' : `1.5px solid ${t.color}`, background: act.done ? t.color : WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
                      {act.done && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke={WHITE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <span style={{ fontSize: 11, color: NAVY, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: act.done ? 'line-through' : 'none', opacity: act.done ? 0.6 : 1 }}>
                      {act.title || act.body?.slice(0, 30) || 'Untitled'}
                    </span>
                  </div>
                )
              })}
              {dayActivities.length === 0 && (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0 }}>
                  <span style={{ fontSize: 18, color: '#ccc' }}>+</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MONTH CALENDAR VIEW
// ═══════════════════════════════════════════════════════════════════════════════
function MonthCalendar({ activities, focusDate, onClickActivity, onClickDay }) {
  const y = focusDate.getFullYear(), m = focusDate.getMonth()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const firstDay = new Date(y, m, 1).getDay()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Day-of-week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} style={{ padding: '8px 4px', fontSize: 11, fontWeight: 600, color: SUBTLE, textAlign: 'center', textTransform: 'uppercase' }}>{d}</div>
        ))}
      </div>
      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1, overflow: 'auto' }}>
        {Array(firstDay).fill(null).map((_, i) => <div key={`e-${i}`} style={{ minHeight: 100, borderRight: `1px solid #f0f0f0`, borderBottom: `1px solid #f0f0f0` }} />)}
        {days.map(day => {
          const dateStr = `${y}-${p(m+1)}-${p(day)}`
          const dayActs = activities.filter(a => (a.occurred_at || '').startsWith(dateStr))
          const isToday = dateStr === todayStr
          return (
            <div key={day} onClick={() => onClickDay(dateStr)}
              style={{ minHeight: 100, padding: '6px 8px', borderRight: `1px solid #f0f0f0`, borderBottom: `1px solid #f0f0f0`, background: isToday ? '#EFF8FF' : WHITE, cursor: 'pointer' }}>
              <div style={{ fontSize: 11, fontWeight: isToday ? 700 : 400, width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isToday ? '#0052CC' : 'none', color: isToday ? WHITE : NAVY, marginBottom: 4 }}>{day}</div>
              {dayActs.slice(0, 3).map(act => {
                const t = getType(act.type)
                return (
                  <div key={`${act.source}-${act.id}`} onClick={e => { e.stopPropagation(); onClickActivity(act) }}
                    style={{ fontSize: 10, padding: '3px 6px', background: t.bg, borderRadius: 3, marginBottom: 3, color: t.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', fontWeight: 500 }}>
                    {t.icon} {act.title || act.body?.slice(0, 20) || 'Untitled'}
                  </div>
                )
              })}
              {dayActs.length > 3 && <div style={{ fontSize: 9, color: SUBTLE, paddingLeft: 4, marginTop: 2 }}>+{dayActs.length - 3} more</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY FORM MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function ActivityFormModal({ initial, deals, contacts, orgs, onSave, onDelete, onClose, error }) {
  const [form, setForm] = useState({
    type: initial?.type || 'task',
    title: initial?.title || '',
    body: initial?.body || '',
    occurred_at: initial?.occurred_at || new Date().toISOString().slice(0, 16),
    due_date: initial?.due_date || '',
    deal_id: initial?.deal_id || '',
    person_id: initial?.person_id || '',
    org_id: initial?.org_id || '',
    done: initial?.done || false,
  })
  const [saving, setSaving] = useState(false)
  const [validationError, setValidationError] = useState('')

  const inputSt = { width: '100%', boxSizing: 'border-box', padding: '6px 8px', borderRadius: 2, border: `1px solid ${BORDER}`, fontSize: 12, color: NAVY, background: WHITE, fontFamily: 'inherit', outline: 'none' }

  async function handleSubmit(e) {
    e.preventDefault()
    setValidationError('')
    if (!form.title.trim()) {
      setValidationError('Subject is required')
      return
    }
    if (!form.occurred_at) {
      setValidationError('Date & time is required')
      return
    }
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(9,30,66,0.54)' }} />
      <div style={{ position: 'relative', background: WHITE, borderRadius: 4, width: 520, maxWidth: '92vw', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: `1px solid #eee`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: NAVY }}>{initial?.id ? 'Edit Activity' : 'New Activity'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUBTLE, fontSize: 18 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '14px 16px', overflowY: 'auto', flex: 1 }}>
          {/* Type selector */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 12, flexWrap: 'wrap' }}>
            {ACTIVITY_TYPES.map(t => (
              <button key={t.key} type="button" onClick={() => setForm(f => ({ ...f, type: t.key }))}
                style={{ padding: '4px 10px', borderRadius: 2, border: form.type === t.key ? `2px solid ${t.color}` : `1px solid ${BORDER}`, background: form.type === t.key ? t.bg : WHITE, cursor: 'pointer', fontSize: 11, fontWeight: form.type === t.key ? 600 : 400, color: form.type === t.key ? t.color : SUBTLE, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>

          {/* Title */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: NAVY, marginBottom: 4 }}>Subject <span style={{ color: '#DE350B' }}>*</span></label>
            <input value={form.title} onChange={e => { setForm(f => ({ ...f, title: e.target.value })); if (validationError) setValidationError('') }}
              placeholder="Activity subject..."
              autoFocus
              style={{ ...inputSt, borderColor: validationError && !form.title.trim() ? '#DE350B' : BORDER }}
              onFocus={e => e.target.style.borderColor = GREEN_BG}
              onBlur={e => e.target.style.borderColor = validationError && !form.title.trim() ? '#DE350B' : BORDER} />
          </div>

          {/* Date + Due date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: NAVY, marginBottom: 4 }}>Date & time</label>
              <input type="datetime-local" value={form.occurred_at} onChange={e => setForm(f => ({ ...f, occurred_at: e.target.value }))} style={inputSt} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: NAVY, marginBottom: 4 }}>Due date</label>
              <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} style={inputSt} />
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: NAVY, marginBottom: 4 }}>Notes</label>
            <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              placeholder="Add notes..."
              rows={3}
              style={{ ...inputSt, resize: 'vertical', minHeight: 60 }}
              onFocus={e => e.target.style.borderColor = GREEN_BG}
              onBlur={e => e.target.style.borderColor = BORDER} />
          </div>

          {/* Link to entities */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: SUBTLE, marginBottom: 4 }}>Deal</label>
              <select value={form.deal_id} onChange={e => setForm(f => ({ ...f, deal_id: e.target.value }))} style={{ ...inputSt, fontSize: 11, cursor: 'pointer' }}>
                <option value="">None</option>
                {deals.map(d => <option key={d.id} value={d.id}>{d.company_name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: SUBTLE, marginBottom: 4 }}>Contact</label>
              <select value={form.person_id} onChange={e => setForm(f => ({ ...f, person_id: e.target.value }))} style={{ ...inputSt, fontSize: 11, cursor: 'pointer' }}>
                <option value="">None</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: SUBTLE, marginBottom: 4 }}>Organization</label>
              <select value={form.org_id} onChange={e => setForm(f => ({ ...f, org_id: e.target.value }))} style={{ ...inputSt, fontSize: 11, cursor: 'pointer' }}>
                <option value="">None</option>
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          </div>

          {/* Done checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, cursor: 'pointer', fontSize: 12, color: NAVY }}>
            <input type="checkbox" checked={form.done} onChange={e => setForm(f => ({ ...f, done: e.target.checked }))} style={{ accentColor: GREEN_BG }} />
            Mark as done
          </label>

          {(error || validationError) && <div style={{ marginBottom: 10, padding: '6px 10px', background: '#FFEBE6', borderRadius: 2, fontSize: 12, color: '#BF2600' }}>{validationError || error}</div>}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {onDelete && (
              <button type="button" onClick={onDelete}
                style={{ padding: '6px 14px', background: WHITE, color: '#DE350B', border: `1px solid #FFBDAD`, borderRadius: 2, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}
                onMouseEnter={e => { e.currentTarget.style.background = '#FFEBE6' }}
                onMouseLeave={e => { e.currentTarget.style.background = WHITE }}>
                Delete
              </button>
            )}
            <div style={{ flex: 1 }} />
            <button type="button" onClick={onClose}
              style={{ padding: '6px 14px', background: WHITE, color: SUBTLE, border: `1px solid ${BORDER}`, borderRadius: 2, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              style={{ padding: '6px 14px', background: GREEN_BG, color: WHITE, border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 12, fontWeight: 600, opacity: saving ? 0.6 : 1 }}
              onMouseEnter={e => e.currentTarget.style.background = GREEN_HOVER}
              onMouseLeave={e => e.currentTarget.style.background = GREEN_BG}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
