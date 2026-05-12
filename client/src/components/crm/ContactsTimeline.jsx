import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { crmApi } from '../../lib/crmApi.js'
import { peopleApi } from '../../lib/crmPeopleApi.js'

const GREEN_BG = '#43a047'
const GREEN_HOVER = '#2e7d32'
const NAVY = '#172B4D'
const SUBTLE = '#5E6C84'
const BORDER = '#DFE1E6'
const WHITE = '#fff'
const ROW_H = 40

const TIMELINE_TYPES = [
  { key: 'all',      label: 'All',      icon: null,  color: '#2E7D32', bg: '#E8F5E9' },
  { key: 'deal',     label: 'Deals',    icon: '\u{1F4B0}', color: '#0052CC', bg: '#DEEBFF' },
  { key: 'email',    label: 'Emails',   icon: '✉️', color: '#FF8B00', bg: '#FFF0B3' },
  { key: 'note',     label: 'Notes',    icon: '\u{1F4DD}', color: '#5E6C84', bg: '#F4F5F7' },
  { key: 'call',     label: 'Call',     icon: '\u{1F4DE}', color: '#0052CC', bg: '#DEEBFF' },
  { key: 'meeting',  label: 'Meeting',  icon: '\u{1F465}', color: '#5243AA', bg: '#EAE6FF' },
  { key: 'task',     label: 'Task',     icon: '☑',  color: '#00875A', bg: '#E3FCEF' },
  { key: 'deadline', label: 'Deadline', icon: '\u{1F6A9}', color: '#DE350B', bg: '#FFEBE6' },
  { key: 'lunch',    label: 'Lunch',    icon: '\u{1F37D}️', color: '#6554C0', bg: '#EAE6FF' },
]

const TIME_RANGES = [
  { value: 1, label: '1 month back' },
  { value: 3, label: '3 months back' },
  { value: 6, label: '6 months back' },
  { value: 12, label: '12 months back' },
]

const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
]

