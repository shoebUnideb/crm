import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppShell from '../components/shared/AppShell.jsx'
import NotificationBell from '../components/notifications/NotificationBell.jsx'

const GREEN   = '#10b981'
const GREEN_H = '#059669'
const BLUE    = '#172B4D'
const BLUE_H  = '#253858'
const SUBTLE  = '#5E6C84'
const BORDER  = '#DFE1E6'
const BG      = '#FAFBFC'
const SURFACE = '#FFFFFF'

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CRMInfoPage() {
  const navigate = useNavigate()
  const goCRM   = () => navigate('/app/crm')
  const goSetup = () => navigate('/app/crm/setup')

  return (
    <AppShell
      currentProduct="crm"
      notifications={<NotificationBell invites={[]} onAccept={() => {}} onDecline={() => {}} onProjectJoined={() => {}} />}
      contextArea={
        <>
          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'rgba(255,255,255,0.7)', flexShrink: 0 }}>
            bahn CRM
          </span>
          <div style={{ flex: 1 }} />
          <div
            onClick={goCRM}
            title="Open CRM to search"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#F7F8FA', border: '1.5px solid #DFE1E6',
              borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
              width: 280, flexShrink: 0,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#97A0AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span style={{ fontSize: 11, color: '#97A0AF', flex: 1 }}>Search contacts, deals…</span>
            <kbd style={{ fontSize: 9, color: '#97A0AF', border: '1px solid #DFE1E6', borderRadius: 3, padding: '0 4px', background: '#EBECF0' }}>⌘K</kbd>
          </div>
        </>
      }
    >
      <div style={{ overflowY: 'auto', height: '100%', background: SURFACE }}>
        <BetaBanner />
        <HeroBanner onOpenCRM={goCRM} onSetupGuide={goSetup} />
        <FeatureStrip />
        <ScreenshotsSection />
        <SetupSteps />
        <CRMCTA />
        <FeatureDocsSection />
        <CRMFooter />
      </div>
    </AppShell>
  )
}

