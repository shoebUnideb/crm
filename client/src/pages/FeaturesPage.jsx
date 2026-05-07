import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/landing/Navbar.jsx'
import Footer from '../components/landing/Footer.jsx'

const blue      = '#0052CC'
const blueHover = '#0065FF'
const blueLight = '#DEEBFF'
const bluePale  = '#4C9AFF'
const navy      = '#172B4D'
const heroBlue  = '#0747A6'
const bg        = '#FAFBFC'
const surface   = '#FFFFFF'
const subtle    = '#5E6C84'
const border    = '#DFE1E6'

function SectionLabel({ children, dark = false }) {
  return (
    <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: dark ? bluePale : blue, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ display: 'inline-block', width: 28, height: 2, background: dark ? bluePale : blue, borderRadius: 2, flexShrink: 0 }} />
      {children}
    </p>
  )
}

const FEATURE_CARDS = [
  { tag: 'Canvas', title: 'Mind mapping', desc: 'Infinite canvas with drag-and-drop nodes, free-form edges, custom shapes, color coding, sticky notes, and collapsible frames. One-click auto-layout.', color: blue },
  { tag: 'Views', title: 'Multiple project views', desc: 'Switch between Kanban, Table, Timeline, Gantt, Sprint Board, Burndown, and Swimlanes — all driven by the same data.', color: '#6554C0' },
  { tag: 'Sync', title: 'Jira integration', desc: 'Push nodes to Jira as issues with full metadata. Pull issues back via JQL queries. Keep canvas and backlog in two-way sync.', color: '#00875A' },
  { tag: 'Collab', title: 'Real-time collaboration', desc: 'WebSocket sync means every teammate sees changes instantly. Live cursors show who is working where. Role-based access control.', color: '#FF991F' },
  { tag: 'CRM', title: 'Built-in CRM Pipeline', desc: 'Track every deal from Lead to Closed Won without leaving the app. Drag-and-drop Kanban board with deal value, contact info, next actions, and live win-rate stats.', color: '#00875A' },
  { tag: 'Export', title: 'Export & share', desc: 'Export as PNG, SVG, CSV, Markdown, or Confluence markup. Generate read-only shareable links for stakeholders.', color: '#0065FF' },
]

const ALL_FEATURES = [
  'Undo / Redo (deep history)', 'Auto layout engine', 'Mind map (radial) layout',
  'Snap to grid', 'Curved & straight edges', 'Edge labels', 'Collapsible frames',
  'Sticky notes', 'Node templates', 'Custom metadata fields',
  'Activity log with timestamps', 'Named snapshots', 'Webhook triggers',
  'Kanban board', 'Gantt chart', 'Sprint board', 'Burndown chart',
  'Timeline view', 'Swimlanes', 'Critical path', 'Priority heatmap',
  'Node checklists', 'Node reactions', 'Node locking', 'Groups',
  'CRM Pipeline (Lead → Won)', 'Deal drag-and-drop', 'Win rate stats',
]

function FeatureCard({ tag, title, desc, color, featured, wide }) {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: featured ? '44px 38px' : wide ? '32px 40px' : '28px 24px',
        background: hov ? blueLight : surface,
        border: `1px solid ${hov ? color : border}`,
        borderTop: `3px solid ${color}`,
        borderRadius: 8,
        height: '100%', boxSizing: 'border-box',
        display: 'flex', flexDirection: wide ? 'row' : 'column',
        alignItems: wide ? 'center' : 'flex-start', gap: wide ? 56 : 0,
        transition: 'background 0.18s, border-color 0.18s, box-shadow 0.18s',
        boxShadow: hov ? '0 6px 24px rgba(9,30,66,0.1)' : 'none',
        position: 'relative', overflow: 'hidden',
      }}>
      {featured && (
        <div style={{ position: 'absolute', right: -4, bottom: -8, fontSize: 80, opacity: 0.04, userSelect: 'none', pointerEvents: 'none', fontWeight: 900, color, lineHeight: 1 }}>{tag}</div>
      )}
      <div style={{ flexShrink: 0 }}>
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color, background: color + '15', padding: '3px 10px', borderRadius: 3, display: 'inline-block', marginBottom: wide ? 0 : 16 }}>{tag}</span>
      </div>
      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <h3 style={{ fontSize: featured ? '1.25rem' : '1rem', fontWeight: 700, color: navy, marginBottom: 10, lineHeight: 1.3 }}>{title}</h3>
        <p style={{ fontSize: '0.8125rem', color: subtle, lineHeight: 1.75, margin: 0 }}>{desc}</p>
      </div>
    </div>
  )
}

