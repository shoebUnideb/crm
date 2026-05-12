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
const color   = '#00875A'

const TABS = [
  {
    id: 'pipeline',
    label: 'Pipeline',
    features: [
      { icon: '🏎️', title: 'Visual pipeline',      desc: 'Kanban-style deal pipeline with drag-and-drop stage management and deal cards.' },
      { icon: '📊', title: 'Deal tracking',         desc: 'Track deal value, probability, close date, and owner across every stage.' },
      { icon: '🎯', title: 'Custom stages',         desc: 'Define your own pipeline stages with validation rules and required fields.' },
      { icon: '📈', title: 'Pipeline forecast',     desc: 'Weighted and best-case revenue forecasts based on deal stages and probability.' },
      { icon: '🔗', title: 'Deal relationships',    desc: 'Link deals together — track upsells, renewals, and cross-sell chains.' },
      { icon: '⚡', title: 'Bulk operations',       desc: 'Stage-move, reassign, or close multiple deals in a single action.' },
    ],
  },
  {
    id: 'contacts',
    label: 'Contacts & Orgs',
    features: [
      { icon: '👤', title: 'Contact profiles',      desc: 'Full contact records with emails, phones, activities, and deal history.' },
      { icon: '🏢', title: 'Organization records',  desc: 'Company profiles linked to contacts, deals, and all related activities.' },
      { icon: '🔗', title: 'Contact roles',         desc: 'Assign roles to contacts within deals — champion, decision maker, blocker.' },
      { icon: '📋', title: 'Custom fields',         desc: 'Add any field type to contacts or orgs — text, date, select, number, URL.' },
      { icon: '🏷️', title: 'Tags & segments',       desc: 'Tag contacts and orgs to build dynamic segments for outreach.' },
      { icon: '📧', title: 'Activity timeline',     desc: 'Full history of emails, calls, meetings, and notes per contact and org.' },
    ],
  },
  {
    id: 'activities',
    label: 'Activities',
    features: [
      { icon: '📞', title: 'Call logging',          desc: 'Log calls with duration, outcome, and notes. Link to contacts and deals.' },
      { icon: '📧', title: 'Email tracking',        desc: 'Log outbound emails with subject, body, and open/reply tracking.' },
      { icon: '📅', title: 'Meeting scheduler',     desc: 'Schedule and log meetings with agendas, attendees, and outcomes.' },
      { icon: '✅', title: 'Task management',       desc: 'Create tasks with due dates and owners linked to any CRM record.' },
      { icon: '📝', title: 'Notes',                 desc: 'Freeform notes on any record with mentions and action items.' },
      { icon: '🔔', title: 'Reminders',             desc: 'Set reminders on activities and tasks so nothing slips through.' },
    ],
  },
  {
    id: 'forecasting',
    label: 'Forecasting',
    features: [
      { icon: '📉', title: 'Revenue forecasts',     desc: 'Roll up weighted deal values into monthly and quarterly revenue projections.' },
      { icon: '🎯', title: 'Quota tracking',        desc: 'Set individual and team quotas, track attainment against pipeline.' },
      { icon: '🏅', title: 'Goal management',       desc: 'Define and track sales goals with progress indicators and alerts.' },
      { icon: '📊', title: 'Win/loss analysis',     desc: 'Track reasons for won and lost deals to improve your close rate over time.' },
      { icon: '⚡', title: 'Velocity metrics',      desc: 'Measure average deal cycle time, stage conversion rates, and ramp speed.' },
      { icon: '🔍', title: 'Smart views',           desc: 'Save filtered pipeline views by owner, stage, date range, or custom field.' },
    ],
  },
]

