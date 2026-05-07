import { useState, useEffect, useRef } from 'react'
import { treeReducer } from '../store/treeReducer.js'
import {
  ADD_CHILD, DELETE_NODE, EDIT_NODE, SELECT_NODE, DESELECT,
  UPDATE_NODE_COLOR, TOGGLE_COLLAPSE,
  MOVE_NODE, SET_SHAPE, ADD_EDGE, DELETE_EDGE, APPLY_LAYOUT,
  DUPLICATE_NODE, EDIT_NODE_NOTES,
  COLLAPSE_ALL, EXPAND_ALL, AUTO_COLOR, SET_NODE_URL, PASTE_SUBTREE, BULK_DELETE,
  SET_NODE_META, ADD_NODE_COMMENT, DELETE_NODE_COMMENT, COLLAPSE_TO_DEPTH, APPLY_JIRA_KEYS,
  SET_EDGE_TYPE, ADD_GROUP, DELETE_GROUP, RENAME_GROUP, APPLY_RADIAL_LAYOUT,
  TOGGLE_LOCK, TOGGLE_REACTION, ADD_AUDIT_ENTRY, REPARENT_NODE, SET_NODE_CHECKLIST, SET_EDGE_LABEL,
  SET_CUSTOM_FIELDS, MERGE_NODE, SPLIT_NODE,
} from '../store/treeActions.js'
import { saveProjectsData, loadProjectsData, saveProjectsDataSession, loadProjectsDataSession } from '../lib/localStorage.js'
import { computeLayout } from './useLayout.js'
import { fireWebhooks } from '../lib/webhookClient.js'
import { projectsApi } from '../lib/projectsApi.js'

const HISTORY_LIMIT = 50

// ─── Data model ─────────────────────────────────────────────────────────────
// Project (folder): { id, name, collab, activeMapId, maps: {[mapId]: MindMap}, mapOrder, nodeCounter, nodePrefix, createdAt, updatedAt }
// MindMap (canvas): { id, name, nodes, rootId, extraEdges, groups, customStatuses, customFields, frames, selectedNodeId, collab, createdAt, updatedAt }

// Derive a 2-4 letter prefix from a project name (e.g. "Sprint Planning" → "SP", "bahnOS" → "BAHN")
function computeNodePrefix(name) {
  const clean = (name || '').toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim()
  const words = clean.split(/\s+/).filter(Boolean)
  if (!words.length) return 'NODE'
  if (words.length === 1) return words[0].slice(0, 4)
  return words.slice(0, 4).map(w => w[0]).join('')
}

function makeMap(name, id) {
  const mapId = id || crypto.randomUUID()
  const now = new Date().toISOString()
  return {
    id: mapId,
    name: name || 'Main',
    nodes: {
      root: {
        id: 'root', title: name || 'Main', parentId: null, childIds: [],
        depth: 0, color: null, collapsed: false, x: 0, y: 0, shape: 'rect',
      },
    },
    rootId: 'root',
    extraEdges: [],
    groups: [],
    customStatuses: [],
    customFields: [],
    frames: [],
    selectedNodeId: null,
    collab: null,
    createdAt: now,
    updatedAt: now,
  }
}

function makeProject(name) {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const map = makeMap(name || 'New Project')
  return {
    id,
    name: name || 'New Project',
    collab: null,
    activeMapId: map.id,
    maps: { [map.id]: map },
    mapOrder: [map.id],
    nodeCounter: 0,
    nodePrefix: computeNodePrefix(name || 'New Project'),
    createdAt: now,
    updatedAt: now,
  }
}

// Migrate old flat-format projects (nodes at top level) into the new maps structure
function migrateProject(p) {
  if (p.maps) return p
  const mapId = crypto.randomUUID()
  const now = new Date().toISOString()
  const map = {
    id: mapId,
    name: 'Main',
    nodes: p.nodes || {},
    rootId: p.rootId || 'root',
    extraEdges: p.extraEdges || [],
    groups: p.groups || [],
    customStatuses: p.customStatuses || [],
    customFields: p.customFields || [],
    frames: p.frames || [],
    selectedNodeId: null,
    collab: null,
    createdAt: p.createdAt || now,
    updatedAt: p.updatedAt || now,
  }
  return {
    id: p.id,
    name: p.name,
    collab: p.collab || null,
    activeMapId: mapId,
    maps: { [mapId]: map },
    mapOrder: [mapId],
    createdAt: p.createdAt || now,
    updatedAt: p.updatedAt || now,
  }
}

function injectPositions(projects) {
  const updated = {}
  for (const [pid, rawP] of Object.entries(projects)) {
    const p = migrateProject(rawP)
    const updatedMaps = {}
    for (const [mid, map] of Object.entries(p.maps)) {
      const needsMigration = Object.values(map.nodes).some(n => n.x == null || n.y == null)
      if (!needsMigration) {
        updatedMaps[mid] = map
        continue
      }
      const SHAPE_H = { rect: 44, circle: 80, diamond: 70, sticky: 90 }
      const positions = computeLayout(map.nodes, map.rootId)
      let nodes = { ...map.nodes }
      for (const [id, pos] of Object.entries(positions)) {
        const shape = nodes[id]?.shape ?? 'rect'
        const h = SHAPE_H[shape] ?? SHAPE_H.rect
        nodes[id] = { ...nodes[id], x: pos.x, y: pos.y + h / 2, shape }
      }
      for (const id of Object.keys(nodes)) {
        if (nodes[id].x == null) nodes[id] = { ...nodes[id], x: 0, y: 0, shape: 'rect' }
      }
      updatedMaps[mid] = { ...map, nodes }
    }
    updated[pid] = { ...p, maps: updatedMaps }
  }
  return updated
}

