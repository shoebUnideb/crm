import React, { useEffect, useCallback, useRef, useState } from 'react'
import { usePanZoom } from '../../hooks/usePanZoom.js'
import { NODE_COLORS, COLOR_KEYS } from '../../lib/nodeColors.js'
import { SHAPES, getShapeDims } from '../../lib/nodeShapes.js'
import { NODE_WIDTH, NODE_HEIGHT } from '../../hooks/useLayout.js'
import GraphRenderer from './TreeRenderer.jsx'
import SearchOverlay from './SearchOverlay.jsx'
import NodeContextMenu from './NodeContextMenu.jsx'
import Minimap from './Minimap.jsx'
import NotesPanel from './NotesPanel.jsx'
import ShortcutsModal from './ShortcutsModal.jsx'
import NodeDetailDialog from './NodeDetailDialog.jsx'
import BulkEditPanel from './BulkEditPanel.jsx'
import FindReplacePanel from './FindReplacePanel.jsx'
import CommandPalette from './CommandPalette.jsx'
import KanbanView from './KanbanView.jsx'
import BurndownPanel from './BurndownPanel.jsx'
import ActivityLogPanel from './ActivityLogPanel.jsx'
import SnapshotsPanel from './SnapshotsPanel.jsx'
import WebhookPanel from './WebhookPanel.jsx'
import FilterBar, { applyFilters } from './FilterBar.jsx'
import GanttPanel from './GanttPanel.jsx'
import SprintBoard from './SprintBoard.jsx'
import TemplatesDialog from './TemplatesDialog.jsx'
import TableView from './TableView.jsx'
import TimelineView from './TimelineView.jsx'
import PriorityBoard from './PriorityBoard.jsx'
import StatsPanel from './StatsPanel.jsx'
import VelocityChart from './VelocityChart.jsx'
import SprintPlanningView from './SprintPlanningView.jsx'
import ResourceHeatmap from './ResourceHeatmap.jsx'
import { useToast, ToastContainer } from './Toast.jsx'
import { exportCSV, generateConfluenceMarkup, encodeShareLink, importCSV, exportMarkdown, parseTextAsTree } from '../../lib/exportUtils.js'
import CustomFieldsManager from './CustomFieldsManager.jsx'
import { useNodeLinks } from '../../hooks/useNodeLinks.js'
import { useGraphOverlay } from '../../hooks/useGraphOverlay.js'
import OverlayRenderer from './OverlayRenderer.jsx'
import GraphLensBar from './GraphLensBar.jsx'
import ImpactPanel from './ImpactPanel.jsx'

const PAL_W = 340
const PAL_H = 144
const GRID = 20

function countDescendants(nodes, nodeId) {
  let count = 0
  const queue = [...(nodes[nodeId]?.childIds ?? [])]
  while (queue.length > 0) {
    const id = queue.shift()
    count++
    if (nodes[id]) queue.push(...nodes[id].childIds)
  }
  return count
}

// Deep-clone a subtree into a new flat map with fresh IDs
function cloneSubtree(nodes, rootId) {
  const idMap = {}
  const queue = [rootId]
  while (queue.length > 0) {
    const id = queue.shift()
    idMap[id] = crypto.randomUUID()
    const node = nodes[id]
    if (node) node.childIds.forEach(c => queue.push(c))
  }
  const newNodes = {}
  for (const [oldId, newId] of Object.entries(idMap)) {
    const node = nodes[oldId]
    if (!node) continue
    newNodes[newId] = {
      ...node,
      id: newId,
      parentId: node.parentId ? (idMap[node.parentId] ?? null) : null,
      childIds: node.childIds.map(c => idMap[c]).filter(Boolean),
      x: node.x + 80,
      y: node.y + 80,
    }
  }
  return { nodes: newNodes, rootId: idMap[rootId] }
}

