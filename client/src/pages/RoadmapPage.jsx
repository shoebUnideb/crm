import React, { useState } from 'react'
import Navbar from '../components/landing/Navbar.jsx'
import Footer from '../components/landing/Footer.jsx'

const bgPrimary    = '#0D1117'
const bgSecondary  = '#161B22'
const bgElevated   = '#1C2128'
const bgBand       = '#010409'
const borderColor  = '#30363D'
const textPrimary  = '#E6EDF3'
const textSecondary= '#8B949E'
const textMuted    = '#484F58'
const accentBlue   = '#2F81F7'
const statusGreen  = '#3FB950'
const capsuleColor = '#6366F1'
const crmColor     = '#10B981'
const wikiColor    = '#F59E0B'

function SectionLabel({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, justifyContent: 'center' }}>
      <div style={{ width: 32, height: 1, background: borderColor }} />
      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{children}</span>
      <div style={{ width: 32, height: 1, background: borderColor }} />
    </div>
  )
}

const AVAILABLE = [
  { title: 'Real-time collaboration',  product: 'Capsule', color: capsuleColor, desc: 'Live cursors, presence avatars, and conflict-free multi-user editing.', tags: ['Collab'] },
  { title: 'Jira two-way sync',        product: 'Capsule', color: capsuleColor, desc: 'Push nodes to Jira as Epics/Stories/Subtasks. Pull status updates back.', tags: ['Integrations'] },
  { title: 'Sprint board & burndown',  product: 'Capsule', color: capsuleColor, desc: 'Built-in sprint planning scoped to your canvas. Velocity and burndown charts.', tags: ['Agile'] },
  { title: 'Kanban board view',        product: 'Capsule', color: capsuleColor, desc: 'Drag cards across status columns. Multi-assignee swimlanes and WIP limits.', tags: ['Views'] },
  { title: 'Timeline / Gantt view',    product: 'Capsule', color: capsuleColor, desc: 'Auto-generated Gantt from node due dates and dependencies. Zoom weeks to quarters.', tags: ['Views'] },
  { title: 'CSV / image export',       product: 'Capsule', color: capsuleColor, desc: 'Export your canvas as PNG, SVG, or CSV for sharing outside bahnOS.', tags: ['Export'] },
  { title: 'Confluence export',        product: 'Capsule', color: capsuleColor, desc: 'Push structured content into Confluence pages directly from your map.', tags: ['Export'] },
  { title: 'CRM pipeline',            product: 'CRM',     color: crmColor,     desc: 'Kanban-style deal pipeline with custom stages, deal values, and forecasting.', tags: ['CRM'] },
  { title: 'Contacts & Organizations', product: 'CRM',     color: crmColor,     desc: 'Full contact and org records with activity timelines and deal history.', tags: ['CRM'] },
  { title: 'Activity logging',         product: 'CRM',     color: crmColor,     desc: 'Log calls, emails, meetings, and notes linked to any CRM record.', tags: ['CRM'] },
  { title: 'Wiki rich text editor',   product: 'Wiki',    color: wikiColor,    desc: 'Tiptap-powered editor with headings, tables, code blocks, slash commands.', tags: ['Wiki'] },
  { title: 'Spaces & page hierarchy', product: 'Wiki',    color: wikiColor,    desc: 'Organize pages into Spaces with nested sub-pages, permissions, and page tree.', tags: ['Wiki'] },
  { title: 'Page version history',    product: 'Wiki',    color: wikiColor,    desc: 'Every save creates a snapshot. Browse, diff, and restore any past version.', tags: ['Wiki'] },
  { title: 'Templates library',       product: 'Platform', color: accentBlue,  desc: '50+ ready-made templates across Capsule, CRM, and Wiki to get started fast.', tags: ['Platform'] },
  { title: 'Role-based access',        product: 'Platform', color: accentBlue,  desc: 'Admin, edit, and view roles per project with invite management and email invites.', tags: ['Platform'] },
  { title: 'Audit log',               product: 'Platform', color: accentBlue,  desc: 'Full change history for every project. Track who changed what and when.', tags: ['Platform'] },
]

