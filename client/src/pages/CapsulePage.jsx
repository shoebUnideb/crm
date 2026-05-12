import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useAuthModal } from '../context/AuthModalContext.jsx'
import Navbar from '../components/landing/Navbar.jsx'
import Footer from '../components/landing/Footer.jsx'

const BLUE    = '#172B4D'
const SUBTLE  = '#5E6C84'
const MUTED   = '#97A0AF'
const BORDER  = '#DFE1E6'
const BG      = '#FAFBFC'
const SURFACE = '#FFFFFF'
const ACCENT  = '#0052CC'
const color   = '#6554C0'

const TABS = [
  {
    id: 'views',
    label: 'Views',
    features: [
      { icon: '🗂️', title: 'Kanban board',       desc: 'Drag cards across status columns. Multi-assignee swimlanes and WIP limits.' },
      { icon: '🏃', title: 'Sprint board',        desc: 'Scrum-style backlog scoped to a single sprint with velocity counters.' },
      { icon: '📅', title: 'Sprint planning',     desc: 'Side-by-side backlog and sprint columns for drag-in estimation sessions.' },
      { icon: '📊', title: 'Timeline / Roadmap',  desc: 'Gantt-style horizontal bars keyed off due-date. Zoom from weeks to quarters.' },
      { icon: '📉', title: 'Burndown chart',      desc: 'Story-point burndown per sprint with ideal vs actual lines.' },
      { icon: '⚡', title: 'Table view',          desc: 'Flat spreadsheet of every node. Sort, filter and inline-edit any column.' },
    ],
  },
  {
    id: 'tickets',
    label: 'Tickets',
    features: [
      { icon: '🎫', title: 'Built-in ticketing',  desc: 'Every node carries status, priority, story points, assignee, and due date.' },
      { icon: '⚙️', title: 'Custom statuses',     desc: 'Define your own workflow stages with colors and transitions.' },
      { icon: '🔗', title: 'Dependencies',        desc: 'Link nodes with dependency edges and visualize blocking chains.' },
      { icon: '📦', title: 'Custom fields',       desc: 'Add any data type to nodes — text, number, date, select, URL.' },
      { icon: '🏷️', title: 'Tags & labels',       desc: 'Flexible tagging system for cross-cutting concerns.' },
      { icon: '📋', title: 'Checklists',          desc: 'Add step-by-step sub-tasks directly inside a node.' },
    ],
  },
  {
    id: 'jira',
    label: 'Jira Sync',
    features: [
      { icon: '🔄', title: 'Two-way sync',        desc: 'Pull existing Jira tickets into nodes or push nodes to Jira as new issues.' },
      { icon: '🗺️', title: 'Depth mapping',       desc: 'Map node depth to issue type — root = Epic, children = Story, leaf = Subtask.' },
      { icon: '🏎️', title: 'Sprint assignment',   desc: 'Assign nodes to active or future sprints during export.' },
      { icon: '🔍', title: 'JQL import',          desc: 'Pull tickets from any Jira JQL query into your canvas.' },
      { icon: '🔑', title: 'Key display',         desc: 'Jira keys shown on nodes for direct traceability.' },
      { icon: '⚡', title: 'Bulk create',         desc: 'Push an entire subtree to Jira in a single click.' },
    ],
  },
  {
    id: 'collab',
    label: 'Collaboration',
    features: [
      { icon: '👥', title: 'Real-time presence',  desc: 'See teammates\' cursors and selections live on the canvas.' },
      { icon: '💬', title: 'Node comments',       desc: 'Thread discussions directly on any capsule node.' },
      { icon: '🔐', title: 'Role-based access',   desc: 'Admin, edit, and view roles per project with invite management.' },
      { icon: '📧', title: 'Email invites',       desc: 'Invite anyone by email — they join with a token link.' },
      { icon: '🕓', title: 'Audit log',           desc: 'Track every change made to a project over time.' },
      { icon: '🎨', title: 'User colors',         desc: 'Each collaborator gets a unique color for their cursor and selections.' },
    ],
  },
  {
    id: 'export',
    label: 'Export',
    features: [
      { icon: '📤', title: 'Jira export',         desc: 'Push selected nodes or entire trees to Jira with one click.' },
      { icon: '📄', title: 'CSV export',          desc: 'Export node data as a flat CSV for spreadsheet analysis.' },
      { icon: '🖼️', title: 'Image export',        desc: 'Export the canvas as PNG or SVG for presentations.' },
      { icon: '🔗', title: 'Share link',          desc: 'Generate a read-only share link for external stakeholders.' },
      { icon: '📝', title: 'Confluence export',   desc: 'Push structured content into Confluence pages.' },
      { icon: '🌐', title: 'Templates',           desc: 'Save any map as a reusable template for your team.' },
    ],
  },
]

