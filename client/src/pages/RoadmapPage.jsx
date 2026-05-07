import React, { useState } from 'react'
import Navbar from '../components/landing/Navbar.jsx'
import Footer from '../components/landing/Footer.jsx'

const blue      = '#0052CC'
const blueLight = '#DEEBFF'
const bluePale  = '#4C9AFF'
const navy      = '#172B4D'
const heroBlue  = '#0747A6'
const textSubtle = '#5E6C84'
const border    = '#DFE1E6'

function SectionLabel({ children, dark = false }) {
  return (
    <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: dark ? bluePale : blue, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ display: 'inline-block', width: 28, height: 2, background: dark ? bluePale : blue, borderRadius: 2, flexShrink: 0 }} />
      {children}
    </p>
  )
}

const QUARTERS = [
  {
    quarter: 'Q2 2026',
    label: 'In progress',
    color: { bg: '#E3FCEF', text: '#006644', dot: '#00875A' },
    items: [
      { title: 'Global search across maps', desc: 'Fuzzy-search all nodes across every project and map from a single hotkey.', tags: ['Search', 'Core'] },
      { title: 'Onboarding flow', desc: 'Guided first-use tour for new users with interactive tooltips and a sample project.', tags: ['UX'] },
      { title: 'Public roadmap page', desc: "This very page — open roadmap so users know what's coming.", tags: ['Transparency'] },
    ],
  },
  {
    quarter: 'Q3 2026',
    label: 'Planned',
    color: { bg: '#DEEBFF', text: '#0052CC', dot: '#0052CC' },
    items: [
      { title: 'Pricing & billing', desc: 'Self-serve upgrade to a Pro plan with higher collaborator limits and export quotas.', tags: ['Monetisation'] },
      { title: 'Node attachments', desc: 'Attach files and images directly to nodes — stored alongside your project data.', tags: ['Core'] },
      { title: 'Two-way Slack sync', desc: 'Get notified in Slack when nodes are updated; reply in Slack to add a comment.', tags: ['Integrations'] },
      { title: 'AI layout suggestions', desc: 'One-click AI that rearranges and groups your nodes by theme using embeddings.', tags: ['AI'] },
    ],
  },
  {
    quarter: 'Q4 2026',
    label: 'Exploring',
    color: { bg: '#F4F5F7', text: '#5E6C84', dot: '#97A0AF' },
    items: [
      { title: 'Mobile app (iOS & Android)', desc: 'Native mobile companion for viewing and editing maps on the go.', tags: ['Mobile'] },
      { title: 'GitHub integration', desc: 'Link nodes to GitHub issues and PRs; auto-update status when issues close.', tags: ['Integrations'] },
      { title: 'Custom node shapes', desc: 'Beyond rectangles — diamonds, hexagons, circles, and custom SVG shapes.', tags: ['Canvas'] },
      { title: 'Offline mode', desc: 'Full offline editing with automatic sync when you reconnect.', tags: ['Core'] },
    ],
  },
  {
    quarter: 'Released',
    label: 'Shipped',
    color: { bg: '#EAE6FF', text: '#403294', dot: '#6554C0' },
    items: [
      { title: 'Real-time collaboration', desc: 'Live cursors, presence avatars, and conflict-free multi-user editing.', tags: ['Collab'] },
      { title: 'Jira two-way sync', desc: 'Push nodes to Jira and pull status updates back automatically.', tags: ['Integrations'] },
      { title: 'Sprint board & burndown', desc: 'Built-in sprint planning directly from your mind map.', tags: ['Agile'] },
      { title: 'Gantt chart view', desc: 'Auto-generated Gantt from node due dates and dependencies.', tags: ['Views'] },
      { title: 'CSV / PNG / SVG export', desc: 'Export your map in multiple formats for sharing outside bahnOS.', tags: ['Export'] },
    ],
  },
]

const TAG_COLORS = {
  Core:         { bg: '#DEEBFF', text: '#0052CC' },
  UX:           { bg: '#E3FCEF', text: '#006644' },
  Search:       { bg: '#FFF0B3', text: '#172B4D' },
  Collab:       { bg: '#EAE6FF', text: '#403294' },
  Integrations: { bg: '#FFEBE6', text: '#BF2600' },
  Agile:        { bg: '#E3FCEF', text: '#006644' },
  Views:        { bg: '#DEEBFF', text: '#0052CC' },
  Export:       { bg: '#F4F5F7', text: '#5E6C84' },
  AI:           { bg: '#FFF0B3', text: '#172B4D' },
  Monetisation: { bg: '#FFEBE6', text: '#BF2600' },
  Mobile:       { bg: '#EAE6FF', text: '#403294' },
  Canvas:       { bg: '#DEEBFF', text: '#0052CC' },
  Transparency: { bg: '#E3FCEF', text: '#006644' },
}

