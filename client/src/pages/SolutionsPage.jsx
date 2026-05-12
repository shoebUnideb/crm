import React from 'react'
import { Link, useParams, Navigate, useNavigate } from 'react-router-dom'
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

const SOLUTIONS = {
  sales: {
    slug: 'sales',
    label: 'Sales teams',
    tagline: 'Close more. Hand off better.',
    color: '#00875A',
    gradient: 'linear-gradient(135deg, #E3FCEF 0%, #EBF4FF 60%, #FAFBFC 100%)',
    hero: {
      headline: 'Your pipeline and your delivery,\nin one place.',
      sub: 'bahnOS connects your CRM to the rest of the business. When a deal closes, implementation doesn\'t disappear into a black hole — it flows into Capsule where the work actually happens.',
      badge: 'For Sales teams',
    },
    pains: [
      { icon: '⚠️', title: 'Revenue context lost at handoff', desc: 'The moment a deal closes, delivery teams start from scratch. Requirements, contacts, and context never arrive.' },
      { icon: '📂', title: 'Pipeline in one tool, execution in another', desc: 'Sales works in the CRM. Engineering works in Jira. There\'s no single source of truth connecting the two.' },
      { icon: '🔍', title: 'No visibility into post-sale execution', desc: 'After close, deals fall silent. Sales can\'t see delivery progress. Customers ask, nobody knows.' },
    ],
    products: [
      {
        name: 'CRM', color: '#00875A', to: '/crm-product',
        headline: 'Pipeline that knows what comes next',
        points: ['Visual deal pipeline with custom stages', 'Full contact & org records with activity history', 'Revenue forecasting and quota tracking', 'Win/loss analysis to improve close rates'],
      },
      {
        name: 'bahn Capsule', color: '#6554C0', to: '/capsule',
        headline: 'Closed deals become live implementation maps',
        points: ['Linked from CRM deal to Capsule project', 'Delivery team sees full requirements context', 'Track implementation milestones visually', 'Jira sync keeps engineering in the loop'],
      },
      {
        name: 'Wiki', color: '#FF8B00', to: '/wiki',
        headline: 'Onboarding guides linked to every deal',
        points: ['Customer onboarding docs linked to CRM records', 'Sales playbooks in one searchable place', 'Spec docs attached to implementation Capsules', 'Version history on every document'],
      },
    ],
    flow: {
      headline: 'From first contact to successful delivery',
      steps: [
        { label: 'Qualify & pipeline', desc: 'Track deals in CRM with custom stages and probability scoring.', color: '#00875A' },
        { label: 'Win the deal', desc: 'Log every interaction. Document requirements. Tag the right stakeholders.', color: '#00875A' },
        { label: 'Hand off to delivery', desc: 'Push deal context into a Capsule map. Delivery team starts with full context.', color: '#6554C0' },
        { label: 'Track execution', desc: 'Capsule nodes sync to Jira. Progress visible to both sales and delivery.', color: '#0052CC' },
      ],
    },
    templates: [
      { emoji: '🏎️', name: 'SaaS sales pipeline' },
      { emoji: '🤝', name: 'Partnership pipeline' },
      { emoji: '📦', name: 'Enterprise deal room' },
      { emoji: '🎯', name: 'SDR outreach tracker' },
      { emoji: '🔄', name: 'Renewal pipeline' },
      { emoji: '🚀', name: 'Customer onboarding map' },
    ],
    cta: 'Start closing better →',
  },

  engineering: {
    slug: 'engineering',
    label: 'Engineering teams',
    tagline: 'Plan, execute, ship — all connected.',
    color: '#6554C0',
    gradient: 'linear-gradient(135deg, #F3F0FF 0%, #EBF4FF 60%, #FAFBFC 100%)',
    hero: {
      headline: 'Sprint planning that knows\nwhat it\'s building and why.',
      sub: 'bahnOS connects your roadmap to your sprints, your sprints to Jira, and your Jira tickets to the spec docs that explain them. No more context-switching between 5 tools.',
      badge: 'For Engineering teams',
    },
    pains: [
      { icon: '🧩', title: 'Roadmap disconnected from tickets', desc: 'Epics live in one place, the roadmap in another. Nobody knows if the sprint actually maps to the quarterly goal.' },
      { icon: '📄', title: 'Docs live nowhere near the code', desc: 'Specs are in Notion, tickets in Jira, progress in Slack. Engineers spend more time finding context than writing code.' },
      { icon: '⏱️', title: 'Sprint planning takes half a day', desc: 'Copying tickets, estimating in spreadsheets, duplicating information across tools — every planning session is overhead.' },
    ],
    products: [
      {
        name: 'bahn Capsule', color: '#6554C0', to: '/capsule',
        headline: 'Visual planning that connects to real tickets',
        points: ['Build your roadmap as a visual Capsule map', 'Each node becomes a Jira Epic, Story, or Subtask', 'Sprint board and burndown built in', 'Kanban, timeline, and table views in one place'],
      },
      {
        name: 'Wiki', color: '#FF8B00', to: '/wiki',
        headline: 'Specs attached to the nodes that need them',
        points: ['Attach spec docs directly to Capsule nodes', 'Engineering runbooks in versioned Spaces', 'Architecture docs linked to implementation maps', 'Slash commands for fast doc authoring'],
      },
      {
        name: 'CRM', color: '#00875A', to: '/crm-product',
        headline: 'Know what you\'re building and for whom',
        points: ['See which deals depend on which features', 'Customer requirements linked to roadmap nodes', 'Delivery context handed off from sales at close', 'No more "why are we building this?" questions'],
      },
    ],
    flow: {
      headline: 'From quarterly goal to shipped feature',
      steps: [
        { label: 'Map the roadmap', desc: 'Build a visual Capsule map of epics, themes, and features for the quarter.', color: '#6554C0' },
        { label: 'Attach the specs', desc: 'Link Wiki spec docs to each node. Everyone knows what they\'re building.', color: '#FF8B00' },
        { label: 'Plan the sprint', desc: 'Drag nodes into the sprint board. Assign, estimate, and start.', color: '#6554C0' },
        { label: 'Sync to Jira', desc: 'Push the sprint to Jira. Tickets created at the right depth automatically.', color: '#0052CC' },
      ],
    },
    templates: [
      { emoji: '🗺️', name: 'Product roadmap' },
      { emoji: '🏃', name: 'Sprint planning' },
      { emoji: '📦', name: 'Dependency map' },
      { emoji: '📘', name: 'Engineering runbook' },
      { emoji: '🚀', name: 'Product spec template' },
      { emoji: '🔄', name: 'Incident postmortem' },
    ],
    cta: 'Start shipping with context →',
  },

  ops: {
    slug: 'ops',
    label: 'Operations teams',
    tagline: 'See the whole picture. Move it forward.',
    color: '#0052CC',
    gradient: 'linear-gradient(135deg, #EFF6FF 0%, #EBF4FF 60%, #FAFBFC 100%)',
    hero: {
      headline: 'Operations that connects\nplanning to execution.',
      sub: 'Operations teams sit at the intersection of every function. bahnOS gives you a single operational workspace — where planning, cross-team dependencies, revenue, and documentation live together.',
      badge: 'For Operations teams',
    },
    pains: [
      { icon: '🗺️', title: 'Cross-team dependencies invisible', desc: 'You\'re coordinating between engineering, sales, and leadership — but there\'s no single view of who\'s blocked, waiting, or delivering.' },
      { icon: '📋', title: 'Processes documented nowhere useful', desc: 'SOPs live in Confluence. Plans in spreadsheets. Status updates in Slack. Nothing is findable when you need it.' },
      { icon: '📊', title: 'Reporting takes a whole day to compile', desc: 'Pulling status from Jira, CRM, and Notion every week is manual work that adds no value. You just need one source of truth.' },
    ],
    products: [
      {
        name: 'bahn Capsule', color: '#6554C0', to: '/capsule',
        headline: 'Cross-functional planning in one canvas',
        points: ['Map cross-team dependencies visually', 'Track initiatives from planning to execution', 'Sprint boards for operational work streams', 'Timeline view for quarterly planning'],
      },
      {
        name: 'CRM', color: '#00875A', to: '/crm-product',
        headline: 'Revenue context for operational decisions',
        points: ['See pipeline alongside delivery capacity', 'Link deals to operational commitments', 'Activity logs for every customer touchpoint', 'Forecasts that inform resourcing decisions'],
      },
      {
        name: 'Wiki', color: '#FF8B00', to: '/wiki',
        headline: 'SOPs and playbooks where teams can find them',
        points: ['Organize processes into Spaces per function', 'Versioned SOPs with author tracking', 'Link runbooks to the Capsule nodes that trigger them', 'Page search across all operational docs'],
      },
    ],
    flow: {
      headline: 'From initiative to on-time delivery',
      steps: [
        { label: 'Map the initiative', desc: 'Build a cross-functional Capsule map with owners, dependencies, and timelines.', color: '#0052CC' },
        { label: 'Document the process', desc: 'Write SOPs and playbooks in Wiki, linked to the relevant Capsule nodes.', color: '#FF8B00' },
        { label: 'Track execution', desc: 'Sprint boards and timeline views give live status across all workstreams.', color: '#6554C0' },
        { label: 'Report with context', desc: 'Leadership sees progress against the full operational picture, not just ticket counts.', color: '#0052CC' },
      ],
    },
    templates: [
      { emoji: '🗺️', name: 'Quarterly planning map' },
      { emoji: '🔄', name: 'Process map' },
      { emoji: '🎯', name: 'OKR tracker' },
      { emoji: '🏢', name: 'Org chart' },
      { emoji: '📋', name: 'SOP template' },
      { emoji: '📊', name: 'Operational review' },
    ],
    cta: 'Start connecting the picture →',
  },

  startups: {
    slug: 'startups',
    label: 'Startups',
    tagline: 'Move fast. Keep context.',
    color: '#0052CC',
    gradient: 'linear-gradient(135deg, #EFF6FF 0%, #F3F0FF 60%, #FAFBFC 100%)',
    hero: {
      headline: 'One workspace.\nNo tool sprawl.',
      sub: 'Early-stage teams can\'t afford 6 separate tools. bahnOS gives you planning, execution, a CRM, and a wiki — all connected from day one. Start with what you need. Grow into the rest.',
      badge: 'For Startups',
    },
    pains: [
      { icon: '💸', title: 'Paying for tools you barely use', desc: 'Notion for docs, Jira for tickets, HubSpot for CRM, Confluence for wikis. That\'s $400/mo before you\'ve hired anyone.' },
      { icon: '🔀', title: 'Context scattered across everything', desc: 'A feature request comes in from a prospect. It lives in Slack, the CRM, a Jira epic, and a Notion page. All disconnected.' },
      { icon: '⏩', title: 'No time to build process', desc: 'Early teams move fast and break things. But without a shared operational layer, context disappears the moment headcount grows.' },
    ],
    products: [
      {
        name: 'bahn Capsule', color: '#6554C0', to: '/capsule',
        headline: 'Your roadmap, sprints, and tickets in one map',
        points: ['Visual roadmap from idea to shipped feature', 'Built-in sprint board — no Jira required to start', 'Jira sync when you\'re ready to scale', 'Real-time collaboration from day one'],
      },
      {
        name: 'CRM', color: '#00875A', to: '/crm-product',
        headline: 'Close deals and hand off to delivery',
        points: ['Simple pipeline for your first 50 deals', 'Contact and org records with full activity history', 'Link won deals directly to Capsule delivery maps', 'No per-seat pricing surprises'],
      },
      {
        name: 'Wiki', color: '#FF8B00', to: '/wiki',
        headline: 'Team knowledge that grows with you',
        points: ['Engineering runbooks, product specs, onboarding docs', 'Everything searchable, versioned, and accessible', 'Linked to the Capsule nodes they describe', 'Start with one Space. Expand as you hire.'],
      },
    ],
    flow: {
      headline: 'From idea to shipped, without the overhead',
      steps: [
        { label: 'Capture the idea', desc: 'Add a node to Capsule. Attach context, links, and requirements.', color: '#6554C0' },
        { label: 'Connect to revenue', desc: 'Link the feature request to the CRM deal that requires it.', color: '#00875A' },
        { label: 'Write the spec', desc: 'Create a Wiki page, attach it to the Capsule node. Team has context.', color: '#FF8B00' },
        { label: 'Ship it', desc: 'Push to Jira when ready. Track sprint progress. Mark it done.', color: '#0052CC' },
      ],
    },
    templates: [
      { emoji: '🗺️', name: 'MVP roadmap' },
      { emoji: '🏎️', name: 'Early-stage sales pipeline' },
      { emoji: '🎓', name: 'Team onboarding guide' },
      { emoji: '🏃', name: 'Sprint planning' },
      { emoji: '🚀', name: 'Product spec template' },
      { emoji: '🎯', name: 'OKR tracker' },
    ],
    cta: 'Start for free →',
  },
}