const COMING = [
  { title: 'Global search',          product: 'Platform', color: accentBlue,  desc: 'Fuzzy-search across all nodes, pages, contacts, and deals from a single hotkey.', tags: ['Search'], when: 'Q2 2026' },
  { title: 'Onboarding flow',        product: 'Platform', color: accentBlue,  desc: 'Guided first-use tour for new users with an interactive sample project.', tags: ['UX'], when: 'Q2 2026' },
  { title: 'Node attachments',       product: 'Capsule', color: capsuleColor, desc: 'Attach files and images directly to nodes — stored alongside your project data.', tags: ['Capsule'], when: 'Q3 2026' },
  { title: 'Slack notifications',    product: 'Platform', color: accentBlue,  desc: 'Get notified in Slack when nodes or deals are updated. Reply to add comments.', tags: ['Integrations'], when: 'Q3 2026' },
  { title: 'AI layout suggestions',  product: 'Capsule', color: capsuleColor, desc: 'One-click AI that rearranges and groups canvas nodes by theme.', tags: ['AI'], when: 'Q3 2026' },
  { title: 'Self-serve billing',     product: 'Platform', color: accentBlue,  desc: 'Upgrade to Pro in-app with card payments. Team plan with seat management.', tags: ['Platform'], when: 'Q3 2026' },
  { title: 'CRM automation engine',  product: 'CRM',     color: crmColor,     desc: 'Trigger-based automations: move deals, assign tasks, send emails on conditions.', tags: ['CRM'], when: 'Q4 2026' },
  { title: 'Mobile app',             product: 'Platform', color: accentBlue,  desc: 'Native iOS and Android companion for viewing and editing on the go.', tags: ['Mobile'], when: 'Q4 2026' },
  { title: 'GitHub integration',     product: 'Capsule', color: capsuleColor, desc: 'Link nodes to GitHub issues and PRs. Auto-update status when issues close.', tags: ['Integrations'], when: 'Q4 2026' },
  { title: 'SSO / SAML',            product: 'Platform', color: accentBlue,  desc: 'Enterprise single sign-on via SAML 2.0. For Team plan and above.', tags: ['Platform'], when: 'Exploring' },
  { title: 'AI operational insights',product: 'Platform', color: accentBlue,  desc: 'Cross-product AI that surfaces blockers, risks, and progress across your workspace.', tags: ['AI'], when: 'Exploring' },
  { title: 'Offline mode',           product: 'Capsule', color: capsuleColor, desc: 'Full offline editing with automatic sync when you reconnect.', tags: ['Capsule'], when: 'Exploring' },
]

const TAG_COLORS = {
  Capsule:      { bg: capsuleColor + '20', text: capsuleColor },
  CRM:          { bg: crmColor + '20',     text: crmColor },
  Wiki:         { bg: wikiColor + '20',    text: wikiColor },
  Platform:     { bg: accentBlue + '20',   text: accentBlue },
  Collab:       { bg: '#A371F720',         text: '#A371F7' },
  Integrations: { bg: '#F8514920',         text: '#F85149' },
  Agile:        { bg: crmColor + '20',     text: crmColor },
  Views:        { bg: capsuleColor + '20', text: capsuleColor },
  Export:       { bg: '#484F5820',         text: textSecondary },
  AI:           { bg: wikiColor + '20',    text: wikiColor },
  Search:       { bg: accentBlue + '20',   text: accentBlue },
  UX:           { bg: crmColor + '20',     text: crmColor },
  Mobile:       { bg: '#A371F720',         text: '#A371F7' },
}

