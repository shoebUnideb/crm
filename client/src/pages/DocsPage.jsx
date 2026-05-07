import React, { useState } from 'react'
import Navbar from '../components/landing/Navbar.jsx'
import Footer from '../components/landing/Footer.jsx'

const navy = '#172B4D'
const blue = '#0052CC'
const textSubtle = '#5E6C84'
const border = '#DFE1E6'

const SECTIONS = [
  { id: 'getting-started', label: 'Getting started' },
  { id: 'canvas', label: 'Canvas basics' },
  { id: 'nodes', label: 'Nodes & edges' },
  { id: 'projects', label: 'Projects & maps' },
  { id: 'jira', label: 'Jira integration' },
  { id: 'collab', label: 'Collaboration' },
  { id: 'export', label: 'Export & import' },
  { id: 'shortcuts', label: 'Keyboard shortcuts' },
]

const SHORTCUTS = [
  { category: 'Canvas navigation', items: [
    { keys: ['F'], desc: 'Fit canvas to screen' },
    { keys: ['Ctrl/⌘', '+'], desc: 'Zoom in' },
    { keys: ['Ctrl/⌘', '−'], desc: 'Zoom out' },
    { keys: ['Scroll'], desc: 'Pan vertically' },
    { keys: ['Shift', 'Scroll'], desc: 'Pan horizontally' },
    { keys: ['Space', 'Drag'], desc: 'Pan canvas' },
    { keys: ['P'], desc: 'Toggle presentation mode' },
  ]},
  { category: 'Nodes', items: [
    { keys: ['Tab'], desc: 'Add child node' },
    { keys: ['Enter'], desc: 'Add sibling node' },
    { keys: ['Delete / Backspace'], desc: 'Delete selected node' },
    { keys: ['Escape'], desc: 'Deselect / close panel' },
    { keys: ['F2'], desc: 'Rename selected node' },
    { keys: ['Ctrl/⌘', 'D'], desc: 'Duplicate node' },
    { keys: ['Ctrl/⌘', 'G'], desc: 'Group selected nodes' },
    { keys: ['L'], desc: 'Toggle lock on selected node' },
  ]},
  { category: 'History', items: [
    { keys: ['Ctrl/⌘', 'Z'], desc: 'Undo' },
    { keys: ['Ctrl/⌘', '⇧', 'Z'], desc: 'Redo' },
  ]},
  { category: 'Search & filter', items: [
    { keys: ['/'], desc: 'Open search bar' },
    { keys: ['Ctrl/⌘', 'F'], desc: 'Open search bar' },
  ]},
  { category: 'View', items: [
    { keys: ['?'], desc: 'Open keyboard shortcuts reference' },
    { keys: ['Ctrl/⌘', 'K'], desc: 'Toggle kanban view' },
    { keys: ['M'], desc: 'Toggle minimap' },
  ]},
]

function KeyChip({ k }) {
  return (
    <kbd style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: '#F4F5F7', border: `1px solid ${border}`, borderBottom: '2px solid #C1C7D0',
      borderRadius: 5, padding: '2px 8px', fontSize: '0.75rem', fontFamily: 'inherit',
      color: navy, fontWeight: 600, whiteSpace: 'nowrap',
    }}>{k}</kbd>
  )
}

function Section({ id, title, children }) {
  return (
    <section id={id} style={{ marginBottom: 56, scrollMarginTop: 100 }}>
      <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: navy, borderBottom: `2px solid ${border}`, paddingBottom: 12, marginBottom: 24 }}>{title}</h2>
      {children}
    </section>
  )
}

function P({ children }) {
  return <p style={{ fontSize: '0.9375rem', color: '#344563', lineHeight: 1.75, marginBottom: 14 }}>{children}</p>
}

function H3({ children }) {
  return <h3 style={{ fontSize: '1rem', fontWeight: 700, color: navy, margin: '24px 0 8px' }}>{children}</h3>
}

