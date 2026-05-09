import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/landing/Navbar.jsx'
import Footer from '../components/landing/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'

// ── palette ───────────────────────────────────────────────────────────────────
const blue      = '#0052CC'
const blueLight = '#DEEBFF'
const blueHover = '#0065FF'
const bluePale  = '#4C9AFF'
const navy      = '#172B4D'
const heroBlue  = '#0747A6'
const bg        = '#FAFBFC'
const surface   = '#FFFFFF'
const subtle    = '#5E6C84'
const border    = '#DFE1E6'

// ── section label row (blue line + text) ─────────────────────────────────────
function SectionLabel({ children, dark = false }) {
  return (
    <p style={{
      fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: dark ? bluePale : blue,
      marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ display: 'inline-block', width: 28, height: 2, background: dark ? bluePale : blue, borderRadius: 2, flexShrink: 0 }} />
      {children}
    </p>
  )
}

// ── decorative node-graph SVG ─────────────────────────────────────────────────
function NodeGraph() {
  return (
    <svg width="420" height="320" viewBox="0 0 420 320" fill="none" aria-hidden="true"
      style={{ position: 'absolute', right: '4vw', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.55 }}>
      <line x1="210" y1="160" x2="90"  y2="72"  stroke="rgba(76,154,255,0.3)" strokeWidth="1.5"/>
      <line x1="210" y1="160" x2="340" y2="60"  stroke="rgba(76,154,255,0.3)" strokeWidth="1.5"/>
      <line x1="210" y1="160" x2="360" y2="215" stroke="rgba(76,154,255,0.3)" strokeWidth="1.5"/>
      <line x1="210" y1="160" x2="65"  y2="240" stroke="rgba(76,154,255,0.3)" strokeWidth="1.5"/>
      <line x1="210" y1="160" x2="210" y2="278" stroke="rgba(76,154,255,0.3)" strokeWidth="1.5"/>
      <line x1="90"  y1="72"  x2="35"  y2="115" stroke="rgba(76,154,255,0.15)" strokeWidth="1"/>
      <line x1="340" y1="60"  x2="390" y2="28"  stroke="rgba(76,154,255,0.15)" strokeWidth="1"/>
      <line x1="360" y1="215" x2="395" y2="272" stroke="rgba(76,154,255,0.15)" strokeWidth="1"/>
      <circle cx="210" cy="160" r="16" fill="rgba(0,82,204,0.55)"  stroke="rgba(76,154,255,0.6)" strokeWidth="2"/>
      <circle cx="90"  cy="72"  r="10" fill="rgba(0,82,204,0.3)"  stroke="rgba(76,154,255,0.4)" strokeWidth="1.5"/>
      <circle cx="340" cy="60"  r="10" fill="rgba(0,82,204,0.3)"  stroke="rgba(76,154,255,0.4)" strokeWidth="1.5"/>
      <circle cx="360" cy="215" r="10" fill="rgba(0,82,204,0.3)"  stroke="rgba(76,154,255,0.4)" strokeWidth="1.5"/>
      <circle cx="65"  cy="240" r="10" fill="rgba(0,82,204,0.3)"  stroke="rgba(76,154,255,0.4)" strokeWidth="1.5"/>
      <circle cx="210" cy="278" r="10" fill="rgba(0,82,204,0.3)"  stroke="rgba(76,154,255,0.4)" strokeWidth="1.5"/>
      <circle cx="35"  cy="115" r="7"  fill="rgba(0,82,204,0.2)"  stroke="rgba(76,154,255,0.3)" strokeWidth="1"/>
      <circle cx="390" cy="28"  r="7"  fill="rgba(0,82,204,0.2)"  stroke="rgba(76,154,255,0.3)" strokeWidth="1"/>
      <circle cx="395" cy="272" r="7"  fill="rgba(0,82,204,0.2)"  stroke="rgba(76,154,255,0.3)" strokeWidth="1"/>
      <text x="210" y="165" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.8)" fontWeight="700">B</text>
    </svg>
  )
}