export default function FeaturesPage() {
  return (
    <div style={{ background: surface, color: navy, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", overflowX: 'hidden' }}>
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section style={{ background: heroBlue, minHeight: '52vh', display: 'flex', alignItems: 'center', padding: '0 8vw', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(76,154,255,0.15) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: '-2%', bottom: '5%', fontSize: 'clamp(70px, 12vw, 160px)', fontWeight: 900, color: 'rgba(255,255,255,0.04)', letterSpacing: '-0.04em', lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>FEATURES</div>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 680 }}>
          <SectionLabel dark>Features</SectionLabel>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.08, marginBottom: 22, color: '#fff' }}>
            Every feature your<br /><span style={{ color: bluePale }}>team needs</span>
          </h1>
          <p style={{ fontSize: '1.0625rem', color: 'rgba(255,255,255,0.68)', lineHeight: 1.78, maxWidth: 500, margin: '0 0 32px' }}>
            A complete toolkit for visual planning — from first sketch to shipped sprint. Free, forever.
          </p>
          <Link to="/register" style={{ background: '#fff', color: heroBlue, textDecoration: 'none', fontWeight: 700, fontSize: '0.9375rem', borderRadius: 4, padding: '12px 28px', display: 'inline-block', transition: 'background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = blueLight }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}>
            Start free — no card needed
          </Link>
        </div>
      </section>

      {/* ── FEATURE CARDS — asymmetric grid ──────────────────────────────────── */}
      <section style={{ background: bg, padding: '96px 0', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 6vw' }}>
          <div style={{ marginBottom: 56 }}>
            <SectionLabel>Core capabilities</SectionLabel>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.75rem)', fontWeight: 800, letterSpacing: '-0.03em', color: navy, lineHeight: 1.15 }}>
              One canvas, every view
            </h2>
          </div>

          {/* Row 1: featured (2fr) + card (1fr) */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ height: '100%' }}>
              <FeatureCard {...FEATURE_CARDS[0]} featured />
            </div>
            <div style={{ height: '100%' }}>
              <FeatureCard {...FEATURE_CARDS[1]} />
            </div>
          </div>

          {/* Row 2: three equal */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
            {FEATURE_CARDS.slice(2, 5).map((f, i) => (
              <div key={f.title} style={{ height: '100%' }}>
                <FeatureCard {...f} />
              </div>
            ))}
          </div>

          {/* Row 3: full-width horizontal */}
          <FeatureCard {...FEATURE_CARDS[5]} wide />
        </div>
      </section>

      {/* ── FULL LIST ────────────────────────────────────────────────────────── */}
      <section style={{ background: surface, padding: '96px 0', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 6vw' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0 80px', alignItems: 'start', marginBottom: 56 }}>
            <div>
              <SectionLabel>Everything in the box</SectionLabel>
              <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.03em', color: navy, lineHeight: 1.2, margin: '0 0 16px' }}>
                No hidden tiers
              </h2>
              <p style={{ fontSize: '0.9375rem', color: subtle, lineHeight: 1.75, margin: 0 }}>
                Every feature below is available on the free plan. No paywalls, no upgrade prompts.
              </p>
            </div>
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden', background: border }}>
                {ALL_FEATURES.map((feat, i) => (
                  <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', background: i % 2 === 0 ? surface : bg }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                      <circle cx="8" cy="8" r="7" fill={blueLight} />
                      <path d="M5 8l2 2 4-4" stroke={blue} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span style={{ fontSize: '0.8125rem', color: navy }}>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARISON — full bleed 3 columns ────────────────────────────────── */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
        {/* Without */}
        <div style={{ background: '#FFF8F6', borderTop: `4px solid #FF5630`, padding: '72px 5vw', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#DE350B', marginBottom: 24 }}>✕ Without bahnOS</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 13 }}>
            {['Whiteboard tool', 'Project tracker', 'Docs tool', 'Spreadsheets', 'Standup notes'].map(item => (
              <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9375rem', color: subtle }}>
                <span style={{ color: '#DE350B', fontWeight: 700, flexShrink: 0 }}>✕</span>{item}
              </li>
            ))}
          </ul>
        </div>

        {/* With */}
        <div style={{ background: '#F0FFF8', borderTop: `4px solid #36B37E`, padding: '72px 5vw', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#006644', marginBottom: 24 }}>✓ With bahnOS</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 13 }}>
            {['Infinite mind-map canvas', 'Kanban + Gantt + Timeline', 'Jira two-way sync', 'Export to Confluence/CSV', 'Real-time collab'].map(item => (
              <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9375rem', color: navy }}>
                <span style={{ color: '#006644', fontWeight: 700, flexShrink: 0 }}>✓</span>{item}
              </li>
            ))}
          </ul>
        </div>

        {/* Saved */}
        <div style={{ background: blueLight, borderTop: `4px solid ${blue}`, padding: '72px 5vw', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: heroBlue, marginBottom: 24 }}>→ What you save</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 13 }}>
            {['3–4 subscriptions', 'Context switching', 'Manual sync', 'Onboarding time', 'Missed updates'].map(item => (
              <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9375rem', color: navy }}>
                <span style={{ color: blue, fontWeight: 700, flexShrink: 0 }}>→</span>{item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section style={{ background: heroBlue, padding: '96px 6vw', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(76,154,255,0.15) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 3.25rem)', fontWeight: 900, letterSpacing: '-0.04em', color: '#fff', marginBottom: 16, lineHeight: 1.1 }}>
            All features.<br /><span style={{ color: bluePale }}>No paywalls.</span>
          </h2>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.65)', marginBottom: 32, lineHeight: 1.75 }}>
            Start building your first mind map in seconds.
          </p>
          <Link to="/register" style={{ background: '#fff', color: heroBlue, textDecoration: 'none', fontWeight: 700, fontSize: '1rem', borderRadius: 4, padding: '13px 34px', display: 'inline-block', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', transition: 'background 0.15s, transform 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = blueLight; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'none' }}>
            Get it free
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