function getTypeInfo(key) { return TIMELINE_TYPES.find(t => t.key === key) || TIMELINE_TYPES[6] }
function fmt(d) { return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}` }
function p(n) { return String(n).padStart(2, '0') }
function initials(name) { if (!name) return '?'; const parts = name.trim().split(/\s+/); return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase() }

const AVATAR_COLORS = ['#0052CC','#5243AA','#00875A','#DE350B','#FF8B00','#6554C0','#172B4D','#2e7d32']
function avatarColor(id) { return AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length] }

export default function ContactsTimeline() {
  const navigate = useNavigate()
  const [entityType, setEntityType] = useState('organizations')
  const [entities, setEntities] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState(3)
  const [frequency, setFrequency] = useState('monthly')
  const [typeFilter, setTypeFilter] = useState('all')
  const [ownerFilter, setOwnerFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formInitial, setFormInitial] = useState(null)
  const [showAddEntity, setShowAddEntity] = useState(false)
  const [tooltip, setTooltip] = useState(null)
  const [detailAct, setDetailAct] = useState(null)
  const [formError, setFormError] = useState('')

  const leftRef = useRef(null)
  const rightRef = useRef(null)
  const syncing = useRef(false)

  useEffect(() => {
    setLoading(true)
    const fetchEntities = entityType === 'organizations'
      ? peopleApi.getOrganizations()
      : peopleApi.getPeople()
    fetchEntities.then(d => { setEntities(d); setLoading(false) }).catch(() => setLoading(false))
  }, [entityType])

  const rangeStart = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - timeRange)
    d.setDate(1)
    d.setHours(0,0,0,0)
    return d
  }, [timeRange])

  const rangeEnd = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 14)
    d.setHours(23,59,59,999)
    return d
  }, [])

  const loadActivities = useCallback(async () => {
    try {
      const data = await crmApi.getAllActivities({ from: fmt(rangeStart), to: fmt(rangeEnd) + 'T23:59:59' })
      setActivities(data)
    } catch {}
  }, [rangeStart, rangeEnd])

  useEffect(() => { loadActivities() }, [loadActivities])

  const filteredEntities = useMemo(() => {
    if (!ownerFilter) return entities
    return entities.filter(e => e.owner === ownerFilter)
  }, [entities, ownerFilter])

  const owners = useMemo(() => {
    const set = new Set(entities.map(e => e.owner).filter(Boolean))
    return Array.from(set).sort()
  }, [entities])

  const filteredActivities = useMemo(() => {
    if (typeFilter === 'all') return activities
    return activities.filter(a => a.type === typeFilter)
  }, [activities, typeFilter])

  const activitiesByEntity = useMemo(() => {
    const map = {}
    filteredActivities.forEach(act => {
      const key = entityType === 'organizations' ? act.org_id : act.person_id
      if (key) {
        if (!map[key]) map[key] = []
        map[key].push(act)
      }
    })
    return map
  }, [filteredActivities, entityType])

  const columns = useMemo(() => {
    const cols = []
    const cursor = new Date(rangeStart)
    while (cursor <= rangeEnd) {
      if (frequency === 'weekly') {
        cols.push({ date: new Date(cursor), label: `${cursor.toLocaleString('default',{month:'short'})} ${cursor.getDate()}` })
        cursor.setDate(cursor.getDate() + 7)
      } else if (frequency === 'quarterly') {
        const q = Math.floor(cursor.getMonth() / 3) + 1
        cols.push({ date: new Date(cursor), label: `Q${q} ${cursor.getFullYear()}` })
        cursor.setMonth(cursor.getMonth() + 3)
      } else {
        cols.push({ date: new Date(cursor), label: cursor.toLocaleString('default', { month: 'long' }) })
        cursor.setMonth(cursor.getMonth() + 1)
      }
    }
    return cols
  }, [rangeStart, rangeEnd, frequency])

  function getXPercent(dateStr) {
    const d = new Date(dateStr)
    const totalMs = rangeEnd - rangeStart
    const offsetMs = d - rangeStart
    return Math.max(0, Math.min(100, (offsetMs / totalMs) * 100))
  }

  const todayPercent = getXPercent(new Date().toISOString())

  function handleScrollLeft(e) {
    if (syncing.current) return
    syncing.current = true
    if (rightRef.current) rightRef.current.scrollTop = e.target.scrollTop
    syncing.current = false
  }
  function handleScrollRight(e) {
    if (syncing.current) return
    syncing.current = true
    if (leftRef.current) leftRef.current.scrollTop = e.target.scrollTop
    syncing.current = false
  }

  async function handleToggleDone(act) {
    try {
      await crmApi.toggleActivityDone(act.source, act.id)
      setActivities(prev => prev.map(a => a.id === act.id && a.source === act.source ? { ...a, done: !a.done } : a))
      setDetailAct(null)
    } catch {}
  }

  async function handleDelete(act) {
    if (!confirm('Delete this activity?')) return
    try {
      await crmApi.deleteGlobalActivity(act.source, act.id)
      setActivities(prev => prev.filter(a => !(a.id === act.id && a.source === act.source)))
      setDetailAct(null)
    } catch {}
  }

  async function handleFormSave(formData) {
    setFormError('')
    try {
      const body = {
        type: formData.type || 'task',
        title: formData.title,
        body: formData.notes || '',
        occurred_at: formData.date ? new Date(formData.date + (formData.time ? 'T' + formData.time : 'T09:00')).toISOString() : new Date().toISOString(),
        due_date: formData.due_date || null,
        done: formData.done || false,
        deal_id: formData.deal_id ? parseInt(formData.deal_id) : null,
        person_id: formData.person_id ? parseInt(formData.person_id) : null,
        org_id: formData.org_id ? parseInt(formData.org_id) : null,
      }
      await crmApi.createGlobalActivity(body)
      await loadActivities()
      setShowForm(false)
      setFormInitial(null)
    } catch (e) {
      setFormError(e.message || 'Failed to save')
    }
  }

  async function handleAddEntity(data) {
    try {
      if (entityType === 'organizations') {
        const created = await peopleApi.createOrg(data)
        setEntities(prev => [created, ...prev])
      } else {
        const created = await peopleApi.createPerson(data)
        setEntities(prev => [created, ...prev])
      }
      setShowAddEntity(false)
    } catch {}
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#FAFBFC' }}>
      {/* Breadcrumb */}
      <div style={{ padding: '8px 16px 0', fontSize: 12, color: SUBTLE }}>
        Contacts <span style={{ margin: '0 6px' }}>/</span> <span style={{ color: NAVY, fontWeight: 600 }}>Contacts timeline</span>
      </div>

      {/* Toolbar */}
      <div style={{ padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', borderBottom: `1px solid ${BORDER}` }}>
        {/* Entity toggle */}
        <div style={{ display: 'flex', borderRadius: 2, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
          {['people','organizations'].map(t => (
            <button key={t} onClick={() => setEntityType(t)}
              style={{ padding: '5px 12px', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: entityType === t ? GREEN_BG : WHITE, color: entityType === t ? WHITE : NAVY }}>
              {t === 'people' ? 'People' : 'Organizations'}
            </button>
          ))}
        </div>

        {/* + Entity button */}
        <button onClick={() => setShowAddEntity(true)}
          style={{ background: GREEN_BG, color: WHITE, border: 'none', borderRadius: 2, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          onMouseEnter={e => e.currentTarget.style.background = GREEN_HOVER}
          onMouseLeave={e => e.currentTarget.style.background = GREEN_BG}>
          <span style={{ fontSize: 14 }}>+</span>
          {entityType === 'organizations' ? 'Organization' : 'Person'}
        </button>

        {/* Entity count */}
        <span style={{ fontSize: 12, color: SUBTLE, fontWeight: 500 }}>
          {filteredEntities.length} {entityType}
        </span>

        <div style={{ flex: 1 }} />

        {/* Frequency */}
        <select value={frequency} onChange={e => setFrequency(e.target.value)}
          style={{ padding: '5px 10px', fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 2, background: WHITE, color: NAVY, cursor: 'pointer' }}>
          {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>

        {/* Time range */}
        <select value={timeRange} onChange={e => setTimeRange(Number(e.target.value))}
          style={{ padding: '5px 10px', fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 2, background: WHITE, color: NAVY, cursor: 'pointer' }}>
          {TIME_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>

        {/* Owner filter */}
        <select value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)}
          style={{ padding: '5px 10px', fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 2, background: WHITE, color: NAVY, cursor: 'pointer', maxWidth: 140 }}>
          <option value="">All owners</option>
          {owners.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      {/* Activity type filter chips */}
      <div style={{ padding: '6px 16px', display: 'flex', gap: 5, flexWrap: 'wrap', borderBottom: `1px solid ${BORDER}`, background: WHITE }}>
        {TIMELINE_TYPES.map(t => {
          const active = typeFilter === t.key
          return (
            <button key={t.key} onClick={() => setTypeFilter(t.key)}
              style={{ padding: '4px 10px', borderRadius: 2, border: active ? 'none' : `1px solid ${BORDER}`, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                background: active ? t.bg : WHITE, color: active ? t.color : SUBTLE }}>
              {t.icon && <span style={{ fontSize: 12 }}>{t.icon}</span>}
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Timeline grid area */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: SUBTLE }}>Loading...</div>
      ) : filteredEntities.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: SUBTLE }}>
          <span style={{ fontSize: 32 }}>📊</span>
          <span style={{ fontSize: 14 }}>No {entityType} yet. Add one to see their activity timeline.</span>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left panel - entity list */}
          <div ref={leftRef} onScroll={handleScrollLeft}
            style={{ width: 240, flexShrink: 0, overflowY: 'auto', overflowX: 'hidden', borderRight: `1px solid ${BORDER}`, background: WHITE }}>
            {/* Header spacer */}
            <div style={{ height: 32, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 10, fontWeight: 700, color: SUBTLE, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              {entityType === 'organizations' ? 'Organizations' : 'People'}
            </div>
            {filteredEntities.map((ent, i) => {
              const isNew = ent.created_at && (Date.now() - new Date(ent.created_at)) < 7 * 24 * 60 * 60 * 1000
              const personName = entityType === 'organizations' && ent.people ? (Array.isArray(ent.people) ? (ent.people[0]?.name || '') : '') : ''
              return (
                <div key={ent.id} style={{ height: ROW_H, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, borderBottom: `1px solid #F0F1F3`, background: i % 2 === 0 ? WHITE : '#FAFBFC' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span onClick={() => navigate(`/app/crm/${entityType === 'people' ? 'contacts' : 'organizations'}?open=${ent.id}`)}
                        style={{ fontSize: 12, fontWeight: 600, color: NAVY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160, cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>{ent.name}</span>
                      {isNew && <span style={{ fontSize: 9, fontWeight: 700, background: '#E3FCEF', color: '#006644', padding: '1px 5px', borderRadius: 2, textTransform: 'uppercase' }}>New</span>}
                    </div>
                    {personName && <div style={{ fontSize: 11, color: SUBTLE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{personName}</div>}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right panel - timeline */}
          <div ref={rightRef} onScroll={handleScrollRight}
            style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', position: 'relative' }}>
            {/* Column headers */}
            <div style={{ height: 32, display: 'flex', borderBottom: `1px solid ${BORDER}`, position: 'sticky', top: 0, zIndex: 5, background: '#FAFBFC', minWidth: Math.max(columns.length * 120, 600) }}>
              {columns.map((col, ci) => (
                <div key={ci} style={{ flex: 1, minWidth: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: SUBTLE, borderRight: `1px solid #EBECF0`, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  {col.label}
                </div>
              ))}
            </div>

            {/* Timeline rows */}
            <div style={{ position: 'relative', minWidth: Math.max(columns.length * 120, 600) }}>
              {/* Vertical grid lines */}
              {columns.map((col, ci) => (
                <div key={ci} style={{ position: 'absolute', left: `${((ci + 1) / columns.length) * 100}%`, top: 0, bottom: 0, width: 1, background: '#EBECF0', zIndex: 1 }} />
              ))}

              {/* Today line */}
              <div style={{ position: 'absolute', left: `${todayPercent}%`, top: 0, bottom: 0, width: 2, background: '#DE350B', zIndex: 4 }}>
                <div style={{ position: 'absolute', top: -18, left: -14, fontSize: 9, fontWeight: 700, color: '#DE350B', background: '#FFEBE6', padding: '1px 5px', borderRadius: 2 }}>TODAY</div>
              </div>

              {/* Entity rows */}
              {filteredEntities.map((ent, i) => {
                const entActs = activitiesByEntity[ent.id] || []
                return (
                  <div key={ent.id} style={{ height: ROW_H, position: 'relative', borderBottom: `1px solid #F0F1F3`, background: i % 2 === 0 ? WHITE : '#FAFBFC' }}>
                    {/* Activity dots */}
                    {entActs.map((act, ai) => {
                      const x = getXPercent(act.occurred_at || act.created_at)
                      const typeInfo = getTypeInfo(act.type)
                      const sameDay = entActs.filter((a, j) => j < ai && Math.abs(getXPercent(a.occurred_at || a.created_at) - x) < 0.5)
                      const yOffset = 16 + sameDay.length * 14
                      return (
                        <div key={`${act.source}-${act.id}`}
                          onClick={() => setDetailAct(act)}
                          onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY, act })}
                          onMouseLeave={() => setTooltip(null)}
                          style={{ position: 'absolute', left: `${x}%`, top: yOffset, width: 12, height: 12, borderRadius: '50%', background: typeInfo.color, opacity: act.done ? 0.4 : 1, cursor: 'pointer', zIndex: 3, transform: 'translateX(-6px)', transition: 'transform 0.15s', border: `2px solid ${WHITE}` }}
                          onMouseOver={e => e.currentTarget.style.transform = 'translateX(-6px) scale(1.5)'}
                          onMouseOut={e => e.currentTarget.style.transform = 'translateX(-6px) scale(1)'} />
                      )
                    })}

                    {/* Row + button */}
                    <button
                      onClick={() => { setFormInitial(entityType === 'organizations' ? { org_id: ent.id } : { person_id: ent.id }); setShowForm(true) }}
                      style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 22, height: 22, borderRadius: '50%', border: `1px solid ${BORDER}`, background: WHITE, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: SUBTLE, zIndex: 3 }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#E8F5E9'; e.currentTarget.style.color = GREEN_BG }}
                      onMouseLeave={e => { e.currentTarget.style.background = WHITE; e.currentTarget.style.color = SUBTLE }}>
                      +
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div style={{ position: 'fixed', left: tooltip.x + 12, top: tooltip.y - 10, background: NAVY, color: WHITE, padding: '6px 10px', borderRadius: 2, fontSize: 11, zIndex: 9999, pointerEvents: 'none', maxWidth: 220, boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
          <div style={{ fontWeight: 600 }}>{tooltip.act.title || '(No title)'}</div>
          <div style={{ opacity: 0.8, marginTop: 2 }}>{getTypeInfo(tooltip.act.type).icon} {getTypeInfo(tooltip.act.type).label} &middot; {new Date(tooltip.act.occurred_at || tooltip.act.created_at).toLocaleDateString()}</div>
        </div>
      )}

      {/* Activity detail popover */}
      {detailAct && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 8000 }} onClick={() => setDetailAct(null)}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: WHITE, borderRadius: 4, padding: 14, boxShadow: '0 2px 8px rgba(0,0,0,.15)', width: 340, maxWidth: '90vw' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>{getTypeInfo(detailAct.type).icon}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{detailAct.title || '(No title)'}</span>
            </div>
            {detailAct.body && <div style={{ fontSize: 12, color: SUBTLE, marginBottom: 10, lineHeight: 1.5 }}>{detailAct.body}</div>}
            <div style={{ fontSize: 11, color: SUBTLE, marginBottom: 12 }}>
              {new Date(detailAct.occurred_at || detailAct.created_at).toLocaleString()} &middot; {detailAct.done ? 'Done' : 'Pending'}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleToggleDone(detailAct)}
                style={{ flex: 1, padding: '6px 0', border: 'none', borderRadius: 2, background: detailAct.done ? '#FFF0B3' : '#E3FCEF', color: detailAct.done ? '#FF8B00' : '#006644', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                {detailAct.done ? 'Mark undone' : 'Mark done'}
              </button>
              <button onClick={() => handleDelete(detailAct)}
                style={{ flex: 1, padding: '6px 0', border: 'none', borderRadius: 2, background: '#FFEBE6', color: '#DE350B', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity form modal */}
      {showForm && <ActivityFormModal
        initial={formInitial}
        error={formError}
        onSave={handleFormSave}
        onClose={() => { setShowForm(false); setFormInitial(null); setFormError('') }}
        entityType={entityType}
        entities={entities}
      />}

      {/* Add entity modal */}
      {showAddEntity && <AddEntityModal
        entityType={entityType}
        onSave={handleAddEntity}
        onClose={() => setShowAddEntity(false)}
      />}
    </div>
  )
}

function ActivityFormModal({ initial, error, onSave, onClose, entityType, entities }) {
  const [type, setType] = useState(initial?.type || 'task')
  const [title, setTitle] = useState(initial?.title || '')
  const [date, setDate] = useState(initial?.date || fmt(new Date()))
  const [time, setTime] = useState(initial?.time || '09:00')
  const [notes, setNotes] = useState(initial?.notes || '')
  const [dueDate, setDueDate] = useState(initial?.due_date || '')
  const [done, setDone] = useState(initial?.done || false)
  const [entityId, setEntityId] = useState(
    entityType === 'organizations' ? (initial?.org_id || '') : (initial?.person_id || '')
  )
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    await onSave({
      type, title: title.trim(), date, time, notes, due_date: dueDate || null, done,
      ...(entityType === 'organizations' ? { org_id: entityId || null } : { person_id: entityId || null }),
    })
    setSaving(false)
  }

  const FORM_TYPES = [
    { key: 'call', label: 'Call', icon: '\u{1F4DE}' },
    { key: 'meeting', label: 'Meeting', icon: '\u{1F465}' },
    { key: 'task', label: 'Task', icon: '☑' },
    { key: 'deadline', label: 'Deadline', icon: '\u{1F6A9}' },
    { key: 'email', label: 'Email', icon: '✉️' },
    { key: 'lunch', label: 'Lunch', icon: '\u{1F37D}️' },
    { key: 'note', label: 'Note', icon: '\u{1F4DD}' },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.35)' }} onClick={onClose}>
      <form onClick={e => e.stopPropagation()} onSubmit={handleSubmit}
        style={{ background: WHITE, borderRadius: 4, padding: 16, width: 400, maxWidth: '92vw', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 12 }}>New Activity</div>

        {/* Type pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {FORM_TYPES.map(t => (
            <button key={t.key} type="button" onClick={() => setType(t.key)}
              style={{ padding: '4px 10px', borderRadius: 2, border: type === t.key ? 'none' : `1px solid ${BORDER}`, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                background: type === t.key ? getTypeInfo(t.key).bg : WHITE, color: type === t.key ? getTypeInfo(t.key).color : SUBTLE }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Subject */}
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Subject / title"
          style={{ width: '100%', padding: '6px 8px', borderRadius: 2, border: `1px solid ${BORDER}`, fontSize: 12, marginBottom: 10, boxSizing: 'border-box' }} autoFocus />

        {/* Date + Time */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ flex: 1, padding: '5px 8px', borderRadius: 2, border: `1px solid ${BORDER}`, fontSize: 12 }} />
          <input type="time" value={time} onChange={e => setTime(e.target.value)}
            style={{ width: 110, padding: '5px 8px', borderRadius: 2, border: `1px solid ${BORDER}`, fontSize: 12 }} />
        </div>

        {/* Due date */}
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, color: SUBTLE, display: 'block', marginBottom: 4 }}>Due date (optional)</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
            style={{ width: '100%', padding: '5px 8px', borderRadius: 2, border: `1px solid ${BORDER}`, fontSize: 12, boxSizing: 'border-box' }} />
        </div>

        {/* Entity link */}
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, color: SUBTLE, display: 'block', marginBottom: 4 }}>
            Link to {entityType === 'organizations' ? 'organization' : 'person'}
          </label>
          <select value={entityId} onChange={e => setEntityId(e.target.value)}
            style={{ width: '100%', padding: '5px 8px', borderRadius: 2, border: `1px solid ${BORDER}`, fontSize: 12, boxSizing: 'border-box' }}>
            <option value="">— none —</option>
            {entities.map(ent => <option key={ent.id} value={ent.id}>{ent.name}</option>)}
          </select>
        </div>

        {/* Notes */}
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes..."
          style={{ width: '100%', padding: '6px 8px', borderRadius: 2, border: `1px solid ${BORDER}`, fontSize: 12, minHeight: 60, resize: 'vertical', marginBottom: 10, boxSizing: 'border-box' }} />

        {/* Done checkbox */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: NAVY, marginBottom: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={done} onChange={e => setDone(e.target.checked)} />
          Mark as done
        </label>

        {error && <div style={{ color: '#DE350B', fontSize: 12, marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose}
            style={{ padding: '6px 14px', border: `1px solid ${BORDER}`, borderRadius: 2, background: WHITE, color: NAVY, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button type="submit" disabled={saving || !title.trim()}
            style={{ padding: '6px 14px', border: 'none', borderRadius: 2, background: GREEN_BG, color: WHITE, fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: saving || !title.trim() ? 0.6 : 1 }}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}

function AddEntityModal({ entityType, onSave, onClose }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await onSave({ name: name.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined })
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.35)' }} onClick={onClose}>
      <form onClick={e => e.stopPropagation()} onSubmit={handleSubmit}
        style={{ background: WHITE, borderRadius: 4, padding: 16, width: 360, maxWidth: '92vw', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 12 }}>
          Add {entityType === 'organizations' ? 'Organization' : 'Person'}
        </div>

        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name *"
          style={{ width: '100%', padding: '6px 8px', borderRadius: 2, border: `1px solid ${BORDER}`, fontSize: 12, marginBottom: 10, boxSizing: 'border-box' }} autoFocus />

        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
          style={{ width: '100%', padding: '6px 8px', borderRadius: 2, border: `1px solid ${BORDER}`, fontSize: 12, marginBottom: 10, boxSizing: 'border-box' }} />

        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone"
          style={{ width: '100%', padding: '6px 8px', borderRadius: 2, border: `1px solid ${BORDER}`, fontSize: 12, marginBottom: 12, boxSizing: 'border-box' }} />

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose}
            style={{ padding: '6px 14px', border: `1px solid ${BORDER}`, borderRadius: 2, background: WHITE, color: NAVY, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button type="submit" disabled={saving || !name.trim()}
            style={{ padding: '6px 14px', border: 'none', borderRadius: 2, background: GREEN_BG, color: WHITE, fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: saving || !name.trim() ? 0.6 : 1 }}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}