export default function Canvas({
  projectId,
  treeState,
  onAddChild,
  onDeleteNode,
  onSelectNode,
  onDeselect,
  onEditNode,
  onColorChange,
  onSetShape,
  onToggleCollapse,
  onMoveNode,
  onAddEdge,
  onAddDependencyEdge,
  onDeleteEdge,
  onApplyLayout,
  onDuplicateNode,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onEditNotes,
  onCollapseAll,
  onExpandAll,
  onAutoColor,
  onSetNodeUrl,
  onPasteSubtree,
  onBulkDelete,
  onSetNodeMeta,
  onAddComment,
  onDeleteComment,
  onEditComment,
  onCollapseToDepth,
  onApplyJiraKeys,
  onImportTemplate,
  onSetEdgeType,
  onAddGroup,
  onDeleteGroup,
  onRenameGroup,
  onApplyRadialLayout,
  onToggleLock,
  onToggleReaction,
  onReparentNode,
  onSetNodeChecklist,
  onAddStickyNote,
  onSetEdgeLabel,
  projects = [],
  onSwitchProject,
  activityLog,
  onClearActivityLog,
  snapshots,
  onSaveSnapshot,
  onRestoreSnapshot,
  onDeleteSnapshot,
  currentUser,
  customStatuses = [],
  onSetCustomStatuses,
  customFields = [],
  onSetCustomFields,
  onMergeNode,
  onSplitNode,
  frames = [],
  onAddFrame,
  onDeleteFrame,
  onRenameFrame,
  undoStackDepth = 0,
  redoStackDepth = 0,
  myRole = null,       // 'admin' | 'edit' | 'view' | null (null = local, no restriction)
  presence = [],       // [{ userId, email, role, cursor, color }]
  onSendCursor,        // (x, y) => void — send cursor position to collab
  onTrackEvent,        // (featureName) => void — analytics tracking
  onAssignNodeKey,     // (nodeId) => void — assign a nodeKey to an existing keyless node
}) {
  const {
    transformStr, transform, svgRef,
    onMouseDown: panMouseDown, onMouseMove: panMouseMove, onMouseUp: panMouseUp,
    resetView, centerView, zoomIn, zoomOut, fitToContent, panToCenter, setScale, panDist,
  } = usePanZoom()

  const { linkMap } = useNodeLinks(projectId)

  const [activeLens, setActiveLens] = useState(null)
  const [impactNodeId, setImpactNodeId] = useState(null)
  const { overlay, loading: overlayLoading } = useGraphOverlay(projectId, activeLens, !!activeLens)

  const handleLensToggle = useCallback((lensId) => {
    setActiveLens(prev => prev === lensId ? null : lensId)
  }, [])

  const { nodes, rootId, selectedNodeId, extraEdges: _extraEdges, groups = [] } = treeState

  const interactionRef = useRef({
    mode: 'idle', nodeId: null,
    startSX: 0, startSY: 0,
    startNX: 0, startNY: 0,
    dist: 0,
  })
  const [dragPos, setDragPos] = useState(null)
  const [dropTargetId, setDropTargetId] = useState(null)
  const [ghostEdge, setGhostEdge] = useState(null)
  const [hoveredNodeId, setHoveredNodeId] = useState(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState(null)
  const [multiSelectIds, setMultiSelectIds] = useState(new Set())
  const [editingNodeId, setEditingNodeId] = useState(null)
  const lastEditTriggerRef = useRef('other') // 'enter' | 'other'

  // Feature states
  const [showSearch, setShowSearch] = useState(false)
  const [contextMenu, setContextMenu] = useState(null)
  const [showMinimap, setShowMinimap] = useState(false)
  const [snapToGrid, setSnapToGrid] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [presentationMode, setPresentationMode] = useState(false)
  const [presentationIdx, setPresentationIdx] = useState(0)
  const [showSprintBoard, setShowSprintBoard] = useState(false)
  const [zoomMenuOpen, setZoomMenuOpen] = useState(false)
  const [nodeDetailId, setNodeDetailId] = useState(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showSwimlanes, setShowSwimlanes] = useState(false)
  const [swimlaneBy, setSwimlaneBy] = useState('assignee') // 'assignee' | 'sprint'
  const [showGantt, setShowGantt] = useState(false)
  const [showConfluenceModal, setShowConfluenceModal] = useState(false)
  const [confluenceMarkup, setConfluenceMarkup] = useState('')
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [showFindReplace, setShowFindReplace] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showKanban, setShowKanban] = useState(false)
  const [showTableView, setShowTableView] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)
  const [showPriorityBoard, setShowPriorityBoard] = useState(false)
  const [showBurndown, setShowBurndown] = useState(false)
  const [showFilterBar, setShowFilterBar] = useState(false)
  const [activeFilters, setActiveFilters] = useState({})
  const [assigneeFilter, setAssigneeFilter] = useState(null)
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false)
  const [heatmapMode, setHeatmapMode] = useState(null) // null | 'duedate' | 'priority' | 'points'
  const [colorByField, setColorByField] = useState(null) // null | 'status' | 'priority' | 'assignee' | 'issueType'
  const [showCriticalPath, setShowCriticalPath] = useState(false)
  const [showActivityLog, setShowActivityLog] = useState(false)
  const [showSnapshots, setShowSnapshots] = useState(false)
  const [showWebhooks, setShowWebhooks] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showUndoHistory, setShowUndoHistory] = useState(false)
  const [compactMode, setCompactMode] = useState(false)
  const [showWorkflow, setShowWorkflow] = useState(false)
  const [showNodeTemplates, setShowNodeTemplates] = useState(false)
  const [nodeTemplates, setNodeTemplates] = useState(() => {
    try { return JSON.parse(localStorage.getItem('chart-to-jira-node-templates') || '[]') } catch { return [] }
  })
  const [focusMode, setFocusMode] = useState(false)
  const [depsOnlyView, setDepsOnlyView] = useState(false)
  const [bgTheme, setBgTheme] = useState('dots')
  const navHistoryRef = useRef([])
  const navHistoryPosRef = useRef(-1)
  const prevSelectedRef = useRef(null)
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('chart-to-jira-dark') === '1' } catch { return false }
  })
  const [autoLayoutOnAdd, setAutoLayoutOnAdd] = useState(() => {
    try { return localStorage.getItem('chart-to-jira-auto-layout') === '1' } catch { return false }
  })
  const [showDependencyPanel, setShowDependencyPanel] = useState(false)
  const [openMenu, setOpenMenu] = useState(null) // 'view' | 'organize' | 'export' | 'tools' | null
  const [drawingFrame, setDrawingFrame] = useState(null) // { startX, startY, endX, endY } in canvas coords
  const [frameMode, setFrameMode] = useState(false)
  const [curvedEdges, setCurvedEdges] = useState(false)
  const [wipLimits, setWipLimits] = useState({})
  const [showVelocity, setShowVelocity] = useState(false)
  const [showSprintPlanning, setShowSprintPlanning] = useState(false)
  const [showResourceHeatmap, setShowResourceHeatmap] = useState(false)
  const [sizeByPoints, setSizeByPoints] = useState(false)
  // Feature 20: Custom fields manager
  const [showCustomFieldsManager, setShowCustomFieldsManager] = useState(false)
  // Feature 23: Bookmarks
  const [bookmarks, setBookmarks] = useState(() => { try { return JSON.parse(localStorage.getItem('chart-to-jira-bookmarks') || '[]') } catch { return [] } })
  const [showBookmarks, setShowBookmarks] = useState(false)
  // Feature 24: Time tracker
  const [activeTimer, setActiveTimer] = useState(null) // { nodeId, startedAt }
  const [timerDisplay, setTimerDisplay] = useState('')
  // Pomodoro timer
  const [pomodoroActive, setPomodoroActive] = useState(false)
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60)
  const [pomodoroBreak, setPomodoroBreak] = useState(false)
  // Feature 26: Auto-backup
  const [autoBackup, setAutoBackup] = useState(() => { try { return localStorage.getItem('chart-to-jira-autobackup') === '1' } catch { return false } })
  const { toasts, showToast } = useToast()

  // View-only mode: disables all editing interactions
  const isViewOnly = myRole === 'view'

  // Broadcast cursor position to collaborators
  const cursorThrottleRef = useRef(0)
  function handleCanvasMouseMove(e) {
    if (onSendCursor) {
      const now = Date.now()
      if (now - cursorThrottleRef.current > 50) { // 20fps max
        cursorThrottleRef.current = now
        const rect = svgRef.current?.getBoundingClientRect()
        if (rect) {
          const cx = (e.clientX - rect.left - transform.x) / transform.scale
          const cy = (e.clientY - rect.top - transform.y) / transform.scale
          onSendCursor(cx, cy)
        }
      }
    }
  }

  // Apply dark mode class to document
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    try { localStorage.setItem('chart-to-jira-dark', darkMode ? '1' : '0') } catch {}
  }, [darkMode])

  // Persist autoLayoutOnAdd
  React.useEffect(() => {
    try { localStorage.setItem('chart-to-jira-auto-layout', autoLayoutOnAdd ? '1' : '0') } catch {}
  }, [autoLayoutOnAdd])

  // Persist bookmarks (Feature 23)
  React.useEffect(() => {
    try { localStorage.setItem('chart-to-jira-bookmarks', JSON.stringify(bookmarks)) } catch {}
  }, [bookmarks])

  // Persist autoBackup setting (Feature 26)
  React.useEffect(() => {
    try { localStorage.setItem('chart-to-jira-autobackup', autoBackup ? '1' : '0') } catch {}
  }, [autoBackup])

  // Auto-backup effect (Feature 26)
  React.useEffect(() => {
    if (!autoBackup) return
    const INTERVAL = 5 * 60 * 1000 // 5 minutes
    function doBackup() {
      const project = { nodes, rootId, name: 'backup' }
      const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chart-backup-${new Date().toISOString().slice(0, 16).replace('T', '_')}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToast('Auto-backup saved')
    }
    const id = setInterval(doBackup, INTERVAL)
    return () => clearInterval(id)
  }, [autoBackup, nodes, rootId])

  // Timer display update (Feature 24)
  React.useEffect(() => {
    if (!activeTimer) { setTimerDisplay(''); return }
    const update = () => {
      const elapsed = Math.floor((Date.now() - activeTimer.startedAt) / 1000)
      const h = Math.floor(elapsed / 3600)
      const m = Math.floor((elapsed % 3600) / 60)
      const s = elapsed % 60
      setTimerDisplay(`${h > 0 ? h + 'h ' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [activeTimer])

  // Close dropdown menus on outside click
  React.useEffect(() => {
    if (!openMenu) return
    const handler = () => setOpenMenu(null)
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [openMenu])

  // Apply saved default zoom on initial project load
  React.useEffect(() => {
    if (!projectId) return
    const timer = setTimeout(() => {
      try {
        const u = JSON.parse(localStorage.getItem('chart-to-jira-user') || '{}')
        const saved = Number(localStorage.getItem(`chart-to-jira-default-zoom-${u.id}`))
        if (saved && saved !== 100) setScale(saved / 100)
      } catch {}
    }, 200)
    return () => clearTimeout(timer)
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Pomodoro countdown
  React.useEffect(() => {
    if (!pomodoroActive) return
    if (pomodoroSeconds <= 0) {
      setPomodoroBreak(b => !b)
      setPomodoroSeconds(pomodoroBreak ? 25 * 60 : 5 * 60)
      showToast(pomodoroBreak ? '🍅 Work session started!' : '☕ Break time — 5 minutes')
      return
    }
    const id = setInterval(() => setPomodoroSeconds(s => s - 1), 1000)
    return () => clearInterval(id)
  }, [pomodoroActive, pomodoroSeconds, pomodoroBreak])

  // Wire focus preset when focus mode is toggled
  React.useEffect(() => {
    if (!focusMode) { setAssigneeFilter(null); return }
    try {
      const u = JSON.parse(localStorage.getItem('chart-to-jira-user') || '{}')
      const preset = JSON.parse(localStorage.getItem(`chart-to-jira-focus-preset-${u.id}`) || 'null')
      if (preset?.assignee) setAssigneeFilter(preset.assignee)
    } catch {}
  }, [focusMode]) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!showAssigneeDropdown) return
    const handler = () => setShowAssigneeDropdown(false)
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [showAssigneeDropdown])

  function addChildAndLayout(parentId) {
    onAddChild(parentId)
    if (autoLayoutOnAdd) setTimeout(() => onApplyLayout?.(), 50)
  }

  // Feature 24: Timer functions
  function startTimer(nodeId) {
    setActiveTimer({ nodeId, startedAt: Date.now() })
    showToast('Timer started')
  }
  function stopTimer() {
    if (!activeTimer) return
    const elapsed = (Date.now() - activeTimer.startedAt) / 3600000 // hours
    const hours = Math.round(elapsed * 10) / 10
    const node = nodes[activeTimer.nodeId]
    const current = node?.timeLogged ?? 0
    onSetNodeMeta?.(activeTimer.nodeId, { timeLogged: current + hours })
    showToast(`Logged ${hours}h to "${node?.title}"`)
    setActiveTimer(null)
  }

  // Feature 25: Add reply to comment
  function handleAddReply(nodeId, commentId, text, author) {
    const node = nodes[nodeId]
    if (!node) return
    const newComments = (node.comments || []).map(c => {
      if (c.id !== commentId) return c
      const reply = { id: crypto.randomUUID(), author: author || 'You', text, timestamp: new Date().toISOString() }
      return { ...c, replies: [...(c.replies || []), reply] }
    })
    onSetNodeMeta?.(nodeId, { comments: newComments })
  }

  // Navigation history tracking (Feature 8)
  React.useEffect(() => {
    if (selectedNodeId && selectedNodeId !== prevSelectedRef.current) {
      const pos = navHistoryPosRef.current
      navHistoryRef.current = [...navHistoryRef.current.slice(0, pos + 1), selectedNodeId].slice(-30)
      navHistoryPosRef.current = navHistoryRef.current.length - 1
      prevSelectedRef.current = selectedNodeId
    }
  }, [selectedNodeId])

  // Clipboard for copy/paste
  const clipboardRef = useRef(null)
  const csvImportRef = useRef(null)

  // Paste-as-tree: intercept clipboard paste of plain text when canvas has focus
  useEffect(() => {
    function onPaste(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      const text = e.clipboardData?.getData('text/plain') ?? ''
      if (!text.trim()) return
      // Only treat as tree paste if text has multiple lines (≥2 non-empty)
      const nonEmpty = text.split('\n').filter(l => l.trim().length > 0)
      if (nonEmpty.length < 2) return
      e.preventDefault()
      const result = parseTextAsTree(text)
      if (!result) return
      const parentId = selectedNodeId ?? rootId
      onPasteSubtree?.(result.nodes, result.rootId, parentId)
      showToast(`Pasted ${nonEmpty.length} lines as nodes`)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [selectedNodeId, rootId, onPasteSubtree, showToast])

  function toCanvas(screenX, screenY) {
    return {
      x: (screenX - transform.translateX) / transform.scale,
      y: (screenY - transform.translateY) / transform.scale,
    }
  }

  function snap(v) { return snapToGrid ? Math.round(v / GRID) * GRID : v }

  // Fit to content helper — defined early so keyboard useEffect can use it
  const handleFitToContent = useCallback(() => {
    const allNodes = Object.values(nodes).filter(n => n.x != null && n.y != null)
    if (allNodes.length === 0) return
    const positions = {}
    for (const n of allNodes) positions[n.id] = { x: n.x, y: n.y - getShapeDims(n.shape).h / 2 }
    fitToContent(positions)
  }, [nodes, fitToContent])

  // Keep a ref to the latest handleFitToContent so setTimeout callbacks always get the fresh version
  const handleFitToContentRef = useRef(handleFitToContent)
  handleFitToContentRef.current = handleFitToContent

  // Initial centering
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const { width, height } = svg.getBoundingClientRect()
    centerView(width, height)
  }, [centerView])

  // Auto-fit when project switches
  useEffect(() => {
    if (!projectId) return
    const timer = setTimeout(() => handleFitToContent(), 100)
    return () => clearTimeout(timer)
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Arrow key navigation
  function getAdjacentNodeId(dir) {
    if (!selectedNodeId) return null
    const node = nodes[selectedNodeId]
    if (!node) return null
    if (dir === 'up') return node.parentId || null
    if (dir === 'down') return node.childIds[0] || null
    if (dir === 'left' || dir === 'right') {
      const parent = node.parentId ? nodes[node.parentId] : null
      if (!parent) return null
      const idx = parent.childIds.indexOf(selectedNodeId)
      if (idx === -1) return null
      return dir === 'left'
        ? parent.childIds[idx - 1] ?? null
        : parent.childIds[idx + 1] ?? null
    }
    return null
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      // Block all editing keyboard shortcuts in view-only mode
      const editKeys = ['Tab', 'Delete', 'Backspace']
      const editModifiers = ['d', 'v', 'c']
      if (isViewOnly && (editKeys.includes(e.key) || ((e.metaKey || e.ctrlKey) && editModifiers.includes(e.key)))) {
        e.preventDefault()
        showToast('View-only access — you cannot edit this project')
        return
      }

      // Shortcuts help
      if (e.key === '?') { e.preventDefault(); setShowShortcuts(s => !s); return }

      // Open node detail dialog (O key while a node is selected)
      if ((e.key === 'o' || e.key === 'O') && !e.metaKey && !e.ctrlKey && selectedNodeId) {
        e.preventDefault(); setNodeDetailId(selectedNodeId); return
      }

      // Presentation mode
      if (e.key === 'p' || e.key === 'P') {
        if (!presentationMode) setPresentationIdx(0)
        setPresentationMode(s => !s)
        return
      }

      // Focus mode (bare F key, no modifier)
      if ((e.key === 'f' || e.key === 'F') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        setFocusMode(s => {
          showToast(s ? 'Focus mode off' : 'Focus mode on — showing selected subtree only')
          return !s
        })
        return
      }

      // Notes panel
      if (e.key === 'n' || e.key === 'N') { if (selectedNodeId) setShowNotes(s => !s); return }

      // Search (Ctrl+F or Cmd+K)
      if ((e.metaKey || e.ctrlKey) && (e.key === 'f' || e.key === 'k')) {
        e.preventDefault(); setShowSearch(s => !s); return
      }
      // Find & Replace (Ctrl+H)
      if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
        e.preventDefault(); setShowFindReplace(s => !s); return
      }
      // Command palette (Ctrl+P)
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault(); setShowCommandPalette(s => !s); return
      }
      // Undo / Redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault(); onUndo?.(); return
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault(); onRedo?.(); return
      }
      // Copy subtree
      if ((e.metaKey || e.ctrlKey) && e.key === 'c' && selectedNodeId) {
        e.preventDefault()
        clipboardRef.current = cloneSubtree(nodes, selectedNodeId)
        showToast('Subtree copied')
        return
      }
      // Paste subtree
      if ((e.metaKey || e.ctrlKey) && e.key === 'v' && clipboardRef.current) {
        e.preventDefault()
        const { nodes: newNodes, rootId: newRootId } = cloneSubtree(
          clipboardRef.current.nodes,
          clipboardRef.current.rootId
        )
        const parentId = selectedNodeId ?? rootId
        onPasteSubtree?.(newNodes, newRootId, parentId)
        showToast('Subtree pasted')
        return
      }
      // Duplicate
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && selectedNodeId) {
        e.preventDefault()
        onDuplicateNode?.(selectedNodeId)
        showToast('Node duplicated')
        return
      }
      // Add child
      if (e.key === 'Tab' && selectedNodeId) {
        e.preventDefault(); addChildAndLayout(selectedNodeId); return
      }
      // Enter — start editing selected node (if not already editing)
      if (e.key === 'Enter' && selectedNodeId && !editingNodeId) {
        e.preventDefault()
        lastEditTriggerRef.current = 'other'
        setEditingNodeId(selectedNodeId)
        return
      }
      // Delete: edge, multi-select, or single node
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedEdgeId) {
          e.preventDefault()
          onDeleteEdge?.(selectedEdgeId)
          setSelectedEdgeId(null)
          showToast('Connection removed')
          return
        }
        if (multiSelectIds.size > 0) {
          e.preventDefault()
          const ids = [...multiSelectIds].filter(id => id !== rootId)
          if (ids.length > 0) {
            const total = ids.reduce((sum, id) => sum + countDescendants(nodes, id) + 1, 0)
            if (total > 3 && !window.confirm(`Delete ${ids.length} nodes and their descendants (${total} total)?`)) return
            onBulkDelete?.(ids)
            setMultiSelectIds(new Set())
            showToast(`Deleted ${ids.length} nodes`)
          }
          return
        }
        if (selectedNodeId && selectedNodeId !== rootId) {
          e.preventDefault()
          const node = nodes[selectedNodeId]
          if (node?.childIds.length > 0) {
            const total = countDescendants(nodes, selectedNodeId)
            if (!window.confirm(`Delete "${node.title}" and ${total} child node${total !== 1 ? 's' : ''}?`)) return
          }
          onDeleteNode?.(selectedNodeId)
          showToast('Node deleted')
          return
        }
      }
      // Escape
      if (e.key === 'Escape') {
        if (openMenu) { setOpenMenu(null); return }
        if (activeLens) { setActiveLens(null); return }
        if (impactNodeId) { setImpactNodeId(null); return }
        setContextMenu(null)
        setSelectedEdgeId(null)
        setShowNotes(false)
        setZoomMenuOpen(false)
        if (editingNodeId) { setEditingNodeId(null); return }
        if (presentationMode) { setPresentationMode(false); return }
        if (multiSelectIds.size > 0) { setMultiSelectIds(new Set()); return }
        if (selectedNodeId) onDeselect?.()
        return
      }
      // Arrow navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedNodeId) {
        // Alt+Arrow = navigation history
        if (e.altKey) {
          e.preventDefault()
          if (e.key === 'ArrowLeft') {
            const pos = navHistoryPosRef.current
            if (pos > 0) {
              navHistoryPosRef.current = pos - 1
              const id = navHistoryRef.current[navHistoryPosRef.current]
              if (id && nodes[id]) { prevSelectedRef.current = id; onSelectNode(id); panToCenter(nodes[id].x, nodes[id].y) }
            }
          } else if (e.key === 'ArrowRight') {
            const pos = navHistoryPosRef.current
            if (pos < navHistoryRef.current.length - 1) {
              navHistoryPosRef.current = pos + 1
              const id = navHistoryRef.current[navHistoryPosRef.current]
              if (id && nodes[id]) { prevSelectedRef.current = id; onSelectNode(id); panToCenter(nodes[id].x, nodes[id].y) }
            }
          }
          return
        }
        e.preventDefault()
        if (presentationMode) {
          // In presentation mode, step through BFS order
          const order = Object.values(nodes).sort((a, b) => a.depth - b.depth || a.title.localeCompare(b.title))
          const newIdx = e.key === 'ArrowLeft' || e.key === 'ArrowUp'
            ? Math.max(0, presentationIdx - 1)
            : Math.min(order.length - 1, presentationIdx + 1)
          setPresentationIdx(newIdx)
          const n = order[newIdx]
          if (n) { onSelectNode(n.id); panToCenter(n.x, n.y); setScale(1.5) }
          return
        }
        const dirMap = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }
        const targetId = getAdjacentNodeId(dirMap[e.key])
        if (targetId) onSelectNode(targetId)
        return
      }
      // Ctrl+G — jump to Jira key
      if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
        e.preventDefault()
        const key = window.prompt('Jump to Jira key (e.g. ABC-123):')
        if (!key) return
        const node = Object.values(nodes).find(n => n.jiraKey?.toLowerCase() === key.trim().toLowerCase())
        if (node) { onSelectNode(node.id); panToCenter(node.x, node.y); showToast(`Jumped to ${node.jiraKey}`) }
        else showToast(`No node with key "${key.trim()}"`)
        return
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedNodeId, selectedEdgeId, rootId, nodes, multiSelectIds, presentationMode, editingNodeId,
      focusMode, openMenu,
      onAddChild, onDeleteNode, onDeleteEdge, onDeselect, onUndo, onRedo,
      onDuplicateNode, onSelectNode, onPasteSubtree, onBulkDelete,
      showToast, panToCenter, handleFitToContent])

  // Node interaction handlers
  const handleNodeMouseDown = useCallback((nodeId, e) => {
    e.stopPropagation()
    const node = nodes[nodeId]
    if (!node || node.locked) return
    if (isViewOnly) return // view-only: no dragging
    const i = interactionRef.current
    i.mode = 'dragging-node'
    i.nodeId = nodeId
    i.startSX = e.clientX
    i.startSY = e.clientY
    i.startNX = node.x
    i.startNY = node.y
    i.dist = 0
    if (svgRef.current) svgRef.current.style.cursor = 'grabbing'
  }, [nodes])

  const handlePortMouseDown = useCallback((nodeId, dir, e) => {
    e.stopPropagation()
    const i = interactionRef.current
    i.mode = 'drawing-edge'
    i.nodeId = nodeId
    const canvas = toCanvas(e.clientX, e.clientY)
    setGhostEdge({ fromNodeId: nodeId, toX: canvas.x, toY: canvas.y })
    if (svgRef.current) svgRef.current.style.cursor = 'crosshair'
  }, [transform])

  const handleSvgMouseDown = useCallback((e) => {
    if (e.target.closest('[data-node]')) return
    setContextMenu(null)
    setSelectedEdgeId(null)
    setZoomMenuOpen(false)
    const i = interactionRef.current
    if (frameMode) {
      const canvas = toCanvas(e.clientX, e.clientY)
      i.mode = 'drawing-frame'
      setDrawingFrame({ startX: canvas.x, startY: canvas.y, endX: canvas.x, endY: canvas.y })
      return
    }
    i.mode = 'panning'
    panMouseDown(e)
  }, [panMouseDown, frameMode, transform])

  const handleMouseMove = useCallback((e) => {
    const i = interactionRef.current
    if (i.mode === 'dragging-node') {
      const dx = (e.clientX - i.startSX) / transform.scale
      const dy = (e.clientY - i.startSY) / transform.scale
      i.dist = Math.hypot(e.clientX - i.startSX, e.clientY - i.startSY)
      const newPos = { nodeId: i.nodeId, x: i.startNX + dx, y: i.startNY + dy }
      setDragPos(newPos)
      // Compute drop target: hovered node that isn't the dragged node or its current parent
      if (i.dist > 8 && hoveredNodeId && hoveredNodeId !== i.nodeId) {
        const draggedNode = nodes[i.nodeId]
        const isDescendant = (ancestorId, checkId) => {
          const q = [...(nodes[ancestorId]?.childIds ?? [])]
          while (q.length) { const id = q.shift(); if (id === checkId) return true; q.push(...(nodes[id]?.childIds ?? [])) }
          return false
        }
        const valid = hoveredNodeId !== draggedNode?.parentId && !isDescendant(i.nodeId, hoveredNodeId)
        setDropTargetId(valid ? hoveredNodeId : null)
      } else {
        setDropTargetId(null)
      }
    } else if (i.mode === 'drawing-edge') {
      const canvas = toCanvas(e.clientX, e.clientY)
      setGhostEdge(g => g ? { ...g, toX: canvas.x, toY: canvas.y } : null)
    } else if (i.mode === 'drawing-frame') {
      const canvas = toCanvas(e.clientX, e.clientY)
      setDrawingFrame(f => f ? { ...f, endX: canvas.x, endY: canvas.y } : null)
    } else if (i.mode === 'panning') {
      panMouseMove(e)
    }
  }, [transform, panMouseMove, hoveredNodeId, nodes])

  const handleMouseUp = useCallback((e) => {
    const i = interactionRef.current
    if (i.mode === 'dragging-node') {
      if (i.dist < 4) {
        if (e.shiftKey) {
          // Multi-select toggle
          setMultiSelectIds(prev => {
            const next = new Set(prev)
            next.has(i.nodeId) ? next.delete(i.nodeId) : next.add(i.nodeId)
            return next
          })
        } else {
          onSelectNode(i.nodeId)
          setSelectedEdgeId(null)
          setMultiSelectIds(new Set())
          setEditingNodeId(null)
        }
      } else if (dropTargetId) {
        // Reparent: dropped onto a valid target node
        onReparentNode?.(i.nodeId, dropTargetId)
        showToast(`Moved under "${nodes[dropTargetId]?.title}"`)
      } else if (dragPos) {
        if (multiSelectIds.size > 0 && multiSelectIds.has(i.nodeId)) {
          // Move all multi-selected nodes together
          const dx = snap(dragPos.x) - i.startNX
          const dy = snap(dragPos.y) - i.startNY
          for (const id of multiSelectIds) {
            const n = nodes[id]
            if (n) onMoveNode(id, snap(n.x + dx), snap(n.y + dy))
          }
        } else {
          onMoveNode(i.nodeId, snap(dragPos.x), snap(dragPos.y))
        }
      }
      setDragPos(null)
      setDropTargetId(null)
    } else if (i.mode === 'drawing-edge') {
      if (hoveredNodeId && hoveredNodeId !== i.nodeId) {
        onAddEdge(i.nodeId, hoveredNodeId)
        showToast('Connection created')
      }
      setGhostEdge(null)
    } else if (i.mode === 'drawing-frame') {
      if (drawingFrame) {
        const x = Math.min(drawingFrame.startX, drawingFrame.endX)
        const y = Math.min(drawingFrame.startY, drawingFrame.endY)
        const w = Math.abs(drawingFrame.endX - drawingFrame.startX)
        const h = Math.abs(drawingFrame.endY - drawingFrame.startY)
        if (w > 20 && h > 20) {
          const label = window.prompt('Frame label:', 'Frame')
          if (label) {
            const FRAME_COLORS = ['#6B7280', '#3B82F6', '#8B5CF6', '#22C55E', '#EF4444', '#F97316']
            const color = FRAME_COLORS[frames.length % FRAME_COLORS.length]
            onAddFrame?.(label, x, y, w, h, color)
            showToast(`Frame "${label}" created`)
          }
        }
        setDrawingFrame(null)
      }
      setFrameMode(false)
    } else if (i.mode === 'panning') {
      panMouseUp(e)
    }
    interactionRef.current.mode = 'idle'
    interactionRef.current.nodeId = null
    interactionRef.current.dist = 0
    if (svgRef.current) svgRef.current.style.cursor = ''
  }, [dragPos, dropTargetId, hoveredNodeId, onSelectNode, onMoveNode, onAddEdge, onReparentNode, panMouseUp,
      showToast, snapToGrid, multiSelectIds, nodes, drawingFrame, frames, onAddFrame])

  const handleSvgClick = useCallback((e) => {
    if (panDist.current > 4) return
    if (e.target.closest('[data-edge]')) return
    if (!e.target.closest('[data-node]')) {
      if (!e.shiftKey) {
        onDeselect()
        setSelectedEdgeId(null)
        setMultiSelectIds(new Set())
        setEditingNodeId(null)
      }
    }
  }, [panDist, onDeselect])

  const handleSvgDoubleClick = useCallback((e) => {
    if (e.target.closest('[data-node]')) return
    handleFitToContent()
  }, [handleFitToContent])

  const handleNodeContextMenu = useCallback((nodeId, e) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ nodeId, screenX: e.clientX, screenY: e.clientY })
  }, [])

  const handleNodeMouseEnter = useCallback((nodeId) => setHoveredNodeId(nodeId), [])
  const handleNodeMouseLeave = useCallback((nodeId) => setHoveredNodeId(h => h === nodeId ? null : h), [])

  const handleEdgeClick = useCallback((edgeId) => {
    setSelectedEdgeId(id => id === edgeId ? null : edgeId)
    onDeselect()
    setEditingNodeId(null)
  }, [onDeselect])

  const handleNodeDoubleClick = useCallback((nodeId) => {
    if (nodes[nodeId]?.locked) return
    onSelectNode(nodeId)
    setEditingNodeId(nodeId)
  }, [onSelectNode, nodes])

  // Export PNG
  const handleExportPng = useCallback(() => {
    onTrackEvent?.('export_png')
    const svg = svgRef.current
    if (!svg) return
    const allNodes = Object.values(nodes).filter(n => n.x != null && n.y != null)
    if (allNodes.length === 0) return
    const pad = 60
    const xs = allNodes.flatMap(n => { const d = getShapeDims(n.shape); return [n.x - d.w/2, n.x + d.w/2] })
    const ys = allNodes.flatMap(n => { const d = getShapeDims(n.shape); return [n.y - d.h/2, n.y + d.h/2] })
    const minX = Math.min(...xs) - pad
    const maxX = Math.max(...xs) + pad
    const minY = Math.min(...ys) - pad
    const maxY = Math.max(...ys) + pad + 40
    const w = maxX - minX
    const h = maxY - minY

    const clone = svg.cloneNode(true)
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('width', String(w))
    clone.setAttribute('height', String(h))
    clone.setAttribute('viewBox', `${minX} ${minY} ${w} ${h}`)
    const contentG = clone.querySelector('g')
    if (contentG) contentG.setAttribute('transform', '')
    clone.querySelectorAll('foreignObject').forEach(el => el.remove())
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    bg.setAttribute('x', String(minX)); bg.setAttribute('y', String(minY))
    bg.setAttribute('width', String(w)); bg.setAttribute('height', String(h))
    bg.setAttribute('fill', '#F8FAFC')
    contentG?.insertBefore(bg, contentG.firstChild)
    const svgStr = new XMLSerializer().serializeToString(clone)
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const scale = 2
      const canvas = document.createElement('canvas')
      canvas.width = w * scale; canvas.height = h * scale
      const ctx = canvas.getContext('2d')
      ctx.scale(scale, scale)
      ctx.fillStyle = '#F8FAFC'; ctx.fillRect(0, 0, w, h)
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      const a = document.createElement('a')
      a.download = 'chart.png'; a.href = canvas.toDataURL('image/png'); a.click()
    }
    img.onerror = () => URL.revokeObjectURL(url)
    img.src = url
    showToast('PNG exported')
  }, [svgRef, nodes, showToast])

  // Export SVG
  const handleExportSVG = useCallback(() => {
    onTrackEvent?.('export_svg')
    const svg = svgRef.current
    if (!svg) return
    const allNodes = Object.values(nodes).filter(n => n.x != null && n.y != null)
    if (allNodes.length === 0) return
    const pad = 60
    const xs = allNodes.flatMap(n => { const d = getShapeDims(n.shape); return [n.x - d.w/2, n.x + d.w/2] })
    const ys = allNodes.flatMap(n => { const d = getShapeDims(n.shape); return [n.y - d.h/2, n.y + d.h/2] })
    const minX = Math.min(...xs) - pad
    const maxX = Math.max(...xs) + pad
    const minY = Math.min(...ys) - pad
    const maxY = Math.max(...ys) + pad + 40
    const w = maxX - minX
    const h = maxY - minY
    const clone = svg.cloneNode(true)
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('width', String(w))
    clone.setAttribute('height', String(h))
    clone.setAttribute('viewBox', `${minX} ${minY} ${w} ${h}`)
    const contentG = clone.querySelector('g')
    if (contentG) contentG.setAttribute('transform', '')
    clone.querySelectorAll('foreignObject').forEach(el => el.remove())
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    bg.setAttribute('x', String(minX)); bg.setAttribute('y', String(minY))
    bg.setAttribute('width', String(w)); bg.setAttribute('height', String(h))
    bg.setAttribute('fill', '#F8FAFC')
    contentG?.insertBefore(bg, contentG.firstChild)
    const svgStr = new XMLSerializer().serializeToString(clone)
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.download = 'chart.svg'; a.href = url; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    showToast('SVG exported')
  }, [svgRef, nodes, showToast])

  // CSV export
  const handleExportCSV = useCallback(() => {
    onTrackEvent?.('export_csv')
    exportCSV(nodes, rootId, treeState.name || 'Project')
    showToast('CSV exported')
  }, [nodes, rootId, treeState, showToast, onTrackEvent])

  const handleImportCSV = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = importCSV(ev.target.result)
      if (!result) { showToast('Could not parse CSV'); return }
      const count = Object.keys(result.nodes).length - 1
      onPasteSubtree?.(result.nodes, result.rootId, rootId)
      showToast(`Imported ${count} node${count !== 1 ? 's' : ''} from CSV`)
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [importCSV, onPasteSubtree, rootId, showToast])

  // Confluence export
  const handleExportConfluence = useCallback(() => {
    onTrackEvent?.('export_confluence')
    const markup = generateConfluenceMarkup(nodes, rootId, treeState.name || 'Project')
    setConfluenceMarkup(markup)
    setShowConfluenceModal(true)
  }, [nodes, rootId, treeState, onTrackEvent])

  // Markdown export
  const handleExportMarkdown = useCallback(() => {
    onTrackEvent?.('export_markdown')
    exportMarkdown(nodes, rootId, treeState.name || 'Project')
    showToast('Markdown outline exported')
  }, [nodes, rootId, treeState, showToast, onTrackEvent])

  // PDF export via window.print
  const handleExportPDF = useCallback(() => {
    const title = treeState.name || 'Project'
    const now = new Date().toLocaleDateString()
    function renderOutline(nodeId, depth) {
      const n = nodes[nodeId]
      if (!n) return ''
      const indent = '  '.repeat(depth)
      const statusBadge = n.status ? `<span class="badge status-${n.status}">${n.status}</span>` : ''
      const priorityBadge = n.priority ? `<span class="badge priority-${n.priority}">${n.priority}</span>` : ''
      const line = `<div class="node" style="padding-left:${depth * 16}px">${indent}${n.title} ${statusBadge}${priorityBadge}</div>`
      const children = (n.childIds || []).map(c => renderOutline(c, depth + 1)).join('')
      return line + children
    }
    const outline = renderOutline(rootId, 0)
    const printDiv = document.createElement('div')
    printDiv.id = '__pdf_export__'
    printDiv.innerHTML = `
      <style>
        @media print {
          body > *:not(#__pdf_export__) { display: none !important; }
          #__pdf_export__ { display: block !important; font-family: sans-serif; padding: 24px; }
          .badge { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 10px; margin-left: 4px; }
          .status-done { background: #dcfce7; color: #166534; }
          .status-todo { background: #f3f4f6; color: #374151; }
          .status-in-progress { background: #dbeafe; color: #1d4ed8; }
          .status-blocked { background: #fee2e2; color: #991b1b; }
          .priority-critical { background: #fee2e2; color: #991b1b; }
          .priority-high { background: #ffedd5; color: #c2410c; }
          .priority-medium { background: #fef9c3; color: #a16207; }
          .priority-low { background: #dcfce7; color: #166534; }
          .node { padding: 2px 0; font-size: 13px; }
        }
        #__pdf_export__ { display: none; }
      </style>
      <h1 style="font-size:18px;margin-bottom:4px">${title}</h1>
      <div style="font-size:12px;color:#9ca3af;margin-bottom:16px">Exported on ${now}</div>
      ${outline}
    `
    document.body.appendChild(printDiv)
    window.print()
    document.body.removeChild(printDiv)
    showToast('PDF export — use browser print dialog')
  }, [nodes, rootId, treeState, showToast])

  // Share link
  const handleShareLink = useCallback(() => {
    const url = encodeShareLink(treeState)
    if (url) {
      navigator.clipboard?.writeText(url).then(() => showToast('Share link copied to clipboard!')).catch(() => showToast('Share link: ' + url))
    } else {
      showToast('Could not generate share link')
    }
  }, [treeState, showToast])

  // Group box bounds
  const groupBoxes = React.useMemo(() => {
    if (groups.length === 0) return []
    const PAD = 20
    return groups.map(g => {
      const groupNodes = g.nodeIds.map(id => nodes[id]).filter(Boolean)
      if (groupNodes.length === 0) return null
      const xs = groupNodes.flatMap(n => { const d = getShapeDims(n.shape); return [n.x - d.w/2, n.x + d.w/2] })
      const ys = groupNodes.flatMap(n => { const d = getShapeDims(n.shape); return [n.y - d.h/2, n.y + d.h/2] })
      return {
        ...g,
        x: Math.min(...xs) - PAD,
        y: Math.min(...ys) - PAD - 16,
        width: Math.max(...xs) - Math.min(...xs) + PAD * 2,
        height: Math.max(...ys) - Math.min(...ys) + PAD * 2 + 16,
      }
    }).filter(Boolean)
  }, [groups, nodes])

  // Swimlane bands computation
  const swimlaneBands = React.useMemo(() => {
    if (!showSwimlanes) return []
    const BAND_COLORS = ['rgba(59,130,246,0.04)', 'rgba(34,197,94,0.04)', 'rgba(249,115,22,0.04)', 'rgba(168,85,247,0.04)', 'rgba(239,68,68,0.04)', 'rgba(234,179,8,0.04)']

    if (swimlaneBy === 'sprint') {
      // Group by sprint field
      const sprintMap = {}
      for (const n of Object.values(nodes)) {
        const key = n.sprint || '(No Sprint)'
        if (!sprintMap[key]) sprintMap[key] = []
        sprintMap[key].push(n)
      }
      const bands = []
      Object.entries(sprintMap).sort(([a], [b]) => a.localeCompare(b)).forEach(([sprintName, sprintNodes], idx) => {
        const xs = [], ys = []
        for (const n of sprintNodes) {
          const d = getShapeDims(n.shape)
          xs.push(n.x - d.w / 2, n.x + d.w / 2)
          ys.push(n.y - d.h / 2, n.y + d.h / 2)
        }
        if (xs.length === 0) return
        bands.push({
          label: sprintName,
          x: Math.min(...xs) - 50,
          y: Math.min(...ys) - 40,
          width: Math.max(...xs) - Math.min(...xs) + 100,
          height: Math.max(...ys) - Math.min(...ys) + 80,
          color: BAND_COLORS[idx % BAND_COLORS.length],
        })
      })
      return bands
    }

    // Default: group by assignee (children of root)
    const root = nodes[rootId]
    if (!root || root.childIds.length === 0) return []
    const bands = []
    root.childIds.forEach((childId, idx) => {
      const child = nodes[childId]
      if (!child) return
      const xs = [], ys = []
      const q = [childId]
      while (q.length > 0) {
        const id = q.shift()
        const n = nodes[id]
        if (!n) continue
        const d = getShapeDims(n.shape)
        xs.push(n.x - d.w / 2, n.x + d.w / 2)
        ys.push(n.y - d.h / 2, n.y + d.h / 2)
        if (!n.collapsed) q.push(...n.childIds)
      }
      if (xs.length === 0) return
      bands.push({
        label: child.title,
        x: Math.min(...xs) - 50,
        y: Math.min(...ys) - 40,
        width: Math.max(...xs) - Math.min(...xs) + 100,
        height: Math.max(...ys) - Math.min(...ys) + 80,
        color: BAND_COLORS[idx % BAND_COLORS.length],
      })
    })
    return bands
  }, [showSwimlanes, swimlaneBy, nodes, rootId])


  // Critical path: longest chain through dependency/blocker extra edges + tree edges
  const criticalPathIds = React.useMemo(() => {
    if (!showCriticalPath) return null
    const edges = treeState.extraEdges || []
    // Build adjacency list from all edges (tree + extra)
    const adj = {}
    const allIds = Object.keys(nodes)
    for (const id of allIds) adj[id] = []
    // Tree edges
    for (const id of allIds) {
      const n = nodes[id]
      if (n?.parentId && nodes[n.parentId]) adj[n.parentId].push(id)
    }
    // Extra dependency/blocker edges
    for (const e of edges) {
      if (nodes[e.from] && nodes[e.to]) adj[e.from] = [...(adj[e.from] || []), e.to]
    }
    // Topological sort + longest path DP
    const dist = {}
    const prev = {}
    for (const id of allIds) { dist[id] = 0; prev[id] = null }
    const visited = new Set()
    function dfs(id) {
      if (visited.has(id)) return dist[id]
      visited.add(id)
      for (const next of (adj[id] || [])) {
        const d = 1 + dfs(next)
        if (d > dist[id]) { dist[id] = d; prev[id] = next }
      }
      return dist[id]
    }
    for (const id of allIds) dfs(id)
    // Find source with max dist
    let startId = allIds[0]
    for (const id of allIds) { if (dist[id] > dist[startId]) startId = id }
    if (dist[startId] === 0) return new Set()
    // Walk the path
    const path = new Set()
    let cur = startId
    while (cur) { path.add(cur); cur = prev[cur] }
    return path
  }, [showCriticalPath, nodes, treeState.extraEdges])

  // Due date reminders — browser notifications for nodes due within 24h
  React.useEffect(() => {
    const notified = new Set()
    function checkDueDates() {
      const now = Date.now()
      const soon = 24 * 60 * 60 * 1000 // 24 hours
      const overdue = []
      const dueSoon = []
      for (const n of Object.values(nodes)) {
        if (!n.dueDate || n.status === 'done') continue
        const diff = new Date(n.dueDate).getTime() - now
        if (diff < 0) overdue.push(n)
        else if (diff < soon) dueSoon.push(n)
      }
      if (overdue.length === 0 && dueSoon.length === 0) return
      // Request permission and show notification
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission()
      }
      if ('Notification' in window && Notification.permission === 'granted') {
        if (overdue.length > 0) {
          const key = 'overdue-' + overdue.map(n => n.id).join(',')
          if (!notified.has(key)) {
            notified.add(key)
            new Notification('Overdue tasks', {
              body: overdue.slice(0, 3).map(n => `• ${n.title}`).join('\n') + (overdue.length > 3 ? `\n+${overdue.length - 3} more` : ''),
              icon: '/favicon.ico',
            })
          }
        }
        if (dueSoon.length > 0) {
          const key = 'soon-' + dueSoon.map(n => n.id).join(',')
          if (!notified.has(key)) {
            notified.add(key)
            new Notification('Due soon', {
              body: dueSoon.slice(0, 3).map(n => `• ${n.title} — ${n.dueDate}`).join('\n'),
              icon: '/favicon.ico',
            })
          }
        }
      }
      // Show in-app toast if notifications blocked
      if ('Notification' in window && Notification.permission === 'denied') {
        if (overdue.length > 0) showToast(`⚠️ ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}`)
      }
    }
    checkDueDates()
  }, [nodes]) // eslint-disable-line react-hooks/exhaustive-deps

  // Active filter mask — Set of visible node IDs (null = no filter active)
  const filteredNodeIds = React.useMemo(() => {
    if (focusMode && selectedNodeId) {
      const ids = new Set()
      // ancestors
      let cur = nodes[selectedNodeId]
      while (cur) { ids.add(cur.id); cur = cur.parentId ? nodes[cur.parentId] : null }
      // descendants
      const q = [selectedNodeId]
      while (q.length) { const id = q.shift(); ids.add(id); nodes[id]?.childIds.forEach(c => q.push(c)) }
      return ids
    }
    const base = applyFilters(nodes, activeFilters)
    if (!assigneeFilter) return base
    const assigneeSet = new Set()
    for (const [id, n] of Object.entries(nodes)) {
      if (n.assignee === assigneeFilter) assigneeSet.add(id)
    }
    if (base === null) return assigneeSet
    return new Set([...base].filter(id => assigneeSet.has(id)))
  }, [focusMode, selectedNodeId, nodes, activeFilters, assigneeFilter])

  // Heatmap color overrides
  const heatmapColors = React.useMemo(() => {
    if (!heatmapMode) return null
    const map = new Map()
    const today = Date.now()
    const DAY = 86400000

    if (heatmapMode === 'duedate') {
      for (const [id, n] of Object.entries(nodes)) {
        if (!n.dueDate) { map.set(id, { bg: '#F9FAFB', border: '#E5E7EB' }); continue }
        const diff = (new Date(n.dueDate).getTime() - today) / DAY
        if (diff < 0) map.set(id, { bg: '#FEE2E2', border: '#FCA5A5' })       // overdue: red
        else if (diff < 3) map.set(id, { bg: '#FEF3C7', border: '#FCD34D' })  // < 3 days: amber
        else if (diff < 7) map.set(id, { bg: '#FEF9C3', border: '#FDE047' })  // < 7 days: yellow
        else map.set(id, { bg: '#DCFCE7', border: '#86EFAC' })                 // > 7 days: green
      }
    } else if (heatmapMode === 'priority') {
      const HEAT = {
        critical: { bg: '#FEE2E2', border: '#FCA5A5' },
        high: { bg: '#FFEDD5', border: '#FDBA74' },
        medium: { bg: '#FEF9C3', border: '#FDE047' },
        low: { bg: '#DCFCE7', border: '#86EFAC' },
      }
      for (const [id, n] of Object.entries(nodes)) {
        map.set(id, HEAT[n.priority] ?? { bg: '#F9FAFB', border: '#E5E7EB' })
      }
    } else if (heatmapMode === 'points') {
      const allPoints = Object.values(nodes).map(n => Number(n.storyPoints)).filter(p => !isNaN(p) && p > 0)
      const maxPts = allPoints.length > 0 ? Math.max(...allPoints) : 1
      for (const [id, n] of Object.entries(nodes)) {
        const pts = Number(n.storyPoints)
        if (isNaN(pts) || pts <= 0) { map.set(id, { bg: '#F9FAFB', border: '#E5E7EB' }); continue }
        const ratio = pts / maxPts
        if (ratio > 0.75) map.set(id, { bg: '#FEE2E2', border: '#FCA5A5' })
        else if (ratio > 0.5) map.set(id, { bg: '#FFEDD5', border: '#FDBA74' })
        else if (ratio > 0.25) map.set(id, { bg: '#FEF9C3', border: '#FDE047' })
        else map.set(id, { bg: '#DCFCE7', border: '#86EFAC' })
      }
    }
    return map
  }, [heatmapMode, nodes])

  const colorByFieldColors = React.useMemo(() => {
    if (!colorByField || heatmapMode) return null
    const map = new Map()
    const STATUS_C = { todo: { bg: '#F3F4F6', border: '#9CA3AF' }, 'in-progress': { bg: '#DBEAFE', border: '#93C5FD' }, done: { bg: '#DCFCE7', border: '#86EFAC' }, blocked: { bg: '#FEE2E2', border: '#FCA5A5' } }
    const PRIORITY_C = { critical: { bg: '#FEE2E2', border: '#FCA5A5' }, high: { bg: '#FFEDD5', border: '#FDBA74' }, medium: { bg: '#FEF9C3', border: '#FDE047' }, low: { bg: '#DCFCE7', border: '#86EFAC' } }
    const ISSUE_TYPE_C = { epic: { bg: '#F3E8FF', border: '#D8B4FE' }, story: { bg: '#DCFCE7', border: '#86EFAC' }, task: { bg: '#DBEAFE', border: '#93C5FD' }, bug: { bg: '#FEE2E2', border: '#FCA5A5' }, subtask: { bg: '#F3F4F6', border: '#9CA3AF' } }
    const ASSIGNEE_PALETTE = ['#DBEAFE','#DCFCE7','#FEF9C3','#FFEDD5','#F3E8FF','#FEE2E2','#F0F9FF','#FFF1F2']
    const ASSIGNEE_BORDER_PALETTE = ['#93C5FD','#86EFAC','#FDE047','#FDBA74','#D8B4FE','#FCA5A5','#7DD3FC','#FDA4AF']
    const assigneeMap = {}
    let assigneeIdx = 0
    for (const [id, n] of Object.entries(nodes)) {
      if (colorByField === 'status') {
        map.set(id, STATUS_C[n.status] ?? { bg: '#F9FAFB', border: '#E5E7EB' })
      } else if (colorByField === 'priority') {
        map.set(id, PRIORITY_C[n.priority] ?? { bg: '#F9FAFB', border: '#E5E7EB' })
      } else if (colorByField === 'issueType') {
        map.set(id, ISSUE_TYPE_C[n.issueType] ?? { bg: '#F9FAFB', border: '#E5E7EB' })
      } else if (colorByField === 'assignee') {
        if (n.assignee) {
          if (!(n.assignee in assigneeMap)) {
            assigneeMap[n.assignee] = assigneeIdx++ % ASSIGNEE_PALETTE.length
          }
          const i = assigneeMap[n.assignee]
          map.set(id, { bg: ASSIGNEE_PALETTE[i], border: ASSIGNEE_BORDER_PALETTE[i] })
        } else {
          map.set(id, { bg: '#F9FAFB', border: '#E5E7EB' })
        }
      }
    }
    return map
  }, [colorByField, heatmapMode, nodes])

  // Node size overrides by story points
  const nodeSizeOverrides = React.useMemo(() => {
    if (!sizeByPoints) return null
    const map = {}
    for (const [id, n] of Object.entries(nodes)) {
      if (n.storyPoints != null && n.storyPoints > 0) {
        const scale = Math.min(2, 0.7 + n.storyPoints / 10)
        map[id] = scale
      }
    }
    return map
  }, [sizeByPoints, nodes])

  // Search navigate
  const handleSearchNavigate = useCallback((nodeId) => {
    const n = nodes[nodeId]
    if (!n) return
    panToCenter(n.x, n.y)
    onSelectNode(nodeId)
  }, [nodes, panToCenter, onSelectNode])

  // Minimap navigate
  const handleMinimapNavigate = useCallback((cx, cy) => {
    panToCenter(cx, cy)
  }, [panToCenter])

  // Color + Shape palette position
  const selectedNode = selectedNodeId ? nodes[selectedNodeId] : null
  let palX = 0, palY = 0
  if (selectedNode) {
    const dims = getShapeDims(selectedNode.shape)
    const nodeSX = transform.translateX + selectedNode.x * transform.scale
    const nodeSY = transform.translateY + (selectedNode.y - dims.h / 2) * transform.scale
    const nodeBottomSY = nodeSY + dims.h * transform.scale
    palX = nodeSX - PAL_W / 2
    palY = nodeSY - PAL_H - 10
    if (palY < 8) palY = nodeBottomSY + 10
    const svgW = svgRef.current?.getBoundingClientRect().width ?? 800
    palX = Math.max(8, Math.min(svgW - PAL_W - 8, palX))
  }

  const shapeLabels = { rect: '▭', circle: '●', diamond: '◆', sticky: '📝' }
  const contextNode = contextMenu ? nodes[contextMenu.nodeId] : null
  const notesNode = showNotes && selectedNodeId ? nodes[selectedNodeId] : null

  const ZOOM_PRESETS = [
    { label: '25%', value: 0.25 },
    { label: '50%', value: 0.5 },
    { label: '75%', value: 0.75 },
    { label: '100%', value: 1 },
    { label: '150%', value: 1.5 },
    { label: '200%', value: 2 },
  ]

  return (
    <div
      className="relative flex-1 overflow-hidden"
      style={(() => {
        const bgStyle = {
          background: darkMode ? '#0F172A' : '#F8FAFC',
        }
        if (!showKanban) {
          if (bgTheme === 'dots') bgStyle.backgroundImage = `radial-gradient(circle, ${darkMode ? '#334155' : '#CBD5E1'} 1px, transparent 1px)`
          else if (bgTheme === 'grid') bgStyle.backgroundImage = `linear-gradient(${darkMode ? '#334155' : '#E2E8F0'} 1px, transparent 1px), linear-gradient(90deg, ${darkMode ? '#334155' : '#E2E8F0'} 1px, transparent 1px)`
          if (bgTheme === 'dots' || bgTheme === 'grid') bgStyle.backgroundSize = snapToGrid ? `${GRID}px ${GRID}px` : '24px 24px'
        }
        return bgStyle
      })()}
    >
      {/* View-only banner */}
      {isViewOnly && (
        <div style={{
          position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 20,
          background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 8,
          padding: '4px 14px', fontSize: 11, fontWeight: 600, color: '#92400E',
          display: 'flex', alignItems: 'center', gap: 5, pointerEvents: 'none',
        }}>
          <span>👁</span> View-only — you cannot edit this project
        </div>
      )}
      {/* Online collaborators */}
      {presence.length > 0 && (
        <div style={{
          position: 'absolute', top: 8, right: 8, zIndex: 20,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          {presence.map(u => (
            <div
              key={u.userId}
              title={`${u.email} (${u.role})`}
              style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: u.color || '#3B82F6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: 'white',
                border: '2px solid white', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                cursor: 'default',
              }}
            >
              {u.email?.slice(0, 2).toUpperCase() || 'U'}
            </div>
          ))}
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 0 2px white', marginLeft: 2 }} title="Live" />
        </div>
      )}
      {/* Breadcrumb trail */}
      {selectedNodeId && !presentationMode && (() => {
        const path = []
        let cur = nodes[selectedNodeId]
        while (cur) { path.unshift(cur); cur = cur.parentId ? nodes[cur.parentId] : null }
        return (
          <div style={{
            position: 'absolute', top: 8, left: 8, zIndex: 15,
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'rgba(255,255,255,0.92)', border: '1px solid #E5E7EB',
            borderRadius: 8, padding: '4px 10px', fontSize: 11,
            boxShadow: '0 1px 6px rgba(0,0,0,0.08)', maxWidth: 500,
            backdropFilter: 'blur(4px)',
          }}>
            {path.map((n, i) => (
              <React.Fragment key={n.id}>
                {i > 0 && <span style={{ color: '#D1D5DB', fontSize: 9 }}>›</span>}
                <button
                  onClick={() => { onSelectNode(n.id); panToCenter(n.x, n.y) }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '1px 2px',
                    color: i === path.length - 1 ? '#1D4ED8' : '#6B7280',
                    fontWeight: i === path.length - 1 ? 700 : 400, fontSize: 11,
                    maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                  title={n.title}
                >{n.title}</button>
              </React.Fragment>
            ))}
          </div>
        )
      })()}
      {/* Kanban view replaces canvas */}
      {showKanban ? (
        <KanbanView
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
          onSetNodeMeta={onSetNodeMeta}
          wipLimits={wipLimits}
          onSetWipLimit={(col, limit) => setWipLimits(prev => ({ ...prev, [col]: limit }))}
          onOpenDetail={(id) => setNodeDetailId(id)}
        />
      ) : showTableView ? (
        <TableView
          nodes={nodes}
          onEditNode={onEditNode}
          onSetNodeMeta={onSetNodeMeta}
          onClose={() => setShowTableView(false)}
          onOpenDetail={(id) => setNodeDetailId(id)}
        />
      ) : (
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ cursor: 'grab' }}
        onMouseDown={handleSvgMouseDown}
        onMouseMove={(e) => { handleMouseMove(e); handleCanvasMouseMove(e) }}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleSvgClick}
        onDoubleClick={handleSvgDoubleClick}
        onContextMenu={(e) => {
          if (!e.target.closest('[data-node]')) e.preventDefault()
        }}
      >
        <g transform={transformStr}>
          {/* Frames — rendered BEHIND everything */}
          {frames.map(frame => (
            <CanvasFrame key={frame.id} frame={frame} onDelete={onDeleteFrame} onRename={onRenameFrame} />
          ))}
          {/* Drawing frame ghost */}
          {drawingFrame && (
            <rect
              x={Math.min(drawingFrame.startX, drawingFrame.endX)}
              y={Math.min(drawingFrame.startY, drawingFrame.endY)}
              width={Math.abs(drawingFrame.endX - drawingFrame.startX)}
              height={Math.abs(drawingFrame.endY - drawingFrame.startY)}
              fill="rgba(59,130,246,0.08)" stroke="#3B82F6" strokeWidth="2" strokeDasharray="6 3"
              style={{ pointerEvents: 'none' }}
            />
          )}
          {/* Group boxes */}
          {groupBoxes.map(g => (
            <g key={g.id}>
              <rect
                x={g.x} y={g.y} width={g.width} height={g.height}
                rx={10} fill={`${g.color}12`}
                stroke={g.color} strokeWidth="1.5" strokeDasharray="6 3"
                style={{ pointerEvents: 'none' }}
              />
              <text
                x={g.x + 8} y={g.y + 13}
                fontSize="11" fill={g.color} fontWeight="700"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {g.label}
              </text>
              {/* Delete group button */}
              <g
                style={{ cursor: 'pointer' }}
                onClick={() => onDeleteGroup?.(g.id)}
              >
                <circle cx={g.x + g.width - 10} cy={g.y + 10} r={7} fill="white" stroke={g.color} strokeWidth="1" />
                <text x={g.x + g.width - 10} y={g.y + 14} textAnchor="middle" fontSize="10" fill={g.color}>×</text>
              </g>
            </g>
          ))}

          {/* Swimlane bands */}
          {swimlaneBands.map((band, i) => (
            <g key={i}>
              <rect
                x={band.x} y={band.y}
                width={band.width} height={band.height}
                rx={12} fill={band.color}
                style={{ pointerEvents: 'none' }}
              />
              <text
                x={band.x + 12} y={band.y + 18}
                fontSize="11" fill="rgba(0,0,0,0.35)" fontWeight="600"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {band.label}
              </text>
            </g>
          ))}
          {/* Critical path highlights */}
          {criticalPathIds && criticalPathIds.size > 0 && Array.from(criticalPathIds).map(id => {
            const n = nodes[id]
            if (!n) return null
            const { w, h } = getShapeDims(n.shape)
            return (
              <rect
                key={`cp-${id}`}
                x={n.x - w/2 - 5} y={n.y - h/2 - 5}
                width={w + 10} height={h + 10}
                rx={8} fill="none"
                stroke="#F59E0B" strokeWidth="3" strokeDasharray="none"
                style={{ pointerEvents: 'none' }}
              />
            )
          })}

          <GraphRenderer
            treeState={treeState}
            dragPos={dragPos}
            dropTargetId={dropTargetId}
            ghostEdge={ghostEdge}
            hoveredNodeId={hoveredNodeId}
            selectedEdgeId={selectedEdgeId}
            multiSelectIds={multiSelectIds}
            editingNodeId={editingNodeId}
            heatmapColors={colorByFieldColors ?? heatmapColors}
            filteredNodeIds={filteredNodeIds}
            compactMode={compactMode}
            depsOnlyView={depsOnlyView}
            curved={curvedEdges}
            nodeSizeOverrides={nodeSizeOverrides}
            linkMap={linkMap}
            onSelectNode={onSelectNode}
            onDeselect={onDeselect}
            onStopEditing={(trigger) => {
              const editedId = editingNodeId
              setEditingNodeId(null)
              if (trigger === 'enter' && editedId && nodes[editedId]?.parentId) {
                addChildAndLayout(nodes[editedId].parentId)
              }
            }}
            onEditNode={onEditNode}
            onDeleteNode={(id) => { onDeleteNode(id); showToast('Node deleted') }}
            onAddChild={(id) => { addChildAndLayout(id); showToast('Child node added') }}
            onToggleCollapse={onToggleCollapse}
            onNodeMouseDown={handleNodeMouseDown}
            onPortMouseDown={handlePortMouseDown}
            onNodeMouseEnter={handleNodeMouseEnter}
            onNodeMouseLeave={handleNodeMouseLeave}
            onNodeDoubleClick={handleNodeDoubleClick}
            onEdgeClick={handleEdgeClick}
            onNodeContextMenu={handleNodeContextMenu}
          />
          {activeLens && overlay && (
            <OverlayRenderer overlay={overlay} nodes={nodes} />
          )}
        </g>

        {/* Color + Shape palette */}
        {selectedNode && (
          <foreignObject
            x={palX} y={palY}
            width={PAL_W} height={PAL_H}
            onMouseDown={(e) => { e.stopPropagation(); e.preventDefault() }}
            onMouseUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{ overflow: 'visible' }}
          >
            <div
              data-node={selectedNodeId}
              xmlns="http://www.w3.org/1999/xhtml"
              style={{
                display: 'inline-flex', flexDirection: 'column', gap: '6px',
                background: 'white', borderRadius: '12px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 4px 16px rgba(0,0,0,0.13)',
                padding: '8px 12px', pointerEvents: 'all', userSelect: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {COLOR_KEYS.map(key => {
                  const c = NODE_COLORS[key]
                  const keyValue = key === 'null' ? null : key
                  const isActive = (selectedNode.color ?? null) === keyValue
                  return (
                    <button key={key} title={c.label}
                      onClick={() => onColorChange(selectedNodeId, keyValue)}
                      style={{
                        width: 18, height: 18, borderRadius: '50%',
                        background: c.bg, border: `2px solid ${isActive ? '#3B82F6' : c.border}`,
                        boxShadow: isActive ? '0 0 0 2px #93C5FD' : 'none',
                        cursor: 'pointer', flexShrink: 0, padding: 0, outline: 'none',
                      }} />
                  )
                })}
                <span style={{ fontSize: '11px', color: '#9CA3AF', marginLeft: 4 }}>Fill</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {SHAPES.map(shape => {
                  const isActive = (selectedNode.shape ?? 'rect') === shape
                  return (
                    <button key={shape} title={shape}
                      onClick={() => onSetShape(selectedNodeId, shape)}
                      style={{
                        width: 28, height: 22, borderRadius: '4px', fontSize: '13px',
                        background: isActive ? '#EFF6FF' : '#F9FAFB',
                        border: `1.5px solid ${isActive ? '#3B82F6' : '#E5E7EB'}`,
                        cursor: 'pointer', padding: 0, outline: 'none', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {shapeLabels[shape]}
                    </button>
                  )
                })}
                <span style={{ fontSize: '11px', color: '#9CA3AF', marginLeft: 4 }}>Shape</span>
              </div>
              {/* Emoji icon row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                {['⭐','🔥','✅','⚠️','💡','🚀','🐛','❤️','🎯','📌'].map(em => {
                  const isActive = selectedNode.icon === em
                  return (
                    <button key={em}
                      onClick={() => onSetNodeMeta?.(selectedNodeId, { icon: isActive ? null : em })}
                      title={isActive ? 'Remove icon' : `Set icon ${em}`}
                      style={{
                        width: 22, height: 22, borderRadius: '5px', fontSize: '12px',
                        background: isActive ? '#EFF6FF' : '#F9FAFB',
                        border: `1.5px solid ${isActive ? '#3B82F6' : '#E5E7EB'}`,
                        cursor: 'pointer', padding: 0, outline: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: isActive ? '0 0 0 1.5px #93C5FD' : 'none',
                      }}
                    >{em}</button>
                  )
                })}
                {selectedNode.icon && (
                  <button
                    onClick={() => onSetNodeMeta?.(selectedNodeId, { icon: null })}
                    title="Clear icon"
                    style={{
                      width: 22, height: 22, borderRadius: '5px', fontSize: '10px',
                      background: '#FEF2F2', border: '1.5px solid #FECACA',
                      color: '#EF4444', cursor: 'pointer', padding: 0, outline: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                    }}
                  >✕</button>
                )}
                <span style={{ fontSize: '11px', color: '#9CA3AF', marginLeft: 3 }}>Icon</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                <button
                  onClick={() => setShowNotes(s => !s)}
                  title="Edit notes (N)"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    fontSize: '11px', fontWeight: 500,
                    color: showNotes ? '#2563EB' : (selectedNode.notes ? '#B45309' : '#6B7280'),
                    background: showNotes ? '#EFF6FF' : (selectedNode.notes ? '#FFFBEB' : '#F9FAFB'),
                    border: `1px solid ${showNotes ? '#BFDBFE' : (selectedNode.notes ? '#FDE68A' : '#E5E7EB')}`,
                    borderRadius: '6px', padding: '3px 7px', cursor: 'pointer', outline: 'none',
                  }}
                >
                  📝 Notes
                </button>
                <button
                  onClick={() => {
                    const current = selectedNode.url ?? ''
                    const url = window.prompt('Enter URL (leave blank to remove):', current)
                    if (url === null) return
                    onSetNodeUrl?.(selectedNodeId, url.trim() || null)
                    showToast(url.trim() ? 'URL set' : 'URL removed')
                  }}
                  title="Set URL"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    fontSize: '11px', fontWeight: 500,
                    color: selectedNode.url ? '#2563EB' : '#6B7280',
                    background: selectedNode.url ? '#EFF6FF' : '#F9FAFB',
                    border: `1px solid ${selectedNode.url ? '#BFDBFE' : '#E5E7EB'}`,
                    borderRadius: '6px', padding: '3px 7px', cursor: 'pointer', outline: 'none',
                  }}
                >
                  🔗 URL
                </button>
                <button
                  onClick={() => setNodeDetailId(selectedNode.id)}
                  title="Open ticket detail (O)"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    fontSize: '11px', fontWeight: 700,
                    color: 'white',
                    background: 'linear-gradient(135deg, #2563EB, #4F46E5)',
                    border: '1px solid #1D4ED8',
                    borderRadius: '6px', padding: '3px 9px', cursor: 'pointer', outline: 'none',
                    boxShadow: '0 1px 4px rgba(37,99,235,0.35)',
                  }}
                >
                  🎫 Open ticket
                </button>
                <button
                  onClick={() => setShowDependencyPanel(s => !s)}
                  title="Dependencies"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    fontSize: '11px', fontWeight: 500,
                    color: showDependencyPanel ? '#7C3AED' : '#6B7280',
                    background: showDependencyPanel ? '#F5F3FF' : '#F9FAFB',
                    border: `1px solid ${showDependencyPanel ? '#DDD6FE' : '#E5E7EB'}`,
                    borderRadius: '6px', padding: '3px 7px', cursor: 'pointer', outline: 'none',
                  }}
                >
                  🔀 Deps
                </button>
              </div>
            </div>
          </foreignObject>
        )}

        {/* Presence cursors — other collaborators' positions */}
        {presence.filter(u => u.cursor).map(u => (
          <g key={u.userId} transform={`translate(${u.cursor.x * transform.scale + transform.x}, ${u.cursor.y * transform.scale + transform.y})`} style={{ pointerEvents: 'none' }}>
            <path d="M0 0 L0 14 L4 10 L8 18 L10 17 L6 9 L12 9 Z" fill={u.color || '#3B82F6'} stroke="white" strokeWidth="1" />
            <rect x="12" y="2" rx="3" width={u.email ? Math.min(u.email.length * 6 + 8, 120) : 60} height="16" fill={u.color || '#3B82F6'} />
            <text x="16" y="13" fill="white" fontSize="9" fontWeight="600" fontFamily="sans-serif">{u.email?.split('@')[0] || 'User'}</text>
          </g>
        ))}
      </svg>
      )}

      {/* Bottom toolbar — hidden in presentation mode */}
      {!presentationMode && (
        <div className="canvas-toolbar absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-0.5 bg-white rounded-full shadow-md border border-gray-200 px-2 py-1.5">
          {/* Undo / Redo */}
          <ToolbarBtn onClick={onUndo} disabled={!canUndo} title="Undo (⌘Z)"><UndoIcon /></ToolbarBtn>
          <ToolbarBtn onClick={onRedo} disabled={!canRedo} title="Redo (⌘⇧Z)"><RedoIcon /></ToolbarBtn>
          <Divider />
          {/* Zoom controls */}
          <ToolbarBtn onClick={zoomOut} title="Zoom out"><ZoomOutIcon /></ToolbarBtn>
          <div className="relative">
            <button
              onClick={() => setZoomMenuOpen(s => !s)}
              className="text-xs text-gray-500 w-10 text-center tabular-nums select-none px-0.5 hover:text-gray-800 hover:bg-gray-100 rounded py-1"
            >
              {Math.round(transform.scale * 100)}%
            </button>
            {zoomMenuOpen && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-xl shadow-xl py-1 w-24 z-50">
                {ZOOM_PRESETS.map(({ label, value }) => (
                  <button
                    key={label}
                    onClick={() => { setScale(value); setZoomMenuOpen(false) }}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {label}
                  </button>
                ))}
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => { handleFitToContent(); setZoomMenuOpen(false) }}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                >
                  Fit all
                </button>
              </div>
            )}
          </div>
          <ToolbarBtn onClick={zoomIn} title="Zoom in"><ZoomInIcon /></ToolbarBtn>
          <Divider />
          <ToolbarBtn onClick={handleFitToContent} title="Fit to screen (F)"><FitIcon /></ToolbarBtn>
          <Divider />

          {/* VIEW dropdown */}
          <MenuDropdown
            label="View" icon={<EyeIcon />}
            open={openMenu === 'view'}
            onToggle={() => setOpenMenu(m => m === 'view' ? null : 'view')}
            width={220}
          >
            <MenuHeader label="Visualizations" />
            <MenuItem icon="📋" label="Kanban board" active={showKanban} onClick={() => { setShowKanban(s => !s); onTrackEvent?.('view_kanban'); setOpenMenu(null) }} />
            <MenuItem icon="🗒" label="Table view" active={showTableView} onClick={() => { setShowTableView(s => !s); setShowKanban(false); onTrackEvent?.('view_table'); setOpenMenu(null) }} />
            <MenuItem icon="📅" label="Timeline / roadmap" active={showTimeline} onClick={() => { setShowTimeline(s => !s); onTrackEvent?.('view_timeline'); setOpenMenu(null) }} />
            <MenuItem icon="🎯" label="Priority board" active={showPriorityBoard} onClick={() => { setShowPriorityBoard(s => !s); onTrackEvent?.('view_priority_board'); setOpenMenu(null) }} />
            <MenuItem icon="🏃" label="Sprint board" active={showSprintBoard} onClick={() => { setShowSprintBoard(s => !s); onTrackEvent?.('view_sprint_board'); setOpenMenu(null) }} />
            <MenuItem icon="📆" label="Sprint planning" active={showSprintPlanning} onClick={() => { setShowSprintPlanning(s => !s); onTrackEvent?.('view_sprint_planning'); setOpenMenu(null) }} />
            <MenuItem icon="📉" label="Burndown chart" active={showBurndown} onClick={() => { setShowBurndown(s => !s); onTrackEvent?.('view_burndown'); setOpenMenu(null) }} />
            <MenuItem icon="📊" label="Gantt chart" active={showGantt} onClick={() => { setShowGantt(s => !s); onTrackEvent?.('view_gantt'); setOpenMenu(null) }} />
            <MenuItem icon="🔗" label="Critical path" active={showCriticalPath} onClick={() => { setShowCriticalPath(s => !s); setOpenMenu(null) }} />
            <MenuItem icon="≡" label="Swimlanes" active={showSwimlanes} onClick={() => { setShowSwimlanes(s => !s); setOpenMenu(null) }} />
            {showSwimlanes && <>
              <MenuItem indent icon="→" label="By assignee" active={swimlaneBy === 'assignee'} onClick={() => { setSwimlaneBy('assignee'); setOpenMenu(null) }} />
              <MenuItem indent icon="→" label="By sprint" active={swimlaneBy === 'sprint'} onClick={() => { setSwimlaneBy('sprint'); setOpenMenu(null) }} />
            </>}
            <MenuItem icon="📌" label="Bookmarks" active={showBookmarks} onClick={() => { setShowBookmarks(s => !s); setOpenMenu(null) }} />
            <MenuDivider />
            <MenuHeader label="Display" />
            <MenuItem icon="🗺" label="Minimap" active={showMinimap} shortcut="M" onClick={() => { setShowMinimap(s => !s); setOpenMenu(null) }} />
            <MenuItem icon="🎯" label="Focus mode" active={focusMode} shortcut="F" onClick={() => { setFocusMode(s => !s); setOpenMenu(null) }} />
            <MenuItem icon="⛓" label="Dependency graph only" active={depsOnlyView} onClick={() => { setDepsOnlyView(s => !s); setOpenMenu(null) }} />
            <MenuItem icon="☰" label="Compact mode" active={compactMode} onClick={() => { setCompactMode(s => !s); setOpenMenu(null) }} />
            <MenuItem icon="📏" label="Size nodes by story points" active={sizeByPoints} onClick={() => { setSizeByPoints(s => !s); setOpenMenu(null) }} />
            <MenuDivider />
            <MenuHeader label="Coloring" />
            <MenuItem icon="🌡" label="Heatmap: due date" active={heatmapMode === 'duedate'} onClick={() => { setHeatmapMode(m => m === 'duedate' ? null : 'duedate'); setOpenMenu(null) }} />
            <MenuItem icon="🌡" label="Heatmap: priority" active={heatmapMode === 'priority'} onClick={() => { setHeatmapMode(m => m === 'priority' ? null : 'priority'); setOpenMenu(null) }} />
            <MenuItem icon="🌡" label="Heatmap: story points" active={heatmapMode === 'points'} onClick={() => { setHeatmapMode(m => m === 'points' ? null : 'points'); setOpenMenu(null) }} />
            <MenuItem icon="🎨" label="Color by status" active={colorByField === 'status'} onClick={() => { setColorByField(f => f === 'status' ? null : 'status'); setHeatmapMode(null); setOpenMenu(null) }} />
            <MenuItem icon="🎨" label="Color by priority" active={colorByField === 'priority'} onClick={() => { setColorByField(f => f === 'priority' ? null : 'priority'); setHeatmapMode(null); setOpenMenu(null) }} />
            <MenuItem icon="🎨" label="Color by assignee" active={colorByField === 'assignee'} onClick={() => { setColorByField(f => f === 'assignee' ? null : 'assignee'); setHeatmapMode(null); setOpenMenu(null) }} />
            <MenuItem icon="🎨" label="Color by issue type" active={colorByField === 'issueType'} onClick={() => { setColorByField(f => f === 'issueType' ? null : 'issueType'); setHeatmapMode(null); setOpenMenu(null) }} />
            <MenuItem icon="✕" label="Color off" active={colorByField === null && heatmapMode === null} onClick={() => { setColorByField(null); setHeatmapMode(null); setOpenMenu(null) }} />
            <MenuDivider />
            <MenuHeader label="Background" />
            <MenuItem icon="·" label="Dots" active={bgTheme === 'dots'} onClick={() => { setBgTheme('dots'); setOpenMenu(null) }} />
            <MenuItem icon="⊞" label="Grid" active={bgTheme === 'grid'} onClick={() => { setBgTheme('grid'); setOpenMenu(null) }} />
            <MenuItem icon="■" label="Solid" active={bgTheme === 'solid'} onClick={() => { setBgTheme('solid'); setOpenMenu(null) }} />
            <MenuItem icon="○" label="None" active={bgTheme === 'none'} onClick={() => { setBgTheme('none'); setOpenMenu(null) }} />
          </MenuDropdown>

          {/* ORGANIZE dropdown */}
          <MenuDropdown
            label="Organize" icon={<OrganizeIcon />}
            open={openMenu === 'organize'}
            onToggle={() => setOpenMenu(m => m === 'organize' ? null : 'organize')}
            width={210}
          >
            <MenuHeader label="Layout" />
            <MenuItem icon="⚡" label="Auto layout" onClick={() => { onApplyLayout?.(); showToast('Layout applied — Undo to revert'); setTimeout(() => handleFitToContentRef.current(), 80); setOpenMenu(null) }} />
            <MenuItem icon="🌐" label="Mind map layout" onClick={() => { onApplyRadialLayout?.(); showToast('Mind map layout applied — Undo to revert'); setTimeout(() => handleFitToContentRef.current(), 80); setOpenMenu(null) }} />
            <MenuItem icon="🔄" label="Auto-layout on add" active={autoLayoutOnAdd} onClick={() => { setAutoLayoutOnAdd(s => !s); setOpenMenu(null) }} />
            <MenuDivider />
            <MenuHeader label="Tree" />
            <MenuItem icon="⬇" label="Collapse all" onClick={() => { onCollapseAll?.(); showToast('All collapsed'); setOpenMenu(null) }} />
            <MenuItem icon="⬆" label="Expand all" onClick={() => { onExpandAll?.(); showToast('All expanded'); setOpenMenu(null) }} />
            <MenuItem icon="1" label="Collapse to depth 1" onClick={() => { onCollapseToDepth?.(1); showToast('Collapsed to depth 1'); setOpenMenu(null) }} />
            <MenuItem icon="2" label="Collapse to depth 2" onClick={() => { onCollapseToDepth?.(2); showToast('Collapsed to depth 2'); setOpenMenu(null) }} />
            <MenuItem icon="3" label="Collapse to depth 3" onClick={() => { onCollapseToDepth?.(3); showToast('Collapsed to depth 3'); setOpenMenu(null) }} />
            <MenuDivider />
            <MenuHeader label="Style" />
            <MenuItem icon="🌈" label="Auto-color by depth" onClick={() => { onAutoColor?.(); showToast('Colors applied by depth'); setOpenMenu(null) }} />
            <MenuItem icon="⊞" label="Snap to grid" active={snapToGrid} onClick={() => { setSnapToGrid(s => !s); setOpenMenu(null) }} />
            <MenuItem icon="〜" label="Curved edges" active={curvedEdges} onClick={() => { setCurvedEdges(s => !s); setOpenMenu(null) }} />
            <MenuItem icon="↺" label="Reset view" onClick={() => { resetView(); setOpenMenu(null) }} />
            <MenuDivider />
            <MenuHeader label="Add" />
            <MenuItem icon="□" label="Add frame" active={frameMode} onClick={() => { setFrameMode(s => !s); setOpenMenu(null); showToast(frameMode ? 'Frame mode off' : 'Click & drag to draw a frame') }} />
            <MenuItem icon="📝" label="Add sticky note" onClick={() => { onAddStickyNote?.(rootId); showToast('Sticky note added'); setOpenMenu(null) }} />
          </MenuDropdown>

          {/* EXPORT dropdown */}
          <MenuDropdown
            label="Export" icon={<ExportMenuIcon />}
            open={openMenu === 'export'}
            onToggle={() => setOpenMenu(m => m === 'export' ? null : 'export')}
            width={200}
          >
            <MenuHeader label="Images" />
            <MenuItem icon="🖼" label="Export PNG" onClick={() => { handleExportPng(); setOpenMenu(null) }} />
            <MenuItem icon="✦" label="Export SVG" onClick={() => { handleExportSVG(); setOpenMenu(null) }} />
            <MenuItem icon="📄" label="Export PDF" onClick={() => { handleExportPDF(); setOpenMenu(null) }} />
            <MenuDivider />
            <MenuHeader label="Documents" />
            <MenuItem icon="📊" label="Export CSV" onClick={() => { handleExportCSV(); setOpenMenu(null) }} />
            <MenuItem icon="↑" label="Import CSV" onClick={() => { csvImportRef.current?.click(); setOpenMenu(null) }} />
            <MenuItem icon="🔖" label="Confluence markup" onClick={() => { handleExportConfluence(); setOpenMenu(null) }} />
            <MenuItem icon="📝" label="Markdown outline" onClick={() => { handleExportMarkdown(); setOpenMenu(null) }} />
            <MenuDivider />
            <MenuHeader label="Share" />
            <MenuItem icon="🔗" label="Copy share link" onClick={() => { handleShareLink(); setOpenMenu(null) }} />
            <MenuItem icon="📐" label="Project templates" onClick={() => { setShowTemplates(true); setOpenMenu(null) }} />
          </MenuDropdown>

          {/* TOOLS dropdown */}
          <MenuDropdown
            label="Tools" icon={<ToolsMenuIcon />}
            open={openMenu === 'tools'}
            onToggle={() => setOpenMenu(m => m === 'tools' ? null : 'tools')}
            width={215}
          >
            <MenuHeader label="Nodes" />
            <MenuItem icon="🔧" label="Custom fields…" onClick={() => { setShowCustomFieldsManager(true); setOpenMenu(null) }} />
            <MenuItem icon="📋" label="Node templates" active={showNodeTemplates} onClick={() => { setShowNodeTemplates(s => !s); setOpenMenu(null) }} />
            <MenuItem icon="🔀" label="Workflow states" active={showWorkflow} onClick={() => { setShowWorkflow(s => !s); setOpenMenu(null) }} />
            <MenuDivider />
            <MenuHeader label="Analysis" />
            <MenuItem icon="⚡" label="Velocity chart" active={showVelocity} onClick={() => { setShowVelocity(s => !s); setOpenMenu(null) }} />
            <MenuItem icon="♨" label="Resource heatmap" active={showResourceHeatmap} onClick={() => { setShowResourceHeatmap(s => !s); setOpenMenu(null) }} />
            <MenuItem icon="🔍" label="Find & Replace" active={showFindReplace} shortcut="⌘H" onClick={() => { setShowFindReplace(s => !s); setOpenMenu(null) }} />
            <MenuItem icon="📊" label="Statistics" active={showStats} onClick={() => { setShowStats(s => !s); setOpenMenu(null) }} />
            <MenuDivider />
            <MenuHeader label="Workspace" />
            <MenuItem icon="📜" label="Activity log" active={showActivityLog} onClick={() => { setShowActivityLog(s => !s); setOpenMenu(null) }} />
            <MenuItem icon="↩" label="Undo history" active={showUndoHistory} onClick={() => { setShowUndoHistory(s => !s); setOpenMenu(null) }} />
            <MenuItem icon="📸" label="Snapshots" active={showSnapshots} onClick={() => { setShowSnapshots(s => !s); setOpenMenu(null) }} />
            <MenuItem icon="🔔" label="Webhooks & Slack" active={showWebhooks} onClick={() => { setShowWebhooks(s => !s); setOpenMenu(null) }} />
            <MenuItem icon="⏱" label="Auto-backup (5 min)" active={autoBackup} onClick={() => { setAutoBackup(s => !s); showToast(autoBackup ? 'Auto-backup disabled' : 'Auto-backup enabled'); setOpenMenu(null) }} />
            {selectedNodeId && <MenuDivider />}
            {selectedNodeId && <MenuHeader label="Selected node" />}
            {selectedNodeId && (
              <MenuItem
                icon={selectedNode?.locked ? '🔓' : '🔒'}
                label={selectedNode?.locked ? 'Unlock node' : 'Lock node'}
                active={!!selectedNode?.locked}
                onClick={() => { onToggleLock?.(selectedNodeId); setOpenMenu(null) }}
              />
            )}
          </MenuDropdown>

          <Divider />
          {/* Search & Filter */}
          <ToolbarBtn onClick={() => setShowSearch(s => !s)} active={showSearch} title="Search nodes (⌘K)"><SearchIcon /></ToolbarBtn>
          <div style={{ position: 'relative' }}>
            <ToolbarBtn
              onClick={() => setShowFilterBar(s => !s)}
              active={showFilterBar || Object.values(activeFilters).some(a => a?.length > 0)}
              title="Filter nodes"
            >
              <FilterIcon />
            </ToolbarBtn>
            {Object.values(activeFilters).some(a => a?.length > 0) && (
              <span style={{ position: 'absolute', top: 3, right: 3, width: 5, height: 5, borderRadius: '50%', background: '#3B82F6', pointerEvents: 'none' }} />
            )}
          </div>
          {/* Assignee filter pill */}
          <div style={{ position: 'relative' }} onMouseDown={e => e.stopPropagation()}>
            <button
              onClick={() => setShowAssigneeDropdown(s => !s)}
              style={{
                display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px',
                borderRadius: 999, fontSize: 11, fontWeight: 500,
                background: assigneeFilter ? '#EFF6FF' : '#F9FAFB',
                border: `1px solid ${assigneeFilter ? '#BFDBFE' : '#E5E7EB'}`,
                color: assigneeFilter ? '#2563EB' : '#6B7280',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {assigneeFilter ? `@${assigneeFilter}` : 'Assignee'}
              {assigneeFilter && (
                <span onClick={e => { e.stopPropagation(); setAssigneeFilter(null) }} style={{ marginLeft: 2, color: '#93C5FD', fontWeight: 700, fontSize: 13, lineHeight: 1 }}>×</span>
              )}
            </button>
            {showAssigneeDropdown && (() => {
              const assignees = [...new Set(Object.values(nodes).map(n => n.assignee).filter(Boolean))]
              return (
                <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6, background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 140, padding: '4px 0', zIndex: 100 }}>
                  <button onClick={() => { setAssigneeFilter(null); setShowAssigneeDropdown(false) }} style={{ width: '100%', padding: '6px 12px', fontSize: 12, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>All assignees</button>
                  {assignees.map(a => (
                    <button key={a} onClick={() => { setAssigneeFilter(a); setShowAssigneeDropdown(false) }} style={{ width: '100%', padding: '6px 12px', fontSize: 12, textAlign: 'left', background: assigneeFilter === a ? '#EFF6FF' : 'none', border: 'none', cursor: 'pointer', color: assigneeFilter === a ? '#2563EB' : '#374151' }}>@{a}</button>
                  ))}
                  {assignees.length === 0 && <div style={{ padding: '6px 12px', fontSize: 11, color: '#9CA3AF' }}>No assignees set</div>}
                </div>
              )
            })()}
          </div>
          <Divider />
          {/* Present / Dark / Help / Pomodoro */}
          <ToolbarBtn onClick={() => setPresentationMode(true)} title="Presentation mode (P)"><PresentIcon /></ToolbarBtn>
          <ToolbarBtn onClick={() => setDarkMode(s => !s)} active={darkMode} title="Dark mode"><DarkModeIcon /></ToolbarBtn>
          <ToolbarBtn onClick={() => setShowShortcuts(true)} title="Keyboard shortcuts (?)"><HelpIcon /></ToolbarBtn>
          <ToolbarBtn
            onClick={() => {
              if (!pomodoroActive) { setPomodoroSeconds(25 * 60); setPomodoroBreak(false) }
              setPomodoroActive(s => !s)
            }}
            active={pomodoroActive}
            title={pomodoroActive ? 'Stop Pomodoro' : 'Start 25-min Pomodoro'}
          >
            <span style={{ fontSize: 13 }}>🍅</span>
          </ToolbarBtn>
        </div>
      )}

      {/* Pomodoro overlay */}
      {pomodoroActive && !presentationMode && (
        <div style={{
          position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)',
          zIndex: 50, background: pomodoroBreak ? '#00875A' : '#DE350B',
          color: '#fff', borderRadius: 8, padding: '10px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}>
          <span style={{ fontSize: 18 }}>{pomodoroBreak ? '☕' : '🍅'}</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.85 }}>{pomodoroBreak ? 'BREAK' : 'FOCUS'}</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {String(Math.floor(pomodoroSeconds / 60)).padStart(2, '0')}:{String(pomodoroSeconds % 60).padStart(2, '0')}
            </div>
          </div>
          <button onClick={() => setPomodoroActive(false)} style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600, padding: '4px 8px' }}>Stop</button>
        </div>
      )}

      {/* Presentation mode controls */}
      {presentationMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 bg-black/70 text-white text-xs rounded-full">
          <button className="hover:text-gray-300" onClick={() => {
            const order = Object.values(nodes).sort((a, b) => a.depth - b.depth || a.title.localeCompare(b.title))
            const idx = Math.max(0, presentationIdx - 1)
            setPresentationIdx(idx)
            const n = order[idx]; if (n) { onSelectNode(n.id); panToCenter(n.x, n.y); setScale(1.5) }
          }}>← Prev</button>
          <span className="opacity-60">|</span>
          <span>{presentationIdx + 1} / {Object.keys(nodes).length}</span>
          <span className="opacity-60">|</span>
          <button className="hover:text-gray-300" onClick={() => {
            const order = Object.values(nodes).sort((a, b) => a.depth - b.depth || a.title.localeCompare(b.title))
            const idx = Math.min(order.length - 1, presentationIdx + 1)
            setPresentationIdx(idx)
            const n = order[idx]; if (n) { onSelectNode(n.id); panToCenter(n.x, n.y); setScale(1.5) }
          }}>Next →</button>
          <span className="opacity-60 ml-1">|</span>
          <button className="hover:text-gray-300" onClick={() => setPresentationMode(false)}>
            <kbd className="font-mono bg-white/20 px-1 rounded">P</kbd> Exit
          </button>
        </div>
      )}

      {/* Multi-select badge */}
      {multiSelectIds.size > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 bg-green-600 text-white text-xs rounded-full shadow flex items-center gap-2">
          <span>{multiSelectIds.size} selected</span>
          <button onClick={() => setShowBulkEdit(true)}
            className="hover:text-green-200 border border-green-400 rounded-full px-2 py-0.5">Edit</button>
          {/* Batch status picker */}
          <select
            onChange={e => {
              const status = e.target.value || null
              ;[...multiSelectIds].forEach(id => onSetNodeMeta?.(id, { status }))
              showToast(`Status set to "${e.target.value || 'none'}" on ${multiSelectIds.size} nodes`)
              e.target.value = ''
            }}
            defaultValue=""
            style={{ fontSize: 11, background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 999, padding: '1px 4px', cursor: 'pointer' }}
          >
            <option value="" disabled>Set status…</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
            <option value="blocked">Blocked</option>
          </select>
          <button
            onClick={() => {
              const label = window.prompt('Group name:', 'Group')
              if (!label) return
              const GROUP_COLORS = ['#3B82F6', '#22C55E', '#F97316', '#8B5CF6', '#EF4444']
              const color = GROUP_COLORS[groups.length % GROUP_COLORS.length]
              onAddGroup?.([...multiSelectIds], label, color)
              setMultiSelectIds(new Set())
              showToast(`Group "${label}" created`)
            }}
            className="hover:text-green-200 border border-green-400 rounded-full px-2 py-0.5">Group</button>
          <button onClick={() => { onBulkDelete?.([...multiSelectIds].filter(id => id !== rootId)); setMultiSelectIds(new Set()) }}
            className="hover:text-red-200">Delete</button>
          <button onClick={() => setMultiSelectIds(new Set())} className="hover:text-green-200">✕</button>
        </div>
      )}

      {/* Filter bar */}
      {showFilterBar && (
        <FilterBar
          filters={activeFilters}
          onChange={setActiveFilters}
          nodes={nodes}
          onClose={() => setShowFilterBar(false)}
        />
      )}

      {/* Search overlay */}
      {showSearch && (
        <SearchOverlay
          nodes={nodes}
          onNavigate={handleSearchNavigate}
          onClose={() => setShowSearch(false)}
        />
      )}

      {showFindReplace && (
        <FindReplacePanel
          nodes={nodes}
          onReplaceSingle={(nodeId, title) => { onEditNode(nodeId, title); showToast('Replaced') }}
          onReplaceAll={(replacements) => {
            for (const [id, title] of Object.entries(replacements)) onEditNode(id, title)
            showToast(`Replaced in ${Object.keys(replacements).length} nodes`)
          }}
          onClose={() => setShowFindReplace(false)}
        />
      )}

      {showCommandPalette && (
        <CommandPalette
          nodes={nodes}
          projects={projects}
          onNavigateNode={(nodeId) => { onSelectNode(nodeId); panToCenter(nodes[nodeId]?.x, nodes[nodeId]?.y) }}
          onSwitchProject={onSwitchProject}
          onClose={() => setShowCommandPalette(false)}
        />
      )}

      {/* Context menu */}
      {contextMenu && contextNode && (
        <NodeContextMenu
          x={contextMenu.screenX}
          y={contextMenu.screenY}
          node={contextNode}
          isRoot={contextMenu.nodeId === rootId}
          onEdit={() => { onSelectNode(contextMenu.nodeId); setEditingNodeId(contextMenu.nodeId) }}
          onDuplicate={() => { onDuplicateNode?.(contextMenu.nodeId); showToast('Node duplicated') }}
          onAddChild={() => { addChildAndLayout(contextMenu.nodeId); showToast('Child node added') }}
          onEditNotes={() => { onSelectNode(contextMenu.nodeId); setShowNotes(true) }}
          onSetUrl={() => {
            const current = contextNode.url ?? ''
            const url = window.prompt('Enter URL for this node (leave blank to remove):', current)
            if (url === null) return
            onSetNodeUrl?.(contextMenu.nodeId, url.trim() || null)
            showToast(url.trim() ? 'URL set' : 'URL removed')
          }}
          onSaveTemplate={() => {
            const name = window.prompt('Template name:', contextNode.title)
            if (!name?.trim()) return
            const template = {
              id: crypto.randomUUID(),
              name: name.trim(),
              rootId: contextMenu.nodeId,
              nodes: cloneSubtree(nodes, contextMenu.nodeId),
              savedAt: new Date().toISOString(),
            }
            const updated = [...nodeTemplates, template]
            setNodeTemplates(updated)
            try { localStorage.setItem('chart-to-jira-node-templates', JSON.stringify(updated)) } catch {}
            showToast('Saved as template')
          }}
          onDelete={() => {
            if (contextNode.childIds.length > 0) {
              const total = countDescendants(nodes, contextMenu.nodeId)
              if (!window.confirm(`Delete "${contextNode.title}" and ${total} child node${total !== 1 ? 's' : ''}?`)) return
            }
            onDeleteNode(contextMenu.nodeId)
            showToast('Node deleted')
          }}
          onMerge={() => {
            onMergeNode?.(contextMenu.nodeId)
            showToast('Node merged into parent')
          }}
          onSplit={() => {
            const newTitle = window.prompt('Name for the new split node:', contextNode.title + ' (2)')
            if (newTitle === null) return
            onSplitNode?.(contextMenu.nodeId, newTitle.trim() || contextNode.title + ' (2)')
            showToast('Node split')
          }}
          onStartTimer={startTimer}
          onStopTimer={stopTimer}
          timerActive={activeTimer?.nodeId === contextMenu?.nodeId}
          onOpenDetail={() => { setNodeDetailId(contextMenu.nodeId); setContextMenu(null) }}
          onShowImpact={(nodeId) => { setImpactNodeId(nodeId); setContextMenu(null) }}
          onShowDependencies={(nodeId) => { setActiveLens('dependencies'); setContextMenu(null) }}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Minimap */}
      {showMinimap && !presentationMode && (
        <Minimap
          nodes={nodes}
          transform={transform}
          svgRef={svgRef}
          onNavigate={handleMinimapNavigate}
        />
      )}

      {/* Notes panel */}
      {showNotes && notesNode && (
        <NotesPanel
          node={notesNode}
          onSave={(nodeId, notes) => onEditNotes?.(nodeId, notes)}
          onClose={() => setShowNotes(false)}
        />
      )}

      {/* Node Properties Panel */}
      {/* Removed — replaced by NodeDetailDialog (⬡ Detail button, O key, right-click) */}

      {/* Node Detail Dialog (Jira-style ticket view) */}
      {nodeDetailId && nodes[nodeDetailId] && (
        <NodeDetailDialog
          node={nodes[nodeDetailId]}
          nodes={nodes}
          projectId={projectId}
          onSave={(nodeId, meta) => onSetNodeMeta?.(nodeId, meta)}
          onAddComment={onAddComment}
          onDeleteComment={onDeleteComment}
          onEditComment={onEditComment}
          onAddChild={(parentId) => { onAddChild?.(parentId) }}
          onOpenDetail={(nodeId) => setNodeDetailId(nodeId)}
          onClose={() => setNodeDetailId(null)}
          onAssignNodeKey={onAssignNodeKey}
          currentUser={currentUser || 'You'}
          customStatuses={customStatuses}
          myRole={myRole}
        />
      )}

      {/* Dependency Panel */}
      {showDependencyPanel && selectedNode && (
        <DependencyPanel
          node={selectedNode}
          nodes={nodes}
          extraEdges={treeState.extraEdges || []}
          onAddDependency={onAddDependencyEdge}
          onDeleteEdge={onDeleteEdge}
          onNavigate={handleSearchNavigate}
          onClose={() => setShowDependencyPanel(false)}
        />
      )}

      {/* Gantt / Timeline Panel */}
      {showGantt && (
        <GanttPanel
          nodes={nodes}
          onClose={() => setShowGantt(false)}
          onNavigate={handleSearchNavigate}
        />
      )}

      {/* Workflow States Editor */}
      {showWorkflow && (
        <WorkflowPanel
          customStatuses={customStatuses}
          onChange={onSetCustomStatuses}
          onClose={() => setShowWorkflow(false)}
        />
      )}

      {/* Node Templates Panel */}
      {showNodeTemplates && (
        <NodeTemplatesPanel
          templates={nodeTemplates}
          selectedNodeId={selectedNodeId}
          onInsert={(template) => {
            const targetId = selectedNodeId || rootId
            onPasteSubtree?.(template.nodes, template.rootId, targetId)
            showToast(`Template "${template.name}" inserted`)
          }}
          onDelete={(id) => {
            const updated = nodeTemplates.filter(t => t.id !== id)
            setNodeTemplates(updated)
            try { localStorage.setItem('chart-to-jira-node-templates', JSON.stringify(updated)) } catch {}
          }}
          onClose={() => setShowNodeTemplates(false)}
        />
      )}

      {/* Sprint Board */}
      {showSprintBoard && (
        <SprintBoard
          nodes={nodes}
          onSetNodeMeta={onSetNodeMeta}
          onClose={() => setShowSprintBoard(false)}
          onOpenDetail={(id) => setNodeDetailId(id)}
        />
      )}

      {/* Templates dialog */}
      {showTemplates && (
        <TemplatesDialog
          onSelect={(template) => {
            const treeData = template.build()
            onImportTemplate?.(treeData, template.name)
            setShowTemplates(false)
            showToast(`Template "${template.name}" loaded`)
          }}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {/* Confluence export modal */}
      {showConfluenceModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowConfluenceModal(false)}>
          <div style={{ background: 'white', borderRadius: '16px', width: 580, maxHeight: '70vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>Confluence Export</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: 2 }}>Copy this wiki markup into a Confluence page</div>
              </div>
              <button onClick={() => setShowConfluenceModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9CA3AF' }}>×</button>
            </div>
            <textarea
              readOnly
              value={confluenceMarkup}
              style={{ flex: 1, padding: '16px', fontFamily: 'monospace', fontSize: '11px', border: 'none', resize: 'none', outline: 'none', color: '#374151', lineHeight: '1.5' }}
            />
            <div style={{ padding: '12px 20px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { navigator.clipboard?.writeText(confluenceMarkup); showToast('Copied to clipboard!') }}
                style={{ padding: '7px 16px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >Copy to Clipboard</button>
              <button onClick={() => setShowConfluenceModal(false)} style={{ padding: '7px 16px', background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Panel */}
      {showBulkEdit && multiSelectIds.size > 0 && (
        <BulkEditPanel
          nodeIds={[...multiSelectIds]}
          nodes={nodes}
          onApply={(nodeId, meta) => onSetNodeMeta?.(nodeId, meta)}
          onClose={() => setShowBulkEdit(false)}
        />
      )}

      {/* Snapshots Panel */}
      {showSnapshots && (
        <SnapshotsPanel
          snapshots={snapshots || []}
          onSave={onSaveSnapshot}
          onRestore={onRestoreSnapshot}
          onDelete={onDeleteSnapshot}
          onClose={() => setShowSnapshots(false)}
        />
      )}

      {/* Webhooks Panel */}
      {showWebhooks && (
        <WebhookPanel onClose={() => setShowWebhooks(false)} />
      )}

      {/* Activity Log Panel */}
      {showActivityLog && (
        <ActivityLogPanel
          activities={activityLog}
          onClose={() => setShowActivityLog(false)}
          onClear={onClearActivityLog}
        />
      )}

      {/* Undo History Panel */}
      {showUndoHistory && (
        <UndoHistoryPanel
          activityLog={activityLog}
          undoStackDepth={undoStackDepth}
          redoStackDepth={redoStackDepth}
          snapshots={snapshots}
          onRestoreSnapshot={onRestoreSnapshot}
          onClose={() => setShowUndoHistory(false)}
        />
      )}

      {/* Stats Panel */}
      {showStats && (
        <StatsPanel
          nodes={nodes}
          extraEdges={treeState.extraEdges || []}
          groups={treeState.groups || []}
          onFilterByStatus={(s) => { setActiveFilters(f => ({ ...f, status: s ? [s] : [] })); setShowFilterBar(true) }}
          onFilterByPriority={(p) => { setActiveFilters(f => ({ ...f, priority: p ? [p] : [] })); setShowFilterBar(true) }}
          onFilterByAssignee={(a) => { setActiveFilters(f => ({ ...f, assignee: [a] })); setShowFilterBar(true) }}
          onClose={() => setShowStats(false)}
        />
      )}

      {/* Burndown Panel */}
      {showBurndown && (
        <BurndownPanel nodes={nodes} onClose={() => setShowBurndown(false)} />
      )}

      {/* Velocity Chart */}
      {showVelocity && (
        <VelocityChart nodes={nodes} onClose={() => setShowVelocity(false)} />
      )}

      {/* Resource Heatmap */}
      {showResourceHeatmap && (
        <ResourceHeatmap nodes={nodes} onClose={() => setShowResourceHeatmap(false)} />
      )}

      {/* Sprint Planning View (full-screen overlay) */}
      {showSprintPlanning && (
        <SprintPlanningView
          nodes={nodes}
          onSetNodeMeta={onSetNodeMeta}
          onClose={() => setShowSprintPlanning(false)}
        />
      )}

      {/* Timeline Panel */}
      {showTimeline && (
        <TimelineView
          nodes={nodes}
          onClose={() => setShowTimeline(false)}
          onOpenDetail={(id) => setNodeDetailId(id)}
          onSetNodeMeta={onSetNodeMeta}
        />
      )}

      {/* Priority Board */}
      {showPriorityBoard && (
        <PriorityBoard
          nodes={nodes}
          onSetNodeMeta={onSetNodeMeta}
          onClose={() => setShowPriorityBoard(false)}
          onOpenDetail={(id) => setNodeDetailId(id)}
        />
      )}

      {/* Shortcuts modal */}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}

      {/* Custom Fields Manager (Feature 20) */}
      {showCustomFieldsManager && (
        <CustomFieldsManager
          customFields={customFields}
          onSave={onSetCustomFields}
          onClose={() => setShowCustomFieldsManager(false)}
        />
      )}

      {/* Bookmarks Panel (Feature 23) */}
      {showBookmarks && (
        <div style={{ position:'absolute', top:50, left:8, zIndex:25, background:'white', border:'1px solid #E5E7EB', borderRadius:10, padding:'12px', width:220, boxShadow:'0 4px 16px rgba(0,0,0,0.1)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontWeight:700, fontSize:12 }}>Bookmarks</span>
            <button onClick={() => setShowBookmarks(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:14 }}>×</button>
          </div>
          {bookmarks.map(b => (
            <div key={b.id} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
              <button
                onClick={() => {
                  if (b.transform) setScale(b.transform.scale)
                  if (b.filters) setActiveFilters(b.filters)
                  if (b.assigneeFilter !== undefined) setAssigneeFilter(b.assigneeFilter)
                  showToast(`Loaded "${b.name}"`)
                }}
                style={{ flex:1, textAlign:'left', background:'none', border:'none', cursor:'pointer', fontSize:12, color:'#374151', padding:'3px 4px', borderRadius:4 }}
                onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >&#128278; {b.name}</button>
              <button onClick={() => setBookmarks(prev => prev.filter(x => x.id !== b.id))} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:12 }}>×</button>
            </div>
          ))}
          {bookmarks.length === 0 && <p style={{ fontSize:11, color:'#D1D5DB', textAlign:'center', padding:'8px 0' }}>No bookmarks yet.</p>}
          <button
            onClick={() => {
              const name = window.prompt('Bookmark name:', `View ${bookmarks.length + 1}`)
              if (!name) return
              const bm = { id: crypto.randomUUID(), name, transform: { ...transform }, filters: { ...activeFilters }, assigneeFilter }
              setBookmarks(prev => [...prev, bm])
              showToast(`Bookmarked "${name}"`)
            }}
            style={{ width:'100%', marginTop:8, background:'#3B82F6', color:'white', border:'none', borderRadius:6, padding:'5px 10px', fontSize:11, cursor:'pointer', fontWeight:600 }}
          >+ Save current view</button>
        </div>
      )}

      {/* Active timer indicator (Feature 24) */}
      {activeTimer && (
        <div style={{ position:'absolute', top:8, right:8, zIndex:20, display:'flex', alignItems:'center', gap:8, background:'#1E293B', color:'white', borderRadius:999, padding:'6px 14px', fontSize:12, boxShadow:'0 2px 8px rgba(0,0,0,0.2)' }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:'#EF4444', display:'inline-block' }} />
          <span>{timerDisplay}</span>
          <span style={{ opacity:0.6, fontSize:11 }}>{nodes[activeTimer.nodeId]?.title?.slice(0, 20)}</span>
          <button onClick={stopTimer} style={{ background:'#EF4444', color:'white', border:'none', borderRadius:6, padding:'2px 8px', cursor:'pointer', fontSize:11, fontWeight:700 }}>Stop</button>
        </div>
      )}


      {/* Impact Analysis Panel */}
      {impactNodeId && (
        <ImpactPanel
          nodeId={impactNodeId}
          nodeTitle={nodes[impactNodeId]?.text}
          projectId={projectId}
          onClose={() => setImpactNodeId(null)}
          onHighlight={(result) => {
            if (result?.affectedNodeIds?.length) {
              setMultiSelectIds(new Set(result.affectedNodeIds))
            }
          }}
        />
      )}

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} />

      {/* Hidden CSV import input */}
      <input ref={csvImportRef} type="file" accept=".csv,text/csv" onChange={handleImportCSV} style={{ display: 'none' }} />

      {/* Edge selected toolbar */}
      {selectedEdgeId && (() => {
        const edge = (treeState.extraEdges || []).find(e => e.id === selectedEdgeId)
        const edgeType = edge?.type
        return (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full shadow text-xs text-gray-600">
            <span className="mr-1 text-gray-400">Edge:</span>
            {['connection', 'dependency', 'blocker'].map(t => {
              const active = (edgeType ?? 'connection') === t
              const colors = { connection: '#64748B', dependency: '#8B5CF6', blocker: '#EF4444' }
              return (
                <button key={t}
                  onClick={() => onSetEdgeType?.(selectedEdgeId, t === 'connection' ? undefined : t)}
                  style={{
                    padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 500,
                    background: active ? colors[t] : '#F3F4F6',
                    color: active ? 'white' : '#6B7280',
                    border: `1px solid ${active ? colors[t] : '#E5E7EB'}`,
                    cursor: 'pointer',
                  }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              )
            })}
            <span className="w-px h-3 bg-gray-200 mx-0.5" />
            <button
              onClick={() => {
                const lbl = window.prompt('Edge label:', edge?.label || '')
                if (lbl === null) return
                onSetEdgeLabel?.(selectedEdgeId, lbl.trim() || null)
                showToast(lbl.trim() ? 'Label set' : 'Label cleared')
              }}
              style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 500, background: edge?.label ? '#FEF9C3' : '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB', cursor: 'pointer' }}
            >✏ Label</button>
            <span className="w-px h-3 bg-gray-200 mx-0.5" />
            <button
              onClick={() => { onDeleteEdge?.(selectedEdgeId); setSelectedEdgeId(null); showToast('Connection removed') }}
              className="text-red-400 hover:text-red-600"
            >Delete</button>
          </div>
        )
      })()}
    </div>
  )
}

function ToolbarBtn({ onClick, disabled, title, children, active }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
        disabled ? 'text-gray-300 cursor-default'
        : active ? 'text-blue-600 bg-blue-50'
        : 'text-gray-600 hover:bg-gray-100 cursor-pointer'
      }`}>
      {children}
    </button>
  )
}
function Divider() { return <div className="w-px h-5 bg-gray-200 mx-1" /> }

function UndoIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 6H10C12.2091 6 14 7.79086 14 10C14 12.2091 12.2091 14 10 14H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M5 3L2 6L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function RedoIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13 6H6C3.79086 6 2 7.79086 2 10C2 12.2091 3.79086 14 6 14H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M11 3L14 6L11 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ZoomOutIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5 7H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function ZoomInIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="M7 5V9M5 7H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function FitIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 5V2H5M11 2H14V5M14 11V14H11M5 14H2V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ResetIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8C3 5.23858 5.23858 3 8 3C9.5 3 10.8 3.65 11.7 4.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M13 8C13 10.7614 10.7614 13 8 13C6.5 13 5.2 12.35 4.3 11.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M11 2L12 5L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 14L4 11L7 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function LayoutIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="6" y="1" width="4" height="3" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="1" y="7" width="4" height="3" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="6" y="7" width="4" height="3" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="11" y="7" width="4" height="3" rx="1" stroke="currentColor" strokeWidth="1.4"/><path d="M8 4V7" stroke="currentColor" strokeWidth="1.4"/><path d="M3 7V6C3 5.44772 3.44772 5 4 5H12C12.5523 5 13 5.44772 13 6V7" stroke="currentColor" strokeWidth="1.4"/></svg>
}
function ExportIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 13H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function GridIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 2V14M10 2V14M2 6H14M2 10H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function SearchIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function FilterIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}

// Dropdown menu components
function MenuDropdown({ label, icon, open, onToggle, children, width }) {
  return (
    <div style={{ position: 'relative' }} onMouseDown={e => e.stopPropagation()}>
      <button
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '4px 9px', borderRadius: 6, fontSize: 11, fontWeight: 500,
          color: open ? '#1D4ED8' : '#374151',
          background: open ? '#EFF6FF' : 'transparent',
          border: `1px solid ${open ? '#BFDBFE' : 'transparent'}`,
          cursor: 'pointer', whiteSpace: 'nowrap', outline: 'none',
          transition: 'background 0.1s, color 0.1s',
        }}
      >
        <span style={{ opacity: 0.75 }}>{icon}</span>
        <span>{label}</span>
        <ChevronIcon up={open} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
          background: '#fff', border: '1px solid #E5E7EB',
          borderRadius: 10, boxShadow: '0 8px 28px rgba(0,0,0,0.14)',
          width: width || 210, padding: '4px 0', zIndex: 200,
          maxHeight: 420, overflowY: 'auto',
        }}>
          {children}
        </div>
      )}
    </div>
  )
}

function MenuHeader({ label }) {
  return (
    <div style={{
      padding: '8px 12px 3px',
      fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
      textTransform: 'uppercase', color: '#9CA3AF', userSelect: 'none',
    }}>
      {label}
    </div>
  )
}

function MenuItem({ label, icon, active, onClick, shortcut, indent }) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        width: '100%', padding: indent ? '5px 12px 5px 22px' : '5px 12px',
        fontSize: 12, textAlign: 'left',
        color: active ? '#1D4ED8' : '#374151',
        background: active ? '#EFF6FF' : hovered ? '#F5F7FF' : 'transparent',
        border: 'none', cursor: 'pointer', outline: 'none',
      }}
    >
      {icon !== undefined && (
        <span style={{ fontSize: 13, width: 17, textAlign: 'center', flexShrink: 0, lineHeight: 1, opacity: active ? 1 : 0.55 }}>
          {icon}
        </span>
      )}
      <span style={{ flex: 1, lineHeight: '1.3' }}>{label}</span>
      {shortcut && (
        <span style={{ fontSize: 10, color: '#B0B8C8', fontFamily: 'monospace', flexShrink: 0, letterSpacing: '0.01em' }}>
          {shortcut}
        </span>
      )}
      {active && (
        <span style={{ width: 14, textAlign: 'right', fontSize: 10, color: '#3B82F6', fontWeight: 700, flexShrink: 0 }}>✓</span>
      )}
    </button>
  )
}