export default function DocsPage() {
  const [active, setActive] = useState('getting-started')

  return (
    <div style={{ background: '#FAFBFC', color: navy, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minHeight: '100vh' }}>
      <Navbar />

      {/* Hero */}
      <section style={{ background: navy, padding: '80px 24px 64px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4C9AFF', marginBottom: 12 }}>Documentation</p>
        <h1 style={{ fontSize: 'clamp(1.875rem, 4vw, 2.875rem)', fontWeight: 800, color: '#fff', lineHeight: 1.15, margin: '0 0 16px' }}>
          How bahnOS works
        </h1>
        <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, maxWidth: 500, margin: '0 auto' }}>
          Everything you need to get the most out of mind mapping, Jira sync, and collaboration.
        </p>
      </section>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 32px 96px', display: 'flex', gap: 48, alignItems: 'flex-start' }}>

        {/* Sidebar nav */}
        <nav style={{ width: 200, flexShrink: 0, position: 'sticky', top: 80 }}>
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`}
              onClick={() => setActive(s.id)}
              style={{
                display: 'block', padding: '7px 12px', borderRadius: 6, marginBottom: 2,
                fontSize: '0.875rem', fontWeight: active === s.id ? 600 : 400,
                color: active === s.id ? blue : textSubtle,
                background: active === s.id ? '#DEEBFF' : 'transparent',
                textDecoration: 'none', transition: 'background 0.1s, color 0.1s',
                borderLeft: active === s.id ? `3px solid ${blue}` : '3px solid transparent',
              }}
              onMouseEnter={e => { if (active !== s.id) { e.currentTarget.style.background = '#F4F5F7'; e.currentTarget.style.color = navy } }}
              onMouseLeave={e => { if (active !== s.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = textSubtle } }}
            >{s.label}</a>
          ))}
        </nav>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          <Section id="getting-started" title="Getting started">
            <P>Sign up at bahn.app, log in, and you'll land on the canvas. A default project with one mind map is created for you automatically.</P>
            <H3>1. Create your first node</H3>
            <P>Click anywhere on the canvas to create a root node, or press <strong>Tab</strong> on a selected node to add a child. Press <strong>Enter</strong> to add a sibling at the same level.</P>
            <H3>2. Organise into a tree</H3>
            <P>Drag nodes to reorder them. Use the <strong>Auto layout</strong> button in the Organize menu to apply a clean hierarchical or radial layout in one click.</P>
            <H3>3. Open the properties panel</H3>
            <P>Select any node and the right-hand properties panel opens. Set assignee, due date, priority, story points, issue type, and status — all fields that can be pushed to Jira.</P>
          </Section>

          <Section id="canvas" title="Canvas basics">
            <P>The canvas is infinite. Use the scroll wheel to pan vertically, <strong>Shift + scroll</strong> to pan horizontally, or hold <strong>Space</strong> and drag to pan freely.</P>
            <H3>Zoom</H3>
            <P>Zoom with <strong>Ctrl/⌘ +/−</strong> or pinch on a trackpad. Press <strong>F</strong> to fit the entire tree into view.</P>
            <H3>Frames</H3>
            <P>Frames are named rectangular regions that group related nodes visually. Create one from the canvas right-click menu. Frames are included in PNG/SVG exports.</P>
            <H3>Minimap</H3>
            <P>Toggle the minimap from the View menu. It shows your position in the canvas and lets you click-navigate to any part of the tree.</P>
          </Section>

          <Section id="nodes" title="Nodes & edges">
            <P>Every node can have a shape (rectangle, rounded, diamond, circle, hexagon), a colour, a status badge, and any number of custom metadata fields.</P>
            <H3>Extra edges</H3>
            <P>Beyond the tree structure, you can draw free-form edges between any two nodes. Drag from the small dot that appears on node hover. Extra edges support labels and can be styled as dependency arrows.</P>
            <H3>Node templates</H3>
            <P>Save any node (plus its subtree) as a reusable template. Templates appear in the Tools → Node templates panel and can be stamped onto the canvas or pasted as a child of any node.</P>
            <H3>Locking</H3>
            <P>Lock a node to prevent accidental moves or edits. Locked nodes show a lock icon. Unlock from the Tools menu or by pressing <strong>L</strong>.</P>
          </Section>

          <Section id="projects" title="Projects & maps">
            <P>A <strong>Project</strong> is a folder that holds one or more <strong>Mind Maps</strong>. Use the rail on the left to switch between projects; click a project to open its flyout and see its maps.</P>
            <H3>Creating a map</H3>
            <P>In the project flyout, click <strong>+ Blank</strong> for an empty canvas or <strong>📐 Template</strong> to import from the template gallery. Each map has its own canvas, undo history, and collab room.</P>
            <H3>Multiple maps</H3>
            <P>When a project has more than one map the breadcrumb in the navbar shows "Project / Map". Switch maps by clicking a map row in the flyout.</P>
          </Section>

          <Section id="jira" title="Jira integration">
            <H3>Connecting Jira</H3>
            <P>Go to <strong>Settings → Jira</strong> and enter your Jira base URL and a personal access token. bahnOS stores the token locally — it is never sent to our servers.</P>
            <H3>Pushing nodes to Jira</H3>
            <P>Select one or more nodes, open the Jira panel, choose a project key and issue type, and click <strong>Push to Jira</strong>. Each node becomes an issue and the Jira issue key is saved back to the node.</P>
            <H3>Pulling via JQL</H3>
            <P>Enter any JQL query in the Jira panel to import matching issues as nodes. Existing nodes with matching keys are updated; new keys create new nodes.</P>
            <H3>Two-way sync</H3>
            <P>Once a node has a Jira key, status changes in Jira are pulled back to the canvas on the next sync. Changes on the canvas (status, assignee, story points) are pushed to Jira on save.</P>
          </Section>

          <Section id="collab" title="Collaboration">
            <P>Collaboration is powered by WebSocket rooms. Each map has its own collab room, and projects have a project-level room for structural changes.</P>
            <H3>Sharing a map</H3>
            <P>Click <strong>Share</strong> in the navbar (or the three-dot menu in the project flyout) to generate a collab token. Share the link — teammates open it and are placed into the same room immediately.</P>
            <H3>Roles</H3>
            <P><strong>Admin</strong> — full access including sharing and deletion. <strong>Edit</strong> — can add, move, and modify nodes. <strong>View</strong> — read-only; can see cursors but not make changes.</P>
            <H3>Live cursors</H3>
            <P>Each connected user appears as a named cursor on the canvas. Cursor colour is derived from the user's email hash.</P>
          </Section>

          <Section id="export" title="Export & import">
            <P>All export options live in the <strong>Export</strong> dropdown in the bottom toolbar.</P>
            {[
              ['PNG', 'Full-resolution image of the canvas including all frames.'],
              ['SVG', 'Vector export — scalable and editable in Figma or Illustrator.'],
              ['CSV', 'Flat table of all nodes with metadata columns. Importable back into bahnOS.'],
              ['Markdown', 'Hierarchical outline using headings and bullet lists.'],
              ['Confluence markup', 'Paste directly into a Confluence page to render a structured table.'],
              ['Share link', 'Read-only URL that renders the current canvas state without requiring login.'],
            ].map(([f, d]) => (
              <div key={f} style={{ display: 'flex', gap: 12, marginBottom: 10, padding: '10px 14px', background: '#fff', border: `1px solid ${border}`, borderRadius: 8 }}>
                <span style={{ fontWeight: 700, color: blue, fontSize: '0.875rem', minWidth: 120 }}>{f}</span>
                <span style={{ fontSize: '0.875rem', color: '#344563', lineHeight: 1.6 }}>{d}</span>
              </div>
            ))}
          </Section>

          <Section id="shortcuts" title="Keyboard shortcuts">
            {SHORTCUTS.map(group => (
              <div key={group.category} style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: textSubtle, marginBottom: 10 }}>{group.category}</h3>
                <div style={{ background: '#fff', border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
                  {group.items.map((item, i) => (
                    <div key={item.desc} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: i > 0 ? `1px solid ${border}` : 'none' }}>
                      <span style={{ fontSize: '0.875rem', color: '#344563' }}>{item.desc}</span>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {item.keys.map((k, j) => (
                          <React.Fragment key={k}>
                            {j > 0 && <span style={{ color: textSubtle, fontSize: '0.75rem' }}>+</span>}
                            <KeyChip k={k} />
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </Section>

        </div>
      </div>

      <Footer />
    </div>
  )
}
