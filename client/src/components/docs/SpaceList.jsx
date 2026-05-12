import React from 'react'

const ACCENT = '#0052CC'

export default function SpaceList({ spaces, starredPages, onSelectSpace, onCreateSpace, onEditSpace, onDeleteSpace }) {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 32px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#172B4D' }}>Spaces</h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#5E6C84' }}>
            Organize your team's knowledge into spaces
          </p>
        </div>
        <button
          onClick={onCreateSpace}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: ACCENT, color: '#fff', border: 'none',
            borderRadius: 6, padding: '8px 16px', cursor: 'pointer',
            fontWeight: 600, fontSize: '0.875rem',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New space
        </button>
      </div>

      {/* Starred pages across all spaces */}
      {starredPages.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '0.75rem', fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Starred pages
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
            {starredPages.slice(0, 6).map(page => (
              <StarredPageCard key={page.id} page={page} onSelectSpace={onSelectSpace} spaces={spaces} />
            ))}
          </div>
        </section>
      )}

      {/* Spaces grid */}
      {spaces.length === 0 ? (
        <EmptyState onCreateSpace={onCreateSpace} />
      ) : (
        <section>
          <h2 style={{ margin: '0 0 12px', fontSize: '0.75rem', fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            All spaces
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
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
        </section>
      )}
    </div>
  )
}

function SpaceCard({ space, onClick, onEdit, onDelete }) {
  const [hovered, setHovered] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const menuRef = React.useRef(null)

  React.useEffect(() => {
    if (!menuOpen) return
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [menuOpen])

  const isAdmin = space.role === 'admin'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false) }}
      style={{ position: 'relative' }}
    >
      <button
        onClick={onClick}
        style={{
          display: 'flex', flexDirection: 'column', gap: 10, width: '100%',
          padding: '20px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
          background: hovered ? '#EAF3FF' : '#fff',
          border: hovered ? `1px solid ${ACCENT}60` : '1px solid #DFE1E6',
          transition: 'all 0.15s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8, fontSize: '1.25rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#F4F5F7', flexShrink: 0,
          }}>
            {space.icon}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#172B4D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: isAdmin ? 20 : 0 }}>
              {space.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#5E6C84', marginTop: 2, textTransform: 'capitalize' }}>
              {space.role}
            </div>
          </div>
        </div>
        {space.description && (
          <p style={{
            margin: 0, fontSize: '0.8125rem', color: '#5E6C84',
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {space.description}
          </p>
        )}
      </button>

      {/* ⋯ context menu — admin only */}
      {isAdmin && (hovered || menuOpen) && (
        <div ref={menuRef} style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }}
            style={{
              width: 26, height: 26, borderRadius: 4, border: 'none', cursor: 'pointer',
              background: menuOpen ? '#DEEBFF' : 'rgba(9,30,66,0.06)',
              color: menuOpen ? ACCENT : '#5E6C84',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', lineHeight: 1,
            }}
          >
            ⋯
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 4,
              background: '#fff', border: '1px solid #DFE1E6', borderRadius: 6,
              boxShadow: '0 4px 16px rgba(9,30,66,0.15)', zIndex: 200,
              minWidth: 148, overflow: 'hidden',
            }}>
              {[
                { label: 'Edit settings', action: () => { setMenuOpen(false); onEdit() } },
                { label: 'Delete space', action: () => { setMenuOpen(false); onDelete() }, danger: true },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={item.action}
                  style={{
                    display: 'block', width: '100%', padding: '7px 12px',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: 'transparent',
                    color: item.danger ? '#DE350B' : '#172B4D',
                    fontSize: '0.8125rem',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = item.danger ? '#FFEBE6' : '#F4F5F7'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StarredPageCard({ page, onSelectSpace, spaces }) {
  const space = spaces.find(s => s.id === page.space_id)
  if (!space) return null
  return (
    <button
      onClick={() => onSelectSpace(space)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
        background: '#fff', border: '1px solid #DFE1E6', borderRadius: 8,
        cursor: 'pointer', textAlign: 'left',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.background = '#EAF3FF' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#DFE1E6'; e.currentTarget.style.background = '#fff' }}
    >
      <span style={{ fontSize: '0.875rem' }}>★</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#172B4D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {page.title}
        </div>
        <div style={{ fontSize: '0.6875rem', color: '#97A0AF' }}>
          {page.space_icon} {page.space_name}
        </div>
      </div>
    </button>
  )
}

function CreateSpaceCard({ onClick }) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 8, padding: '20px', borderRadius: 10, cursor: 'pointer',
        border: `1px dashed ${hovered ? ACCENT : '#DFE1E6'}`,
        background: hovered ? '#EAF3FF' : 'transparent',
        transition: 'all 0.15s', minHeight: 100,
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={hovered ? ACCENT : '#97A0AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      <span style={{ fontSize: '0.875rem', color: hovered ? ACCENT : '#97A0AF', fontWeight: 500 }}>New space</span>
    </button>
  )
}

function EmptyState({ onCreateSpace }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 32px' }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>📄</div>
      <h2 style={{ margin: '0 0 8px', fontSize: '1.125rem', color: '#172B4D' }}>No spaces yet</h2>
      <p style={{ margin: '0 0 24px', color: '#5E6C84', fontSize: '0.875rem' }}>
        Create your first space to start organizing team documentation
      </p>
      <button
        onClick={onCreateSpace}
        style={{
          background: ACCENT, color: '#fff', border: 'none', borderRadius: 6,
          padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
        }}
      >
        Create first space
      </button>
    </div>
  )
}