function FeatureTabs() {
  const [active, setActive] = useState('pipeline')
  const current = TABS.find(t => t.id === active)
  return (
    <section style={{ background: BG, borderTop: `1px solid ${BORDER}`, padding: '64px 24px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <p style={{ textAlign: 'center', fontSize: '0.6875rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Features</p>
        <h2 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 700, color: BLUE, margin: '0 0 32px', letterSpacing: '-0.02em', textAlign: 'center' }}>
          Everything the CRM can do
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

export default function CRMProductPage() {
  const { isAuthenticated } = useAuth()
  const { openRegister } = useAuthModal()
  const navigate = useNavigate()

  const goToApp = () => {
    if (isAuthenticated) navigate('/app/crm')
    else openRegister()
  }

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <Navbar />

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #E3FCEF 0%, #EBF4FF 60%, #FAFBFC 100%)',
        borderBottom: `3px solid ${color}`,
        padding: '80px 24px 72px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -80, width: 400, height: 400, background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: SURFACE, border: `1px solid ${color}40`, borderRadius: 100, padding: '5px 16px', marginBottom: 28, boxShadow: '0 1px 4px rgba(0,135,90,0.12)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color, letterSpacing: '0.04em' }}>bahn CRM</span>
            <span style={{ width: 1, height: 12, background: BORDER }} />
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: MUTED }}>Connected to Operations</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', fontWeight: 800, color: BLUE, lineHeight: 1.15, letterSpacing: '-0.03em', margin: '0 0 20px' }}>
            Revenue connected
            <br /><span style={{ color }}>to operations.</span>
          </h1>
          <p style={{ fontSize: '1.0625rem', color: SUBTLE, lineHeight: 1.7, maxWidth: 580, margin: '0 auto 24px' }}>
            bahn CRM is where your pipeline lives alongside the work to deliver it. When a deal closes, implementation doesn't disappear — it flows directly into Capsule.
          </p>
          {/* Callout */}
          <div style={{ display: 'inline-block', background: SURFACE, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${color}`, borderRadius: 6, padding: '12px 20px', marginBottom: 36, textAlign: 'left', boxShadow: '0 1px 4px rgba(9,30,66,0.06)' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Why CRM in bahnOS?</span>
            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: SUBTLE, lineHeight: 1.5, maxWidth: 460 }}>
              Most CRMs lose context the moment a deal closes. bahn CRM keeps revenue connected to the operational workspace, so delivery always knows the full story.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={goToApp}
              style={{ background: color, color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.9375rem', borderRadius: 4, padding: '12px 26px', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#006644' }}
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
            { label: 'Visual pipeline',      icon: '🏎️' },
            { label: 'Contacts & Orgs',      icon: '👥' },
            { label: 'Activity logging',     icon: '📋' },
            { label: 'Revenue forecasting',  icon: '📈' },
            { label: 'Connected to Capsule', icon: '🔗' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#FFFFFF', opacity: 0.85 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline visual mockup strip */}
      <section style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, padding: '40px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
            {[
              { stage: 'Qualified',    count: 8, value: '$124k', col: '#0052CC' },
              { stage: 'Proposal',     count: 5, value: '$89k',  col: '#6554C0' },
              { stage: 'Negotiation',  count: 3, value: '$67k',  col: color },
              { stage: 'Closed Won',   count: 2, value: '$41k',  col: '#00875A' },
            ].map((col, i) => (
              <div key={i} style={{ flex: '0 0 200px', background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '16px', minWidth: 180 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: col.col, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{col.stage}</span>
                  <span style={{ fontSize: '0.6875rem', color: MUTED, background: SURFACE, padding: '2px 6px', borderRadius: 4, border: `1px solid ${BORDER}` }}>{col.count}</span>
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: BLUE, marginBottom: 10 }}>{col.value}</div>
                {[...Array(Math.min(col.count, 2))].map((_, j) => (
                  <div key={j} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 4, padding: '8px 10px', marginBottom: 6 }}>
                    <div style={{ width: `${60 + j * 20}%`, height: 6, background: BORDER, borderRadius: 3, marginBottom: 4 }} />
                    <div style={{ width: '40%', height: 5, background: col.col + '25', borderRadius: 3 }} />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: MUTED, margin: '16px 0 0' }}>Visual pipeline — drag deals across stages</p>
        </div>
      </section>

      {/* Feature tabs */}
      <FeatureTabs />

      {/* Get started steps */}
      <section style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, padding: '72px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Get started</p>
          <h2 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 700, color: BLUE, margin: '0 0 48px', letterSpacing: '-0.02em' }}>
            From first contact to closed deal in four steps
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {[
              { n: '01', title: 'Set up your pipeline', desc: 'Create stages that match your sales process. Add deal owners and assign probabilities.' },
              { n: '02', title: 'Add contacts and orgs', desc: 'Import or create contacts and organizations. Link them to deals with role assignments.' },
              { n: '03', title: 'Log every interaction', desc: 'Record calls, emails, meetings, and notes. See the full timeline on every record.' },
              { n: '04', title: 'Close and hand off', desc: 'Mark deals won and push the implementation context directly into a Capsule map.' },
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
            A closed deal flows into Capsule
          </h3>
          <p style={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 28 }}>
            When a deal is won, the full context — contacts, notes, requirements — flows into a Capsule implementation map. Delivery always knows the full story.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/platform" style={{ display: 'inline-block', color: '#FFFFFF', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, padding: '10px 22px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 4, transition: 'background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >Learn about The Platform →</Link>
            <Link to="/capsule" style={{ display: 'inline-block', color: '#FFFFFF', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, padding: '10px 22px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 4, transition: 'background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >Explore bahn Capsule →</Link>
          </div>
        </div>
      </section>

      {/* Templates */}
      <section style={{ background: BG, borderTop: `1px solid ${BORDER}`, padding: '64px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Templates</p>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: BLUE, margin: '0 0 10px' }}>Start from a CRM template</h2>
          <p style={{ fontSize: '0.9375rem', color: SUBTLE, marginBottom: 36 }}>Ready-made pipelines and contact structures for real sales patterns.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
            {[
              { emoji: '🏎️', name: 'SaaS sales pipeline' }, { emoji: '🤝', name: 'Partnership pipeline' },
              { emoji: '📦', name: 'Enterprise deal room' }, { emoji: '🎯', name: 'SDR outreach tracker' },
              { emoji: '🔄', name: 'Renewal pipeline' },    { emoji: '📊', name: 'Revenue forecast' },
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
          <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#FFFFFF', margin: '0 0 14px', letterSpacing: '-0.03em' }}>Start with CRM.</h2>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: 32 }}>Free to start. No credit card required.</p>
          <button onClick={goToApp}
            style={{ background: color, color: '#fff', border: 'none', fontWeight: 700, fontSize: '1rem', padding: '14px 32px', borderRadius: 4, cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#006644' }}
            onMouseLeave={e => { e.currentTarget.style.background = color }}
          >Get started free →</button>
        </div>
      </section>

      <Footer />
    </div>
  )
}