export default function SolutionsPage() {
  const { slug } = useParams()
  const { isAuthenticated } = useAuth()
  const { openRegister } = useAuthModal()
  const navigate = useNavigate()
  const sol = SOLUTIONS[slug]

  if (!sol) return <Navigate to="/" replace />

  const handleCTA = () => {
    if (isAuthenticated) navigate('/app/canvas')
    else openRegister()
  }

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <Navbar />

      {/* Hero */}
      <section style={{
        background: sol.gradient,
        borderBottom: `3px solid ${sol.color}`,
        padding: '80px 24px 72px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -80, width: 400, height: 400, background: `radial-gradient(circle, ${sol.color}0C 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: SURFACE, border: `1px solid ${sol.color}40`, borderRadius: 100, padding: '5px 16px', marginBottom: 28, boxShadow: `0 1px 4px ${sol.color}18` }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: sol.color, display: 'inline-block' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: sol.color, letterSpacing: '0.04em' }}>{sol.hero.badge}</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 800, color: BLUE, lineHeight: 1.2, letterSpacing: '-0.03em', margin: '0 0 20px', whiteSpace: 'pre-line' }}>
            {sol.hero.headline}
          </h1>
          <p style={{ fontSize: '1.0625rem', color: SUBTLE, lineHeight: 1.7, maxWidth: 560, margin: '0 auto 36px' }}>
            {sol.hero.sub}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleCTA}
              style={{ background: sol.color, color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.9375rem', borderRadius: 4, padding: '12px 26px', cursor: 'pointer', transition: 'opacity 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >{sol.cta}</button>
            <Link to="/pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: SURFACE, color: SUBTLE, border: `1px solid ${BORDER}`, fontWeight: 500, fontSize: '0.9375rem', borderRadius: 4, padding: '11px 22px', textDecoration: 'none', transition: 'border-color 0.15s, color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = BLUE; e.currentTarget.style.borderColor = BLUE }}
              onMouseLeave={e => { e.currentTarget.style.color = SUBTLE; e.currentTarget.style.borderColor = BORDER }}
            >See pricing</Link>
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, padding: '64px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: '0.6875rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Sound familiar?</p>
          <h2 style={{ fontSize: 'clamp(1.375rem, 2.5vw, 1.875rem)', fontWeight: 700, color: BLUE, textAlign: 'center', margin: '0 0 40px', letterSpacing: '-0.02em' }}>
            What {sol.label.toLowerCase()} deal with every day
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {sol.pains.map((pain, i) => (
              <div key={i} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '24px 22px' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 12 }}>{pain.icon}</div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: BLUE, marginBottom: 8 }}>{pain.title}</div>
                <div style={{ fontSize: '0.8125rem', color: SUBTLE, lineHeight: 1.6 }}>{pain.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How bahnOS helps — product cards */}
      <section style={{ background: BG, borderTop: `1px solid ${BORDER}`, padding: '72px 24px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: '0.6875rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>How bahnOS helps</p>
          <h2 style={{ fontSize: 'clamp(1.375rem, 2.5vw, 1.875rem)', fontWeight: 700, color: BLUE, textAlign: 'center', margin: '0 0 48px', letterSpacing: '-0.02em' }}>
            Three products. Built for this.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {sol.products.map((prod, i) => (
              <div key={i} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 4, background: prod.color }} />
                <div style={{ padding: '24px' }}>
                  <div style={{ display: 'inline-block', fontSize: '0.6875rem', fontWeight: 700, color: prod.color, background: prod.color + '14', borderRadius: 4, padding: '2px 8px', marginBottom: 14, letterSpacing: '0.04em' }}>
                    {prod.name}
                  </div>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: BLUE, margin: '0 0 16px', lineHeight: 1.4 }}>{prod.headline}</h3>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {prod.points.map((pt, j) => (
                      <li key={j} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '0.8125rem', color: SUBTLE, lineHeight: 1.5 }}>
                        <span style={{ color: prod.color, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={{ padding: '0 24px 20px', marginTop: 'auto' }}>
                  <Link to={prod.to} style={{ color: prod.color, textDecoration: 'none', fontSize: '0.8125rem', fontWeight: 600 }}>
                    Learn more →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow flow */}
      <section style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, padding: '72px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: '0.6875rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Workflow</p>
          <h2 style={{ fontSize: 'clamp(1.375rem, 2.5vw, 1.875rem)', fontWeight: 700, color: BLUE, textAlign: 'center', margin: '0 0 48px', letterSpacing: '-0.02em' }}>
            {sol.flow.headline}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
            {sol.flow.steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                {/* Connector line */}
                {i < sol.flow.steps.length - 1 && (
                  <div style={{ position: 'absolute', top: 20, left: '50%', width: '100%', height: 2, background: BORDER, zIndex: 0 }} />
                )}
                {/* Step number bubble */}
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: step.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', position: 'relative', zIndex: 1, flexShrink: 0, marginBottom: 16 }}>
                  {i + 1}
                </div>
                <div style={{ padding: '0 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: BLUE, marginBottom: 6 }}>{step.label}</div>
                  <div style={{ fontSize: '0.75rem', color: SUBTLE, lineHeight: 1.5 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates */}
      <section style={{ background: BG, borderTop: `1px solid ${BORDER}`, padding: '64px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Templates</p>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: BLUE, margin: '0 0 10px' }}>Start with a template made for {sol.label.toLowerCase()}</h2>
          <p style={{ fontSize: '0.9375rem', color: SUBTLE, marginBottom: 36 }}>Ready to use. Customizable in minutes.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
            {sol.templates.map((t, i) => (
              <Link key={i} to="/templates" style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer', textDecoration: 'none', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = sol.color; e.currentTarget.style.boxShadow = `0 0 0 2px ${sol.color}14` }}
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

      {/* CTA band */}
      <section style={{ background: BLUE, padding: '72px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#FFFFFF', margin: '0 0 14px', letterSpacing: '-0.03em' }}>
            Built for {sol.label.toLowerCase()}.
          </h2>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: 32 }}>
            Free to start. No credit card required.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleCTA}
              style={{ background: sol.color, color: '#fff', border: 'none', fontWeight: 700, fontSize: '1rem', padding: '14px 32px', borderRadius: 4, cursor: 'pointer', transition: 'opacity 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >{sol.cta}</button>
            <Link to="/platform" style={{ display: 'inline-flex', alignItems: 'center', color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: '0.9375rem', fontWeight: 500, padding: '14px 24px', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 4, transition: 'background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >See the full platform →</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
