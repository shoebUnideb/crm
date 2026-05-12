import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Canvas from './components/canvas/Canvas.jsx'
import JiraPanel from './components/sidebar/JiraPanel.jsx'
import ProjectsPanel from './components/projects/ProjectsPanel.jsx'
import DashboardPanel from './components/projects/DashboardPanel.jsx'
import MembersPanel from './components/collaboration/MembersPanel.jsx'
import NotificationBell from './components/notifications/NotificationBell.jsx'
import AppShell from './components/shared/AppShell.jsx'
import TemplatesDialog, { TEMPLATES as ALL_TEMPLATES } from './components/canvas/TemplatesDialog.jsx'
import OnboardingModal, { STORAGE_KEY as ONBOARDING_KEY } from './components/canvas/OnboardingModal.jsx'
import GlobalSearchModal from './components/canvas/GlobalSearchModal.jsx'
import { useProjects } from './hooks/useProjects.js'
import { useCollaboration } from './hooks/useCollaboration.js'
import { useNotifications } from './hooks/useNotifications.js'
import { useAuth } from './context/AuthContext.jsx'
import { getAuthToken } from './lib/localStorage.js'
import { trackEvent } from './lib/analyticsApi.js'
import { eventBus, EVENTS } from './lib/eventBus.js'

export default function TreeApp() {
  const { user, logout, isGuest } = useAuth()

  // Budget tracker: read quota from settings, compute used points from active project
  const [sprintQuota, setSprintQuota] = useState(() => {
    try { return Number(localStorage.getItem(`chart-to-jira-sprint-quota-${user?.id}`) || 0) } catch { return 0 }
  })
  // Re-read quota if user navigates back from settings
  useEffect(() => {
    function onFocus() {
      try { setSprintQuota(Number(localStorage.getItem(`chart-to-jira-sprint-quota-${user?.id}`) || 0)) } catch {}
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [user?.id])
  const {
    projects, activeProject, activeMap, activeId,
    createProject, deleteProject, renameProject, switchProject, importProject,
    createMindMap, deleteMindMap, renameMindMap, switchMindMap, importMapToProject,
    addChild, deleteNode, editNode, selectNode, deselect,
    updateNodeColor, toggleCollapse,
    moveNode, setShape, addEdge, addDependencyEdge, deleteEdge, applyLayout,
    duplicateNode, editNodeNotes,
    undo, redo, canUndo, canRedo, undoStackDepth, redoStackDepth,
    collapseAll, expandAll, autoColor, setNodeUrl, pasteSubtree, bulkDelete,
    setNodeMeta, addComment, deleteComment, editComment, collapseToDepth, applyJiraKeys, setEdgeType,
    addGroup, deleteGroup, renameGroup, applyRadialLayout,
    toggleLock, toggleReaction,
    reparentNode, setNodeChecklist,
    addStickyNote,
    activityLog, clearActivityLog,
    snapshots, saveSnapshot, restoreSnapshot, deleteSnapshot,
    setCustomStatuses,
    addFrame, deleteFrame, renameFrame,
    setEdgeLabel,
    setCustomFields,
    mergeNode,
    assignNodeKey,
    splitNode,
    setCollabSender,
    applyRemoteAction,
    shareProject,
    shareMap,
    markProjectCollab,
    loadRemoteProject,
  } = useProjects(user.id)

  const collab = useCollaboration()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    return eventBus.on(EVENTS.KICKED_FROM_PROJECT, (msg) => {
      if (msg.projectId === activeId) {
        alert(`You were removed from this project by ${msg.kickedBy || 'an admin'}.`)
        deleteProject(activeId)
      }
    })
  }, [activeId])

  useEffect(() => {
    const { focusNodeId, projectId, mapId } = location.state || {}
    if (!focusNodeId) return
    window.history.replaceState({}, '')

    async function applyNavigation() {
      const token = (() => { try { return localStorage.getItem('chart-to-jira-token') } catch { return null } })()
      // If projectId is specified and not in local state, fetch it from server first
      if (projectId) {
        const existsLocally = projects.some(p => p.id === projectId)
        if (!existsLocally) {
          try {
            const res = await fetch(`/api/projects/${projectId}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) {
              const serverProject = await res.json()
              loadRemoteProject(serverProject)
              // loadRemoteProject sets activeId; give React time to settle before switching map
              await new Promise(r => setTimeout(r, 150))
            }
          } catch (_) {}
        } else {
          switchProject(projectId)
        }
      }
      if (mapId && projectId) switchMindMap(projectId, mapId)
      setTimeout(() => selectNode(focusNodeId), 200)
    }

    applyNavigation()
  }, [location.state])
  const notifications = useNotifications(!isGuest ? getAuthToken() : null)
  const SIDEBAR_SEEN_KEY = 'chart-to-jira-sidebar-seen'
  const [openPanel, setOpenPanel] = useState(() => { // 'projects' | 'jira' | 'dashboard' | 'members' | null
    try { return localStorage.getItem('chart-to-jira-sidebar-seen') ? null : 'projects' } catch { return 'projects' }
  })
  const [hovBreadcrumb, setHovBreadcrumb] = useState(false)
  const [pendingRenameProjectId, setPendingRenameProjectId] = useState(null)
  const [saveStatus, setSaveStatus] = useState(null) // null | 'saving' | 'saved'
  const [sharingId, setSharingId] = useState(null) // project currently being shared
  const [showAppTemplates, setShowAppTemplates] = useState(false)
  // When set to a projectId, template selection adds a map to that project instead of creating a new project
  const [templateProjectTarget, setTemplateProjectTarget] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem(ONBOARDING_KEY) } catch { return false }
  })
  const [showGlobalSearch, setShowGlobalSearch] = useState(false)

  // Canvas data comes from the active map; project metadata stays in activeProject
  const state = activeMap

  // Active collab: map-level takes precedence over project-level
  const activeCollab = activeMap?.collab || activeProject?.collab
  const activeRoomId = activeCollab?.id || null

  // Wire collab sender: broadcast actions when in a collab room
  useEffect(() => {
    if (activeCollab) {
      setCollabSender((action, s) => collab.sendAction(action, s))
    } else {
      setCollabSender(null)
    }
  }, [activeCollab])

  // Join/leave collab room when active project/map or collab state changes
  useEffect(() => {
    if (!activeRoomId) {
      collab.leaveProject()
      return
    }
    const token = getAuthToken()
    if (!token) return
    collab.joinProject(activeRoomId, token)
  }, [activeId, activeRoomId])

  // Wire remote actions from collab to useProjects
  useEffect(() => {
    collab.setRemoteActionCallback((action) => {
      if (activeRoomId) applyRemoteAction(activeRoomId, action)
    })
  }, [activeId, activeRoomId, applyRemoteAction])

  useEffect(() => {
    if (!activeProject?.updatedAt) return
    setSaveStatus('saving')
    const t1 = setTimeout(() => setSaveStatus('saved'), 400)
    const t2 = setTimeout(() => setSaveStatus(null), 2400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [activeProject?.updatedAt])

  function togglePanel(name) {
    setOpenPanel(p => p === name ? null : name)
    trackEvent('feature_used', name === 'jira' ? 'jira_panel' : name === 'members' ? 'collab_panel' : name === 'dashboard' ? 'dashboard_panel' : name, user?.id, isGuest)
  }

  async function handleShareProject(projectId) {
    // Toggle closed if already open
    if (openPanel === 'members') { setOpenPanel(null); return }
    const project = projects.find(p => p.id === projectId)
    if (!project) return
    const authToken = getAuthToken()
    if (!authToken) {
      alert('You must be signed in to share projects.')
      return
    }
    // Always sync to server (idempotent — safe to call even if already shared)
    const { ok, error } = await shareProject(projectId, authToken)
    if (ok) {
      trackEvent('feature_used', 'collab_project_share', user?.id, isGuest)
      if (projectId !== activeId) switchProject(projectId)
      setOpenPanel('members')
    } else {
      alert(`Could not share project: ${error}`)
    }
  }

  async function handleShareMap(projectId, mapId) {
    if (openPanel === 'members') { setOpenPanel(null); return }
    const authToken = getAuthToken()
    if (!authToken) {
      alert('You must be signed in to share.')
      return
    }
    const { ok, error } = await shareMap(projectId, mapId, authToken)
    if (ok) {
      if (projectId !== activeId) switchProject(projectId)
      setOpenPanel('members')
    } else {
      alert(`Could not share map: ${error}`)
    }
  }

  // Mark sidebar as seen on first mount so subsequent visits start closed
  useEffect(() => {
    try { localStorage.setItem('chart-to-jira-sidebar-seen', '1') } catch {}
  }, [])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setOpenPanel(null)
      // ⌘K or Ctrl+K opens global search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowGlobalSearch(s => !s)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Apply template chosen on the /templates landing page
  useEffect(() => {
    const pendingId = sessionStorage.getItem('bahn_pending_template')
    if (pendingId) {
      sessionStorage.removeItem('bahn_pending_template')
      const template = ALL_TEMPLATES.find(t => t.id === pendingId)
      if (template) {
        const treeData = template.build()
        importProject({ ...treeData, name: template.name })
      }
    }
    if (sessionStorage.getItem('bahn_open_templates')) {
      sessionStorage.removeItem('bahn_open_templates')
      setShowAppTemplates(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle JQL import events from JiraPanel
  useEffect(() => {
    function onJiraImport(e) {
      const { issues } = e.detail
      if (!issues?.length || !state) return
      // Create nodes from issues as children of root
      for (const issue of issues) {
        // We'll dispatch addChild then editNode + setNodeMeta in sequence
        // Simple approach: just show alert with import instructions
      }
      // For now, create project from imported issues using importProject
      const p = state
      const newNodes = { ...p.nodes }
      for (const issue of issues) {
        const id = crypto.randomUUID()
        newNodes[id] = {
          id, title: issue.summary, parentId: p.rootId, childIds: [],
          depth: 1, color: null, collapsed: false, x: 0, y: 0, shape: 'rect',
          jiraKey: issue.key,
          status: issue.status ? normalizeStatus(issue.status) : null,
          issueType: issue.issueType ? issue.issueType.toLowerCase() : null,
          assignee: issue.assignee || null,
          priority: issue.priority ? normalizePriority(issue.priority) : null,
          tags: [], comments: [], notes: null, url: null,
          storyPoints: null, dueDate: null, sprint: null,
        }
        if (newNodes[p.rootId]) {
          newNodes[p.rootId] = { ...newNodes[p.rootId], childIds: [...newNodes[p.rootId].childIds, id] }
        }
      }
      // Import as new project version by dispatching bulkUpdate
      importProject({ ...p, nodes: newNodes, name: activeProject?.name || 'Imported from Jira' })
    }

    window.addEventListener('jira-import-nodes', onJiraImport)
    return () => window.removeEventListener('jira-import-nodes', onJiraImport)
  }, [state, importProject])

  function normalizeStatus(s) {
    const lower = s.toLowerCase()
    if (lower.includes('done') || lower.includes('closed') || lower.includes('resolved')) return 'done'
    if (lower.includes('progress') || lower.includes('review') || lower.includes('testing')) return 'in-progress'
    if (lower.includes('block')) return 'blocked'
    return 'todo'
  }

  function normalizePriority(p) {
    const lower = p.toLowerCase()
    if (lower === 'highest' || lower === 'blocker') return 'critical'
    if (lower === 'high') return 'high'
    if (lower === 'medium') return 'medium'
    if (lower === 'low' || lower === 'lowest' || lower === 'trivial') return 'low'
    return null
  }

  function handleGlobalSearchNavigate(projectId, mapId, nodeId) {
    switchProject(projectId)
    switchMindMap(projectId, mapId)
    setTimeout(() => selectNode(nodeId), 50)
  }

  return (
    <AppShell
      currentProduct="canvas"
      notifications={
        !isGuest ? (
          <NotificationBell
            invites={notifications.invites}
            onAccept={notifications.acceptInvite}
            onDecline={notifications.declineInvite}
            onProjectJoined={(projectData) => { if (projectData) loadRemoteProject(projectData) }}
          />
        ) : null
      }
      contextArea={
        <>
          {/* Project breadcrumb */}
          <div style={{ position: 'relative', flexShrink: 1, minWidth: 0 }}>
          <button
            onClick={() => togglePanel('projects')}
            onMouseEnter={e => { setHovBreadcrumb(true); if (openPanel !== 'projects') e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
            onMouseLeave={e => { setHovBreadcrumb(false); if (openPanel !== 'projects') e.currentTarget.style.background = 'transparent' }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: openPanel === 'projects' ? 'rgba(255,255,255,0.12)' : 'transparent',
              border: 'none', borderRadius: 4, cursor: 'pointer',
              padding: '4px 8px', maxWidth: 220, flexShrink: 1,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: activeProject ? '#fff' : 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeProject ? activeProject.name : 'No project'}
            </span>
            {activeMap && activeProject?.maps && Object.keys(activeProject.maps).length > 1 && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', flexShrink: 0 }}>/</span>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90 }}>
                  {activeMap.name}
                </span>
              </>
            )}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {hovBreadcrumb && openPanel !== 'projects' && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: '50%',
              transform: 'translateX(-50%)',
              background: '#172B4D', color: '#fff',
              fontSize: '0.75rem', whiteSpace: 'nowrap',
              padding: '5px 10px', borderRadius: 5,
              pointerEvents: 'none', zIndex: 1000,
            }}>
              Open projects &amp; maps
              <div style={{
                position: 'absolute', bottom: '100%', left: '50%',
                transform: 'translateX(-50%)',
                border: '4px solid transparent',
                borderBottomColor: '#172B4D',
              }} />
            </div>
          )}
          </div>

          <div style={{ flex: 1 }} />

          {/* Search */}
          <div
            onClick={() => setShowGlobalSearch(true)}
            title="Global search (⌘K)"
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
            <span style={{ fontSize: 11, color: '#97A0AF', flex: 1 }}>Search nodes, maps…</span>
            <kbd style={{ fontSize: 9, color: '#97A0AF', border: '1px solid #DFE1E6', borderRadius: 3, padding: '0 4px', background: '#EBECF0' }}>⌘K</kbd>
          </div>
        </>
      }
    >
      <div className="flex flex-1 overflow-hidden relative">
        {state ? (
          <Canvas
            projectId={activeId}
            treeState={state}
            onAddChild={addChild}
            onDeleteNode={deleteNode}
            onSelectNode={selectNode}
            onDeselect={deselect}
            onEditNode={editNode}
            onColorChange={updateNodeColor}
            onSetShape={setShape}
            onToggleCollapse={toggleCollapse}
            onMoveNode={moveNode}
            onAddEdge={addEdge}
            onAddDependencyEdge={addDependencyEdge}
            onDeleteEdge={deleteEdge}
            onApplyLayout={() => { applyLayout(); trackEvent('feature_used', 'auto_layout', user?.id, isGuest) }}
            onDuplicateNode={duplicateNode}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            undoStackDepth={undoStackDepth}
            redoStackDepth={redoStackDepth}
            onEditNotes={editNodeNotes}
            onCollapseAll={collapseAll}
            onExpandAll={expandAll}
            onAutoColor={autoColor}
            onSetNodeUrl={setNodeUrl}
            onPasteSubtree={pasteSubtree}
            onBulkDelete={bulkDelete}
            onSetNodeMeta={setNodeMeta}
            onAddComment={addComment}
            onDeleteComment={deleteComment}
            onEditComment={editComment}
            onCollapseToDepth={collapseToDepth}
            onApplyJiraKeys={applyJiraKeys}
            onSetEdgeType={setEdgeType}
            onAddGroup={addGroup}
            onDeleteGroup={deleteGroup}
            onRenameGroup={renameGroup}
            onApplyRadialLayout={() => { applyRadialLayout(); trackEvent('feature_used', 'radial_layout', user?.id, isGuest) }}
            onToggleLock={toggleLock}
            onToggleReaction={toggleReaction}
            onReparentNode={reparentNode}
            onSetNodeChecklist={setNodeChecklist}
            onAddStickyNote={addStickyNote}
            onSetEdgeLabel={setEdgeLabel}
            projects={projects}
            onSwitchProject={switchProject}
            activityLog={activityLog}
            onClearActivityLog={clearActivityLog}
            snapshots={snapshots}
            onSaveSnapshot={saveSnapshot}
            onRestoreSnapshot={restoreSnapshot}
            onDeleteSnapshot={deleteSnapshot}
            onImportTemplate={(treeData, name) => {
              importProject({ ...treeData, name })
            }}
            currentUser={user?.email}
            customStatuses={state?.customStatuses ?? []}
            onSetCustomStatuses={setCustomStatuses}
            customFields={state?.customFields ?? []}
            onSetCustomFields={setCustomFields}
            onMergeNode={mergeNode}
            onSplitNode={splitNode}
            frames={state?.frames ?? []}
            onAddFrame={addFrame}
            onDeleteFrame={deleteFrame}
            onRenameFrame={renameFrame}
            myRole={collab.connected ? collab.myRole : null}
            presence={collab.presence}
            onSendCursor={collab.connected ? collab.sendCursor : undefined}
            onTrackEvent={(feature) => trackEvent('feature_used', feature, user?.id, isGuest)}
            onAssignNodeKey={assignNodeKey}
          />
        ) : (
          <WelcomeScreen
            onCreateBlank={() => {
              const id = createProject('New Project')
              switchProject(id)
              setOpenPanel('projects')
              setPendingRenameProjectId(id)
            }}
            onOpenTemplates={() => setShowAppTemplates(true)}
          />
        )}

        {/* Backdrop — clicking outside panel closes it */}
        {openPanel && (
          <div className="absolute inset-0 z-20" onClick={() => setOpenPanel(null)} />
        )}

        {/* Projects overlay */}
        {openPanel === 'projects' && (
          <div
            className="absolute top-0 left-0 h-full z-30"
            onClick={e => e.stopPropagation()}
          >
            <ProjectsPanel
              projects={projects}
              activeId={activeId}
              activeMapId={activeProject?.activeMapId}
              onSwitch={switchProject}
              onCreate={(name) => {
                const id = createProject(name || 'New Project')
                setPendingRenameProjectId(id)
                return id
              }}
              onRename={renameProject}
              onDelete={deleteProject}
              onClose={() => setOpenPanel(null)}
              onShare={handleShareProject}
              onShareMap={handleShareMap}
              onFromTemplate={() => { setOpenPanel(null); setShowAppTemplates(true) }}
              onCreateMap={(projectId) => createMindMap(projectId)}
              onCreateMapFromTemplate={(projectId) => {
                setTemplateProjectTarget(projectId)
                setShowAppTemplates(true)
              }}
              onDeleteMap={deleteMindMap}
              onRenameMap={renameMindMap}
              onSwitchMap={(projectId, mapId) => { switchProject(projectId); switchMindMap(projectId, mapId) }}
              pendingRenameId={pendingRenameProjectId}
              onPendingRenameConsumed={() => setPendingRenameProjectId(null)}
              onExport={(projectId) => {
                const project = projects.find(p => p.id === projectId)
                if (!project) return
                const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
                const a = document.createElement('a')
                a.href = URL.createObjectURL(blob)
                a.download = `${project.name.replace(/\s+/g, '-')}.json`
                a.click()
                URL.revokeObjectURL(a.href)
              }}
              onImport={(data) => {
                if (!data?.maps && (!data?.nodes || !data?.rootId)) { alert('Invalid project file'); return }
                importProject(data)
              }}
            />
          </div>
        )}

        {/* Dashboard overlay */}
        {openPanel === 'dashboard' && (
          <div
            className="absolute top-0 left-0 h-full z-30"
            onClick={e => e.stopPropagation()}
          >
            <DashboardPanel
              projects={projects}
              activeId={activeId}
              onSwitch={switchProject}
              onClose={() => setOpenPanel(null)}
              onFromTemplate={() => { setOpenPanel(null); setShowAppTemplates(true) }}
            />
          </div>
        )}

        {/* Jira overlay */}
        {openPanel === 'jira' && state && (
          <JiraPanel
            treeState={state}
            userId={user?.id}
            onClose={() => setOpenPanel(null)}
            onApplyJiraKeys={applyJiraKeys}
          />
        )}

        {/* Members / Collaborators dialog */}
        {openPanel === 'members' && activeCollab && (
          <MembersPanel
            projectId={activeRoomId || activeId}
            myRole={collab.myRole || activeCollab.role}
            myUserId={user?.id}
            token={getAuthToken()}
            onClose={() => setOpenPanel(null)}
            onLeave={() => {
              setOpenPanel(null)
              deleteProject(activeId)
            }}
            mapCount={activeProject?.collab
              ? Object.keys(activeProject.maps || {}).length
              : activeMap?.collab ? 1 : 0}
            activeMapId={activeProject?.activeMapId}
            activeMapName={activeMap?.name}
          />
        )}
      </div>

      {/* App-level Templates Dialog */}
      {showAppTemplates && (
        <TemplatesDialog
          mode={templateProjectTarget ? 'map' : 'project'}
          onSelect={(template) => {
            const treeData = template.build()
            if (templateProjectTarget) {
              // Add as a new map inside the target project
              importMapToProject(templateProjectTarget, treeData, template.name)
              switchProject(templateProjectTarget)
            } else {
              // Create a new project
              importProject({ ...treeData, name: template.name })
            }
            setShowAppTemplates(false)
            setTemplateProjectTarget(null)
          }}
          onClose={() => { setShowAppTemplates(false); setTemplateProjectTarget(null) }}
        />
      )}
      {/* Onboarding modal — shown only on first visit */}
      {showOnboarding && (
        <OnboardingModal onDone={() => setShowOnboarding(false)} />
      )}

      {/* Global search modal — ⌘K */}
      {showGlobalSearch && (
        <GlobalSearchModal
          projects={projects}
          onNavigate={handleGlobalSearchNavigate}
          onClose={() => setShowGlobalSearch(false)}
        />
      )}
    </AppShell>
  )
}

function AppNavBtn({ active, onClick, disabled, accent, title, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: active && !accent ? '5px 10px 3px' : '5px 10px',
        borderRadius: 4, border: 'none',
        borderBottom: active && !accent ? '2px solid #4C9AFF' : '2px solid transparent',
        cursor: disabled ? 'default' : 'pointer',
        fontSize: '0.8125rem', fontWeight: 500,
        color: disabled
          ? 'rgba(255,255,255,0.2)'
          : active
            ? '#fff'
            : 'rgba(255,255,255,0.65)',
        background: active && accent ? '#0052CC' : 'transparent',
        transition: 'background 0.12s, color 0.12s, border-color 0.12s',
      }}
      onMouseEnter={e => {
        if (!disabled && !active) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
          e.currentTarget.style.color = '#fff'
        }
      }}
      onMouseLeave={e => {
        if (!disabled && !active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'rgba(255,255,255,0.65)'
        }
      }}
    >
      {children}
    </button>
  )
}

// ─── QUICK TEMPLATES shown on welcome screen ──────────────────────────────────
const QUICK_TEMPLATES = [
  { id: 'sprint',     icon: '🏃', name: 'Sprint Planning',   cat: 'Engineering' },
  { id: 'roadmap',    icon: '🗺️', name: 'Product Roadmap',   cat: 'Product'     },
  { id: 'retro',      icon: '🔄', name: 'Retrospective',     cat: 'Team'        },
  { id: 'okr',        icon: '🎯', name: 'OKR Planning',      cat: 'Product'     },
  { id: 'feature',    icon: '✨', name: 'Feature Breakdown', cat: 'Engineering' },
  { id: 'swot',       icon: '🔬', name: 'SWOT Analysis',     cat: 'Strategy'    },
]

function WelcomeScreen({ onCreateBlank, onOpenTemplates }) {
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F8F9FA', overflow: 'auto',
    }}>
      <div style={{ width: '100%', maxWidth: 680, padding: '48px 24px', textAlign: 'center' }}>

        {/* Logo mark */}
        <div style={{ marginBottom: 20 }}>
          <svg width="40" height="40" viewBox="0 0 30 30" fill="none">
            <circle cx="10" cy="15" r="9" fill="#0052CC" opacity="0.9"/>
            <circle cx="20" cy="15" r="9" fill="#4C9AFF" opacity="0.85"/>
          </svg>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#172B4D', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          Start a new project
        </h1>
        <p style={{ fontSize: 14, color: '#626F86', margin: '0 0 40px', lineHeight: 1.6 }}>
          Pick a template or start from scratch — every node syncs to Jira with one click.
        </p>

        {/* Two primary actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 40 }}>
          <button
            onClick={onCreateBlank}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: '20px 28px', borderRadius: 10,
              border: '1.5px dashed #C1C7D0', background: '#fff',
              cursor: 'pointer', minWidth: 140,
              transition: 'border-color 0.12s, box-shadow 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#4C9AFF'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,82,204,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#C1C7D0'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <span style={{ fontSize: 26 }}>＋</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#172B4D' }}>Blank project</span>
            <span style={{ fontSize: 11, color: '#8590A2' }}>Start from scratch</span>
          </button>

          <button
            onClick={onOpenTemplates}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: '20px 28px', borderRadius: 10,
              border: '1.5px solid #0052CC', background: '#DEEBFF',
              cursor: 'pointer', minWidth: 140,
              transition: 'background 0.12s, box-shadow 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#B3D4FF'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,82,204,0.15)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#DEEBFF'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <span style={{ fontSize: 26 }}>📐</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0052CC' }}>Browse templates</span>
            <span style={{ fontSize: 11, color: '#0065FF' }}>19 ready-made structures</span>
          </button>
        </div>

        {/* Quick template grid */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#8590A2', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
            Popular templates
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {QUICK_TEMPLATES.map(t => (
              <QuickTemplateCard key={t.id} template={t} onOpenTemplates={onOpenTemplates} />
            ))}
          </div>
        </div>

        <button
          onClick={onOpenTemplates}
          style={{ fontSize: 12, color: '#0052CC', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: '4px 0' }}
          onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
          onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
        >
          Browse all 19 templates →
        </button>
      </div>
    </div>
  )
}

function QuickTemplateCard({ template: t, onOpenTemplates }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onOpenTemplates}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', borderRadius: 8, textAlign: 'left',
        border: hovered ? '1.5px solid #4C9AFF' : '1.5px solid #E8EAED',
        background: hovered ? '#EFF6FF' : '#fff',
        cursor: 'pointer',
        transition: 'border-color 0.1s, background 0.1s',
      }}
    >
      <span style={{ fontSize: 18, flexShrink: 0 }}>{t.icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: hovered ? '#0052CC' : '#172B4D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {t.name}
        </div>
        <div style={{ fontSize: 10, color: '#8590A2', marginTop: 1 }}>{t.cat}</div>
      </div>
    </button>
  )
}

