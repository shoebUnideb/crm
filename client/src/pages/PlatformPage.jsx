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
function HeroBanner({ onGetStarted }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #EFF6FF 0%, #EBF4FF 60%, #FAFBFC 100%)',
      borderBottom: `3px solid ${ACCENT}`,
      padding: '52px 56px 44px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', right: -20, bottom: -28,
        fontSize: 180, fontWeight: 900, color: 'rgba(0,82,204,0.04)',
        letterSpacing: '-0.06em', lineHeight: 1,
        userSelect: 'none', pointerEvents: 'none',
      }}>SYSTEM</div>

      {/* right-side system diagram */}
      <div style={{ position: 'absolute', right: '6%', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 0 }}>
        <SystemDiagramHero />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 560 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: BLUE, color: '#fff', padding: '3px 10px',
          borderRadius: 3, fontSize: '0.6875rem', fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 18,
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          bahnOS Platform
        </div>

        <h1 style={{
          fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: BLUE,
          letterSpacing: '-0.03em', lineHeight: 1.15, margin: '0 0 14px',
        }}>
          Three products.<br />One operational system.
        </h1>
        <p style={{ fontSize: '0.9375rem', color: SUBTLE, lineHeight: 1.75, margin: '0 0 12px', maxWidth: 480 }}>
          Capsule, CRM, and Wiki are powerful individually — and exponentially better
          when they work together in a single connected workspace.
        </p>

        <div style={{
          margin: '0 0 26px', padding: '10px 14px',
          background: 'rgba(0,82,204,0.05)', border: '1px solid rgba(0,82,204,0.14)',
          borderRadius: 4, maxWidth: 440,
        }}>
          <p style={{ margin: 0, fontSize: '0.75rem', fontStyle: 'italic', color: SUBTLE, lineHeight: 1.7 }}>
            <strong style={{ fontStyle: 'normal', color: BLUE, fontWeight: 600 }}>Why connected?</strong>
            {' '}Most tools lose context at handoff. bahnOS keeps planning, revenue, and docs linked
            to the work — so nothing falls through the cracks.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
          <button onClick={onGetStarted}
            style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: 3, padding: '10px 22px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#0747A6' }}
            onMouseLeave={e => { e.currentTarget.style.background = ACCENT }}
          >Try the full system →</button>
          <Link to="/"
            style={{ display: 'inline-flex', alignItems: 'center', background: 'transparent', color: BLUE, border: `1px solid ${BORDER}`, borderRadius: 3, padding: '10px 22px', fontWeight: 500, fontSize: '0.875rem', textDecoration: 'none', transition: 'border-color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = BLUE }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER }}
          >Back to home</Link>
        </div>

        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
          {['bahn Capsule', 'bahn CRM', 'bahn Wiki', 'Jira sync'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: SUBTLE }}>
              <span style={{ color: ACCENT, fontWeight: 700 }}>✓</span> {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SystemDiagramHero() {
  return (
    <div style={{ position: 'relative', width: 420, height: 300 }}>
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {/* Capsule ↔ CRM */}
        <path d="M 120 90 C 120 150, 290 150, 290 90" stroke="rgba(0,82,204,0.2)" strokeWidth="1.5" fill="none" strokeDasharray="5 3"/>
        {/* Capsule ↔ Wiki */}
        <path d="M 80 110 C 80 200, 200 200, 200 170" stroke="rgba(101,84,192,0.2)" strokeWidth="1.5" fill="none" strokeDasharray="5 3"/>
        {/* CRM ↔ Wiki */}
        <path d="M 310 110 C 310 200, 230 200, 220 170" stroke="rgba(0,135,90,0.2)" strokeWidth="1.5" fill="none" strokeDasharray="5 3"/>
      </svg>

      {/* Capsule card */}
      <ProductMiniCard left={20} top={30} color={CAPSULE} symbol="⬡" name="bahn Capsule" desc="Visual execution" />
      {/* CRM card */}
      <ProductMiniCard left={240} top={30} color={CRM} symbol="◈" name="bahn CRM" desc="Revenue pipeline" />
      {/* Wiki card */}
      <ProductMiniCard left={130} top={180} color={WIKI} symbol="▦" name="bahn Wiki" desc="Connected docs" />

      {/* Center label */}
      <div style={{
        position: 'absolute', left: 160, top: 118,
        background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8,
        padding: '6px 12px', textAlign: 'center',
        boxShadow: '0 2px 8px rgba(9,30,66,0.1)',
      }}>
        <div style={{ fontSize: '0.5625rem', fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.08em' }}>bahnOS</div>
        <div style={{ fontSize: '0.5625rem', color: SUBTLE }}>Connected</div>
      </div>
    </div>
  )
}

function ProductMiniCard({ left, top, color, symbol, name, desc }) {
  return (
    <div style={{
      position: 'absolute', left, top, width: 130,
      background: SURFACE, border: `1px solid ${BORDER}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 8, padding: '10px 12px',
      boxShadow: '0 2px 10px rgba(9,30,66,0.1)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ color, fontSize: '0.875rem' }}>{symbol}</span>
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: BLUE }}>{name}</span>
      </div>
      <div style={{ fontSize: '0.5625rem', color: SUBTLE }}>{desc}</div>
    </div>
  )
}

// ─── Product strip ─────────────────────────────────────────────────────────────
const PRODUCTS = [
  { symbol: '⬡', name: 'bahn Capsule', color: CAPSULE, body: 'Visual operational workspace. Every node holds context, tickets, docs, and execution state in one place.' },
  { symbol: '◈', name: 'bahn CRM',     color: CRM,     body: 'Revenue pipeline connected to operations. Deals flow into Capsule implementation maps when they close.' },
  { symbol: '▦', name: 'bahn Wiki',    color: WIKI,    body: 'Documentation attached to work. Spec docs live next to the nodes they describe.' },
  { symbol: '⟳', name: 'Jira sync',   color: ACCENT,  body: 'Two-way sync between Capsule nodes and Jira issues. Push or pull with depth-mapped issue types.' },
  { symbol: '✓', name: 'Real-time collab', color: BLUE_LIGHT, body: 'Shared cursors, live edits, and role-based access control across all three products.' },
]

function ProductStrip() {
  return (
    <div style={{
      background: BLUE,
      display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      {PRODUCTS.map((p, i) => (
        <div key={p.name} style={{
          padding: '22px 20px',
          borderRight: i < PRODUCTS.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <div style={{ color: p.color, flexShrink: 0, marginTop: 2, fontSize: '1.125rem', lineHeight: 1 }}>{p.symbol}</div>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff', marginBottom: 3, lineHeight: 1.3 }}>{p.name}</div>
            <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.55 }}>{p.body}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── System diagram section ────────────────────────────────────────────────────
function SystemSection() {
  return (
    <div style={{ background: SURFACE, padding: '52px 56px', borderTop: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{ margin: '0 0 6px', fontSize: '0.6875rem', fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            THE SYSTEM
          </p>
          <h2 style={{ margin: '0 0 8px', fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', fontWeight: 800, color: BLUE, letterSpacing: '-0.02em' }}>
            How the three products connect
          </h2>
          <p style={{ margin: 0, fontSize: '0.9375rem', color: SUBTLE, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            Each product solves a real problem. Together they form a system where context never gets lost.
          </p>
        </div>

        {/* Product cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
          {[
            { symbol: '⬡', name: 'bahn Capsule', color: CAPSULE, to: '/capsule', desc: 'Visual operational workspace. Every node holds full execution context — tickets, docs, people, status all in one place.', features: ['Kanban & Sprint boards', 'Jira two-way sync', 'Timeline & Gantt', 'Real-time collaboration'] },
            { symbol: '◈', name: 'bahn CRM',     color: CRM,     to: '/crm-product', desc: 'Revenue pipeline connected to delivery. When a deal closes, the context flows into Capsule.', features: ['Visual pipeline', 'Contacts & orgs', 'Activity logging', 'Revenue forecasting'] },
            { symbol: '▦', name: 'bahn Wiki',    color: WIKI,    to: '/wiki', desc: 'Documentation attached to the work it describes. Specs link to nodes; guides link to deals.', features: ['Rich text editor', 'Spaces & hierarchy', 'Version history', 'Page comments'] },
          ].map((p, i) => (
            <div key={i} style={{ background: BG, border: `1px solid ${BORDER}`, borderTop: `3px solid ${p.color}`, borderRadius: 8, padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ color: p.color, fontSize: '1.125rem' }}>{p.symbol}</span>
                <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: BLUE }}>{p.name}</span>
              </div>
              <p style={{ margin: '0 0 16px', fontSize: '0.8125rem', color: SUBTLE, lineHeight: 1.6 }}>{p.desc}</p>
              <ul style={{ margin: '0 0 18px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {p.features.map((f, j) => (
                  <li key={j} style={{ display: 'flex', gap: 6, fontSize: '0.75rem', color: SUBTLE }}>
                    <span style={{ color: p.color, fontWeight: 700 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link to={p.to} style={{ fontSize: '0.8125rem', fontWeight: 600, color: p.color, textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
                onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
              >Learn more →</Link>
            </div>
          ))}
        </div>

        {/* Connection arrows */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { from: 'CRM', to: 'Capsule', fromColor: CRM,     toColor: CAPSULE, desc: 'A won deal creates a Capsule implementation map with full deal context attached.' },
            { from: 'Capsule', to: 'Wiki', fromColor: CAPSULE, toColor: WIKI,    desc: 'A Capsule node links directly to its spec doc, runbook, or design notes in Wiki.' },
            { from: 'Wiki', to: 'CRM',    fromColor: WIKI,    toColor: CRM,     desc: 'Onboarding and delivery guides in Wiki stay attached to the deal that triggered them.' },
          ].map((conn, i) => (
            <div key={i} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: conn.fromColor, background: `${conn.fromColor}15`, padding: '1px 7px', borderRadius: 3 }}>{conn.from}</span>
                <span style={{ color: '#97A0AF' }}>→</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: conn.toColor, background: `${conn.toColor}15`, padding: '1px 7px', borderRadius: 3 }}>{conn.to}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: SUBTLE, lineHeight: 1.55 }}>{conn.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Connection flows ──────────────────────────────────────────────────────────
const FLOWS = [
  {
    id: 'sales',
    label: 'Sales to delivery',
    steps: [
      { name: 'CRM Deal', product: 'CRM',     color: CRM,     desc: 'Acme Corp closes at $120k ARR. Full contact and requirement notes on record.' },
      { name: 'Capsule Map', product: 'Capsule', color: CAPSULE, desc: 'Implementation plan created from deal context. Nodes pre-populated from requirements.' },
      { name: 'Sprint Tickets', product: 'Capsule', color: CAPSULE, desc: 'Nodes assigned to Q3 sprint. Status tracked on Kanban board.' },
      { name: 'Jira Issues', product: 'Jira',  color: ACCENT,  desc: 'Pushed to Jira as Epics, Stories, and Subtasks. Two-way status sync.' },
    ],
  },
  {
    id: 'roadmap',
    label: 'Roadmap to execution',
    steps: [
      { name: 'Roadmap Node', product: 'Capsule', color: CAPSULE, desc: 'SSO Integration added to Q3 product roadmap. Owner and due date set.' },
      { name: 'Spec doc', product: 'Wiki', color: WIKI,    desc: 'Technical spec written in Wiki and linked directly to the Capsule node.' },
      { name: 'Sprint subtasks', product: 'Capsule', color: CAPSULE, desc: 'Node broken into sprint-scoped subtasks. Story points estimated.' },
      { name: 'Delivered', product: 'Capsule', color: CRM,     desc: 'Status propagates back up the tree automatically on completion.' },
    ],
  },
]

function ConnectionFlowsSection() {
  const [active, setActive] = useState('sales')
  const flow = FLOWS.find(f => f.id === active)

  return (
    <div style={{ background: BG, borderTop: `1px solid ${BORDER}`, padding: '52px 56px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <p style={{ margin: '0 0 6px', fontSize: '0.6875rem', fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            CONNECTED FLOWS
          </p>
          <h2 style={{ margin: '0 0 8px', fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', fontWeight: 800, color: BLUE, letterSpacing: '-0.02em' }}>
            Context doesn't get lost between tools.
          </h2>
          <p style={{ margin: 0, fontSize: '0.9375rem', color: SUBTLE, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            End-to-end workflows that span multiple products — with full context at every handoff.
          </p>
        </div>

        {/* tab switcher */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
          {FLOWS.map(f => (
            <button key={f.id} onClick={() => setActive(f.id)}
              style={{
                padding: '8px 20px', borderRadius: 6, cursor: 'pointer',
                fontSize: '0.8125rem', fontWeight: active === f.id ? 600 : 400,
                background: active === f.id ? BLUE : BG,
                color: active === f.id ? '#fff' : SUBTLE,
                border: `1px solid ${active === f.id ? BLUE : BORDER}`,
                transition: 'all 0.15s',
              }}
            >{f.label}</button>
          ))}
        </div>

        {/* flow steps */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {flow.steps.map((step, i) => (
            <div key={i} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderTop: `3px solid ${step.color}`, borderRadius: 8, padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '0.625rem', fontWeight: 700, color: step.color, background: `${step.color}15`, padding: '1px 6px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{step.product}</span>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#C1C7D0' }}>0{i + 1}</span>
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: BLUE, marginBottom: 6 }}>{step.name}</div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: SUBTLE, lineHeight: 1.55 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Why connected ─────────────────────────────────────────────────────────────
function WhyConnectedSection() {
  return (
    <div style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, padding: '52px 56px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{ margin: '0 0 6px', fontSize: '0.6875rem', fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            THE MULTIPLIER
          </p>
          <h2 style={{ margin: '0 0 8px', fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', fontWeight: 800, color: BLUE, letterSpacing: '-0.02em' }}>
            Powerful independently.<br />Exponentially better together.
          </h2>
          <p style={{ margin: 0, fontSize: '0.9375rem', color: SUBTLE, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
            Start with one product. Add others when you need them. Each connection you make
            multiplies the value of everything already in the system.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {[
            { icon: '🔄', title: 'No context-switching', desc: 'Planning, revenue, and docs live in one workspace. No copy-pasting context between a PM tool, a CRM, and a wiki.' },
            { icon: '🤝', title: 'No delivery amnesia',  desc: "When a deal closes, delivery doesn't lose context. The CRM story flows into the implementation map." },
            { icon: '📎', title: 'Docs attached to work', desc: 'Specs live next to the nodes they describe. Implementation guides stay attached to the deals that need them.' },
            { icon: '✅', title: 'Single source of truth', desc: 'Status, ownership, and context tracked in one place — not reconciled across three separate tools every Monday.' },
          ].map((item, i) => (
            <div key={i} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '20px 22px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.25rem', lineHeight: 1, flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: BLUE, marginBottom: 5 }}>{item.title}</div>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: SUBTLE, lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Entry points section ──────────────────────────────────────────────────────
function EntryPointsSection({ onStartCapsule, onStartCRM, onStartWiki, onGetStarted }) {
  const handlers = [onStartCapsule, onStartCRM, onStartWiki]
  return (
    <div style={{ background: BG, borderTop: `1px solid ${BORDER}`, padding: '52px 56px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <p style={{ margin: '0 0 6px', fontSize: '0.6875rem', fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            START HERE
          </p>
          <h2 style={{ margin: '0 0 8px', fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', fontWeight: 800, color: BLUE, letterSpacing: '-0.02em' }}>
            Start with one. Grow into the system.
          </h2>
          <p style={{ margin: 0, fontSize: '0.9375rem', color: SUBTLE, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
            Every path leads to the same connected workspace. Pick the one that fits today.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
          {[
            { symbol: '⬡', name: 'bahn Capsule', color: CAPSULE, to: '/capsule', desc: 'Visual execution workspace. Start with planning and sprints.', cta: 'Start with Capsule' },
            { symbol: '◈', name: 'bahn CRM',     color: CRM,     to: '/crm-product', desc: 'Revenue pipeline. Start with managing your deals and contacts.', cta: 'Start with CRM' },
            { symbol: '▦', name: 'bahn Wiki',    color: WIKI,    to: '/wiki', desc: 'Connected docs. Start with organizing your team knowledge.', cta: 'Start with Wiki' },
          ].map((p, i) => (
            <div key={i} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ color: p.color, fontSize: '1.125rem' }}>{p.symbol}</span>
                <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: BLUE }}>{p.name}</span>
              </div>
              <p style={{ margin: '0 0 20px', fontSize: '0.8125rem', color: SUBTLE, lineHeight: 1.6, flex: 1 }}>{p.desc}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handlers[i]}
                  style={{ flex: 1, background: p.color, color: '#fff', border: 'none', borderRadius: 3, padding: '8px 12px', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', transition: 'opacity 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                >{p.cta}</button>
                <Link to={p.to}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'none', color: SUBTLE, border: `1px solid ${BORDER}`, borderRadius: 3, padding: '8px 12px', fontSize: '0.75rem', fontWeight: 500, textDecoration: 'none', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.color = BLUE }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = SUBTLE }}
                >Learn more</Link>
              </div>
            </div>
          ))}
        </div>

        {/* Full system card */}
        <div style={{ background: BLUE, borderRadius: 8, padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Full system</div>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.125rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Try the full connected workspace</h3>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, maxWidth: 440 }}>
              Capsule + CRM + Wiki working together. One account, all three products, free to start.
            </p>
          </div>
          <button onClick={onGetStarted}
            style={{ background: '#fff', color: BLUE, border: 'none', borderRadius: 3, padding: '12px 28px', fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 16px rgba(0,0,0,0.18)', transition: 'background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#DEEBFF' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
          >Get started free →</button>
        </div>
      </div>
    </div>
  )
}

// ─── CTA band ──────────────────────────────────────────────────────────────────
function CTABand({ onGetStarted }) {
  return (
    <div style={{ background: BLUE, padding: '64px 56px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 14 }}>
          GET STARTED
        </p>
        <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', lineHeight: 1.15, marginBottom: 14 }}>
          One system.<br /><span style={{ color: BLUE_LIGHT }}>Zero context lost.</span>
        </h2>
        <p style={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, maxWidth: 480, margin: '0 auto 32px' }}>
          Free to start. No credit card required. All three products in one account.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
          <button onClick={onGetStarted}
            style={{ background: '#fff', color: BLUE, border: 'none', fontWeight: 700, fontSize: '0.9375rem', borderRadius: 3, padding: '12px 28px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.18)', transition: 'background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#DEEBFF' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
          >Try the full system →</button>
          <Link to="/"
            style={{ display: 'inline-flex', alignItems: 'center', background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,0.35)', fontWeight: 500, fontSize: '0.9375rem', borderRadius: 3, padding: '12px 24px', textDecoration: 'none', transition: 'border-color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)' }}
          >Back to home</Link>
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
export default function PlatformPage() {
  const { isAuthenticated } = useAuth()
  const { openRegister } = useAuthModal()
  const navigate = useNavigate()

  const goTo = (appPath) => {
    if (isAuthenticated) navigate(appPath)
    else openRegister()
  }

  return (
    <div style={{ background: BG, color: BLUE, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", minHeight: '100vh' }}>
      <Navbar />
      <HeroBanner onGetStarted={() => goTo('/app/canvas')} />
      <ProductStrip />
      <SystemSection />
      <ConnectionFlowsSection />
      <WhyConnectedSection />
      <EntryPointsSection
        onStartCapsule={() => goTo('/app/canvas')}
        onStartCRM={() => goTo('/app/crm')}
        onStartWiki={() => goTo('/app/docs')}
        onGetStarted={() => goTo('/app/canvas')}
      />
      <CTABand onGetStarted={() => goTo('/app/canvas')} />
      <Footer />
    </div>
  )
}