// ── Problem card ──────────────────────────────────────────────────────────────
function ProblemCard({ icon, title, body, accent, accentBg, wide, big }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? surface : bg,
        border: `1px solid ${hov ? accent + '55' : border}`,
        borderLeft: `4px solid ${accent}`,
        borderRadius: 8,
        padding: big ? '36px 32px' : wide ? '30px 32px' : '28px 24px',
        height: '100%', boxSizing: 'border-box',
        display: 'flex', flexDirection: wide ? 'row' : 'column',
        alignItems: wide ? 'center' : 'flex-start',
        gap: wide ? 40 : 0,
        transition: 'background 0.18s, border-color 0.18s, box-shadow 0.18s',
        boxShadow: hov ? `0 4px 20px rgba(9,30,66,0.1)` : 'none',
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: big ? '2.25rem' : '1.625rem', marginBottom: wide ? 0 : 14 }}>{icon}</div>
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: big ? '1.125rem' : '0.9375rem', fontWeight: 700, color: navy, marginBottom: 8, lineHeight: 1.35 }}>{title}</h3>
        <p style={{ fontSize: '0.8125rem', color: subtle, lineHeight: 1.75, margin: 0 }}>{body}</p>
      </div>
    </div>
  )
}

// ── Use-case card ─────────────────────────────────────────────────────────────
function UseCaseCard({ emoji, label, who, body, color, featured }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? blueLight : surface,
        border: `1px solid ${hov ? color : border}`,
        borderRadius: 8,
        padding: featured ? '44px 38px' : '28px 24px',
        height: '100%', boxSizing: 'border-box',
        transition: 'background 0.18s, border-color 0.18s, box-shadow 0.18s',
        boxShadow: hov ? `0 6px 24px rgba(9,30,66,0.12)` : 'none',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {featured && (
        <div style={{
          position: 'absolute', right: -8, bottom: -12,
          fontSize: 96, opacity: 0.06, userSelect: 'none', pointerEvents: 'none', lineHeight: 1,
        }}>{emoji}</div>
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: featured ? '2.25rem' : '1.5rem', marginBottom: featured ? 20 : 14 }}>{emoji}</div>
        <p style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color, marginBottom: 6 }}>{who}</p>
        <h3 style={{ fontSize: featured ? '1.25rem' : '0.9375rem', fontWeight: 700, color: navy, marginBottom: 10, lineHeight: 1.3 }}>{label}</h3>
        <p style={{ fontSize: '0.8125rem', color: subtle, lineHeight: 1.75, margin: 0 }}>{body}</p>
      </div>
    </div>
  )
}

