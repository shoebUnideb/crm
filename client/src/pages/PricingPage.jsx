import React, { useState } from 'react'
import { Link } from 'react-router-dom'
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
const GREEN      = '#00875A'
const RED        = '#DE350B'

// ─── Hero ──────────────────────────────────────────────────────────────────────
function HeroBanner() {
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
      }}>PRICING</div>

      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: BLUE, color: '#fff', padding: '3px 10px',
          borderRadius: 3, fontSize: '0.6875rem', fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 18,
        }}>
          Pricing
        </div>
        <h1 style={{
          fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: BLUE,
          letterSpacing: '-0.03em', lineHeight: 1.15, margin: '0 0 14px',
        }}>
          Simple pricing. Start free.
        </h1>
        <p style={{ fontSize: '0.9375rem', color: SUBTLE, lineHeight: 1.75, margin: '0 0 12px', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
          One seat covers all three products — Capsule, CRM, and Wiki.
          No per-product add-ons. No hidden fees.
        </p>
        <div style={{ display: 'flex', gap: 22, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
          {['Free forever plan', 'All three products included', 'No credit card required'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: SUBTLE }}>
              <span style={{ color: ACCENT, fontWeight: 700 }}>✓</span> {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Products included strip ───────────────────────────────────────────────────
function IncludedStrip() {
  return (
    <div style={{
      background: BLUE,
      display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      {[
        { symbol: '⬡', name: 'bahn Capsule',   body: 'Visual execution workspace with Kanban, sprints, and Jira sync.', color: CAPSULE },
        { symbol: '◈', name: 'bahn CRM',        body: 'Revenue pipeline, contacts, orgs, and activity logging.',         color: CRM },
        { symbol: '▦', name: 'bahn Wiki',       body: 'Rich text docs, spaces, version history, and page comments.',     color: WIKI },
        { symbol: '⟳', name: 'Jira sync',      body: 'Two-way sync between Capsule nodes and Jira issues.',             color: BLUE_LIGHT },
        { symbol: '✓', name: 'Real-time collab', body: 'Shared cursors, live edits, role-based access on all products.',  color: '#4C9AFF' },
      ].map((f, i, arr) => (
        <div key={f.name} style={{
          padding: '22px 20px',
          borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <div style={{ color: f.color, flexShrink: 0, fontSize: '1.125rem', lineHeight: 1, marginTop: 2 }}>{f.symbol}</div>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff', marginBottom: 3, lineHeight: 1.3 }}>{f.name}</div>
            <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.55 }}>{f.body}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Tier cards ────────────────────────────────────────────────────────────────
const TIERS = [
  {
    name: 'Free',
    price: '$0',
    per: 'forever',
    accentColor: SUBTLE,
    description: 'Everything you need to get started.',
    cta: 'Start for free',
    ctaVariant: 'ghost',
    features: [
      { text: '3 projects', ok: true },
      { text: 'Unlimited nodes', ok: true },
      { text: '1 active sprint', ok: true },
      { text: '2 team members', ok: true },
      { text: 'Jira sync (read-only)', ok: true },
      { text: 'Wiki — 1 Space', ok: true },
      { text: 'CRM — up to 50 contacts', ok: true },
      { text: 'Community support', ok: true },
      { text: 'Two-way Jira sync', ok: false },
      { text: 'Unlimited sprints', ok: false },
    ],
  },
  {
    name: 'Pro',
    price: '$12',
    per: 'per seat / month',
    accentColor: ACCENT,
    description: 'For teams actively running operations.',
    cta: 'Start Pro trial',
    ctaVariant: 'primary',
    badge: 'Most popular',
    features: [
      { text: 'Unlimited projects', ok: true },
      { text: 'Unlimited nodes', ok: true },
      { text: 'Unlimited sprints', ok: true },
      { text: 'Unlimited team members', ok: true },
      { text: 'Jira two-way sync', ok: true },
      { text: 'Wiki — unlimited Spaces', ok: true },
      { text: 'CRM — unlimited contacts', ok: true },
      { text: 'Real-time collaboration', ok: true },
      { text: 'CSV, image, Confluence export', ok: true },
      { text: 'Priority email support', ok: true },
    ],
  },
  {
    name: 'Team',
    price: '$28',
    per: 'per seat / month',
    accentColor: CAPSULE,
    description: 'For larger teams with admin controls.',
    cta: 'Contact sales',
    ctaVariant: 'outlined',
    features: [
      { text: 'Everything in Pro', ok: true },
      { text: 'Advanced RBAC', ok: true },
      { text: 'Audit log', ok: true },
      { text: 'Custom fields (extended)', ok: true },
      { text: 'Dedicated onboarding', ok: true },
      { text: 'SLA support', ok: true },
      { text: 'SSO / SAML', ok: 'soon' },
      { text: 'CRM automation', ok: 'soon' },
    ],
  },
]

function TierCard({ tier, onCta }) {
  return (
    <div style={{
      background: SURFACE,
      border: `1px solid ${tier.ctaVariant === 'primary' ? tier.accentColor + '60' : BORDER}`,
      borderTop: `3px solid ${tier.accentColor}`,
      borderRadius: 8, padding: '28px 24px',
      position: 'relative', display: 'flex', flexDirection: 'column',
      boxShadow: tier.ctaVariant === 'primary' ? '0 4px 20px rgba(0,82,204,0.1)' : 'none',
    }}>
      {tier.badge && (
        <div style={{
          position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
          background: tier.accentColor, color: '#fff',
          fontSize: '0.625rem', fontWeight: 700, padding: '3px 12px', borderRadius: 100,
          whiteSpace: 'nowrap', letterSpacing: '0.04em',
        }}>{tier.badge}</div>
      )}

      <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: tier.accentColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        {tier.name}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: '2.25rem', fontWeight: 800, color: BLUE, letterSpacing: '-0.03em' }}>{tier.price}</span>
        {tier.price !== '$0' && <span style={{ fontSize: '0.75rem', color: SUBTLE }}>{tier.per}</span>}
      </div>
      {tier.price === '$0' && (
        <div style={{ fontSize: '0.75rem', color: SUBTLE, marginBottom: 4 }}>{tier.per}</div>
      )}

      <p style={{ margin: '0 0 20px', fontSize: '0.8125rem', color: SUBTLE, lineHeight: 1.5 }}>{tier.description}</p>

      <button onClick={onCta}
        style={{
          width: '100%', fontWeight: 600, fontSize: '0.875rem', borderRadius: 3,
          padding: '10px', cursor: 'pointer', marginBottom: 24, transition: 'all 0.15s',
          ...(tier.ctaVariant === 'primary'
            ? { background: tier.accentColor, color: '#fff', border: 'none' }
            : tier.ctaVariant === 'outlined'
            ? { background: 'transparent', color: tier.accentColor, border: `1px solid ${tier.accentColor}50` }
            : { background: 'transparent', color: BLUE, border: `1px solid ${BORDER}` }),
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.82' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
      >{tier.cta}</button>

      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {tier.features.map((f, i) => (
          <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            {f.ok === true  && <span style={{ color: GREEN, flexShrink: 0, fontWeight: 700, marginTop: 1 }}>✓</span>}
            {f.ok === false && <span style={{ color: '#C1C7D0', flexShrink: 0, marginTop: 1 }}>–</span>}
            {f.ok === 'soon' && <span style={{ color: '#97A0AF', flexShrink: 0, fontSize: '0.625rem', fontWeight: 700, background: '#F4F5F7', border: `1px solid ${BORDER}`, borderRadius: 3, padding: '1px 5px', marginTop: 2, whiteSpace: 'nowrap' }}>Soon</span>}
            <span style={{ fontSize: '0.8125rem', color: f.ok === false ? '#97A0AF' : SUBTLE }}>{f.text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function TiersSection({ onCta }) {
  return (
    <div style={{ background: BG, padding: '52px 56px', borderTop: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: 940, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, alignItems: 'start' }}>
          {TIERS.map(tier => <TierCard key={tier.name} tier={tier} onCta={onCta} />)}
        </div>
      </div>
    </div>
  )
}

// ─── All products callout ──────────────────────────────────────────────────────
function AllProductsCallout() {
  return (
    <div style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, padding: '28px 56px' }}>
      <div style={{ maxWidth: 940, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: SUBTLE, fontWeight: 500 }}>Every plan includes all three products:</p>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { symbol: '⬡', name: 'bahn Capsule', color: CAPSULE },
            { symbol: '◈', name: 'bahn CRM',     color: CRM },
            { symbol: '▦', name: 'bahn Wiki',    color: WIKI },
          ].map(p => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: p.color, fontSize: '0.875rem' }}>{p.symbol}</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: BLUE }}>{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Comparison table ──────────────────────────────────────────────────────────
const TABLE_ROWS = [
  { section: 'Capsule' },
  { label: 'Projects',            free: '3',           pro: 'Unlimited',  team: 'Unlimited' },
  { label: 'Nodes per project',   free: 'Unlimited',   pro: 'Unlimited',  team: 'Unlimited' },
  { label: 'Active sprints',      free: '1',           pro: 'Unlimited',  team: 'Unlimited' },
  { label: 'Jira sync',           free: 'Read-only',   pro: 'Two-way',    team: 'Two-way' },
  { label: 'Export (CSV, image)', free: true,          pro: true,         team: true },
  { label: 'Confluence export',   free: false,         pro: true,         team: true },
  { section: 'CRM' },
  { label: 'Contacts',            free: '50',          pro: 'Unlimited',  team: 'Unlimited' },
  { label: 'Pipelines',           free: '1',           pro: 'Unlimited',  team: 'Unlimited' },
  { label: 'Custom fields',       free: '3',           pro: '20',         team: 'Unlimited' },
  { label: 'CRM automation',      free: false,         pro: false,        team: 'Coming soon' },
  { section: 'Wiki' },
  { label: 'Spaces',              free: '1',           pro: 'Unlimited',  team: 'Unlimited' },
  { label: 'Version history',     free: '7 days',      pro: 'Unlimited',  team: 'Unlimited' },
  { label: 'Page restrictions',   free: false,         pro: true,         team: true },
  { section: 'Team & Security' },
  { label: 'Members',             free: '2',           pro: 'Unlimited',  team: 'Unlimited' },
  { label: 'Role-based access',   free: true,          pro: true,         team: true },
  { label: 'Audit log',           free: false,         pro: false,        team: true },
  { label: 'SSO / SAML',         free: false,         pro: false,        team: 'Coming soon' },
  { section: 'Support' },
  { label: 'Community support',   free: true,          pro: true,         team: true },
  { label: 'Priority email',      free: false,         pro: true,         team: true },
  { label: 'Dedicated onboarding',free: false,         pro: false,        team: true },
  { label: 'SLA',                 free: false,         pro: false,        team: true },
]

function Cell({ val, accent }) {
  if (val === true)  return <span style={{ color: GREEN, fontWeight: 700 }}>✓</span>
  if (val === false) return <span style={{ color: '#C1C7D0' }}>–</span>
  if (typeof val === 'string' && val.toLowerCase().includes('soon')) {
    return <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#97A0AF', background: '#F4F5F7', border: `1px solid ${BORDER}`, borderRadius: 3, padding: '1px 6px' }}>Soon</span>
  }
  return <span style={{ fontSize: '0.8125rem', color: accent ? accent : BLUE, fontWeight: accent ? 600 : 400 }}>{val}</span>
}

function ComparisonTable({ onCta }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background: SURFACE, padding: '0 56px 52px', borderTop: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: 940, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '48px 0 32px' }}>
          <p style={{ margin: '0 0 6px', fontSize: '0.6875rem', fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            COMPARE PLANS
          </p>
          <h2 style={{ margin: '0 0 8px', fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', fontWeight: 800, color: BLUE, letterSpacing: '-0.02em' }}>
            Full feature comparison
          </h2>
        </div>

        {/* Header row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', borderBottom: `2px solid ${BORDER}`, paddingBottom: 12, marginBottom: 0 }}>
          <div />
          {['Free', 'Pro', 'Team'].map((t, i) => (
            <div key={t} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: [SUBTLE, ACCENT, CAPSULE][i], textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t}</div>
              <div style={{ fontSize: '0.6875rem', color: '#97A0AF' }}>{['Free', '$12/seat', '$28/seat'][i]}</div>
            </div>
          ))}
        </div>

        {/* Rows */}
        {(open ? TABLE_ROWS : TABLE_ROWS.slice(0, 12)).map((row, i) => {
          if (row.section) {
            return (
              <div key={i} style={{ padding: '14px 0 6px', fontSize: '0.6875rem', fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em', borderTop: i > 0 ? `1px solid ${BORDER}` : 'none', marginTop: i > 0 ? 8 : 0 }}>
                {row.section}
              </div>
            )
          }
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '9px 0', borderBottom: `1px solid ${BG}` }}>
              <div style={{ fontSize: '0.8125rem', color: SUBTLE }}>{row.label}</div>
              <div style={{ textAlign: 'center' }}><Cell val={row.free} /></div>
              <div style={{ textAlign: 'center' }}><Cell val={row.pro} accent={ACCENT} /></div>
              <div style={{ textAlign: 'center' }}><Cell val={row.team} accent={CAPSULE} /></div>
            </div>
          )
        })}

        {!open && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button onClick={() => setOpen(true)}
              style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 3, padding: '8px 20px', fontSize: '0.8125rem', fontWeight: 600, color: BLUE, cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = BLUE }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER }}
            >Show full comparison ↓</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── FAQ ───────────────────────────────────────────────────────────────────────
const FAQS = [
  { q: 'Is there really a free tier?', a: 'Yes. The free tier is not a trial — it never expires. You get 3 projects, unlimited nodes, and access to all three products within the plan limits.' },
  { q: 'Can I use just Capsule without CRM or Wiki?', a: 'Absolutely. Start with one product and add others when you need them. Pricing is per seat regardless of which products you use.' },
  { q: 'How does Jira sync work on the free tier?', a: 'Free accounts can pull Jira tickets into bahnOS (read-only). Two-way sync — pushing nodes back to Jira as new issues — requires Pro or above.' },
  { q: 'Do you charge per product or per seat?', a: 'Per seat. One price gives access to Capsule, CRM, and Wiki.' },
  { q: 'What counts as a "project" on the free tier?', a: 'Each Capsule map is a project. Wiki Spaces and CRM pipelines are not counted against the project limit.' },
  { q: 'Can I switch plans later?', a: 'Yes. You can upgrade or downgrade at any time. When upgrading mid-cycle, you are billed the prorated difference. When downgrading, the change takes effect at the next billing period.' },
]

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: `1px solid ${BORDER}` }}>
      <button onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: 'none', border: 'none',
          padding: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer', textAlign: 'left', gap: 16,
        }}>
        <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: BLUE }}>{q}</span>
        <span style={{ color: SUBTLE, fontSize: '1rem', flexShrink: 0, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.15s' }}>+</span>
      </button>
      {open && (
        <div style={{ paddingBottom: 16 }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: SUBTLE, lineHeight: 1.7 }}>{a}</p>
        </div>
      )}
    </div>
  )
}

function FAQSection() {
  return (
    <div style={{ background: BG, borderTop: `1px solid ${BORDER}`, padding: '52px 56px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <p style={{ margin: '0 0 6px', fontSize: '0.6875rem', fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            FAQ
          </p>
          <h2 style={{ margin: '0 0 8px', fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', fontWeight: 800, color: BLUE, letterSpacing: '-0.02em' }}>
            Common questions
          </h2>
        </div>
        {FAQS.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
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
          Start free today.<br />
          <span style={{ color: BLUE_LIGHT }}>Upgrade when you need to.</span>
        </h2>
        <p style={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, maxWidth: 400, margin: '0 auto 32px' }}>
          No credit card required. All three products in your free account from day one.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
          <button onClick={onGetStarted}
            style={{ background: '#fff', color: BLUE, border: 'none', fontWeight: 700, fontSize: '0.9375rem', borderRadius: 3, padding: '12px 28px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.18)', transition: 'background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#DEEBFF' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
          >Get started free →</button>
          <Link to="/platform"
            style={{ display: 'inline-flex', alignItems: 'center', background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,0.35)', fontWeight: 500, fontSize: '0.9375rem', borderRadius: 3, padding: '12px 24px', textDecoration: 'none', transition: 'border-color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)' }}
          >Explore the platform →</Link>
        </div>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['Free forever plan', 'All 3 products included', 'No credit card'].map(badge => (
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
export default function PricingPage() {
  const { openRegister } = useAuthModal()

  return (
    <div style={{ background: BG, color: BLUE, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", minHeight: '100vh' }}>
      <Navbar />
      <HeroBanner />
      <IncludedStrip />
      <TiersSection onCta={openRegister} />
      <AllProductsCallout />
      <ComparisonTable onCta={openRegister} />
      <FAQSection />
      <CTABand onGetStarted={openRegister} />
      <Footer />
    </div>
  )
}
