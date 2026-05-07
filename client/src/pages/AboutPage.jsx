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

export default function AboutPage() {
  const values = [
    { num: '01', title: 'Simplicity first', body: "Powerful tools don't have to be complicated. Every interaction is intentional — nothing buried, nothing requiring a tutorial.", color: blue },
    { num: '02', title: 'Performance matters', body: 'Latency kills flow. We optimize every render cycle and WebSocket event so the tool disappears and your thinking takes center stage.', color: '#6554C0' },
    { num: '03', title: 'Built for teams', body: 'bahnOS is collaborative at the protocol level. Real-time presence and role-based permissions are first-class, not bolt-ons.', color: '#00875A' },
  ]

  const whyCards = [
    { icon: '◎', color: '#6554C0', title: 'Visual thinking is natural. Jira is not.', body: 'Teams naturally think spatially — relationships, hierarchies, dependencies. Jira forces that thinking into flat lists. bahnOS lets you think the way your brain works, then translates it for the tool that runs your sprint.' },
    { icon: '⟳', color: '#00875A', title: "Context shouldn't disappear after the meeting.", body: "The whiteboard that generated a sprint's worth of work is gone by Monday. bahnOS keeps your visual plan alive and in sync with execution — so the 'why' behind every ticket never goes stale." },
    { icon: '⬡', color: '#FF991F', title: 'One less tool is a competitive advantage.', body: 'Every new SaaS product adds friction. bahnOS reduces your toolchain by replacing the planning → tracking handoff with a single surface. Less context switching, fewer missed updates, faster decisions.' },
    { icon: '⌁', color: '#DE350B', title: 'Real-time or bust.', body: 'Async updates create drift. When your canvas and your Jira board update together, in real time, your team operates from a single truth — not three versions of a plan across three tools.' },
    { icon: '⊕', color: blue, title: 'Built for how product teams actually work.', body: 'Roadmaps, sprint planning, architecture reviews, incident post-mortems — each has a distinct visual shape. bahnOS supports the full workflow lifecycle, not just the moments that fit a generic template.' },
    { icon: '✦', color: '#0065FF', title: 'Collaboration is a feature, not an afterthought.', body: 'Presence, roles, permissions, and live cursors are wired in at the core. bahnOS treats multi-player as the default, not a premium tier you unlock after hitting a user limit.' },
  ]

  const integrations = [
    { name: 'Jira', label: 'Two-way sync', desc: 'Create, update, and track issues directly from the canvas.', live: true },
    { name: 'Confluence', label: 'Export', desc: 'Push your mind maps as structured Confluence pages.', live: true },
    { name: 'Slack', label: 'Notifications', desc: 'Get alerts when nodes change, sprints start, or blockers appear.', live: true },
    { name: 'GitHub', label: 'Coming soon', desc: 'Link pull requests and commits to nodes on your canvas.', live: false },
    { name: 'Notion', label: 'Coming soon', desc: 'Mirror planning docs into Notion databases automatically.', live: false },
    { name: 'Linear', label: 'Coming soon', desc: 'For teams running Linear instead of Jira — same visual workflow.', live: false },
  ]

  return (
    <div style={{ background: surface, color: navy, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", overflowX: 'hidden' }}>
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section style={{ background: heroBlue, minHeight: '52vh', display: 'flex', alignItems: 'center', padding: '0 8vw', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(76,154,255,0.15) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: '-2%', bottom: '5%', fontSize: 'clamp(80px, 14vw, 180px)', fontWeight: 900, color: 'rgba(255,255,255,0.04)', letterSpacing: '-0.04em', lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>ABOUT</div>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 680 }}>
          <SectionLabel dark>About</SectionLabel>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.08, marginBottom: 22, color: '#fff' }}>
            Built for teams<br />who think <span style={{ color: bluePale }}>visually</span>
          </h1>
          <p style={{ fontSize: '1.0625rem', color: 'rgba(255,255,255,0.68)', lineHeight: 1.78, maxWidth: 500 }}>
            bahnOS bridges the gap between visual planning and project execution — keeping your thinking alive through every sprint.
          </p>
        </div>
      </section>

      {/* ── MISSION ──────────────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 0', background: surface, overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 6vw' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '0 72px', alignItems: 'start' }}>
            <div>
              <SectionLabel>Our mission</SectionLabel>
              <blockquote style={{ fontSize: 'clamp(1.25rem, 2vw, 1.5rem)', fontWeight: 700, lineHeight: 1.45, letterSpacing: '-0.02em', color: navy, borderLeft: `4px solid ${blue}`, paddingLeft: 22, margin: 0 }}>
                Great teams don't just track work. They see it, shape it, and ship it together.
              </blockquote>
            </div>
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <p style={{ fontSize: '1rem', color: navy, lineHeight: 1.8, margin: 0 }}>
                  bahnOS was born from a frustration every product team shares: the tool you sketch ideas in is never the tool you track them in. You end up with a Miro board no one checks, a Jira backlog no one trusts, and a Confluence page three sprints out of date.
                </p>
                <p style={{ fontSize: '1rem', color: subtle, lineHeight: 1.8, margin: 0 }}>
                  We built bahnOS to collapse that gap. Start with a mind map, turn nodes into Jira issues with one click, watch changes sync back in real time — and never lose the visual context that made the plan make sense.
                </p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingTop: 8 }}>
                  <Link to="/features" style={{ padding: '9px 18px', borderRadius: 4, fontSize: '0.875rem', fontWeight: 600, background: blueLight, color: blue, textDecoration: 'none', border: `1px solid #B3D4FF`, transition: 'background 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#B3D4FF' }}
                    onMouseLeave={e => { e.currentTarget.style.background = blueLight }}>
                    Explore features →
                  </Link>
                  <Link to="/register" style={{ padding: '9px 18px', borderRadius: 4, fontSize: '0.875rem', fontWeight: 600, background: blue, color: '#fff', textDecoration: 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = blueHover }}
                    onMouseLeave={e => { e.currentTarget.style.background = blue }}>
                    Get started free
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUES ───────────────────────────────────────────────────────────── */}
      <section style={{ background: bg, padding: '96px 0', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 6vw' }}>
          <div style={{ marginBottom: 56 }}>
            <SectionLabel>What we believe</SectionLabel>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.75rem)', fontWeight: 800, letterSpacing: '-0.03em', color: navy, lineHeight: 1.15 }}>Our values</h2>
          </div>

          {/* Row: narrow (1fr) + wide (2fr) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 20 }}>
            <div style={{ height: '100%' }}>
              <ValueCard {...values[0]} />
            </div>
            <div style={{ height: '100%' }}>
              <ValueCard {...values[1]} featured />
            </div>
          </div>

          {/* Full-width third value */}
          <ValueCard {...values[2]} wide />
        </div>
      </section>

      {/* ── WHY BAHNOSSS ─────────────────────────────────────────────────────── */}
      <section style={{ background: surface, padding: '96px 0', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 6vw' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 60px', alignItems: 'end', marginBottom: 56 }}>
            <div>
              <SectionLabel>Why bahnOS</SectionLabel>
              <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.75rem)', fontWeight: 800, letterSpacing: '-0.03em', color: navy, lineHeight: 1.15, margin: 0 }}>
                The gap no one else is closing
              </h2>
            </div>
            <div>
              <p style={{ fontSize: '0.9375rem', color: subtle, lineHeight: 1.8, margin: 0 }}>
                Every tool optimizes for one half of the problem. bahnOS is built for the space in between.
              </p>
            </div>
          </div>

          {/* Row 1: 2fr + 1fr */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ height: '100%' }}>
              <WhyCard {...whyCards[0]} featured />
            </div>
            <div style={{ height: '100%' }}>
              <WhyCard {...whyCards[1]} />
            </div>
          </div>

          {/* Row 2: 1fr 1fr 1fr */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
            {whyCards.slice(2, 5).map((c, i) => (
              <div key={c.title} style={{ height: '100%' }}>
                <WhyCard {...c} />
              </div>
            ))}
          </div>

          {/* Row 3: full-width */}
          <WhyCard {...whyCards[5]} wide />
        </div>
      </section>

      {/* ── INTEGRATIONS ─────────────────────────────────────────────────────── */}
      <section style={{ background: bg, padding: '96px 0', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 6vw' }}>
          <div style={{ marginBottom: 56 }}>
            <SectionLabel>Works with your stack</SectionLabel>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.75rem)', fontWeight: 800, letterSpacing: '-0.03em', color: navy, lineHeight: 1.15, maxWidth: 520 }}>
              Fits into workflows teams already use
            </h2>
            <p style={{ fontSize: '0.9375rem', color: subtle, maxWidth: 480, margin: '14px 0 0', lineHeight: 1.75 }}>
              bahnOS doesn't ask your team to start over. It connects to the tools already powering your delivery.
            </p>
          </div>

          {/* Live integrations: 3fr featured + 1fr + 1fr */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
            {integrations.filter(i => i.live).map((intg, i) => (
              <div key={intg.name} style={{ height: '100%' }}>
                <IntegCard {...intg} featured={i === 0} />
              </div>
            ))}
          </div>

          {/* Coming soon: 3 equal */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
            {integrations.filter(i => !i.live).map((intg, i) => (
              <div key={intg.name} style={{ height: '100%' }}>
                <IntegCard {...intg} />
              </div>
            ))}
          </div>

          <p style={{ fontSize: '0.8125rem', color: subtle, marginTop: 28, textAlign: 'center' }}>
            More integrations on the roadmap.{' '}
            <Link to="/register" style={{ color: blue, textDecoration: 'none', fontWeight: 600 }}>Sign up</Link>
            {' '}to vote on what ships next.
          </p>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section style={{ background: heroBlue, padding: '96px 6vw', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(76,154,255,0.15) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 3.25rem)', fontWeight: 900, letterSpacing: '-0.04em', color: '#fff', marginBottom: 16, lineHeight: 1.1 }}>
            Start building today
          </h2>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.65)', marginBottom: 32, lineHeight: 1.75 }}>
            Your first mind map is one click away.
          </p>
          <Link to="/register" style={{ background: '#fff', color: heroBlue, textDecoration: 'none', fontWeight: 700, fontSize: '1rem', borderRadius: 4, padding: '13px 34px', display: 'inline-block', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', transition: 'background 0.15s, transform 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = blueLight; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'none' }}>
            Get started free
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}

// ── sub-components ────────────────────────────────────────────────────────────
function ValueCard({ num, title, body, color, featured, wide }) {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: featured ? '44px 38px' : wide ? '36px 40px' : '32px 28px',
        border: `1px solid ${hov ? color + '66' : border}`,
        borderTop: `3px solid ${color}`,
        borderRadius: 8, background: hov ? blueLight : surface,
        height: '100%', boxSizing: 'border-box',
        display: 'flex', flexDirection: wide ? 'row' : 'column',
        alignItems: wide ? 'center' : 'flex-start', gap: wide ? 60 : 0,
        transition: 'background 0.18s, border-color 0.18s, box-shadow 0.18s',
        boxShadow: hov ? '0 4px 20px rgba(9,30,66,0.1)' : 'none',
      }}>
      <div style={{ flexShrink: 0 }}>
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: wide ? 0 : 14 }}>{num}</span>
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: featured ? '1.125rem' : '1rem', fontWeight: 700, color: '#172B4D', marginBottom: 10, lineHeight: 1.35 }}>{title}</h3>
        <p style={{ fontSize: '0.8125rem', color: '#5E6C84', lineHeight: 1.75, margin: 0 }}>{body}</p>
      </div>
    </div>
  )
}