function MenuDivider() {
  return <div style={{ height: 1, background: '#F3F4F6', margin: '3px 0' }} />
}
function EyeIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
}
function OrganizeIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
}
function ExportMenuIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
}
function ToolsMenuIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
}
function ChevronIcon({ up }) {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points={up ? '18 15 12 9 6 15' : '6 9 12 15 18 9'}/></svg>
}
function MapIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 3.5L6 1.5L10 3.5L15 1.5V12.5L10 14.5L6 12.5L1 14.5V3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M6 1.5V12.5M10 3.5V14.5" stroke="currentColor" strokeWidth="1.5"/></svg>
}
function CollapseAllIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 5H13M5 8H11M7 11H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function ExpandAllIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M7 11H9M5 8H11M3 5H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M8 2V5M8 11V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function RainbowIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 13C2 8.02944 5.58172 4 10 4" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/><path d="M4 13C4 9.13401 6.68629 6 10 6" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/><path d="M6 13C6 10.2386 7.79086 8 10 8" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round"/><path d="M8 13C8 11.3431 8.89543 10 10 10" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function PresentIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M8 12V15M5 15H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function HelpIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/><path d="M6.5 6C6.5 5.17157 7.17157 4.5 8 4.5C8.82843 4.5 9.5 5.17157 9.5 6C9.5 6.82843 8 7.5 8 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="11" r="0.75" fill="currentColor"/></svg>
}
function CsvIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 2H10L13 5V14H3V2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M10 2V5H13" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M5 9H11M5 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function CsvImportIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 2H10L13 5V9" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M10 2V5H13" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 11V15M8 15L6 13M8 15L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function SvgExportIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 2H10L13 5V14H3V2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M10 2V5H13" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><text x="4" y="12" fontSize="5" fill="currentColor" fontWeight="700">SVG</text></svg>
}
function MarkdownIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M4 11V5M4 11L6.5 8M4 11L1.5 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 5V11M9 5H11M9 8H11M11 5V8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ConfluenceIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 12L5 5L8 10L11 7L14 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="5" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>
}
function ShareIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="4" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5"/><path d="M6 7L10 5M6 9L10 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function TemplateIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg>
}
function SwimlanesIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4H14M2 8H14M2 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/></svg>
}
function GanttIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4H8M2 8H11M2 12H6" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><path d="M2 2V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function KanbanIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="6" y="3" width="4" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="3" width="4" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg>
}
function SprintIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
}
function BurndownIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 13L5 9L8 10L12 4L14 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 2V14H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function HeatmapIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="4" cy="8" r="2.5" fill="#EF4444" fillOpacity="0.7"/><circle cx="8" cy="8" r="2.5" fill="#F97316" fillOpacity="0.7"/><circle cx="12" cy="8" r="2.5" fill="#22C55E" fillOpacity="0.7"/></svg>
}
function CriticalPathIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="3" cy="8" r="2" stroke="#F59E0B" strokeWidth="1.5"/><circle cx="8" cy="4" r="2" stroke="#F59E0B" strokeWidth="1.5"/><circle cx="13" cy="8" r="2" stroke="#F59E0B" strokeWidth="1.5"/><path d="M5 8H6M10 8H11M8 6V5" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function MindMapIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="2" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="14" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="2" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="14" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M7 7L3 5M9 7L13 5M7 9L3 11M9 9L13 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
}
function ActivityLogIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 4H13M3 7H10M3 10H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M12 11V12L13 13" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
}
function SnapshotIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3V8L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/></svg>
}
function WebhookIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
}
function CompactIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="3" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="1" y="8" width="14" height="3" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg>
}
function LockIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
}
function WorkflowIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="3" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="4" r="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="13" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 8H6.5M9.5 8H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M4.5 6.5L6.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
}
function NodeTemplateIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/><path d="M11.5 9V14M9 11.5H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function DarkModeIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
}
function AutoLayoutIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="3" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="13" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 4.5V7M8 7L4.5 10M8 7L11.5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M11 5L13 4L13 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

