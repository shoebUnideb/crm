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
const color   = '#FF8B00'

const TABS = [
  {
    id: 'editor',
    label: 'Editor',
    features: [
      { icon: '✍️', title: 'Rich text editor',      desc: 'Tiptap-powered editor with headings, lists, tables, code blocks, and embeds.' },
      { icon: '🎨', title: 'Formatting toolbar',    desc: 'Full formatting options: bold, italic, underline, highlight, strikethrough.' },
      { icon: '📋', title: 'Tables',                desc: 'Insert and edit tables inline. Resize columns, merge cells, add rows.' },
      { icon: '💻', title: 'Code blocks',           desc: 'Syntax-highlighted code blocks with language detection and copy button.' },
      { icon: '🖼️', title: 'Image embeds',          desc: 'Paste, drag-in, or upload images directly into the page.' },
      { icon: '🔗', title: 'Slash commands',        desc: 'Type "/" to insert any block type — headings, callouts, dividers, embeds.' },
    ],
  },
  {
    id: 'spaces',
    label: 'Spaces',
    features: [
      { icon: '📁', title: 'Space hierarchy',       desc: 'Organize pages into Spaces with nested sub-pages and custom ordering.' },
      { icon: '🔐', title: 'Space permissions',     desc: 'Control who can read, comment, or edit each Space with member management.' },
      { icon: '📧', title: 'Space invites',         desc: 'Invite collaborators to specific Spaces by email with role assignment.' },
      { icon: '⭐', title: 'Starred pages',         desc: 'Star any page for quick access across sessions.' },
      { icon: '🔍', title: 'Page search',           desc: 'Full-text search across all Spaces you have access to.' },
      { icon: '🗂️', title: 'Page tree',             desc: 'Sidebar page tree for fast navigation through deeply nested docs.' },
    ],
  },
  {
    id: 'versions',
    label: 'Versions',
    features: [
      { icon: '🕓', title: 'Version history',       desc: 'Every save creates a versioned snapshot. Browse and restore any past state.' },
      { icon: '🔄', title: 'Diff view',             desc: 'Compare any two versions side-by-side with highlighted changes.' },
      { icon: '↩️', title: 'One-click restore',     desc: 'Restore any historical version of a page in a single click.' },
      { icon: '📝', title: 'Version notes',         desc: 'Add a description to manual saves to annotate significant changes.' },
      { icon: '👤', title: 'Author tracking',       desc: 'Each version records who made the change and when.' },
      { icon: '🔒', title: 'Page restrictions',     desc: 'Lock pages to prevent edits while allowing view access to the team.' },
    ],
  },
  {
    id: 'comments',
    label: 'Comments',
    features: [
      { icon: '💬', title: 'Page comments',         desc: 'Leave threaded comments on any page. Resolve or reopen threads.' },
      { icon: '✏️', title: 'Inline annotations',    desc: 'Highlight any text in a page and attach a comment to that selection.' },
      { icon: '🔔', title: 'Comment notifications', desc: 'Get notified when someone replies to your comment or tags you.' },
      { icon: '✅', title: 'Resolve threads',       desc: 'Mark comment threads as resolved to keep doc reviews clean.' },
      { icon: '👥', title: 'Mentions',              desc: 'Tag teammates with @mention inside comments to loop them in.' },
      { icon: '📌', title: 'Pinned comments',       desc: 'Pin important comments to the top of a page for quick reference.' },
    ],
  },
]