export default function RoadmapPage() {
  const [activeTag, setActiveTag] = useState(null)

  const allTags = [...new Set([...AVAILABLE, ...COMING].flatMap(i => i.tags))]

  const filteredAvailable = activeTag ? AVAILABLE.filter(i => i.tags.includes(activeTag)) : AVAILABLE
  const filteredComing    = activeTag ? COMING.filter(i => i.tags.includes(activeTag)) : COMING

  return (
    <div style={{ background: bgPrimary, color: textPrimary, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", minHeight: '100vh' }}>
      <Navbar />

      {/* Hero */}
      <section style={{ background: bgPrimary, padding: '80px 24px 60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, background: `radial-gradient(ellipse at center, ${accentBlue}0C 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <SectionLabel>Roadmap</SectionLabel>
          <h1 style={{ fontSize: 'clamp(2.25rem, 5vw, 3.25rem)', fontWeight: 800, color: textPrimary, lineHeight: 1.15, letterSpacing: '-0.03em', margin: '0 0 16px' }}>
            What we're building next
          </h1>
          <p style={{ fontSize: '1rem', color: textSecondary, lineHeight: 1.7, margin: '0 auto 10px', maxWidth: 520 }}>
            Public roadmap — updated every sprint. Have a feature request?{' '}
            <a href="mailto:feedback@bahn.app" style={{ color: accentBlue, textDecoration: 'none' }}>feedback@bahn.app</a>
          </p>
        </div>
      </section>

      {/* Tag filter */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 32px', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: textMuted, marginRight: 4 }}>Filter:</span>
        <button onClick={() => setActiveTag(null)}
          style={{ padding: '3px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', border: `1px solid ${activeTag === null ? textPrimary : borderColor}`, background: activeTag === null ? textPrimary : 'none', color: activeTag === null ? bgPrimary : textSecondary }}>
          All
        </button>
        {allTags.map(tag => {
          const c = TAG_COLORS[tag] || { bg: bgElevated, text: textSecondary }
          const isActive = activeTag === tag
          return (
            <button key={tag} onClick={() => setActiveTag(isActive ? null : tag)}
              style={{ padding: '3px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', border: `1px solid ${isActive ? c.text : borderColor}`, background: isActive ? c.bg : 'none', color: isActive ? c.text : textSecondary }}>
              {tag}
            </button>
          )
        })}
      </div>

      {/* Two-column layout */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>

        {/* Column 1: Available Now */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '12px 16px', background: statusGreen + '10', border: `1px solid ${statusGreen}30`, borderRadius: 8 }}>
            <span style={{ color: statusGreen, fontSize: '1rem' }}>✓</span>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: statusGreen }}>Available now</div>
              <div style={{ fontSize: '0.75rem', color: textMuted }}>Shipped and in your account today</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredAvailable.length === 0
              ? <p style={{ fontSize: '0.875rem', color: textMuted, padding: '20px 0' }}>No items match this filter.</p>
              : filteredAvailable.map((item, i) => (
                <div key={i} style={{ background: bgSecondary, border: `1px solid ${borderColor}`, borderRadius: 8, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: textPrimary }}>{item.title}</div>
                    <span style={{ color: statusGreen, fontSize: '0.875rem', flexShrink: 0 }}>✓</span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: textSecondary, lineHeight: 1.5, marginBottom: 10 }}>{item.desc}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    <span style={{ fontSize: '0.625rem', fontWeight: 700, background: item.color + '20', color: item.color, borderRadius: 4, padding: '2px 6px' }}>{item.product}</span>
                    {item.tags.filter(t => t !== item.product).map(tag => {
                      const c = TAG_COLORS[tag] || { bg: bgElevated, text: textSecondary }
                      return <span key={tag} style={{ fontSize: '0.625rem', fontWeight: 700, background: c.bg, color: c.text, borderRadius: 4, padding: '2px 6px' }}>{tag}</span>
                    })}
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Column 2: Coming Soon */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '12px 16px', background: bgSecondary, border: `1px solid ${borderColor}`, borderRadius: 8 }}>
            <span style={{ color: textMuted, fontSize: '1rem' }}>⟳</span>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: textSecondary }}>Coming soon</div>
              <div style={{ fontSize: '0.75rem', color: textMuted }}>Planned or actively being built</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredComing.length === 0
              ? <p style={{ fontSize: '0.875rem', color: textMuted, padding: '20px 0' }}>No items match this filter.</p>
              : filteredComing.map((item, i) => (
                <div key={i} style={{ background: bgSecondary, border: `1px dashed ${borderColor}`, borderRadius: 8, padding: '14px 16px', opacity: 0.8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: textSecondary }}>{item.title}</div>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: textMuted, background: bgElevated, border: `1px solid ${borderColor}`, padding: '2px 7px', borderRadius: 4, whiteSpace: 'nowrap', flexShrink: 0 }}>{item.when}</span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: textMuted, lineHeight: 1.5, marginBottom: 10 }}>{item.desc}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    <span style={{ fontSize: '0.625rem', fontWeight: 700, background: item.color + '15', color: item.color + 'B0', borderRadius: 4, padding: '2px 6px' }}>{item.product}</span>
                    {item.tags.filter(t => t !== item.product).map(tag => {
                      const c = TAG_COLORS[tag] || { bg: bgElevated, text: textSecondary }
                      return <span key={tag} style={{ fontSize: '0.625rem', fontWeight: 700, background: c.bg, color: c.text + '80', borderRadius: 4, padding: '2px 6px' }}>{tag}</span>
                    })}
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section style={{ background: bgBand, borderTop: `1px solid ${borderColor}`, padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <p style={{ fontSize: '0.875rem', color: textSecondary, margin: '0 0 8px' }}>Have a feature request?</p>
          <a href="mailto:feedback@bahn.app" style={{ color: accentBlue, fontWeight: 600, fontSize: '0.9375rem', textDecoration: 'none' }}>feedback@bahn.app →</a>
        </div>
      </section>

      <Footer />
    </div>
  )
}