function FeatureTabs() {
  const [active, setActive] = useState('views')
  const current = TABS.find(t => t.id === active)
  return (
    <section style={{ background: BG, borderTop: `1px solid ${BORDER}`, padding: '64px 24px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <p style={{ textAlign: 'center', fontSize: '0.6875rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Features</p>
        <h2 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 700, color: BLUE, margin: '0 0 32px', letterSpacing: '-0.02em', textAlign: 'center' }}>
          Everything the canvas can do
        </h2>
        <div style={{ display: 'flex', gap: 4, borderBottom: `2px solid ${BORDER}`, marginBottom: 40, overflowX: 'auto' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActive(tab.id)}
              style={{ padding: '10px 18px', background: 'none', border: 'none', borderBottom: `2px solid ${active === tab.id ? color : 'transparent'}`, cursor: 'pointer', fontSize: '0.875rem', fontWeight: active === tab.id ? 600 : 500, color: active === tab.id ? color : SUBTLE, whiteSpace: 'nowrap', marginBottom: -2, transition: 'color 0.15s' }}
            >{tab.label}</button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {current.features.map((f, i) => (
            <div key={i} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '20px', display: 'flex', gap: 14, transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(9,30,66,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
            >
              <span style={{ fontSize: '1.25rem', lineHeight: 1, flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: BLUE, marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: '0.8125rem', color: SUBTLE, lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function CapsulePage() {
  const { isAuthenticated } = useAuth()
  const { openRegister } = useAuthModal()
  const navigate = useNavigate()

  const goToApp = () => {
    if (isAuthenticated) navigate('/app/canvas')
    else openRegister()
  }

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <Navbar />

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #F3F0FF 0%, #EBF4FF 60%, #FAFBFC 100%)',
        borderBottom: `3px solid ${color}`,
        padding: '80px 24px 72px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -80, width: 400, height: 400, background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: SURFACE, border: `1px solid ${color}40`, borderRadius: 100, padding: '5px 16px', marginBottom: 28, boxShadow: '0 1px 4px rgba(101,84,192,0.12)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color, letterSpacing: '0.04em' }}>bahn Capsule</span>
            <span style={{ width: 1, height: 12, background: BORDER }} />
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: MUTED }}>+ Jira Sync</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', fontWeight: 800, color: BLUE, lineHeight: 1.15, letterSpacing: '-0.03em', margin: '0 0 20px' }}>
            Visual execution.
            <br /><span style={{ color }}>Every node a capsule.</span>
          </h1>
          <p style={{ fontSize: '1.0625rem', color: SUBTLE, lineHeight: 1.7, maxWidth: 580, margin: '0 auto 24px' }}>
            bahn Capsule is a visual operational workspace where every node holds context, work, tickets, docs, and execution state — all in one place.
          </p>
          {/* Capsule concept callout */}
          <div style={{ display: 'inline-block', background: SURFACE, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${color}`, borderRadius: 6, padding: '12px 20px', marginBottom: 36, textAlign: 'left', boxShadow: '0 1px 4px rgba(9,30,66,0.06)' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>What is a Capsule?</span>
            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: SUBTLE, lineHeight: 1.5, maxWidth: 460 }}>
              A Capsule is a node that holds full operational context — not just a label, but the work, the people, the tickets, the docs, and the status — all in one place.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={goToApp}
              style={{ background: color, color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.9375rem', borderRadius: 4, padding: '12px 26px', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#5243AA' }}
              onMouseLeave={e => { e.currentTarget.style.background = color }}
            >Start free →</button>
            <Link to="/templates" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: SURFACE, color: SUBTLE, border: `1px solid ${BORDER}`, fontWeight: 500, fontSize: '0.9375rem', borderRadius: 4, padding: '11px 22px', textDecoration: 'none', transition: 'border-color 0.15s, color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = BLUE; e.currentTarget.style.borderColor = BLUE }}
              onMouseLeave={e => { e.currentTarget.style.color = SUBTLE; e.currentTarget.style.borderColor = BORDER }}
            >Browse templates</Link>
          </div>
        </div>
      </section>

      {/* Platform strip */}
      <section style={{ background: BLUE, padding: '28px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
          {[
            { label: 'Kanban & Sprint boards', icon: '🗂️' },
            { label: 'Jira two-way sync',      icon: '🔄' },
            { label: 'Real-time collab',       icon: '👥' },
            { label: 'Timeline / Gantt',       icon: '📊' },
            { label: 'CSV & image export',     icon: '📤' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#FFFFFF', opacity: 0.85 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Feature tabs */}
      <FeatureTabs />

      {/* Get started steps */}
      <section style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, padding: '72px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Get started</p>
          <h2 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 700, color: BLUE, margin: '0 0 48px', letterSpacing: '-0.02em' }}>
            From blank canvas to tracked sprint in four steps
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {[
              { n: '01', title: 'Create a project', desc: 'Click "+ New project" in the sidebar and give it a name.' },
              { n: '02', title: 'Build your first map', desc: 'Press Tab to add a child node, Enter for a sibling. Drag to rearrange.' },
              { n: '03', title: 'Turn nodes into tickets', desc: 'Click any node to open the detail panel. Assign status, priority, and owner.' },
              { n: '04', title: 'Sync with Jira', desc: 'Open the Jira panel, connect your workspace, and push selected nodes as real tickets.' },
            ].map((step, i) => (
              <div key={i} style={{ background: BG, border: `1px solid ${BORDER}`, borderTop: `3px solid ${color}`, borderRadius: 6, padding: '24px 20px', textAlign: 'left' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: color + '30', letterSpacing: '-0.04em', marginBottom: 14 }}>{step.n}</div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: BLUE, marginBottom: 8 }}>{step.title}</div>
                <div style={{ fontSize: '0.8125rem', color: SUBTLE, lineHeight: 1.5 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Connection callout */}
      <section style={{ background: BLUE, padding: '56px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Part of the bahnOS platform</p>
          <h3 style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', fontWeight: 700, color: '#FFFFFF', margin: '0 0 14px', letterSpacing: '-0.02em' }}>
            Connected to CRM and Wiki
          </h3>
          <p style={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 28 }}>
            A CRM deal can link to a Capsule implementation plan. A node can attach its spec doc from Wiki. Context travels with the work.
          </p>
          <Link to="/platform" style={{ display: 'inline-block', color: '#FFFFFF', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, padding: '10px 22px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 4, transition: 'background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >Learn about The Platform →</Link>
        </div>
      </section>

      {/* Templates */}
      <section style={{ background: BG, borderTop: `1px solid ${BORDER}`, padding: '64px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Templates</p>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: BLUE, margin: '0 0 10px' }}>Start from a template</h2>
          <p style={{ fontSize: '0.9375rem', color: SUBTLE, marginBottom: 36 }}>Ready-made Capsule maps for real operational patterns.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
            {[
              { emoji: '🗺️', name: 'Product roadmap' }, { emoji: '🏃', name: 'Sprint planning' },
              { emoji: '📦', name: 'Dependency map' },  { emoji: '🎯', name: 'OKR tracker' },
              { emoji: '🏢', name: 'Org chart' },       { emoji: '🔄', name: 'Process map' },
            ].map((t, i) => (
              <Link key={i} to="/templates" style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', textDecoration: 'none', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 0 0 2px ${color}18` }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = 'none' }}
              >
                <span style={{ fontSize: '1.375rem' }}>{t.emoji}</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: BLUE }}>{t.name}</div>
              </Link>
            ))}
          </div>
          <Link to="/templates" style={{ color: ACCENT, textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>Browse all templates →</Link>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ background: BLUE, padding: '72px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#FFFFFF', margin: '0 0 14px', letterSpacing: '-0.03em' }}>Start with Capsule.</h2>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: 32 }}>Free to start. No credit card required.</p>
          <button onClick={goToApp}
            style={{ background: color, color: '#fff', border: 'none', fontWeight: 700, fontSize: '1rem', padding: '14px 32px', borderRadius: 4, cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#5243AA' }}
            onMouseLeave={e => { e.currentTarget.style.background = color }}
          >Get started free →</button>
        </div>
      </section>

      <Footer />
    </div>
  )
}
