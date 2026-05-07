import React from 'react'
import Navbar from '../components/landing/Navbar.jsx'
import Footer from '../components/landing/Footer.jsx'

const navy = '#172B4D'
const blue = '#0052CC'
const textSubtle = '#5E6C84'
const border = '#DFE1E6'

const RELEASES = [
  {
    version: 'v1.4', date: 'May 2026', headline: 'Multi-map projects & sidebar redesign',
    new: [
      'Projects now hold multiple mind maps — create, rename, and switch maps from the new sidebar',
      'Dual-column rail + flyout sidebar for fast project and map switching',
      'Templates can be imported directly as a new map inside an existing project',
      'Map-level collaboration: share individual maps with separate collab rooms',
    ],
    improved: [
      'Sidebar "+" button moved to top for faster access',
      'All toolbar buttons reorganised into grouped dropdowns (View, Organize, Export, Tools)',
      'Navbar redesigned with Home / Features / About links and project breadcrumb',
    ],
    fixed: [
      'Duplicate borderRadius key warning in RailAvatar component',
      'Template import was creating a new project instead of adding a map',
    ],
  },
  {
    version: 'v1.3', date: 'April 2026', headline: 'Kanban, Gantt & burndown views',
    new: [
      'Kanban board view driven by node status fields',
      'Gantt chart with drag-to-resize bars and dependency arrows',
      'Burndown chart for sprint progress tracking',
      'Swimlane view grouped by assignee or epic',
      'Critical-path highlighting on the canvas',
    ],
    improved: [
      'Filter bar now supports multi-select assignee and date-range filters',
      'Auto-layout respects collapsed subtrees',
      'Snapshot panel shows diff count since last snapshot',
    ],
    fixed: [
      'Edge label overflow on small screens',
      'Undo stack clearing on project switch',
      'Collab cursor flicker on low-latency connections',
    ],
  },
  {
    version: 'v1.2', date: 'March 2026', headline: 'Real-time collaboration & presence cursors',
    new: [
      'WebSocket collab with room-based sessions — share a project via a token link',
      'Live cursors show teammates\' names and positions in real time',
      'Role-based access: Admin, Edit, and View-only roles',
      'Online presence indicator in the navbar',
      'Webhook triggers for node status changes and Jira sync events',
    ],
    improved: [
      'Jira two-way sync now pulls status changes back to canvas nodes',
      'CSV export includes all custom metadata fields',
      'Keyboard shortcut overlay (press ?) with searchable list',
    ],
    fixed: [
      'JQL import failing on queries with quoted string values',
      'PNG export clipping frames that extended beyond viewport',
    ],
  },
  {
    version: 'v1.1', date: 'February 2026', headline: 'Node properties, custom fields & templates',
    new: [
      'Node properties panel with assignee, due date, priority, story points, and status',
      'Custom metadata fields per project (text, number, date, select)',
      'Project templates gallery with 19 ready-made templates',
      'Confluence markup export',
      'Markdown outline export',
      'Named snapshots for point-in-time recovery',
    ],
    improved: [
      'Auto-color assigns distinct branch colors on tree creation',
      'Compact mode reduces node height for dense trees',
      'Heatmap overlays for due date, priority, and story points',
    ],
    fixed: [
      'Node drag snapping incorrectly to hidden grid lines',
      'Frame rename not persisting after page refresh',
    ],
  },
  {
    version: 'v1.0', date: 'January 2026', headline: 'Initial release',
    new: [
      'Infinite canvas with freeform mind mapping',
      'Jira integration — push nodes as issues, pull via JQL',
      'Undo / redo with deep history',
      'Auto layout engine (hierarchical and radial)',
      'Export as PNG, SVG, CSV',
      'Dark mode',
      'Presentation mode',
      'Search and filter bar',
    ],
    improved: [],
    fixed: [],
  },
]

const BADGE = {
  new:      { bg: '#E3FCEF', color: '#006644', label: 'New' },
  improved: { bg: '#DEEBFF', color: '#0052CC', label: 'Improved' },
  fixed:    { bg: '#FFF0B3', color: '#172B4D', label: 'Fixed' },
}

function Badge({ type }) {
  const b = BADGE[type]
  return (
    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', background: b.bg, color: b.color, borderRadius: 4, padding: '2px 7px' }}>
      {b.label}
    </span>
  )
}

export default function ChangelogPage() {
  return (
    <div style={{ background: '#FAFBFC', color: navy, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minHeight: '100vh' }}>
      <Navbar />

      {/* Hero */}
      <section style={{ background: navy, padding: '80px 24px 64px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4C9AFF', marginBottom: 12 }}>
          Changelog
        </p>
        <h1 style={{ fontSize: 'clamp(1.875rem, 4vw, 2.875rem)', fontWeight: 800, color: '#fff', lineHeight: 1.15, margin: '0 0 16px' }}>
          What's new in bahnOS
        </h1>
        <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, maxWidth: 500, margin: '0 auto' }}>
          Every release, every fix, every improvement — documented here.
        </p>
      </section>

      {/* Timeline */}
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '64px 32px 96px' }}>
        {RELEASES.map((r, i) => (
          <div key={r.version} style={{ display: 'flex', gap: 32, marginBottom: 64 }}>
            {/* Left rail */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 120 }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: blue, background: '#DEEBFF', borderRadius: 6, padding: '4px 10px', textAlign: 'center', marginBottom: 8 }}>
                {r.version}
              </div>
              <div style={{ fontSize: '0.75rem', color: textSubtle, textAlign: 'center', marginBottom: 12 }}>{r.date}</div>
              {i < RELEASES.length - 1 && (
                <div style={{ flex: 1, width: 2, background: border, borderRadius: 2, minHeight: 40 }} />
              )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: '1.1875rem', fontWeight: 700, color: navy, margin: '0 0 20px' }}>
                {r.headline}
              </h2>

              {['new', 'improved', 'fixed'].map(type => {
                const items = r[type]
                if (!items?.length) return null
                return (
                  <div key={type} style={{ marginBottom: 18 }}>
                    <div style={{ marginBottom: 8 }}><Badge type={type} /></div>
                    <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {items.map(item => (
                        <li key={item} style={{ fontSize: '0.875rem', color: '#344563', lineHeight: 1.6 }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )
              })}

              {i < RELEASES.length - 1 && (
                <div style={{ height: 1, background: border, marginTop: 32 }} />
              )}
            </div>
          </div>
        ))}
      </div>

      <Footer />
    </div>
  )
}
