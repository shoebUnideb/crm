import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppShell from '../components/shared/AppShell.jsx'
import NotificationBell from '../components/notifications/NotificationBell.jsx'

const BLUE    = '#172B4D'
const BLUE_H  = '#253858'
const SUBTLE  = '#5E6C84'
const BORDER  = '#DFE1E6'
const BG      = '#FAFBFC'
const SURFACE = '#FFFFFF'
const ACCENT_BLUE = '#0052CC'

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CanvasInfoPage() {
  const navigate = useNavigate()
  const goCanvas = () => navigate('/app/canvas')
  const goTemplates = () => {
    sessionStorage.setItem('bahn_open_templates', '1')
    navigate('/app/canvas')
  }

  return (
    <AppShell
      currentProduct="canvas"
      notifications={<NotificationBell invites={[]} onAccept={() => {}} onDecline={() => {}} onProjectJoined={() => {}} />}
      contextArea={
        <>
          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'rgba(255,255,255,0.7)', flexShrink: 0 }}>
            bahn Capsule
          </span>
          <div style={{ flex: 1 }} />
          <div
            onClick={goCanvas}
            title="Open Canvas to search"
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
            <span style={{ fontSize: 11, color: '#97A0AF', flex: 1 }}>Search maps, nodes…</span>
            <kbd style={{ fontSize: 9, color: '#97A0AF', border: '1px solid #DFE1E6', borderRadius: 3, padding: '0 4px', background: '#EBECF0' }}>⌘K</kbd>
          </div>
        </>
      }
    >
      <div style={{ overflowY: 'auto', height: '100%', background: SURFACE }}>
        <HeroBanner onOpenCanvas={goCanvas} onBrowseTemplates={goTemplates} />
        <FeatureStrip />
        <ScreenshotsSection />
        <SetupSteps />
        <CanvasCTA onOpenCanvas={goCanvas} onBrowseTemplates={goTemplates} />
        <FeatureDocsSection />
        <ShortcutsSection />
        <CanvasFooter />
      </div>
    </AppShell>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroBanner({ onOpenCanvas, onBrowseTemplates }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #EFF6FF 0%, #EBF4FF 55%, #FAFBFC 100%)',
      borderBottom: `3px solid ${ACCENT_BLUE}`,
      padding: '52px 56px 44px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Ghost text decoration */}
      <div style={{
        position: 'absolute', right: -16, bottom: -24,
        fontSize: 200, fontWeight: 900, color: 'rgba(0,82,204,0.04)',
        letterSpacing: '-0.06em', lineHeight: 1,
        userSelect: 'none', pointerEvents: 'none',
      }}>MAP</div>

      {/* Mind map hero visual */}
      <div style={{ position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 0 }}>
        <HeroMindMap />
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
            <circle cx="12" cy="12" r="3"/><line x1="3" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="21" y2="12"/><line x1="12" y1="3" x2="12" y2="9"/><line x1="12" y1="15" x2="12" y2="21"/>
          </svg>
          BAHN CAPSULE
        </div>

        <h1 style={{
          fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: BLUE,
          letterSpacing: '-0.03em', lineHeight: 1.15, margin: '0 0 14px',
        }}>
          Map your thinking.<br />Ship your work.
        </h1>
        <p style={{ fontSize: '0.9375rem', color: SUBTLE, lineHeight: 1.75, margin: '0 0 12px', maxWidth: 480 }}>
          bahn Capsule is a mind map where every node can become a full work item —
          ticket, status, assignee, and more — all without leaving your map.
        </p>

        <div style={{
          margin: '0 0 24px',
          padding: '10px 14px',
          background: 'rgba(0,82,204,0.05)',
          border: '1px solid rgba(0,82,204,0.14)',
          borderRadius: 4,
          maxWidth: 440,
        }}>
          <p style={{ margin: 0, fontSize: '0.75rem', fontStyle: 'italic', color: SUBTLE, lineHeight: 1.7 }}>
            <strong style={{ fontStyle: 'normal', color: BLUE, fontWeight: 600 }}>What is a Capsule?</strong>
            {' '}A Capsule is a mind map node that encapsulates a complete work item —
            keeping planning and execution in one place.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
          <button
            onClick={onOpenCanvas}
            style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 3, padding: '10px 22px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = BLUE_H }}
            onMouseLeave={e => { e.currentTarget.style.background = BLUE }}
          >
            Open Canvas →
          </button>
          <button
            onClick={onBrowseTemplates}
            style={{ background: 'transparent', color: BLUE, border: `1px solid ${BORDER}`, borderRadius: 3, padding: '10px 22px', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer', transition: 'border-color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = BLUE }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER }}
          >
            Browse templates →
          </button>
        </div>

        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
          {['Mind maps', 'Ticket tracking', 'Jira sync', 'Real-time collab'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: SUBTLE }}>
              <span style={{ color: ACCENT_BLUE, fontWeight: 700 }}>✓</span> {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function HeroMindMap() {
  return (
    <div style={{ position: 'relative', width: 480, height: 340 }}>
      {/* SVG connector lines */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
        <path d="M 240 54 C 240 108, 78 108, 78 162" stroke="rgba(0,82,204,0.22)" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
        <path d="M 240 54 L 240 148" stroke="rgba(0,82,204,0.38)" strokeWidth="1.5" fill="none" />
        <path d="M 240 54 C 240 110, 396 110, 396 166" stroke="rgba(0,82,204,0.22)" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
      </svg>

      {/* Root node pill */}
      <div style={{
        position: 'absolute', left: 176, top: 18, width: 128, height: 36,
        background: BLUE, borderRadius: 18, zIndex: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        boxShadow: '0 2px 10px rgba(9,30,66,0.22)',
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/><line x1="3" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="21" y2="12"/><line x1="12" y1="3" x2="12" y2="9"/><line x1="12" y1="15" x2="12" y2="21"/>
        </svg>
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#fff', letterSpacing: '0.01em' }}>Q2 Roadmap</span>
      </div>

      {/* Left — MAP node */}
      <CapsuleCard
        left={4} top={162} width={148}
        badgeColor="#0052CC" badgeLabel="MAP"
        title="Sprint Planning"
        fields={[
          { label: 'Type', value: 'Map node' },
          { label: 'Nodes', skeleton: true, skWidth: 44 },
          { label: 'Sprint', skeleton: true, skWidth: 34 },
        ]}
      />

      {/* Center — CAPSULE node (featured) */}
      <CapsuleCard
        left={160} top={148} width={160}
        badgeColor="#00875A" badgeLabel="CAPSULE"
        title="BAHN-42 · Auth Refactor"
        featured
        fields={[
          { label: 'Status', value: 'In Progress', valueColor: '#00875A' },
          { label: 'Priority', value: 'High', valueColor: '#F97316' },
          { label: 'Assignee', skeleton: true, skWidth: 52 },
        ]}
      />

      {/* Right — JIRA node */}
      <CapsuleCard
        left={320} top={166} width={152}
        badgeColor="#6554C0" badgeLabel="JIRA"
        title="BAHN-43 · Jira Sync"
        fields={[
          { label: 'Jira key', value: 'PROJ-43', valueColor: '#6554C0' },
          { label: 'Synced', skeleton: true, skWidth: 40 },
          { label: 'Status', skeleton: true, skWidth: 48 },
        ]}
      />
    </div>
  )
}

function CapsuleCard({ left, top, width = 148, badgeColor, badgeLabel, title, fields, featured = false }) {
  return (
    <div style={{
      position: 'absolute', left, top, width,
      background: SURFACE,
      border: `1px solid ${BORDER}`,
      borderLeft: featured ? `3px solid ${badgeColor}` : `1px solid ${BORDER}`,
      borderRadius: 8, zIndex: featured ? 3 : 2,
      boxShadow: featured
        ? '0 8px 28px rgba(9,30,66,0.15)'
        : '0 2px 8px rgba(9,30,66,0.08)',
      padding: '11px 12px 13px',
    }}>
      {/* Badge row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center',
          background: `${badgeColor}18`, color: badgeColor,
          border: `1px solid ${badgeColor}30`,
          borderRadius: 3, padding: '1px 6px',
          fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
        }}>
          {badgeLabel}
        </div>
        {featured && (
          <div style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.05em', color: '#0052CC', textTransform: 'uppercase' }}>
            ⚡ capsule
          </div>
        )}
      </div>

      {/* Title */}
      <div style={{
        fontSize: '0.6875rem', fontWeight: 700, color: BLUE,
        marginBottom: 8, lineHeight: 1.3,
        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
      }}>
        {title}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: BORDER, marginBottom: 7 }} />

      {/* Fields */}
      {fields.map((f, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: i > 0 ? 5 : 0 }}>
          <span style={{ fontSize: '0.5625rem', color: SUBTLE, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {f.label}
          </span>
          {f.skeleton
            ? <div style={{ height: 4, borderRadius: 2, background: '#EBECF0', width: f.skWidth ?? 44 }} />
            : <span style={{ fontSize: '0.5625rem', fontWeight: 600, color: f.valueColor ?? BLUE }}>{f.value}</span>
          }
        </div>
      ))}
    </div>
  )
}


// ─── Feature strip ────────────────────────────────────────────────────────────
const CANVAS_FEATURES = [
  {
    title: 'Visual mind maps',
    body: 'Infinite canvas, drag & drop nodes, collapsible branches.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><circle cx="4" cy="6" r="2"/><circle cx="20" cy="6" r="2"/>
        <circle cx="4" cy="18" r="2"/><circle cx="20" cy="18" r="2"/>
        <line x1="6" y1="7" x2="10" y2="10.5"/><line x1="18" y1="7" x2="14" y2="10.5"/>
        <line x1="6" y1="17" x2="10" y2="13.5"/><line x1="18" y1="17" x2="14" y2="13.5"/>
      </svg>
    ),
  },
  {
    title: 'Built-in tickets',
    body: 'Status, priority, story points, and assignee on every node.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="13" y2="13"/>
        <circle cx="17" cy="17" r="2" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    title: 'Jira sync',
    body: 'Two-way sync — push or pull tickets from any Jira project.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    ),
  },
  {
    title: 'Real-time collab',
    body: 'Shared cursors, live edits, and role-based access control.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    title: '50+ templates',
    body: 'Sprint retros, roadmaps, org charts, and more — ready to use.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
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
      {CANVAS_FEATURES.map((f, i) => (
        <div key={f.title} style={{
          padding: '22px 22px',
          borderRight: i < CANVAS_FEATURES.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <div style={{ color: '#4C9AFF', flexShrink: 0, marginTop: 2 }}>{f.icon}</div>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff', marginBottom: 3, lineHeight: 1.3 }}>{f.title}</div>
            <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.55 }}>{f.body}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Product screenshots ──────────────────────────────────────────────────────
const SCREENSHOTS = [
  {
    src: '/screenshots/canvas-map.png',
    label: 'Visual mind map canvas',
    caption: 'Infinite canvas with drag-and-drop nodes, collapsible branches, and auto-layout.',
  },
  {
    src: '/screenshots/canvas-ticket.png',
    label: 'Built-in ticket panel',
    caption: 'Click any node to assign status, priority, story points, due date, and comments.',
  },
  {
    src: '/screenshots/canvas-templates.png',
    label: '50+ ready-made templates',
    caption: 'Pick a template — Sprint Planning, OKR, Roadmap and more — and load it in one click.',
  },
]

function ScreenshotsSection() {
  const [active, setActive] = useState(0)

  return (
    <div style={{ background: SURFACE, padding: '52px 56px', borderTop: `1px solid ${BORDER}` }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <p style={{ margin: '0 0 6px', fontSize: '0.6875rem', fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          PRODUCT TOUR
        </p>
        <h2 style={{ margin: '0 0 8px', fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', fontWeight: 800, color: BLUE, letterSpacing: '-0.02em' }}>
          See it in action
        </h2>
        <p style={{ margin: 0, fontSize: '0.9375rem', color: SUBTLE, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
          Everything you need — maps, tickets, templates — in one tab.
        </p>
      </div>

      {/* Tab switcher */}
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

      {/* Screenshot frame */}
      <div style={{
        maxWidth: 960, margin: '0 auto',
        borderRadius: 12, overflow: 'hidden',
        border: `1px solid ${BORDER}`,
        boxShadow: '0 8px 40px rgba(9,30,66,0.14)',
        background: BG,
      }}>
        {/* Actual screenshot image */}
        <img
          key={SCREENSHOTS[active].src}
          src={SCREENSHOTS[active].src}
          alt={SCREENSHOTS[active].label}
          style={{ width: '100%', display: 'block', maxHeight: 520, objectFit: 'cover', objectPosition: 'top' }}
          onError={e => {
            e.currentTarget.style.display = 'none'
            e.currentTarget.nextSibling.style.display = 'flex'
          }}
        />
        {/* Fallback placeholder shown while images aren't uploaded yet */}
        <div style={{
          display: 'none', height: 420, alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 12, background: '#F4F5F7',
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#C1C7D0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span style={{ fontSize: '0.8125rem', color: '#97A0AF' }}>{SCREENSHOTS[active].label}</span>
        </div>
      </div>

      {/* Caption */}
      <p style={{ textAlign: 'center', margin: '16px auto 0', fontSize: '0.875rem', color: SUBTLE, maxWidth: 560 }}>
        {SCREENSHOTS[active].caption}
      </p>
    </div>
  )
}

// ─── Setup steps ──────────────────────────────────────────────────────────────
const STEPS = [
  {
    num: '01',
    title: 'Create a project',
    body: 'Click "+ New project" in the sidebar. Give it a name — this is your container for all related mind maps.',
  },
  {
    num: '02',
    title: 'Build your first map',
    body: 'Press Tab to add a child node, Enter to add a sibling. Drag nodes to rearrange them on the infinite canvas.',
  },
  {
    num: '03',
    title: 'Turn nodes into tickets',
    body: 'Click any node to open the detail panel. Assign a status, priority, story points, and an owner.',
  },
  {
    num: '04',
    title: 'Sync with Jira',
    body: 'Open the Jira panel with ⌘/, connect your Jira workspace, then push selected nodes as real tickets.',
  },
]

function SetupSteps() {
  return (
    <div style={{ background: BG, padding: '36px 56px', borderTop: `1px solid ${BORDER}` }}>
      <h2 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: BLUE }}>Get started in minutes</h2>
      <p style={{ margin: '0 0 22px', fontSize: '0.875rem', color: SUBTLE }}>
        Four steps to go from blank canvas to a fully tracked sprint.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {STEPS.map(step => (
          <div key={step.num} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '24px 22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: ACCENT_BLUE, opacity: 0.25, lineHeight: 1, marginBottom: 14, letterSpacing: '-0.04em' }}>{step.num}</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '0.9375rem', fontWeight: 700, color: BLUE }}>{step.title}</h3>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: SUBTLE, lineHeight: 1.65, flex: 1 }}>{step.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Mid-page CTA ─────────────────────────────────────────────────────────────
function CanvasCTA({ onOpenCanvas, onBrowseTemplates }) {
  return (
    <div style={{
      background: '#172B4D',
      padding: '64px 56px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 14 }}>
          GET STARTED
        </p>
        <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', lineHeight: 1.15, marginBottom: 14 }}>
          Collaborate faster.<br />
          <span style={{ color: '#4C9AFF' }}>Capsule everything.</span>
        </h2>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginTop: 24 }}>
          {['Mind maps', 'Ticket tracking', 'Jira sync', 'Real-time collab'].map(badge => (
            <div key={badge} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4C9AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

// ─── Feature docs section ─────────────────────────────────────────────────────

const DOCS_TABS = [
  { id: 'views',       label: 'Views',          icon: '👁' },
  { id: 'display',     label: 'Display',         icon: '🎨' },
  { id: 'organize',    label: 'Organize',         icon: '⚡' },
  { id: 'export',      label: 'Export',           icon: '📤' },
  { id: 'tools',       label: 'Tools',            icon: '🔧' },
  { id: 'filters',     label: 'Filters & Search', icon: '🔍' },
  { id: 'ticket',      label: 'Ticket Panel',     icon: '🎫' },
  { id: 'collab',      label: 'Collaboration',    icon: '👥' },
]

const DOCS_CONTENT = {
  views: {
    heading: 'Visualization views',
    subtitle: 'Switch from the mind map to purpose-built views — no data migration needed. Every view reads from the same node properties.',
    groups: [
      {
        title: 'Planning',
        items: [
          { icon: '📋', title: 'Kanban board', desc: 'Drag cards across status columns. Multi-assignee swimlanes and WIP limits.' },
          { icon: '📅', title: 'Sprint board', desc: 'Scrum-style board scoped to a single sprint with velocity counters.' },
          { icon: '🗓', title: 'Sprint planning', desc: 'Side-by-side backlog and sprint columns for drag-in estimation sessions.' },
          { icon: '📊', title: 'Timeline / Roadmap', desc: 'Gantt-style horizontal bars keyed off due-date. Zoom from weeks to quarters.' },
          { icon: '🔥', title: 'Burndown chart', desc: 'Story-point burndown per sprint with ideal vs actual lines.' },
          { icon: '⚡', title: 'Velocity chart', desc: 'Sprint-over-sprint velocity bars to forecast future capacity.' },
        ],
      },
      {
        title: 'Data views',
        items: [
          { icon: '📃', title: 'Table view', desc: 'Flat spreadsheet of every node. Sort, filter and inline-edit any column.' },
          { icon: '🏷', title: 'Priority board', desc: 'Columns grouped by Critical / High / Medium / Low priority.' },
          { icon: '📈', title: 'Gantt chart', desc: 'Dependency-aware Gantt with predecessor arrows and critical-path highlight.' },
          { icon: '🏊', title: 'Swimlanes', desc: 'Group canvas rows by assignee or by sprint. Toggle from the View menu.' },
          { icon: '🔗', title: 'Critical path', desc: 'Highlights the longest dependency chain that determines the project finish date.' },
          { icon: '🔖', title: 'Bookmarks', desc: 'Save and restore named zoom+pan positions for quick navigation.' },
        ],
      },
    ],
  },

  display: {
    heading: 'Display & coloring',
    subtitle: 'Control exactly how the canvas looks — minimap, heatmaps, node coloring, and background texture.',
    groups: [
      {
        title: 'Display options',
        items: [
          { icon: '🗺', title: 'Minimap', desc: 'Floating thumbnail overview of the full canvas. Shortcut: M.' },
          { icon: '🎯', title: 'Focus mode', desc: 'Hides the toolbar and sidebar so nothing distracts from the map.' },
          { icon: '📏', title: 'Compact mode', desc: 'Reduces node padding and font size to fit more on screen.' },
          { icon: '📐', title: 'Size by story points', desc: 'Node width scales proportionally to its story-point estimate.' },
        ],
      },
      {
        title: 'Node coloring',
        items: [
          { icon: '🌡', title: 'Heatmap: due date', desc: 'Nodes go red as their due date approaches or passes.' },
          { icon: '🎯', title: 'Heatmap: priority', desc: 'Color intensity maps to Critical → Low priority.' },
          { icon: '📊', title: 'Heatmap: story points', desc: 'Darker nodes carry more estimation weight.' },
          { icon: '✅', title: 'Color by status', desc: 'Each status column gets its own color — instant scan of progress.' },
          { icon: '👤', title: 'Color by assignee', desc: 'Each team member gets a distinct hue across the whole map.' },
          { icon: '🏷', title: 'Color by issue type', desc: 'Epic / Story / Task / Bug each rendered in a distinct color.' },
        ],
      },
      {
        title: 'Canvas background',
        items: [
          { icon: '⬛', title: 'Dots', desc: 'Default subtle dot grid for spatial reference.' },
          { icon: '⬜', title: 'Grid', desc: 'Solid grid lines for precise alignment.' },
          { icon: '🟦', title: 'Solid', desc: 'Clean solid background with no texture.' },
          { icon: '▪', title: 'None', desc: 'Completely blank canvas.' },
        ],
      },
    ],
  },

  organize: {
    heading: 'Organize & layout',
    subtitle: 'Instantly restructure your map with one-click layouts, tree controls, and canvas containers.',
    groups: [
      {
        title: 'Layout',
        items: [
          { icon: '🌳', title: 'Auto layout', desc: 'Hierarchical tree layout computed from the root node outward. Shortcut: F.' },
          { icon: '🧠', title: 'Mind map layout', desc: 'Radial layout that branches symmetrically around the root.' },
          { icon: '✨', title: 'Auto-layout on add', desc: 'Reflows the whole tree automatically whenever a node is added.' },
        ],
      },
      {
        title: 'Tree controls',
        items: [
          { icon: '📂', title: 'Expand all', desc: 'Unfolds every collapsed branch in one click.' },
          { icon: '📁', title: 'Collapse all', desc: 'Folds all branches back to the root.' },
          { icon: '🔢', title: 'Collapse to depth 1/2/3', desc: 'Expose only the first N levels — great for executive overviews.' },
        ],
      },
      {
        title: 'Canvas objects',
        items: [
          { icon: '🖼', title: 'Frames', desc: 'Drag a named container around any group of nodes to create visual sections.' },
          { icon: '📝', title: 'Sticky notes', desc: 'Free-floating text notes that live on the canvas without being part of the tree.' },
          { icon: '📐', title: 'Snap to grid', desc: 'Nodes snap to an invisible grid during manual drags for clean alignment.' },
          { icon: '〰️', title: 'Curved edges', desc: 'Switch between straight and bezier-curved connector lines.' },
        ],
      },
    ],
  },

  export: {
    heading: 'Export & share',
    subtitle: 'Get your work out of the canvas and into any format — images, spreadsheets, documents, or a shareable link.',
    groups: [
      {
        title: 'Images',
        items: [
          { icon: '🖼', title: 'Export PNG', desc: 'High-resolution raster export of the full canvas, cropped to content.' },
          { icon: '✏️', title: 'Export SVG', desc: 'Infinitely scalable vector — perfect for design tools or print.' },
          { icon: '📄', title: 'Export PDF', desc: 'A4/Letter paginated PDF with all nodes rendered at print quality.' },
        ],
      },
      {
        title: 'Documents',
        items: [
          { icon: '📊', title: 'Export CSV', desc: 'Flat spreadsheet of every node with all ticket fields as columns.' },
          { icon: '📥', title: 'Import CSV', desc: 'Bulk-create nodes from a CSV file — maps columns to node fields automatically.' },
          { icon: '🔷', title: 'Confluence markup', desc: 'Copies the tree as Confluence wiki markup, ready to paste.' },
          { icon: '📝', title: 'Markdown outline', desc: 'Indented Markdown list matching the tree hierarchy.' },
        ],
      },
      {
        title: 'Share',
        items: [
          { icon: '🔗', title: 'Copy share link', desc: 'Generates a link with the current view, zoom level and selected node preserved.' },
          { icon: '📋', title: 'Save as template', desc: 'Publishes the current map as a reusable template for your team.' },
        ],
      },
    ],
  },

  tools: {
    heading: 'Tools & workspace',
    subtitle: 'Power-user tools for customising fields, analysing workload, and managing your workspace.',
    groups: [
      {
        title: 'Customisation',
        items: [
          { icon: '🏷', title: 'Custom fields', desc: 'Add any number of text, number, date, or select fields to every node.' },
          { icon: '📐', title: 'Node templates', desc: 'Pre-fill new nodes with default values — useful for repeating ticket types.' },
          { icon: '🔄', title: 'Workflow states', desc: 'Define your own status columns and the allowed transitions between them.' },
        ],
      },
      {
        title: 'Analysis',
        items: [
          { icon: '📊', title: 'Statistics panel', desc: 'Summary cards: total nodes, done %, overdue count, unassigned count.' },
          { icon: '🔥', title: 'Resource heatmap', desc: 'Per-assignee workload visualised as a heat-grid across sprints.' },
          { icon: '🔍', title: 'Find & Replace', desc: 'Search node titles and bulk-replace text across the entire map. Shortcut: ⌘H.' },
        ],
      },
      {
        title: 'Workspace',
        items: [
          { icon: '📜', title: 'Activity log', desc: 'Full audit trail of every create, update, and delete on the map.' },
          { icon: '⏪', title: 'Undo history', desc: 'Visual timeline of every action — jump back to any previous state.' },
          { icon: '📸', title: 'Snapshots', desc: 'Named save-points you can restore at any time, separate from undo.' },
          { icon: '🔔', title: 'Webhooks & Slack', desc: 'Post node changes to a Slack channel or any webhook endpoint.' },
          { icon: '💾', title: 'Auto-backup', desc: 'Canvas state auto-saved every 5 minutes to the server.' },
        ],
      },
    ],
  },

  filters: {
    heading: 'Filters & search',
    subtitle: 'Narrow down hundreds of nodes instantly — filter by any combination of status, priority, assignee, sprint, or tag.',
    groups: [
      {
        title: 'Filter bar',
        items: [
          { icon: '✅', title: 'Status filter', desc: 'Show only To Do / In Progress / Done / Blocked nodes. Multi-select.' },
          { icon: '🔴', title: 'Priority filter', desc: 'Filter by Critical, High, Medium or Low — combine freely.' },
          { icon: '👤', title: 'Assignee filter', desc: 'Pick one or more team members — only their nodes remain visible.' },
          { icon: '🏃', title: 'Sprint filter', desc: 'Scope the canvas to a specific sprint. Works across all views.' },
          { icon: '🏷', title: 'Tag filter', desc: 'Filter by any tag attached to nodes — great for cross-team epics.' },
          { icon: '❌', title: 'Clear filters', desc: 'One-click reset shows the badge count of active filters before clearing.' },
        ],
      },
      {
        title: 'Search',
        items: [
          { icon: '🔍', title: 'Global search (⌘K)', desc: 'Fuzzy search across node titles, descriptions, and Jira keys. Jumps to the result on the canvas.' },
          { icon: '🔎', title: 'Canvas node search', desc: 'Inline search bar highlights matching nodes and dims everything else.' },
          { icon: '🔄', title: 'Find & Replace (⌘H)', desc: 'Batch-rename node titles across the entire map using search patterns.' },
        ],
      },
    ],
  },

  ticket: {
    heading: 'Ticket panel',
    subtitle: 'Every node is a full ticket. Click any node to open the detail panel — no separate tool needed.',
    groups: [
      {
        title: 'Core fields',
        items: [
          { icon: '📌', title: 'Status', desc: 'To Do → In Progress → Done → Blocked. Customisable with Workflow states.' },
          { icon: '🔴', title: 'Priority', desc: 'Critical / High / Medium / Low with colour-coded indicator.' },
          { icon: '🏷', title: 'Issue type', desc: 'Epic / Story / Task / Bug / Sub-task — affects Jira sync mapping.' },
          { icon: '👤', title: 'Assignee', desc: 'Multi-assignee supported. Picks from your workspace member list.' },
          { icon: '📅', title: 'Due date', desc: 'Date picker with overdue highlight in red on the canvas node.' },
          { icon: '🔢', title: 'Story points', desc: 'Numeric estimate used in burndown, velocity, and size-by-SP display.' },
        ],
      },
      {
        title: 'Extra fields',
        items: [
          { icon: '🏃', title: 'Sprint', desc: 'Assign to a sprint for sprint board and burndown scoping.' },
          { icon: '🔗', title: 'Jira key', desc: 'Displayed read-only once the node is pushed to Jira (e.g. PROJ-42).' },
          { icon: '🌐', title: 'URL', desc: 'Attach an external link directly to the node.' },
          { icon: '⏱', title: 'Time estimate', desc: 'Hours estimate stored separately from story points.' },
          { icon: '🏷', title: 'Labels / Tags', desc: 'Free-form tags for cross-project categorisation and filtering.' },
          { icon: '📎', title: 'Attachments', desc: 'Drag-drop file upload stored per node. Shown in the Attachments tab.' },
        ],
      },
      {
        title: 'Activity',
        items: [
          { icon: '💬', title: 'Comments', desc: 'Threaded comments with replies, edit, and delete. Timestamped.' },
          { icon: '📜', title: 'History', desc: 'Auto-generated changelog of every field change on this node.' },
          { icon: '📄', title: 'Linked docs', desc: 'Attach bahn Wiki pages directly to a ticket for design specs or runbooks.' },
          { icon: '👶', title: 'Child issues', desc: 'Create sub-tasks inline. They appear as nested child nodes on the canvas.' },
        ],
      },
    ],
  },

  collab: {
    heading: 'Real-time collaboration',
    subtitle: 'Invite your team and work on the same canvas simultaneously — with presence indicators, role-based access, and live edits.',
    groups: [
      {
        title: 'Live presence',
        items: [
          { icon: '🖱', title: 'Shared cursors', desc: 'Each collaborator cursor appears on the canvas with their avatar and name.' },
          { icon: '👁', title: 'Live edits', desc: 'Node title, status, and position changes broadcast in real-time to all viewers.' },
          { icon: '🟢', title: 'Online indicators', desc: 'Avatars in the top bar show who is currently viewing the map.' },
        ],
      },
      {
        title: 'Access control',
        items: [
          { icon: '👑', title: 'Admin role', desc: 'Full access — create, edit, delete nodes; manage members and settings.' },
          { icon: '✏️', title: 'Edit role', desc: 'Can create and edit nodes, add comments — cannot manage membership.' },
          { icon: '👀', title: 'View role', desc: 'Read-only access. Can pan, zoom, and filter but not modify anything.' },
          { icon: '🔗', title: 'Invite by link', desc: 'Share a link that auto-assigns the View role — no account needed to view.' },
        ],
      },
      {
        title: 'Workspace',
        items: [
          { icon: '🏢', title: 'Workspace isolation', desc: 'Each workspace has its own members, projects, and data — fully isolated.' },
          { icon: '📊', title: 'Member management', desc: 'Add or remove members, change roles, and see last-active timestamps.' },
          { icon: '📜', title: 'Audit trail', desc: 'Full activity log of every change with author and timestamp.' },
        ],
      },
    ],
  },
}

function FeatureDocsSection() {
  const [activeTab, setActiveTab] = useState('views')
  const content = DOCS_CONTENT[activeTab]

  return (
    <div style={{ background: BG, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
      {/* Section header */}
      <div style={{ padding: '48px 56px 0', textAlign: 'center' }}>
        <p style={{ margin: '0 0 6px', fontSize: '0.6875rem', fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          DOCUMENTATION
        </p>
        <h2 style={{ margin: '0 0 8px', fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', fontWeight: 800, color: BLUE, letterSpacing: '-0.02em' }}>
          Everything the canvas can do
        </h2>
        <p style={{ margin: '0 auto 32px', fontSize: '0.9375rem', color: SUBTLE, maxWidth: 520 }}>
          One page. Every feature. No guessing what's possible.
        </p>
      </div>

      {/* Tab nav */}
      <div style={{ padding: '0 56px', display: 'flex', gap: 4, overflowX: 'auto', borderBottom: `1px solid ${BORDER}` }}>
        {DOCS_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', border: 'none', cursor: 'pointer', background: 'none',
              fontSize: '0.8125rem', fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? ACCENT_BLUE : SUBTLE,
              borderBottom: activeTab === tab.id ? `2px solid ${ACCENT_BLUE}` : '2px solid transparent',
              marginBottom: -1, flexShrink: 0, transition: 'color 0.15s',
            }}
            onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = BLUE }}
            onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = SUBTLE }}
          >
            <span style={{ fontSize: '0.875rem' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: '36px 56px 52px' }}>
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ margin: '0 0 6px', fontSize: '1.125rem', fontWeight: 700, color: BLUE }}>{content.heading}</h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: SUBTLE, maxWidth: 640, lineHeight: 1.65 }}>{content.subtitle}</p>
        </div>

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

// ─── Keyboard shortcuts ───────────────────────────────────────────────────────
const SHORTCUTS = [
  { key: 'Tab',   label: 'Add child node' },
  { key: 'Enter', label: 'Add sibling node' },
  { key: '⌘K',   label: 'Global search' },
  { key: 'Del',   label: 'Delete node' },
  { key: 'Space', label: 'Pan canvas' },
  { key: '⌘Z',   label: 'Undo' },
  { key: '⌘/',   label: 'Open Jira panel' },
  { key: 'F',     label: 'Auto-layout' },
  { key: 'Esc',   label: 'Deselect / close panel' },
]

function ShortcutsSection() {
  return (
    <div style={{ padding: '36px 56px 52px', borderTop: `1px solid ${BORDER}` }}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: BLUE }}>Keyboard shortcuts</h2>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: SUBTLE }}>Move fast without reaching for the mouse.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {SHORTCUTS.map(s => (
          <div
            key={s.key}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 16px', background: BG, border: `1px solid ${BORDER}`, borderRadius: 6,
            }}
          >
            <span style={{ fontSize: '0.8125rem', color: SUBTLE }}>{s.label}</span>
            <kbd style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: SURFACE, border: `1px solid ${BORDER}`,
              borderBottom: `2px solid ${BORDER}`,
              borderRadius: 4, padding: '2px 8px',
              fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 600,
              color: BLUE, flexShrink: 0, marginLeft: 12,
            }}>{s.key}</kbd>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
const FOOTER_COLS = [
  {
    heading: 'Product',
    links: [
      { label: 'Home', to: '/' },
      { label: 'Features', to: '/features' },
      { label: 'Open Canvas', to: '/app/canvas' },
      { label: 'Open CRM', to: '/app/crm' },
    ],
  },
  {
    heading: 'Capsule',
    links: [
      { label: 'Mind Maps', to: '/app/canvas' },
      { label: 'Tickets', to: '/app/canvas' },
      { label: 'Jira Sync', to: '/app/canvas' },
      { label: 'Templates', to: '/app/canvas' },
      { label: 'Keyboard Shortcuts', to: '/app/canvas-info#shortcuts' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Blog', to: '/blog' },
      { label: 'Careers', to: '/careers' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy policy', to: '/privacy' },
      { label: 'Terms of service', to: '/terms' },
      { label: 'Cookie policy', to: '/cookies' },
    ],
  },
]

function CanvasFooter() {
  return (
    <footer style={{ background: '#FAFBFC', borderTop: '1px solid #DFE1E6', color: BLUE }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 56px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr repeat(4, 1fr)', gap: '32px 24px' }}>

          {/* Brand */}
          <div>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 12 }}>
              <svg width="26" height="26" viewBox="0 0 30 30" fill="none">
                <circle cx="10" cy="15" r="9" fill="#0052CC" opacity="0.9"/>
                <circle cx="20" cy="15" r="9" fill="#4C9AFF" opacity="0.85"/>
              </svg>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: BLUE, letterSpacing: '-0.01em' }}>bahnOS</span>
            </Link>
            <p style={{ fontSize: '0.8125rem', color: SUBTLE, lineHeight: 1.65, maxWidth: 220 }}>
              Visual mind maps and Jira-style tickets in one canvas — for teams that ship.
            </p>
          </div>

          {/* Link columns */}
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

        {/* Bottom bar */}
        <div style={{ marginTop: 40, paddingTop: 16, paddingBottom: 20, borderTop: '1px solid #DFE1E6' }} />
      </div>
    </footer>
  )
}
