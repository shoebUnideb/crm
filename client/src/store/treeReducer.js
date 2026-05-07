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
} from './treeActions.js'
import { computeLayout, computeRadialLayout, NODE_WIDTH, NODE_HEIGHT } from '../hooks/useLayout.js'

const ROOT_ID = 'root'

export const initialState = {
  nodes: {
    [ROOT_ID]: {
      id: ROOT_ID, title: 'My Project', parentId: null, childIds: [],
      depth: 0, color: null, collapsed: false, x: 0, y: 0, shape: 'rect',
    },
  },
  rootId: ROOT_ID,
  selectedNodeId: null,
  extraEdges: [],
  groups: [],
}

export function treeReducer(state, action) {
  switch (action.type) {

    case ADD_CHILD: {
      const parent = state.nodes[action.parentId]
      if (!parent) return state
      const id = crypto.randomUUID()
      const sibIdx = parent.childIds.length
      const childX = (parent.x ?? 0) + sibIdx * 200
      const childY = (parent.y ?? 0) + 130
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [action.parentId]: { ...parent, childIds: [...parent.childIds, id], collapsed: false },
          [id]: {
            id, title: action.title ?? 'New node', parentId: action.parentId, childIds: [],
            depth: parent.depth + 1, color: action.color ?? null, collapsed: false,
            x: action.x ?? childX, y: action.y ?? childY, shape: action.shape ?? 'rect',
            ...(action.nodeKey ? { nodeKey: action.nodeKey } : {}),
          },
        },
        selectedNodeId: id,
      }
    }

    case DELETE_NODE: {
      if (action.nodeId === state.rootId) return state
      const toDelete = new Set()
      const queue = [action.nodeId]
      while (queue.length > 0) {
        const id = queue.shift()
        toDelete.add(id)
        const node = state.nodes[id]
        if (node) node.childIds.forEach(c => queue.push(c))
      }
      const newNodes = Object.fromEntries(
        Object.entries(state.nodes).filter(([id]) => !toDelete.has(id))
      )
      const deletedNode = state.nodes[action.nodeId]
      if (deletedNode?.parentId && newNodes[deletedNode.parentId]) {
        newNodes[deletedNode.parentId] = {
          ...newNodes[deletedNode.parentId],
          childIds: newNodes[deletedNode.parentId].childIds.filter(id => id !== action.nodeId),
        }
      }
      const newExtraEdges = (state.extraEdges || []).filter(
        e => !toDelete.has(e.from) && !toDelete.has(e.to)
      )
      return {
        ...state,
        nodes: newNodes,
        extraEdges: newExtraEdges,
        selectedNodeId: toDelete.has(state.selectedNodeId) ? null : state.selectedNodeId,
      }
    }

    case EDIT_NODE: {
      if (!state.nodes[action.nodeId]) return state
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [action.nodeId]: { ...state.nodes[action.nodeId], title: action.title },
        },
      }
    }

    case UPDATE_NODE_COLOR: {
      if (!state.nodes[action.nodeId]) return state
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [action.nodeId]: { ...state.nodes[action.nodeId], color: action.color },
        },
      }
    }

    case TOGGLE_COLLAPSE: {
      const node = state.nodes[action.nodeId]
      if (!node || node.childIds.length === 0) return state
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [action.nodeId]: { ...node, collapsed: !node.collapsed },
        },
      }
    }

    case MOVE_NODE: {
      if (!state.nodes[action.nodeId]) return state
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [action.nodeId]: { ...state.nodes[action.nodeId], x: action.x, y: action.y },
        },
      }
    }

    case SET_SHAPE: {
      if (!state.nodes[action.nodeId]) return state
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [action.nodeId]: { ...state.nodes[action.nodeId], shape: action.shape },
        },
      }
    }

    case ADD_EDGE: {
      const edge = { id: action.id, from: action.from, to: action.to, ...(action.edgeType ? { type: action.edgeType } : {}) }
      // Prevent duplicate edges
      const existing = (state.extraEdges || []).find(
        e => (e.from === action.from && e.to === action.to) ||
             (e.from === action.to && e.to === action.from)
      )
      if (existing) return state
      return { ...state, extraEdges: [...(state.extraEdges || []), edge] }
    }

    case DELETE_EDGE: {
      return {
        ...state,
        extraEdges: (state.extraEdges || []).filter(e => e.id !== action.edgeId),
      }
    }

    case APPLY_LAYOUT: {
      const positions = computeLayout(state.nodes, state.rootId)
      const SHAPE_H = { rect: 44, circle: 80, diamond: 70, sticky: 90 }
      const updatedNodes = { ...state.nodes }
      for (const [id, pos] of Object.entries(positions)) {
        const h = SHAPE_H[updatedNodes[id]?.shape] ?? SHAPE_H.rect
        updatedNodes[id] = { ...updatedNodes[id], x: pos.x, y: pos.y + h / 2 }
      }
      return { ...state, nodes: updatedNodes }
    }

    case DUPLICATE_NODE: {
      const src = state.nodes[action.nodeId]
      if (!src) return state
      const newId = crypto.randomUUID()
      const newNode = {
        ...src,
        id: newId,
        x: src.x + 40,
        y: src.y + 40,
        childIds: [],
        parentId: src.parentId,
      }
      const updatedParent = src.parentId && state.nodes[src.parentId]
        ? {
            ...state.nodes[src.parentId],
            childIds: [...state.nodes[src.parentId].childIds, newId],
          }
        : null
      return {
        ...state,
        nodes: {
          ...state.nodes,
          ...(updatedParent ? { [src.parentId]: updatedParent } : {}),
          [newId]: newNode,
        },
        selectedNodeId: newId,
      }
    }

    case EDIT_NODE_NOTES: {
      if (!state.nodes[action.nodeId]) return state
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [action.nodeId]: { ...state.nodes[action.nodeId], notes: action.notes },
        },
      }
    }

    case SELECT_NODE:
      return { ...state, selectedNodeId: action.nodeId }

    case DESELECT:
      return { ...state, selectedNodeId: null }

    case COLLAPSE_ALL: {
      const updatedNodes = { ...state.nodes }
      for (const [id, node] of Object.entries(updatedNodes)) {
        if (node.childIds.length > 0 && id !== state.rootId) {
          updatedNodes[id] = { ...node, collapsed: true }
        }
      }
      return { ...state, nodes: updatedNodes }
    }

    case EXPAND_ALL: {
      const updatedNodes = { ...state.nodes }
      for (const [id, node] of Object.entries(updatedNodes)) {
        if (node.collapsed) updatedNodes[id] = { ...node, collapsed: false }
      }
      return { ...state, nodes: updatedNodes }
    }

    case AUTO_COLOR: {
      // BFS to assign depth-based colors
      const DEPTH_COLORS = [null, 'blue', 'green', 'yellow', 'red', 'purple', 'orange', 'teal']
      const updatedNodes = { ...state.nodes }
      const queue = [{ id: state.rootId, depth: 0 }]
      while (queue.length > 0) {
        const { id, depth } = queue.shift()
        const node = updatedNodes[id]
        if (!node) continue
        updatedNodes[id] = { ...node, color: DEPTH_COLORS[Math.min(depth, DEPTH_COLORS.length - 1)] }
        for (const cId of node.childIds) queue.push({ id: cId, depth: depth + 1 })
      }
      return { ...state, nodes: updatedNodes }
    }

    case SET_NODE_URL: {
      if (!state.nodes[action.nodeId]) return state
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [action.nodeId]: { ...state.nodes[action.nodeId], url: action.url || null },
        },
      }
    }

    case PASTE_SUBTREE: {
      // action.nodes: flat node map of subtree (already re-IDed), action.rootId: new root ID
      const newNodes = { ...state.nodes, ...action.nodes }
      // Attach new subtree root as child of target parent
      if (action.parentId && newNodes[action.parentId]) {
        newNodes[action.parentId] = {
          ...newNodes[action.parentId],
          childIds: [...newNodes[action.parentId].childIds, action.rootId],
        }
      }
      return { ...state, nodes: newNodes, selectedNodeId: action.rootId }
    }

    case BULK_DELETE: {
      // action.nodeIds: array of node IDs to delete (roots of subtrees)
      const toDelete = new Set()
      for (const nodeId of action.nodeIds) {
        if (nodeId === state.rootId) continue
        const queue = [nodeId]
        while (queue.length > 0) {
          const id = queue.shift()
          toDelete.add(id)
          const node = state.nodes[id]
          if (node) node.childIds.forEach(c => queue.push(c))
        }
      }
      const newNodes = Object.fromEntries(
        Object.entries(state.nodes).filter(([id]) => !toDelete.has(id))
      )
      // Remove from parent childIds
      for (const [id, node] of Object.entries(newNodes)) {
        const filtered = node.childIds.filter(c => !toDelete.has(c))
        if (filtered.length !== node.childIds.length) {
          newNodes[id] = { ...node, childIds: filtered }
        }
      }
      const newExtraEdges = (state.extraEdges || []).filter(
        e => !toDelete.has(e.from) && !toDelete.has(e.to)
      )
      return {
        ...state,
        nodes: newNodes,
        extraEdges: newExtraEdges,
        selectedNodeId: toDelete.has(state.selectedNodeId) ? null : state.selectedNodeId,
      }
    }

    case SET_NODE_META: {
      if (!state.nodes[action.nodeId]) return state
      const updatedNodes = {
        ...state.nodes,
        [action.nodeId]: { ...state.nodes[action.nodeId], ...action.meta },
      }

      // Auto-status rollup: walk up the parent chain and update status if needed
      if ('status' in action.meta) {
        let nodeId = updatedNodes[action.nodeId]?.parentId
        while (nodeId && updatedNodes[nodeId]) {
          const parent = updatedNodes[nodeId]
          const children = parent.childIds.map(id => updatedNodes[id]).filter(Boolean)
          if (children.length === 0) break
          const statuses = children.map(c => c.status).filter(Boolean)
          let newStatus = parent.status
          if (statuses.length > 0) {
            if (children.every(c => c.status === 'done')) newStatus = 'done'
            else if (children.some(c => c.status === 'blocked')) newStatus = 'blocked'
            else if (children.some(c => c.status === 'in-progress' || c.status === 'done')) newStatus = 'in-progress'
            else if (children.every(c => c.status === 'todo' || !c.status)) newStatus = 'todo'
          }
          if (newStatus !== parent.status) {
            updatedNodes[nodeId] = { ...parent, status: newStatus }
          }
          nodeId = parent.parentId
        }
      }

      return { ...state, nodes: updatedNodes }
    }

    case ADD_NODE_COMMENT: {
      const node = state.nodes[action.nodeId]
      if (!node) return state
      const comment = { id: crypto.randomUUID(), text: action.text, author: action.author, createdAt: new Date().toISOString() }
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [action.nodeId]: { ...node, comments: [...(node.comments || []), comment] },
        },
      }
    }

    case DELETE_NODE_COMMENT: {
      const node = state.nodes[action.nodeId]
      if (!node) return state
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [action.nodeId]: { ...node, comments: (node.comments || []).filter(c => c.id !== action.commentId) },
        },
      }
    }

    case COLLAPSE_TO_DEPTH: {
      const updatedNodes = { ...state.nodes }
      for (const [id, node] of Object.entries(updatedNodes)) {
        if (node.childIds.length > 0) {
          updatedNodes[id] = { ...node, collapsed: node.depth >= action.depth }
        }
      }
      return { ...state, nodes: updatedNodes }
    }

    case APPLY_JIRA_KEYS: {
      const updatedNodes = { ...state.nodes }
      for (const [nodeId, jiraKey] of Object.entries(action.keyMap)) {
        if (updatedNodes[nodeId]) {
          updatedNodes[nodeId] = { ...updatedNodes[nodeId], jiraKey }
        }
      }
      return { ...state, nodes: updatedNodes }
    }

    case SET_EDGE_TYPE: {
      return {
        ...state,
        extraEdges: (state.extraEdges || []).map(e =>
          e.id === action.edgeId ? { ...e, type: action.edgeType } : e
        ),
      }
    }

    case ADD_GROUP: {
      const group = {
        id: crypto.randomUUID(),
        label: action.label || 'Group',
        nodeIds: action.nodeIds || [],
        color: action.color || '#3B82F6',
      }
      return { ...state, groups: [...(state.groups || []), group] }
    }

    case DELETE_GROUP: {
      return { ...state, groups: (state.groups || []).filter(g => g.id !== action.groupId) }
    }

    case RENAME_GROUP: {
      return {
        ...state,
        groups: (state.groups || []).map(g =>
          g.id === action.groupId ? { ...g, label: action.label } : g
        ),
      }
    }

    case APPLY_RADIAL_LAYOUT: {
      const positions = computeRadialLayout(state.nodes, state.rootId)
      const SHAPE_H = { rect: 44, circle: 80, diamond: 70, sticky: 90 }
      const updatedNodes = { ...state.nodes }
      for (const [id, pos] of Object.entries(positions)) {
        const h = SHAPE_H[updatedNodes[id]?.shape] ?? SHAPE_H.rect
        updatedNodes[id] = { ...updatedNodes[id], x: pos.x, y: pos.y + h / 2 }
      }
      return { ...state, nodes: updatedNodes }
    }

    case TOGGLE_LOCK: {
      const n = state.nodes[action.nodeId]
      if (!n) return state
      return { ...state, nodes: { ...state.nodes, [action.nodeId]: { ...n, locked: !n.locked } } }
    }

    case TOGGLE_REACTION: {
      const n = state.nodes[action.nodeId]
      if (!n) return state
      const reactions = { ...(n.reactions || {}) }
      const current = reactions[action.emoji] || []
      if (current.includes(action.user)) {
        reactions[action.emoji] = current.filter(u => u !== action.user)
        if (reactions[action.emoji].length === 0) delete reactions[action.emoji]
      } else {
        reactions[action.emoji] = [...current, action.user]
      }
      return { ...state, nodes: { ...state.nodes, [action.nodeId]: { ...n, reactions } } }
    }

    case ADD_AUDIT_ENTRY: {
      const n = state.nodes[action.nodeId]
      if (!n) return state
      const audit = [...(n.auditTrail || []), {
        id: action.id,
        field: action.field,
        oldValue: action.oldValue,
        newValue: action.newValue,
        user: action.user,
        timestamp: action.timestamp,
      }].slice(-100) // keep last 100 entries per node
      return { ...state, nodes: { ...state.nodes, [action.nodeId]: { ...n, auditTrail: audit } } }
    }

    case REPARENT_NODE: {
      const { nodeId, newParentId } = action
      if (!nodeId || !newParentId) return state
      const node = state.nodes[nodeId]
      const newParent = state.nodes[newParentId]
      if (!node || !newParent) return state
      if (nodeId === newParentId || nodeId === state.rootId) return state
      if (node.parentId === newParentId) return state
      // Prevent dropping onto own descendant
      const isDescendant = (ancestorId, checkId) => {
        const queue = [...(state.nodes[ancestorId]?.childIds ?? [])]
        while (queue.length) {
          const id = queue.shift()
          if (id === checkId) return true
          queue.push(...(state.nodes[id]?.childIds ?? []))
        }
        return false
      }
      if (isDescendant(nodeId, newParentId)) return state
      const updatedNodes = { ...state.nodes }
      // Remove from old parent
      if (node.parentId && updatedNodes[node.parentId]) {
        updatedNodes[node.parentId] = {
          ...updatedNodes[node.parentId],
          childIds: updatedNodes[node.parentId].childIds.filter(id => id !== nodeId),
        }
      }
      // Recalculate depth for the subtree
      const newDepth = (newParent.depth ?? 0) + 1
      const depthDiff = newDepth - (node.depth ?? 1)
      const queue = [nodeId]
      while (queue.length) {
        const id = queue.shift()
        if (!updatedNodes[id]) continue
        updatedNodes[id] = { ...updatedNodes[id], depth: (updatedNodes[id].depth ?? 0) + depthDiff }
        queue.push(...(updatedNodes[id].childIds ?? []))
      }
      // Attach to new parent and update parentId
      updatedNodes[nodeId] = { ...updatedNodes[nodeId], parentId: newParentId }
      updatedNodes[newParentId] = {
        ...updatedNodes[newParentId],
        childIds: [...updatedNodes[newParentId].childIds, nodeId],
        collapsed: false,
      }
      return { ...state, nodes: updatedNodes }
    }

    case SET_NODE_CHECKLIST: {
      const n = state.nodes[action.nodeId]
      if (!n) return state
      return { ...state, nodes: { ...state.nodes, [action.nodeId]: { ...n, checklist: action.checklist } } }
    }

    case SET_EDGE_LABEL: {
      return {
        ...state,
        extraEdges: (state.extraEdges || []).map(e =>
          e.id === action.edgeId ? { ...e, label: action.label } : e
        ),
      }
    }

    case SET_CUSTOM_FIELDS: {
      return { ...state, customFields: action.fields }
    }

    case MERGE_NODE: {
      const node = state.nodes[action.nodeId]
      if (!node || !node.parentId || node.id === state.rootId) return state
      const parent = state.nodes[node.parentId]
      if (!parent) return state

      const newNodes = { ...state.nodes }

      // Remove node from parent's childIds, insert its children in its place
      const nodeIdx = parent.childIds.indexOf(node.id)
      const newParentChildIds = [
        ...parent.childIds.slice(0, nodeIdx),
        ...node.childIds,
        ...parent.childIds.slice(nodeIdx + 1),
      ]
      newNodes[parent.id] = { ...parent, childIds: newParentChildIds }

      // Re-parent all children
      for (const childId of node.childIds) {
        if (newNodes[childId]) {
          newNodes[childId] = { ...newNodes[childId], parentId: parent.id, depth: parent.depth + 1 }
        }
      }

      // Delete merged node
      delete newNodes[action.nodeId]

      return { ...state, nodes: newNodes, selectedNodeId: parent.id }
    }

    case SPLIT_NODE: {
      const node = state.nodes[action.nodeId]
      if (!node || node.childIds.length < 2) return state
      const parent = node.parentId ? state.nodes[node.parentId] : null
      if (!parent) return state

      const splitIdx = Math.ceil(node.childIds.length / 2)
      const keptChildren = node.childIds.slice(0, splitIdx)
      const movedChildren = node.childIds.slice(splitIdx)

      const newId = crypto.randomUUID()
      const newNodes = { ...state.nodes }

      // Update original node
      newNodes[action.nodeId] = { ...node, childIds: keptChildren }

      // Create new sibling
      newNodes[newId] = {
        ...node,
        id: newId,
        title: action.newTitle || node.title + ' (2)',
        childIds: movedChildren,
        parentId: parent.id,
      }

      // Re-parent moved children
      for (const childId of movedChildren) {
        if (newNodes[childId]) {
          newNodes[childId] = { ...newNodes[childId], parentId: newId }
        }
      }

      // Insert new node after original in parent's childIds
      const nodeIdx = parent.childIds.indexOf(action.nodeId)
      const newParentChildIds = [
        ...parent.childIds.slice(0, nodeIdx + 1),
        newId,
        ...parent.childIds.slice(nodeIdx + 1),
      ]
      newNodes[parent.id] = { ...parent, childIds: newParentChildIds }

      return { ...state, nodes: newNodes }
    }

    default:
      return state
  }
}
