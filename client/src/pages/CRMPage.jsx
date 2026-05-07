import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { crmApi } from '../lib/crmApi.js'
import { linksApi } from '../lib/linksApi.js'
import { eventBus, EVENTS } from '../lib/eventBus.js'

// ── Constants ──────────────────────────────────────────────────────────────────
const STAGES = [
  { id: 'lead',        label: 'Lead',        color: '#5E6C84', bg: '#F4F5F7', border: '#DFE1E6' },
  { id: 'qualified',   label: 'Qualified',   color: '#0052CC', bg: '#DEEBFF', border: '#4C9AFF' },
  { id: 'demo',        label: 'Demo',        color: '#6554C0', bg: '#EAE6FF', border: '#8777D9' },
  { id: 'proposal',    label: 'Proposal',    color: '#00875A', bg: '#E3FCEF', border: '#57D9A3' },
  { id: 'negotiation', label: 'Negotiation', color: '#974F0C', bg: '#FFFAE6', border: '#FFE380' },
  { id: 'won',         label: 'Won ✓',       color: '#006644', bg: '#E3FCEF', border: '#36B37E' },
  { id: 'lost',        label: 'Lost ✗',      color: '#BF2600', bg: '#FFEBE6', border: '#FF8F73' },
]
const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.id, s]))
const PROB_MAP  = { lead: 10, qualified: 25, demo: 40, proposal: 60, negotiation: 80, won: 100, lost: 0 }
const STAGE_BENCH = { lead: 3, qualified: 7, demo: 5, proposal: 10, negotiation: 14 }
// F3: stage progression rules — fields that should be present before advancing
const STAGE_RULES = {
  demo:        d => !d.contact_email ? 'No contact email set. Add one before moving to Demo.' : null,
  proposal:    d => !(parseFloat(d.deal_value) > 0) ? 'Deal value is $0. Add a value before moving to Proposal.' : null,
  negotiation: d => !d.expected_close_date ? 'No expected close date. Set one before Negotiation.' : null,
}
// F11: tag colors (cycle through 6 colors by tag index)
const TAG_COLORS = [
  { bg: '#DEEBFF', color: '#0052CC' }, { bg: '#EAE6FF', color: '#6554C0' },
  { bg: '#E3FCEF', color: '#006644' }, { bg: '#FFFAE6', color: '#974F0C' },
  { bg: '#FFEBE6', color: '#BF2600' }, { bg: '#F4F5F7', color: '#5E6C84' },
]
function parseTags(str) { return (str || '').split(',').map(t => t.trim()).filter(Boolean) }
// F20: generate Google Calendar event URL for meeting activities
function googleCalendarUrl(activity, deal) {
  const title = encodeURIComponent(activity.title || `Meeting: ${deal.company_name}`)
  const details = encodeURIComponent(activity.body || '')
  const date = activity.occurred_at ? activity.occurred_at.slice(0, 10).replace(/-/g, '') : todayStr().replace(/-/g, '')
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${date}/${date}`
}
const ACT_TYPES = [
  { id: 'note',     label: 'Note',      color: '#6554C0' },
  { id: 'email',    label: 'Email',     color: '#0052CC' },
  { id: 'meeting',  label: 'Meeting',   color: '#00875A' },
  { id: 'call',     label: 'Call',      color: '#974F0C' },
  { id: 'whatsapp', label: 'WhatsApp',  color: '#00875A' },
  { id: 'sms',      label: 'SMS',       color: '#6554C0' },
]
const EMPTY_FORM = {
  company_name: '', contact_name: '', contact_email: '',
  deal_value: '', stage: 'lead', next_action: '', notes: '',
  last_contact_at: '', expected_close_date: '', probability: 10,
  linkedin_url: '', follow_up_at: '', node_id: '', node_key: '', lost_reason: '', tags: '', assigned_to: '',
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmt$(v) {
  const n = parseFloat(v) || 0
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)    return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}
function daysSince(d) {
  if (!d) return ''
  const diff = Math.floor((Date.now() - new Date(d)) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return '1d ago'
  return `${diff}d ago`
}
function initials(n) {
  if (!n) return '?'
  return n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
function dealScore(d) {
  return Math.round(parseFloat(d.deal_value || 0) * (d.probability || 0) / 100)
}
function agingInfo(d) {
  if (d.stage === 'won' || d.stage === 'lost') return null
  const days = Math.floor((Date.now() - new Date(d.updated_at || d.created_at)) / 86_400_000)
  if (days >= 14) return { level: 'critical', days, bg: '#FFF0EE', border: '#FF5630' }
  if (days >= 7)  return { level: 'warning',  days, bg: '#FFFAE6', border: '#FFE380' }
  return null
}
// F2: inactivity nudge — distinct from aging; shows if no update in 5+ days (lower threshold, softer badge)
function inactivityNudge(d) {
  if (d.stage === 'won' || d.stage === 'lost') return null
  const days = Math.floor((Date.now() - new Date(d.updated_at || d.created_at)) / 86_400_000)
  if (days >= 5 && days < 7) return { days }
  return null
}
// F4: probability decay — if deal is past stage benchmark AND probability is still at default, flag it
function probDecay(d) {
  if (d.stage === 'won' || d.stage === 'lost') return false
  const bench = STAGE_BENCH[d.stage]
  if (!bench) return false
  const daysInStage = Math.floor((Date.now() - new Date(d.stage_entered_at || d.created_at)) / 86_400_000)
  const defaultProb = PROB_MAP[d.stage]
  return daysInStage > bench && d.probability === defaultProb
}
function stageTime(d) {
  if (!STAGE_BENCH[d.stage]) return null
  const days = Math.floor((Date.now() - new Date(d.stage_entered_at || d.created_at)) / 86_400_000)
  return { days, bench: STAGE_BENCH[d.stage], over: days > STAGE_BENCH[d.stage] }
}
function followUpInfo(d) {
  if (!d.follow_up_at || d.stage === 'won' || d.stage === 'lost') return null
  const diff = Math.floor((new Date(d.follow_up_at) - Date.now()) / 86_400_000)
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, overdue: true }
  if (diff === 0) return { label: 'Due today', overdue: false }
  return { label: `Due in ${diff}d`, overdue: false }
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtDT(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function CRMPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // Core data
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // View (feature 19)
  const [view, setView] = useState('kanban') // kanban | list | analytics
  const [sortBy, setSortBy] = useState('updated_at')
  const [sortDir, setSortDir] = useState('desc')

  // Right panel
  const [panelDeal, setPanelDeal] = useState(null)
  const [panelTab, setPanelTab] = useState('overview')
  const [panelContacts, setPanelContacts] = useState([])
  const [panelActivities, setPanelActivities] = useState([])
  const [panelTasks, setPanelTasks] = useState([])
  const [panelLoading, setPanelLoading] = useState(false)

  // Panel inline forms
  const [addingContact, setAddingContact] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', email: '', phone: '', role: '' })
  const [addingActivity, setAddingActivity] = useState(false)
  const [newActivity, setNewActivity] = useState({ type: 'note', title: '', body: '', occurred_at: todayStr(), remind_at: '' })
  const [addingTask, setAddingTask] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', due_at: '' })

  // Edit modal
  const [editModal, setEditModal] = useState(null) // null | 'new' | deal-object
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [dupWarning, setDupWarning] = useState('')
  const [showAdv, setShowAdv] = useState(false)

  // Drag & drop
  const [dragId, setDragId] = useState(null)
  const [dragOverStage, setDragOverStage] = useState(null)

  // Lost reason modal (feature 5)
  const [lostModal, setLostModal] = useState(null) // { dealId }
  const [lostReason, setLostReason] = useState('')

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Company profile modal (feature 6)
  const [companyModal, setCompanyModal] = useState(null) // company name string

  // F1: quick follow-up scheduler
  const [followUpQuick, setFollowUpQuick] = useState(null) // dealId

  // F3: stage progression rules warning
  const [stageRuleWarn, setStageRuleWarn] = useState(null)

  // F9: search & filter
  const [searchQuery, setSearchQuery]   = useState('')
  const [filterStage, setFilterStage]   = useState('')
  const [filterMin,   setFilterMin]     = useState('')
  const [filterMax,   setFilterMax]     = useState('')
  const [showFilterBar, setShowFilterBar] = useState(false)

  // F10: saved filter views
  const [savedViews, setSavedViews]   = useState(() => { try { return JSON.parse(localStorage.getItem('crm-saved-views') || '[]') } catch { return [] } })
  const [savingView, setSavingView]   = useState(false)
  const [newViewName, setNewViewName] = useState('')

  // F12: CSV import
  const csvInputRef = useRef(null)
  const [csvImporting, setCsvImporting] = useState(false)

  // F14: forecast column
  const [showForecast, setShowForecast] = useState(false)

  // F15: heatmap mode
  const [heatmapMode, setHeatmapMode] = useState(null) // null | 'value' | 'probability' | 'age'

  // F16: card field visibility
  const [cardFields, setCardFields] = useState(() => {
    try { return JSON.parse(localStorage.getItem('crm-card-fields') || 'null') } catch { return null }
  })
  const cardVis = cardFields || { contact: true, nextAction: true, tags: true, assignedTo: true, score: true, probability: true }
  function toggleCardField(key) {
    const next = { ...cardVis, [key]: !cardVis[key] }
    setCardFields(next)
    localStorage.setItem('crm-card-fields', JSON.stringify(next))
  }
  const [showCardFields, setShowCardFields] = useState(false)

  // F18: deal comments
  const [panelComments, setPanelComments]     = useState([])
  const [addingComment, setAddingComment]     = useState(false)
  const [newComment,    setNewComment]         = useState('')

  // F5: email templates
  const [emailTemplates,   setEmailTemplates]   = useState([])
  const [templateModal,    setTemplateModal]     = useState(false) // manage modal
  const [templatePicker,   setTemplatePicker]    = useState(false) // pick-to-use dropdown
  const [newTemplate,      setNewTemplate]       = useState({ name: '', subject: '', body: '' })

  // F19: pipeline goals
  const [goals, setGoals]           = useState([])
  const [goalModal, setGoalModal]   = useState(false)
  const [goalForm, setGoalForm]     = useState({ target_value: '', target_count: '' }) // { message, dealId, targetStage }

  // ── Load ────────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try { setLoading(true); setDeals(await crmApi.getDeals()) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  // F19: load goals on mount
  useEffect(() => {
    crmApi.getGoals().then(setGoals).catch(() => {})
  }, [])

  // F5: load email templates on mount
  useEffect(() => {
    crmApi.getEmailTemplates().then(setEmailTemplates).catch(() => {})
  }, [])

  // Canvas node picker (link deal → new canvas node)
  const [canvasPicker, setCanvasPicker] = useState(null)   // null | { deal }
  const [cpProjects,   setCpProjects]   = useState([])
  const [cpProjId,     setCpProjId]     = useState('')     // existing project id OR 'new'
  const [cpNewProjName, setCpNewProjName] = useState('')
  const [cpMapId,      setCpMapId]      = useState('')
  const [cpSaving,     setCpSaving]     = useState(false)
  const [cpError,      setCpError]      = useState('')

  useEffect(() => {
    if (!canvasPicker) return
    setCpProjects([]); setCpProjId(''); setCpMapId(''); setCpError(''); setCpNewProjName('')

    const user = (() => { try { return JSON.parse(localStorage.getItem('chart-to-jira-user') || '{}') } catch { return {} } })()
    const localData = (() => { try { return JSON.parse(localStorage.getItem(`chart-to-jira-projects-${user.id}`) || 'null') } catch { return null } })()

    if (localData?.projects) {
      const valid = Object.values(localData.projects).filter(p => {
        if (!p.maps) return false
        return Object.values(p.maps).some(m => m.nodes && Object.keys(m.nodes).length > 0)
      }).map(p => ({
        id: p.id,
        name: p.name,
        state: { maps: p.maps },
      }))
      setCpProjects(valid)
      if (valid.length === 1) {
        setCpProjId(valid[0].id)
        const maps = Object.values(valid[0].state.maps)
        if (maps.length === 1) setCpMapId(maps[0].id)
      }
    } else {
      setCpError('No local projects found. Create a project on the canvas first.')
    }
  }, [canvasPicker])

  // Open new-deal modal pre-filled when navigating from canvas "Track in CRM" button
  useEffect(() => {
    const nd = location.state?.newDeal
    if (!nd) return
    setForm({ ...EMPTY_FORM, company_name: nd.company_name || '', node_id: nd.node_id || '', node_key: nd.node_key || '' })
    setFormError(''); setDupWarning(''); setShowAdv(false)
    setEditModal('new')
    window.history.replaceState({}, '')
  }, [location.state])

  // Open deal panel when navigating from global search
  useEffect(() => {
    const id = location.state?.openDealId
    if (!id || !deals.length) return
    const deal = deals.find(d => d.id === id)
    if (deal) { openPanel(deal); window.history.replaceState({}, '') }
  }, [location.state, deals])

  // ── Duplicate detector (feature 10) ─────────────────────────────────────────
  useEffect(() => {
    if (editModal !== 'new' || !form.company_name.trim()) { setDupWarning(''); return }
    const name = form.company_name.trim().toLowerCase()
    const dup = deals.find(d => d.company_name.toLowerCase() === name && d.stage !== 'lost')
    setDupWarning(dup ? `⚠ "${dup.company_name}" already has an open deal in ${STAGE_MAP[dup.stage]?.label}` : '')
  }, [form.company_name, editModal, deals])

  // ── Canvas link: create a new node in chosen project/map ────────────────────
  async function handleCanvasLink() {
    if (cpProjId === 'new' && !cpNewProjName.trim()) { setCpError('Enter a project name'); return }
    if (!cpProjId) { setCpError('Please select a project'); return }
    if (cpProjId !== 'new' && !cpMapId) { setCpError('Please select a map'); return }
    const deal = canvasPicker.deal
    setCpSaving(true); setCpError('')
    try {
      const token = (() => { try { return localStorage.getItem('chart-to-jira-token') } catch { return null } })()
      let targetProjId = cpProjId
      let targetMapId = cpMapId

      if (cpProjId === 'new') {
        // Create a brand new project with one default map
        targetProjId = crypto.randomUUID()
        targetMapId = crypto.randomUUID()
        const rootId = 'root'
        const initialState = {
          activeMapId: targetMapId,
          mapOrder: [targetMapId],
          maps: {
            [targetMapId]: {
              id: targetMapId, name: 'Main',
              rootId,
              nodes: { [rootId]: { id: rootId, title: cpNewProjName.trim(), parentId: null, childIds: [], depth: 0, color: null, collapsed: false, shape: 'rect', x: 0, y: 0 } },
              extraEdges: [], groups: [], customStatuses: [], customFields: [], frames: [],
            },
          },
        }
        const cr = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id: targetProjId, name: cpNewProjName.trim(), state: initialState }),
        })
        if (!cr.ok) throw new Error('Failed to create project')
      }

      // Fetch full project state — prefer localStorage (local-only projects) over server
      const user2 = (() => { try { return JSON.parse(localStorage.getItem('chart-to-jira-user') || '{}') } catch { return {} } })()
      const localData2 = (() => { try { return JSON.parse(localStorage.getItem(`chart-to-jira-projects-${user2.id}`) || 'null') } catch { return null } })()
      const localProj = localData2?.projects?.[targetProjId]
      let state
      if (localProj) {
        state = { activeMapId: localProj.activeMapId, mapOrder: localProj.mapOrder, maps: localProj.maps, nodePrefix: localProj.nodePrefix, nodeCounter: localProj.nodeCounter }
      } else {
        const res = await fetch(`/api/projects/${targetProjId}`, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) throw new Error('Project not found')
        const proj = await res.json()
        state = proj.state
      }
      const map = state.maps?.[targetMapId]
      if (!map) throw new Error('Map not found in project')

      // Build new node as child of root — include nodeKey based on project counter
      const nodeId = crypto.randomUUID()
      const root = map.nodes[map.rootId]
      if (!root) throw new Error('Root node missing in map')
      const sibIdx = root.childIds.length
      // Compute nodeKey: use project nodePrefix + nodeCounter (increment for new node)
      const projPrefix = state.nodePrefix || proj.name?.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'NODE'
      const projCounter = (state.nodeCounter || 0) + 1
      const nodeKey = `${projPrefix}-${String(projCounter).padStart(3, '0')}`
      const newNode = {
        id: nodeId, title: deal.company_name, parentId: map.rootId,
        childIds: [], depth: 1, color: null, collapsed: false, shape: 'rect',
        x: (root.x ?? 0) + sibIdx * 220, y: (root.y ?? 0) + 160,
        nodeKey,
      }
      const updatedMap = {
        ...map,
        nodes: {
          ...map.nodes,
          [map.rootId]: { ...root, childIds: [...root.childIds, nodeId] },
          [nodeId]: newNode,
        },
      }
      const updatedState = { ...state, maps: { ...state.maps, [targetMapId]: updatedMap }, nodeCounter: projCounter }

      // Save updated state: write to localStorage first (for local projects), then sync to server
      if (localProj && localData2 && user2.id) {
        const updatedLocalProj = {
          ...localProj,
          maps: updatedState.maps,
          nodeCounter: updatedState.nodeCounter,
          nodePrefix: updatedState.nodePrefix,
        }
        const newLocalData = { ...localData2, projects: { ...localData2.projects, [targetProjId]: updatedLocalProj } }
        try { localStorage.setItem(`chart-to-jira-projects-${user2.id}`, JSON.stringify(newLocalData)) } catch (_) {}
        // Best-effort server sync (creates project on server if it doesn't exist yet)
        fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id: targetProjId, name: localProj.name, state: updatedState }),
        }).then(r => {
          if (r.ok || r.status === 409) {
            fetch(`/api/projects/${targetProjId}/state`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ state: updatedState }),
            }).catch(() => {})
          }
        }).catch(() => {})
      } else {
        const sr = await fetch(`/api/projects/${targetProjId}/state`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ state: updatedState }),
        })
        if (!sr.ok) throw new Error('Failed to save canvas node')
      }

      // Link the node_id and node_key on the deal
      const updated = await crmApi.updateDeal(deal.id, {
        company_name: deal.company_name, contact_name: deal.contact_name, contact_email: deal.contact_email,
        deal_value: deal.deal_value, stage: deal.stage, probability: deal.probability,
        next_action: deal.next_action, notes: deal.notes, last_contact_at: deal.last_contact_at,
        expected_close_date: deal.expected_close_date, linkedin_url: deal.linkedin_url,
        follow_up_at: deal.follow_up_at, lost_reason: deal.lost_reason, tags: deal.tags,
        assigned_to: deal.assigned_to, node_id: nodeId, node_key: nodeKey, project_id: targetProjId,
      })
      await linksApi.create({
        source_type: 'node', source_id: nodeId, source_key: nodeKey,
        target_type: 'crm_deal', target_id: String(deal.id),
        relation: 'linked_to', project_id: targetProjId,
      }).catch(() => {})
      eventBus.emit(EVENTS.CRM_DEAL_LINKED, { nodeId, dealId: deal.id })
      setDeals(ds => ds.map(d => d.id === deal.id ? updated : d))
      if (panelDeal?.id === deal.id) setPanelDeal(updated)
      setCanvasPicker(null)
      navigate('/app', { state: { focusNodeId: nodeId, projectId: targetProjId, mapId: targetMapId } })
    } catch (e) {
      setCpError(e.message || 'Failed to create node')
    } finally {
      setCpSaving(false)
    }
  }

  async function handleUnlinkCanvas(deal) {
    try {
      if (deal.node_id) {
        await linksApi.removeBySource('node', deal.node_id).catch(() => {})
      }
      const updated = await crmApi.updateDeal(deal.id, {
        company_name: deal.company_name, contact_name: deal.contact_name, contact_email: deal.contact_email,
        deal_value: deal.deal_value, stage: deal.stage, probability: deal.probability,
        next_action: deal.next_action, notes: deal.notes, last_contact_at: deal.last_contact_at,
        expected_close_date: deal.expected_close_date, linkedin_url: deal.linkedin_url,
        follow_up_at: deal.follow_up_at, lost_reason: deal.lost_reason, tags: deal.tags,
        assigned_to: deal.assigned_to, node_id: '', node_key: '',
      })
      setDeals(ds => ds.map(d => d.id === deal.id ? updated : d))
      if (panelDeal?.id === deal.id) setPanelDeal(updated)
      eventBus.emit(EVENTS.CRM_DEAL_UNLINKED, { nodeId: deal.node_id, dealId: deal.id })
    } catch (e) {
      // silent — user will see the button is still there
    }
  }

  // ── Stats ───────────────────────────────────────────────────────────────────
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const active   = deals.filter(d => d.stage !== 'won' && d.stage !== 'lost')
  const wonDeals = deals.filter(d => d.stage === 'won')
  const lostDeals = deals.filter(d => d.stage === 'lost')
  const wonMonth = wonDeals.filter(d => (d.updated_at || '').slice(0, 7) === thisMonth)
  const pipeline = active.reduce((s, d) => s + parseFloat(d.deal_value || 0), 0)
  const forecast = active.reduce((s, d) => s + dealScore(d), 0)  // feature 3
  const winRate  = wonDeals.length + lostDeals.length > 0
    ? Math.round(wonDeals.length / (wonDeals.length + lostDeals.length) * 100) : 0
  const followUpsDue = deals.filter(d => {
    if (!d.follow_up_at || d.stage === 'won' || d.stage === 'lost') return false
    return new Date(d.follow_up_at) <= now
  }).length

  // ── Analytics data (features 15–18) ─────────────────────────────────────────
  const months6 = []
  for (let i = 5; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
    const label = dt.toLocaleDateString('en-US', { month: 'short' })
    const mWon = wonDeals.filter(d => (d.updated_at || '').slice(0, 7) === key)
    months6.push({ key, label, value: mWon.reduce((s, d) => s + parseFloat(d.deal_value || 0), 0), count: mWon.length })
  }
  const maxMonthVal = Math.max(...months6.map(m => m.value), 1)
  const avgDaysToWin = wonDeals.length > 0
    ? Math.round(wonDeals.filter(d => d.created_at && d.updated_at).reduce((s, d) => {
        return s + Math.floor((new Date(d.updated_at) - new Date(d.created_at)) / 86_400_000)
      }, 0) / wonDeals.length) : null

  // ── Panel helpers ────────────────────────────────────────────────────────────
  async function openPanel(deal) {
    setPanelDeal(deal); setPanelTab('overview'); setPanelLoading(true)
    setAddingContact(false); setAddingActivity(false); setAddingTask(false)
    setAddingComment(false); setNewComment('')
    try {
      const [c, a, t, cm] = await Promise.all([
        crmApi.getContacts(deal.id),
        crmApi.getActivities(deal.id),
        crmApi.getTasks(deal.id),
        crmApi.getComments(deal.id),
      ])
      setPanelContacts(c); setPanelActivities(a); setPanelTasks(t); setPanelComments(cm)
    } catch (e) { console.error(e) }
    finally { setPanelLoading(false) }
  }
  function closePanel() {
    setPanelDeal(null); setPanelContacts([]); setPanelActivities([]); setPanelTasks([]); setPanelComments([])
  }

  // ── Edit modal helpers ───────────────────────────────────────────────────────
  function openNew(stage = 'lead') {
    setForm({ ...EMPTY_FORM, stage }); setFormError(''); setDupWarning(''); setShowAdv(false)
    setEditModal('new')
  }
  function openEdit(deal) {
    setForm({
      company_name: deal.company_name || '',
      contact_name: deal.contact_name || '',
      contact_email: deal.contact_email || '',
      deal_value: deal.deal_value || '',
      stage: deal.stage || 'lead',
      next_action: deal.next_action || '',
      notes: deal.notes || '',
      last_contact_at: deal.last_contact_at ? deal.last_contact_at.slice(0, 10) : '',
      expected_close_date: deal.expected_close_date ? deal.expected_close_date.slice(0, 10) : '',
      probability: deal.probability ?? PROB_MAP[deal.stage] ?? 10,
      linkedin_url: deal.linkedin_url || '',
      follow_up_at: deal.follow_up_at ? deal.follow_up_at.slice(0, 10) : '',
      node_id: deal.node_id || '',
      node_key: deal.node_key || '',
      lost_reason: deal.lost_reason || '',
      tags: deal.tags || '',
      assigned_to: deal.assigned_to || '',
    })
    setFormError(''); setShowAdv(false); setEditModal(deal)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.company_name.trim()) { setFormError('Company name is required.'); return }
    // If transitioning to lost via edit modal, ensure lost_reason collected
    if (editModal !== 'new' && form.stage === 'lost' && editModal.stage !== 'lost' && !form.lost_reason.trim()) {
      setShowAdv(true)
      setFormError('Please enter a lost reason.')
      return
    }
    setSaving(true); setFormError('')
    try {
      if (editModal === 'new') {
        const d = await crmApi.createDeal(form)
        setDeals(prev => [d, ...prev])
      } else {
        const d = await crmApi.updateDeal(editModal.id, form)
        setDeals(prev => prev.map(x => x.id === d.id ? d : x))
        if (panelDeal?.id === d.id) setPanelDeal(d)
      }
      setEditModal(null)
    } catch (e) { setFormError(e.message) }
    finally { setSaving(false) }
  }

  // ── Drag & drop ──────────────────────────────────────────────────────────────
  function onDragStart(e, id) { setDragId(id); e.dataTransfer.effectAllowed = 'move' }
  function onDragOver(e, sId) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverStage(sId) }
  function onDragLeave() { setDragOverStage(null) }
  async function onDrop(e, stageId) {
    e.preventDefault(); setDragOverStage(null)
    if (!dragId) return
    const deal = deals.find(d => d.id === dragId)
    if (!deal || deal.stage === stageId) { setDragId(null); return }
    setDragId(null)
    if (stageId === 'lost') { setLostModal({ dealId: deal.id }); setLostReason(''); return }
    // F3: check stage progression rules
    const ruleMsg = STAGE_RULES[stageId]?.(deal)
    if (ruleMsg) { setStageRuleWarn({ message: ruleMsg, dealId: deal.id, targetStage: stageId }); return }
    setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, stage: stageId, probability: PROB_MAP[stageId] } : d))
    if (panelDeal?.id === deal.id) setPanelDeal(p => ({ ...p, stage: stageId, probability: PROB_MAP[stageId] }))
    try { await crmApi.updateStage(deal.id, stageId) } catch { load() }
  }

  // F3: confirm stage move despite rule warning
  async function handleStageRuleConfirm() {
    if (!stageRuleWarn) return
    const { dealId, targetStage } = stageRuleWarn
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: targetStage, probability: PROB_MAP[targetStage] } : d))
    if (panelDeal?.id === dealId) setPanelDeal(p => ({ ...p, stage: targetStage, probability: PROB_MAP[targetStage] }))
    try { await crmApi.updateStage(dealId, targetStage) } catch { load() }
    setStageRuleWarn(null)
  }

  // ── Lost reason confirm (feature 5) ─────────────────────────────────────────
  async function handleLostConfirm() {
    if (!lostModal) return
    const { dealId } = lostModal
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: 'lost', probability: 0 } : d))
    if (panelDeal?.id === dealId) setPanelDeal(p => ({ ...p, stage: 'lost', probability: 0, lost_reason: lostReason }))
    try { await crmApi.updateStage(dealId, 'lost', lostReason) } catch { load() }
    setLostModal(null); setLostReason('')
  }

  // ── F1: Quick follow-up scheduler ───────────────────────────────────────────
  async function handleQuickFollowUp(dealId, days) {
    const d = new Date()
    d.setDate(d.getDate() + days)
    const dateStr = d.toISOString().slice(0, 10)
    try {
      const updated = await crmApi.updateFollowUp(dealId, dateStr)
      setDeals(prev => prev.map(x => x.id === dealId ? updated : x))
      if (panelDeal?.id === dealId) setPanelDeal(updated)
    } catch (e) { alert(e.message) }
    setFollowUpQuick(null)
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  async function handleDelete() {    if (!deleteConfirm) return
    try {
      await crmApi.deleteDeal(deleteConfirm)
      setDeals(prev => prev.filter(d => d.id !== deleteConfirm))
      if (panelDeal?.id === deleteConfirm) closePanel()
      if (editModal?.id === deleteConfirm) setEditModal(null)
    } catch {}
    setDeleteConfirm(null)
  }

  // ── Contacts handlers (feature 7) ────────────────────────────────────────────
  async function saveContact() {
    if (!newContact.name.trim()) return
    try {
      const c = await crmApi.addContact(panelDeal.id, newContact)
      setPanelContacts(prev => [...prev, c])
      setNewContact({ name: '', email: '', phone: '', role: '' }); setAddingContact(false)
    } catch (e) { alert(e.message) }
  }
  async function deleteContact(id) {
    await crmApi.deleteContact(id)
    setPanelContacts(prev => prev.filter(c => c.id !== id))
  }

  // ── Activities handlers (features 8, 12, 13) ─────────────────────────────────
  async function saveActivity() {
    if (!newActivity.body?.trim() && !newActivity.title?.trim()) return
    try {
      const a = await crmApi.addActivity(panelDeal.id, newActivity)
      setPanelActivities(prev => [a, ...prev])
      setNewActivity({ type: 'note', title: '', body: '', occurred_at: todayStr(), remind_at: '' }); setAddingActivity(false)
    } catch (e) { alert(e.message) }
  }
  async function deleteActivity(id) {
    await crmApi.deleteActivity(id)
    setPanelActivities(prev => prev.filter(a => a.id !== id))
  }

  // ── Tasks handlers (feature 11, 14 follow-up) ────────────────────────────────
  async function saveTask() {
    if (!newTask.title.trim()) return
    try {
      const t = await crmApi.addTask(panelDeal.id, newTask)
      setPanelTasks(prev => [...prev, t])
      setNewTask({ title: '', due_at: '' }); setAddingTask(false)
    } catch (e) { alert(e.message) }
  }
  async function toggleTask(id, done) {
    const t = await crmApi.toggleTask(id, done)
    setPanelTasks(prev => prev.map(x => x.id === id ? t : x))
  }
  async function deleteTask(id) {
    await crmApi.deleteTask(id)
    setPanelTasks(prev => prev.filter(t => t.id !== id))
  }

  // ── F18: Comments handlers ────────────────────────────────────────────────────
  async function saveComment() {
    if (!newComment.trim()) return
    try {
      const c = await crmApi.addComment(panelDeal.id, newComment)
      setPanelComments(prev => [...prev, c])
      setNewComment(''); setAddingComment(false)
    } catch (e) { alert(e.message) }
  }
  async function deleteComment(id) {
    await crmApi.deleteComment(id)
    setPanelComments(prev => prev.filter(c => c.id !== id))
  }

  // ── F19: Goal handler ─────────────────────────────────────────────────────────
  async function saveGoal() {
    const period_key = thisMonth
    try {
      const g = await crmApi.saveGoal({ period_key, target_value: parseFloat(goalForm.target_value) || 0, target_count: parseInt(goalForm.target_count) || 0 })
      setGoals(prev => { const idx = prev.findIndex(x => x.period_key === period_key); return idx >= 0 ? prev.map((x, i) => i === idx ? g : x) : [g, ...prev] })
      setGoalModal(false)
    } catch (e) { alert(e.message) }
  }

  // ── F5: Email template handlers ──────────────────────────────────────────────
  async function saveTemplate() {
    if (!newTemplate.name.trim() || !newTemplate.body.trim()) return
    try {
      const t = await crmApi.createEmailTemplate(newTemplate)
      setEmailTemplates(prev => [t, ...prev])
      setNewTemplate({ name: '', subject: '', body: '' })
    } catch (e) { alert(e.message) }
  }
  async function deleteTemplate(id) {
    try {
      await crmApi.deleteEmailTemplate(id)
      setEmailTemplates(prev => prev.filter(t => t.id !== id))
    } catch (e) { alert(e.message) }
  }
  function applyTemplate(t) {
    setNewActivity(p => ({ ...p, title: t.subject || t.name, body: t.body }))
    setTemplatePicker(false)
  }

  // ── F9: filtered deals ───────────────────────────────────────────────────────
  const filteredDeals = deals.filter(d => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!d.company_name?.toLowerCase().includes(q) && !d.contact_name?.toLowerCase().includes(q)) return false
    }
    if (filterStage && d.stage !== filterStage) return false
    if (filterMin !== '' && parseFloat(d.deal_value) < parseFloat(filterMin)) return false
    if (filterMax !== '' && parseFloat(d.deal_value) > parseFloat(filterMax)) return false
    return true
  })

  // ── F10: saved filter views helpers ─────────────────────────────────────────
  function saveCurrentView() {
    if (!newViewName.trim()) return
    const view = { name: newViewName.trim(), searchQuery, filterStage, filterMin, filterMax }
    const updated = [view, ...savedViews.filter(v => v.name !== view.name)]
    setSavedViews(updated)
    localStorage.setItem('crm-saved-views', JSON.stringify(updated))
    setNewViewName(''); setSavingView(false)
  }
  function loadView(v) {
    setSearchQuery(v.searchQuery || ''); setFilterStage(v.filterStage || '')
    setFilterMin(v.filterMin || ''); setFilterMax(v.filterMax || '')
    setShowFilterBar(true)
  }
  function deleteView(name) {
    const updated = savedViews.filter(v => v.name !== name)
    setSavedViews(updated)
    localStorage.setItem('crm-saved-views', JSON.stringify(updated))
  }

  // ── F12: CSV import handler ──────────────────────────────────────────────────
  async function handleCsvImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setCsvImporting(true)
    try {
      const text = await file.text()
      const lines = text.split(/\r?\n/).filter(Boolean)
      if (lines.length < 2) { alert('CSV must have a header row and at least one data row.'); return }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))
      const rows = lines.slice(1).map(line => {
        const vals = line.split(',')
        return Object.fromEntries(headers.map((h, i) => [h, (vals[i] || '').trim()]))
      })
      let created = 0, failed = 0
      for (const row of rows) {
        const company = row.company_name || row.company || row.name
        if (!company) { failed++; continue }
        try {
          await crmApi.createDeal({
            company_name: company,
            contact_name: row.contact_name || row.contact || '',
            contact_email: row.contact_email || row.email || '',
            deal_value: row.deal_value || row.value || row.amount || '',
            stage: row.stage || 'lead',
            next_action: row.next_action || '',
            notes: row.notes || '',
            tags: row.tags || '',
            assigned_to: row.assigned_to || row.owner || '',
          })
          created++
        } catch { failed++ }
      }
      await load()
      alert(`Import complete: ${created} deals created${failed > 0 ? `, ${failed} skipped` : ''}.`)
    } catch (err) {
      alert('CSV import failed: ' + err.message)
    } finally {
      setCsvImporting(false)
    }
  }

  // ── List sort (feature 19) ───────────────────────────────────────────────────
  const sortedDeals = [...filteredDeals].sort((a, b) => {    let av = a[sortBy], bv = b[sortBy]
    if (sortBy === 'deal_value') { av = parseFloat(a.deal_value || 0); bv = parseFloat(b.deal_value || 0) }
    if (sortBy === 'score') { av = dealScore(a); bv = dealScore(b) }
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })
  function toggleSort(col) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('desc') }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  const panelOpen = !!panelDeal
  const pendingTasks = panelTasks.filter(t => !t.done)
  const overdueTasks = panelTasks.filter(t => !t.done && t.due_at && new Date(t.due_at) < now)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F7F8FA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflow: 'hidden' }}>

      {/* ── Top bar ── */}
      <div style={{ background: '#0747A6', color: '#fff', padding: '0 16px', height: 44, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, boxShadow: '0 2px 8px rgba(9,30,66,0.25)' }}>
        <button onClick={() => navigate('/app')} style={topBtn}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'transparent' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Canvas
        </button>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.25)' }} />
        <span style={{ fontSize: 13, fontWeight: 700 }}>CRM Pipeline</span>
        <div style={{ flex: 1 }} />
        {['kanban', 'list', 'analytics'].map(v => (
          <button key={v} onClick={() => setView(v)}
            style={{ ...topBtn, background: view === v ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)', borderColor: view === v ? 'rgba(255,255,255,0.3)' : 'transparent', fontWeight: view === v ? 700 : 400 }}
            onMouseEnter={e => { if (view !== v) { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' } }}
            onMouseLeave={e => { if (view !== v) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'transparent' } }}>
            {v === 'kanban' ? '⎔ Board' : v === 'list' ? '≡ List' : '▲ Analytics'}
          </button>
        ))}
        {/* F9: filter toggle */}
        <button onClick={() => setShowFilterBar(s => !s)}
          style={{ ...topBtn, background: showFilterBar ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)', borderColor: showFilterBar ? 'rgba(255,255,255,0.3)' : 'transparent', position: 'relative' }}
          title="Search & filter"
          onMouseEnter={e => { if (!showFilterBar) { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' } }}
          onMouseLeave={e => { if (!showFilterBar) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'transparent' } }}>
          🔍
          {(searchQuery || filterStage || filterMin || filterMax) && (
            <span style={{ position: 'absolute', top: 3, right: 3, width: 5, height: 5, borderRadius: '50%', background: '#FF5630' }} />
          )}
        </button>
        {/* F14: forecast column toggle */}
        {view === 'kanban' && (
          <button onClick={() => setShowForecast(s => !s)}
            style={{ ...topBtn, background: showForecast ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)', borderColor: showForecast ? 'rgba(255,255,255,0.3)' : 'transparent' }}
            title="Closing this month"
            onMouseEnter={e => { if (!showForecast) { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' } }}
            onMouseLeave={e => { if (!showForecast) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'transparent' } }}>
            📅 Forecast
          </button>
        )}
        {/* F15: heatmap cycle */}
        {view === 'kanban' && (
          <button
            onClick={() => setHeatmapMode(m => m === null ? 'value' : m === 'value' ? 'probability' : m === 'probability' ? 'age' : null)}
            style={{ ...topBtn, background: heatmapMode ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)', borderColor: heatmapMode ? 'rgba(255,255,255,0.3)' : 'transparent' }}
            title={`Heatmap: ${heatmapMode || 'off'}`}
            onMouseEnter={e => { if (!heatmapMode) { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' } }}
            onMouseLeave={e => { if (!heatmapMode) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'transparent' } }}>
            🌡 {heatmapMode ? `Heat: ${heatmapMode}` : 'Heatmap'}
          </button>
        )}
        {/* F16: card field customization */}
        {view === 'kanban' && (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowCardFields(s => !s)}
              style={{ ...topBtn, background: showCardFields ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)', borderColor: showCardFields ? 'rgba(255,255,255,0.3)' : 'transparent' }}
              onMouseEnter={e => { if (!showCardFields) { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' } }}
              onMouseLeave={e => { if (!showCardFields) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'transparent' } }}>
              ⚙ Card
            </button>
            {showCardFields && (
              <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 100, background: '#fff', border: '1px solid #DFE1E6', borderRadius: 8, boxShadow: '0 6px 20px rgba(9,30,66,0.14)', minWidth: 160, padding: '8px 0', marginTop: 4 }}
                onMouseLeave={() => setShowCardFields(false)}>
                <div style={{ padding: '4px 12px', fontSize: 10, fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Card fields</div>
                {[
                  { key: 'contact', label: 'Contact' },
                  { key: 'nextAction', label: 'Next action' },
                  { key: 'tags', label: 'Tags' },
                  { key: 'assignedTo', label: 'Assigned to' },
                  { key: 'score', label: 'Weighted score' },
                  { key: 'probability', label: 'Probability %' },
                ].map(({ key, label }) => (
                  <button key={key} onClick={() => toggleCardField(key)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '5px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#172B4D', textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span style={{ width: 14, fontSize: 12, color: cardVis[key] ? '#36B37E' : '#C1C7D0' }}>{cardVis[key] ? '✓' : '○'}</span>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.25)' }} />
        <button onClick={() => setTemplateModal(true)}
          style={{ ...topBtn, background: 'rgba(255,255,255,0.06)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'transparent' }}>
          📧 Templates
        </button>
        {/* F12: CSV import */}
        <input ref={csvInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCsvImport} />
        <button onClick={() => csvInputRef.current?.click()} disabled={csvImporting}
          style={{ ...topBtn, background: 'rgba(255,255,255,0.06)', opacity: csvImporting ? 0.6 : 1 }}
          onMouseEnter={e => { if (!csvImporting) { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' } }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'transparent' }}>
          {csvImporting ? '⏳ Importing…' : '⬆ Import CSV'}
        </button>
        <button onClick={() => openNew()} style={{ background: '#fff', color: '#0747A6', border: 'none', borderRadius: 5, padding: '5px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = '#DEEBFF'}
          onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
          + New Deal
        </button>
      </div>

      {/* ── Stats bar ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #EBECF0', display: 'flex', flexShrink: 0, overflowX: 'auto' }}>
        {[
          { label: 'Pipeline',         value: fmt$(pipeline),         sub: `${active.length} active` },
          { label: 'Forecast',          value: fmt$(forecast),         sub: 'weighted value' },
          { label: 'Won This Month',    value: wonMonth.length,        sub: fmt$(wonMonth.reduce((s, d) => s + parseFloat(d.deal_value || 0), 0)) },
          { label: 'Win Rate',          value: `${winRate}%`,          sub: `${wonDeals.length}W · ${lostDeals.length}L` },
          { label: 'Follow-ups Due',    value: followUpsDue || '—',    sub: 'reminders',            alert: followUpsDue > 0 },
          { label: 'Avg Close (days)',  value: avgDaysToWin ?? '—',    sub: 'lead → won' },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: '12px 20px', borderRight: i < 5 ? '1px solid #EBECF0' : 'none', minWidth: 120, flexShrink: 0, borderLeft: s.alert ? '3px solid #DE350B' : '3px solid transparent' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.alert ? '#DE350B' : '#172B4D', lineHeight: 1.2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#6B778C', marginTop: 1 }}>{s.sub}</div>
          </div>
        ))}
        {/* F19: Monthly goal progress */}
        {(() => {
          const goal = goals.find(g => g.period_key === thisMonth)
          if (!goal) return (
            <button onClick={() => { setGoalForm({ target_value: '', target_count: '' }); setGoalModal(true) }}
              style={{ padding: '12px 16px', border: 'none', borderLeft: '1px solid #EBECF0', background: 'none', cursor: 'pointer', minWidth: 110, flexShrink: 0, color: '#97A0AF', fontSize: 11 }}>
              + Set monthly goal
            </button>
          )
          const pctVal = goal.target_value > 0 ? Math.min(100, Math.round(wonMonth.reduce((s, d) => s + parseFloat(d.deal_value || 0), 0) / goal.target_value * 100)) : null
          const pctCnt = goal.target_count > 0 ? Math.min(100, Math.round(wonMonth.length / goal.target_count * 100)) : null
          return (
            <div onClick={() => { setGoalForm({ target_value: goal.target_value, target_count: goal.target_count }); setGoalModal(true) }}
              style={{ padding: '12px 16px', borderLeft: '1px solid #EBECF0', minWidth: 150, flexShrink: 0, cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                Monthly Goal <span style={{ fontSize: 9, color: '#C1C7D0' }}>✎</span>
              </div>
              {pctVal !== null && (
                <div style={{ marginBottom: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#5E6C84', marginBottom: 2 }}>
                    <span>Revenue</span><span style={{ fontWeight: 700, color: pctVal >= 100 ? '#006644' : '#172B4D' }}>{pctVal}%</span>
                  </div>
                  <div style={{ height: 5, background: '#F4F5F7', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${pctVal}%`, background: pctVal >= 100 ? '#36B37E' : '#0052CC', borderRadius: 3, transition: 'width 0.4s' }} />
                  </div>
                </div>
              )}
              {pctCnt !== null && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#5E6C84', marginBottom: 2 }}>
                    <span>Deals</span><span style={{ fontWeight: 700, color: pctCnt >= 100 ? '#006644' : '#172B4D' }}>{pctCnt}%</span>
                  </div>
                  <div style={{ height: 5, background: '#F4F5F7', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${pctCnt}%`, background: pctCnt >= 100 ? '#36B37E' : '#6554C0', borderRadius: 3, transition: 'width 0.4s' }} />
                  </div>
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {error && <div style={{ padding: '8px 20px', background: '#FFEBE6', color: '#BF2600', fontSize: 12, flexShrink: 0 }}>{error}</div>}

      {/* ── F9: Search & filter bar ── */}
      {showFilterBar && (
        <div style={{ background: '#fff', borderBottom: '1px solid #EBECF0', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
          <input
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search company or contact…"
            style={{ ...srchInput, width: 200 }}
          />
          <select value={filterStage} onChange={e => setFilterStage(e.target.value)} style={srchInput}>
            <option value="">All stages</option>
            {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <input value={filterMin} onChange={e => setFilterMin(e.target.value)} placeholder="Min $" type="number" style={{ ...srchInput, width: 80 }} />
          <input value={filterMax} onChange={e => setFilterMax(e.target.value)} placeholder="Max $" type="number" style={{ ...srchInput, width: 80 }} />
          {(searchQuery || filterStage || filterMin || filterMax) && (
            <button onClick={() => { setSearchQuery(''); setFilterStage(''); setFilterMin(''); setFilterMax('') }}
              style={{ fontSize: 11, color: '#BF2600', background: '#FFEBE6', border: '1px solid #FFBDAD', borderRadius: 5, padding: '4px 8px', cursor: 'pointer', fontWeight: 600 }}>
              Clear
            </button>
          )}
          {/* F10: Save view */}
          {savingView ? (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <input value={newViewName} onChange={e => setNewViewName(e.target.value)} placeholder="View name…"
                onKeyDown={e => { if (e.key === 'Enter') saveCurrentView(); if (e.key === 'Escape') setSavingView(false) }}
                style={{ ...srchInput, width: 130 }} autoFocus />
              <button onClick={saveCurrentView} style={{ fontSize: 11, background: '#0052CC', color: '#fff', border: 'none', borderRadius: 5, padding: '5px 10px', cursor: 'pointer', fontWeight: 600 }}>Save</button>
              <button onClick={() => setSavingView(false)} style={{ fontSize: 11, background: '#fff', border: '1.5px solid #DFE1E6', borderRadius: 5, padding: '4px 8px', cursor: 'pointer', color: '#6B778C' }}>✕</button>
            </div>
          ) : (
            <button onClick={() => setSavingView(true)} style={{ fontSize: 11, color: '#0052CC', background: '#EFF6FF', border: '1px solid #DEEBFF', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}>
              💾 Save view
            </button>
          )}
          {/* F10: Saved views chips */}
          {savedViews.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: '#97A0AF', fontWeight: 600 }}>Views:</span>
              {savedViews.map(v => (
                <div key={v.name} style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#DEEBFF', borderRadius: 10, padding: '2px 6px 2px 8px', fontSize: 11, border: '1px solid #B3D4FF' }}>
                  <button onClick={() => loadView(v)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#0052CC', fontWeight: 600, padding: 0 }}>{v.name}</button>
                  <button onClick={() => deleteView(v.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: '#4C9AFF', padding: '0 2px', lineHeight: 1 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#BF2600'}
                    onMouseLeave={e => e.currentTarget.style.color = '#4C9AFF'}>×</button>
                </div>
              ))}
            </div>
          )}
          {filteredDeals.length !== deals.length && (
            <span style={{ fontSize: 11, color: '#6B778C', marginLeft: 4 }}>{filteredDeals.length} of {deals.length} deals</span>
          )}
        </div>
      )}

      {/* ── Content area ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Kanban (feature 1, 2, 4, 9, 14) ── */}
        {view === 'kanban' && (
          <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', padding: 16 }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#6B778C', fontSize: 13 }}>Loading deals…</div>
            ) : (
              <div style={{ display: 'flex', gap: 10, minWidth: 'max-content', alignItems: 'flex-start' }}>
                {STAGES.map(stage => {
                  const sd = filteredDeals.filter(d => d.stage === stage.id)
                  const sv = sd.reduce((s, d) => s + parseFloat(d.deal_value || 0), 0)
                  const iso = dragOverStage === stage.id
                  return (
                    <div key={stage.id}
                      onDragOver={e => onDragOver(e, stage.id)}
                      onDragLeave={onDragLeave}
                      onDrop={e => onDrop(e, stage.id)}
                      style={{ width: 232, flexShrink: 0, background: iso ? stage.bg : '#F7F8FA', borderRadius: 6, border: `1px solid ${iso ? stage.border : '#EBECF0'}`, borderTop: `3px solid ${iso ? stage.border : stage.color}`, transition: 'border-color 0.15s, background 0.15s', minHeight: 180 }}>
                      {/* Column header */}
                      <div style={{ padding: '8px 10px 5px', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: stage.color, flex: 1 }}>{stage.label}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: stage.color, marginRight: 2 }}>{sd.length}</span>
                      </div>
                      {sv > 0 && <div style={{ padding: '0 10px 6px', fontSize: 10, color: '#5E6C84', fontWeight: 600 }}>{fmt$(sv)}</div>}

                      {/* Cards */}
                      <div style={{ padding: '0 6px 6px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {sd.map(deal => {
                          const aging = agingInfo(deal)
                          const st = stageTime(deal)
                          const fu = followUpInfo(deal)
                          const score = dealScore(deal)
                          const nudge = inactivityNudge(deal) // F2
                          const decayed = probDecay(deal)     // F4
                          const isPanelOpen = panelDeal?.id === deal.id
                          // F15: heatmap tint
                          let heatBg = null
                          if (heatmapMode === 'value') {
                            const allValues = filteredDeals.map(d => parseFloat(d.deal_value || 0))
                            const max = Math.max(...allValues, 1)
                            const pct = parseFloat(deal.deal_value || 0) / max
                            heatBg = `rgba(0,82,204,${(pct * 0.25).toFixed(2)})`
                          } else if (heatmapMode === 'probability') {
                            const pct = (deal.probability || 0) / 100
                            const r = Math.round(255 - pct * 155), g = Math.round(100 + pct * 155), b = 100
                            heatBg = `rgba(${r},${g},${b},0.15)`
                          } else if (heatmapMode === 'age') {
                            const days = Math.floor((Date.now() - new Date(deal.updated_at || deal.created_at)) / 86_400_000)
                            const pct = Math.min(1, days / 14)
                            heatBg = `rgba(222,53,11,${(pct * 0.2).toFixed(2)})`
                          }
                          return (
                            <div key={deal.id} draggable
                              onDragStart={e => onDragStart(e, deal.id)}
                              onDragEnd={() => setDragId(null)}
                              onClick={() => isPanelOpen ? closePanel() : openPanel(deal)}
                              style={{
                                background: heatBg || (aging ? aging.bg : '#fff'),
                                borderRadius: 6,
                                border: `1px solid ${aging ? aging.border : isPanelOpen ? '#0052CC' : '#EBECF0'}`,
                                borderLeft: `3px solid ${aging?.level === 'critical' ? '#FF5630' : aging?.level === 'warning' ? '#FFAB00' : isPanelOpen ? '#0052CC' : stage.color}`,
                                padding: '10px 12px', cursor: 'pointer',
                                boxShadow: isPanelOpen ? '0 0 0 2px #DEEBFF' : '0 1px 3px rgba(9,30,66,0.08)',
                                opacity: dragId === deal.id ? 0.4 : 1,
                                transition: 'box-shadow 0.12s',
                                userSelect: 'none',
                              }}
                              onMouseEnter={e => { if (!isPanelOpen) e.currentTarget.style.boxShadow = '0 2px 8px rgba(9,30,66,0.12)' }}
                              onMouseLeave={e => { if (!isPanelOpen) e.currentTarget.style.boxShadow = '0 1px 3px rgba(9,30,66,0.08)' }}
                            >
                              {/* Company + value */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, flex: 1, minWidth: 0 }}>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: '#172B4D', lineHeight: 1.3 }}>{deal.company_name}</span>
                                  {deal.node_key && (
                                    <span style={{ fontSize: 9, color: '#2563EB', fontWeight: 700, fontFamily: 'monospace', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 3, padding: '1px 4px', flexShrink: 0 }}>
                                      {deal.node_key}
                                    </span>
                                  )}
                                </div>
                                {parseFloat(deal.deal_value) > 0 && (
                                  <span style={{ fontSize: 11, fontWeight: 700, color: '#0052CC', flexShrink: 0 }}>{fmt$(deal.deal_value)}</span>
                                )}
                              </div>
                              {/* Contact */}
                              {cardVis.contact && deal.contact_name && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: stage.bg, border: `1px solid ${stage.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 700, color: stage.color, flexShrink: 0 }}>
                                    {initials(deal.contact_name)}
                                  </div>
                                  <span style={{ fontSize: 11, color: '#5E6C84', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deal.contact_name}</span>
                                  {deal.linkedin_url && (
                                    <a href={deal.linkedin_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                                      style={{ color: '#0052CC', fontSize: 9, flexShrink: 0, textDecoration: 'none', background: '#DEEBFF', borderRadius: 2, padding: '1px 4px' }}>in</a>
                                  )}
                                </div>
                              )}
                              {/* Next action */}
                              {cardVis.nextAction && deal.next_action && (
                                <div style={{ fontSize: 10, color: '#974F0C', background: '#FFFAE6', borderRadius: 3, padding: '2px 6px', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  → {deal.next_action}
                                </div>
                              )}
                              {/* F11: tag chips */}
                              {cardVis.tags && parseTags(deal.tags).length > 0 && (
                                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 4 }}>
                                  {parseTags(deal.tags).map((tag, ti) => {
                                    const tc = TAG_COLORS[ti % TAG_COLORS.length]
                                    return <span key={tag} style={{ fontSize: 9, fontWeight: 700, background: tc.bg, color: tc.color, borderRadius: 3, padding: '1px 5px' }}>{tag}</span>
                                  })}
                                </div>
                              )}
                              {/* F17: assigned to badge */}
                              {cardVis.assignedTo && deal.assigned_to && (
                                <div style={{ fontSize: 9, color: '#6554C0', background: '#EAE6FF', borderRadius: 3, padding: '1px 5px', marginBottom: 4, display: 'inline-block', fontWeight: 600 }}>
                                  👤 {deal.assigned_to}
                                </div>
                              )}
                              {/* Follow-up badge (feature 14) */}
                              {fu && (
                                <div style={{ fontSize: 10, color: fu.overdue ? '#BF2600' : '#974F0C', background: fu.overdue ? '#FFEBE6' : '#FFFAE6', borderRadius: 3, padding: '2px 6px', marginBottom: 4 }}>
                                  🔔 {fu.label}
                                </div>
                              )}
                              {/* Footer row */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#97A0AF', marginTop: 2 }}>
                                <span>{daysSince(deal.created_at)}</span>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                  {/* Stage time (feature 4) */}
                                  {st && (
                                    <span style={{ color: st.over ? '#DE350B' : '#5E6C84' }}>
                                      {st.days}d{st.over ? '⚠' : ''}
                                    </span>
                                  )}
                                  {/* Deal score (feature 2) */}
                                  {cardVis.score && score > 0 && <span style={{ color: '#0052CC', fontWeight: 600 }}>{fmt$(score)}</span>}
                                  {/* F4: probability badge — orange tint if decayed */}
                                  {cardVis.probability && (
                                  <span title={decayed ? 'Probability may be stale — consider updating' : undefined}
                                    style={{ fontWeight: 600, color: decayed ? '#974F0C' : '#5E6C84', background: decayed ? '#FFFAE6' : 'transparent', borderRadius: 3, padding: decayed ? '0 3px' : 0 }}>
                                    {deal.probability}%{decayed ? '↓' : ''}
                                  </span>
                                  )}
                                  {/* F1: Quick follow-up bell */}
                                  {deal.stage !== 'won' && deal.stage !== 'lost' && (
                                    <button
                                      onClick={e => { e.stopPropagation(); setFollowUpQuick(f => f === deal.id ? null : deal.id) }}
                                      title="Remind me in…"
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 1px', fontSize: 11, color: followUpQuick === deal.id ? '#0052CC' : '#C1C7D0', lineHeight: 1 }}
                                      onMouseEnter={e => e.currentTarget.style.color = '#0052CC'}
                                      onMouseLeave={e => { e.currentTarget.style.color = followUpQuick === deal.id ? '#0052CC' : '#C1C7D0' }}
                                    >⏰</button>
                                  )}
                                </div>
                              </div>
                              {/* F1: Quick follow-up scheduler popup */}
                              {followUpQuick === deal.id && (
                                <div style={{ marginTop: 6, borderTop: '1px solid #EBECF0', paddingTop: 6 }} onClick={e => e.stopPropagation()}>
                                  <div style={{ fontSize: 9, color: '#97A0AF', marginBottom: 4, fontWeight: 600 }}>Remind me in:</div>
                                  <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                    {[1, 3, 7, 14, 30].map(d => (
                                      <button key={d} onClick={() => handleQuickFollowUp(deal.id, d)}
                                        style={{ fontSize: 9, padding: '2px 7px', borderRadius: 3, border: '1px solid #DFE1E6', background: '#F4F5F7', color: '#172B4D', cursor: 'pointer', fontWeight: 600 }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#DEEBFF'; e.currentTarget.style.borderColor = '#4C9AFF' }}
                                        onMouseLeave={e => { e.currentTarget.style.background = '#F4F5F7'; e.currentTarget.style.borderColor = '#DFE1E6' }}>
                                        {d}d
                                      </button>
                                    ))}
                                    <button onClick={() => setFollowUpQuick(null)}
                                      style={{ fontSize: 9, padding: '2px 5px', borderRadius: 3, border: 'none', background: 'none', color: '#97A0AF', cursor: 'pointer' }}>✕</button>
                                  </div>
                                </div>
                              )}
                              {/* F2: Inactivity nudge (5–6 days, before aging kicks in) */}
                              {nudge && !aging && (
                                <div style={{ fontSize: 9, color: '#5E6C84', background: '#F4F5F7', borderRadius: 3, padding: '2px 5px', marginTop: 3, display: 'inline-block' }}>
                                  💤 No activity in {nudge.days}d
                                </div>
                              )}
                              {/* Aging alert (feature 1) */}
                              {aging && (
                                <div style={{ fontSize: 9, color: aging.level === 'critical' ? '#BF2600' : '#974F0C', marginTop: 3 }}>
                                  {aging.level === 'critical' ? '🔴' : '🟡'} No update in {aging.days}d
                                </div>
                              )}
                            </div>
                          )
                        })}
                        <button onClick={() => openNew(stage.id)}
                          style={{ width: '100%', padding: '6px', background: 'none', border: '1.5px dashed #C1C7D0', borderRadius: 6, color: '#97A0AF', cursor: 'pointer', fontSize: 11 }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = stage.color; e.currentTarget.style.color = stage.color; e.currentTarget.style.background = stage.bg + '60' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#C1C7D0'; e.currentTarget.style.color = '#97A0AF'; e.currentTarget.style.background = 'none' }}>
                          + Add
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── F14: Forecast column (closing this month) ── */}
        {view === 'kanban' && showForecast && (() => {
          const closingThisMonth = deals.filter(d => {
            if (d.stage === 'won' || d.stage === 'lost') return false
            if (!d.expected_close_date) return false
            return d.expected_close_date.slice(0, 7) === thisMonth
          }).sort((a, b) => new Date(a.expected_close_date) - new Date(b.expected_close_date))
          const totalValue = closingThisMonth.reduce((s, d) => s + parseFloat(d.deal_value || 0), 0)
          const weightedValue = closingThisMonth.reduce((s, d) => s + dealScore(d), 0)
          return (
            <div style={{ width: 240, borderLeft: '1px solid #EBECF0', background: '#FAFBFC', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid #EBECF0', background: '#fff' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#172B4D', marginBottom: 2 }}>📅 Closing This Month</div>
                <div style={{ fontSize: 10, color: '#97A0AF' }}>
                  {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
                {closingThisMonth.length > 0 && (
                  <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    <div style={{ background: '#DEEBFF', borderRadius: 4, padding: '4px 8px' }}>
                      <div style={{ fontSize: 9, color: '#0052CC', fontWeight: 600, textTransform: 'uppercase' }}>Total</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0052CC' }}>{fmt$(totalValue)}</div>
                    </div>
                    <div style={{ background: '#E3FCEF', borderRadius: 4, padding: '4px 8px' }}>
                      <div style={{ fontSize: 9, color: '#006644', fontWeight: 600, textTransform: 'uppercase' }}>Weighted</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#006644' }}>{fmt$(weightedValue)}</div>
                    </div>
                  </div>
                )}
              </div>
              {closingThisMonth.length === 0 && (
                <div style={{ padding: 16, fontSize: 11, color: '#97A0AF', textAlign: 'center' }}>No deals closing this month.</div>
              )}
              {closingThisMonth.map(d => {
                const st = STAGE_MAP[d.stage]
                const daysLeft = Math.ceil((new Date(d.expected_close_date) - Date.now()) / 86_400_000)
                return (
                  <div key={d.id} onClick={() => openPanel(d)}
                    style={{ padding: '8px 14px', borderBottom: '1px solid #EBECF0', cursor: 'pointer', background: panelDeal?.id === d.id ? '#EFF6FF' : '#fff' }}
                    onMouseEnter={e => { if (panelDeal?.id !== d.id) e.currentTarget.style.background = '#F4F5F7' }}
                    onMouseLeave={e => { e.currentTarget.style.background = panelDeal?.id === d.id ? '#EFF6FF' : '#fff' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#172B4D', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.company_name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: 3, padding: '1px 5px', fontSize: 9, fontWeight: 600 }}>{st.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#0052CC' }}>{fmt$(d.deal_value)}</span>
                    </div>
                    <div style={{ fontSize: 10, marginTop: 3, color: daysLeft < 0 ? '#BF2600' : daysLeft <= 3 ? '#974F0C' : '#5E6C84' }}>
                      {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                      <span style={{ color: '#97A0AF', marginLeft: 4 }}>{d.probability}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}

        {/* ── List view (feature 19) ── */}
        {view === 'list' && (
          <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(9,30,66,0.08)', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#F4F5F7', borderBottom: '2px solid #EBECF0' }}>
                  {[
                    { key: 'company_name', label: 'Company' },
                    { key: 'stage',        label: 'Stage' },
                    { key: 'deal_value',   label: 'Value' },
                    { key: 'score',        label: 'Score' },
                    { key: 'probability',  label: 'Prob.' },
                    { key: 'contact_name', label: 'Contact' },
                    { key: 'follow_up_at', label: 'Follow-up' },
                    { key: 'expected_close_date', label: 'Close Date' },
                    { key: 'updated_at',   label: 'Updated' },
                  ].map(col => (
                    <th key={col.key}
                      onClick={() => toggleSort(col.key)}
                      style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }}>
                      {col.label}
                      {sortBy === col.key && <span style={{ marginLeft: 3 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedDeals.map((deal, i) => {
                  const st = STAGE_MAP[deal.stage]
                  const fu = followUpInfo(deal)
                  const aging = agingInfo(deal)
                  return (
                    <tr key={deal.id} onClick={() => panelDeal?.id === deal.id ? closePanel() : openPanel(deal)}
                      style={{ borderBottom: '1px solid #F4F5F7', cursor: 'pointer', background: panelDeal?.id === deal.id ? '#F0F5FF' : aging?.level === 'critical' ? '#FFF5F5' : aging?.level === 'warning' ? '#FFFDF0' : i % 2 === 0 ? '#fff' : '#FAFBFC' }}
                      onMouseEnter={e => { if (panelDeal?.id !== deal.id) e.currentTarget.style.background = '#F8F9FC' }}
                      onMouseLeave={e => { e.currentTarget.style.background = panelDeal?.id === deal.id ? '#F0F5FF' : aging?.level === 'critical' ? '#FFF5F5' : aging?.level === 'warning' ? '#FFFDF0' : i % 2 === 0 ? '#fff' : '#FAFBFC' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#172B4D' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {deal.company_name}
                          {deal.node_key && (
                            <span style={{ fontSize: 10, color: '#2563EB', fontWeight: 700, fontFamily: 'monospace', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>
                              {deal.node_key}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: 3, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>{st.label}</span>
                      </td>
                      <td style={{ padding: '8px 12px', color: '#0052CC', fontWeight: 700 }}>{parseFloat(deal.deal_value) > 0 ? fmt$(deal.deal_value) : '—'}</td>
                      <td style={{ padding: '8px 12px', color: '#6554C0', fontWeight: 600 }}>{dealScore(deal) > 0 ? fmt$(dealScore(deal)) : '—'}</td>
                      <td style={{ padding: '8px 12px', color: '#5E6C84' }}>{deal.probability}%</td>
                      <td style={{ padding: '8px 12px', color: '#5E6C84' }}>{deal.contact_name || '—'}</td>
                      <td style={{ padding: '8px 12px' }}>
                        {fu ? <span style={{ color: fu.overdue ? '#BF2600' : '#974F0C', fontWeight: 600 }}>{fu.label}</span> : '—'}
                      </td>
                      <td style={{ padding: '8px 12px', color: '#5E6C84' }}>{deal.expected_close_date ? fmtDate(deal.expected_close_date) : '—'}</td>
                      <td style={{ padding: '8px 12px', color: '#97A0AF' }}>{daysSince(deal.updated_at)}</td>
                    </tr>
                  )
                })}
                {sortedDeals.length === 0 && (
                  <tr><td colSpan={9} style={{ padding: 32, textAlign: 'center', color: '#97A0AF', fontSize: 13 }}>No deals yet. Create your first deal.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Analytics view (features 15–18) ── */}
        {view === 'analytics' && (
          <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Headline stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Total Won', value: wonDeals.length, sub: fmt$(wonDeals.reduce((s, d) => s + parseFloat(d.deal_value || 0), 0)), color: '#006644' },
                { label: 'Total Lost', value: lostDeals.length, sub: fmt$(lostDeals.reduce((s, d) => s + parseFloat(d.deal_value || 0), 0)), color: '#BF2600' },
                { label: 'Win Rate', value: `${winRate}%`, sub: `${wonDeals.length + lostDeals.length} closed`, color: '#0052CC' },
                { label: 'Avg Days to Win', value: avgDaysToWin ?? '—', sub: 'sales cycle length', color: '#6554C0' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', border: '1px solid #EBECF0', borderRadius: 8, padding: '16px 18px', borderTop: `3px solid ${s.color}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: '#6B778C', marginTop: 4 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Feature 17: Monthly revenue chart */}
              <div style={{ background: '#fff', border: '1px solid #EBECF0', borderRadius: 8, padding: '16px 18px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#172B4D', marginBottom: 16 }}>Monthly Revenue Won</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
                  {months6.map(m => {
                    const pct = m.value / maxMonthVal
                    return (
                      <div key={m.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        {m.value > 0 && <span style={{ fontSize: 9, color: '#0052CC', fontWeight: 600 }}>{fmt$(m.value)}</span>}
                        <div style={{ width: '100%', background: m.value > 0 ? '#0052CC' : '#EBECF0', borderRadius: '3px 3px 0 0', height: `${Math.max(pct * 70, m.value > 0 ? 4 : 2)}px`, transition: 'height 0.3s', opacity: m.value > 0 ? 1 : 0.5 }} />
                        <span style={{ fontSize: 10, color: '#97A0AF' }}>{m.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Feature 15: Win/Loss analysis */}
              <div style={{ background: '#fff', border: '1px solid #EBECF0', borderRadius: 8, padding: '16px 18px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#172B4D', marginBottom: 12 }}>Win / Loss Analysis</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* By deal size buckets */}
                  {[
                    { label: '< $10K',    filter: d => parseFloat(d.deal_value || 0) < 10000 },
                    { label: '$10K–$50K', filter: d => { const v = parseFloat(d.deal_value || 0); return v >= 10000 && v < 50000 } },
                    { label: '> $50K',    filter: d => parseFloat(d.deal_value || 0) >= 50000 },
                  ].map(bucket => {
                    const bWon  = wonDeals.filter(bucket.filter).length
                    const bLost = lostDeals.filter(bucket.filter).length
                    const total = bWon + bLost
                    const rate  = total > 0 ? Math.round(bWon / total * 100) : null
                    return (
                      <div key={bucket.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 11, color: '#5E6C84', width: 70, flexShrink: 0 }}>{bucket.label}</span>
                        <div style={{ flex: 1, height: 14, background: '#F4F5F7', borderRadius: 7, overflow: 'hidden', position: 'relative' }}>
                          {total > 0 && (
                            <div style={{ width: `${rate}%`, height: '100%', background: '#36B37E', borderRadius: 7 }} />
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: '#172B4D', fontWeight: 600, width: 36, textAlign: 'right', flexShrink: 0 }}>
                          {rate !== null ? `${rate}%` : '—'}
                        </span>
                        <span style={{ fontSize: 10, color: '#97A0AF', width: 52, flexShrink: 0 }}>{bWon}W/{bLost}L</span>
                      </div>
                    )
                  })}
                </div>
                {/* Lost reasons breakdown */}
                {lostDeals.some(d => d.lost_reason) && (
                  <div style={{ marginTop: 14, borderTop: '1px solid #F4F5F7', paddingTop: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#5E6C84', marginBottom: 8 }}>Lost Reasons</div>
                    {Object.entries(
                      lostDeals.filter(d => d.lost_reason).reduce((acc, d) => {
                        acc[d.lost_reason] = (acc[d.lost_reason] || 0) + 1; return acc
                      }, {})
                    ).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([reason, count]) => (
                      <div key={reason} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#5E6C84', padding: '2px 0' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{reason}</span>
                        <span style={{ fontWeight: 600, color: '#BF2600', marginLeft: 8, flexShrink: 0 }}>{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Feature 16: Sales velocity + Feature 18: Performance */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: '#fff', border: '1px solid #EBECF0', borderRadius: 8, padding: '16px 18px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#172B4D', marginBottom: 12 }}>Sales Velocity</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Avg Days to Win', value: avgDaysToWin !== null ? `${avgDaysToWin}d` : '—', color: '#0052CC' },
                    { label: 'Active Deals', value: active.length, color: '#6554C0' },
                    { label: 'Weighted Forecast', value: fmt$(forecast), color: '#00875A' },
                    { label: 'Avg Deal Size', value: deals.length > 0 ? fmt$(deals.reduce((s, d) => s + parseFloat(d.deal_value || 0), 0) / deals.length) : '—', color: '#974F0C' },
                  ].map(r => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #F4F5F7' }}>
                      <span style={{ fontSize: 12, color: '#5E6C84' }}>{r.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: r.color }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature 18: Rep leaderboard (personal performance) */}
              <div style={{ background: '#fff', border: '1px solid #EBECF0', borderRadius: 8, padding: '16px 18px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#172B4D', marginBottom: 12 }}>My Performance</div>
                {['This Month', 'Last Month', 'This Quarter'].map((period, pi) => {
                  const [start, end] = periodRange(period, now)
                  const pw = wonDeals.filter(d => { const dt = new Date(d.updated_at); return dt >= start && dt <= end })
                  const pl = lostDeals.filter(d => { const dt = new Date(d.updated_at); return dt >= start && dt <= end })
                  const pr = pw.length + pl.length > 0 ? Math.round(pw.length / (pw.length + pl.length) * 100) : null
                  return (
                    <div key={period} style={{ display: 'flex', alignItems: 'center', padding: '5px 0', borderBottom: pi < 2 ? '1px solid #F4F5F7' : 'none' }}>
                      <span style={{ fontSize: 11, color: '#5E6C84', width: 90, flexShrink: 0 }}>{period}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#006644', width: 60 }}>{pw.length} won</span>
                      <span style={{ fontSize: 11, color: '#97A0AF', flex: 1 }}>{fmt$(pw.reduce((s, d) => s + parseFloat(d.deal_value || 0), 0))}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: pr !== null ? (pr >= 50 ? '#006644' : '#BF2600') : '#97A0AF' }}>
                        {pr !== null ? `${pr}%` : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Stage pipeline breakdown */}
            <div style={{ background: '#fff', border: '1px solid #EBECF0', borderRadius: 8, padding: '16px 18px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#172B4D', marginBottom: 12 }}>Pipeline by Stage</div>
              <div style={{ display: 'flex', gap: 0 }}>
                {STAGES.filter(s => !['won', 'lost'].includes(s.id)).map(stage => {
                  const sd = deals.filter(d => d.stage === stage.id)
                  const sv = sd.reduce((s, d) => s + parseFloat(d.deal_value || 0), 0)
                  return (
                    <div key={stage.id} style={{ flex: 1, padding: '0 12px 0 0' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: stage.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{stage.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#172B4D' }}>{sd.length}</div>
                      <div style={{ fontSize: 11, color: '#6B778C' }}>{sv > 0 ? fmt$(sv) : '—'}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Right panel (features 7, 8, 11, 12, 13) ── */}
        {panelOpen && (
          <div style={{ width: 380, flexShrink: 0, background: '#fff', borderLeft: '1px solid #EBECF0', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '-2px 0 12px rgba(9,30,66,0.08)' }}>
            {/* Panel header */}
            <div style={{ padding: '14px 16px 0', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <button
                    onClick={() => setCompanyModal(panelDeal.company_name)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                    title="View company profile">
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#172B4D', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#0052CC'}
                      onMouseLeave={e => e.currentTarget.style.color = '#172B4D'}>
                      {panelDeal.company_name}
                    </div>
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <span style={{ background: STAGE_MAP[panelDeal.stage]?.bg, color: STAGE_MAP[panelDeal.stage]?.color, border: `1px solid ${STAGE_MAP[panelDeal.stage]?.border}`, borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>
                      {STAGE_MAP[panelDeal.stage]?.label}
                    </span>
                    {parseFloat(panelDeal.deal_value) > 0 && (
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#172B4D' }}>{fmt$(panelDeal.deal_value)}</span>
                    )}
                    {agingInfo(panelDeal) && (
                      <span style={{ fontSize: 10, color: agingInfo(panelDeal).level === 'critical' ? '#BF2600' : '#974F0C' }}>
                        {agingInfo(panelDeal).level === 'critical' ? '🔴' : '🟡'} {agingInfo(panelDeal).days}d stale
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
                  <button
                    onClick={() => panelDeal.node_id
                      ? navigate('/app', { state: { focusNodeId: panelDeal.node_id } })
                      : setCanvasPicker({ deal: panelDeal })}
                    title={panelDeal.node_id ? 'Open linked canvas node' : 'Create node on canvas for this deal'}
                    style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 6, cursor: 'pointer', padding: '6px 12px', fontSize: 13, fontWeight: 600, color: '#15803D', lineHeight: 1, whiteSpace: 'nowrap' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#DCFCE7' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#F0FDF4' }}
                  >
                    {panelDeal.node_id ? '⬡ Canvas' : '⬡ Link Canvas'}
                  </button>
                  {panelDeal.node_key && (
                    <span
                      title="Canvas node ID — click to copy"
                      onClick={() => { try { navigator.clipboard.writeText(panelDeal.node_key) } catch {} }}
                      style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11, color: '#2563EB', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 4, padding: '3px 7px', cursor: 'pointer', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}
                    >
                      {panelDeal.node_key}
                    </span>
                  )}
                  {panelDeal.node_id && (
                    <button
                      onClick={() => handleUnlinkCanvas(panelDeal)}
                      title="Unlink canvas node"
                      style={panelActionBtn()}
                      onMouseEnter={e => { e.currentTarget.style.color = '#BF2600'; e.currentTarget.style.background = '#FFEBE6' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#97A0AF'; e.currentTarget.style.background = 'none' }}
                    >⊘</button>
                  )}
                  <button onClick={() => openEdit(panelDeal)} style={panelActionBtn('#0052CC', '#EFF6FF')} title="Edit deal"
                    onMouseEnter={e => { e.currentTarget.style.color = '#0052CC'; e.currentTarget.style.background = '#EFF6FF' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#97A0AF'; e.currentTarget.style.background = 'none' }}>
                    ✎
                  </button>
                  <button onClick={() => setDeleteConfirm(panelDeal.id)} style={panelActionBtn('#BF2600', '#FFF5F5')} title="Delete deal"
                    onMouseEnter={e => { e.currentTarget.style.color = '#BF2600'; e.currentTarget.style.background = '#FFEBE6' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#97A0AF'; e.currentTarget.style.background = 'none' }}>
                    🗑
                  </button>
                  <button onClick={closePanel} style={panelActionBtn('#5E6C84', '#F4F5F7')} title="Close panel"
                    onMouseEnter={e => { e.currentTarget.style.color = '#5E6C84'; e.currentTarget.style.background = '#F4F5F7' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#97A0AF'; e.currentTarget.style.background = 'none' }}>
                    ×
                  </button>
                </div>
              </div>

              {/* Panel tabs */}
              <div style={{ display: 'flex', borderBottom: '2px solid #EBECF0' }}>
                {[
                  { id: 'overview',  label: 'Overview' },
                  { id: 'contacts',  label: `Contacts${panelContacts.length ? ` (${panelContacts.length})` : ''}` },
                  { id: 'activity',  label: `Activity${panelActivities.length ? ` (${panelActivities.length})` : ''}` },
                  { id: 'tasks',     label: `Tasks${pendingTasks.length ? ` · ${pendingTasks.length}${overdueTasks.length ? ' 🔴' : ''}` : ''}` },
                  { id: 'comments',  label: `Comments${panelComments.length ? ` (${panelComments.length})` : ''}` },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setPanelTab(tab.id)}
                    style={{ flex: 1, padding: '8px 6px', background: 'none', border: 'none', borderBottom: panelTab === tab.id ? '2px solid #0052CC' : '2px solid transparent', marginBottom: -2, color: panelTab === tab.id ? '#0052CC' : '#5E6C84', cursor: 'pointer', fontSize: 11, fontWeight: panelTab === tab.id ? 700 : 400, transition: 'color 0.1s', whiteSpace: 'nowrap' }}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Panel body */}
            {panelLoading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#97A0AF', fontSize: 12 }}>Loading…</div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>

                {/* Overview tab */}
                {panelTab === 'overview' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Deal score (feature 2) */}
                    {dealScore(panelDeal) > 0 && (
                      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, padding: '8px 12px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, color: '#1D4ED8' }}>Deal Score (weighted value)</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8' }}>{fmt$(dealScore(panelDeal))}</span>
                      </div>
                    )}
                    {/* Stage time (feature 4) */}
                    {stageTime(panelDeal) && (
                      <div style={{ background: stageTime(panelDeal).over ? '#FFFAE6' : '#F4F5F7', border: `1px solid ${stageTime(panelDeal).over ? '#FFE380' : '#EBECF0'}`, borderRadius: 6, padding: '8px 12px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, color: '#5E6C84' }}>Time in current stage</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: stageTime(panelDeal).over ? '#974F0C' : '#172B4D' }}>
                          {stageTime(panelDeal).days}d {stageTime(panelDeal).over ? `⚠ avg is ${stageTime(panelDeal).bench}d` : `/ ${stageTime(panelDeal).bench}d avg`}
                        </span>
                      </div>
                    )}
                    {panelDeal.lost_reason && (
                      <InfoRow label="Lost Reason" value={panelDeal.lost_reason} color="#BF2600" />
                    )}
                    <InfoRow label="Probability" value={`${panelDeal.probability}%`} />
                    <InfoRow label="Expected Close" value={fmtDate(panelDeal.expected_close_date)} />
                    <InfoRow label="Last Contact" value={fmtDate(panelDeal.last_contact_at)} />
                    {/* F17: assigned to */}
                    {panelDeal.assigned_to && (
                      <InfoRow label="Assigned To" value={panelDeal.assigned_to} color="#6554C0" />
                    )}
                    {/* Follow-up (feature 14) */}
                    {panelDeal.follow_up_at && (
                      <InfoRow label="Follow-up" value={fmtDate(panelDeal.follow_up_at)}
                        color={followUpInfo(panelDeal)?.overdue ? '#BF2600' : '#974F0C'} />
                    )}
                    {/* LinkedIn (feature 9) */}
                    {panelDeal.linkedin_url && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#97A0AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>LinkedIn</span>
                        <a href={panelDeal.linkedin_url} target="_blank" rel="noreferrer"
                          style={{ fontSize: 11, color: '#0052CC', textDecoration: 'none', background: '#DEEBFF', borderRadius: 3, padding: '2px 8px' }}>View Profile ↗</a>
                      </div>
                    )}
                    {/* Node link (feature 20) */}
                    {panelDeal.node_id && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#97A0AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Canvas Node</span>
                        <button onClick={() => navigate('/app', { state: { focusNodeId: panelDeal.node_id } })}
                          style={{ fontSize: 11, color: '#6554C0', background: '#EAE6FF', border: 'none', borderRadius: 3, padding: '3px 8px', cursor: 'pointer' }}>
                          Open in Canvas ↗
                        </button>
                      </div>
                    )}
                    {panelDeal.next_action && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Next Action</div>
                        <div style={{ fontSize: 12, color: '#974F0C', background: '#FFFAE6', borderRadius: 5, padding: '7px 10px' }}>→ {panelDeal.next_action}</div>
                      </div>
                    )}
                    {panelDeal.notes && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Notes</div>
                        <div style={{ fontSize: 12, color: '#172B4D', background: '#F4F5F7', borderRadius: 5, padding: '7px 10px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{panelDeal.notes}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Contacts tab (feature 7) */}
                {panelTab === 'contacts' && (
                  <div>
                    {panelContacts.map(c => (
                      <div key={c.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid #F4F5F7' }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#DEEBFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0052CC', flexShrink: 0 }}>
                          {initials(c.name)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#172B4D' }}>{c.name}{c.is_primary && <span style={{ marginLeft: 5, fontSize: 9, background: '#DEEBFF', color: '#0052CC', borderRadius: 2, padding: '1px 4px', fontWeight: 600 }}>PRIMARY</span>}</div>
                          {c.role && <div style={{ fontSize: 11, color: '#6B778C' }}>{c.role}</div>}
                          {c.email && <div style={{ fontSize: 11, color: '#0052CC' }}>{c.email}</div>}
                          {c.phone && <div style={{ fontSize: 11, color: '#5E6C84' }}>{c.phone}</div>}
                          {c.linkedin_url && <a href={c.linkedin_url} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: '#0052CC' }}>LinkedIn ↗</a>}
                        </div>
                        <button onClick={() => deleteContact(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DFE1E6', fontSize: 14, padding: '0 2px', flexShrink: 0 }}
                          onMouseEnter={e => e.currentTarget.style.color = '#BF2600'} onMouseLeave={e => e.currentTarget.style.color = '#DFE1E6'}>×</button>
                      </div>
                    ))}
                    {panelContacts.length === 0 && !addingContact && (
                      <div style={{ fontSize: 12, color: '#97A0AF', padding: '16px 0' }}>No contacts yet.</div>
                    )}
                    {addingContact ? (
                      <div style={{ marginTop: 8, background: '#F8F9FC', borderRadius: 6, padding: 10 }}>
                        {[['name', 'Name *'], ['email', 'Email'], ['phone', 'Phone'], ['role', 'Role']].map(([k, lbl]) => (
                          <input key={k} placeholder={lbl} value={newContact[k]} onChange={e => setNewContact(p => ({ ...p, [k]: e.target.value }))}
                            style={{ ...miniInput, marginBottom: 5 }} />
                        ))}
                        <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
                          <button onClick={saveContact} style={smBtn('#0052CC')}>Save</button>
                          <button onClick={() => setAddingContact(false)} style={smBtn('#97A0AF')}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setAddingContact(true)} style={{ marginTop: 8, width: '100%', padding: '6px', background: 'none', border: '1.5px dashed #C1C7D0', borderRadius: 6, color: '#5E6C84', cursor: 'pointer', fontSize: 11 }}>
                        + Add Contact
                      </button>
                    )}
                  </div>
                )}

                {/* Activity tab (features 8, 12, 13) */}
                {panelTab === 'activity' && (
                  <div>
                    {addingActivity ? (
                      <div style={{ marginBottom: 12, background: '#F8F9FC', borderRadius: 6, padding: 10 }}>
                        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                          {ACT_TYPES.map(t => (
                            <button key={t.id} onClick={() => setNewActivity(p => ({ ...p, type: t.id }))}
                              style={{ fontSize: 10, padding: '3px 8px', borderRadius: 3, border: `1px solid ${newActivity.type === t.id ? t.color : '#DFE1E6'}`, background: newActivity.type === t.id ? t.color + '20' : '#fff', color: newActivity.type === t.id ? t.color : '#5E6C84', cursor: 'pointer', fontWeight: newActivity.type === t.id ? 700 : 400 }}>
                              {t.label}
                            </button>
                          ))}
                        </div>
                        {newActivity.type !== 'note' && (
                          <input placeholder="Title" value={newActivity.title} onChange={e => setNewActivity(p => ({ ...p, title: e.target.value }))}
                            style={{ ...miniInput, marginBottom: 5 }} />
                        )}
                        {/* F5: template picker for email type */}
                        {newActivity.type === 'email' && (
                          <div style={{ position: 'relative', marginBottom: 5 }}>
                            <button
                              onClick={() => setTemplatePicker(p => !p)}
                              style={{ fontSize: 10, padding: '3px 8px', borderRadius: 3, border: '1px solid #0052CC', background: '#DEEBFF', color: '#0052CC', cursor: 'pointer', fontWeight: 600 }}>
                              📋 Use template {emailTemplates.length > 0 ? `(${emailTemplates.length})` : ''}
                            </button>
                            {templatePicker && emailTemplates.length === 0 && (
                              <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 50, background: '#fff', border: '1px solid #DFE1E6', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 200, padding: '8px 12px' }}>
                                <div style={{ fontSize: 11, color: '#97A0AF' }}>No templates yet.</div>
                                <button onClick={() => { setTemplatePicker(false); setTemplateModal(true) }} style={{ fontSize: 10, color: '#0052CC', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}>+ Create one</button>
                              </div>
                            )}
                            {templatePicker && emailTemplates.length > 0 && (
                              <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 50, background: '#fff', border: '1px solid #DFE1E6', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 220, maxHeight: 200, overflowY: 'auto' }}>
                                {emailTemplates.map(t => (
                                  <div key={t.id} onClick={() => applyTemplate(t)}
                                    style={{ padding: '7px 12px', cursor: 'pointer', borderBottom: '1px solid #F4F5F7' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: '#172B4D' }}>{t.name}</div>
                                    {t.subject && <div style={{ fontSize: 10, color: '#97A0AF' }}>{t.subject}</div>}
                                  </div>
                                ))}
                                <div style={{ padding: '5px 12px', borderTop: '1px solid #EBECF0' }}>
                                  <button onClick={() => { setTemplatePicker(false); setTemplateModal(true) }} style={{ fontSize: 10, color: '#0052CC', background: 'none', border: 'none', cursor: 'pointer' }}>Manage templates →</button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        <textarea placeholder="Details…" value={newActivity.body} onChange={e => setNewActivity(p => ({ ...p, body: e.target.value }))}
                          rows={3} style={{ ...miniInput, resize: 'vertical', height: 64 }} />
                        <input type="date" value={newActivity.occurred_at} onChange={e => setNewActivity(p => ({ ...p, occurred_at: e.target.value }))}
                          style={{ ...miniInput, marginTop: 5 }} />
                        {/* F7: activity reminder */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                          <span style={{ fontSize: 10, color: '#6B778C', whiteSpace: 'nowrap' }}>Remind me:</span>
                          <input type="date" value={newActivity.remind_at} onChange={e => setNewActivity(p => ({ ...p, remind_at: e.target.value }))}
                            style={{ ...miniInput, flex: 1 }} />
                        </div>
                        <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
                          <button onClick={saveActivity} style={smBtn('#0052CC')}>Save</button>
                          <button onClick={() => setAddingActivity(false)} style={smBtn('#97A0AF')}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setAddingActivity(true)} style={{ width: '100%', padding: '6px', background: 'none', border: '1.5px dashed #C1C7D0', borderRadius: 6, color: '#5E6C84', cursor: 'pointer', fontSize: 11, marginBottom: 10 }}>
                        + Log Activity
                      </button>
                    )}
                    {panelActivities.map(a => {
                      const at = ACT_TYPES.find(t => t.id === a.type) || ACT_TYPES[0]
                      return (
                        <div key={a.id} style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: '1px solid #F4F5F7' }}>
                          <div style={{ width: 3, borderRadius: 2, background: at.color, flexShrink: 0, alignSelf: 'stretch' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: at.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{at.label}</span>
                              <span style={{ fontSize: 10, color: '#97A0AF' }}>{fmtDT(a.occurred_at)}</span>
                            </div>
                            {a.title && <div style={{ fontSize: 12, fontWeight: 600, color: '#172B4D', marginBottom: 2 }}>{a.title}</div>}
                            {a.body && <div style={{ fontSize: 12, color: '#5E6C84', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{a.body}</div>}
                            {/* F7: reminder badge */}
                            {a.remind_at && (
                              <div style={{ marginTop: 3, fontSize: 10, color: new Date(a.remind_at) < now ? '#BF2600' : '#974F0C', background: new Date(a.remind_at) < now ? '#FFEBE6' : '#FFFAE6', borderRadius: 3, padding: '1px 5px', display: 'inline-block' }}>
                                ⏰ Reminder: {fmtDate(a.remind_at)}
                              </div>
                            )}
                            {/* F20: GCal link for meetings */}
                            {a.type === 'meeting' && (
                              <a href={googleCalendarUrl(a, panelDeal)} target="_blank" rel="noreferrer"
                                style={{ marginTop: 3, fontSize: 10, color: '#0052CC', background: '#DEEBFF', borderRadius: 3, padding: '1px 6px', display: 'inline-block', textDecoration: 'none' }}>
                                📅 Add to Google Calendar
                              </a>
                            )}
                          </div>
                          <button onClick={() => deleteActivity(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DFE1E6', fontSize: 14, padding: '0 2px', flexShrink: 0, alignSelf: 'flex-start' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#BF2600'} onMouseLeave={e => e.currentTarget.style.color = '#DFE1E6'}>×</button>
                        </div>
                      )
                    })}
                    {panelActivities.length === 0 && !addingActivity && (
                      <div style={{ fontSize: 12, color: '#97A0AF', padding: '8px 0' }}>No activity logged yet.</div>
                    )}
                  </div>
                )}

                {/* Tasks tab (feature 11, 14) */}
                {panelTab === 'tasks' && (
                  <div>
                    {panelTasks.map(t => {
                      const od = !t.done && t.due_at && new Date(t.due_at) < now
                      return (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #F4F5F7' }}>
                          <input type="checkbox" checked={t.done} onChange={e => toggleTask(t.id, e.target.checked)}
                            style={{ width: 14, height: 14, flexShrink: 0, cursor: 'pointer' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 12, color: t.done ? '#97A0AF' : '#172B4D', textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}</span>
                            {t.due_at && (
                              <div style={{ fontSize: 10, color: od ? '#BF2600' : '#97A0AF', fontWeight: od ? 700 : 400 }}>
                                {od ? '⚠ ' : ''}{fmtDate(t.due_at)}
                              </div>
                            )}
                          </div>
                          <button onClick={() => deleteTask(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DFE1E6', fontSize: 14, padding: '0 2px', flexShrink: 0 }}
                            onMouseEnter={e => e.currentTarget.style.color = '#BF2600'} onMouseLeave={e => e.currentTarget.style.color = '#DFE1E6'}>×</button>
                        </div>
                      )
                    })}
                    {panelTasks.length === 0 && !addingTask && (
                      <div style={{ fontSize: 12, color: '#97A0AF', padding: '8px 0' }}>No tasks yet.</div>
                    )}
                    {addingTask ? (
                      <div style={{ marginTop: 8, background: '#F8F9FC', borderRadius: 6, padding: 10 }}>
                        <input placeholder="Task title *" value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                          style={{ ...miniInput, marginBottom: 5 }} />
                        <input type="date" placeholder="Due date (optional)" value={newTask.due_at} onChange={e => setNewTask(p => ({ ...p, due_at: e.target.value }))}
                          style={miniInput} />
                        <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
                          <button onClick={saveTask} style={smBtn('#0052CC')}>Add Task</button>
                          <button onClick={() => setAddingTask(false)} style={smBtn('#97A0AF')}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setAddingTask(true)} style={{ marginTop: 8, width: '100%', padding: '6px', background: 'none', border: '1.5px dashed #C1C7D0', borderRadius: 6, color: '#5E6C84', cursor: 'pointer', fontSize: 11 }}>
                        + Add Task
                      </button>
                    )}
                  </div>
                )}

                {/* F18: Comments tab */}
                {panelTab === 'comments' && (
                  <div>
                    {panelComments.map(c => (
                      <div key={c.id} style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: '1px solid #F4F5F7' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#DEEBFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#0052CC', flexShrink: 0 }}>
                          {initials(c.author_email?.split('@')[0] || '?')}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#172B4D' }}>{c.author_email?.split('@')[0]}</span>
                            <span style={{ fontSize: 10, color: '#97A0AF' }}>{fmtDT(c.created_at)}</span>
                          </div>
                          <div style={{ fontSize: 12, color: '#5E6C84', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{c.body}</div>
                        </div>
                        <button onClick={() => deleteComment(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DFE1E6', fontSize: 14, padding: '0 2px', flexShrink: 0, alignSelf: 'flex-start' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#BF2600'} onMouseLeave={e => e.currentTarget.style.color = '#DFE1E6'}>×</button>
                      </div>
                    ))}
                    {panelComments.length === 0 && !addingComment && (
                      <div style={{ fontSize: 12, color: '#97A0AF', padding: '8px 0' }}>No comments yet.</div>
                    )}
                    {addingComment ? (
                      <div style={{ marginTop: 8 }}>
                        <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
                          placeholder="Write a comment…" rows={3}
                          style={{ ...miniInput, resize: 'vertical', marginBottom: 6 }}
                          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveComment() }} />
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button onClick={saveComment} style={smBtn('#0052CC')}>Post</button>
                          <button onClick={() => { setAddingComment(false); setNewComment('') }} style={smBtn('#97A0AF')}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setAddingComment(true)} style={{ marginTop: 8, width: '100%', padding: '6px', background: 'none', border: '1.5px dashed #C1C7D0', borderRadius: 6, color: '#5E6C84', cursor: 'pointer', fontSize: 11 }}>
                        + Add Comment
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Edit modal ── */}
      {editModal && (
        <>
          <div onClick={() => setEditModal(null)} style={overlay} />
          <div style={modalBox}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #EBECF0', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#172B4D', flex: 1 }}>
                {editModal === 'new' ? 'New Deal' : `Edit — ${editModal.company_name}`}
              </h2>
              {editModal !== 'new' && (
                <button onClick={() => setDeleteConfirm(editModal.id)} style={ghostBtn} onMouseEnter={e => { e.currentTarget.style.background = '#FFEBE6'; e.currentTarget.style.color = '#BF2600' }} onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#97A0AF' }}>Delete</button>
              )}
              <button onClick={() => setEditModal(null)} style={{ ...ghostBtn, padding: 4 }} onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleSave} style={{ overflowY: 'auto', flex: 1 }}>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {dupWarning && (
                  <div style={{ padding: '7px 10px', background: '#FFFAE6', border: '1px solid #FFE380', borderRadius: 5, fontSize: 12, color: '#974F0C' }}>
                    {dupWarning}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <FField label="Company name *" span>
                    <FInput value={form.company_name} onChange={v => setForm(f => ({ ...f, company_name: v }))} placeholder="Acme Corp" />
                  </FField>
                  <FField label="Contact name">
                    <FInput value={form.contact_name} onChange={v => setForm(f => ({ ...f, contact_name: v }))} placeholder="Jane Smith" />
                  </FField>
                  <FField label="Contact email">
                    <FInput type="email" value={form.contact_email} onChange={v => setForm(f => ({ ...f, contact_email: v }))} placeholder="jane@acme.com" />
                  </FField>
                  <FField label="Deal value ($)">
                    <FInput type="number" value={form.deal_value} onChange={v => setForm(f => ({ ...f, deal_value: v }))} placeholder="0" min="0" />
                  </FField>
                  <FField label="Stage">
                    <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value, probability: PROB_MAP[e.target.value] ?? f.probability }))} style={inputSt}>
                      {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </FField>
                  <FField label={`Probability (${form.probability}%)`}>
                    <input type="range" min="0" max="100" step="5" value={form.probability} onChange={e => setForm(f => ({ ...f, probability: parseInt(e.target.value) }))} style={{ width: '100%', marginTop: 6 }} />
                  </FField>
                  <FField label="Expected close date">
                    <FInput type="date" value={form.expected_close_date} onChange={v => setForm(f => ({ ...f, expected_close_date: v }))} />
                  </FField>
                  <FField label="Last contact date">
                    <FInput type="date" value={form.last_contact_at} onChange={v => setForm(f => ({ ...f, last_contact_at: v }))} />
                  </FField>
                </div>
                <FField label="Next action">
                  <FInput value={form.next_action} onChange={v => setForm(f => ({ ...f, next_action: v }))} placeholder="Send follow-up email, schedule demo…" />
                </FField>
                <FField label="Notes">
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Requirements, context, meeting notes…" rows={3} style={{ ...inputSt, resize: 'vertical' }} />
                </FField>
                {/* Lost reason (feature 5) — shown when stage=lost */}
                {form.stage === 'lost' && (
                  <FField label="Lost reason">
                    <FInput value={form.lost_reason} onChange={v => setForm(f => ({ ...f, lost_reason: v }))} placeholder="Budget, timing, competition, no-fit…" />
                  </FField>
                )}
                {/* Advanced / feature fields */}
                <div>
                  <button type="button" onClick={() => setShowAdv(v => !v)} style={{ background: 'none', border: 'none', color: '#0052CC', cursor: 'pointer', fontSize: 11, padding: 0, fontWeight: 600 }}>
                    {showAdv ? '▲ Hide' : '▼ More'} options
                  </button>
                  {showAdv && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                      {/* F6: LinkedIn URL with contact enrichment hint */}
                      <FField label="LinkedIn URL" span>
                        <FInput value={form.linkedin_url}
                          onChange={v => {
                            setForm(f => ({ ...f, linkedin_url: v }))
                          }}
                          placeholder="https://linkedin.com/in/…" />
                        {(() => {
                          const m = form.linkedin_url.match(/linkedin\.com\/in\/([^/?#]+)/)
                          if (!m) return null
                          const slug = m[1].replace(/-\d+$/, '')
                          const suggested = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                          if (!suggested || form.contact_name) return null
                          return (
                            <div style={{ marginTop: 4, fontSize: 11, color: '#0052CC', display: 'flex', alignItems: 'center', gap: 6 }}>
                              Detected: <strong>{suggested}</strong>
                              <button type="button"
                                onClick={() => setForm(f => ({ ...f, contact_name: suggested }))}
                                style={{ fontSize: 10, padding: '2px 7px', background: '#DEEBFF', color: '#0052CC', border: 'none', borderRadius: 3, cursor: 'pointer', fontWeight: 600 }}>
                                Use as contact name
                              </button>
                            </div>
                          )
                        })()}
                      </FField>
                      {/* Feature 14: Follow-up reminder */}
                      <FField label="Follow-up date">
                        <FInput type="date" value={form.follow_up_at} onChange={v => setForm(f => ({ ...f, follow_up_at: v }))} />
                      </FField>
                      {/* Feature 20: Canvas node link */}
                      <FField label="Canvas Node ID">
                        <FInput value={form.node_id} onChange={v => setForm(f => ({ ...f, node_id: v }))} placeholder="node-id from canvas" />
                      </FField>
                      {/* F17: Assigned to */}
                      <FField label="Assigned To">
                        <FInput value={form.assigned_to} onChange={v => setForm(f => ({ ...f, assigned_to: v }))} placeholder="Name or email of owner…" />
                      </FField>
                      {/* F11: Tags */}
                      <FField label="Tags (comma-separated)" span>
                        <FInput value={form.tags} onChange={v => setForm(f => ({ ...f, tags: v }))} placeholder="hot, enterprise, q2…" />
                        {parseTags(form.tags).length > 0 && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 5 }}>
                            {parseTags(form.tags).map((tag, ti) => {
                              const tc = TAG_COLORS[ti % TAG_COLORS.length]
                              return <span key={tag} style={{ fontSize: 10, fontWeight: 700, background: tc.bg, color: tc.color, borderRadius: 3, padding: '2px 7px' }}>{tag}</span>
                            })}
                          </div>
                        )}
                      </FField>
                    </div>
                  )}
                </div>
                {formError && <p style={{ margin: 0, fontSize: 12, color: '#BF2600', background: '#FFEBE6', padding: '7px 10px', borderRadius: 5 }}>{formError}</p>}
              </div>
              <div style={{ padding: '12px 20px', borderTop: '1px solid #EBECF0', display: 'flex', gap: 8, justifyContent: 'flex-end', flexShrink: 0 }}>
                <button type="button" onClick={() => setEditModal(null)} style={{ padding: '7px 16px', background: '#fff', border: '1.5px solid #DFE1E6', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#5E6C84' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '7px 20px', background: saving ? '#0052CC88' : '#0052CC', color: '#fff', border: 'none', borderRadius: 6, cursor: saving ? 'default' : 'pointer', fontSize: 12, fontWeight: 700 }}>
                  {saving ? 'Saving…' : editModal === 'new' ? 'Create Deal' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* ── Lost reason modal (feature 5) ── */}
      {lostModal && (
        <>
          <div onClick={() => setLostModal(null)} style={{ ...overlay, zIndex: 300 }} />
          <div style={{ ...smallModal, zIndex: 301 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: '#172B4D' }}>Why was this deal lost?</h3>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: '#6B778C', lineHeight: 1.5 }}>Adding a reason helps you identify trends and improve your win rate.</p>
            <input autoFocus value={lostReason} onChange={e => setLostReason(e.target.value)}
              placeholder="Budget, timing, competition, no-fit…"
              style={{ ...inputSt, marginBottom: 16 }}
              onKeyDown={e => { if (e.key === 'Enter') handleLostConfirm() }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setLostModal(null); setLostReason('') }} style={{ padding: '6px 14px', background: '#fff', border: '1.5px solid #DFE1E6', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#5E6C84' }}>Cancel</button>
              <button onClick={handleLostConfirm} style={{ padding: '6px 16px', background: '#BF2600', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                Mark Lost
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Delete confirm ── */}
      {deleteConfirm && (
        <>
          <div onClick={() => setDeleteConfirm(null)} style={{ ...overlay, zIndex: 300 }} />
          <div style={{ ...smallModal, zIndex: 301 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: '#172B4D' }}>Delete deal?</h3>
            <p style={{ margin: '0 0 20px', fontSize: 12, color: '#6B778C' }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '6px 14px', background: '#fff', border: '1.5px solid #DFE1E6', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#5E6C84' }}>Cancel</button>
              <button onClick={handleDelete} style={{ padding: '6px 16px', background: '#BF2600', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Delete</button>
            </div>
          </div>
        </>
      )}

      {/* ── Company profile modal (feature 6) ── */}
      {companyModal && (
        <>
          <div onClick={() => setCompanyModal(null)} style={{ ...overlay, zIndex: 300 }} />
          <div style={{ ...modalBox, zIndex: 301, width: 580 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #EBECF0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#172B4D' }}>{companyModal}</h2>
                <div style={{ fontSize: 11, color: '#97A0AF', marginTop: 2 }}>Company Profile</div>
              </div>
              <button onClick={() => setCompanyModal(null)} style={{ ...ghostBtn, padding: 4 }} onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'} onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>
              {(() => {
                const co = deals.filter(d => d.company_name.toLowerCase() === companyModal.toLowerCase())
                const coWon  = co.filter(d => d.stage === 'won')
                const coLost = co.filter(d => d.stage === 'lost')
                const coAct  = co.filter(d => d.stage !== 'won' && d.stage !== 'lost')
                const coRate = coWon.length + coLost.length > 0 ? Math.round(coWon.length / (coWon.length + coLost.length) * 100) : null
                return (
                  <>
                    {/* Stats row */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                      {[
                        { label: 'Total Deals', value: co.length },
                        { label: 'Active', value: coAct.length, color: '#0052CC' },
                        { label: 'Won', value: coWon.length, color: '#006644' },
                        { label: 'Win Rate', value: coRate !== null ? `${coRate}%` : '—', color: '#00875A' },
                        { label: 'Total Value', value: fmt$(co.reduce((s, d) => s + parseFloat(d.deal_value || 0), 0)), color: '#172B4D' },
                      ].map(s => (
                        <div key={s.label} style={{ flex: 1, textAlign: 'center', background: '#F4F5F7', borderRadius: 6, padding: '8px 6px' }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: s.color || '#5E6C84' }}>{s.value}</div>
                          <div style={{ fontSize: 10, color: '#97A0AF', marginTop: 2 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    {/* Deal list */}
                    {co.map(d => {
                      const st = STAGE_MAP[d.stage]
                      return (
                        <div key={d.id}
                          onClick={() => { setCompanyModal(null); openPanel(d) }}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', marginBottom: 4 }}
                          onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: 3, padding: '2px 6px', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>{st.label}</span>
                          <span style={{ flex: 1, fontSize: 12, color: '#172B4D', fontWeight: 500 }}>
                            {d.contact_name || 'No contact'}{d.lost_reason ? ` — "${d.lost_reason}"` : ''}
                          </span>
                          <span style={{ fontSize: 12, color: '#0052CC', fontWeight: 700, flexShrink: 0 }}>{fmt$(d.deal_value)}</span>
                          <span style={{ fontSize: 11, color: '#97A0AF', flexShrink: 0 }}>{daysSince(d.created_at)}</span>
                        </div>
                      )
                    })}
                    {co.length === 0 && <div style={{ fontSize: 12, color: '#97A0AF' }}>No deals for this company.</div>}
                  </>
                )
              })()}
            </div>
          </div>
        </>
      )}

      {/* ── F3: Stage progression rules warning ── */}
      {stageRuleWarn && (
        <>
          <div onClick={() => setStageRuleWarn(null)} style={{ ...overlay, zIndex: 300 }} />
          <div style={{ ...smallModal, zIndex: 301 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: '#172B4D' }}>Missing information</h3>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: '#6B778C', lineHeight: 1.6 }}>{stageRuleWarn.message}</p>
            <p style={{ margin: '0 0 20px', fontSize: 12, color: '#6B778C' }}>Move anyway?</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setStageRuleWarn(null)} style={{ padding: '6px 14px', background: '#fff', border: '1.5px solid #DFE1E6', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#5E6C84' }}>Go Back</button>
              <button onClick={handleStageRuleConfirm} style={{ padding: '6px 16px', background: '#0052CC', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Move Anyway</button>
            </div>
          </div>
        </>
      )}

      {/* ── F19: Monthly goal modal ── */}
      {goalModal && (
        <>
          <div onClick={() => setGoalModal(false)} style={{ ...overlay, zIndex: 300 }} />
          <div style={{ ...smallModal, zIndex: 301 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#172B4D' }}>Set Monthly Goal</h3>
            <p style={{ margin: '0 0 16px', fontSize: 11, color: '#97A0AF' }}>
              {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Revenue Target ($)</label>
                <input
                  type="number" min="0" value={goalForm.target_value}
                  onChange={e => setGoalForm(f => ({ ...f, target_value: e.target.value }))}
                  placeholder="e.g. 50000"
                  style={{ ...inputSt }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Deals Target (count)</label>
                <input
                  type="number" min="0" value={goalForm.target_count}
                  onChange={e => setGoalForm(f => ({ ...f, target_count: e.target.value }))}
                  placeholder="e.g. 5"
                  style={{ ...inputSt }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setGoalModal(false)} style={{ padding: '6px 14px', background: '#fff', border: '1.5px solid #DFE1E6', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#5E6C84' }}>Cancel</button>
              <button
                onClick={async () => {
                  await saveGoal()
                  setGoalModal(false)
                }}
                style={{ padding: '6px 16px', background: '#0052CC', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
              >Save Goal</button>
            </div>
          </div>
        </>
      )}

      {/* ── F5: Email templates manager modal ── */}
      {templateModal && (
        <>
          <div onClick={() => setTemplateModal(false)} style={{ ...overlay, zIndex: 300 }} />
          <div style={{ ...modalBox, zIndex: 301, width: 560 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #EBECF0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#172B4D' }}>Email Templates</h2>
              <button onClick={() => setTemplateModal(false)} style={{ ...ghostBtn, padding: 4, fontSize: 16 }} onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'} onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {/* Create new template */}
              <div style={{ background: '#F8F9FC', borderRadius: 8, padding: 14, marginBottom: 16, border: '1px solid #EBECF0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#5E6C84', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Template</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Name *</label>
                    <input value={newTemplate.name} onChange={e => setNewTemplate(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Follow-up after demo" style={{ ...inputSt, fontSize: 11 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Subject</label>
                    <input value={newTemplate.subject} onChange={e => setNewTemplate(p => ({ ...p, subject: e.target.value }))}
                      placeholder="Email subject line" style={{ ...inputSt, fontSize: 11 }} />
                  </div>
                </div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Body *</label>
                <textarea value={newTemplate.body} onChange={e => setNewTemplate(p => ({ ...p, body: e.target.value }))}
                  rows={4} placeholder="Template body…"
                  style={{ ...inputSt, fontSize: 11, resize: 'vertical', marginBottom: 10 }} />
                <button onClick={saveTemplate} disabled={!newTemplate.name.trim() || !newTemplate.body.trim()}
                  style={{ padding: '6px 16px', background: '#0052CC', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700, opacity: (!newTemplate.name.trim() || !newTemplate.body.trim()) ? 0.5 : 1 }}>
                  Save Template
                </button>
              </div>
              {/* Saved templates list */}
              {emailTemplates.length === 0 && (
                <div style={{ textAlign: 'center', color: '#97A0AF', fontSize: 12, padding: '20px 0' }}>No templates yet. Create one above.</div>
              )}
              {emailTemplates.map(t => (
                <div key={t.id} style={{ border: '1px solid #EBECF0', borderRadius: 8, padding: '10px 14px', marginBottom: 8, background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#172B4D' }}>{t.name}</div>
                      {t.subject && <div style={{ fontSize: 11, color: '#6B778C', marginTop: 1 }}>Subject: {t.subject}</div>}
                    </div>
                    <button onClick={() => deleteTemplate(t.id)}
                      style={{ background: 'none', border: 'none', color: '#97A0AF', cursor: 'pointer', fontSize: 14, padding: '0 4px' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#BF2600'}
                      onMouseLeave={e => e.currentTarget.style.color = '#97A0AF'}>✕</button>
                  </div>
                  <div style={{ fontSize: 11, color: '#5E6C84', lineHeight: 1.5, whiteSpace: 'pre-wrap', maxHeight: 60, overflow: 'hidden', WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent)' }}>{t.body}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Canvas node picker modal ── */}
      {canvasPicker && (
        <>
          <div onClick={() => setCanvasPicker(null)} style={{ ...overlay, zIndex: 300 }} />
          <div style={{ ...smallModal, zIndex: 301, width: 420 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: '#172B4D' }}>Link to Canvas Node</h3>
            <p style={{ margin: '0 0 14px', fontSize: 12, color: '#5E6C84' }}>
              A node named <strong>"{canvasPicker.deal.company_name}"</strong> will be created on the canvas and linked to this deal.
            </p>
            {cpError && <div style={{ background: '#FFEBE6', color: '#BF2600', borderRadius: 5, padding: '7px 10px', fontSize: 12, marginBottom: 12 }}>{cpError}</div>}
            {cpProjects.length === 0 && !cpError && (
              <div style={{ color: '#97A0AF', fontSize: 12, marginBottom: 12 }}>Loading projects…</div>
            )}
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Project</label>
              <select
                value={cpProjId}
                onChange={e => { setCpProjId(e.target.value); setCpMapId(''); setCpNewProjName('') }}
                style={{ ...inputSt, cursor: 'pointer' }}
              >
                <option value="">— select project —</option>
                {cpProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                <option value="new">+ Create new project…</option>
              </select>
            </div>
            {cpProjId === 'new' && (
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>New Project Name</label>
                <input
                  autoFocus
                  value={cpNewProjName}
                  onChange={e => setCpNewProjName(e.target.value)}
                  placeholder="e.g. Sales Pipeline"
                  style={{ ...inputSt }}
                  onFocus={e => e.target.style.borderColor = '#0052CC'}
                  onBlur={e => e.target.style.borderColor = '#DFE1E6'}
                />
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#97A0AF' }}>A new project will be created with a default map. The node will be added to it.</p>
              </div>
            )}
            {cpProjId && cpProjId !== 'new' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Map</label>
                <select
                  value={cpMapId}
                  onChange={e => setCpMapId(e.target.value)}
                  style={{ ...inputSt, cursor: 'pointer' }}
                >
                  <option value="">— select map —</option>
                  {Object.values(cpProjects.find(p => p.id === cpProjId)?.state?.maps || {}).map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button onClick={() => setCanvasPicker(null)} style={smBtn()}>Cancel</button>
              <button
                onClick={handleCanvasLink}
                disabled={cpSaving || !cpProjId || (cpProjId !== 'new' && !cpMapId) || (cpProjId === 'new' && !cpNewProjName.trim())}
                style={{ ...smBtn('#0052CC'), opacity: (cpSaving || !cpProjId || (cpProjId !== 'new' && !cpMapId) || (cpProjId === 'new' && !cpNewProjName.trim())) ? 0.6 : 1 }}
              >
                {cpSaving ? 'Creating…' : 'Create & Link'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function todayStr() { return new Date().toISOString().slice(0, 10) }

function periodRange(period, now) {
  const y = now.getFullYear(), m = now.getMonth()
  if (period === 'This Month')  return [new Date(y, m, 1), new Date(y, m + 1, 0)]
  if (period === 'Last Month')  return [new Date(y, m - 1, 1), new Date(y, m, 0)]
  if (period === 'This Quarter') {
    const q = Math.floor(m / 3)
    return [new Date(y, q * 3, 1), new Date(y, q * 3 + 3, 0)]
  }
  return [new Date(0), now]
}

function InfoRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #F4F5F7' }}>
      <span style={{ fontSize: 11, color: '#97A0AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: 12, color: color || '#172B4D', fontWeight: color ? 600 : 400 }}>{value}</span>
    </div>
  )
}

// ── Form sub-components ────────────────────────────────────────────────────────
const inputSt = {
  width: '100%', boxSizing: 'border-box', padding: '7px 9px',
  borderRadius: 6, border: '1.5px solid #DFE1E6', fontSize: 12,
  color: '#172B4D', background: '#FAFBFC', fontFamily: 'inherit', outline: 'none',
}
const miniInput = { ...inputSt, padding: '5px 8px', fontSize: 11 }

function FInput({ value, onChange, type = 'text', placeholder, min, step }) {
  return (
    <input type={type} value={value} placeholder={placeholder} min={min} step={step}
      onChange={e => onChange(e.target.value)} style={inputSt}
      onFocus={e => e.target.style.borderColor = '#0052CC'}
      onBlur={e => e.target.style.borderColor = '#DFE1E6'} />
  )
}

function FField({ label, children, span }) {
  return (
    <div style={span ? { gridColumn: '1 / -1' } : {}}>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  )
}

// ── Style constants ────────────────────────────────────────────────────────────
const topBtn = {
  background: 'rgba(255,255,255,0.1)', border: '1px solid transparent', color: '#fff',
  cursor: 'pointer', borderRadius: 5, padding: '4px 10px', fontSize: 11,
  display: 'flex', alignItems: 'center', gap: 4, transition: 'background 0.12s, border-color 0.12s',
}
const overlay = { position: 'fixed', inset: 0, background: 'rgba(9,30,66,0.45)', zIndex: 200 }
const modalBox = {
  position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
  zIndex: 201, width: 520, maxWidth: 'calc(100vw - 32px)', maxHeight: '90vh',
  background: '#fff', borderRadius: 12, boxShadow: '0 20px 60px rgba(9,30,66,0.22)',
  display: 'flex', flexDirection: 'column', overflow: 'hidden',
}
const smallModal = {
  position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
  background: '#fff', borderRadius: 8, padding: '20px 24px', width: 360,
  maxWidth: 'calc(100vw - 32px)', boxShadow: '0 12px 40px rgba(9,30,66,0.2)',
}
const ghostBtn = {
  background: 'none', border: 'none', cursor: 'pointer', color: '#97A0AF',
  padding: '4px 8px', borderRadius: 4, fontSize: 11, transition: 'background 0.1s, color 0.1s',
}
function panelActionBtn(color, bg) {
  return { background: 'none', border: 'none', color: '#97A0AF', cursor: 'pointer', padding: '5px 7px', borderRadius: 4, fontSize: 13, lineHeight: 1, transition: 'color 0.1s, background 0.1s' }
}
function smBtn(color) {
  if (color === '#0052CC') return { padding: '5px 12px', background: '#0052CC', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 }
  return { padding: '5px 11px', background: '#fff', color: '#5E6C84', border: '1.5px solid #DFE1E6', borderRadius: 6, cursor: 'pointer', fontSize: 11 }
}
const srchInput = {
  padding: '5px 9px', border: '1.5px solid #DFE1E6', borderRadius: 6, fontSize: 11,
  color: '#172B4D', background: '#FAFBFC', fontFamily: 'inherit', outline: 'none',
}