// ── Why-now card ──────────────────────────────────────────────────────────────
function WhyNowCard({ num, title, body, color }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '48px 44px', position: 'relative', overflow: 'hidden',
        background: hov ? surface : bg,
        border: `1px solid ${border}`,
        borderTop: `3px solid ${hov ? color : border}`,
        borderRadius: 8, transition: 'background 0.18s, border-color 0.18s, box-shadow 0.18s',
        boxShadow: hov ? `0 4px 20px rgba(9,30,66,0.1)` : 'none',
      }}
    >
      <div style={{
        position: 'absolute', right: 20, top: 12,
        fontSize: 110, fontWeight: 900, color: color + '10',
        letterSpacing: '-0.05em', lineHeight: 1,
        userSelect: 'none', pointerEvents: 'none',
      }}>{num}</div>
      <p style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', color, marginBottom: 14, textTransform: 'uppercase' }}>{num}</p>
      <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: navy, marginBottom: 12, lineHeight: 1.4, position: 'relative', zIndex: 1 }}>{title}</h3>
      <p style={{ fontSize: '0.875rem', color: subtle, lineHeight: 1.75, margin: 0 }}>{body}</p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { isAuthenticated, user } = useAuth()

  const problems = [
    { icon: '🧠→🎫', title: 'Ideas die in translation', body: "A beautiful Miro board gets manually re-typed into Jira. By the time it's tickets, the intent — the 'why' — is already gone. Teams lose 30–40% of planning context at this handoff.", accent: '#FF5630', accentBg: '#FFF3F0' },
    { icon: '🔀', title: 'Five tools, zero coherence', body: "The average software team uses 5+ disconnected tools. Decisions live in Slack threads. Specs in Notion. Tasks in Jira. None of them know what the others are doing.", accent: '#FF991F', accentBg: '#FFFAE6' },
    { icon: '🕳', title: 'Visual context collapses', body: "Three sprints later, nobody remembers why the architecture decision was made. The whiteboard was erased. The Jira ticket just says 'Refactor auth.' The thinking is gone forever.", accent: '#6554C0', accentBg: '#F3F0FF' },
    { icon: '⏱', title: 'Sprint planning takes hours', body: "You map work in a retro, then spend another hour recreating it as Jira tickets. That's not planning — that's data entry. Teams waste 2–4 hours per sprint on this alone.", accent: '#00875A', accentBg: '#E3FCEF' },
    { icon: '🔒', title: 'Jira locks you into its mental model', body: "Jira thinks in lists. Your team thinks in trees, clusters, and relationships. Forcing spatial thinking into a flat backlog creates backlogs nobody reads.", accent: '#0052CC', accentBg: '#DEEBFF' },
    { icon: '📉', title: 'Docs go stale the moment you write them', body: "Confluence pages are outdated by the next sprint. Nobody updates them. Teams build on incorrect assumptions because nobody trusts the documentation.", accent: '#DE350B', accentBg: '#FFEBE6' },
  ]

  const useCases = [
    { emoji: '🗓', label: 'Sprint Planning', who: 'Engineering teams', body: "Map the sprint on a canvas, assign story points node-by-node, and push the entire sprint to Jira in a single click. What used to take 3 hours takes 20 minutes.", color: blue },
    { emoji: '🗺', label: 'Product Roadmap', who: 'Product managers', body: "Build a living roadmap your whole team can see. Drag to reprioritize, link nodes to Jira epics, and watch ticket statuses reflect back in real time.", color: '#6554C0' },
    { emoji: '🏗', label: 'Architecture Review', who: 'Tech leads & architects', body: "Diagram system dependencies visually. Flag components that need work as Jira issues without leaving the diagram. ADRs stay attached to the thing they describe.", color: '#00875A' },
    { emoji: '🎯', label: 'OKR → Ticket Mapping', who: 'Leadership & teams', body: "Connect company objectives to key results to Jira epics to individual tickets. Everyone sees how their work connects to the mission.", color: '#FF5630' },
    { emoji: '🚨', label: 'Incident Response', who: 'On-call & SRE teams', body: "Map the blast radius of an incident visually. Spin up Jira tasks for each mitigation step. Track resolution in real time with the team on the same canvas.", color: '#DE350B' },
    { emoji: '🧩', label: 'Feature Discovery', who: 'Designers & PMs', body: "Run a discovery session as a mind map. Cluster user needs, then promote winning ideas straight to the backlog with full context preserved.", color: '#FF991F' },
    { emoji: '🚀', label: 'Launch Planning', who: 'Cross-functional teams', body: "Coordinate marketing, engineering, and ops on one canvas. Set dependencies, track every launch task in Jira, and see the critical path without a separate tool.", color: blue },
    { emoji: '🤝', label: 'Client Deliverables', who: 'Agencies & consultants', body: "Present a visual project plan to clients, then convert approved items into tracked Jira tickets. Clients see the plan. The team sees the backlog. Both stay in sync.", color: '#253858' },
    { emoji: '📚', label: 'Onboarding', who: 'New hires & managers', body: "Give new engineers a visual map of the codebase, product, and team structure. Every node links to a Jira epic, a Confluence page, or an existing ticket. Context, delivered.", color: '#36B37E' },
  ]

  const whyNow = [
    { num: '01', title: 'Remote & async killed the whiteboard', body: "Teams can't stand at a physical board anymore. They need spatial thinking tools that are digital-native, not scanned images in Confluence.", color: blue },
    { num: '02', title: 'Jira fatigue is at an all-time high', body: "Developers actively avoid Jira because it doesn't match how they think. Any tool that makes Jira feel lighter immediately wins developer adoption.", color: '#6554C0' },
    { num: '03', title: 'SaaS consolidation is the new mandate', body: "Finance teams are cutting tool budgets. Every product that replaces 3+ subscriptions with one is a fast yes from procurement.", color: '#00875A' },
    { num: '04', title: 'AI makes visual planning smarter', body: "Visual structure is the perfect substrate for AI — bahnOS's canvas can generate breakdowns, suggest dependencies, and auto-draft Jira issues from a sketch.", color: '#FF5630' },
  ]

  return (
    <div style={{ background: surface, color: navy, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", overflowX: 'hidden' }}>
      <Navbar />

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '92vh', background: heroBlue,
        display: 'flex', alignItems: 'center',
        padding: '0 8vw', position: 'relative', overflow: 'hidden',
      }}>
        {/* Soft radial glow */}
        <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(76,154,255,0.18) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-25%', left: '-8%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,82,204,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        {/* Ghost word */}
        <div style={{ position: 'absolute', right: '-1%', bottom: '8%', fontSize: 'clamp(100px, 16vw, 200px)', fontWeight: 900, color: 'rgba(255,255,255,0.04)', letterSpacing: '-0.04em', lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>
          BAHN
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 700 }}>
          <SectionLabel dark>The future of project planning</SectionLabel>
          <h1 style={{ fontSize: 'clamp(2.25rem, 5.5vw, 4.5rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.08, marginBottom: 26, color: '#fff' }}>
            Think visually.<br />
            <span style={{ color: bluePale }}>Execute</span> in Jira.<br />
            Stay in one place.
          </h1>
          <p style={{ fontSize: '1.0625rem', color: 'rgba(255,255,255,0.72)', lineHeight: 1.8, maxWidth: 520, marginBottom: 40 }}>
            bahnOS closes the gap between how teams <em style={{ color: '#fff', fontStyle: 'normal', fontWeight: 600 }}>think</em> about work and how they <em style={{ color: '#fff', fontStyle: 'normal', fontWeight: 600 }}>track</em> it — a visual canvas that syncs live with existing solutions so nothing gets lost in translation.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {isAuthenticated ? (
              <>
                <Link to="/canvas" style={{ background: '#fff', color: heroBlue, textDecoration: 'none', fontWeight: 700, fontSize: '0.9375rem', borderRadius: 4, padding: '12px 28px', transition: 'background 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = blueLight }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}>
                  Open your workspace →
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" style={{ background: '#fff', color: heroBlue, textDecoration: 'none', fontWeight: 700, fontSize: '0.9375rem', borderRadius: 4, padding: '12px 28px', transition: 'background 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = blueLight }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}>
                  Start free — no card needed
                </Link>
                <Link to="/features" style={{ background: 'transparent', color: '#fff', textDecoration: 'none', fontWeight: 500, fontSize: '0.9375rem', borderRadius: 4, padding: '12px 28px', border: '2px solid rgba(255,255,255,0.35)', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)' }}>
                  See all features →
                </Link>
              </>
            )}
          </div>
          <p style={{ marginTop: 18, fontSize: '0.8125rem', color: 'rgba(255,255,255,0.38)' }}>
            {isAuthenticated ? `Signed in as ${user?.email}` : 'Free forever · No credit card required'}
          </p>
        </div>

        <NodeGraph />

        {/* Scroll cue */}
        <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: 0.3 }}>
          <span style={{ fontSize: '0.625rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff' }}>Scroll</span>
          <div style={{ width: 1, height: 36, background: 'linear-gradient(to bottom, rgba(255,255,255,0.7), transparent)' }} />
        </div>
      </section>

      {/* ── PROBLEMS ────────────────────────────────────────────────────────── */}
      <section style={{ background: bg, padding: '96px 0', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 6vw' }}>

          {/* Header: left heading, right body — unequal columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '0 60px', alignItems: 'end', marginBottom: 56 }}>
            <div>
              <SectionLabel>The problem nobody talks about</SectionLabel>
              <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.75rem)', fontWeight: 800, letterSpacing: '-0.03em', color: navy, lineHeight: 1.15, margin: 0 }}>
                Modern teams are drowning in tool debt
              </h2>
            </div>
            <div>
              <p style={{ fontSize: '0.9375rem', color: subtle, lineHeight: 1.8, margin: 0 }}>
                You plan in Miro. Track in Jira. Document in Confluence. Brief in Slack.
                Every handoff is a leak — context evaporates, updates go stale, and the sprint kicks off already out of sync.
              </p>
            </div>
          </div>

          {/* Row 1: wide (3fr) + narrow (2fr) */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20, marginBottom: 20 }}>
            <div style={{ height: '100%' }}>
              <ProblemCard {...problems[0]} big />
            </div>
            <div style={{ height: '100%' }}>
              <ProblemCard {...problems[1]} />
            </div>
          </div>

          {/* Row 2: three equal */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
            {problems.slice(2, 5).map((p, i) => (
              <div key={p.title} style={{ height: '100%' }}>
                <ProblemCard {...p} />
              </div>
            ))}
          </div>

          {/* Row 3: full-width horizontal card */}
          <ProblemCard {...problems[5]} wide />
        </div>
      </section>

      {/* ── THE SHIFT — full bleed, two colour halves ────────────────────────── */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        {/* Without bahnOS */}
        <div style={{ background: '#FFF8F6', borderTop: `4px solid #FF5630`, padding: '80px 7vw 80px 8vw', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#DE350B', marginBottom: 20 }}>✕ Without bahnOS</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {['Open Miro → sketch the feature map', 'Screenshot it and paste in Confluence', 'Manually recreate every node as a Jira ticket', 'Assign story points ticket by ticket', 'Retro: "why did we build it this way?"', 'Nobody knows — the whiteboard is gone'].map(s => (
              <div key={s} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ color: '#DE350B', fontWeight: 700, flexShrink: 0, marginTop: 2 }}>✕</span>
                <span style={{ fontSize: '0.875rem', color: subtle, lineHeight: 1.55 }}>{s}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 28, padding: '12px 16px', background: '#FFEBE6', borderRadius: 4, borderLeft: '3px solid #FF5630' }}>
            <p style={{ fontSize: '0.8125rem', color: '#DE350B', fontWeight: 600, margin: 0 }}>Avg. 3–4 hours wasted per sprint. Context permanently lost.</p>
          </div>
        </div>

        {/* With bahnOS */}
        <div style={{ background: '#F0FFF8', borderTop: `4px solid #36B37E`, padding: '80px 8vw 80px 7vw', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#006644', marginBottom: 20 }}>✓ With bahnOS</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {['Open bahnOS → build the mind map visually', 'Draw dependencies, add epics and sub-tasks', 'Select nodes → push to Jira in one click', 'Story points, priority, and type auto-filled', 'Retro: open the canvas — full context intact', 'Evolve the map every sprint, forever'].map(s => (
              <div key={s} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ color: '#006644', fontWeight: 700, flexShrink: 0, marginTop: 2 }}>✓</span>
                <span style={{ fontSize: '0.875rem', color: navy, lineHeight: 1.55 }}>{s}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 28, padding: '12px 16px', background: '#E3FCEF', borderRadius: 4, borderLeft: '3px solid #36B37E' }}>
            <p style={{ fontSize: '0.8125rem', color: '#006644', fontWeight: 600, margin: 0 }}>Sprint planning in minutes. Institutional memory that lasts.</p>
          </div>
        </div>
      </section>

      {/* ── USE CASES — white bg, asymmetric grid ───────────────────────────── */}
      <section style={{ background: surface, padding: '96px 0', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 6vw' }}>
          <div style={{ marginBottom: 56 }}>
            <SectionLabel>Use cases</SectionLabel>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.75rem)', fontWeight: 800, letterSpacing: '-0.03em', color: navy, lineHeight: 1.15, maxWidth: 540 }}>
              Built for every team that ships
            </h2>
          </div>

          {/* Row 1: featured (2/3) + card (1/3) */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ height: '100%' }}>
              <UseCaseCard {...useCases[0]} featured />
            </div>
            <div style={{ height: '100%' }}>
              <UseCaseCard {...useCases[1]} />
            </div>
          </div>

          {/* Row 2: three equal */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
            {useCases.slice(2, 5).map((uc, i) => (
              <div key={uc.label} style={{ height: '100%' }}>
                <UseCaseCard {...uc} />
              </div>
            ))}
          </div>

          {/* Row 3: card (1/3) + featured (2/3) — flipped */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 20 }}>
            <div style={{ height: '100%' }}>
              <UseCaseCard {...useCases[5]} />
            </div>
            <div style={{ height: '100%' }}>
              <UseCaseCard {...useCases[6]} featured />
            </div>
          </div>

          {/* Row 4: two equal */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {useCases.slice(7).map((uc, i) => (
              <div key={uc.label} style={{ height: '100%' }}>
                <UseCaseCard {...uc} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY NOW — bg, big decorative numbers ────────────────────────────── */}
      <section style={{ background: bg, padding: '96px 0', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 6vw' }}>
          <div style={{ marginBottom: 56 }}>
            <SectionLabel>Why now</SectionLabel>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.75rem)', fontWeight: 800, letterSpacing: '-0.03em', color: navy, lineHeight: 1.15 }}>
              The market is ready<br />for something better
            </h2>
            <p style={{ fontSize: '0.9375rem', color: subtle, maxWidth: 480, margin: '14px 0 0', lineHeight: 1.75 }}>
              Three forces are converging to create the perfect window for a new category of planning software.
            </p>
          </div>

          {/* 2×2 grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {whyNow.map((item, i) => (
              <WhyNowCard key={item.num} {...item} />
            ))}
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS — navy strip ────────────────────────────────────────── */}
      <section style={{ background: navy, padding: '64px 6vw' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>
            Works with your stack
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
            {['Jira', 'Confluence', 'CSV', 'Slack', 'Webhooks', 'Markdown', 'PNG / SVG'].map((name, i) => (
              <span
                key={name}
                style={{ padding: '8px 20px', borderRadius: 99, fontSize: '0.875rem', fontWeight: 500, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)', display: 'inline-block', cursor: 'default', transition: 'background 0.15s, border-color 0.15s, color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = blue; e.currentTarget.style.borderColor = blue; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────────────────────────────────── */}
      <section style={{ background: heroBlue, padding: '112px 6vw', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(76,154,255,0.15) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4.5vw, 3.75rem)', fontWeight: 900, letterSpacing: '-0.04em', color: '#fff', marginBottom: 18, lineHeight: 1.1 }}>
            Stop losing context.<br />
            <span style={{ color: bluePale }}>Start shipping</span> with clarity.
          </h2>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.65)', marginBottom: 38, lineHeight: 1.8 }}>
            bahnOS is free to start. No setup time, no credit card, no consultant required. Your first sprint plan is five minutes away.
          </p>
          <Link to="/register"
            style={{ background: '#fff', color: heroBlue, textDecoration: 'none', fontWeight: 700, fontSize: '1rem', borderRadius: 4, padding: '14px 36px', display: 'inline-block', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', transition: 'background 0.15s, transform 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = blueLight; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'none' }}>
            Get started free
          </Link>
          <p style={{ marginTop: 18, fontSize: '0.8125rem', color: 'rgba(255,255,255,0.32)' }}>
            Free forever · No credit card · Takes 2 minutes
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