export default function RoadmapPage() {
  const [activeTag, setActiveTag] = useState(null)

  const allTags = [...new Set(QUARTERS.flatMap(q => q.items.flatMap(i => i.tags)))]

  return (
    <div style={{ background: '#FAFBFC', color: navy, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minHeight: '100vh' }}>
      <Navbar />

      {/* Hero */}
      <section style={{ background: heroBlue, minHeight: '48vh', display: 'flex', alignItems: 'center', padding: '0 8vw', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(76,154,255,0.15) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: '-1%', bottom: '4%', fontSize: 'clamp(60px, 11vw, 150px)', fontWeight: 900, color: 'rgba(255,255,255,0.04)', letterSpacing: '-0.04em', lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>ROADMAP</div>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, width: '100%' }}>
          <SectionLabel dark>Roadmap</SectionLabel>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.08, marginBottom: 22, color: '#fff' }}>
            What we're<br /><span style={{ color: bluePale }}>building next</span>
          </h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.78, maxWidth: 500, marginBottom: 0 }}>
            This is our public roadmap — updated every sprint. Have a feature request? Reach us at{' '}
            <a href="mailto:feedback@bahn.app" style={{ color: bluePale, textDecoration: 'none', borderBottom: '1px solid rgba(76,154,255,0.45)' }}>feedback@bahn.app</a>
          </p>
        </div>
      </section>

      {/* Tag filter */}
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '32px 32px 0', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: textSubtle, marginRight: 4 }}>Filter:</span>
        <button
          onClick={() => setActiveTag(null)}
          style={{
            padding: '3px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
            border: `1px solid ${activeTag === null ? navy : border}`,
            background: activeTag === null ? navy : '#fff',
            color: activeTag === null ? '#fff' : textSubtle,
            cursor: 'pointer',
          }}
        >
          All
        </button>
        {allTags.map(tag => {
          const c = TAG_COLORS[tag] || { bg: '#F4F5F7', text: '#5E6C84' }
          const isActive = activeTag === tag
          return (
            <button
              key={tag}
              onClick={() => setActiveTag(isActive ? null : tag)}
              style={{
                padding: '3px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                border: `1px solid ${isActive ? c.text : border}`,
                background: isActive ? c.bg : '#fff',
                color: isActive ? c.text : textSubtle,
                cursor: 'pointer',
              }}
            >
              {tag}
            </button>
          )
        })}
      </div>

      {/* Roadmap columns */}
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '32px 32px 80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20, alignItems: 'start' }}>
        {QUARTERS.map(q => {
          const filtered = activeTag ? q.items.filter(i => i.tags.includes(activeTag)) : q.items
          if (activeTag && filtered.length === 0) return null
          return (
            <div key={q.quarter}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: q.color.dot, display: 'inline-block', flexShrink: 0 }} />
                <h2 style={{ fontSize: '0.8125rem', fontWeight: 700, color: navy, margin: 0 }}>{q.quarter}</h2>
                <span style={{ fontSize: 11, fontWeight: 700, background: q.color.bg, color: q.color.text, borderRadius: 4, padding: '2px 7px' }}>
                  {q.label}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filtered.map(item => (
                  <div key={item.title} style={{ background: '#fff', border: `1px solid ${border}`, borderRadius: 8, padding: '14px 14px 12px' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: navy, marginBottom: 5 }}>{item.title}</div>
                    <div style={{ fontSize: '0.8rem', color: textSubtle, lineHeight: 1.55, marginBottom: 10 }}>{item.desc}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {item.tags.map(tag => {
                        const c = TAG_COLORS[tag] || { bg: '#F4F5F7', text: '#5E6C84' }
                        return (
                          <span key={tag} style={{ fontSize: 10, fontWeight: 700, background: c.bg, color: c.text, borderRadius: 3, padding: '1px 6px' }}>
                            {tag}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <Footer />
    </div>
  )
}