function loadData(userId) {
  try {
    const saved = userId === 'guest' ? loadProjectsDataSession() : loadProjectsData(userId)
    if (saved?.activeId && saved?.projects && Object.keys(saved.projects).length > 0) {
      const projects = {}
      for (const [id, p] of Object.entries(saved.projects)) {
        const migrated = migrateProject(p)
        // Clear selectedNodeId on each map
        const maps = {}
        for (const [mid, map] of Object.entries(migrated.maps)) {
          maps[mid] = { ...map, selectedNodeId: null }
        }
        projects[id] = { ...migrated, maps }
      }
      return { activeId: saved.activeId, projects: injectPositions(projects) }
    }
  } catch (_) {}

  try {
    const oldTree = JSON.parse(localStorage.getItem(`chart-to-jira-tree-${userId}`))
    if (oldTree?.nodes && oldTree?.rootId) {
      const flat = { ...makeProject('My Project'), nodes: oldTree.nodes, rootId: oldTree.rootId }
      const p = migrateProject(flat)
      const projects = injectPositions({ [p.id]: p })
      return { activeId: p.id, projects }
    }
  } catch (_) {}

  const p = makeProject('My Project')
  return { activeId: p.id, projects: { [p.id]: p } }
}

function getHistory(historyRef, key) {
  if (!historyRef.current[key]) {
    historyRef.current[key] = { past: [], future: [] }
  }
  return historyRef.current[key]
}

function buildActivityEntry(action, map) {
  const nodes = map?.nodes || {}
  const ts = new Date().toISOString()
  const id = crypto.randomUUID()
  const title = (nodeId) => nodes[nodeId]?.title ? `"${nodes[nodeId].title}"` : nodeId

  switch (action.type) {
    case 'ADD_CHILD': return { id, type: 'add', description: `Added child node to ${title(action.parentId)}`, timestamp: ts }
    case 'DELETE_NODE': return { id, type: 'delete', description: `Deleted node ${title(action.nodeId)}`, timestamp: ts }
    case 'EDIT_NODE': return { id, type: 'edit', description: `Renamed ${title(action.nodeId)} to "${action.title}"`, timestamp: ts }
    case 'SET_NODE_META': {
      if (action.meta?.status) return { id, type: 'status', description: `Status of ${title(action.nodeId)} → ${action.meta.status}`, timestamp: ts }
      return { id, type: 'meta', description: `Updated properties of ${title(action.nodeId)}`, timestamp: ts }
    }
    case 'ADD_NODE_COMMENT': return { id, type: 'comment', description: `Comment added on ${title(action.nodeId)}`, timestamp: ts }
    case 'ADD_EDGE': return { id, type: 'connect', description: `Connected ${title(action.from)} → ${title(action.to)}`, timestamp: ts }
    case 'DELETE_EDGE': return { id, type: 'connect', description: `Removed connection`, timestamp: ts }
    case 'UPDATE_NODE_COLOR': return { id, type: 'color', description: `Color changed on ${title(action.nodeId)}`, timestamp: ts }
    case 'APPLY_LAYOUT': return { id, type: 'layout', description: 'Auto layout applied', timestamp: ts }
    case 'APPLY_RADIAL_LAYOUT': return { id, type: 'layout', description: 'Mind map layout applied', timestamp: ts }
    case 'ADD_GROUP': return { id, type: 'group', description: `Group "${action.label}" created with ${action.nodeIds?.length || 0} nodes`, timestamp: ts }
    case 'DUPLICATE_NODE': return { id, type: 'add', description: `Duplicated ${title(action.nodeId)}`, timestamp: ts }
    default: return null
  }
}

