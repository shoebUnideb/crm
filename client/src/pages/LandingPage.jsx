import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useAuthModal } from '../context/AuthModalContext.jsx'
import Navbar from '../components/landing/Navbar.jsx'
import Footer from '../components/landing/Footer.jsx'

const BLUE       = '#172B4D'
const BLUE_H     = '#253858'
const SUBTLE     = '#5E6C84'
const BORDER     = '#DFE1E6'
const BG         = '#FAFBFC'
const SURFACE    = '#FFFFFF'
const ACCENT     = '#0052CC'
const BLUE_LIGHT = '#4C9AFF'
const CAPSULE    = '#6554C0'
const CRM        = '#00875A'
const WIKI       = '#FF8B00'

// ─── Hero ──────────────────────────────────────────────────────────────────────
function HeroSection({ onGetStarted }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #EFF6FF 0%, #EBF4FF 60%, #FAFBFC 100%)',
      borderBottom: `3px solid ${ACCENT}`,
      padding: '56px 64px 48px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* ghost text */}
      <div style={{
        position: 'absolute', right: -20, bottom: -28,
        fontSize: 180, fontWeight: 900, color: 'rgba(0,82,204,0.04)',
        letterSpacing: '-0.06em', lineHeight: 1,
        userSelect: 'none', pointerEvents: 'none',
      }}>BAHN</div>

      {/* right-side decorative product cards */}
      <div style={{ position: 'absolute', right: '6%', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 14, pointerEvents: 'none', zIndex: 0 }}>
        <HeroCard
          offset={-14}
          accent={CAPSULE}
          badge="CAPSULE"
          title="Q2 Roadmap"
          rows={[
            { label: 'STATUS', value: 'In Progress', color: CRM },
            { label: 'NODES',  skeleton: true },
            { label: 'SPRINT', skeleton: true, w: 44 },
          ]}
        />
        <HeroCard
          offset={0}
          accent={CRM}
          badge="CRM"
          title="Acme Corp — $24k"
          featured
          rows={[
            { label: 'STAGE', value: 'Negotiation', color: ACCENT },
            { label: 'OWNER', skeleton: true },
            { label: 'CLOSE', skeleton: true, w: 52 },
          ]}
        />
        <HeroCard
          offset={-8}
          accent={WIKI}
          badge="WIKI"
          title="Onboarding Guide"
          rows={[
            { label: 'SPACE', value: 'Engineering', color: BLUE },
            { label: 'PAGES', skeleton: true },
            { label: 'EDIT',  skeleton: true, w: 40 },
          ]}
        />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 580 }}>
        {/* badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: BLUE, color: '#fff',
          padding: '3px 10px', borderRadius: 3,
          fontSize: '0.6875rem', fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20,
        }}>
          bahn Operating System
        </div>

        <h1 style={{
          fontSize: 'clamp(1.875rem, 4vw, 3rem)', fontWeight: 800, color: BLUE,
          letterSpacing: '-0.03em', lineHeight: 1.12, margin: '0 0 16px',
        }}>
          Your operations are connected.<br />
          <span style={{ color: ACCENT }}>Your tools aren't.</span>
        </h1>

        <p style={{ fontSize: '1rem', color: SUBTLE, lineHeight: 1.75, margin: '0 0 12px', maxWidth: 500 }}>
          bahnOS is a connected operational workspace — planning, execution, revenue,
          and documentation in one system. Not six separate tabs.
        </p>

        <div style={{
          margin: '0 0 26px', padding: '10px 14px',
          background: 'rgba(0,82,204,0.05)', border: '1px solid rgba(0,82,204,0.14)',
          borderRadius: 4, maxWidth: 460,
        }}>
          <p style={{ margin: 0, fontSize: '0.75rem', fontStyle: 'italic', color: SUBTLE, lineHeight: 1.7 }}>
            <strong style={{ fontStyle: 'normal', color: BLUE, fontWeight: 600 }}>Three products. One system.</strong>
            {' '}bahn Capsule, CRM, and Wiki are powerful alone — and exponentially better when connected.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
          <button
            onClick={onGetStarted}
            style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: 3, padding: '10px 24px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#0747A6' }}
            onMouseLeave={e => { e.currentTarget.style.background = ACCENT }}
          >
            Get started free →
          </button>
          <Link to="/platform"
            style={{ display: 'inline-flex', alignItems: 'center', background: 'transparent', color: BLUE, border: `1px solid ${BORDER}`, borderRadius: 3, padding: '10px 22px', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer', textDecoration: 'none', transition: 'border-color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = BLUE }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER }}
          >
            See how it connects →
          </Link>
        </div>

        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
          {['Capsule', 'CRM', 'Wiki', 'Jira sync', 'Real-time collab'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: SUBTLE }}>
              <span style={{ color: ACCENT, fontWeight: 700 }}>✓</span> {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function HeroCard({ offset, accent, badge, title, rows, featured }) {
  return (
    <div style={{
      width: featured ? 172 : 148,
      background: SURFACE,
      border: `1px solid ${BORDER}`,
      borderLeft: featured ? `3px solid ${accent}` : `1px solid ${BORDER}`,
      borderRadius: 8, zIndex: featured ? 3 : 2,
      boxShadow: featured ? '0 8px 28px rgba(9,30,66,0.15)' : '0 2px 8px rgba(9,30,66,0.08)',
      padding: '11px 12px 13px',
      transform: `translateY(${offset}px)`,
      flexShrink: 0,
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', background: `${accent}18`,
        color: accent, border: `1px solid ${accent}30`,
        borderRadius: 3, padding: '1px 6px',
        fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
        marginBottom: 7,
      }}>{badge}</div>
      <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: BLUE, marginBottom: 8, lineHeight: 1.3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{title}</div>
      <div style={{ height: 1, background: BORDER, marginBottom: 7 }} />
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: i > 0 ? 5 : 0 }}>
          <span style={{ fontSize: '0.5625rem', color: SUBTLE, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{r.label}</span>
          {r.skeleton
            ? <div style={{ height: 4, borderRadius: 2, background: '#EBECF0', width: r.w ?? 44 }} />
            : <span style={{ fontSize: '0.5625rem', fontWeight: 600, color: r.color ?? BLUE }}>{r.value}</span>
          }
        </div>
      ))}
    </div>
  )
}

// ─── Platform strip ────────────────────────────────────────────────────────────
const PLATFORM_FEATURES = [
  {
    title: 'bahn Capsule',
    body: 'Visual execution — every node is a ticket, doc, and status in one place.',
    color: CAPSULE,
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
    title: 'bahn CRM',
    body: 'Revenue pipeline that stays connected to delivery when a deal closes.',
    color: CRM,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    title: 'bahn Wiki',
    body: 'Docs attached to work — spec pages live next to the nodes they describe.',
    color: WIKI,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    title: 'Jira sync',
    body: 'Two-way sync — push canvas nodes to Jira or pull existing tickets in.',
    color: ACCENT,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    ),
  },
  {
    title: 'Real-time collab',
    body: 'Shared cursors, live edits, and role-based access across all products.',
    color: BLUE_LIGHT,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
        <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      </svg>
    ),
  },
]

function PlatformStrip() {
  return (
    <div style={{
      background: BLUE,
      display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      {PLATFORM_FEATURES.map((f, i) => (
        <div key={f.title} style={{
          padding: '22px 20px',
          borderRight: i < PLATFORM_FEATURES.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <div style={{ color: f.color, flexShrink: 0, marginTop: 2 }}>{f.icon}</div>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff', marginBottom: 3, lineHeight: 1.3 }}>{f.title}</div>
            <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.55 }}>{f.body}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Problem section ───────────────────────────────────────────────────────────
function ProblemSection() {
  return (
    <div style={{ background: SURFACE, padding: '52px 64px', borderTop: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ margin: '0 0 6px', fontSize: '0.6875rem', fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          THE PROBLEM
        </p>
        <h2 style={{ margin: '0 0 8px', fontSize: 'clamp(1.25rem, 2.5vw, 1.875rem)', fontWeight: 800, color: BLUE, letterSpacing: '-0.02em' }}>
          The average team runs on 6+ disconnected tools.
        </h2>
        <p style={{ margin: '0 0 36px', fontSize: '0.9375rem', color: SUBTLE, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
          Planning here. Tickets elsewhere. Revenue disconnected from delivery. Docs in a separate tab.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { left: 'Planning',        right: 'Execution lost',    sub: 'Roadmap nodes have no ticket state' },
            { left: 'Revenue context', right: 'Delivery amnesia',  sub: 'Won deals lose context before handoff' },
            { left: 'Docs',            right: 'Context missing',   sub: 'Specs disconnected from the work' },
          ].map((row, i) => (
            <div key={i} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '18px 20px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: BLUE }}>{row.left}</span>
                <span style={{ color: '#97A0AF', fontSize: '0.875rem' }}>→</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#DE350B' }}>{row.right}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: SUBTLE, lineHeight: 1.6 }}>{row.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Product tabs ──────────────────────────────────────────────────────────────
const PRODUCT_TABS = [
  {
    id: 'capsule',
    label: 'bahn Capsule',
    color: CAPSULE,
    headline: 'Visual execution. Every node a capsule.',
    sub: 'A Capsule is not just a node — it carries context, tickets, people, docs, and status all in one place.',
    checks: ['Kanban & Sprint boards', 'Jira two-way sync', 'Timeline / Gantt view', 'Real-time collaboration', 'CSV, PNG, Confluence export'],
    link: '/capsule',
    visual: <CapsuleVisual />,
  },
  {
    id: 'crm',
    label: 'bahn CRM',
    color: CRM,
    headline: 'Revenue connected to operations.',
    sub: "When a deal closes, implementation doesn't disappear — it flows directly into a Capsule map.",
    checks: ['Visual pipeline with custom stages', 'Contacts & organizations', 'Activity logging (calls, email, meetings)', 'Revenue forecasting & quotas', 'Linked to Capsule on close'],
    link: '/crm-product',
    visual: <CRMVisual />,
  },
  {
    id: 'wiki',
    label: 'bahn Wiki',
    color: WIKI,
    headline: 'Documentation where work lives.',
    sub: 'A spec doc lives next to the Capsule node it describes. An onboarding guide links to the deal that triggered it.',
    checks: ['Rich text editor with slash commands', 'Nested Spaces and page hierarchy', 'Version history and diff view', 'Threaded comments and mentions', 'Linked to Canvas nodes and CRM deals'],
    link: '/wiki',
    visual: <WikiVisual />,
  },
]

function CapsuleVisual() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[
        { label: 'Q2 Roadmap', status: 'In Progress', priority: 'High', color: '#00875A' },
        { label: 'Auth refactor', status: 'To Do', priority: 'Medium', color: ACCENT },
        { label: 'API gateway', status: 'Blocked', priority: 'Critical', color: '#DE350B' },
      ].map((node, i) => (
        <div key={i} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${node.color}`, borderRadius: 6, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginLeft: i === 0 ? 0 : i * 16 }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: BLUE }}>{node.label}</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: node.color, background: `${node.color}15`, padding: '1px 6px', borderRadius: 3 }}>{node.status}</span>
            <span style={{ fontSize: '0.6875rem', color: SUBTLE }}>{node.priority}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function CRMVisual() {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {[
        { stage: 'Qualified', deal: 'Acme Corp', value: '$24k', color: ACCENT },
        { stage: 'Proposal', deal: 'TechStart', value: '$18k', color: CAPSULE },
        { stage: 'Closed Won', deal: 'BuildCo', value: '$41k', color: CRM },
      ].map((col, i) => (
        <div key={i} style={{ flex: 1, background: BG, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '10px' }}>
          <div style={{ fontSize: '0.5625rem', fontWeight: 700, color: col.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{col.stage}</div>
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 5, padding: '8px' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: BLUE, marginBottom: 3 }}>{col.deal}</div>
            <div style={{ fontSize: '0.625rem', color: CRM, fontWeight: 700 }}>{col.value}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function WikiVisual() {
  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: '8px 12px', display: 'flex', gap: 6, alignItems: 'center' }}>
        <div style={{ width: 10, height: 10, borderRadius: 2, background: WIKI }} />
        <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: BLUE }}>Engineering Onboarding</span>
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ width: '70%', height: 7, background: '#EBECF0', borderRadius: 3, marginBottom: 8 }} />
        <div style={{ width: '55%', height: 5, background: '#F4F5F7', borderRadius: 3, marginBottom: 4 }} />
        <div style={{ width: '80%', height: 5, background: '#F4F5F7', borderRadius: 3, marginBottom: 10 }} />
        <div style={{ background: '#EBF4FF', border: `1px solid ${ACCENT}30`, borderRadius: 5, padding: '6px 10px', display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: '0.5625rem', color: ACCENT }}>🔗</span>
          <span style={{ fontSize: '0.5625rem', color: ACCENT, fontWeight: 600 }}>Linked: Q2 Sprint → Capsule node</span>
        </div>
      </div>
    </div>
  )
}

function ProductSection({ onGetStarted }) {
  const [active, setActive] = useState('capsule')
  const tab = PRODUCT_TABS.find(t => t.id === active)

  return (
    <div style={{ background: BG, borderTop: `1px solid ${BORDER}`, padding: '52px 64px' }}>
      <div style={{ maxWidth: 940, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <p style={{ margin: '0 0 6px', fontSize: '0.6875rem', fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            THREE PRODUCTS
          </p>
          <h2 style={{ margin: '0 0 8px', fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', fontWeight: 800, color: BLUE, letterSpacing: '-0.02em' }}>
            Start with one. Grow into the system.
          </h2>
          <p style={{ margin: 0, fontSize: '0.9375rem', color: SUBTLE, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            Each product is powerful standalone and integrates seamlessly with the others.
          </p>
        </div>

        {/* tab bar */}
        <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${BORDER}`, marginBottom: 32 }}>
          {PRODUCT_TABS.map(t => (
            <button key={t.id} onClick={() => setActive(t.id)}
              style={{
                padding: '9px 18px', border: 'none', cursor: 'pointer', background: 'none',
                fontSize: '0.8125rem', fontWeight: active === t.id ? 600 : 400,
                color: active === t.id ? t.color : SUBTLE,
                borderBottom: `2px solid ${active === t.id ? t.color : 'transparent'}`,
                marginBottom: -1, flexShrink: 0, transition: 'color 0.15s',
              }}
              onMouseEnter={e => { if (active !== t.id) e.currentTarget.style.color = BLUE }}
              onMouseLeave={e => { if (active !== t.id) e.currentTarget.style.color = SUBTLE }}
            >{t.label}</button>
          ))}
        </div>

        {/* tab content */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: `${tab.color}15`, color: tab.color,
              border: `1px solid ${tab.color}30`, padding: '3px 10px',
              borderRadius: 3, fontSize: '0.6875rem', fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16,
            }}>{tab.label}</div>
            <h3 style={{ margin: '0 0 12px', fontSize: 'clamp(1.1rem, 2vw, 1.5rem)', fontWeight: 800, color: BLUE, letterSpacing: '-0.02em', lineHeight: 1.25 }}>{tab.headline}</h3>
            <p style={{ margin: '0 0 20px', fontSize: '0.9375rem', color: SUBTLE, lineHeight: 1.7 }}>{tab.sub}</p>
            <ul style={{ margin: '0 0 24px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tab.checks.map((c, i) => (
                <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '0.8125rem', color: SUBTLE }}>
                  <span style={{ color: ACCENT, fontWeight: 700, flexShrink: 0 }}>✓</span> {c}
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onGetStarted}
                style={{ background: tab.color, color: '#fff', border: 'none', borderRadius: 3, padding: '9px 20px', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', transition: 'opacity 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              >Get started →</button>
              <Link to={tab.link}
                style={{ display: 'inline-flex', alignItems: 'center', background: 'none', color: BLUE, border: `1px solid ${BORDER}`, borderRadius: 3, padding: '9px 18px', fontWeight: 500, fontSize: '0.8125rem', textDecoration: 'none', transition: 'border-color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = BLUE }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER }}
              >Learn more</Link>
            </div>
          </div>
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '24px', boxShadow: '0 4px 16px rgba(9,30,66,0.08)' }}>
            {tab.visual}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Connection section ────────────────────────────────────────────────────────
function ConnectionSection() {
  return (
    <div style={{ background: SURFACE, padding: '52px 64px', borderTop: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{ margin: '0 0 6px', fontSize: '0.6875rem', fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            CONNECTED FLOWS
          </p>
          <h2 style={{ margin: '0 0 8px', fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', fontWeight: 800, color: BLUE, letterSpacing: '-0.02em' }}>
            Context doesn't get lost between tools.
          </h2>
          <p style={{ margin: 0, fontSize: '0.9375rem', color: SUBTLE, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            Workflows that span multiple products — with full context at every step.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[
            {
              label: 'Sales to delivery',
              steps: [
                { name: 'CRM Deal', product: 'CRM', color: CRM, desc: 'Acme Corp closes at $120k' },
                { name: 'Capsule Map', product: 'Capsule', color: CAPSULE, desc: 'Implementation plan created' },
                { name: 'Sprint Tickets', product: 'Capsule', color: CAPSULE, desc: 'Nodes pushed to Q3 sprint' },
                { name: 'Jira Issues', product: 'Jira', color: ACCENT, desc: 'Epics & Stories in Jira' },
              ],
            },
            {
              label: 'Roadmap to docs',
              steps: [
                { name: 'Roadmap Node', product: 'Capsule', color: CAPSULE, desc: 'SSO Integration feature added' },
                { name: 'Spec doc', product: 'Wiki', color: WIKI, desc: 'Technical spec linked to node' },
                { name: 'Sprint tickets', product: 'Capsule', color: CAPSULE, desc: 'Broken into sprint subtasks' },
                { name: 'Done', product: 'Capsule', color: CRM, desc: 'Status propagates up tree' },
              ],
            },
          ].map((flow, fi) => (
            <div key={fi} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '18px 20px' }}>
              <p style={{ margin: '0 0 14px', fontSize: '0.75rem', fontWeight: 700, color: SUBTLE, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{flow.label}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto' }}>
                {flow.steps.map((step, si) => (
                  <React.Fragment key={si}>
                    <div style={{ background: SURFACE, border: `1px solid ${step.color}30`, borderRadius: 7, padding: '10px 14px', minWidth: 140, flexShrink: 0 }}>
                      <div style={{ fontSize: '0.5625rem', fontWeight: 700, color: step.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{step.product}</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: BLUE, marginBottom: 3 }}>{step.name}</div>
                      <div style={{ fontSize: '0.6875rem', color: SUBTLE, lineHeight: 1.4 }}>{step.desc}</div>
                    </div>
                    {si < flow.steps.length - 1 && (
                      <div style={{ padding: '0 8px', color: '#97A0AF', fontSize: '1.125rem', flexShrink: 0 }}>→</div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/platform" style={{ fontSize: '0.875rem', fontWeight: 600, color: ACCENT, textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
            onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
          >
            Learn how the platform connects →
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Roadmap teaser ────────────────────────────────────────────────────────────
function RoadmapTeaser() {
  return (
    <div style={{ background: BG, padding: '52px 64px', borderTop: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <p style={{ margin: '0 0 6px', fontSize: '0.6875rem', fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            AVAILABILITY
          </p>
          <h2 style={{ margin: '0 0 8px', fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', fontWeight: 800, color: BLUE, letterSpacing: '-0.02em' }}>
            Available today. More coming.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Available now */}
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <span style={{ color: '#00875A', fontSize: '0.875rem' }}>✓</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#00875A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Available now</span>
            </div>
            {['Capsule — visual execution workspace', 'CRM — pipeline & contacts', 'Wiki — rich text docs', 'Jira two-way sync', 'Real-time collaboration', 'Sprint & Kanban boards', 'Templates library'].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8, fontSize: '0.8125rem', color: BLUE }}>
                <span style={{ color: '#00875A', fontWeight: 700, flexShrink: 0 }}>✓</span> {item}
              </div>
            ))}
          </div>
          {/* Coming soon */}
          <div style={{ background: BG, border: `1px dashed ${BORDER}`, borderRadius: 8, padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <span style={{ color: '#97A0AF', fontSize: '0.875rem' }}>⟳</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Coming soon</span>
            </div>
            {['Global search', 'CRM automation engine', 'AI layout suggestions', 'Mobile app (iOS & Android)', 'GitHub integration', 'SSO / SAML'].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8, fontSize: '0.8125rem', color: SUBTLE }}>
                <span style={{ color: '#C1C7D0', flexShrink: 0 }}>○</span> {item}
              </div>
            ))}
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/roadmap" style={{ fontSize: '0.875rem', fontWeight: 600, color: ACCENT, textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
            onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
          >
            View full roadmap →
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── CTA band ──────────────────────────────────────────────────────────────────
function CTABand({ onGetStarted }) {
  return (
    <div style={{ background: BLUE, padding: '64px 64px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 14 }}>
          GET STARTED
        </p>
        <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', lineHeight: 1.15, marginBottom: 14 }}>
          Start where you are.<br />
          <span style={{ color: BLUE_LIGHT }}>Connect as you grow.</span>
        </h2>
        <p style={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, maxWidth: 480, margin: '0 auto 32px' }}>
          Pick one product or use the full system. Free to start, no credit card required.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
          <button onClick={onGetStarted}
            style={{ background: '#fff', color: BLUE, border: 'none', fontWeight: 700, fontSize: '0.9375rem', borderRadius: 3, padding: '12px 28px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.18)', transition: 'background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#DEEBFF' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
          >
            Get started free →
          </button>
          <Link to="/platform"
            style={{ display: 'inline-flex', alignItems: 'center', background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,0.35)', fontWeight: 500, fontSize: '0.9375rem', borderRadius: 3, padding: '12px 24px', textDecoration: 'none', transition: 'border-color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)' }}
          >
            Explore the platform →
          </Link>
        </div>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['bahn Capsule', 'bahn CRM', 'bahn Wiki', 'Jira sync', 'Free to start'].map(badge => (
            <div key={badge} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={BLUE_LIGHT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

// ─── Main export ───────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { openRegister } = useAuthModal()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/app/canvas')
    } else {
      openRegister()
    }
  }

  return (
    <div style={{ background: BG, color: BLUE, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", minHeight: '100vh' }}>
      <Navbar />
      <HeroSection onGetStarted={handleGetStarted} />
      <PlatformStrip />
      <ProblemSection />
      <ProductSection onGetStarted={handleGetStarted} />
      <ConnectionSection />
      <RoadmapTeaser />
      <CTABand onGetStarted={handleGetStarted} />
      <Footer />
    </div>
  )
}
