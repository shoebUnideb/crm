import React, { useState, useMemo } from 'react'
import { TEMPLATES } from './templates.js'

const NAVY   = '#172B4D'
const BLUE   = '#0052CC'
const BLUE_H = '#0747A6'
const SUBTLE = '#5E6C84'
const BORDER = '#DFE1E6'
const BG     = '#FAFBFC'

const BLANK_TPL = TEMPLATES.find(t => t.id === 'blank')
const ALL_TPLS  = TEMPLATES.filter(t => t.id !== 'blank')

const CATEGORIES = [
  { id: 'all',           label: 'All templates',    icon: '🗂️',  ids: null },
  { id: 'meetings',      label: 'Meetings',          icon: '📅',  ids: ['meeting-notes', 'one-on-one', 'weekly-update', 'team-offsite', 'board-meeting', 'project-kickoff', 'skip-level'] },
  { id: 'product',       label: 'Product',           icon: '🧩',  ids: ['prd', 'sprint-retro', 'ab-test', 'okrs', 'launch-checklist', 'roadmap', 'user-story', 'north-star-metric', 'risk-register', 'product-vision', 'feature-request', 'beta-program', 'pricing-strategy'] },
  { id: 'engineering',   label: 'Engineering',       icon: '⚙️',  ids: ['tech-spec', 'api-docs', 'adr', 'runbook', 'db-schema', 'deployment-guide', 'dev-onboarding', 'code-review', 'release-notes', 'system-architecture', 'security-review', 'incident-response', 'bug-report', 'feature-flag', 'on-call-handoff', 'data-flow-diagram', 'dependency-audit', 'capacity-plan', 'test-plan', 'architecture-decision-brief', 'service-level-agreement'] },
  { id: 'project',       label: 'Project Management', icon: '📋', ids: ['project-overview', 'project-status-report', 'action-plan', 'how-to-proceed', 'work-done-summary', 'project-retro', 'milestone-tracker', 'stakeholder-map', 'work-breakdown', 'sprint-planning', 'resource-plan', 'project-closure', 'project-plan', 'project-kickoff', 'decision-log', 'raci'] },
  { id: 'strategy',      label: 'Strategy',          icon: '🗺️',  ids: ['competitive-analysis', 'business-model-canvas', 'one-pager', 'investor-update', 'fundraising-tracker', 'pitch-deck', 'decision-memo', 'vendor-evaluation', 'sow'] },
  { id: 'people',        label: 'People & HR',       icon: '👥',  ids: ['team-page', 'team-directory', 'salary-bands', 'compensation-review', 'job-leveling', 'benefits-guide', 'team-handbook', 'job-description', 'onboarding-plan', 'performance-review', 'team-charter', 'career-plan', 'working-agreement', 'hiring-plan', 'exit-interview', 'pip', 'org-chart-notes', 'interview-scorecard', 'team-health-check', 'learning-plan'] },
  { id: 'sales',         label: 'Sales & Marketing', icon: '🎯',  ids: ['sales-playbook', 'gtm-plan', 'user-interview', 'brand-guidelines', 'competitive-analysis', 'case-study', 'email-campaign', 'content-calendar', 'sales-call-notes', 'partnership-brief', 'press-release', 'seo-brief'] },
  { id: 'finance',       label: 'Finance & Ops',     icon: '💼',  ids: ['budget-plan', 'vendor-evaluation', 'sow', 'goals-tracker'] },
  { id: 'documentation', label: 'Documentation',     icon: '📖',  ids: ['how-to', 'postmortem', 'changelog', 'faq', 'glossary', 'troubleshooting-guide', 'knowledge-transfer'] },
]

export default function PageTemplates({ onSelect, onClose }) {
  const [view, setView] = useState('pick') // 'pick' | 'browse'

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(9,30,66,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {view === 'pick'
        ? <PickView onBlank={() => onSelect(BLANK_TPL)} onBrowse={() => setView('browse')} onClose={onClose} />
        : <BrowseView onSelect={onSelect} onBack={() => setView('pick')} onClose={onClose} />
      }
    </div>
  )
}

// ─── Pick view ────────────────────────────────────────────────────────────────
function PickView({ onBlank, onBrowse, onClose }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, width: 520,
      boxShadow: '0 20px 60px rgba(9,30,66,0.3)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px 16px', borderBottom: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: NAVY }}>New page</h2>
          <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: SUBTLE }}>How would you like to start?</p>
        </div>
        <CloseBtn onClick={onClose} />
      </div>

      {/* Two choices */}
      <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <PickCard
          icon={
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={SUBTLE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          }
          title="Blank page"
          description="Start from scratch with an empty page"
          onClick={onBlank}
          accent={SUBTLE}
          accentBg="#F4F5F7"
        />
        <PickCard
          icon={
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
          }
          title="Use a template"
          description={`Choose from ${ALL_TPLS.length}+ templates across 8 categories`}
          onClick={onBrowse}
          accent={BLUE}
          accentBg="#EAF3FF"
          primary
        />
      </div>
    </div>
  )
}