function WhyCard({ icon, color, title, body, featured, wide }) {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: featured ? '44px 38px' : wide ? '32px 40px' : '28px 24px',
        border: `1px solid ${hov ? color + '55' : '#DFE1E6'}`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 8, background: hov ? '#FAFBFC' : '#FFFFFF',
        height: '100%', boxSizing: 'border-box',
        display: 'flex', flexDirection: wide ? 'row' : 'column',
        alignItems: wide ? 'center' : 'flex-start', gap: wide ? 48 : 0,
        transition: 'background 0.18s, border-color 0.18s, box-shadow 0.18s',
        boxShadow: hov ? '0 4px 20px rgba(9,30,66,0.1)' : 'none',
        position: 'relative', overflow: 'hidden',
      }}>
      {featured && (
        <div style={{ position: 'absolute', right: -4, bottom: -8, fontSize: 80, opacity: 0.05, userSelect: 'none', pointerEvents: 'none', lineHeight: 1 }}>{icon}</div>
      )}
      <div style={{ flexShrink: 0 }}>
        <span style={{ fontSize: featured ? '2rem' : '1.375rem', color, display: 'block', marginBottom: wide ? 0 : 14 }}>{icon}</span>
      </div>
      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <h3 style={{ fontSize: featured ? '1.125rem' : '0.9375rem', fontWeight: 700, color: '#172B4D', marginBottom: 10, lineHeight: 1.4 }}>{title}</h3>
        <p style={{ fontSize: '0.8125rem', color: '#5E6C84', lineHeight: 1.75, margin: 0 }}>{body}</p>
      </div>
    </div>
  )
}

function IntegCard({ name, label, desc, featured }) {
  const [hov, setHov] = useState(false)
  const live = label !== 'Coming soon'
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: featured ? '36px 32px' : '24px 22px',
        border: `1px solid ${hov && live ? '#0052CC' : '#DFE1E6'}`,
        borderRadius: 8, background: hov ? '#DEEBFF' : '#FFFFFF',
        height: '100%', boxSizing: 'border-box',
        transition: 'background 0.18s, border-color 0.18s, box-shadow 0.18s',
        boxShadow: hov && live ? '0 4px 16px rgba(9,30,66,0.1)' : 'none',
        opacity: live ? 1 : 0.72,
      }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: featured ? '1.125rem' : '0.9375rem', color: '#172B4D' }}>{name}</span>
        <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '2px 8px', borderRadius: 3, background: live ? '#DEEBFF' : '#F4F5F7', color: live ? '#0052CC' : '#5E6C84', border: `1px solid ${live ? '#B3D4FF' : '#DFE1E6'}` }}>
          {label}
        </span>
      </div>
      <p style={{ fontSize: '0.8125rem', color: '#5E6C84', lineHeight: 1.65, margin: 0 }}>{desc}</p>
    </div>
  )
}
