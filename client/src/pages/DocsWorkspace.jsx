import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AppShell from '../components/shared/AppShell.jsx'
import DocsHome from '../components/docs/DocsHome.jsx'
import SpaceCreate from '../components/docs/SpaceCreate.jsx'
import SpaceEdit from '../components/docs/SpaceEdit.jsx'
import SpaceMembers from '../components/docs/SpaceMembers.jsx'
import PageTree from '../components/docs/PageTree.jsx'
import PageEditor from '../components/docs/PageEditor.jsx'
import PageSearch from '../components/docs/PageSearch.jsx'
import PageTemplates from '../components/docs/PageTemplates.jsx'
import WikiNotificationBell from '../components/docs/WikiNotificationBell.jsx'
import * as docsApi from '../lib/docsApi.js'

export default function DocsWorkspace() {
  const navigate = useNavigate()
  const location = useLocation()

  // ── State ──────────────────────────────────────────────────────────────────
  const [spaces, setSpaces] = useState([])
  const [activeSpace, setActiveSpace] = useState(null)
  const [pages, setPages] = useState([])          // flat list for active space
  const [activePage, setActivePage] = useState(null)
  const [starredPages, setStarredPages] = useState([])
  const [showCreateSpace, setShowCreateSpace] = useState(false)
  const [showEditSpace, setShowEditSpace] = useState(null)
  const [confirmDeleteSpace, setConfirmDeleteSpace] = useState(null)  // space object or null
  const [showMembers, setShowMembers] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [pendingParentId, setPendingParentId] = useState(null)
  const [loading, setLoading] = useState(false)

  // ── Parse route: /app/docs, /app/docs/:spaceSlug, /app/docs/:spaceSlug/:pageId
  const pathParts = location.pathname.replace('/app/docs', '').split('/').filter(Boolean)
  const spaceSlugInUrl = pathParts[0] || null
  const pageIdInUrl = pathParts[1] ? Number(pathParts[1]) : null

  // ── Load spaces on mount (and after mutations) ────────────────────────────
  const loadSpaces = useCallback(() => {
    docsApi.getSpaces()
      .then(setSpaces)
      .catch(err => console.error('Failed to load spaces:', err))
  }, [])

  useEffect(() => { loadSpaces() }, [loadSpaces])

  // ── Load space when slug changes ───────────────────────────────────────────
  useEffect(() => {
    if (!spaceSlugInUrl) { setActiveSpace(null); setPages([]); setActivePage(null); return }
    const found = spaces.find(s => s.slug === spaceSlugInUrl)
    if (!found) return
    setActiveSpace(found)
    docsApi.getPageTree(found.id)
      .then(setPages)
      .catch(err => console.error('Failed to load pages:', err))
  }, [spaceSlugInUrl, spaces])

  // ── Load page when id changes ──────────────────────────────────────────────
  useEffect(() => {
    if (!pageIdInUrl) { setActivePage(null); return }
    docsApi.getPage(pageIdInUrl)
      .then(setActivePage)
      .catch(err => console.error('Failed to load page:', err))
  }, [pageIdInUrl])

  // ── Load starred pages ─────────────────────────────────────────────────────
  useEffect(() => {
    docsApi.getStarred()
      .then(setStarredPages)
      .catch(err => console.error('Failed to load starred pages:', err))
  }, [])

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleSpaceCreated = useCallback(space => {
    setShowCreateSpace(false)
    loadSpaces()
    navigate(`/app/docs/${space.slug}`)
  }, [navigate, loadSpaces])

  const handleSpaceUpdated = useCallback(updated => {
    setShowEditSpace(null)
    loadSpaces()
    if (activeSpace?.id === updated.id) setActiveSpace(prev => ({ ...prev, ...updated }))
  }, [activeSpace, loadSpaces])

  const handleSpaceDeleted = useCallback((space) => {
    setConfirmDeleteSpace(space)
  }, [])

  const handleConfirmDeleteSpace = useCallback(async () => {
    const space = confirmDeleteSpace
    if (!space) return
    setConfirmDeleteSpace(null)
    try {
      await docsApi.deleteSpace(space.id)
      setSpaces(prev => prev.filter(s => s.id !== space.id))
      loadSpaces()
      if (activeSpace?.id === space.id) navigate('/app/docs')
    } catch (err) {
      console.error('Failed to delete space:', err)
    }
  }, [confirmDeleteSpace, activeSpace, navigate, loadSpaces])

  const handlePageCreated = useCallback((parentId) => {
    setPendingParentId(parentId ?? null)
    setShowTemplates(true)
  }, [])

  const handleTemplateSelected = useCallback(async (template) => {
    if (!activeSpace) return
    setShowTemplates(false)
    try {
      const page = await docsApi.createPage(activeSpace.id, {
        title: template.title,
        content: template.content,
        parentId: pendingParentId,
      })
      setPages(prev => [...prev, page])
      navigate(`/app/docs/${activeSpace.slug}/${page.id}`)
    } catch (err) {
      console.error('Failed to create page:', err)
    }
  }, [activeSpace, pendingParentId, navigate])

  const handlePageSaved = useCallback(updated => {
    // activePage.nav_title is the ground truth — it's set by rename and never touched by save
    const nav_title = activePage?.nav_title ?? updated.nav_title ?? null
    setActivePage({ ...updated, nav_title })
    setPages(prev => prev.map(p => {
      if (p.id !== updated.id) return p
      return { ...p, title: updated.title, updated_at: updated.updated_at, nav_title: p.nav_title ?? nav_title }
    }))
  }, [activePage])

  const handleStarToggle = useCallback(async (pageId) => {
    try {
      const result = await docsApi.starPage(pageId)
      if (result.starred) {
        const page = pages.find(p => p.id === pageId) || activePage
        if (page) setStarredPages(prev => [...prev, { ...page, space_name: activeSpace?.name, space_icon: activeSpace?.icon }])
      } else {
        setStarredPages(prev => prev.filter(p => p.id !== pageId))
      }
    } catch (err) {
      console.error('Star toggle failed:', err)
    }
  }, [pages, activePage, activeSpace])

  const handlePageDeleted = useCallback(async (pageId) => {
    try {
      await docsApi.deletePage(pageId)
      setPages(prev => prev.filter(p => p.id !== pageId))
      if (activePage?.id === pageId) {
        navigate(`/app/docs/${activeSpace.slug}`)
      }
    } catch (err) {
      console.error('Failed to delete page:', err)
    }
  }, [activePage, activeSpace, navigate])

  const handlePageDuplicated = useCallback(async (pageId) => {
    try {
      const dupe = await docsApi.duplicatePage(pageId)
      setPages(prev => [...prev, dupe])
      navigate(`/app/docs/${activeSpace.slug}/${dupe.id}`)
    } catch (err) {
      console.error('Failed to duplicate page:', err)
    }
  }, [activeSpace, navigate])

  const handlePageRenamed = useCallback(async (pageId, navTitle) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, nav_title: navTitle } : p))
    if (activePage?.id === pageId) setActivePage(prev => ({ ...prev, nav_title: navTitle }))
    try {
      const updated = await docsApi.renamePage(pageId, navTitle)
      setPages(prev => prev.map(p => p.id === pageId ? { ...p, nav_title: updated.nav_title } : p))
      if (activePage?.id === pageId) setActivePage(prev => ({ ...prev, nav_title: updated.nav_title }))
    } catch (err) {
      console.error('Failed to rename page:', err)
    }
  }, [activePage])

  const [pendingOpenTemplates, setPendingOpenTemplates] = useState(false)

  // When a space becomes active and templates were requested from home, open them
  useEffect(() => {
    if (activeSpace && pendingOpenTemplates) {
      setPendingOpenTemplates(false)
      setShowTemplates(true)
    }
  }, [activeSpace, pendingOpenTemplates])

  const handleOpenTemplatesFromHome = useCallback(() => {
    if (spaces.length === 0) {
      setShowCreateSpace(true)
    } else if (activeSpace) {
      setShowTemplates(true)
    } else {
      setPendingOpenTemplates(true)
      navigate(`/app/docs/${spaces[0].slug}`)
    }
  }, [spaces, activeSpace, navigate])
  useEffect(() => {
    function handler(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(v => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ── Build page tree (nested from flat list) ────────────────────────────────
  function buildTree(flat, parentId = null) {
    return flat
      .filter(p => (p.parent_id ?? null) === parentId)
      .sort((a, b) => a.position - b.position)
      .map(p => ({ ...p, children: buildTree(flat, p.id) }))
  }

  const pageTree = buildTree(pages)

  // ── Context area for header ────────────────────────────────────────────────
  const contextArea = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
      {activeSpace && (
        <>
          <button
            onClick={() => navigate('/app/docs')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem', padding: '2px 4px', borderRadius: 4 }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
          >
            bahn Wiki
          </button>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>/</span>
          <span style={{ color: '#fff', fontSize: '0.8125rem', fontWeight: 500 }}>
            {activeSpace.icon} {activeSpace.name}
          </span>
          {activePage && (
            <>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>/</span>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                {activePage.title}
              </span>
            </>
          )}
        </>
      )}
      {!activeSpace && (
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8125rem', fontWeight: 500 }}>bahn Wiki</span>
      )}
      <div style={{ flex: 1 }} />
      <div
        onClick={() => setShowSearch(true)}
        title="Search pages (⌘K)"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#F7F8FA', border: '1.5px solid #DFE1E6',
          borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
          width: 280, flexShrink: 0,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#97A0AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span style={{ fontSize: 11, color: '#97A0AF', flex: 1 }}>Search pages…</span>
        <kbd style={{ fontSize: 9, color: '#97A0AF', border: '1px solid #DFE1E6', borderRadius: 3, padding: '0 4px', background: '#EBECF0' }}>⌘K</kbd>
      </div>
    </div>
  )

  return (
    <AppShell currentProduct="docs" contextArea={contextArea} notifications={
      <WikiNotificationBell spaces={spaces} onSpacesChanged={() => docsApi.getSpaces().then(setSpaces)} />
    }>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Left sidebar ────────────────────────────────────────────────── */}
        {activeSpace && (
          <aside style={{
            width: 240, flexShrink: 0,
            borderRight: '1px solid #DFE1E6',
            background: '#FAFBFC',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Back to spaces */}
            <div style={{ padding: '10px 12px 4px', borderBottom: '1px solid #EBECF0' }}>
              <button
                onClick={() => navigate('/app/docs')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#5E6C84', fontSize: '0.75rem', padding: '4px 6px', borderRadius: 4, width: '100%',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#EBECF0' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                All spaces
              </button>
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, padding: '2px 6px' }}>
                <span style={{ fontSize: '1rem' }}>{activeSpace.icon}</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#172B4D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {activeSpace.name}
                </span>
                {activeSpace.role === 'admin' && (
                  <button
                    onClick={() => setShowMembers(true)}
                    title="Manage members"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#97A0AF', padding: 2, borderRadius: 3, flexShrink: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#172B4D'; e.currentTarget.style.background = '#EBECF0' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#97A0AF'; e.currentTarget.style.background = 'none' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Starred pages in this space */}
            {starredPages.filter(p => p.space_id === activeSpace.id).length > 0 && (
              <div style={{ padding: '8px 12px 0' }}>
                <p style={{ margin: '0 0 4px', fontSize: '0.6875rem', fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Starred</p>
                {starredPages.filter(p => p.space_id === activeSpace.id).map(p => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/app/docs/${activeSpace.slug}/${p.id}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                      background: p.id === activePage?.id ? '#E8F0FE' : 'none',
                      border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 4,
                      color: '#172B4D', fontSize: '0.8125rem', textAlign: 'left',
                    }}
                    onMouseEnter={e => { if (p.id !== activePage?.id) e.currentTarget.style.background = '#EBECF0' }}
                    onMouseLeave={e => { if (p.id !== activePage?.id) e.currentTarget.style.background = 'none' }}
                  >
                    ★ {p.title}
                  </button>
                ))}
              </div>
            )}

            {/* Add root page button */}
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #EBECF0' }}>
              <button
                onClick={() => handlePageCreated(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                  background: 'none', border: '1px dashed #DFE1E6', borderRadius: 6,
                  cursor: 'pointer', padding: '6px 10px', color: '#5E6C84', fontSize: '0.8125rem',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#172B4D'; e.currentTarget.style.color = '#172B4D' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#DFE1E6'; e.currentTarget.style.color = '#5E6C84' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                New page
              </button>
            </div>

            {/* Page tree */}
            <div style={{ flex: 1, overflow: 'auto', padding: '8px 8px' }}>
              <PageTree
                nodes={pageTree}
                activePageId={activePage?.id}
                spaceSlug={activeSpace.slug}
                onCreatePage={handlePageCreated}
                onDelete={handlePageDeleted}
                onDuplicate={handlePageDuplicated}
                onRename={handlePageRenamed}
              />
            </div>
          </aside>
        )}

        {/* ── Main content area ────────────────────────────────────────────── */}
        <main style={{ flex: 1, overflow: 'auto', background: '#fff' }}>
          {!activeSpace && (
            <DocsHome
              spaces={spaces}
              starredPages={starredPages}
              onSelectSpace={space => navigate(`/app/docs/${space.slug}`)}
              onCreateSpace={() => setShowCreateSpace(true)}
              onEditSpace={space => setShowEditSpace(space)}
              onDeleteSpace={handleSpaceDeleted}
              onOpenTemplates={handleOpenTemplatesFromHome}
            />
          )}

          {activeSpace && !activePage && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#97A0AF' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, marginBottom: 16 }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <p style={{ margin: '0 0 4px', fontSize: '0.9375rem', fontWeight: 600, color: '#5E6C84' }}>Select a page</p>
              <p style={{ margin: '0 0 16px', fontSize: '0.8125rem' }}>Choose a page from the sidebar or create a new one</p>
              <button
                onClick={() => handlePageCreated(null)}
                style={{
                  background: '#172B4D', color: '#fff', border: 'none', borderRadius: 6,
                  padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
                }}
              >
                Create first page
              </button>
            </div>
          )}

          {activeSpace && activePage && (
            <PageEditor
              key={`${activePage.id}-${activePage.updated_at}`}
              page={activePage}
              effectiveRole={activePage.effectiveRole}
              onSave={handlePageSaved}
              onStarToggle={handleStarToggle}
              isStarred={starredPages.some(p => p.id === activePage.id)}
            />
          )}
        </main>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {showTemplates && activeSpace && (
        <PageTemplates
          onSelect={handleTemplateSelected}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {showCreateSpace && (
        <SpaceCreate
          onCreated={handleSpaceCreated}
          onClose={() => setShowCreateSpace(false)}
        />
      )}

      {confirmDeleteSpace && (
        <DeleteSpaceModal
          space={confirmDeleteSpace}
          onConfirm={handleConfirmDeleteSpace}
          onClose={() => setConfirmDeleteSpace(null)}
        />
      )}

      {showEditSpace && (
        <SpaceEdit
          space={showEditSpace}
          onUpdated={handleSpaceUpdated}
          onClose={() => setShowEditSpace(null)}
        />
      )}

      {showMembers && activeSpace && (
        <SpaceMembers
          space={activeSpace}
          onClose={() => setShowMembers(false)}
        />
      )}

      {showSearch && (
        <PageSearch
          spaces={spaces}
          onSelect={({ space, page }) => {
            setShowSearch(false)
            navigate(`/app/docs/${space.slug}/${page.id}`)
          }}
          onClose={() => setShowSearch(false)}
        />
      )}
    </AppShell>
  )
}

function DeleteSpaceModal({ space, onConfirm, onClose }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(9,30,66,0.54)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 12, width: 420,
        boxShadow: '0 20px 60px rgba(9,30,66,0.3)', overflow: 'hidden',
      }}>
        {/* Red header strip */}
        <div style={{ background: '#FFEBE6', padding: '20px 24px 16px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: '#FFBDAD',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DE350B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </div>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: '#172B4D' }}>
              Delete space
            </h2>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#5E6C84' }}>
              This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px 24px' }}>
          <p style={{ margin: '0 0 8px', fontSize: '0.875rem', color: '#172B4D' }}>
            You're about to delete{' '}
            <span style={{ fontWeight: 700 }}>{space.icon} {space.name}</span>.
          </p>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#5E6C84', lineHeight: 1.5 }}>
            All pages inside this space will be <strong style={{ color: '#DE350B' }}>permanently deleted</strong> and cannot be recovered.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px', borderRadius: 6,
                border: '1px solid #DFE1E6', background: '#fff',
                color: '#172B4D', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              style={{
                padding: '8px 18px', borderRadius: 6, border: 'none',
                background: '#DE350B', color: '#fff',
                cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#BF2600'}
              onMouseLeave={e => e.currentTarget.style.background = '#DE350B'}
            >
              Delete space
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