function FeatureTabs() {
  const [active, setActive] = useState('editor')
  const current = TABS.find(t => t.id === active)
  return (
    <section style={{ background: BG, borderTop: `1px solid ${BORDER}`, padding: '64px 24px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <p style={{ textAlign: 'center', fontSize: '0.6875rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Features</p>
        <h2 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 700, color: BLUE, margin: '0 0 32px', letterSpacing: '-0.02em', textAlign: 'center' }}>
          Everything the Wiki can do
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

export default function WikiPage() {
  const { isAuthenticated } = useAuth()
  const { openRegister } = useAuthModal()
  const navigate = useNavigate()

  const goToApp = () => {
    if (isAuthenticated) navigate('/app/docs')
    else openRegister()
  }

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <Navbar />

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #FFF7E6 0%, #EBF4FF 60%, #FAFBFC 100%)',
        borderBottom: `3px solid ${color}`,
        padding: '80px 24px 72px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -80, width: 400, height: 400, background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: SURFACE, border: `1px solid ${color}40`, borderRadius: 100, padding: '5px 16px', marginBottom: 28, boxShadow: '0 1px 4px rgba(255,139,0,0.12)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color, letterSpacing: '0.04em' }}>bahn Wiki</span>
            <span style={{ width: 1, height: 12, background: BORDER }} />
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: MUTED }}>Docs Where Work Lives</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', fontWeight: 800, color: BLUE, lineHeight: 1.15, letterSpacing: '-0.03em', margin: '0 0 20px' }}>
            Documentation
            <br /><span style={{ color }}>where work lives.</span>
          </h1>
          <p style={{ fontSize: '1.0625rem', color: SUBTLE, lineHeight: 1.7, maxWidth: 580, margin: '0 auto 24px' }}>
            bahn Wiki is a connected knowledge base. Spec docs live next to the Capsule nodes they describe. Onboarding guides link to the CRM deals that triggered them.
          </p>
          {/* Callout */}
          <div style={{ display: 'inline-block', background: SURFACE, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${color}`, borderRadius: 6, padding: '12px 20px', marginBottom: 36, textAlign: 'left', boxShadow: '0 1px 4px rgba(9,30,66,0.06)' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Why Wiki in bahnOS?</span>
            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: SUBTLE, lineHeight: 1.5, maxWidth: 460 }}>
              Docs that live in isolation lose context. bahn Wiki keeps documentation attached to the work it describes — a Capsule node links to its spec, a deal links to its onboarding guide.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={goToApp}
              style={{ background: color, color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.9375rem', borderRadius: 4, padding: '12px 26px', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#E07400' }}
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
            { label: 'Rich text editor',   icon: '✍️' },
            { label: 'Spaces & hierarchy', icon: '📁' },
            { label: 'Version history',    icon: '🕓' },
            { label: 'Slash commands',     icon: '🔗' },
            { label: 'Linked to Capsule',  icon: '⚡' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#FFFFFF', opacity: 0.85 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Editor preview strip */}
      <section style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, padding: '40px 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 12px rgba(9,30,66,0.08)' }}>
            {/* Editor toolbar */}
            <div style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: '10px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
              {['B', 'I', 'U', '—', 'H1', 'H2', '—', '{ }', '≡', '⊞'].map((btn, i) => (
                btn === '—'
                  ? <div key={i} style={{ width: 1, height: 16, background: BORDER }} />
                  : <button key={i} style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: SUBTLE, borderRadius: 4, padding: '3px 8px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>{btn}</button>
              ))}
            </div>
            {/* Fake page content */}
            <div style={{ padding: '28px 32px' }}>
              <div style={{ fontSize: '1.375rem', fontWeight: 700, color: BLUE, marginBottom: 14 }}>Engineering Onboarding Guide</div>
              <div style={{ width: '80%', height: 10, background: BORDER, borderRadius: 3, marginBottom: 8 }} />
              <div style={{ width: '65%', height: 10, background: BORDER, borderRadius: 3, marginBottom: 20 }} />
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 4, background: color, borderRadius: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: '55%', height: 9, background: BORDER, borderRadius: 3, marginBottom: 6 }} />
                  <div style={{ width: '70%', height: 9, background: BORDER, borderRadius: 3 }} />
                </div>
              </div>
              <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: color }}>🔗</span>
                <span style={{ fontSize: '0.75rem', color: ACCENT }}>Linked: Q2 Backend Sprint → Capsule node</span>
              </div>
            </div>
          </div>
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: MUTED, margin: '14px 0 0' }}>Rich text editor — docs connected to Capsule nodes</p>
        </div>
      </section>

      {/* Feature tabs */}
      <FeatureTabs />

      {/* Get started steps */}
      <section style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, padding: '72px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Get started</p>
          <h2 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 700, color: BLUE, margin: '0 0 48px', letterSpacing: '-0.02em' }}>
            From blank Space to team knowledge base in four steps
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {[
              { n: '01', title: 'Create a Space', desc: 'Spaces are top-level containers — create one per team, product, or project.' },
              { n: '02', title: 'Write your first page', desc: 'Use "/" to insert any block type. Heading, table, code block, callout.' },
              { n: '03', title: 'Organize with nesting', desc: 'Create sub-pages inside any page. Build a hierarchy that fits your team.' },
              { n: '04', title: 'Link to your work', desc: 'Attach a Wiki page to a Capsule node or CRM deal for full context.' },
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
            A Capsule node links to its spec doc
          </h3>
          <p style={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 28 }}>
            Attach any Wiki page to any Capsule node or CRM deal. Context travels with the work — spec docs, runbooks, onboarding guides — all linked where you need them.
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
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: BLUE, margin: '0 0 10px' }}>Start from a Wiki template</h2>
          <p style={{ fontSize: '0.9375rem', color: SUBTLE, marginBottom: 36 }}>Ready-made doc structures for real team knowledge needs.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
            {[
              { emoji: '📘', name: 'Engineering runbook' }, { emoji: '🧑‍💼', name: 'Employee handbook' },
              { emoji: '🚀', name: 'Product spec template' }, { emoji: '🔐', name: 'Security policy doc' },
              { emoji: '📋', name: 'Meeting notes' },        { emoji: '🎓', name: 'Onboarding guide' },
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
          <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#FFFFFF', margin: '0 0 14px', letterSpacing: '-0.03em' }}>Start with Wiki.</h2>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: 32 }}>Free to start. No credit card required.</p>
          <button onClick={goToApp}
            style={{ background: color, color: '#fff', border: 'none', fontWeight: 700, fontSize: '1rem', padding: '14px 32px', borderRadius: 4, cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#E07400' }}
            onMouseLeave={e => { e.currentTarget.style.background = color }}
          >Get started free →</button>
        </div>
      </section>

      <Footer />
    </div>
  )
}