function PickCard({ icon, title, description, onClick, accent, accentBg, primary }) {
  const [hov, setHov] = React.useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
        padding: '20px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
        border: `2px solid ${hov ? accent : BORDER}`,
        background: hov ? accentBg : '#fff',
        transition: 'all 0.14s',
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 10, marginBottom: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: hov ? accentBg : BG,
        border: `1px solid ${hov ? accent + '40' : BORDER}`,
        transition: 'all 0.14s',
      }}>
        {icon}
      </div>
      <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: NAVY, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: '0.8125rem', color: SUBTLE, lineHeight: 1.5 }}>{description}</div>
      {primary && (
        <div style={{
          marginTop: 14, fontSize: '0.75rem', fontWeight: 600,
          color: hov ? '#fff' : BLUE,
          background: hov ? BLUE : '#EAF3FF',
          borderRadius: 3, padding: '4px 10px',
          transition: 'all 0.14s',
        }}>
          Browse templates →
        </div>
      )}
    </button>
  )
}

// ─── Browse view ──────────────────────────────────────────────────────────────
function BrowseView({ onSelect, onBack, onClose }) {
  const [activeCat, setActiveCat] = useState('all')
  const [query, setQuery]         = useState('')

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

  return (
    <div style={{
      background: '#fff', borderRadius: 12, width: 860,
      maxHeight: '88vh', boxShadow: '0 20px 60px rgba(9,30,66,0.3)',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: SUBTLE, padding: '4px 6px', borderRadius: 4,
            display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = BG; e.currentTarget.style.color = NAVY }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = SUBTLE }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </button>

        <div style={{ flex: 1, position: 'relative' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#97A0AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search templates…"
            autoFocus
            style={{
              width: '100%', padding: '7px 12px 7px 32px', fontSize: '0.875rem',
              border: `1px solid ${BORDER}`, borderRadius: 6, outline: 'none',
              color: NAVY, background: BG, boxSizing: 'border-box',
            }}
            onFocus={e => e.currentTarget.style.borderColor = BLUE}
            onBlur={e => e.currentTarget.style.borderColor = BORDER}
          />
        </div>

        <CloseBtn onClick={onClose} />
      </div>

      {/* Body: sidebar + grid */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {/* Category sidebar */}
        <aside style={{
          width: 196, flexShrink: 0, borderRight: `1px solid ${BORDER}`,
          overflowY: 'auto', padding: '10px 8px',
        }}>
          <p style={{ margin: '0 0 6px 4px', fontSize: '0.625rem', fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Categories
          </p>
          {CATEGORIES.map(cat => {
            const isActive = activeCat === cat.id
            const count = cat.ids ? ALL_TPLS.filter(t => cat.ids.includes(t.id)).length : ALL_TPLS.length
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
                  textAlign: 'left', marginBottom: 1,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = BG }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'none' }}
              >
                <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{cat.icon}</span>
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
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {/* Category heading */}
          {!query.trim() && (
            <div style={{ marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: NAVY }}>
                {CATEGORIES.find(c => c.id === activeCat)?.label}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: SUBTLE }}>
                {filtered.length} template{filtered.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
          {query.trim() && (
            <div style={{ marginBottom: 14 }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: SUBTLE }}>
                {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "<strong>{query}</strong>"
              </p>
            </div>
          )}

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 32px', color: SUBTLE }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔍</div>
              <p style={{ margin: 0, fontWeight: 600, color: NAVY }}>No templates found</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.875rem' }}>Try a different search or category</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {filtered.map(tpl => (
                <TemplateCard key={tpl.id} template={tpl} onSelect={() => onSelect(tpl)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────
function TemplateCard({ template, onSelect }) {
  const [hov, setHov] = React.useState(false)
  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
        padding: '14px', borderRadius: 8, textAlign: 'left', cursor: 'pointer',
        border: `2px solid ${hov ? BLUE : BORDER}`,
        background: hov ? '#EAF3FF' : BG,
        transition: 'border-color 0.12s, background 0.12s',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 8, marginBottom: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: hov ? '#DEEBFF' : '#EBECF0',
        fontSize: '1.1rem', flexShrink: 0,
        transition: 'background 0.12s',
      }}>
        {template.icon}
      </div>
      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: NAVY, marginBottom: 3, lineHeight: 1.3 }}>
        {template.label}
      </div>
      <div style={{ fontSize: '0.6875rem', color: SUBTLE, lineHeight: 1.4 }}>
        {template.description}
      </div>
    </button>
  )
}

function CloseBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#97A0AF', padding: 4, borderRadius: 4, flexShrink: 0 }}
      onMouseEnter={e => { e.currentTarget.style.color = NAVY; e.currentTarget.style.background = BG }}
      onMouseLeave={e => { e.currentTarget.style.color = '#97A0AF'; e.currentTarget.style.background = 'none' }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  )
}
