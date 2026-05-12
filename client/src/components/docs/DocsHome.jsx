import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { TEMPLATES } from './templates.js'

const ACCENT   = '#F59E0B'
const BLUE     = '#172B4D'
const BLUE_H   = '#253858'
const NAVY     = '#172B4D'
const SUBTLE   = '#5E6C84'
const BORDER   = '#DFE1E6'
const BG       = '#FAFBFC'
const SURFACE  = '#FFFFFF'

// ─── Main component ───────────────────────────────────────────────────────────
export default function DocsHome({
  spaces, starredPages,
  onCreateSpace, onSelectSpace, onEditSpace, onDeleteSpace,
  onOpenTemplates,
}) {
  const navigate = useNavigate()
  const goTemplates = () => navigate('/app/docs/templates')
  return (
    <div style={{ overflowY: 'auto', height: '100%', background: SURFACE }}>
      <HeroBanner onCreateSpace={onCreateSpace} onOpenTemplates={goTemplates} />
      <FeatureStrip />
      {starredPages.length > 0 && (
        <StarredSection starredPages={starredPages} spaces={spaces} />
      )}
      <SpacesSection
        spaces={spaces}
        onSelectSpace={onSelectSpace}
        onCreateSpace={onCreateSpace}
        onEditSpace={onEditSpace}
        onDeleteSpace={onDeleteSpace}
      />
      {spaces.length === 0 && <GettingStarted onCreateSpace={onCreateSpace} />}
      <DocsCTA onCreateSpace={onCreateSpace} onOpenTemplates={goTemplates} />
      <TemplatesSection onOpenTemplates={goTemplates} />
      <DocsFooter />
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroBanner({ onCreateSpace, onOpenTemplates }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #FFFBEB 0%, #FFF8E1 55%, #FAFBFC 100%)',
      borderBottom: `3px solid ${ACCENT}`,
      padding: '52px 56px 44px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Ghost text decoration */}
      <div style={{
        position: 'absolute', right: -16, bottom: -24,
        fontSize: 200, fontWeight: 900, color: 'rgba(245,158,11,0.06)',
        letterSpacing: '-0.06em', lineHeight: 1,
        userSelect: 'none', pointerEvents: 'none',
      }}>DOCS</div>

      {/* Decorative fake-document cards */}
      <div style={{ position: 'absolute', right: '8%', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 12, pointerEvents: 'none', opacity: 0.9 }}>
        <DocMockup offset={-16} title="System Architecture" lines={[7, 5, 6, 4, 5, 3]} />
        <DocMockup offset={0} title="Sprint Retro · May 2026" lines={[5, 4, 6, 4, 3]} featured />
        <DocMockup offset={-8} title="Product Roadmap Q2" lines={[6, 5, 4, 5]} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 560 }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: ACCENT, color: '#fff', padding: '3px 10px',
          borderRadius: 3, fontSize: '0.6875rem', fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 18,
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          bahn Wiki
        </div>

        <h1 style={{
          fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: NAVY,
          letterSpacing: '-0.03em', lineHeight: 1.15, margin: '0 0 14px',
        }}>
          Where teams turn<br />knowledge into momentum.
        </h1>
        <p style={{ fontSize: '0.9375rem', color: SUBTLE, lineHeight: 1.75, margin: '0 0 28px', maxWidth: 480 }}>
          Create, organize, and discover the docs that power your products and teams.
          Rich text, version history, comments, and linked to your Canvas nodes.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
          <button
            onClick={onCreateSpace}
            style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 3, padding: '10px 22px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = BLUE_H }}
            onMouseLeave={e => { e.currentTarget.style.background = BLUE }}
          >
            + New space
          </button>
          <button
            onClick={onOpenTemplates}
            style={{ background: 'transparent', color: NAVY, border: `1px solid ${BORDER}`, borderRadius: 3, padding: '10px 22px', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer', transition: 'border-color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = BLUE }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER }}
          >
            Browse templates →
          </button>
        </div>

        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
          {['Rich text editor', 'Version history', 'Page comments', 'Linked to Canvas'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: SUBTLE }}>
              <span style={{ color: ACCENT, fontWeight: 700 }}>✓</span> {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DocMockup({ offset, title, lines, featured }) {
  return (
    <div style={{
      width: featured ? 180 : 152, background: SURFACE,
      border: `1px solid ${BORDER}`, borderRadius: 8,
      boxShadow: featured ? '0 8px 32px rgba(9,30,66,0.14)' : '0 2px 8px rgba(9,30,66,0.08)',
      padding: '14px 14px 16px',
      transform: `translateY(${offset}px)`,
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
        <div style={{ width: 14, height: 14, borderRadius: 3, background: ACCENT, opacity: 0.8, flexShrink: 0 }} />
        <div style={{ fontSize: '0.625rem', fontWeight: 600, color: NAVY, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{title}</div>
      </div>
      {lines.map((w, i) => (
        <div key={i} style={{ height: 4, borderRadius: 2, background: i === 0 ? '#C1C7D0' : '#EBECF0', width: `${w * 12}%`, marginBottom: i === 0 ? 8 : 4 }} />
      ))}
    </div>
  )
}

// ─── Feature strip ────────────────────────────────────────────────────────────
const FEATURES = [
  {
    title: 'Structured to scale',
    body: 'Spaces, pages, and hierarchies that grow with your team.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    title: 'Collaborate in real-time',
    body: 'Edit together, leave comments, and keep everyone aligned.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    title: 'Secure by design',
    body: 'Granular permissions and access control you can trust.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  },
  {
    title: 'Connected ecosystem',
    body: 'Link docs to Canvas nodes, CRM deals, and Jira tickets.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    ),
  },
  {
    title: 'AI that understands',
    body: 'Find answers, generate content, and summarize instantly.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
]

function FeatureStrip() {
  return (
    <div style={{
      background: NAVY,
      display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      {FEATURES.map((f, i) => (
        <div key={f.title} style={{
          padding: '22px 22px',
          borderRight: i < FEATURES.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <div style={{ color: ACCENT, flexShrink: 0, marginTop: 2 }}>{f.icon}</div>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff', marginBottom: 3, lineHeight: 1.3 }}>{f.title}</div>
            <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.55 }}>{f.body}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Starred pages ────────────────────────────────────────────────────────────
function StarredSection({ starredPages, spaces }) {
  const navigate = useNavigate()
  return (
    <div style={{ background: BG, padding: '24px 56px', borderBottom: `1px solid ${BORDER}` }}>
      <p style={{ margin: '0 0 12px', fontSize: '0.6875rem', fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Starred pages
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {starredPages.slice(0, 8).map(page => {
          const space = spaces.find(s => s.id === page.space_id)
          if (!space) return null
          return (
            <button
              key={page.id}
              onClick={() => navigate(`/app/docs/${space.slug}/${page.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px',
                background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 6,
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.background = '#EAF3FF' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = SURFACE }}
            >
              <span style={{ fontSize: '0.875rem', color: ACCENT }}>★</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                  {page.title}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#97A0AF' }}>{page.space_icon} {page.space_name}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Spaces grid ──────────────────────────────────────────────────────────────
function SpacesSection({ spaces, onSelectSpace, onCreateSpace, onEditSpace, onDeleteSpace }) {
  return (
    <div style={{ padding: '36px 56px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <p style={{ margin: 0, fontSize: '0.6875rem', fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {spaces.length > 0 ? 'Your spaces' : 'No spaces yet'}
        </p>
      </div>

      {spaces.length === 0 ? (
        <EmptyState onCreateSpace={onCreateSpace} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {spaces.map(space => (
            <SpaceCard
              key={space.id}
              space={space}
              onClick={() => onSelectSpace(space)}
              onEdit={() => onEditSpace(space)}
              onDelete={() => onDeleteSpace(space)}
            />
          ))}
          <CreateSpaceCard onClick={onCreateSpace} />
        </div>
      )}
    </div>
  )
}

function SpaceCard({ space, onClick, onEdit, onDelete }) {
  const [hov, setHov] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = React.useRef(null)
  const isAdmin = space.role === 'admin'

  React.useEffect(() => {
    if (!menuOpen) return
    const handler = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ position: 'relative' }}>
      <button
        onClick={onClick}
        style={{
          display: 'flex', flexDirection: 'column', gap: 10, width: '100%',
          padding: '20px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
          background: hov ? '#EAF3FF' : SURFACE,
          border: hov ? `1px solid ${BLUE}60` : `1px solid ${BORDER}`,
          transition: 'all 0.15s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG, flexShrink: 0 }}>
            {space.icon}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: isAdmin ? 20 : 0 }}>
              {space.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: SUBTLE, marginTop: 2, textTransform: 'capitalize' }}>{space.role}</div>
          </div>
        </div>
        {space.description && (
          <p style={{ margin: 0, fontSize: '0.8125rem', color: SUBTLE, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {space.description}
          </p>
        )}
      </button>

      {isAdmin && (hov || menuOpen) && (
        <div ref={menuRef} style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }}
            style={{
              width: 26, height: 26, borderRadius: 4, border: 'none', cursor: 'pointer',
              background: menuOpen ? '#DEEBFF' : 'rgba(9,30,66,0.06)',
              color: menuOpen ? BLUE : SUBTLE,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
            }}
          >⋯</button>
          {menuOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 4,
              background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 6,
              boxShadow: '0 4px 16px rgba(9,30,66,0.15)', zIndex: 200, minWidth: 148, overflow: 'hidden',
            }}>
              {[
                { label: 'Edit settings', action: () => { setMenuOpen(false); onEdit() } },
                { label: 'Delete space', action: () => { setMenuOpen(false); onDelete() }, danger: true },
              ].map(item => (
                <button key={item.label} onClick={item.action} style={{
                  display: 'block', width: '100%', padding: '7px 12px', border: 'none',
                  cursor: 'pointer', textAlign: 'left', background: 'transparent',
                  color: item.danger ? '#DE350B' : NAVY, fontSize: '0.8125rem',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = item.danger ? '#FFEBE6' : BG }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >{item.label}</button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CreateSpaceCard({ onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 8, padding: '20px', borderRadius: 8, cursor: 'pointer',
        border: `1px dashed ${hov ? BLUE : BORDER}`,
        background: hov ? '#EAF3FF' : 'transparent',
        transition: 'all 0.15s', minHeight: 100,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={hov ? BLUE : '#97A0AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      <span style={{ fontSize: '0.875rem', color: hov ? BLUE : '#97A0AF', fontWeight: 500 }}>New space</span>
    </button>
  )
}

function EmptyState({ onCreateSpace }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 32px', background: BG, borderRadius: 8, border: `1px dashed ${BORDER}` }}>
      <div style={{ fontSize: '2.5rem', marginBottom: 14 }}>📄</div>
      <h3 style={{ margin: '0 0 8px', fontSize: '1rem', color: NAVY, fontWeight: 700 }}>Create your first space</h3>
      <p style={{ margin: '0 0 20px', color: SUBTLE, fontSize: '0.875rem', lineHeight: 1.6 }}>
        Spaces organize your team's documentation.<br />Create one to get started.
      </p>
      <button
        onClick={onCreateSpace}
        style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 3, padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', transition: 'background 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.background = BLUE_H }}
        onMouseLeave={e => { e.currentTarget.style.background = BLUE }}
      >
        Create first space
      </button>
    </div>
  )
}

// ─── Getting started (shown when no spaces) ───────────────────────────────────
function GettingStarted({ onCreateSpace }) {
  return (
    <div style={{ background: BG, padding: '36px 56px', borderTop: `1px solid ${BORDER}` }}>
      <h2 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: NAVY }}>Get started with bahn Wiki</h2>
      <p style={{ margin: '0 0 22px', fontSize: '0.875rem', color: SUBTLE }}>
        Follow these steps to set up your team's documentation hub.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        {[
          {
            num: '01', title: 'Create a space',
            body: "Spaces organize your team's knowledge. Create one for a project, department, or topic.",
            cta: onCreateSpace, ctaLabel: 'Create space →',
          },
          {
            num: '02', title: 'Add pages',
            body: 'Start writing with the rich text editor. Add headings, callouts, tables, and code blocks.',
          },
          {
            num: '03', title: 'Invite teammates',
            body: 'Add members to your space and collaborate in real-time. Assign admin, edit, or view permissions.',
          },
        ].map(step => (
          <div key={step.num} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '24px 22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#4C9AFF', opacity: 0.3, lineHeight: 1, marginBottom: 14, letterSpacing: '-0.04em' }}>{step.num}</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '0.9375rem', fontWeight: 700, color: NAVY }}>{step.title}</h3>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: SUBTLE, lineHeight: 1.65, flex: 1 }}>{step.body}</p>
            {step.cta && (
              <button
                onClick={step.cta}
                style={{ marginTop: 16, background: BLUE, color: '#fff', border: 'none', borderRadius: 3, padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8125rem', alignSelf: 'flex-start', transition: 'background 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = BLUE_H }}
                onMouseLeave={e => { e.currentTarget.style.background = BLUE }}
              >{step.ctaLabel}</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Mid-page CTA ─────────────────────────────────────────────────────────────
function DocsCTA({ onCreateSpace, onOpenTemplates }) {
  return (
    <div style={{
      background: '#172B4D',
      padding: '64px 56px',
      position: 'relative', overflow: 'hidden',
    }}>


      <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 14 }}>
          Get started
        </p>
        <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', lineHeight: 1.15, marginBottom: 14 }}>
          Collaborate faster.<br />
          <span style={{ color: '#4C9AFF' }}>Document everything.</span>
        </h2>
        <p style={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, maxWidth: 480, margin: '0 auto 32px' }}>
          Create a space, write your first page, and invite your team — all in under two minutes.
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
          <button
            onClick={onCreateSpace}
            style={{ background: '#fff', color: BLUE, border: 'none', fontWeight: 700, fontSize: '0.9375rem', borderRadius: 3, padding: '12px 28px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.18)', transition: 'background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#DEEBFF' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
          >
            + Create a space
          </button>
          <button
            onClick={onOpenTemplates}
            style={{ background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,0.35)', fontWeight: 500, fontSize: '0.9375rem', borderRadius: 3, padding: '12px 24px', cursor: 'pointer', transition: 'border-color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)' }}
          >
            Browse templates →
          </button>
        </div>

        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['Rich text editor', 'Version history', 'Page comments', 'Linked to Canvas nodes'].map(badge => (
            <div key={badge} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4C9AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

// ─── Templates ────────────────────────────────────────────────────────────────
const FEATURED_TEMPLATES = TEMPLATES.filter(t => t.id !== 'blank').slice(0, 6)

function TemplatesSection({ onOpenTemplates }) {
  return (
    <div style={{ padding: '36px 56px 52px', borderTop: `1px solid ${BORDER}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: NAVY }}>Start from a template</h2>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: SUBTLE }}>Pre-built page templates to help your team get started faster.</p>
        </div>
        <button
          onClick={onOpenTemplates}
          style={{ fontSize: '0.8125rem', fontWeight: 600, color: BLUE, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, marginTop: 2, padding: 0 }}
          onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
          onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
        >
          Browse all templates →
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {FEATURED_TEMPLATES.map(t => (
          <TemplateCard key={t.id} template={t} onClick={onOpenTemplates} />
        ))}
      </div>
    </div>
  )
}

function TemplateCard({ template, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
        background: hov ? '#EAF3FF' : BG,
        border: `1px solid ${hov ? BLUE + '55' : BORDER}`,
        borderRadius: 6, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
        width: '100%',
      }}
    >
      <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{template.icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: NAVY }}>{template.label}</div>
        <div style={{ fontSize: '0.6875rem', color: '#97A0AF', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{template.description}</div>
      </div>
    </button>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
const FOOTER_COLS = [
  {
    heading: 'Product',
    links: [
      { label: 'Home', to: '/' },
      { label: 'Features', to: '/features' },
      { label: 'Open Canvas', to: '/app/canvas' },
      { label: 'Open CRM', to: '/app/crm' },
    ],
  },
  {
    heading: 'Wiki',
    links: [
      { label: 'All spaces', to: '/app/docs' },
      { label: 'Documentation', to: '/docs' },
      { label: 'Keyboard shortcuts', to: '/docs#shortcuts' },
      { label: 'Changelog', to: '/changelog' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Blog', to: '/blog' },
      { label: 'Careers', to: '/careers' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy policy', to: '/privacy' },
      { label: 'Terms of service', to: '/terms' },
      { label: 'Cookie policy', to: '/cookies' },
    ],
  },
]

function DocsFooter() {
  return (
    <footer style={{ background: '#FAFBFC', borderTop: '1px solid #DFE1E6', color: NAVY }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 56px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr repeat(4, 1fr)', gap: '32px 24px' }}>

          {/* Brand */}
          <div>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 12 }}>
              <svg width="26" height="26" viewBox="0 0 30 30" fill="none">
                <circle cx="10" cy="15" r="9" fill="#0052CC" opacity="0.9"/>
                <circle cx="20" cy="15" r="9" fill="#4C9AFF" opacity="0.85"/>
              </svg>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: NAVY, letterSpacing: '-0.01em' }}>bahnOS</span>
            </Link>
            <p style={{ fontSize: '0.8125rem', color: SUBTLE, lineHeight: 1.65, maxWidth: 220 }}>
              Collaborative docs with rich text, comments, and version history — linked to your Canvas nodes.
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_COLS.map(col => (
            <div key={col.heading}>
              <h4 style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: SUBTLE, marginBottom: 14, margin: '0 0 14px' }}>
                {col.heading}
              </h4>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {col.links.map(link => (
                  <Link
                    key={link.label}
                    to={link.to}
                    style={{ color: SUBTLE, textDecoration: 'none', fontSize: '0.8125rem' }}
                    onMouseEnter={e => { e.currentTarget.style.color = BLUE; e.currentTarget.style.textDecoration = 'underline' }}
                    onMouseLeave={e => { e.currentTarget.style.color = SUBTLE; e.currentTarget.style.textDecoration = 'none' }}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ marginTop: 40, paddingTop: 16, paddingBottom: 20, borderTop: '1px solid #DFE1E6' }} />
      </div>
    </footer>
  )
}