export function useProjects(userId) {
  const [data, setData] = useState(() => loadData(userId))
  const [activityLog, setActivityLog] = useState([])
  const [snapshots, setSnapshots] = useState([])
  const historyRef = useRef({})
  const collabSendRef = useRef(null)

  useEffect(() => {
    if (userId === 'guest') {
      saveProjectsDataSession(data)
    } else {
      saveProjectsData(userId, data)
    }
  }, [data, userId])

  const projects = Object.values(data.projects).sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt)
  )
  const activeProject = data.projects[data.activeId] || null
  const activeMap = activeProject
    ? (activeProject.maps?.[activeProject.activeMapId] || Object.values(activeProject.maps || {})[0] || null)
    : null

  // History key scoped to project + map
  function histKey(projId, mapId) { return `${projId}:${mapId}` }

  function dispatchTree(action) {
    const projId = data.activeId
    const p = data.projects[projId]
    if (!p) return
    const mapId = p.activeMapId
    const map = p.maps?.[mapId]
    if (!map) return

    const hKey = histKey(projId, mapId)
    const snap = { nodes: map.nodes, rootId: map.rootId, extraEdges: map.extraEdges }
    const h = getHistory(historyRef, hKey)
    h.past = [...h.past.slice(-(HISTORY_LIMIT - 1)), snap]
    h.future = []

    const logEntry = buildActivityEntry(action, map)
    if (logEntry) setActivityLog(prev => [...prev.slice(-199), logEntry])

    // Webhooks
    const projectName = p.name || 'Untitled'
    const nodeTitle = (id) => map.nodes[id]?.title || id
    if (action.type === SET_NODE_META && action.meta?.status) {
      fireWebhooks('status_change', { nodeTitle: nodeTitle(action.nodeId), status: action.meta.status, projectName })
    } else if (action.type === ADD_CHILD) {
      fireWebhooks('node_created', { nodeTitle: 'New node', parentTitle: nodeTitle(action.parentId), projectName })
    } else if (action.type === DELETE_NODE) {
      fireWebhooks('node_deleted', { nodeTitle: nodeTitle(action.nodeId), projectName })
    } else if (action.type === ADD_NODE_COMMENT) {
      fireWebhooks('comment_added', { nodeTitle: nodeTitle(action.nodeId), text: action.text, author: action.author || 'You', projectName })
    } else if (action.type === REPARENT_NODE) {
      fireWebhooks('node_reparented', { nodeTitle: nodeTitle(action.nodeId), newParentTitle: nodeTitle(action.newParentId), projectName })
    }

    // Audit trail for metadata changes
    if (action.type === SET_NODE_META && action.meta) {
      const node = map.nodes[action.nodeId]
      if (node) {
        const auditFields = ['status', 'priority', 'assignee', 'issueType', 'storyPoints', 'dueDate', 'sprint']
        for (const field of auditFields) {
          if (field in action.meta && action.meta[field] !== node[field]) {
            dispatchTreeRaw({ type: ADD_AUDIT_ENTRY, nodeId: action.nodeId, field, oldValue: node[field], newValue: action.meta[field], user: 'system', timestamp: new Date().toISOString(), id: crypto.randomUUID() })
          }
        }
      }
    }

    // Collab broadcast — map-level takes precedence; project-level tags action with _mapId
    if (collabSendRef.current) {
      if (map.collab) {
        const newTree = treeReducer(
          { nodes: map.nodes, rootId: map.rootId, selectedNodeId: map.selectedNodeId, extraEdges: map.extraEdges || [], groups: map.groups || [], customFields: map.customFields || [] },
          action
        )
        const fullState = { nodes: newTree.nodes, rootId: newTree.rootId, extraEdges: newTree.extraEdges, groups: newTree.groups || map.groups || [], frames: map.frames || [], customStatuses: map.customStatuses || [], customFields: newTree.customFields || map.customFields || [] }
        collabSendRef.current(action, fullState)
      } else if (p.collab) {
        const newTree = treeReducer(
          { nodes: map.nodes, rootId: map.rootId, selectedNodeId: map.selectedNodeId, extraEdges: map.extraEdges || [], groups: map.groups || [], customFields: map.customFields || [] },
          action
        )
        const mapState = { _mapId: mapId, nodes: newTree.nodes, rootId: newTree.rootId, extraEdges: newTree.extraEdges, groups: newTree.groups || map.groups || [], frames: map.frames || [], customStatuses: map.customStatuses || [], customFields: newTree.customFields || map.customFields || [] }
        collabSendRef.current({ ...action, _mapId: mapId }, mapState)
      }
    }

    setData(d => {
      const proj = d.projects[d.activeId]
      if (!proj) return d
      const mId = proj.activeMapId
      const m = proj.maps?.[mId]
      if (!m) return d
      const newTree = treeReducer(
        { nodes: m.nodes, rootId: m.rootId, selectedNodeId: m.selectedNodeId, extraEdges: m.extraEdges || [], groups: m.groups || [], customFields: m.customFields || [] },
        action
      )
      const now = new Date().toISOString()
      return {
        ...d,
        projects: {
          ...d.projects,
          [d.activeId]: {
            ...proj,
            maps: { ...proj.maps, [mId]: { ...m, ...newTree, updatedAt: now } },
            updatedAt: now,
            // Increment nodeCounter when a keyed node is added
            ...(action.type === ADD_CHILD && action.nodeKey ? { nodeCounter: (proj.nodeCounter || 0) + 1 } : {}),
          },
        },
      }
    })
  }

  function dispatchTreeRaw(action) {
    setData(d => {
      const proj = d.projects[d.activeId]
      if (!proj) return d
      const mId = proj.activeMapId
      const m = proj.maps?.[mId]
      if (!m) return d
      const newTree = treeReducer(
        { nodes: m.nodes, rootId: m.rootId, selectedNodeId: m.selectedNodeId, extraEdges: m.extraEdges || [], groups: m.groups || [], customFields: m.customFields || [] },
        action
      )
      return {
        ...d,
        projects: {
          ...d.projects,
          [d.activeId]: {
            ...proj,
            maps: { ...proj.maps, [mId]: { ...m, ...newTree } },
          },
        },
      }
    })
  }

  function undo() {
    const p = data.projects[data.activeId]
    if (!p) return
    const mapId = p.activeMapId
    const map = p.maps?.[mapId]
    if (!map) return
    const hKey = histKey(data.activeId, mapId)
    const h = getHistory(historyRef, hKey)
    if (h.past.length === 0) return
    const snap = h.past[h.past.length - 1]
    h.past = h.past.slice(0, -1)
    h.future = [{ nodes: map.nodes, rootId: map.rootId, extraEdges: map.extraEdges }, ...h.future].slice(0, HISTORY_LIMIT)
    const now = new Date().toISOString()
    setData(d => ({
      ...d,
      projects: {
        ...d.projects,
        [d.activeId]: {
          ...d.projects[d.activeId],
          maps: {
            ...d.projects[d.activeId].maps,
            [mapId]: { ...d.projects[d.activeId].maps[mapId], nodes: snap.nodes, rootId: snap.rootId, extraEdges: snap.extraEdges, selectedNodeId: null, updatedAt: now },
          },
          updatedAt: now,
        },
      },
    }))
  }

  function redo() {
    const p = data.projects[data.activeId]
    if (!p) return
    const mapId = p.activeMapId
    const map = p.maps?.[mapId]
    if (!map) return
    const hKey = histKey(data.activeId, mapId)
    const h = getHistory(historyRef, hKey)
    if (h.future.length === 0) return
    const snap = h.future[0]
    h.future = h.future.slice(1)
    h.past = [...h.past.slice(-(HISTORY_LIMIT - 1)), { nodes: map.nodes, rootId: map.rootId, extraEdges: map.extraEdges }]
    const now = new Date().toISOString()
    setData(d => ({
      ...d,
      projects: {
        ...d.projects,
        [d.activeId]: {
          ...d.projects[d.activeId],
          maps: {
            ...d.projects[d.activeId].maps,
            [mapId]: { ...d.projects[d.activeId].maps[mapId], nodes: snap.nodes, rootId: snap.rootId, extraEdges: snap.extraEdges, selectedNodeId: null, updatedAt: now },
          },
          updatedAt: now,
        },
      },
    }))
  }

  const _activeMapId = activeProject?.activeMapId
  const _hKey = data.activeId && _activeMapId ? histKey(data.activeId, _activeMapId) : data.activeId
  const _h = historyRef.current[_hKey] || { past: [], future: [] }
  const canUndo = _h.past.length > 0
  const canRedo = _h.future.length > 0
  const undoStackDepth = _h.past.length
  const redoStackDepth = _h.future.length

  // ─── Project CRUD ─────────────────────────────────────────────────────────

  function importProject(projData) {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    // Templates/exports come in old flat format; migrateProject handles both
    const flat = { ...projData, id, selectedNodeId: null, extraEdges: projData.extraEdges ?? [], createdAt: now, updatedAt: now }
    const migrated = migrateProject(flat)
    const injected = injectPositions({ [id]: migrated })
    setData(d => ({ activeId: id, projects: { ...d.projects, ...injected } }))
  }

  function createProject(name) {
    const p = makeProject(name || 'New Project')
    setData(d => ({ activeId: p.id, projects: { ...d.projects, [p.id]: p } }))
    return p.id
  }

  function deleteProject(id) {
    // Clean up history for all maps in this project
    const proj = data.projects[id]
    if (proj?.maps) {
      for (const mapId of Object.keys(proj.maps)) {
        delete historyRef.current[histKey(id, mapId)]
      }
    }
    setData(d => {
      const remaining = { ...d.projects }
      delete remaining[id]
      if (Object.keys(remaining).length === 0) {
        const p = makeProject('My Project')
        return { activeId: p.id, projects: { [p.id]: p } }
      }
      const sorted = Object.values(remaining).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      const newActiveId = d.activeId === id ? sorted[sorted.length - 1].id : d.activeId
      return { activeId: newActiveId, projects: remaining }
    })
  }

  function renameProject(id, name) {
    if (!name?.trim()) return
    setData(d => ({
      ...d,
      projects: { ...d.projects, [id]: { ...d.projects[id], name: name.trim(), updatedAt: new Date().toISOString() } },
    }))
  }

  function switchProject(id) {
    if (id === data.activeId) return
    setData(d => ({ activeId: id, projects: d.projects }))
  }

  // ─── Map CRUD ─────────────────────────────────────────────────────────────

  function createMindMap(projectId, name) {
    const map = makeMap(name || 'New Map')
    const proj = data.projects[projectId]
    setData(d => {
      const p = d.projects[projectId]
      if (!p) return d
      const now = new Date().toISOString()
      return {
        ...d,
        projects: {
          ...d.projects,
          [projectId]: {
            ...p,
            maps: { ...p.maps, [map.id]: map },
            mapOrder: [...(p.mapOrder || []), map.id],
            activeMapId: map.id,
            updatedAt: now,
          },
        },
      }
    })
    if (collabSendRef.current && proj?.collab) {
      const newMaps = { ...proj.maps, [map.id]: map }
      const newMapOrder = [...(proj.mapOrder || Object.keys(proj.maps)), map.id]
      const mapsState = Object.fromEntries(Object.entries(newMaps).map(([mid, m]) => [mid, {
        id: m.id, name: m.name, nodes: m.nodes, rootId: m.rootId,
        extraEdges: m.extraEdges || [], groups: m.groups || [],
        frames: m.frames || [], customStatuses: m.customStatuses || [], customFields: m.customFields || [],
      }]))
      collabSendRef.current(
        { type: '__MAP_CREATE__', mapId: map.id, name: map.name, mapData: { id: map.id, name: map.name, nodes: map.nodes, rootId: map.rootId, extraEdges: [], groups: [], frames: [], customStatuses: [], customFields: [] } },
        { maps: mapsState, mapOrder: newMapOrder, activeMapId: map.id }
      )
    }
    return map.id
  }

  function deleteMindMap(projectId, mapId) {
    delete historyRef.current[histKey(projectId, mapId)]
    const proj = data.projects[projectId]
    const isLastMap = proj && Object.keys(proj.maps || {}).length === 1
    const replacementMap = isLastMap ? makeMap('Main') : null
    setData(d => {
      const p = d.projects[projectId]
      if (!p) return d
      const remainingMaps = { ...p.maps }
      delete remainingMaps[mapId]
      const now = new Date().toISOString()
      if (Object.keys(remainingMaps).length === 0) {
        const newMap = replacementMap || makeMap('Main')
        return {
          ...d,
          projects: {
            ...d.projects,
            [projectId]: { ...p, maps: { [newMap.id]: newMap }, mapOrder: [newMap.id], activeMapId: newMap.id, updatedAt: now },
          },
        }
      }
      const newOrder = (p.mapOrder || []).filter(mid => mid !== mapId)
      const newActiveMapId = p.activeMapId === mapId
        ? (newOrder[newOrder.length - 1] || Object.keys(remainingMaps)[0])
        : p.activeMapId
      return {
        ...d,
        projects: {
          ...d.projects,
          [projectId]: { ...p, maps: remainingMaps, mapOrder: newOrder, activeMapId: newActiveMapId, updatedAt: now },
        },
      }
    })
    if (collabSendRef.current && proj?.collab) {
      let remainingMaps = { ...proj.maps }
      delete remainingMaps[mapId]
      let newOrder = (proj.mapOrder || []).filter(mid => mid !== mapId)
      let newActiveMapId = proj.activeMapId === mapId
        ? (newOrder[newOrder.length - 1] || Object.keys(remainingMaps)[0])
        : proj.activeMapId
      if (replacementMap) {
        remainingMaps = { [replacementMap.id]: replacementMap }
        newOrder = [replacementMap.id]
        newActiveMapId = replacementMap.id
      }
      const mapsState = Object.fromEntries(Object.entries(remainingMaps).map(([mid, m]) => [mid, {
        id: m.id, name: m.name, nodes: m.nodes, rootId: m.rootId,
        extraEdges: m.extraEdges || [], groups: m.groups || [],
        frames: m.frames || [], customStatuses: m.customStatuses || [], customFields: m.customFields || [],
      }]))
      collabSendRef.current(
        { type: '__MAP_DELETE__', mapId, replacement: replacementMap ? { id: replacementMap.id, name: replacementMap.name } : null },
        { maps: mapsState, mapOrder: newOrder, activeMapId: newActiveMapId }
      )
    }
  }

  function renameMindMap(projectId, mapId, name) {
    if (!name?.trim()) return
    const proj = data.projects[projectId]
    setData(d => {
      const p = d.projects[projectId]
      if (!p?.maps?.[mapId]) return d
      const now = new Date().toISOString()
      return {
        ...d,
        projects: {
          ...d.projects,
          [projectId]: {
            ...p,
            maps: { ...p.maps, [mapId]: { ...p.maps[mapId], name: name.trim(), updatedAt: now } },
            updatedAt: now,
          },
        },
      }
    })
    if (collabSendRef.current && proj?.collab) {
      const newMaps = { ...proj.maps, [mapId]: { ...proj.maps[mapId], name: name.trim() } }
      const mapsState = Object.fromEntries(Object.entries(newMaps).map(([mid, m]) => [mid, {
        id: m.id, name: m.name, nodes: m.nodes, rootId: m.rootId,
        extraEdges: m.extraEdges || [], groups: m.groups || [],
        frames: m.frames || [], customStatuses: m.customStatuses || [], customFields: m.customFields || [],
      }]))
      collabSendRef.current(
        { type: '__MAP_RENAME__', mapId, name: name.trim() },
        { maps: mapsState, mapOrder: proj.mapOrder || Object.keys(proj.maps), activeMapId: proj.activeMapId }
      )
    }
  }

  function switchMindMap(projectId, mapId) {
    setData(d => {
      const proj = d.projects[projectId]
      if (!proj?.maps?.[mapId] || proj.activeMapId === mapId) return d
      return {
        ...d,
        projects: { ...d.projects, [projectId]: { ...proj, activeMapId: mapId } },
      }
    })
  }

  // Import a template's tree data as a new map inside an existing project (does NOT create a new project)
  function importMapToProject(projectId, treeData, name) {
    const mapId = crypto.randomUUID()
    const now = new Date().toISOString()
    const SHAPE_H = { rect: 44, circle: 80, diamond: 70, sticky: 90 }
    let nodes = treeData.nodes || {}
    const needsLayout = Object.values(nodes).some(n => n.x == null || n.y == null)
    if (needsLayout) {
      const positions = computeLayout(nodes, treeData.rootId)
      nodes = { ...nodes }
      for (const [id, pos] of Object.entries(positions)) {
        const shape = nodes[id]?.shape ?? 'rect'
        nodes[id] = { ...nodes[id], x: pos.x, y: pos.y + (SHAPE_H[shape] ?? 44) / 2, shape }
      }
      for (const id of Object.keys(nodes)) {
        if (nodes[id].x == null) nodes[id] = { ...nodes[id], x: 0, y: 0, shape: 'rect' }
      }
    }
    const map = {
      id: mapId,
      name: name || 'New Map',
      nodes,
      rootId: treeData.rootId,
      extraEdges: treeData.extraEdges || [],
      groups: [],
      customStatuses: [],
      customFields: [],
      frames: [],
      selectedNodeId: null,
      collab: null,
      createdAt: now,
      updatedAt: now,
    }
    setData(d => {
      const proj = d.projects[projectId]
      if (!proj) return d
      return {
        ...d,
        projects: {
          ...d.projects,
          [projectId]: {
            ...proj,
            maps: { ...proj.maps, [mapId]: map },
            mapOrder: [...(proj.mapOrder || []), mapId],
            activeMapId: mapId,
            updatedAt: now,
          },
        },
      }
    })
    return mapId
  }

  return {
    projects,
    activeProject,
    activeMap,
    activeId: data.activeId,
    canUndo,
    canRedo,
    undoStackDepth,
    redoStackDepth,
    undo,
    redo,
    importProject,
    createProject,
    deleteProject,
    renameProject,
    switchProject,
    createMindMap,
    deleteMindMap,
    renameMindMap,
    switchMindMap,
    importMapToProject,
    setCollabSender: (fn) => { collabSendRef.current = fn },
    applyRemoteAction: (roomId, action) => {
      // ── __SYNC__: full or partial state sync from server ──────────────────
      if (action.type === '__SYNC__' && action.state) {
        setData(d => {
          for (const [pid, proj] of Object.entries(d.projects)) {
            if (proj.collab?.id === roomId) {
              const state = action.state
              const now = new Date().toISOString()
              if (state.maps && typeof state.maps === 'object' && Object.keys(state.maps).length > 0) {
                // Full multi-map sync
                const maps = {}
                for (const [mid, mapData] of Object.entries(state.maps)) {
                  const existing = proj.maps?.[mid] || {}
                  maps[mid] = {
                    ...existing,
                    id: mid, name: mapData.name || existing.name || 'Main',
                    nodes: mapData.nodes || {}, rootId: mapData.rootId || 'root',
                    extraEdges: mapData.extraEdges || [], groups: mapData.groups || [],
                    customStatuses: mapData.customStatuses || [], customFields: mapData.customFields || [],
                    frames: mapData.frames || [], selectedNodeId: null, collab: null, updatedAt: now,
                  }
                }
                const mapOrder = state.mapOrder || Object.keys(maps)
                const activeMapId = (state.activeMapId && maps[state.activeMapId]) ? state.activeMapId : mapOrder[0]
                return {
                  ...d,
                  projects: { ...d.projects, [pid]: { ...proj, maps, mapOrder, activeMapId, updatedAt: now } },
                }
              } else if (state._mapId && proj.maps?.[state._mapId]) {
                // Per-map sync
                const { _mapId, ...mapState } = state
                return {
                  ...d,
                  projects: {
                    ...d.projects,
                    [pid]: { ...proj, maps: { ...proj.maps, [_mapId]: { ...proj.maps[_mapId], ...mapState, updatedAt: now } }, updatedAt: now },
                  },
                }
              } else {
                // Legacy flat sync: apply to active map
                const targetMapId = proj.activeMapId
                if (proj.maps?.[targetMapId]) {
                  return {
                    ...d,
                    projects: {
                      ...d.projects,
                      [pid]: { ...proj, maps: { ...proj.maps, [targetMapId]: { ...proj.maps[targetMapId], ...state, updatedAt: now } }, updatedAt: now },
                    },
                  }
                }
              }
            }
            // Map-level collab
            if (proj.maps) {
              for (const [mid, map] of Object.entries(proj.maps)) {
                if (map.collab?.id === roomId) {
                  const now = new Date().toISOString()
                  return {
                    ...d,
                    projects: {
                      ...d.projects,
                      [pid]: { ...proj, maps: { ...proj.maps, [mid]: { ...map, ...action.state, updatedAt: now } }, updatedAt: now },
                    },
                  }
                }
              }
            }
          }
          return d
        })
        return
      }

      // ── Map CRUD: __MAP_CREATE__ ──────────────────────────────────────────
      if (action.type === '__MAP_CREATE__') {
        setData(d => {
          for (const [pid, proj] of Object.entries(d.projects)) {
            if (proj.collab?.id === roomId) {
              if (proj.maps?.[action.mapId]) return d // already exists
              const now = new Date().toISOString()
              const md = action.mapData || {}
              const newMap = {
                id: action.mapId, name: action.name || 'New Map',
                nodes: md.nodes || {}, rootId: md.rootId || 'root',
                extraEdges: md.extraEdges || [], groups: md.groups || [],
                customStatuses: md.customStatuses || [], customFields: md.customFields || [],
                frames: md.frames || [], selectedNodeId: null, collab: null,
                createdAt: now, updatedAt: now,
              }
              return {
                ...d,
                projects: {
                  ...d.projects,
                  [pid]: {
                    ...proj,
                    maps: { ...proj.maps, [action.mapId]: newMap },
                    mapOrder: [...(proj.mapOrder || Object.keys(proj.maps)), action.mapId],
                    updatedAt: now,
                  },
                },
              }
            }
          }
          return d
        })
        return
      }

      // ── Map CRUD: __MAP_DELETE__ ──────────────────────────────────────────
      if (action.type === '__MAP_DELETE__') {
        setData(d => {
          for (const [pid, proj] of Object.entries(d.projects)) {
            if (proj.collab?.id === roomId) {
              if (!proj.maps?.[action.mapId]) return d
              const now = new Date().toISOString()
              const remainingMaps = { ...proj.maps }
              delete remainingMaps[action.mapId]
              const newOrder = (proj.mapOrder || []).filter(mid => mid !== action.mapId)
              if (Object.keys(remainingMaps).length === 0 && action.replacement) {
                const newMap = makeMap(action.replacement.name, action.replacement.id)
                return {
                  ...d,
                  projects: {
                    ...d.projects,
                    [pid]: { ...proj, maps: { [newMap.id]: newMap }, mapOrder: [newMap.id], activeMapId: newMap.id, updatedAt: now },
                  },
                }
              }
              const newActiveMapId = proj.activeMapId === action.mapId
                ? (newOrder[newOrder.length - 1] || Object.keys(remainingMaps)[0])
                : proj.activeMapId
              return {
                ...d,
                projects: {
                  ...d.projects,
                  [pid]: { ...proj, maps: remainingMaps, mapOrder: newOrder, activeMapId: newActiveMapId, updatedAt: now },
                },
              }
            }
          }
          return d
        })
        return
      }

      // ── Map CRUD: __MAP_RENAME__ ──────────────────────────────────────────
      if (action.type === '__MAP_RENAME__') {
        setData(d => {
          for (const [pid, proj] of Object.entries(d.projects)) {
            if (proj.collab?.id === roomId) {
              if (!proj.maps?.[action.mapId]) return d
              const now = new Date().toISOString()
              return {
                ...d,
                projects: {
                  ...d.projects,
                  [pid]: {
                    ...proj,
                    maps: { ...proj.maps, [action.mapId]: { ...proj.maps[action.mapId], name: action.name, updatedAt: now } },
                    updatedAt: now,
                  },
                },
              }
            }
          }
          return d
        })
        return
      }

      // ── Regular node action ───────────────────────────────────────────────
      setData(d => {
        for (const [pid, proj] of Object.entries(d.projects)) {
          let targetMapId = null
          if (proj.collab?.id === roomId) {
            // Use _mapId if present and the map exists; fallback to activeMapId
            targetMapId = (action._mapId && proj.maps?.[action._mapId]) ? action._mapId : proj.activeMapId
          } else if (proj.maps) {
            for (const [mid, map] of Object.entries(proj.maps)) {
              if (map.collab?.id === roomId) { targetMapId = mid; break }
            }
          }
          if (!targetMapId || !proj.maps?.[targetMapId]) continue
          const map = proj.maps[targetMapId]
          const cleanAction = { ...action }
          delete cleanAction._mapId
          const newTree = treeReducer(
            { nodes: map.nodes, rootId: map.rootId, selectedNodeId: map.selectedNodeId, extraEdges: map.extraEdges || [], groups: map.groups || [], customFields: map.customFields || [] },
            cleanAction
          )
          const now = new Date().toISOString()
          return {
            ...d,
            projects: {
              ...d.projects,
              [pid]: { ...proj, maps: { ...proj.maps, [targetMapId]: { ...map, ...newTree, updatedAt: now } }, updatedAt: now },
            },
          }
        }
        return d
      })
    },
    markProjectCollab: (id, role) => {
      setData(d => ({
        ...d,
        projects: { ...d.projects, [id]: { ...d.projects[id], collab: { id, role } } },
      }))
    },
    loadRemoteProject: (serverProject) => {
      const now = new Date().toISOString()
      const state = serverProject.state || {}
      let maps = {}
      let mapOrder = []
      let activeMapId = null

      if (state.maps && typeof state.maps === 'object' && Object.keys(state.maps).length > 0) {
        // Multi-map format: reconstruct all maps with their original IDs
        for (const [mid, mapData] of Object.entries(state.maps)) {
          maps[mid] = {
            id: mid,
            name: mapData.name || 'Main',
            nodes: mapData.nodes || {},
            rootId: mapData.rootId || 'root',
            extraEdges: mapData.extraEdges || [],
            groups: mapData.groups || [],
            customStatuses: mapData.customStatuses || [],
            customFields: mapData.customFields || [],
            frames: mapData.frames || [],
            selectedNodeId: null,
            collab: null,
            createdAt: mapData.createdAt || now,
            updatedAt: mapData.updatedAt || now,
          }
        }
        mapOrder = state.mapOrder || Object.keys(maps)
        activeMapId = (state.activeMapId && maps[state.activeMapId]) ? state.activeMapId : mapOrder[0]
      } else {
        // Legacy flat format: single map with a new ID
        const mid = crypto.randomUUID()
        maps = {
          [mid]: {
            id: mid, name: 'Main',
            nodes: state.nodes || {}, rootId: state.rootId || 'root',
            extraEdges: state.extraEdges || [], groups: state.groups || [],
            customStatuses: state.customStatuses || [], customFields: state.customFields || [],
            frames: state.frames || [], selectedNodeId: null, collab: null,
            createdAt: now, updatedAt: now,
          },
        }
        mapOrder = [mid]
        activeMapId = mid
      }

      const raw = {
        id: serverProject.id,
        name: serverProject.name,
        collab: { id: serverProject.id, role: serverProject.role },
        activeMapId,
        maps,
        mapOrder,
        createdAt: serverProject.createdAt || now,
        updatedAt: serverProject.updatedAt || now,
      }
      const injected = injectPositions({ [serverProject.id]: raw })
      setData(d => ({
        activeId: serverProject.id,
        projects: { ...d.projects, ...injected },
      }))
    },
    shareProject: async (id, token) => {
      const p = data.projects[id]
      if (!p) return { ok: false, error: 'Project not found' }
      try {
        const mapsState = Object.fromEntries(Object.entries(p.maps || {}).map(([mid, map]) => [mid, {
          id: map.id, name: map.name,
          nodes: map.nodes, rootId: map.rootId, extraEdges: map.extraEdges || [],
          groups: map.groups || [], frames: map.frames || [],
          customStatuses: map.customStatuses || [], customFields: map.customFields || [],
        }]))
        const state = {
          maps: mapsState,
          mapOrder: p.mapOrder || Object.keys(p.maps || {}),
          activeMapId: p.activeMapId,
        }
        // Create in DB (idempotent — safe if already exists)
        await projectsApi.create(token, id, p.name, state)
        // Always force-update state to capture all current maps
        // (ON CONFLICT DO NOTHING on create won't update an existing project's state)
        await projectsApi.saveState(token, id, state)
        setData(d => ({
          ...d,
          projects: { ...d.projects, [id]: { ...d.projects[id], collab: { id, role: 'admin' } } },
        }))
        return { ok: true }
      } catch (e) {
        return { ok: false, error: e.message }
      }
    },
    shareMap: async (projectId, mapId, token) => {
      const p = data.projects[projectId]
      if (!p) return { ok: false, error: 'Project not found' }
      const map = p.maps?.[mapId]
      if (!map) return { ok: false, error: 'Map not found' }
      try {
        const state = {
          nodes: map.nodes, rootId: map.rootId, extraEdges: map.extraEdges || [],
          groups: map.groups || [], frames: map.frames || [],
          customStatuses: map.customStatuses || [], customFields: map.customFields || [],
        }
        await projectsApi.create(token, mapId, `${p.name} / ${map.name}`, state)
        const now = new Date().toISOString()
        setData(d => ({
          ...d,
          projects: {
            ...d.projects,
            [projectId]: {
              ...d.projects[projectId],
              maps: { ...d.projects[projectId].maps, [mapId]: { ...d.projects[projectId].maps[mapId], collab: { id: mapId, role: 'admin' } } },
              updatedAt: now,
            },
          },
        }))
        return { ok: true }
      } catch (e) {
        return { ok: false, error: e.message }
      }
    },
    addChild: (parentId) => {
      let color = null, shape = 'rect'
      try {
        const u = JSON.parse(localStorage.getItem('chart-to-jira-user') || '{}')
        const preset = JSON.parse(localStorage.getItem(`chart-to-jira-node-style-${u.id}`) || 'null')
        if (preset) { color = preset.color ?? null; shape = preset.shape ?? 'rect' }
      } catch {}
      const proj = data.projects[data.activeId]
      const prefix = proj?.nodePrefix || computeNodePrefix(proj?.name || 'NODE')
      const counter = (proj?.nodeCounter || 0) + 1
      const nodeKey = `${prefix}-${String(counter).padStart(3, '0')}`
      dispatchTree({ type: ADD_CHILD, parentId, color, shape, nodeKey })
    },
    assignNodeKey: (nodeId) => {
      setData(d => {
        const proj = d.projects[d.activeId]
        if (!proj) return d
        const mId = proj.activeMapId
        const m = proj.maps?.[mId]
        if (!m || !m.nodes[nodeId]) return d
        if (m.nodes[nodeId].nodeKey) return d  // already has one
        const prefix = proj.nodePrefix || computeNodePrefix(proj.name || 'NODE')
        const counter = (proj.nodeCounter || 0) + 1
        const nodeKey = `${prefix}-${String(counter).padStart(3, '0')}`
        const now = new Date().toISOString()
        return {
          ...d,
          projects: {
            ...d.projects,
            [d.activeId]: {
              ...proj,
              nodeCounter: counter,
              maps: {
                ...proj.maps,
                [mId]: { ...m, nodes: { ...m.nodes, [nodeId]: { ...m.nodes[nodeId], nodeKey } }, updatedAt: now },
              },
              updatedAt: now,
            },
          },
        }
      })
    },
    addStickyNote: (parentId) => {
      const p = data.projects[data.activeId]
      const map = p?.maps?.[p.activeMapId]
      const parent = map?.nodes[parentId]
      const x = parent ? (parent.x ?? 0) + 80 + Math.random() * 40 : 0
      const y = parent ? (parent.y ?? 0) + 80 + Math.random() * 40 : 0
      dispatchTree({ type: ADD_CHILD, parentId, shape: 'sticky', title: 'Sticky note', color: null, x, y })
    },
    deleteNode: (nodeId) => dispatchTree({ type: DELETE_NODE, nodeId }),
    editNode: (nodeId, title) => dispatchTree({ type: EDIT_NODE, nodeId, title }),
    selectNode: (nodeId) => dispatchTree({ type: SELECT_NODE, nodeId }),
    deselect: () => dispatchTree({ type: DESELECT }),
    updateNodeColor: (nodeId, color) => dispatchTree({ type: UPDATE_NODE_COLOR, nodeId, color }),
    toggleCollapse: (nodeId) => dispatchTree({ type: TOGGLE_COLLAPSE, nodeId }),
    moveNode: (nodeId, x, y) => dispatchTree({ type: MOVE_NODE, nodeId, x, y }),
    setShape: (nodeId, shape) => dispatchTree({ type: SET_SHAPE, nodeId, shape }),
    addEdge: (from, to) => dispatchTree({ type: ADD_EDGE, id: crypto.randomUUID(), from, to }),
    addDependencyEdge: (from, to) => dispatchTree({ type: ADD_EDGE, id: crypto.randomUUID(), from, to, edgeType: 'dependency' }),
    deleteEdge: (edgeId) => dispatchTree({ type: DELETE_EDGE, edgeId }),
    applyLayout: () => dispatchTree({ type: APPLY_LAYOUT }),
    duplicateNode: (nodeId) => dispatchTree({ type: DUPLICATE_NODE, nodeId }),
    editNodeNotes: (nodeId, notes) => dispatchTree({ type: EDIT_NODE_NOTES, nodeId, notes }),
    collapseAll: () => dispatchTree({ type: COLLAPSE_ALL }),
    expandAll: () => dispatchTree({ type: EXPAND_ALL }),
    autoColor: () => dispatchTree({ type: AUTO_COLOR }),
    setNodeUrl: (nodeId, url) => dispatchTree({ type: SET_NODE_URL, nodeId, url }),
    pasteSubtree: (nodes, rootId, parentId) => dispatchTree({ type: PASTE_SUBTREE, nodes, rootId, parentId }),
    bulkDelete: (nodeIds) => dispatchTree({ type: BULK_DELETE, nodeIds }),
    setNodeMeta: (nodeId, meta) => dispatchTree({ type: SET_NODE_META, nodeId, meta }),
    addComment: (nodeId, text, author) => dispatchTree({ type: ADD_NODE_COMMENT, nodeId, text, author }),
    deleteComment: (nodeId, commentId) => dispatchTree({ type: DELETE_NODE_COMMENT, nodeId, commentId }),
    collapseToDepth: (depth) => dispatchTree({ type: COLLAPSE_TO_DEPTH, depth }),
    applyJiraKeys: (keyMap) => dispatchTree({ type: APPLY_JIRA_KEYS, keyMap }),
    setEdgeType: (edgeId, edgeType) => dispatchTree({ type: SET_EDGE_TYPE, edgeId, edgeType }),
    addGroup: (nodeIds, label, color) => dispatchTree({ type: ADD_GROUP, nodeIds, label, color }),
    deleteGroup: (groupId) => dispatchTree({ type: DELETE_GROUP, groupId }),
    renameGroup: (groupId, label) => dispatchTree({ type: RENAME_GROUP, groupId, label }),
    applyRadialLayout: () => dispatchTree({ type: APPLY_RADIAL_LAYOUT }),
    toggleLock: (nodeId) => dispatchTree({ type: TOGGLE_LOCK, nodeId }),
    toggleReaction: (nodeId, emoji, user) => dispatchTree({ type: TOGGLE_REACTION, nodeId, emoji, user }),
    reparentNode: (nodeId, newParentId) => dispatchTree({ type: REPARENT_NODE, nodeId, newParentId }),
    setNodeChecklist: (nodeId, checklist) => dispatchTree({ type: SET_NODE_CHECKLIST, nodeId, checklist }),
    setEdgeLabel: (edgeId, label) => dispatchTree({ type: SET_EDGE_LABEL, edgeId, label }),
    addFrame: (label, x, y, w, h, color) => {
      const frame = { id: crypto.randomUUID(), label, x, y, w, h, color: color || '#6B7280' }
      setData(d => {
        const proj = d.projects[d.activeId]
        if (!proj) return d
        const mapId = proj.activeMapId
        const map = proj.maps?.[mapId]
        if (!map) return d
        const now = new Date().toISOString()
        return {
          ...d,
          projects: {
            ...d.projects,
            [d.activeId]: { ...proj, maps: { ...proj.maps, [mapId]: { ...map, frames: [...(map.frames || []), frame], updatedAt: now } }, updatedAt: now },
          },
        }
      })
    },
    deleteFrame: (frameId) => {
      setData(d => {
        const proj = d.projects[d.activeId]
        if (!proj) return d
        const mapId = proj.activeMapId
        const map = proj.maps?.[mapId]
        if (!map) return d
        const now = new Date().toISOString()
        return {
          ...d,
          projects: {
            ...d.projects,
            [d.activeId]: { ...proj, maps: { ...proj.maps, [mapId]: { ...map, frames: (map.frames || []).filter(f => f.id !== frameId), updatedAt: now } }, updatedAt: now },
          },
        }
      })
    },
    renameFrame: (frameId, label) => {
      setData(d => {
        const proj = d.projects[d.activeId]
        if (!proj) return d
        const mapId = proj.activeMapId
        const map = proj.maps?.[mapId]
        if (!map) return d
        const now = new Date().toISOString()
        return {
          ...d,
          projects: {
            ...d.projects,
            [d.activeId]: { ...proj, maps: { ...proj.maps, [mapId]: { ...map, frames: (map.frames || []).map(f => f.id === frameId ? { ...f, label } : f), updatedAt: now } }, updatedAt: now },
          },
        }
      })
    },
    activityLog,
    clearActivityLog: () => setActivityLog([]),
    snapshots,
    saveSnapshot: (name) => {
      if (!activeMap) return
      const snap = {
        id: crypto.randomUUID(),
        name,
        timestamp: new Date().toISOString(),
        nodeCount: Object.keys(activeMap.nodes).length,
        state: { nodes: JSON.parse(JSON.stringify(activeMap.nodes)), rootId: activeMap.rootId, extraEdges: activeMap.extraEdges || [], groups: activeMap.groups || [] },
      }
      setSnapshots(prev => [...prev, snap])
    },
    restoreSnapshot: (snapId) => {
      const snap = snapshots.find(s => s.id === snapId)
      if (!snap) return
      setData(d => {
        const proj = d.projects[d.activeId]
        if (!proj) return d
        const mapId = proj.activeMapId
        const map = proj.maps?.[mapId]
        if (!map) return d
        const now = new Date().toISOString()
        return {
          ...d,
          projects: {
            ...d.projects,
            [d.activeId]: { ...proj, maps: { ...proj.maps, [mapId]: { ...map, ...snap.state, updatedAt: now } }, updatedAt: now },
          },
        }
      })
    },
    deleteSnapshot: (snapId) => setSnapshots(prev => prev.filter(s => s.id !== snapId)),
    setCustomStatuses: (statuses) => {
      setData(d => {
        const proj = d.projects[d.activeId]
        if (!proj) return d
        const mapId = proj.activeMapId
        const map = proj.maps?.[mapId]
        if (!map) return d
        const now = new Date().toISOString()
        return {
          ...d,
          projects: {
            ...d.projects,
            [d.activeId]: { ...proj, maps: { ...proj.maps, [mapId]: { ...map, customStatuses: statuses, updatedAt: now } }, updatedAt: now },
          },
        }
      })
    },
    setCustomFields: (fields) => dispatchTree({ type: SET_CUSTOM_FIELDS, fields }),
    mergeNode: (nodeId) => dispatchTree({ type: MERGE_NODE, nodeId }),
    splitNode: (nodeId, newTitle) => dispatchTree({ type: SPLIT_NODE, nodeId, newTitle }),
  }
}