function DependencyPanel({ node, nodes, extraEdges, onAddDependency, onDeleteEdge, onNavigate, onClose }) {
  const [search, setSearch] = React.useState('')

  const depEdgesOut = extraEdges.filter(e => e.from === node.id && e.type === 'dependency')
  const depEdgesIn = extraEdges.filter(e => e.to === node.id && e.type === 'dependency')

  const searchResults = search.length >= 1
    ? Object.values(nodes).filter(n =>
        n.id !== node.id &&
        n.title.toLowerCase().includes(search.toLowerCase()) &&
        !depEdgesOut.find(e => e.to === n.id) &&
        !depEdgesIn.find(e => e.from === n.id)
      ).slice(0, 6)
    : []

  return (
    <div style={{
      position: 'absolute', right: 12, top: showDependencyPanelTop(node), width: 268, zIndex: 14,
      background: 'white', borderRadius: '14px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)', border: '1px solid #E5E7EB',
      display: 'flex', flexDirection: 'column', maxHeight: '60vh',
    }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFAFA', borderRadius: '14px 14px 0 0', flexShrink: 0 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '13px', color: '#111827' }}>Dependencies</div>
          <div style={{ fontSize: '10px', color: '#9CA3AF' }}>Purple edges on canvas</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '18px', lineHeight: 1 }}>×</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {depEdgesOut.length > 0 && (
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>This node depends on</div>
            {depEdgesOut.map(e => {
              const target = nodes[e.to]
              return target ? (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 6px', borderRadius: '6px', background: '#F5F3FF', marginBottom: 3 }}>
                  <span style={{ fontSize: '11px', color: '#6B7280' }}>→</span>
                  <span style={{ flex: 1, fontSize: '12px', color: '#374151', cursor: 'pointer' }} onClick={() => onNavigate?.(e.to)}>{target.title}</span>
                  {target.status && <span style={{ fontSize: '10px', color: '#9CA3AF' }}>{target.status}</span>}
                  <button onClick={() => onDeleteEdge?.(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '13px', padding: '0 2px', lineHeight: 1 }}>×</button>
                </div>
              ) : null
            })}
          </div>
        )}
        {depEdgesIn.length > 0 && (
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Depended on by</div>
            {depEdgesIn.map(e => {
              const src = nodes[e.from]
              return src ? (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 6px', borderRadius: '6px', background: '#FFF7ED', marginBottom: 3 }}>
                  <span style={{ fontSize: '11px', color: '#6B7280' }}>←</span>
                  <span style={{ flex: 1, fontSize: '12px', color: '#374151', cursor: 'pointer' }} onClick={() => onNavigate?.(e.from)}>{src.title}</span>
                  {src.status && <span style={{ fontSize: '10px', color: '#9CA3AF' }}>{src.status}</span>}
                  <button onClick={() => onDeleteEdge?.(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '13px', padding: '0 2px', lineHeight: 1 }}>×</button>
                </div>
              ) : null
            })}
          </div>
        )}
        {depEdgesOut.length === 0 && depEdgesIn.length === 0 && (
          <div style={{ color: '#9CA3AF', fontSize: '12px', textAlign: 'center', padding: '10px 0' }}>No dependencies yet</div>
        )}
        <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 8 }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Add dependency (this node → …)</div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search nodes..."
            style={{ width: '100%', padding: '5px 8px', border: '1px solid #E5E7EB', borderRadius: '7px', fontSize: '12px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
          {searchResults.length > 0 && (
            <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {searchResults.map(n => (
                <button key={n.id} onClick={() => { onAddDependency?.(node.id, n.id); setSearch('') }} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: '6px',
                  background: '#F9FAFB', border: '1px solid #F3F4F6', cursor: 'pointer', textAlign: 'left',
                }}>
                  <span style={{ fontSize: '12px', color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</span>
                  {n.status && <span style={{ fontSize: '10px', color: '#9CA3AF' }}>{n.status}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function showDependencyPanelTop() { return 12 }

function CanvasFrame({ frame, onDelete, onRename }) {
  const [editing, setEditing] = React.useState(false)
  const [label, setLabel] = React.useState(frame.label)
  return (
    <g>
      <rect
        x={frame.x} y={frame.y} width={frame.w} height={frame.h}
        rx={8} fill={`${frame.color}18`}
        stroke={frame.color} strokeWidth="1.5" strokeDasharray="8 4"
        style={{ pointerEvents: 'none' }}
      />
      {editing ? (
        <foreignObject x={frame.x + 6} y={frame.y + 4} width={160} height={24}>
          <input
            xmlns="http://www.w3.org/1999/xhtml"
            autoFocus
            value={label}
            onChange={e => setLabel(e.target.value)}
            onBlur={() => { onRename?.(frame.id, label); setEditing(false) }}
            onKeyDown={e => { if (e.key === 'Enter') { onRename?.(frame.id, label); setEditing(false) } if (e.key === 'Escape') { setLabel(frame.label); setEditing(false) } }}
            style={{ width: '100%', fontSize: 11, fontWeight: 700, border: '1px solid #3B82F6', borderRadius: 4, padding: '1px 4px', outline: 'none', background: 'white' }}
          />
        </foreignObject>
      ) : (
        <text
          x={frame.x + 8} y={frame.y + 15}
          fontSize="12" fill={frame.color} fontWeight="700"
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => setEditing(true)}
        >
          {frame.label}
        </text>
      )}
      <g style={{ cursor: 'pointer' }} onClick={() => onDelete?.(frame.id)}>
        <circle cx={frame.x + frame.w - 10} cy={frame.y + 10} r={8} fill="white" stroke={frame.color} strokeWidth="1" />
        <text x={frame.x + frame.w - 10} y={frame.y + 10} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill={frame.color}>×</text>
      </g>
    </g>
  )
}

function NodeTemplatesPanel({ templates, selectedNodeId, onInsert, onDelete, onClose }) {
  return (
    <div style={{
      position: 'absolute', left: 12, top: 56, width: 260, zIndex: 25,
      background: 'white', borderRadius: '14px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)', border: '1px solid #E5E7EB',
      maxHeight: '70vh', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFAFA', borderRadius: '14px 14px 0 0', flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: '13px', color: '#111827' }}>Node Templates</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '18px', lineHeight: 1 }}>×</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {templates.length === 0 ? (
          <div style={{ color: '#9CA3AF', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>
            Right-click a node → "Save as template"
          </div>
        ) : templates.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 8px', borderRadius: '8px', background: '#F9FAFB', border: '1px solid #F3F4F6' }}>
            <span style={{ fontSize: '14px' }}>📌</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
              <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{Object.keys(t.nodes).length} nodes · {new Date(t.savedAt).toLocaleDateString()}</div>
            </div>
            <button onClick={() => onInsert(t)} style={{ padding: '4px 8px', background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#3B82F6', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Insert
            </button>
            <button onClick={() => onDelete(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '14px', padding: '0 2px', lineHeight: 1 }}>×</button>
          </div>
        ))}
      </div>
      <div style={{ padding: '8px 10px', borderTop: '1px solid #F3F4F6', fontSize: '11px', color: '#9CA3AF', flexShrink: 0 }}>
        {selectedNodeId ? 'Template will insert under selected node' : 'Template will insert at root'}
      </div>
    </div>
  )
}

const PRESET_STATUS_COLORS = ['#6B7280','#3B82F6','#22C55E','#EF4444','#F97316','#8B5CF6','#EC4899','#14B8A6','#EAB308','#0EA5E9']

function WorkflowPanel({ customStatuses, onChange, onClose }) {
  const [statuses, setStatuses] = React.useState(customStatuses || [])
  const [newLabel, setNewLabel] = React.useState('')
  const [newColor, setNewColor] = React.useState('#6B7280')

  function add() {
    const label = newLabel.trim()
    if (!label) return
    const value = label.toLowerCase().replace(/\s+/g, '-')
    if (statuses.find(s => s.value === value)) return
    const updated = [...statuses, { value, label, color: newColor }]
    setStatuses(updated)
    onChange?.(updated)
    setNewLabel('')
    setNewColor('#6B7280')
  }

  function remove(value) {
    const updated = statuses.filter(s => s.value !== value)
    setStatuses(updated)
    onChange?.(updated)
  }

  return (
    <div style={{
      position: 'absolute', left: 12, top: 56, width: 280, zIndex: 25,
      background: 'white', borderRadius: '14px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)', border: '1px solid #E5E7EB',
    }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFAFA', borderRadius: '14px 14px 0 0' }}>
        <span style={{ fontWeight: 700, fontSize: '13px', color: '#111827' }}>Custom Workflow States</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '18px', lineHeight: 1 }}>×</button>
      </div>
      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: 2 }}>Add custom statuses beyond the default 4. They appear in the status dropdown on every node.</div>
        {statuses.map(s => (
          <div key={s.value} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: '12px', color: '#374151' }}>{s.label}</span>
            <span style={{ fontSize: '10px', color: '#9CA3AF', fontFamily: 'monospace' }}>{s.value}</span>
            <button onClick={() => remove(s.value)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '13px', padding: '0 2px' }}>×</button>
          </div>
        ))}
        {statuses.length === 0 && <div style={{ color: '#D1D5DB', fontSize: '12px', textAlign: 'center', padding: '8px 0' }}>No custom states yet</div>}
        <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 8, display: 'flex', gap: 6 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
            {PRESET_STATUS_COLORS.map(c => (
              <button key={c} onClick={() => setNewColor(c)} style={{
                width: 14, height: 14, borderRadius: '50%', background: c, border: newColor === c ? '2px solid #111' : '1.5px solid transparent', cursor: 'pointer', padding: 0,
              }} />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Status name..."
            style={{ flex: 1, padding: '5px 8px', border: '1px solid #E5E7EB', borderRadius: '7px', fontSize: '12px', outline: 'none', fontFamily: 'inherit' }}
          />
          <button onClick={add} style={{ padding: '5px 12px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '7px', fontSize: '12px', cursor: 'pointer' }}>Add</button>
        </div>
      </div>
    </div>
  )
}

function UndoHistoryPanel({ activityLog, undoStackDepth, redoStackDepth, snapshots, onRestoreSnapshot, onClose }) {
  const recent = [...activityLog].reverse().slice(0, 50)
  return (
    <div style={{
      position: 'absolute', bottom: 56, right: 12, width: 300, maxHeight: 420,
      background: 'white', border: '1px solid #E5E7EB', borderRadius: 10,
      boxShadow: '0 4px 24px rgba(0,0,0,0.13)', zIndex: 50, display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 8px', borderBottom: '1px solid #F3F4F6' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Undo History</div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
            {undoStackDepth} step{undoStackDepth !== 1 ? 's' : ''} back · {redoStackDepth} step{redoStackDepth !== 1 ? 's' : ''} forward
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 18, lineHeight: 1, padding: '0 2px' }}>×</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {recent.length === 0 && (
          <div style={{ textAlign: 'center', color: '#D1D5DB', fontSize: 12, padding: '20px 0' }}>No actions yet</div>
        )}
        {recent.map((entry) => {
          const snap = snapshots?.find(s => Math.abs(new Date(s.timestamp) - new Date(entry.timestamp)) < 5000)
          const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          const typeColors = {
            add: '#22C55E', delete: '#EF4444', edit: '#3B82F6', status: '#8B5CF6',
            meta: '#6B7280', comment: '#F59E0B', connect: '#06B6D4', color: '#EC4899',
            layout: '#14B8A6', group: '#F97316',
          }
          const dot = typeColors[entry.type] || '#9CA3AF'
          return (
            <div key={entry.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 14px', cursor: 'default' }}
              onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0, marginTop: 4 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.description}</div>
                <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>{time}</div>
              </div>
              {snap && onRestoreSnapshot && (
                <button
                  onClick={() => onRestoreSnapshot(snap.id)}
                  style={{ fontSize: 10, color: '#3B82F6', background: 'none', border: '1px solid #BFDBFE', borderRadius: 4, padding: '1px 6px', cursor: 'pointer', flexShrink: 0 }}
                >
                  Restore
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
