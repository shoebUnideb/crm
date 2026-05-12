import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../components/shared/AppShell.jsx'
import { TEMPLATES } from '../components/docs/templates.js'
import WikiNotificationBell from '../components/docs/WikiNotificationBell.jsx'
import * as docsApi from '../lib/docsApi.js'

// ─── Design tokens ────────────────────────────────────────────────────────────
const NAVY   = '#172B4D'
const BLUE   = '#0052CC'
const BLUE_H = '#0747A6'
const SUBTLE = '#5E6C84'
const BORDER = '#DFE1E6'
const BG     = '#FAFBFC'
const ACCENT = '#F59E0B'

// ─── Category definitions ─────────────────────────────────────────────────────
const BLANK_TPL = TEMPLATES.find(t => t.id === 'blank')
const ALL_TPLS  = TEMPLATES.filter(t => t.id !== 'blank')

const CATEGORIES = [
  { id: 'all',           label: 'All templates',      icon: '🗂️',  ids: null },
  { id: 'project',       label: 'Project Management', icon: '📋',  ids: ['project-overview', 'project-status-report', 'action-plan', 'how-to-proceed', 'work-done-summary', 'project-retro', 'milestone-tracker', 'stakeholder-map', 'work-breakdown', 'sprint-planning', 'resource-plan', 'project-closure', 'project-plan', 'project-kickoff', 'decision-log', 'raci'] },
  { id: 'meetings',      label: 'Meetings',           icon: '📅',  ids: ['meeting-notes', 'one-on-one', 'weekly-update', 'team-offsite', 'board-meeting', 'project-kickoff', 'skip-level'] },
  { id: 'product',       label: 'Product',            icon: '🧩',  ids: ['prd', 'sprint-retro', 'ab-test', 'okrs', 'launch-checklist', 'roadmap', 'user-story', 'north-star-metric', 'risk-register', 'product-vision', 'feature-request', 'beta-program', 'pricing-strategy'] },
  { id: 'engineering',   label: 'Engineering',        icon: '⚙️',  ids: ['tech-spec', 'api-docs', 'adr', 'runbook', 'db-schema', 'deployment-guide', 'dev-onboarding', 'code-review', 'release-notes', 'system-architecture', 'security-review', 'incident-response', 'bug-report', 'feature-flag', 'on-call-handoff', 'data-flow-diagram', 'dependency-audit', 'capacity-plan', 'test-plan', 'architecture-decision-brief', 'service-level-agreement'] },
  { id: 'strategy',      label: 'Strategy',           icon: '🗺️',  ids: ['competitive-analysis', 'business-model-canvas', 'one-pager', 'investor-update', 'fundraising-tracker', 'pitch-deck', 'decision-memo', 'vendor-evaluation', 'sow'] },
  { id: 'people',        label: 'People & HR',        icon: '👥',  ids: ['team-page', 'team-directory', 'salary-bands', 'compensation-review', 'job-leveling', 'benefits-guide', 'team-handbook', 'job-description', 'onboarding-plan', 'performance-review', 'team-charter', 'career-plan', 'working-agreement', 'hiring-plan', 'exit-interview', 'pip', 'org-chart-notes', 'interview-scorecard', 'team-health-check', 'learning-plan'] },
  { id: 'sales',         label: 'Sales & Marketing',  icon: '🎯',  ids: ['sales-playbook', 'gtm-plan', 'user-interview', 'brand-guidelines', 'competitive-analysis', 'case-study', 'email-campaign', 'content-calendar', 'sales-call-notes', 'partnership-brief', 'press-release', 'seo-brief'] },
  { id: 'finance',       label: 'Finance & Ops',      icon: '💼',  ids: ['budget-plan', 'vendor-evaluation', 'sow', 'goals-tracker'] },
  { id: 'documentation', label: 'Documentation',      icon: '📖',  ids: ['how-to', 'postmortem', 'changelog', 'faq', 'glossary', 'troubleshooting-guide', 'knowledge-transfer'] },
]

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DocsTemplatesPage() {
  const navigate = useNavigate()
  const [activeCat, setActiveCat] = useState('all')
  const [query, setQuery]         = useState('')
  const [spaces, setSpaces]       = useState([])
  const [useModal, setUseModal]   = useState(null) // template being "used"

  useEffect(() => {
    docsApi.getSpaces().then(setSpaces).catch(() => {})
  }, [])

  const filtered = useMemo(() => {
    const cat = CATEGORIES.find(c => c.id === activeCat)
    let list = cat?.ids ? ALL_TPLS.filter(t => cat.ids.includes(t.id)) : ALL_TPLS
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(t =>
        t.label.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      )
    }
    return list
  }, [activeCat, query])

  function handleUseTemplate(tpl) {
    if (tpl.id === 'blank') {
      if (spaces.length === 0) { navigate('/app/docs'); return }
      setUseModal(tpl)
      return
    }
    setUseModal(tpl)
  }

  const contextArea = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
      <button
        onClick={() => navigate('/app/docs')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem', padding: '2px 4px', borderRadius: 4 }}
        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
      >
        Wiki
      </button>
      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8125rem' }}>/</span>
      <span style={{ color: '#fff', fontSize: '0.8125rem', fontWeight: 500 }}>Templates</span>
    </div>
  )

  return (
    <AppShell productName="Wiki" productColor="#172B4D" contextArea={contextArea} notifications={
      <WikiNotificationBell spaces={spaces} onSpacesChanged={() => docsApi.getSpaces().then(setSpaces)} />
    }>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#fff' }}>

        {/* ── Page header ── */}
        <div style={{
          background: 'linear-gradient(135deg, #FFFBEB 0%, #FFF8E1 60%, #FAFBFC 100%)',
          borderBottom: `2px solid ${ACCENT}`,
          padding: '16px 32px 14px',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: ACCENT, color: '#fff', padding: '2px 7px',
                  borderRadius: 3, fontSize: '0.625rem', fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3,
                }}>
                  📄 Template Gallery
                </div>
                <h1 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: NAVY, letterSpacing: '-0.01em' }}>
                  Start faster with a template
                </h1>
              </div>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: SUBTLE, lineHeight: 1.4 }}>
                {ALL_TPLS.length}+ templates across {CATEGORIES.length - 1} categories — pre-built for your workflow.
              </p>
            </div>

            {/* Blank page shortcut */}
            <button
              onClick={() => handleUseTemplate(BLANK_TPL)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 14px', borderRadius: 6, cursor: 'pointer',
                border: `1px solid ${BORDER}`, background: '#fff',
                transition: 'all 0.14s', flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = NAVY; e.currentTarget.style.background = BG }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = '#fff' }}
            >
              <span style={{ fontSize: '1rem' }}>📄</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: NAVY }}>Blank page</div>
                <div style={{ fontSize: '0.625rem', color: SUBTLE }}>Start from scratch</div>
              </div>
            </button>
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative', marginTop: 10, maxWidth: 400 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#97A0AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            >
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setActiveCat('all') }}
              placeholder={`Search ${ALL_TPLS.length}+ templates…`}
              style={{
                width: '100%', padding: '10px 14px 10px 36px',
                fontSize: '0.875rem', border: `1px solid ${BORDER}`,
                borderRadius: 6, outline: 'none', color: NAVY,
                background: '#fff', boxSizing: 'border-box',
                transition: 'border-color 0.14s',
              }}
              onFocus={e => e.currentTarget.style.borderColor = BLUE}
              onBlur={e => e.currentTarget.style.borderColor = BORDER}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#97A0AF', padding: 2, borderRadius: 3, display: 'flex' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* ── Body: sidebar + grid ── */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

          {/* Category sidebar */}
          <aside style={{
            width: 210, flexShrink: 0, borderRight: `1px solid ${BORDER}`,
            overflowY: 'auto', padding: '14px 8px', background: BG,
          }}>
            <p style={{ margin: '0 0 8px 8px', fontSize: '0.625rem', fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Categories
            </p>
            {CATEGORIES.map(cat => {
              const count = cat.ids ? ALL_TPLS.filter(t => cat.ids.includes(t.id)).length : ALL_TPLS.length
              const isActive = activeCat === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCat(cat.id); setQuery('') }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '7px 10px', borderRadius: 5, border: 'none', cursor: 'pointer',
                    background: isActive ? '#DEEBFF' : 'none',
                    color: isActive ? BLUE : NAVY,
                    fontSize: '0.8125rem', fontWeight: isActive ? 600 : 400,
                    textAlign: 'left', marginBottom: 2,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#EBECF0' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'none' }}
                >
                  <span style={{ fontSize: '0.875rem', flexShrink: 0 }}>{cat.icon}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.label}</span>
                  <span style={{
                    fontSize: '0.6875rem', color: isActive ? BLUE : '#97A0AF',
                    background: isActive ? '#DEEBFF' : '#EBECF0',
                    borderRadius: 10, padding: '1px 6px', flexShrink: 0,
                  }}>
                    {count}
                  </span>
                </button>
              )
            })}
          </aside>

          {/* Template grid */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>

            {/* Heading row */}
            <div style={{ marginBottom: 18, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: NAVY }}>
                  {query.trim()
                    ? `Search results`
                    : CATEGORIES.find(c => c.id === activeCat)?.label}
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: SUBTLE }}>
                  {query.trim()
                    ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${query}"`
                    : `${filtered.length} template${filtered.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 32px', color: SUBTLE }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 14 }}>🔍</div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: NAVY }}>No templates found</p>
                <p style={{ margin: '6px 0 0', fontSize: '0.875rem' }}>Try a different search term or category</p>
                <button
                  onClick={() => { setQuery(''); setActiveCat('all') }}
                  style={{ marginTop: 16, padding: '8px 18px', borderRadius: 3, border: `1px solid ${BORDER}`, background: '#fff', color: NAVY, fontSize: '0.8125rem', cursor: 'pointer', fontWeight: 500 }}
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {filtered.map(tpl => (
                  <TemplateCard key={tpl.id} template={tpl} onUse={() => handleUseTemplate(tpl)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Use-template modal ── */}
      {useModal && (
        <UseTemplateModal
          template={useModal}
          spaces={spaces}
          onClose={() => setUseModal(null)}
          onCreated={(spaceSlug, pageId) => {
            setUseModal(null)
            navigate(`/app/docs/${spaceSlug}/${pageId}`)
          }}
          onNoSpaces={() => {
            setUseModal(null)
            navigate('/app/docs')
          }}
        />
      )}
    </AppShell>
  )
}

// ─── Template card ────────────────────────────────────────────────────────────
function TemplateCard({ template, onUse }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', flexDirection: 'column',
        padding: 0, borderRadius: 8, overflow: 'hidden',
        border: `1.5px solid ${hov ? BLUE : BORDER}`,
        background: hov ? '#F8FAFE' : '#fff',
        transition: 'border-color 0.12s, background 0.12s',
      }}
    >
      {/* Card body */}
      <div style={{ padding: '16px 16px 12px', flex: 1 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 8, marginBottom: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: hov ? '#DEEBFF' : '#EBECF0',
          fontSize: '1.2rem', transition: 'background 0.12s',
        }}>
          {template.icon}
        </div>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: NAVY, marginBottom: 4, lineHeight: 1.3 }}>
          {template.label}
        </div>
        <div style={{ fontSize: '0.75rem', color: SUBTLE, lineHeight: 1.5 }}>
          {template.description}
        </div>
      </div>

      {/* Use button — appears on hover */}
      <div style={{
        padding: '0 12px 12px',
        opacity: hov ? 1 : 0,
        transform: hov ? 'translateY(0)' : 'translateY(4px)',
        transition: 'opacity 0.14s, transform 0.14s',
      }}>
        <button
          onClick={onUse}
          style={{
            width: '100%', padding: '7px 0', borderRadius: 4,
            border: 'none', background: BLUE, color: '#fff',
            fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
            transition: 'background 0.12s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = BLUE_H}
          onMouseLeave={e => e.currentTarget.style.background = BLUE}
        >
          Use template
        </button>
      </div>
    </div>
  )
}

// ─── Space-selector modal ─────────────────────────────────────────────────────
function UseTemplateModal({ template, spaces, onClose, onCreated, onNoSpaces }) {
  const [selectedSpace, setSelectedSpace] = useState(spaces[0]?.id ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleCreate() {
    if (!selectedSpace) return
    const space = spaces.find(s => s.id === selectedSpace)
    if (!space) return
    setLoading(true)
    setError(null)
    try {
      const page = await docsApi.createPage(space.id, {
        title: template.title,
        content: template.content,
        parentId: null,
      })
      onCreated(space.slug, page.id)
    } catch (err) {
      console.error(err)
      setError('Failed to create page. Please try again.')
      setLoading(false)
    }
  }

  if (spaces.length === 0) {
    return (
      <ModalBackdrop onClose={onClose}>
        <div style={{ background: '#fff', borderRadius: 10, padding: '32px 28px', width: 380, boxShadow: '0 20px 60px rgba(9,30,66,0.25)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>📂</div>
          <p style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700, color: NAVY }}>No spaces yet</p>
          <p style={{ margin: '0 0 22px', fontSize: '0.875rem', color: SUBTLE, lineHeight: 1.6 }}>
            You need to create a space before using templates. Spaces are containers for your wiki pages.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <CancelBtn onClick={onClose} />
            <PrimaryBtn onClick={onNoSpaces}>Create a space →</PrimaryBtn>
          </div>
        </div>
      </ModalBackdrop>
    )
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <div style={{ background: '#fff', borderRadius: 10, width: 440, boxShadow: '0 20px 60px rgba(9,30,66,0.25)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, background: '#EAF3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
            {template.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '0.75rem', color: SUBTLE }}>Using template</p>
            <h2 style={{ margin: '2px 0 0', fontSize: '1rem', fontWeight: 700, color: NAVY }}>{template.label}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#97A0AF', padding: 4, borderRadius: 4, flexShrink: 0, display: 'flex' }}
            onMouseEnter={e => { e.currentTarget.style.color = NAVY; e.currentTarget.style.background = BG }}
            onMouseLeave={e => { e.currentTarget.style.color = '#97A0AF'; e.currentTarget.style.background = 'none' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: NAVY, marginBottom: 8 }}>
            Add to space
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
            {spaces.map(space => (
              <label
                key={space.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 6, cursor: 'pointer',
                  border: `1.5px solid ${selectedSpace === space.id ? BLUE : BORDER}`,
                  background: selectedSpace === space.id ? '#EAF3FF' : '#fff',
                  transition: 'all 0.12s',
                }}
              >
                <input
                  type="radio"
                  name="space"
                  checked={selectedSpace === space.id}
                  onChange={() => setSelectedSpace(space.id)}
                  style={{ accentColor: BLUE, flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: selectedSpace === space.id ? 600 : 400, color: NAVY }}>
                    {space.name}
                  </div>
                  {space.description && (
                    <div style={{ fontSize: '0.6875rem', color: SUBTLE, marginTop: 1 }}>{space.description}</div>
                  )}
                </div>
              </label>
            ))}
          </div>

          {error && (
            <p style={{ margin: '12px 0 0', fontSize: '0.8125rem', color: '#DE350B' }}>{error}</p>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 24px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <CancelBtn onClick={onClose} disabled={loading} />
          <PrimaryBtn onClick={handleCreate} disabled={!selectedSpace || loading}>
            {loading ? 'Creating…' : 'Create page →'}
          </PrimaryBtn>
        </div>
      </div>
    </ModalBackdrop>
  )
}

function ModalBackdrop({ children, onClose }) {
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(9,30,66,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {children}
    </div>
  )
}

function CancelBtn({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ padding: '8px 18px', borderRadius: 4, border: `1px solid ${BORDER}`, background: '#fff', color: NAVY, fontSize: '0.875rem', fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = BG }}
      onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
    >
      Cancel
    </button>
  )
}

function PrimaryBtn({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ padding: '8px 20px', borderRadius: 4, border: 'none', background: disabled ? '#B3D4FF' : BLUE, color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'background 0.12s' }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = BLUE_H }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = BLUE }}
    >
      {children}
    </button>
  )
}