// ─── Beta banner ──────────────────────────────────────────────────────────────
function BetaBanner() {
  return (
    <div style={{
      background: '#EFF6FF', borderBottom: '1px solid #BFDBFE',
      padding: '10px 56px', display: 'flex', alignItems: 'center', gap: 10,
      flexWrap: 'wrap',
    }}>
      <span style={{
        background: '#0052CC', color: '#fff', fontSize: '0.625rem', fontWeight: 700,
        letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 3, flexShrink: 0,
      }}>Beta</span>
      <span style={{ fontSize: '0.8125rem', color: '#1E40AF', lineHeight: 1.5 }}>
        <strong style={{ color: '#172B4D' }}>bahn CRM is currently in beta.</strong>
        {' '}Automation features are not available yet but are coming soon — expect workflow rules, sequences, and approvals in the next release.
      </span>
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroBanner({ onOpenCRM, onSetupGuide }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 55%, #FAFBFC 100%)',
      borderBottom: `3px solid ${GREEN}`,
      padding: '52px 56px 44px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', right: -16, bottom: -24,
        fontSize: 200, fontWeight: 900, color: 'rgba(16,185,129,0.05)',
        letterSpacing: '-0.06em', lineHeight: 1,
        userSelect: 'none', pointerEvents: 'none',
      }}>CRM</div>

      {/* Decorative mock cards */}
      <div style={{ position: 'absolute', right: '8%', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 12, pointerEvents: 'none', opacity: 0.9 }}>
        <DealMockup offset={-16} title="Acme Corp — $24k" type="deal" />
        <DealMockup offset={0}   title="Jane Smith · CTO" type="contact" featured />
        <DealMockup offset={-8}  title="Q2 Revenue: $148k" type="revenue" />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 560 }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: BLUE, color: '#fff', padding: '3px 10px',
          borderRadius: 3, fontSize: '0.6875rem', fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 18,
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          BAHN CRM
        </div>

        <h1 style={{
          fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: BLUE,
          letterSpacing: '-0.03em', lineHeight: 1.15, margin: '0 0 14px',
        }}>
          Close more deals.<br />Faster.
        </h1>
        <p style={{ fontSize: '0.9375rem', color: SUBTLE, lineHeight: 1.75, margin: '0 0 28px', maxWidth: 480 }}>
          A full sales pipeline, contact management, and revenue forecasting in one place.
          From first touch to closed-won.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
          <button
            onClick={onOpenCRM}
            style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 3, padding: '10px 22px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = BLUE_H }}
            onMouseLeave={e => { e.currentTarget.style.background = BLUE }}
          >
            Open CRM →
          </button>
          <button
            onClick={onSetupGuide}
            style={{ background: 'transparent', color: BLUE, border: `1px solid ${BORDER}`, borderRadius: 3, padding: '10px 22px', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer', transition: 'border-color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = BLUE }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER }}
          >
            View setup guide →
          </button>
        </div>

        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
          {['Pipeline', 'Contacts', 'Automation', 'Forecasting'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: SUBTLE }}>
              <span style={{ color: GREEN, fontWeight: 700 }}>✓</span> {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DealMockup({ offset, title, type, featured }) {
  const colors = { deal: '#10b981', contact: '#0052CC', revenue: '#F59E0B' }
  const color = colors[type] || BLUE
  return (
    <div style={{
      width: featured ? 180 : 152, background: SURFACE,
      border: `1px solid ${BORDER}`, borderRadius: 8,
      boxShadow: featured ? '0 8px 32px rgba(9,30,66,0.14)' : '0 2px 8px rgba(9,30,66,0.08)',
      padding: '14px 14px 16px',
      transform: `translateY(${offset}px)`,
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
        <div style={{ width: 14, height: 14, borderRadius: 3, background: color, opacity: 0.85, flexShrink: 0 }} />
        <div style={{ fontSize: '0.625rem', fontWeight: 600, color: BLUE, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{title}</div>
      </div>
      {[7, 5, 6, 4, 5].map((w, i) => (
        <div key={i} style={{ height: 4, borderRadius: 2, background: i === 0 ? '#C1C7D0' : '#EBECF0', width: `${w * 12}%`, marginBottom: i === 0 ? 8 : 4 }} />
      ))}
    </div>
  )
}

// ─── Feature strip ────────────────────────────────────────────────────────────
const CRM_FEATURES = [
  {
    title: 'Deal pipeline',
    body: 'Kanban stages, probability tracking, multiple pipelines.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="6" height="18" rx="1"/><rect x="9" y="3" width="6" height="13" rx="1"/><rect x="16" y="3" width="6" height="8" rx="1"/>
      </svg>
    ),
  },
  {
    title: 'Contacts & orgs',
    body: 'People, companies, roles, and duplicate merging.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    title: 'Lead management',
    body: 'Scoring, routing, sources, and auto-assignment.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polygon points="10 8 16 12 10 16 10 8"/>
      </svg>
    ),
  },
  {
    title: 'Activities',
    body: 'Calls, emails, meetings, tasks, and sequences.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    title: 'Analytics',
    body: 'Dashboards, forecasting, win/loss, revenue.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
]

function FeatureStrip() {
  return (
    <div style={{
      background: BLUE,
      display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      {CRM_FEATURES.map((f, i) => (
        <div key={f.title} style={{
          padding: '22px 22px',
          borderRight: i < CRM_FEATURES.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <div style={{ color: GREEN, flexShrink: 0, marginTop: 2 }}>{f.icon}</div>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff', marginBottom: 3, lineHeight: 1.3 }}>{f.title}</div>
            <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.55 }}>{f.body}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Screenshots ──────────────────────────────────────────────────────────────
const SCREENSHOTS = [
  { src: '/screenshots/crm-pipeline.png',  label: 'Pipeline view',      caption: 'Kanban deal pipeline with stage columns, probabilities, and deal value at a glance.' },
  { src: '/screenshots/crm-deal.png',      label: 'Deal detail',        caption: 'Full deal panel with contacts, activities, emails, tasks, and custom fields.' },
  { src: '/screenshots/crm-analytics.png', label: 'Analytics dashboard', caption: 'Revenue dashboard, win/loss analysis, and pipeline forecasting in one view.' },
]

function ScreenshotsSection() {
  const [active, setActive] = useState(0)
  return (
    <div style={{ background: SURFACE, padding: '52px 56px', borderTop: `1px solid ${BORDER}` }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <p style={{ margin: '0 0 6px', fontSize: '0.6875rem', fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          PRODUCT TOUR
        </p>
        <h2 style={{ margin: '0 0 8px', fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', fontWeight: 800, color: BLUE, letterSpacing: '-0.02em' }}>
          See it in action
        </h2>
        <p style={{ margin: 0, fontSize: '0.9375rem', color: SUBTLE, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
          Pipeline, contacts, and analytics — all in one tab.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {SCREENSHOTS.map((s, i) => (
          <button
            key={s.label}
            onClick={() => setActive(i)}
            style={{
              padding: '8px 18px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: '0.8125rem', fontWeight: active === i ? 600 : 400,
              background: active === i ? BLUE : BG,
              color: active === i ? '#fff' : SUBTLE,
              transition: 'all 0.15s',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div style={{
        maxWidth: 960, margin: '0 auto',
        borderRadius: 12, overflow: 'hidden',
        border: `1px solid ${BORDER}`,
        boxShadow: '0 8px 40px rgba(9,30,66,0.14)',
        background: BG,
      }}>
        <img
          key={SCREENSHOTS[active].src}
          src={SCREENSHOTS[active].src}
          alt={SCREENSHOTS[active].label}
          style={{ width: '100%', display: 'block', maxHeight: 520, objectFit: 'cover', objectPosition: 'top' }}
          onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex' }}
        />
        <div style={{ display: 'none', height: 420, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, background: '#F4F5F7' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#C1C7D0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
          <span style={{ fontSize: '0.8125rem', color: '#97A0AF' }}>{SCREENSHOTS[active].label}</span>
        </div>
      </div>

      <p style={{ textAlign: 'center', margin: '16px auto 0', fontSize: '0.875rem', color: SUBTLE, maxWidth: 560 }}>
        {SCREENSHOTS[active].caption}
      </p>
    </div>
  )
}

// ─── Setup steps ──────────────────────────────────────────────────────────────
const STEPS = [
  { num: '01', title: 'Connect your pipeline',  body: 'Add your first deal and customise your pipeline stages to match your sales process.' },
  { num: '02', title: 'Import contacts',         body: 'Bulk import contacts from CSV, or add people and organisations manually one by one.' },
  { num: '03', title: 'Log an activity',         body: 'Schedule a call, send a tracked email, or log a note directly against a deal or contact.' },
  { num: '04', title: 'Set up automation',       body: 'Create a workflow rule to auto-assign leads, send notifications, or trigger follow-ups.' },
  { num: '05', title: 'Check your forecast',     body: 'Set a revenue goal, view the pipeline forecast by stage, and track win rate over time.' },
]

function SetupSteps() {
  return (
    <div style={{ background: BG, padding: '36px 56px', borderTop: `1px solid ${BORDER}` }}>
      <h2 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: BLUE }}>Get started in minutes</h2>
      <p style={{ margin: '0 0 22px', fontSize: '0.875rem', color: SUBTLE }}>
        Five steps to go from a blank CRM to a fully tracked pipeline.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
        {STEPS.map(step => (
          <div key={step.num} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '24px 22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: GREEN, opacity: 0.25, lineHeight: 1, marginBottom: 14, letterSpacing: '-0.04em' }}>{step.num}</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '0.9375rem', fontWeight: 700, color: BLUE }}>{step.title}</h3>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: SUBTLE, lineHeight: 1.65, flex: 1 }}>{step.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Mid-page CTA ─────────────────────────────────────────────────────────────
function CRMCTA() {
  return (
    <div style={{ background: BLUE, padding: '64px 56px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 14 }}>
          GET STARTED
        </p>
        <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', lineHeight: 1.15, marginBottom: 24 }}>
          Sell smarter.<br />
          <span style={{ color: GREEN }}>CRM everything.</span>
        </h2>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['Pipeline', 'Contacts', 'Automation', 'Forecasting'].map(badge => (
            <div key={badge} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {badge}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Feature docs ─────────────────────────────────────────────────────────────
const DOCS_TABS = [
  { id: 'pipeline',    label: 'Pipeline',    icon: '🏆' },
  { id: 'contacts',    label: 'Contacts',    icon: '👤' },
  { id: 'leads',       label: 'Leads',       icon: '🎯' },
  { id: 'activities',  label: 'Activities',  icon: '📅' },
  { id: 'analytics',   label: 'Analytics',   icon: '📊' },
  { id: 'automation',  label: 'Automation',  icon: '⚙️', soon: true },
  { id: 'forecasting', label: 'Forecasting', icon: '📈' },
  { id: 'settings',    label: 'Settings',    icon: '🔧' },
]

const DOCS_CONTENT = {
  pipeline: {
    heading: 'Deal pipeline',
    subtitle: 'Manage every opportunity from first contact to closed-won. Track value, probability, and next steps across one or many pipelines.',
    groups: [
      {
        title: 'Deal management',
        items: [
          { icon: '💼', title: 'Create & edit deals', desc: 'Full CRUD on deals with value, close date, probability, and custom fields.' },
          { icon: '📋', title: 'Kanban board', desc: 'Drag deals between stage columns. Value totals and deal counts shown per stage.' },
          { icon: '🔢', title: 'Deal scoring', desc: 'Automated scoring rules rank deals by likelihood to close.' },
          { icon: '📦', title: 'Deal templates', desc: 'Pre-filled deal templates for common opportunity types.' },
          { icon: '🔀', title: 'Bulk operations', desc: 'Select multiple deals to reassign, update stage, or export in one action.' },
          { icon: '🔗', title: 'Related deals', desc: 'Link deals that share contacts or accounts for cross-sell tracking.' },
        ],
      },
      {
        title: 'Stage management',
        items: [
          { icon: '⚙️', title: 'Custom stages', desc: 'Define your own pipeline stages — name, colour, and default probability.' },
          { icon: '✅', title: 'Stage validations', desc: 'Require specific fields to be filled before a deal can advance to the next stage.' },
          { icon: '📉', title: 'Loss reasons', desc: 'Capture structured reasons when a deal is marked lost for win/loss analysis.' },
          { icon: '🏃', title: 'Velocity rules', desc: 'Set minimum time-in-stage rules to prevent deals skipping steps.' },
        ],
      },
      {
        title: 'Advanced',
        items: [
          { icon: '🏢', title: 'Multiple pipelines', desc: 'Create separate pipelines for different products, regions, or teams.' },
          { icon: '✂️', title: 'Deal splitting', desc: 'Split a deal across multiple owners or currencies.' },
          { icon: '🔄', title: 'Renewal tracking', desc: 'Automatically surface upcoming renewals and create renewal opportunities.' },
          { icon: '💱', title: 'Multi-currency', desc: 'Configure exchange rates and track deal value in any currency.' },
        ],
      },
    ],
  },

  contacts: {
    heading: 'Contacts & organisations',
    subtitle: 'A single source of truth for every person and company in your pipeline. Track relationships, roles, and communication history.',
    groups: [
      {
        title: 'People & organisations',
        items: [
          { icon: '👤', title: 'Contact records', desc: 'Name, email, phone, LinkedIn, title, and any custom fields per person.' },
          { icon: '🏢', title: 'Organisations', desc: 'Company-level accounts linked to multiple contacts and deals.' },
          { icon: '📜', title: 'Contact timeline', desc: 'Full chronological history of every interaction with a person.' },
          { icon: '📤', title: 'Import / Export', desc: 'Bulk import contacts from CSV; export filtered lists at any time.' },
        ],
      },
      {
        title: 'Roles & deduplication',
        items: [
          { icon: '🎭', title: 'Contact roles', desc: 'Assign roles to contacts on a deal — Decision Maker, Influencer, Champion, etc.' },
          { icon: '🔍', title: 'Duplicate detection', desc: 'The system flags likely duplicates based on email and name matching.' },
          { icon: '🔀', title: 'Merge duplicates', desc: 'Merge two contact or deal records, choosing which field values to keep.' },
        ],
      },
    ],
  },

  leads: {
    heading: 'Lead management',
    subtitle: 'Capture, qualify, and route leads before they become deals. Score inbound interest and ensure nothing falls through the cracks.',
    groups: [
      {
        title: 'Lead tracking',
        items: [
          { icon: '📥', title: 'Lead records', desc: 'Dedicated lead objects with status, source, score, and assignee.' },
          { icon: '🔄', title: 'Status workflow', desc: 'New → Contacted → Qualified → Converted (or Unqualified / Nurturing).' },
          { icon: '🌐', title: 'Lead sources', desc: 'Track origin: web form, referral, LinkedIn, cold outreach, event, ad campaign.' },
          { icon: '📋', title: 'Bulk import', desc: 'Import leads from CSV with automatic field mapping.' },
        ],
      },
      {
        title: 'Scoring & routing',
        items: [
          { icon: '⭐', title: 'Lead scoring rules', desc: 'Define criteria-based rules that auto-score leads from 0–100.' },
          { icon: '🗺', title: 'Territories', desc: 'Define sales territories by region or industry for automatic routing.' },
          { icon: '⚡', title: 'Routing rules', desc: 'Auto-assign incoming leads based on criteria like source, industry, or deal size.' },
          { icon: '🔖', title: 'Conversion', desc: 'Convert a qualified lead into a deal, contact, and organisation in one step.' },
        ],
      },
    ],
  },

  activities: {
    heading: 'Activities & communication',
    subtitle: 'Log every touchpoint and automate outreach sequences. Keep the full history of calls, emails, and meetings against every deal and contact.',
    groups: [
      {
        title: 'Communication',
        items: [
          { icon: '📝', title: 'Notes', desc: 'Free-text notes attached to a deal or contact with timestamp and author.' },
          { icon: '📧', title: 'Email', desc: 'Send, receive, and track emails. Templates available for common scenarios.' },
          { icon: '📞', title: 'Call logging', desc: 'Log calls with duration, outcome, and notes. View in the timeline.' },
          { icon: '📅', title: 'Meetings', desc: 'Schedule and log meetings with participants, notes, and outcomes.' },
          { icon: '✅', title: 'Tasks', desc: 'Create, assign, and complete tasks linked to deals or contacts.' },
          { icon: '💬', title: 'WhatsApp / SMS', desc: 'Log WhatsApp and SMS messages as activity items in the timeline.' },
        ],
      },
      {
        title: 'Sequences & cadences',
        items: [
          { icon: '🔗', title: 'Activity sequences', desc: 'Multi-step outreach sequences: email day 1, call day 3, follow-up day 7.' },
          { icon: '➕', title: 'Enroll contacts', desc: 'Enroll one or many contacts into a sequence with a single action.' },
          { icon: '📊', title: 'Sequence analytics', desc: 'Track open rates, reply rates, and step completion across each sequence.' },
          { icon: '⏰', title: 'Activity cadences', desc: 'Define a repeating cadence of tasks and emails for ongoing nurturing.' },
        ],
      },
    ],
  },

  analytics: {
    heading: 'Analytics & reporting',
    subtitle: 'From high-level KPIs to deep deal analysis — understand what is working, what is not, and where to focus next.',
    groups: [
      {
        title: 'Dashboards',
        items: [
          { icon: '📊', title: 'CRM dashboard', desc: 'KPI cards: total deals, pipeline value, win rate, average deal size, overdue tasks.' },
          { icon: '💰', title: 'Revenue dashboard', desc: 'Month-over-month revenue tracking with deal-level drill-down.' },
          { icon: '🏆', title: 'Win/loss analysis', desc: 'Breakdown of won vs. lost deals by stage, rep, source, and loss reason.' },
          { icon: '🎛', title: 'Custom layouts', desc: 'Rearrange and add dashboard widgets to build the view your team needs.' },
        ],
      },
      {
        title: 'Reporting',
        items: [
          { icon: '📈', title: 'Forecast dashboard', desc: 'Pipeline forecast by stage with probability-weighted revenue.' },
          { icon: '🔍', title: 'Deal analytics view', desc: 'Filterable list view of all deals with calculated metrics per row.' },
          { icon: '📜', title: 'Audit log', desc: 'Full history of every field change across deals, contacts, and settings.' },
        ],
      },
    ],
  },

  automation: {
    heading: 'Automation & governance',
    subtitle: 'Reduce manual work and enforce your sales process with workflow rules, approval gates, and SLA tracking.',
    groups: [
      {
        title: 'Workflows',
        items: [
          { icon: '⚡', title: 'Automation rules', desc: 'Trigger-based rules: when a deal reaches a stage, auto-assign, notify, or create a task.' },
          { icon: '📧', title: 'Email automations', desc: 'Auto-send templated emails when conditions are met — no manual action needed.' },
          { icon: '🏷', title: 'Auto-tagging', desc: 'Automatically apply tags to deals and contacts based on field criteria.' },
        ],
      },
      {
        title: 'Approvals & governance',
        items: [
          { icon: '✅', title: 'Approval workflows', desc: 'Require manager sign-off before a deal can advance past key stages.' },
          { icon: '📋', title: 'Stage validations', desc: 'Enforce required fields at each stage transition to keep data clean.' },
          { icon: '⏱', title: 'SLA policies', desc: 'Define response-time SLAs per stage with breach alerts and tracking.' },
          { icon: '🏃', title: 'Velocity rules', desc: 'Minimum time-in-stage rules prevent deals being closed too quickly.' },
          { icon: '🔔', title: 'Notifications', desc: 'In-app and configurable notifications for activities, mentions, and breaches.' },
        ],
      },
    ],
  },

  forecasting: {
    heading: 'Forecasting & goals',
    subtitle: 'Set revenue targets, project future pipeline, and understand whether your team is on track to hit the number.',
    groups: [
      {
        title: 'Revenue forecasting',
        items: [
          { icon: '📈', title: 'Pipeline forecast', desc: 'Probability-weighted revenue projection by stage and time period.' },
          { icon: '📅', title: '6-month trend', desc: 'Rolling 6-month revenue trend chart comparing forecast to actuals.' },
          { icon: '🔍', title: 'Stage drill-down', desc: 'Click any forecast bar to see the individual deals contributing to it.' },
        ],
      },
      {
        title: 'Goals & renewals',
        items: [
          { icon: '🎯', title: 'Revenue goals', desc: 'Set monthly or quarterly revenue targets per rep, team, or whole account.' },
          { icon: '🏗', title: 'Goal cascading', desc: 'Break company-level goals down to team and individual targets automatically.' },
          { icon: '📊', title: 'Goal tracking', desc: 'Progress bars and attainment percentage updated in real-time as deals close.' },
          { icon: '🔄', title: 'Renewal tracking', desc: 'Surface upcoming contract renewals and auto-create renewal deal opportunities.' },
        ],
      },
    ],
  },

  settings: {
    heading: 'Settings & integrations',
    subtitle: 'Tailor the CRM to your exact sales process and connect it to the tools your team already uses.',
    groups: [
      {
        title: 'Customisation',
        items: [
          { icon: '🏷', title: 'Custom fields', desc: 'Add text, number, date, or select fields to deals, contacts, and organisations.' },
          { icon: '📐', title: 'Pipeline templates', desc: 'Pre-built pipeline configurations for SaaS, agency, real estate, and more.' },
          { icon: '📧', title: 'Email templates', desc: 'Centralised library of email templates reusable across the whole team.' },
          { icon: '🔖', title: 'Tag manager', desc: 'Create, rename, and organise tags used across deals, contacts, and leads.' },
        ],
      },
      {
        title: 'Products & quotes',
        items: [
          { icon: '📦', title: 'Product library', desc: 'Maintain a catalog of products with price and description.' },
          { icon: '🧾', title: 'Line items', desc: 'Add products to deals as line items with quantity and discount.' },
          { icon: '📄', title: 'Quote builder', desc: 'Generate a formatted quote PDF directly from a deal.' },
        ],
      },
      {
        title: 'Integrations',
        items: [
          { icon: '🔔', title: 'Webhooks', desc: 'POST deal and contact changes to any endpoint in real time.' },
          { icon: '🔑', title: 'API keys', desc: 'Generate keys for external integrations and automations.' },
          { icon: '📝', title: 'Form builder', desc: 'Build embeddable lead capture forms that feed directly into the CRM.' },
          { icon: '🗺', title: 'Territories', desc: 'Define geographic or industry territories for routing and reporting.' },
        ],
      },
    ],
  },
}

function FeatureDocsSection() {
  const [activeTab, setActiveTab] = useState('pipeline')
  const content = DOCS_CONTENT[activeTab]

  return (
    <div style={{ background: BG, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ padding: '48px 56px 0', textAlign: 'center' }}>
        <p style={{ margin: '0 0 6px', fontSize: '0.6875rem', fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          DOCUMENTATION
        </p>
        <h2 style={{ margin: '0 0 8px', fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', fontWeight: 800, color: BLUE, letterSpacing: '-0.02em' }}>
          Everything the CRM can do
        </h2>
        <p style={{ margin: '0 auto 32px', fontSize: '0.9375rem', color: SUBTLE, maxWidth: 520 }}>
          One page. Every feature. No guessing what is possible.
        </p>
      </div>

      <div style={{ padding: '0 56px', display: 'flex', gap: 4, overflowX: 'auto', borderBottom: `1px solid ${BORDER}` }}>
        {DOCS_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', border: 'none', cursor: 'pointer', background: 'none',
              fontSize: '0.8125rem', fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? GREEN : SUBTLE,
              borderBottom: activeTab === tab.id ? `2px solid ${GREEN}` : '2px solid transparent',
              marginBottom: -1, flexShrink: 0, transition: 'color 0.15s',
            }}
            onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = BLUE }}
            onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = SUBTLE }}
          >
            <span style={{ fontSize: '0.875rem' }}>{tab.icon}</span>
            {tab.label}
            {tab.soon && (
              <span style={{ fontSize: '0.5625rem', fontWeight: 700, background: '#0052CC', color: '#fff', padding: '1px 5px', borderRadius: 3, letterSpacing: '0.04em', textTransform: 'uppercase', marginLeft: 2 }}>
                Soon
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ padding: '36px 56px 52px' }}>
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ margin: '0 0 6px', fontSize: '1.125rem', fontWeight: 700, color: BLUE }}>{content.heading}</h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: SUBTLE, maxWidth: 640, lineHeight: 1.65 }}>{content.subtitle}</p>
        </div>

        {activeTab === 'automation' && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8,
            padding: '14px 18px', marginBottom: 28,
          }}>
            <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>🚧</span>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#172B4D', marginBottom: 3 }}>Coming soon</div>
              <div style={{ fontSize: '0.75rem', color: '#1E40AF', lineHeight: 1.6 }}>
                Automation features — workflow rules, sequences, approval workflows, SLA policies, and cadences — are currently in development and not yet available in bahn CRM beta. They will be released in an upcoming update.
              </div>
            </div>
          </div>
        )}

        {content.groups.map(group => (
          <div key={group.title} style={{ marginBottom: 32 }}>
            <p style={{ margin: '0 0 12px', fontSize: '0.6875rem', fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {group.title}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
              {group.items.map(item => (
                <FeatureCard key={item.title} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FeatureCard({ item }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '14px 16px', borderRadius: 8,
        background: hov ? SURFACE : 'transparent',
        border: `1px solid ${hov ? BORDER : 'transparent'}`,
        transition: 'all 0.12s',
      }}
    >
      <span style={{ fontSize: '1.25rem', flexShrink: 0, lineHeight: 1, marginTop: 1 }}>{item.icon}</span>
      <div>
        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: BLUE, marginBottom: 3 }}>{item.title}</div>
        <div style={{ fontSize: '0.75rem', color: SUBTLE, lineHeight: 1.6 }}>{item.desc}</div>
      </div>
    </div>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
const FOOTER_COLS = [
  {
    heading: 'Product',
    links: [
      { label: 'Home',         to: '/' },
      { label: 'Features',     to: '/features' },
      { label: 'Open Canvas',  to: '/app/canvas' },
      { label: 'Open CRM',     to: '/app/crm' },
    ],
  },
  {
    heading: 'CRM',
    links: [
      { label: 'Pipeline',    to: '/app/crm' },
      { label: 'Contacts',    to: '/app/crm/contacts' },
      { label: 'Leads',       to: '/app/crm/leads' },
      { label: 'Activities',  to: '/app/crm/meetings' },
      { label: 'Analytics',   to: '/app/crm/dashboard' },
      { label: 'Automation',  to: '/app/crm/settings' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About',   to: '/about' },
      { label: 'Blog',    to: '/blog' },
      { label: 'Careers', to: '/careers' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy policy',   to: '/privacy' },
      { label: 'Terms of service', to: '/terms' },
      { label: 'Cookie policy',    to: '/cookies' },
    ],
  },
]

function CRMFooter() {
  return (
    <footer style={{ background: BG, borderTop: `1px solid ${BORDER}`, color: BLUE }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 56px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr repeat(4, 1fr)', gap: '32px 24px' }}>
          <div>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 12 }}>
              <svg width="26" height="26" viewBox="0 0 30 30" fill="none">
                <circle cx="10" cy="15" r="9" fill="#0052CC" opacity="0.9"/>
                <circle cx="20" cy="15" r="9" fill="#4C9AFF" opacity="0.85"/>
              </svg>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: BLUE, letterSpacing: '-0.01em' }}>bahnOS</span>
            </Link>
            <p style={{ fontSize: '0.8125rem', color: SUBTLE, lineHeight: 1.65, maxWidth: 220 }}>
              A full sales pipeline, contact management, and revenue forecasting — for teams that close.
            </p>
          </div>

          {FOOTER_COLS.map(col => (
            <div key={col.heading}>
              <h4 style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: SUBTLE, margin: '0 0 14px' }}>
                {col.heading}
              </h4>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {col.links.map(link => (
                  <Link
                    key={link.label}
                    to={link.to}
                    style={{ color: SUBTLE, textDecoration: 'none', fontSize: '0.8125rem' }}
                    onMouseEnter={e => { e.currentTarget.style.color = BLUE; e.currentTarget.style.textDecoration = 'underline' }}
                    onMouseLeave={e => { e.currentTarget.style.color = SUBTLE; e.currentTarget.style.textDecoration = 'none' }}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 40, paddingTop: 16, paddingBottom: 20, borderTop: `1px solid ${BORDER}` }} />
      </div>
    </footer>
  )
}
